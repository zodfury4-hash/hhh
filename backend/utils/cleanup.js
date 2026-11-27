'use strict';

const User = require('../models/User');
const Link = require('../models/Link');
const memStore = require('./memStore');
const logger = require('./logger');
const { isDbConnected, isMemStoreAllowed } = require('../middleware/dbCheck');

/**
 * Prunes expired OTP tokens and stale expired temporary links.
 */
async function runCleanupPass(now = new Date()) {
  const summary = { clearedOtpUsers: 0, prunedExpiredLinks: 0 };

  try {
    if (isDbConnected()) {
      const otpRes = await User.updateMany(
        { verificationCodeExpires: { $lt: now }, isVerified: true },
        { $unset: { verificationCode: 1, verificationCodeHash: 1, verificationCodeExpires: 1 } }
      );
      summary.clearedOtpUsers = otpRes.modifiedCount || 0;

      const linkRes = await Link.deleteMany({
        ownerEmail: 'guest',
        expiresAt: { $ne: null, $lt: now }
      });
      summary.prunedExpiredLinks = linkRes.deletedCount || 0;
    } else if (isMemStoreAllowed()) {
      for (const u of memStore.users) {
        if (u.verificationCodeExpires && new Date(u.verificationCodeExpires) < now && u.isVerified) {
          delete u.verificationCode;
          delete u.verificationCodeHash;
          delete u.verificationCodeExpires;
          summary.clearedOtpUsers += 1;
        }
      }
      const before = memStore.links.length;
      memStore.links = memStore.links.filter(
        (l) => !(l.ownerEmail === 'guest' && l.expiresAt && new Date(l.expiresAt) < now)
      );
      summary.prunedExpiredLinks = before - memStore.links.length;
    }
  } catch (err) {
    logger.warn({ err }, '[Cleanup] Scheduled maintenance pass encountered a warning');
  }

  return summary;
}

function startScheduledCleanup(intervalMs = 6 * 60 * 60 * 1000) {
  if (process.env.NODE_ENV === 'test') return null;
  const timer = setInterval(() => {
    runCleanupPass().catch(() => {});
  }, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
}

module.exports = {
  runCleanupPass,
  startScheduledCleanup
};
