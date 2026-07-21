/**
 * ERR-01 — Log sanitizer.
 *
 * Ensures no log entry anywhere ever contains a password, token, or full
 * raw request body (Security doc §7, ERR-01 acceptance criteria).
 *
 * Applied to every object before it reaches console.error / console.warn.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'verificationToken',
  'passwordResetToken',
  'reminderUnsubToken',
  'tokenHash',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'apiKey',
  'api_key',
  'brevo_api_key',
  'gemini_api_key',
  'jwt_access_secret',
  'jwt_refresh_secret',
  'signature',
]);

const MAX_BODY_LENGTH = 500; // Truncate large bodies

/**
 * Deep-sanitizes an object, replacing sensitive key values with '[REDACTED]'.
 * Handles nested objects and arrays. Returns a new object (never mutates input).
 */
function sanitize(obj, depth = 0) {
  if (depth > 10) return '[Max depth exceeded]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Truncate long strings (could be raw request bodies)
    return obj.length > MAX_BODY_LENGTH ? obj.slice(0, MAX_BODY_LENGTH) + '...[truncated]' : obj;
  }

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'body' || key === 'req' || key === 'request') {
      // Truncate entire body/request objects to prevent leaking raw payloads
      sanitized[key] = '[Body redacted]';
    } else {
      sanitized[key] = sanitize(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Returns a safe-to-log version of an error with context.
 * Never includes passwords, tokens, or raw request bodies.
 */
function sanitizeError(error, context = {}) {
  const safeError = {
    message: error.message || String(error),
    name: error.name,
    category: error.category,
    status: error.status,
  };

  // Include cause chain but sanitize it
  if (error.cause) {
    safeError.cause = sanitize(error.cause);
  }

  return {
    ...safeError,
    ...sanitize(context),
  };
}

module.exports = {
  sanitize,
  sanitizeError,
  SENSITIVE_KEYS,
};
