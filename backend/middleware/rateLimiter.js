const rateLimit = require('express-rate-limit');

// Strict rate limit for auth endpoints: 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.', code: 'RATE_LIMITED' }
});

// Link creation rate limit: 40 requests per minute
const linkCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many links created recently. Please wait a moment before creating more.', code: 'RATE_LIMITED' }
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
  message: { error: 'AI Assistant rate limit reached. Please wait a minute before sending another request.', code: 'RATE_LIMITED' }
});

// Abuse report rate limit: 10 reports per hour
const abuseReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many abuse reports submitted. Please wait before submitting more.', code: 'RATE_LIMITED' }
});

module.exports = {
  authLimiter,
  linkCreateLimiter,
  bulkShortenLimiter,
  assistLimiter,
  abuseReportLimiter
};
