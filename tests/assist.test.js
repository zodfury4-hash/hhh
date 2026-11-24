const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const Link = require('../backend/models/Link');
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
  console.log('\n💬 Starting HEA Assist AI Conversational Studio Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const user1Email = 'assist_owner_1@example.com';
    const user2Email = 'assist_other_2@example.com';
    const token1 = makeToken(user1Email);

    // 1. GET /ai/assist dedicated studio page
    try {
      const res = await request('/ai/assist');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('HEA Assist AI Studio'));
      pass('GET /ai/assist serves 200 with responsive AI studio');
    } catch (err) {
      fail('GET /ai/assist serves 200 with responsive AI studio', err);
    }

    // 2. Authentication enforcement on Assist APIs
    try {
      const resChat = await request('/api/assist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'hello' }
      });
      assert.strictEqual(resChat.status, 401);

      const resConv = await request('/api/assist/conversations');
      assert.strictEqual(resConv.status, 401);

      pass('Unauthenticated access to /api/assist endpoints rejected with 401');
    } catch (err) {
      fail('Unauthenticated access to /api/assist endpoints rejected with 401', err);
    }

    // 3. User Data Isolation on Link Reads
    try {
      // Seed user1 link
      const slug1 = 'user1-link-' + Date.now();
      const link1 = { slug: slug1, dest: 'https://example.com/user1', ownerEmail: user1Email, totalClicks: 12 };
      const isDb = mongoose.connection.readyState === 1;
      if (isDb) {
        try { await Link.create(link1); } catch (_e) {}
      }
      if (Array.isArray(memStore.links)) memStore.links.push(link1);

      // Seed user2 link
      const slug2 = 'user2-link-' + Date.now();
      const link2 = { slug: slug2, dest: 'https://secret.com/user2', ownerEmail: user2Email, totalClicks: 99 };
      if (isDb) {
        try { await Link.create(link2); } catch (_e) {}
      }
      if (Array.isArray(memStore.links)) memStore.links.push(link2);

      // Ask assistant as user1 to list links
      const res = await request('/api/assist/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token1
        },
        body: {
          message: 'list my recent links'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.json.reply.includes(slug1));
      // Must NOT leak user2's link or secret
      assert.ok(!res.json.reply.includes(slug2));
      assert.ok(!res.json.reply.includes('secret.com'));

      pass('HEA Assist strictly isolates user data and never leaks other tenants links');
    } catch (err) {
      fail('HEA Assist strictly isolates user data and never leaks other tenants links', err);
    }

    // 4. Write Action Confirmation Safety Protocol
    let actionIdToConfirm = null;
    let targetSlug = null;
    try {
      const res = await request('/api/assist/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token1
        },
        body: {
          message: 'shorten https://store.brand.com/products/summer26 with high CTR'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.json.pendingAction, 'Must return a pending action proposal');
      assert.strictEqual(res.json.pendingAction.toolName, 'create_link');
      assert.strictEqual(res.json.pendingAction.status, 'pending');

      actionIdToConfirm = res.json.pendingAction.actionId;
      targetSlug = res.json.pendingAction.params.slug;

      // Verify link does NOT yet exist in database before confirmation!
      let preCheck = null;
      try {
        preCheck = await Link.findOne({ slug: targetSlug });
      } catch (_e) {}
      const memPreCheck = (memStore.links || []).find((l) => l.slug === targetSlug);
      assert.strictEqual(preCheck, null);
      assert.strictEqual(memPreCheck, undefined);

      pass('Write actions are strictly held as pendingAction without executing before confirmation');
    } catch (err) {
      fail('Write actions are strictly held as pendingAction without executing before confirmation', err);
    }

    // 5. User Confirmation Executes the Proposed Action
    try {
      const res = await request(`/api/assist/actions/${actionIdToConfirm}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token1
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.success, true);

      // Verify link now exists and is owned by user1
      const memPostCheck = (memStore.links || []).find((l) => l.slug === targetSlug);
      assert.ok(memPostCheck, 'Link must be saved in database/store upon confirmation');
      assert.strictEqual(memPostCheck.ownerEmail, user1Email);

      pass('POST /api/assist/actions/:id/confirm securely executes action upon user consent');
    } catch (err) {
      fail('POST /api/assist/actions/:id/confirm securely executes action upon user consent', err);
    }

    // 6. Action Cancellation
    try {
      // Create another action proposal
      const resChat = await request('/api/assist/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token1
        },
        body: {
          message: 'shorten https://discard.example.com/unwanted'
        }
      });

      const cancelActionId = resChat.json.pendingAction.actionId;
      const resCancel = await request(`/api/assist/actions/${cancelActionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token1
        }
      });

      assert.strictEqual(resCancel.status, 200);
      assert.strictEqual(resCancel.json.status, 'rejected');

      pass('POST /api/assist/actions/:id/cancel cancels pending proposal safely');
    } catch (err) {
      fail('POST /api/assist/actions/:id/cancel cancels pending proposal safely', err);
    }

    // 7. Conversation lifecycle (list, fetch, delete)
    try {
      const listRes = await request('/api/assist/conversations', {
        headers: { 'Authorization': 'Bearer ' + token1 }
      });
      assert.strictEqual(listRes.status, 200);
      assert.ok(Array.isArray(listRes.json.conversations));
      assert.ok(listRes.json.conversations.length > 0);

      const convId = listRes.json.conversations[0].conversationId;
      const getRes = await request(`/api/assist/conversations/${convId}`, {
        headers: { 'Authorization': 'Bearer ' + token1 }
      });
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.json.conversation.conversationId, convId);

      const delRes = await request(`/api/assist/conversations/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token1 }
      });
      assert.strictEqual(delRes.status, 200);
      assert.strictEqual(delRes.json.success, true);

      pass('Conversation history is tracked, retrievable, and deletable by user');
    } catch (err) {
      fail('Conversation history is tracked, retrievable, and deletable by user', err);
    }

    console.log('\n🎉 ALL 7 HEA Assist AI tests passed!\n');
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (err) {
    fail('HEA Assist AI Test Suite', err);
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
