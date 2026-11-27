'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const http = require('http');
const { chromium } = require('playwright-core');

const app = require('../backend/server');
const { isValidDestinationUrl } = require('../backend/middleware/validation');

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (_e) {
    for (const channel of ['msedge', 'chrome']) {
      try {
        return await chromium.launch({ headless: true, channel });
      } catch (_e2) {}
    }
    throw _e;
  }
}

async function runPhase3Tests() {
  console.log('🧪 Running Phase 3 Security, CSP, SSRF & Loop Protection Tests...');

  // 1. SSRF + self-domain redirect loop checks
  assert.strictEqual(isValidDestinationUrl('https://example.org/valid'), true);
  assert.strictEqual(isValidDestinationUrl('javascript:alert(1)'), false);
  assert.strictEqual(isValidDestinationUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.strictEqual(isValidDestinationUrl('file:///etc/passwd'), false);
  assert.strictEqual(isValidDestinationUrl('http://127.0.0.1:3000/abc'), false);
  assert.strictEqual(isValidDestinationUrl('http://169.254.169.254/latest/meta-data'), false);
  assert.strictEqual(isValidDestinationUrl('https://www.healink.store/self-loop'), false);
  assert.strictEqual(isValidDestinationUrl('https://healink.store/self-loop'), false);
  console.log('  ✅ PASS: URL validator blocks dangerous schemes, private IPs, and self-domain redirect loops');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3000, '127.0.0.1', resolve));
  const baseUrl = 'http://127.0.0.1:3000';

  let browser;
  try {
    // 2. Security headers & CSP audit
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const csp = res.headers.get('content-security-policy') || '';
    const scriptDirective = (csp.split(';').find((d) => d.trim().startsWith('script-src ')) || '').trim();
    assert(scriptDirective.includes("'nonce-"), 'script-src must include per-request nonce');
    assert(!scriptDirective.includes("'unsafe-eval'"), 'script-src must NOT contain unsafe-eval');
    assert(!scriptDirective.includes("'unsafe-inline'"), 'script-src must NOT contain unsafe-inline');
    assert(!csp.includes('identitytoolkit.googleapis.com'), 'CSP must not contain Firebase identitytoolkit');
    assert(!csp.includes('securetoken.googleapis.com'), 'CSP must not contain Firebase securetoken');
    assert(csp.includes("frame-ancestors 'none'"), 'CSP must set frame-ancestors none');
    assert(csp.includes("base-uri 'self'"), 'CSP must set base-uri self');
    assert(csp.includes("form-action 'self'"), 'CSP must set form-action self');
    console.log('  ✅ PASS: Helmet CSP eliminates unsafe-eval/unsafe-inline/Firebase and enforces frame/base/form directives');

    // 3. Playwright check: landing, developers (inline script w/ nonce), and dashboard load with ZERO CSP console errors
    browser = await launchBrowser();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const cspErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /content security policy|csp|refused to execute/i.test(msg.text())) {
        cspErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => cspErrors.push(err.message));

    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.goto(`${baseUrl}/developers`, { waitUntil: 'networkidle' });
    await page.goto(`${baseUrl}/help`, { waitUntil: 'networkidle' });
    await page.goto(`${baseUrl}/app.html#login`, { waitUntil: 'networkidle' });
    assert.strictEqual(cspErrors.length, 0, 'Unexpected CSP/page errors: ' + cspErrors.join('; '));
    console.log('  ✅ PASS: Landing, clean HTML pages, and app.html load with ZERO CSP violations in Chromium');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runPhase3Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 3 test failed:', err);
      process.exit(1);
    });
}

module.exports = runPhase3Tests;
