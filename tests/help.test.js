const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../backend/server');
const buildHelp = require('../tools/build_help');

let server = null;
let baseUrl = '';

function request(reqPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
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

async function run() {
  console.log('\n📚 Starting HEA Link Help Center & FAQ Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    console.log('📦 1. Content Architecture & FAQ Verification:');

    // Test 1: Verify all articles loaded and frontmatter valid
    const articles = buildHelp.getAllArticles();
    assert.ok(articles.length >= 20, `Expected at least 20 articles, found ${articles.length}`);
    const categories = new Set(articles.map(a => a.category));
    assert.ok(categories.has('getting-started'));
    assert.ok(categories.has('link-management'));
    assert.ok(categories.has('analytics-telemetry'));
    assert.ok(categories.has('developer-api'));
    assert.ok(categories.has('account-billing'));
    for (const a of articles) {
      assert.ok(a.title, `Article ${a.slug} has title`);
      assert.ok(a.summary, `Article ${a.slug} has summary`);
      assert.ok(a.category, `Article ${a.slug} has category`);
      assert.ok(a.html, `Article ${a.slug} has compiled HTML`);
    }
    pass(`Verified ${articles.length} verified markdown articles across 5 core categories`);

    // Test 2: Master FAQ source of truth check
    const faqData = buildHelp.getFaqData();
    assert.ok(faqData.categories && faqData.categories.length >= 5, 'FAQ has at least 5 categories');
    let totalFaqs = 0;
    for (const c of faqData.categories) {
      totalFaqs += (c.faqs || []).length;
    }
    assert.ok(totalFaqs >= 15, `Expected at least 15 FAQs, found ${totalFaqs}`);
    pass(`Master content/faq.yml verified with ${totalFaqs} questions across ${faqData.categories.length} categories`);

    // Test 3: Search index generation
    const indexPath = path.join(__dirname, '..', 'content', 'help-index.json');
    assert.ok(fs.existsSync(indexPath), 'Search index must exist');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    assert.strictEqual(indexData.length, articles.length);
    pass('Search index (content/help-index.json) verified matching article count');

    console.log('\n🌐 2. Web Endpoints & Rendering:');

    // Test 4: GET /help serves Help Hub
    const resHelp = await request('/help');
    assert.strictEqual(resHelp.status, 200);
    assert.ok(resHelp.body.includes('How can we help you today?'));
    assert.ok(resHelp.body.includes('id="searchInput"'));
    pass('GET /help delivers 200 with interactive search hub');

    // Test 5: GET /help/:category/:slug serves rendered article
    const resArt = await request('/help/getting-started/create-first-link');
    assert.strictEqual(resArt.status, 200);
    assert.ok(resArt.body.includes('Creating Your First Short Link'));
    assert.ok(resArt.body.includes('id="feedbackBox"'));
    pass('GET /help/:category/:slug renders compiled article with TOC and feedback widget');

    // Test 6: GET /help/missing-cat/missing-slug returns 404
    const res404 = await request('/help/invalid-cat/missing-slug-xyz');
    assert.strictEqual(res404.status, 404);
    pass('GET /help for non-existent article cleanly returns 404');

    // Test 7: GET /faq serves FAQ with Schema.org JSON-LD
    const resFaq = await request('/faq');
    assert.strictEqual(resFaq.status, 200);
    assert.ok(resFaq.body.includes('Frequently Asked Questions'));
    assert.ok(resFaq.body.includes('"@type": "FAQPage"'));
    pass('GET /faq delivers 200 with accordion sections and FAQPage JSON-LD');

    // Test 8: GET /help/contact serves contact support page
    const resContact = await request('/help/contact');
    assert.strictEqual(resContact.status, 200);
    assert.ok(resContact.body.includes('Submit a Support Request'));
    assert.ok(resContact.body.includes('name="website_hp"'));
    pass('GET /help/contact delivers 200 with support ticket form and bot honeypot');

    console.log('\n💌 3. Feedback & Support Ticket APIs:');

    // Test 9: POST /api/help/feedback records feedback and dedupes
    const resFb1 = await request('/api/help/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        articleSlug: 'create-first-link',
        helpful: true,
        comment: 'Very clear instructions!'
      }
    });
    assert.strictEqual(resFb1.status, 200);
    assert.strictEqual(resFb1.json.success, true);
    assert.strictEqual(resFb1.json.duplicate, false);

    // Immediate second feedback from same IP should report duplicate
    const resFb2 = await request('/api/help/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        articleSlug: 'create-first-link',
        helpful: true
      }
    });
    assert.strictEqual(resFb2.status, 200);
    assert.strictEqual(resFb2.json.duplicate, true);
    pass('POST /api/help/feedback records feedback with 24h IP deduplication');

    // Test 10: POST /api/support creates ticket and handles honeypot
    const resSupportFail = await request('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'invalid-email',
        name: 'Test'
      }
    });
    assert.strictEqual(resSupportFail.status, 400);

    const resSupportSuccess = await request('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        subject: 'Custom Domain SSL Help',
        category: 'technical',
        message: 'Need help attaching my custom subdomain go.cyberdyne.com.'
      }
    });
    assert.strictEqual(resSupportSuccess.status, 201);
    assert.strictEqual(resSupportSuccess.json.success, true);
    assert.ok(resSupportSuccess.json.ticketId.startsWith('TICK-'));

    // Bot honeypot test: if honeypot is filled, silent drop with 200
    const resSpam = await request('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Spam Bot',
        email: 'bot@spam.com',
        subject: 'Buy cheap shoes',
        category: 'general',
        message: 'Check out cheap pills now!',
        honeypot: 'http://spamsite.com'
      }
    });
    assert.strictEqual(resSpam.status, 200);
    assert.strictEqual(resSpam.json.success, true);
    pass('POST /api/support validates input, creates ticket, and silently neutralizes spambots');

    console.log('\n🎉 ALL 10 Help Center & FAQ tests passed!\n');
  } catch (err) {
    fail('Help Center Suite Error', err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    process.exit(0);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
