const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { apiKeysLimiter } = require('../middleware/rateLimiter');
const { recordAuditLog } = require('../services/auditService');
const ApiKey = require('../models/ApiKey');
const ApiUsage = require('../models/ApiUsage');
const { getEntitlements, assertWithinLimit } = require('../config/plans');

// POST /api/keys - Create a new API Key
router.post('/api/keys', apiKeysLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { name, scopes, isTest, expiresInDays } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Key name is required (max 80 chars).'
        }
      });
    }

    const userEmail = req.user.email.toLowerCase().trim();

    // Check Plan Limits via central plans config
    const existingKeys = await ApiKey.listByUser(userEmail);
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      const entitlements = getEntitlements(req.user);
      assertWithinLimit(entitlements, 'apiKeys', existingKeys.length);
    }

    const result = await ApiKey.generateKey({
      userEmail,
      name: name.trim().slice(0, 80),
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : undefined,
      isTest: !!isTest,
      expiresInDays: typeof expiresInDays === 'number' ? expiresInDays : null
    });

    recordAuditLog({
      workspaceId: userEmail,
      actorEmail: userEmail,
      action: 'api_key.created',
      targetType: 'api_key',
      targetId: result.key.keyId || '',
      meta: { name: result.key.name, isTest: !!isTest },
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Copy it now; you will not be able to view the secret again.',
      key: result.key,
      rawKey: result.rawKey
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/keys - List user's active API keys
router.get('/api/keys', authMiddleware, async (req, res, next) => {
  try {
    const keys = await ApiKey.listByUser(req.user.email);
    return res.json({
      success: true,
      keys
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/keys/:id - Revoke an API key
router.delete('/api/keys/:id', apiKeysLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const revoked = await ApiKey.revokeKey(id, req.user.email);
    if (!revoked) {
      return res.status(404).json({
        error: {
          code: 'KEY_NOT_FOUND',
          message: 'API key not found or already revoked.'
        }
      });
    }
    recordAuditLog({
      workspaceId: req.user.email,
      actorEmail: req.user.email,
      action: 'api_key.revoked',
      targetType: 'api_key',
      targetId: id,
      ip: req.ip
    });
    return res.json({
      success: true,
      message: 'API key revoked successfully.'
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/keys/usage - Get user's current month API usage
router.get('/api/keys/usage', authMiddleware, async (req, res, next) => {
  try {
    const count = await ApiUsage.getMonthUsage(req.user.email);
    return res.json({
      success: true,
      monthUsage: count,
      limit: req.user.plan === 'pro' ? 100000 : 5000
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
