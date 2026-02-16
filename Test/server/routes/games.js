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

// Get games for a group
router.get('/group/:groupId', (req, res) => {
  const db = getDb();
  if (!userInGroup(db, req.userId, req.params.groupId)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const games = db.prepare(
    'SELECT * FROM games WHERE group_id = ? ORDER BY created_at DESC'
  ).all(req.params.groupId);

  res.json(games);
});

// Create a game
router.post('/', (req, res) => {
  const { name, groupId } = req.body;
  if (!name || !name.trim() || !groupId) {
    return res.status(400).json({ error: 'Game name and groupId are required' });
  }

  const db = getDb();
  if (!userInGroup(db, req.userId, groupId)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const result = db.prepare(
    'INSERT INTO games (name, group_id) VALUES (?, ?)'
  ).run(name.trim(), groupId);

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(game);
});

// Delete a game
router.delete('/:id', (req, res) => {
  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  db.prepare('DELETE FROM bets WHERE game_id = ?').run(req.params.id);
  db.prepare('DELETE FROM wins WHERE game_id = ?').run(req.params.id);
  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);

  res.json({ message: 'Game deleted' });
});

module.exports = router;
