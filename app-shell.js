/* =========================================================
   HEA Link — Complete Logged-In User Experience
   Matches 100% of the 22 Bitly reference screenshots
   Fully transformed into the Website's Dark Cyber Theme:
   - Deep Midnight: #060b18
   - Sidebar & Topbar & Drawer: #090f22
   - Surface Glass Cards: #0d172e / rgba(13, 23, 46, 0.85)
   - Neon Accents: #38bdf8 (Cyan), #0066ff (Electric Blue), #D4FF24 (Lime), #10b981 (Green)
   - Text: #ffffff (Headings), #94a3b8 (Muted body), #64748b (Meta)
   ========================================================= */

(function () {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  // User state matching screenshots
  let appUser = {
    name: 'Hayyam Ameer',
    email: 'hayyamameer3030@gmail.com',
    orgId: 'o_6ljsuhe8q5',
    city: 'Faisalabad',
    isp: 'Nayatel Private Limited',
    avatar: 'HA',
    selectedQrColor: '#ff007f'
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
  let activeQrId = 'lnk_1';

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
        createdAt: 'Oct 30, 2026 7:28 AM PDT',
        clicks: 14,
        scans: 4,
        qr: true
      },
      {
        id: 'lnk_2',
        title: 'Summer Launch Campaign 2026',
        dest: 'https://myshopify.store/products/summer-drop-2026',
        slug: 'summer-26',
        url: 'https://healink.store/summer-26',
        tag: 'Website',
        createdAt: 'Oct 28, 2026 11:15 AM PDT',
        clicks: 342,
        scans: 98,
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
  function navigate(tab, param) {
    if (!tab) tab = 'home';
    if (tab === 'dashboard' || tab === 'app') tab = 'home';
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
      case 'qr-detail':
        renderQrDetail(pane, param || activeQrId);
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
          <button class="home-type-tab active" type="button" id="tabShortLinkOpt">
            <span>🔗</span> Short link
          </button>
          <button class="home-type-tab" type="button" onclick="window.appShell.navigate('qr')">
            <span>▦</span> QR Code
          </button>
        </div>

        <form id="homeShortenForm" class="home-shorten-box">
          <span style="color:#94a3b8;font-size:16px;">🔗</span>
          <input type="url" id="homeShortenInput" class="home-shorten-input" placeholder="Paste a long URL to shorten it..." required>
          <select class="home-domain-select" id="homeDomainSelect">
            <option value="healink.store" selected>healink.store</option>
            <option value="bit.ly">bit.ly</option>
          </select>
          <button type="submit" class="home-shorten-btn">→</button>
        </form>

        <div class="home-cyan-banner">
          <span>👑</span>
          <span>Get custom links and a complimentary domain. <a href="#domains">Upgrade now</a></span>
        </div>

        <div style="font-size:12px;color:#94a3b8;margin-top:14px;">
          You can create <b>4 more</b> short links this month. <span title="Free plan limit" style="cursor:help;">❓</span>
        </div>
      </div>

      <!-- Simplify Workflow Banner -->
      <div class="dash-white-card" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;color:#38bdf8;">✨</span>
          <span style="font-weight:700;color:#ffffff;font-size:15px;">Simplify your workflow</span>
          <span style="color:#94a3b8;font-size:14px;">Explore smarter ways to create links.</span>
        </div>
        <button class="topbar-upgrade-btn" style="background:linear-gradient(135deg, #10b981, #059669);" onclick="location.hash='#pricing'">
          👑 Upgrade to Core
        </button>
      </div>

      <!-- 2-Card Row: Connect your account & Hi Hayyam Ameer -->
      <div class="dash-row-2">
        <!-- Connect your account (Zapier) -->
        <div class="dash-white-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <h4 style="margin:0;color:#ffffff;">Connect your account</h4>
            <a href="#integrations" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;">Explore integrations →</a>
          </div>
          <p style="color:#94a3b8;margin:0 0 16px;font-size:13px;">Automation must-haves</p>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg, #ff4a00, #ff7a00);color:#ffffff;display:grid;place-items:center;font-weight:800;font-size:14px;">_z</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:#ffffff;">Zapier</div>
                <div style="font-size:12px;color:#94a3b8;">Add HEA Link into your workflows</div>
              </div>
            </div>
            <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;" onclick="window.appShell.toast('Zapier connected successfully!')">Connect</button>
          </div>
        </div>

        <!-- Hi Hayyam Ameer Progress -->
        <div class="dash-white-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
              <h4 style="margin:0 0 2px;color:#94a3b8;font-size:13px;font-weight:500;">Hi ${appUser.name},</h4>
              <h4 style="margin:0;color:#ffffff;font-size:18px;font-weight:800;">get started with HEA Link</h4>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:#10b981;font-weight:800;font-size:16px;">
              <span>67%</span>
              <svg width="26" height="26" viewBox="0 0 36 36"><path stroke="rgba(255,255,255,0.1)" stroke-width="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/><path stroke="#10b981" stroke-width="4" stroke-dasharray="67, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/></svg>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
            <div style="display:flex;align-items:center;gap:10px;color:#10b981;font-weight:600;">
              <span>✓</span> <span>Link shortened</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;color:#94a3b8;">
              <span style="width:14px;height:14px;border:2px dashed #64748b;border-radius:50%;display:inline-block;"></span>
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

  // ---------------- 2. CREATE A NEW LINK SCREEN (Screenshots 12.02.38 AM, 1, 2) ---------------- //
  function renderCreateLink(container) {
    container.innerHTML = `
      <div class="create-link-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="font-size:24px;font-weight:800;color:#ffffff;margin:0;">Create a new link</h2>
          <a href="#" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;" onclick="alert('Bulk upload is available on the Pro plan')">Bulk upload 📄</a>
        </div>

        <!-- 1. Link details card -->
        <div class="create-link-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;">Link details</h3>
            <span style="color:#94a3b8;font-size:16px;">⌃</span>
          </div>
          <div class="create-link-sub" style="margin-top:4px;">
            You have <b>4 links</b> and <b>3 custom back-halves</b> remaining this month. <a href="#pricing">Upgrade for more</a>.
          </div>

          <div class="create-link-field">
            <label>Destination URL</label>
            <input type="url" id="newDestUrl" placeholder="https://example.com/my-long-url" required>
          </div>

          <!-- Dynamic routing alert banner (Screenshot 12.02.38 AM) -->
          <div class="dynamic-routing-alert">
            <div style="display:flex;align-items:center;gap:10px;">
              <span>🔀</span>
              <span><b>Dynamic routing</b> — send visitors to different URLs based on device or location.</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <button class="sso-btn" style="width:auto;padding:4px 10px;font-size:12px;background:rgba(255,255,255,0.06);" onclick="alert('Dynamic routing rules manager opened')">Set it up</button>
              <button style="background:none;border:0;color:#93c5fd;cursor:pointer;font-size:16px;" onclick="this.closest('.dynamic-routing-alert').remove()">✕</button>
            </div>
          </div>

          <!-- Short link domain & back-half -->
          <div style="display:grid;grid-template-columns:1fr 20px 1.4fr;gap:12px;align-items:flex-end;margin-bottom:20px;">
            <div class="create-link-field" style="margin:0;">
              <label>Short link domain</label>
              <select id="newDomainSelect" class="home-domain-select" style="width:100%;">
                <option value="healink.store" selected>healink.store</option>
                <option value="bit.ly">bit.ly</option>
              </select>
            </div>
            <div style="padding-bottom:12px;text-align:center;font-size:18px;color:#64748b;">/</div>
            <div class="create-link-field" style="margin:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label>Back-half (optional)</label>
                <button type="button" class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;color:#38bdf8;" id="btnGenerateSlug">
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

          <div class="create-link-field" style="margin-bottom:0;">
            <label>Tags</label>
            <select id="newTagsSelect" class="home-domain-select" style="width:100%;">
              <option value="">Select tags</option>
              <option value="Website" selected>Website</option>
              <option value="Social">Social</option>
              <option value="Marketing">Marketing</option>
              <option value="Campaign">Campaign</option>
            </select>
          </div>
        </div>

        <!-- 2. Sharing options card with toggle switches (Screenshot 12.02.38 AM 2) -->
        <div class="create-link-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;">Sharing options</h3>
            <span style="color:#94a3b8;font-size:16px;">⌃</span>
          </div>

          <!-- Generate a QR Code toggle -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:20px;color:#D4FF24;">▦</span>
              <div>
                <b style="color:#ffffff;font-size:14px;">Generate a QR Code</b>
                <span style="font-size:12px;color:#94a3b8;margin-left:8px;">1 left</span>
              </div>
            </div>
            <label class="app-toggle-switch">
              <input type="checkbox" id="chkGenerateQR" checked>
              <span class="app-toggle-slider"></span>
            </label>
          </div>

          <!-- Add to a HEA Page toggle -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:20px;color:#38bdf8;">📄</span>
              <div>
                <b style="color:#ffffff;font-size:14px;">Add to a HEA Page</b>
                <div style="font-size:12px;color:#94a3b8;">Feature this link on your Link-in-Bio profile</div>
              </div>
            </div>
            <label class="app-toggle-switch">
              <input type="checkbox" id="chkAddToBio">
              <span class="app-toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- 3. Advanced settings accordion with crown features (Screenshot 12.02.38 AM 2) -->
        <div class="create-link-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;">Advanced settings</h3>
            <span style="color:#94a3b8;font-size:16px;">⌃</span>
          </div>

          <!-- UTM parameters -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:16px;color:#38bdf8;font-family:monospace;">{ }</span>
              <div>
                <b style="color:#ffffff;font-size:14px;">UTM parameters</b>
                <span style="color:#fbbf24;font-size:13px;margin-left:6px;">👑</span>
              </div>
            </div>
            <label class="app-toggle-switch">
              <input type="checkbox" id="chkUtmParams">
              <span class="app-toggle-slider"></span>
            </label>
          </div>

          <!-- Link expiration -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:18px;color:#94a3b8;">⏱️</span>
              <div>
                <b style="color:#ffffff;font-size:14px;">Link expiration</b>
                <span style="color:#fbbf24;font-size:13px;margin-left:6px;">👑</span>
              </div>
            </div>
            <label class="app-toggle-switch">
              <input type="checkbox" id="chkLinkExpiration">
              <span class="app-toggle-slider"></span>
            </label>
          </div>

          <!-- Dynamic routing toggle -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0 0;">
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <span style="font-size:18px;color:#38bdf8;margin-top:2px;">🔀</span>
              <div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <b style="color:#ffffff;font-size:14px;">Dynamic routing</b>
                  <span style="color:#fbbf24;font-size:13px;">👑</span>
                </div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;max-width:540px;line-height:1.4;">
                  Direct visitors to different destination URLs based on conditions such as device or location. Rules take priority from top to bottom.
                </div>
              </div>
            </div>
            <label class="app-toggle-switch">
              <input type="checkbox" id="chkDynamicRouting">
              <span class="app-toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Sticky bottom action bar -->
        <div class="sticky-bottom-actions">
          <button class="sso-btn" style="width:auto;padding:10px 22px;" onclick="window.appShell.navigate('home')">Cancel</button>
          <button class="auth-submit-btn" style="margin:0;padding:10px 26px;" id="btnSubmitNewLink">Create your link</button>
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
      const hasQR = $('#chkGenerateQR').checked;

      const links = getStoredLinks();
      const newL = {
        id: 'lnk_' + Date.now(),
        title: title,
        dest: dest,
        slug: slug,
        url: `https://${domain}/${slug}`,
        tag: tag,
        createdAt: 'Nov 1, 2026 8:30 PM PDT',
        clicks: 0,
        scans: 0,
        qr: hasQR
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
      scans: 0,
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
        <select class="home-domain-select"><option>Filter by tag</option><option>Website</option><option>Social</option></select>
      </div>

      <div>
        ${links.map(l => `
          <div class="qr-card-item">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="background:rgba(56,189,248,0.15);color:#38bdf8;font-weight:700;font-size:11px;padding:2px 8px;border-radius:4px;">${l.tag || 'Website'}</span>
                <span style="font-size:12px;color:#94a3b8;">${l.createdAt}</span>
              </div>
              <h4 style="margin:0 0 4px;font-size:16px;color:#ffffff;">${l.title}</h4>
              <a href="${l.url}" target="_blank" style="color:#38bdf8;font-weight:700;font-size:14px;text-decoration:none;">${l.url}</a>
              <div style="font-size:13px;color:#94a3b8;margin-top:4px;">↳ ${l.dest}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:13px;font-weight:700;color:#10b981;">${l.clicks || 0} clicks</span>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.copy('${l.url}')">📋 Copy</button>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.navigate('qr-detail', '${l.id}')">▦ QR</button>
              <button style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;" onclick="window.appShell.deleteLink('${l.id}')">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------- 4. QR CODES LIST SCREEN (Screenshot 12.02.39 AM) ---------------- //
  function renderQr(container) {
    const links = getStoredLinks();
    const primary = links[0] || {
      id: 'lnk_1',
      title: 'Untitled 2026-10-30',
      dest: 'https://claude.ai/chat/7f036851-018e-4d51-a859-3730634bb296',
      slug: '3WeOEOz',
      createdAt: 'Oct 30, 2026'
    };

    container.innerHTML = `
      <div class="view-header">
        <h2>QR Codes</h2>
        <button class="sidebar-create-btn" style="margin:0;" onclick="window.appShell.navigate('qr-detail', '${primary.id}')">
          Create code
        </button>
      </div>

      <div class="qr-filter-bar">
        <input type="text" class="topbar-search-input" style="flex:1;" placeholder="Search codes">
        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">📅 Filter by created date</button>
        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">⊞ Add filters</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">
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

      <!-- QR Card Items matching screenshot -->
      ${links.map((item, idx) => `
        <div class="qr-card-item">
          <div class="qr-card-left">
            <input type="checkbox">
            <div class="qr-framed-thumbnail" style="cursor:pointer;" onclick="window.appShell.navigate('qr-detail', '${item.id}')">
              <canvas id="qrCardCanvas_${idx}" width="160" height="160"></canvas>
              <div class="qr-thumb-label">SCAN ME</div>
            </div>
            <div class="qr-details">
              <span style="background:rgba(255,255,255,0.06);color:#38bdf8;font-weight:600;font-size:11px;padding:2px 8px;border-radius:4px;">🌐 ${item.tag || 'Website'}</span>
              <h4 style="cursor:pointer;" onclick="window.appShell.navigate('qr-detail', '${item.id}')">${item.title}</h4>
              <div class="qr-dest-text">↳ ${item.dest}</div>
              <div class="qr-meta-row">
                <span>👑 ${item.scans || 0} scans</span>
                <span>📅 ${item.createdAt}</span>
                <span>🔗 healink.store/${item.slug}</span>
                <span>🏷 No tags</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;color:#94a3b8;">
            <button class="topbar-icon-btn" title="Edit & Customize" onclick="window.appShell.navigate('qr-detail', '${item.id}')">✏️</button>
            <button class="topbar-icon-btn" title="Download" onclick="window.appShell.downloadQrPNG('${item.slug}')">📥</button>
            <button class="topbar-icon-btn" title="Stats" onclick="window.appShell.navigate('analytics')">📊</button>
            <button class="topbar-icon-btn" title="More">···</button>
          </div>
        </div>
      `).join('')}

      <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">
        — You've reached the end of your QR codes —
      </div>
    `;

    setTimeout(() => {
      links.forEach((item, idx) => {
        const cv = $(`#qrCardCanvas_${idx}`);
        if (cv && typeof window.drawQR === 'function') {
          window.drawQR(cv, `https://healink.store/${item.slug}`, appUser.selectedQrColor || '#ff007f', '#ffffff', 160);
        }
      });
    }, 50);
  }

  // ---------------- 5. QR CODE DETAILS & STUDIO (Screenshots 12.02.39 AM 1, 2, 3) ---------------- //
  function renderQrDetail(container, linkId) {
    activeQrId = linkId || 'lnk_1';
    const links = getStoredLinks();
    const item = links.find(l => l.id === activeQrId) || links[0] || {
      id: 'lnk_1',
      title: 'Untitled 2026-10-30',
      dest: 'https://claude.ai/chat/7f036851-018e-4d51-a859-3730634bb296',
      slug: '3WeOEOz',
      tag: 'Website',
      createdAt: 'October 30, 2026 7:28 AM PDT',
      scans: 4
    };

    container.innerHTML = `
      <!-- Header row matching Screenshot 12.02.39 AM 2 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:14px;" onclick="window.appShell.navigate('qr')">←</button>
          <h2 style="font-size:24px;font-weight:800;color:#ffffff;margin:0;">${item.title}</h2>
          <button class="topbar-icon-btn" title="Edit title" onclick="alert('Editing QR code title')">✏️</button>
          <button class="topbar-icon-btn" title="More">···</button>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="auth-submit-btn" style="margin:0;padding:10px 20px;display:flex;align-items:center;gap:8px;" onclick="window.appShell.downloadQrPNG('${item.slug}')">
            <span>📥</span> Download PNG
          </button>
        </div>
      </div>

      <!-- 2-Column Row: Details + QR Preview -->
      <div class="qr-detail-layout">
        <!-- Left: Details card (Screenshot 12.02.39 AM 2) -->
        <div class="dash-white-card">
          <h3 style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 18px;">Details</h3>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Scan destination</div>
            <div style="display:flex;align-items:center;gap:8px;color:#ffffff;font-size:14px;font-weight:600;">
              <span>🌐</span> Website / URL
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Destination</div>
            <div style="color:#38bdf8;font-size:13px;word-break:break-all;">↳ ${item.dest}</div>
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Short link</div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#ffffff;font-size:14px;font-weight:700;">healink.store/${item.slug}</span>
              <button class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;" onclick="window.appShell.copy('https://healink.store/${item.slug}')">📋 Copy</button>
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Tags</div>
            <div style="color:#94a3b8;font-size:13px;">🏷️ ${item.tag || 'No tags'}</div>
          </div>

          <div>
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Created on</div>
            <div style="color:#cbd5e1;font-size:13px;">${item.createdAt}</div>
          </div>
        </div>

        <!-- Right: Frame Preview + Customize (Screenshot 12.02.39 AM 2) -->
        <div class="qr-preview-box">
          <div class="qr-framed-thumbnail" style="width:180px;padding:12px 12px 6px;margin-bottom:16px;">
            <canvas id="qrDetailCanvas" width="200" height="200"></canvas>
            <div class="qr-thumb-label" style="font-size:13px;margin-top:6px;">SCAN ME</div>
          </div>

          <!-- Color Customizer -->
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">
            <span style="font-size:12px;color:#94a3b8;">Brand Color:</span>
            ${['#ff007f', '#38bdf8', '#D4FF24', '#ffffff', '#ff9900'].map(c => `
              <button class="color-dot" style="width:20px;height:20px;border-radius:50%;background:${c};border:2px solid ${appUser.selectedQrColor === c ? '#ffffff' : 'transparent'};cursor:pointer;" onclick="window.appShell.changeQrColor('${c}')"></button>
            `).join('')}
          </div>

          <button class="sso-btn" style="width:auto;padding:8px 20px;color:#38bdf8;border-color:rgba(56,189,248,0.3);font-weight:600;margin-bottom:14px;" onclick="window.appShell.toast('Custom QR design saved!')">
            🎨 Customize frame &amp; colors
          </button>

          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
            <span style="color:#ffffff;font-size:13px;font-weight:700;">healink.store/${item.slug}</span>
            <span style="color:#94a3b8;cursor:pointer;">···</span>
          </div>
        </div>
      </div>

      <!-- Dynamic routing section (Screenshot 12.02.39 AM 3) -->
      <div class="dash-white-card" style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 6px;">Dynamic routing</h3>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Automatically route visitors to different destinations based on device, location, and more.</p>
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 18px;font-weight:600;" onclick="alert('Rules manager: Add device or GEO redirect rules')">
            + Add rules
          </button>
        </div>
      </div>

      <!-- Code analytics & chart (Screenshot 12.02.39 AM 3) -->
      <div class="dash-white-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 4px;">Code analytics — ${item.dest.slice(0, 45)}...</h3>
            <a href="#analytics" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;">⇄ Switch to all links</a>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;">📅 Time Period: Last 7 days</button>
            <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;color:#fbbf24;border-color:rgba(251,191,36,0.3);">
              👑 Compare to a QR Code ↗
            </button>
            <button class="topbar-icon-btn" title="Export data">📥</button>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:700;color:#ffffff;">Scans over time</span>
          <span class="verified-tag" style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);font-size:10px;padding:3px 8px;">👑 UPGRADE</span>
        </div>

        <!-- SVG Neon Wave Graph -->
        <div class="qr-wave-container">
          <svg viewBox="0 0 800 180" style="width:100%;height:100%;overflow:visible;">
            <defs>
              <linearGradient id="qrWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
            <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
            <line x1="0" y1="160" x2="800" y2="160" stroke="rgba(255,255,255,0.06)"/>
            <path d="M 0 150 Q 150 140, 250 80 T 500 120 T 750 40 L 800 60 L 800 170 L 0 170 Z" fill="url(#qrWaveGrad)"/>
            <path d="M 0 150 Q 150 140, 250 80 T 500 120 T 750 40 L 800 60" fill="none" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="250" cy="80" r="5" fill="#38bdf8"/>
            <circle cx="750" cy="40" r="5" fill="#D4FF24"/>
          </svg>
        </div>
      </div>
    `;

    setTimeout(() => {
      const cv = $('#qrDetailCanvas');
      if (cv && typeof window.drawQR === 'function') {
        window.drawQR(cv, `https://healink.store/${item.slug}`, appUser.selectedQrColor || '#ff007f', '#ffffff', 200);
      }
    }, 50);
  }

  function changeQrColor(c) {
    appUser.selectedQrColor = c;
    const cv = $('#qrDetailCanvas');
    if (cv && typeof window.drawQR === 'function') {
      window.drawQR(cv, `https://healink.store/3WeOEOz`, c, '#ffffff', 200);
    }
    toast(`QR code color updated to ${c}`);
  }

  // ---------------- 6. PAGES SCREEN (Screenshot 12.02.40 AM) ---------------- //
  function renderPages(container) {
    const pages = getStoredPages();
    const p = pages[0] || {
      slug: 'hgrgferf',
      url: 'healink.store/m/hgrgferf',
      createdAt: 'Oct 30, 2026'
    };

    container.innerHTML = `
      <div class="view-header">
        <h2>HEA Pages</h2>
        <button class="sidebar-create-btn" style="margin:0;" onclick="alert('Create new page dialog')">
          Create Page
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <input type="text" class="topbar-search-input" style="max-width:320px;" placeholder="🔍 Search pages">
        <span style="font-size:13px;color:#94a3b8;">Your plan includes <b>1 more page</b> <span title="Free plan limit">❓</span></span>
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
            <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 6px;">${p.url}</h3>
            <div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">Created ${p.createdAt} • Update date unavailable</div>
            <div style="display:flex;gap:16px;font-size:13px;color:#cbd5e1;">
              <span>📊 <b>${p.views || 0}</b> views</span>
              <span>🎯 <b>${p.engagements || 0}</b> engagements</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="background:rgba(245,158,11,0.15);color:#fbbf24;font-size:12px;font-weight:700;padding:4px 10px;border-radius:4px;border:1px solid rgba(245,158,11,0.3);">
            Unpublished changes. <u style="cursor:pointer;" onclick="window.appShell.toast('Page published!')">Publish?</u>
          </span>
          <button class="topbar-icon-btn" title="Edit" onclick="location.hash='#bio'">✏️</button>
          <button class="topbar-icon-btn" title="Analytics" onclick="window.appShell.navigate('analytics')">📊</button>
          <button class="topbar-icon-btn" title="More">···</button>
        </div>
      </div>

      <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">
        — You've reached the end of your Pages —
      </div>
    `;
  }

  // ---------------- 7. ANALYTICS SCREEN (Screenshots 12.02.40 AM 1, 12.02.41 AM) ---------------- //
  function renderAnalytics(container) {
    container.innerHTML = `
      <div class="view-header">
        <h2>Analytics</h2>
        <button class="sso-btn" style="width:auto;padding:8px 16px;color:#38bdf8;border-color:rgba(56,189,248,0.4);font-weight:700;">
          ✨ Analyze with AI
        </button>
      </div>

      <!-- Cyan Upgrade banner -->
      <div class="home-cyan-banner" style="display:flex;margin-bottom:24px;width:100%;">
        <span>👑</span>
        <span><a href="#pricing">Upgrade</a> to view performance data, uncover themes, and get actionable insights.</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="font-size:18px;font-weight:800;color:#ffffff;margin:0;">Dashboards</h4>
        <a href="#" style="color:#38bdf8;font-size:13px;font-weight:700;text-decoration:none;">View all →</a>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;">
        <div class="dash-white-card" style="display:flex;align-items:center;justify-content:center;min-height:100px;cursor:pointer;border-style:dashed;border-color:rgba(255,255,255,0.15);" onclick="alert('Create custom dashboard opened')">
          <span style="font-size:16px;font-weight:700;color:#94a3b8;">+ Create dashboard</span>
        </div>
        <div class="dash-white-card" style="display:flex;align-items:center;gap:16px;cursor:pointer;">
          <div style="width:40px;height:40px;background:rgba(56,189,248,0.15);border-radius:8px;display:grid;place-items:center;font-size:20px;color:#38bdf8;">📊</div>
          <div>
            <div style="font-weight:700;font-size:15px;color:#ffffff;">Preview dashboard</div>
            <div style="font-size:12px;color:#94a3b8;">Modified on Jan 15, 2026</div>
          </div>
        </div>
      </div>

      <!-- Last week's insights -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="font-size:18px;font-weight:800;color:#ffffff;margin:0;">Last week's insights</h4>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#94a3b8;">
          <span>📅 Oct 19 - Oct 25, 2026</span>
          <span style="cursor:pointer;" title="Download report">📥</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div class="dash-white-card">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px;">🌐 CHANNEL</div>
          <div style="font-size:14px;color:#cbd5e1;">Traffic from <b>Direct Traffic</b> dropped slightly compared to the week before.</div>
        </div>
        <div class="dash-white-card">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px;">🏆 LINK</div>
          <div style="font-size:14px;color:#cbd5e1;"><b>Summer Launch</b> was up <b>28%</b> in traffic compared to the week before.</div>
        </div>
      </div>
    `;
  }

  // ---------------- 8. CAMPAIGNS SCREEN (Screenshot 12.02.41 AM 1) ---------------- //
  function renderCampaigns(container) {
    container.innerHTML = `
      <div class="campaigns-hero-wrap">
        <div class="campaigns-laptop-illus">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;color:#ffffff;">
            <span>Fall Promo</span>
            <span style="color:#94a3b8;">4 Channels | 40 Links</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;text-align:left;font-size:11px;">
            <div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:#cbd5e1;">TikTok</div>
            <div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:#cbd5e1;">Direct Mail QR Codes</div>
            <div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:#cbd5e1;">YouTube</div>
            <div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:#cbd5e1;">Newsletters</div>
          </div>
        </div>

        <h3>Some links belong together</h3>
        <p>Organize your links in HEA Campaigns and compare performance across channels. Available on the Premium plan.</p>

        <button class="auth-submit-btn" style="width:max-content;margin:0 auto 12px;padding:12px 28px;" onclick="location.hash='#pricing'">
          View our plans
        </button>
        <div>
          <a href="#" style="color:#38bdf8;font-size:13px;text-decoration:none;" onclick="alert('Campaign guides opened')">Learn more</a>
        </div>
      </div>
    `;
  }

  // ---------------- 9. CUSTOM DOMAINS SCREEN (Screenshot 12.02.41 AM 2) ---------------- //
  function renderDomains(container) {
    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:28px;font-weight:800;color:#ffffff;margin:0 0 16px;">Brand your links with a custom domain</h2>
      </div>

      <!-- Cyan Graphic Card -->
      <div class="domains-cyan-card">
        <div style="background:#090f22;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:#64748b;text-decoration:line-through;margin-bottom:8px;">healink.store/2BN6kd</div>
          <div style="background:linear-gradient(135deg, #0066ff, #00d2ff);color:#ffffff;font-weight:800;font-size:14px;padding:6px 12px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px;">
            <span>yourbrand.co/link</span> <span>✓</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:#cbd5e1;">
          <div>✓ Replace generic domains in your short links with your own unique domain</div>
          <div>✓ Help people recognize and trust your links</div>
          <div>✓ Build brand awareness and get up to 2.3x times more clicks</div>
        </div>
      </div>

      <div class="domains-pill-tabs">
        <button class="home-type-tab" type="button" onclick="alert('Domain lookup search')">🔍 Search for a domain</button>
        <button class="home-type-tab active" type="button">✨ Find a domain with AI</button>
      </div>

      <div class="dash-white-card" style="padding:20px;">
        <textarea id="aiDomainPrompt" class="domain-ai-textarea" placeholder="e.g. A New York daily newspaper covering global news"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="font-size:12px;color:#64748b;">Describe your idea, product or service (0/200)</span>
          <button class="sso-btn" style="width:auto;padding:8px 20px;background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.3);color:#c084fc;font-weight:700;" onclick="window.appShell.toast('Found 3 available branded domains: nykdaily.link, nyglobal.press, dailynews.co')">
            ✨ Generate
          </button>
        </div>
      </div>
    `;
  }

  // ---------------- 10. INTEGRATIONS SCREEN (Screenshots 12.02.42 AM, 1) ---------------- //
  function renderIntegrations(container) {
    const apps = [
      { name: 'Adobe Express', desc: 'Add short links and QR Codes to your designs without switching apps', icon: '🎨' },
      { name: 'Authvia', desc: 'Turn text messages into a payment channel with trackable short links', icon: '💳' },
      { name: 'HEA app for Android', desc: 'Create and share short links from your Android phone', icon: '🤖' },
      { name: 'HEA app for iPhone', desc: 'Create, share, and track from your iPhone or iPad', icon: '🍏' },
      { name: 'HEA Model Context Protocol (MCP)', desc: 'Get the full power of HEA Link inside any AI assistant', icon: '⚙️' },
      { name: 'Blog2Social', desc: 'Automatically generate short links for your social posts and manage in one place', icon: '🔄' }
    ];

    container.innerHTML = `
      <div class="view-header">
        <h2>Integrations</h2>
        <a href="#" style="color:#38bdf8;font-size:14px;font-weight:700;text-decoration:none;">Manage my integrations</a>
      </div>

      <!-- Shopify Banner (Screenshot 12.02.42 AM) -->
      <div class="shopify-cream-banner">
        <div>
          <div style="font-size:28px;font-weight:900;color:#96bf48;margin-bottom:12px;">🛍️ shopify</div>
          <h3 style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 10px;">Automatically attribute orders to specific HEA links</h3>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 18px;">
            Shorten links to products, collections, and more directly from Shopify to identify which campaigns generate real ROI.
          </p>
          <button class="sso-btn" style="width:auto;padding:10px 20px;font-weight:700;" onclick="window.appShell.toast('Shopify app integration opened')">
            Install Shopify app
          </button>
        </div>
        <div style="background:#090f22;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;color:#94a3b8;">
            <span>Link title</span>
            <span>Short link</span>
            <span>Orders</span>
          </div>
          <div style="font-size:12px;color:#cbd5e1;padding:6px 0;">Maven Armchair • yourbrand.co/3yt77uB • 3</div>
          <div style="font-size:12px;color:#cbd5e1;padding:6px 0;">Floral Accent Chair • yourbrand.co/instagram • 56</div>
          <div style="text-align:right;font-size:18px;font-weight:900;color:#10b981;margin-top:10px;">$26,880.00</div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <input type="text" class="topbar-search-input" style="max-width:320px;" placeholder="🔍 Search by name or category">
        <span style="font-size:13px;color:#94a3b8;cursor:pointer;">A - Z ⇅</span>
      </div>

      <!-- Filter pills (Screenshot 12.02.42 AM 1) -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:20px;">
        ${['Featured', 'AI', 'Analytics & Attribution', 'Automation', 'Browser Extensions', 'Creative', 'CRM & Sales', 'Email Marketing', 'Mobile App'].map((p, i) => `
          <button class="home-type-tab ${i === 0 ? 'active' : ''}" style="white-space:nowrap;padding:6px 14px;font-size:12px;">${p}</button>
        `).join('')}
      </div>

      <!-- Apps Grid (Screenshot 12.02.42 AM 1) -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;">
        ${apps.map(a => `
          <div class="integration-card-white">
            <div style="font-size:28px;margin-bottom:12px;">${a.icon}</div>
            <h4 style="font-size:16px;font-weight:700;color:#ffffff;margin:0 0 6px;">${a.name}</h4>
            <p style="color:#94a3b8;font-size:13px;line-height:1.4;margin:0;">${a.desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------- 11. SETTINGS SCREEN (Screenshots 12.02.42 AM 2, 3, 12.02.43 AM, 1) ---------------- //
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
            <div style="font-size:12px;color:#94a3b8;padding:0 12px 6px;">${appUser.orgId}</div>
            <a class="settings-subsidebar-link" onclick="alert('Account details')">Account details</a>
            <a class="settings-subsidebar-link" onclick="location.hash='#pricing'">Billing and usage</a>
            <a class="settings-subsidebar-link" onclick="alert('Team users')">Users</a>
            <a class="settings-subsidebar-link" onclick="alert('Groups')">Groups</a>
            <a class="settings-subsidebar-link" onclick="alert('Single sign-on config')">Single sign-on</a>
            <a class="settings-subsidebar-link" onclick="alert('Account discovery')">Account discovery</a>
            <a class="settings-subsidebar-link" onclick="alert('Mobile deep links')">Mobile deep links</a>
          </div>
        </div>

        <!-- Settings Main Pane -->
        <div class="settings-main-panel">
          <h2 style="font-size:32px;font-weight:800;color:#ffffff;margin:0 0 16px;">Profile</h2>

          <!-- Preferences (Screenshot 12.02.42 AM 2) -->
          <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 14px;">Preferences</h3>

          <div class="create-link-field">
            <label>Display name</label>
            <input type="text" id="setDisplayName" value="${appUser.name}">
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:28px;" onclick="window.appShell.updateDisplayName()">
            Update display name
          </button>

          <div class="create-link-field">
            <label>Language</label>
            <div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">
              HEA Link uses your browser's language by default. Select a language below to override this setting. Applies to your HEA Link experience, emails you receive from HEA Link, and emails sent on your behalf.
            </div>
            <select class="home-domain-select" style="max-width:320px;">
              <option selected>Automatic</option>
              <option>English</option>
              <option>Urdu</option>
            </select>
          </div>
          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:32px;" onclick="window.appShell.toast('Language preference saved')">
            Update language
          </button>

          <div class="settings-section-divider"></div>

          <!-- Email addresses table (Screenshot 12.02.42 AM 3) -->
          <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 8px;">Email addresses</h3>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">
            Select or add a new email address to receive notifications. Only verified emails can be designated as the primary email address, which is used to log in.
          </p>

          <table class="settings-email-table">
            <thead>
              <tr>
                <th>Email address</th>
                <th>Status</th>
                <th>Primary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>${appUser.email}</b></td>
                <td><span style="color:#10b981;font-size:13px;font-weight:700;">✓ Verified</span></td>
                <td><input type="radio" name="primaryEmail" checked style="accent-color:#0066ff;"></td>
              </tr>
            </tbody>
          </table>

          <div style="display:flex;gap:12px;margin-bottom:32px;">
            <button class="sso-btn" style="width:auto;padding:8px 16px;" onclick="alert('Add new email modal')">Add new email</button>
            <button class="auth-submit-btn" style="margin:0;padding:8px 18px;" onclick="window.appShell.toast('Primary email updated')">Update primary email</button>
          </div>

          <div class="settings-section-divider"></div>

          <!-- Security & Authentication (Screenshots 12.02.42 AM 3, 12.02.43 AM) -->
          <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 8px;">Security &amp; authentication</h3>

          <h4 style="font-size:16px;font-weight:700;color:#ffffff;margin:16px 0 6px;">Change password</h4>
          <div style="font-size:13px;color:#94a3b8;margin-bottom:14px;">You will be required to login after changing your password</div>

          <div class="create-link-field"><label>Current password</label><input type="password" placeholder="••••••••"></div>
          <div class="create-link-field"><label>New password</label><input type="password" placeholder="••••••••"></div>
          <div class="create-link-field"><label>Confirm new password</label><input type="password" placeholder="••••••••"></div>
          <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('Password changed successfully')">
            Change password
          </button>

          <div class="settings-section-divider"></div>

          <!-- 2-Factor Authentication (Screenshot 12.02.43 AM) -->
          <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 14px;">2-Factor authentication</h3>
          <div class="create-link-field">
            <label>Select country code</label>
            <select class="home-domain-select" style="max-width:320px;">
              <option selected>Pakistan (+92)</option>
              <option>United States (+1)</option>
              <option>United Kingdom (+44)</option>
              <option>United Arab Emirates (+971)</option>
            </select>
          </div>

          <div class="settings-section-divider"></div>

          <!-- Active Sessions (Screenshot 12.02.43 AM 1) -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0;">Active Sessions</h3>
            <button class="auth-submit-btn" style="margin:0;padding:8px 16px;font-size:13px;" onclick="window.appShell.toast('Logged out of all other sessions')">
              Log out of all sessions
            </button>
          </div>

          <div style="font-size:13px;color:#ffffff;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <b>Email Address Added</b>: ${appUser.email} <span style="float:right;color:#94a3b8;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#94a3b8;font-size:12px;margin-top:2px;">(${appUser.isp}) (PK, PB, ${appUser.city})</div>
          </div>
          <div style="font-size:13px;color:#ffffff;padding:12px 0;">
            <b>Log In</b> <span style="float:right;color:#94a3b8;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#94a3b8;font-size:12px;margin-top:2px;">(${appUser.isp}) (PK, PB, ${appUser.city})</div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- SAR Report (Screenshot 12.02.43 AM 1) -->
          <h3 style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 8px;">SAR Report</h3>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;line-height:1.5;">
            Click to request a Subject Access Request (SAR) Report of all your Personal Information stored by HEA Link. Once requested, in compliance with your local regulations, we will reply to your request via email.
          </p>
          <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('SAR Report request submitted')">
            Request report
          </button>

          <div class="settings-section-divider"></div>

          <!-- Delete account (Screenshot 12.02.43 AM 1) -->
          <button class="auth-submit-btn" style="background:#dc2626 !important;width:max-content;padding:10px 24px;" onclick="if(confirm('Are you sure you want to delete your account?')){ localStorage.clear(); location.hash='#login'; location.reload(); }">
            Delete account
          </button>
        </div>
      </div>
    `;
  }

  // ---------------- MODAL & DRAWER CONTROLS ---------------- //
  function openWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = false;
  }
  function closeWhatModal() {
    const modal = $('#whatModal');
    if (modal) modal.hidden = true;
  }

  function downloadQrPNG(slug) {
    const cv = $('#qrDetailCanvas') || $('#qrCardCanvas_0') || $('#qrScanMeCanvas');
    if (cv) {
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = `healink-qr-${slug || 'code'}.png`;
      a.click();
      toast('Downloaded high-resolution SCAN ME QR code (PNG)!');
    } else {
      toast('Downloaded high-resolution SCAN ME QR code (PNG)!');
    }
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
      const sName = $('#sidebarUserName');
      if (sName) sName.textContent = n;
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

  // ---------------- HEA ASSIST AI INTERACTIVITY ---------------- //
  function setupAssistChat() {
    const form = $('#drawerChatForm');
    const input = $('#drawerChatInput');
    const log = $('#drawerChatLog');
    if (!form || !input || !log) return;

    function handleUserPrompt(promptText) {
      if (!promptText) return;
      // Add user bubble
      const uMsg = document.createElement('div');
      uMsg.className = 'drawer-chat-bubble user';
      uMsg.textContent = promptText;
      log.appendChild(uMsg);

      // AI Response logic
      setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'drawer-chat-bubble ai';

        const lower = promptText.toLowerCase();
        if (lower.includes('title') || lower.includes('catchy')) {
          aiMsg.innerHTML = `✨ Here are 3 high-converting title suggestions for your link:<br><b>1. "Exclusive Summer Drop 2026 — Limited VIP Access"</b><br><b>2. "The Ultimate Resource Guide (Free Download)"</b><br><b>3. "Join 10k+ Creators Scaling with HEA Link"</b>`;
        } else if (lower.includes('utm') || lower.includes('facebook') || lower.includes('fb')) {
          aiMsg.innerHTML = `🎯 Generated UTM parameters for Facebook Ad:<br><code>?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_launch_2026&utm_content=carousel_v1</code>`;
        } else if (lower.includes('scan') || lower.includes('more qr')) {
          aiMsg.innerHTML = `📱 <b>Top 3 tips to boost QR scans:</b><br>1. Always use a clear CTA like <i>"Scan for 20% Off"</i> or <i>"Scan to Order"</i>.<br>2. Ensure contrast is high (Neon cyan or magenta on dark surface).<br>3. Place QR codes at eye level on posters and packaging.`;
        } else if (lower.includes('bio') || lower.includes('page')) {
          aiMsg.innerHTML = `📄 <b>Best practices for your HEA Page:</b><br>• Put your primary conversion goal in the top button.<br>• Add verified social icons to build instant trust.<br>• Keep your bio short and benefit-driven.`;
        } else {
          aiMsg.innerHTML = `✨ I analyzed your request: <i>"${promptText}"</i>.<br>Everything looks optimized! You can create short links, customize QR codes, or check click analytics from your sidebar anytime.`;
        }
        log.appendChild(aiMsg);
        log.scrollTop = log.scrollHeight;
      }, 400);

      input.value = '';
      log.scrollTop = log.scrollHeight;
    }

    form.onsubmit = e => {
      e.preventDefault();
      const val = input.value.trim();
      if (val) handleUserPrompt(val);
    };

    $$('.drawer-chip-btn').forEach(btn => {
      btn.onclick = () => {
        handleUserPrompt(btn.dataset.prompt);
      };
    });
  }

  // ---------------- INITIALIZATION ---------------- //
  function init() {
    // Sidebar nav clicks
    $$('#sidebarNav .sidebar-nav-item').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        location.hash = (tab === 'home') ? '#dashboard' : '#' + tab;
        navigate(tab);
      };
    });

    // Sidebar collapse toggle (Screenshot 12.02.42 AM 1)
    const collapseBtn = $('#sidebarCollapseBtn');
    const sidebar = $('#appSidebar');
    if (collapseBtn && sidebar) {
      collapseBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
        collapseBtn.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
        collapseBtn.title = sidebar.classList.contains('collapsed') ? 'Expand sidebar' : 'Collapse sidebar';
      };
    }

    const createBtn = $('#sidebarCreateBtn');
    if (createBtn) createBtn.onclick = openWhatModal;

    const modalClose = $('#whatModalClose');
    if (modalClose) modalClose.onclick = closeWhatModal;

    const whatModal = $('#whatModal');
    if (whatModal) {
      whatModal.onclick = e => { if (e.target === whatModal) closeWhatModal(); };
    }

    const optL = $('#optCreateLink');
    if (optL) optL.onclick = () => { closeWhatModal(); location.hash = '#create-link'; navigate('create-link'); };

    const optQ = $('#optCreateQR');
    if (optQ) optQ.onclick = () => { closeWhatModal(); location.hash = '#qr'; navigate('qr'); };

    const optP = $('#optCreatePage');
    if (optP) optP.onclick = () => { closeWhatModal(); location.hash = '#pages'; navigate('pages'); };

    // Keyboard shortcuts L & Q for modal options
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (whatModal && !whatModal.hidden) {
        if (e.key === 'l' || e.key === 'L') { closeWhatModal(); location.hash = '#create-link'; navigate('create-link'); }
        if (e.key === 'q' || e.key === 'Q') { closeWhatModal(); location.hash = '#qr'; navigate('qr'); }
      }
    });

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

    setupAssistChat();

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

    // Route sync on hashchange
    const syncRouteFromHash = () => {
      const raw = (location.hash.slice(1) || '').split('?')[0];
      const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'app'];
      if (appViews.includes(raw)) {
        const tab = (raw === 'dashboard' || raw === 'app') ? 'home' : raw;
        navigate(tab);
      }
    };
    window.addEventListener('hashchange', syncRouteFromHash);

    // Initial render
    syncRouteFromHash();
    const pane = $('#appMainPane');
    if (pane && !pane.innerHTML.trim()) {
      navigate('home');
    }
  }

  window.appShell = {
    navigate,
    openWhatModal,
    closeWhatModal,
    downloadQrPNG,
    changeQrColor,
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
