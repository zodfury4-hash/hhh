const mongoose = require('mongoose');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function isMemStoreAllowed() {
  return process.env.NODE_ENV === 'test' && process.env.DISABLE_MEMSTORE !== 'true';
}

function createDbUnavailableError() {
  const err = new Error('Database service is currently unavailable. Please try again shortly.');
  err.statusCode = 503;
  err.status = 503;
  err.code = 'DATABASE_UNAVAILABLE';
  return err;
}

function requireDatabase(req, res, next) {
  if (!isDbConnected() && !isMemStoreAllowed()) {
    return res.status(503).json({
      ok: false,
      error: 'Database service is currently unavailable. Please try again shortly.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
}

module.exports = {
  requireDatabase,
  isDbConnected,
  isMemStoreAllowed,
  createDbUnavailableError
};
