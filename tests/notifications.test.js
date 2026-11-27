'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../backend/server');
const { JWT_SECRET } = require('../backend/middleware/auth');
const { createNotification } = require('../backend/services/notificationService');

function request(server, options, postData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (postData) {
      if (typeof postData === 'object' && !reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const req = http.request(reqOptions, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let body = data;
        try { body = JSON.parse(data); } catch (_e) {}
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'object' ? JSON.stringify(postData) : postData);
    }
    req.end();
  });
}

async function runNotificationsTests() {
  console.log('\n🔔 Running Suite: Notifications API & Delivery Engine Tests...');

  const server = http.createServer(app);
  await new Promise(res => server.listen(0, '127.0.0.1', res));

  try {
    const userA = { email: 'notif_user_a@example.com', name: 'User A', id: 'usr_notif_a', role: 'user' };
    const userB = { email: 'notif_user_b@example.com', name: 'User B', id: 'usr_notif_b', role: 'user' };
    const tokenA = jwt.sign(userA, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign(userB, JWT_SECRET, { expiresIn: '1h' });

    // 1. Unauthenticated rejection
    const unauthRes = await request(server, { path: '/api/notifications' });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be 401');
    console.log('  ✅ PASS: Rejects unauthenticated request with 401');

    // 2. Initial empty notifications
    const initRes = await request(server, {
      path: '/api/notifications',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(initRes.status, 200);
    assert.strictEqual(initRes.body.unreadCount, 0);
    console.log('  ✅ PASS: Returns empty notification state for fresh user');

    // 3. Create notification via notificationService
    const n1 = await createNotification({
      ownerEmail: userA.email,
      type: 'milestone',
      title: '10 Clicks Reached!',
      body: 'Your link hea.link/test has hit 10 clicks.',
      link: '/#analytics',
      refId: 'link_test_10'
    });
    assert.ok(n1, 'Notification should be created');
    console.log('  ✅ PASS: Notification created via notificationService');

    // 4. Deduplication by refId within 1 hour
    const n1Duplicate = await createNotification({
      ownerEmail: userA.email,
      type: 'milestone',
      title: '10 Clicks Reached! (Duplicate)',
      body: 'Duplicate attempt',
      refId: 'link_test_10'
    });
    assert.strictEqual(n1Duplicate, null, 'Duplicate notification with same refId within 1hr should be ignored');
    console.log('  ✅ PASS: Deduplication by refId suppresses duplicate notifications within 1 hour');

    // 5. Create a second notification for User A
    const n2 = await createNotification({
      ownerEmail: userA.email,
      type: 'domain',
      title: 'Domain Verified',
      body: 'Your custom domain go.brand.com is active.',
      refId: 'domain_verify_1'
    });
    assert.ok(n2, 'Second notification created');

    // 6. User B isolation check
    const userBRes = await request(server, {
      path: '/api/notifications',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.strictEqual(userBRes.status, 200);
    assert.strictEqual(userBRes.body.notifications.length, 0, 'User B must not see User A notifications');
    console.log('  ✅ PASS: Enforces user isolation across notifications');

    // 7. Check unread count endpoint for User A
    const countRes = await request(server, {
      path: '/api/notifications/unread-count',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(countRes.status, 200);
    assert.strictEqual(countRes.body.unreadCount, 2, 'User A should have 2 unread notifications');
    console.log('  ✅ PASS: GET /api/notifications/unread-count returns accurate count');

    // 8. Mark single notification as read
    const notifId = String(n1._id || n1.id);
    const readSingleRes = await request(server, {
      path: '/api/notifications/read',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    }, { ids: [notifId] });
    assert.strictEqual(readSingleRes.status, 200);
    assert.strictEqual(readSingleRes.body.updatedCount, 1);
    assert.strictEqual(readSingleRes.body.unreadCount, 1);
    console.log('  ✅ PASS: POST /api/notifications/read marks single notification as read');

    // 9. Mark all notifications as read
    const readAllRes = await request(server, {
      path: '/api/notifications/read',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    }, { all: true });
    assert.strictEqual(readAllRes.status, 200);
    assert.strictEqual(readAllRes.body.unreadCount, 0);
    console.log('  ✅ PASS: POST /api/notifications/read with all:true marks all as read');

    // 10. Delete notification
    const deleteRes = await request(server, {
      path: `/api/notifications/${notifId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.body.success, true);
    console.log('  ✅ PASS: DELETE /api/notifications/:id deletes notification');

    // 11. Cross-user deletion isolation (User B cannot delete User A's notification)
    const n2Id = String(n2._id || n2.id);
    const crossDeleteRes = await request(server, {
      path: `/api/notifications/${n2Id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.strictEqual(crossDeleteRes.status, 404, 'User B cannot delete User A notification');
    console.log('  ✅ PASS: Cross-user deletion forbidden (returns 404)');

    console.log('✨ All Notifications API & Service tests passed cleanly!\n');
    return true;
  } finally {
    await new Promise(res => server.close(res));
  }
}

if (require.main === module) {
  runNotificationsTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Notifications test failed:', err);
      process.exit(1);
    });
}

module.exports = runNotificationsTests;
