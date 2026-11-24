const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');

const app = require('../backend/server');
const config = require('../backend/config');
const llmService = require('../backend/services/llm');
const Link = require('../backend/models/Link');

let server = null;
let baseUrl = '';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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

function makeToken(email, role = 'user') {
  return jwt.sign({ email, role, id: 'u_' + Date.now() }, config.jwtSecret, { expiresIn: '1h' });
}

async function run() {
  console.log('\n🧠 Starting AI Slug Generator Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // 1. GET /ai/slug-generator page serves 200 with HTML
    try {
      const res = await request('/ai/slug-generator');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('AI Short Link & Slug Generator'));
      pass('GET /ai/slug-generator returns 200 and renders HTML');
    } catch (err) {
      fail('GET /ai/slug-generator returns 200 and renders HTML', err);
    }

    // 2. Missing url validation
    try {
      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { tone: 'catchy' }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.json.error.toLowerCase().includes('url'));
      pass('POST /api/ai/slugs rejects missing url with 400');
    } catch (err) {
      fail('POST /api/ai/slugs rejects missing url with 400', err);
    }

    // 3. Invalid url scheme
    try {
      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { url: 'not-a-valid-url' }
      });
      assert.strictEqual(res.status, 400);
      pass('POST /api/ai/slugs rejects invalid URL format');
    } catch (err) {
      fail('POST /api/ai/slugs rejects invalid URL format', err);
    }

    // 4. SSRF block: localhost / loopback destination
    try {
      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { url: 'http://127.0.0.1:8080/admin' }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.json.error.includes('Restricted') || res.json.error.includes('private'));
      pass('POST /api/ai/slugs blocks SSRF targeting loopback/private addresses');
    } catch (err) {
      fail('POST /api/ai/slugs blocks SSRF targeting loopback/private addresses', err);
    }

    // 5. Fallback rule-based generation when AI is unconfigured
    try {
      llmService.resetMockProvider();
      // Ensure apiKey is temporarily empty for this test
      const origKey = config.ai.anthropicApiKey;
      config.ai.anthropicApiKey = '';

      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          url: 'https://example.com/products/wireless-earbuds-pro?ref=promo',
          tone: 'professional'
        }
      });

      config.ai.anthropicApiKey = origKey;

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      assert.strictEqual(res.json.isFallback, true);
      assert.ok(Array.isArray(res.json.candidates) && res.json.candidates.length > 0);
      assert.ok(res.json.candidates.some((c) => c.slug.includes('wireless') || c.slug.includes('earbuds')));
      pass('POST /api/ai/slugs delivers honest rule-based fallback when AI unconfigured');
    } catch (err) {
      fail('POST /api/ai/slugs delivers honest rule-based fallback when AI unconfigured', err);
    }

    // 6. Mocked AI generation with JSON schema validation & post-processing
    try {
      llmService.setMockProvider(async () => {
        return JSON.stringify([
          { slug: 'Summer-Sale-2026', rationale: 'Clean and seasonal', confidence: 0.98 },
          { slug: 'DROP-NOW!!!', rationale: 'High urgency', confidence: 0.92 },
          { slug: 'badword-special', rationale: 'Edge case test', confidence: 0.85 }
        ]);
      });

      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          url: 'https://myshop.com/catalog/summer-deals',
          brand: 'MyBrand',
          tone: 'catchy'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      assert.strictEqual(res.json.isFallback, false);

      const slugs = res.json.candidates.map((c) => c.slug);
      // Verify normalization: lowercase, hyphenated
      assert.ok(slugs.includes('summer-sale-2026'));
      // Verify clean stripping of exclamation marks
      assert.ok(slugs.includes('drop-now'));
      // Verify profanity removal
      assert.ok(!slugs.includes('badword-special'));

      pass('POST /api/ai/slugs sanitizes and normalizes LLM slug candidates');
    } catch (err) {
      fail('POST /api/ai/slugs sanitizes and normalizes LLM slug candidates', err);
    } finally {
      llmService.resetMockProvider();
    }

    // 7. Collision checking with database and cryptographic suffix append
    try {
      // Seed a link with a known slug
      const collisionSlug = 'test-collision-' + Date.now();
      try {
        await Link.create({
          slug: collisionSlug,
          dest: 'https://example.com/existing',
          ownerEmail: 'test@example.com'
        });
      } catch (_e) {}

      const memStore = require('../backend/utils/memStore');
      if (Array.isArray(memStore.links)) {
        memStore.links.push({ slug: collisionSlug, dest: 'https://example.com/existing' });
      }

      llmService.setMockProvider(async () => {
        return JSON.stringify([
          { slug: collisionSlug, rationale: 'Exact match', confidence: 0.99 }
        ]);
      });

      const res = await request('/api/ai/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          url: 'https://example.com/new-product'
        }
      });

      assert.strictEqual(res.status, 200);
      const firstCandidate = res.json.candidates[0];
      // Should NOT be identical to the taken slug; suffix should be appended
      assert.notStrictEqual(firstCandidate.slug, collisionSlug);
      assert.ok(firstCandidate.slug.startsWith(collisionSlug));
      assert.strictEqual(firstCandidate.isAvailable, true);

      pass('POST /api/ai/slugs appends unique suffix when slug collision occurs in DB');
    } catch (err) {
      fail('POST /api/ai/slugs appends unique suffix when slug collision occurs in DB', err);
    } finally {
      llmService.resetMockProvider();
    }

    // 8. Daily quota tracking and enforcement
    try {
      const userToken = makeToken('heavy_user@example.com', 'user');

      llmService.setMockProvider(async () => {
        return JSON.stringify([
          { slug: 'quick-slug', rationale: 'Fast', confidence: 0.9 }
        ]);
      });

      // Call until quota is exhausted (limit is quotaFree = 10)
      let lastRes = null;
      for (let i = 0; i < 11; i++) {
        lastRes = await request('/api/ai/slugs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + userToken
          },
          body: {
            url: `https://example.com/quota-test-${i}`
          }
        });
      }

      // The 11th request should be rate-limited (HTTP 429)
      assert.strictEqual(lastRes.status, 429);
      assert.ok(lastRes.json.error.includes('Daily AI quota reached'));

      pass('POST /api/ai/slugs enforces daily generation quotas per account tier');
    } catch (err) {
      fail('POST /api/ai/slugs enforces daily generation quotas per account tier', err);
    } finally {
      llmService.resetMockProvider();
    }

    console.log('\n🎉 ALL 8 AI Slug Generator tests passed!\n');
    if (server) {
      server.close();
    }
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (err) {
    fail('AI Slug Generator Test Suite', err);
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
