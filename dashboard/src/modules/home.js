import {
  $, $$, state, cleanSafeStr, generateShortSlug, fetchOnlineShortUrl, normalizeLinkItem,
  getStoredLinks, getAuthToken, handleUnauthorizedSession, syncLinksFromServer,
  toast, copy, formatNumber, formatWithCommas, formatTrend, openWhatModal
} from './state.js';
import { navigate } from './router.js';
import { createLinkDirect } from './links.js';
import { drawQR } from './billing.js';

export function renderHome(container) {
  let activeType = 'link'; // 'link' or 'qr'
  let currentRange = '7d';
  const userTz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat) 
    ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') 
    : 'UTC';

  // Clear previous live poll timer to prevent memory leaks
  if (window.__heaLivePollTimer) {
    clearInterval(window.__heaLivePollTimer);
    window.__heaLivePollTimer = null;
  }

  // Time-based dynamic greeting & user name
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (state.appUser.name || 'Account').split(' ')[0];

  container.innerHTML = `
    <div class="dashboard-v2-container">
      
      <!-- ====================================================
           1. TOP KPI STAT CARDS (4 Columns)
           ==================================================== -->
      <div class="dash-kpi-grid">
        
        <!-- KPI 1: Total Links -->
        <div class="kpi-card" id="kpiCardLinks">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#e0f2fe;color:#0284c7;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Total Links</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTotalLinksVal">0</span>
                <span class="kpi-trend" id="kpiTotalLinksTrend">—</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTotalLinksSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 22 Q 18 28, 30 16 T 50 12 T 66 4" stroke="#0A6CFF" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 2: Total Clicks -->
        <div class="kpi-card" id="kpiCardClicks">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#f3e8ff;color:#9333ea;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Total Clicks</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTotalClicksVal">0</span>
                <span class="kpi-trend" id="kpiTotalClicksTrend">—</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTotalClicksSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 24 Q 18 16, 32 20 T 52 14 T 66 8" stroke="#a855f7" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 3: Unique Visitors -->
        <div class="kpi-card" id="kpiCardVisitors">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#dcfce7;color:#16a34a;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"></line><line x1="12" x2="12" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="14"></line></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Unique Visitors</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiUniqueVisitorsVal">0</span>
                <span class="kpi-trend" id="kpiUniqueVisitorsTrend">—</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiUniqueVisitorsSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 22 Q 18 25, 30 14 T 50 16 T 66 6" stroke="#10b981" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 4: Top Performer -->
        <div class="kpi-card" id="kpiCardTopPerformer">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#fef3c7;color:#d97706;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Top Performer</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTopPerformerVal">0</span>
                <span class="kpi-trend" id="kpiTopPerformerTrend">—</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTopPerformerSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 20 Q 16 12, 30 22 T 50 14 T 66 8" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

      </div>

      <!-- ====================================================
           2. MIDDLE HERO ROW (Hero Shortener + Calendar/Velocity)
           ==================================================== -->
      <div class="dash-hero-grid">
        
        <!-- Left: Hero Shortener Card -->
        <div class="hero-shorten-card">
          <div class="hero-top-badges">
            <div class="live-activity-pill" id="homeLivePill">
              <span class="live-dot" id="homeLiveDot"></span>
              <span class="live-text" id="homeLiveText">Live Activity · Real-time telemetry</span>
              <div class="live-avatars" id="homeLiveAvatars" style="display:none;"></div>
              <span class="live-more-text" id="homeLiveMoreText" style="display:none;"></span>
            </div>
            <div class="core-pro-badge" id="homePlanBadge" onclick="window.openCheckoutModal && window.openCheckoutModal('pro')" style="cursor:pointer;">
              <span>👑</span> Pro Active
            </div>
          </div>

          <div class="hero-main-row">
            <div class="hero-text-block">
              <h2 class="hero-greeting-title">${greeting}, ${firstName}! 🚀</h2>
              <p class="hero-greeting-sub">Shorten your links, track performance and grow your audience with ease.</p>
            </div>
            
            <!-- 3D Glossy Blue Chain Link Illustration -->
            <div class="hero-3d-graphic-wrap" aria-hidden="true">
              <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                <defs>
                  <linearGradient id="linkBody3D" x1="20" y1="20" x2="150" y2="130" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38bdf8"/>
                    <stop offset="35%" stop-color="#0A6CFF"/>
                    <stop offset="70%" stop-color="#0284c7"/>
                    <stop offset="100%" stop-color="#1e3a8a"/>
                  </linearGradient>
                  <linearGradient id="linkSpec3D" x1="40" y1="30" x2="140" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                    <stop offset="35%" stop-color="#ffffff" stop-opacity="0.25"/>
                    <stop offset="70%" stop-color="#38bdf8" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Base Ambient Drop Shadow -->
                <ellipse cx="85" cy="130" rx="55" ry="14" fill="rgba(10, 108, 255, 0.22)" filter="blur(6px)"/>
                <!-- 3D Tilted Torus / Chain Ring -->
                <g transform="rotate(-28 85 75)">
                  <path d="M 42 42 C 42 22, 62 14, 88 14 C 114 14, 134 22, 134 42 L 134 102 C 134 122, 114 130, 88 130 C 62 130, 42 122, 42 102 Z" 
                        stroke="url(#linkBody3D)" stroke-width="26" stroke-linejoin="round" fill="none"/>
                  <path d="M 44 44 C 44 26, 64 18, 88 18 C 112 18, 132 26, 132 44 L 132 68" 
                        stroke="url(#linkSpec3D)" stroke-width="7" stroke-linecap="round" fill="none"/>
                </g>
                <!-- Floating 3D Accent Sparks -->
                <rect x="24" y="42" width="11" height="4" rx="2" fill="#818cf8" transform="rotate(-35 24 42)"/>
                <circle cx="16" cy="60" r="2.5" fill="#38bdf8"/>
                <rect x="142" y="24" width="10" height="3.5" rx="1.75" fill="#60a5fa" transform="rotate(25 142 24)"/>
                <circle cx="156" cy="52" r="2.5" fill="#a855f7"/>
                <rect x="150" y="68" width="11" height="3.5" rx="1.75" fill="#38bdf8" transform="rotate(-15 150 68)"/>
                <circle cx="32" cy="102" r="2.5" fill="#60a5fa"/>
              </svg>
            </div>
          </div>

          <!-- Toggle Tabs (Short Link vs Vector QR) -->
          <div class="hero-type-pills">
            <button type="button" class="hero-type-pill active" id="tabShortLinkOpt">
              <span>🔗</span> Short link &amp; URL
            </button>
            <button type="button" class="hero-type-pill" id="tabQrCodeOpt">
              <span>▦</span> Vector QR Code
            </button>
          </div>

          <!-- Shorten Input Box -->
          <form id="homeShortenForm" class="hero-shorten-form-wrap">
            <span class="hero-input-icon" id="homeInputIcon">🔗</span>
            <input type="url" id="homeShortenInput" class="hero-shorten-input" placeholder="Paste destination URL to generate a short link..." required autocomplete="off">
            <button type="submit" class="hero-submit-btn" id="homeSubmitBtn">
              <span>Create Now</span> →
            </button>
          </form>

          <div id="homeShortenResult" class="home-shorten-result" style="display:none;margin-bottom:14px;"></div>

          <!-- Quick Actions Line -->
          <div class="hero-quick-actions-row">
            <span class="hero-quick-label">Quick actions:</span>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.openCreateModal('link')">
              <span style="color:#f59e0b;">⚡</span> Customize Link
            </button>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.navigate('qr')">
              <span style="color:#d97706;">🎨</span> Custom QR Design
            </button>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.navigate('pages')">
              <span style="color:#0284c7;">📄</span> New Bio Page
            </button>
          </div>
        </div>

        <!-- Right: Stacked Calendar & Velocity Widgets -->
        <div class="dash-right-stack">
          
          <!-- Widget 1: Calendar Week -->
          <div class="calendar-widget-card" id="homeCalendarWidget">
            <div class="widget-header-row">
              <div class="widget-title" id="homeCalTitle">📅 Calendar</div>
              <button type="button" class="widget-dropdown-btn">Current Week ˇ</button>
            </div>
            <div class="cal-week-grid" id="homeCalGrid">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Widget 2: Visitor Velocity Chart -->
          <div class="velocity-widget-card" id="homeVelocityWidget">
            <div class="widget-header-row">
              <div class="widget-title">📈 Visitor Velocity</div>
              <span id="homeVelocityTrendBadge" style="background:#e2e8f0;color:#64748b;padding:3px 8px;border-radius:9999px;font-size:11.5px;font-weight:700;">—</span>
            </div>
            
            <!-- SVG Velocity Chart with Axes & Peak Tooltip -->
            <div class="velocity-chart-wrap" id="homeVelocityChartWrap">
              <div id="homeVelocityTooltip" style="display:none;position:absolute;background:#0f172a;color:#ffffff;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:2;transform:translateX(-50%);">
                0
              </div>
              <svg width="100%" height="95" viewBox="0 0 340 95" fill="none" preserveAspectRatio="none" id="homeVelocitySvg">
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0A6CFF" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="#0A6CFF" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <line x1="28" y1="18" x2="335" y2="18" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="40" x2="335" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="62" x2="335" y2="62" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="80" x2="335" y2="80" stroke="#f1f5f9" stroke-width="1"/>
                <path id="homeVelocityArea" d="" fill="url(#velocityGrad)"/>
                <path id="homeVelocityLine" d="" stroke="#0A6CFF" stroke-width="2.6" stroke-linecap="round" fill="none"/>
                <g id="homeVelocityDots"></g>
              </svg>
              <div id="homeVelocityXAxis" style="display:flex;justify-content:space-between;padding:0 4px 0 28px;margin-top:2px;"></div>
            </div>

          </div>

        </div>

      </div>

      <!-- ====================================================
           3. BOTTOM ROW (Overview + Recent Links + Top Referrers)
           ==================================================== -->
      <div class="dash-bottom-grid">
        
        <!-- Card 1: Overview (Metrics Summary) -->
        <div class="bottom-widget-card" id="homeOverviewCard">
          <div class="widget-header-row">
            <div class="widget-title">📊 Overview</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <select id="homeOverviewRangeSelect" class="widget-dropdown-btn" style="cursor:pointer;border:none;background:rgba(0,112,243,0.06);color:#0A6CFF;font-weight:700;border-radius:8px;padding:4px 8px;font-size:12px;">
                <option value="24h">Last 24 Hours</option>
                <option value="7d" selected>Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div class="overview-stats-grid">
            <!-- Visitors -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#e0f2fe;color:#0284c7;">👁️</div>
              <span class="overview-num" id="overviewVisitorsNum">0</span>
              <span class="overview-lbl">Visitors</span>
              <span class="overview-pct" id="overviewVisitorsPct">—</span>
            </div>
            <!-- Clicks -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#f3e8ff;color:#9333ea;">🔗</div>
              <span class="overview-num" id="overviewClicksNum">0</span>
              <span class="overview-lbl">Clicks</span>
              <span class="overview-pct" id="overviewClicksPct">—</span>
            </div>
            <!-- Links -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#dcfce7;color:#16a34a;">⛓️</div>
              <span class="overview-num" id="overviewLinksNum">0</span>
              <span class="overview-lbl">Links</span>
              <span class="overview-pct" id="overviewLinksPct">—</span>
            </div>
            <!-- Avg Clicks / Link -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#fef3c7;color:#d97706;">⚡</div>
              <span class="overview-num" id="overviewAvgClicksNum">0</span>
              <span class="overview-lbl">Avg. clicks / link</span>
              <span class="overview-pct" id="overviewAvgClicksPct">—</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Recent Links -->
        <div class="bottom-widget-card" id="homeRecentLinksCard">
          <div class="widget-header-row">
            <div class="widget-title">🔗 Recent Links</div>
            <a href="#links" class="view-all-link" onclick="window.appShell && window.appShell.navigate('links'); return false;">View All →</a>
          </div>
          
          <div class="recent-links-list" id="homeRecentLinksList">
            <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">
              <div style="font-size:24px;margin-bottom:8px;">🔗</div>
              <b>No links created yet</b>
              <p style="margin:4px 0 12px;font-size:12px;">Create your first link using the shortener above.</p>
            </div>
          </div>
        </div>

        <!-- Card 3: Top Referrers -->
        <div class="bottom-widget-card" id="homeReferrersCard">
          <div class="widget-header-row">
            <div class="widget-title">👥 Top Referrers</div>
            <a href="#analytics" class="view-all-link" onclick="window.appShell && window.appShell.navigate('analytics'); return false;">View All →</a>
          </div>
          
          <div class="referrers-body" id="homeReferrersBody">
            <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;width:100%;">
              <div style="font-size:24px;margin-bottom:8px;">👥</div>
              <b>No referrer telemetry yet</b>
              <p style="margin:4px 0;font-size:12px;">Share your short links to start tracking traffic channels.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // ---------------- Real Dashboard Telemetry Hydration ---------------- //

  async function loadDashboardSummary(range = currentRange) {
    currentRange = range;
    const token = (function() {
      try {
        const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
        return s.token || localStorage.getItem('hea_token') || sessionStorage.getItem('hea_token') || '';
      } catch (e) { return ''; }
    })();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    try {
      const res = await fetch(`/api/dashboard/summary?range=${encodeURIComponent(range)}&tz=${encodeURIComponent(userTz)}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      hydrateDashboard(data);
    } catch (err) {
      console.warn('[Dashboard] Summary fetch error:', err);
    }
  }

  function hydrateDashboard(d) {
    if (!d) return;

    // 1. KPI Cards
    const totals = d.totals || {};
    const trends = d.trends || {};

    const elTotalLinks = $('#kpiTotalLinksVal');
    if (elTotalLinks) elTotalLinks.textContent = formatWithCommas(totals.links || 0);
    const elTotalLinksTrend = $('#kpiTotalLinksTrend');
    if (elTotalLinksTrend) elTotalLinksTrend.textContent = formatTrend(trends.linksPct);

    const elTotalClicks = $('#kpiTotalClicksVal');
    if (elTotalClicks) elTotalClicks.textContent = formatNumber(totals.humanClicks || 0);
    const elTotalClicksTrend = $('#kpiTotalClicksTrend');
    if (elTotalClicksTrend) elTotalClicksTrend.textContent = formatTrend(trends.clicksPct);

    const elVisitors = $('#kpiUniqueVisitorsVal');
    if (elVisitors) elVisitors.textContent = formatNumber(totals.uniqueVisitors || 0);
    const elVisitorsTrend = $('#kpiUniqueVisitorsTrend');
    if (elVisitorsTrend) elVisitorsTrend.textContent = formatTrend(trends.visitorsPct);

    const elTopPerformer = $('#kpiTopPerformerVal');
    if (elTopPerformer) {
      if (d.topPerformer && d.topPerformer.clicks > 0) {
        elTopPerformer.textContent = formatNumber(d.topPerformer.clicks);
        const elPerfCard = elTopPerformer.closest('.kpi-card');
        if (elPerfCard) elPerfCard.title = `${d.topPerformer.title || d.topPerformer.slug} (${d.topPerformer.clicks} clicks)`;
      } else {
        elTopPerformer.textContent = '0';
      }
    }
    const elTopPerfTrend = $('#kpiTopPerformerTrend');
    if (elTopPerfTrend) {
      elTopPerfTrend.textContent = (d.topPerformer && d.topPerformer.clicks > 0) ? (d.topPerformer.slug || 'Top') : '—';
    }

    // 2. Plan Badge
    const elPlanBadge = $('#homePlanBadge');
    if (elPlanBadge && d.plan) {
      if (d.plan.isPaid) {
        elPlanBadge.innerHTML = `<span>👑</span> ${d.plan.badge || d.plan.name}`;
        elPlanBadge.style.background = '';
        elPlanBadge.style.color = '';
        elPlanBadge.style.borderColor = '';
      } else {
        elPlanBadge.innerHTML = `<span>⚡</span> Free Plan · Upgrade`;
        elPlanBadge.style.background = '#f1f5f9';
        elPlanBadge.style.color = '#475569';
        elPlanBadge.style.borderColor = '#cbd5e1';
      }
    }

    // 3. Live Activity Pill
    const liveCount = (d.activeNow && d.activeNow.visitors) ? d.activeNow.visitors : 0;
    const elLiveDot = $('#homeLiveDot');
    const elLiveText = $('#homeLiveText');
    const elLiveAvatars = $('#homeLiveAvatars');
    const elLiveMore = $('#homeLiveMoreText');

    if (elLiveText) {
      if (liveCount > 0) {
        elLiveText.textContent = `Live Activity · ${liveCount} visitor${liveCount === 1 ? '' : 's'} right now`;
        if (elLiveDot) elLiveDot.style.background = '#10b981';
        if (elLiveAvatars) {
          elLiveAvatars.style.display = 'flex';
          elLiveAvatars.innerHTML = `
            <div class="live-avatar-item" style="background:#0A6CFF;">V1</div>
            ${liveCount > 1 ? '<div class="live-avatar-item" style="background:#7928ca;">V2</div>' : ''}
            ${liveCount > 2 ? '<div class="live-avatar-item" style="background:#10b981;">V3</div>' : ''}
          `;
        }
        if (elLiveMore && liveCount > 3) {
          elLiveMore.style.display = 'inline';
          elLiveMore.textContent = `+${liveCount - 3} more`;
        } else if (elLiveMore) {
          elLiveMore.style.display = 'none';
        }
      } else {
        elLiveText.textContent = 'Live Activity · No active visitors right now';
        if (elLiveDot) elLiveDot.style.background = '#94a3b8';
        if (elLiveAvatars) elLiveAvatars.style.display = 'none';
        if (elLiveMore) elLiveMore.style.display = 'none';
      }
    }

    // 4. Calendar Week Widget
    renderCalendarWeek(d.timeseries || []);

    // 5. Visitor Velocity Dynamic SVG Chart
    renderVelocityChart(d.timeseries || [], d.peak, trends.clicksPct);

    // 6. Overview Card
    const elOvVisitors = $('#overviewVisitorsNum');
    if (elOvVisitors) elOvVisitors.textContent = formatNumber(totals.uniqueVisitors || 0);
    const elOvVisitorsTrend = $('#overviewVisitorsPct');
    if (elOvVisitorsTrend) elOvVisitorsTrend.textContent = formatTrend(trends.visitorsPct);

    const elOvClicks = $('#overviewClicksNum');
    if (elOvClicks) elOvClicks.textContent = formatNumber(totals.humanClicks || 0);
    const elOvClicksTrend = $('#overviewClicksPct');
    if (elOvClicksTrend) elOvClicksTrend.textContent = formatTrend(trends.clicksPct);

    const elOvLinks = $('#overviewLinksNum');
    if (elOvLinks) elOvLinks.textContent = formatWithCommas(totals.links || 0);
    const elOvLinksTrend = $('#overviewLinksPct');
    if (elOvLinksTrend) elOvLinksTrend.textContent = formatTrend(trends.linksPct);

    const elOvAvgClicks = $('#overviewAvgClicksNum');
    if (elOvAvgClicks) elOvAvgClicks.textContent = String(totals.avgClicksPerLink || 0);
    const elOvAvgClicksTrend = $('#overviewAvgClicksPct');
    if (elOvAvgClicksTrend) elOvAvgClicksTrend.textContent = totals.links > 0 ? 'avg/link' : '—';

    // 7. Recent Links List
    renderRecentLinks(d.recentLinks || []);

    // 8. Top Referrers Donut & Legend
    renderTopReferrers(d.referrers || [], totals.humanClicks || 0);
  }

  function renderCalendarWeek(timeseries) {
    const now = new Date();
    const elTitle = $('#homeCalTitle');
    if (elTitle) {
      const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      elTitle.textContent = `📅 ${monthYear}`;
    }

    const elGrid = $('#homeCalGrid');
    if (!elGrid) return;

    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const distToMon = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distToMon);

    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    let html = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const match = timeseries.find(t => t.date && t.date.startsWith(dateKey));
      const clicks = match ? (match.clicks || 0) : 0;

      html += `
        <div class="cal-day-col ${isToday ? 'active' : ''}" data-date="${dateKey}" title="${clicks} click${clicks === 1 ? '' : 's'}" style="cursor:pointer;" onclick="this.parentElement.querySelectorAll('.cal-day-col').forEach(c => c.classList.remove('active')); this.classList.add('active');">
          <span class="cal-day-name">${dayNames[i]}</span>
          <span class="cal-day-number">${d.getDate()}</span>
          <span style="font-size:9px;color:${isToday ? '#ffffff' : '#94a3b8'};font-weight:700;margin-top:2px;">${clicks > 0 ? formatNumber(clicks) : '0'}</span>
        </div>
      `;
    }

    elGrid.innerHTML = html;
  }

  function renderVelocityChart(timeseries, peak, trendPct) {
    const elTrend = $('#homeVelocityTrendBadge');
    if (elTrend) {
      const trText = formatTrend(trendPct);
      elTrend.textContent = trText;
      if (trendPct !== null && trendPct !== undefined && !isNaN(trendPct)) {
        elTrend.style.background = trendPct >= 0 ? '#dcfce7' : '#fee2e2';
        elTrend.style.color = trendPct >= 0 ? '#16a34a' : '#dc2626';
      } else {
        elTrend.style.background = '#e2e8f0';
        elTrend.style.color = '#64748b';
      }
    }

    const areaEl = $('#homeVelocityArea');
    const lineEl = $('#homeVelocityLine');
    const dotsEl = $('#homeVelocityDots');
    const xAxisEl = $('#homeVelocityXAxis');
    const tooltip = $('#homeVelocityTooltip');

    if (!timeseries || timeseries.length === 0) {
      if (lineEl) lineEl.setAttribute('d', 'M 38 80 L 325 80');
      if (areaEl) areaEl.setAttribute('d', '');
      if (dotsEl) dotsEl.innerHTML = '';
      if (xAxisEl) xAxisEl.innerHTML = '<span style="font-size:9.5px;color:#94a3b8;">No data for period</span>';
      if (tooltip) tooltip.style.display = 'none';
      return;
    }

    const maxVal = Math.max(peak ? peak.clicks : 0, 5);
    const chartLeft = 38;
    const chartRight = 325;
    const chartTop = 18;
    const chartBottom = 80;
    const width = chartRight - chartLeft;
    const height = chartBottom - chartTop;

    const points = timeseries.map((pt, i) => {
      const x = chartLeft + (i / Math.max(timeseries.length - 1, 1)) * width;
      const val = pt.clicks || 0;
      const y = chartBottom - (val / maxVal) * height;
      return { x, y, label: pt.label || pt.date, clicks: val };
    });

    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) / 2;
      const cpy2 = curr.y;
      linePath += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }

    const last = points[points.length - 1];
    const areaPath = `${linePath} L ${last.x.toFixed(1)} ${chartBottom} L ${points[0].x.toFixed(1)} ${chartBottom} Z`;

    if (lineEl) lineEl.setAttribute('d', linePath);
    if (areaEl) areaEl.setAttribute('d', areaPath);

    let dotsHtml = '';
    points.forEach((p, idx) => {
      const isPeak = peak && peak.index === idx && p.clicks > 0;
      dotsHtml += `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isPeak ? '4.5' : '3'}" fill="#0A6CFF" stroke="#ffffff" stroke-width="${isPeak ? '2' : '1.5'}">
          <title>${p.label}: ${p.clicks} clicks</title>
        </circle>
      `;
    });
    if (dotsEl) dotsEl.innerHTML = dotsHtml;

    if (tooltip) {
      if (peak && peak.clicks > 0 && points[peak.index]) {
        const pkPt = points[peak.index];
        const pctX = ((pkPt.x / 340) * 100).toFixed(1);
        tooltip.style.left = `${pctX}%`;
        tooltip.style.top = `${Math.max(pkPt.y - 20, 2).toFixed(1)}px`;
        tooltip.textContent = formatNumber(peak.clicks);
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    }

    if (xAxisEl) {
      let xHtml = '';
      const step = Math.ceil(points.length / 7);
      for (let i = 0; i < points.length; i += step) {
        const p = points[i];
        const isPeak = peak && peak.index === i && p.clicks > 0;
        xHtml += `<span style="font-size:9px;color:${isPeak ? '#0A6CFF' : '#94a3b8'};font-weight:${isPeak ? '800' : '600'};">${p.label}</span>`;
      }
      xAxisEl.innerHTML = xHtml;
    }
  }

  function renderRecentLinks(links) {
    const elList = $('#homeRecentLinksList');
    if (!elList) return;

    if (!links || links.length === 0) {
      elList.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">
          <div style="font-size:24px;margin-bottom:8px;">🔗</div>
          <b>No links created yet</b>
          <p style="margin:4px 0 12px;font-size:12px;">Create your first link using the shortener above.</p>
        </div>
      `;
      return;
    }

    let html = '';
    links.slice(0, 5).forEach(l => {
      const dest = l.dest || '';
      const shortUrl = l.shortUrl || `/${l.slug}`;
      const shortDisplay = shortUrl.replace(/^https?:\/\//, '');
      const clicks = l.clicks || 0;

      let sparkPath = 'M 2 14 L 40 14';
      if (Array.isArray(l.sparkline) && l.sparkline.length > 1) {
        const maxSp = Math.max(...l.sparkline, 1);
        const spPts = l.sparkline.map((v, idx) => {
          const x = 2 + (idx / (l.sparkline.length - 1)) * 38;
          const y = 16 - (v / maxSp) * 12;
          return `${x.toFixed(1)} ${y.toFixed(1)}`;
        });
        sparkPath = 'M ' + spPts.join(' L ');
      }

      html += `
        <div class="recent-link-row-item">
          <div class="recent-left-meta">
            <div class="recent-link-icon-box">🔗</div>
            <div class="recent-link-titles">
              <span class="recent-dest-title" title="${dest}">${dest}</span>
              <a href="${shortUrl}" target="_blank" rel="noopener" class="recent-short-slug">${shortDisplay}</a>
            </div>
          </div>
          <div class="recent-right-telemetry">
            <span class="recent-click-count">${formatNumber(clicks)} click${clicks === 1 ? '' : 's'}</span>
            <svg width="42" height="18" viewBox="0 0 42 18" fill="none">
              <path d="${sparkPath}" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <button type="button" class="recent-more-btn" title="Copy Link" onclick="window.appShell && window.appShell.copy('${shortUrl}')">📋</button>
          </div>
        </div>
      `;
    });

    elList.innerHTML = html;
  }

  function renderTopReferrers(referrers, totalClicks) {
    const elBody = $('#homeReferrersBody');
    if (!elBody) return;

    if (!referrers || referrers.length === 0 || totalClicks === 0) {
      elBody.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;width:100%;">
          <div style="font-size:24px;margin-bottom:8px;">👥</div>
          <b>No referrer telemetry yet</b>
          <p style="margin:4px 0;font-size:12px;">Share your short links to start tracking traffic channels.</p>
        </div>
      `;
      return;
    }

    const colors = ['#0A6CFF', '#a855f7', '#10b981', '#f59e0b', '#64748b'];
    const circumference = 2 * Math.PI * 36; // ~226.2
    let currentOffset = 0;
    let circlesHtml = '';
    let legendHtml = '';

    referrers.forEach((r, i) => {
      const color = colors[i % colors.length];
      const pct = Math.max(0, Math.min(100, Number(r.percent) || 0));
      const segLen = (pct / 100) * circumference;
      const gapLen = circumference - segLen;

      circlesHtml += `
        <circle cx="50" cy="50" r="36" stroke="${color}" stroke-width="14" fill="none"
                stroke-dasharray="${segLen.toFixed(1)} ${gapLen.toFixed(1)}" stroke-dashoffset="${(-currentOffset).toFixed(1)}"/>
      `;
      currentOffset += segLen;

      legendHtml += `
        <div class="legend-item">
          <div class="legend-left">
            <span class="legend-dot" style="background:${color};"></span>
            <span>${r.name || 'Direct'}</span>
          </div>
          <span class="legend-val">${pct}%</span>
        </div>
      `;
    });

    const topRef = referrers[0] || { name: 'Direct', percent: 100 };

    elBody.innerHTML = `
      <div class="donut-chart-box">
        <svg width="100" height="100" viewBox="0 0 100 100" style="transform:rotate(-90deg);">
          <circle cx="50" cy="50" r="36" stroke="#f1f5f9" stroke-width="14" fill="none"/>
          ${circlesHtml}
        </svg>
        <div class="donut-center-info">
          <span class="donut-pct-bold">${topRef.percent}%</span>
          <span class="donut-pct-label">${topRef.name}</span>
        </div>
      </div>

      <div class="referrers-legend-list">
        ${legendHtml}
      </div>
    `;
  }

  // Range selector listener
  const selRange = $('#homeOverviewRangeSelect');
  if (selRange) {
    selRange.value = currentRange;
    selRange.onchange = e => {
      loadDashboardSummary(e.target.value);
    };
  }

  // Initial load
  loadDashboardSummary(currentRange);

  // Live Activity 20-second background polling
  window.__heaLivePollTimer = setInterval(() => {
    if (document.body.contains(container)) {
      loadDashboardSummary(currentRange);
    } else {
      clearInterval(window.__heaLivePollTimer);
      window.__heaLivePollTimer = null;
    }
  }, 20000);

  // Interactive Tab Switching for Shorten vs QR Code
  const tabLink = $('#tabShortLinkOpt');
  const tabQr = $('#tabQrCodeOpt');
  const input = $('#homeShortenInput');
  const icon = $('#homeInputIcon');

  if (tabLink && tabQr && input) {
    tabLink.onclick = () => {
      activeType = 'link';
      tabLink.classList.add('active');
      tabQr.classList.remove('active');
      input.placeholder = 'Paste destination URL to generate a short link...';
      if (icon) icon.textContent = '🔗';
    };

    tabQr.onclick = () => {
      activeType = 'qr';
      tabQr.classList.add('active');
      tabLink.classList.remove('active');
      input.placeholder = 'Enter a URL to create a Vector QR Code...';
      if (icon) icon.textContent = '▦';
    };
  }

  // Form Submit Handler
  const form = $('#homeShortenForm');
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      const dest = $('#homeShortenInput').value.trim();
      const dom = (typeof window !== 'undefined' && window.location) ? window.location.host : 'healink.store';
      if (!dest) return;

      const btn = $('#homeSubmitBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Creating...</span>';
      }

      try {
        if (activeType === 'qr') {
          const newL = await createLinkDirect(dest, '', dom);
          const newId = (newL && newL.id) || ('lnk_' + Date.now());
          navigate('qr-detail', newId);
        } else {
          const newL = await createLinkDirect(dest, '', dom);
          const resBox = $('#homeShortenResult');
          if (resBox && newL) {
            const liveUrl = (newL.realShort && newL.realShort !== dest) ? newL.realShort : (newL.url && newL.url !== dest ? newL.url : `${window.location.protocol}//${dom}/${newL.slug}`);
            resBox.innerHTML = `
              <div style="background:#ffffff;border:1px solid #bfdbfe;border-radius:14px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 10px rgba(10,108,255,0.08);">
                <div style="min-width:0;">
                  <div style="font-size:11px;font-weight:700;color:#0284c7;text-transform:uppercase;">Live Short Link Ready</div>
                  <a href="${liveUrl}" target="_blank" rel="noopener" style="font-size:13.5px;font-weight:700;color:#0A6CFF;text-decoration:none;">${liveUrl}</a>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <button type="button" onclick="window.appShell && window.appShell.copy('${liveUrl}')" style="background:#0A6CFF;color:#ffffff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Copy</button>
                  <a href="${liveUrl}" target="_blank" rel="noopener" style="background:#f1f5f9;color:#334155;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none;display:inline-block;">Visit ↗</a>
                </div>
              </div>
            `;
            resBox.style.display = 'block';
            if ($('#homeShortenInput')) $('#homeShortenInput').value = '';
            // Refresh dashboard metrics immediately after link creation!
            loadDashboardSummary(currentRange);
          }
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>Create Now</span> →';
        }
      }
    };
  }
}
