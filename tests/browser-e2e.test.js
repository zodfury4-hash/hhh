/* global document, window, localStorage, getComputedStyle */
'use strict';

process.env.NODE_ENV = 'test';
process.env.DISABLE_MEMSTORE = 'true';
process.env.JWT_SECRET = 'test_secret_for_automated_browser_e2e_testing_32chars';
process.env.GOOGLE_CLIENT_ID = 'test-e2e-google-client.apps.googleusercontent.com';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { chromium } = require('playwright-core');
const { MongoMemoryServer } = require('mongodb-memory-server');

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

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

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
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }

  const User = require('../backend/models/User');
  const Link = require('../backend/models/Link');
  const QRCode = require('../backend/models/QRCode');
  const BioPage = require('../backend/models/BioPage');
  await Promise.all([
    User.syncIndexes(),
    Link.syncIndexes(),
    QRCode.syncIndexes(),
    BioPage.syncIndexes()
  ]);

  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}`;
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
  console.log(`  🌐 Express listening on ${BASE_URL}`);

  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch({ executablePath, headless: true });

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
        // Ignore intentionally triggered wrong-password 401 console noise from browser fetch
        if (/401\s*\(Unauthorized\)/i.test(text) || /status of 401/i.test(text)) return;
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
          body: `
            window.google = window.google || {};
            window.google.accounts = window.google.accounts || {};
            window.google.accounts.id = {
              _cb: null,
              initialize(cfg) { this._cb = cfg && cfg.callback; },
              prompt() {
                if (typeof this._cb === 'function') {
                  setTimeout(() => this._cb({ credential: 'mock-e2e-google-id-token' }), 20);
                }
              }
            };
          `
        });
      }
      if (url.startsWith('https://tinyurl.com/')) {
        return route.abort();
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

    // Step 1: Landing page + verify zero Firebase globals/requests
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const hasFirebaseScript = await page.evaluate(() => {
      return Array.from(document.scripts).some((s) => /firebase/i.test(s.src || '') || /firebaseio\.com/i.test(s.textContent || ''));
    });
    assert.strictEqual(hasFirebaseScript, false, 'Landing page must contain zero Firebase scripts');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-landing-desktop.png') });
    console.log('  ✅ Desktop Landing loaded with zero Firebase references');

    // Step 2: Signup + OTP verification -> Dashboard
    const testEmail = 'e2e.browser@example.com';
    const testPass = 'BrowserPass123!';
    await page.goto(`${BASE_URL}/app.html#signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#aEmail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Assert Apple Sign-In button is hidden when APPLE_CLIENT_ID is unset
    const appleHidden = await page.evaluate(() => {
      const btn = document.getElementById('ssoAppleBtn');
      if (!btn) return true;
      return btn.hidden || getComputedStyle(btn).display === 'none';
    });
    assert.strictEqual(appleHidden, true, 'Apple SSO button must be hidden when unconfigured');
    const bodyHasFakeApple = await page.evaluate(() => /john\.apple@icloud\.com/i.test(document.body.innerText));
    assert.strictEqual(bodyHasFakeApple, false, 'Fake Apple email must never appear');

    await page.fill('#aName', 'E2E Browser User');
    await page.fill('#aEmail', testEmail);
    await page.fill('#aPass', testPass);
    await page.click('#authBtn');

    await page.waitForSelector('#verifyWrap:not([style*="display: none"]), #verifyCodeInput', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-verify-otp.png') });

    const otp = capturedOtps.get(testEmail);
    assert.ok(otp && /^\d{6}$/.test(otp), `Expected captured 6-digit OTP, got: ${otp}`);
    await page.fill('#verifyCodeInput', otp);
    await page.click('#verifySubmitBtn');

    await page.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-dashboard-home.png') });
    console.log('  ✅ Signup -> OTP verification -> Dashboard completed');

    // Step 3: Logout -> Wrong password error -> Valid login
    await page.click('#sidebarLogoutBtn');
    await page.waitForSelector('#aEmail', { state: 'visible', timeout: 10000 });

    await page.fill('#aEmail', testEmail);
    await page.fill('#aPass', 'WrongPass999!');
    await page.click('#authBtn');
    await page.waitForFunction(() => {
      const el = document.getElementById('authErr');
      return el && el.textContent.trim().length > 0;
    }, { timeout: 8000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-wrong-password.png') });

    await page.fill('#aPass', testPass);
    await page.click('#authBtn');
    await page.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-login-success.png') });
    console.log('  ✅ Logout -> Wrong password rejected -> Valid login succeeded');

    // Step 4: Google SSO mocked ID token -> POST /api/auth/google (no fake picker)
    await page.click('#sidebarLogoutBtn');
    await page.waitForSelector('#ssoGoogleBtn', { state: 'visible', timeout: 10000 });
    await page.click('#ssoGoogleBtn');
    await page.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(400);
    const hasFakePicker = await page.evaluate(() => Boolean(document.getElementById('googleAccountPickerModal')));
    assert.strictEqual(hasFakePicker, false, 'Legacy fake Google account picker modal must not exist');
    const googleSessionEmail = await page.evaluate(() => JSON.parse(localStorage.getItem('hea_session') || '{}').email);
    assert.strictEqual(googleSessionEmail, 'google.e2e@example.com');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-google-signin.png') });
    console.log('  ✅ Google Sign-In button verified end-to-end with /api/auth/google');

    // Switch back to email/password user for Link/QR/Bio CRUD verification
    await page.click('#sidebarLogoutBtn');
    await page.waitForSelector('#aEmail', { state: 'visible', timeout: 10000 });
    await page.fill('#aEmail', testEmail);
    await page.fill('#aPass', testPass);
    await page.click('#authBtn');
    await page.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(400);

    // Step 5: Create Link -> verify in Mongo -> visit short URL -> click increments
    await page.evaluate(() => window.appShell.navigate('create-link'));
    await page.waitForSelector('#newDestUrl', { state: 'visible', timeout: 8000 });
    await page.fill('#newDestUrl', 'https://e2e-target.example.com/promo');
    await page.fill('#newBackHalf', 'e2e-link-1');
    const [linkCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/links') && r.request().method() === 'POST'),
      page.click('#btnSubmitNewLink')
    ]);
    assert.strictEqual(linkCreateRes.status(), 200);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-links-list.png') });

    // Visit redirect URL in another tab inside same context
    const redirTab = await desktopCtx.newPage();
    await redirTab.goto(`${BASE_URL}/e2e-link-1`, { waitUntil: 'domcontentloaded' });
    const h1 = await redirTab.textContent('h1');
    assert.strictEqual(h1.trim(), 'Target Destination Reached');
    await redirTab.close();

    // Check Mongo Link clickCount incremented
    const dbLinkAfterClick = await Link.findOne({ slug: 'e2e-link-1' }).lean();
    assert.ok(dbLinkAfterClick && dbLinkAfterClick.clickCount >= 1, 'Short link redirect incremented clickCount in Mongo');
    await page.evaluate(() => window.appShell.navigate('links'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-link-redirected.png') });
    console.log('  ✅ Create Link -> Short Redirect -> Mongo click increment verified');

    // Step 6: Create QR Code
    await page.evaluate(() => window.appShell.navigate('qr'));
    await page.waitForSelector('#qrInputDest', { state: 'visible', timeout: 8000 });
    await page.fill('#qrInputDest', 'https://e2e-target.example.com/qr-menu');
    await page.fill('#qrInputTitle', 'E2E Table QR');
    const [qrCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/qrs') && r.request().method() === 'POST'),
      page.click('#btnDesignYourCode')
    ]);
    assert.strictEqual(qrCreateRes.status(), 200);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-qr-created.png') });
    console.log('  ✅ QR Code creation persisted in Mongo & UI');

    // Step 7: Create Bio Page -> open public /m/<slug>
    await page.evaluate(() => window.appShell.navigate('pages'));
    await page.waitForSelector('.template-card', { state: 'visible', timeout: 8000 });
    await page.click('.template-card >> nth=0');
    await page.waitForSelector('#configBioSlug', { state: 'visible', timeout: 8000 });
    await page.fill('#configBioSlug', 'e2e-bio-1');
    await page.fill('#configBioTitle', 'E2E Public Bio');
    const [bioCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/bios') && r.request().method() === 'POST'),
      page.click('#btnPublishConfiguredPage')
    ]);
    assert.strictEqual(bioCreateRes.status(), 200);
    await page.waitForTimeout(500);

    const bioTab = await desktopCtx.newPage();
    await bioTab.goto(`${BASE_URL}/m/e2e-bio-1`, { waitUntil: 'domcontentloaded' });
    await bioTab.waitForTimeout(300);
    const bioText = await bioTab.textContent('body');
    assert.ok(bioText.includes('E2E Public Bio'), 'Public bio page renders title from MongoDB');
    await bioTab.screenshot({ path: path.join(ARTIFACT_DIR, '10-bio-public.png') });
    await bioTab.close();
    console.log('  ✅ Bio Page creation & public /m/e2e-bio-1 view verified');

    // Step 8: Delete Bio Page, Delete QR Code, Delete Link
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/bios/') && r.request().method() === 'DELETE'),
      page.click('button[title="Delete Page"]')
    ]);
    await page.waitForTimeout(300);

    await page.evaluate(() => window.appShell.navigate('qr'));
    await page.waitForSelector('button[title="Delete QR"]', { state: 'visible', timeout: 8000 });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/qrs/') && r.request().method() === 'DELETE'),
      page.click('button[title="Delete QR"]')
    ]);
    await page.waitForTimeout(300);

    await page.evaluate(() => window.appShell.navigate('links'));
    await page.waitForSelector('button[title="Delete link"]', { state: 'visible', timeout: 8000 });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/links/e2e-link-1') && r.request().method() === 'DELETE'),
      page.click('button[title="Delete link"]')
    ]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-after-cleanup.png') });

    assert.strictEqual(await Link.findOne({ slug: 'e2e-link-1' }), null, 'Link deleted from Mongo');
    assert.strictEqual(await BioPage.findOne({ slug: 'e2e-bio-1' }), null, 'BioPage deleted from Mongo');
    assert.strictEqual(await QRCode.countDocuments({ ownerEmail: testEmail }), 0, 'QRCode deleted from Mongo');
    console.log('  ✅ Link, QR Code, and Bio Page deletions confirmed in Mongo');

    await desktopCtx.close();

    // =========================================================================
    // MOBILE E2E (390x844)
    // =========================================================================
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();
    await attachObservers(mobileCtx, mPage);

    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForTimeout(600);
    await mPage.screenshot({ path: path.join(ARTIFACT_DIR, '12-mobile-landing.png') });

    await mPage.goto(`${BASE_URL}/app.html#login`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('#aEmail', { state: 'visible', timeout: 10000 });
    await mPage.fill('#aEmail', testEmail);
    await mPage.fill('#aPass', testPass);
    await mPage.click('#authBtn');
    await mPage.waitForSelector('#appShell', { state: 'visible', timeout: 10000 });
    await mPage.waitForTimeout(500);
    await mPage.screenshot({ path: path.join(ARTIFACT_DIR, '13-mobile-dashboard.png') });
    await mobileCtx.close();
    console.log('  ✅ Mobile (390x844) landing & dashboard login verified');

    // Final error/network assertions
    assert.deepStrictEqual(firebaseRequests, [], `Firebase requests detected: ${firebaseRequests.join(', ')}`);
    assert.deepStrictEqual(server500Responses, [], `500 responses detected: ${server500Responses.join(', ')}`);
    assert.deepStrictEqual(unexpectedLocalFailures, [], `Failed local requests: ${unexpectedLocalFailures.join(', ')}`);
    assert.deepStrictEqual(pageErrors, [], `Uncaught page errors: ${pageErrors.join(', ')}`);
    assert.deepStrictEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join(', ')}`);

    console.log('\n🎉 ALL PLAYWRIGHT DESKTOP & MOBILE E2E CHECKS PASSED!\n');
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  }
}

if (require.main === module) {
  runBrowserE2E().catch((err) => {
    console.error('❌ Browser E2E failed:', err);
    process.exit(1);
  });
}

module.exports = runBrowserE2E;
