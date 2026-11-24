const crypto = require('crypto');
const config = require('../config');

// Derive 32-byte key from INTEGRATIONS_ENC_KEY or fallback to jwtSecret
function getEncryptionKey() {
  const rawKey = process.env.INTEGRATIONS_ENC_KEY || config.jwtSecret || 'hea-default-secure-integrations-key-32b';
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypt a plain text string using AES-256-GCM
 * @param {string} text - Plain text string
 * @returns {string} - Combined string in format: iv:tag:ciphertext (hex)
 */
function encrypt(text) {
  if (text === null || text === undefined) return null;
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} encryptedPayload - Format: iv:tag:ciphertext (hex)
 * @returns {string|null} - Decrypted plain text or null if failed
 */
function decrypt(encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') return null;
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (_err) {
    return null;
  }
}

/**
 * Mask sensitive webhook URL or secret string for safe display
 * e.g. https://hooks.slack.com/services/T123/B456/789abc -> https://hooks.slack.com/services/T123/.../********
 */
function maskSecret(secret) {
  if (!secret || typeof secret !== 'string') return '';
  if (secret.startsWith('http://') || secret.startsWith('https://')) {
    try {
      const u = new URL(secret);
      const segments = u.pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        return `${u.origin}/${segments[0]}/.../` + '*'.repeat(8);
      }
      return `${u.origin}/...` + '*'.repeat(6);
    } catch (_e) {
      return secret.slice(0, 8) + '...' + '*'.repeat(8);
    }
  }
  if (secret.length <= 8) return '****';
  return secret.slice(0, 4) + '...' + '*'.repeat(8);
}

module.exports = {
  encrypt,
  decrypt,
  maskSecret
};
