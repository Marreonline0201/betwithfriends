const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all groups for current user
router.get('/', (req, res) => {
  const db = getDb();
  const groups = db.prepare(`
    SELECT g.*, u.name as created_by_name
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    JOIN users u ON u.id = g.created_by
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(req.userId);

  res.json(groups);
});

// Create a group
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO groups (name, created_by) VALUES (?, ?)'
  ).run(name.trim(), req.userId);

  db.prepare(
    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
  ).run(result.lastInsertRowid, req.userId);

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(group);
});

// Get single group with members
router.get('/:id', (req, res) => {
  const db = getDb();
  const group = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id = ? AND gm.user_id = ?
  `).get(req.params.id, req.userId);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const members = db.prepare(`
    SELECT u.id, u.name, u.email FROM users u
    JOIN group_members gm ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).all(req.params.id);

  res.json({ ...group, members });
});

// Add user to group (by email)
router.post('/:id/members', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = getDb();
  const group = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id = ? AND gm.user_id = ?
  `).get(req.params.id, req.userId);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'User not found. They need to sign up first.' });
  }

  try {
    db.prepare(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
    ).run(req.params.id, user.id);
    res.status(201).json({ message: 'User added to group' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'User already in group' });
    }
    throw err;
  }
});

// Remove user from group
router.delete('/:id/members/:userId', (req, res) => {
  const db = getDb();
  const group = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id = ? AND gm.user_id = ?
  `).get(req.params.id, req.userId);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const result = db.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
  ).run(req.params.id, req.params.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not in group' });
  }

  res.json({ message: 'User removed from group' });
});

// Delete group
router.delete('/:id', (req, res) => {
  const db = getDb();
  const group = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id = ? AND gm.user_id = ?
  `).get(req.params.id, req.userId);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  db.prepare('DELETE FROM group_members WHERE group_id = ?').run(req.params.id);
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ message: 'Group deleted' });
});

module.exports = router;
