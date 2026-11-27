const rateLimit = require('express-rate-limit');

/**
 * Optional shared-store factory for multi-instance deployments (Redis/Mongo hook).
 * Uses in-memory store by default unless RATE_LIMIT_STORE is configured with an adapter.
 */
function createLimiterStore() {
  return undefined;
}

// Strict rate limit for auth endpoints: 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: createLimiterStore(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.', code: 'RATE_LIMITED' }
});

// API key management rate limit: 20 requests per 15 minutes
const apiKeysLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: createLimiterStore(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API key operations. Please wait 15 minutes.', code: 'RATE_LIMITED' }
});

// OTP-specific rate limit per IP + email: 10 attempts per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const e = ((req.body && req.body.email) || '').toString().toLowerCase().trim();
    return `${req.ip || 'unknown'}:${e}`;
  },
  message: { error: 'Too many verification code requests. Please wait 15 minutes.', code: 'OTP_RATE_LIMITED' }
});

// Link creation rate limit: 40 requests per minute
const linkCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many links created recently. Please wait a moment before creating more.',
    code: 'RATE_LIMITED'
  }
});

// Bulk shorten rate limit: 10 requests per minute
const bulkShortenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bulk shorten rate limit reached. Please wait a minute.', code: 'RATE_LIMITED' }
});

// Assist & AI rate limit: 30 requests per minute
const assistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI Assistant rate limit reached. Please wait a minute before sending another request.',
    code: 'RATE_LIMITED'
  }
});

// Abuse report rate limit: 10 reports per hour
const abuseReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many abuse reports submitted. Please wait before submitting more.', code: 'RATE_LIMITED' }
});

// Password challenge attempt rate limit: 5 attempts per 10 minutes per IP+slug
const passwordAttemptLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => `${req.ip || 'unknown'}_${(req.params.slug || '').toLowerCase()}`,
  handler: (req, res) => {
    const { renderPasswordChallengeHtml } = require('../utils/protectedLinkHtml');
    return res.status(429).send(
      renderPasswordChallengeHtml({
        slug: req.params.slug,
        error: 'Too many incorrect password attempts. Please wait 10 minutes before trying again.'
      })
    );
  }
});

// General API rate limit: 120 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.', code: 'RATE_LIMITED' }
});

module.exports = {
  createLimiterStore,
  authLimiter,
  apiKeysLimiter,
  otpLimiter,
  linkCreateLimiter,
  bulkShortenLimiter,
  assistLimiter,
  abuseReportLimiter,
  passwordAttemptLimiter,
  apiLimiter
};
