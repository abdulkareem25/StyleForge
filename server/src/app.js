const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const wardrobeRoutes = require('./routes/wardrobeRoutes');
const outfitRoutes = require('./routes/outfitRoutes');
const userRoutes = require('./routes/userRoutes');

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

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Cookie parser (needed for refresh-token cookie) ────────────────────
// Will be wired in AUTH-02 when refresh-token cookie is implemented.
// Cross-origin cookie strategy (frontend on Render Static Site, API on Render Web Service):
//   - sameSite: 'none' — required for cross-origin (different subdomains)
//   - secure: true — required (Render provides HTTPS)
//   - httpOnly: true — required (XSS protection, Security doc §10)
//   - domain: NOT set — let browser default to the API's domain
//   - path: '/' — sent on all routes
// const cookieParser = require('cookie-parser');
// app.use(cookieParser(process.env.COOKIE_SECRET));

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

// ── 404 catch-all ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Not found' });
});

// ── Error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
