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

async function requireDatabase(req, res, next) {
  if (isDbConnected() || isMemStoreAllowed()) {
    return next();
  }

  // On serverless cold starts (e.g. Vercel), connection may still be handshaking (readyState === 2)
  if (mongoose.connection.readyState === 2 && process.env.NODE_ENV !== 'test') {
    try {
      await Promise.race([
        mongoose.connection.asPromise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB handshake timeout')), 4500))
      ]);
      if (isDbConnected()) return next();
    } catch (_e) {}
  }

  return res.status(503).json({
    ok: false,
    error: 'Database service is currently unavailable. Please try again shortly.',
    code: 'DATABASE_UNAVAILABLE'
  });
}

module.exports = {
  requireDatabase,
  isDbConnected,
  isMemStoreAllowed,
  createDbUnavailableError
};
