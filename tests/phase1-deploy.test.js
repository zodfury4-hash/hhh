'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

const app = require('../backend/server');
const config = require('../backend/config');

async function runPhase1Tests() {
  console.log('🧪 Running Phase 1 Render Target, Clean Routes & Strict Env Validator Tests...');

  // 1. One deployment target (Render): vercel.json & api/index.js must be deleted
  const root = path.join(__dirname, '..');
  assert(!fs.existsSync(path.join(root, 'CNAME')), 'CNAME must be removed');
  assert(!fs.existsSync(path.join(root, '.nojekyll')), '.nojekyll must be removed');
  assert(!fs.existsSync(path.join(root, 'vercel.json')), 'vercel.json must be deleted for single Render target');
  assert(!fs.existsSync(path.join(root, 'api', 'index.js')), 'api/index.js must be deleted');
  assert(fs.existsSync(path.join(root, 'render.yaml')), 'render.yaml must exist for Render deployment');
  assert(fs.existsSync(path.join(root, 'Dockerfile')), 'Dockerfile must exist');
  assert(fs.existsSync(path.join(root, 'docs', 'DEPLOY.md')), 'docs/DEPLOY.md must exist');
  const errHtml = fs.readFileSync(path.join(root, 'public', '404.html'), 'utf8');
  assert(!errHtml.includes('hea_slug_'), '404.html must not contain GitHub Pages localStorage redirect hack');
  console.log('  ✅ PASS: Single deployment target (Render) artifacts verified');

  // 2. Strict startup env validator (validateEnv) tests
  // 2.1 MONGODB_URI missing or pointing to localhost
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb://127.0.0.1:27017/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store',
          EMAIL_PROVIDER: 'resend',
          EMAIL_API_KEY: 're_test_key_12345',
          GOOGLE_CLIENT_ID: '12345-abc.apps.googleusercontent.com'
        }
      }),
    /MONGODB_URI/
  );

  // 2.2 JWT_SECRET missing or short
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'short',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store',
          EMAIL_PROVIDER: 'resend',
          EMAIL_API_KEY: 're_test_key_12345',
          GOOGLE_CLIENT_ID: '12345-abc.apps.googleusercontent.com'
        }
      }),
    /JWT_SECRET/
  );

  // 2.3 Email missing in production
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store',
          GOOGLE_CLIENT_ID: '12345-abc.apps.googleusercontent.com'
        }
      }),
    /email configuration/i
  );

  // 2.4 GOOGLE_CLIENT_ID missing in production
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store',
          EMAIL_PROVIDER: 'resend',
          EMAIL_API_KEY: 're_test_key_12345'
        }
      }),
    /GOOGLE_CLIENT_ID/
  );

  // 2.5 Valid production env - Apple login stays hidden if APPLE_CLIENT_ID is not set
  const validProdNoApple = config.validateEnv({
    env: 'production',
    silent: true,
    rawEnv: {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
      JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
      INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
      CORS_ORIGIN: 'https://www.healink.store',
      EMAIL_PROVIDER: 'resend',
      EMAIL_API_KEY: 're_test_key_12345',
      GOOGLE_CLIENT_ID: '12345-abc.apps.googleusercontent.com'
    }
  });
  assert.strictEqual(validProdNoApple.valid, true);
  assert.strictEqual(validProdNoApple.features.emailVerification, true);
  assert.strictEqual(validProdNoApple.features.googleAuth, true);
  assert.strictEqual(validProdNoApple.features.appleAuth, false, 'Apple login must stay hidden when APPLE_CLIENT_ID is unset');

  // 2.6 Valid production with Apple enabled
  const validProdWithApple = config.validateEnv({
    env: 'production',
    silent: true,
    rawEnv: {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
      JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
      INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
      CORS_ORIGIN: 'https://www.healink.store',
      EMAIL_PROVIDER: 'resend',
      EMAIL_API_KEY: 're_test_key_12345',
      GOOGLE_CLIENT_ID: '12345-abc.apps.googleusercontent.com',
      APPLE_CLIENT_ID: 'com.healink.service'
    }
  });
  assert.strictEqual(validProdWithApple.features.appleAuth, true);
  console.log('  ✅ PASS: validateEnv() strictly fails on missing MONGODB_URI, JWT, Email, or Google; hides Apple when unset');

  // 3. HTTP routes served from Node server: /pricing, /integrations, /developers return 200, POST /api/auth/* never 405
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const requiredPages = ['/pricing', '/integrations', '/developers'];
    for (const p of requiredPages) {
      const res = await fetch(`${baseUrl}${p}`);
      assert.strictEqual(res.status, 200, `${p} must return 200`);
      const body = await res.text();
      assert(body.length > 500, `${p} must return real page content`);
      assert(res.headers.get('content-type')?.includes('text/html'), `${p} must return text/html`);
    }
    console.log('  ✅ PASS: /pricing, /integrations, and /developers return real 200 pages (never 404)');

    const authEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/verify-email',
      '/api/auth/resend-code',
      '/api/auth/forgot-password'
    ];

    for (const ep of authEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.notStrictEqual(res.status, 405, `${ep} must NEVER return 405 Method Not Allowed`);
      assert(res.status >= 200 && res.status < 500, `${ep} returned unexpected status ${res.status}`);
    }
    console.log('  ✅ PASS: POST /api/auth/* endpoints return 200/4xx and NEVER 405 Method Not Allowed');
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
  runPhase1Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 1 test failed:', err);
      process.exit(1);
    });
}

module.exports = runPhase1Tests;
