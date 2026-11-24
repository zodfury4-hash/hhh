const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');

const app = require('../backend/server');
const config = require('../backend/config');
const memStore = require('../backend/utils/memStore');

let server = null;
let baseUrl = '';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = options.headers || {};
    const reqOptions = {
      method: options.method || 'GET',
      headers
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
  console.log('\n🌐 Starting HEA Link Phase 3: Branded Custom Domains & DNS Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const userAEmail = `dom_user_a_${Date.now()}@brand.com`;
    const tokenA = jwt.sign(
      { userId: 'usr_a_' + Date.now(), email: userAEmail, role: 'user', plan: 'pro', isPro: true },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const userBEmail = `dom_user_b_${Date.now()}@other.com`;
    const tokenB = jwt.sign(
      { userId: 'usr_b_' + Date.now(), email: userBEmail, role: 'user', plan: 'pro', isPro: true },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('📦 1. Domain Registration & Security Validation:');

    // Test 1: Add new domain begins in pending_verification with verificationToken
    const testDomain = `links-${Date.now().toString(36)}.brand.com`;
    let domainRecord = null;
    try {
      const res = await request('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: { domain: testDomain }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      domainRecord = res.json.domain;
      assert.strictEqual(domainRecord.status, 'pending_verification');
      assert.ok(domainRecord.verificationToken.startsWith('hea-verify-'));
      assert.ok(res.json.instructions.cname.target.includes('healink.store'));
      assert.strictEqual(res.json.instructions.txt.value, domainRecord.verificationToken);
      pass('Domain registered in pending_verification with crypto verification token and instructions');
    } catch (err) {
      fail('Domain registration failed', err);
    }

    // Test 2: Reject primary platform domains and private networks
    try {
      const resPrimary = await request('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: { domain: 'healink.store' }
      });
      assert.strictEqual(resPrimary.status, 400);

      const resLocal = await request('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: { domain: '127.0.0.1' }
      });
      assert.strictEqual(resLocal.status, 400);
      pass('Validation rejects platform primary domains (healink.store) and loopback addresses');
    } catch (err) {
      fail('Primary/loopback rejection test failed', err);
    }

    console.log('\n🔍 2. DNS Verification Lifecycle (Hermetic Mock Resolver):');

    // Test 3: Verification fails when DNS records are absent
    const mockFailingResolver = {
      resolveCname: async () => {
        const err = new Error('queryCname ENODATA');
        err.code = 'ENODATA';
        throw err;
      },
      resolveTxt: async () => {
        const err = new Error('queryTxt ENODATA');
        err.code = 'ENODATA';
        throw err;
      }
    };
    app.set('dnsResolver', mockFailingResolver);

    try {
      const failRes = await request(`/api/domains/${domainRecord.domain}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });

      assert.strictEqual(failRes.status, 400);
      assert.strictEqual(failRes.json.verified, false);
      assert.strictEqual(failRes.json.status, 'failed');
      pass('DNS check fails with diagnostic error when no CNAME or TXT records exist');
    } catch (err) {
      fail('Failed DNS verification test error', err);
    }

    // Test 4: Verification succeeds when CNAME matches
    const mockSuccessResolver = {
      resolveCname: async (host) => {
        if (host === testDomain) return ['cname.healink.store'];
        throw new Error('NXDOMAIN');
      },
      resolveTxt: async () => []
    };
    app.set('dnsResolver', mockSuccessResolver);

    try {
      const successRes = await request(`/api/domains/${domainRecord.domain}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });

      assert.strictEqual(successRes.status, 200);
      assert.strictEqual(successRes.json.verified, true);
      assert.strictEqual(successRes.json.status, 'active');
      assert.strictEqual(successRes.json.method, 'cname');
      pass('DNS verification succeeds and transitions domain to active status upon CNAME match');
    } catch (err) {
      fail('Successful DNS verification test error', err);
    }

    console.log('\n🔀 3. Custom Domain Redirection & Multi-Tenant Isolation:');

    // Setup links: User A creates a link on their brand domain
    const brandSlug = 'vip-launch';
    memStore.links.unshift({
      id: 'lnk_brand_a',
      ownerEmail: userAEmail,
      dest: 'https://example.com/brand-a-exclusive',
      slug: brandSlug,
      createdAt: new Date()
    });

    // User B creates a link with the exact same slug on the public platform
    memStore.links.unshift({
      id: 'lnk_brand_b',
      ownerEmail: userBEmail,
      dest: 'https://example.com/user-b-unrelated',
      slug: brandSlug,
      createdAt: new Date()
    });

    // Test 5: Accessing brand slug via custom domain resolves User A's link
    try {
      const resCustom = await request(`/${brandSlug}`, {
        headers: {
          Host: testDomain
        }
      });

      assert.strictEqual(resCustom.status, 302);
      assert.strictEqual(resCustom.headers.location, 'https://example.com/brand-a-exclusive');
      pass('Host routing on custom domain correctly resolves link owned by domain owner');
    } catch (err) {
      fail('Custom domain routing failed', err);
    }

    // Test 6: Accessing a slug that belongs ONLY to User B on User A's domain returns 404 (Isolation)
    const userBSlugOnly = 'user-b-private-promo';
    memStore.links.unshift({
      id: 'lnk_b_private',
      ownerEmail: userBEmail,
      dest: 'https://example.com/b-secret',
      slug: userBSlugOnly,
      createdAt: new Date()
    });

    try {
      const resCrossTenant = await request(`/${userBSlugOnly}`, {
        headers: {
          Host: testDomain
        }
      });

      assert.strictEqual(resCrossTenant.status, 404);
      pass('Tenant isolation prevents another user’s shortlinks from resolving on custom domain');
    } catch (err) {
      fail('Cross-tenant isolation test failed', err);
    }

    // Test 7: Unconfigured / unverified custom domain returns 404 Domain Not Active
    try {
      const resUnverified = await request('/some-slug', {
        headers: {
          Host: 'unregistered-domain.com'
        }
      });
      assert.strictEqual(resUnverified.status, 404);
      assert.ok(resUnverified.body.includes('Custom Domain Not Active'));
      pass('Unverified or unconfigured custom domains return clean 404 Not Active');
    } catch (err) {
      fail('Unverified domain response test failed', err);
    }

    console.log('\n🔒 4. Reverse Proxy Internal Ask Endpoint (/internal/domain-allowed):');

    // Test 8: Internal ask endpoint enforces x-router-secret
    try {
      const resNoSecret = await request(`/internal/domain-allowed?domain=${testDomain}`);
      assert.strictEqual(resNoSecret.status, 401);

      const resBadSecret = await request(`/internal/domain-allowed?domain=${testDomain}`, {
        headers: { 'x-router-secret': 'wrong-secret' }
      });
      assert.strictEqual(resBadSecret.status, 401);

      const resValid = await request(`/internal/domain-allowed?domain=${testDomain}`, {
        headers: { 'x-router-secret': config.internalRouterSecret }
      });
      assert.strictEqual(resValid.status, 200);
      assert.strictEqual(resValid.json.allowed, true);
      assert.strictEqual(resValid.json.ownerEmail, userAEmail);

      const resInactive = await request(`/internal/domain-allowed?domain=unknown.com`, {
        headers: { 'x-router-secret': config.internalRouterSecret }
      });
      assert.strictEqual(resInactive.status, 200);
      assert.strictEqual(resInactive.json.allowed, false);
      pass('Reverse-proxy ask endpoint validates secret header and returns accurate active status');
    } catch (err) {
      fail('Internal ask endpoint test failed', err);
    }

    console.log('\n🗑️ 5. Domain Ownership & Deletion Security:');

    // Test 9: User B cannot delete User A's domain
    try {
      const resForbidden = await request(`/api/domains/${testDomain}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.strictEqual(resForbidden.status, 403);

      const resDelete = await request(`/api/domains/${testDomain}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.strictEqual(resDelete.status, 200);
      assert.strictEqual(resDelete.json.success, true);
      pass('Custom domain delete strictly enforces authenticated ownership');
    } catch (err) {
      fail('Domain deletion ownership test failed', err);
    }

    console.log('\n====================================');
    console.log('Branded Custom Domains Suite: All Passed Successfully! 🚀');
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
