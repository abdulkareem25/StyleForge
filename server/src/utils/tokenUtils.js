const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';

/**
 * Generates a cryptographically secure random verification token.
 * @returns {string} Opaque token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hashes a verification token using SHA-256.
 * @param {string} token
 * @returns {string} Hex digest of SHA-256 hash
 */
const hashVerificationToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Signs a short-lived JWT access token.
 * @param {object} payload - { id, email }
 * @returns {string} Signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign({ id: payload.id, email: payload.email }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
  });
};

/**
 * Generates an opaque refresh token and returns both the raw token (for the
 * cookie) and its SHA-256 hash (for storage in the database).
 * @returns {{ rawToken: string, tokenHash: string }}
 */
const generateRefreshToken = () => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

/**
 * Verifies a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

/**
 * Verifies a JWT refresh token (if using JWT-based refresh tokens).
 * Note: StyleForge uses opaque random tokens hashed with SHA-256, so this
 * function is kept for completeness but the primary verify path is
 * comparing the hash in the RefreshToken collection.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateVerificationToken,
  hashVerificationToken,
};
