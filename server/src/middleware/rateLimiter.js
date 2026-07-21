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

// Stricter limiter for forgot-password — AUTH-04, email-sending endpoint abuse prevention
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 forgot-password attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many password reset requests, please try again after 15 minutes' },
});

// Rate limiter for upload-auth — adjacent to metered ImageKit storage (Security doc §4, §5)
// Prevents token-request abuse that could drive up storage costs.
const uploadAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 upload-auth requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many upload requests, please try again after 15 minutes' },
});

// Stricter limiter for AI tagging requests to prevent runaway Gemini usage.
const aiTaggingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 tagging requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many tagging requests, please try again shortly' },
});

// Rate limiter for account deletion — destructive action, conservative limit
const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 deletion attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many deletion requests, please try again later' },
});

limiter.signupLimiter = signupLimiter;
limiter.loginLimiter = loginLimiter;
limiter.forgotPasswordLimiter = forgotPasswordLimiter;
limiter.uploadAuthLimiter = uploadAuthLimiter;
limiter.aiTaggingLimiter = aiTaggingLimiter;
limiter.deleteAccountLimiter = deleteAccountLimiter;

module.exports = limiter;
