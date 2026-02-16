const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const gameRoutes = require('./routes/games');
const betRoutes = require('./routes/bets');
const winRoutes = require('./routes/wins');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDb();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://marreonline0201.github.io'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/wins', winRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route - so Render doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.redirect('https://marreonline0201.github.io/SBUhack2026');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
