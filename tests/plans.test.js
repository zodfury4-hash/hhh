'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const { PLANS, PlanError, getEntitlements, assertWithinLimit } = require('../backend/config/plans');
const memStore = require('../backend/utils/memStore');

let server = null;
let baseUrl = '';

function makeToken(email, extra = {}) {
  return jwt.sign(
    { email, id: 'usr_' + Date.now(), role: 'user', ...extra },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
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
        } catch (_) {}
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
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
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
  console.log('\n💎 Starting HEA Link Plans & Entitlements Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 1. Central Plans Configuration Structure
    try {
      assert.ok(PLANS.free, 'Free plan must exist');
      assert.ok(PLANS.pro, 'Pro plan must exist');
      assert.ok(PLANS.business, 'Business plan must exist');
      assert.ok(PLANS.agency, 'Agency plan must exist');
      assert.ok(PLANS.enterprise, 'Enterprise plan must exist');

      assert.strictEqual(PLANS.free.limits.links, 25);
      assert.strictEqual(PLANS.pro.limits.links, 500);
      assert.strictEqual(PLANS.business.limits.seats, 5);
      assert.strictEqual(PLANS.agency.limits.workspaces, 10);
      assert.strictEqual(PLANS.enterprise.limits.links, -1);
      assert.strictEqual(PLANS.enterprise.limits.sso, true);
      assert.strictEqual(PLANS.free.limits.sso, false);

      pass('Central PLANS configuration defines all 5 tiers with accurate limits');
    } catch (err) {
      fail('PLANS configuration structure check failed', err);
    }

    // 2. getEntitlements Helper Function
    try {
      const freeEnt = getEntitlements({ email: 'u1@test.com' });
      assert.strictEqual(freeEnt.planKey, 'free');
      assert.strictEqual(freeEnt.links, 25);

      const proEnt = getEntitlements({ email: 'u2@test.com', isPro: true });
      assert.strictEqual(proEnt.planKey, 'pro');
      assert.strictEqual(proEnt.customDomains, 3);

      const bizEnt = getEntitlements({ email: 'u3@test.com', plan: 'business' });
      assert.strictEqual(bizEnt.planKey, 'business');
      assert.strictEqual(bizEnt.seats, 5);
      assert.strictEqual(bizEnt.auditLogs, true);

      const entEnt = getEntitlements({ email: 'u4@test.com', planKey: 'enterprise' });
      assert.strictEqual(entEnt.planKey, 'enterprise');
      assert.strictEqual(entEnt.sso, true);

      pass('getEntitlements resolves correct tier from user and workspace attributes');
    } catch (err) {
      fail('getEntitlements helper test failed', err);
    }

    // 3. assertWithinLimit Logic & Typed PlanError
    try {
      const freeEnt = getEntitlements({ planKey: 'free' });

      // Allowed under limit
      assert.strictEqual(assertWithinLimit(freeEnt, 'links', 10), true);

      // Numeric limit exceeded
      let threwLimit = false;
      try {
        assertWithinLimit(freeEnt, 'links', 25);
      } catch (err) {
        threwLimit = true;
        assert.ok(err instanceof PlanError);
        assert.strictEqual(err.code, 'PLAN_LIMIT_REACHED');
        assert.strictEqual(err.statusCode, 403);
      }
      assert.ok(threwLimit, 'Must throw PlanError when link limit reached');

      // Boolean feature denied
      let threwFeature = false;
      try {
        assertWithinLimit(freeEnt, 'sso');
      } catch (err) {
        threwFeature = true;
        assert.ok(err instanceof PlanError);
        assert.strictEqual(err.code, 'FEATURE_NOT_IN_PLAN');
        assert.strictEqual(err.statusCode, 403);
      }
      assert.ok(threwFeature, 'Must throw PlanError for unincluded features');

      // Enterprise unlimited
      const entEnt = getEntitlements({ planKey: 'enterprise' });
      assert.strictEqual(assertWithinLimit(entEnt, 'links', 999999), true);
      assert.strictEqual(assertWithinLimit(entEnt, 'sso'), true);

      pass('assertWithinLimit enforces numeric limits and boolean feature flags with stable codes');
    } catch (err) {
      fail('assertWithinLimit logic test failed', err);
    }

    // 4. GET /api/plans Public Endpoint
    try {
      const res = await request('/api/plans');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.ok, true);
      assert.ok(Array.isArray(res.json.plans));
      assert.strictEqual(res.json.plans.length, 5);

      const keys = res.json.plans.map((p) => p.planKey);
      assert.ok(keys.includes('free'));
      assert.ok(keys.includes('pro'));
      assert.ok(keys.includes('business'));
      assert.ok(keys.includes('agency'));
      assert.ok(keys.includes('enterprise'));

      pass('GET /api/plans delivers public plans directory for dynamic client views');
    } catch (err) {
      fail('GET /api/plans test failed', err);
    }

    // 5. GET /api/plans/me Authenticated Entitlements
    try {
      const token = makeToken('team_owner@example.com', { plan: 'business' });
      const res = await request('/api/plans/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.ok, true);
      assert.strictEqual(res.json.entitlements.planKey, 'business');
      assert.strictEqual(res.json.entitlements.seats, 5);

      pass('GET /api/plans/me provides active user entitlements');
    } catch (err) {
      fail('GET /api/plans/me test failed', err);
    }

    // 6. Server-Side Link Limit Enforcement
    try {
      const freeUserEmail = 'free_link_tester@example.com';
      const freeToken = makeToken(freeUserEmail, { planKey: 'free' });

      // Pre-fill memory store to free limit (25 links)
      for (let i = 0; i < 25; i++) {
        memStore.links.push({
          slug: `free-link-${Date.now()}-${i}`,
          dest: 'https://example.com',
          ownerEmail: freeUserEmail
        });
      }

      // 26th link should be rejected
      const res = await request('/api/links', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freeToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          dest: 'https://example.com/blocked-26th',
          title: 'Blocked Link'
        }
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.json.code, 'PLAN_LIMIT_REACHED');

      pass('POST /api/links enforces plan link limits server-side with HTTP 403');
    } catch (err) {
      fail('Server-side link limit enforcement failed', err);
    }

    // 7. Server-Side Custom Domain Plan Gate
    try {
      const freeToken = makeToken('free_domain_user@example.com', { planKey: 'free' });
      const res = await request('/api/domains', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freeToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          domain: 'mybrand.example.com'
        }
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.json.code, 'PLAN_LIMIT_REACHED');

      pass('POST /api/domains blocks custom domain creation on Free tier (limit: 0)');
    } catch (err) {
      fail('Custom domain plan gate test failed', err);
    }

    // 8. Server-Side Export Feature Gate
    try {
      const freeToken = makeToken('free_export_user@example.com', { planKey: 'free', isPro: false });
      const res = await request('/api/export/links.csv', {
        headers: { Authorization: `Bearer ${freeToken}` }
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.json.code, 'FEATURE_NOT_IN_PLAN');

      pass('GET /api/export/links.csv gates exports for plans without exportData');
    } catch (err) {
      fail('Data export feature gate test failed', err);
    }

    // 9. Analytics Retention Clamping
    try {
      const freeUserEmail = 'free_analytics_user@example.com';
      const freeToken = makeToken(freeUserEmail, { planKey: 'free' });

      // Request 365d on free tier (which only has 30d retention)
      const res = await request('/api/analytics/overview?range=365d', {
        headers: { Authorization: `Bearer ${freeToken}` }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.range, '365d');
      assert.strictEqual(res.json.retentionDays, 30);

      pass('GET /api/analytics/overview automatically clamps retention window to plan limits');
    } catch (err) {
      fail('Analytics retention clamping test failed', err);
    }

    // 10. Centralized Stripe Price Mapping
    try {
      const res = await request('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          plan: 'business',
          billingCycle: 'monthly',
          userEmail: 'buyer@example.com'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.demoMode, true);
      assert.strictEqual(res.json.amountTotal, 499900); // 4,999 PKR in cents

      pass('POST /api/stripe/create-checkout-session maps prices from central plans.js');
    } catch (err) {
      fail('Stripe price mapping test failed', err);
    }

    console.log('\n🎉 ALL 10 Plans & Entitlements tests passed!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (fatal) {
    console.error('Fatal Plans Suite Error:', fatal);
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
