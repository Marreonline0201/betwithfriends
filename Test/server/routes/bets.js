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

// Get bets for a game
router.get('/game/:gameId', (req, res) => {
  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const bets = db.prepare(
    'SELECT * FROM bets WHERE game_id = ? ORDER BY created_at DESC'
  ).all(req.params.gameId);

  res.json(bets);
});

// Create a bet
router.post('/', (req, res) => {
  const { gameId, description } = req.body;
  if (!gameId || !description || !description.trim()) {
    return res.status(400).json({ error: 'Game ID and description are required' });
  }

  const db = getDb();
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const result = db.prepare(
    'INSERT INTO bets (game_id, description) VALUES (?, ?)'
  ).run(gameId, description.trim());

  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(bet);
});

// Delete a bet
router.delete('/:id', (req, res) => {
  const db = getDb();
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(req.params.id);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(bet.game_id);
  if (!userInGroup(db, req.userId, game.group_id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  db.prepare('DELETE FROM bets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Bet deleted' });
});

module.exports = router;
