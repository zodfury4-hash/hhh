'use strict';

process.env.NODE_ENV = 'test';
process.env.DISABLE_MEMSTORE = 'true';
process.env.JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.STRIPE_SECRET_KEY = 'sk_test_51MockStripeKeyForMigrationTestsOnly000000';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret_12345';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const Stripe = require('stripe');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Capture emails/OTPs in memory by intercepting mailer module before requiring server
const capturedOtps = new Map();
const mailerPath = require.resolve('../backend/utils/mailer');
require.cache[mailerPath] = {
  id: mailerPath,
  filename: mailerPath,
  loaded: true,
  exports: {
    sendVerificationEmail: async (email, _name, code) => {
      capturedOtps.set(String(email).toLowerCase().trim(), String(code));
      return { success: true };
    },
    sendPasswordResetEmail: async (email, _name, code) => {
      capturedOtps.set(String(email).toLowerCase().trim(), String(code));
      return { success: true };
    },
    sendEmail: async () => ({ success: true }),
    sendWorkspaceInviteEmail: async () => ({ success: true }),
    sendSupportTicketEmail: async () => ({ success: true })
  }
};

async function runTests() {
  console.log('\n🧪 Starting Firebase-to-Mongo Migration Comprehensive Test Suite...\n');

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  const socialAuth = require('../backend/services/socialAuth');
  const { migrateSnapshot } = require('../scripts/migrate-firebase-to-mongo');

  // Ensure mongoose connects cleanly to the in-memory test instance
  const app = require('../backend/server');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }

  const User = require('../backend/models/User');
  const Link = require('../backend/models/Link');
  const QRCode = require('../backend/models/QRCode');
  const BioPage = require('../backend/models/BioPage');
  const ProcessedPayment = require('../backend/models/ProcessedPayment');

  // Ensure indexes are built cleanly in test DB
  await Promise.all([
    User.syncIndexes(),
    Link.syncIndexes(),
    QRCode.syncIndexes(),
    BioPage.syncIndexes(),
    ProcessedPayment.syncIndexes()
  ]);

  let passed = 0;
  async function test(label, fn) {
    await fn();
    passed++;
    console.log(`  ✅ PASS: ${label}`);
  }

  try {
    // =========================================================================
    // A. AUTH TESTS (Mongo + JWT Only)
    // =========================================================================
    console.log('🔐 Section A: Auth Lifecycle, Social OAuth & Security Tests');

    const userEmail = 'mongo_user_a@example.com';
    const userPass = 'InitialPass123!';
    let userToken = '';

    await test('A1. Register -> mocked OTP email -> verify -> login returns JWT & /me works', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.1.0.1')
        .send({ name: 'Alice Mongo', email: userEmail, password: userPass });
      assert.strictEqual(regRes.status, 200);
      assert.strictEqual(regRes.body.success, true);

      const otp = capturedOtps.get(userEmail);
      assert.ok(otp && /^\d{6}$/.test(otp), 'Mocked mailer captured 6-digit OTP');

      const verRes = await request(app)
        .post('/api/auth/verify-email')
        .set('X-Forwarded-For', '10.1.0.1')
        .send({ email: userEmail, code: otp });
      assert.strictEqual(verRes.status, 200);
      assert.ok(verRes.body.token, 'Verify returns JWT');

      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.1.0.1')
        .send({ email: userEmail, password: userPass });
      assert.strictEqual(loginRes.status, 200);
      assert.ok(loginRes.body.token);
      userToken = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.body.user.email, userEmail);
    });

    await test('A2. Wrong password, unverified login, wrong/expired OTP, duplicate email errors', async () => {
      const badPassRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ email: userEmail, password: 'WrongPassword99!' });
      assert.strictEqual(badPassRes.status, 400);

      const dupRegRes = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ name: 'Dup', email: userEmail, password: userPass });
      assert.strictEqual(dupRegRes.status, 400);

      // Register an unverified user
      const unvEmail = 'unverified_u@example.com';
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ name: 'Unv', email: unvEmail, password: userPass });

      const unvLoginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ email: unvEmail, password: userPass });
      assert.strictEqual(unvLoginRes.status, 403);
      assert.strictEqual(unvLoginRes.body.error, 'email_not_verified');

      const badOtpRes = await request(app)
        .post('/api/auth/verify-email')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ email: unvEmail, code: '000000' });
      assert.strictEqual(badOtpRes.status, 400);

      // Simulate expired OTP
      await User.updateOne(
        { email: unvEmail },
        { $set: { verificationCode: '111222', verificationCodeExpires: new Date(Date.now() - 60000) } }
      );
      const expOtpRes = await request(app)
        .post('/api/auth/verify-email')
        .set('X-Forwarded-For', '10.1.0.2')
        .send({ email: unvEmail, code: '111222' });
      assert.strictEqual(expOtpRes.status, 400);
    });

    await test('A3. Forgot-password -> reset-password -> old password fails, new works', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', '10.1.0.3')
        .send({ email: userEmail });
      assert.strictEqual(forgotRes.status, 200);

      const resetOtp = capturedOtps.get(userEmail);
      const newPass = 'ResetStrongPass456!';
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .set('X-Forwarded-For', '10.1.0.3')
        .send({ email: userEmail, code: resetOtp, newPassword: newPass });
      assert.strictEqual(resetRes.status, 200);
      assert.ok(resetRes.body.token);

      const oldLogin = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.1.0.3')
        .send({ email: userEmail, password: userPass });
      assert.strictEqual(oldLogin.status, 400);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.1.0.3')
        .send({ email: userEmail, password: newPass });
      assert.strictEqual(newLogin.status, 200);
      userToken = newLogin.body.token;
    });

    await test('A4. Change-password, update-profile, refresh token', async () => {
      const profRes = await request(app)
        .post('/api/auth/update-profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Alice Updated', city: 'Lahore' });
      assert.strictEqual(profRes.status, 200);

      const refRes = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(refRes.status, 200);
      assert.ok(refRes.body.token);
      assert.strictEqual(refRes.body.user.name, 'Alice Updated');
      assert.strictEqual(refRes.body.user.city, 'Lahore');
      userToken = refRes.body.token;

      const finalPass = 'ChangedFinalPass789!';
      const chgRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'ResetStrongPass456!', newPassword: finalPass });
      assert.strictEqual(chgRes.status, 200);
    });

    await test('A5. Rate limiter triggers on repeated bad logins and OTP guesses', async () => {
      const otpTarget = 'ratelimit_otp@example.com';
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.1.0.50')
        .send({ name: 'RL', email: otpTarget, password: userPass });

      // 5 bad OTP guesses trigger OTP lockout (429) on 6th
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/verify-email')
          .set('X-Forwarded-For', '10.1.0.51')
          .send({ email: otpTarget, code: '999999' });
      }
      const lockedRes = await request(app)
        .post('/api/auth/verify-email')
        .set('X-Forwarded-For', '10.1.0.52')
        .send({ email: otpTarget, code: '999999' });
      assert.strictEqual(lockedRes.status, 429);

      // Express authLimiter (20/15min per IP)
      let hit429 = false;
      for (let i = 0; i < 23; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', '10.1.0.53')
          .send({ email: userEmail, password: 'wrong' });
        if (res.status === 429) {
          hit429 = true;
          break;
        }
      }
      assert.strictEqual(hit429, true, 'authLimiter must trigger HTTP 429 after burst of bad logins');
    });

    await test('A6. Google OAuth: verified token creates/links user, rejects unverified & takeover hole', async () => {
      // Account takeover regression check: { userInfo: { email } } without credential MUST be rejected
      const takeoverRes = await request(app)
        .post('/api/auth/google')
        .set('X-Forwarded-For', '10.1.0.60')
        .send({ userInfo: { email: 'victim@x.com', name: 'Attacker' } });
      assert.ok(takeoverRes.status === 400 || takeoverRes.status === 401, 'Takeover payload without ID token must fail');

      const origVerifyGoogle = socialAuth.verifyGoogleIdToken;
      try {
        // 1. New Google user
        socialAuth.verifyGoogleIdToken = async () => ({
          sub: 'google-sub-1001',
          email: 'google.new@example.com',
          name: 'Google New',
          avatar: 'https://lh3.googleusercontent.com/a/avatar.png',
          emailVerified: true
        });
        const gRes1 = await request(app)
          .post('/api/auth/google')
          .set('X-Forwarded-For', '10.1.0.61')
          .send({ credential: 'mock-valid-google-id-token' });
        assert.strictEqual(gRes1.status, 200);
        assert.ok(gRes1.body.token);
        assert.strictEqual(gRes1.body.user.email, 'google.new@example.com');

        // 2. Same Google email again -> same user, no duplicate
        const gRes2 = await request(app)
          .post('/api/auth/google')
          .set('X-Forwarded-For', '10.1.0.61')
          .send({ credential: 'mock-valid-google-id-token' });
        assert.strictEqual(gRes2.status, 200);
        const dupCount = await User.countDocuments({ email: 'google.new@example.com' });
        assert.strictEqual(dupCount, 1);

        // 3. Existing password user gets linked with Google
        socialAuth.verifyGoogleIdToken = async () => ({
          sub: 'google-sub-alice',
          email: userEmail,
          name: 'Alice Updated',
          avatar: '',
          emailVerified: true
        });
        const linkRes = await request(app)
          .post('/api/auth/google')
          .set('X-Forwarded-For', '10.1.0.61')
          .send({ credential: 'mock-valid-google-link-token' });
        assert.strictEqual(linkRes.status, 200);
        const linkedUser = await User.findOne({ email: userEmail });
        assert.strictEqual(linkedUser.googleId, 'google-sub-alice');
        assert.ok(linkedUser.authProviders.includes('google'));

        // 4. Invalid token -> 401
        socialAuth.verifyGoogleIdToken = async () => {
          const e = new Error('Invalid or expired Google credential.');
          e.statusCode = 401;
          throw e;
        };
        const badTokRes = await request(app)
          .post('/api/auth/google')
          .set('X-Forwarded-For', '10.1.0.62')
          .send({ credential: 'bad-token' });
        assert.strictEqual(badTokRes.status, 401);

        // 5. email_verified=false -> rejected
        socialAuth.verifyGoogleIdToken = async () => {
          const e = new Error('Google account email is not verified.');
          e.statusCode = 401;
          throw e;
        };
        const unverifiedGRes = await request(app)
          .post('/api/auth/google')
          .set('X-Forwarded-For', '10.1.0.62')
          .send({ credential: 'unverified-email-token' });
        assert.strictEqual(unverifiedGRes.status, 401);
      } finally {
        socialAuth.verifyGoogleIdToken = origVerifyGoogle;
      }
    });

    await test('A7. Apple Sign-In: missing APPLE_CLIENT_ID -> clear not configured error; valid/invalid mocked tokens', async () => {
      delete process.env.APPLE_CLIENT_ID;
      const unconfRes = await request(app)
        .post('/api/auth/apple')
        .set('X-Forwarded-For', '10.1.0.70')
        .send({ identityToken: 'dummy' });
      assert.strictEqual(unconfRes.status, 503);
      assert.ok(/not configured/i.test(unconfRes.body.error));

      process.env.APPLE_CLIENT_ID = 'com.healink.web';
      const origVerifyApple = socialAuth.verifyAppleIdentityToken;
      try {
        // First login with private relay + user.name
        socialAuth.verifyAppleIdentityToken = async () => ({
          sub: 'apple-sub-001',
          email: 'xyz123@privaterelay.appleid.com',
          emailVerified: true,
          isPrivateEmail: true
        });
        const aRes1 = await request(app)
          .post('/api/auth/apple')
          .set('X-Forwarded-For', '10.1.0.71')
          .send({
            identityToken: 'mock-apple-token-1',
            user: { name: { firstName: 'Sara', lastName: 'Apple' } }
          });
        assert.strictEqual(aRes1.status, 200);
        assert.ok(aRes1.body.token);
        assert.strictEqual(aRes1.body.user.name, 'Sara Apple');

        // Subsequent login where Apple omits email -> matches by appleId (sub)
        socialAuth.verifyAppleIdentityToken = async () => ({
          sub: 'apple-sub-001',
          email: '',
          emailVerified: false,
          isPrivateEmail: false
        });
        const aRes2 = await request(app)
          .post('/api/auth/apple')
          .set('X-Forwarded-For', '10.1.0.71')
          .send({ identityToken: 'mock-apple-token-subsequent' });
        assert.strictEqual(aRes2.status, 200);
        assert.strictEqual(aRes2.body.user.email, 'xyz123@privaterelay.appleid.com');

        // Wrong aud / expired token -> 401
        socialAuth.verifyAppleIdentityToken = async () => {
          const e = new Error('Invalid or expired Apple identityToken.');
          e.statusCode = 401;
          throw e;
        };
        const badAppleRes = await request(app)
          .post('/api/auth/apple')
          .set('X-Forwarded-For', '10.1.0.72')
          .send({ identityToken: 'expired-or-wrong-aud-token' });
        assert.strictEqual(badAppleRes.status, 401);
      } finally {
        socialAuth.verifyAppleIdentityToken = origVerifyApple;
        delete process.env.APPLE_CLIENT_ID;
      }
    });

    await test('A8. JWT tampering, expired token, and missing token return 401 on protected routes', async () => {
      const protectedRoutes = [
        ['get', '/api/auth/me'],
        ['get', '/api/links'],
        ['get', '/api/qrs'],
        ['get', '/api/bios'],
        ['get', '/api/domains'],
        ['get', '/api/analytics/overview'],
        ['get', '/api/dashboard/summary'],
        ['get', '/api/notifications']
      ];
      const expiredToken = jwt.sign({ email: userEmail, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '-10s' });
      const tamperedToken = jwt.sign({ email: userEmail, role: 'admin' }, 'wrong_secret_key_for_tamper_test_32ch');

      for (const [method, route] of protectedRoutes) {
        const missingRes = await request(app)[method](route);
        assert.strictEqual(missingRes.status, 401, `${route} without token must be 401`);
        const expRes = await request(app)[method](route).set('Authorization', `Bearer ${expiredToken}`);
        assert.strictEqual(expRes.status, 401, `${route} with expired token must be 401`);
        const tampRes = await request(app)[method](route).set('Authorization', `Bearer ${tamperedToken}`);
        assert.strictEqual(tampRes.status, 401, `${route} with tampered token must be 401`);
      }
    });

    // =========================================================================
    // B. DATA TESTS (Against MongoDB Only)
    // =========================================================================
    console.log('\n🗄️  Section B: MongoDB Data Integrity, Isolation & Billing Tests');

    // Create User B cleanly via Mongo
    const regB = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.2.0.1')
      .send({ name: 'Bob Isolation', email: 'bob_iso@example.com', password: 'BobPassword123!' });
    assert.strictEqual(regB.status, 200);
    const otpB = capturedOtps.get('bob_iso@example.com');
    const verB = await request(app)
      .post('/api/auth/verify-email')
      .set('X-Forwarded-For', '10.2.0.1')
      .send({ email: 'bob_iso@example.com', code: otpB });
    const tokenB = verB.body.token;

    let createdLinkSlug = 'mongo-custom-1';
    let createdQrId = '';

    await test('B1. Links: random & custom slug, duplicate -> 409, list/edit/delete, 302 redirect, clicks increment, expired/disabled handled', async () => {
      // Custom slug
      const l1 = await request(app)
        .post('/api/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dest: 'https://example.org/landing', slug: createdLinkSlug, title: 'Mongo Link 1' });
      assert.strictEqual(l1.status, 200);
      assert.strictEqual(l1.body.link.slug, createdLinkSlug);

      // Random slug
      const l2 = await request(app)
        .post('/api/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dest: 'https://example.org/random' });
      assert.strictEqual(l2.status, 200);
      assert.ok(l2.body.link.slug);

      // Duplicate custom slug -> 409
      const dupRes = await request(app)
        .post('/api/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dest: 'https://example.org/other', slug: createdLinkSlug });
      assert.strictEqual(dupRes.status, 409);

      // List only my links
      const listA = await request(app)
        .get('/api/links')
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(listA.status, 200);
      assert.ok(listA.body.links.some((x) => x.slug === createdLinkSlug));

      // Edit link
      const editA = await request(app)
        .put(`/api/links/${createdLinkSlug}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Mongo Link Updated' });
      assert.strictEqual(editA.status, 200);
      assert.strictEqual(editA.body.link.title, 'Mongo Link Updated');

      // Redirect -> 302 and click analytics increment
      const redirRes = await request(app).get(`/${createdLinkSlug}`).set('User-Agent', 'Mozilla/5.0 Chrome/120.0');
      assert.strictEqual(redirRes.status, 302);
      assert.strictEqual(redirRes.headers.location, 'https://example.org/landing');

      await new Promise((r) => setTimeout(r, 150)); // allow setImmediate telemetry write
      const updatedLink = await Link.findOne({ slug: createdLinkSlug });
      assert.ok(updatedLink.totalClicks >= 1, 'Click count incremented in MongoDB');

      // Expired link -> 410 Gone
      await Link.create({
        ownerEmail: userEmail,
        slug: 'expired-mongo-link',
        dest: 'https://example.org/old',
        expiresAt: new Date(Date.now() - 60000)
      });
      const expRes = await request(app).get('/expired-mongo-link');
      assert.strictEqual(expRes.status, 410);
    });

    await test('B2 & B3 & B4. QR + Bio CRUD, free vs Pro limits, and strict cross-user isolation (403/404)', async () => {
      // QR Create / List
      const qrRes = await request(app)
        .post('/api/qrs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Alice QR', dest: 'https://example.org/qr', color: '#0070f3' });
      assert.strictEqual(qrRes.status, 200);
      createdQrId = qrRes.body.qr._id;

      // Bio Create / Public render
      const bioRes = await request(app)
        .post('/api/bios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ slug: 'alice-mongo-bio', title: 'Alice Bio', links: [{ label: 'Site', url: 'https://example.org' }] });
      assert.strictEqual(bioRes.status, 200);

      // Free limit (1 bioPage) enforced on 2nd bio page
      const bioLimitRes = await request(app)
        .post('/api/bios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ slug: 'alice-second-bio', title: 'Blocked 2nd Bio' });
      assert.strictEqual(bioLimitRes.status, 403);
      assert.strictEqual(bioLimitRes.body.code, 'PLAN_LIMIT_REACHED');

      const bioPublicRes = await request(app).get('/m/alice-mongo-bio');
      assert.strictEqual(bioPublicRes.status, 200);
      assert.ok(bioPublicRes.text.includes('Alice Bio'));

      // Isolation: User B cannot read/edit/delete User A's resources
      const bLinks = await request(app).get('/api/links').set('Authorization', `Bearer ${tokenB}`);
      assert.strictEqual(bLinks.body.links.some((x) => x.slug === createdLinkSlug), false);

      const bEditLink = await request(app)
        .put(`/api/links/${createdLinkSlug}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked' });
      assert.strictEqual(bEditLink.status, 403);

      const bDelLink = await request(app)
        .delete(`/api/links/${createdLinkSlug}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.strictEqual(bDelLink.status, 403);

      const bDelQr = await request(app)
        .delete(`/api/qrs/${createdQrId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.strictEqual(bDelQr.status, 403);

      const bDelBio = await request(app)
        .delete('/api/bios/alice-mongo-bio')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.strictEqual(bDelBio.status, 403);

      // User A can delete their own QR, Bio, Link
      assert.strictEqual((await request(app).delete(`/api/qrs/${createdQrId}`).set('Authorization', `Bearer ${userToken}`)).status, 200);
      assert.strictEqual((await request(app).delete('/api/bios/alice-mongo-bio').set('Authorization', `Bearer ${userToken}`)).status, 200);
      assert.strictEqual((await request(app).delete(`/api/links/${createdLinkSlug}`).set('Authorization', `Bearer ${userToken}`)).status, 200);
    });

    await test('B5. Custom domains (free limit 0 + Pro custom domain CRUD) & Analytics overview', async () => {
      const domFreeRes = await request(app)
        .post('/api/domains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ domain: 'links.alice.org' });
      assert.strictEqual(domFreeRes.status, 403);

      const anRes = await request(app)
        .get('/api/analytics/overview?range=7d')
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(anRes.status, 200);
      assert.ok(typeof anRes.body.totalClicks === 'number');
    });

    await test('B6. Billing: mocked Stripe webhook upgrades user to Pro & idempotency prevents replay', async () => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const eventPayload = JSON.stringify({
        id: 'evt_mongo_idempotent_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            amount_total: 1200,
            customer_email: userEmail,
            metadata: { userEmail, plan: 'Core PRO' }
          }
        }
      });
      const sigHeader = stripe.webhooks.generateTestHeaderString({
        payload: eventPayload,
        secret: process.env.STRIPE_WEBHOOK_SECRET
      });

      const wh1 = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', sigHeader)
        .set('Content-Type', 'application/json')
        .send(eventPayload);
      assert.strictEqual(wh1.status, 200);
      assert.strictEqual(wh1.body.received, true);

      const upgraded = await User.findOne({ email: userEmail });
      assert.strictEqual(upgraded.isPro, true);
      assert.strictEqual(upgraded.plan, 'Core PRO');

      // Replay same webhook event -> alreadyProcessed: true, only 1 ProcessedPayment record
      const wh2 = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', sigHeader)
        .set('Content-Type', 'application/json')
        .send(eventPayload);
      assert.strictEqual(wh2.status, 200);
      assert.strictEqual(wh2.body.alreadyProcessed, true);
      assert.strictEqual(await ProcessedPayment.countDocuments({ paymentId: 'evt_mongo_idempotent_001' }), 1);

      // Now upgraded Pro user can add custom domain & User B cannot delete it
      const domProRes = await request(app)
        .post('/api/domains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ domain: 'go.alicepro.org' });
      assert.strictEqual(domProRes.status, 200);
      const bDelDom = await request(app)
        .delete('/api/domains/go.alicepro.org')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.strictEqual(bDelDom.status, 403);
    });

    await test('B7. Assist & Abuse-Report endpoints respond correctly against Mongo', async () => {
      const assistRes = await request(app)
        .post('/api/assist/generate')
        .send({ prompt: 'Suggest UTM tags for facebook ad' });
      assert.strictEqual(assistRes.status, 200);
      assert.strictEqual(assistRes.body.success, true);

      const abuseRes = await request(app)
        .post('/api/abuse/report')
        .send({ url: 'https://bad-example.org/phish', slug: 'phish1', reason: 'phishing' });
      assert.strictEqual(abuseRes.status, 200);
      assert.strictEqual(abuseRes.body.success, true);
    });

    await test('M1. Migration script (scripts/migrate-firebase-to-mongo.js) dry-run + idempotent live run', async () => {
      const sampleSnapshot = {
        users: {
          'legacy_user_dot_com': {
            profile: {
              email: 'legacy@user.com',
              name: 'Legacy User',
              provider: 'google',
              isVerified: true,
              createdAt: '2026-01-01T00:00:00.000Z'
            },
            links: {
              'mig-slug-1': {
                slug: 'mig-slug-1',
                dest: 'https://example.org/migrated',
                title: 'Migrated Link',
                clicks: 42,
                createdAt: '2026-01-02T00:00:00.000Z'
              }
            },
            qrs: {
              qr1: { title: 'Mig QR', dest: 'https://example.org/qr-mig', color: '#0070f3' }
            },
            bios: {
              'mig-bio-1': { slug: 'mig-bio-1', title: 'Migrated Bio', links: [] }
            }
          }
        }
      };

      const dryStats = await migrateSnapshot(sampleSnapshot, { dryRun: true });
      assert.strictEqual(dryStats.users.inserted, 1);
      assert.strictEqual(await User.findOne({ email: 'legacy@user.com' }), null, 'Dry run writes nothing');

      const liveStats = await migrateSnapshot(sampleSnapshot, { dryRun: false });
      assert.strictEqual(liveStats.users.inserted, 1);
      assert.strictEqual(liveStats.links.inserted, 1);
      assert.strictEqual(liveStats.qrs.inserted, 1);
      assert.strictEqual(liveStats.bios.inserted, 1);

      // Re-run (idempotency check)
      const secondStats = await migrateSnapshot(sampleSnapshot, { dryRun: false });
      assert.strictEqual(secondStats.users.inserted, 0);
      assert.strictEqual(secondStats.links.inserted, 0);
      assert.strictEqual(secondStats.users.skipped, 1);
    });

    // =========================================================================
    // C & B8. DISCONNECTED MONGO (503) & STATIC CHECKS
    // =========================================================================
    console.log('\n🚫 Section C & B8: Disconnected DB 503 Guard & Static Checks');

    await test('B8. Disconnected MongoDB returns HTTP 503 across API endpoints (never fake memStore)', async () => {
      await mongoose.disconnect();
      const me503 = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(me503.status, 503);
      assert.strictEqual(me503.body.code, 'DATABASE_UNAVAILABLE');

      const links503 = await request(app).get('/api/links').set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(links503.status, 503);

      const reg503 = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.3.0.1')
        .send({ name: 'Down', email: 'down@example.com', password: 'Password123!' });
      assert.strictEqual(reg503.status, 503);
    });

    await test('C. Static gate: zero Firebase references in live code + npm run lint clean', async () => {
      const rootDir = path.join(__dirname, '..');
      const allow = new Set([
        'CHANGELOG.md',
        path.join('docs', 'CHANGELOG.md'),
        'MIGRATION.md',
        'MIGRATION_MAP.md',
        'RESTRUCTURE_PLAN.md',
        path.join('docs', 'RESTRUCTURE_PLAN.md'),
        'SECURITY_CHECKLIST.md',
        path.join('scripts', 'migrate-firebase-to-mongo.js'),
        'MIGRATION_REPORT.md'
      ]);
      const excludeDirs = new Set(['node_modules', '.git', 'archive', '.gemini', 'test-artifacts', 'tests']);
      const hits = [];

      function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (excludeDirs.has(entry.name)) continue;
          const full = path.join(dir, entry.name);
          const rel = path.relative(rootDir, full);
          if (entry.isDirectory()) {
            walk(full);
          } else if (!allow.has(rel)) {
            try {
              const text = fs.readFileSync(full, 'utf8');
              if (/firebase/i.test(text)) hits.push(rel);
            } catch (_e) {}
          }
        }
      }
      walk(rootDir);
      assert.deepStrictEqual(hits, [], `Unexpected firebase references found in: ${hits.join(', ')}`);

      execSync('npm run lint', { cwd: rootDir, stdio: 'pipe' });
    });

    console.log(`\n🎉 ALL ${passed} MIGRATION & MONGODB TEST CASES PASSED!\n`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('❌ Migration test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
