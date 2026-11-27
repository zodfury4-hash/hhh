import {
  $, $$, state, getStoredLinks, getAuthToken, handleUnauthorizedSession,
  syncLinksFromServer, exportAnalyticsCSV, toast, copy, formatNumber
} from './state.js';
import { navigate } from './router.js';
import { createLinkDirect } from './links.js';

export async function renderAnalytics(container) {
  const links = getStoredLinks();
  let totalClicks = links.reduce((a, l) => {
    const c = typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0);
    return a + c;
  }, 0);
  let totalScans = links.reduce((a, l) => {
    const sc = typeof l.scans === 'number' ? l.scans : (parseInt(l.scans, 10) || 0);
    return a + sc;
  }, 0);
  let uniqueVisitors = 0;
  let topReferrers = [];
  let deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
  let recentClicks = [];

  // Fetch live backend metrics via Mongo aggregation
  const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
  try {
    if (s && s.token) {
      const res = await fetch('/api/analytics/overview?range=7d', {
        headers: { 'Authorization': 'Bearer ' + s.token }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.totalClicks !== undefined) totalClicks = d.totalClicks;
        if (d.totalScans !== undefined) totalScans = d.totalScans;
        if (d.uniqueVisitors !== undefined) uniqueVisitors = d.uniqueVisitors;
        if (Array.isArray(d.topReferrers)) topReferrers = d.topReferrers;
        if (d.deviceBreakdown) deviceBreakdown = d.deviceBreakdown;
        if (Array.isArray(d.recentClicks)) recentClicks = d.recentClicks;
      }
    }
  } catch (e) {}

  // Build Dynamic Traffic Channels HTML
  let channelsHtml = '';
  if (topReferrers && topReferrers.length > 0) {
    channelsHtml = topReferrers.map((r) => {
      const p = Math.min(Math.max(r.percent || 0, 0), 100);
      return `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#0b132b;font-weight:600;">${r.name || 'Direct'}</span>
            <span style="color:#0070f3;font-weight:700;">${p}% <span style="font-size:11px;color:#64748b;font-weight:500;">(${r.count || 0})</span></span>
          </div>
          <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
            <div style="width:${p}%;height:100%;background:#0070f3;border-radius:99px;transition:width 0.4s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    channelsHtml = `
      <div style="text-align:center;padding:24px 12px;color:#64748b;font-size:13px;">
        <div style="font-size:24px;margin-bottom:6px;">📊</div>
        <b>No traffic channels yet</b>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Share your short links across social, email or QR to begin tracking channel telemetry.</p>
      </div>
    `;
  }

  // Build Dynamic Devices HTML
  let devicesHtml = '';
  const hasDeviceData = (deviceBreakdown.mobile > 0 || deviceBreakdown.desktop > 0 || deviceBreakdown.tablet > 0);
  if (hasDeviceData) {
    devicesHtml = `
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Mobile (iOS &amp; Android)</span>
          <span style="color:#059669;font-weight:700;">${deviceBreakdown.mobile}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${deviceBreakdown.mobile}%;height:100%;background:#059669;border-radius:99px;"></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Desktop (Windows &amp; Mac)</span>
          <span style="color:#0070f3;font-weight:700;">${deviceBreakdown.desktop}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${deviceBreakdown.desktop}%;height:100%;background:#0070f3;border-radius:99px;"></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Tablet</span>
          <span style="color:#8b5cf6;font-weight:700;">${deviceBreakdown.tablet}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${deviceBreakdown.tablet}%;height:100%;background:#8b5cf6;border-radius:99px;"></div>
        </div>
      </div>
    `;
  } else {
    devicesHtml = `
      <div style="text-align:center;padding:24px 12px;color:#64748b;font-size:13px;">
        <div style="font-size:24px;margin-bottom:6px;">📱</div>
        <b>No device data yet</b>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Visitor device classifications (Mobile, Desktop, Tablet) will automatically render here as clicks arrive.</p>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="analytics-actions-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div class="assist-status-pill" style="padding:6px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:99px;display:inline-flex;align-items:center;gap:8px;">
        <span class="status-pulse-dot" style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        <span style="font-size:12.5px;font-weight:700;color:#059669;">Live Telemetry</span>
        <span id="analyticsLastUpdated" style="font-size:11.5px;color:#64748b;font-weight:500;">· Updated just now</span>
      </div>
      <button class="header-secondary-btn" id="btnExportCSV" onclick="window.appShell.exportAnalyticsCSV()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;color:#0b132b;font-size:13px;font-weight:700;cursor:pointer;">
        <span>📥</span> Export CSV Report
      </button>
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
        <div style="font-size:32px;font-weight:800;color:#0070f3;" id="analyticsLiveClicks">${totalClicks}</div>
        <div style="font-size:12px;color:#0070f3;margin-top:6px;">↗ Unique Visitors: <b>${uniqueVisitors}</b></div>
      </div>
      <div class="dash-white-card">
        <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL QR SCANS</div>
        <div style="font-size:32px;font-weight:800;color:#ff007f;">${totalScans}</div>
        <div style="font-size:12px;color:#ff007f;margin-top:6px;">📱 Dynamic code scans</div>
      </div>
    </div>

    <!-- 3-Step Guided Journey matching Frame 17 -->
    <div class="dash-grid-3 analytics-steps-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:24px;">
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
    <div class="dash-grid-2 analytics-channels-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="dash-white-card">
        <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Top Traffic Channels</h4>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
          ${channelsHtml}
        </div>
      </div>
      <div class="dash-white-card">
        <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Device &amp; Platform Split</h4>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
          ${devicesHtml}
        </div>
      </div>
    </div>
  `;

  // Connect Server-Sent Events (SSE) for Real-Time Click Updates
  if (window.EventSource && s && s.token) {
    if (window._analyticsEventSource) {
      try { window._analyticsEventSource.close(); } catch (_e) {}
    }
    try {
      const es = new EventSource('/api/analytics/stream?token=' + encodeURIComponent(s.token));
      window._analyticsEventSource = es;
      es.addEventListener('click', (e) => {
        try {
          const liveEl = document.getElementById('analyticsLiveClicks');
          if (liveEl) {
            const cur = parseInt(liveEl.textContent.replace(/,/g, ''), 10) || 0;
            liveEl.textContent = (cur + 1).toLocaleString();
          }
          const updatedEl = document.getElementById('analyticsLastUpdated');
          if (updatedEl) {
            updatedEl.textContent = '· Click recorded just now!';
          }
        } catch (_err) {}
      });
    } catch (_esErr) {}
  }

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

export function renderCampaigns(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Campaigns &amp; UTM Builder</h2>
          <span class="view-header-badge" style="background:rgba(121,40,202,0.1);color:#7928ca;border:1px solid rgba(121,40,202,0.25);">
            <span>🎯</span> Multi-Channel
          </span>
        </div>
        <p class="view-subtitle">
          Architect bulletproof UTM parameters for Meta, Google Ads, TikTok, and influencer sponsorships.
        </p>
      </div>
      <div class="header-actions-col">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Campaign
        </button>
      </div>
    </div>

    <!-- Real-time Campaign Attribution Hero Banner -->
    <div class="dash-white-card" style="text-align:center;padding:32px 24px;margin-bottom:24px;">
      <div id="campHeroStats" style="min-height:90px;max-width:360px;margin:0 auto 16px;background:rgba(0,112,243,0.04);border:1px solid rgba(0,112,243,0.15);border-radius:12px;display:flex;flex-direction:column;justify-content:center;padding:12px;gap:6px;">
        <div style="font-size:12px;color:#64748b;">Loading campaign telemetry...</div>
      </div>
      <h3 style="font-size:22px;font-weight:800;color:#0070f3;margin:0 0 8px;">Multi-Channel Attribution</h3>
      <p style="color:#64748b;font-size:13.5px;max-width:520px;margin:0 auto 16px;line-height:1.5;">
        Organize your links into campaigns to compare performance across social channels, paid ads, and newsletters in real-time.
      </p>
    </div>

    <!-- Live Interactive UTM Builder Card -->
    <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
      <h3 style="color:#0070f3;margin-top:0;font-size:18px;font-weight:700;">⚡ UTM Campaign URL Builder</h3>
      <p style="color:#64748b;font-size:13px;margin-bottom:16px;">Add trackable campaign tags to your links to monitor conversions across TikTok, Google Ads, Meta, and newsletters in MongoDB.</p>
      <div class="dash-grid-2 camp-grid-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div class="create-link-field" style="margin:0;">
          <label>Destination Website URL</label>
          <input type="url" id="campDestUrl" placeholder="https://yourstore.com/summer-collection" value="">
        </div>
        <div class="create-link-field" style="margin:0;">
          <label>Campaign Name (utm_campaign)</label>
          <input type="text" id="campName" placeholder="e.g. summer_collection_meta_2026" value="">
        </div>
      </div>
      <div class="dash-grid-2 camp-grid-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
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
        <code id="campPreviewUrl" style="color:#38bdf8;font-size:13px;word-break:break-all;">https://yourstore.com/summer-collection?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=summer_collection_meta_2026</code>
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

    <!-- Real Campaign Attribution Performance Table -->
    <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#0b132b;margin:0;font-size:18px;font-weight:700;">📊 Tracked Campaigns &amp; Channel Attribution</h3>
        <span id="campSummaryBadge" style="font-size:12px;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:99px;">Live Data</span>
      </div>
      <div id="campaignsListContainer">
        <div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px;">Loading attribution data...</div>
      </div>
    </div>
  `;

  const updatePreview = () => {
    const dest = $('#campDestUrl')?.value.trim() || 'https://example.com';
    const name = $('#campName')?.value.trim() || 'campaign';
    const source = $('#campSource')?.value || 'facebook';
    const medium = $('#campMedium')?.value || 'cpc';
    let full = '';
    if (window.HeaUtm && typeof window.HeaUtm.buildUtmUrl === 'function') {
      try {
        full = window.HeaUtm.buildUtmUrl(dest, {
          utm_source: source,
          utm_medium: medium,
          utm_campaign: name
        });
      } catch (_e) {
        full = `${dest}${dest.includes('?') ? '&' : '?'}utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(name)}`;
      }
    } else {
      full = `${dest}${dest.includes('?') ? '&' : '?'}utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(name)}`;
    }
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
    shortenBtn.onclick = async () => {
      const dest = $('#campDestUrl')?.value.trim();
      if (!dest) {
        toast('Please enter a destination URL');
        return;
      }
      const campName = $('#campName')?.value.trim() || 'campaign';
      const source = $('#campSource')?.value || 'social';
      const medium = $('#campMedium')?.value || 'cpc';

      try {
        await createLinkDirect(dest, '', 'healink.store', {
          title: `Campaign: ${campName}`,
          tag: 'Campaign',
          utm: {
            campaign: campName,
            source,
            medium
          }
        });
        toast(`Campaign link created: ${campName}`);
        loadCampaignData();
      } catch (err) {
        toast(`Failed to create campaign link: ${err.message}`);
      }
    };
  }

  // Load real attribution data from /api/analytics/overview
  async function loadCampaignData() {
    const heroContainer = $('#campHeroStats');
    const tableContainer = $('#campaignsListContainer');
    const token = (state.appUser && state.appUser.token) || (() => {
      try { return JSON.parse(localStorage.getItem('hea_session') || '{}').token; } catch (_e) { return null; }
    })();

    if (!token) {
      if (heroContainer) {
        heroContainer.innerHTML = `
          <div style="font-size:12px;color:#64748b;padding:8px 0;">Sign in to view real campaign telemetry</div>
        `;
      }
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div style="text-align:center;padding:24px;color:#64748b;font-size:13px;">
            Please sign in to view live campaign attribution metrics.
          </div>
        `;
      }
      return;
    }

    try {
      const res = await fetch('/api/analytics/overview?range=30d', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const campaigns = Array.isArray(data.byCampaign) ? data.byCampaign : [];
      const sources = Array.isArray(data.bySource) ? data.bySource : [];

      // 1. Update Hero Stats
      if (heroContainer) {
        if (campaigns.length === 0 && sources.length === 0) {
          heroContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 0;">
              <span style="font-size:16px;">🎯</span>
              <span style="font-size:12px;font-weight:600;color:#0b132b;">No campaign clicks yet</span>
              <span style="font-size:11px;color:#94a3b8;">Zero fake data • Live attribution ready</span>
            </div>
          `;
        } else {
          const topChips = campaigns.slice(0, 3).map(c => `
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#0b132b;background:#ffffff;padding:5px 10px;border-radius:6px;border:1px solid #e2e8f0;">
              <span style="font-weight:600;">${c.campaign || 'Direct'}</span>
              <b>${c.count} ${c.count === 1 ? 'click' : 'clicks'} (${c.percent}%)</b>
            </div>
          `).join('');
          heroContainer.innerHTML = topChips;
        }
      }

      // 2. Update Table
      if (tableContainer) {
        if (campaigns.length === 0) {
          tableContainer.innerHTML = `
            <div style="text-align:center;padding:32px 16px;color:#64748b;">
              <div style="font-size:28px;margin-bottom:8px;">🎯</div>
              <p style="margin:0 0 6px;font-weight:600;color:#0b132b;">No campaign clicks tracked yet</p>
              <p style="margin:0;font-size:13px;color:#64748b;">Shorten a campaign URL above to track channel attribution and conversion rates.</p>
            </div>
          `;
        } else {
          tableContainer.innerHTML = `
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
                <thead>
                  <tr style="border-bottom:1.5px solid #e2e8f0;color:#64748b;font-size:11px;text-transform:uppercase;">
                    <th style="padding:10px 12px;">Campaign Name</th>
                    <th style="padding:10px 12px;">Verified Clicks</th>
                    <th style="padding:10px 12px;">Traffic Share</th>
                    <th style="padding:10px 12px;text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${campaigns.map(c => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:12px;font-weight:600;color:#0b132b;">🏷️ ${c.campaign}</td>
                      <td style="padding:12px;color:#0b132b;font-weight:700;">${c.count.toLocaleString()}</td>
                      <td style="padding:12px;color:#64748b;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="flex:1;max-width:80px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
                            <div style="width:${c.percent}%;height:100%;background:#6366f1;"></div>
                          </div>
                          <span style="font-size:11px;font-weight:600;">${c.percent}%</span>
                        </div>
                      </td>
                      <td style="padding:12px;text-align:right;">
                        <button class="sso-btn" style="padding:4px 10px;font-size:11px;border-radius:6px;" onclick="window.appShell.navigate('analytics')">
                          View Analytics →
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      }
    } catch (err) {
      if (heroContainer) heroContainer.innerHTML = `<div style="font-size:12px;color:#94a3b8;">Attribution offline</div>`;
      if (tableContainer) tableContainer.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed to load campaign telemetry.</div>`;
    }
  }

  loadCampaignData();
}
