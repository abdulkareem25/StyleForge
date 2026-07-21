/**
 * ERR-01 — Custom error classes for categorized error handling.
 *
 * Every error flowing through the centralized handler is classified into
 * one of four categories from Security doc §7. These classes carry the
 * category, user-facing message, HTTP status, and alert priority so the
 * handler can make consistent decisions without inspecting raw Error objects.
 *
 * Sensitive data (passwords, tokens, raw request bodies) must NEVER be
 * attached to any error instance — see sanitizeForLog().
 */

// ── Base application error ──────────────────────────────────────────
class AppError extends Error {
  constructor(message, { status = 500, category = 'infrastructure', alert = false, cause } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.category = category;
    this.alert = alert;
    if (cause) this.cause = cause;
  }
}

// ── Authentication & Authorization (Security doc §7 table 1) ────────
class AuthError extends AppError {
  constructor(message = 'Please log in', { status = 401, alert = false, cause } = {}) {
    super(message, { status, category: 'auth', alert, cause });
  }
}

class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that", { cause } = {}) {
    // 403 is always flagged — higher priority than a routine 401
    super(message, { status: 403, category: 'auth', alert: true, cause });
  }
}

// ── Uploads & Content (Security doc §7 table 2) ─────────────────────
class UploadError extends AppError {
  constructor(message = "Upload didn't go through — please try again", { status = 400, alert = false, cause } = {}) {
    super(message, { status, category: 'upload', alert, cause });
  }
}

// ── AI & Outfit Generation (Security doc §7 table 3) ───────────────
class OutfitGenerationError extends AppError {
  constructor(message = 'Something went wrong generating your outfit — please try again', { cause } = {}) {
    // Engine failures always alert — this is core-path logic
    super(message, { status: 500, category: 'outfit', alert: true, cause });
  }
}

// ── Infrastructure & Third-Party (Security doc §7 table 4) ──────────
class InfrastructureError extends AppError {
  constructor(message = 'Something went wrong on our end', { status = 500, alert = true, cause } = {}) {
    super(message, { status, category: 'infrastructure', alert, cause });
  }
}

module.exports = {
  AppError,
  AuthError,
  ForbiddenError,
  UploadError,
  OutfitGenerationError,
  InfrastructureError,
};
