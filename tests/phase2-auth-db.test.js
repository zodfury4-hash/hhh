'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const http = require('http');

const app = require('../backend/server');
const memStore = require('../backend/utils/memStore');
const socialAuth = require('../backend/services/socialAuth');
const { hashOtp, verifyOtpHash } = require('../backend/utils/helpers');
const { verifyMailTransport } = require('../backend/utils/mailer');

async function runPhase2Tests() {
  console.log('🧪 Running Phase 2 Auth, OTP, Social SSO, Cookies, CSRF & DB Tests...');

  // 1. OTP hashing unit tests
  const h = hashOtp('Alice@Example.com', '123456');
  assert(h && h.length === 64 && h !== '123456', 'OTP hash must be SHA-256 hex, not plaintext');
  assert.strictEqual(verifyOtpHash('alice@example.com', '123456', h), true);
  assert.strictEqual(verifyOtpHash('alice@example.com', '000000', h), false);
  console.log('  ✅ PASS: OTP hashing uses SHA-256 + timing-safe compare');

  // 2. Mail transport probe when unconfigured
  const mailStatus = await verifyMailTransport();
  assert.strictEqual(mailStatus.ok, false);
  assert.strictEqual(mailStatus.code, 'MAIL_NOT_CONFIGURED');
  console.log('  ✅ PASS: verifyMailTransport() reports unconfigured transport cleanly');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 3. Signup stores hashed OTP, verifies, sets HttpOnly + CSRF cookies
    const email = `phase2_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Phase Two', email, password: 'StrongPassword123!' })
    });
    assert.strictEqual(regRes.status, 200);
    const regUser = memStore.users.find((u) => u.email === email);
    assert(regUser && regUser.verificationCodeHash, 'User must store hashed OTP');
    assert.strictEqual(verifyOtpHash(email, regUser.verificationCode, regUser.verificationCodeHash), true);

    // Expired OTP rejection
    const savedExp = regUser.verificationCodeExpires;
    regUser.verificationCodeExpires = new Date(Date.now() - 5000);
    const expRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: regUser.verificationCode })
    });
    assert.strictEqual(expRes.status, 400);
    regUser.verificationCodeExpires = savedExp;

    // Valid OTP verify -> sets HttpOnly cookie & CSRF cookie
    const verRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: regUser.verificationCode })
    });
    assert.strictEqual(verRes.status, 200);
    const setCookies = verRes.headers.getSetCookie ? verRes.headers.getSetCookie() : [];
    const tokenCookie = setCookies.find((c) => c.startsWith('hea_token='));
    const csrfCookie = setCookies.find((c) => c.startsWith('hea_csrf='));
    assert(tokenCookie && tokenCookie.includes('HttpOnly') && tokenCookie.includes('SameSite=Lax'), 'hea_token must be HttpOnly SameSite=Lax');
    assert(csrfCookie && !csrfCookie.includes('HttpOnly'), 'hea_csrf must be readable by client JS');
    const verData = await verRes.json();
    const jwt1 = verData.token;
    const rawHeaToken = tokenCookie.split(';')[0];
    const rawCsrfVal = csrfCookie.split(';')[0].split('=')[1];
    console.log('  ✅ PASS: OTP verification validates expiry & sets HttpOnly + CSRF cookies');

    // 4. CSRF check on cookie auth without Bearer header
    const noCsrfRes = await fetch(`${baseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${rawHeaToken}; hea_csrf=${rawCsrfVal}`
      },
      body: JSON.stringify({ dest: 'https://example.org/csrf-test' })
    });
    assert.strictEqual(noCsrfRes.status, 403);
    const noCsrfData = await noCsrfRes.json();
    assert.strictEqual(noCsrfData.code, 'CSRF_INVALID');

    const withCsrfRes = await fetch(`${baseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${rawHeaToken}; hea_csrf=${rawCsrfVal}`,
        'X-CSRF-Token': rawCsrfVal
      },
      body: JSON.stringify({ dest: 'https://example.org/csrf-ok' })
    });
    assert.strictEqual(withCsrfRes.status, 200);
    console.log('  ✅ PASS: Cookie auth requires matching X-CSRF-Token on state-changing requests');

    // 5. Logout revokes JWT via tokenVersion increment
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt1}` }
    });
    assert.strictEqual(logoutRes.status, 200);

    const postLogoutMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwt1}` }
    });
    assert.strictEqual(postLogoutMe.status, 401);
    const revData = await postLogoutMe.json();
    assert.strictEqual(revData.code, 'SESSION_REVOKED');
    console.log('  ✅ PASS: POST /api/auth/logout revokes existing JWT via tokenVersion');

    // 6. Change password invalidates older tokens
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'StrongPassword123!' })
    });
    const loginData = await loginRes.json();
    const jwt2 = loginData.token;

    const chgRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt2}`
      },
      body: JSON.stringify({
        currentPassword: 'StrongPassword123!',
        newPassword: 'NewStrongPassword456!'
      })
    });
    assert.strictEqual(chgRes.status, 200);

    const postPassChangeMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwt2}` }
    });
    assert.strictEqual(postPassChangeMe.status, 401);
    console.log('  ✅ PASS: Change password revokes active JWTs cleanly');

    // 7. Mocked Google & Apple sign-in tests
    const origGoogle = socialAuth.verifyGoogleIdToken;
    const origApple = socialAuth.verifyAppleIdentityToken;
    const prevAppleId = process.env.APPLE_CLIENT_ID;
    process.env.APPLE_CLIENT_ID = 'com.healink.web';

    socialAuth.verifyGoogleIdToken = async () => ({
      sub: 'google-sub-123',
      email,
      name: 'Google Linked',
      avatar: 'https://example.org/av.png',
      emailVerified: true
    });
    const gRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock-google-jwt' })
    });
    assert.strictEqual(gRes.status, 200);
    const gData = await gRes.json();
    assert.strictEqual(gData.user.email, email);
    assert(regUser.authProviders.includes('google'), 'Google provider linked to existing account');

    socialAuth.verifyAppleIdentityToken = async () => ({
      sub: 'apple-sub-789',
      email: 'apple_first@example.com',
      emailVerified: true,
      isPrivateEmail: false
    });
    const aRes = await fetch(`${baseUrl}/api/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identityToken: 'mock-apple-jwt',
        user: { name: { firstName: 'Zara', lastName: 'Khan' } }
      })
    });
    assert.strictEqual(aRes.status, 200);
    const aData = await aRes.json();
    assert.strictEqual(aData.user.name, 'Zara Khan');
    assert.strictEqual(aData.user.email, 'apple_first@example.com');

    socialAuth.verifyGoogleIdToken = origGoogle;
    socialAuth.verifyAppleIdentityToken = origApple;
    if (prevAppleId === undefined) delete process.env.APPLE_CLIENT_ID;
    else process.env.APPLE_CLIENT_ID = prevAppleId;
    console.log('  ✅ PASS: Mocked Google account linking & Apple first-login name capture passed');

    // 8. Production missing-mail guard (with simulated connected DB)
    const mongoose = require('mongoose');
    const User = require('../backend/models/User');
    const prevNodeEnv = process.env.NODE_ENV;
    const origReadyDesc = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    const origFindOne = User.findOne;
    let prodRegRes;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
      User.findOne = async () => null;
      process.env.NODE_ENV = 'production';
      prodRegRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Prod Test',
          email: `prod_${Date.now()}@example.com`,
          password: 'StrongPassword123!'
        })
      });
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      User.findOne = origFindOne;
      if (origReadyDesc) {
        Object.defineProperty(mongoose.connection, 'readyState', origReadyDesc);
      } else {
        delete mongoose.connection.readyState;
      }
    }
    assert.strictEqual(prodRegRes.status, 503);
    const prodRegData = await prodRegRes.json();
    assert.strictEqual(prodRegData.code, 'EMAIL_SERVICE_UNAVAILABLE');
    console.log('  ✅ PASS: Production signup without mail transport returns 503 EMAIL_SERVICE_UNAVAILABLE');

    // 9. OTP brute-force lockout per email + IP
    const lockEmail = `lock_${Date.now()}@example.com`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lock User', email: lockEmail, password: 'StrongPassword123!' })
    });
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lockEmail, code: '000000' })
      });
    }
    const lockedRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lockEmail, code: '000000' })
    });
    assert.strictEqual(lockedRes.status, 429);
    console.log('  ✅ PASS: OTP max attempts triggers HTTP 429 lockout');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runPhase2Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 2 test failed:', err);
      process.exit(1);
    });
}

module.exports = runPhase2Tests;
