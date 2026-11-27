'use strict';

const config = require('../config');
const User = require('../models/User');
const memStore = require('../utils/memStore');
const { isDbConnected, isMemStoreAllowed } = require('../middleware/dbCheck');
const { clearAuthCookies } = require('../middleware/auth');
const { recordAuditLog } = require('../services/auditService');

function formatUserResponse(user) {
  const isAdmin = user.role === 'admin';
  return {
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    isAdmin,
    isPro: !!user.isPro || isAdmin,
    plan: user.plan || (isAdmin ? 'Unlimited' : 'Free'),
    isVerified: !!user.isVerified,
    city: user.city || 'New York',
    isp: user.isp || 'Global Internet',
    avatar: user.avatar || ''
  };
}

function getConfigHandler(_req, res) {
  res.json({
    ok: true,
    googleClientId: config.features.googleAuth ? config.google.clientId : '',
    appleClientId: config.features.appleAuth ? config.apple.clientId : '',
    appleConfigured: config.features.appleAuth,
    isDbConnected: isDbConnected(),
    features: config.features,
    configured: true
  });
}

async function logoutHandler(req, res) {
  try {
    if (req.user && req.user.email) {
      const cleanEmail = req.user.email.toLowerCase().trim();
      if (isDbConnected()) {
        await User.updateOne({ email: cleanEmail }, { $inc: { tokenVersion: 1 } });
      } else if (isMemStoreAllowed()) {
        const u = memStore.users.find((x) => x.email === cleanEmail);
        if (u) u.tokenVersion = (u.tokenVersion || 0) + 1;
      }
      recordAuditLog({
        workspaceId: cleanEmail,
        actorEmail: cleanEmail,
        action: 'auth.logout',
        targetType: 'session',
        ip: req.ip
      });
    }
    clearAuthCookies(res);
    return res.json({ ok: true, success: true, message: 'Logged out cleanly' });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(500).json({ ok: false, error: 'Logout failed: ' + err.message, code: 'INTERNAL_ERROR' });
  }
}

async function getMeHandler(req, res) {
  try {
    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: req.user.email }).select(
        '-password -verificationCode -verificationCodeHash -resetPasswordCode -resetPasswordCodeHash'
      );
    } else {
      user = memStore.users.find((u) => u.email === req.user.email);
    }

    if (!user) return res.status(404).json({ ok: false, error: 'User not found', code: 'USER_NOT_FOUND' });

    return res.json({
      ok: true,
      user: formatUserResponse(user)
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
}

module.exports = {
  formatUserResponse,
  getConfigHandler,
  logoutHandler,
  getMeHandler
};
