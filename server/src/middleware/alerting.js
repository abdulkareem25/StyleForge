/**
 * ERR-01 — Lightweight alerting tracker.
 *
 * Tracks error rates per category and logs alerts when thresholds are
 * crossed. This is a minimal in-memory implementation suitable for a
 * single-process MVP. For multi-process deployments, swap this out
 * for a shared store (Redis counter) or a dedicated monitoring service.
 *
 * Alert thresholds from Security doc §7:
 * - Auth 403: always alert (every occurrence)
 * - Outfit engine failures: always alert (every occurrence)
 * - Upload failures: alert on spike (>5 in 5min window)
 * - Third-party failures: alert on spike (>3 in 5min window)
 * - Infrastructure: always alert (every occurrence)
 */

const WINDOW_MS = 5 * 60 * 1000; // 5-minute sliding window

// In-memory ring buffer of recent errors per category
const recentErrors = {};

function recordError(category) {
  const now = Date.now();
  if (!recentErrors[category]) recentErrors[category] = [];
  recentErrors[category].push(now);
  // Prune entries outside the window
  recentErrors[category] = recentErrors[category].filter((ts) => now - ts < WINDOW_MS);
}

function getCount(category) {
  const now = Date.now();
  if (!recentErrors[category]) return 0;
  return recentErrors[category].filter((ts) => now - ts < WINDOW_MS).length;
}

/**
 * Evaluates whether an error should trigger an alert log line.
 * Returns { shouldAlert, reason }.
 */
function evaluateAlert(category, alwaysAlert = false) {
  if (alwaysAlert) {
    return { shouldAlert: true, reason: 'every-occurrence' };
  }

  const count = getCount(category);

  switch (category) {
    case 'auth':
      // 403 is always-alert (handled by caller); routine 401 only on spike
      return { shouldAlert: count > 10, reason: count > 10 ? 'volume-spike' : null };

    case 'upload':
      return { shouldAlert: count > 5, reason: count > 5 ? 'failure-spike' : null };

    case 'outfit':
      // Engine failures always alert (handled by caller)
      return { shouldAlert: false, reason: null };

    case 'infrastructure':
      return { shouldAlert: count > 3, reason: count > 3 ? 'third-party-spike' : null };

    default:
      return { shouldAlert: false, reason: null };
  }
}

/**
 * Logs an alert line to stderr (visible in production logs).
 * In a real system this would page / Slack / email — for MVP, structured
 * console output is sufficient for Render's log stream.
 */
function logAlert(category, error, context = {}) {
  const alertPayload = {
    level: 'ALERT',
    category,
    message: error.message || String(error),
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Full stack for alerting (never sent to client)
  if (error.stack) {
    alertPayload.stack = error.stack;
  }

  console.error(`[ALERT][${category.toUpperCase()}]`, JSON.stringify(alertPayload));
}

module.exports = {
  recordError,
  getCount,
  evaluateAlert,
  logAlert,
  WINDOW_MS,
};
