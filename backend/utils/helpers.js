const crypto = require('crypto');

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(email, code) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanCode = String(code || '').trim();
  return crypto.createHash('sha256').update(`${cleanEmail}:${cleanCode}`).digest('hex');
}

function verifyOtpHash(email, code, expectedHash) {
  if (!expectedHash || typeof expectedHash !== 'string') return false;
  const candidate = hashOtp(email, code);
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expectedHash, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const otpAttempts = new Map();

function otpKey(email, ip = '') {
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanIp = String(ip || '').trim();
  return cleanIp ? `${cleanEmail}:${cleanIp}` : cleanEmail;
}

function checkOtpRateLimit(email, ip = '') {
  if (!email) return null;
  const keys = [otpKey(email, ''), ...(ip ? [otpKey(email, ip)] : [])];
  for (const k of keys) {
    const rec = otpAttempts.get(k);
    if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
      const minsLeft = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
      return `Too many failed attempts. Temporarily locked for security. Please try again in ${minsLeft} minute(s).`;
    }
  }
  return null;
}

function recordOtpFailure(email, ip = '') {
  if (!email) return;
  const keys = [otpKey(email, ''), ...(ip ? [otpKey(email, ip)] : [])];
  for (const k of keys) {
    const rec = otpAttempts.get(k) || { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= 5) {
      rec.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
    otpAttempts.set(k, rec);
  }
}

function clearOtpRateLimit(email, ip = '') {
  if (!email) return;
  otpAttempts.delete(otpKey(email, ''));
  if (ip) otpAttempts.delete(otpKey(email, ip));
}

module.exports = {
  generateSecureOTP,
  hashOtp,
  verifyOtpHash,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
};
