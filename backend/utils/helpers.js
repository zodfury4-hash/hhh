const crypto = require('crypto');

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

const otpAttempts = new Map();

function checkOtpRateLimit(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const rec = otpAttempts.get(cleanEmail);
  if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
    const minsLeft = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Account temporarily locked for security. Please try again in ${minsLeft} minute(s).`;
  }
  return null;
}

function recordOtpFailure(email) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  const rec = otpAttempts.get(cleanEmail) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  otpAttempts.set(cleanEmail, rec);
}

function clearOtpRateLimit(email) {
  if (!email) return;
  otpAttempts.delete(email.toLowerCase().trim());
}

module.exports = {
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
};
