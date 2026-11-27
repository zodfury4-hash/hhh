import {
  $, $$, state, generateShortSlug, normalizeLinkItem, getStoredLinks, getAuthToken,
  deleteQr, syncLinksFromServer, toast, copy, formatNumber
} from './state.js';
import { navigate } from './router.js';
import { drawQR } from './billing.js';

export function renderQr(container, mode) {

  const origin = window.location.origin;
  const links = getStoredLinks();

  let qrMode = mode || (links.length === 0 ? 'empty' : 'list');

  function renderView() {

    if (qrMode === 'empty') {

      container.innerHTML = `

        <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>QR Codes</h2>
              <span class="view-header-badge" style="background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.25);">
                <span>▦</span> Dynamic Vector
              </span>
            </div>
            <p class="view-subtitle">
              Design dynamic vector QR codes with custom colors, embedded logos, and real-time scan analytics.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-secondary-btn" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;font-size:13px;font-weight:700;cursor:pointer;" id="btnViewAllQr">
              View All Codes (${links.length})
            </button>
          </div>
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

              <span style="color:#0b132b;font-weight:600;font-size:13px;">{ } UTM parameters 👑</span>

              <label class="app-toggle-switch"><input type="checkbox" checked><span class="app-toggle-slider"></span></label>

            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

              <span style="color:#0b132b;font-weight:600;font-size:13px;">⏱️ Code expiration 👑</span>

              <label class="app-toggle-switch"><input type="checkbox"><span class="app-toggle-slider"></span></label>

            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">

              <div>

                <div style="color:#0b132b;font-weight:600;font-size:13px;">🔀 Dynamic routing 👑</div>

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
        const cleanUrl = `${origin}/${slug}`;
        const token = getAuthToken();
        if (!token) {
          window.appShell.toast('Please log in to create QR codes');
          return;
        }

        let newQ = {
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

        try {
          const [qrRes, linkRes] = await Promise.all([
            fetch('/api/qrs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
              body: JSON.stringify({
                title,
                dest,
                color: (state.appUser && state.appUser.selectedQrColor) || '#0070f3'
              })
            }),
            fetch('/api/links', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
              body: JSON.stringify({
                dest,
                slug,
                title,
                tag: 'QR Campaign',
                qr: true,
                realShort: cleanUrl
              })
            })
          ]);
          if (!linkRes.ok) {
            const linkErr = await linkRes.json().catch(() => ({}));
            window.appShell.toast(linkErr.error || 'Failed to create QR code');
            return;
          }
          const linkData = await linkRes.json();
          if (linkData && linkData.link) {
            newQ = normalizeLinkItem(linkData.link);
          }
          if (qrRes && qrRes.ok) {
            const qrData = await qrRes.json();
            if (qrData && qrData.qr && (qrData.qr._id || qrData.qr.id)) {
              newQ.qrId = qrData.qr._id || qrData.qr.id;
              newQ.id = newQ.qrId;
            }
          }
        } catch (err) {
          window.appShell.toast(err.message || 'Unable to reach server');
          return;
        }

        state.cachedLinks.unshift(newQ);

        if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();

        window.appShell.toast('QR Code created! Welcome to the Studio.');

        navigate('qr-detail', newQ.id);

      };

      return;

    }

    // Default 'list' mode

    container.innerHTML = `

      <div class="view-header">
        <div class="header-title-col">
          <div style="display:flex;align-items:center;gap:10px;">
            <h2>QR Codes</h2>
            <span class="view-header-badge" style="background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.25);">
              <span>▦</span> Dynamic Vector
            </span>
          </div>
          <p class="view-subtitle">
            Design dynamic vector QR codes with custom colors, embedded logos, and real-time scan analytics.
          </p>
        </div>
        <div class="header-actions-col"></div>
      </div>

      <div class="qr-filter-bar">

        <div class="dash-search-box" style="flex:1;">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input" id="qrSearchInput" placeholder="Search QR codes by label, destination, or color..." autocomplete="off">
        </div>

        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">📅 Filter by created date</button>

        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">⊞ Add filters</button>

        <button class="header-primary-btn" id="btnNewQrHero">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create QR Code</span>
        </button>

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
            const shortUrl = (item.realShort && item.realShort !== item.dest && item.realShort.length < 60)
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
                <button class="topbar-icon-btn" style="color:#ef4444;" title="Delete QR" onclick="window.appShell.deleteQr('${item.qrId || item.id || ''}', '${item.slug || ''}')">🗑️</button>
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

      qrMode = 'create';

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

          window.drawQR(cv, item.realShort || item.url || (item.dest || item.url || (origin + '/' + (item.slug || ''))), state.appUser.selectedQrColor || '#ff007f', '#ffffff', 160);

        }

      });

    }, 50);

  }

  renderView();

}

// ---------------- 5. QR CODE DETAILS & STUDIO (Screenshots 12.02.39 AM 1, 2, 3) ---------------- //

export function renderQrDetail(container, linkId) {

  const origin = window.location.origin;
  state.activeQrId = linkId || '';

  const links = getStoredLinks();

  const item = links.find(l => l.id === state.activeQrId || l.slug === state.activeQrId) || links[0];

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
            <span style="color:#0070f3;font-size:14px;font-weight:700;">${((item.realShort && item.realShort !== item.dest && item.realShort.length < 60) ? item.realShort : (origin + '/' + (item.slug || 'lnk'))).replace(/^https?:\/\//, '')}</span>
            <button class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;" onclick="window.appShell.copy('${((item.realShort && item.realShort !== item.dest && item.realShort.length < 60) ? item.realShort : (origin + '/' + (item.slug || 'lnk')))}')">📋 Copy</button>
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

            <button class="color-dot" style="width:20px;height:20px;border-radius:50%;background:${c};border:2px solid ${state.appUser.selectedQrColor === c ? '#0070f3' : 'transparent'};cursor:pointer;" onclick="window.appShell.changeQrColor('${c}')"></button>

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

      window.drawQR(cv, item.realShort || item.url || (item.dest || item.url || (origin + '/' + (item.slug || ''))), state.appUser.selectedQrColor || '#ff007f', '#ffffff', 200);

    }

  }, 50);

}

export function changeQrColor(c) {

  state.appUser.selectedQrColor = c;

  const cv = $('#qrDetailCanvas');

  if (cv && typeof window.drawQR === 'function') {

    window.drawQR(cv, 'https://tinyurl.com/3WeOEOz', c, '#ffffff', 200);

  }

  toast(`QR code color updated to ${c}`);

}

export function downloadQrPNG(slug) {

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

export function downloadQrSVG(slug) {

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
