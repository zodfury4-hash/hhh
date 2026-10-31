'use strict';

/* =========================================================
   HEA Link — Core Application Engine
   SPA Architecture with Universal Redirection & Live APIs
   ========================================================= */

/* ---------- DOM & Storage Helpers ---------- */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];

const store = {
  get(k, d) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? d;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }
};

const DOMAIN = 'healink.pk';
let links = store.get('hea_links', []);
let session = store.get('hea_session', null);
let bios = store.get('hea_bios', []);
const saveLinks = () => store.set('hea_links', links);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n);
const pick = a => a[Math.floor(Math.random() * a.length)];

function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e2) {}
    t.remove();
  }
  toast('Copied to clipboard!');
}

/* ---------- URL Normalization & Live Shortener ---------- */
function normalize(u) {
  u = (u || '').trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const x = new URL(u);
    return x.hostname.includes('.') ? x.href : null;
  } catch (e) {
    return null;
  }
}

// "AI" readable back-half suggestion
function suggest(url) {
  try {
    const u = new URL(url);
    const stop = ['html', 'php', 'www', 'com', 'org', 'net', 'the', 'and', 'https', 'http', 'index', 'page'];
    const words = (u.pathname + ' ' + u.hostname.replace(/^www\./, '').split('.')[0])
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !stop.includes(w));
    return (words.slice(0, 3).join('-') || rand(5)).slice(0, 24);
  } catch (e) {
    return rand(5);
  }
}

const shortText = l => `${DOMAIN}/${l.slug}`;

// Universal URL that works everywhere: preserves original destination in ?u=
const visitUrl = l => {
  const base = location.href.split('#')[0];
  return `${base}#go-${l.slug}?u=${encodeURIComponent(l.url)}`;
};

// Asynchronously fetch genuine short URL from da.gd with 2-second timeout
async function fetchOnlineShortUrl(targetUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://da.gd/s?strip=1&url=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (/^https?:\/\//i.test(text)) return text;
    }
  } catch (e) {}
  return null;
}

const owner = () => (session ? session.email : 'guest');

function createLink({ url, slug, tag, expires, realShort }, editing) {
  const dest = normalize(url);
  if (!dest) return { error: 'Please enter a valid link (e.g. https://example.com/page).' };

  slug = (slug || '').trim() || suggest(dest);
  if (!/^[a-z0-9-]{2,40}$/i.test(slug)) {
    return { error: 'Back-half: 2–40 letters, numbers or hyphens.' };
  }

  const clash = links.find(l => l.slug.toLowerCase() === slug.toLowerCase() && (!editing || l.id !== editing.id));
  if (clash) {
    if (editing) return { error: 'That back-half is already taken.' };
    slug += '-' + rand(3);
  }

  if (editing) {
    Object.assign(editing, {
      url: dest,
      slug,
      tag: (tag || '').trim(),
      expires: expires || '',
      realShort: realShort || editing.realShort || null
    });
    saveLinks();
    return { link: editing };
  }

  const link = {
    id: rand(6) + Date.now().toString(36),
    slug,
    url: dest,
    tag: (tag || '').trim(),
    expires: expires || '',
    created: Date.now(),
    owner: owner(),
    realShort: realShort || null,
    clicks: []
  };

  links.unshift(link);
  saveLinks();
  return { link };
}

const device = () =>
  /ipad|tablet/i.test(navigator.userAgent) ? 'Tablet' :
  /mobi|android|iphone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

function recordClick(l, extra = {}) {
  if (!l || !l.clicks) return;
  const region = ((navigator.language || '').split('-')[1] || 'US').toUpperCase();
  l.clicks.push(Object.assign({
    t: Date.now(),
    d: device(),
    r: document.referrer ? new URL(document.referrer).hostname : 'Direct',
    c: region
  }, extra));
  saveLinks();
}

const isExpired = l => l.expires && new Date(l.expires + 'T23:59:59') < new Date();
const mine = () => links.filter(l => l.owner === owner());

/* ---------- QR Code Generator ---------- */
function drawQR(cv, text, fg = '#0e1a33', bg = '#ffffff', px = 256) {
  if (typeof qrcode !== 'function') return;
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const m = 2;
  const c = px / (n + 2 * m);
  cv.width = cv.height = px;
  const x = cv.getContext('2d');
  x.fillStyle = bg;
  x.fillRect(0, 0, px, px);
  x.fillStyle = fg;
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (q.isDark(r, k)) {
        x.fillRect(Math.floor((m + k) * c), Math.floor((m + r) * c), Math.ceil(c), Math.ceil(c));
      }
    }
  }
}

function download(cv, name = 'hea-qr.png') {
  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = name;
  a.click();
}

/* ---------- Universal Modal ---------- */
function openModal(title, bodyHTML, onSubmit, okText = 'Save') {
  $('#mTitle').textContent = title;
  $('#mBody').innerHTML = bodyHTML;
  $('#mErr').textContent = '';
  $('#mOk').textContent = okText;
  $('#mOk').hidden = !onSubmit;
  $('#modal').hidden = false;

  $('#mForm').onsubmit = e => {
    e.preventDefault();
    const err = onSubmit && onSubmit();
    if (err) $('#mErr').textContent = err;
    else closeModal();
  };
}

const closeModal = () => { $('#modal').hidden = true; };
$('#mCancel').onclick = closeModal;
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

function linkForm(l) {
  return `
    <label>Destination URL
      <input id="fUrl" value="${esc(l ? l.url : '')}" placeholder="https://example.com/page" required>
    </label>
    <label>Custom back-half <small>(${DOMAIN}/…)</small>
      <input id="fSlug" value="${esc(l ? l.slug : '')}" placeholder="leave empty for AI suggestion">
    </label>
    <label>Campaign Tag
      <input id="fTag" value="${esc(l ? l.tag : '')}" placeholder="marketing, twitter, promo">
    </label>
    <label>Expiry Date (Optional)
      <input id="fExp" type="date" value="${l ? l.expires : ''}">
    </label>
  `;
}

function linkModal(l) {
  openModal(l ? 'Edit Link' : 'Create Link', linkForm(l), async () => {
    const urlVal = $('#fUrl').value;
    const slugVal = $('#fSlug').value;
    const tagVal = $('#fTag').value;
    const expVal = $('#fExp').value;

    const r = createLink({ url: urlVal, slug: slugVal, tag: tagVal, expires: expVal }, l);
    if (r.error) return r.error;

    // Fetch real short link in background
    fetchOnlineShortUrl(r.link.url).then(shortUrl => {
      if (shortUrl) {
        r.link.realShort = shortUrl;
        saveLinks();
        if (location.hash === '#dashboard') renderDash();
      }
    });

    toast(l ? 'Link updated' : 'Link created');
    renderDash();
  });
  setTimeout(() => $('#fUrl')?.focus(), 50);
}

function qrModal(text) {
  openModal(
    'QR Code',
    `<canvas id="mQr" style="max-width:100%;margin:auto;display:block;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)"></canvas>
     <button type="button" class="btn wide" id="mDl" style="margin-top:16px">⬇ Download PNG</button>`,
    null
  );
  drawQR($('#mQr'), text, '#0e1a33', '#fff', 512);
  $('#mDl').onclick = () => download($('#mQr'), 'hea-qr.png');
}

/* =========================================================
   MEGA MENUS CONFIGURATION & BUILDER
   Matching the Bitly interface screenshots
   ========================================================= */

const MEGA = {
  Platform: `
    <div class="mega-grid">
      <!-- Col 1: Products -->
      <div class="mega-col">
        <h4>PRODUCTS</h4>
        <a class="mega-item" href="#dashboard">
          <div class="icon-box">🔗</div>
          <div><b>URL SHORTENER</b><span>Customize, share and track links</span></div>
        </a>
        <a class="mega-item" href="#qr">
          <div class="icon-box">▦</div>
          <div><b>QR CODE GENERATOR</b><span>Dynamic solutions to fit every business need</span></div>
        </a>
        <a class="mega-item" href="#pages">
          <div class="icon-box">📱</div>
          <div><b>PAGES &amp; BIO</b><span>Curate and track links for social media profiles</span></div>
        </a>
        <a class="mega-item" href="#analytics">
          <div class="icon-box">📊</div>
          <div><b>ANALYTICS</b><span>A central place to track performance of all links</span></div>
        </a>
      </div>

      <!-- Col 2: Features -->
      <div class="mega-col">
        <h4>FEATURES</h4>
        <a class="mega-item" href="#pages">
          <div class="icon-box">📄</div>
          <div><b>LINK-IN-BIO</b><span>Curate and track content for social profiles</span></div>
        </a>
        <a class="mega-item" href="#dashboard">
          <div class="icon-box">✨</div>
          <div><b>BRANDED LINKS</b><span>Customize links with your brand's URL</span></div>
        </a>
        <a class="mega-item" href="#dashboard">
          <div class="icon-box">💬</div>
          <div><b>MOBILE LINKS</b><span>Short links optimized for SMS messages</span></div>
        </a>
        <a class="mega-item" href="#utm">
          <div class="icon-box">🏷️</div>
          <div><b>UTM CAMPAIGNS</b><span>Track links with custom UTM parameters</span></div>
        </a>
        <a class="mega-item" href="#pages">
          <div class="icon-box">🪪</div>
          <div><b>DIGITAL BUSINESS CARDS</b><span>Grow your network with virtual cards</span></div>
        </a>
        <a class="mega-item" href="#qr">
          <div class="icon-box">📦</div>
          <div><b>2D BARCODES</b><span>Add GTIN to packaging QR codes</span></div>
        </a>
      </div>

      <!-- Col 3: Integrations & Discover -->
      <div class="mega-side-card">
        <h4>INTEGRATIONS</h4>
        <div class="integrations-row">
          <div class="integration-pill">
            <span>🛍️</span><b>Shopify</b>
          </div>
          <div class="integration-pill">
            <span>🎨</span><b>Canva</b>
          </div>
          <div class="integration-pill">
            <span>🟠</span><b>HubSpot</b>
          </div>
        </div>
        <a class="mega-side-link" href="#integrations">See more integrations →</a>

        <div style="border-top:1px solid #fed7aa;margin-top:6px;padding-top:10px;">
          <h4>DISCOVER MORE</h4>
          <a class="mega-side-link" href="#resources" style="margin-bottom:6px">API &amp; DOCUMENTATION</a>
          <a class="mega-side-link" href="#resources">TRUST CENTER</a>
        </div>
      </div>
    </div>
  `,

  AI: `
    <div class="mega-grid">
      <!-- Col 1: AI Features -->
      <div class="mega-col">
        <h4>AI FEATURES</h4>
        <a class="mega-item" href="#assist">
          <div class="icon-box">✦</div>
          <div><b>HEA ASSIST</b><span>AI-Powered link and QR Code analysis</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="icon-box">⚙️</div>
          <div><b>HEA MCP</b><span>Connect to AI agents with Model Context Protocol</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="icon-box">🧩</div>
          <div><b>LLM INTEGRATIONS</b><span>Bring link management to your AI assistants</span></div>
        </a>
      </div>

      <!-- Col 2: AI Resources -->
      <div class="mega-col">
        <h4>AI RESOURCES</h4>
        <a class="mega-item" href="#faq">
          <div class="icon-box">❓</div>
          <div><b>HELP CENTER</b><span>Step-by-step guides &amp; documentation</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="icon-box">💻</div>
          <div><b>DEVELOPERS</b><span>API endpoints &amp; SDK references</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="icon-box">🛡️</div>
          <div><b>TRUST CENTER</b><span>Security, privacy &amp; compliance</span></div>
        </a>
        <a class="mega-item" href="#integrations">
          <div class="icon-box">🔌</div>
          <div><b>INTEGRATIONS MARKETPLACE</b><span>Plug into 100+ platforms</span></div>
        </a>
      </div>

      <!-- Col 3: Featured Card -->
      <div class="mega-side-card" style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border-color:#fed7aa">
        <h4>FEATURED</h4>
        <div style="border-radius:10px;background:#fde68a;height:90px;display:grid;place-items:center;font-size:32px;">📈</div>
        <div>
          <span class="pill" style="font-size:10px;padding:3px 8px;background:#ea580c;color:#fff">RESEARCH REPORT</span>
          <b style="display:block;font-size:13px;margin-top:6px;color:var(--ink)">The Click Expectation Report</b>
          <span style="font-size:12px;color:var(--mut)">What makes links worth clicking in 2026.</span>
        </div>
        <a class="mega-side-link" href="#resources">Read Report →</a>
      </div>
    </div>
  `,

  Solutions: `
    <div class="solutions-mega">
      <!-- Left Sidebar Tabs -->
      <div class="sol-tabs" id="solMegaTabs">
        <button type="button" class="sol-tab-btn active" data-tab="industry">BY INDUSTRY <span>›</span></button>
        <button type="button" class="sol-tab-btn" data-tab="team">BY TEAM <span>›</span></button>
        <button type="button" class="sol-tab-btn" data-tab="business">BY BUSINESS <span>›</span></button>
      </div>

      <!-- Middle Content Pane (switches dynamically) -->
      <div class="sol-grid" id="solMegaGrid">
        <!-- populated by JS -->
      </div>

      <!-- Right Column: Use Cases -->
      <div class="sol-use-cases">
        <h4>USE CASES</h4>
        <a href="#solutions">ORDER CONFIRMATION</a>
        <a href="#solutions">SURVEYS AND FEEDBACK</a>
        <a href="#solutions">PRODUCT PACKAGING</a>
        <a href="#solutions">PRINT ADVERTISING</a>
        <a href="#solutions">DIGITAL ADVERTISING</a>
        <a href="#solutions">CONTENT SHARING</a>

        <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">
          <h4>WHY HEA?</h4>
          <a href="#solutions">INTEGRATE WITH HEA</a>
          <a href="#pricing">COMPARE HEA</a>
        </div>
      </div>
    </div>
  `,

  Resources: `
    <div class="mega-grid">
      <div class="mega-col">
        <h4>LEARN MORE</h4>
        <a class="mega-item" href="#resources">
          <div class="icon-box">📚</div>
          <div><b>GUIDES &amp; EBOOKS</b><span>Practical tactics to increase CTR</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="icon-box">✍️</div>
          <div><b>BLOG &amp; INSIGHTS</b><span>Latest trends in short link branding</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="icon-box">🤖</div>
          <div><b>HEA ASSIST AI</b><span>Ask questions about your data</span></div>
        </a>
      </div>
      <div class="mega-col">
        <h4>FIND ANSWERS</h4>
        <a class="mega-item" href="#faq">
          <div class="icon-box">❓</div>
          <div><b>HELP CENTER</b><span>FAQs and setup troubleshooting</span></div>
        </a>
        <a class="mega-item" href="#pricing">
          <div class="icon-box">🏷️</div>
          <div><b>PRICING</b><span>Transparent plans for all teams</span></div>
        </a>
        <a class="mega-item" href="#solutions">
          <div class="icon-box">🤝</div>
          <div><b>CONTACT SALES</b><span>Custom enterprise plans &amp; SLAs</span></div>
        </a>
      </div>
      <div class="mega-side-card">
        <h4>WHAT'S NEW</h4>
        <div class="pill" style="background:#dbeafe;color:var(--blue)">VERSION 2.4</div>
        <p style="font-size:13px;color:var(--ink);font-weight:600">Mobile Link-in-Bio Pages</p>
        <p style="font-size:12px;color:var(--mut)">Build a gorgeous social profile landing page in under 60 seconds.</p>
        <a class="mega-side-link" href="#pages">Build My Bio Page →</a>
      </div>
    </div>
  `
};

const SOL_ITEMS = {
  industry: [
    { icon: '🛍️', title: 'RETAIL', href: '#solutions' },
    { icon: '🛒', title: 'CONSUMER PACKAGED GOODS', href: '#solutions' },
    { icon: '🏨', title: 'HOSPITALITY', href: '#solutions' },
    { icon: '🎬', title: 'MEDIA &amp; ENTERTAINMENT', href: '#solutions' },
    { icon: '💻', title: 'TECHNOLOGY &amp; HARDWARE', href: '#solutions' },
    { icon: '🏥', title: 'HEALTHCARE', href: '#solutions' },
    { icon: '☂️', title: 'INSURANCE', href: '#solutions' },
    { icon: '🪙', title: 'FINANCIAL SERVICES', href: '#solutions' },
    { icon: '💼', title: 'PROFESSIONAL SERVICES', href: '#solutions' },
    { icon: '🎓', title: 'EDUCATION', href: '#solutions' }
  ],
  team: [
    { icon: '&lt;/&gt;', title: 'DEVELOPERS', href: '#solutions' },
    { icon: '📢', title: 'MARKETING', href: '#solutions' },
    { icon: '🎧', title: 'CUSTOMER SERVICE', href: '#solutions' }
  ],
  business: [
    { icon: '🏪', title: 'SMALL BUSINESS', href: '#solutions' },
    { icon: '🏢', title: 'MIDMARKET', href: '#solutions' },
    { icon: '🏙️', title: 'ENTERPRISE', href: '#solutions' }
  ]
};

function renderSolMegaGrid(tabKey = 'industry') {
  const container = $('#solMegaGrid');
  if (!container) return;
  const items = SOL_ITEMS[tabKey] || SOL_ITEMS.industry;
  container.innerHTML = items.map(it => `
    <a class="mega-item" href="${it.href}">
      <div class="icon-box">${it.icon}</div>
      <div><b>${it.title}</b></div>
    </a>
  `).join('');
}

function initNav() {
  $('#menu').innerHTML = ['Platform', 'AI', 'Solutions', 'Resources'].map(name => `
    <div class="mi">
      <button type="button" aria-expanded="false">${name} <span class="arrow">▾</span></button>
      <div class="drop">${MEGA[name]}</div>
    </div>
  `).join('') + '<div class="mi"><a href="#pricing">Pricing</a></div>';

  // Mega dropdown tab hover / click handlers for Solutions
  $$('#solMegaTabs .sol-tab-btn').forEach(btn => {
    const activate = () => {
      $$('#solMegaTabs .sol-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderSolMegaGrid(btn.dataset.tab);
    };
    btn.onmouseenter = activate;
    btn.onclick = activate;
  });
  renderSolMegaGrid('industry');

  // Mobile / click toggle for top menu items
  $$('.mi > button').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const parent = btn.parentNode;
      const wasOpen = parent.classList.contains('open');
      $$('.mi').forEach(m => m.classList.remove('open'));
      if (!wasOpen) parent.classList.add('open');
      btn.setAttribute('aria-expanded', !wasOpen);
    };
  });

  document.addEventListener('click', () => {
    $$('.mi').forEach(m => m.classList.remove('open'));
  });

  $('#burger').onclick = () => $('.nav').classList.toggle('open');
}

function renderNavRight() {
  $('#navR').innerHTML = session
    ? `<a class="btn ghost sm" href="#dashboard">Dashboard</a>
       <button class="btn dark sm" id="logoutBtn" type="button">Log out</button>`
    : `<a href="#login" style="font-weight:600;font-size:14px;padding:8px 12px">Log in</a>
       <a class="btn dark sm" href="#signup">Sign up Free</a>`;

  const lo = $('#logoutBtn');
  if (lo) {
    lo.onclick = () => {
      session = null;
      store.set('hea_session', null);
      renderNavRight();
      location.hash = '#home';
      toast('Logged out successfully');
    };
  }
}

/* =========================================================
   STATIC SECTIONS CONTENT POPULATOR
   ========================================================= */

const FEATURES = [
  ['🔗', 'Short Links', 'Custom back-halves, branded domains, tags, and editable destinations.', '#dashboard'],
  ['▦', 'Dynamic QR Codes', 'Custom brand colours, PNG vector download, and real-time updates.', '#qr'],
  ['📱', 'Link-in-Bio Pages', 'Curate all your links onto one gorgeous mobile profile.', '#pages'],
  ['📈', 'Detailed Analytics', 'Click metrics over time, device types, geolocations, and referrers.', '#analytics']
];

const ADVANCED = [
  ['AI Assistant', 'Analyzes past click traffic and recommends memorable slugs.'],
  ['Password & Expiry', 'Protect confidential links or let campaigns expire automatically.'],
  ['Dynamic Routing', 'Redirect users based on country, language, or mobile OS.'],
  ['UTM Builder', 'Campaign-ready tracking parameters built in seconds.'],
  ['Team Workspaces', 'Roles and permissions with complete audit trail.'],
  ['Safe Link Preview', 'Protects users by showing a clean redirect preview.']
];

const STEPS = [
  ['1. Paste Long URL', 'Drop any long, cumbersome link into HEA Link.'],
  ['2. Customize & Brand', 'Pick a custom back-half, generate a QR code, or add an expiry date.'],
  ['3. Share & Track', 'Share anywhere and watch real-time clicks flood into your analytics dashboard.']
];

const PLANS = [
  ['Free', 'Rs 0', ['50 short links a month', 'Standard QR codes', '7-day analytics retention', '1 Link-in-Bio page'], 'Get Started Free', false],
  ['Pro', 'Rs 1,499', ['Unlimited short links', 'Dynamic QR with logo & colours', 'Password, expiry & UTM builder', '1-year analytics + AI summaries', '5 Link-in-Bio pages'], 'Start Pro Free', true],
  ['Enterprise', 'Custom', ['Everything in Pro', 'Custom branded domains', 'Dynamic routing & REST API', 'Team workspaces & SSO', 'Dedicated SLA support'], 'Contact Sales', false]
];

const FAQ = [
  ['Is HEA Link free to use?', 'Yes! The Free plan gives you complete access to generate branded short links, basic QR codes, and a Link-in-Bio page at zero cost.'],
  ['Can I edit a destination URL after sharing it?', 'Yes! You can edit the destination URL anytime from your dashboard. The short link and QR code remain identical.'],
  ['How does the safe link redirection work?', 'When a visitor clicks your HEA Link, they are greeted by a safe gateway showing the destination URL before redirecting, keeping your audience safe from phishing.'],
  ['Can I track UTM parameters and marketing campaigns?', 'Absolutely. Use our built-in UTM Campaign Builder to tag sources, mediums, and campaigns, then monitor performance in the Analytics tab.']
];

function initStaticSections() {
  $('#features').innerHTML = FEATURES.map(f => `
    <a class="fc" href="${f[3]}">
      <div class="ic">${f[0]}</div>
      <h3>${f[1]}</h3>
      <p>${f[2]}</p>
    </a>
  `).join('');

  $('#adv').innerHTML = ADVANCED.map(a => `
    <div class="fc">
      <h3>${a[0]}</h3>
      <p>${a[1]}</p>
    </div>
  `).join('');

  $('#steps').innerHTML = STEPS.map((s, i) => `
    <div class="fc">
      <div class="num">${i + 1}</div>
      <h3>${s[0]}</h3>
      <p>${s[1]}</p>
    </div>
  `).join('');

  $('#plans').innerHTML = PLANS.map(p => `
    <div class="card ${p[4] ? 'hot' : ''}">
      <div>
        <h3>${p[0]}</h3>
        <div class="price">${p[1]} <small class="muted" style="font-size:14px;font-weight:400">/ month</small></div>
        <ul>${p[2].map(it => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>
      <a class="btn ${p[4] ? '' : 'ghost'} wide" style="text-align:center;margin-top:20px" href="#signup">${p[3]}</a>
    </div>
  `).join('');

  $('#faq').innerHTML = FAQ.map(f => `
    <details>
      <summary>${f[0]}</summary>
      <p>${f[1]}</p>
    </details>
  `).join('');
}

/* =========================================================
   HERO ACTIONS & SHORTENER ENGINE
   ========================================================= */

let heroMode = 'link';

$$('#heroTabs button').forEach(btn => {
  btn.onclick = () => {
    heroMode = btn.dataset.t;
    $$('#heroTabs button').forEach(b => b.classList.toggle('on', b === btn));
    $('#heroErr').textContent = '';
    $('#heroRes').hidden = true;
    $('#heroQr').hidden = true;
    $('#heroBulk').hidden = heroMode !== 'bulk';
    $('#heroForm').hidden = heroMode === 'bulk';

    if (heroMode === 'link') {
      $('#heroBtn').textContent = 'Shorten link';
      $('#heroUrl').placeholder = 'https://example.com/a-very-long-page-address';
    } else if (heroMode === 'qr') {
      $('#heroBtn').textContent = 'Create QR code';
      $('#heroUrl').placeholder = 'https://example.com or any text';
    }
  };
});

$('#heroForm').onsubmit = async e => {
  e.preventDefault();
  const inputVal = $('#heroUrl').value;
  const errBox = $('#heroErr');
  errBox.textContent = '';

  if (heroMode === 'qr') {
    const norm = normalize(inputVal) || inputVal.trim();
    if (!norm) {
      errBox.textContent = 'Please enter a valid link or text.';
      return;
    }
    $('#heroQr').hidden = false;
    drawQR($('#heroQr'), norm, '#0e1a33', '#ffffff', 256);
    $('#heroRes').hidden = true;
    return;
  }

  // Create link
  const res = createLink({ url: inputVal });
  if (res.error) {
    errBox.textContent = res.error;
    return;
  }

  const l = res.link;
  const box = $('#heroRes');
  box.hidden = false;

  // Show immediate branded short link and loading state for external short URL
  const vUrl = visitUrl(l);
  box.innerHTML = `
    <div>
      <small>Branded Short Link:</small>
      <a href="${esc(vUrl)}" target="_blank" rel="noopener">${esc(shortText(l))}</a>
      <div id="realShortContainer" style="margin-top:4px;font-size:13px;color:var(--mut);">
        <span>Fetching short link...</span>
      </div>
    </div>
    <div class="row">
      <button class="btn ghost sm" id="rCopy" type="button">📋 Copy</button>
      <button class="btn ghost sm" id="rQr" type="button">▦ QR Code</button>
    </div>
  `;

  $('#rCopy').onclick = () => copy(l.realShort || vUrl);
  $('#rQr').onclick = () => qrModal(vUrl);

  // Attempt real 17-char short link
  fetchOnlineShortUrl(l.url).then(shortUrl => {
    const sc = $('#realShortContainer');
    if (shortUrl) {
      l.realShort = shortUrl;
      saveLinks();
      if (sc) {
        sc.innerHTML = `Short URL: <a href="${esc(shortUrl)}" target="_blank" style="color:#ea580c;font-weight:600">${esc(shortUrl)}</a>`;
      }
    } else if (sc) {
      sc.innerHTML = `Shareable Link: <a href="${esc(vUrl)}" target="_blank">${esc(vUrl.slice(0, 42))}…</a>`;
    }
  });
};

// Bulk shortener button
$('#bulkBtn').onclick = async () => {
  const text = $('#bulkUrls').value.trim();
  const resBox = $('#bulkRes');
  if (!text) {
    toast('Please paste at least one URL');
    return;
  }
  const lines = text.split('\n').map(x => x.trim()).filter(Boolean);
  resBox.innerHTML = '<p class="muted">Shortening links…</p>';

  const outputs = [];
  for (const raw of lines) {
    const r = createLink({ url: raw });
    if (r.link) {
      const v = visitUrl(r.link);
      outputs.push(`<div class="res" style="margin:4px 0;padding:8px 12px">
        <span>${esc(r.link.url.slice(0, 36))}…</span>
        <a href="${esc(v)}" target="_blank"><b>${esc(shortText(r.link))}</b></a>
      </div>`);
    }
  }
  resBox.innerHTML = outputs.join('') || '<p class="err">No valid URLs provided.</p>';
  toast(`Shortened ${outputs.length} links!`);
};

// AI Suggest back-half button
$('#aiBtn').onclick = () => {
  const u = normalize($('#aiUrl').value);
  const o = $('#aiOut');
  o.textContent = u ? `✦ Suggested: ${DOMAIN}/${suggest(u)}` : 'Please paste a valid URL first.';
};

/* =========================================================
   AUTHENTICATION ENGINE (Client-side SHA-256)
   ========================================================= */

async function hashPassword(str) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

let authMode = 'login';

function showAuth(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  $('#authTitle').textContent = isSignup ? 'Create Your Account' : 'Welcome Back';
  $('#authSub').textContent = isSignup
    ? 'Free forever. No credit card required.'
    : 'Log in to manage your links, QR codes, and analytics.';
  $('#nameWrap').hidden = !isSignup;
  $('#authBtn').textContent = isSignup ? 'Sign Up Free' : 'Log In';
  $('#authErr').textContent = '';
  $('#authSwap').innerHTML = isSignup
    ? 'Already have an account? <a href="#login"><b>Log in</b></a>'
    : 'Don\'t have an account? <a href="#signup"><b>Sign up free</b></a>';
}

$('#authForm').onsubmit = async e => {
  e.preventDefault();
  const email = $('#aEmail').value.trim().toLowerCase();
  const pass = $('#aPass').value;
  const errBox = $('#authErr');

  if (pass.length < 6) {
    errBox.textContent = 'Password must be at least 6 characters.';
    return;
  }

  const users = store.get('hea_users', []);
  const h = await hashPassword(pass);

  if (authMode === 'signup') {
    if (users.find(u => u.email === email)) {
      errBox.textContent = 'An account with this email already exists. Please log in.';
      return;
    }
    const name = $('#aName').value.trim() || email.split('@')[0];
    users.push({ email, name, h });
    store.set('hea_users', users);
  } else {
    const user = users.find(u => u.email === email && u.h === h);
    if (!user) {
      errBox.textContent = 'Incorrect email or password.';
      return;
    }
  }

  const cur = users.find(u => u.email === email);
  session = { email, name: cur.name };
  store.set('hea_session', session);

  // Claim links created as guest
  links.forEach(l => {
    if (l.owner === 'guest') l.owner = email;
  });
  saveLinks();

  renderNavRight();
  $('#authForm').reset();
  location.hash = '#dashboard';
  toast(`Welcome, ${cur.name}!`);
};

/* =========================================================
   DASHBOARD VIEW ENGINE
   ========================================================= */

function renderDash() {
  const all = mine();
  const query = ($('#search').value || '').toLowerCase();
  const filtered = all.filter(l => (l.slug + l.url + (l.tag || '')).toLowerCase().includes(query));
  const totalClicks = all.reduce((acc, l) => acc + (l.clicks?.length || 0), 0);

  $('#dashSub').textContent = `${all.length} links · ${totalClicks} total clicks`;

  $('#list').innerHTML = filtered.length
    ? filtered.map(l => {
        const clicksCount = l.clicks?.length || 0;
        const vUrl = visitUrl(l);
        return `
          <div class="item" data-id="${l.id}">
            <div class="av">${esc((l.slug[0] || 'L').toUpperCase())}</div>
            <div class="mid">
              <a class="s" href="${esc(vUrl)}" target="_blank" rel="noopener">${esc(shortText(l))}</a>
              <div class="u" title="${esc(l.url)}">${esc(l.url)}</div>
              <div>
                ${l.tag ? `<span class="tag">🏷️ ${esc(l.tag)}</span>` : ''}
                ${l.expires ? `<span class="tag ${isExpired(l) ? 'w' : ''}">${isExpired(l) ? 'Expired' : 'Expires ' + esc(l.expires)}</span>` : ''}
                ${l.realShort ? `<span class="tag" style="background:#fff7ed;color:#ea580c">⚡ ${esc(l.realShort)}</span>` : ''}
              </div>
            </div>
            <div class="cnt">
              <b>${clicksCount}</b>
              <span>clicks</span>
            </div>
            <div class="acts">
              <button class="btn ghost sm" data-a="copy" type="button">📋 Copy</button>
              <button class="btn ghost sm" data-a="qr" type="button">▦ QR</button>
              <button class="btn ghost sm" data-a="edit" type="button">✏️ Edit</button>
              <button class="btn ghost sm red" data-a="del" type="button">🗑️ Delete</button>
            </div>
          </div>
        `;
      }).join('')
    : `<div class="empty">${all.length ? 'No links match your search.' : 'No links created yet. Click "+ Create link" to get started.'}</div>`;
}

$('#list').onclick = e => {
  const btn = e.target.closest('button[data-a]');
  if (!btn) return;
  const item = btn.closest('.item');
  const l = links.find(x => x.id === item.dataset.id);
  if (!l) return;

  const action = btn.dataset.a;
  const vUrl = visitUrl(l);

  if (action === 'copy') {
    copy(l.realShort || vUrl);
  } else if (action === 'qr') {
    qrModal(vUrl);
  } else if (action === 'edit') {
    linkModal(l);
  } else if (action === 'del') {
    openModal(
      'Delete Link?',
      `<p>Are you sure you want to delete <b>${esc(shortText(l))}</b>?<br>This link will stop working immediately.</p>`,
      () => {
        links = links.filter(x => x.id !== l.id);
        saveLinks();
        renderDash();
        toast('Link deleted');
      },
      'Delete'
    );
  }
};

$('#search').oninput = renderDash;
$('#newBtn').onclick = () => linkModal();

$('#demoBtn').onclick = () => {
  const m = mine();
  if (!m.length) {
    toast('Please create a link first');
    return;
  }
  m.forEach(l => {
    const num = 10 + Math.floor(Math.random() * 35);
    for (let i = 0; i < num; i++) {
      l.clicks.push({
        t: Date.now() - Math.random() * 13 * 864e5,
        d: pick(['Mobile', 'Mobile', 'Desktop', 'Desktop', 'Tablet']),
        r: pick(['Instagram', 'WhatsApp', 'Direct', 'Google', 'Facebook', 'LinkedIn']),
        c: pick(['US', 'PK', 'GB', 'AE', 'CA', 'DE'])
      });
    }
  });
  saveLinks();
  renderDash();
  toast('Generated realistic demo clicks!');
};

$('#exportBtn').onclick = () => {
  const rows = [
    ['short_link', 'destination', 'tag', 'clicks', 'created_at']
  ].concat(mine().map(l => [
    shortText(l),
    l.url,
    l.tag || '',
    l.clicks?.length || 0,
    new Date(l.created).toISOString()
  ]));

  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hea-links-export-${Date.now()}.csv`;
  a.click();
  toast('Exported CSV');
};

/* =========================================================
   QR CODE STUDIO VIEW
   ========================================================= */

function renderQrPage() {
  const err = $('#qErr');
  err.textContent = '';
  try {
    drawQR(
      $('#qCv'),
      $('#qText').value || 'https://example.com',
      $('#qFg').value,
      $('#qBg').value,
      +$('#qSize').value
    );
  } catch (e) {
    err.textContent = 'Text is too long for QR code.';
  }
}

['qText', 'qFg', 'qBg', 'qSize'].forEach(id => {
  $('#' + id).oninput = renderQrPage;
});

$('#qDl').onclick = () => download($('#qCv'), 'hea-qr-code.png');

/* =========================================================
   ANALYTICS ENGINE & CHART RENDERER
   ========================================================= */

function renderAnalytics() {
  const m = mine();
  const clicks = m.flatMap(l => l.clicks || []);
  const days = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ d, n: 0 });
  }

  clicks.forEach(c => {
    const day = days.find(x => c.t >= x.d.getTime() && c.t < x.d.getTime() + 864e5);
    if (day) day.n++;
  });

  const maxClicks = Math.max(1, ...days.map(x => x.n));
  const topLink = m.slice().sort((a, b) => (b.clicks?.length || 0) - (a.clicks?.length || 0))[0];

  $('#anSub').textContent = clicks.length
    ? `Top Performing Link: ${topLink ? shortText(topLink) : '-'}`
    : 'No clicks yet. Share a link or click "Add demo clicks" in Dashboard.';

  const mobileCount = clicks.filter(c => c.d === 'Mobile').length;
  const mobilePct = clicks.length ? Math.round((mobileCount / clicks.length) * 100) + '%' : '0%';
  const avgClicks = m.length ? Math.round(clicks.length / m.length) : 0;

  $('#stats').innerHTML = [
    ['Total Clicks', clicks.length],
    ['Active Links', m.length],
    ['Mobile Share', mobilePct],
    ['Avg Clicks / Link', avgClicks]
  ].map(s => `
    <div class="stat">
      <p>${s[0]}</p>
      <b>${s[1]}</b>
    </div>
  `).join('');

  $('#chart').innerHTML = `
    <div class="bars">
      ${days.map(x => `
        <div style="height:${Math.max(4, Math.round((x.n / maxClicks) * 100))}%" data-v="${x.n}"></div>
      `).join('')}
    </div>
    <div class="lbl">
      ${days.map(x => `<span>${x.d.getDate()}</span>`).join('')}
    </div>
  `;

  const renderBreakdownCard = (title, key) => {
    const counts = {};
    clicks.forEach(x => { counts[x[key]] = (counts[x[key]] || 0) + 1; });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tot = clicks.length || 1;

    return `
      <div class="card pad">
        <h3>${title}</h3>
        ${rows.length ? rows.map(([k, v]) => `
          <div class="br">
            <div>
              <span>${esc(k)}</span>
              <span>${Math.round((v / tot) * 100)}% (${v})</span>
            </div>
            <i><b style="width:${(v / tot) * 100}%"></b></i>
          </div>
        `).join('') : '<p class="muted small" style="margin-top:14px">No data recorded yet</p>'}
      </div>
    `;
  };

  $('#breakdown').innerHTML =
    renderBreakdownCard('Devices', 'd') +
    renderBreakdownCard('Top Referrers', 'r') +
    renderBreakdownCard('Top Countries', 'c');
}

/* =========================================================
   UNIVERSAL REDIRECT GATEWAY (#go-slug?u=...)
   Guaranteed to NEVER fail on any computer or phone
   ========================================================= */

function goPage(hashFragment) {
  show('go');
  const [slugPart, queryPart] = hashFragment.split('?');
  const params = new URLSearchParams(queryPart || '');
  const uParam = params.get('u');

  // Look up link in localStorage, fallback to encoded ?u= parameter
  const l = links.find(x => x.slug.toLowerCase() === slugPart.toLowerCase());
  const destUrl = l ? l.url : (uParam ? decodeURIComponent(uParam) : null);
  const box = $('#goBox');

  if (!destUrl) {
    box.innerHTML = `
      <h2>Link Not Found</h2>
      <p class="muted">This short link was not found on this device.</p>
      <div style="margin-top:20px">
        <a class="btn" href="#home">Return Home</a>
      </div>
    `;
    return;
  }

  if (l && isExpired(l)) {
    box.innerHTML = `
      <h2>This Link Has Expired</h2>
      <p class="muted">The creator set an expiration date that has passed.</p>
      <div style="margin-top:20px">
        <a class="btn" href="#home">Return Home</a>
      </div>
    `;
    return;
  }

  // Record click if link is tracked
  if (l) recordClick(l);

  box.innerHTML = `
    <span class="pill" style="margin-bottom:12px">Safe Redirect Gateway</span>
    <h2>Redirecting to Destination…</h2>
    <p class="muted">You are safely being redirected to:</p>
    <div style="background:rgba(255,255,255,0.08);padding:14px 18px;border-radius:12px;margin:18px 0;word-break:break-all;font-weight:600;color:var(--blue);border:1px solid var(--line)">
      ${esc(destUrl)}
    </div>
    <p class="small">Redirecting automatically in <span id="cdNum">2</span> seconds…</p>
    <div class="row" style="justify-content:center;margin-top:18px">
      <a class="btn" id="goNowBtn" href="${esc(destUrl)}" rel="noopener noreferrer">Continue Now →</a>
      <a class="btn ghost" href="#home">Cancel</a>
    </div>
  `;

  let seconds = 2;
  clearTimeout(goPage.timer);
  clearInterval(goPage.interval);

  goPage.interval = setInterval(() => {
    seconds--;
    const cd = document.getElementById('cdNum');
    if (cd) cd.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(goPage.interval);
      window.location.href = destUrl;
    }
  }, 1000);
}

/* =========================================================
   HEA ASSIST AI (Data-Driven Conversational Analyst)
   ========================================================= */

function answer(question) {
  const q = question.toLowerCase();
  const m = mine();
  const c = m.flatMap(l => l.clicks || []);

  if (!m.length) return 'You have no links created yet. Create a link on the dashboard and I can analyze its performance.';
  if (!c.length) return 'Your links do not have any clicks yet. Click "Add demo clicks" in Dashboard to test me with realistic traffic.';

  const countBy = k => {
    const o = {};
    c.forEach(x => { o[x[k]] = (o[x[k]] || 0) + 1; });
    return Object.entries(o).sort((a, b) => b[1] - a[1]);
  };

  const pct = n => Math.round((n / c.length) * 100) + '%';
  const topLink = m.slice().sort((a, b) => (b.clicks?.length || 0) - (a.clicks?.length || 0))[0];
  const now = Date.now();
  const w7 = c.filter(x => x.t > now - 7 * 864e5).length;
  const p7 = c.filter(x => x.t <= now - 7 * 864e5 && x.t > now - 14 * 864e5).length;

  if (/device|mobile|desktop|tablet/.test(q)) {
    const topDev = countBy('d')[0];
    return `📱 ${topDev[0]} is your most active platform, accounting for ${pct(topDev[1])} of all clicks (${topDev[1]} clicks).`;
  }
  if (/referr|source|instagram|whatsapp|google|facebook|came from/.test(q)) {
    const topRef = countBy('r')[0];
    return `🔗 Your top traffic referrer is ${topRef[0]} driving ${topRef[1]} clicks (${pct(topRef[1])} of total traffic).`;
  }
  if (/countr|region|location|geograph/.test(q)) {
    const topCountry = countBy('c')[0];
    return `🌍 Most clicks originate from ${topCountry[0]} with ${pct(topCountry[1])} of the total audience.`;
  }
  if (/week|trend|growth|compare|last/.test(q)) {
    const diff = p7 ? Math.round(((w7 - p7) / p7) * 100) : 0;
    return `📈 In the last 7 days, your links received ${w7} clicks, compared to ${p7} in the previous period (${diff >= 0 ? '+' : ''}${diff}% change).`;
  }
  if (/top|best|perform|link/.test(q)) {
    return `🏆 Your top link is ${shortText(topLink)} with ${topLink.clicks?.length || 0} clicks (${pct(topLink.clicks?.length || 0)} of your total clicks).`;
  }

  return `📊 You currently have ${m.length} active links and ${c.length} recorded clicks. Try asking me: "Which device is most used?", "Top referrer?", or "Compare this week vs last week".`;
}

function chatAdd(text, isUser = false) {
  const d = document.createElement('div');
  d.className = 'msg ' + (isUser ? 'me' : 'ai');
  d.textContent = text;
  $('#chatLog').appendChild(d);
  $('#chatLog').scrollTop = 1e6;
}

function initChat() {
  if (!$('#chatLog').children.length) {
    chatAdd("Hi! I'm HEA Assist. Ask me anything about your link analytics, referrers, and audience breakdown.");
  }
  $('#chips').innerHTML = [
    'How are my links performing?',
    'Top referrer?',
    'Which device is most used?',
    'Compare this week vs last week'
  ].map(q => `<button type="button">${q}</button>`).join('');
}

const askChat = q => {
  if (!q.trim()) return;
  chatAdd(q, true);
  setTimeout(() => chatAdd(answer(q)), 200);
};

$('#chips').onclick = e => {
  if (e.target.tagName === 'BUTTON') askChat(e.target.textContent);
};

$('#chatForm').onsubmit = e => {
  e.preventDefault();
  askChat($('#chatIn').value);
  $('#chatIn').value = '';
};

/* =========================================================
   RESOURCES & KNOWLEDGE BASE
   ========================================================= */

const RES_DATA = [
  ['Getting Started with Short Links', 'Short links', '🔗', 'Learn how to paste long URLs, select memorable custom back-halves, organize with campaign tags, and set expiration limits.'],
  ['Branding Links for Higher CTR', 'Branding', '🎨', 'Branded back-halves establish user trust and boost click-through rates by up to 34%. Best practices for concise and memorable link naming.'],
  ['QR Codes for Print & Packaging', 'QR Codes', '▦', 'Ensure scannability across diverse smartphone cameras by maintaining high contrast margins and testing across multiple lighting environments.'],
  ['UTM Tracking Strategy Guide', 'Digital Marketing', '📣', 'Accurately attribute revenue by attaching campaign sources, mediums, and content tags to all marketing channels.'],
  ['Link-in-Bio Conversion Optimization', 'Digital Marketing', '📱', 'Prioritize your top call to action, keep button titles action-oriented, and review analytics weekly to refine content hierarchy.'],
  ['Interpreting Device & Geo Analytics', 'Analytics', '📈', 'Identify where your highest-converting visitors come from, optimize mobile experiences, and target promotions effectively.']
];

let resCat = 'All';

function renderResources() {
  const cats = ['All', ...new Set(RES_DATA.map(r => r[1]))];
  const query = ($('#resSearch').value || '').toLowerCase();

  $('#resTabs').innerHTML = cats.map(c => `
    <button class="${c === resCat ? 'on' : ''}" data-c="${c}" type="button">${c}</button>
  `).join('');

  const filtered = RES_DATA.filter(r => (resCat === 'All' || r[1] === resCat) && (r[0] + r[3]).toLowerCase().includes(query));

  $('#resGrid').innerHTML = filtered.length
    ? filtered.map((r, i) => `
        <button class="rc" data-i="${i}" type="button">
          <div class="cv">${r[2]}</div>
          <div>
            <span class="tag">${r[1]}</span>
            <h3>${r[0]}</h3>
            <p>${r[3].slice(0, 80)}…</p>
          </div>
        </button>
      `).join('')
    : '<div class="empty">No guides found.</div>';
}

$('#resTabs').onclick = e => {
  if (e.target.dataset.c) {
    resCat = e.target.dataset.c;
    renderResources();
  }
};
$('#resSearch').oninput = renderResources;

$('#resGrid').onclick = e => {
  const btn = e.target.closest('.rc');
  if (btn) {
    const item = RES_DATA[+btn.dataset.i];
    openModal(item[0], `<p style="line-height:1.7;font-size:15px">${item[3]}</p>`, null);
  }
};

/* =========================================================
   PAGES (LINK-IN-BIO BUILDER & PUBLIC VIEW)
   ========================================================= */

const BIO_THEMES = {
  ocean: ['#dbeafe', '#1d4ed8', '#0e1a33'],
  sunset: ['#ffedd5', '#ea580c', '#431407'],
  night: ['#0e1a33', '#14b8a6', '#ffffff']
};

function bioHTML(b) {
  const [bg, accent, textCol] = BIO_THEMES[b.theme] || BIO_THEMES.ocean;
  return `
    <div class="bio" style="background:${bg};color:${textCol}">
      <div class="bav" style="background:${accent}">${esc((b.name || 'H')[0].toUpperCase())}</div>
      <h3 style="font-size:20px">${esc(b.name || 'Your Brand Name')}</h3>
      <p style="font-size:14px;opacity:0.9">${esc(b.bio || 'Your bio description goes here.')}</p>
      ${(b.links || []).map((l, i) => `
        <a class="bl" style="background:${accent};color:#fff" href="${esc(l.url)}" data-i="${i}" target="_blank" rel="noopener">${esc(l.label)}</a>
      `).join('')}
    </div>
  `;
}

function parseBioLinks(raw) {
  return raw.split('\n')
    .map(line => line.split('|'))
    .map(p => ({ label: (p[0] || '').trim(), url: normalize((p[1] || '').trim()) }))
    .filter(l => l.label && l.url);
}

const getBioDraft = () => ({
  name: $('#bName').value.trim(),
  bio: $('#bBio').value.trim(),
  slug: $('#bSlug').value.trim().toLowerCase(),
  theme: $('#bTheme').value,
  links: parseBioLinks($('#bLinks').value)
});

const updateBioPreview = () => {
  $('#bioPrev').innerHTML = bioHTML(getBioDraft());
};

function initBio() {
  const b = bios.find(x => x.owner === owner());
  if (b) {
    $('#bName').value = b.name || '';
    $('#bBio').value = b.bio || '';
    $('#bSlug').value = b.slug || '';
    $('#bTheme').value = b.theme || 'ocean';
    $('#bLinks').value = (b.links || []).map(l => `${l.label} | ${l.url}`).join('\n');
    $('#bioSub').textContent = `Published · ${b.views || 0} views · ${Object.values(b.lc || {}).reduce((a, n) => a + n, 0)} link clicks`;
  }
  $('#bOpen').hidden = $('#bCopy').hidden = !b;
  if (b) $('#bOpen').href = '#bio-' + b.slug;
  updateBioPreview();
}

['bName', 'bBio', 'bTheme', 'bLinks'].forEach(id => {
  $('#' + id).oninput = updateBioPreview;
});

$('#bSave').onclick = () => {
  const d = getBioDraft();
  const err = $('#bErr');
  err.textContent = '';

  if (!d.name) { err.textContent = 'Please add a display name.'; return; }
  if (!/^[a-z0-9-]{2,30}$/.test(d.slug)) { err.textContent = 'Page address: 2–30 lowercase letters, numbers or hyphens.'; return; }
  if (!d.links.length) { err.textContent = 'Add at least one link in the format: Label | https://…'; return; }

  const clash = bios.find(x => x.slug === d.slug && x.owner !== owner());
  if (clash) { err.textContent = 'That page handle is already taken.'; return; }

  const existing = bios.find(x => x.owner === owner());
  const updated = Object.assign(existing || { owner: owner(), views: 0, lc: {} }, d);
  if (!existing) bios.push(updated);
  store.set('hea_bios', bios);

  initBio();
  toast('Bio page published successfully!');
};

$('#bCopy').onclick = () => {
  const slug = $('#bSlug').value.trim().toLowerCase();
  copy(location.href.split('#')[0] + '#bio-' + slug);
};

function bioPage(slug) {
  show('bio');
  const b = bios.find(x => x.slug === slug.toLowerCase());
  const box = $('#bioPub');
  if (!b) {
    box.innerHTML = `
      <div class="card pad center">
        <h2>Page Not Found</h2>
        <p class="muted">This Link-in-Bio profile does not exist.</p>
        <div style="margin-top:20px"><a class="btn" href="#home">Return Home</a></div>
      </div>
    `;
    return;
  }
  b.views = (b.views || 0) + 1;
  store.set('hea_bios', bios);
  box.innerHTML = bioHTML(b);

  box.onclick = e => {
    const a = e.target.closest('a[data-i]');
    if (a) {
      b.lc = b.lc || {};
      b.lc[a.dataset.i] = (b.lc[a.dataset.i] || 0) + 1;
      store.set('hea_bios', bios);
    }
  };
}

/* =========================================================
   SOLUTIONS, UTM BUILDER & INTEGRATIONS HUBS
   ========================================================= */

const ALL_SOLUTIONS = {
  industry: [
    ['🛍️', 'Retail & E-commerce', 'Drive in-store foot traffic with QR packaging and track omnichannel conversion rates.'],
    ['🛒', 'Consumer Packaged Goods', 'Add smart 2D barcodes to packages to communicate nutritional data and promotions.'],
    ['🏨', 'Hospitality & Travel', 'Provide touchless check-ins, dining menus, and digital concierge guides.'],
    ['🎬', 'Media & Entertainment', 'Connect streaming trailers to tickets and social communities.'],
    ['💻', 'Technology & Software', 'Route beta downloads, documentation links, and track software campaign ROI.'],
    ['🏥', 'Healthcare & Life Sciences', 'Provide secure patient portal access and prescription information.']
  ],
  team: [
    ['💻', 'Developers & Engineers', 'Automate link creation with our robust REST API, webhooks, and SDKs.'],
    ['📢', 'Marketing & Growth', 'Optimize UTM campaigns across social, email, search, and SMS.'],
    ['🎧', 'Customer Support', 'Shorten troubleshooting docs and support ticket links for clean chat delivery.']
  ],
  business: [
    ['🏪', 'Small Business', 'Free and accessible tools to establish an impactful digital presence.'],
    ['🏢', 'Midmarket Growth', 'Custom domains, team accounts, and extended analytics history.'],
    ['🏙️', 'Enterprise Scale', 'Dedicated infrastructure, custom SLAs, 99.99% uptime, and SOC2 compliance.']
  ]
};

function renderSolutionsPage(tab = 'industry') {
  const container = $('#solCards');
  if (!container) return;
  const cards = ALL_SOLUTIONS[tab] || ALL_SOLUTIONS.industry;
  container.innerHTML = cards.map(c => `
    <div class="card pad">
      <div style="font-size:32px;margin-bottom:12px">${c[0]}</div>
      <h3>${c[1]}</h3>
      <p class="muted" style="font-size:14px;margin-top:8px;line-height:1.6">${c[2]}</p>
      <div style="margin-top:16px"><a class="btn ghost sm" href="#signup">Learn more →</a></div>
    </div>
  `).join('');
}

$$('#solPageTabs button').forEach(b => {
  b.onclick = () => {
    $$('#solPageTabs button').forEach(x => x.classList.toggle('on', x === b));
    renderSolutionsPage(b.dataset.sol);
  };
});

// UTM Builder Engine
function updateUtm() {
  const base = ($('#utmUrl').value || '').trim();
  const source = ($('#utmSource').value || '').trim();
  const medium = ($('#utmMedium').value || '').trim();
  const camp = ($('#utmCampaign').value || '').trim();
  const term = ($('#utmTerm').value || '').trim();

  if (!base) {
    $('#utmResult').value = '';
    return;
  }

  try {
    const url = new URL(normalize(base) || base);
    if (source) url.searchParams.set('utm_source', source);
    if (medium) url.searchParams.set('utm_medium', medium);
    if (camp) url.searchParams.set('utm_campaign', camp);
    if (term) url.searchParams.set('utm_term', term);
    $('#utmResult').value = url.href;
  } catch (e) {
    $('#utmResult').value = base;
  }
}

['utmUrl', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm'].forEach(id => {
  $('#' + id)?.addEventListener('input', updateUtm);
});

$('#utmCopyBtn').onclick = () => {
  const val = $('#utmResult').value;
  if (!val) { toast('Build a UTM link first'); return; }
  copy(val);
};

$('#utmShortenBtn').onclick = () => {
  const val = $('#utmResult').value;
  if (!val) { toast('Build a UTM link first'); return; }
  location.hash = '#home';
  setTimeout(() => {
    $('#heroUrl').value = val;
    $('#heroForm').dispatchEvent(new Event('submit'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
};

// Integrations Hub
const INTEGRATIONS_LIST = [
  ['🛍️', 'Shopify', 'Sync your online product catalogue and generate branded short links for SMS flash sales.'],
  ['🎨', 'Canva', 'Design social flyers, brochures, and export high-res HEA QR codes directly within Canva.'],
  ['🟠', 'HubSpot', 'Attach UTM click metrics directly to HubSpot customer contact timelines.'],
  ['💬', 'Slack', 'Shorten links inside Slack channels and get real-time click milestone alerts.'],
  ['⚡', 'Zapier', 'Connect HEA Link to 5,000+ business applications with zero code.'],
  ['⚙️', 'REST API & Webhooks', 'Full programmatic access for automated enterprise link generation.']
];

function renderIntegrationsPage() {
  $('#integrationsGrid').innerHTML = INTEGRATIONS_LIST.map(item => `
    <div class="card pad">
      <div style="font-size:36px;margin-bottom:12px">${item[0]}</div>
      <h3>${item[1]}</h3>
      <p class="muted" style="font-size:14px;margin-top:8px;line-height:1.6">${item[2]}</p>
      <div style="margin-top:16px"><button type="button" class="btn ghost sm" onclick="toast('Connected with ${item[1]}!')">Connect App</button></div>
    </div>
  `).join('');
}

/* =========================================================
   ACCESSIBILITY ENGINE
   ========================================================= */

const A11Y_PREFS = store.get('hea_a11y', {});

function applyA11y() {
  document.documentElement.classList.toggle('big', !!A11Y_PREFS.big);
  document.body.classList.toggle('hc', !!A11Y_PREFS.hc);
  document.body.classList.toggle('mo', !!A11Y_PREFS.mo);
  $('#aBig').checked = !!A11Y_PREFS.big;
  $('#aHc').checked = !!A11Y_PREFS.hc;
  $('#aMo').checked = !!A11Y_PREFS.mo;
}

$('#a11yBtn').onclick = e => {
  e.stopPropagation();
  const panel = $('#a11yPanel');
  panel.hidden = !panel.hidden;
  $('#a11yBtn').setAttribute('aria-expanded', !panel.hidden);
};

[['aBig', 'big'], ['aHc', 'hc'], ['aMo', 'mo']].forEach(([id, key]) => {
  $('#' + id).onchange = e => {
    A11Y_PREFS[key] = e.target.checked;
    store.set('hea_a11y', A11Y_PREFS);
    applyA11y();
  };
});
applyA11y();

/* =========================================================
   CLIENT-SIDE ROUTER ENGINE
   ========================================================= */

function show(pageName) {
  $$('section[data-page]').forEach(sec => {
    sec.hidden = sec.dataset.page !== pageName;
  });
  $('.nav')?.classList.remove('open');
}

function route() {
  const rawHash = location.hash.slice(1) || 'home';
  const page = rawHash.split('?')[0];

  if (rawHash.startsWith('go-')) {
    return goPage(rawHash.slice(3));
  }
  if (rawHash.startsWith('bio-')) {
    return bioPage(rawHash.slice(4));
  }

  if (page === 'assist') {
    show('assist');
    initChat();
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'resources') {
    show('resources');
    renderResources();
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'solutions') {
    show('solutions');
    renderSolutionsPage('industry');
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'utm') {
    show('utm');
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'integrations') {
    show('integrations');
    renderIntegrationsPage();
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'pages') {
    if (!session) {
      location.hash = '#login';
      toast('Please log in to manage your Bio Page');
      return;
    }
    show('pages');
    initBio();
    window.scrollTo(0, 0);
    return;
  }
  if (['pricing', 'faq', 'features', 'ai'].includes(page)) {
    show('home');
    setTimeout(() => {
      const el = $('#' + page);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return;
  }
  if (page === 'login' || page === 'signup') {
    if (session) {
      location.hash = '#dashboard';
      return;
    }
    show('auth');
    showAuth(page);
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'dashboard' || page === 'analytics') {
    if (!session) {
      location.hash = '#login';
      toast('Please log in to view your dashboard');
      return;
    }
    show(page);
    page === 'dashboard' ? renderDash() : renderAnalytics();
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'qr') {
    show('qr');
    renderQrPage();
    window.scrollTo(0, 0);
    return;
  }

  show('home');
  window.scrollTo(0, 0);
}

// Global Initialization
window.addEventListener('hashchange', route);
initNav();
renderNavRight();
initStaticSections();
route();
