const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const wardrobeRoutes = require('./routes/wardrobeRoutes');
const outfitRoutes = require('./routes/outfitRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security headers ───────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Global rate limiter ────────────────────────────────────────────────
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000;
const max = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
app.use(rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false }));

// ── Health check ───────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

// ── API routes ─────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wardrobe', wardrobeRoutes);
app.use('/api/v1/outfits', outfitRoutes);
app.use('/api/v1/users', userRoutes);

// ── 404 catch-all ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Not found' });
});

// ── Error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
