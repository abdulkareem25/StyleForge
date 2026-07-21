const User = require('../models/User');

/**
 * Authorization middleware — checks that the authenticated user has the
 * required role. Must be applied AFTER authMiddleware (which sets req.user).
 *
 * This is deliberately separate from SEC-01's ownership-check middleware:
 * authentication (who are you?) and authorization (what can you do?) are
 * distinct concerns (Security doc §2).
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin')
 */
const roleCheck = (...roles) => async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authentication required',
      });
    }

    const user = await User.findById(req.user.id).select('role').lean().exec();

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'User not found',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Insufficient permissions',
      });
    }

    // Attach role to req for downstream handlers (audit logging, etc.)
    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = roleCheck;
