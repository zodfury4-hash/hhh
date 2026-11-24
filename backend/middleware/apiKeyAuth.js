const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const ApiUsage = require('../models/ApiUsage');

// In-memory token-bucket sliding-window rate limiter per keyId
const rateLimitMap = new Map(); // keyId -> { count, resetAt }

function getRateLimit(isTest, plan = 'free') {
  if (isTest) return 60; // 60 requests/min for test/sandbox
  if (plan === 'pro' || plan === 'enterprise') return 600; // 600 requests/min for pro
  return 120; // 120 requests/min for free
}

function apiKeyAuth(requiredScope = null) {
  return async (req, res, next) => {
    // 1. Assign or propagate X-Request-Id
    const requestId = req.headers['x-request-id'] || `req_${crypto.randomBytes(8).toString('hex')}`;
    res.setHeader('X-Request-Id', requestId);
    req.requestId = requestId;

    // 2. Extract Key from Authorization: Bearer <key> or X-API-Key: <key>
    let rawKey = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.slice(7).trim();
    } else if (req.headers['x-api-key']) {
      rawKey = String(req.headers['x-api-key']).trim();
    }

    if (!rawKey) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key is missing. Provide via Authorization: Bearer <key> or X-API-Key header.',
          requestId
        }
      });
    }

    // 3. Verify Key
    try {
      const keyRecord = await ApiKey.verifyKey(rawKey);
      if (!keyRecord) {
        return res.status(401).json({
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid, expired, or revoked API key.',
            requestId
          }
        });
      }

      // 4. Scope Enforcement
      if (requiredScope) {
        const scopes = keyRecord.scopes || [];
        const hasScope = scopes.includes(requiredScope) || scopes.includes('*');
        if (!hasScope) {
          return res.status(403).json({
            error: {
              code: 'INSUFFICIENT_SCOPE',
              message: `API key lacks required scope '${requiredScope}'.`,
              details: { requiredScope, keyScopes: scopes },
              requestId
            }
          });
        }
      }

      // 5. Rate Limiting per Key
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      const limit = getRateLimit(keyRecord.isTest);

      let bucket = rateLimitMap.get(keyRecord.keyId);
      if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
        rateLimitMap.set(keyRecord.keyId, bucket);
      }

      bucket.count += 1;
      const remaining = Math.max(0, limit - bucket.count);
      const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (bucket.count > limit) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Maximum ${limit} requests per minute.`,
            details: { retryAfterSeconds: resetSeconds },
            requestId
          }
        });
      }

      // Attach context to request
      req.apiKey = keyRecord;
      req.user = {
        email: keyRecord.userEmail,
        userId: keyRecord.userId || keyRecord.userEmail,
        role: 'api_user'
      };
      req.isTest = !!keyRecord.isTest;

      // Track usage upon response finish
      res.on('finish', () => {
        ApiUsage.recordRequest({
          keyId: keyRecord.keyId,
          userEmail: keyRecord.userEmail,
          statusCode: res.statusCode
        }).catch(() => {});
      });

      return next();
    } catch (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during API key authentication.',
          requestId
        }
      });
    }
  };
}

module.exports = {
  apiKeyAuth
};
