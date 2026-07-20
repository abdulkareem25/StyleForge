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

// Stricter limiter for auth endpoints to prevent signup abuse (Security doc §4, SETUP-04)
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 signup attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many signup attempts, please try again after 15 minutes' },
});

// Stricter limiter for login — Security doc §9, AUTH-02
// 10 failed attempts per IP per 15-minute window before temporary slowdown
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many login attempts, please try again after 15 minutes' },
});

limiter.signupLimiter = signupLimiter;
limiter.loginLimiter = loginLimiter;

module.exports = limiter;
