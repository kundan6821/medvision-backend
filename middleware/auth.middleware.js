const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

/**
 * JWT Auth Middleware
 * Verifies the Bearer token in the Authorization header.
 * Sets req.user = { id, email } on success.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required. Please login first.'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

module.exports = authMiddleware;
