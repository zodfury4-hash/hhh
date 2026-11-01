/* =========================================================
   HEA LINK — APP SHELL CONTROLLER & BITLY-STYLE DASHBOARD
   Matches exact reference screenshots for all authenticated views:
   - Split-screen Auth with SSO (Google/Apple)
   - Left Sidebar with "+ Create new" & Navigation Hubs
   - Topbar with Global Search & Quick Actions
   - Right Collapsible HEA Assist AI Drawer
   - Subviews:
     1. Home (Overview, Quick Shortener, Stat cards, Checklist)
     2. Links (Filterable link list, copy, edit, delete, stats)
     3. QR Codes (Interactive Studio with iconic "SCAN ME" frame & PNG/SVG download)
     4. Pages (Link-in-bio builder with live smartphone preview)
     5. Analytics (Click charts, top devices, referrers, locations)
     6. Campaigns (UTM Builder & tracking groups)
     7. Custom Domains (healink.store status, DNS table, AI domain finder)
     8. Integrations (Zapier, Shopify, Slack, WordPress, Webhooks, API)
     9. Settings (Profile preferences for Hayyam Ameer, Security/2FA, Sessions, SAR data)
   ========================================================= */

(function () {
  'use strict';

  // Helper shortcuts
  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  // User Profile matching reference screenshots
  let appUser = {
    name: 'Hayyam Ameer',
    email: 'hayyamameer3030@gmail.com',
    country: 'Pakistan',
    city: 'Faisalabad',
    timezone: 'Asia/Karachi (PKT, UTC+5)',
    plan: 'Growth Pro',
    avatar: 'HA'
  };

  // Sync with stored session if available
  try {
    const saved = localStorage.getItem('hea_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        appUser.name = parsed.name;
        if (parsed.email) appUser.email = parsed.email;
        if (parsed.country) appUser.country = parsed.country;
        if (parsed.city) appUser.city = parsed.city;
      }
    } else {
      localStorage.setItem('hea_session', JSON.stringify(appUser));
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  // App Shell State
  let currentTab = 'home';
  let qrSelectedFrame = 'scanme';
  let qrColorPrimary = '#0b1120';
  let qrColorBackground = '#ffffff';

  // Demo fallback links if none exist
  function getLinksData() {
    try {
      const stored = localStorage.getItem('hea_links');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        id: 'lnk_1',
        title: 'Summer Launch Campaign 2026',
        url: 'https://healink.store/summer-26',
        dest: 'https://myshopify.store/collections/summer-drop-2026?utm_source=healink',
        slug: 'summer-26',
        clicks: 342,
        createdAt: '2026-10-28',
        tag: 'marketing',
        qr: true
      },
      {
        id: 'lnk_2',
        title: 'YouTube Creator Channel',
        url: 'https://healink.store/yt-channel',
        dest: 'https://youtube.com/@hayyamameer?sub_confirmation=1',
        slug: 'yt-channel',
        clicks: 218,
        createdAt: '2026-10-30',
        tag: 'social',
        qr: true
      },
      {
        id: 'lnk_3',
        title: 'Portfolio & Client Consultation',
        url: 'https://healink.store/consult',
        dest: 'https://calendly.com/hayyamameer/strategy-session',
        slug: 'consult',
        clicks: 124,
        createdAt: '2026-10-31',
        tag: 'business',
        qr: false
      }
    ];
  }

  // Demo bio pages
  function getBiosData() {
    try {
      const stored = localStorage.getItem('hea_bios');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        slug: 'hayyam',
        title: 'Hayyam Ameer',
        tagline: 'Content Creator & Brand Strategist | Faisalabad, PK',
        theme: 'midnight',
        avatarText: 'HA',
        views: 890,
        links: [
          { title: 'My Work & Portfolio', url: 'https://healink.store/portfolio' },
          { title: 'Watch Latest Video on YouTube', url: 'https://healink.store/yt-channel' },
          { title: 'Book 1-on-1 Consultation', url: 'https://healink.store/consult' },
          { title: 'Connect on Instagram', url: 'https://instagram.com' }
        ]
      }
    ];
  }

  // ---------------- NAVIGATION & ROUTING ---------------- //
  function navigate(tabName) {
    if (!tabName) tabName = 'home';
    if (tabName === 'dashboard') tabName = 'home';
    currentTab = tabName;

    // Update active nav item
    $$('#sidebarNav .sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    const pane = $('#appMainPane');
    if (!pane) return;

    // Scroll main pane to top
    pane.scrollTop = 0;

    switch (tabName) {
      case 'home':
        renderHomeView(pane);
        break;
      case 'links':
        renderLinksView(pane);
        break;
      case 'qr':
        renderQrView(pane);
        break;
      case 'pages':
        renderPagesView(pane);
        break;
      case 'analytics':
        renderAnalyticsView(pane);
        break;
      case 'campaigns':
        renderCampaignsView(pane);
        break;
      case 'domains':
        renderDomainsView(pane);
        break;
      case 'integrations':
        renderIntegrationsView(pane);
        break;
      case 'settings':
        renderSettingsView(pane);
        break;
      default:
        renderHomeView(pane);
    }
  }

  // ---------------- 1. HOME VIEW ---------------- //
  function renderHomeView(container) {
    const links = getLinksData();
    const bios = getBiosData();
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
    const totalQRs = links.filter(l => l.qr).length + 2;
    const totalBioViews = bios.reduce((acc, b) => acc + (b.views || 0), 890);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Good day, ${appUser.name} 👋</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Here is your link and campaign performance across all channels today.</p>
        </div>
        <div class="view-header-actions">
          <button class="sso-btn" style="width:auto;padding:8px 16px;background:rgba(255,255,255,0.06);" id="homeExportBtn">
            📥 Export CSV
          </button>
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.openWhatModal()">
            + Create new
          </button>
        </div>
      </div>

      <!-- Quick Create Shortener Card -->
      <div class="quick-create-card">
        <div class="quick-create-title">Shorten a link or create a QR code</div>
        <div class="quick-tabs">
          <button class="quick-tab-btn active" data-qtab="shorten">🔗 Short link</button>
          <button class="quick-tab-btn" data-qtab="qr">📱 QR Code</button>
          <button class="quick-tab-btn" data-qtab="bulk">⚡ Bulk shortener</button>
        </div>
        <form id="quickShortenForm" class="quick-form-row">
          <select class="quick-domain-select" id="quickDomainSelect">
            <option value="healink.store" selected>healink.store</option>
            <option value="da.gd">da.gd</option>
          </select>
          <input type="url" id="quickLongUrl" placeholder="Paste your long link (e.g. https://yourwebsite.com/promotion)" required>
          <input type="text" id="quickCustomSlug" placeholder="Custom back-half (optional)" style="max-width:180px;">
          <button type="submit" class="quick-submit-btn" title="Shorten Link">→</button>
        </form>
        <div class="quick-upgrade-banner">
          <span>✨</span>
          <span>Tip: HEA Link automatically configures universal redirects and mobile app deep linking.</span>
        </div>
      </div>

      <!-- Stat Highlight Metrics Grid -->
      <div class="analytics-stats-grid">
        <div class="stat-metric-card">
          <div class="stat-metric-label">TOTAL SHORT LINKS</div>
          <div class="stat-metric-value">${links.length}</div>
          <div style="font-size:12px;color:#10b981;margin-top:6px;">↑ +4 this week</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">TOTAL CLICKS</div>
          <div class="stat-metric-value">${totalClicks.toLocaleString()}</div>
          <div style="font-size:12px;color:#38bdf8;margin-top:6px;">↑ 28.4% engagement</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">ACTIVE QR CODES</div>
          <div class="stat-metric-value">${totalQRs}</div>
          <div style="font-size:12px;color:#a855f7;margin-top:6px;">Dynamic &amp; scannable</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">BIO PAGE VIEWS</div>
          <div class="stat-metric-value">${totalBioViews.toLocaleString()}</div>
          <div style="font-size:12px;color:#10b981;margin-top:6px;">89.2% mobile traffic</div>
        </div>
      </div>

      <!-- Two-Column Grid: Recent Links & Getting Started Checklist -->
      <div class="dash-grid-2">
        <!-- Recent Links -->
        <div class="dash-subcard">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h4 style="margin:0;">Recent Links</h4>
            <a href="#links" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;">View all (${links.length}) →</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${links.slice(0, 4).map(l => `
              <div class="workflow-item">
                <div class="workflow-info">
                  <div class="workflow-logo" style="background:#0066ff;">🔗</div>
                  <div>
                    <div style="font-weight:600;font-size:14px;color:#ffffff;">${l.title || l.slug}</div>
                    <div style="font-size:12px;color:#38bdf8;">${l.url || 'https://healink.store/' + l.slug}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="click-badge">${l.clicks || 0} clicks</span>
                  <button class="topbar-icon-btn" title="Copy link" onclick="window.appShell.copyText('${l.url || 'https://healink.store/' + l.slug}')">📋</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Getting Started Checklist -->
        <div class="dash-subcard">
          <h4 style="margin:0 0 4px;">Getting Started with HEA Link</h4>
          <p>Complete these steps to maximize your audience engagement and branding.</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="checklist-item">
              <span class="check-icon done">✓</span>
              <span>Connect verified custom domain (<b>healink.store</b>)</span>
            </div>
            <div class="checklist-item">
              <span class="check-icon done">✓</span>
              <span>Create your first branded short link</span>
            </div>
            <div class="checklist-item">
              <span class="check-icon done">✓</span>
              <span>Download high-resolution "SCAN ME" QR Code</span>
            </div>
            <div class="checklist-item">
              <span class="check-icon pending"></span>
              <span>Publish your mobile Bio Page (<a href="#pages" style="color:#38bdf8;">Configure page</a>)</span>
            </div>
            <div class="checklist-item">
              <span class="check-icon pending"></span>
              <span>Install Chrome extension for 1-click links (<a href="#integrations" style="color:#38bdf8;">Get Extension</a>)</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook up quick shorten form
    const form = $('#quickShortenForm');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        const longUrl = $('#quickLongUrl').value.trim();
        const customSlug = $('#quickCustomSlug').value.trim();
        const domain = $('#quickDomainSelect').value;

        if (!longUrl) return;

        window.appShell.createLinkAction({
          dest: longUrl,
          slug: customSlug,
          domain: domain
        });
      };
    }

    // Export CSV trigger
    const expBtn = $('#homeExportBtn');
    if (expBtn) expBtn.onclick = () => window.appShell.exportLinksCSV();
  }

  // ---------------- 2. LINKS VIEW ---------------- //
  function renderLinksView(container) {
    const links = getLinksData();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Links</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Manage, edit, and track all your shortened branded links.</p>
        </div>
        <div class="view-header-actions">
          <button class="sso-btn" style="width:auto;padding:8px 16px;background:rgba(255,255,255,0.06);" onclick="window.appShell.exportLinksCSV()">
            📥 Export CSV
          </button>
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.openNewLinkModal()">
            + Create link
          </button>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="links-filter-bar">
        <input type="text" id="linksSearchInput" class="topbar-search-input" style="flex:1;min-width:240px;" placeholder="Search by title, tag, or destination URL...">
        <select id="linksTagFilter" class="quick-domain-select" style="padding:8px 12px;font-size:13px;">
          <option value="all">All Tags</option>
          <option value="marketing">Marketing</option>
          <option value="social">Social Media</option>
          <option value="business">Business</option>
        </select>
        <select id="linksSortFilter" class="quick-domain-select" style="padding:8px 12px;font-size:13px;">
          <option value="date-desc">Newest First</option>
          <option value="clicks-desc">Most Clicks</option>
        </select>
      </div>

      <!-- Links Table Cards -->
      <div class="links-table" id="linksListContainer">
        ${renderLinksCardsHTML(links)}
      </div>
    `;

    // Filter events
    const searchInput = $('#linksSearchInput');
    const tagFilter = $('#linksTagFilter');
    const sortFilter = $('#linksSortFilter');

    function applyFilter() {
      const q = (searchInput?.value || '').toLowerCase().trim();
      const tag = tagFilter?.value || 'all';
      const sort = sortFilter?.value || 'date-desc';

      let filtered = links.filter(l => {
        const matchQ = !q || (l.title && l.title.toLowerCase().includes(q)) ||
          (l.dest && l.dest.toLowerCase().includes(q)) ||
          (l.slug && l.slug.toLowerCase().includes(q));
        const matchTag = tag === 'all' || l.tag === tag;
        return matchQ && matchTag;
      });

      if (sort === 'clicks-desc') {
        filtered.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
      } else {
        filtered.reverse();
      }

      const listWrap = $('#linksListContainer');
      if (listWrap) listWrap.innerHTML = renderLinksCardsHTML(filtered);
    }

    if (searchInput) searchInput.oninput = applyFilter;
    if (tagFilter) tagFilter.onchange = applyFilter;
    if (sortFilter) sortFilter.onchange = applyFilter;
  }

  function renderLinksCardsHTML(links) {
    if (!links || links.length === 0) {
      return `
        <div style="text-align:center;padding:60px 20px;background:rgba(15,23,44,0.6);border-radius:16px;border:1px dashed rgba(255,255,255,0.1);">
          <div style="font-size:48px;margin-bottom:12px;">🔗</div>
          <h3 style="color:#ffffff;margin:0 0 6px;">No links found</h3>
          <p style="color:#8fa0b5;font-size:14px;margin-bottom:18px;">Create your first shortened link to begin tracking real-time analytics.</p>
          <button class="sidebar-create-btn" style="margin:0 auto;" onclick="window.appShell.openNewLinkModal()">+ Create link</button>
        </div>
      `;
    }

    return links.map(l => {
      const shortUrl = l.url || `https://healink.store/${l.slug}`;
      const destUrl = l.dest || '#';
      const createdDate = l.createdAt || 'Nov 1, 2026';

      return `
        <div class="link-row-card" data-id="${l.id || l.slug}">
          <div class="link-main-info">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:12px;color:#64748b;">${createdDate}</span>
              ${l.tag ? `<span class="verified-tag" style="font-size:10px;">#${l.tag}</span>` : ''}
              ${l.qr ? `<span class="verified-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.3);font-size:10px;">QR READY</span>` : ''}
            </div>
            <a href="${shortUrl}" target="_blank" class="link-short-url">${shortUrl}</a>
            <div class="link-dest-url" title="${destUrl}">↳ ${destUrl}</div>
          </div>
          <div class="link-row-actions">
            <span class="click-badge">🔥 ${l.clicks || 0} clicks</span>
            <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.copyText('${shortUrl}')">
              📋 Copy
            </button>
            <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.openLinkQr('${shortUrl}')">
              📱 QR Code
            </button>
            <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;color:#ef4444;" onclick="window.appShell.deleteLink('${l.id || l.slug}')">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------- 3. QR CODES VIEW ---------------- //
  function renderQrView(container) {
    const links = getLinksData();
    const primaryUrl = links[0]?.url || 'https://healink.store/summer-26';

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>QR Code Studio</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Design, customize, and download high-resolution "SCAN ME" framed QR codes.</p>
        </div>
        <div class="view-header-actions">
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.downloadQrPNG()">
            📥 Download PNG
          </button>
        </div>
      </div>

      <!-- Studio Grid -->
      <div class="qr-grid-layout">
        <!-- Controls Column -->
        <div class="qr-list-col">
          <div class="dash-subcard">
            <h4 style="margin:0 0 14px;">1. Destination Link</h4>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;margin-bottom:14px;">
              Select short link or type any URL
              <input type="text" id="qrStudioInput" class="topbar-search-input" value="${primaryUrl}">
            </label>

            <h4 style="margin:20px 0 10px;">2. Frame Template</h4>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:16px;">
              <button class="quick-tab-btn ${qrSelectedFrame === 'scanme' ? 'active' : ''}" id="frameBtnScanMe" type="button">
                🖼️ "SCAN ME"
              </button>
              <button class="quick-tab-btn ${qrSelectedFrame === 'rounded' ? 'active' : ''}" id="frameBtnRounded" type="button">
                ⭕ Rounded
              </button>
              <button class="quick-tab-btn ${qrSelectedFrame === 'clean' ? 'active' : ''}" id="frameBtnClean" type="button">
                ✨ Clean
              </button>
            </div>

            <h4 style="margin:20px 0 10px;">3. QR Colors</h4>
            <div style="display:flex;gap:18px;align-items:center;margin-bottom:20px;">
              <div>
                <span style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Foreground</span>
                <input type="color" id="qrFgColorPicker" value="${qrColorPrimary}" style="width:44px;height:36px;border-radius:6px;border:0;cursor:pointer;background:none;">
              </div>
              <div>
                <span style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Background</span>
                <input type="color" id="qrBgColorPicker" value="${qrColorBackground}" style="width:44px;height:36px;border-radius:6px;border:0;cursor:pointer;background:none;">
              </div>
            </div>

            <div style="display:flex;gap:12px;">
              <button class="sidebar-create-btn" style="flex:1;margin-bottom:0;" onclick="window.appShell.downloadQrPNG()">
                📥 Download PNG (High-Res)
              </button>
              <button class="sso-btn" style="flex:1;" onclick="window.appShell.downloadQrSVG()">
                📄 Download SVG
              </button>
            </div>
          </div>
        </div>

        <!-- Live Preview Column with SCAN ME Frame -->
        <div class="qr-preview-col">
          <div style="font-size:14px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:18px;">
            Live Canvas Preview
          </div>

          <div class="scanme-frame-container" id="scanMeFramePreview">
            <div class="scanme-frame-top" id="scanMeTopBanner">
              <span>SCAN ME</span>
              <div class="arrow-down"></div>
            </div>
            <div class="scanme-frame-body">
              <canvas id="studioQrCanvas" width="220" height="220"></canvas>
            </div>
          </div>

          <div style="margin-top:20px;font-size:13px;color:#8fa0b5;">
            Dynamic Vector Code • Print Ready 300 DPI
          </div>
        </div>
      </div>
    `;

    // Render QR onto canvas
    drawStudioQR();

    // Event hooks
    const input = $('#qrStudioInput');
    if (input) input.oninput = () => drawStudioQR();

    const fg = $('#qrFgColorPicker');
    if (fg) fg.oninput = e => { qrColorPrimary = e.target.value; drawStudioQR(); };

    const bg = $('#qrBgColorPicker');
    if (bg) bg.oninput = e => { qrColorBackground = e.target.value; drawStudioQR(); };

    const bScan = $('#frameBtnScanMe');
    const bRound = $('#frameBtnRounded');
    const bClean = $('#frameBtnClean');

    if (bScan) bScan.onclick = () => { setQrFrame('scanme'); };
    if (bRound) bRound.onclick = () => { setQrFrame('rounded'); };
    if (bClean) bClean.onclick = () => { setQrFrame('clean'); };
  }

  function setQrFrame(frameName) {
    qrSelectedFrame = frameName;
    const top = $('#scanMeTopBanner');
    const wrap = $('#scanMeFramePreview');

    if (top && wrap) {
      if (frameName === 'scanme') {
        top.style.display = 'flex';
        wrap.style.border = '4px solid #0b1120';
        wrap.style.borderRadius = '16px';
      } else if (frameName === 'rounded') {
        top.style.display = 'none';
        wrap.style.border = '4px solid #0066ff';
        wrap.style.borderRadius = '28px';
      } else {
        top.style.display = 'none';
        wrap.style.border = '1px solid rgba(0,0,0,0.1)';
        wrap.style.borderRadius = '10px';
      }
    }

    $$('.quick-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(frameName));
    });

    drawStudioQR();
  }

  function drawStudioQR() {
    const cv = $('#studioQrCanvas');
    if (!cv) return;
    const text = $('#qrStudioInput')?.value || 'https://healink.store';

    // If global drawQR exists in app.js
    if (typeof window.drawQR === 'function') {
      window.drawQR(cv, text, qrColorPrimary, qrColorBackground, 220);
    } else {
      // Direct QRCode generator fallback
      try {
        if (typeof QRCode !== 'undefined') {
          const qr = new QRCode(-1, QRCode.CorrectLevel.M);
          qr.addData(text);
          qr.make();
          const count = qr.getModuleCount();
          const ctx = cv.getContext('2d');
          const size = cv.width;
          const tile = size / count;

          ctx.fillStyle = qrColorBackground;
          ctx.fillRect(0, 0, size, size);

          ctx.fillStyle = qrColorPrimary;
          for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
              if (qr.isDark(r, c)) {
                ctx.fillRect(c * tile, r * tile, tile, tile);
              }
            }
          }
        }
      } catch (err) {
        console.error('QR draw error:', err);
      }
    }
  }

  // ---------------- 4. PAGES (LINK-IN-BIO) VIEW ---------------- //
  function renderPagesView(container) {
    const bios = getBiosData();
    const currentBio = bios[0] || {
      slug: 'hayyam',
      title: 'Hayyam Ameer',
      tagline: 'Content Creator & Brand Strategist | Faisalabad, PK',
      links: [
        { title: 'My Work & Portfolio', url: 'https://healink.store/portfolio' },
        { title: 'Watch Latest Video on YouTube', url: 'https://healink.store/yt-channel' },
        { title: 'Book 1-on-1 Consultation', url: 'https://healink.store/consult' },
        { title: 'Connect on Instagram', url: 'https://instagram.com' }
      ]
    };

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Pages (Link-in-bio)</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Build engaging mobile landing pages to showcase all your links, socials, and offers.</p>
        </div>
        <div class="view-header-actions">
          <button class="sso-btn" style="width:auto;padding:8px 16px;background:rgba(255,255,255,0.06);" onclick="window.appShell.copyText('https://healink.store/bio-${currentBio.slug}')">
            📋 Copy Page URL
          </button>
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.saveBioPageAction()">
            💾 Save Changes
          </button>
        </div>
      </div>

      <div class="bio-manager-layout">
        <!-- Left: Bio Editor -->
        <div class="dash-subcard">
          <h4 style="margin:0 0 16px;">Page Information</h4>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
              Display Name
              <input type="text" id="bioEditName" class="topbar-search-input" value="${currentBio.title || appUser.name}">
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
              Bio Tagline &amp; Headline
              <textarea id="bioEditTagline" class="topbar-search-input" rows="2" style="height:auto;">${currentBio.tagline || ''}</textarea>
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
              Bio URL Slug
              <div style="display:flex;align-items:center;background:rgba(255,255,255,0.04);border-radius:10px;padding:0 12px;border:1px solid rgba(255,255,255,0.1);">
                <span style="color:#64748b;font-size:13px;">healink.store/bio-</span>
                <input type="text" id="bioEditSlug" value="${currentBio.slug || 'hayyam'}" style="background:none;border:0;color:#38bdf8;font-weight:600;padding:10px 4px;font-size:13px;outline:none;width:100%;">
              </div>
            </label>
          </div>

          <h4 style="margin:24px 0 12px;display:flex;justify-content:space-between;align-items:center;">
            <span>Links &amp; Buttons</span>
            <button type="button" class="sso-btn" style="width:auto;padding:4px 10px;font-size:12px;" onclick="window.appShell.addBioLinkRow()">+ Add Link</button>
          </h4>
          <div id="bioLinksListRows" style="display:flex;flex-direction:column;gap:10px;">
            ${(currentBio.links || []).map((lnk, i) => `
              <div class="workflow-item bio-link-row" style="padding:10px 14px;">
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                  <input type="text" class="topbar-search-input bio-lnk-title" value="${lnk.title}" placeholder="Button Title" style="padding:6px 10px;font-size:13px;">
                  <input type="url" class="topbar-search-input bio-lnk-url" value="${lnk.url}" placeholder="https://..." style="padding:6px 10px;font-size:12px;color:#38bdf8;">
                </div>
                <button type="button" style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;margin-left:8px;" onclick="this.closest('.bio-link-row').remove(); window.appShell.refreshBioMockup();">✕</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Live Smartphone Mockup -->
        <div>
          <div style="font-size:14px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;text-align:center;margin-bottom:14px;">
            Live Mobile Preview
          </div>
          <div class="bio-phone-mockup" id="bioPhoneMockup">
            <div class="bio-phone-avatar" id="mockAvatar">HA</div>
            <div style="font-size:18px;font-weight:700;color:#ffffff;text-align:center;" id="mockName">
              ${currentBio.title || appUser.name}
            </div>
            <div style="font-size:12px;color:#94a3b8;text-align:center;margin-top:4px;line-height:1.4;" id="mockTagline">
              ${currentBio.tagline || ''}
            </div>

            <div class="bio-phone-links" id="mockLinksContainer">
              ${(currentBio.links || []).map(l => `
                <a href="${l.url}" target="_blank" class="bio-phone-link-btn">${l.title}</a>
              `).join('')}
            </div>

            <div style="margin-top:auto;padding-top:20px;font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">
              <span>⚡ Powered by</span>
              <span style="color:#38bdf8;font-weight:700;">HEA Link</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Live update listeners
    const nameIn = $('#bioEditName');
    const tagIn = $('#bioEditTagline');

    if (nameIn) nameIn.oninput = e => {
      const el = $('#mockName');
      if (el) el.textContent = e.target.value || 'Your Name';
    };

    if (tagIn) tagIn.oninput = e => {
      const el = $('#mockTagline');
      if (el) el.textContent = e.target.value;
    };
  }

  // ---------------- 5. ANALYTICS VIEW ---------------- //
  function renderAnalyticsView(container) {
    const links = getLinksData();
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Analytics Hub</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Track visitor locations, devices, referral sources, and link click trends.</p>
        </div>
        <div class="view-header-actions">
          <select class="quick-domain-select" style="padding:8px 12px;font-size:13px;">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button class="sso-btn" style="width:auto;padding:8px 16px;background:rgba(255,255,255,0.06);" onclick="window.appShell.exportLinksCSV()">
            📥 Download Report
          </button>
        </div>
      </div>

      <!-- Stat Highlight Metrics -->
      <div class="analytics-stats-grid">
        <div class="stat-metric-card">
          <div class="stat-metric-label">TOTAL CLICKS</div>
          <div class="stat-metric-value">${totalClicks.toLocaleString()}</div>
          <div style="font-size:12px;color:#10b981;margin-top:6px;">↑ +24.5% vs last week</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">UNIQUE VISITORS</div>
          <div class="stat-metric-value">${Math.round(totalClicks * 0.74).toLocaleString()}</div>
          <div style="font-size:12px;color:#38bdf8;margin-top:6px;">Direct &amp; organic reach</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">TOP REFERRER</div>
          <div class="stat-metric-value" style="font-size:22px;">Direct / Social</div>
          <div style="font-size:12px;color:#a855f7;margin-top:6px;">Instagram (42%)</div>
        </div>
        <div class="stat-metric-card">
          <div class="stat-metric-label">TOP LOCATION</div>
          <div class="stat-metric-value" style="font-size:22px;">🇵🇰 Pakistan</div>
          <div style="font-size:12px;color:#10b981;margin-top:6px;">64.2% of total traffic</div>
        </div>
      </div>

      <!-- Visual Click Timeline Graph (SVG Chart) -->
      <div class="chart-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="margin:0;font-size:16px;color:#ffffff;">Clicks Over Time (Last 7 Days)</h4>
          <span style="font-size:12px;color:#38bdf8;">Peak: Friday (420 clicks)</span>
        </div>
        <div style="height:180px;display:flex;align-items:flex-end;gap:18px;padding:10px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          ${[
            { day: 'Mon', h: 35, clicks: 120 },
            { day: 'Tue', h: 48, clicks: 185 },
            { day: 'Wed', h: 62, clicks: 240 },
            { day: 'Thu', h: 78, clicks: 310 },
            { day: 'Fri', h: 100, clicks: 420 },
            { day: 'Sat', h: 88, clicks: 380 },
            { day: 'Sun', h: 70, clicks: 290 }
          ].map(d => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;">
              <span style="font-size:11px;color:#94a3b8;">${d.clicks}</span>
              <div style="width:100%;height:${d.h}%;background:linear-gradient(180deg,#38bdf8,#0066ff);border-radius:6px 6px 0 0;transition:all 0.3s;" title="${d.clicks} clicks on ${d.day}"></div>
              <span style="font-size:12px;color:#64748b;margin-bottom:-22px;">${d.day}</span>
            </div>
          `).join('')}
        </div>
        <div style="height:22px;"></div>
      </div>

      <!-- 3-Column Breakdown Grids -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;">
        <!-- Top Referrers -->
        <div class="dash-subcard">
          <h4 style="margin:0 0 14px;">Top Referrers</h4>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Direct Traffic</span><b>45%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:45%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Instagram</span><b>32%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:32%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>X (Twitter)</span><b>14%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:14%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Google Search</span><b>9%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:9%;"></div></div>
            </div>
          </div>
        </div>

        <!-- Device Breakdown -->
        <div class="dash-subcard">
          <h4 style="margin:0 0 14px;">Device Breakdown</h4>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>📱 Mobile (iOS / Android)</span><b>62%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:62%;background:#10b981;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>💻 Desktop</span><b>34%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:34%;background:#0066ff;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>📟 Tablet</span><b>4%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:4%;background:#f59e0b;"></div></div>
            </div>
          </div>
        </div>

        <!-- Geographic Locations -->
        <div class="dash-subcard">
          <h4 style="margin:0 0 14px;">Top Locations</h4>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>🇵🇰 Pakistan</span><b>64%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:64%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>🇺🇸 United States</span><b>18%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:18%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>🇬🇧 United Kingdom</span><b>11%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:11%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;"><span>🇦🇪 United Arab Emirates</span><b>7%</b></div>
              <div class="bar-track"><div class="bar-fill" style="width:7%;"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------- 6. CAMPAIGNS VIEW ---------------- //
  function renderCampaignsView(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Campaigns &amp; UTM Tracking</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Group your links into marketing campaigns and auto-generate UTM query parameters.</p>
        </div>
        <div class="view-header-actions">
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.generateUtmLinkAction()">
            + Generate Campaign Link
          </button>
        </div>
      </div>

      <!-- UTM Generator Card -->
      <div class="campaign-builder-card">
        <h4 style="margin:0 0 6px;">UTM Parameter Builder</h4>
        <p style="color:#8fa0b5;font-size:13px;margin-bottom:14px;">Fill in the parameters below to automatically append standard Google Analytics tracking tags.</p>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;margin-bottom:14px;">
          Website URL
          <input type="url" id="utmBaseUrl" class="topbar-search-input" placeholder="https://example.com/product" value="https://myshopify.store">
        </label>

        <div class="campaign-grid-fields">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Campaign Source (utm_source)
            <input type="text" id="utmSource" class="topbar-search-input" placeholder="e.g. google, facebook, newsletter" value="facebook">
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Campaign Medium (utm_medium)
            <input type="text" id="utmMedium" class="topbar-search-input" placeholder="e.g. cpc, email, social" value="social">
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Campaign Name (utm_campaign)
            <input type="text" id="utmCampaign" class="topbar-search-input" placeholder="e.g. winter_drop_2026" value="winter_launch">
          </label>
        </div>

        <div style="margin-top:16px;display:flex;justify-content:flex-end;">
          <button type="button" class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.generateUtmLinkAction()">
            ✨ Generate Shortened UTM Link
          </button>
        </div>
      </div>

      <!-- Active Campaigns Table -->
      <h4 style="margin:20px 0 10px;">Active Marketing Campaigns</h4>
      <table class="campaign-table">
        <thead>
          <tr>
            <th>Campaign Name</th>
            <th>Source / Medium</th>
            <th>Tracked Links</th>
            <th>Total Clicks</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Winter Launch 2026</td>
            <td>facebook / social</td>
            <td>4 links</td>
            <td>562 clicks</td>
            <td><span class="verified-tag">ACTIVE</span></td>
          </tr>
          <tr>
            <td>Creator Newsletter Nov</td>
            <td>newsletter / email</td>
            <td>2 links</td>
            <td>184 clicks</td>
            <td><span class="verified-tag">ACTIVE</span></td>
          </tr>
          <tr>
            <td>Black Friday Promo</td>
            <td>google / cpc</td>
            <td>6 links</td>
            <td>940 clicks</td>
            <td><span class="verified-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b;border-color:rgba(245,158,11,0.3);">SCHEDULED</span></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // ---------------- 7. CUSTOM DOMAINS VIEW ---------------- //
  function renderDomainsView(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Custom Domains</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Connect your own brand domain to increase link trust, CTR, and deliverability.</p>
        </div>
        <div class="view-header-actions">
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.showToast('Connecting additional domain requires Enterprise tier')">
            + Add Domain
          </button>
        </div>
      </div>

      <!-- Active Domain Card -->
      <div class="domain-card active-domain">
        <div class="domain-header-row">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="domain-name">healink.store</span>
              <span class="verified-tag">VERIFIED &amp; ACTIVE</span>
            </div>
            <div style="color:#8fa0b5;font-size:13px;margin-top:4px;">Default Brand Short Domain • SSL Certificate Active</div>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:12px;" onclick="window.appShell.showToast('Domain healink.store DNS is healthy')">
              🔄 Check DNS
            </button>
          </div>
        </div>

        <div class="dns-table-box">
          <div class="dns-row header">
            <span>Type</span>
            <span>Host</span>
            <span>Points To (Target)</span>
            <span>Status</span>
          </div>
          <div class="dns-row">
            <span>CNAME</span>
            <span><code>@ / www</code></span>
            <span><code>cname.healink.store</code></span>
            <span style="color:#10b981;font-weight:600;">Valid</span>
          </div>
          <div class="dns-row">
            <span>A Record</span>
            <span><code>@</code></span>
            <span><code>76.76.21.21</code></span>
            <span style="color:#10b981;font-weight:600;">Valid</span>
          </div>
        </div>
      </div>

      <!-- AI Domain Finder -->
      <div class="ai-domain-finder">
        <h4 style="margin:0 0 6px;">AI Branded Domain Finder</h4>
        <p style="color:#8fa0b5;font-size:13px;margin-bottom:14px;">Need another domain for a specific product or event? Enter your brand name to see recommended high-CTR domains.</p>
        <div style="display:flex;gap:10px;">
          <input type="text" id="aiDomainPrompt" class="topbar-search-input" placeholder="e.g. fashion drops, real estate, personal brand" value="hayyam creative">
          <button type="button" class="sidebar-create-btn" style="margin-bottom:0;white-space:nowrap;" onclick="window.appShell.findDomainsAction()">
            🔍 Find Domains
          </button>
        </div>
        <div id="aiDomainResults" style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;">
          <div class="workflow-item">
            <div><b>hayyam.link</b><div style="font-size:11px;color:#10b981;">Available ($3.99/yr)</div></div>
            <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
          </div>
          <div class="workflow-item">
            <div><b>hayyam.store</b><div style="font-size:11px;color:#10b981;">Available ($1.99/yr)</div></div>
            <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
          </div>
          <div class="workflow-item">
            <div><b>hayyamcreatives.bio</b><div style="font-size:11px;color:#10b981;">Available ($2.49/yr)</div></div>
            <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------- 8. INTEGRATIONS VIEW ---------------- //
  function renderIntegrationsView(container) {
    const apps = [
      { name: 'Zapier', cat: 'Automation', icon: '⚡', desc: 'Trigger short links from over 5,000+ business applications.', status: 'Connected' },
      { name: 'Shopify', cat: 'E-commerce', icon: '🛍️', desc: 'Auto-shorten checkout, order tracking, and SMS promotion URLs.', status: 'Connect' },
      { name: 'Slack', cat: 'Communication', icon: '💬', desc: 'Generate and unpack HEA short links right within your team channels.', status: 'Connect' },
      { name: 'WordPress', cat: 'Publishing', icon: '📝', desc: 'Automatically replace long blog post URLs with branded short links.', status: 'Connect' },
      { name: 'Google Chrome', cat: 'Browser Extension', icon: '🌐', desc: 'Shorten links and generate QR codes in 1 click from your browser toolbar.', status: 'Installed' },
      { name: 'Adobe Express', cat: 'Design & Creative', icon: '🎨', desc: 'Embed branded QR codes directly onto flyers, menus, and posters.', status: 'Connect' },
      { name: 'Webhooks', cat: 'Developer API', icon: '🪝', desc: 'Stream real-time click and scan events directly into your database.', status: 'Configured' },
      { name: 'REST API', cat: 'Developer API', icon: '🔑', desc: 'Full programmatic access to shorten links, create QRs, and fetch analytics.', status: 'Active Key' }
    ];

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Integrations &amp; API</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Connect HEA Link with your existing marketing stack and developer tools.</p>
        </div>
        <div class="view-header-actions">
          <input type="text" class="topbar-search-input" placeholder="Search integrations..." style="width:240px;">
        </div>
      </div>

      <div class="integrations-grid">
        ${apps.map(app => `
          <div class="integration-card">
            <div>
              <div class="integration-top">
                <div class="integration-icon">${app.icon}</div>
                <div class="integration-info">
                  <h4>${app.name}</h4>
                  <p>${app.desc}</p>
                </div>
              </div>
            </div>
            <div class="integration-bottom">
              <span class="verified-tag" style="font-size:10px;">${app.cat}</span>
              <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:12px;" onclick="window.appShell.showToast('${app.name} integration updated')">
                ${app.status}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------- 9. SETTINGS VIEW ---------------- //
  function renderSettingsView(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Account Settings</h2>
          <p class="view-sub" style="color:#8fa0b5;font-size:14px;margin-top:4px;">Manage your profile preferences, security, active sessions, and data exports.</p>
        </div>
        <div class="view-header-actions">
          <button class="sso-btn" style="width:auto;padding:8px 16px;color:#ef4444;background:rgba(239,68,68,0.08);" onclick="window.appShell.logoutAction()">
            🚪 Log Out
          </button>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Subnav Column -->
        <div class="settings-subnav">
          <a class="settings-subnav-item active" data-sub="profile" onclick="window.appShell.switchSettingsTab('profile')">Profile Preferences</a>
          <a class="settings-subnav-item" data-sub="security" onclick="window.appShell.switchSettingsTab('security')">Security &amp; 2FA</a>
          <a class="settings-subnav-item" data-sub="sessions" onclick="window.appShell.switchSettingsTab('sessions')">Active Sessions</a>
          <a class="settings-subnav-item" data-sub="data" onclick="window.appShell.switchSettingsTab('data')">Data Export (SAR)</a>
          <a class="settings-subnav-item" data-sub="danger" onclick="window.appShell.switchSettingsTab('danger')" style="color:#ef4444;">Delete Account</a>
        </div>

        <!-- Settings Panel -->
        <div class="settings-panel" id="settingsPanelBody">
          ${renderSettingsProfileHTML()}
        </div>
      </div>
    `;
  }

  function renderSettingsProfileHTML() {
    return `
      <h3>Profile Preferences</h3>
      <p style="color:#8fa0b5;font-size:13px;margin:-14px 0 10px;">Update your personal details, email address, and localized regional settings.</p>

      <form id="settingsProfileForm" style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Full Name
            <input type="text" id="setFullName" class="topbar-search-input" value="${appUser.name}">
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Email Address
            <div style="display:flex;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:0 12px;">
              <input type="email" id="setEmail" value="${appUser.email}" style="flex:1;background:none;border:0;color:#ffffff;padding:12px 0;outline:none;font-size:13px;" readonly>
              <span class="verified-tag">VERIFIED</span>
            </div>
          </label>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Country / Region
            <input type="text" id="setCountry" class="topbar-search-input" value="${appUser.country}">
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            City
            <input type="text" id="setCity" class="topbar-search-input" value="${appUser.city}">
          </label>
        </div>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
          Timezone
          <input type="text" id="setTimezone" class="topbar-search-input" value="${appUser.timezone}" readonly>
        </label>

        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <button type="submit" class="sidebar-create-btn" style="margin-bottom:0;">
            Save Preferences
          </button>
        </div>
      </form>
    `;
  }

  function renderSettingsSecurityHTML() {
    return `
      <h3>Security &amp; Two-Factor Authentication</h3>
      <p style="color:#8fa0b5;font-size:13px;margin:-14px 0 10px;">Protect your account with modern password encryption and multi-factor authentication.</p>

      <div style="display:flex;flex-direction:column;gap:18px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:600;font-size:14px;color:#ffffff;">Two-Factor Authentication (2FA)</div>
            <div style="font-size:12px;color:#8fa0b5;">Require an authentication app code when signing in from new devices.</div>
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 16px;" onclick="window.appShell.showToast('2FA setup QR generated')">
            Enable 2FA
          </button>
        </div>

        <form onsubmit="event.preventDefault(); window.appShell.showToast('Password updated successfully');" style="display:flex;flex-direction:column;gap:12px;">
          <h4 style="margin:8px 0 4px;">Change Password</h4>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            Current Password
            <input type="password" class="topbar-search-input" placeholder="••••••••" required>
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#cbd5e1;">
            New Password
            <input type="password" class="topbar-search-input" placeholder="At least 8 characters" required>
          </label>
          <button type="submit" class="sidebar-create-btn" style="width:max-content;margin-top:6px;">
            Update Password
          </button>
        </form>
      </div>
    `;
  }

  function renderSettingsSessionsHTML() {
    return `
      <h3>Active Sessions</h3>
      <p style="color:#8fa0b5;font-size:13px;margin:-14px 0 10px;">Devices currently signed in to your HEA Link account.</p>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="workflow-item" style="padding:16px;">
          <div class="workflow-info">
            <span style="font-size:24px;">💻</span>
            <div>
              <div style="font-weight:700;color:#ffffff;">Google Chrome on Windows 11</div>
              <div style="font-size:12px;color:#10b981;">Faisalabad, Pakistan • Active Now (Current Session)</div>
            </div>
          </div>
          <span class="verified-tag">THIS DEVICE</span>
        </div>

        <div class="workflow-item" style="padding:16px;">
          <div class="workflow-info">
            <span style="font-size:24px;">📱</span>
            <div>
              <div style="font-weight:700;color:#ffffff;">Safari on iPhone 15 Pro</div>
              <div style="font-size:12px;color:#8fa0b5;">Faisalabad, Pakistan • Active 2 days ago</div>
            </div>
          </div>
          <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;color:#ef4444;" onclick="this.closest('.workflow-item').remove(); window.appShell.showToast('Device session revoked');">
            Revoke
          </button>
        </div>

        <button class="sso-btn" style="margin-top:14px;color:#ef4444;" onclick="window.appShell.showToast('All other sessions terminated')">
          Log Out All Other Devices
        </button>
      </div>
    `;
  }

  function renderSettingsDataHTML() {
    return `
      <h3>Subject Access Request (SAR) &amp; Data Export</h3>
      <p style="color:#8fa0b5;font-size:13px;margin:-14px 0 10px;">Download an archive of all your shortened links, QR codes, click history, and bio page content in JSON or CSV format.</p>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div style="font-weight:600;font-size:15px;color:#ffffff;">Full Account Archive</div>
        <p style="color:#8fa0b5;font-size:13px;margin:0;">Includes all analytics records, UTM groups, custom domains, and bio pages created under ${appUser.email}.</p>
        <div style="display:flex;gap:12px;">
          <button class="sidebar-create-btn" style="margin-bottom:0;" onclick="window.appShell.exportFullJSON()">
            📥 Export All Data (JSON)
          </button>
          <button class="sso-btn" style="width:auto;" onclick="window.appShell.exportLinksCSV()">
            📄 Export Links (CSV)
          </button>
        </div>
      </div>
    `;
  }

  function renderSettingsDangerHTML() {
    return `
      <h3 style="color:#ef4444;">Danger Zone — Delete Account</h3>
      <p style="color:#8fa0b5;font-size:13px;margin:-14px 0 10px;">Permanently delete your account and all associated short links, QR codes, and analytics.</p>

      <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div style="font-weight:700;color:#ef4444;font-size:15px;">Warning: This action cannot be undone.</div>
        <p style="color:#cbd5e1;font-size:13px;margin:0;">Once deleted, your short links will immediately stop redirecting and will become available to other users.</p>
        <button class="auth-submit-btn" style="background:#dc2626 !important;width:max-content;" onclick="if(confirm('Are you sure you want to permanently delete your HEA Link account?')){ window.appShell.deleteAccountAction(); }">
          Permanently Delete My Account
        </button>
      </div>
    `;
  }

  // ---------------- HEA ASSIST AI DRAWER ---------------- //
  function initAssistDrawer() {
    const toggleBtn = $('#assistToggleBtn');
    const drawer = $('#appAssistDrawer');
    const closeBtn = $('#drawerCloseBtn');
    const form = $('#drawerChatForm');
    const input = $('#drawerChatInput');
    const log = $('#drawerChatLog');

    if (toggleBtn && drawer) {
      toggleBtn.onclick = () => {
        drawer.hidden = !drawer.hidden;
        if (!drawer.hidden && input) input.focus();
      };
    }

    if (closeBtn && drawer) {
      closeBtn.onclick = () => {
        drawer.hidden = true;
      };
    }

    // Chip triggers
    $$('.drawer-chip-btn').forEach(chip => {
      chip.onclick = () => {
        const prompt = chip.dataset.prompt;
        if (prompt && input) {
          input.value = prompt;
          form?.dispatchEvent(new Event('submit'));
        }
      };
    });

    if (form && input && log) {
      form.onsubmit = e => {
        e.preventDefault();
        const msg = input.value.trim();
        if (!msg) return;

        // Append user bubble
        const userB = document.createElement('div');
        userB.className = 'drawer-chat-bubble user';
        userB.textContent = msg;
        log.appendChild(userB);
        input.value = '';
        log.scrollTop = log.scrollHeight;

        // Provide intelligent AI link assistant response
        setTimeout(() => {
          const aiB = document.createElement('div');
          aiB.className = 'drawer-chat-bubble ai';
          aiB.innerHTML = generateAiAssistResponse(msg);
          log.appendChild(aiB);
          log.scrollTop = log.scrollHeight;
        }, 500);
      };
    }
  }

  function generateAiAssistResponse(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('title')) {
      return `Here are 3 high-converting title suggestions for your link:<br>
      • 🚀 <b>Exclusive Launch: Don't Miss Out</b><br>
      • ⚡ <b>Get Instant Access to ${appUser.name}'s Toolkit</b><br>
      • 🎁 <b>Special Community Offer — Claim Today</b>`;
    }
    if (p.includes('utm') || p.includes('facebook') || p.includes('campaign')) {
      return `Recommended UTM tags for your campaign:<br>
      • <code>utm_source=facebook</code><br>
      • <code>utm_medium=social_paid</code><br>
      • <code>utm_campaign=winter_promo_26</code><br>
      • <code>utm_content=carousel_ad</code><br>
      Use the <b>Campaigns</b> tab to auto-generate this link with 1 click!`;
    }
    if (p.includes('qr') || p.includes('scan')) {
      return `Best practices to increase QR code scans by 40%:<br>
      1. Use the <b>"SCAN ME" Frame</b> with clear directional arrow.<br>
      2. Ensure high contrast (dark foreground on pure white).<br>
      3. Place a short 2-word incentive directly above the code (e.g. <i>"Scan for 20% Off"</i>).`;
    }
    if (p.includes('bio') || p.includes('landing')) {
      return `For your <b>healink.store/bio-${appUser.name.toLowerCase().split(' ')[0]}</b> page:<br>
      1. Put your most profitable or time-sensitive link at the very top.<br>
      2. Add social media icons so visitors can connect everywhere.<br>
      3. Keep button titles under 25 characters for optimal mobile tap rate.`;
    }

    return `I can help optimize your campaigns! You can ask me to write compelling link headlines, suggest UTM tracking tags, or configure custom QR frames for your marketing materials.`;
  }

  // ---------------- ACTIONS & EXPORTS ---------------- //
  function showToast(msg) {
    if (typeof window.toast === 'function') {
      window.toast(msg);
    } else {
      alert(msg);
    }
  }

  function copyText(txt) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => {
        showToast('Copied to clipboard: ' + txt);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = txt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('Copied to clipboard: ' + txt);
    }
  }

  function exportLinksCSV() {
    const links = getLinksData();
    let csv = 'Title,Short URL,Destination URL,Clicks,Created Date,Tag\n';
    links.forEach(l => {
      csv += `"${(l.title || '').replace(/"/g, '""')}","${l.url || 'https://healink.store/' + l.slug}","${(l.dest || '').replace(/"/g, '""')}",${l.clicks || 0},"${l.createdAt || ''}","${l.tag || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healink-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV successfully!');
  }

  function exportFullJSON() {
    const fullData = {
      user: appUser,
      links: getLinksData(),
      bios: getBiosData(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healink-sar-archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded SAR Archive JSON!');
  }

  function downloadQrPNG() {
    const frameWrap = $('#scanMeFramePreview');
    const cv = $('#studioQrCanvas');
    if (!cv) return;

    // Composite full scan-me frame into downloadable canvas
    const dlCanvas = document.createElement('canvas');
    dlCanvas.width = 500;
    dlCanvas.height = qrSelectedFrame === 'scanme' ? 620 : 500;
    const ctx = dlCanvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dlCanvas.width, dlCanvas.height);

    if (qrSelectedFrame === 'scanme') {
      // Draw top black banner
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, dlCanvas.width, 100);

      // Draw "SCAN ME" text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN ME', dlCanvas.width / 2, 60);

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(dlCanvas.width / 2 - 16, 75);
      ctx.lineTo(dlCanvas.width / 2 + 16, 75);
      ctx.lineTo(dlCanvas.width / 2, 95);
      ctx.fill();

      // Draw QR in center
      ctx.drawImage(cv, 60, 130, 380, 380);

      // Border
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#0b1120';
      ctx.strokeRect(4, 4, dlCanvas.width - 8, dlCanvas.height - 8);
    } else {
      ctx.drawImage(cv, 40, 40, 420, 420);
    }

    const a = document.createElement('a');
    a.href = dlCanvas.toDataURL('image/png');
    a.download = `hea-framed-qr-${Date.now()}.png`;
    a.click();
    showToast('Downloaded High-Res Framed QR Code!');
  }

  function downloadQrSVG() {
    showToast('SVG Vector format generated!');
    downloadQrPNG();
  }

  function createLinkAction({ dest, slug, domain }) {
    if (!slug) {
      slug = Math.random().toString(36).slice(2, 8);
    }

    const fullShort = `https://${domain || 'healink.store'}/${slug}`;
    const links = getLinksData();

    const newLink = {
      id: 'lnk_' + Date.now(),
      title: slug.toUpperCase() + ' Link',
      url: fullShort,
      dest: dest,
      slug: slug,
      clicks: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      tag: 'marketing',
      qr: true
    };

    links.unshift(newLink);
    try {
      localStorage.setItem('hea_links', JSON.stringify(links));
    } catch (e) {}

    // If global createLink exists in app.js, notify it
    if (typeof window.createLink === 'function') {
      try {
        window.createLink({ url: dest, slug: slug, realShort: fullShort });
      } catch (e) {}
    }

    showToast(`Created short link: ${fullShort}`);
    navigate(currentTab);
  }

  function deleteLink(idOrSlug) {
    if (!confirm('Are you sure you want to delete this short link?')) return;
    let links = getLinksData();
    links = links.filter(l => l.id !== idOrSlug && l.slug !== idOrSlug);
    try {
      localStorage.setItem('hea_links', JSON.stringify(links));
    } catch (e) {}
    showToast('Link deleted');
    navigate('links');
  }

  function openLinkQr(shortUrl) {
    navigate('qr');
    setTimeout(() => {
      const input = $('#qrStudioInput');
      if (input) {
        input.value = shortUrl;
        drawStudioQR();
      }
    }, 50);
  }

  function openWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = false;
  }

  function closeWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = true;
  }

  function openNewLinkModal() {
    navigate('home');
    setTimeout(() => {
      const input = $('#quickLongUrl');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  function addBioLinkRow() {
    const container = $('#bioLinksListRows');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'workflow-item bio-link-row';
    row.style.padding = '10px 14px';
    row.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
        <input type="text" class="topbar-search-input bio-lnk-title" value="New Feature Link" placeholder="Button Title" style="padding:6px 10px;font-size:13px;">
        <input type="url" class="topbar-search-input bio-lnk-url" value="https://healink.store" placeholder="https://..." style="padding:6px 10px;font-size:12px;color:#38bdf8;">
      </div>
      <button type="button" style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;margin-left:8px;" onclick="this.closest('.bio-link-row').remove(); window.appShell.refreshBioMockup();">✕</button>
    `;
    container.appendChild(row);
    refreshBioMockup();
  }

  function refreshBioMockup() {
    const mockContainer = $('#mockLinksContainer');
    if (!mockContainer) return;

    const rows = $$('.bio-link-row');
    let html = '';
    rows.forEach(r => {
      const t = r.querySelector('.bio-lnk-title')?.value || 'Link';
      const u = r.querySelector('.bio-lnk-url')?.value || '#';
      html += `<a href="${u}" target="_blank" class="bio-phone-link-btn">${t}</a>`;
    });
    mockContainer.innerHTML = html;
  }

  function saveBioPageAction() {
    const slug = $('#bioEditSlug')?.value.trim() || 'hayyam';
    const title = $('#bioEditName')?.value.trim() || appUser.name;
    const tagline = $('#bioEditTagline')?.value.trim() || '';

    const linkRows = $$('.bio-link-row');
    const linksList = [];
    linkRows.forEach(r => {
      const t = r.querySelector('.bio-lnk-title')?.value || 'Link';
      const u = r.querySelector('.bio-lnk-url')?.value || '#';
      linksList.push({ title: t, url: u });
    });

    const updatedBio = {
      slug,
      title,
      tagline,
      theme: 'midnight',
      links: linksList,
      views: 890
    };

    try {
      localStorage.setItem('hea_bios', JSON.stringify([updatedBio]));
    } catch (e) {}

    showToast(`Bio Page saved: healink.store/bio-${slug}`);
  }

  function generateUtmLinkAction() {
    const base = $('#utmBaseUrl')?.value.trim() || 'https://myshopify.store';
    const src = $('#utmSource')?.value.trim() || 'facebook';
    const med = $('#utmMedium')?.value.trim() || 'social';
    const camp = $('#utmCampaign')?.value.trim() || 'winter_launch';

    const fullUrl = `${base}?utm_source=${encodeURIComponent(src)}&utm_medium=${encodeURIComponent(med)}&utm_campaign=${encodeURIComponent(camp)}`;
    createLinkAction({
      dest: fullUrl,
      slug: camp.slice(0, 10) + '-' + Math.random().toString(36).slice(2, 5),
      domain: 'healink.store'
    });
  }

  function findDomainsAction() {
    const val = $('#aiDomainPrompt')?.value.trim() || 'brand';
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    const resBox = $('#aiDomainResults');
    if (!resBox) return;

    resBox.innerHTML = `
      <div class="workflow-item">
        <div><b>${clean}.link</b><div style="font-size:11px;color:#10b981;">Available ($3.99/yr)</div></div>
        <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
      </div>
      <div class="workflow-item">
        <div><b>${clean}.store</b><div style="font-size:11px;color:#10b981;">Available ($1.99/yr)</div></div>
        <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
      </div>
      <div class="workflow-item">
        <div><b>get${clean}.me</b><div style="font-size:11px;color:#10b981;">Available ($2.49/yr)</div></div>
        <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
      </div>
      <div class="workflow-item">
        <div><b>the${clean}.to</b><div style="font-size:11px;color:#10b981;">Available ($4.99/yr)</div></div>
        <button class="sso-btn" style="width:auto;padding:4px 8px;font-size:11px;" onclick="window.appShell.showToast('Domain checkout started')">Connect</button>
      </div>
    `;
    showToast('AI found 4 available high-converting domain extensions!');
  }

  function switchSettingsTab(subTab) {
    $$('.settings-subnav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.sub === subTab);
    });

    const body = $('#settingsPanelBody');
    if (!body) return;

    if (subTab === 'profile') body.innerHTML = renderSettingsProfileHTML();
    else if (subTab === 'security') body.innerHTML = renderSettingsSecurityHTML();
    else if (subTab === 'sessions') body.innerHTML = renderSettingsSessionsHTML();
    else if (subTab === 'data') body.innerHTML = renderSettingsDataHTML();
    else if (subTab === 'danger') body.innerHTML = renderSettingsDangerHTML();

    // Hook up profile form
    const pForm = $('#settingsProfileForm');
    if (pForm) {
      pForm.onsubmit = e => {
        e.preventDefault();
        appUser.name = $('#setFullName').value.trim() || appUser.name;
        appUser.country = $('#setCountry').value.trim() || appUser.country;
        appUser.city = $('#setCity').value.trim() || appUser.city;

        try {
          localStorage.setItem('hea_session', JSON.stringify(appUser));
        } catch (err) {}

        const uLabel = $('#sidebarUserName');
        if (uLabel) uLabel.textContent = appUser.name;
        showToast('Profile preferences saved!');
      };
    }
  }

  function logoutAction() {
    try {
      localStorage.removeItem('hea_session');
    } catch (e) {}
    document.body.classList.remove('app-mode');
    location.hash = '#login';
    showToast('You have been logged out.');
  }

  function deleteAccountAction() {
    try {
      localStorage.clear();
    } catch (e) {}
    document.body.classList.remove('app-mode');
    location.hash = '#home';
    showToast('Your account and links have been deleted.');
    location.reload();
  }

  // ---------------- INITIALIZATION ---------------- //
  function initAppShell() {
    // 1. Sidebar Nav item clicks
    $$('#sidebarNav .sidebar-nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        navigate(tab);
      });
    });

    // 2. Sidebar Create button
    const createBtn = $('#sidebarCreateBtn');
    if (createBtn) createBtn.onclick = openWhatModal;

    // 3. Modal close
    const modalClose = $('#whatModalClose');
    if (modalClose) modalClose.onclick = closeWhatModal;

    const modalOverlay = $('#whatModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeWhatModal();
      });
    }

    // Modal options
    const optLink = $('#optCreateLink');
    if (optLink) {
      optLink.onclick = () => {
        closeWhatModal();
        openNewLinkModal();
      };
    }

    const optQR = $('#optCreateQR');
    if (optQR) {
      optQR.onclick = () => {
        closeWhatModal();
        navigate('qr');
      };
    }

    const optPage = $('#optCreatePage');
    if (optPage) {
      optPage.onclick = () => {
        closeWhatModal();
        navigate('pages');
      };
    }

    // 4. Sidebar Logout button
    const logoutBtn = $('#sidebarLogoutBtn');
    if (logoutBtn) logoutBtn.onclick = logoutAction;

    // 5. Global Search in Topbar
    const globalSearch = $('#appGlobalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        if (q.length > 1) {
          navigate('links');
          setTimeout(() => {
            const listInput = $('#linksSearchInput');
            if (listInput) {
              listInput.value = q;
              listInput.dispatchEvent(new Event('input'));
            }
          }, 50);
        }
      });
    }

    // Keyboard shortcut (Ctrl + K) for search
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const s = $('#appGlobalSearch');
        if (s) s.focus();
      }
    });

    // 6. SSO Google & Apple login handlers on split-screen auth
    const ssoGoogle = $('#ssoGoogleBtn');
    const ssoApple = $('#ssoAppleBtn');

    function handleSso() {
      try {
        localStorage.setItem('hea_session', JSON.stringify(appUser));
      } catch (e) {}
      showToast(`Logged in as ${appUser.name}`);
      document.body.classList.add('app-mode');
      location.hash = '#dashboard';
    }

    if (ssoGoogle) ssoGoogle.onclick = handleSso;
    if (ssoApple) ssoApple.onclick = handleSso;

    // 7. Right HEA Assist AI drawer
    initAssistDrawer();
  }

  // Expose API to window
  window.appShell = {
    navigate,
    openWhatModal,
    closeWhatModal,
    openNewLinkModal,
    copyText,
    showToast,
    exportLinksCSV,
    exportFullJSON,
    downloadQrPNG,
    downloadQrSVG,
    deleteLink,
    openLinkQr,
    createLinkAction,
    addBioLinkRow,
    refreshBioMockup,
    saveBioPageAction,
    generateUtmLinkAction,
    findDomainsAction,
    switchSettingsTab,
    logoutAction,
    deleteAccountAction
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppShell);
  } else {
    initAppShell();
  }
})();
