'use strict';

const express = require('express');
const router = express.Router();
const { getPublicPlans, getEntitlements } = require('../config/plans');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/plans
 * Public endpoint delivering SaaS plan tiers, prices, limits, and features.
 */
router.get('/api/plans', (req, res) => {
  return res.json({
    ok: true,
    plans: getPublicPlans()
  });
});

/**
 * GET /api/plans/me
 * Authenticated user entitlement check.
 */
router.get('/api/plans/me', authMiddleware, (req, res) => {
  const entitlements = getEntitlements(req.user);
  return res.json({
    ok: true,
    entitlements
  });
});

module.exports = router;
