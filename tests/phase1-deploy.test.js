'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

const app = require('../backend/server');
const config = require('../backend/config');

async function runPhase1Tests() {
  console.log('🧪 Running Phase 1 Deployment, Clean URLs & Env Validator Tests...');

  // 1. Static deploy artifacts check
  const root = path.join(__dirname, '..');
  assert(!fs.existsSync(path.join(root, 'CNAME')), 'CNAME must be removed');
  assert(!fs.existsSync(path.join(root, '.nojekyll')), '.nojekyll must be removed');
  assert(fs.existsSync(path.join(root, 'vercel.json')), 'vercel.json must exist for Vercel Express deployment');
  assert(fs.existsSync(path.join(root, 'api', 'index.js')), 'api/index.js serverless entrypoint must exist');
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert(
    Array.isArray(vercelCfg.rewrites) &&
      vercelCfg.rewrites.some((r) => r.destination === '/api/index.js'),
    'vercel.json must rewrite routes cleanly through /api/index.js (Express)'
  );
  assert(fs.existsSync(path.join(root, 'render.yaml')), 'render.yaml must exist');
  assert(fs.existsSync(path.join(root, 'Dockerfile')), 'Dockerfile must exist');
  assert(fs.existsSync(path.join(root, 'docs', 'DEPLOY.md')), 'docs/DEPLOY.md must exist');
  const errHtml = fs.readFileSync(path.join(root, 'public', '404.html'), 'utf8');
  assert(!errHtml.includes('hea_slug_'), '404.html must not contain GitHub Pages localStorage redirect hack');
  console.log('  ✅ PASS: Deploy artifacts & 404.html verified');

  // 2. Startup env validator unit tests
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb://127.0.0.1:27017/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store'
        }
      }),
    /MONGODB_URI/
  );
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'short',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: 'https://www.healink.store'
        }
      }),
    /JWT_SECRET/
  );
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'healink-internal-secret-2026',
          CORS_ORIGIN: 'https://www.healink.store'
        }
      }),
    /INTERNAL_ROUTER_SECRET/
  );
  assert.throws(
    () =>
      config.validateEnv({
        env: 'production',
        silent: true,
        rawEnv: {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
          JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
          INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
          CORS_ORIGIN: ''
        }
      }),
    /CORS_ORIGIN/
  );
  const validProd = config.validateEnv({
    env: 'production',
    silent: true,
    rawEnv: {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/healink',
      JWT_SECRET: 'a_very_long_and_strong_random_jwt_secret_123456',
      INTERNAL_ROUTER_SECRET: 'prod_router_secret_987654',
      CORS_ORIGIN: 'https://www.healink.store'
    }
  });
  assert.strictEqual(validProd.valid, true);
  assert.strictEqual(validProd.features.emailVerification, false);
  console.log('  ✅ PASS: validateEnv() enforces production invariants & computes feature flags');

  // 3. HTTP route table & real 404 checks
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const cleanRoutes = [
      '/',
      '/pricing',
      '/integrations',
      '/developers',
      '/solutions',
      '/faq',
      '/ai',
      '/ai/assist',
      '/ai/mcp',
      '/ai/slug-generator',
      '/resources/utm-guide',
      '/qr-code',
      '/bio-pages',
      '/analytics',
      '/help',
      '/help/contact',
      '/help-contact',
      '/privacy',
      '/terms',
      '/report-abuse'
    ];

    for (const r of cleanRoutes) {
      const res = await fetch(`${baseUrl}${r}`);
      assert.strictEqual(res.status, 200, `Expected 200 for ${r}, got ${res.status}`);
    }
    console.log(`  ✅ PASS: All ${cleanRoutes.length} clean public routes returned HTTP 200`);

    const nf1 = await fetch(`${baseUrl}/nonexistent-slug-999`, { headers: { Accept: 'text/html' } });
    assert.strictEqual(nf1.status, 404, 'Unknown single-segment route must return 404');
    const nf1Body = await nf1.text();
    assert(nf1Body.includes('404'), '404 body must render branded 404 page');

    const nf2 = await fetch(`${baseUrl}/unknown/nested/route`, { headers: { Accept: 'text/html' } });
    assert.strictEqual(nf2.status, 404, 'Unknown multi-segment route must return 404');

    const nfApi = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
    assert.strictEqual(nfApi.status, 404, 'Unknown /api route must return 404');
    const nfJson = await nfApi.json();
    assert.strictEqual(nfJson.code, 'NOT_FOUND');

    const cfgRes = await fetch(`${baseUrl}/api/config`);
    assert.strictEqual(cfgRes.status, 200);
    const cfg = await cfgRes.json();
    assert(cfg.features && typeof cfg.features.emailVerification === 'boolean');
    console.log('  ✅ PASS: Unknown paths return HTTP 404 and /api/config exposes feature flags');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runPhase1Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 1 test failed:', err);
      process.exit(1);
    });
}

module.exports = runPhase1Tests;
