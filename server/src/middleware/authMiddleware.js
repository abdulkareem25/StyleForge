const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication required',
    });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (_err) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid or expired token',
    });
  }
};
