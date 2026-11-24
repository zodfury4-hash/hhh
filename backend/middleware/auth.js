const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');

const JWT_SECRET = config.jwtSecret;

function authMiddleware(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided', code: 'NO_TOKEN' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tokenVersion !== undefined && mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      User.findOne({ email: decoded.email.toLowerCase() }, 'tokenVersion status')
        .lean()
        .then((dbUser) => {
          if (dbUser && dbUser.tokenVersion !== undefined && dbUser.tokenVersion > decoded.tokenVersion) {
            return res.status(401).json({
              error: 'Unauthorized: Session revoked. Please log in again.',
              code: 'SESSION_REVOKED'
            });
          }
          req.user = decoded;
          next();
        })
        .catch(next);
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token', code: 'INVALID_TOKEN' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_e) {
      // Optional auth failure is safely ignored
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && !req.user.isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required', code: 'FORBIDDEN' });
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  JWT_SECRET
};
