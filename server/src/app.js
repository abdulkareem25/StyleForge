const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const wardrobeRoutes = require('./routes/wardrobeRoutes');
const outfitRoutes = require('./routes/outfitRoutes');
const userRoutes = require('./routes/userRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ── Security headers ───────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────
// CLIENT_URL must be set to the deployed frontend origin on Render.
// In production: https://styleforge-mdez.onrender.com (Render Static Site)
// In development: http://localhost:5173
// Credentials: true is required for cross-origin httpOnly refresh-token cookie.
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Cookie parser (refresh-token cookie, AUTH-02) ─────────────────────
const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.COOKIE_SECRET));

// ── Global rate limiter ────────────────────────────────────────────────
// Reads RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX from env vars.
app.use(rateLimiter);

// ── Health check ───────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

// ── API routes ─────────────────────────────────────────────────────────
// Auth routes are public (no authMiddleware).
app.use('/api/v1/auth', authRoutes);

// Protected routes use authMiddleware at the route level.
// validateRequest is applied per-route where schemas exist.
app.use('/api/v1/wardrobe', wardrobeRoutes);
app.use('/api/v1/outfits', outfitRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── 404 catch-all ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Not found' });
});

// ── Error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
