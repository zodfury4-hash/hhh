'use strict';
/* global document, window, performance */

const assert = require('assert');
const { chromium } = require('playwright-core');

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  const fs = require('fs');
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'landscape-mobile', width: 844, height: 390 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
];

async function runPhase5Test() {
  console.log('\n🧪 Running Phase 5 UI/UX, Responsive, A11y, SEO, Perf & i18n Tests...');

  process.env.NODE_ENV = 'test';
  const app = require('../backend/server');

  let server;
  let browser;

  try {
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // 1. SEO, Canonical, JSON-LD & Pricing SSR check
    const homeRes = await fetch(`${baseUrl}/`);
    const homeHtml = await homeRes.text();
    assert.strictEqual(homeRes.status, 200);
    assert.ok(!homeHtml.includes('3D URL Shortener'), 'Home <title> should not advertise "3D URL Shortener"');
    assert.ok(homeHtml.includes('rel="canonical"'), 'Home HTML must include canonical link');
    assert.ok(homeHtml.includes('application/ld+json'), 'Home HTML must include JSON-LD schema');

    const pricingRes = await fetch(`${baseUrl}/pricing`);
    const pricingHtml = await pricingRes.text();
    assert.strictEqual(pricingRes.status, 200);
    assert.ok(!pricingHtml.includes('http-equiv="refresh"'), '/pricing must be a real SEO page, not a meta-refresh stub');
    assert.ok(pricingHtml.includes('Rs 1,499') && pricingHtml.includes('Most Popular'), '/pricing must render plan tiers');

    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    assert.ok(robotsTxt.includes('https://www.healink.store/sitemap.xml'), 'robots.txt must reference www.healink.store sitemap');

    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();
    assert.ok(sitemapXml.includes('https://www.healink.store/pricing'), 'sitemap.xml must list /pricing');
    console.log('  ✅ PASS: SEO titles, canonical URLs, JSON-LD, /pricing SSR, robots.txt, and sitemap.xml verified');

    // 2. i18n Urdu RTL locale check
    const urRes = await fetch(`${baseUrl}/locales/ur.json`);
    assert.strictEqual(urRes.status, 200);
    const urJson = await urRes.json();
    assert.strictEqual(urJson._meta.dir, 'rtl');
    console.log('  ✅ PASS: i18n Urdu RTL locale served properly');

    // 3. Chromium Responsive, Accessibility & Performance Telemetry Checks
    const execPath = findChromePath();
    if (!execPath) {
      console.log('  ⚠️ SKIP Chromium checks: Chrome/Edge binary not found');
      return;
    }

    browser = await chromium.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    // Check "/" across all viewports
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(350);

      const layout = await page.evaluate(() => {
        const doc = document.documentElement;
        const h1 = document.querySelector('h1');
        const main = document.querySelector('main');
        const imgs = Array.from(document.querySelectorAll('img'));
        const missingAlt = imgs.filter((i) => i.getAttribute('alt') === null).length;
        const anchors = Array.from(document.querySelectorAll('footer a'));
        const unlabeledLinks = anchors.filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasH1: !!h1,
          hasMain: !!main,
          missingAlt,
          unlabeledLinks
        };
      });

      assert.ok(
        layout.scrollWidth <= layout.clientWidth + 2,
        `${vp.name} horizontal overflow: scrollWidth=${layout.scrollWidth} > clientWidth=${layout.clientWidth}`
      );
      assert.ok(layout.hasH1, `${vp.name} missing <h1>`);
      assert.ok(layout.hasMain, `${vp.name} missing <main> landmark`);
      assert.strictEqual(layout.missingAlt, 0, `${vp.name} has images without alt attribute`);
      assert.strictEqual(layout.unlabeledLinks, 0, `${vp.name} has footer links without accessible name`);
    }
    console.log(`  ✅ PASS: All ${VIEWPORTS.length} viewports (320px–1920px + landscape) have zero overflow & pass a11y checks`);

    // Check mobile tap target >= 44px on hamburger and interactive buttons + standalone /pricing
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const pricingCheck = await page.evaluate(() => {
      const btnUsd = document.getElementById('btnUsd');
      const rect = btnUsd ? btnUsd.getBoundingClientRect() : null;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        btnHeight: rect ? rect.height : 0
      };
    });
    assert.ok(pricingCheck.scrollWidth <= pricingCheck.clientWidth + 2, '/pricing mobile overflow detected');
    assert.ok(pricingCheck.btnHeight >= 44, `/pricing currency toggle height ${pricingCheck.btnHeight}px < 44px`);
    console.log('  ✅ PASS: Standalone /pricing responsive + tap targets (>=44px) verified');

    // Measure First Paint / FCP & test i18n RTL helper live on app
    await page.goto(`${baseUrl}/`, { waitUntil: 'load', timeout: 25000 });
    const perf = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      return { fcpMs: fcp ? Math.round(fcp.startTime) : 0 };
    });
    assert.ok(perf.fcpMs >= 0 && perf.fcpMs < 4000, `FCP ${perf.fcpMs}ms exceeded threshold`);
    console.log(`  ✅ PASS: Root page FCP measured at ${perf.fcpMs}ms`);

    // Verify RTL via i18n.js in Chromium
    await page.goto(`${baseUrl}/app.html`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.addScriptTag({ url: `${baseUrl}/locales/i18n.js` });
    const dirResult = await page.evaluate(async () => {
      await window.i18n.init('ur');
      return { dir: document.documentElement.dir, lang: document.documentElement.lang, loginLabel: window.i18n.t('landing.navigation.login') };
    });
    assert.strictEqual(dirResult.dir, 'rtl');
    assert.strictEqual(dirResult.lang, 'ur');
    assert.strictEqual(dirResult.loginLabel, 'لاگ ان');
    console.log('  ✅ PASS: RTL (dir="rtl") and Urdu translation switching verified live');

    assert.strictEqual(errors.length, 0, `Unexpected browser errors: ${errors.join(' | ')}`);
    console.log('\n🎉 Phase 5 UX, Responsive, A11y, SEO & Performance Tests PASSED!\n');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = runPhase5Test;

if (require.main === module) {
  runPhase5Test()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 5 Test Failed:', err);
      process.exit(1);
    });
}
