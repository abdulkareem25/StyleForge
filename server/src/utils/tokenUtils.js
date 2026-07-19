const crypto = require('crypto');

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

// Placeholder — tokenUtils.js (JWT helpers)
module.exports = {
  generateAccessToken: (_payload) => { throw new Error('Not implemented'); },
  generateRefreshToken: (_payload) => { throw new Error('Not implemented'); },
  verifyAccessToken: (_token) => { throw new Error('Not implemented'); },
  verifyRefreshToken: (_token) => { throw new Error('Not implemented'); },
  generateVerificationToken,
  hashVerificationToken,
};
