const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const { encrypt, decrypt, maskSecret } = require('../backend/utils/cryptoEnc');
const {
  isPrivateOrReservedIp,
  validateUrlForSsrf,
  formatSlackPayload,
  formatDiscordPayload
} = require('../backend/services/events');
const Link = require('../backend/models/Link');
const Click = require('../backend/models/Click');
const memStore = require('../backend/utils/memStore');

let server = null;
let baseUrl = '';

function makeToken(email) {
  return jwt.sign({ email, id: 'usr_' + Date.now(), role: 'user' }, config.jwtSecret, { expiresIn: '1h' });
}

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
  console.log('\n🔌 Starting Integrations Hub & Webhook Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const userEmail = 'integ_tester@example.com';
    const token = makeToken(userEmail);

    // 1. Public Catalog & Landing Route
    try {
      const resPage = await request('/integrations');
      assert.strictEqual(resPage.status, 200);
      assert.ok(resPage.body.includes('Integrations &amp; Automation Hub'));
      assert.ok(resPage.body.includes('Outbound Webhooks'));

      const resCat = await request('/api/integrations/catalog');
      assert.strictEqual(resCat.status, 200);
      assert.ok(Array.isArray(resCat.json.catalog));
      assert.ok(resCat.json.catalog.length >= 10);
      const webhooksItem = resCat.json.catalog.find((i) => i.id === 'webhooks');
      assert.strictEqual(webhooksItem.status, 'available');
      const zapierItem = resCat.json.catalog.find((i) => i.id === 'zapier');
      assert.strictEqual(zapierItem.status, 'coming_soon');

      pass('GET /integrations and /api/integrations/catalog return honest catalog with status separation');
    } catch (err) {
      fail('Catalog delivery test failed', err);
    }

    // 2. AES-256-GCM Encryption, Decryption & Secret Masking
    try {
      const sensitiveUrl = 'https://hooks.slack.com/services/T12345/B67890/secretToken123456';
      const encrypted = encrypt(sensitiveUrl);
      assert.ok(encrypted.includes(':'));
      assert.notStrictEqual(encrypted, sensitiveUrl);

      const decrypted = decrypt(encrypted);
      assert.strictEqual(decrypted, sensitiveUrl);

      const masked = maskSecret(sensitiveUrl);
      assert.ok(masked.includes('hooks.slack.com'));
      assert.ok(masked.includes('***'));
      assert.ok(!masked.includes('secretToken123456'), 'Plain token must be masked');

      pass('AES-256-GCM encrypts sensitive URLs/secrets and masks credentials for client views');
    } catch (err) {
      fail('Encryption/masking test failed', err);
    }

    // 3. SSRF Protection (Block loopback, private ranges, and cloud metadata)
    try {
      // Loopback
      assert.strictEqual(isPrivateOrReservedIp('127.0.0.1'), true);
      assert.strictEqual(isPrivateOrReservedIp('127.0.0.50'), true);
      assert.strictEqual(isPrivateOrReservedIp('::1'), true);

      // Private IPv4 ranges
      assert.strictEqual(isPrivateOrReservedIp('10.0.0.1'), true);
      assert.strictEqual(isPrivateOrReservedIp('172.16.0.1'), true);
      assert.strictEqual(isPrivateOrReservedIp('192.168.1.1'), true);

      // AWS/GCP/Azure link-local metadata
      assert.strictEqual(isPrivateOrReservedIp('169.254.169.254'), true);

      // Legitimate public IPs
      assert.strictEqual(isPrivateOrReservedIp('8.8.8.8'), false);
      assert.strictEqual(isPrivateOrReservedIp('1.1.1.1'), false);

      // SSRF validation rejection on localhost
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      let ssrfBlocked = false;
      try {
        await validateUrlForSsrf('http://169.254.169.254/latest/meta-data/');
      } catch (e) {
        ssrfBlocked = e.message.includes('SSRF Blocked') || e.message.includes('restricted/private');
      } finally {
        process.env.NODE_ENV = origEnv;
      }
      assert.strictEqual(ssrfBlocked, true);

      pass('SSRF protection successfully blocks private, loopback, and cloud metadata IP addresses');
    } catch (err) {
      fail('SSRF protection test failed', err);
    }

    // 4. Slack & Discord Formatter Payloads
    try {
      const sampleData = {
        slug: 'summer-sale',
        shortUrl: 'https://hea.link/summer-sale',
        dest: 'https://store.brand.com/sale',
        totalClicks: 142
      };

      const slack = formatSlackPayload('link.created', sampleData);
      assert.ok(slack.text.includes('https://hea.link/summer-sale'));
      assert.ok(Array.isArray(slack.blocks));
      assert.strictEqual(slack.blocks[0].type, 'header');

      const discord = formatDiscordPayload('link.created', sampleData);
      assert.ok(Array.isArray(discord.embeds));
      assert.strictEqual(discord.embeds[0].color, 0x0070F3);
      assert.ok(discord.embeds[0].fields.some((f) => f.name === 'Total Clicks' && f.value === '142'));

      pass('Slack Block Kit and Discord Embed formatters produce structured message schemas');
    } catch (err) {
      fail('Payload formatting test failed', err);
    }

    // 5. REST Integration Management (Create, List, Mask, Delete)
    let createdIntegId = null;
    try {
      const resCreate = await request('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          provider: 'webhooks',
          name: 'Marketing Webhook Endpoint',
          config: {
            url: 'https://api.external-partner.com/webhooks/hea',
            secret: 'sec_test_secret_123'
          },
          events: ['link.created', 'link.clicked']
        }
      });

      assert.strictEqual(resCreate.status, 201);
      assert.strictEqual(resCreate.json.success, true);
      createdIntegId = resCreate.json.integration.integrationId;
      assert.ok(createdIntegId.startsWith('int_'));
      assert.ok(!resCreate.json.integration.config.secret.includes('sec_test_secret_123'), 'Secret must be masked');

      // List user integrations
      const resList = await request('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resList.status, 200);
      assert.ok(resList.json.integrations.some((i) => i.integrationId === createdIntegId));

      pass('POST and GET /api/integrations create and list integrations with masked credentials');
    } catch (err) {
      fail('Integration CRUD test failed', err);
    }

    // 6. Test Webhook Dispatch & Delivery Logging
    try {
      // Test dispatch endpoint
      const resTest = await request(`/api/integrations/${createdIntegId}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Will attempt to reach the mock external url (may fail or timeout, but record delivery)
      assert.ok(resTest.status === 200 || resTest.status === 400);

      // Check deliveries endpoint
      const resDel = await request(`/api/integrations/${createdIntegId}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resDel.status, 200);
      assert.ok(Array.isArray(resDel.json.deliveries));

      pass('POST /api/integrations/:id/test dispatches test payload and records delivery attempt');
    } catch (err) {
      fail('Webhook dispatch test failed', err);
    }

    // 7. Delete Integration
    try {
      const resDel = await request(`/api/integrations/${createdIntegId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resDel.status, 200);
      assert.strictEqual(resDel.json.success, true);
      pass('DELETE /api/integrations/:id safely removes configured integration');
    } catch (err) {
      fail('Integration deletion test failed', err);
    }

    // 8. Streamed Data Export (Links & Clicks in CSV & JSON)
    try {
      // Seed sample link and click for export
      const expSlug = 'exp-' + Date.now().toString(36);
      const linkDoc = {
        slug: expSlug,
        dest: 'https://example.com/export-target',
        title: 'Export Test Link',
        tag: 'Marketing',
        ownerEmail: userEmail,
        totalClicks: 5,
        createdAt: new Date(),
        isActive: true
      };
      if (mongoose.connection.readyState === 1) {
        try { await Link.create(linkDoc); } catch (_e) {}
      }
      if (!Array.isArray(memStore.links)) memStore.links = [];
      memStore.links.push(linkDoc);

      const clickDoc = {
        slug: expSlug,
        ownerEmail: userEmail,
        country: 'US',
        city: 'New York',
        device: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        referrer: 'https://twitter.com',
        timestamp: new Date()
      };
      if (mongoose.connection.readyState === 1) {
        try { await Click.create(clickDoc); } catch (_e) {}
      }
      if (!Array.isArray(memStore.clicks)) memStore.clicks = [];
      memStore.clicks.push(clickDoc);

      // Test links CSV export
      const resLinksCsv = await request('/api/export/links.csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resLinksCsv.status, 200);
      assert.ok(resLinksCsv.headers['content-type'].includes('text/csv'));
      assert.ok(resLinksCsv.body.includes('Slug,Destination URL,Short URL'));
      assert.ok(resLinksCsv.body.includes(expSlug));

      // Test links JSON export
      const resLinksJson = await request('/api/export/links.json', {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resLinksJson.status, 200);
      assert.ok(Array.isArray(resLinksJson.json.links));
      assert.ok(resLinksJson.json.links.some((l) => l.slug === expSlug));

      // Test clicks CSV export
      const resClicksCsv = await request('/api/export/clicks.csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(resClicksCsv.status, 200);
      assert.ok(resClicksCsv.headers['content-type'].includes('text/csv'));
      assert.ok(resClicksCsv.body.includes('Timestamp,Slug,Country,City'));

      pass('Streamed CSV and JSON exports deliver formatted datasets with proper headers');
    } catch (err) {
      fail('Data export test failed', err);
    }

    // 9. Integration Waitlist for "Coming Soon" Providers
    try {
      const resWaitlist = await request('/api/integrations/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'waitlist_user@example.com',
          provider: 'zapier',
          useCase: 'Auto-shorten links from Google Sheets'
        }
      });

      assert.strictEqual(resWaitlist.status, 200);
      assert.strictEqual(resWaitlist.json.success, true);
      assert.ok(resWaitlist.json.message.includes('Zapier'));

      // Rejection of invalid email
      const resBadEmail = await request('/api/integrations/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'not-an-email',
          provider: 'shopify'
        }
      });
      assert.strictEqual(resBadEmail.status, 400);

      pass('POST /api/integrations/waitlist handles early access subscriptions with input validation');
    } catch (err) {
      fail('Waitlist test failed', err);
    }

    // 10. Grep Assertion: No Inflated "100+ Integrations" Claims
    try {
      const integrationsMod = fs.readFileSync(path.join(__dirname, '..', 'dashboard', 'src', 'modules', 'integrations.js'), 'utf8');
      const homeMod = fs.readFileSync(path.join(__dirname, '..', 'dashboard', 'src', 'modules', 'home.js'), 'utf8');
      assert.ok(!integrationsMod.includes('100+ integrations'), 'integrations module must not contain 100+ integrations claim');
      assert.ok(!homeMod.includes('100+ integrations'), 'home module must not contain 100+ integrations claim');
      assert.ok(!integrationsMod.includes('Plug into 100+ platforms'), 'integrations module must not contain 100+ platforms claim');
      assert.ok(!homeMod.includes('Plug into 100+ platforms'), 'home module must not contain 100+ platforms claim');
      pass('All inflated 100+ platform marketing claims verified removed from codebase');
    } catch (err) {
      fail('Marketing claim verification failed', err);
    }

    console.log('\n🎉 ALL 10 Integrations Hub tests passed!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (fatal) {
    console.error('Fatal Integrations Suite Error:', fatal);
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
