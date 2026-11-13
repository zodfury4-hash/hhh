/**
 * HEA Link Baseline Test Suite (Phase 0)
 * Verifies core server initialization, Mongoose schemas, router mounting, and HTTP endpoints.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

// Ensure test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // ephemeral port

console.log('🧪 Starting HEA Link Baseline Test Suite...\n');

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
  console.log('📦 Module & Schema Integrity:');

  it('Mongoose User model loads and has required fields', () => {
    const User = require('../backend/models/User');
    assert.ok(User.schema.paths.email, 'User model should have email path');
    assert.ok(User.schema.paths.password, 'User model should have password path');
    assert.ok(User.schema.paths.isVerified, 'User model should have isVerified path');
  });

  it('Mongoose Link model loads and has slug and dest paths', () => {
    const Link = require('../backend/models/Link');
    assert.ok(Link.schema.paths.slug, 'Link model should have slug path');
    assert.ok(Link.schema.paths.dest, 'Link model should have dest path');
    assert.ok(Link.schema.paths.ownerEmail, 'Link model should have ownerEmail path');
  });

  it('Mongoose QRCode model loads', () => {
    const QRCode = require('../backend/models/QRCode');
    assert.ok(QRCode.schema.paths.dest, 'QRCode model should have dest path');
  });

  it('Mongoose BioPage model loads', () => {
    const BioPage = require('../backend/models/BioPage');
    assert.ok(BioPage.schema.paths.slug, 'BioPage model should have slug path');
  });

  it('Mongoose CustomDomain model loads', () => {
    const CustomDomain = require('../backend/models/CustomDomain');
    assert.ok(CustomDomain.schema.paths.domain, 'CustomDomain model should have domain path');
  });

  it('Express app shell loads without unhandled exceptions', () => {
    const app = require('../backend/server');
    assert.ok(app && typeof app.listen === 'function', 'Server should export Express application');
  });

  console.log('\n🌐 Live Server & HTTP Endpoints:');

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

  await itAsync('GET /login redirects to /#login', async () => {
    const res = await request(server, '/login');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/#login');
  });

  await itAsync('GET /dashboard redirects to /#dashboard', async () => {
    const res = await request(server, '/dashboard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/#dashboard');
  });

  await itAsync('Security guard blocks access to .env file', async () => {
    const res = await request(server, '/.env');
    assert.strictEqual(res.status, 403);
  });

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
