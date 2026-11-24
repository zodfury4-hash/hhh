const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');

const app = require('../backend/server');
const config = require('../backend/config');

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

async function run() {
  console.log('\n🎯 Starting HEA Link Phase 2: UTM Campaign Attribution Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const testUserEmail = `utm_user_${Date.now()}@example.com`;
    const token = jwt.sign(
      { userId: 'usr_' + Date.now(), email: testUserEmail, role: 'user' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('📦 1. Link Creation with UTM Parameters:');

    // Test 1: POST /api/links with utm object
    const campaignSlug = `camp-${Date.now().toString(36)}`;
    try {
      const res = await request('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          dest: 'https://myshopify.com/summer-sale?ref=affiliate',
          slug: campaignSlug,
          title: 'Summer Meta Campaign',
          utm: {
            campaign: 'summer_promo_2026',
            source: 'facebook',
            medium: 'paid_social',
            term: 'sneakers',
            content: 'carousel_ad_1'
          }
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      assert.strictEqual(res.json.link.utm.campaign, 'summer_promo_2026');
      assert.strictEqual(res.json.link.utm.source, 'facebook');
      pass('Link created with structured UTM metadata and saved to store');
    } catch (err) {
      fail('Create link with UTM failed', err);
    }

    console.log('\n🔀 2. Redirect with UTM Parameter Merging:');

    // Test 2: Redirection merges UTM onto destination URL without breaking existing query params
    try {
      const res = await request(`/${campaignSlug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });

      assert.strictEqual(res.status, 302);
      const redirectUrl = new URL(res.headers.location);
      assert.strictEqual(redirectUrl.origin, 'https://myshopify.com');
      assert.strictEqual(redirectUrl.pathname, '/summer-sale');
      assert.strictEqual(redirectUrl.searchParams.get('ref'), 'affiliate');
      assert.strictEqual(redirectUrl.searchParams.get('utm_campaign'), 'summer_promo_2026');
      assert.strictEqual(redirectUrl.searchParams.get('utm_source'), 'facebook');
      assert.strictEqual(redirectUrl.searchParams.get('utm_medium'), 'paid_social');
      assert.strictEqual(redirectUrl.searchParams.get('utm_content'), 'carousel_ad_1');
      pass('Redirection cleanly merges UTM parameters into destination URL via WHATWG URL');
    } catch (err) {
      fail('Redirect UTM merge failed', err);
    }

    // Wait 50ms for asynchronous setImmediate click recording to persist
    await new Promise((resolve) => setTimeout(resolve, 80));

    console.log('\n📊 3. Analytics Aggregation & Attribution Breakdown:');

    // Test 3: /api/analytics/overview returns real campaign breakdowns
    try {
      const res = await request('/api/analytics/overview?range=30d', {
        headers: { Authorization: `Bearer ${token}` }
      });

      assert.strictEqual(res.status, 200);
      const data = res.json;
      assert.ok(Array.isArray(data.byCampaign), 'byCampaign must be an array');
      assert.ok(Array.isArray(data.bySource), 'bySource must be an array');
      assert.ok(Array.isArray(data.byMedium), 'byMedium must be an array');

      const campEntry = data.byCampaign.find((c) => c.campaign === 'summer_promo_2026');
      assert.ok(campEntry, 'Must find summer_promo_2026 in byCampaign');
      assert.strictEqual(campEntry.count, 1);
      assert.strictEqual(campEntry.percent, 100);

      const srcEntry = data.bySource.find((s) => s.source === 'facebook');
      assert.ok(srcEntry, 'Must find facebook in bySource');
      assert.strictEqual(srcEntry.count, 1);

      pass('/api/analytics/overview returns accurate real-world byCampaign and bySource attribution');
    } catch (err) {
      fail('Analytics overview UTM breakdown failed', err);
    }

    // Test 4: /api/analytics/overview?campaign=name filtering
    try {
      const matchRes = await request(`/api/analytics/overview?range=30d&campaign=summer_promo_2026`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(matchRes.status, 200);
      assert.strictEqual(matchRes.json.totalClicks, 1);

      const nonMatchRes = await request(`/api/analytics/overview?range=30d&campaign=winter_promo_2026`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(nonMatchRes.status, 200);
      assert.strictEqual(nonMatchRes.json.totalClicks, 0);
      assert.strictEqual(nonMatchRes.json.byCampaign.length, 0);
      pass('Query filter ?campaign=<name> restricts metrics to matching campaign clicks');
    } catch (err) {
      fail('Campaign query filter failed', err);
    }

    console.log('\n🤖 4. HEA Assist Copilot Heuristics:');

    // Test 5: /api/assist/generate returns structured UTM suggestions
    try {
      const res = await request('/api/assist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { prompt: 'Suggest UTM parameters for Google Ads search campaign' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      assert.ok(res.json.utm, 'Response must include structured utm object');
      assert.strictEqual(res.json.utm.source, 'google');
      assert.strictEqual(res.json.utm.medium, 'cpc');
      assert.ok(res.json.reply.includes('google'));
      pass('/api/assist/generate returns deterministic heuristic UTM configurations');
    } catch (err) {
      fail('HEA Assist UTM suggestion failed', err);
    }

    console.log('\n====================================');
    console.log('UTM Campaign Attribution Suite: All Passed Successfully! 🚀');
    console.log('====================================\n');
  } catch (fatal) {
    console.error('Fatal Suite Error:', fatal);
    process.exit(1);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
    } catch (_e) {}
    process.exit(0);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
