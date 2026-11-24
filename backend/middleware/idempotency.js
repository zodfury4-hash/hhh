const crypto = require('crypto');

// In-memory idempotency cache (keyed by sha256(userEmail + idempotencyKey))
const idempotencyStore = new Map();

// Periodic prune every hour
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of idempotencyStore.entries()) {
    if (now >= v.expiresAt) {
      idempotencyStore.delete(k);
    }
  }
}, 3600 * 1000).unref();

function idempotency() {
  return (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    const key = req.headers['idempotency-key'];
    if (!key) {
      return next();
    }

    const userEmail = (req.user && req.user.email) || 'anon';
    const cacheKey = crypto.createHash('sha256').update(`${userEmail}:${key}`).digest('hex');

    const cached = idempotencyStore.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT-Idempotency');
      for (const [hName, hVal] of Object.entries(cached.headers || {})) {
        res.setHeader(hName, hVal);
      }
      return res.status(cached.status).json(cached.body);
    }

    // Intercept res.json
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        idempotencyStore.set(cacheKey, {
          status: res.statusCode,
          headers: {
            'X-Idempotency-Key': key
          },
          body,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
      }
      return originalJson(body);
    };

    return next();
  };
}

module.exports = {
  idempotency
};
