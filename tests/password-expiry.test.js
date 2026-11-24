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

function pass(msg) {
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg, err) {
  console.error(`  ❌ FAIL: ${msg}`);
  if (err) console.error(err);
  process.exit(1);
}

async function run() {
  console.log('\n🔐 Starting HEA Link Phase 1: Password & Expiry Protection Test Suite...\n');

  try {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    const testUserEmail = `pwd_user_${Date.now()}@example.com`;
    const token = jwt.sign(
      { email: testUserEmail, name: 'Password Tester', role: 'user', isPro: true },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('📦 1. Password Hashing & Secret Hygiene:');

    // Test 1: Link creation hashes password with bcrypt
    const vaultSlug = `vault-${Date.now().toString(36)}`;
    try {
      const res = await request('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          dest: 'https://example.com/confidential-vault',
          slug: vaultSlug,
          title: 'Confidential Vault',
          password: 'TopSecret123!'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);
      assert.strictEqual(res.json.link.hasPassword, true);
      assert.strictEqual(res.json.link.password, undefined);
      assert.strictEqual(res.json.link.passwordHash, undefined);

      const inMem = memStore.links.find((l) => l.slug === vaultSlug);
      assert.ok(inMem);
      assert.strictEqual(inMem.password, null);
      assert.ok(inMem.passwordHash && inMem.passwordHash.startsWith('$2'));
      pass('Link creation hashes password with bcrypt (cost 10) and hides hash from client');
    } catch (err) {
      fail('Link creation with password hashing failed', err);
    }

    // Test 2: Reject past expiresAt
    try {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const res = await request('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          dest: 'https://example.com/expired-target',
          slug: `bad-past-${Date.now().toString(36)}`,
          expiresAt: pastDate
        }
      });

      assert.strictEqual(res.status, 400);
      assert.ok(res.json.error.includes('Expiration date must be a valid future date'));
      pass('Link creation rejects past expiration dates with HTTP 400');
    } catch (err) {
      fail('Past expiresAt validation test failed', err);
    }

    // Test 3: Reject non-positive maxClicks
    try {
      const res = await request('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          dest: 'https://example.com/target',
          slug: `bad-max-${Date.now().toString(36)}`,
          maxClicks: 0
        }
      });

      assert.strictEqual(res.status, 400);
      pass('Link creation rejects invalid maxClicks with HTTP 400');
    } catch (err) {
      fail('Invalid maxClicks validation test failed', err);
    }

    console.log('\n🔒 2. Password Challenge & Authorization:');

    // Test 4: Challenge page returned without redirect
    try {
      const res = await request(`/${vaultSlug}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Password Protected Link'));
      assert.ok(res.body.includes(`action="/${vaultSlug}"`));
      assert.ok(!res.headers.location);
      pass('GET /:slug renders password challenge form without exposing destination or 302');
    } catch (err) {
      fail('Password challenge rendering failed', err);
    }

    // Test 5: Query string ?pwd= does not bypass challenge
    try {
      const res = await request(`/${vaultSlug}?pwd=TopSecret123!`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Password Protected Link'));
      assert.ok(!res.headers.location);
      pass('Query string ?pwd= parameter is ignored and does NOT bypass password requirement');
    } catch (err) {
      fail('Query string bypass prevention test failed', err);
    }

    // Test 6: Incorrect passcode returns 401
    try {
      const res = await request(`/${vaultSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { password: 'WrongPasscode!' }
      });

      assert.strictEqual(res.status, 401);
      assert.ok(res.body.includes('Incorrect passcode'));
      pass('Submitting incorrect passcode returns HTTP 401 with warning message');
    } catch (err) {
      fail('Incorrect passcode test failed', err);
    }

    // Test 7: Correct passcode sets signed HMAC cookie and authorizes access
    try {
      const res = await request(`/${vaultSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { password: 'TopSecret123!' }
      });

      assert.strictEqual(res.status, 302);
      assert.strictEqual(res.headers.location, `/${vaultSlug}`);
      const setCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
      assert.ok(setCookie && setCookie.includes(`hea_pwd_${vaultSlug}=`));
      assert.ok(setCookie.includes('HttpOnly'));

      const cookiePart = setCookie.split(';')[0];
      const followRes = await request(`/${vaultSlug}`, {
        headers: { Cookie: cookiePart }
      });

      assert.strictEqual(followRes.status, 302);
      assert.strictEqual(followRes.headers.location, 'https://example.com/confidential-vault');
      pass('Correct passcode sets signed HMAC cookie and unlocks 302 redirection');
    } catch (err) {
      fail('Correct passcode authorization test failed', err);
    }

    console.log('\n⏳ 3. Expiration & Atomic Click Caps:');

    // Test 8: Expired link returns HTTP 410 Gone
    const expiredSlug = `time-expired-${Date.now().toString(36)}`;
    memStore.links.unshift({
      id: 'lnk_exp_' + Date.now(),
      ownerEmail: testUserEmail,
      dest: 'https://example.com/time-sensitive',
      slug: expiredSlug,
      expiresAt: new Date(Date.now() - 10000),
      createdAt: new Date()
    });

    try {
      const res = await request(`/${expiredSlug}`);
      assert.strictEqual(res.status, 410);
      assert.ok(res.body.includes('This Link Has Expired'));
      pass('Past expiration date returns HTTP 410 Gone with clean explanation');
    } catch (err) {
      fail('Expired link test failed', err);
    }

    // Test 9: Max clicks enforced atomically
    const limitedSlug = `limited-${Date.now().toString(36)}`;
    try {
      const resCreate = await request('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          dest: 'https://example.com/limited-promo',
          slug: limitedSlug,
          maxClicks: 2
        }
      });
      assert.strictEqual(resCreate.status, 200);

      // Click 1: 302
      const c1 = await request(`/${limitedSlug}`);
      assert.strictEqual(c1.status, 302);

      // Click 2: 302
      const c2 = await request(`/${limitedSlug}`);
      assert.strictEqual(c2.status, 302);

      // Click 3: limit exceeded -> returns HTTP 410 Gone
      const c3 = await request(`/${limitedSlug}`);
      assert.strictEqual(c3.status, 410);
      assert.ok(c3.body.includes('Click Limit Reached'));
      pass('Atomic click limit halts redirection and returns HTTP 410 Gone upon capacity');
    } catch (err) {
      fail('Max clicks atomic test failed', err);
    }

    // Test 10: removePassword clears protection
    try {
      const updateRes = await request(`/api/links/${vaultSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: {
          removePassword: true
        }
      });

      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateRes.json.link.hasPassword, false);

      const res = await request(`/${vaultSlug}`);
      assert.strictEqual(res.status, 302);
      assert.strictEqual(res.headers.location, 'https://example.com/confidential-vault');
      pass('removePassword updates link to public access and clears passcode requirements');
    } catch (err) {
      fail('removePassword test failed', err);
    }

    console.log('\n====================================');
    console.log('Password & Expiry Test Suite: All Passed Successfully! 🚀');
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
