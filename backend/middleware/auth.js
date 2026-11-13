const jwt = require('jsonwebtoken');

let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'test') {
    JWT_SECRET = 'healink_test_jwt_secret_min_32_characters_long_12345';
    process.env.JWT_SECRET = JWT_SECRET;
  } else {
    const errMsg = 'FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters. Please set a secure JWT_SECRET in your .env file.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
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
    } catch (e) {
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
