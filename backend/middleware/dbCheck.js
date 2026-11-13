const mongoose = require('mongoose');

function requireDatabase(req, res, next) {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected && process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      ok: false,
      error: 'Database service is currently unavailable. Please try again shortly.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
}

module.exports = {
  requireDatabase
};
