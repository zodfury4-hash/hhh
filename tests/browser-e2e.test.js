/* global document, window */
'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_automated_browser_e2e_testing_32chars';
process.env.GOOGLE_CLIENT_ID = 'test-e2e-google-client.apps.googleusercontent.com';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { chromium } = require('playwright-core');

const ARTIFACT_DIR = path.join(__dirname, '..', 'test-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Capture OTP emails in memory before server boots
const capturedOtps = new Map();
const mailerPath = require.resolve('../backend/utils/mailer');
require.cache[mailerPath] = {
  id: mailerPath,
  filename: mailerPath,
  loaded: true,
  exports: {
    verifyMailTransport: async () => ({ ok: true, code: 'MOCK_OK' }),
    sendVerificationEmail: async (email, _name, code) => {
      capturedOtps.set(String(email).toLowerCase().trim(), String(code));
      return { success: true };
    },
    sendPasswordResetEmail: async (email, _name, code) => {
      capturedOtps.set(String(email).toLowerCase().trim(), String(code));
      return { success: true };
    },
    sendEmail: async () => ({ success: true }),
    sendWorkspaceInviteEmail: async () => ({ success: true }),
    sendSupportTicketEmail: async () => ({ success: true })
  }
};

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chromium/Edge/Chrome executable found for playwright-core.');
}

async function runBrowserE2E() {
  console.log('\n🎭 Starting Playwright Browser E2E Verification Suite...\n');

  let mongoServer = null;
  let usingMongo = false;

  if (process.env.USE_MONGO_MEMORY === 'true') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.DISABLE_MEMSTORE = 'true';
    usingMongo = true;
  } else if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('127.0.0.1:27017')) {
    process.env.DISABLE_MEMSTORE = 'true';
    usingMongo = true;
  } else {
    console.log('  ℹ️ Running Playwright E2E with resilient in-memory store (set USE_MONGO_MEMORY=true to use MongoMemoryServer).');
    process.env.DISABLE_MEMSTORE = 'false';
  }

  const socialAuth = require('../backend/services/socialAuth');
  socialAuth.verifyGoogleIdToken = async (credential) => {
    if (credential === 'mock-e2e-google-id-token') {
      return {
        sub: 'google_e2e_sub_1001',
        email: 'google.e2e@example.com',
        name: 'Google E2E User',
        avatar: 'https://example.com/avatar.png',
        emailVerified: true
      };
    }
    const err = new Error('Invalid Google ID token');
    err.statusCode = 401;
    throw err;
  };

  const app = require('../backend/server');
  const User = require('../backend/models/User');
  const Link = require('../backend/models/Link');
  const QRCode = require('../backend/models/QRCode');
  const BioPage = require('../backend/models/BioPage');
  const memStore = require('../backend/utils/memStore');

  if (usingMongo) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    } else if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
    }
    await Promise.all([User.syncIndexes(), Link.syncIndexes(), QRCode.syncIndexes(), BioPage.syncIndexes()]);
  }

  const PORT = Number(process.env.E2E_PORT || 3105);
  const BASE_URL = `http://127.0.0.1:${PORT}`;
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
  console.log(`  🌐 Express listening on ${BASE_URL}`);

  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP e2e-target.example.com 127.0.0.1']
  });

  const consoleErrors = [];
  const pageErrors = [];
  const firebaseRequests = [];
  const server500Responses = [];
  const unexpectedLocalFailures = [];

  async function attachObservers(context, page) {
    page.on('dialog', (dialog) => dialog.accept().catch(() => {}));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (/401\s*\(Unauthorized\)|status of 401|status of 400/i.test(text)) return;
        consoleErrors.push(text);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(err.message || String(err)));
    page.on('response', (res) => {
      if (res.status() >= 500) {
        server500Responses.push(`${res.status()} ${res.url()}`);
      }
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      const errText = req.failure()?.errorText || '';
      if (url.startsWith(BASE_URL) && !errText.includes('ERR_ABORTED')) {
        unexpectedLocalFailures.push(`${url} (${errText})`);
      }
    });

    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (/firebaseio\.com|gstatic\.com\/firebasejs|firebaseapp\.com|firebase/i.test(url)) {
        firebaseRequests.push(url);
        return route.abort();
      }
      if (url.startsWith('https://accounts.google.com/gsi/client')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: 'window.google=window.google||{};window.google.accounts=window.google.accounts||{};window.google.accounts.id={initialize(){},prompt(){}};'
        });
      }
      if (url.startsWith('https://tinyurl.com/') || url.startsWith('https://is.gd/')) {
        return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
      }
      if (url.startsWith('https://e2e-target.example.com/')) {
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Target Destination Reached</h1></body></html>'
        });
      }
      return route.continue();
    });
  }

  try {
    // =========================================================================
    // DESKTOP E2E (1280x800)
    // =========================================================================
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await desktopCtx.newPage();
    await attachObservers(desktopCtx, page);

    // Step 1: Landing page + verify zero Firebase scripts
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const hasFirebaseScript = await page.evaluate(() => {
      return Array.from(document.scripts).some((s) => /firebase/i.test(s.src || '') || /firebaseio\.com/i.test(s.textContent || ''));
    });
    assert.strictEqual(hasFirebaseScript, false, 'Landing page must contain zero Firebase scripts');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-landing-desktop.png') });
    console.log('  ✅ Desktop Landing loaded cleanly');

    // Step 2: Signup via React AuthModal on /#signup -> OTP verify -> Dashboard
    const testEmail = 'e2e.browser@example.com';
    const testPass = 'BrowserPass123!';
    await page.goto(`${BASE_URL}/#signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });

    const appleCount = await page.locator('button:has-text("Continue with Apple")').count();
    assert.strictEqual(appleCount, 0, 'Apple SSO button must be hidden when unconfigured');

    await page.fill('input[placeholder="Your Name"]', 'E2E Browser User');
    await page.fill('input[placeholder="you@company.com"]', testEmail);
    await page.fill('input[placeholder="••••••••"]', testPass);
    await page.locator('div.fixed form button[type="submit"]').click();

    await page.waitForSelector('input[maxlength="6"]', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-verify-otp.png') });

    const otp = capturedOtps.get(testEmail);
    assert.ok(otp && /^\d{6}$/.test(otp), `Expected captured 6-digit OTP, got: ${otp}`);
    await page.fill('input[maxlength="6"]', otp);
    await page.locator('div.fixed form button[type="submit"]').click();

    await page.waitForURL(/\/app\.html#dashboard/, { timeout: 15000 });
    await page.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-dashboard-home.png') });
    console.log('  ✅ Signup -> OTP verification -> Dashboard completed');

    // Step 3: Create Link -> open short link in fresh incognito context -> verify redirect & clicks
    await page.evaluate(() => window.appShell.navigate('create-link'));
    await page.waitForSelector('#newDestUrl', { state: 'visible', timeout: 8000 });
    await page.fill('#newDestUrl', 'https://e2e-target.example.com/promo');
    await page.fill('#newBackHalf', 'e2e-link-1');
    const [linkCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/links') && r.request().method() === 'POST'),
      page.click('#btnSubmitNewLink')
    ]);
    assert.strictEqual(linkCreateRes.status(), 200);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-links-list.png') });

    const anonCtx = await browser.newContext();
    const redirRes = await anonCtx.request.get(`${BASE_URL}/e2e-link-1`, { maxRedirects: 0 });
    assert.strictEqual(redirRes.status(), 302, `Expected 302 redirect for /e2e-link-1, got ${redirRes.status()}`);
    assert.strictEqual(redirRes.headers()['location'], 'https://e2e-target.example.com/promo');
    await anonCtx.close();

    if (usingMongo) {
      const dbLinkAfterClick = await Link.findOne({ slug: 'e2e-link-1' }).lean();
      assert.ok(dbLinkAfterClick && dbLinkAfterClick.clickCount >= 1);
    } else {
      const memLink = memStore.links.find((l) => l.slug === 'e2e-link-1');
      assert.ok(memLink && (memLink.clickCount >= 1 || memLink.totalClicks >= 1));
    }
    console.log('  ✅ Create Link -> Anonymous short redirect -> Click recorded');

    // Step 4: Analytics view & QR & Bio Page creation + cleanup
    await page.goto(`${BASE_URL}/app.html#analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-analytics.png') });

    await page.goto(`${BASE_URL}/app.html#qr`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const createQrBtn = page.locator('#btnNewQrHero, #btnLaunchQrForm').first();
    await createQrBtn.waitFor({ state: 'visible', timeout: 8000 });
    await createQrBtn.click();
    await page.waitForSelector('#qrInputDest', { state: 'visible', timeout: 8000 });
    await page.fill('#qrInputDest', 'https://e2e-target.example.com/qr-menu');
    await page.fill('#qrInputTitle', 'E2E Table QR');
    const [qrCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/qrs') && r.request().method() === 'POST'),
      page.click('#btnDesignYourCode')
    ]);
    assert.strictEqual(qrCreateRes.status(), 200);
    await page.waitForTimeout(400);

    await page.goto(`${BASE_URL}/app.html#pages`, { waitUntil: 'networkidle' });
    await page.locator('.btn-use-template').first().waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('.btn-use-template').first().click();
    await page.waitForSelector('#configBioSlug', { state: 'visible', timeout: 8000 });
    await page.fill('#configBioSlug', 'e2e-bio-1');
    await page.fill('#configBioTitle', 'E2E Public Bio');
    const [bioCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/bios') && r.request().method() === 'POST'),
      page.click('#btnPublishConfiguredPage')
    ]);
    assert.strictEqual(bioCreateRes.status(), 200);
    await page.waitForTimeout(300);

    const bioTab = await desktopCtx.newPage();
    await bioTab.goto(`${BASE_URL}/m/e2e-bio-1`, { waitUntil: 'domcontentloaded' });
    const bioText = await bioTab.textContent('body');
    assert.ok(bioText.includes('E2E Public Bio'));
    await bioTab.screenshot({ path: path.join(ARTIFACT_DIR, '06-bio-public.png') });
    await bioTab.close();

    // Delete link cleanly
    await page.goto(`${BASE_URL}/app.html#links`, { waitUntil: 'networkidle' });
    const delBtn = page.locator('button[title="Delete link"][onclick*="e2e-link-1"]').first();
    await delBtn.waitFor({ state: 'visible', timeout: 8000 });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/links/') && r.request().method() === 'DELETE'),
      delBtn.click()
    ]);
    await desktopCtx.close();
    console.log('  ✅ Analytics, QR, Bio Page (/m/e2e-bio-1), and Cleanup verified');

    // =========================================================================
    // MOBILE E2E (390x844)
    // =========================================================================
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();
    await attachObservers(mobileCtx, mPage);

    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForTimeout(500);
    await mPage.screenshot({ path: path.join(ARTIFACT_DIR, '07-mobile-landing.png') });

    await mPage.goto(`${BASE_URL}/#login`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('input[placeholder="you@company.com"]', { state: 'visible', timeout: 10000 });
    await mPage.fill('input[placeholder="you@company.com"]', testEmail);
    await mPage.fill('input[placeholder="••••••••"]', testPass);
    await mPage.locator('div.fixed form button[type="submit"]').click();
    await mPage.waitForURL(/\/app\.html#dashboard/, { timeout: 15000 });
    await mPage.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await mPage.waitForTimeout(400);
    await mPage.screenshot({ path: path.join(ARTIFACT_DIR, '08-mobile-dashboard.png') });
    await mobileCtx.close();
    console.log('  ✅ Mobile (390x844) landing & AuthModal login -> dashboard verified');

    assert.deepStrictEqual(firebaseRequests, [], `Firebase requests detected: ${firebaseRequests.join(', ')}`);
    assert.deepStrictEqual(server500Responses, [], `500 responses detected: ${server500Responses.join(', ')}`);
    assert.deepStrictEqual(unexpectedLocalFailures, [], `Failed local requests: ${unexpectedLocalFailures.join(', ')}`);
    assert.deepStrictEqual(pageErrors, [], `Uncaught page errors: ${pageErrors.join(', ')}`);
    assert.deepStrictEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join(', ')}`);

    console.log('\n🎉 ALL PLAYWRIGHT DESKTOP & MOBILE E2E CHECKS PASSED!\n');
  } finally {
    await browser.close().catch(() => {});
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

if (require.main === module) {
  runBrowserE2E()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Browser E2E failed:', err);
      process.exit(1);
    });
}

module.exports = runBrowserE2E;
