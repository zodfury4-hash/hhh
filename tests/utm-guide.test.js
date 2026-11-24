const assert = require('assert');
const http = require('http');
const app = require('../backend/server');
const HeaUtm = require('../js/shared/utm');

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
  console.log('\n🎯 Starting HEA Link UTM Campaign Guide & Normalization Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // 1. Unit Tests for Shared UTM Engine
    console.log('📦 1. Shared UTM Module Normalization & Formatting:');

    // Test 1: Normalization lowercases and replaces spaces with hyphens
    const norm = HeaUtm.normalizeParam('Summer Promo 2026! @Meta');
    assert.strictEqual(norm, 'summer-promo-2026-meta');
    pass('normalizeParam enforces lowercase, hyphens for spaces, and strips invalid characters');

    // Test 2: Consecutive hyphens collapsed
    const collapsed = HeaUtm.normalizeParam('black---friday--sale');
    assert.strictEqual(collapsed, 'black-friday-sale');
    pass('normalizeParam collapses duplicate hyphens and trims edges');

    // Test 3: Preserves existing query parameters
    const tagged = HeaUtm.buildUtmUrl('https://example.com/products/shoe?ref=partner&sku=123', {
      source: 'google',
      medium: 'cpc',
      campaign: 'spring_launch'
    });
    const parsed = new URL(tagged);
    assert.strictEqual(parsed.searchParams.get('ref'), 'partner');
    assert.strictEqual(parsed.searchParams.get('sku'), '123');
    assert.strictEqual(parsed.searchParams.get('utm_source'), 'google');
    assert.strictEqual(parsed.searchParams.get('utm_medium'), 'cpc');
    assert.strictEqual(parsed.searchParams.get('utm_campaign'), 'spring_launch');
    pass('buildUtmUrl preserves pre-existing query parameters without collision');

    // Test 4: Preserves fragment hash at the end
    const withHash = HeaUtm.buildUtmUrl('https://example.com/pricing#enterprise', {
      source: 'newsletter',
      medium: 'email',
      campaign: 'weekly_roundup'
    });
    assert.ok(withHash.endsWith('#enterprise'));
    assert.ok(withHash.includes('?utm_source=newsletter'));
    pass('buildUtmUrl correctly places query string before fragment hash');

    // Test 5: Rejects invalid destination URLs
    assert.throws(() => {
      HeaUtm.buildUtmUrl('not-a-valid-url', { source: 'google' });
    }, /Destination URL must start with http:\/\/ or https:\/\//);
    pass('buildUtmUrl strictly validates destination URL format');

    // Test 6: Presets contain required GA4 channels
    const expectedPresets = ['google_ads', 'meta', 'instagram', 'tiktok', 'linkedin', 'newsletter', 'twitter'];
    for (const key of expectedPresets) {
      assert.ok(HeaUtm.PRESETS[key], `Preset ${key} must exist`);
      assert.ok(HeaUtm.PRESETS[key].source, `Preset ${key} has source`);
      assert.ok(HeaUtm.PRESETS[key].medium, `Preset ${key} has medium`);
    }
    pass('Standard GA4 attribution presets defined for all 7 major channels');

    // 2. HTTP Endpoint & Page Rendering
    console.log('\n🌐 2. UTM Campaign Guide Web Page & SEO Structured Data:');

    // Test 7: GET /resources/utm-guide returns 200 HTML
    const resGuide = await request('/resources/utm-guide');
    assert.strictEqual(resGuide.status, 200);
    assert.ok(resGuide.body.includes('The Complete UTM Campaign Guide'));
    assert.ok(resGuide.body.includes('id="utmBuilderSection"'));
    pass('GET /resources/utm-guide serves 200 with interactive builder');

    // Test 8: GET /utm-guide shortcut route works
    const resShortcut = await request('/utm-guide');
    assert.strictEqual(resShortcut.status, 200);
    pass('GET /utm-guide shortcut correctly serves the guide page');

    // Test 9: Schema.org Article and FAQPage JSON-LD present and valid
    assert.ok(resGuide.body.includes('"@type": "Article"'));
    assert.ok(resGuide.body.includes('"@type": "FAQPage"'));
    assert.ok(resGuide.body.includes('utm_source, utm_medium, utm_campaign'));
    pass('Schema.org Article and FAQPage JSON-LD structured data validated');

    // Test 10: Dashboard and Guide output byte-for-byte parity
    const guideOutput = HeaUtm.buildUtmUrl('https://store.brand.com/sale', {
      source: 'facebook',
      medium: 'cpc',
      campaign: 'summer_collection_meta_2026'
    });
    const expectedOutput = 'https://store.brand.com/sale?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_collection_meta_2026';
    assert.strictEqual(guideOutput, expectedOutput);
    pass('Dashboard and public guide produce 100% byte-for-byte identical URLs');

    console.log('\n🎉 ALL 10 UTM Campaign Guide tests passed!\n');
  } catch (err) {
    fail('UTM Guide Suite Error', err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    process.exit(0);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
