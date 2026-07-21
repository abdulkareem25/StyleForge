/**
 * ERR-01 — Centralized Error Handler & Error Response Policy.
 *
 * Implements the full error-handling behavior from Security doc §7's four tables.
 * Every error flowing through this handler is classified, given a specific
 * user-facing message, logged internally with full detail, and evaluated
 * for alerting — all without ever leaking stack traces or internal details
 * to the client.
 *
 * Error categories:
 *   - auth:          Authentication & Authorization (table 1)
 *   - upload:        Uploads & Content (table 2)
 *   - outfit:        AI & Outfit Generation (table 3)
 *   - infrastructure: Infrastructure & Third-Party (table 4)
 *
 * Acceptance Criteria:
 *   1. Every row from §7's four tables has its specified user-facing message
 *   2. Server errors never leak stack traces or internal details to client
 *   3. 403 is logged/alerted at higher priority than routine 401
 *   4. GEN-03 engine failures alert on every occurrence
 *   5. WARD-02 AI-tagging and third-party failures alert on spike only
 *   6. No log entry contains a password, token, or full raw request body
 */

const { AppError, AuthError, ForbiddenError } = require('../errors/AppError');
const { recordError, evaluateAlert, logAlert } = require('./alerting');
const { sanitize, sanitizeError } = require('./sanitizer');

// ── User-facing message mapping (Security doc §7 tables) ────────────
// These are the ONLY messages ever sent to the client for unhandled errors.
// Controllers that need different wording handle their own responses.
const USER_MESSAGES = {
  auth: "You don't have permission to do that",
  upload: 'Something went wrong with your upload — please try again',
  outfit: 'Something went wrong generating your outfit — please try again',
  infrastructure: 'Something went wrong on our end',
};

// ── Determine if the raw error object is an AppError subclass ────────
function isAppError(err) {
  return err instanceof AppError || (err && typeof err.category === 'string' && typeof err.status === 'number');
}

// ── Classify Mongoose / MongoDB errors into categories ───────────────
function classifyMongoError(err) {
  const name = err.name || '';
  const code = err.code || 0;

  // Duplicate key — validation-level, not an infrastructure alert
  if (code === 11000) {
    return { category: 'upload', status: 409, message: 'This record already exists' };
  }

  // Cast error (invalid ObjectId, etc.) — user input issue
  if (name === 'CastError' || name === 'CastErrorException') {
    return { category: 'upload', status: 400, message: 'Invalid request data' };
  }

  // Validation error
  if (name === 'ValidationError' || name === 'ValidatorError') {
    return { category: 'upload', status: 400, message: 'Invalid request data' };
  }

  // Connection / topology errors — infrastructure
  if (name === 'MongooseServerSelectionError' || name === 'MongooseNetworkError' || code === 6) {
    return { category: 'infrastructure', status: 503, message: 'Service temporarily unavailable' };
  }

  // Default to infrastructure for unknown Mongo errors
  return { category: 'infrastructure', status: 500, message: 'Something went wrong on our end' };
}

// ── Classify Node.js / generic errors ────────────────────────────────
function classifyNodeError(err) {
  const name = err.name || '';

  if (name === 'SyntaxError' || name === 'TypeError' || name === 'RangeError') {
    return { category: 'infrastructure', status: 500, message: 'Something went wrong on our end' };
  }

  if (name === 'SyntaxError' && err.message && err.message.includes('JSON')) {
    return { category: 'upload', status: 400, message: 'Invalid request data' };
  }

  return { category: 'infrastructure', status: 500, message: 'Something went wrong on our end' };
}

// ── Main error handler middleware ────────────────────────────────────
module.exports = (err, req, res, _next) => {
  let status;
  let category;
  let userMessage;
  let alert = false;

  if (isAppError(err)) {
    // AppError subclasses carry their own category, status, and alert flag
    status = err.status;
    category = err.category;
    userMessage = err.message;
    alert = err.alert || false;
  } else {
    // Classify unknown errors by type
    const classified = classifyMongoError(err);
    status = classified.status;
    category = classified.category;
    userMessage = classified.message;

    // Unhandled infrastructure errors always alert (Security doc §7 table 4)
    if (category === 'infrastructure') {
      alert = true;
    }
  }

  // Special case: ForbiddenError always alerts regardless of classification
  if (err instanceof ForbiddenError) {
    alert = true;
  }

  // ── 1. Full internal logging (NEVER sent to client) ──────────────
  const logContext = {
    status,
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req.user?.id || null,
    ip: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.headers?.['user-agent'] || null,
  };

  const safeLog = sanitizeError(err, logContext);

  if (status >= 500) {
    // Server errors: full stack trace logged
    console.error(`[ERROR][${category.toUpperCase()}]`, JSON.stringify(safeLog));
    if (err.stack) {
      console.error(`[ERROR][${category.toUpperCase()}][STACK]`, err.stack);
    }
  } else if (status === 403) {
    // 403: higher-priority logging than routine 401 (Security doc §7)
    console.warn(`[SECURITY][FORBIDDEN]`, JSON.stringify(safeLog));
  } else if (status >= 400) {
    // Client errors: log at warn level (routine, not alert-worthy)
    console.warn(`[ERROR][${category.toUpperCase()}]`, JSON.stringify(safeLog));
  }

  // ── 2. Alert evaluation (Security doc §7 thresholds) ────────────
  recordError(category);
  const { shouldAlert, reason } = evaluateAlert(category, alert);

  if (shouldAlert) {
    logAlert(category, err, {
      status,
      reason,
      userId: req.user?.id || null,
      method: req.method,
      path: req.originalUrl || req.url,
    });
  }

  // ── 3. Client response (NEVER raw stack traces or internal details) ──
  // Use the category-specific user-facing message, or fall back to the
  // AppError message if it was already set to a safe value.
  const responseMessage = isAppError(err) ? err.message : (USER_MESSAGES[category] || USER_MESSAGES.infrastructure);

  res.status(status).json({
    success: false,
    data: null,
    error: responseMessage,
  });
};
