'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const http = require('http');

const app = require('../backend/server');
const memStore = require('../backend/utils/memStore');
const socialAuth = require('../backend/services/socialAuth');
const { verifyOtpHash } = require('../backend/utils/helpers');

async function runCoreFlowsTest() {
  console.log('\n🧪 Running Phase 3 Core Functional Flows Suite...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------
    // 1. Google Login (mocked token)
    // -------------------------------------------------------------
    console.log('\n  🔹 1. Testing Google Login with Mocked Token...');
    const origVerifyGoogle = socialAuth.verifyGoogleIdToken;
    const testGoogleEmail = `google_core_${Date.now()}@example.com`;

    socialAuth.verifyGoogleIdToken = async (token) => {
      if (token === 'valid_mock_google_token') {
        return {
          sub: 'google_user_unique_id_999',
          email: testGoogleEmail,
          name: 'Google Test User',
          avatar: 'https://lh3.googleusercontent.com/test-avatar.png',
          emailVerified: true
        };
      }
      throw new Error('Invalid Google token');
    };

    // 1.1 Invalid token rejected
    const badGRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid_token' })
    });
    assert.strictEqual(badGRes.status, 401);

    // 1.2 Valid token logs in, returns JWT & user info
    const goodGRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid_mock_google_token' })
    });
    assert.strictEqual(goodGRes.status, 200);
    const gBody = await goodGRes.json();
    assert.strictEqual(gBody.success, true);
    assert.strictEqual(gBody.user.email, testGoogleEmail);
    assert.ok(gBody.token, 'Must return JWT token');
    assert.ok(goodGRes.headers.get('set-cookie')?.includes('hea_token='), 'Must set HttpOnly cookie');
    socialAuth.verifyGoogleIdToken = origVerifyGoogle;
    console.log('  ✅ PASS: Google SSO login with mocked token succeeds with verified session & cookie');

    // -------------------------------------------------------------
    // 2. Email OTP Flow
    // -------------------------------------------------------------
    console.log('\n  🔹 2. Testing Email Registration & OTP Verification Flow...');
    const otpEmail = `otp_flow_${Date.now()}@example.com`;

    // 2.1 Register user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OTP User',
        email: otpEmail,
        password: 'SecurePassword123!'
      })
    });
    assert.strictEqual(regRes.status, 200);
    const regBody = await regRes.json();
    assert.strictEqual(regBody.success, true);

    const userInMem = memStore.users.find((u) => u.email === otpEmail);
    assert.ok(userInMem && userInMem.verificationCodeHash, 'User must have hashed OTP stored');
    const rawOtp = userInMem.verificationCode;
    assert.strictEqual(verifyOtpHash(otpEmail, rawOtp, userInMem.verificationCodeHash), true);

    // 2.2 Invalid OTP rejected
    const badOtpRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, code: '000000' })
    });
    assert.strictEqual(badOtpRes.status, 400);

    // 2.3 Resend code
    const resendRes = await fetch(`${baseUrl}/api/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail })
    });
    assert.strictEqual(resendRes.status, 200);

    // 2.4 Valid OTP verifies user
    const goodOtpRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, code: userInMem.verificationCode })
    });
    assert.strictEqual(goodOtpRes.status, 200);
    const goodOtpBody = await goodOtpRes.json();
    assert.strictEqual(goodOtpBody.success, true);
    assert.ok(goodOtpBody.token, 'Verified account must receive JWT token');
    const authJwt = goodOtpBody.token;
    console.log('  ✅ PASS: Email OTP registration, resend, and verification lifecycle succeeded');

    // -------------------------------------------------------------
    // 3. Rate Limits
    // -------------------------------------------------------------
    console.log('\n  🔹 3. Testing Rate Limits...');
    const rateLimitEmail = `ratelimit_${Date.now()}@example.com`;
    // Register user first so verify-email finds the account
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rate Limit Target',
        email: rateLimitEmail,
        password: 'Password123!'
      })
    });

    let hitRateLimit = false;
    // 5 wrong attempts are allowed, 6th triggers HTTP 429 lockout
    for (let i = 0; i < 8; i++) {
      const rlRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rateLimitEmail, code: '000000' })
      });
      if (rlRes.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    assert.strictEqual(hitRateLimit, true, 'Rate limiter must trigger HTTP 429 on abuse attempts');
    console.log('  ✅ PASS: Security rate limit triggers HTTP 429 Too Many Requests');

    // -------------------------------------------------------------
    // 4. Link Creation & Redirect
    // -------------------------------------------------------------
    console.log('\n  🔹 4. Testing Link Creation and 302 Redirection...');
    const linkSlug = `core-slug-${Date.now().toString(36)}`;
    const destUrl = 'https://example.org/destination-target';

    const createLinkRes = await fetch(`${baseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authJwt}`
      },
      body: JSON.stringify({
        dest: destUrl,
        slug: linkSlug,
        title: 'Core Redirect Test'
      })
    });
    assert(createLinkRes.status === 200 || createLinkRes.status === 201, `Expected 200/201, got ${createLinkRes.status}`);
    const linkData = await createLinkRes.json();
    const linkObj = linkData.link || linkData;
    assert.strictEqual(linkObj.slug, linkSlug);

    // Test redirection without following redirect automatically
    const redRes = await fetch(`${baseUrl}/${linkSlug}`, { redirect: 'manual' });
    assert.strictEqual(redRes.status, 302, 'Shortlink must return HTTP 302 redirect');
    assert.strictEqual(redRes.headers.get('location'), destUrl, 'Redirection header must match target URL');
    console.log('  ✅ PASS: Shortlink created and returned HTTP 302 with correct destination Location');

    // -------------------------------------------------------------
    // 5. QR Creation
    // -------------------------------------------------------------
    console.log('\n  🔹 5. Testing Styled Vector QR Code Creation...');
    const createQrRes = await fetch(`${baseUrl}/api/qrs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authJwt}`
      },
      body: JSON.stringify({
        title: 'Core QR Code',
        dest: destUrl,
        color: '#0070f3',
        dotColor: '#0070f3',
        bgColor: '#ffffff',
        dotStyle: 'rounded',
        errorCorrection: 'H'
      })
    });
    assert(createQrRes.status === 200 || createQrRes.status === 201, `Expected 200/201, got ${createQrRes.status}`);
    const qrData = await createQrRes.json();
    const qrObj = qrData.qr || qrData;
    assert.ok(qrObj.id || qrObj._id, 'Created QR code must have unique ID');
    assert.ok(qrObj.color === '#0070f3' || qrObj.dotColor === '#0070f3', 'QR color must match payload');
    console.log('  ✅ PASS: Vector QR creation endpoint returned 200 with styled vector properties');

    // -------------------------------------------------------------
    // 6. Route List from Phase 1
    // -------------------------------------------------------------
    console.log('\n  🔹 6. Verifying Phase 1 Route List & Non-405 Methods...');
    const pagesToCheck = ['/pricing', '/integrations', '/developers'];
    for (const p of pagesToCheck) {
      const pRes = await fetch(`${baseUrl}${p}`);
      assert.strictEqual(pRes.status, 200, `${p} must return 200`);
      assert.ok(pRes.headers.get('content-type')?.includes('text/html'), `${p} must return text/html`);
    }

    const postAuthRoutes = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/verify-email',
      '/api/auth/resend-code',
      '/api/auth/forgot-password'
    ];

    for (const ep of postAuthRoutes) {
      const epRes = await fetch(`${baseUrl}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.notStrictEqual(epRes.status, 405, `${ep} must NEVER return 405 Method Not Allowed`);
      assert(epRes.status >= 200 && epRes.status < 500, `${ep} returned status ${epRes.status}`);
    }
    console.log('  ✅ PASS: Phase 1 pages return 200 and auth endpoints reject 405');

    console.log('\n🎉 ALL Phase 3 Core Functional Flows passed successfully!\n');
  } finally {
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false).catch(() => {});
    }
  }
}

if (require.main === module) {
  runCoreFlowsTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Core Flows test failed:', err);
      process.exit(1);
    });
}

module.exports = runCoreFlowsTest;
