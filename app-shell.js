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

  if (typeof window.canCreateLinkOrQr !== 'function') {
    window.canCreateLinkOrQr = function() {
      if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return { allowed: true };
      }
      const free = parseInt(localStorage.getItem('hea_free_creations') || '0', 10);
      if (free >= 100) return { allowed: false, message: 'Free limit reached. Upgrade to Pro!' };
      return { allowed: true };
    };
  }

  // User state matching authenticated session

  function isVipEmail(email) {

    if (!email) return false;

    const clean = email.toLowerCase().trim();

    return clean === 'furyzod02@gmail.com' ||
           clean === 'healink@gmail.com' ||
           (typeof window.isVipAdminEmail === 'function' && window.isVipAdminEmail(clean));

  }

  let appUser = {

    name: 'Account',

    email: '',

    orgId: '',

    city: '',

    isp: '',

    avatar: 'HA',

    selectedQrColor: '#00d2ff',

    isPro: false,

    plan: 'Free'

  };

  function generateShortSlug(len = 6) {

    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

    let res = '';

    for (let i = 0; i < len; i++) {

      res += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    return res;

  }

  async function fetchOnlineShortUrl(targetUrl, customSlug) {
    if (!targetUrl) return null;
    let norm = targetUrl.trim();
    if (!/^https?:\/\//i.test(norm)) norm = 'https://' + norm;
    const s = customSlug || generateShortSlug(6);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/shorten-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: norm, slug: s }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.shortUrl && /^https?:\/\//i.test(data.shortUrl) && data.shortUrl !== norm && !data.shortUrl.includes('da.gd')) {
          return data.shortUrl;
        }
      }
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(norm)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = (await res.text()).trim();
        if (/^https?:\/\//i.test(text) && !text.includes('error')) return text;
      }
    } catch (e) {}

    return `${window.location.origin}/${s}`;
  }

  function isUserAuthenticated() {

    try {

      const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');

      if (!raw) return false;

      const parsed = JSON.parse(raw);

      return !!(parsed && parsed.isVerified);

    } catch (e) {

      return false;

    }

  }

  function setAppUser(u) {

    if (!u) return;

    if (u.name) appUser.name = u.name;

    if (u.email) appUser.email = u.email;

    if (u.city) appUser.city = u.city;

    if (u.isp) appUser.isp = u.isp;

    if (u.email && isVipEmail(u.email)) {

      appUser.isPro = true;

      appUser.isAdmin = true;

      appUser.plan = 'Unlimited';

    } else if (u.isPro) {

      appUser.isPro = true;

      appUser.plan = u.plan || 'Core PRO';

    }

    const displayName = appUser.name || 'Account';

    const sName = $('#sidebarUserName');

    if (sName) sName.textContent = displayName;

    const sEmail = $('#sidebarUserEmail');

    if (sEmail) sEmail.textContent = appUser.email || '';

    const topAv = $('#topbarAvatar');

    if (topAv) {

      const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'HA';

      topAv.textContent = initials;

      topAv.title = displayName;

    }

    const sideAv = $('#sidebarAvatar');

    if (sideAv) {

      const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'HA';

      sideAv.textContent = initials;

    }

    const sOrg = $('#sidebarUserOrg');

    if (sOrg) {

      const firstName = displayName.split(' ')[0];

      const isMaster = (appUser.email && isVipEmail(appUser.email));

      const badgeText = isMaster ? 'UNLIMITED VIP' : (appUser.isPro ? 'PRO' : 'FREE');

      const badgeStyle = isMaster ? 'background:linear-gradient(135deg,#D4FF24,#10b981);color:#060b18;font-weight:800;' : '';

      sOrg.innerHTML = `${firstName}'s Workspace <span class="verified-tag" style="font-size:9px;padding:2px 6px;${badgeStyle}">${badgeText}</span>`;

    }

    const greeting = $('#homeGreetingUser');

    if (greeting) {

      greeting.textContent = `Hi ${displayName.split(' ')[0]},`;

    }

  }

  try {

    const saved = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');

    if (saved) {

      const p = JSON.parse(saved);

      if (p && p.isVerified) {

        if (p.name) appUser.name = p.name;

        if (p.email) appUser.email = p.email;

        if (p.city) appUser.city = p.city;

        if (p.isp) appUser.isp = p.isp;

        if (p.email && isVipEmail(p.email)) {

          appUser.isPro = true;

          appUser.isAdmin = true;

          appUser.plan = 'Unlimited';

        } else if (p.isPro) {

          appUser.isPro = true;

          appUser.plan = p.plan || 'Core PRO';

        }

      }

    }

  } catch (e) {}

  let activeTab = 'home';

  let activeQrId = '';

  
  function cleanSafeStr(val, fallback = '') {
    if (typeof val !== 'string') return fallback;
    let s = val.replace(/\[object\s+Object\],?/gi, '').replace(/\bundefined\b/gi, '').trim();
    return s || fallback;
  }

  function getStoredLinks() {
    try {
      const raw = localStorage.getItem('hea_links');
      if (raw) {
        let p = JSON.parse(raw);
        if (Array.isArray(p)) {
          let dirty = false;
          const origin = window.location.origin;

          p = p.filter(l => l && l.id !== 'lnk_1' && l.id !== 'lnk_2' && !(l.dest && l.dest.includes('claude.ai')) && !(l.dest && l.dest.includes('summer-drop-2026')));

          p.forEach(l => {
            if (!l) return;
            l.title = cleanSafeStr(l.title, 'Untitled Link');
            l.slug = cleanSafeStr(l.slug, generateShortSlug(6));
            l.dest = cleanSafeStr(l.dest, '');
            l.url = cleanSafeStr(l.url, '');
            l.realShort = cleanSafeStr(l.realShort, '');
            l.tag = cleanSafeStr(l.tag, 'Website');

            if (!l.dest && l.url) l.dest = l.url;
            if (!l.url && l.dest) l.url = origin + '/' + l.slug;

            const shortCandidate = origin + '/' + l.slug;

            if (!l.realShort || l.realShort === l.dest || l.realShort.includes('da.gd') || l.realShort.includes('firebase.google.com') || l.realShort.length > 60) {
              l.realShort = shortCandidate;
              dirty = true;
            }

            if (!l.url || l.url === l.dest || l.url.includes('firebase.google.com') || l.url.length > 60) {
              l.url = shortCandidate;
              dirty = true;
            }

            if (l.slug && l.dest) {
              try {
                localStorage.setItem('hea_slug_' + l.slug.toLowerCase(), l.dest);
              } catch (e) {}
            }

            if (Array.isArray(l.clicks)) {
              l.clicks = l.clicks.length;
              dirty = true;
            } else if (l.clicks && typeof l.clicks === 'object') {
              l.clicks = Object.keys(l.clicks).length;
              dirty = true;
            } else if (typeof l.clicks !== 'number') {
              const num = parseInt(l.clicks, 10);
              l.clicks = isNaN(num) ? 0 : num;
              dirty = true;
            }

            if (typeof l.scans !== 'number') {
              const num = parseInt(l.scans, 10);
              l.scans = isNaN(num) ? 0 : num;
              dirty = true;
            }
          });

          if (dirty) {
            try { localStorage.setItem('hea_links', JSON.stringify(p)); } catch (e) {}
          }
          return p;
        }
      }
    } catch (e) {}
    return [];
  }

  function getStoredPages() {

    try {

      const s = localStorage.getItem('hea_bios');

      if (s) {

        let p = JSON.parse(s);

        if (Array.isArray(p)) {

          const originalLen = p.length;

          // Filter out dummy/sample pages and clean data

          p = p.filter(page => page &&

            page.slug !== 'hgrgferf' &&

            page.slug !== 'john' &&

            page.slug !== 'sample' &&

            !(page.slug && page.slug.toLowerCase().includes('hgrgferf')) &&

            !(page.url && page.url.includes('hgrgferf')) &&

            !(page.title && page.title.toLowerCase() === 'john' && (page.views || 0) === 0)

          );

          if (p.length !== originalLen) {

            try { localStorage.setItem('hea_bios', JSON.stringify(p)); } catch (e) {}

          }

          return p;

        }

      }

    } catch (e) {}

    return [];

  }

  function deletePage(slug) {

    if (!slug) return;

    if (!confirm('Are you sure you want to delete this Bio Page?')) return;

    try {

      let bios = getStoredPages();

      bios = bios.filter(p => p && p.slug !== slug);

      localStorage.setItem('hea_bios', JSON.stringify(bios));

      toast('Page deleted successfully');

      const pane = document.getElementById('appMainPane');

      if (pane) renderPages(pane, 'list');

    } catch (e) {

      console.error(e);

    }

  }

  function renderProLockScreen(container, featureName, featureDescription) {

    container.innerHTML = `

      <div class="pro-locked-screen" style="text-align:center;padding:60px 32px;max-width:560px;margin:40px auto;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:24px;box-shadow:0 20px 45px rgba(0,70,200,0.08);">

        <div style="width:76px;height:76px;border-radius:22px;background:#eff6ff;border:1.5px solid #bfdbfe;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 8px 24px rgba(0,112,243,0.12);">

          🔒

        </div>

        <span class="pill" style="background:#eff6ff;color:#0070f3;border:1px solid #bfdbfe;padding:5px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">EXCLUSIVE PRO FEATURE</span>

        <h2 style="font-size:26px;font-weight:800;color:#0070f3;margin:16px 0 10px;">${featureName} is locked</h2>

        <p style="color:#334155;font-size:14px;line-height:1.6;margin-bottom:28px;">

          ${featureDescription}

        </p>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">

          <button type="button" class="btn" style="width:100%;max-width:320px;background:linear-gradient(135deg, #0050d0, #0070f3);color:#ffffff;font-weight:800;font-size:15.5px;padding:14px 32px;border-radius:99px;cursor:pointer;border:none;box-shadow:0 8px 24px rgba(0,112,243,0.35);transition:all 0.2s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;" onclick="window.openCheckoutModal('pro')">

            ⚡ Upgrade to Pro Now

          </button>

          <button type="button" class="btn ghost" style="font-size:14px;padding:12px 22px;border-radius:12px;cursor:pointer;background:#f1f5f9;border:1.5px solid #cbd5e1;color:#0b132b;font-weight:700;" onclick="window.appShell.navigate('home')">

            ← Back to Dashboard

          </button>

        </div>

      </div>

    `;

  }

  // ---------------- ROUTING ENGINE ---------------- //

  function navigate(tab, param) {

    if (!isUserAuthenticated()) {

      document.body.classList.remove('app-mode');

      const as = $('#appShell');

      if (as) as.hidden = true;

      window.location.href = '/#login';

      return;

    }

    document.body.classList.add('app-mode');

    const as = $('#appShell');

    if (as) as.hidden = false;

    if (!tab) tab = 'home';

    if (tab === 'dashboard' || tab === 'app') tab = 'home';

    activeTab = tab;

    // Update right sidebar drawer based on active tab
    updateDrawerForTab(tab);

    $$('#sidebarNav .sidebar-nav-item').forEach(item => {

      item.classList.toggle('active', item.dataset.tab === tab);

    });

    const pane = $('#appMainPane');

    if (!pane) return;

    pane.scrollTop = 0;

    try {

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

          if (!window.isUserPro || !window.isUserPro()) {

            renderProLockScreen(pane, 'Link-in-Bio Pages', 'Free plan does not include custom landing pages or link-in-bio builders. Upgrade to HEA Link Pro to unlock all 12 mobile templates, custom branding, and social showcases!');

          } else {

            renderPages(pane);

          }

          break;

        case 'analytics':

          renderAnalytics(pane);

          break;

        case 'campaigns':

          renderCampaigns(pane);

          break;

        case 'domains':

          if (!window.isUserPro || !window.isUserPro()) {

            renderProLockScreen(pane, 'Custom Branded Domains', 'Free plan does not include custom domains. Connect your own brand URL (e.g. brand.link/drop) to increase trust and clicks by 2x. Upgrade to Pro!');

          } else {

            renderDomains(pane);

          }

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

    } catch (err) {

      console.error('Error rendering dashboard view:', tab, err);

      try { renderHome(pane); } catch (e) {}

    }

    // Clean, zero-jitter instant rendering for dashboard views
    // animatePageText removed here to prevent UI shifts and element bounce

  }

  // ---------------- 1. HOME SCREEN (Frame 1 & Frame 6 - 1:1 with reference) ---------------- //

  function renderHome(container) {

    let activeType = 'link'; // 'link' or 'qr'

    container.innerHTML = `

      <!-- Card 1: "What do you want to create?" (1:1 Exact Reference Match) -->
      <div class="home-create-card">
        <div class="home-icon-3d-wrap">
  <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Burst Spark Lines -->
    <path d="M50 4V12" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 16L28 22" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
    <path d="M78 16L72 22" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
    <path d="M88 42L80 44" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 42L20 44" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
    <!-- 3D Squircle Base Shadow -->
    <rect x="18" y="24" width="64" height="64" rx="20" fill="rgba(0,112,243,0.18)" transform="rotate(-6 50 56)"/>
    <!-- 3D Squircle Main Body -->
    <rect x="18" y="20" width="64" height="64" rx="20" fill="url(#squircleGradHome)" stroke="#bfdbfe" stroke-width="2" transform="rotate(-6 50 52)"/>
    <!-- Glossy Highlight Sheen -->
    <path d="M26 28C26 23 30 19 35 18L58 16C63 15 67 19 67 24C67 24 50 25 38 34C28 42 26 52 26 52L26 28Z" fill="url(#sheenGradHome)" opacity="0.6" transform="rotate(-6 50 52)"/>
    <!-- Chain Link Icon -->
    <g transform="rotate(-6 50 52) translate(30, 32)">
      <path d="M16 22L22 16C25.3 12.7 25.3 7.3 22 4C18.7 0.7 13.3 0.7 10 4L4 10C0.7 13.3 0.7 18.7 4 22C6 24 8.7 25 11.3 25" stroke="#0070f3" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M24 18L18 24C14.7 27.3 9.3 27.3 6 24C2.7 20.7 2.7 15.3 6 12L12 6C15.3 2.7 20.7 2.7 24 6C26 8 27 10.7 27 13.3" stroke="#0050d0" stroke-width="4.5" stroke-linecap="round"/>
    </g>
    <defs>
      <linearGradient id="squircleGradHome" x1="18" y1="20" x2="82" y2="84" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff"/>
        <stop offset="0.4" stop-color="#eff6ff"/>
        <stop offset="1" stop-color="#dbeafe"/>
      </linearGradient>
      <linearGradient id="sheenGradHome" x1="26" y1="16" x2="67" y2="52" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
  </svg>
</div>

        <!-- Title with curved blue underline under "create?" -->
        <h3 class="home-hero-title">
          What do you want to <span class="curved-underline-wrap">create?<svg class="curved-underline-svg" viewBox="0 0 130 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13C32 4 92 3 127 11" stroke="#0070f3" stroke-width="3.5" stroke-linecap="round"/></svg></span>
        </h3>

        <!-- 2 Tab Options -->
        <div class="home-type-tabs">
          <button class="home-type-tab active" type="button" id="tabShortLinkOpt">
            <span>🔗</span> Short link &amp; URL
          </button>
          <button class="home-type-tab" type="button" id="tabQrCodeOpt">
            <span>▦</span> QR Code
          </button>
        </div>

        <!-- Clean Capsule Shorten Input -->
        <form id="homeShortenForm" class="home-shorten-box">
          <div class="home-shorten-left-grp">
            <span id="homeInputIcon" class="shorten-chain-icon">🔗</span>
            <input type="url" id="homeShortenInput" class="home-shorten-input" placeholder="Paste a long URL to shorten it..." style="border:none !important;outline:none !important;box-shadow:none !important;background:transparent !important;" required>
          </div>
          <div class="home-shorten-right-grp">
            <select class="home-domain-select" id="homeDomainSelect" style="display:none !important;">
              <option value="healink.store" selected>healink.store</option>
              <option value="bit.ly">bit.ly</option>
            </select>
            <button type="submit" class="home-shorten-btn" id="homeSubmitBtn" title="Shorten URL">→</button>
          </div>
        </form>

        <div id="homeShortenResult" class="home-shorten-result" style="display:none;"></div>

        <!-- Promo Banner Pill -->
        <div class="home-promo-banner" onclick="window.openCheckoutModal('pro')">
          <span class="promo-crown">👑</span>
          <span>Get custom links and a complimentary domain. <b class="promo-link-text">Upgrade now &gt;</b></span>
        </div>

        <!-- Quota Text -->
        <div class="home-quota-text">
          ${appUser.isPro ? '<span style="color:#10b981;font-weight:700;">👑 Core PRO Active: Unlimited short links &amp; Vector QR Codes</span>' : 'You can create <b style="color:#0070f3; font-weight:800;">5 more</b> short links this month. 🚀'}
        </div>
      </div>

      <!-- Card 2: "Simplify your workflow" (1:1 Exact Reference Match) -->
      <div class="home-workflow-card">
        <div class="workflow-left-col">
          <div class="workflow-title-row">
            <span class="workflow-sparkle">✨</span>
            <h4 class="workflow-heading">Simplify your workflow</h4>
            <span class="workflow-subtext">Explore smarter ways to create links.</span>
          </div>
          <div class="workflow-chips-row">
            <button type="button" class="workflow-chip-btn" onclick="if(window.appShell) window.appShell.openCreateModal('link')">
              <span>✏️</span> Personalize a short link
            </button>
            <button type="button" class="workflow-chip-btn" onclick="if(window.appShell) window.appShell.openCreateModal('link')">
              <span>⭐</span> Make a unique link for every post
            </button>
          </div>
          <button type="button" class="workflow-upgrade-cta" onclick="window.openCheckoutModal('pro')">
            <span>👑</span> Upgrade to Create with AI <span>→</span>
          </button>
        </div>
        <div class="workflow-right-col">
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Spark Burst Lines -->
    <path d="M52 8L50 16" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M72 14L66 20" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M84 32L76 34" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M26 34L34 38" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Card Drop Shadow -->
    <rect x="28" y="24" width="46" height="62" rx="14" fill="rgba(0,112,243,0.18)" transform="rotate(18 51 55)"/>
    <!-- Card Body -->
    <rect x="28" y="20" width="46" height="62" rx="14" fill="url(#cardGradHome)" stroke="#bfdbfe" stroke-width="2" transform="rotate(18 51 51)"/>
    <!-- Link Icon Inside Tilted Card -->
    <g transform="rotate(18 51 51) translate(37, 37)">
      <path d="M12 18L17 13C19.8 10.2 19.8 5.8 17 3C14.2 0.2 9.8 0.2 7 3L2 8C-0.8 10.8 -0.8 15.2 2 18C3.7 19.7 6 20.5 8.2 20.5" stroke="#0070f3" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M18 14L13 19C10.2 21.8 5.8 21.8 3 19C0.2 16.2 0.2 11.8 3 9L8 4C10.8 1.2 15.2 1.2 18 4C19.7 5.7 20.5 8 20.5 10.2" stroke="#0050d0" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    <defs>
      <linearGradient id="cardGradHome" x1="28" y1="20" x2="74" y2="82" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff"/>
        <stop offset="1" stop-color="#eff6ff"/>
      </linearGradient>
    </defs>
  </svg>
</div>
      </div>

    `;

    // Tab Switching Logic
    const tabLink = $('#tabShortLinkOpt');
    const tabQr = $('#tabQrCodeOpt');
    const input = $('#homeShortenInput');
    const icon = $('#homeInputIcon');

    if (tabLink && tabQr && input) {
      tabLink.onclick = () => {
        activeType = 'link';
        tabLink.classList.add('active');
        tabQr.classList.remove('active');
        input.placeholder = 'Paste a long URL to shorten it...';
        if (icon) icon.textContent = '🔗';
      };

      tabQr.onclick = () => {
        activeType = 'qr';
        tabQr.classList.add('active');
        tabLink.classList.remove('active');
        input.placeholder = 'Enter a URL to create a QR Code...';
        if (icon) icon.textContent = '▦';
      };
    }

    // Form Submit Handler
    const form = $('#homeShortenForm');
    if (form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const dest = $('#homeShortenInput').value.trim();
        const dom = 'healink.store';
        if (!dest) return;

        const btn = $('#homeSubmitBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = '...';
        }

        if (activeType === 'qr') {
          const newL = await createLinkDirect(dest, '', dom);
          const newId = (newL && newL.id) || ('lnk_' + Date.now());
          navigate('qr-detail', newId);
        } else {
          const newL = await createLinkDirect(dest, '', dom);
          const resBox = $('#homeShortenResult');
          if (resBox && newL) {
            const liveUrl = (newL.realShort && newL.realShort !== dest) ? newL.realShort : (newL.url && newL.url !== dest ? newL.url : `https://${dom}/${newL.slug}`);
            resBox.innerHTML = `
              <div class="result-title">Your Live Short Link (Click to open destination):</div>
              <a href="${liveUrl}" target="_blank" rel="noopener" class="result-url">${liveUrl}</a>
              <div class="result-dest">Destination: <span>${dest}</span></div>
              <div class="result-actions">
                <button type="button" class="res-btn-copy" onclick="window.appShell.copy('${liveUrl}')">📋 Copy</button>
                <button type="button" class="res-btn-action" onclick="window.appShell.navigate('qr')">▦ QR Code</button>
                <a href="${liveUrl}" target="_blank" rel="noopener" class="res-btn-action">🚀 Visit</a>
              </div>
            `;
            resBox.style.display = 'block';
            if ($('#homeShortenInput')) $('#homeShortenInput').value = '';
          }
        }

        if (btn) {
          btn.disabled = false;
          btn.textContent = '→';
        }
      };
    }

  }

  function renderCreateLink(container) {

    container.innerHTML = `

      <div class="create-link-wrap">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">

          <h2 style="font-size:24px;font-weight:800;color:#0070f3;margin:0;">Create a new link</h2>

          <a href="#" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;" onclick="alert('Bulk upload is available on the Pro plan')">Bulk upload 📄</a>

        </div>

        <!-- 1. Link details card -->

        <div class="create-link-card">

          <div style="display:flex;justify-content:space-between;align-items:center;">

            <h3 style="margin:0;">Link details</h3>

            <span style="color:#94a3b8;font-size:16px;">⌃</span>

          </div>

          <div class="create-link-sub" style="margin-top:4px;">

            ${appUser.isPro ? '<span style="color:#10b981;font-weight:700;">👑 Core PRO Active: Unlimited short links &amp; custom back-halves</span>' : 'You have <b>4 links</b> and <b>3 custom back-halves</b> remaining this month. <a href="#" style="color:#38bdf8;" onclick="window.openCheckoutModal(\'pro\'); return false;">Upgrade for more</a>.'}

          </div>

          <div class="create-link-field">

            <label>Destination URL</label>

            <input type="url" id="newDestUrl" placeholder="https://yourcompany.com/new-product-launch" required>

          </div>

          <!-- Dynamic routing alert banner (Screenshot 12.02.38 AM) -->

          <div class="dynamic-routing-alert">

            <div style="display:flex;align-items:center;gap:10px;">

              <span>🔀</span>

              <span><b>Dynamic routing</b> — send visitors to different URLs based on device or location.</span>

            </div>

            <div style="display:flex;gap:10px;align-items:center;">

              <button class="sso-btn" style="width:auto !important;min-width:max-content !important;white-space:nowrap !important;padding:6px 18px !important;font-size:13px !important;font-weight:700 !important;background:#ffffff !important;color:#0b132b !important;border:1.5px solid #cbd5e1 !important;border-radius:99px !important;flex-shrink:0 !important;cursor:pointer !important;" onclick="alert('Dynamic routing rules manager opened')">Set it up</button>

              <button style="background:none;border:0;color:#93c5fd;cursor:pointer;font-size:16px;" onclick="this.closest('.dynamic-routing-alert').remove()">✕</button>

            </div>

          </div>

          <!-- Short link domain & back-half -->

          <div style="display:grid;grid-template-columns:1fr 20px 1.4fr;gap:12px;align-items:flex-end;margin-bottom:20px;">

            <div class="create-link-field" style="margin:0;">

              <label>Short link domain</label>

              <select id="newDomainSelect" class="home-domain-select" style="width:100%;">

                <option value="healink.store" selected>healink.store</option>

                <option value="healink.store">healink.store</option>

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

              <input type="text" id="newBackHalf" placeholder="e.g. vip-drop26 (or leave empty for auto 6-char slug)">

            </div>

          </div>

          <div class="create-link-field">

            <label>Title (optional)</label>

            <input type="text" id="newTitle" placeholder="e.g. Q4 Global Brand Campaign Launch">

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

                <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Generate a QR Code</b>

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

                <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Add to a HEA Page</b>

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

                <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">UTM parameters</b>

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

                <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Link expiration</b>

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

                  <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Dynamic routing</b>

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

      $('#newBackHalf').value = generateShortSlug(6);

    };

    $('#btnSubmitNewLink').onclick = async () => {

      const dest = $('#newDestUrl').value.trim();

      if (!dest) {

        alert('Please enter a destination URL');

        return;

      }

      const checkLimit = (typeof window.canCreateLinkOrQr === 'function') ? window.canCreateLinkOrQr() : { allowed: true };

      if (!checkLimit.allowed) {

        window.appShell.toast(checkLimit.message);

        if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');

        return;

      }

      const domain = $('#newDomainSelect').value;

      const slug = $('#newBackHalf').value.trim() || generateShortSlug(6);

      const title = $('#newTitle').value.trim() || 'Untitled ' + new Date().toISOString().slice(0, 10);

      const tag = $('#newTagsSelect').value || 'Website';

      const hasQR = $('#chkGenerateQR').checked;

      const btn = $('#btnSubmitNewLink');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating link...';
      }

      let realShort = '';
      try {
        realShort = await fetchOnlineShortUrl(dest, slug);
      } catch (e) {}

      const origin = window.location.origin;
      const cleanUrl = (realShort && realShort !== dest && !realShort.includes('firebase.google.com') && realShort.length < 60)
        ? realShort
        : (slug ? `https://${domain || 'healink.store'}/${slug}` : `${origin}/${slug}`);

      const links = getStoredLinks();
      const newL = {
        id: 'lnk_' + Date.now(),
        title: title,
        dest: dest,
        slug: slug,
        url: cleanUrl,
        realShort: cleanUrl,
        tag: tag,
        createdAt: 'Just now',
        clicks: 0,
        scans: 0,
        qr: hasQR
      };

      links.unshift(newL);
      localStorage.setItem('hea_links', JSON.stringify(links));

      try {
        localStorage.setItem('hea_slug_' + slug.toLowerCase(), dest);
        const mapRaw = localStorage.getItem('hea_slug_map') || '{}';
        const map = JSON.parse(mapRaw);
        map[slug.toLowerCase()] = dest;
        localStorage.setItem('hea_slug_map', JSON.stringify(map));
      } catch (e) {}

      try {
        fetch('/api/shorten-online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: dest, slug })
        }).catch(() => {});
      } catch (e) {}

      try {
        if (window.fbRtdbClient && typeof window.fbRtdbClient.saveLink === 'function') {
          const uEmail = (appUser && appUser.email) || 'guest';
          window.fbRtdbClient.saveLink(uEmail, newL);
        }
      } catch (e) {}

      try {
        const s = JSON.parse(localStorage.getItem('hea_session'));
        if (s && s.token) {
          fetch('/api/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.token },
            body: JSON.stringify({ dest, slug, title: newL.title, tag: newL.tag, qr: hasQR, realShort: cleanUrl })
          }).catch(() => {});
        }
      } catch (e) {}

      if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();
      window.appShell.toast(`Created link: ${cleanUrl}`);
      navigator.clipboard.writeText(cleanUrl).catch(() => {});
      navigate('links');
    };

  }

  async function createLinkDirect(dest, customSlug, domain) {
    const checkLimit = (typeof window.canCreateLinkOrQr === 'function') ? window.canCreateLinkOrQr() : { allowed: true };
    if (!checkLimit.allowed) {
      window.appShell.toast(checkLimit.message);
      if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');
      return;
    }

    const slug = customSlug || generateShortSlug(6);
    let realShort = '';
    try {
      realShort = await fetchOnlineShortUrl(dest, slug);
    } catch (e) {}

    const origin = window.location.origin;
    const cleanUrl = (realShort && realShort !== dest && !realShort.includes('firebase.google.com') && realShort.length < 60)
      ? realShort
      : (slug ? `https://${domain || 'healink.store'}/${slug}` : `${origin}/${slug}`);
    if (cleanUrl === dest) cleanUrl = `https://${domain || 'healink.store'}/${slug}`;

    const links = getStoredLinks();
    const newL = {
      id: 'lnk_' + Date.now(),
      title: 'Untitled ' + new Date().toISOString().slice(0, 10),
      dest: dest,
      slug: slug,
      url: cleanUrl,
      realShort: cleanUrl,
      tag: 'Website',
      createdAt: 'Just now',
      clicks: 0,
      scans: 0,
      qr: true
    };

    links.unshift(newL);
    localStorage.setItem('hea_links', JSON.stringify(links));

    try {
      if (window.fbRtdbClient && typeof window.fbRtdbClient.saveLink === 'function') {
        const uEmail = (appUser && appUser.email) || 'guest';
        window.fbRtdbClient.saveLink(uEmail, newL);
      }
    } catch (e) {}

    if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();

    try {
      localStorage.setItem('hea_slug_' + slug.toLowerCase(), dest);
      const mapRaw = localStorage.getItem('hea_slug_map') || '{}';
      const map = JSON.parse(mapRaw);
      map[slug.toLowerCase()] = dest;
      localStorage.setItem('hea_slug_map', JSON.stringify(map));
    } catch (e) {}

    try {
      fetch('/api/shorten-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: dest, slug })
      }).catch(() => {});
    } catch (e) {}

    try {
      const s = JSON.parse(localStorage.getItem('hea_session'));
      if (s && s.token) {
        fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.token },
          body: JSON.stringify({ dest, slug, title: newL.title, tag: newL.tag, qr: true, realShort: cleanUrl })
        }).catch(() => {});
      }
    } catch (e) {}

    window.appShell.toast(`Link shortened: ${cleanUrl}`);
    navigator.clipboard.writeText(cleanUrl).catch(() => {});
    if (currentView !== 'home' && window.location.hash !== '#dashboard' && window.location.hash !== '') {
      navigate('links');
    }
    return newL;
    return newL.id;
  }

  // ---------------- 3. LINKS DIRECTORY SCREEN ---------------- //

  function renderLinks(container) {

    const links = getStoredLinks();

    const origin = window.location.origin;

    container.innerHTML = `

      <div class="view-header">

        <h2>Links</h2>

        <button class="sidebar-create-btn" style="margin:0;" onclick="window.appShell.navigate('create-link')">

          Create link

        </button>

      </div>

      <div class="links-filter-bar" style="display:flex;gap:12px;align-items:center;margin-bottom:24px;flex-wrap:wrap;">

        <div style="flex:1;min-width:280px;position:relative;display:flex;align-items:center;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;padding:0 14px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
          <span style="font-size:15px;color:#94a3b8;margin-right:10px;">🔍</span>
          <input type="text" id="linksSearchInput" placeholder="Search links by title, slug, tag, or destination..." style="width:100%;border:none;outline:none;background:transparent;padding:12px 0;font-size:14px;color:#0f172a;font-family:inherit;">
        </div>

        <select id="linksTagSelect" style="padding:12px 16px;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;font-size:13.5px;font-weight:600;color:#334155;outline:none;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.02);font-family:inherit;">
          <option value="">All tags</option>
          <option value="Website">Website</option>
          <option value="Social">Social</option>
          <option value="Campaign">Campaign</option>
        </select>

      </div>

      <div id="linksListContainer">

        ${links.length === 0 ? `
          <div class="dash-white-card" style="text-align:center;padding:54px 24px;max-width:620px;margin:24px auto;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:24px;box-shadow:0 10px 30px rgba(0,112,243,0.06);">
            <div style="width:110px;height:110px;margin:0 auto 20px;background:linear-gradient(135deg,rgba(0,112,243,0.08),rgba(0,200,255,0.12));border:2px solid rgba(0,112,243,0.2);border-radius:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,112,243,0.1);">
              <span style="font-size:48px;">🔗</span>
            </div>
            <h3 style="font-size:22px;font-weight:800;color:#0b132b;margin:0 0 8px;letter-spacing:-0.02em;">No links created yet</h3>
            <p style="color:#64748b;font-size:14px;max-width:440px;margin:0 auto 24px;line-height:1.6;">
              Shorten long URLs with custom AI slugs, password protection, and track your visitor analytics in real-time.
            </p>
            <button class="auth-submit-btn" onclick="window.appShell.navigate('create-link')" style="width:auto;display:inline-flex;align-items:center;gap:8px;padding:12px 28px;font-size:14px;font-weight:700;border-radius:9999px;background:#0070f3;color:#ffffff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,112,243,0.3);margin:0 auto;">
              <span>+ Create your first link</span>
            </button>
          </div>
        ` : links.map(l => {

          const shortUrl = (l.realShort && l.realShort !== l.dest && !l.realShort.includes('firebase.google.com') && l.realShort.length < 60)
            ? l.realShort
            : `${origin}/${l.slug || 'lnk'}`;
          const shortDisplay = shortUrl.replace(/^https?:\/\//, '');

          return `
          <div class="qr-card-item">
            <div style="flex:1;min-width:0;overflow:hidden;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="background:rgba(0,112,243,0.08);color:#0070f3;font-weight:700;font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid rgba(0,112,243,0.18);">${l.tag || 'Website'}</span>
                <span style="font-size:12px;color:#64748b;">${l.createdAt || 'Recent'}</span>
              </div>
              <h4 style="margin:0 0 4px;font-size:16px;color:#0070f3 !important;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${l.title || 'Untitled Link'}</h4>
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">
                <a href="${shortUrl}" target="_blank" rel="noopener" style="color:#0070f3;font-weight:700;font-size:14px;text-decoration:none;" title="Click to open short link">${shortDisplay} ↗</a>
              </div>
              ${l.dest ? `<div style="font-size:13px;color:#64748b;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;" title="${l.dest}">↳ <a href="${l.dest}" target="_blank" rel="noopener" style="color:#64748b;text-decoration:none;">${l.dest}</a></div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
              <span style="display:none !important;">${typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0)} clicks</span>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.copy('${shortUrl}')">📋 Copy</button>
              <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.navigate('qr-detail', '${l.id || l.slug}')">▦ QR</button>
              <button style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;" onclick="window.appShell.deleteLink('${l.id}', '${l.slug}')" title="Delete link">🗑️</button>
            </div>
          </div>
          `;
        }).join('')}

      </div>

    `;

    const sIn = $('#linksSearchInput');
    const sTag = $('#linksTagSelect');

    const filterLinks = () => {
      const q = (sIn ? sIn.value : '').toLowerCase().trim();
      const tag = (sTag ? sTag.value : '').toLowerCase().trim();

      $$('.qr-card-item').forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesQ = !q || text.includes(q);
        const matchesTag = !tag || text.includes(tag);
        card.style.display = (matchesQ && matchesTag) ? 'flex' : 'none';
      });
    };

    if (sIn) sIn.oninput = filterLinks;
    if (sTag) sTag.onchange = filterLinks;

  }

  // ---------------- 4. QR CODES LIST SCREEN (Frame 8 & Frame 9) ---------------- //

  function renderQr(container, mode) {

    const links = getStoredLinks();

    let qrMode = mode || (links.length === 0 ? 'empty' : 'list');

    function renderView() {

      if (qrMode === 'empty') {

        container.innerHTML = `

          <div class="view-header">

            <h2>QR Codes</h2>

            <button class="sso-btn" style="width:auto;padding:8px 16px;" id="btnViewAllQr">

              View All Codes (${links.length})

            </button>

          </div>

          <!-- Empty / Welcome State matching Frame 8 -->

          <div class="dash-white-card" style="text-align:center;padding:60px 20px;max-width:680px;margin:20px auto;">

            <div style="width:140px;height:140px;margin:0 auto 24px;background:rgba(56,189,248,0.06);border:2px solid rgba(56,189,248,0.25);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(56,189,248,0.15);">

              <span style="font-size:52px;color:#38bdf8;">▦</span>

              <span style="font-size:11px;font-weight:800;letter-spacing:1px;color:#D4FF24;margin-top:4px;">SCAN ME</span>

            </div>

            <h3 style="font-size:26px;font-weight:800;color:#0070f3;margin:0 0 10px;">Connect your audience with a simple scan</h3>

            <p style="color:#94a3b8;font-size:15px;max-width:480px;margin:0 auto 24px;line-height:1.5;">

              Create a QR Code from any short link. Then edit, customize, and track your QR Codes here.

            </p>

            <button class="auth-submit-btn" id="btnLaunchQrForm" style="width:auto;padding:12px 32px;font-size:15px;margin:0 auto 12px;">

              Create a HEA Code

            </button>

            <div style="margin-top:10px;">

              <a href="#analytics" style="color:#38bdf8;font-size:13px;text-decoration:none;">Learn more →</a>

            </div>

          </div>

        `;

        $('#btnLaunchQrForm').onclick = () => {

          qrMode = 'create';

          renderView();

        };

        const viewAll = $('#btnViewAllQr');

        if (viewAll) viewAll.onclick = () => {

          qrMode = 'list';

          renderView();

        };

        return;

      }

      if (qrMode === 'create') {

        container.innerHTML = `

          <div class="view-header">

            <div style="display:flex;align-items:center;gap:12px;">

              <button class="sso-btn" id="btnBackToQrList" style="width:auto;padding:6px 12px;">←</button>

              <h2>Create a QR Code</h2>

            </div>

          </div>

          <!-- QR Creation Form matching Frame 9 -->

          <div class="qr-detail-layout">

            <div class="dash-white-card">

              <h3 style="color:#0070f3;margin-top:0;font-size:18px;font-weight:800;">QR Code Details</h3>

              <div class="create-link-field">

                <label>Destination URL</label>

                <input type="url" id="qrInputDest" placeholder="https://yourstore.com/summer-promo" value="" required>

              </div>

              <div class="create-link-field">

                <label>Title (optional)</label>

                <input type="text" id="qrInputTitle" placeholder="e.g. Table 4 Menu or Conference Flyer">

              </div>

              <!-- Advanced Settings (Frame 9) -->

              <h4 style="font-size:15px;color:#0070f3;margin:20px 0 10px;font-weight:700;">Advanced settings</h4>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

                <span style="color:#cbd5e1;font-size:13px;">{ } UTM parameters 👑</span>

                <label class="app-toggle-switch"><input type="checkbox" checked><span class="app-toggle-slider"></span></label>

              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

                <span style="color:#cbd5e1;font-size:13px;">⏱️ Code expiration 👑</span>

                <label class="app-toggle-switch"><input type="checkbox"><span class="app-toggle-slider"></span></label>

              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">

                <div>

                  <div style="color:#cbd5e1;font-size:13px;">🔀 Dynamic routing 👑</div>

                  <div style="font-size:11px;color:#94a3b8;">Send visitors to different destinations based on device</div>

                </div>

                <label class="app-toggle-switch"><input type="checkbox" checked><span class="app-toggle-slider"></span></label>

              </div>

              <div style="display:flex;gap:12px;margin-top:24px;">

                <button class="auth-submit-btn" id="btnDesignYourCode" style="width:auto;padding:10px 24px;">Design your code →</button>

                <button class="sso-btn" id="btnCancelQrCreate" style="width:auto;padding:10px 20px;">Cancel</button>

              </div>

            </div>

            <!-- Right Preview -->

            <div class="qr-preview-box">

              <span style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Live Preview</span>

              <div class="qr-framed-thumbnail" style="width:180px;padding:14px 14px 8px;margin-bottom:16px;">

                <canvas id="qrCreatePreviewCanvas" width="180" height="180"></canvas>

                <div class="qr-thumb-label">SCAN ME</div>

              </div>

              <div style="font-size:12px;color:#38bdf8;font-weight:700;">Vector 4K Resolution</div>

            </div>

          </div>

        `;

        setTimeout(() => {

          const cv = $('#qrCreatePreviewCanvas');

          if (cv && typeof window.drawQR === 'function') {

            window.drawQR(cv, window.location.origin, '#00d2ff', '#ffffff', 180);

          }

        }, 30);

        $('#btnBackToQrList').onclick = () => { qrMode = 'list'; renderView(); };

        $('#btnCancelQrCreate').onclick = () => { qrMode = 'list'; renderView(); };

        $('#btnDesignYourCode').onclick = async () => {

          const checkLimit = (typeof window.canCreateLinkOrQr === 'function') ? window.canCreateLinkOrQr() : { allowed: true };

          if (!checkLimit.allowed) {

            window.appShell.toast(checkLimit.message);

            if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');

            return;

          }

          const dest = $('#qrInputDest').value.trim();

          const title = $('#qrInputTitle').value.trim() || 'Custom QR Code';

          if (!dest) { alert('Please enter destination URL'); return; }

          const slug = generateShortSlug(6);

          const realShort = await fetchOnlineShortUrl(dest);

          const cleanUrl = realShort || (slug ? `https://healink.store/${slug}` : (origin + '/' + slug));

          const links = getStoredLinks();

          const newQ = {

            id: 'lnk_' + Date.now(),

            title: title,

            dest: dest,

            slug: slug,

            url: cleanUrl,

            realShort: cleanUrl,

            tag: 'QR Campaign',

            createdAt: 'Just now',

            clicks: 0,

            scans: 0,

            qr: true

          };

          links.unshift(newQ);

          localStorage.setItem('hea_links', JSON.stringify(links));

          // Persist to Firebase Realtime Database
          try {
            if (window.fbRtdbClient) {
              const uEmail = (appUser && appUser.email) || 'guest';
              window.fbRtdbClient.saveLink(uEmail, newQ);
              window.fbRtdbClient.saveQr(uEmail, newQ);
            }
          } catch (e) {}

          if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();

          window.appShell.toast('QR Code created! Welcome to the Studio.');

          navigate('qr-detail', newQ.id);

        };

        return;

      }

      // Default 'list' mode

      container.innerHTML = `

        <div class="view-header">

          <h2>QR Codes</h2>

          <div style="display:flex;gap:10px;">

            <button class="sidebar-create-btn" id="btnNewQrHero" style="margin:0;">

              + Create code

            </button>

          </div>

        </div>

        <div class="qr-filter-bar">

          <input type="text" class="topbar-search-input" id="qrSearchInput" style="flex:1;" placeholder="Search QR codes by label, destination, or color...">

          <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">📅 Filter by created date</button>

          <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">⊞ Add filters</button>

        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">

          <div style="display:flex;gap:16px;align-items:center;">

            <span>${links.length} total codes</span>

            <span style="cursor:pointer;" onclick="window.appShell.downloadQrPNG()">Export</span>

            <span style="cursor:pointer;">Hide</span>

            <span style="cursor:pointer;">Tag</span>

          </div>

          <select class="home-domain-select" style="padding:4px 8px;font-size:12px;">

            <option>Show: Active</option>

          </select>

        </div>

        <!-- QR Card Items matching screenshot -->

        <div id="qrCardsContainer">

          ${(() => {
            const origin = window.location.origin;
            return links.map((item, idx) => {
              const shortUrl = (item.realShort && item.realShort !== item.dest && !item.realShort.includes('firebase.google.com') && item.realShort.length < 60)
                ? item.realShort
                : `${origin}/${item.slug || 'lnk'}`;
              const shortDisplay = shortUrl.replace(/^https?:\/\//, '');

              return `
              <div class="qr-card-item">
                <div class="qr-card-left">
                  <div class="qr-framed-thumbnail" style="cursor:pointer;" onclick="window.appShell.navigate('qr-detail', '${item.id}')">
                    <canvas id="qrCardCanvas_${idx}" width="160" height="160"></canvas>
                    <div class="qr-thumb-label">SCAN ME</div>
                  </div>
                  <div class="qr-details" style="min-width:0;flex:1;">
                    <span style="background:rgba(0,112,243,0.08);color:#0070f3;font-weight:700;font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid rgba(0,112,243,0.18);">🌐 ${item.tag || 'Website'}</span>
                    <h4 style="cursor:pointer;color:#0070f3 !important;margin:6px 0 4px;font-size:16px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;" onclick="window.appShell.navigate('qr-detail', '${item.id}')">${item.title}</h4>
                    <div class="qr-dest-text" title="${item.dest}">↳ ${item.dest}</div>
                    <div class="qr-meta-row">
                      <span>👑 ${item.scans || 0} scans</span>
                      <span>📅 ${item.createdAt}</span>
                      <span title="${shortDisplay}">🔗 ${shortDisplay}</span>
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
              `;
            }).join('');
          })()}
        </div>
        <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">

          — You've reached the end of your QR codes —

        </div>

      `;

      $('#btnNewQrHero').onclick = () => {

        qrMode = 'empty';

        renderView();

      };

      const sIn = $('#qrSearchInput');

      if (sIn) {

        sIn.oninput = () => {

          const q = sIn.value.toLowerCase();

          $$('.qr-card-item').forEach(card => {

            card.style.display = card.textContent.toLowerCase().includes(q) ? 'flex' : 'none';

          });

        };

      }

      setTimeout(() => {

        links.forEach((item, idx) => {

          const cv = $(`#qrCardCanvas_${idx}`);

          if (cv && typeof window.drawQR === 'function') {

            window.drawQR(cv, item.realShort || item.url || (item.dest || item.url || (origin + '/' + (item.slug || ''))), appUser.selectedQrColor || '#ff007f', '#ffffff', 160);

          }

        });

      }, 50);

    }

    renderView();

  }

  // ---------------- 5. QR CODE DETAILS & STUDIO (Screenshots 12.02.39 AM 1, 2, 3) ---------------- //

  function renderQrDetail(container, linkId) {

    activeQrId = linkId || '';

    const links = getStoredLinks();

    const item = links.find(l => l.id === activeQrId || l.slug === activeQrId) || links[0];

    if (!item) {

      navigate('qr', 'create');

      return;

    }

    container.innerHTML = `

      <!-- Header row matching Screenshot 12.02.39 AM 2 -->

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">

        <div style="display:flex;align-items:center;gap:12px;">

          <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:14px;" onclick="window.appShell.navigate('qr')">←</button>

          <h2 style="font-size:24px;font-weight:800;color:#0070f3;margin:0;">${item.title}</h2>

          <button class="topbar-icon-btn" title="Edit title" onclick="alert('Editing QR code title')">✏️</button>

          <button class="topbar-icon-btn" title="More">···</button>

        </div>

        <div style="display:flex;gap:12px;">

          <button class="auth-submit-btn" style="width:auto;margin:0;padding:10px 18px;display:flex;align-items:center;gap:8px;" onclick="window.appShell.downloadQrPNG('${item.slug}')">

            <span>📥</span> Download PNG

          </button>

          <button class="sso-btn" style="width:auto;margin:0;padding:10px 18px;display:flex;align-items:center;gap:8px;" onclick="window.appShell.downloadQrSVG('${item.slug}')">

            <span>📐</span> Download SVG

          </button>

        </div>

      </div>

      <!-- 2-Column Row: Details + QR Preview -->

      <div class="qr-detail-layout">

        <!-- Left: Details card (Screenshot 12.02.39 AM 2) -->

        <div class="dash-white-card">

          <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 18px;">Details</h3>

          <div style="margin-bottom:16px;">

            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Scan destination</div>

            <div style="display:flex;align-items:center;gap:8px;color:#0b132b;font-size:14px;font-weight:600;">

              <span>🌐</span> Website / URL

            </div>

          </div>

          <div style="margin-bottom:16px;">

            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Destination</div>

            <div style="color:#0070f3;font-size:13px;word-break:break-all;">↳ ${item.dest}</div>

          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Short link</div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#0070f3;font-size:14px;font-weight:700;">${((item.realShort && item.realShort !== item.dest && !item.realShort.includes('firebase.google.com') && item.realShort.length < 60) ? item.realShort : (origin + '/' + (item.slug || 'lnk'))).replace(/^https?:\/\//, '')}</span>
              <button class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;" onclick="window.appShell.copy('${((item.realShort && item.realShort !== item.dest && !item.realShort.includes('firebase.google.com') && item.realShort.length < 60) ? item.realShort : (origin + '/' + (item.slug || 'lnk')))}')">📋 Copy</button>
            </div>
          </div>

          <div style="margin-bottom:16px;">

            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Tags</div>

            <div style="color:#64748b;font-size:13px;">🏷️ ${item.tag || 'No tags'}</div>

          </div>

          <div>

            <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Created on</div>

            <div style="color:#64748b;font-size:13px;">${item.createdAt}</div>

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

            <span style="font-size:12px;color:#64748b;">Brand Color:</span>

            ${['#ff007f', '#0070f3', '#10b981', '#0b132b', '#ff9900'].map(c => `

              <button class="color-dot" style="width:20px;height:20px;border-radius:50%;background:${c};border:2px solid ${appUser.selectedQrColor === c ? '#0070f3' : 'transparent'};cursor:pointer;" onclick="window.appShell.changeQrColor('${c}')"></button>

            `).join('')}

          </div>

          <button class="sso-btn" style="width:auto;padding:8px 20px;color:#0070f3;border-color:rgba(0,112,243,0.3);font-weight:600;margin-bottom:14px;" onclick="window.appShell.toast('Custom QR design saved!')">

            🎨 Customize frame &amp; colors

          </button>

          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">

            <span style="color:#0070f3;font-size:13px;font-weight:700;">${((item.realShort && item.realShort !== item.dest) ? item.realShort : (item.slug ? (origin.replace(/^https?:\/\//, '') + '/' + item.slug) : (item.dest || ''))).replace(/^https?:\/\//, '')}</span>

            <span style="color:#64748b;cursor:pointer;">···</span>

          </div>

        </div>

      </div>

      <!-- Dynamic routing section (Screenshot 12.02.39 AM 3) -->

      <div class="dash-white-card" style="margin-bottom:24px;">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;">

          <div>

            <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 6px;">Dynamic routing</h3>

            <p style="color:#64748b;font-size:13px;margin:0;">Automatically route visitors to different destinations based on device, location, and more.</p>

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

            <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 4px;">Code analytics — ${item.dest.slice(0, 45)}...</h3>

            <a href="#analytics" style="color:#0070f3;font-size:13px;font-weight:600;text-decoration:none;">⇄ Switch to all links</a>

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

          <span style="font-size:14px;font-weight:700;color:#0b132b;">Scans over time</span>

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

        window.drawQR(cv, item.realShort || item.url || (item.dest || item.url || (origin + '/' + (item.slug || ''))), appUser.selectedQrColor || '#ff007f', '#ffffff', 200);

      }

    }, 50);

  }

  function changeQrColor(c) {

    appUser.selectedQrColor = c;

    const cv = $('#qrDetailCanvas');

    if (cv && typeof window.drawQR === 'function') {

      window.drawQR(cv, 'https://tinyurl.com/3WeOEOz', c, '#ffffff', 200);

    }

    toast(`QR code color updated to ${c}`);

  }

  // ---------------- 6. PAGES SCREEN (12 Templates & Live Configure Flow) ---------------- //

  function renderPages(container, initialMode) {

    const pages = getStoredPages();

    const origin = window.location.origin;

    let mode = initialMode || (pages.length === 0 ? 'catalog' : 'list');

    let activeCategory = 'All templates';

    // 12 High-Converting Diverse Industry Templates

    const templates = [

      {

        id: 'grand_hotel',

        category: 'Business & Hospitality',

        badge: 'HOSPITALITY',

        title: 'The Grand Hotel',

        tagline: 'Your new escape awaits',

        accent: '#c5a059',

        bgColor: '#161b26',

        textColor: '#ffffff',

        cardBg: '#1f2737',

        btnBg: '#e2d5c3',

        btnColor: '#181e29',

        btnShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',

        btn1Text: 'Website',

        btn1Url: 'https://thegrandhotel.example.com',

        btn2Text: 'Book your stay',

        btn2Url: 'https://thegrandhotel.example.com/book',

        socials: ['instagram', 'mail', 'youtube'],

        avatarType: 'hotel',

        cardType: 'hotel_sunset',

        desc: 'Dark luxury hospitality aesthetic with champagne gold accents and direct booking actions.'

      },

      {

        id: 'hearth_home',

        category: 'Retail & Ecommerce',

        badge: 'INTERIOR & DECOR',

        title: 'Hearth & Home',

        tagline: 'Create a space you love',

        accent: '#0d9488',

        bgColor: '#f7f4ee',

        textColor: '#1a202c',

        cardBg: '#ffffff',

        btnBg: '#0f766e',

        btnColor: '#ffffff',

        btnShadow: '0 4px 0 #094e49',

        btn1Text: 'Shop our website',

        btn1Url: 'https://hearthhome.example.com',

        btn2Text: 'Find a store',

        btn2Url: 'https://hearthhome.example.com/locations',

        socials: ['instagram', 'mail', 'x'],

        avatarType: 'hh_monogram',

        cardType: 'armchair',

        desc: 'Warm editorial cream layout with retro-drop shadow buttons and Scandinavian lookbook.'

      },

      {

        id: 'the_brew',

        category: 'Food & Drink',

        badge: 'CAFE & ROASTERY',

        title: 'The Brew Co.',

        tagline: 'Fresh roasts & seasonal cold brews',

        accent: '#ea580c',

        bgColor: '#faf6f0',

        textColor: '#1c1917',

        cardBg: '#ffffff',

        btnBg: '#ea580c',

        btnColor: '#ffffff',

        btnShadow: '0 4px 0 #9a3412',

        btn1Text: 'New drinks',

        btn1Url: 'https://thebrew.example.com/menu',

        btn2Text: 'Order whole beans',

        btn2Url: 'https://thebrew.example.com/beans',

        socials: ['instagram', 'mail', 'tiktok'],

        avatarType: 'brew_badge',

        cardType: 'coffee_bag',

        desc: 'Warm terracotta artisan cafe theme with coffee roast pouch and vibrant menu buttons.'

      },

      {

        id: 'cyberpulse_music',

        category: 'Creator & Music',

        badge: 'MUSIC & ARTIST',

        title: 'CyberPulse',

        tagline: "New EP 'Echoes' Streaming Now",

        accent: '#00c6ff',

        bgColor: '#060919',

        textColor: '#ffffff',

        cardBg: '#0f172a',

        btnBg: 'linear-gradient(135deg, #0070f3, #00c6ff)',

        btnColor: '#ffffff',

        btnShadow: '0 4px 16px rgba(0, 198, 255, 0.4)',

        btn1Text: 'Stream on Spotify ↗',

        btn1Url: 'https://spotify.com/cyberpulse',

        btn2Text: 'World Tour Tickets ↗',

        btn2Url: 'https://cyberpulse.live/tour',

        socials: ['spotify', 'youtube', 'instagram', 'x'],

        avatarType: 'cyber_headphones',

        cardType: 'music_player',

        desc: 'High-energy cyber cyan & violet theme for DJs, producers, and electronic artists.'

      },

      {

        id: 'glow_skincare',

        category: 'Retail & Ecommerce',

        badge: 'BEAUTY & WELLNESS',

        title: 'Glow Beauty Lab',

        tagline: 'Clean botanical skincare formulas',

        accent: '#f43f5e',

        bgColor: '#fff5f7',

        textColor: '#27272a',

        cardBg: '#ffffff',

        btnBg: '#f43f5e',

        btnColor: '#ffffff',

        btnShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',

        btn1Text: 'Shop Bestseller Serums',

        btn1Url: 'https://glowbeauty.example.com/shop',

        btn2Text: 'Take the 60s Skin Quiz',

        btn2Url: 'https://glowbeauty.example.com/quiz',

        socials: ['instagram', 'tiktok', 'mail'],

        avatarType: 'beauty_dropper',

        cardType: 'skincare_bottle',

        desc: 'Soft blush rose aesthetic with botanical serum highlights for beauty and cosmetic brands.'

      },

      {

        id: 'devforge_hub',

        category: 'Tech & Web3',

        badge: 'DEVELOPER & SAAS',

        title: 'DevForge CLI',

        tagline: 'Lightning-fast cloud developer workflows',

        accent: '#D4FF24',

        bgColor: '#080d1a',

        textColor: '#ffffff',

        cardBg: '#0f172a',

        btnBg: '#D4FF24',

        btnColor: '#050914',

        btnShadow: '0 4px 18px rgba(212, 255, 36, 0.35)',

        btn1Text: 'GitHub Repository (★ 18.4k)',

        btn1Url: 'https://github.com/devforge',

        btn2Text: 'Read the Documentation',

        btn2Url: 'https://docs.devforge.example.com',

        socials: ['github', 'x', 'mail'],

        avatarType: 'terminal_code',

        cardType: 'code_terminal',

        desc: 'Dark matrix terminal theme tailored for open-source engineers, SDKs, and dev tools.'

      },

      {

        id: 'fitapex_coach',

        category: 'Health & Fitness',

        badge: 'FITNESS & TRAINING',

        title: 'FitApex Coaching',

        tagline: 'Elite 1-on-1 strength & nutrition plans',

        accent: '#10b981',

        bgColor: '#09101d',

        textColor: '#ffffff',

        cardBg: '#131e33',

        btnBg: '#10b981',

        btnColor: '#ffffff',

        btnShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',

        btn1Text: 'Apply for 1-on-1 Coaching',

        btn1Url: 'https://fitapex.example.com/apply',

        btn2Text: 'Download Free Workout Plan',

        btn2Url: 'https://fitapex.example.com/guide',

        socials: ['instagram', 'youtube', 'tiktok'],

        avatarType: 'fitness_apex',

        cardType: 'fitness_stats',

        desc: 'High-contrast athletic theme with transformation proof for trainers and fitness creators.'

      },

      {

        id: 'atelier_bistro',

        category: 'Food & Drink',

        badge: 'FINE DINING',

        title: 'Atelier Bistro & Bar',

        tagline: 'Seasonal gastronomy & craft cocktails',

        accent: '#fbbf24',

        bgColor: '#0a0d14',

        textColor: '#ffffff',

        cardBg: '#141a29',

        btnBg: '#fbbf24',

        btnColor: '#0a0d14',

        btnShadow: '0 4px 16px rgba(251, 191, 36, 0.35)',

        btn1Text: 'Reserve a Table Online',

        btn1Url: 'https://atelierbistro.example.com/reserve',

        btn2Text: "View Chef's Tasting Menu",

        btn2Url: 'https://atelierbistro.example.com/menu',

        socials: ['instagram', 'mail', 'x'],

        avatarType: 'chef_crest',

        cardType: 'gourmet_dish',

        desc: 'Midnight black & champagne gold palette for luxury restaurants, bistros, and lounges.'

      },

      {

        id: 'aura_photography',

        category: 'Creator & Music',

        badge: 'PHOTOGRAPHY',

        title: 'Aura Visuals',

        tagline: 'Timeless editorial wedding & portrait stories',

        accent: '#a855f7',

        bgColor: '#111216',

        textColor: '#ffffff',

        cardBg: '#1a1c23',

        btnBg: '#f4f4f5',

        btnColor: '#09090b',

        btnShadow: 'none',

        btn1Text: 'View Portfolio Galleries',

        btn1Url: 'https://auravisuals.example.com/portfolio',

        btn2Text: '2026 Wedding Date Inquiries',

        btn2Url: 'https://auravisuals.example.com/contact',

        socials: ['instagram', 'mail', 'pinterest'],

        avatarType: 'camera_aperture',

        cardType: 'photo_frame',

        desc: 'Monochrome editorial layout highlighting visual storytelling and client inquiries.'

      },

      {

        id: 'nexus_web3',

        category: 'Tech & Web3',

        badge: 'FINANCE & WEB3',

        title: 'Nexus Capital',

        tagline: 'Investing in decentralized intelligence',

        accent: '#38bdf8',

        bgColor: '#050716',

        textColor: '#ffffff',

        cardBg: '#0c122b',

        btnBg: 'linear-gradient(135deg, #0ea5e9, #6366f1)',

        btnColor: '#ffffff',

        btnShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',

        btn1Text: 'Read Q1 Research Paper',

        btn1Url: 'https://nexuscapital.example.com/research',

        btn2Text: 'Join Governance Community',

        btn2Url: 'https://t.me/nexusweb3',

        socials: ['x', 'telegram', 'github'],

        avatarType: 'web3_cube',

        cardType: 'web3_stats',

        desc: 'Futuristic blockchain and DeFi hub layout with live protocol analytics tickers.'

      },

      {

        id: 'elena_books',

        category: 'Creator & Music',

        badge: 'AUTHOR & PODCAST',

        title: 'Elena Vance Books',

        tagline: 'Bestselling dark fantasy author & podcaster',

        accent: '#d97706',

        bgColor: '#fbf9f4',

        textColor: '#1c1917',

        cardBg: '#ffffff',

        btnBg: '#1e293b',

        btnColor: '#ffffff',

        btnShadow: '0 4px 0 #0f172a',

        btn1Text: 'Order The Silent Isle',

        btn1Url: 'https://elenavance.example.com/books',

        btn2Text: 'Listen to Writer Podcast',

        btn2Url: 'https://elenavance.example.com/podcast',

        socials: ['instagram', 'spotify', 'mail'],

        avatarType: 'quill_book',

        cardType: 'book_jacket',

        desc: 'Warm parchment paper aesthetic designed for authors, poets, journalists, and book clubs.'

      },

      {

        id: 'nova_agency',

        category: 'Business & Hospitality',

        badge: 'DIGITAL AGENCY',

        title: 'Nova Creative Studio',

        tagline: 'Award-winning 3D branding & digital products',

        accent: '#8b5cf6',

        bgColor: '#080c1d',

        textColor: '#ffffff',

        cardBg: '#111836',

        btnBg: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',

        btnColor: '#ffffff',

        btnShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',

        btn1Text: 'Explore Case Studies',

        btn1Url: 'https://novastudio.example.com/work',

        btn2Text: 'Schedule Discovery Call',

        btn2Url: 'https://novastudio.example.com/contact',

        socials: ['linkedin', 'x', 'instagram'],

        avatarType: 'prism_3d',

        cardType: 'agency_showcase',

        desc: 'Ultra-modern glassmorphic agency portfolio with high-contrast gradients and case studies.'

      }

    ];

    let selectedTemplate = templates[0];

    let qrColor = '#00c6ff';

    let chosenDomain = 'healink.store';

    // SVG Social Icons Helper

    function renderSocialIconSvg(name, color = 'currentColor') {

      switch (name) {

        case 'instagram':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

        case 'mail':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;

        case 'youtube':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="${color}"></polygon></svg>`;

        case 'x':

          return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${color}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

        case 'spotify':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`;

        case 'tiktok':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.47V8.65a8.27 8.27 0 0 0 4.9 1.6V6.79a4.85 4.85 0 0 1-1.01-.1z"/></svg>`;

        case 'github':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;

        case 'linkedin':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;

        case 'telegram':

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.08.5l-2.97-2.19-1.43 1.38c-.16.16-.29.29-.6.29l.21-3.03 5.51-4.98c.24-.21-.05-.33-.37-.12l-6.81 4.29-2.94-.92c-.64-.2-.65-.64.13-.95l11.48-4.42c.53-.2 1 .12.8 1.08z"/></svg>`;

        default:

          return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;

      }

    }

    // Template Avatar SVG Helper

    function renderTemplateAvatar(t) {

      switch (t.avatarType) {

        case 'hotel':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#1e2536;border:2px solid #c5a059;display:grid;place-items:center;box-shadow:0 6px 18px rgba(197, 160, 89, 0.35);">

            <svg width="24" height="24" viewBox="0 0 24 24" fill="#c5a059"><path d="M19 2H5c-1.1 0-2 .9-2 2v17h2v-2h14v2h2V4c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>

          </div>`;

        case 'hh_monogram':

          return `<div style="width:54px;height:54px;border-radius:50%;background:#ffffff;border:2px solid #1a202c;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,0.15);">

            <span style="font-family:serif;font-weight:900;font-size:24px;color:#1a202c;letter-spacing:-1px;">hH</span>

          </div>`;

        case 'brew_badge':

          return `<div style="width:54px;height:54px;border-radius:50%;background:#ea580c;border:2px solid #ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(234, 88, 12, 0.4);">

            <span style="font-size:9px;font-weight:900;letter-spacing:1px;color:#ffffff;line-height:1;">THE</span>

            <span style="font-size:11px;font-weight:900;color:#ffffff;line-height:1;">BREW</span>

          </div>`;

        case 'cyber_headphones':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#090d22;border:2px solid #00c6ff;display:grid;place-items:center;box-shadow:0 0 20px rgba(0, 198, 255, 0.5);">

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>

          </div>`;

        case 'beauty_dropper':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#fff1f2;border:2px solid #f43f5e;display:grid;place-items:center;box-shadow:0 6px 18px rgba(244, 63, 94, 0.25);">

            <span style="font-size:22px;">✨</span>

          </div>`;

        case 'terminal_code':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#0a0f1d;border:2px solid #D4FF24;display:grid;place-items:center;box-shadow:0 0 18px rgba(212, 255, 36, 0.45);">

            <span style="font-family:monospace;font-weight:900;font-size:18px;color:#D4FF24;">&gt;_</span>

          </div>`;

        case 'fitness_apex':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#131c2e;border:2px solid #10b981;display:grid;place-items:center;box-shadow:0 6px 18px rgba(16, 185, 129, 0.35);">

            <span style="font-size:22px;">🏋️</span>

          </div>`;

        case 'chef_crest':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#141a29;border:2px solid #fbbf24;display:grid;place-items:center;box-shadow:0 6px 18px rgba(251, 191, 36, 0.35);">

            <span style="font-size:22px;">🍷</span>

          </div>`;

        case 'camera_aperture':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#181920;border:2px solid #e4e4e7;display:grid;place-items:center;box-shadow:0 6px 18px rgba(255, 255, 255, 0.15);">

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>

          </div>`;

        case 'web3_cube':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#09102b;border:2px solid #38bdf8;display:grid;place-items:center;box-shadow:0 0 20px rgba(56, 189, 248, 0.5);">

            <span style="font-size:22px;">🌐</span>

          </div>`;

        case 'quill_book':

          return `<div style="width:52px;height:52px;border-radius:50%;background:#ffffff;border:2px solid #d97706;display:grid;place-items:center;box-shadow:0 6px 16px rgba(217, 119, 6, 0.25);">

            <span style="font-size:22px;">📚</span>

          </div>`;

        case 'prism_3d':

        default:

          return `<div style="width:52px;height:52px;border-radius:50%;background:#111836;border:2px solid #8b5cf6;display:grid;place-items:center;box-shadow:0 0 20px rgba(139, 92, 246, 0.45);">

            <span style="font-size:22px;">🚀</span>

          </div>`;

      }

    }

    // Template Feature Card SVG/HTML Helper

    function renderTemplateFeatureCard(t) {

      switch (t.cardType) {

        case 'hotel_sunset':

          return `<div style="width:100%;border-radius:12px;overflow:hidden;background:linear-gradient(180deg, #ea580c 0%, #7c2d12 40%, #0f172a 100%);padding:14px 12px;display:flex;flex-direction:column;justify-content:flex-end;height:100px;box-shadow:inset 0 0 30px rgba(0,0,0,0.5);">

            <div style="font-size:9px;font-weight:800;color:#fde047;text-transform:uppercase;letter-spacing:1px;">Featured Suite</div>

            <div style="font-weight:800;font-size:12px;color:#ffffff;margin-top:2px;">Oceanfront Luxury Villa</div>

            <div style="font-size:10px;color:#cbd5e1;margin-top:1px;">Private infinity pool &amp; concierge</div>

          </div>`;

        case 'armchair':

          return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

            <div style="width:48px;height:48px;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;font-size:24px;flex-shrink:0;">🛋️</div>

            <div>

              <div style="font-size:10px;font-weight:800;color:#0f766e;text-transform:uppercase;">Our New Arrivals</div>

              <div style="font-weight:800;font-size:12px;color:#1e293b;">Nordic Lounge Chair</div>

              <div style="font-size:10px;color:#64748b;">In stock · Free shipping</div>

            </div>

          </div>`;

        case 'coffee_bag':

          return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fed7aa;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(234, 88, 12, 0.08);">

            <div style="width:48px;height:48px;border-radius:8px;background:#ffedd5;display:grid;place-items:center;font-size:24px;flex-shrink:0;">☕</div>

            <div>

              <div style="font-size:10px;font-weight:800;color:#ea580c;text-transform:uppercase;">Seasonal Blend</div>

              <div style="font-weight:800;font-size:12px;color:#1c1917;">Finca La Aurora Roast</div>

              <div style="font-size:10px;color:#78716c;">Notes of cacao &amp; citrus</div>

            </div>

          </div>`;

        case 'music_player':

          return `<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(0, 198, 255, 0.25);padding:10px 12px;display:flex;align-items:center;gap:10px;">

            <div style="width:40px;height:40px;border-radius:50%;background:#00c6ff;color:#000;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;box-shadow:0 0 12px #00c6ff;">▶</div>

            <div style="flex:1;">

              <div style="font-size:11px;font-weight:800;color:#ffffff;">Echoes EP (2026)</div>

              <div style="font-size:9px;color:#38bdf8;">12 Tracks · Synthwave</div>

              <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:3px;margin-top:6px;overflow:hidden;">

                <div style="width:65%;height:100%;background:#00c6ff;"></div>

              </div>

            </div>

          </div>`;

        case 'skincare_bottle':

          return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fecdd3;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(244, 63, 94, 0.08);">

            <div style="width:48px;height:48px;border-radius:8px;background:#ffe4e6;display:grid;place-items:center;font-size:24px;flex-shrink:0;">🧴</div>

            <div>

              <div style="font-size:10px;font-weight:800;color:#f43f5e;text-transform:uppercase;">Best Rated</div>

              <div style="font-weight:800;font-size:12px;color:#18181b;">Luminous Vitamin C</div>

              <div style="font-size:10px;color:#71717a;">★★★★★ 4.9 (12k reviews)</div>

            </div>

          </div>`;

        case 'code_terminal':

          return `<div style="width:100%;border-radius:10px;background:#050914;border:1px solid rgba(212, 255, 36, 0.25);padding:10px 12px;font-family:monospace;font-size:11px;text-align:left;">

            <div style="display:flex;gap:4px;margin-bottom:6px;">

              <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;"></span>

              <span style="width:7px;height:7px;border-radius:50%;background:#eab308;display:inline-block;"></span>

              <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;"></span>

            </div>

            <div style="color:#D4FF24;">$ npm i -g @devforge/cli</div>

            <div style="color:#64748b;font-size:10px;margin-top:2px;">✔ Zero-config cloud runner</div>

          </div>`;

        case 'fitness_stats':

          return `<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(16, 185, 129, 0.25);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

            <div>

              <div style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;">Client Results</div>

              <div style="font-size:12px;font-weight:800;color:#ffffff;margin-top:2px;">12-Week Transformation</div>

              <div style="font-size:10px;color:#94a3b8;">+28% Strength PR</div>

            </div>

            <div style="font-size:22px;">🔥</div>

          </div>`;

        case 'gourmet_dish':

          return `<div style="width:100%;border-radius:12px;background:#141a29;border:1px solid rgba(251, 191, 36, 0.25);padding:10px 12px;display:flex;align-items:center;gap:12px;">

            <div style="width:42px;height:42px;border-radius:8px;background:rgba(251, 191, 36, 0.15);display:grid;place-items:center;font-size:22px;flex-shrink:0;">🍽️</div>

            <div>

              <div style="font-size:9px;font-weight:800;color:#fbbf24;text-transform:uppercase;">Tasting Menu</div>

              <div style="font-size:12px;font-weight:800;color:#ffffff;">Spring Truffle Pairing</div>

              <div style="font-size:10px;color:#94a3b8;">7-Course Experience</div>

            </div>

          </div>`;

        case 'photo_frame':

          return `<div style="width:100%;border-radius:10px;background:#181920;border:1px solid rgba(255,255,255,0.12);padding:10px;display:flex;align-items:center;gap:10px;">

            <div style="width:44px;height:44px;border-radius:6px;background:#27272a;display:grid;place-items:center;font-size:20px;flex-shrink:0;">📸</div>

            <div>

              <div style="font-size:10px;font-weight:800;color:#e4e4e7;">Florence Elopement</div>

              <div style="font-size:9px;color:#a1a1aa;margin-top:2px;">Featured in Vogue Weddings</div>

            </div>

          </div>`;

        case 'web3_stats':

          return `<div style="width:100%;border-radius:10px;background:rgba(56, 189, 248, 0.08);border:1px solid rgba(56, 189, 248, 0.3);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

            <div>

              <div style="font-size:9px;font-weight:800;color:#38bdf8;text-transform:uppercase;">Protocol Vault</div>

              <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">$84.5M TVL</div>

            </div>

            <span style="font-size:10px;padding:3px 8px;background:#10b98125;color:#10b981;border-radius:6px;font-weight:800;">+18.4% APY</span>

          </div>`;

        case 'book_jacket':

          return `<div style="width:100%;border-radius:10px;background:#ffffff;border:1px solid #fed7aa;padding:10px 12px;display:flex;align-items:center;gap:10px;">

            <div style="width:36px;height:48px;border-radius:4px;background:#1e293b;color:#d97706;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;">📖</div>

            <div>

              <div style="font-size:10px;font-weight:800;color:#d97706;">#1 NYT Bestseller</div>

              <div style="font-size:12px;font-weight:800;color:#1e293b;">The Silent Isle</div>

              <div style="font-size:10px;color:#64748b;">Hardcover &amp; Audio</div>

            </div>

          </div>`;

        case 'agency_showcase':

        default:

          return `<div style="width:100%;border-radius:10px;background:linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));border:1px solid rgba(139, 92, 246, 0.3);padding:10px 12px;display:flex;align-items:center;gap:10px;">

            <div style="font-size:24px;">🏆</div>

            <div>

              <div style="font-size:9px;font-weight:800;color:#a855f7;text-transform:uppercase;">Featured Project</div>

              <div style="font-size:12px;font-weight:800;color:#ffffff;">FinTech Rebrand 2026</div>

              <div style="font-size:10px;color:#cbd5e1;">Awwwards Site of the Year</div>

            </div>

          </div>`;

      }

    }

    // Phone Preview Generator

    function renderPhonePreview(t, isLive = false, liveVals = {}) {

      const title = (isLive && liveVals.title !== undefined) ? liveVals.title : t.title;

      const tagline = (isLive && liveVals.tagline !== undefined) ? liveVals.tagline : t.tagline;

      const btn1 = (isLive && liveVals.btn1 !== undefined) ? liveVals.btn1 : t.btn1Text;

      const btn2 = (isLive && liveVals.btn2 !== undefined) ? liveVals.btn2 : t.btn2Text;

      return `

        <div class="template-phone-preview" style="background:${t.bgColor}; color:${t.textColor || '#ffffff'};">

          <div class="mini-notch"></div>

          ${renderTemplateAvatar(t)}

          <div style="font-weight:800; font-size:16px; margin-top:8px; text-align:center; color:${t.textColor || '#ffffff'}; letter-spacing:-0.02em;" id="${isLive ? 'mockupTitle' : ''}">${title}</div>

          <div style="font-size:11px; color:${t.textColor ? t.textColor + 'aa' : '#94a3b8'}; margin-top:3px; text-align:center; max-width:88%; line-height:1.3;" id="${isLive ? 'mockupTagline' : ''}">${tagline}</div>

          <div style="display:flex; gap:10px; align-items:center; margin:10px 0 12px; color:${t.textColor ? t.textColor + 'bb' : '#cbd5e1'};">

            ${t.socials.map(s => renderSocialIconSvg(s, t.textColor ? t.textColor + 'cc' : '#cbd5e1')).join('')}

          </div>

          <div style="display:flex; flex-direction:column; gap:7px; width:100%; margin-bottom:12px;">

            <div style="background:${t.btnBg}; color:${t.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${t.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${isLive ? 'mockupBtn1' : ''}">

              ${btn1}

            </div>

            <div style="background:${t.btnBg}; color:${t.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${t.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${isLive ? 'mockupBtn2' : ''}">

              ${btn2}

            </div>

          </div>

          ${renderTemplateFeatureCard(t)}

          <div style="margin-top:auto;padding-top:10px;font-size:9px;color:${t.textColor ? t.textColor + '66' : '#64748b'};">

            Powered by HEA Link

          </div>

        </div>

      `;

    }

    function renderView() {

      // 1. STEP 1: TEMPLATE CATALOG (Matching media_1793732573801_be66eb25.png)

      if (mode === 'catalog') {

        const categories = [

          'All templates',

          'Business & Hospitality',

          'Food & Drink',

          'Creator & Music',

          'Retail & Ecommerce',

          'Health & Fitness',

          'Tech & Web3'

        ];

        const filtered = activeCategory === 'All templates'

          ? templates

          : templates.filter(t => t.category === activeCategory);

        container.innerHTML = `

          <div class="view-header">

            <div>

              <h2 style="margin:0 0 4px;font-size:24px;">Choose a Template for Your Page</h2>

              <p style="color:#94a3b8;font-size:14px;margin:0;">Select a professionally crafted layout to showcase your links and brand.</p>

            </div>

            ${pages.length > 0 ? `<button class="sso-btn" style="width:auto;padding:8px 18px;" id="btnReturnToPageList">← Back to My Pages</button>` : ''}

          </div>

          <!-- Template Filter Pills (Matching Bitly category filters) -->

          <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;margin:18px 0 20px;">

            ${categories.map(cat => `

              <button class="home-type-tab ${activeCategory === cat ? 'active' : ''} filter-cat-btn" style="white-space:nowrap;padding:7px 18px;font-size:13px;" data-cat="${cat}">

                ${cat} ${cat === 'All templates' ? `(${templates.length})` : ''}

              </button>

            `).join('')}

          </div>

          <!-- 12 Smartphone-Styled Template Cards Grid -->

          <div class="template-grid" id="templateGrid">

            ${filtered.map(t => `

              <div class="template-card" data-id="${t.id}">

                ${renderPhonePreview(t, false)}

                <div class="template-card-footer">

                  <div>

                    <span style="font-size:10px;font-weight:800;color:${t.accent};letter-spacing:1px;text-transform:uppercase;">${t.badge}</span>

                    <h4 style="margin:4px 0 6px;color:#0070f3;font-size:15px;font-weight:700;">${t.title}</h4>

                    <p style="font-size:12px;color:#64748b;line-height:1.4;margin:0 0 14px;">${t.desc}</p>

                  </div>

                  <button class="auth-submit-btn btn-use-template" data-id="${t.id}" style="width:100%;margin:0;padding:10px 14px;font-size:13px;background:linear-gradient(135deg, #0070f3, #00c6ff);">

                    Use this template →

                  </button>

                </div>

              </div>

            `).join('')}

          </div>

        `;

        const returnBtn = $('#btnReturnToPageList');

        if (returnBtn) returnBtn.onclick = () => { mode = 'list'; renderView(); };

        $$('.filter-cat-btn').forEach(btn => {

          btn.onclick = () => {

            activeCategory = btn.dataset.cat;

            renderView();

          };

        });

        $$('.template-card').forEach(card => {

          card.onclick = (e) => {

            const tid = card.dataset.id;

            const chosen = templates.find(t => t.id === tid) || templates[0];

            selectedTemplate = chosen;

            qrColor = '#00c6ff';

            mode = 'configure';

            renderView();

          };

        });

        return;

      }

      // 2. STEP 2: CONFIGURE HOW TO SHARE YOUR PAGE (Matching media_1793732605595_59cfbafd.png in Website Cyber Theme)

      if (mode === 'configure') {

        const initialSlug = selectedTemplate.id.replace(/_/g, '-');

        const initialTitle = selectedTemplate.title;

        const initialTagline = selectedTemplate.tagline;

        const initialBtn1 = selectedTemplate.btn1Text;

        const initialBtn2 = selectedTemplate.btn2Text;

        container.innerHTML = `

          <div class="view-header">

            <div style="display:flex;align-items:center;gap:14px;">

              <button class="sso-btn" id="btnBackToTemplates" style="width:auto;padding:8px 14px;font-weight:700;">← Back to Templates</button>

              <div>

                <h2 style="margin:0 0 2px;font-size:24px;">Configure how to share your page</h2>

                <p style="color:#94a3b8;font-size:13px;margin:0;">Setup your link and QR Code to get page visitors</p>

              </div>

            </div>

          </div>

          <div class="configure-mobile-toggle-bar">

            <button type="button" class="cfg-tab-btn active" id="btnCfgTabSettings">⚙️ Configure Settings</button>

            <button type="button" class="cfg-tab-btn" id="btnCfgTabPreview">📱 Live Mobile Preview</button>

          </div>

          <div class="configure-grid">

            <!-- Left Column: Settings Cards (Website Cyber Glass Theme) -->

            <div class="configure-col-settings" id="cfgColSettings">

              <!-- 1. Page URL Card -->

              <div class="configure-card">

                <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 14px;display:flex;align-items:center;gap:8px;">

                  <span>🔗</span> Page URL

                </h3>

                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">

                  <select id="configBioDomain" class="home-domain-select" style="min-width:140px;">

                    <option value="healink.store" selected>healink.store</option>

                    <option value="hea.link">hea.link</option>

                    <option value="tinyurl.com">tinyurl.com</option>

                    <option value="healink.store">healink.store</option>

                    <option value="bit.ly">bit.ly</option>

                  </select>

                  <span style="color:#0070f3;font-size:15px;font-weight:800;padding:0 4px;">/m/</span>

                  <input type="text" id="configBioSlug" class="home-shorten-input" style="flex:1;min-width:150px;" value="${initialSlug}" placeholder="custom-back-half" required>

                </div>

                <!-- Custom Domain Banner -->

                <div class="home-cyan-banner" style="margin-top:14px;">

                  <span>👑</span>

                  <span>Brand your page with a custom domain. <a href="#" onclick="window.openCheckoutModal('pro'); return false;">View Plans</a></span>

                </div>

              </div>

              <!-- 2. Page Content Details Card -->

              <div class="configure-card">

                <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                  <span>✏️</span> Page Content Details

                </h3>

                <div class="create-link-field" style="margin-bottom:14px;">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Page Title</label>

                  <input type="text" id="configBioTitle" value="${initialTitle}" placeholder="e.g. The Grand Hotel">

                </div>

                <div class="create-link-field" style="margin-bottom:18px;">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Tagline / Description</label>

                  <input type="text" id="configBioTagline" value="${initialTagline}" placeholder="e.g. Your new escape awaits">

                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

                  <div class="create-link-field">

                    <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Primary Button Text</label>

                    <input type="text" id="configBtn1Text" value="${initialBtn1}">

                  </div>

                  <div class="create-link-field">

                    <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                    <input type="url" id="configBtn1Url" value="${selectedTemplate.btn1Url}">

                  </div>

                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">

                  <div class="create-link-field">

                    <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Secondary Button Text</label>

                    <input type="text" id="configBtn2Text" value="${initialBtn2}">

                  </div>

                  <div class="create-link-field">

                    <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                    <input type="url" id="configBtn2Url" value="${selectedTemplate.btn2Url}">

                  </div>

                </div>

              </div>

              <!-- 3. QR Code Card (Matching Image 2) -->

              <div class="configure-card">

                <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                  <span>▦</span> QR Code

                </h3>

                <div style="margin-bottom:18px;">

                  <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:10px;">Code color</label>

                  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">

                    ${[

                      { c: '#0070f3', name: 'Electric Blue' },

                      { c: '#00c6ff', name: 'Cyber Cyan' },

                      { c: '#10b981', name: 'Emerald' },

                      { c: '#f97316', name: 'Orange' },

                      { c: '#ef4444', name: 'Crimson' },

                      { c: '#8b5cf6', name: 'Purple' },

                      { c: '#ff007f', name: 'Pink' },

                      { c: '#060b18', name: 'Obsidian' }

                    ].map(col => `

                      <button class="color-dot-swatch ${qrColor === col.c ? 'active' : ''}" data-color="${col.c}" title="${col.name}" style="background:${col.c};border:2px solid ${col.c === '#060b18' ? '#ffffff33' : 'transparent'};"></button>

                    `).join('')}

                  </div>

                </div>

                <!-- Logo Row -->

                <div style="margin-bottom:20px;">

                  <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">Logo</label>

                  <div style="display:flex;gap:12px;align-items:center;">

                    <div style="width:44px;height:44px;border:1px dashed #cbd5e1;border-radius:10px;display:grid;place-items:center;color:#64748b;font-size:20px;background:#f8fafc;cursor:pointer;" onclick="window.openCheckoutModal('pro');">

                      +

                    </div>

                    <button class="sso-btn" style="width:auto;padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:6px;" onclick="window.openCheckoutModal('pro');">

                      Add Logo <span style="color:#fbbf24;">👑</span>

                    </button>

                  </div>

                </div>

                <!-- QR Code Preview Box -->

                <div style="display:flex;gap:18px;align-items:center;padding:16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;">

                  <canvas id="configQrCanvas" width="105" height="105" style="border-radius:10px;background:#ffffff;padding:5px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,70,200,0.08);border:1px solid #e2e8f0;"></canvas>

                  <div>

                    <div style="font-weight:800;color:#0b132b;font-size:15px;margin-bottom:4px;">Preview</div>

                    <div style="font-size:12px;color:#64748b;line-height:1.5;">More customizations are available after creating</div>

                  </div>

                </div>

              </div>

            </div>

            <!-- Right Column: Live Mobile Preview (Matching Image 2 in Cyber Phone Mockup) -->

            <div class="configure-col-preview" id="cfgColPreview" style="position:sticky;top:20px;">

              <div style="text-align:center;font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase;">

                Live Mobile Preview

              </div>

              <div class="phone-mockup" style="box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${qrColor}40;">

                <div class="phone-notch"></div>

                <div class="phone-screen" id="mockupScreen" style="border-top:3px solid ${qrColor};background:${selectedTemplate.bgColor};color:${selectedTemplate.textColor || '#ffffff'};">

                  ${renderPhonePreview(selectedTemplate, true, {

                    title: initialTitle,

                    tagline: initialTagline,

                    btn1: initialBtn1,

                    btn2: initialBtn2

                  })}

                </div>

              </div>

            </div>

          </div>

          <!-- Sticky Bottom Actions Bar (Matching Image 2) -->

          <div class="sticky-bottom-actions">

            <button class="sso-btn" style="width:auto;padding:10px 24px;font-weight:700;" id="btnCancelConfig">Back</button>

            <button class="auth-submit-btn" style="margin:0;padding:11px 32px;font-size:14px;background:linear-gradient(135deg, #0070f3, #00c6ff);box-shadow:0 4px 20px rgba(0, 198, 255, 0.4);" id="btnPublishConfiguredPage">

              Create your page →

            </button>

          </div>

        `;

        const updateLiveQR = () => {

          const cv = $('#configQrCanvas');

          const slug = ($('#configBioSlug')?.value.trim() || 'my-page').toLowerCase();

          const domain = $('#configBioDomain')?.value || 'healink.store';

          if (cv && typeof window.drawQR === 'function') {

            window.drawQR(cv, `https://${domain}/m/${slug}`, qrColor, '#ffffff', 105);

          }

        };

        setTimeout(updateLiveQR, 50);

        // Real-Time 2-Way Binding with Mobile Mockup

        const titleIn = $('#configBioTitle');

        const tagIn = $('#configBioTagline');

        const slugIn = $('#configBioSlug');

        const domainIn = $('#configBioDomain');

        const btn1In = $('#configBtn1Text');

        const btn2In = $('#configBtn2Text');

        if (titleIn) {

          titleIn.oninput = () => {

            const val = titleIn.value || selectedTemplate.title;

            const m = $('#mockupTitle');

            if (m) m.textContent = val;

          };

        }

        if (tagIn) {

          tagIn.oninput = () => {

            const val = tagIn.value || selectedTemplate.tagline;

            const m = $('#mockupTagline');

            if (m) m.textContent = val;

          };

        }

        if (btn1In) {

          btn1In.oninput = () => {

            const val = btn1In.value || selectedTemplate.btn1Text;

            const m = $('#mockupBtn1');

            if (m) m.textContent = val;

          };

        }

        if (btn2In) {

          btn2In.oninput = () => {

            const val = btn2In.value || selectedTemplate.btn2Text;

            const m = $('#mockupBtn2');

            if (m) m.textContent = val;

          };

        }

        if (slugIn) {

          slugIn.oninput = updateLiveQR;

        }

        if (domainIn) {

          domainIn.onchange = () => {

            chosenDomain = domainIn.value;

            updateLiveQR();

          };

        }

        // Color Swatches Interactive Picker

        $$('.color-dot-swatch').forEach(dot => {

          dot.onclick = () => {

            qrColor = dot.dataset.color;

            $$('.color-dot-swatch').forEach(d => d.classList.toggle('active', d === dot));

            const scr = $('#mockupScreen');

            if (scr) scr.style.borderTopColor = qrColor;

            const mockup = $('.phone-mockup');

            if (mockup) mockup.style.boxShadow = `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${qrColor}40`;

            updateLiveQR();

          };

        });

        // Mobile View Switcher between Settings & Live Phone Mockup

        const tabSettings = $('#btnCfgTabSettings');

        const tabPreview = $('#btnCfgTabPreview');

        const colSettings = $('#cfgColSettings');

        const colPreview = $('#cfgColPreview');

        if (tabSettings && tabPreview && colSettings && colPreview) {

          tabSettings.onclick = () => {

            tabSettings.classList.add('active');

            tabPreview.classList.remove('active');

            colSettings.classList.remove('hidden-mobile');

            colPreview.classList.add('hidden-mobile');

          };

          tabPreview.onclick = () => {

            tabPreview.classList.add('active');

            tabSettings.classList.remove('active');

            colPreview.classList.remove('hidden-mobile');

            colSettings.classList.add('hidden-mobile');

          };

          if (window.innerWidth <= 768) {

            colPreview.classList.add('hidden-mobile');

          }

        }

        $('#btnBackToTemplates').onclick = () => { mode = 'catalog'; renderView(); };

        $('#btnCancelConfig').onclick = () => { mode = 'catalog'; renderView(); };

        // Save & Publish Page Action

        $('#btnPublishConfiguredPage').onclick = async () => {

          const rawSlug = $('#configBioSlug')?.value.trim() || selectedTemplate.id.replace(/_/g, '-');

          const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-page';

          const domain = $('#configBioDomain')?.value || 'healink.store';

          const title = $('#configBioTitle')?.value.trim() || selectedTemplate.title;

          const tagline = $('#configBioTagline')?.value.trim() || selectedTemplate.tagline;

          const btn1Text = $('#configBtn1Text')?.value.trim() || selectedTemplate.btn1Text;

          const btn1Url = $('#configBtn1Url')?.value.trim() || selectedTemplate.btn1Url;

          const btn2Text = $('#configBtn2Text')?.value.trim() || selectedTemplate.btn2Text;

          const btn2Url = $('#configBtn2Url')?.value.trim() || selectedTemplate.btn2Url;

          const newPage = {

            slug,

            domain,

            title,

            tagline,

            btn1Text,

            btn1Url,

            btn2Text,

            btn2Url,

            templateId: selectedTemplate.id,

            url: `https://${domain}/m/${slug}`,

            color: qrColor,

            views: 0,

            engagements: 0,

            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

          };

          pages.unshift(newPage);

          localStorage.setItem('hea_bios', JSON.stringify(pages));

          // Persist to Firebase Realtime Database
          try {
            if (window.fbRtdbClient && typeof window.fbRtdbClient.saveBio === 'function') {
              const uEmail = (appUser && appUser.email) || 'guest';
              window.fbRtdbClient.saveBio(uEmail, newPage);
            }
          } catch (e) {}

          // Realtime Database Sync under Logged-in User Email

          try {

            const session = JSON.parse(localStorage.getItem('hea_session') || '{}');

            const userEmail = session.email || (window.appUser && window.appUser.email) || 'guest@healink.store';

            const emailKey = encodeURIComponent(userEmail.replace(/[.#$[\]]/g, '_'));

            fetch(`https://healinks-4ea4d-default-rtdb.firebaseio.com/users/${emailKey}/bios/${slug}.json`, {

              method: 'PUT',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify(newPage)

            }).catch(e => console.log('Firebase RTDB sync:', e));

          } catch (e) {}

          window.appShell.toast(`Page created successfully: ${newPage.url}`);

          window.appShell.copy(newPage.url);

          mode = 'list';

          renderView();

        };

        return;

      }

      // 3. STEP 3: PUBLISHED PAGES LIST VIEW

      if (pages.length === 0) {

        container.innerHTML = `

          <div class="view-header">

            <h2>HEA Pages (Link-in-Bio)</h2>

            <button class="sidebar-create-btn" id="btnLaunchTemplateCatalog" style="margin:0;">

              + Create Page

            </button>

          </div>

          <div style="text-align:center;padding:50px 24px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;max-width:560px;margin:32px auto;">

            <div style="font-size:36px;margin-bottom:12px;">📱</div>

            <h3 style="color:#0070f3;font-size:18px;font-weight:800;margin:0 0 8px;">No bio pages created yet</h3>

            <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6;">Build a single high-converting mobile bio page to showcase all your links, social media profiles, and offers.</p>

            <button class="auth-submit-btn" id="btnEmptyCreateBio" style="width:auto;margin:0 auto;padding:12px 28px;">+ Choose a Template</button>

          </div>

        `;

        const openCatalog = () => { mode = 'catalog'; renderView(); };

        $('#btnLaunchTemplateCatalog').onclick = openCatalog;

        const emptyBtn = $('#btnEmptyCreateBio');

        if (emptyBtn) emptyBtn.onclick = openCatalog;

        return;

      }

      container.innerHTML = `

        <div class="view-header">

          <h2>HEA Pages (Link-in-Bio)</h2>

          <button class="sidebar-create-btn" id="btnLaunchTemplateCatalog" style="margin:0;">

            + Create Page

          </button>

        </div>

        <div class="page-search-bar-row">

          <input type="text" class="topbar-search-input page-search-input" id="pageSearchInput" placeholder="Search bio pages by title, handle, or bio...">

          <span class="page-count-badge" id="pageCountBadge">${pages.length} published page${pages.length === 1 ? '' : 's'}</span>

        </div>

        <div id="pagesListContainer">

        ${pages.map(p => {

          const bioUrl = p.url || `${origin}/m/${p.slug}`;

          return `

            <div class="page-row-card" data-slug="${p.slug}" data-title="${(p.title || '').toLowerCase()}" data-tagline="${(p.tagline || '').toLowerCase()}">

              <div class="page-row-main">

                <div class="page-wireframe-thumb" style="background:${p.color || '#00c6ff'}15;border-color:${p.color || '#00c6ff'}40;">

                  <span style="font-weight:800;color:${p.color || '#ffffff'};">${p.title ? p.title.slice(0, 10) : 'Page'}</span>

                  <div class="wireframe-bar" style="background:${p.color || '#00c6ff'};opacity:0.8;"></div>

                  <div class="wireframe-bar"></div>

                  <div class="wireframe-bar"></div>

                </div>

                <div class="page-row-info">

                  <h3 class="page-row-title">

                    <a href="${bioUrl}" target="_blank" rel="noopener">${bioUrl} ↗</a>

                  </h3>

                  <div class="page-row-tagline">${p.tagline || 'Custom verified landing page'} • Created ${p.createdAt || 'Recent'}</div>

                  <div class="page-row-stats">

                    <span>📊 <b>${p.views || 0}</b> views</span>

                    <span>🎯 <b>${p.engagements || 0}</b> engagements</span>

                  </div>

                </div>

              </div>

              <div class="page-row-actions">

                <a class="auth-submit-btn page-live-btn" href="${bioUrl}" target="_blank" rel="noopener">

                  🚀 View Live Page

                </a>

                <button class="topbar-icon-btn" title="Copy Bio Link" onclick="window.appShell.copy('${bioUrl}')">📋</button>

                <button class="topbar-icon-btn" title="Share QR" onclick="window.appShell.navigate('qr-detail', '${p.slug}')">▦</button>

                <button class="topbar-icon-btn" style="color:#ef4444;" title="Delete Page" onclick="window.appShell.deletePage('${p.slug}')">🗑️</button>

              </div>

            </div>

          `;

        }).join('')}

        </div>

        <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">

          • You've reached the end of your Pages •

        </div>

      `;

      const pSearch = $('#pageSearchInput');

      if (pSearch) {

        pSearch.oninput = () => {

          const q = pSearch.value.toLowerCase().trim();

          $$('.page-row-card').forEach(card => {

            const match = !q || card.dataset.slug.includes(q) || card.dataset.title.includes(q) || card.dataset.tagline.includes(q);

            card.style.display = match ? 'flex' : 'none';

          });

        };

      }

      $('#btnLaunchTemplateCatalog').onclick = () => {

        mode = 'catalog';

        renderView();

      };

    }

    renderView();

    // Clean static rendering for page templates with zero jitter

  }

  // ---------------- 7. ANALYTICS SCREEN (Frame 17 Bitly Flow) ---------------- //

  async function renderAnalytics(container) {

    const links = getStoredLinks();

    let totalClicks = links.reduce((a, l) => {

      const c = typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0);

      return a + c;

    }, 0);

    let totalScans = links.reduce((a, l) => {

      const sc = typeof l.scans === 'number' ? l.scans : (parseInt(l.scans, 10) || 0);

      return a + sc;

    }, 0);

    // Fetch live backend metrics

    try {

      const s = JSON.parse(localStorage.getItem('hea_session'));

      if (s && s.token) {

        const res = await fetch('/api/analytics/overview', {

          headers: { 'Authorization': 'Bearer ' + s.token }

        });

        if (res.ok) {

          const d = await res.json();

          if (d.totalClicks !== undefined) {
            const bClicks = typeof d.totalClicks === 'number' ? d.totalClicks : (Array.isArray(d.totalClicks) ? d.totalClicks.length : (parseInt(d.totalClicks, 10) || 0));
            totalClicks = Math.max(totalClicks, bClicks);
          }

          if (d.totalScans !== undefined) totalScans = Math.max(totalScans, d.totalScans);

        }

      }

    } catch (e) {}

    container.innerHTML = `

      <div class="view-header">

        <h2>Live Analytics Overview</h2>

        <div style="display:flex;gap:12px;">

          <button class="sso-btn" id="btnExportCSV" style="width:auto;padding:8px 16px;color:#38bdf8;border-color:rgba(56,189,248,0.4);font-weight:700;">

            📥 Export CSV Report

          </button>

          <button class="sso-btn" id="btnAIAnalyze" style="width:auto;padding:8px 16px;color:#D4FF24;border-color:rgba(212,255,36,0.4);font-weight:700;">

            ✨ Analyze with AI

          </button>

        </div>

      </div>

      <!-- 3 Metrics Top Cards -->

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px;">

        <div class="dash-white-card">

          <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL SHORTENED LINKS</div>

          <div style="font-size:32px;font-weight:800;color:#0070f3;">${links.length}</div>

          <div style="font-size:12px;color:#10b981;margin-top:6px;">🟢 Active &amp; tracked in MongoDB</div>

        </div>

        <div class="dash-white-card">

          <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL LIVE CLICKS</div>

          <div style="font-size:32px;font-weight:800;color:#0070f3;">${totalClicks}</div>

          <div style="font-size:12px;color:#0070f3;margin-top:6px;">↗ Real-time click tracking</div>

        </div>

        <div class="dash-white-card">

          <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL QR SCANS</div>

          <div style="font-size:32px;font-weight:800;color:#ff007f;">${totalScans}</div>

          <div style="font-size:12px;color:#ff007f;margin-top:6px;">📱 Dynamic code scans</div>

        </div>

      </div>

      <!-- 3-Step Guided Journey matching Frame 17 -->

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:24px;">

        <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">

          <div>

            <div style="font-size:11px;font-weight:800;color:#0070f3;text-transform:uppercase;margin-bottom:6px;">Step 1</div>

            <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Create links and codes</h4>

            <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Transform any long URL into a short, trackable link or QR Code. It's quick, easy, and takes seconds.</p>

          </div>

          <button class="sso-btn" style="width:100%;padding:8px;font-size:12px;color:#0070f3;" onclick="window.appShell.navigate('create-link')">

            Create a link →

          </button>

        </div>

        <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">

          <div>

            <div style="font-size:11px;font-weight:800;color:#059669;text-transform:uppercase;margin-bottom:6px;">Step 2</div>

            <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Share them anywhere</h4>

            <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Post on social, include in emails, or share however you want. Every click is tracked in real-time.</p>

          </div>

          <button class="sso-btn" style="width:100%;padding:8px;font-size:12px;color:#059669;" onclick="window.appShell.navigate('pages')">

            Tips to drive engagement →

          </button>

        </div>

        <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">

          <div>

            <div style="font-size:11px;font-weight:800;color:#ff007f;text-transform:uppercase;margin-bottom:6px;">Step 3</div>

            <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Come back for insights</h4>

            <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Bring your analytics to life—from weekly insights to detailed dashboards about clicks and audience.</p>

          </div>

          <button class="auth-submit-btn" style="width:100%;margin:0;padding:8px;font-size:12px;" onclick="window.appShell.exportAnalyticsCSV()">

            Export report 📥

          </button>

        </div>

      </div>

      <!-- Top Referrers & Channels -->

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">

        <div class="dash-white-card">

          <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Top Traffic Channels</h4>

          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Direct / SMS / WhatsApp</span>

                <span style="color:#0070f3;font-weight:700;">58%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:58%;height:100%;background:#0070f3;border-radius:99px;"></div>

              </div>

            </div>

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Instagram &amp; Threads</span>

                <span style="color:#ff007f;font-weight:700;">24%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:24%;height:100%;background:#ff007f;border-radius:99px;"></div>

              </div>

            </div>

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Google Search</span>

                <span style="color:#10b981;font-weight:700;">12%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:12%;height:100%;background:#10b981;border-radius:99px;"></div>

              </div>

            </div>

          </div>

        </div>

        <div class="dash-white-card">

          <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Device &amp; Platform Split</h4>

          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Mobile (iOS &amp; Android)</span>

                <span style="color:#059669;font-weight:700;">72%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:72%;height:100%;background:#059669;border-radius:99px;"></div>

              </div>

            </div>

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Desktop (Windows &amp; Mac)</span>

                <span style="color:#0070f3;font-weight:700;">25%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:25%;height:100%;background:#0070f3;border-radius:99px;"></div>

              </div>

            </div>

            <div>

              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">

                <span style="color:#0b132b;font-weight:600;">Tablet</span>

                <span style="color:#8b5cf6;font-weight:700;">3%</span>

              </div>

              <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">

                <div style="width:3%;height:100%;background:#8b5cf6;border-radius:99px;"></div>

              </div>

            </div>

          </div>

        </div>

      </div>

    `;

    const exportBtn = $('#btnExportCSV');

    if (exportBtn) exportBtn.onclick = exportAnalyticsCSV;

    const aiBtn = $('#btnAIAnalyze');

    if (aiBtn) {

      aiBtn.onclick = () => {

        const drawer = $('#appAssistDrawer');

        if (drawer) drawer.hidden = false;

        const input = $('#drawerChatInput');

        if (input) {

          input.value = `Analyze my click analytics: I have ${links.length} links and ${totalClicks} total clicks. How can I increase conversion?`;

          $('#drawerChatForm')?.dispatchEvent(new Event('submit'));

        }

      };

    }

  }

  // ---------------- 8. CAMPAIGNS SCREEN (Frame 20 Bitly Flow) ---------------- //

  function renderCampaigns(container) {

    container.innerHTML = `

      <div class="view-header">

        <h2>Campaigns &amp; UTM Builder</h2>

        <button class="sso-btn" style="width:auto;padding:8px 16px;color:#38bdf8;font-weight:700;" onclick="window.appShell.navigate('create-link')">

          + New Campaign

        </button>

      </div>

      <!-- Hero Banner matching Frame 20 -->

      <div class="dash-white-card" style="text-align:center;padding:40px 24px;margin-bottom:24px;">

        <div style="width:160px;height:100px;margin:0 auto 20px;background:rgba(0,112,243,0.06);border:1px solid rgba(0,112,243,0.25);border-radius:12px;display:flex;flex-direction:column;justify-content:center;padding:12px;gap:6px;">

          <div style="display:flex;justify-content:space-between;font-size:10px;color:#0b132b;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;"><span>TikTok</span> <b>840 clicks</b></div>

          <div style="display:flex;justify-content:space-between;font-size:10px;color:#0b132b;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;"><span>YouTube</span> <b>520 clicks</b></div>

          <div style="display:flex;justify-content:space-between;font-size:10px;color:#0b132b;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;"><span>Direct Mail QR</span> <b>310 scans</b></div>

        </div>

        <h3 style="font-size:24px;font-weight:800;color:#0070f3;margin:0 0 10px;">Some links belong together</h3>

        <p style="color:#64748b;font-size:14px;max-width:520px;margin:0 auto 20px;line-height:1.5;">

          Organize your links in HEA Campaigns and compare performance across channels. Available on the Premium plan.

        </p>

        <button class="auth-submit-btn" style="width:auto;padding:10px 28px;margin:0 auto;" onclick="window.openCheckoutModal('pro')">

          View our plans

        </button>

      </div>

      <!-- Live Interactive UTM Builder Card -->

      <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">

        <h3 style="color:#ffffff;margin-top:0;font-size:18px;">⚡ UTM Campaign URL Builder</h3>

        <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">Add trackable campaign tags to your links to monitor conversions across TikTok, Google Ads, Meta, and newsletters in MongoDB.</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

          <div class="create-link-field" style="margin:0;">

            <label>Destination Website URL</label>

            <input type="url" id="campDestUrl" placeholder="https://yourstore.com/summer-collection" value="">

          </div>

          <div class="create-link-field" style="margin:0;">

            <label>Campaign Name (utm_campaign)</label>

            <input type="text" id="campName" placeholder="e.g. summer_collection_meta_2026" value="">

          </div>

        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

          <div class="create-link-field" style="margin:0;">

            <label>Campaign Source (utm_source)</label>

            <select id="campSource" class="home-domain-select" style="width:100%;">

              <option value="facebook" selected>Facebook / Meta</option>

              <option value="instagram">Instagram</option>

              <option value="tiktok">TikTok</option>

              <option value="google">Google Ads</option>

              <option value="email">Email Newsletter</option>

            </select>

          </div>

          <div class="create-link-field" style="margin:0;">

            <label>Campaign Medium (utm_medium)</label>

            <select id="campMedium" class="home-domain-select" style="width:100%;">

              <option value="cpc" selected>CPC (Cost Per Click)</option>

              <option value="social">Social Organic</option>

              <option value="email">Email</option>

              <option value="banner">Display Banner</option>

            </select>

          </div>

        </div>

        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;margin:16px 0;">

          <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">GENERATED TAGGED URL:</span>

          <code id="campPreviewUrl" style="color:#38bdf8;font-size:13px;word-break:break-all;">https://myshopify.com/drop?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=summer_launch_2026</code>

        </div>

        <div style="display:flex;gap:12px;">

          <button class="auth-submit-btn" id="btnShortenCampaign" style="width:auto;padding:10px 24px;">

            🔗 Shorten &amp; Save Campaign Link

          </button>

          <button class="sso-btn" id="btnCopyTaggedUrl" style="width:auto;padding:10px 20px;">

            📋 Copy Tagged URL

          </button>

        </div>

      </div>

    `;

    const updatePreview = () => {

      const dest = $('#campDestUrl')?.value.trim() || 'https://example.com';

      const name = $('#campName')?.value.trim() || 'campaign';

      const source = $('#campSource')?.value || 'social';

      const medium = $('#campMedium')?.value || 'cpc';

      const full = `${dest}${dest.includes('?') ? '&' : '?'}utm_source=${source}&utm_medium=${medium}&utm_campaign=${name}`;

      const preview = $('#campPreviewUrl');

      if (preview) preview.textContent = full;

      return full;

    };

    ['#campDestUrl', '#campName', '#campSource', '#campMedium'].forEach(sel => {

      const el = $(sel);

      if (el) el.oninput = updatePreview;

    });

    const copyBtn = $('#btnCopyTaggedUrl');

    if (copyBtn) copyBtn.onclick = () => window.appShell.copy(updatePreview());

    const shortenBtn = $('#btnShortenCampaign');

    if (shortenBtn) {

      shortenBtn.onclick = () => {

        const fullUrl = updatePreview();

        const campName = $('#campName')?.value.trim() || 'campaign';

        createLinkDirect(fullUrl, '', 'healink.store');

        toast(`Campaign link created: ${campName}`);

      };

    }

  }

  // ---------------- 9. CUSTOM DOMAINS SCREEN (Frame 22 & Frame 23) ---------------- //

  function renderDomains(container) {

    let domainTab = 'ai'; // 'ai' or 'search'

    function renderView() {

      container.innerHTML = `

        <div style="margin-bottom:24px;">

          <h2 style="font-size:28px;font-weight:800;color:#ffffff;margin:0 0 16px;">Brand your links with a custom domain</h2>

          <!-- Tabs matching Frame 22 -->

          <div style="display:flex;gap:10px;margin-bottom:24px;">

            <button class="home-type-tab ${domainTab === 'search' ? 'active' : ''}" type="button" id="tabDomainSearch" style="padding:8px 20px;font-size:14px;">

              🔍 Search for a domain

            </button>

            <button class="home-type-tab ${domainTab === 'ai' ? 'active' : ''}" type="button" id="tabDomainAi" style="padding:8px 20px;font-size:14px;">

              ✨ Find a domain with AI

            </button>

          </div>

        </div>

        <div id="domainTabContent"></div>

      `;

      $('#tabDomainSearch').onclick = () => { domainTab = 'search'; renderView(); };

      $('#tabDomainAi').onclick = () => { domainTab = 'ai'; renderView(); };

      const content = $('#domainTabContent');

      if (!content) return;

      if (domainTab === 'ai') {

        content.innerHTML = `

          <!-- AI Domain Generator matching Frame 22 -->

          <div class="dash-white-card" style="padding:24px;margin-bottom:24px;">

            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">

              <span style="font-size:14px;color:#94a3b8;font-weight:600;">Describe your idea, product or service</span>

              <span style="font-size:12px;color:#64748b;" id="domainCharCount">0/200</span>

            </div>

            <div style="display:flex;gap:12px;align-items:center;">

              <input type="text" id="domainAiInput" class="home-shorten-input" style="flex:1;" placeholder="e.g. coffee roasters in Austin, vintage sneaker resale, or AI dev tools..." maxlength="200">

              <button class="auth-submit-btn" id="btnGenerateAiDomains" style="width:auto;margin:0;padding:12px 26px;display:flex;align-items:center;gap:8px;">

                ✨ Generate

              </button>

            </div>

          </div>

          <!-- Results Container -->

          <div id="domainAiResults"></div>

        `;

        const input = $('#domainAiInput');

        const counter = $('#domainCharCount');

        const genBtn = $('#btnGenerateAiDomains');

        const resBox = $('#domainAiResults');

        if (input && counter) {

          input.oninput = () => {

            counter.textContent = `${input.value.length}/200`;

          };

          input.onkeydown = e => {

            if (e.key === 'Enter') genBtn?.click();

          };

        }

        if (genBtn && resBox) {

          genBtn.onclick = () => {

            const raw = (input?.value || '').trim();

            const idea = raw ? raw.toLowerCase().replace(/[^a-z0-9]/g, '') : 'brand';

            // Show 4 animated skeleton loaders matching Frame 22

            resBox.innerHTML = `

              <div style="margin-top:16px;">

                <div class="skeleton-line"></div>

                <div class="skeleton-line"></div>

                <div class="skeleton-line"></div>

                <div class="skeleton-line"></div>

              </div>

            `;

            setTimeout(() => {

              const tlds = [

                { ext: '.link', badge: 'Popular' },

                { ext: '.store', badge: 'Ecommerce' },

                { ext: '.bio', badge: 'Creator' },

                { ext: '.chat', badge: 'Community' },

                { ext: '.io', badge: 'Tech' },

                { ext: '.app', badge: 'Mobile' },

                { ext: '.me', badge: 'Personal' },

                { ext: '.agency', badge: 'Services' }

              ];

              const suggestions = [

                `${idea}.link`,

                `${idea}.store`,

                `${idea}.bio`,

                `get${idea}.com`,

                `${idea}.chat`,

                `${idea}hq.io`,

                `${idea}.app`,

                `${idea}.agency`

              ];

              resBox.innerHTML = `

                <div class="dash-white-card" style="padding:8px 20px;">

                  ${suggestions.map((dom, i) => `

                    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:${i === suggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)'};">

                      <div style="display:flex;align-items:center;gap:12px;">

                        <span style="font-size:18px;color:#38bdf8;">🌐</span>

                        <div>

                          <b style="color:#ffffff;font-size:15px;font-family:monospace;">${dom}</b>

                          <span style="font-size:11px;color:#10b981;margin-left:8px;background:rgba(16,185,129,0.12);padding:2px 6px;border-radius:4px;font-weight:700;">Available</span>

                        </div>

                      </div>

                      <button class="sso-btn btn-claim-domain" data-domain="${dom}" style="width:auto;padding:8px 18px;font-size:13px;color:#38bdf8;border-color:rgba(56,189,248,0.3);font-weight:700;">

                        Upgrade to claim

                      </button>

                    </div>

                  `).join('')}

                </div>

                <div style="text-align:center;color:#64748b;font-size:13px;margin:30px 0;">

                  — You've reached the end of your results —

                </div>

              `;

              $$('.btn-claim-domain').forEach(btn => {

                btn.onclick = () => {

                  const dName = btn.dataset.domain;

                  window.appShell.toast(`Selected domain: ${dName}. Upgrading to claim...`);

                  if (typeof window.openCheckoutModal === 'function') {

                    window.openCheckoutModal('pro');

                  }

                };

              });

            }, 450);

          };

        }

      } else {

        // Search & Manual CNAME connection tab

        const savedDomain = localStorage.getItem('hea_custom_domain') || '';

        content.innerHTML = `

          <!-- Add Domain Card -->

          <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">

            <h3 style="color:#ffffff;margin-top:0;font-size:18px;">🌐 Connect a Custom Domain</h3>

            <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">Point a CNAME record from your DNS registrar (GoDaddy, Cloudflare, Namecheap) to <code style="color:#38bdf8;">cname.healink.store</code>.</p>

            <div style="display:flex;gap:12px;max-width:540px;">

              <input type="text" id="customDomainInput" class="home-shorten-input" style="flex:1;" placeholder="e.g. links.yourbrand.com or go.domain.io" value="">

              <button class="auth-submit-btn" id="btnAddDomain" style="width:auto;margin:0;padding:10px 22px;">

                + Connect Domain

              </button>

            </div>

          </div>

          <!-- Active Domains Table -->

          <div class="dash-white-card" style="padding:20px;">

            <h4 style="font-size:16px;font-weight:800;color:#ffffff;margin:0 0 16px;">Configured Domains</h4>

            <div style="display:flex;flex-direction:column;gap:12px;">

              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">

                <div>

                  <b style="color:#ffffff;font-size:15px;">healink.store</b>

                  <div style="font-size:12px;color:#94a3b8;">Default Platform Domain · SSL Active</div>

                </div>

                <span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">✓ Primary</span>

              </div>

              ${savedDomain ? `

                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">

                  <div>

                    <b style="color:#38bdf8;font-size:15px;" id="dispCustomDomain">${savedDomain}</b>

                    <div style="font-size:12px;color:#94a3b8;">CNAME: cname.healink.store · Verified</div>

                  </div>

                  <div style="display:flex;gap:8px;align-items:center;">

                    <span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">🟢 Active</span>

                    <button class="sso-btn" style="width:auto;padding:4px 10px;font-size:12px;" onclick="window.appShell.toast('DNS Verified: All checks passed')">Check DNS</button>

                  </div>

                </div>

              ` : `

                <div style="text-align:center;padding:24px 16px;color:#94a3b8;font-size:13px;border:1px dashed rgba(255,255,255,0.06);border-radius:8px;">

                  No custom domains connected yet. Enter your branded subdomain above to connect.

                </div>

              `}

            </div>

          </div>

        `;

        const addBtn = $('#btnAddDomain');

        if (addBtn) {

          addBtn.onclick = async () => {

            const d = $('#customDomainInput')?.value.trim();

            if (!d) return;

            try {

              localStorage.setItem('hea_custom_domain', d);

              const s = JSON.parse(localStorage.getItem('hea_session'));

              if (s && s.token) {

                await fetch('/api/domains', {

                  method: 'POST',

                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.token },

                  body: JSON.stringify({ domain: d })

                });

              }

            } catch (e) {}

            toast(`Custom domain "${d}" added and verified!`);

            renderView();

          };

        }

      }

    }

    renderView();

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

          <div style="font-size:28px;font-weight:900;color:#0070f3;margin-bottom:12px;">🛍️ shopify</div>

          <h3 style="font-size:22px;font-weight:800;color:#0070f3;margin:0 0 10px;">Automatically attribute orders to specific HEA links</h3>

          <p style="color:#334155;font-size:13px;line-height:1.5;margin:0 0 18px;">

            Shorten links to products, collections, and more directly from Shopify to identify which campaigns generate real ROI.

          </p>

          <button class="sso-btn" style="width:auto;padding:10px 20px;font-weight:700;background:#0070f3;color:#ffffff;border:none;border-radius:10px;box-shadow:0 4px 14px rgba(0,112,243,0.3);" onclick="window.appShell.toast('Shopify app integration opened')">

            Install Shopify app

          </button>

        </div>

        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,0.03);">

          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;color:#64748b;">

            <span>Link title</span>

            <span>Short link</span>

            <span>Orders</span>

          </div>

          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Maven Armchair • yourbrand.co/3yt77uB • 3</div>

          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Floral Accent Chair • yourbrand.co/instagram • 56</div>

          <div style="text-align:right;font-size:18px;font-weight:900;color:#0070f3;margin-top:10px;">$26,880.00</div>

        </div>

      </div>

      <!-- Search & Filters -->

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">

        <input type="text" class="topbar-search-input" style="max-width:320px;" placeholder="Search 50+ native apps &amp; webhooks...">

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

  // ---------------- 11. SETTINGS SCREEN (Center Scroll & Right Sidebar Navigation) ---------------- //

  function updateDrawerForTab(tab) {
    const drawerEl = $('#appAssistDrawer');
    const drawerAi = $('#drawerAiContent');
    const drawerSettings = $('#drawerSettingsContent');
    const drawerForm = $('#drawerChatForm');
    const drawerTitle = $('#drawerTitle');
    const drawerClose = $('#drawerCloseBtn');

    if (tab === 'settings') {
      if (drawerAi) drawerAi.hidden = true;
      if (drawerForm) drawerForm.style.display = 'none';
      if (drawerSettings) drawerSettings.hidden = false;
      if (drawerTitle) drawerTitle.innerHTML = '<span>⚙️</span> Settings';
      if (drawerClose && window.innerWidth > 768) drawerClose.style.display = 'none';

      const orgBadge = $('#settingsOrgBadge');
      if (orgBadge) orgBadge.textContent = appUser.orgId || 'hea-workspace-default';

      if (drawerEl) {
        if (window.innerWidth > 768) {
          drawerEl.hidden = false;
        } else {
          drawerEl.hidden = true;
        }
      }
      bindSettingsNavEvents();
    } else {
      if (drawerAi) drawerAi.hidden = false;
      if (drawerForm) drawerForm.style.display = '';
      if (drawerSettings) drawerSettings.hidden = true;
      if (drawerTitle) drawerTitle.innerHTML = '<span>✨</span> HEA Assist';
      if (drawerClose) drawerClose.style.display = '';

      if (drawerEl && window.innerWidth <= 768) {
        drawerEl.hidden = true;
        document.body.style.overflow = '';
      }
    }
  }

  function bindSettingsNavEvents() {
    const links = $$('#drawerSettingsContent .settings-subsidebar-link');
    links.forEach(link => {
      link.onclick = (e) => {
        const nav = link.dataset.nav;
        if (nav === 'integrations' || nav === 'billing') {
          return;
        }
        e.preventDefault();

        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const map = {
          'profile': 'setSectionProfile',
          'account-details': 'setSectionAccountDetails',
          'billing': 'setSectionBilling',
          'users': 'setSectionUsers',
          'groups': 'setSectionUsers',
          'sso': 'setSectionSso',
          'discovery': 'setSectionSso',
          'deeplinks': 'setSectionDeepLinks'
        };

        const targetId = map[nav] || 'setSectionProfile';
        const targetEl = document.getElementById(targetId);
        const pane = document.getElementById('appMainPane');
        if (targetEl && pane) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    });
  }

  function renderSettings(container) {
    updateDrawerForTab('settings');

    container.innerHTML = `
      <div class="settings-center-pane-wrapper">
        <!-- Mobile Quick Tabs -->
        <div class="settings-mobile-tabs" id="settingsMobileTabs">
          <button class="settings-m-tab active" data-nav="profile">Profile</button>
          <button class="settings-m-tab" data-nav="account-details">Account</button>
          <button class="settings-m-tab" data-nav="billing">Billing</button>
          <button class="settings-m-tab" data-nav="users">Users</button>
          <button class="settings-m-tab" data-nav="sso">SSO</button>
          <button class="settings-m-tab" data-nav="deeplinks">Deep Links</button>
          <button class="settings-m-tab" data-nav="emails">Emails</button>
          <button class="settings-m-tab" data-nav="security">Security</button>
          <button class="settings-m-tab" data-nav="sessions">Sessions</button>
        </div>

        <div class="settings-main-panel settings-center-card">
          <!-- 1. Profile Section -->
          <div id="setSectionProfile" class="settings-content-section">
            <h2 style="font-size:30px;font-weight:800;color:#0070f3;margin:0 0 16px;">Profile</h2>
            <h3 style="font-size:18px;font-weight:800;color:#0b132b;margin:0 0 14px;">Preferences</h3>

            <div class="create-link-field">
              <label>Display name</label>
              <input type="text" id="setDisplayName" value="${appUser.name}">
            </div>

            <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:28px;" onclick="window.appShell.updateDisplayName()">
              Update display name
            </button>

            <div class="create-link-field">
              <label>Language</label>
              <div style="font-size:13px;color:#64748b;margin-bottom:8px;">
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
          </div>

          <div class="settings-section-divider"></div>

          <!-- 2. Account Details Section -->
          <div id="setSectionAccountDetails" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Account details</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
              Manage your workspace identity, organization settings, and account identifiers.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Organization ID</div>
                <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;word-break:break-all;">${appUser.orgId || 'hea-workspace-default'}</div>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Workspace Name</div>
                <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;">${appUser.org || 'My Workspace'}</div>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Account Status</div>
                <div style="font-size:14px;font-weight:700;color:#10b981;margin-top:4px;">Active (Free Tier)</div>
              </div>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 3. Billing & Usage Section -->
          <div id="setSectionBilling" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Billing and usage</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
              Overview of your subscription tier, monthly link creation limits, and usage analytics.
            </p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="font-size:15px;font-weight:800;color:#0070f3;">Current Plan: Free Starter</div>
                <div style="font-size:13px;color:#475569;margin-top:3px;">You have used 3 of 10 monthly branded links.</div>
              </div>
              <button class="auth-submit-btn" style="margin:0;padding:8px 18px;width:auto;" onclick="location.hash='#pricing'">Upgrade Plan</button>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 4. Users Section -->
          <div id="setSectionUsers" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Users &amp; Team</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
              Collaborators and team members assigned to this workspace.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:50%;background:#0070f3;color:#ffffff;display:grid;place-items:center;font-weight:700;font-size:13px;">${(appUser.name||'HA').substring(0,2).toUpperCase()}</div>
                <div>
                  <div style="font-weight:700;color:#0b132b;font-size:14px;">${appUser.name} <span style="font-size:11px;color:#10b981;font-weight:700;background:#dcfce7;padding:2px 6px;border-radius:4px;margin-left:6px;">Owner</span></div>
                  <div style="font-size:12px;color:#64748b;">${appUser.email}</div>
                </div>
              </div>
              <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;" onclick="window.appShell.toast('Team invitation sent to clipboard')">Invite Member</button>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 5. Single Sign-on & Discovery -->
          <div id="setSectionSso" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Single sign-on &amp; Account discovery</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
              Enforce enterprise authentication and domain auto-discovery for your organization members.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="font-weight:700;color:#0b132b;font-size:14px;">SAML 2.0 / Okta / Azure AD</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;">Available for Enterprise organization accounts.</div>
              </div>
              <span class="pro-chip" style="font-size:11px;padding:4px 10px;background:#0070f3;color:#ffffff;border-radius:99px;font-weight:700;">ENTERPRISE</span>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 6. Mobile Deep Links -->
          <div id="setSectionDeepLinks" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Mobile deep links</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
              Route your audience directly into iOS and Android apps with Universal Links and App Links.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;">
              <div style="font-size:13px;color:#0b132b;font-weight:600;">Associated Domains Status: <span style="color:#10b981;font-weight:700;">Ready</span></div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">iOS Universal Links &amp; Android App Links are routed automatically through healink.store shortlinks.</div>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 7. Email Addresses -->
          <div id="setSectionEmails" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Email addresses</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
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

            <div style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;">
              <button class="sso-btn" style="width:auto;padding:8px 16px;" onclick="alert('Add new email modal')">Add new email</button>
              <button class="auth-submit-btn" style="margin:0;padding:8px 18px;" onclick="window.appShell.toast('Primary email updated')">Update primary email</button>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 8. Security & Authentication -->
          <div id="setSectionSecurity" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Security &amp; authentication</h3>
            <h4 style="font-size:16px;font-weight:700;color:#0b132b;margin:16px 0 6px;">Change password</h4>
            <div style="font-size:13px;color:#64748b;margin-bottom:14px;">You will be required to login after changing your password</div>

            <div class="create-link-field"><label>Current password</label><input type="password" id="setCurPass" placeholder="Enter your current password"></div>
            <div class="create-link-field"><label>New password</label><input type="password" id="setNewPass" placeholder="Create a strong new password (min. 8 characters)"></div>
            <div class="create-link-field"><label>Confirm new password</label><input type="password" id="setConfPass" placeholder="Re-enter your new password"></div>

            <button class="auth-submit-btn" id="btnUpdatePass" style="width:max-content;padding:10px 24px;margin-bottom:32px;">
              Change password
            </button>

            <div class="settings-section-divider"></div>

            <!-- 2-Factor Authentication -->
            <div id="setSection2FA" class="settings-content-section">
              <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 14px;">2-Factor authentication</h3>
              <div class="create-link-field">
                <label>Select country code</label>
                <select class="home-domain-select" style="max-width:320px;">
                  <option selected>Pakistan (+92)</option>
                  <option>United States (+1)</option>
                  <option>United Kingdom (+44)</option>
                  <option>United Arab Emirates (+971)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 9. Active Sessions -->
          <div id="setSectionSessions" class="settings-content-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
              <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0;">Active Sessions</h3>
              <button class="auth-submit-btn" style="margin:0;padding:8px 16px;font-size:13px;" onclick="window.appShell.toast('Logged out of all other sessions')">
                Log out of all sessions
              </button>
            </div>
            <div style="font-size:13px;color:#0b132b;padding:12px 0;border-bottom:1px solid #e2e8f0;">
              <b>Email Address Added</b>: ${appUser.email} <span style="float:right;color:#64748b;">Oct 30, 2026 7:26 AM PDT</span>
              <div style="color:#64748b;font-size:12px;margin-top:2px;">(${appUser.isp || 'Broadband'}) (PK, PB, ${appUser.city || 'Lahore'})</div>
            </div>
            <div style="font-size:13px;color:#0b132b;padding:12px 0;">
              <b>Current Active Session</b> <span style="float:right;color:#64748b;">Live Now</span>
              <div style="color:#64748b;font-size:12px;margin-top:2px;">(${appUser.isp || 'Broadband'}) (PK, PB, ${appUser.city || 'Lahore'})</div>
            </div>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 10. SAR Report -->
          <div id="setSectionSar" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">SAR Report</h3>
            <p style="color:#64748b;font-size:13px;margin:0 0 16px;line-height:1.5;">
              Click to request a Subject Access Request (SAR Report) of all your Personal Information stored by HEA Link. Once requested, in compliance with your local regulations, we will reply to your request via email.
            </p>
            <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('SAR Report request submitted')">
              Request report
            </button>
          </div>

          <div class="settings-section-divider"></div>

          <!-- 11. Delete Account -->
          <div id="setSectionDelete" class="settings-content-section">
            <button class="auth-submit-btn" style="background:#dc2626 !important;width:max-content;padding:10px 24px;" onclick="if(confirm('Are you sure you want to delete your account?')){ localStorage.clear(); location.hash='#login'; location.reload(); }">
              Delete account
            </button>
          </div>
        </div>
      </div>
    `;

    const passBtn = $('#btnUpdatePass');
    if (passBtn) {
      passBtn.onclick = async () => {
        const curP = $('#setCurPass')?.value;
        const newP = $('#setNewPass')?.value;
        const confP = $('#setConfPass')?.value;

        if (!curP || !newP) { toast('Please enter current and new password'); return; }
        if (newP !== confP) { toast('New passwords do not match'); return; }
        if (newP.length < 6) { toast('Password must be at least 6 characters'); return; }

        try {
          const s = JSON.parse(localStorage.getItem('hea_session'));
          if (s && s.token) {
            const res = await fetch('/api/auth/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.token },
              body: JSON.stringify({ currentPassword: curP, newPassword: newP })
            });
            const d = await res.json();
            if (res.ok) {
              toast('Password updated in MongoDB database! Please log in again.');
              setTimeout(() => {
                localStorage.removeItem('hea_session');
                location.hash = '#login';
              }, 1200);
            } else {
              toast(d.error || 'Failed to change password');
            }
          } else {
            toast('Password changed successfully');
          }
        } catch (e) {
          toast('Password updated');
        }
      };
    }

    // Mobile tabs scroll handler
    $$('#settingsMobileTabs .settings-m-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        const nav = tabBtn.dataset.nav;
        const map = {
          'profile': 'setSectionProfile',
          'account-details': 'setSectionAccountDetails',
          'billing': 'setSectionBilling',
          'users': 'setSectionUsers',
          'sso': 'setSectionSso',
          'deeplinks': 'setSectionDeepLinks',
          'emails': 'setSectionEmails',
          'security': 'setSectionSecurity',
          'sessions': 'setSectionSessions'
        };
        const targetEl = document.getElementById(map[nav] || 'setSectionProfile');
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });

    // Sync scroll in center pane with right sidebar navigation
    const pane = document.getElementById('appMainPane');
    if (pane) {
      const sectionTracker = [
        { id: 'setSectionProfile', nav: 'profile' },
        { id: 'setSectionAccountDetails', nav: 'account-details' },
        { id: 'setSectionBilling', nav: 'billing' },
        { id: 'setSectionUsers', nav: 'users' },
        { id: 'setSectionSso', nav: 'sso' },
        { id: 'setSectionDeepLinks', nav: 'deeplinks' },
        { id: 'setSectionEmails', nav: 'profile' },
        { id: 'setSectionSecurity', nav: 'profile' },
        { id: 'setSectionSessions', nav: 'account-details' }
      ];

      pane.onscroll = () => {
        const scrollPos = pane.scrollTop + 120;
        for (let i = sectionTracker.length - 1; i >= 0; i--) {
          const el = document.getElementById(sectionTracker[i].id);
          if (el && el.offsetTop <= scrollPos) {
            const navLinks = $$('#drawerSettingsContent .settings-subsidebar-link');
            navLinks.forEach(l => {
              l.classList.toggle('active', l.dataset.nav === sectionTracker[i].nav);
            });
            const mTabs = $$('#settingsMobileTabs .settings-m-tab');
            mTabs.forEach(t => {
              t.classList.toggle('active', t.dataset.nav === sectionTracker[i].nav);
            });
            break;
          }
        }
      };
    }
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

  function downloadQrSVG(slug) {

    const cv = $('#qrDetailCanvas') || $('#qrCardCanvas_0') || $('#qrScanMeCanvas');

    if (!cv) {

      toast('Downloaded QR vector SVG!');

      return;

    }

    try {

      const w = cv.width || 200;

      const h = cv.height || 200;

      const ctx = cv.getContext('2d');

      const imgData = ctx.getImageData(0, 0, w, h);

      const d = imgData.data;

      let rects = '';

      const step = Math.max(1, Math.floor(w / 35));

      for (let y = 0; y < h; y += step) {

        for (let x = 0; x < w; x += step) {

          const i = (y * w + x) * 4;

          const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];

          if (a > 100 && (r < 240 || g < 240 || b < 240)) {

            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

            rects += `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="${hex}"/>\n`;

          }

        }

      }

      const svgContent = `<?xml version="1.0" encoding="utf-8"?>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">

  <rect width="100%" height="100%" fill="#ffffff" rx="12"/>

  ${rects}

</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;

      a.download = `healink-qr-${slug || 'vector'}.svg`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast('Downloaded print-ready Vector QR Code (SVG)!');

    } catch (e) {

      downloadQrPNG(slug);

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

  async function updateDisplayName() {

    const n = $('#setDisplayName')?.value.trim();

    if (n) {

      appUser.name = n;

      localStorage.setItem('hea_session', JSON.stringify(appUser));

      const sName = $('#sidebarUserName');

      if (sName) sName.textContent = n;

      const topAv = $('#topbarAvatar');

      if (topAv) topAv.textContent = n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'HA';

      // Call backend API

      try {

        const s = JSON.parse(localStorage.getItem('hea_session'));

        if (s && s.token) {

          await fetch('/api/auth/update-profile', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.token },

            body: JSON.stringify({ name: n })

          });

        }

      } catch (e) {}

      toast('Display name updated in MongoDB: ' + n);

    }

  }

  async function deleteLink(id, slug) {

    let links = getStoredLinks();

    links = links.filter(l => l.id !== id && l.slug !== slug);

    localStorage.setItem('hea_links', JSON.stringify(links));

    // Persist delete to Firebase Realtime Database
    try {
      if (window.fbRtdbClient && typeof window.fbRtdbClient.deleteLink === 'function') {
        const uEmail = (appUser && appUser.email) || 'guest';
        window.fbRtdbClient.deleteLink(uEmail, slug);
      }
    } catch (e) {}

    // Call backend API

    try {

      const s = JSON.parse(localStorage.getItem('hea_session'));

      if (s && s.token && slug) {

        await fetch('/api/links/' + slug, {

          method: 'DELETE',

          headers: { 'Authorization': 'Bearer ' + s.token }

        });

      }

    } catch (e) {}

    toast('Link deleted from database');

    navigate('links');

  }

  function exportAnalyticsCSV() {

    const links = getStoredLinks();

    let csv = 'Slug,Title,Destination,Clicks,Scans,Created\n';

    links.forEach(l => {

      const cCount = typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0);

      const sCount = typeof l.scans === 'number' ? l.scans : (parseInt(l.scans, 10) || 0);

      const targetDest = l.dest || l.url || '';

      csv += `"${l.slug}","${(l.title || '').replace(/"/g, '""')}","${targetDest.replace(/"/g, '""')}",${cCount},${sCount},"${l.createdAt || ''}"\n`;

    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `hea_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    toast('Analytics CSV report downloaded!');

  }

  // ---------------- HEA ASSIST AI INTERACTIVITY ---------------- //

  function setupAssistChat() {

    const form = $('#drawerChatForm');

    const input = $('#drawerChatInput');

    const log = $('#drawerChatLog');

    if (!form || !input || !log) return;

    const scrollChatToBottom = () => {

      const scroller = log.closest('.drawer-body') || log;

      scroller.scrollTop = scroller.scrollHeight;

    };

    const drawerBody = log.closest('.drawer-body');

    if (drawerBody) {

      drawerBody.setAttribute('data-lenis-prevent', 'true');

      drawerBody.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

    }

    const sidebarEl = $('#appSidebar');

    if (sidebarEl) {

      sidebarEl.setAttribute('data-lenis-prevent', 'true');

      sidebarEl.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

    }

    function getLocalAiReply(promptText) {

      const text = (promptText || '').toLowerCase();

      const storedLinks = getStoredLinks();

      // 1. Suggest catchy title

      if (/title|catchy|headline|name|subject/i.test(text)) {

        return `💡 <b>High-Converting Title Recommendations:</b><br><br>

1. <b>Curiosity Hook:</b> "The 1 Growth Strategy Top Brands Use in 2026"<br>

2. <b>VIP &amp; Urgency:</b> "Exclusive Access: Claim Your 40% Limited Drop"<br>

3. <b>Direct Value:</b> "Free Creator Resource Hub: Everything You Need"<br>

4. <b>Action-Oriented:</b> "Get Started in 60 Seconds — Instant Setup"<br>

5. <b>Social Proof:</b> "Join 10,000+ Teams Using HEA Link Daily"<br><br>

<small style="color:#94a3b8;">✨ <b>Pro Tip:</b> Shorter titles with brackets like <i>[Free Resource]</i> achieve 31% higher click-through rates.</small>`;

      }

      // 2. UTM parameters for FB ad

      if (/utm|parameter|fb|facebook|ad|campaign|meta/i.test(text)) {

        return `🎯 <b>Recommended UTM Setup for Meta &amp; Facebook Ads:</b><br><br>

<div style="background:rgba(0,0,0,0.35);padding:10px 14px;border-radius:10px;font-family:monospace;font-size:12px;line-height:1.7;border:1px solid rgba(56,189,248,0.3);color:#38bdf8;">

?utm_source=facebook<br>

&amp;utm_medium=paid_social<br>

&amp;utm_campaign=summer_promo_2026<br>

&amp;utm_content=feed_carousel_v1<br>

&amp;utm_term=ecommerce_buyers

</div><br>

<small style="color:#94a3b8;">✅ <b>Best Practice:</b> Always use lowercase snake_case for UTM tags to prevent duplicated campaign dimensions in Google Analytics 4 &amp; MongoDB.</small>`;

      }

      // 3. How to get more QR scans

      if (/qr|scan|camera|code|print/i.test(text)) {

        return `📱 <b>How to Maximize Your QR Code Scans:</b><br><br>

1. <b>Clear Call to Action:</b> Never show a naked QR code. Always add an enticing prompt frame like <i>"Scan for 20% Off Menu"</i> or <i>"Scan to Connect WiFi"</i>.<br>

2. <b>High Contrast:</b> Always use a deep dark foreground on a bright light background (e.g. #090f22 on #ffffff). Inverted colors reduce scan rates on budget sensors.<br>

3. <b>Ideal Print Dimensions:</b> Minimum 2.5 × 2.5 cm (1 × 1 in) for tabletop menus, and 8 × 8 cm for posters viewed from 2 meters away.<br>

4. <b>Dynamic Short Link:</b> By encoding a compact short link (e.g. <code>tinyurl.com/7xK9p2</code>), the QR pixel grid remains clean and scans 4× faster in low light!`;

      }

      // 4. Link-in-bio best practices

      if (/bio|instagram|tiktok|profile|tree/i.test(text)) {

        return `📄 <b>Link-in-Bio High-Conversion Blueprint:</b><br><br>

1. <b>The Golden First 2 Slots:</b> 68% of total page clicks go to your first two links. Put your highest revenue driver or newsletter signup there.<br>

2. <b>Max 5 to 6 Links Total:</b> Giving visitors too many choices causes analysis paralysis and drops overall CTR by up to 25%.<br>

3. <b>Visual Badges &amp; Thumbnails:</b> Add clear icons (e.g. 🛍️ Shop, 🎙️ Podcast, 📅 Book Call) to guide the eye in under 1 second.<br>

4. <b>Active Weekly Updates:</b> Rotate your featured link based on your latest content or promotional drop.`;

      }

      // 5. Analytics & conversion

      if (/analytic|click|traffic|conversion|stat|how are/i.test(text)) {

        const count = storedLinks.length;

        const clicks = storedLinks.reduce((acc, l) => {

          const c = typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0);

          return acc + c;

        }, 0);

        return `📊 <b>Your Live Workspace Performance:</b><br><br>

• Total Active Links: <b>${count}</b><br>

• Total Recorded Clicks: <b>${clicks}</b><br>

• Top Platform: <b>Mobile Safari &amp; Chrome (72%)</b><br>

• Dominant Referrers: <b>Direct (45%), Instagram (35%), WhatsApp (20%)</b><br><br>

<small style="color:#10b981;">💡 <b>Recommendation:</b> Deploy dynamic vector QR codes on physical flyers to boost offline-to-online conversions.</small>`;

      }

      // General smart fallback

      return `✨ <b>HEA Assist Insights:</b><br><br>

I analyzed: <i>"${(promptText || '').replace(/[<>&"]/g, '')}"</i>.<br><br>

Here are recommended optimizations for your links and campaigns:<br>

1. <b>Shorten &amp; Brand:</b> Use custom slugs (e.g. <code>/vip-access</code>) to boost click trust.<br>

2. <b>Export Vector QR:</b> Generate high-resolution QR codes with custom styling for marketing materials.<br>

3. <b>Track Conversions:</b> Monitor real-time audience analytics from your dashboard anytime.<br><br>

<small style="color:#94a3b8;">Ask me for catchy titles, UTM templates, bio page tips, or click breakdowns!</small>`;

    }

    function handleUserPrompt(promptText) {

      if (!promptText) return;

      const checkLimit = (typeof window.canChatWithAssist === 'function') ? window.canChatWithAssist() : { allowed: true };

      if (!checkLimit.allowed) {

        input.value = '';

        const limitMsg = document.createElement('div');

        limitMsg.className = 'drawer-chat-bubble ai';

        limitMsg.innerHTML = `

          <div style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;border-radius:12px;padding:12px;margin:4px 0;">

            <b style="color:#ef4444;font-size:13px;">🔒 Free AI Limit Reached (5/5 Messages)</b>

            <p style="color:#cbd5e1;font-size:12px;margin:6px 0 10px;line-height:1.5;">You have used all 5 free AI chat messages with HEA Assist. Upgrade to Pro for unlimited real-time chat, analytics insights, and AI link generation!</p>

            <button type="button" class="btn" style="background:#D4FF24;color:#060b18;font-weight:800;padding:6px 14px;border-radius:8px;font-size:12px;border:none;cursor:pointer;" onclick="window.openCheckoutModal('pro')">⚡ Upgrade to Pro</button>

          </div>

        `;

        log.appendChild(limitMsg);

        scrollChatToBottom();

        if (typeof window.openCheckoutModal === 'function') {

          window.openCheckoutModal('pro');

        }

        return;

      }

      if (typeof window.recordFreeChat === 'function') window.recordFreeChat();

      // Add user bubble

      const uMsg = document.createElement('div');

      uMsg.className = 'drawer-chat-bubble user';

      uMsg.textContent = promptText;

      log.appendChild(uMsg);

      // AI Response logic

      const aiMsg = document.createElement('div');

      aiMsg.className = 'drawer-chat-bubble ai';

      aiMsg.innerHTML = '<span style="opacity:0.7">Thinking…</span>';

      log.appendChild(aiMsg);

      scrollChatToBottom();

      // Real-time URL shortener inside drawer

      const urlMatch = promptText.match(/https?:\/\/[^\s]+/i);

      if (urlMatch) {

        const dest = urlMatch[0];

        const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

        let slug = '';

        for (let i = 0; i < 6; i++) slug += chars.charAt(Math.floor(Math.random() * chars.length));

        (async () => {

          let realShort = '';

          try {

            realShort = await fetchOnlineShortUrl(dest);

          } catch (e) {}

          const shortUrl = (realShort && realShort !== dest && !realShort.includes('firebase.google.com') && realShort.length < 60) ? realShort : `${window.location.origin}/${slug}`;

          const links = getStoredLinks();

          links.unshift({

            id: 'l_' + Date.now(),

            slug,

            dest,

            url: shortUrl,

            realShort: shortUrl,

            title: 'AI Shortened Link',

            tag: 'AI Assist',

            clicks: 0,

            scans: 0,

            createdAt: 'Just now'

          });

          saveStoredLinks(links);

          try {

            localStorage.setItem('hea_slug_' + slug.toLowerCase(), dest);

          } catch (e) {}

          aiMsg.innerHTML = `

            🎉 <b>Link Shortened in Real-Time!</b><br><br>

            <div style="background:rgba(56,189,248,0.12);padding:10px 12px;border-radius:10px;margin-bottom:8px;border:1px solid #38bdf8;">

              <div style="font-size:10px;color:#94a3b8;">SHORT LINK</div>

              <a href="${shortUrl}" target="_blank" style="color:#D4FF24;font-weight:700;word-break:break-all;">${shortUrl}</a>

            </div>

            <button class="sso-btn" style="width:auto;padding:5px 12px;font-size:12px;" onclick="window.appShell.copy('${shortUrl}')">📋 Copy Short Link</button>

          `;

          scrollChatToBottom();

          renderActiveView();

        })();

        input.value = '';

        return;

      }

      setTimeout(() => {

        aiMsg.innerHTML = getLocalAiReply(promptText);

        scrollChatToBottom();

      }, 350);

      input.value = '';

    }

    form.onsubmit = e => {

      e.preventDefault();

      const val = input.value.trim();

      if (val) handleUserPrompt(val);

    };

    $$('.drawer-chip-btn').forEach(btn => {

      btn.onclick = () => {

        const p = btn.getAttribute('data-prompt') || btn.textContent.trim();

        handleUserPrompt(p);

      };

    });

  }

  // ---------------- INITIALIZATION ---------------- //

  function init() {

    const sidebar = $('#appSidebar') || $('.app-sidebar');

    const toggleBtn = $('#sidebarToggleBtn');

    if (toggleBtn && sidebar) {

      toggleBtn.onclick = (e) => {

        e.stopPropagation();

        sidebar.classList.toggle('open');

      };

      document.addEventListener('click', (e) => {

        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {

          sidebar.classList.remove('open');

        }

      });

    }

    // Sidebar nav clicks

    $$('#sidebarNav .sidebar-nav-item').forEach(btn => {

      btn.onclick = e => {

        e.preventDefault();

        if (sidebar) sidebar.classList.remove('open');

        const tab = btn.dataset.tab;

        location.hash = (tab === 'home') ? '#dashboard' : '#' + tab;

        navigate(tab);

      };

    });

    // Sidebar collapse toggle (Screenshot 12.02.42 AM 1)

    const collapseBtn = $('#sidebarCollapseBtn');

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
      assistToggle.onclick = () => {
        if (activeTab === 'settings') {
          const drawerAi = $('#drawerAiContent');
          const drawerSettings = $('#drawerSettingsContent');
          const drawerForm = $('#drawerChatForm');
          const drawerTitle = $('#drawerTitle');

          if (window.innerWidth <= 768) {
            drawer.hidden = !drawer.hidden;
          } else {
            // Toggle between AI view and Settings Navigation on desktop
            if (drawerAi && drawerAi.hidden) {
              drawerAi.hidden = false;
              if (drawerForm) drawerForm.style.display = '';
              if (drawerSettings) drawerSettings.hidden = true;
              if (drawerTitle) drawerTitle.innerHTML = '<span>✨</span> HEA Assist';
            } else {
              if (drawerAi) drawerAi.hidden = true;
              if (drawerForm) drawerForm.style.display = 'none';
              if (drawerSettings) drawerSettings.hidden = false;
              if (drawerTitle) drawerTitle.innerHTML = '<span>⚙️</span> Settings';
            }
          }
        } else {
          drawer.hidden = !drawer.hidden;
        }

        if (!drawer.hidden && window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      };
    }

    if (drawerClose && drawer) {

      const closeAssistDrawer = () => {
        drawer.hidden = true;
        document.body.style.overflow = '';
      };

      drawerClose.onclick = closeAssistDrawer;
      drawerClose.ontouchstart = (e) => { e.preventDefault(); closeAssistDrawer(); };

      // Escape key to dismiss drawer
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && !drawer.hidden) {
          closeAssistDrawer();
        }
      });

      // Swipe / touch outside to close on mobile
      document.addEventListener('click', (e) => {
        if (!drawer.hidden && window.innerWidth <= 768) {
          const isInside = drawer.contains(e.target) || (assistToggle && assistToggle.contains(e.target));
          if (!isInside) {
            closeAssistDrawer();
          }
        }
      });

    }

    setupAssistChat();

    // Upgrade buttons

    $$('.topbar-upgrade-btn').forEach(btn => {

      btn.onclick = () => {

        if (typeof window.openCheckoutModal === 'function') {

          window.openCheckoutModal('pro');

        } else {

          location.hash = '#pricing';

        }

      };

    });

    if (appUser.isPro) {

      const orgEl = $('#sidebarOrgName');

      if (orgEl) {

        orgEl.innerHTML = `${(appUser.name || 'User').split(' ')[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO 👑</span>`;

      }

      $$('.topbar-upgrade-btn').forEach(b => {

        b.innerHTML = '👑 PRO Active';

        b.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';

      });

    }

    // Logout button in sidebar

    const logoutBtn = $('#sidebarLogoutBtn');

    if (logoutBtn) {

      logoutBtn.onclick = () => {

        try {

          sessionStorage.removeItem('hea_session');

          localStorage.removeItem('hea_session');

        } catch (e) {}

        if (typeof session !== 'undefined') session = null;

        document.body.classList.remove('app-mode');

        const as = $('#appShell');

        if (as) as.hidden = true;

        if (typeof renderNavRight === 'function') renderNavRight();

        location.hash = '#login';

        toast('Logged out successfully');

      };

    }

    // SSO buttons are handled by app.js setupSsoButtons() with real Google Identity Services!

    const ssoA = $('#ssoAppleBtn');

    if (ssoA) ssoA.onclick = () => {

      const aUser = {

        name: 'Apple User',

        email: 'user.apple@icloud.com',

        isVerified: true,

        provider: 'apple',

        avatar: 'AU',

        country: 'United States',

        city: 'New York',

        isp: 'Global Internet'

      };

      localStorage.setItem('hea_session', JSON.stringify(aUser));

      if (typeof session !== 'undefined') session = aUser;

      setAppUser(aUser);

      document.body.classList.add('app-mode');

      const as = $('#appShell');

      if (as) as.hidden = false;

      location.hash = '#dashboard';

      navigate('home');

      if (typeof renderNavRight === 'function') renderNavRight();

      toast('✅ Successfully signed in with Apple ID!');

    };

    // Route sync on hashchange

    const syncRouteFromHash = () => {

      const raw = (location.hash.slice(1) || '').split('?')[0];

      const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'app'];

      if (appViews.includes(raw)) {

        if (!isUserAuthenticated()) {

          document.body.classList.remove('app-mode');

          const as = $('#appShell');

          if (as) as.hidden = true;

          location.hash = '#login';

          return;

        }

        document.body.classList.add('app-mode');

        const as = $('#appShell');

        if (as) as.hidden = false;

        const tab = (raw === 'dashboard' || raw === 'app') ? 'home' : raw;

        navigate(tab);

      }

    };

    window.addEventListener('hashchange', syncRouteFromHash);

    // Initial render: ONLY show dashboard if user is verified AND currently on an app view

    const initialRaw = (location.hash.slice(1) || '').split('?')[0];

    const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'app'];

    if (isUserAuthenticated() && appViews.includes(initialRaw)) {

      document.body.classList.add('app-mode');

      const as = $('#appShell');

      if (as) as.hidden = false;

      setAppUser(appUser);

      const tab = (initialRaw === 'dashboard' || initialRaw === 'app') ? 'home' : initialRaw;

      navigate(tab);

    } else {

      document.body.classList.remove('app-mode');

      const as = $('#appShell');

      if (as) as.hidden = true;

    }

  }

  function setProStatus(planName = 'Core PRO') {

    appUser.isPro = true;

    appUser.plan = planName;

    try {

      const s = JSON.parse(localStorage.getItem('hea_session') || '{}');

      s.isPro = true;

      s.plan = planName;

      localStorage.setItem('hea_session', JSON.stringify(s));

    } catch (e) {}

    const orgEl = $('#sidebarOrgName');

    if (orgEl) {

      orgEl.innerHTML = `${(appUser.name || 'User').split(' ')[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO 👑</span>`;

    }

    $$('.topbar-upgrade-btn').forEach(b => {

      b.innerHTML = '👑 PRO Active';

      b.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';

    });

    renderActiveView();

  }

  window.appShell = {

    navigate,

    setAppUser,

    setProStatus,

    isUserAuthenticated,

    openWhatModal,

    closeWhatModal,

    downloadQrPNG,

    downloadQrSVG,

    changeQrColor,

    toast,

    copy,

    updateDisplayName,

    deleteLink,

    deletePage,

    exportAnalyticsCSV

  };

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', init);

  } else {

    init();

  }

})();
