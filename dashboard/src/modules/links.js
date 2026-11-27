import {
  $, $$, state, cleanSafeStr, generateShortSlug, fetchOnlineShortUrl, normalizeLinkItem,
  getStoredLinks, getAuthToken, deleteLink, syncLinksFromServer, toast, copy, openWhatModal
} from './state.js';
import { navigate } from './router.js';

export function renderCreateLink(container) {

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

          ${state.appUser.isPro ? '<span style="color:#10b981;font-weight:700;">👑 Core PRO Active: Unlimited short links &amp; custom back-halves</span>' : 'You have <b>4 links</b> and <b>3 custom back-halves</b> remaining this month. <a href="#" style="color:#38bdf8;" onclick="window.openCheckoutModal(\'pro\'); return false;">Upgrade for more</a>.'}

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

        <div class="create-slug-grid" style="display:grid;grid-template-columns:1fr 20px 1.4fr;gap:12px;align-items:flex-end;margin-bottom:20px;">

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
        <div id="wrapUtmFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;flex-direction:column;gap:10px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Campaign Name</label>
            <input type="text" id="newUtmCampaign" placeholder="e.g. spring_launch_2026" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Medium</label>
              <input type="text" id="newUtmMedium" placeholder="e.g. cpc, email, social" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Source</label>
              <input type="text" id="newUtmSource" placeholder="e.g. google, twitter" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
            </div>
          </div>
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
        <div id="wrapExpirationFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Expiration Date &amp; Time</label>
            <input type="datetime-local" id="newExpiresAt" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Maximum Clicks Limit (optional)</label>
            <input type="number" id="newMaxClicks" min="1" placeholder="e.g. 100" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
        </div>

        <!-- Password Protection -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;color:#0070f3;">🔒</span>
            <div>
              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Password protection</b>
              <span style="color:#fbbf24;font-size:13px;margin-left:6px;">👑</span>
            </div>
          </div>
          <label class="app-toggle-switch">
            <input type="checkbox" id="chkPasswordProtect">
            <span class="app-toggle-slider"></span>
          </label>
        </div>
        <div id="wrapPasswordFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;">
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Link Passcode</label>
          <input type="password" id="newLinkPassword" placeholder="Enter link passcode..." autocomplete="new-password" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
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

  const chkUtm = $('#chkUtmParams');
  if (chkUtm) {
    chkUtm.onchange = (e) => {
      const wrap = $('#wrapUtmFields');
      if (wrap) wrap.style.display = e.target.checked ? 'flex' : 'none';
    };
  }
  const chkExp = $('#chkLinkExpiration');
  if (chkExp) {
    chkExp.onchange = (e) => {
      const wrap = $('#wrapExpirationFields');
      if (wrap) wrap.style.display = e.target.checked ? 'block' : 'none';
    };
  }
  const chkPwd = $('#chkPasswordProtect');
  if (chkPwd) {
    chkPwd.onchange = (e) => {
      const wrap = $('#wrapPasswordFields');
      if (wrap) wrap.style.display = e.target.checked ? 'block' : 'none';
    };
  }

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

    const password = $('#chkPasswordProtect')?.checked ? ($('#newLinkPassword')?.value.trim() || null) : null;
    const expiresAt = $('#chkLinkExpiration')?.checked ? ($('#newExpiresAt')?.value || null) : null;
    const maxClicks = $('#chkLinkExpiration')?.checked ? ($('#newMaxClicks')?.value || null) : null;
    const utmCampaign = $('#chkUtmParams')?.checked ? ($('#newUtmCampaign')?.value.trim() || null) : null;
    const utmSource = $('#chkUtmParams')?.checked ? ($('#newUtmSource')?.value.trim() || null) : null;
    const utmMedium = $('#chkUtmParams')?.checked ? ($('#newUtmMedium')?.value.trim() || null) : null;

    const btn = $('#btnSubmitNewLink');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating link...';
    }

    const origin = window.location.origin;
    const token = getAuthToken();
    if (!token) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Create your link';
      }
      window.appShell.toast('Please log in to create links');
      return;
    }

    let createdLink = null;
    try {
      const payload = {
        dest,
        slug,
        title,
        tag,
        qr: hasQR
      };
      if (password) payload.password = password;
      if (expiresAt) payload.expiresAt = expiresAt;
      if (maxClicks) payload.maxClicks = parseInt(maxClicks, 10);
      if (utmCampaign || utmSource || utmMedium) {
        payload.utm = { campaign: utmCampaign, source: utmSource, medium: utmMedium };
      }

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create your link';
        }
        window.appShell.toast(data.error || 'Failed to create link');
        return;
      }
      if (data.link) {
        createdLink = normalizeLinkItem(data.link);
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Create your link';
      }
      window.appShell.toast(err.message || 'Unable to reach server');
      return;
    }

    if (createdLink) {
      state.cachedLinks.unshift(createdLink);
    }
    const cleanUrl = (createdLink && createdLink.url) || `${origin}/${slug}`;

    if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();
    window.appShell.toast(`Created link: ${cleanUrl}`);
    navigator.clipboard.writeText(cleanUrl).catch(() => {});
    navigate('links');
  };

}

export async function createLinkDirect(dest, customSlug, domain, options = {}) {
  const checkLimit = (typeof window.canCreateLinkOrQr === 'function') ? window.canCreateLinkOrQr() : { allowed: true };
  if (!checkLimit.allowed) {
    window.appShell.toast(checkLimit.message);
    if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');
    return null;
  }

  const slug = customSlug || generateShortSlug(6);
  const origin = window.location.origin;
  const token = getAuthToken();
  if (!token) {
    window.appShell.toast('Please log in to create links');
    return null;
  }

  const title = options.title || ('Untitled ' + new Date().toISOString().slice(0, 10));
  const tag = options.tag || 'Website';
  const payload = {
    dest,
    slug,
    title,
    tag,
    qr: true
  };
  if (options.utm) payload.utm = options.utm;

  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.link) {
      window.appShell.toast(data.error || 'Failed to create link');
      return null;
    }

    const newL = normalizeLinkItem(data.link);
    const cleanUrl = (newL && newL.url) || `${origin}/${newL.slug}`;
    state.cachedLinks.unshift(newL);

    if (typeof window.recordFreeCreation === 'function') window.recordFreeCreation();
    window.appShell.toast(`Link shortened: ${cleanUrl}`);
    navigator.clipboard.writeText(cleanUrl).catch(() => {});
    if (state.activeTab !== 'home' && window.location.hash !== '#dashboard' && window.location.hash !== '') {
      navigate('links');
    }
    return newL;
  } catch (err) {
    window.appShell.toast(err.message || 'Unable to reach server');
    return null;
  }
}

export function renderLinks(container) {

  const links = getStoredLinks();

  const origin = window.location.origin;

  container.innerHTML = `

    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Links</h2>
          <span class="view-header-badge" style="background:rgba(10,108,255,0.1);color:#0A6CFF;border:1px solid rgba(10,108,255,0.2);">
            <span>🔗</span> ${links.length} Active
          </span>
        </div>
        <p class="view-subtitle">
          Manage, customize, and analyze your branded short links with custom back-halves.
        </p>
      </div>
      <div class="header-actions-col">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create link</span>
        </button>
      </div>
    </div>

    <div class="links-filter-bar">
      <div class="links-filter-row">
        <div class="dash-search-box">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input" id="linksSearchInput" placeholder="Search links by title, slug, tag, or destination..." autocomplete="off">
        </div>

        <select id="linksTagSelect" class="dash-filter-select">
          <option value="">All tags</option>
          <option value="Website">Website</option>
          <option value="Social">Social</option>
          <option value="Campaign">Campaign</option>
        </select>
      </div>

      <div class="links-create-row">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')" style="background:#0A6CFF;color:#ffffff !important;border:none;border-radius:99px;padding:10px 24px;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-shadow:0 4px 14px rgba(10,108,255,0.25);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-weight:700;">Create link</span>
        </button>
      </div>
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

        const shortUrl = (l.realShort && l.realShort !== l.dest && l.realShort.length < 60)
          ? l.realShort
          : `${origin}/${l.slug || 'lnk'}`;
        const shortDisplay = shortUrl.replace(/^https?:\/\//, '');

        return `
        <div class="qr-card-item">
          <div style="flex:1;min-width:0;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
              <span style="background:rgba(0,112,243,0.08);color:#0070f3;font-weight:700;font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid rgba(0,112,243,0.18);">${l.tag || 'Website'}</span>
              ${l.hasPassword ? '<span style="background:rgba(239,68,68,0.08);color:#ef4444;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(239,68,68,0.2);">🔒 Passcode</span>' : ''}
              ${l.expiresAt ? '<span style="background:rgba(245,158,11,0.08);color:#d97706;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(245,158,11,0.2);">⏳ Expiring</span>' : ''}
              ${l.maxClicks ? `<span style="background:rgba(16,185,129,0.08);color:#059669;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(16,185,129,0.2);">🎯 Max ${l.maxClicks}</span>` : ''}
              ${l.utm && (l.utm.campaign || l.utm.source) ? `<span style="background:rgba(99,102,241,0.08);color:#6366f1;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(99,102,241,0.2);">🏷️ ${l.utm.campaign || l.utm.source}</span>` : ''}
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
