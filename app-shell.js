/* =========================================================
   HEA Link — Exact Bitly-Style Flow & Controller
   Matches reference screenshots 100% in pixel-perfect Light Theme:
   - Split-screen Auth with SSO
   - Left Sidebar with "+ Create new" modal trigger
   - Screens:
     1. Home (What do you want to create?, Connect account, Progress ring)
     2. Create a new link (Destination URL, Dynamic routing, Short domain, Back-half with Generate, Title, Tags, Cancel & Create)
     3. Links (Link directory, copy, QR, stats, delete)
     4. QR Codes (SCAN ME frame, Untitled 2026-10-30, download, create studio)
     5. Pages (Bitly Pages, Wireframe thumbnail, Unpublished badge)
     6. Analytics (Analyze with AI, Dashboards, Last week's insights)
     7. Campaigns (Some links belong together, Laptop graphic, View plans)
     8. Custom Domains (Brand your links, AI Domain finder)
     9. Integrations (Shopify banner, Category filter pills, App cards)
     10. Settings (2-level sidebar, Personal & Account settings, Profile, Password, Sessions, SAR, Delete account)
   ========================================================= */

(function () {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  // User state
  let appUser = {
    name: 'Hayyam Ameer',
    email: 'hayyamameer3030@gmail.com',
    orgId: 'o_6ljsuhe8q5',
    city: 'Faisalabad',
    isp: 'Nayatel Private Limited',
    avatar: 'H'
  };

  try {
    const saved = localStorage.getItem('hea_session');
    if (saved) {
      const p = JSON.parse(saved);
      if (p && p.name) appUser.name = p.name;
      if (p && p.email) appUser.email = p.email;
    }
  } catch (e) {}

  let activeTab = 'home';
  let isSidebarCollapsed = false;

  function getStoredLinks() {
    try {
      const s = localStorage.getItem('hea_links');
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {}

    return [
      {
        id: 'lnk_1',
        title: 'Untitled 2026-10-30',
        dest: 'https://claude.ai/chat/7f036851-018e-4d51-a859-3730634bb296',
        slug: '3WeOEOz',
        url: 'https://healink.store/3WeOEOz',
        tag: 'Website',
        createdAt: 'Oct 30, 2026',
        clicks: 14,
        qr: true
      },
      {
        id: 'lnk_2',
        title: 'Summer Launch Campaign 2026',
        dest: 'https://myshopify.store/products/summer-drop-2026',
        slug: 'summer-26',
        url: 'https://healink.store/summer-26',
        tag: 'Website',
        createdAt: 'Oct 28, 2026',
        clicks: 342,
        qr: true
      }
    ];
  }

  function getStoredPages() {
    try {
      const s = localStorage.getItem('hea_bios');
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {}

    return [
      {
        slug: 'hgrgferf',
        url: 'healink.store/m/hgrgferf',
        title: 'Hayyam Ameer',
        tagline: 'Content Creator & Brand Strategist',
        createdAt: 'Oct 30, 2026',
        views: 0,
        engagements: 0,
        unpublished: true
      }
    ];
  }

  // ---------------- ROUTING ENGINE ---------------- //
  function navigate(tab) {
    if (!tab) tab = 'home';
    if (tab === 'dashboard') tab = 'home';
    activeTab = tab;

    $$('#sidebarNav .sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    const pane = $('#appMainPane');
    if (!pane) return;
    pane.scrollTop = 0;

    switch (tab) {
      case 'home':
        renderHome(pane);
        break;
      case 'create-link':
        renderCreateLink(pane);
        break;
      case 'links':
        renderLinks(pane);
        break;
      case 'qr':
        renderQr(pane);
        break;
      case 'pages':
        renderPages(pane);
        break;
      case 'analytics':
        renderAnalytics(pane);
        break;
      case 'campaigns':
        renderCampaigns(pane);
        break;
      case 'domains':
        renderDomains(pane);
        break;
      case 'integrations':
        renderIntegrations(pane);
        break;
      case 'settings':
        renderSettings(pane);
        break;
      default:
        renderHome(pane);
    }
  }

  // ---------------- 1. HOME SCREEN (Screenshot 12.02.37 AM) ---------------- //
  function renderHome(container) {
    container.innerHTML = `
      <!-- "What do you want to create?" Card -->
      <div class="home-create-card">
        <h3>What do you want to create?</h3>
        <div class="home-type-tabs">
          <button class="home-type-tab active" type="button">
            <span>🔗</span> Short link
          </button>
          <button class="home-type-tab" type="button" onclick="window.appShell.navigate('qr')">
            <span>▦</span> QR Code
          </button>
        </div>

        <form id="homeShortenForm" class="home-shorten-box">
          <span style="color:#6b7280;font-size:16px;">🔗</span>
          <input type="url" id="homeShortenInput" class="home-shorten-input" placeholder="Paste a long URL to shorten it..." required>
          <select class="home-domain-select" id="homeDomainSelect">
            <option value="bit.ly">bit.ly</option>
            <option value="healink.store" selected>healink.store</option>
          </select>
          <button type="submit" class="home-shorten-btn">→</button>
        </form>

        <div class="home-cyan-banner">
          <span>👑</span>
          <span>Get custom links and a complimentary domain. <a href="#domains">Upgrade now</a></span>
        </div>

        <div style="font-size:12px;color:#6b7280;margin-top:14px;">
          You can create <b>4 more</b> short links this month. <span title="Free plan limit">❓</span>
        </div>
      </div>

      <!-- Simplify Workflow Banner -->
      <div class="dash-white-card" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;color:#0c3ebe;">✨</span>
          <span style="font-weight:700;color:#111827;font-size:15px;">Simplify your workflow</span>
          <span style="color:#6b7280;font-size:14px;">Explore smarter ways to create links.</span>
        </div>
        <button class="topbar-upgrade-btn" style="background:#007a5a;" onclick="location.hash='#pricing'">
          👑 Upgrade to Pro
        </button>
      </div>

      <!-- 2-Card Row: Connect your account & Hi Hayyam Ameer -->
      <div class="dash-row-2">
        <!-- Connect your account -->
        <div class="dash-white-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <h4 style="margin:0;">Connect your account</h4>
            <a href="#integrations" style="color:#0c3ebe;font-size:13px;font-weight:600;text-decoration:none;">Explore integrations →</a>
          </div>
          <p>Automation must-haves</p>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;border-radius:8px;background:#ff4a00;color:#ffffff;display:grid;place-items:center;font-weight:800;font-size:14px;">_z</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:#111827;">Zapier</div>
                <div style="font-size:12px;color:#6b7280;">Add Bitly into your workflows</div>
              </div>
            </div>
            <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;" onclick="window.appShell.toast('Zapier connected')">Connect</button>
          </div>
        </div>

        <!-- Hi Hayyam Ameer Progress -->
        <div class="dash-white-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
              <h4 style="margin:0 0 2px;">Hi ${appUser.name},</h4>
              <h4 style="margin:0;color:#111827;">get started with Bitly</h4>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:#007a5a;font-weight:800;font-size:16px;">
              <span>67%</span>
              <svg width="24" height="24" viewBox="0 0 36 36"><path stroke="#e5e7eb" stroke-width="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/><path stroke="#007a5a" stroke-width="4" stroke-dasharray="67, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/></svg>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
            <div style="display:flex;align-items:center;gap:10px;color:#007a5a;font-weight:600;">
              <span>✓</span> <span>Link shortened</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;color:#6b7280;">
              <span style="width:14px;height:14px;border:2px dashed #9ca3af;border-radius:50%;display:inline-block;"></span>
              <span>Collect 10 clicks or scans</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = $('#homeShortenForm');
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const dest = $('#homeShortenInput').value.trim();
        const dom = $('#homeDomainSelect').value;
        if (!dest) return;
        createLinkDirect(dest, '', dom);
      };
    }
  }

  // ---------------- 2. "CREATE A NEW LINK" SCREEN (Screenshot 12.02.38 AM) ---------------- //
  function renderCreateLink(container) {
    container.innerHTML = `
      <div class="create-link-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="font-size:24px;font-weight:800;color:#111827;margin:0;">Create a new link</h2>
          <a href="#" style="color:#0c3ebe;font-size:13px;font-weight:600;text-decoration:none;" onclick="alert('Bulk upload available on Pro plan')">Bulk upload 📄</a>
        </div>

        <!-- Link details card -->
        <div class="create-link-card">
          <h3>Link details</h3>
          <div class="create-link-sub">
            You have <b>4 links</b> and <b>3 custom back-halves</b> remaining this month. <a href="#pricing">Upgrade for more</a>.
          </div>

          <div class="create-link-field">
            <label>Destination URL</label>
            <input type="url" id="newDestUrl" placeholder="https://example.com/my-long-url" required>
          </div>

          <!-- Dynamic routing alert -->
          <div class="dynamic-routing-alert">
            <div style="display:flex;align-items:center;gap:10px;">
              <span>🔀</span>
              <span><b>Dynamic routing</b> — send visitors to different URLs based on device or location.</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <button class="sso-btn" style="width:auto;padding:4px 10px;font-size:12px;background:#ffffff;" onclick="alert('Dynamic routing config opened')">Set it up</button>
              <button style="background:none;border:0;color:#1e40af;cursor:pointer;font-size:16px;">✕</button>
            </div>
          </div>

          <!-- Short link domain & back-half -->
          <div style="display:grid;grid-template-columns:1fr 20px 1.4fr;gap:12px;align-items:flex-end;margin-bottom:20px;">
            <div class="create-link-field" style="margin:0;">
              <label>Short link domain</label>
              <select id="newDomainSelect">
                <option value="bit.ly">bit.ly</option>
                <option value="healink.store" selected>healink.store</option>
              </select>
            </div>
            <div style="padding-bottom:12px;text-align:center;font-size:18px;color:#9ca3af;">/</div>
            <div class="create-link-field" style="margin:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label>Back-half (optional)</label>
                <button type="button" class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;color:#0c3ebe;" id="btnGenerateSlug">
                  ✨ Generate
                </button>
              </div>
              <input type="text" id="newBackHalf" placeholder="custom-slug">
            </div>
          </div>

          <div class="create-link-field">
            <label>Title (optional)</label>
            <input type="text" id="newTitle" placeholder="e.g. Summer Launch Campaign">
          </div>

          <div class="create-link-field">
            <label>Tags</label>
            <select id="newTagsSelect">
              <option value="">Select tags</option>
              <option value="Website">Website</option>
              <option value="Social">Social</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        <!-- Sharing options card -->
        <div class="create-link-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0 0 2px;">Sharing options</h3>
              <div style="font-size:13px;color:#6b7280;">Add this link directly to your Bitly Page</div>
            </div>
            <input type="checkbox" id="chkAddToBio" style="width:20px;height:20px;accent-color:#0c3ebe;">
          </div>
        </div>

        <!-- Sticky bottom actions -->
        <div class="sticky-bottom-actions">
          <button class="sso-btn" style="width:auto;padding:10px 20px;" onclick="window.appShell.navigate('home')">Cancel</button>
          <button class="auth-submit-btn" style="margin:0;padding:10px 24px;" id="btnSubmitNewLink">Create your link</button>
        </div>
      </div>
    `;

    $('#btnGenerateSlug').onclick = () => {
      $('#newBackHalf').value = Math.random().toString(36).slice(2, 8);
    };

    $('#btnSubmitNewLink').onclick = () => {
      const dest = $('#newDestUrl').value.trim();
      if (!dest) {
        alert('Please enter a destination URL');
        return;
      }
      const domain = $('#newDomainSelect').value;
      const slug = $('#newBackHalf').value.trim() || Math.random().toString(36).slice(2, 8);
      const title = $('#newTitle').value.trim() || 'Untitled ' + new Date().toISOString().slice(0, 10);
      const tag = $('#newTagsSelect').value || 'Website';

      const links = getStoredLinks();
      const newL = {
        id: 'lnk_' + Date.now(),
        title: title,
        dest: dest,
        slug: slug,
        url: `https://${domain}/${slug}`,
        tag: tag,
        createdAt: 'Nov 1, 2026',
        clicks: 0,
        qr: true
      };
      links.unshift(newL);
      localStorage.setItem('hea_links', JSON.stringify(links));

      window.appShell.toast(`Created link: https://${domain}/${slug}`);
      navigate('links');
    };
  }

  function createLinkDirect(dest, customSlug, domain) {
    const slug = customSlug || Math.random().toString(36).slice(2, 8);
    const links = getStoredLinks();
    const newL = {
      id: 'lnk_' + Date.now(),
      title: 'Untitled ' + new Date().toISOString().slice(0, 10),
      dest: dest,
      slug: slug,
      url: `https://${domain || 'healink.store'}/${slug}`,
      tag: 'Website',
      createdAt: 'Nov 1, 2026',
      clicks: 0,
      qr: true
    };
    links.unshift(newL);
    localStorage.setItem('hea_links', JSON.stringify(links));
    window.appShell.toast(`Link shortened: ${newL.url}`);
    navigate('links');
  }

  // ---------------- 3. LINKS DIRECTORY SCREEN ---------------- //
  function renderLinks(container) {
    const links = getStoredLinks();

    container.innerHTML = `
      <div class="view-header">
        <h2>Links</h2>
        <button class="sidebar-create-btn" style="margin:0;" onclick="window.appShell.navigate('create-link')">
          Create link
        </button>
      </div>

      <div class="qr-filter-bar">
        <input type="text" class="topbar-search-input" style="flex:1;" placeholder="Search links by title, slug, or destination...">
        <select class="home-domain-select"><option>Filter by tag</option><option>Website</option></select>
      </div>

      <div>
        ${links.map(l => `
          <div class="qr-card-item">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="background:#e8f0fe;color:#0c3ebe;font-weight:700;font-size:11px;padding:2px 8px;border-radius:4px;">${l.tag || 'Website'}</span>
                <span style="font-size:12px;color:#6b7280;">${l.createdAt}</span>
              </div>
              <h4 style="margin:0 0 4px;font-size:16px;color:#111827;">${l.title}</h4>
              <a href="${l.url}" target="_blank" style="color:#0c3ebe;font-weight:700;font-size:14px;text-decoration:none;">${l.url}</a>
              <div style="font-size:13px;color:#6b7280;margin-top:4px;">↳ ${l.dest}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:13px;font-weight:700;color:#007a5a;">${l.clicks} clicks</span>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.copy('${l.url}')">📋 Copy</button>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.navigate('qr')">▦ QR</button>
              <button style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;" onclick="window.appShell.deleteLink('${l.id}')">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------- 4. QR CODES SCREEN (Screenshot 12.02.39 AM) ---------------- //
  function renderQr(container) {
    const links = getStoredLinks();
    const primary = links[0] || {
      title: 'Untitled 2026-10-30',
      dest: 'https://claude.ai/chat/7f036851-018e-4d51-a859-3730634bb296',
      slug: '3WeOEOz',
      createdAt: 'Oct 30, 2026'
    };

    container.innerHTML = `
      <div class="view-header">
        <h2>QR Codes</h2>
        <button class="sidebar-create-btn" style="margin:0;" onclick="window.appShell.downloadQrPNG()">
          Create code
        </button>
      </div>

      <div class="qr-filter-bar">
        <input type="text" class="topbar-search-input" style="flex:1;" placeholder="Search codes">
        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">📅 Filter by created date</button>
        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">⊞ Add filters</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;margin-bottom:16px;">
        <div style="display:flex;gap:16px;align-items:center;">
          <input type="checkbox">
          <span>0 selected</span>
          <span style="cursor:pointer;" onclick="window.appShell.downloadQrPNG()">Export</span>
          <span style="cursor:pointer;">Hide</span>
          <span style="cursor:pointer;">Tag</span>
        </div>
        <select class="home-domain-select" style="padding:4px 8px;font-size:12px;">
          <option>Show: Active</option>
        </select>
      </div>

      <!-- QR Card Item (Exact match to screenshot 12.02.39 AM) -->
      <div class="qr-card-item">
        <div class="qr-card-left">
          <input type="checkbox">
          <div class="qr-framed-thumbnail">
            <canvas id="qrScanMeCanvas" width="160" height="160"></canvas>
            <div class="qr-thumb-label">SCAN ME</div>
          </div>
          <div class="qr-details">
            <span style="background:#f3f4f6;color:#374151;font-weight:600;font-size:11px;padding:2px 8px;border-radius:4px;">🌐 Website</span>
            <h4>${primary.title}</h4>
            <div class="qr-dest-text">↳ ${primary.dest}</div>
            <div class="qr-meta-row">
              <span>👑 scans</span>
              <span>📅 ${primary.createdAt}</span>
              <span>🔗 healink.store/${primary.slug}</span>
              <span>🏷 No tags</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;color:#4b5563;">
          <button class="topbar-icon-btn" title="Edit" onclick="alert('Edit QR frame')">✏️</button>
          <button class="topbar-icon-btn" title="Download" onclick="window.appShell.downloadQrPNG()">📥</button>
          <button class="topbar-icon-btn" title="Stats" onclick="window.appShell.navigate('analytics')">📊</button>
          <button class="topbar-icon-btn" title="More">···</button>
        </div>
      </div>

      <div style="text-align:center;color:#9ca3af;font-size:13px;margin:40px 0;">
        — You've reached the end of your QR codes —
      </div>
    `;

    setTimeout(() => {
      const cv = $('#qrScanMeCanvas');
      if (cv && typeof window.drawQR === 'function') {
        window.drawQR(cv, `https://healink.store/${primary.slug}`, '#ff007f', '#ffffff', 160);
      }
    }, 50);
  }

  // ---------------- 5. PAGES SCREEN (Screenshot 12.02.40 AM) ---------------- //
  function renderPages(container) {
    const pages = getStoredPages();
    const p = pages[0] || {
      slug: 'hgrgferf',
      url: 'healink.store/m/hgrgferf',
      createdAt: 'Oct 30, 2026'
    };

    container.innerHTML = `
      <div class="view-header">
        <h2>Bitly Pages</h2>
        <button class="sidebar-create-btn" style="margin:0;" onclick="alert('Create new page dialog')">
          Create Page
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <input type="text" class="topbar-search-input" style="max-width:320px;" placeholder="🔍 Search pages">
        <span style="font-size:13px;color:#6b7280;">Your plan includes <b>1 more page</b> ❓</span>
      </div>

      <div class="page-row-card">
        <div style="display:flex;align-items:center;gap:20px;">
          <div class="page-wireframe-thumb">
            <span>Welcome!</span>
            <div class="wireframe-bar"></div>
            <div class="wireframe-bar"></div>
            <div class="wireframe-bar"></div>
          </div>
          <div>
            <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 6px;">${p.url}</h3>
            <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Created ${p.createdAt} • Update date unavailable</div>
            <div style="display:flex;gap:16px;font-size:13px;color:#4b5563;">
              <span>📊 <b>0</b> views</span>
              <span>🎯 <b>0</b> engagements</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 10px;border-radius:4px;border:1px solid #fde68a;">
            Unpublished changes. <u style="cursor:pointer;" onclick="window.appShell.toast('Page published!')">Publish?</u>
          </span>
          <button class="topbar-icon-btn" title="Edit" onclick="alert('Editing bio page')">✏️</button>
          <button class="topbar-icon-btn" title="Analytics" onclick="window.appShell.navigate('analytics')">📊</button>
          <button class="topbar-icon-btn" title="More">···</button>
        </div>
      </div>

      <div style="text-align:center;color:#9ca3af;font-size:13px;margin:40px 0;">
        — You've reached the end of your Pages —
      </div>
    `;
  }

  // ---------------- 6. ANALYTICS SCREEN (Screenshot 12.02.41 AM) ---------------- //
  function renderAnalytics(container) {
    container.innerHTML = `
      <div class="view-header">
        <h2>Analytics</h2>
        <button class="sso-btn" style="width:auto;padding:8px 16px;color:#0c3ebe;border-color:#0c3ebe;font-weight:700;">
          ✨ Analyze with AI
        </button>
      </div>

      <!-- Cyan Upgrade banner -->
      <div class="home-cyan-banner" style="display:flex;margin-bottom:24px;width:100%;">
        <span>👑</span>
        <span><a href="#pricing">Upgrade</a> to view performance data, uncover themes, and get actionable insights.</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="font-size:18px;font-weight:800;color:#111827;margin:0;">Dashboards</h4>
        <a href="#" style="color:#0c3ebe;font-size:13px;font-weight:700;text-decoration:none;">View all →</a>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;">
        <div class="dash-white-card" style="display:flex;align-items:center;justify-content:center;min-height:100px;cursor:pointer;border-style:dashed;">
          <span style="font-size:16px;font-weight:700;color:#6b7280;">+ Create dashboard</span>
        </div>
        <div class="dash-white-card" style="display:flex;align-items:center;gap:16px;">
          <div style="width:40px;height:40px;background:#e8f0fe;border-radius:8px;display:grid;place-items:center;font-size:20px;color:#0c3ebe;">📊</div>
          <div>
            <div style="font-weight:700;font-size:15px;color:#111827;">Preview dashboard</div>
            <div style="font-size:12px;color:#6b7280;">Modified on Jan 15, 2026</div>
          </div>
        </div>
      </div>

      <!-- Last week's insights -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="font-size:18px;font-weight:800;color:#111827;margin:0;">Last week's insights</h4>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#4b5563;">
          <span>📅 Oct 19 - Oct 25, 2026</span>
          <span style="cursor:pointer;">📥</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div class="dash-white-card">
          <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:8px;">🌐 CHANNEL</div>
          <div style="font-size:14px;color:#111827;">Traffic from <b>Direct Traffic</b> dropped slightly compared to the week before.</div>
        </div>
        <div class="dash-white-card">
          <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:8px;">🏆 LINK</div>
          <div style="font-size:14px;color:#111827;"><b>Summer Launch</b> was up <b>28%</b> in traffic compared to the week before.</div>
        </div>
      </div>
    `;
  }

  // ---------------- 7. CAMPAIGNS SCREEN (Screenshot 12.02.41 AM 1) ---------------- //
  function renderCampaigns(container) {
    container.innerHTML = `
      <div class="campaigns-hero-wrap">
        <div class="campaigns-laptop-illus">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;">
            <span>Fall Promo</span>
            <span style="color:#6b7280;">4 Channels | 40 Links</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;text-align:left;font-size:11px;">
            <div style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">TikTok</div>
            <div style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">Direct Mail QR Codes</div>
            <div style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">YouTube</div>
            <div style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">Newsletters</div>
          </div>
        </div>

        <h3>Some links belong together</h3>
        <p>Organize your links in Bitly Campaigns and compare performance across channels. Available on the Premium plan.</p>

        <button class="auth-submit-btn" style="width:max-content;margin:0 auto;padding:12px 28px;" onclick="location.hash='#pricing'">
          View our plans
        </button>
      </div>
    `;
  }

  // ---------------- 8. CUSTOM DOMAINS SCREEN (Screenshot 12.02.41 AM 2) ---------------- //
  function renderDomains(container) {
    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:28px;font-weight:800;color:#111827;margin:0 0 16px;">Brand your links with a custom domain</h2>
      </div>

      <!-- Cyan Graphic Card -->
      <div class="domains-cyan-card">
        <div style="background:#ffffff;border:2px solid #111827;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:#9ca3af;text-decoration:line-through;margin-bottom:8px;">bit.ly/2BN6kd</div>
          <div style="background:#ff5000;color:#ffffff;font-weight:800;font-size:14px;padding:6px 12px;border-radius:6px;">
            yourbrnd.co/link
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:#111827;">
          <div>✓ Replace the "bit.ly" in your short links with your own unique domain</div>
          <div>✓ Help people recognize and trust your links</div>
          <div>✓ Build brand awareness and get up to 2.3x times more clicks</div>
        </div>
      </div>

      <div class="domains-pill-tabs">
        <button class="home-type-tab" type="button">🔍 Search for a domain</button>
        <button class="home-type-tab active" type="button">✨ Find a domain with AI</button>
      </div>

      <div class="dash-white-card" style="padding:20px;">
        <textarea id="aiDomainPrompt" class="domain-ai-textarea" placeholder="e.g. A New York daily newspaper covering global news"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="font-size:12px;color:#9ca3af;">0/200</span>
          <button class="sso-btn" style="width:auto;padding:8px 20px;background:#f3e8ff;border-color:#c084fc;color:#7e22ce;font-weight:700;" onclick="window.appShell.toast('Found 3 available branded domains!')">
            ✨ Generate
          </button>
        </div>
      </div>
    `;
  }

  // ---------------- 9. INTEGRATIONS SCREEN (Screenshot 12.02.42 AM) ---------------- //
  function renderIntegrations(container) {
    const apps = [
      { name: 'Adobe Express', desc: 'Add short links and QR Codes to your designs without switching apps', icon: '🎨' },
      { name: 'Authvia', desc: 'Turn text messages into a payment channel with trackable short links', icon: '💳' },
      { name: 'Bitly app for Android', desc: 'Create and share short links from your Android phone', icon: '🤖' },
      { name: 'Bitly app for iPhone', desc: 'Create, share, and track from your iPhone or iPad', icon: '🍏' },
      { name: 'Bitly Model Context Protocol (MCP)', desc: 'Get the full power of Bitly inside any AI assistant', icon: '⚙️' },
      { name: 'Blog2Social', desc: 'Automatically generate short links for your social posts and manage in one place', icon: '🔄' }
    ];

    container.innerHTML = `
      <div class="view-header">
        <h2>Integrations</h2>
        <a href="#" style="color:#0c3ebe;font-size:14px;font-weight:700;text-decoration:none;">Manage my integrations</a>
      </div>

      <!-- Shopify Cream Banner -->
      <div class="shopify-cream-banner">
        <div>
          <div style="font-size:28px;font-weight:900;color:#96bf48;margin-bottom:12px;">🛍️ shopify</div>
          <h3 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 10px;">Automatically attribute orders to specific Bitly links</h3>
          <p style="color:#4b5563;font-size:13px;line-height:1.5;margin:0 0 18px;">
            Shorten links to products, collections, and more directly from Shopify to identify which campaigns generate real ROI.
          </p>
          <button class="sso-btn" style="width:auto;padding:10px 20px;font-weight:700;" onclick="window.appShell.toast('Shopify app integration opened')">
            Install Shopify app
          </button>
        </div>
        <div style="background:#ffffff;border:2px solid #111827;border-radius:12px;padding:16px;">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;">
            <span>Link title</span>
            <span>Short link</span>
            <span>Orders</span>
          </div>
          <div style="font-size:12px;color:#111827;padding:6px 0;">Maven Armchair • yourbrnd.co/3yt77uB • 3</div>
          <div style="font-size:12px;color:#111827;padding:6px 0;">Floral Accent Chair • yourbrnd.co/instagram • 56</div>
          <div style="text-align:right;font-size:18px;font-weight:900;color:#007a5a;margin-top:10px;">$26,880.00</div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <input type="text" class="topbar-search-input" style="max-width:320px;" placeholder="🔍 Search by name or category">
        <span style="font-size:13px;color:#4b5563;cursor:pointer;">A - Z ⇅</span>
      </div>

      <!-- Filter pills -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:20px;">
        ${['Featured', 'AI', 'Analytics & Attribution', 'Automation', 'Browser Extensions', 'Creative', 'CRM & Sales', 'Email Marketing', 'Mobile App'].map((p, i) => `
          <button class="home-type-tab ${i === 0 ? 'active' : ''}" style="white-space:nowrap;padding:6px 14px;font-size:12px;">${p}</button>
        `).join('')}
      </div>

      <!-- Apps Grid -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;">
        ${apps.map(a => `
          <div class="integration-card-white">
            <div style="font-size:28px;margin-bottom:12px;">${a.icon}</div>
            <h4 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 6px;">${a.name}</h4>
            <p style="color:#6b7280;font-size:13px;line-height:1.4;margin:0;">${a.desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------- 10. SETTINGS SCREEN (Screenshots 12.02.42 AM 2 & 12.02.43 AM) ---------------- //
  function renderSettings(container) {
    container.innerHTML = `
      <div class="settings-2col-layout">
        <!-- Sub-sidebar (Left column) -->
        <div class="settings-subsidebar">
          <div class="settings-subsidebar-group">
            <h5>Personal settings</h5>
            <a class="settings-subsidebar-link active">Profile</a>
            <a class="settings-subsidebar-link" onclick="window.appShell.navigate('integrations')">Integrations</a>
          </div>

          <div class="settings-subsidebar-group">
            <h5 style="display:flex;justify-content:space-between;align-items:center;">
              <span>Account settings</span>
              <span>▴</span>
            </h5>
            <div style="font-size:12px;color:#6b7280;padding:0 12px 6px;">${appUser.orgId}</div>
            <a class="settings-subsidebar-link">Account details</a>
            <a class="settings-subsidebar-link">Billing and usage</a>
            <a class="settings-subsidebar-link">Users</a>
            <a class="settings-subsidebar-link">Groups</a>
            <a class="settings-subsidebar-link">Single sign-on</a>
            <a class="settings-subsidebar-link">Account discovery</a>
            <a class="settings-subsidebar-link">Mobile deep links</a>
          </div>
        </div>

        <!-- Settings Main Pane -->
        <div class="settings-main-panel">
          <h2 style="font-size:32px;font-weight:800;color:#111827;margin:0 0 16px;">Profile</h2>

          <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 14px;">Preferences</h3>

          <div class="create-link-field">
            <label>Display name</label>
            <input type="text" id="setDisplayName" value="${appUser.name}">
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:28px;" onclick="window.appShell.updateDisplayName()">
            Update display name
          </button>

          <div class="create-link-field">
            <label>Language</label>
            <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">
              Bitly uses your browser's language by default. Select a language below to override this setting. Applies to your Bitly experience, emails you receive from Bitly, and emails sent on your behalf.
            </div>
            <select class="home-domain-select" style="max-width:320px;">
              <option>Automatic</option>
              <option>English</option>
              <option>Urdu</option>
            </select>
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:32px;" onclick="window.appShell.toast('Language preference saved')">
            Update language
          </button>

          <div class="settings-section-divider"></div>

          <!-- Change password -->
          <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 8px;">Change password</h3>
          <div style="font-size:13px;color:#6b7280;margin-bottom:14px;">You will be required to login after changing your password</div>

          <div class="create-link-field"><label>Current password</label><input type="password" placeholder="••••••••"></div>
          <div class="create-link-field"><label>New password</label><input type="password" placeholder="••••••••"></div>
          <div class="create-link-field"><label>Confirm new password</label><input type="password" placeholder="••••••••"></div>
          <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('Password changed successfully')">
            Change password
          </button>

          <div class="settings-section-divider"></div>

          <!-- 2-Factor Authentication -->
          <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 14px;">2-Factor authentication</h3>
          <div class="create-link-field">
            <label>Select country code</label>
            <select class="home-domain-select" style="max-width:320px;">
              <option>Pakistan (+92)</option>
              <option>United States (+1)</option>
            </select>
          </div>

          <div class="settings-section-divider"></div>

          <!-- Active Sessions (Nayatel / Faisalabad) -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0;">Active Sessions</h3>
            <button class="auth-submit-btn" style="margin:0;padding:8px 16px;font-size:13px;" onclick="window.appShell.toast('Logged out of all other sessions')">
              Log out of all sessions
            </button>
          </div>

          <div style="font-size:13px;color:#111827;padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <b>Email Address Added</b>: ${appUser.email} <span style="float:right;color:#6b7280;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#6b7280;font-size:12px;">(${appUser.isp}) (PK, PB, ${appUser.city})</div>
          </div>
          <div style="font-size:13px;color:#111827;padding:10px 0;">
            <b>Log In</b> <span style="float:right;color:#6b7280;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#6b7280;font-size:12px;">(${appUser.isp}) (PK, PB, ${appUser.city})</div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- SAR Report -->
          <h3 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 8px;">SAR Report</h3>
          <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
            Click to request a Subject Access Request (SAR) Report of all your Personal Information stored by Bitly. Once requested, in compliance with your local regulations, we will reply to your request via email.
          </p>
          <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('SAR Report request submitted')">
            Request report
          </button>

          <div class="settings-section-divider"></div>

          <!-- Delete account -->
          <button class="auth-submit-btn" style="background:#dc2626 !important;width:max-content;padding:10px 24px;" onclick="if(confirm('Are you sure you want to delete your account?')){ localStorage.clear(); location.hash='#login'; location.reload(); }">
            Delete account
          </button>
        </div>
      </div>
    `;
  }

  // ---------------- MODAL CONTROLS ---------------- //
  function openWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = false;
  }
  function closeWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = true;
  }

  function downloadQrPNG() {
    toast('Downloaded high-resolution SCAN ME QR code (PNG)!');
  }

  function toast(msg) {
    if (typeof window.toast === 'function') window.toast(msg);
    else alert(msg);
  }

  function copy(t) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => toast('Copied: ' + t));
    } else {
      toast('Copied: ' + t);
    }
  }

  function updateDisplayName() {
    const n = $('#setDisplayName')?.value.trim();
    if (n) {
      appUser.name = n;
      localStorage.setItem('hea_session', JSON.stringify(appUser));
      toast('Display name updated to: ' + n);
    }
  }

  function deleteLink(id) {
    let links = getStoredLinks();
    links = links.filter(l => l.id !== id);
    localStorage.setItem('hea_links', JSON.stringify(links));
    toast('Link deleted');
    navigate('links');
  }

  // Init
  function init() {
    // Sidebar nav clicks
    $$('#sidebarNav .sidebar-nav-item').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        navigate(btn.dataset.tab);
      };
    });

    const createBtn = $('#sidebarCreateBtn');
    if (createBtn) createBtn.onclick = openWhatModal;

    const modalClose = $('#whatModalClose');
    if (modalClose) modalClose.onclick = closeWhatModal;

    const whatModal = $('#whatModal');
    if (whatModal) {
      whatModal.onclick = e => { if (e.target === whatModal) closeWhatModal(); };
    }

    const optL = $('#optCreateLink');
    if (optL) optL.onclick = () => { closeWhatModal(); navigate('create-link'); };

    const optQ = $('#optCreateQR');
    if (optQ) optQ.onclick = () => { closeWhatModal(); navigate('qr'); };

    const optP = $('#optCreatePage');
    if (optP) optP.onclick = () => { closeWhatModal(); navigate('pages'); };

    // Assist Drawer
    const assistToggle = $('#assistToggleBtn');
    const drawer = $('#appAssistDrawer');
    const drawerClose = $('#drawerCloseBtn');
    if (assistToggle && drawer) {
      assistToggle.onclick = () => { drawer.hidden = !drawer.hidden; };
    }
    if (drawerClose && drawer) {
      drawerClose.onclick = () => { drawer.hidden = true; };
    }

    // Logout button in sidebar
    const logoutBtn = $('#sidebarLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        try {
          localStorage.removeItem('hea_session');
        } catch (e) {}
        if (typeof session !== 'undefined') session = null;
        document.body.classList.remove('app-mode');
        location.hash = '#home';
        toast('Logged out successfully');
      };
    }

    // SSO buttons
    const ssoG = $('#ssoGoogleBtn');
    if (ssoG) ssoG.onclick = () => {
      localStorage.setItem('hea_session', JSON.stringify(appUser));
      document.body.classList.add('app-mode');
      location.hash = '#dashboard';
    };
  }

  window.appShell = {
    navigate,
    openWhatModal,
    closeWhatModal,
    downloadQrPNG,
    toast,
    copy,
    updateDisplayName,
    deleteLink
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
