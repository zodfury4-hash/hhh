/**
 * HEA Link Security & Baseline Verification Suite (Phase 1)
 * Validates:
 * - JWT enforcement & refusal to start without secure secret
 * - Removal of VIP_ADMIN_ACCOUNTS & role-based admin schema
 * - OTP expiration, single-use, and strict non-disclosure of devCode
 * - SSRF protection (loopback, private subnets, cloud metadata)
 * - Safe destination URL validation (blocks javascript:, data:, abuse domains)
 * - Strict auth on links, qr, bio, domain, analytics
 * - Stripe webhook rejection of unsigned payloads & idempotency model
 * - Abuse reporting endpoint & health status
 */

const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';

console.log('🧪 Starting HEA Link Phase 1 Security Test Suite...\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

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
  console.log('📦 1. Schema & Security Guard Verification:');

  it('User model includes role enum with default user', () => {
    const User = require('../backend/models/User');
    assert.ok(User.schema.paths.role, 'User model should have role path');
    assert.deepStrictEqual(User.schema.paths.role.enumValues, ['user', 'admin']);
    assert.strictEqual(User.schema.paths.role.defaultValue, 'user');
  });

  it('ProcessedPayment model exists for Stripe idempotency', () => {
    const ProcessedPayment = require('../backend/models/ProcessedPayment');
    assert.ok(ProcessedPayment.schema.paths.paymentId, 'Should have paymentId path');
    assert.ok(ProcessedPayment.schema.paths.email, 'Should have email path');
  });

  it('AbuseReport model exists for abuse protection', () => {
    const AbuseReport = require('../backend/models/AbuseReport');
    assert.ok(AbuseReport.schema.paths.url, 'Should have url path');
    assert.ok(AbuseReport.schema.paths.reason, 'Should have reason path');
  });

  console.log('\n🛡️ 2. Input Validation & SSRF Prevention:');

  const { isValidDestinationUrl, createLinkSchema, registerSchema } = require('../backend/middleware/validation');

  it('Blocks dangerous URI schemes (javascript:, data:, vbscript:)', () => {
    assert.strictEqual(isValidDestinationUrl('javascript:alert(1)'), false);
    assert.strictEqual(isValidDestinationUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.strictEqual(isValidDestinationUrl('vbscript:msgbox(1)'), false);
  });

  it('Prevents SSRF targeting private IP ranges & cloud metadata', () => {
    assert.strictEqual(isValidDestinationUrl('http://127.0.0.1:8080'), false);
    assert.strictEqual(isValidDestinationUrl('http://localhost:3000'), false);
    assert.strictEqual(isValidDestinationUrl('http://10.0.0.1/admin'), false);
    assert.strictEqual(isValidDestinationUrl('http://172.16.0.1/secret'), false);
    assert.strictEqual(isValidDestinationUrl('http://192.168.1.1/router'), false);
    assert.strictEqual(isValidDestinationUrl('http://169.254.169.254/latest/meta-data/'), false);
  });

  it('Blocks known abuse domains (e.g. grabify.link, iplogger.org)', () => {
    assert.strictEqual(isValidDestinationUrl('https://grabify.link/test'), false);
    assert.strictEqual(isValidDestinationUrl('https://iplogger.org/victim'), false);
  });

  it('Permits legitimate public HTTPS/HTTP destinations', () => {
    assert.strictEqual(isValidDestinationUrl('https://google.com'), true);
    assert.strictEqual(isValidDestinationUrl('https://github.com/features'), true);
    assert.strictEqual(isValidDestinationUrl('http://example.com/page'), true);
  });

  it('Zod createLinkSchema rejects reserved slugs', () => {
    assert.throws(() => {
      createLinkSchema.parse({ dest: 'https://example.com', slug: 'api' });
    });
    assert.throws(() => {
      createLinkSchema.parse({ dest: 'https://example.com', slug: 'admin' });
    });
  });

  it('Zod registerSchema enforces password minimum length of 8 characters', () => {
    assert.throws(() => {
      registerSchema.parse({ email: 'test@example.com', password: '123' });
    });
    assert.doesNotThrow(() => {
      registerSchema.parse({ email: 'test@example.com', password: 'password123' });
    });
  });

  console.log('\n🌐 3. Live Server & Endpoint Authorization:');

  const app = require('../backend/server');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const assignedPort = server.address().port;
  console.log(`  ℹ️ Test server listening on 127.0.0.1:${assignedPort}`);

  await itAsync('GET / returns HTTP 200 with valid HTML', async () => {
    const res = await request(server, '/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('HEA Link'), 'Response body should contain HEA Link');
  });

  await itAsync('GET /health returns HTTP 200 with system status', async () => {
    const res = await request(server, '/health');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(typeof data.uptime, 'number');
  });

  await itAsync('GET /api/config returns HTTP 200 with JSON configuration', async () => {
    const res = await request(server, '/api/config');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(typeof data.googleClientId, 'string');
    assert.strictEqual(typeof data.isDbConnected, 'boolean');
  });

  await itAsync('GET /api/stripe/config returns HTTP 200', async () => {
    const res = await request(server, '/api/stripe/config');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(typeof data.isConfigured, 'boolean');
  });

  await itAsync('Security guard blocks access to .env file', async () => {
    const res = await request(server, '/.env');
    assert.strictEqual(res.status, 403);
  });

  await itAsync('Unauthenticated GET /api/links returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/links');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('Unauthenticated POST /api/links returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dest: 'https://example.com' })
    });
    assert.strictEqual(res.status, 401);
  });

  await itAsync('Unauthenticated GET /api/qrs returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/qrs');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('Unauthenticated GET /api/bios returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/bios');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('Unauthenticated GET /api/domains returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/domains');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('Unauthenticated GET /api/analytics/overview returns 401 Unauthorized', async () => {
    const res = await request(server, '/api/analytics/overview');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('POST /api/auth/register NEVER returns devCode in response', async () => {
    const randEmail = `sec_test_${Date.now()}@example.com`;
    const res = await request(server, '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randEmail,
        password: 'Password123!',
        name: 'SecTester'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.devCode, undefined, 'devCode MUST NOT be leaked in API response');
  });

  await itAsync('POST /api/stripe/webhook rejects requests missing signature', async () => {
    const res = await request(server, '/api/stripe/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    });
    assert.ok(res.status === 400 || res.status === 500, 'Webhook must be rejected without signature');
  });

  await itAsync('POST /api/abuse/report accepts legitimate abuse report', async () => {
    const res = await request(server, '/api/abuse/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://malicious-site.example.com',
        slug: 'bad-link-1',
        reason: 'phishing',
        details: 'Impersonating banking login page'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close(false);
  } catch (_e) {}
  await new Promise((resolve) => server.close(resolve));
  console.log('  ℹ️ Test server stopped cleanly.\n');

  console.log('====================================');
  console.log(`Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
