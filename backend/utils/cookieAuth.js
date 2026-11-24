const crypto = require('crypto');
const config = require('../config');

const COOKIE_PREFIX = 'hea_pwd_';
const MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Generate a signed HMAC access token for a password-protected slug.
 * @param {string} slug
 * @returns {string}
 */
function createSlugCookieValue(slug) {
  const timestamp = Date.now().toString();
  const secret = config.jwtSecret || 'hea-link-secure-hmac-secret-min32chars';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${slug}:${timestamp}`)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

/**
 * Verify a signed HMAC cookie value for a specific slug.
 * @param {string} slug
 * @param {string} cookieValue
 * @returns {boolean}
 */
function verifySlugCookieValue(slug, cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return false;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check 24-hour expiration
  const now = Date.now();
  if (now - timestamp > MAX_AGE_SECONDS * 1000 || timestamp > now + 60000) {
    return false;
  }

  const secret = config.jwtSecret || 'hea-link-secure-hmac-secret-min32chars';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${slug}:${timestampStr}`)
    .digest('hex');

  if (signature.length !== expectedSignature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (_e) {
    return false;
  }
}

/**
 * Extract a specific cookie by name from req.headers.cookie.
 * @param {import('express').Request} req
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const cookies = header.split(';');
  for (const c of cookies) {
    const [rawKey, ...rawVal] = c.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawVal.join('='));
    }
  }
  return null;
}

/**
 * Set the password verification cookie on the response.
 * @param {import('express').Response} res
 * @param {string} slug
 */
function setSlugCookie(res, slug) {
  const cookieName = `${COOKIE_PREFIX}${slug}`;
  const value = createSlugCookieValue(slug);
  const isProd = config.env === 'production';
  const flags = [
    `${cookieName}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_SECONDS}`
  ];
  if (isProd) {
    flags.push('Secure');
  }
  res.setHeader('Set-Cookie', flags.join('; '));
}

/**
 * Check if the request has a valid password cookie for the given slug.
 * @param {import('express').Request} req
 * @param {string} slug
 * @returns {boolean}
 */
function isSlugAuthorized(req, slug) {
  const cookieName = `${COOKIE_PREFIX}${slug}`;
  const cookieVal = getCookie(req, cookieName);
  return verifySlugCookieValue(slug, cookieVal);
}

module.exports = {
  COOKIE_PREFIX,
  createSlugCookieValue,
  verifySlugCookieValue,
  getCookie,
  setSlugCookie,
  isSlugAuthorized
};
