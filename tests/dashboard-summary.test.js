'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const memStore = require('../backend/utils/memStore');
const Link = require('../backend/models/Link');
const Click = require('../backend/models/Click');

let server = null;
let baseUrl = '';

function makeToken(email, extra = {}) {
  return jwt.sign(
    {
      userId: 'usr_' + Math.random().toString(36).slice(2, 9),
      email: email.toLowerCase(),
      role: 'user',
      ...extra
    },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

function request(path, options = {}) {
  const url = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch (_e) {
            json = null;
          }
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      }
    );
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
  console.error(`  ❌ FAIL: ${name}`);
  console.error(err);
  process.exit(1);
}

async function run() {
  console.log('\n📊 Starting Dashboard Summary API Verification Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const isDb = mongoose.connection.readyState === 1;

    // 1. Unauthenticated request rejected
    try {
      const resUnauth = await request('/api/dashboard/summary');
      assert.strictEqual(resUnauth.status, 401);
      pass('GET /api/dashboard/summary rejects unauthenticated requests with 401');
    } catch (err) {
      fail('Unauthenticated test failed', err);
    }

    // 2. New account zero values & empty states
    const newEmail = `fresh_user_${Date.now()}@example.com`;
    const newToken = makeToken(newEmail, { plan: 'free' });

    try {
      const resNew = await request('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${newToken}` }
      });

      assert.strictEqual(resNew.status, 200);
      const data = resNew.json;

      assert.strictEqual(data.range, '7d');
      assert.strictEqual(data.totals.links, 0);
      assert.strictEqual(data.totals.humanClicks, 0);
      assert.strictEqual(data.totals.botClicks, 0);
      assert.strictEqual(data.totals.uniqueVisitors, 0);
      assert.strictEqual(data.totals.avgClicksPerLink, 0);

      assert.strictEqual(data.previous.humanClicks, 0);
      assert.strictEqual(data.previous.uniqueVisitors, 0);
      assert.strictEqual(data.previous.links, 0);

      // Trends must be null (UI renders "—" or "New")
      assert.strictEqual(data.trends.clicksPct, null);
      assert.strictEqual(data.trends.visitorsPct, null);
      assert.strictEqual(data.trends.linksPct, null);

      assert.strictEqual(data.topPerformer, null);
      assert.strictEqual(data.peak, null);
      assert.deepStrictEqual(data.referrers, []);
      assert.deepStrictEqual(data.recentLinks, []);
      assert.strictEqual(data.activeNow.visitors, 0);
      assert.strictEqual(data.notifications.unread, 0);

      assert.strictEqual(data.plan.key, 'free');
      assert.strictEqual(data.plan.isPaid, false);

      // Timeseries has exactly 7 zero-filled slots for 7d
      assert.strictEqual(data.timeseries.length, 7);
      data.timeseries.forEach((slot) => {
        assert.strictEqual(slot.clicks, 0);
        assert.strictEqual(slot.uniques, 0);
        assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(slot.t));
      });

      pass('New account returns clean zeros, null trends, empty lists, and zero-filled timeseries');
    } catch (err) {
      fail('New account test failed', err);
    }

    // 3. Seeded Account with Real Metrics, Bots, Previous Window & Trends
    const activeEmail = `active_creator_${Date.now()}@example.com`;
    const activeToken = makeToken(activeEmail, { plan: 'pro' });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 3600000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 86400000); // in previous 7d window

    // Seed Links
    const link1 = {
      _id: isDb ? new mongoose.Types.ObjectId() : 'lnk_1',
      slug: 'promo-sale',
      title: 'Summer Promo Sale',
      dest: 'https://store.brand.com/sale',
      ownerEmail: activeEmail,
      totalClicks: 6,
      createdAt: twoDaysAgo
    };
    const link2 = {
      _id: isDb ? new mongoose.Types.ObjectId() : 'lnk_2',
      slug: 'newsletter-drop',
      title: 'Weekly Tech Digest',
      dest: 'https://brand.com/newsletter',
      ownerEmail: activeEmail,
      totalClicks: 2,
      createdAt: oneDayAgo
    };

    if (isDb) {
      await Link.create([link1, link2]);
    } else {
      memStore.links.push(link1, link2);
    }

    // Seed Clicks
    const clicks = [
      // Human clicks in current window
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: now,
        ipHash: 'ip_hash_aaa',
        referrer: 'Twitter / X',
        isBot: false,
        isQr: false
      },
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago (activeNow!)
        ipHash: 'ip_hash_aaa', // repeat visitor
        referrer: 'Twitter / X',
        isBot: false,
        isQr: false
      },
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: oneDayAgo,
        ipHash: 'ip_hash_bbb',
        referrer: 'Direct',
        isBot: false,
        isQr: false
      },
      {
        slug: 'newsletter-drop',
        ownerEmail: activeEmail,
        timestamp: twoDaysAgo,
        ipHash: 'ip_hash_ccc',
        referrer: 'LinkedIn',
        isBot: false,
        isQr: false
      },
      // Bot click (must be excluded from humanClicks and uniqueVisitors)
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: now,
        ipHash: 'ip_hash_bot',
        referrer: 'Direct',
        isBot: true,
        isQr: false
      },
      // Previous window click (10 days ago) for trend math
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: tenDaysAgo,
        ipHash: 'ip_hash_old_1',
        referrer: 'Direct',
        isBot: false,
        isQr: false
      },
      {
        slug: 'promo-sale',
        ownerEmail: activeEmail,
        timestamp: tenDaysAgo,
        ipHash: 'ip_hash_old_2',
        referrer: 'Direct',
        isBot: false,
        isQr: false
      }
    ];

    if (isDb) {
      await Click.create(clicks);
    } else {
      memStore.clicks.push(...clicks);
    }

    // Cross-user click (must be isolated)
    const otherClick = {
      slug: 'other-secret-link',
      ownerEmail: 'stranger@example.com',
      timestamp: now,
      ipHash: 'ip_hash_stranger',
      referrer: 'Google',
      isBot: false
    };
    if (isDb) {
      await Click.create(otherClick);
    } else {
      memStore.clicks.push(otherClick);
    }

    try {
      const resActive = await request('/api/dashboard/summary?range=7d&tz=UTC', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      assert.strictEqual(resActive.status, 200);
      const data = resActive.json;

      // 4 human clicks in current window (2 on promo-sale today, 1 promo-sale 1d ago, 1 newsletter 2d ago)
      assert.strictEqual(data.totals.humanClicks, 4);
      assert.strictEqual(data.totals.botClicks, 1);
      assert.strictEqual(data.totals.links, 2);
      // 3 unique IPs: aaa, bbb, ccc (bot excluded)
      assert.strictEqual(data.totals.uniqueVisitors, 3);
      assert.strictEqual(data.totals.avgClicksPerLink, 2); // 4 / 2

      // Previous window: 2 human clicks, 2 unique visitors
      assert.strictEqual(data.previous.humanClicks, 2);
      assert.strictEqual(data.previous.uniqueVisitors, 2);

      // Trend math: (4 - 2) / 2 * 100 = +100%
      assert.strictEqual(data.trends.clicksPct, 100);
      // (3 - 2) / 2 * 100 = +50%
      assert.strictEqual(data.trends.visitorsPct, 50);

      // Top Performer: promo-sale with 3 human clicks
      assert.ok(data.topPerformer);
      assert.strictEqual(data.topPerformer.slug, 'promo-sale');
      assert.strictEqual(data.topPerformer.title, 'Summer Promo Sale');
      assert.strictEqual(data.topPerformer.clicks, 3);

      // Active now: 1 unique visitor in last 5 minutes (ip_hash_aaa)
      assert.strictEqual(data.activeNow.visitors, 1);

      // Peak identification
      assert.ok(data.peak);
      assert.ok(data.peak.clicks >= 2);

      // Referrers: Twitter (2), Direct (1), LinkedIn (1)
      assert.strictEqual(data.referrers.length, 3);
      const twitter = data.referrers.find((r) => r.name === 'Twitter / X');
      assert.ok(twitter);
      assert.strictEqual(twitter.count, 2);
      assert.strictEqual(twitter.percent, 50); // 2/4 = 50%

      // Recent links: shortUrl uses baseUrl without hardcoded fury.link
      assert.strictEqual(data.recentLinks.length, 2);
      const recentPromo = data.recentLinks.find((l) => l.slug === 'promo-sale');
      assert.ok(recentPromo);
      assert.strictEqual(recentPromo.shortUrl, `${baseUrl}/promo-sale`);
      assert.ok(!recentPromo.shortUrl.includes('fury.link'));
      assert.ok(!recentPromo.shortUrl.includes('healink.store'));
      assert.strictEqual(recentPromo.sparkline.length, 7);

      // Plan badge reflects Pro
      assert.strictEqual(data.plan.key, 'pro');
      assert.strictEqual(data.plan.isPaid, true);

      pass('Seeded metrics match hand-computed expectations, bots excluded, trends accurate');
    } catch (err) {
      fail('Seeded metrics test failed', err);
    }

    // 4. Timezone testing (24h hourly vs 7d daily across timezones)
    try {
      const resTz = await request('/api/dashboard/summary?range=24h&tz=Asia/Karachi', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(resTz.status, 200);
      assert.strictEqual(resTz.json.range, '24h');
      assert.strictEqual(resTz.json.timeseries.length, 24);
      // Hourly slot format: YYYY-MM-DD HH:00
      assert.ok(/^\d{4}-\d{2}-\d{2} \d{2}:00$/.test(resTz.json.timeseries[0].t));

      pass('Timezone buckets correctly generated for 24h hourly in Asia/Karachi');
    } catch (err) {
      fail('Timezone test failed', err);
    }

    console.log('\n🎉 ALL Dashboard Summary API tests passed successfully!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (err) {
    fail('Global test error', err);
  }
}

run();
