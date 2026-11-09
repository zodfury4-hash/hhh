const crypto = require('crypto');

const VIP_ADMIN_ACCOUNTS = {
  'furyzod02@gmail.com': { name: 'Fury Zod', pass: '123456789' },
  'healink@gmail.com': { name: 'HEA Link Admin', pass: 'healink123' }
};

function isVipAdminEmail(email) {
  if (!email) return false;
  return !!VIP_ADMIN_ACCOUNTS[email.toLowerCase().trim()];
}

function devCodeField(code, emailSent) {
  return emailSent ? { emailSent: true } : { emailSent: false, devCode: code };
}

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

const otpAttempts = new Map();

function checkOtpRateLimit(email) {
  const rec = otpAttempts.get(email);
  if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
    const minsLeft = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Account temporarily locked for security. Please try again in ${minsLeft} minute(s).`;
  }
  return null;
}

function recordOtpFailure(email) {
  const rec = otpAttempts.get(email) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  otpAttempts.set(email, rec);
}

function clearOtpRateLimit(email) {
  otpAttempts.delete(email);
}

module.exports = {
  VIP_ADMIN_ACCOUNTS,
  isVipAdminEmail,
  devCodeField,
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
};
