const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { apiKeysLimiter } = require('../middleware/rateLimiter');
const { recordAuditLog } = require('../services/auditService');
const ApiToken = require('../models/ApiToken');

// POST /api/tokens - Generate a new Personal Access Token (PAT)
router.post('/api/tokens', apiKeysLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { name, scopes, expiresInDays } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Token name is required' });
    }

    const result = await ApiToken.generateToken({
      userEmail: req.user.email,
      name: name.trim().slice(0, 60),
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : undefined,
      expiresInDays: typeof expiresInDays === 'number' ? expiresInDays : 90
    });

    recordAuditLog({
      workspaceId: req.user.email,
      actorEmail: req.user.email,
      action: 'api_token.created',
      targetType: 'api_token',
      targetId: result.token.tokenId || '',
      meta: { name: result.token.name },
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Personal Access Token generated successfully. Copy it now; you will not be able to see it again.',
      token: result.token,
      rawToken: result.rawToken
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/tokens - List user's active PATs
router.get('/api/tokens', authMiddleware, async (req, res, next) => {
  try {
    const tokens = await ApiToken.listByUser(req.user.email);
    return res.json({
      success: true,
      tokens
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/tokens/:id - Revoke a PAT
router.delete('/api/tokens/:id', apiKeysLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const revoked = await ApiToken.revokeToken(id, req.user.email);
    if (!revoked) {
      return res.status(404).json({ error: 'Token not found or already revoked' });
    }
    recordAuditLog({
      workspaceId: req.user.email,
      actorEmail: req.user.email,
      action: 'api_token.revoked',
      targetType: 'api_token',
      targetId: id,
      ip: req.ip
    });
    return res.json({
      success: true,
      message: 'Personal Access Token revoked successfully'
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
