const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000;
const max = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

const limiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many requests, please try again later' },
});

module.exports = limiter;
