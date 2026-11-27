'use strict';

const assert = require('assert');

process.env.NODE_ENV = 'test';

async function runPhase7Test() {
  console.log('\n🧪 Running Phase 7 Observability, Health, Readiness & Cleanup Tests...');

  const app = require('../backend/server');
  const memStore = require('../backend/utils/memStore');
  const { runCleanupPass } = require('../backend/utils/cleanup');
  const { parseDsn } = require('../backend/utils/telemetryReporter');

  let server;
  try {
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    // 1. Correlation X-Request-Id preserved and generated
    const customReqId = 'req-phase7-trace-123';
    const healthRes = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': customReqId }
    });
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.headers.get('x-request-id'), customReqId);
    const healthBody = await healthRes.json();
    assert.strictEqual(healthBody.ok, true);
    assert.strictEqual(healthBody.reqId, customReqId);
    console.log('  ✅ PASS: /health returns 200 and echoes X-Request-Id');

    // 2. /ready verifies DB + config + mail checks and generates UUID request ID if omitted
    const readyRes = await fetch(`${baseUrl}/ready`);
    assert.strictEqual(readyRes.status, 200);
    assert.ok(readyRes.headers.get('x-request-id'), 'Expected auto-generated X-Request-Id');
    const readyBody = await readyRes.json();
    assert.strictEqual(readyBody.ready, true);
    assert.strictEqual(readyBody.checks.config, 'valid');
    console.log('  ✅ PASS: /ready endpoint reports dependency checks accurately');

    // 3. Sentry DSN parser checks
    assert.strictEqual(parseDsn(''), null);
    const validDsn = parseDsn('https://abc123def456@o123.ingest.sentry.io/456789');
    assert.ok(validDsn && validDsn.endpoint.includes('/api/456789/envelope/'));
    console.log('  ✅ PASS: Telemetry Sentry DSN parser validated');

    // 4. Cleanup pass removes expired OTP artifacts and expired guest links
    memStore.users.push({
      email: 'cleanup_user@example.com',
      isVerified: true,
      verificationCode: '123456',
      verificationCodeHash: 'hash',
      verificationCodeExpires: new Date(Date.now() - 60000)
    });
    memStore.links.push({
      id: 'expired_guest',
      ownerEmail: 'guest',
      slug: 'exp-guest-1',
      dest: 'https://example.org',
      expiresAt: new Date(Date.now() - 60000)
    });

    const summary = await runCleanupPass(new Date());
    assert.ok(summary.clearedOtpUsers >= 1);
    assert.ok(summary.prunedExpiredLinks >= 1);
    console.log('  ✅ PASS: Cleanup job pruned stale OTP tokens and expired guest links');

    console.log('\n🎉 Phase 7 Observability & Operations Tests PASSED!\n');
  } finally {
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false).catch(() => {});
    }
  }
}

module.exports = runPhase7Test;

if (require.main === module) {
  runPhase7Test()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 7 Test Failed:', err);
      process.exit(1);
    });
}
