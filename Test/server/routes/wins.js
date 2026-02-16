const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function userInGroup(db, userId, groupId) {
  const member = db.prepare(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
  ).get(groupId, userId);
  return !!member;
}

// Get wins for a game (with user names)
router.get('/game/:gameId', (req, res) => {
  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const wins = db.prepare(`
    SELECT w.*, u.name as user_name
    FROM wins w
    JOIN users u ON u.id = w.user_id
    WHERE w.game_id = ?
    ORDER BY w.created_at DESC
  `).all(req.params.gameId);

  res.json(wins);
});

// Get win counts per user for a game
router.get('/game/:gameId/leaderboard', (req, res) => {
  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const leaderboard = db.prepare(`
    SELECT u.id, u.name, COUNT(w.id) as win_count
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    LEFT JOIN wins w ON w.user_id = u.id AND w.game_id = ?
    WHERE gm.group_id = ?
    GROUP BY u.id, u.name
    ORDER BY win_count DESC
  `).all(req.params.gameId, game.group_id);

  res.json(leaderboard);
});

// Add a win
router.post('/', (req, res) => {
  const { gameId, userId } = req.body;
  if (!gameId || !userId) {
    return res.status(400).json({ error: 'Game ID and user ID are required' });
  }

  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const member = db.prepare(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
  ).get(game.group_id, userId);
  if (!member) {
    return res.status(400).json({ error: 'User is not in this group' });
  }

  const result = db.prepare(
    'INSERT INTO wins (user_id, game_id) VALUES (?, ?)'
  ).run(userId, gameId);

  const win = db.prepare(`
    SELECT w.*, u.name as user_name FROM wins w
    JOIN users u ON u.id = w.user_id
    WHERE w.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(win);
});

// Delete a win
router.delete('/:id', (req, res) => {
  const db = getDb();
  const win = db.prepare('SELECT * FROM wins WHERE id = ?').get(req.params.id);
  if (!win) {
    return res.status(404).json({ error: 'Win not found' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(win.game_id);
  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  db.prepare('DELETE FROM wins WHERE id = ?').run(req.params.id);
  res.json({ message: 'Win deleted' });
});

module.exports = router;
