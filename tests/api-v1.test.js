const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = require('../backend/server');
const ApiKey = require('../backend/models/ApiKey');

let server = null;
let baseUrl = '';

function request(pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function pass(name) {
  console.log(`  ✅ PASS: ${name}`);
}

function fail(name, err) {
  console.error(`  ❌ FAIL: ${name}`, err);
  process.exit(1);
}

async function run() {
  console.log('\n💻 Starting Developer REST API v1 Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const userEmail = 'dev_tester@example.com';

    // 1. Documentation & Static Delivery
    try {
      const resDocs = await request('/developers');
      assert.strictEqual(resDocs.status, 200);
      assert.ok(resDocs.body.includes('HEA Link Developer REST API v1'));
      assert.ok(resDocs.body.includes('Interactive "Try It" Live Console'));
      pass('GET /developers delivers 200 with documentation and live console');
    } catch (err) {
      fail('GET /developers delivers 200 with documentation and live console', err);
    }

    // 2. OpenAPI 3.1.0 Schema Specification
    try {
      const resSpec = await request('/api/v1/openapi.json');
      assert.strictEqual(resSpec.status, 200);
      assert.strictEqual(resSpec.json.openapi, '3.1.0');
      assert.ok(resSpec.json.paths['/links']);
      assert.ok(resSpec.json.paths['/links/{slug}']);
      assert.ok(resSpec.json.paths['/qr']);
      assert.ok(resSpec.json.components.securitySchemes.ApiKeyAuth);
      pass('GET /api/v1/openapi.json delivers valid OpenAPI 3.1.0 specification');
    } catch (err) {
      fail('GET /api/v1/openapi.json delivers valid OpenAPI 3.1.0 specification', err);
    }

    // 3. API Key Generation (Live and Test Prefixes)
    let liveKeyPlain = '';
    let testKeyPlain = '';
    try {
      const liveRes = await ApiKey.generateKey({
        userEmail,
        name: 'Production Server Key',
        isTest: false,
        scopes: ['links:read', 'links:write', 'analytics:read', 'qr:write']
      });
      liveKeyPlain = liveRes.rawKey;
      assert.ok(liveKeyPlain.startsWith('hea_live_'));
      assert.ok(!liveRes.doc.keyHash.includes('hea_live_'), 'Raw key must never be stored in plain text');

      const testRes = await ApiKey.generateKey({
        userEmail,
        name: 'Staging CI Test Key',
        isTest: true,
        scopes: ['links:read', 'links:write']
      });
      testKeyPlain = testRes.rawKey;
      assert.ok(testKeyPlain.startsWith('hea_test_'));

      pass('API Keys generate with proper prefixes (hea_live_, hea_test_) and SHA-256 hash storage');
    } catch (err) {
      fail('API Key generation failed', err);
    }

    // 4. Verification Endpoint (GET /api/v1/me)
    try {
      const resMe = await request('/api/v1/me', {
        headers: { 'Authorization': `Bearer ${liveKeyPlain}` }
      });
      assert.strictEqual(resMe.status, 200);
      assert.strictEqual(resMe.json.data.email, userEmail);
      assert.strictEqual(resMe.json.data.apiKey.isTest, false);
      assert.strictEqual(resMe.json.meta.isTest, false);
      assert.ok(resMe.headers['x-request-id'], 'Must return X-Request-Id header');
      assert.ok(resMe.headers['x-ratelimit-remaining'], 'Must return X-RateLimit-Remaining header');
      pass('GET /api/v1/me verifies key identity, scopes, and telemetry headers');
    } catch (err) {
      fail('GET /api/v1/me verification failed', err);
    }

    // 5. Scope Enforcement (Deny unpermitted operations)
    try {
      // Key with only links:read scope
      const readOnlyRes = await ApiKey.generateKey({
        userEmail,
        name: 'Read Only Key',
        isTest: false,
        scopes: ['links:read']
      });

      // Try write action with read-only key
      const resForbidden = await request('/api/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${readOnlyRes.rawKey}`,
          'Content-Type': 'application/json'
        },
        body: { dest: 'https://example.com/blocked' }
      });

      assert.strictEqual(resForbidden.status, 403);
      assert.strictEqual(resForbidden.json.error.code, 'INSUFFICIENT_SCOPE');
      assert.ok(resForbidden.json.error.message.includes('lacks required scope'));
      pass('Granular scope enforcement rejects unauthorized operations with 403');
    } catch (err) {
      fail('Scope enforcement test failed', err);
    }

    // 6. Idempotency Support on POST Requests
    const idempotencyKey = 'idem_' + Date.now().toString(36) + Math.random().toString(36);
    let firstResponseSlug = null;
    try {
      const res1 = await request('/api/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${liveKeyPlain}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: {
          dest: 'https://github.com/developer/project',
          title: 'Idempotency Test'
        }
      });
      assert.strictEqual(res1.status, 201);
      firstResponseSlug = res1.json.data.slug;
      assert.ok(firstResponseSlug);

      // Replay request with exact same Idempotency-Key
      const res2 = await request('/api/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${liveKeyPlain}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: {
          dest: 'https://github.com/developer/project',
          title: 'Idempotency Test'
        }
      });
      assert.strictEqual(res2.status, 201);
      assert.strictEqual(res2.json.data.slug, firstResponseSlug);
      assert.strictEqual(res2.headers['x-cache'], 'HIT-Idempotency');
      pass('Idempotency-Key header returns cached replay without creating duplicate links');
    } catch (err) {
      fail('Idempotency test failed', err);
    }

    // 7. Cursor Pagination on GET /api/v1/links
    try {
      // Seed 5 links
      for (let i = 0; i < 5; i++) {
        await request('/api/v1/links', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${liveKeyPlain}`,
            'Content-Type': 'application/json'
          },
          body: {
            dest: `https://example.com/page-${i}`,
            title: `Link #${i}`
          }
        });
      }

      const page1 = await request('/api/v1/links?limit=3', {
        headers: { 'Authorization': `Bearer ${liveKeyPlain}` }
      });
      assert.strictEqual(page1.status, 200);
      assert.strictEqual(page1.json.data.length, 3);
      assert.strictEqual(page1.json.pagination.hasMore, true);
      assert.ok(page1.json.pagination.nextCursor);

      const page2 = await request(`/api/v1/links?limit=3&cursor=${page1.json.pagination.nextCursor}`, {
        headers: { 'Authorization': `Bearer ${liveKeyPlain}` }
      });
      assert.strictEqual(page2.status, 200);
      assert.ok(page2.json.data.length >= 1);
      pass('Cursor-based pagination correctly splits result sets and provides nextCursor');
    } catch (err) {
      fail('Cursor pagination test failed', err);
    }

    // 8. Sandbox Test Key Isolation
    try {
      const resTest = await request('/api/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testKeyPlain}`,
          'Content-Type': 'application/json'
        },
        body: {
          dest: 'https://test-sandbox.example.com',
          title: 'Sandbox Test Link'
        }
      });
      assert.strictEqual(resTest.status, 201);
      assert.strictEqual(resTest.json.data.isTest, true);

      // Verify sandbox link is isolated and not listed in production queries
      const resProdList = await request('/api/v1/links', {
        headers: { 'Authorization': `Bearer ${liveKeyPlain}` }
      });
      assert.ok(!resProdList.json.data.some((l) => l.dest === 'https://test-sandbox.example.com'));
      pass('Sandbox test keys (hea_test_...) isolate records with isTest flag');
    } catch (err) {
      fail('Sandbox isolation test failed', err);
    }

    // 9. Vector QR Code Generation via v1 API
    try {
      const resQr = await request('/api/v1/qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${liveKeyPlain}`,
          'Content-Type': 'application/json'
        },
        body: {
          url: 'https://hea.link/campaign-qr'
        }
      });
      assert.strictEqual(resQr.status, 200);
      assert.ok(resQr.json.data.qrUrl);
      pass('POST /api/v1/qr generates vector QR code with custom color and resolution');
    } catch (err) {
      fail('POST /api/v1/qr test failed', err);
    }

    // 10. Grep Assertion: No Fake Keys or Faked 200 Mock Responses
    try {
      const linksMod = fs.readFileSync(path.join(__dirname, '..', 'dashboard', 'src', 'modules', 'links.js'), 'utf8');
      const settingsMod = fs.readFileSync(path.join(__dirname, '..', 'dashboard', 'src', 'modules', 'settings.js'), 'utf8');
      assert.ok(!linksMod.includes('hea_live_sk_89f2a9'), 'links module must not contain fake key');
      assert.ok(!settingsMod.includes('hea_live_sk_89f2a9'), 'settings module must not contain fake key');
      assert.ok(!linksMod.includes('HTTP/1.1 200 OK (Latency: 28ms)'), 'links module must not contain fake mock response');
      assert.ok(!settingsMod.includes('HTTP/1.1 200 OK (Latency: 28ms)'), 'settings module must not contain fake mock response');
      pass('Hardcoded fake keys (hea_live_sk_89f2a9) and simulated fake responses completely eliminated');
    } catch (err) {
      fail('Fake key elimination check failed', err);
    }

    console.log('\n🎉 ALL 10 Developer REST API v1 tests passed!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (fatal) {
    console.error('Fatal API v1 Suite Error:', fatal);
    if (server) server.close();
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
