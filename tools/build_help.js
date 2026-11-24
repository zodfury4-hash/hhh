const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked');

const rootDir = path.resolve(__dirname, '..');
const contentHelpDir = path.join(rootDir, 'content', 'help');
const faqYamlPath = path.join(rootDir, 'content', 'faq.yml');
const outHelpDir = path.join(rootDir, 'pages', 'help');
const helpIndexPath = path.join(rootDir, 'content', 'help-index.json');

// Ensure output directories exist
if (!fs.existsSync(outHelpDir)) {
  fs.mkdirSync(outHelpDir, { recursive: true });
}

function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: rawContent };
  }
  const data = yaml.load(match[1]) || {};
  return { data, content: match[2] };
}

function getAllArticles() {
  const articles = [];
  if (!fs.existsSync(contentHelpDir)) return articles;

  const categories = fs.readdirSync(contentHelpDir);
  for (const cat of categories) {
    const catDir = path.join(contentHelpDir, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(catDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, content } = parseFrontmatter(raw);

      articles.push({
        slug,
        category: cat,
        title: data.title || slug,
        summary: data.summary || '',
        updated: data.updated || '2026-11-20',
        keywords: data.keywords || '',
        order: data.order || 99,
        markdown: content,
        html: marked.parse(content),
        url: `/help/${cat}/${slug}`
      });
    }
  }

  articles.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return articles;
}

function getFaqData() {
  if (!fs.existsSync(faqYamlPath)) return { categories: [] };
  const raw = fs.readFileSync(faqYamlPath, 'utf8');
  return yaml.load(raw) || { categories: [] };
}

// 1. Build Client-side Search Index
function buildSearchIndex(articles) {
  const index = articles.map(a => ({
    slug: a.slug,
    category: a.category,
    title: a.title,
    summary: a.summary,
    keywords: a.keywords,
    url: a.url
  }));
  fs.writeFileSync(helpIndexPath, JSON.stringify(index, null, 2), 'utf8');
  console.log(`[build_help] Built search index with ${index.length} articles to ${helpIndexPath}`);
}

// 2. Build /pages/help-home.html
function buildHelpHome(articles) {
  const categoryMeta = {
    'getting-started': { title: 'Getting Started', icon: '🚀', desc: 'Core shortening, custom domains, QR codes, and bio pages.' },
    'link-management': { title: 'Link Management', icon: '🔗', desc: 'Password protection, expiration dates, limits, and safety.' },
    'analytics-telemetry': { title: 'Analytics & Telemetry', icon: '📊', desc: 'Unique visitors, real-time SSE stream, and geo attribution.' },
    'developer-api': { title: 'Developer REST API', icon: '💻', desc: 'API keys, rate limits, outbound webhooks, and MCP servers.' },
    'account-billing': { title: 'Account & Billing', icon: '💳', desc: 'Tier comparisons, Stripe billing, GDPR, and data retention.' }
  };

  const categories = Object.keys(categoryMeta);

  let categoryCardsHtml = '';
  for (const cat of categories) {
    const meta = categoryMeta[cat];
    const catArticles = articles.filter(a => a.category === cat);
    const linksHtml = catArticles.slice(0, 4).map(a => `
      <li><a href="${a.url}">${a.title}</a></li>
    `).join('');

    categoryCardsHtml += `
      <div class="help-cat-card">
        <div class="help-cat-icon">${meta.icon}</div>
        <h3>${meta.title}</h3>
        <p>${meta.desc}</p>
        <ul class="help-cat-links">
          ${linksHtml}
        </ul>
        <a class="help-cat-more" href="/help/${cat}/${catArticles[0] ? catArticles[0].slug : ''}">View all ${catArticles.length} guides →</a>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Help Center &amp; Documentation | HEA Link</title>
  <meta name="description" content="Explore user guides, developer tutorials, API references, and FAQs for HEA Link URL shortener and QR studio.">
  <link rel="icon" type="image/png" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/landing.css">
  <style>
    :root {
      --h-bg: #f8fafc;
      --h-card: #ffffff;
      --h-border: #e2e8f0;
      --h-primary: #0070f3;
      --h-primary-hover: #0056b3;
      --h-text: #0b132b;
      --h-muted: #64748b;
    }
    body {
      background: var(--h-bg);
      color: var(--h-text);
      font-family: 'Poppins', sans-serif;
      margin: 0; padding: 0; min-height: 100vh;
      display: flex; flex-direction: column;
    }
    .h-nav {
      background: #ffffff; border-bottom: 1px solid var(--h-border);
      padding: 14px 24px; position: sticky; top: 0; z-index: 100;
    }
    .h-nav-in {
      max-width: 1240px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; font-size: 1.25rem; font-weight: 800; color: var(--h-primary);
    }
    .nav-links { display: flex; align-items: center; gap: 20px; }
    .nav-link { color: var(--h-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    .nav-link:hover, .nav-link.active { color: var(--h-primary); }
    .nav-cta {
      background: var(--h-primary); color: #fff !important;
      padding: 8px 16px; border-radius: 8px; font-weight: 700;
    }
    .h-hero {
      padding: 60px 24px 40px; text-align: center;
      background: radial-gradient(circle at top, rgba(0, 112, 243, 0.08) 0%, transparent 60%);
    }
    .h-hero h1 { font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800; margin: 0 0 12px; }
    .h-hero p { color: var(--h-muted); font-size: 1.1rem; max-width: 650px; margin: 0 auto 28px; }
    .search-box {
      max-width: 600px; margin: 0 auto; position: relative;
    }
    .search-input {
      width: 100%; height: 50px; border: 2px solid var(--h-border);
      border-radius: 9999px; padding: 0 24px 0 50px; font-size: 1rem;
      box-sizing: border-box; outline: none; background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04); transition: border-color 0.15s;
    }
    .search-input:focus { border-color: var(--h-primary); }
    .search-icon {
      position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
      color: var(--h-muted); pointer-events: none;
    }
    .search-results {
      position: absolute; top: 56px; left: 0; right: 0; background: #ffffff;
      border: 1px solid var(--h-border); border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-height: 380px; overflow-y: auto;
      display: none; z-index: 50; text-align: left;
    }
    .search-item {
      padding: 12px 18px; border-bottom: 1px solid #f1f5f9; display: block;
      text-decoration: none; color: var(--h-text); transition: background 0.1s;
    }
    .search-item:hover { background: #f8fafc; }
    .search-item b { color: var(--h-primary); font-size: 0.95rem; display: block; }
    .search-item span { font-size: 0.8rem; color: var(--h-muted); }
    .h-wrap { max-width: 1200px; margin: 0 auto 60px; padding: 0 24px; }
    .help-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px; margin-top: 32px;
    }
    .help-cat-card {
      background: #ffffff; border: 1.5px solid var(--h-border);
      border-radius: 16px; padding: 28px; box-shadow: 0 6px 20px rgba(0,0,0,0.02);
      display: flex; flex-direction: column;
    }
    .help-cat-icon { font-size: 2rem; margin-bottom: 12px; }
    .help-cat-card h3 { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; }
    .help-cat-card p { font-size: 0.88rem; color: var(--h-muted); margin: 0 0 18px; line-height: 1.5; }
    .help-cat-links { list-style: none; padding: 0; margin: 0 0 20px; flex: 1; }
    .help-cat-links li { margin-bottom: 10px; }
    .help-cat-links a { color: var(--h-primary); text-decoration: none; font-size: 0.92rem; font-weight: 600; }
    .help-cat-links a:hover { text-decoration: underline; }
    .help-cat-more { font-size: 0.85rem; font-weight: 700; color: var(--h-muted); text-decoration: none; }
    .help-cat-more:hover { color: var(--h-primary); }
    .contact-banner {
      background: linear-gradient(135deg, rgba(0,112,243,0.06), rgba(121,40,202,0.06));
      border: 1.5px solid rgba(0,112,243,0.15); border-radius: 16px;
      padding: 32px; text-align: center; margin-top: 48px;
    }
    .contact-banner h2 { margin: 0 0 8px; font-size: 1.4rem; }
    .contact-banner p { color: var(--h-muted); margin: 0 0 20px; font-size: 0.95rem; }
    .btn-contact {
      background: var(--h-primary); color: #fff; text-decoration: none;
      padding: 10px 24px; border-radius: 8px; font-weight: 700; display: inline-block;
    }
    .h-footer {
      background: #ffffff; border-top: 1px solid var(--h-border);
      padding: 32px 24px; text-align: center; font-size: 0.88rem; color: var(--h-muted);
      margin-top: auto;
    }
  </style>
</head>
<body>
  <header class="h-nav">
    <div class="h-nav-in">
      <a class="nav-brand" href="/">
        <svg width="30" height="20" viewBox="0 0 54 36" fill="none">
          <path d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z" stroke="#0070f3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>HEA Link Help</span>
      </a>
      <nav class="nav-links">
        <a class="nav-link" href="/developers">Developers</a>
        <a class="nav-link" href="/integrations">Integrations</a>
        <a class="nav-link" href="/resources/utm-guide">UTM Guide</a>
        <a class="nav-link active" href="/help">Help Center</a>
        <a class="nav-link" href="/faq">FAQ</a>
        <a class="nav-link nav-cta" href="/#dashboard">Dashboard →</a>
      </nav>
    </div>
  </header>

  <section class="h-hero">
    <h1>How can we help you today?</h1>
    <p>Search guides, API docs, and answers from our engineering team.</p>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" class="search-input" placeholder="Search topics (e.g., custom domains, webhooks, 410 gone)...">
      <div id="searchResults" class="search-results"></div>
    </div>
  </section>

  <main class="h-wrap">
    <div class="help-grid">
      ${categoryCardsHtml}
    </div>

    <div class="contact-banner">
      <h2>Can't find what you're looking for?</h2>
      <p>Our engineering support team is here to assist with technical, billing, and API questions.</p>
      <a class="btn-contact" href="/help/contact">Submit Support Ticket →</a>
    </div>
  </main>

  <footer class="h-footer">
    © 2026 HEA Link Inc. Documentation &amp; Help Desk.
  </footer>

  <script>
    (function() {
      let searchData = [];
      fetch('/content/help-index.json')
        .then(r => r.json())
        .then(d => { searchData = d; })
        .catch(() => {});

      const input = document.getElementById('searchInput');
      const results = document.getElementById('searchResults');

      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (!q || q.length < 2) {
          results.style.display = 'none';
          results.innerHTML = '';
          return;
        }

        const matches = searchData.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.keywords.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
        ).slice(0, 6);

        if (matches.length === 0) {
          results.innerHTML = '<div style="padding:16px;color:#64748b;font-size:0.9rem;">No articles found for "' + q + '". Try searching for "domain", "api", or "qr".</div>';
          results.style.display = 'block';
          return;
        }

        results.innerHTML = matches.map(m =>
          '<a class="search-item" href="' + m.url + '"><b>' + m.title + '</b><span>' + m.summary + '</span></a>'
        ).join('');
        results.style.display = 'block';
      });

      document.addEventListener('click', (e) => {
        if (!document.querySelector('.search-box').contains(e.target)) {
          results.style.display = 'none';
        }
      });
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(rootDir, 'pages', 'help-home.html'), html, 'utf8');
  console.log(`[build_help] Built /pages/help-home.html`);
}

// 3. Build Individual Article Pages (/pages/help/<category>/<slug>.html)
function buildArticlePages(articles) {
  for (const article of articles) {
    const catDir = path.join(outHelpDir, article.category);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }

    const siblingArticles = articles.filter(a => a.category === article.category);
    const sidebarLinksHtml = siblingArticles.map(s => `
      <li class="${s.slug === article.slug ? 'active' : ''}">
        <a href="${s.url}">${s.title}</a>
      </li>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} | HEA Link Help</title>
  <meta name="description" content="${article.summary}">
  <link rel="icon" type="image/png" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/landing.css">
  <style>
    :root {
      --art-bg: #f8fafc;
      --art-border: #e2e8f0;
      --art-primary: #0070f3;
      --art-text: #0b132b;
      --art-muted: #64748b;
    }
    body {
      background: var(--art-bg); color: var(--art-text);
      font-family: 'Poppins', sans-serif; margin: 0; padding: 0; min-height: 100vh;
      display: flex; flex-direction: column;
    }
    code, pre { font-family: 'JetBrains Mono', monospace; }
    .art-nav {
      background: #ffffff; border-bottom: 1px solid var(--art-border);
      padding: 14px 24px; position: sticky; top: 0; z-index: 100;
    }
    .art-nav-in {
      max-width: 1240px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; font-size: 1.25rem; font-weight: 800; color: var(--art-primary);
    }
    .nav-links { display: flex; align-items: center; gap: 20px; }
    .nav-link { color: var(--art-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    .nav-link:hover { color: var(--art-primary); }
    .art-layout {
      max-width: 1200px; margin: 32px auto 60px; padding: 0 24px;
      display: grid; grid-template-columns: 280px 1fr; gap: 40px; width: 100%; box-sizing: border-box;
    }
    @media(max-width: 860px) {
      .art-layout { grid-template-columns: 1fr; }
      .art-sidebar { display: none; }
    }
    .art-sidebar {
      background: #ffffff; border: 1px solid var(--art-border);
      border-radius: 12px; padding: 20px; height: fit-content; position: sticky; top: 80px;
    }
    .art-sidebar h4 {
      font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--art-muted); margin: 0 0 12px;
    }
    .art-sidebar ul { list-style: none; padding: 0; margin: 0; }
    .art-sidebar li { margin-bottom: 8px; }
    .art-sidebar li a {
      color: var(--art-muted); text-decoration: none; font-size: 0.88rem;
      display: block; padding: 6px 10px; border-radius: 6px; transition: all 0.15s;
    }
    .art-sidebar li.active a, .art-sidebar li a:hover {
      background: rgba(0, 112, 243, 0.08); color: var(--art-primary); font-weight: 600;
    }
    .art-main {
      background: #ffffff; border: 1px solid var(--art-border);
      border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    .breadcrumbs {
      display: flex; gap: 8px; font-size: 0.84rem; color: var(--art-muted); margin-bottom: 20px;
    }
    .breadcrumbs a { color: var(--art-primary); text-decoration: none; }
    .art-content { line-height: 1.7; color: #334155; }
    .art-content h1 { font-size: 2rem; font-weight: 800; color: var(--art-text); margin: 0 0 16px; }
    .art-content h2 { font-size: 1.4rem; font-weight: 700; color: var(--art-text); margin: 32px 0 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .art-content h3 { font-size: 1.15rem; font-weight: 700; color: var(--art-primary); margin: 24px 0 8px; }
    .art-content p, .art-content li { font-size: 0.96rem; }
    .art-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.88rem; }
    .art-content th, .art-content td { border: 1px solid var(--art-border); padding: 10px 12px; text-align: left; }
    .art-content th { background: #f8fafc; font-weight: 700; }
    .feedback-box {
      margin-top: 48px; padding: 24px; background: #f8fafc; border: 1px solid var(--art-border);
      border-radius: 12px; text-align: center;
    }
    .feedback-box h4 { margin: 0 0 12px; font-size: 1rem; }
    .feedback-btns { display: flex; gap: 12px; justify-content: center; }
    .fb-btn {
      padding: 8px 18px; border: 1.5px solid var(--art-border); border-radius: 8px;
      background: #ffffff; cursor: pointer; font-size: 0.9rem; font-weight: 600;
      transition: all 0.15s;
    }
    .fb-btn:hover { border-color: var(--art-primary); color: var(--art-primary); }
    .feedback-comment {
      margin-top: 14px; display: none; flex-direction: column; gap: 8px; max-width: 440px; margin-left: auto; margin-right: auto;
    }
    .feedback-comment textarea {
      padding: 10px; border: 1px solid var(--art-border); border-radius: 8px; font-family: inherit; font-size: 0.88rem;
    }
    .art-footer {
      background: #ffffff; border-top: 1px solid var(--art-border);
      padding: 32px 24px; text-align: center; font-size: 0.88rem; color: var(--art-muted);
      margin-top: auto;
    }
  </style>
</head>
<body>
  <header class="art-nav">
    <div class="art-nav-in">
      <a class="nav-brand" href="/">
        <svg width="30" height="20" viewBox="0 0 54 36" fill="none">
          <path d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z" stroke="#0070f3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>HEA Link Help</span>
      </a>
      <nav class="nav-links">
        <a class="nav-link" href="/help">Help Hub</a>
        <a class="nav-link" href="/developers">Developers</a>
        <a class="nav-link" href="/integrations">Integrations</a>
        <a class="nav-link" href="/faq">FAQ</a>
        <a class="nav-link" href="/help/contact" style="background:#0070f3;color:#fff;padding:6px 14px;border-radius:6px;">Contact Support</a>
      </nav>
    </div>
  </header>

  <div class="art-layout">
    <aside class="art-sidebar">
      <h4>Articles in this Category</h4>
      <ul>${sidebarLinksHtml}</ul>
    </aside>

    <main class="art-main">
      <div class="breadcrumbs">
        <a href="/help">Help</a> <span>›</span>
        <a href="/help">${article.category}</a> <span>›</span>
        <span>${article.title}</span>
      </div>

      <article class="art-content">
        ${article.html}
      </article>

      <div class="feedback-box" id="feedbackBox">
        <h4>Was this article helpful?</h4>
        <div class="feedback-btns" id="fbBtnRow">
          <button type="button" class="fb-btn" id="fbYes">👍 Yes</button>
          <button type="button" class="fb-btn" id="fbNo">👎 No</button>
        </div>
        <div class="feedback-comment" id="fbCommentWrap">
          <textarea id="fbCommentText" rows="3" placeholder="Tell us how we can improve this guide (optional)..."></textarea>
          <button type="button" class="fb-btn" id="fbSubmitComment" style="background:#0070f3;color:#fff;">Send Feedback</button>
        </div>
        <div id="fbThanks" style="display:none;color:#10b981;font-weight:700;font-size:0.95rem;">Thank you for your feedback!</div>
      </div>
    </main>
  </div>

  <footer class="art-footer">
    © 2026 HEA Link Inc. Documentation Desk.
  </footer>

  <script>
    (function() {
      const slug = "${article.slug}";
      const fbYes = document.getElementById('fbYes');
      const fbNo = document.getElementById('fbNo');
      const fbBtnRow = document.getElementById('fbBtnRow');
      const fbCommentWrap = document.getElementById('fbCommentWrap');
      const fbCommentText = document.getElementById('fbCommentText');
      const fbSubmitComment = document.getElementById('fbSubmitComment');
      const fbThanks = document.getElementById('fbThanks');

      let chosenHelpful = true;

      async function sendFeedback(helpful, comment = '') {
        try {
          await fetch('/api/help/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleSlug: slug, helpful, comment })
          });
        } catch (_e) {}
      }

      fbYes.addEventListener('click', () => {
        chosenHelpful = true;
        sendFeedback(true);
        fbBtnRow.style.display = 'none';
        fbThanks.style.display = 'block';
      });

      fbNo.addEventListener('click', () => {
        chosenHelpful = false;
        fbBtnRow.style.display = 'none';
        fbCommentWrap.style.display = 'flex';
      });

      fbSubmitComment.addEventListener('click', () => {
        const comment = fbCommentText.value.trim();
        sendFeedback(false, comment);
        fbCommentWrap.style.display = 'none';
        fbThanks.style.display = 'block';
      });
    })();
  </script>
</body>
</html>`;

    const outPath = path.join(catDir, `${article.slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
  }
  console.log(`[build_help] Built ${articles.length} article pages to /pages/help/`);
}

// 4. Build /pages/faq.html
function buildFaqPage(faqData) {
  let categoriesHtml = '';
  const faqSchemaEntities = [];

  for (const cat of faqData.categories) {
    let itemsHtml = '';
    for (const item of cat.faqs) {
      faqSchemaEntities.push({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      });

      itemsHtml += `
        <div class="faq-item">
          <div class="faq-q">${item.question} <span class="faq-arrow">▼</span></div>
          <div class="faq-a">${item.answer}</div>
        </div>
      `;
    }

    categoriesHtml += `
      <section class="faq-section" id="${cat.id}">
        <h2>${cat.title}</h2>
        <p class="faq-cat-desc">${cat.description}</p>
        <div class="faq-list">
          ${itemsHtml}
        </div>
      </section>
    `;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSchemaEntities
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frequently Asked Questions (FAQ) | HEA Link</title>
  <meta name="description" content="Answers to common questions about HEA Link URL shortener, custom domains, vector QR codes, API access, and billing.">
  <link rel="icon" type="image/png" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/landing.css">

  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>

  <style>
    :root {
      --faq-bg: #f8fafc;
      --faq-border: #e2e8f0;
      --faq-primary: #0070f3;
      --faq-text: #0b132b;
      --faq-muted: #64748b;
    }
    body {
      background: var(--faq-bg); color: var(--faq-text);
      font-family: 'Poppins', sans-serif; margin: 0; padding: 0; min-height: 100vh;
      display: flex; flex-direction: column;
    }
    .faq-nav {
      background: #ffffff; border-bottom: 1px solid var(--faq-border);
      padding: 14px 24px; position: sticky; top: 0; z-index: 100;
    }
    .faq-nav-in {
      max-width: 1240px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; font-size: 1.25rem; font-weight: 800; color: var(--faq-primary);
    }
    .nav-links { display: flex; align-items: center; gap: 20px; }
    .nav-link { color: var(--faq-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    .nav-link:hover, .nav-link.active { color: var(--faq-primary); }
    .faq-hero {
      padding: 56px 24px 32px; text-align: center;
      background: radial-gradient(circle at top, rgba(0, 112, 243, 0.08) 0%, transparent 60%);
    }
    .faq-hero h1 { font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800; margin: 0 0 12px; }
    .faq-hero p { color: var(--faq-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
    .faq-wrap {
      max-width: 900px; margin: 0 auto 64px; padding: 0 24px; width: 100%; box-sizing: border-box;
    }
    .faq-section {
      background: #ffffff; border: 1px solid var(--faq-border);
      border-radius: 16px; padding: 32px; margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    .faq-section h2 {
      font-size: 1.4rem; font-weight: 800; color: var(--faq-primary); margin: 0 0 4px;
    }
    .faq-cat-desc { font-size: 0.88rem; color: var(--faq-muted); margin: 0 0 20px; }
    .faq-item { border-bottom: 1px solid #f1f5f9; padding: 18px 0; }
    .faq-item:last-child { border-bottom: none; }
    .faq-q {
      font-weight: 700; font-size: 1.02rem; color: var(--faq-text); cursor: pointer;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
    }
    .faq-arrow { font-size: 0.8rem; color: var(--faq-muted); transition: transform 0.2s; }
    .faq-item.open .faq-arrow { transform: rotate(180deg); color: var(--faq-primary); }
    .faq-a {
      display: none; margin-top: 10px; color: #475569; font-size: 0.94rem; line-height: 1.6;
    }
    .faq-item.open .faq-a { display: block; }
    .faq-footer {
      background: #ffffff; border-top: 1px solid var(--faq-border);
      padding: 32px 24px; text-align: center; font-size: 0.88rem; color: var(--faq-muted);
      margin-top: auto;
    }
  </style>
</head>
<body>
  <header class="faq-nav">
    <div class="faq-nav-in">
      <a class="nav-brand" href="/">
        <svg width="30" height="20" viewBox="0 0 54 36" fill="none">
          <path d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z" stroke="#0070f3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>HEA Link FAQ</span>
      </a>
      <nav class="nav-links">
        <a class="nav-link" href="/help">Help Center</a>
        <a class="nav-link" href="/developers">Developers</a>
        <a class="nav-link" href="/integrations">Integrations</a>
        <a class="nav-link active" href="/faq">FAQ</a>
        <a class="nav-link" href="/#dashboard" style="background:#0070f3;color:#fff;padding:6px 14px;border-radius:6px;">Dashboard →</a>
      </nav>
    </div>
  </header>

  <section class="faq-hero">
    <h1>Frequently Asked Questions</h1>
    <p>Everything you need to know about the product, billing, links, and API.</p>
  </section>

  <main class="faq-wrap">
    ${categoriesHtml}
  </main>

  <footer class="faq-footer">
    © 2026 HEA Link Inc. Frequently Asked Questions.
  </footer>

  <script>
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.parentElement;
        item.classList.toggle('open');
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(rootDir, 'pages', 'faq.html'), html, 'utf8');
  console.log(`[build_help] Built /pages/faq.html with ${faqSchemaEntities.length} FAQs`);
}

// 5. Build /pages/help-contact.html
function buildHelpContact() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Engineering Support | HEA Link Help</title>
  <meta name="description" content="Submit a support inquiry or report an issue directly to the HEA Link engineering and customer operations team.">
  <link rel="icon" type="image/png" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/landing.css">
  <style>
    :root {
      --c-bg: #f8fafc;
      --c-border: #e2e8f0;
      --c-primary: #0070f3;
      --c-text: #0b132b;
      --c-muted: #64748b;
    }
    body {
      background: var(--c-bg); color: var(--c-text);
      font-family: 'Poppins', sans-serif; margin: 0; padding: 0; min-height: 100vh;
      display: flex; flex-direction: column;
    }
    .c-nav {
      background: #ffffff; border-bottom: 1px solid var(--c-border);
      padding: 14px 24px; position: sticky; top: 0; z-index: 100;
    }
    .c-nav-in {
      max-width: 1240px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; font-size: 1.25rem; font-weight: 800; color: var(--c-primary);
    }
    .c-hero {
      padding: 48px 24px 24px; text-align: center;
    }
    .c-hero h1 { font-size: 2.2rem; font-weight: 800; margin: 0 0 8px; }
    .c-hero p { color: var(--c-muted); margin: 0 auto; max-width: 500px; }
    .c-card {
      max-width: 640px; margin: 0 auto 60px; background: #ffffff;
      border: 1.5px solid var(--c-border); border-radius: 16px; padding: 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;
    }
    .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 700; }
    .form-input, .form-select, .form-textarea {
      width: 100%; border: 1.5px solid var(--c-border); border-radius: 8px;
      font-family: inherit; font-size: 0.92rem; padding: 10px 14px; box-sizing: border-box;
      outline: none; transition: border-color 0.15s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--c-primary); }
    .btn-submit {
      width: 100%; height: 46px; background: var(--c-primary); color: #fff;
      border: none; border-radius: 8px; font-weight: 700; font-size: 1rem;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-submit:hover { background: #0056b3; }
    .alert-success {
      display: none; padding: 16px; background: #ecfdf5; border: 1px solid #10b981;
      border-radius: 8px; color: #065f46; font-size: 0.92rem; margin-bottom: 20px;
    }
    .alert-error {
      display: none; padding: 16px; background: #fef2f2; border: 1px solid #ef4444;
      border-radius: 8px; color: #991b1b; font-size: 0.92rem; margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <header class="c-nav">
    <div class="c-nav-in">
      <a class="nav-brand" href="/">
        <svg width="30" height="20" viewBox="0 0 54 36" fill="none">
          <path d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z" stroke="#0070f3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>HEA Link Support</span>
      </a>
      <a href="/help" style="color:var(--c-primary);text-decoration:none;font-weight:700;font-size:0.9rem;">← Back to Help Hub</a>
    </div>
  </header>

  <section class="c-hero">
    <h1>Submit a Support Request</h1>
    <p>We typically respond within 24 business hours.</p>
  </section>

  <main style="padding:0 24px;">
    <div class="c-card">
      <div id="alertSuccess" class="alert-success"></div>
      <div id="alertError" class="alert-error"></div>

      <form id="supportForm">
        <!-- Hidden Honeypot Field -->
        <div style="display:none !important;" aria-hidden="true">
          <input type="text" name="website_hp" id="inputHp" tabindex="-1" autocomplete="off">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label for="inputName">Your Full Name *</label>
            <input type="text" id="inputName" class="form-input" placeholder="Sarah Connor" required>
          </div>
          <div class="form-group">
            <label for="inputEmail">Work Email *</label>
            <input type="email" id="inputEmail" class="form-input" placeholder="sarah@company.com" required>
          </div>
        </div>

        <div class="form-group">
          <label for="inputCategory">Inquiry Category *</label>
          <select id="inputCategory" class="form-select">
            <option value="technical">Technical &amp; Bugs</option>
            <option value="api">Developer API &amp; Webhooks</option>
            <option value="billing">Billing &amp; Stripe Invoices</option>
            <option value="abuse">Report Abuse / Malicious Link</option>
            <option value="general" selected>General Question</option>
          </select>
        </div>

        <div class="form-group">
          <label for="inputSubject">Subject *</label>
          <input type="text" id="inputSubject" class="form-input" placeholder="Brief summary of your inquiry" required>
        </div>

        <div class="form-group">
          <label for="inputMessage">Message *</label>
          <textarea id="inputMessage" class="form-textarea" rows="5" placeholder="Please describe what you are experiencing with steps to reproduce or affected short links..." required></textarea>
        </div>

        <button type="submit" class="btn-submit" id="btnSubmit">Submit Support Ticket →</button>
      </form>
    </div>
  </main>

  <script>
    (function() {
      const form = document.getElementById('supportForm');
      const btn = document.getElementById('btnSubmit');
      const alertSuccess = document.getElementById('alertSuccess');
      const alertError = document.getElementById('alertError');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertSuccess.style.display = 'none';
        alertError.style.display = 'none';

        btn.disabled = true;
        btn.textContent = 'Submitting Ticket...';

        const payload = {
          name: document.getElementById('inputName').value.trim(),
          email: document.getElementById('inputEmail').value.trim(),
          category: document.getElementById('inputCategory').value,
          subject: document.getElementById('inputSubject').value.trim(),
          message: document.getElementById('inputMessage').value.trim(),
          honeypot: document.getElementById('inputHp').value
        };

        try {
          const res = await fetch('/api/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            alertSuccess.innerHTML = '<b>Ticket Submitted Successfully!</b><br>Reference ID: <code>' + data.ticketId + '</code>. A confirmation has been emailed to ' + payload.email + '.';
            alertSuccess.style.display = 'block';
            form.reset();
          } else {
            alertError.textContent = data.error || 'Failed to submit ticket. Please check your inputs.';
            alertError.style.display = 'block';
          }
        } catch (err) {
          alertError.textContent = 'Network error: ' + err.message;
          alertError.style.display = 'block';
        } finally {
          btn.disabled = false;
          btn.textContent = 'Submit Support Ticket →';
        }
      });
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(rootDir, 'pages', 'help-contact.html'), html, 'utf8');
  console.log(`[build_help] Built /pages/help-contact.html`);
}

function buildAll() {
  console.log('🚀 [build_help] Building Help Center, FAQ, and Documentation...');
  const articles = getAllArticles();
  const faqData = getFaqData();

  buildSearchIndex(articles);
  buildHelpHome(articles);
  buildArticlePages(articles);
  buildFaqPage(faqData);
  buildHelpContact();
  console.log('✅ [build_help] Help Center build complete!\n');
}

if (require.main === module) {
  buildAll();
}

module.exports = {
  getAllArticles,
  getFaqData,
  buildAll
};
