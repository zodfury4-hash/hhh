'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const {
  generateSecureOTP,
  hashOtp,
  verifyOtpHash,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../backend/utils/helpers');
const { sendSuccess, sendError } = require('../backend/utils/response');
const { isValidDestinationUrl } = require('../backend/middleware/validation');
const { generateCryptoSlug } = require('../backend/utils/slugGenerator');
const { parseCookies } = require('../backend/middleware/auth');
const config = require('../backend/config');

describe('Core Backend Utilities & Helpers', () => {
  it('generates 6-digit numeric OTPs', () => {
    const otp = generateSecureOTP();
    assert.match(otp, /^\d{6}$/);
  });

  it('hashes and verifies 6-digit OTPs scoped per email with timing-safe equality', () => {
    const hash = hashOtp('User@Example.com', '482910');
    assert.equal(hash.length, 64);
    assert.equal(verifyOtpHash('user@example.com', '482910', hash), true);
    assert.equal(verifyOtpHash('other@example.com', '482910', hash), false);
    assert.equal(verifyOtpHash('user@example.com', '000000', hash), false);
    assert.equal(verifyOtpHash('user@example.com', '482910', ''), false);
  });

  it('enforces OTP brute-force lockout after 5 failures and resets cleanly', () => {
    const email = `cov_${Date.now()}@example.com`;
    for (let i = 0; i < 5; i++) {
      recordOtpFailure(email, '1.2.3.4');
    }
    const lockMsg = checkOtpRateLimit(email, '1.2.3.4');
    assert.equal(typeof lockMsg, 'string');
    assert.match(lockMsg, /locked/i);
    clearOtpRateLimit(email, '1.2.3.4');
    assert.equal(checkOtpRateLimit(email, '1.2.3.4'), null);
  });

  it('generates URL-safe crypto slugs with expected length', () => {
    const s = generateCryptoSlug(8);
    assert.equal(s.length, 8);
    assert.match(s, /^[a-zA-Z0-9]+$/);
  });

  it('rejects private IPs, javascript/data URLs, and self-domain redirect loops', async () => {
    assert.equal(await isValidDestinationUrl('javascript:alert(1)'), false);
    assert.equal(await isValidDestinationUrl('http://127.0.0.1/test'), false);
    assert.equal(await isValidDestinationUrl('https://healink.store/abc'), false);
    assert.equal(await isValidDestinationUrl('https://example.org/docs'), true);
  });

  it('parses HTTP Cookie headers safely', () => {
    const cookies = parseCookies({ headers: { cookie: 'hea_token=abc.def.ghi; hea_csrf=xyz%20123; empty=' } });
    assert.equal(cookies.hea_token, 'abc.def.ghi');
    assert.equal(cookies.hea_csrf, 'xyz 123');
    assert.deepEqual(parseCookies({ headers: {} }), {});
  });

  it('formats standardized JSON responses via sendSuccess and sendError', () => {
    const mockRes = () => {
      const out = { statusCode: 200, body: null };
      return {
        out,
        status(c) {
          out.statusCode = c;
          return this;
        },
        json(b) {
          out.body = b;
          return this;
        }
      };
    };
    const r1 = mockRes();
    sendSuccess(r1, { items: [1] }, 201);
    assert.equal(r1.out.statusCode, 201);
    assert.equal(r1.out.body.ok, true);
    assert.deepEqual(r1.out.body.items, [1]);

    const r2 = mockRes();
    sendError(r2, 'Validation issue', 'VALIDATION_ERROR', 422);
    assert.equal(r2.out.statusCode, 422);
    assert.equal(r2.out.body.ok, false);
    assert.equal(r2.out.body.code, 'VALIDATION_ERROR');
  });

  it('exposes environment config and feature flags safely', () => {
    assert.ok(config.jwtSecret.length >= 32);
    assert.equal(typeof config.features, 'object');
    assert.ok(Array.isArray(config.corsOrigins));
  });
});
