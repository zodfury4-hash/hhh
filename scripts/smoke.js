#!/usr/bin/env node
'use strict';

/**
 * Post-Deploy Smoke Verification Script
 * Usage:
 *   SMOKE_URL=https://www.healink.store node scripts/smoke.js
 */

const assert = require('assert');

const BASE_URL = (process.env.SMOKE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');

async function checkGet(path, expectedStatus = 200, containsText = null) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { redirect: 'manual' });
  assert.strictEqual(res.status, expectedStatus, `GET ${url} expected ${expectedStatus}, got ${res.status}`);
  if (containsText) {
    const body = await res.text();
    assert.ok(body.includes(containsText), `GET ${url} missing expected marker "${containsText}"`);
  }
  console.log(`  ✅ GET ${path} -> ${res.status}`);
}

async function main() {
  console.log(`\n🔍 Running Smoke Verification against: ${BASE_URL}\n`);

  await checkGet('/health', 200, '"status"');
  await checkGet('/', 200, 'HEA Link');
  await checkGet('/pricing', 200, 'Pricing');
  await checkGet('/integrations', 200, 'Integrations');
  await checkGet('/developers', 200, 'API');
  await checkGet('/robots.txt', 200, 'Sitemap:');
  await checkGet('/sitemap.xml', 200, '<urlset');
  await checkGet('/this-route-does-not-exist-smoke', 404);

  // Confirm dynamic Express API responds (never 405 static-host error)
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.notStrictEqual(loginRes.status, 405, 'POST /api/auth/login returned 405 Method Not Allowed (static host!)');
  assert.strictEqual(loginRes.status, 400, `POST /api/auth/login empty payload expected 400, got ${loginRes.status}`);
  console.log(`  ✅ POST /api/auth/login -> ${loginRes.status} (backend active, not 405)`);

  console.log('\n🎉 Post-deploy smoke verification PASSED!\n');
}

main().catch((err) => {
  console.error('\n❌ Smoke verification FAILED:', err.message || err);
  process.exit(1);
});
