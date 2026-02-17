const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { getDb } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const OAUTH_PLACEHOLDER = bcrypt.hashSync('oauth', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ||
  (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : null) ||
  'http://localhost:3000';

// Configure Passport
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
  done(null, user);
});

const getApiUrl = () => {
  if (process.env.API_URL) return process.env.API_URL;
  if (process.env.RENDER_EXTERNAL_URL) return `https://${process.env.RENDER_EXTERNAL_URL}`;
  return 'http://localhost:5000';
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${getApiUrl()}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    const db = getDb();
    let user = db.prepare(
      'SELECT id, email, name FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).get('google', profile.id);
    if (!user) {
      const email = profile.emails?.[0]?.value || `${profile.id}@google.oauth`;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        db.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, password_hash = ? WHERE id = ?'
        ).run('google', profile.id, OAUTH_PLACEHOLDER, existing.id);
        user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(existing.id);
      } else {
        const r = db.prepare(
          'INSERT INTO users (email, password_hash, name, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?)'
        ).run(email, OAUTH_PLACEHOLDER, profile.displayName || 'User', 'google', profile.id);
        user = { id: r.lastInsertRowid, email, name: profile.displayName || 'User' };
      }
    }
    done(null, user);
  }));
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${getApiUrl()}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  }, async (accessToken, refreshToken, profile, done) => {
    const db = getDb();
    let user = db.prepare(
      'SELECT id, email, name FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).get('facebook', profile.id);
    if (!user) {
      const email = profile.emails?.[0]?.value || `${profile.id}@facebook.oauth`;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        db.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, password_hash = ? WHERE id = ?'
        ).run('facebook', profile.id, OAUTH_PLACEHOLDER, existing.id);
        user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(existing.id);
      } else {
        const r = db.prepare(
          'INSERT INTO users (email, password_hash, name, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?)'
        ).run(email, OAUTH_PLACEHOLDER, profile.displayName || 'User', 'facebook', profile.id);
        user = { id: r.lastInsertRowid, email, name: profile.displayName || 'User' };
      }
    }
    done(null, user);
  }));
}

// Sign up
router.post('/signup', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const db = getDb();
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run(email.toLowerCase(), passwordHash, name.trim());

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET);
    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, email, name: name.trim() }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// Log in
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    let user;
    try {
      user = db.prepare(
        'SELECT id, email, password_hash, name FROM users WHERE email = ? AND (oauth_provider IS NULL OR oauth_provider = "")'
      ).get(email.toLowerCase());
    } catch (dbErr) {
      user = db.prepare(
        'SELECT id, email, password_hash, name FROM users WHERE email = ?'
      ).get(email.toLowerCase());
      if (user && user.oauth_provider) {
        return res.status(401).json({ error: 'This account uses Google/Facebook sign-in' });
      }
    }

    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// OAuth - Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
      if (!user) return res.redirect(`${FRONTEND_URL}/login?error=Auth%20failed`);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  });
} else {
  router.get('/google', (req, res) => res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Render.')}`));
}

// OAuth - Facebook
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
  router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (err, user) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
      if (!user) return res.redirect(`${FRONTEND_URL}/login?error=Auth%20failed`);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  });
} else {
  router.get('/facebook', (req, res) => res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Facebook sign-in is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to Render.')}`));
}

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const db = getDb();
  const user = db.prepare(
    'SELECT id FROM users WHERE email = ? AND (oauth_provider IS NULL OR oauth_provider = "")'
  ).get(email.toLowerCase());

  if (!user) {
    return res.json({ message: 'If that email exists, a reset link was sent' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt);

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject: 'Reset your password',
          html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
        });
        if (error) throw new Error(error.message);
      } else {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Bet Tracker <noreply@example.com>',
          to: email,
          subject: 'Reset your password',
          html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
        });
      }
    } catch (err) {
      console.error('Email send failed:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } else {
    console.log('Reset link (configure SMTP or RESEND_API_KEY for production):', resetUrl);
  }

  res.json({ message: 'If that email exists, a reset link was sent' });
});

// Reset password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Token and password (min 6 chars) required' });
  }

  const db = getDb();
  const row = db.prepare(
    'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > datetime("now")'
  ).get(token);

  if (!row) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
  db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);

  res.json({ message: 'Password updated' });
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, email, name FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

module.exports = router;
