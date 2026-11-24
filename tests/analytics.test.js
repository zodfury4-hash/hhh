const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');

const {
  hashIp,
  resolveCountry,
  parseUserAgent,
  parseReferrer
} = require('../backend/services/telemetry-service');
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

async function run() {
  console.log('\n📊 Starting HEA Link Real-Time Analytics & Telemetry Test Suite...\n');

  // ========================================================
  // 1. UNIT TESTS: Telemetry Service Core Functions
  // ========================================================
  console.log('🔬 1. Telemetry & Privacy Unit Tests:');

  // A. IP Hash privacy & salt
  const h1 = hashIp('203.0.113.195', new Date('2026-11-24T12:00:00Z'));
  const h2 = hashIp('203.0.113.195', new Date('2026-11-24T15:00:00Z'));
  const hDifferentDay = hashIp('203.0.113.195', new Date('2026-11-25T12:00:00Z'));
  assert.strictEqual(h1.length, 64, 'Hash must be a 64-character SHA-256 hex string');
  assert.strictEqual(h1, h2, 'Hashes for same IP on same day must be identical');
  assert.notStrictEqual(h1, hDifferentDay, 'Hashes for same IP on different days must differ (daily-salt)');
  assert.ok(!h1.includes('203.0.113.195'), 'Raw IP must not be visible in salted hash');
  console.log('  ✅ PASS: IP is daily-salted hashed (privacy-preserving, raw IP never stored)');

  // B. Country resolution (NEVER default to 'US' when header absent!)
  const reqWithCf = { headers: { 'cf-ipcountry': 'pk' }, ip: '127.0.0.1' };
  assert.strictEqual(resolveCountry(reqWithCf), 'PK', 'Cloudflare cf-ipcountry header must be respected');

  const reqWithXCountry = { headers: { 'x-country': 'DE' }, ip: '127.0.0.1' };
  assert.strictEqual(resolveCountry(reqWithXCountry), 'DE', 'x-country header must be respected');

  const reqWithoutHeaders = { headers: {}, ip: '127.0.0.1' };
  const resolved = resolveCountry(reqWithoutHeaders);
  assert.strictEqual(resolved, 'Unknown', 'Absent country headers for local/unknown IP must be "Unknown", NEVER "US"');
  console.log('  ✅ PASS: Country header absent resolves to "Unknown" (never hardcoded "US")');

  // C. Bot detection
  const botUa = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
  const humanUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const botParsed = parseUserAgent(botUa);
  const humanParsed = parseUserAgent(humanUa);
  assert.strictEqual(botParsed.isBot, true, 'Googlebot must be flagged as bot');
  assert.strictEqual(humanParsed.isBot, false, 'Safari on iPhone must be classified as human');
  assert.strictEqual(humanParsed.device, 'Mobile', 'iPhone must be classified as Mobile');
  console.log('  ✅ PASS: Bots are accurately identified and separated from human visitors');

  // D. Referrer extraction
  assert.strictEqual(parseReferrer('https://l.instagram.com/'), 'Instagram');
  assert.strictEqual(parseReferrer('https://www.google.com/search?q=healink'), 'Google');
  assert.strictEqual(parseReferrer(''), 'Direct');
  console.log('  ✅ PASS: Clean referrer channel classification');

  // ========================================================
  // 2. INTEGRATION TESTS: Live Server API
  // ========================================================
  console.log('\n🌐 2. Analytics API & Data Isolation Integration Tests:');

  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const tokenA = jwt.sign({ email: userAEmail, role: 'user' }, config.jwtSecret, { expiresIn: '1h' });
  const tokenB = jwt.sign({ email: userBEmail, role: 'user' }, config.jwtSecret, { expiresIn: '1h' });

  // A. Empty Analytics for new user (NO FAKE DATA)
  const emptyRes = await request('/api/analytics/overview', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert.strictEqual(emptyRes.status, 200);
  const emptyData = emptyRes.json;
  assert.strictEqual(emptyData.totalClicks, 0, 'New user totalClicks must be 0');
  assert.strictEqual(emptyData.rawClicks, 0, 'New user rawClicks must be 0');
  assert.strictEqual(emptyData.botClicks, 0, 'New user botClicks must be 0');
  assert.strictEqual(emptyData.uniqueVisitors, 0, 'New user uniqueVisitors must be 0');
  assert.deepStrictEqual(emptyData.topReferrers, [], 'topReferrers must be empty array, NO fake numbers!');
  assert.deepStrictEqual(emptyData.topCountries, [], 'topCountries must be empty array, NO fake numbers!');
  assert.strictEqual(emptyData.deviceBreakdown.mobile, 0, 'Mobile breakdown must be 0 (no fallback 68)');
  assert.strictEqual(emptyData.deviceBreakdown.desktop, 0, 'Desktop breakdown must be 0 (no fallback 28)');
  assert.strictEqual(emptyData.deviceBreakdown.tablet, 0, 'Tablet breakdown must be 0 (no fallback 4)');
  console.log('  ✅ PASS: New user receives clean zero metrics without fake fallbacks');

  // B. Click Recording via Fast 302 Redirection
  const testSlug = `telemetry-link-${Date.now().toString(36)}`;
  const createLinkRes = await request('/api/links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: {
      dest: 'https://example.com/target-landing',
      slug: testSlug,
      title: 'Telemetry Test Link'
    }
  });
  assert.strictEqual(createLinkRes.status, 200);

  // Perform human redirect
  const clickRes1 = await request(`/${testSlug}`, {
    headers: {
      'User-Agent': humanUa,
      'cf-ipcountry': 'CA',
      Referer: 'https://l.instagram.com/'
    }
  });
  assert.strictEqual(clickRes1.status, 302, 'Redirect must return 302 directly');
  assert.strictEqual(clickRes1.headers.location, 'https://example.com/target-landing');

  // Perform bot redirect (should be tracked in botClicks, NOT human clicks)
  const botClickRes = await request(`/${testSlug}`, {
    headers: {
      'User-Agent': botUa,
      'cf-ipcountry': 'US'
    }
  });
  assert.strictEqual(botClickRes.status, 302);

  // Wait briefly for setImmediate telemetry write
  await new Promise((r) => setTimeout(r, 150));

  // C. Verify Overview Metrics after Clicks
  const overviewRes = await request('/api/analytics/overview?range=7d', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert.strictEqual(overviewRes.status, 200);
  const data = overviewRes.json;

  assert.strictEqual(data.totalClicks, 1, 'Human clicks count must be exactly 1');
  assert.strictEqual(data.rawClicks, 2, 'Raw clicks (including bot) must be 2');
  assert.strictEqual(data.botClicks, 1, 'Bot clicks count must be 1');
  assert.strictEqual(data.uniqueVisitors, 1, 'Unique visitors must be 1 (bot excluded)');
  assert.ok(data.topReferrers.length >= 1, 'Top referrers must include recorded Instagram click');
  assert.strictEqual(data.topReferrers[0].name, 'Instagram');
  assert.strictEqual(data.topReferrers[0].percent, 100);
  assert.strictEqual(data.topCountries[0].country, 'CA');
  console.log('  ✅ PASS: Redirect records real telemetry; bot clicks separated from human metrics');

  // D. Data Isolation: User B cannot see User A's analytics
  const userBOverview = await request('/api/analytics/overview', {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  assert.strictEqual(userBOverview.status, 200);
  assert.strictEqual(userBOverview.json.totalClicks, 0, 'User B must see 0 clicks');
  assert.strictEqual(userBOverview.json.rawClicks, 0, 'User B must see 0 raw clicks');
  console.log('  ✅ PASS: Strict user isolation (User B cannot access User A data)');

  // E. Range Filter Validation
  for (const r of ['24h', '7d', '30d', '90d']) {
    const rangeRes = await request(`/api/analytics/overview?range=${r}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(rangeRes.status, 200);
    assert.strictEqual(rangeRes.json.range, r);
  }
  console.log('  ✅ PASS: Range filters (24h, 7d, 30d, 90d) work seamlessly');

  // F. Real-time SSE Stream Endpoint Test
  await new Promise((resolve, reject) => {
    const sseUrl = new URL(`/api/analytics/stream?token=${tokenA}`, baseUrl);
    const req = http.get(sseUrl, (res) => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('text/event-stream'));

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        if (buffer.includes('event: connected')) {
          req.destroy();
          resolve();
        }
      });
    });
    req.on('error', (err) => {
      // Abort is expected when req.destroy() is called
      if (err.code === 'ECONNRESET' || req.destroyed) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
  console.log('  ✅ PASS: Real-time SSE stream (/api/analytics/stream) delivers live event handshake');

  // Teardown
  if (server) await new Promise((resolve) => server.close(resolve));
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close(false);
  } catch (_e) {}
  console.log('\n====================================');
  console.log('Analytics Test Suite: All Passed Successfully! 🚀');
  console.log('====================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Analytics test failed:', err);
  if (server) server.close();
  process.exit(1);
});
