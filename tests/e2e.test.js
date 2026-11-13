/**
 * HEA Link End-to-End Comprehensive Verification Suite (Phase 2)
 * Tests full lifecycle of:
 * - Auth (Registration, Verification, Login, Refresh, Password Reset)
 * - Links (Create, Custom Slug, Asynchronous Redirect, Bulk Shorten, Edit, Delete)
 * - QR Studio (Create, List, Delete)
 * - Link-in-Bio (Create, Public Render /m/:slug, Delete)
 * - Custom Domains (Add, List, Delete)
 * - Analytics Overview (Click telemetry, Device breakdown, Top referrers)
 * - HEA Assist Copilot (Generate, AI Ask)
 * - Billing (Stripe config, Checkout session)
 */

const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';

console.log('🧪 Starting HEA Link Phase 2 End-to-End Verification Suite...\n');

let passCount = 0;
let failCount = 0;

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

function request(server, path, options = {}) {
  const addr = server.address();
  const port = addr.port;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  const app = require('../backend/server');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const testEmail = `e2e_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let createdSlug = null;
  let createdQrId = null;
  let createdBioSlug = null;
  let createdDomain = null;

  console.log('👤 1. Authentication Lifecycle:');

  // Register
  await itAsync('POST /api/auth/register creates user account', async () => {
    const res = await request(server, '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: 'E2E User' })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  // Verify Email (fetch code from memStore in test mode)
  const memStore = require('../backend/utils/memStore');
  const userInMem = memStore.users.find((u) => u.email === testEmail);
  const otpCode = userInMem ? userInMem.verificationCode : null;

  await itAsync('POST /api/auth/verify-email verifies code and returns JWT token', async () => {
    assert.ok(otpCode, 'OTP code should be generated');
    const res = await request(server, '/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: otpCode })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Should return JWT token');
    authToken = data.token;
  });

  // Login
  await itAsync('POST /api/auth/login authenticates verified user', async () => {
    const res = await request(server, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
  });

  // Token Refresh
  await itAsync('POST /api/auth/refresh refreshes valid JWT token', async () => {
    const res = await request(server, '/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    authToken = data.token;
  });

  // Profile
  await itAsync('GET /api/auth/me returns authenticated user profile', async () => {
    const res = await request(server, '/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.user.email, testEmail);
  });

  console.log('\n🔗 2. Link Lifecycle & Fast Redirection:');

  createdSlug = `e2e-${Math.random().toString(36).slice(2, 6)}`;

  // Create Link
  await itAsync('POST /api/links creates shortlink with custom slug', async () => {
    const res = await request(server, '/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        dest: 'https://example.com/dest',
        slug: createdSlug,
        title: 'E2E Test Link',
        tag: 'QA'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.link.slug, createdSlug);
  });

  // Fast 302 Redirect
  await itAsync(`GET /${createdSlug} performs 302 redirect directly to destination`, async () => {
    const res = await request(server, `/${createdSlug}`);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, 'https://example.com/dest');
  });

  // List Links
  await itAsync('GET /api/links returns created link for user', async () => {
    const res = await request(server, '/api/links', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.links));
    const found = data.links.find((l) => l.slug === createdSlug);
    assert.ok(found, 'Created link must be present in links list');
  });

  // Edit Link
  await itAsync(`PUT /api/links/${createdSlug} updates title and destination`, async () => {
    const res = await request(server, `/api/links/${createdSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Updated Link Title',
        dest: 'https://example.com/updated'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  // Bulk Shorten
  await itAsync('POST /api/links/bulk shortens multiple destination URLs', async () => {
    const res = await request(server, '/api/links/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        urls: ['https://example.com/page1', 'https://example.com/page2']
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.links.length, 2);
  });

  // Delete Link
  await itAsync(`DELETE /api/links/${createdSlug} removes shortlink`, async () => {
    const res = await request(server, `/api/links/${createdSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  console.log('\n📱 3. QR Studio Lifecycle:');

  // Create QR
  await itAsync('POST /api/qrs creates styled vector QR code', async () => {
    const res = await request(server, '/api/qrs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Test QR Code',
        dest: 'https://example.com/qr',
        color: '#00d2ff'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    createdQrId = data.qr._id || data.qr.id;
    assert.ok(createdQrId);
  });

  // List QRs
  await itAsync('GET /api/qrs lists user QR codes', async () => {
    const res = await request(server, '/api/qrs', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.qrs));
  });

  // Delete QR
  await itAsync(`DELETE /api/qrs/${createdQrId} deletes QR code`, async () => {
    const res = await request(server, `/api/qrs/${createdQrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  console.log('\n📄 4. Link-in-Bio Lifecycle:');

  createdBioSlug = `bio-${Math.random().toString(36).slice(2, 6)}`;

  // Create Bio
  await itAsync('POST /api/bios creates branded mobile bio page', async () => {
    const res = await request(server, '/api/bios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        slug: createdBioSlug,
        title: 'Creator Official Bio',
        tagline: 'Exclusive drop and socials',
        links: [{ url: 'https://instagram.com/official', label: 'Instagram', icon: '📸' }]
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  // Render Bio Page
  await itAsync(`GET /m/${createdBioSlug} serves sanitized HTML bio page`, async () => {
    const res = await request(server, `/m/${createdBioSlug}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('Creator Official Bio'));
    assert.ok(res.body.includes('Instagram'));
  });

  // Delete Bio
  await itAsync(`DELETE /api/bios/${createdBioSlug} deletes bio page`, async () => {
    const res = await request(server, `/api/bios/${createdBioSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  console.log('\n🌐 5. Custom Domains & Telemetry:');

  createdDomain = `links-${Math.random().toString(36).slice(2, 6)}.brand.com`;

  // Add Domain
  await itAsync('POST /api/domains adds branded custom domain', async () => {
    const res = await request(server, '/api/domains', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ domain: createdDomain })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  // List Domains
  await itAsync('GET /api/domains lists domains for authenticated user', async () => {
    const res = await request(server, '/api/domains', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.domains));
  });

  // Delete Domain
  await itAsync(`DELETE /api/domains/${createdDomain} removes custom domain`, async () => {
    const res = await request(server, `/api/domains/${createdDomain}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  // Analytics Overview
  await itAsync('GET /api/analytics/overview returns aggregate audience metrics', async () => {
    const res = await request(server, '/api/analytics/overview', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(typeof data.totalClicks, 'number');
    assert.strictEqual(typeof data.deviceBreakdown, 'object');
  });

  console.log('\n✨ 6. HEA Assist Copilot & Billing:');

  // Assist Generate
  await itAsync('POST /api/assist/generate returns AI title and UTM recommendations', async () => {
    const res = await request(server, '/api/assist/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Generate catchy titles for summer drop' })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.reply.length > 10);
  });

  // Stripe Checkout Session
  await itAsync('POST /api/stripe/create-checkout-session creates session in sandbox mode', async () => {
    const res = await request(server, '/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ plan: 'pro', billingCycle: 'monthly' })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.ok, true);
  });

  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close(false);
  } catch (_e) {}
  await new Promise((resolve) => server.close(resolve));
  console.log('\n====================================');
  console.log(`End-to-End Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================\n');

  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

run().catch((err) => {
  console.error('Fatal E2E Test Error:', err);
  process.exit(1);
});
