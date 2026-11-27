// Auto-modularized Dashboard Shared State & Utilities
import { navigate, renderActiveView } from './router.js';
import { renderQr, renderQrDetail } from './qr.js';
import { renderPages } from './bio.js';

export const $ = selector => document.querySelector(selector);

export const $$ = selector => document.querySelectorAll(selector);

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

export function isVipEmail(userOrEmail) {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'object') {
    return userOrEmail.role === 'admin' || !!userOrEmail.isAdmin;
  }
  return state.appUser && (state.appUser.role === 'admin' || !!state.appUser.isAdmin);
}

export const state = {
  appUser: {

  name: 'Account',

  email: '',

  orgId: '',

  city: '',

  isp: '',

  avatar: 'HA',

  selectedQrColor: '#00d2ff',

  isPro: false,

  plan: 'Free'

},
  cachedLinks: [],
  cachedBios: [],
  activeTab: "home",
  activeQrId: ""
};

export function generateShortSlug(len = 6) {

  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

  let res = '';

  for (let i = 0; i < len; i++) {

    res += chars.charAt(Math.floor(Math.random() * chars.length));

  }

  return res;

}

export async function fetchOnlineShortUrl(targetUrl, customSlug) {
  if (!targetUrl) return null;
  let norm = targetUrl.trim();
  if (!/^https?:\/\//i.test(norm)) norm = 'https://' + norm;
  const s = customSlug || generateShortSlug(6);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/shorten-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: norm, slug: s }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl && /^https?:\/\//i.test(data.shortUrl) && data.shortUrl !== norm) {
        return data.shortUrl;
      }
    }
  } catch (_e) {}

  return null;
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem('hea_session');
    localStorage.removeItem('hea_session');
    sessionStorage.removeItem('hea_token');
    localStorage.removeItem('hea_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('hea_qrs');
    localStorage.removeItem('hea_bios');
    localStorage.removeItem('hea_custom_domain');
  } catch (_e) {}
  state.cachedLinks = [];
  state.cachedBios = [];
  state.appUser.name = '';
  state.appUser.email = '';
  state.appUser.isPro = false;
  state.appUser.isAdmin = false;
  state.appUser.plan = 'Free';
}

export function isJwtExpired(token) {
  try {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) return true;
    return false;
  } catch (_e) {
    return true;
  }
}

export function getJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(atob(b64));
  } catch (_e) {
    return null;
  }
}

export function handleUnauthorizedSession() {
  clearStoredSession();
  window.location.replace('/#login');
}

export function isUserAuthenticated() {
  try {
    const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const token =
      (parsed && parsed.token) || sessionStorage.getItem('hea_token') || localStorage.getItem('hea_token') || '';
    if (
      !parsed ||
      !parsed.isVerified ||
      !parsed.email ||
      parsed.email === 'john@example.com' ||
      !token ||
      isJwtExpired(token)
    ) {
      clearStoredSession();
      return false;
    }
    setAppUser(parsed);
    return true;
  } catch (_e) {
    clearStoredSession();
    return false;
  }
}

export function setAppUser(u) {

  if (!u) return;

  const prevEmail = (state.appUser.email || '').toLowerCase().trim();
  const nextEmail = (u.email || '').toLowerCase().trim();
  if (nextEmail && prevEmail && prevEmail !== nextEmail) {
    state.cachedLinks = [];
    state.cachedBios = [];
    try {
      localStorage.removeItem('hea_qrs');
      localStorage.removeItem('hea_bios');
      localStorage.removeItem('hea_custom_domain');
    } catch (_e) {}
  }

  if (u.name) state.appUser.name = u.name;

  if (u.email) state.appUser.email = u.email.toLowerCase().trim();

  if (u.city) state.appUser.city = u.city;

  if (u.isp) state.appUser.isp = u.isp;

  if (u.email && isVipEmail(u.email)) {

    state.appUser.isPro = true;

    state.appUser.isAdmin = true;

    state.appUser.plan = 'Unlimited';

  } else if (u.isPro) {

    state.appUser.isPro = true;

    state.appUser.isAdmin = !!u.isAdmin;

    state.appUser.plan = u.plan || 'Core PRO';

  } else {

    state.appUser.isPro = false;

    state.appUser.isAdmin = !!u.isAdmin;

    state.appUser.plan = u.plan || 'Free';

  }

  const displayName = state.appUser.name || 'Account';

  const sName = $('#sidebarUserName');

  if (sName) sName.textContent = displayName;

  const sEmail = $('#sidebarUserEmail');

  if (sEmail) sEmail.textContent = state.appUser.email || '';

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
    sideAv.setAttribute('data-tooltip', `${displayName} · ${state.appUser.email || ''}`);
    const link = $('#sidebarUserLink');
    if (link) link.setAttribute('data-tooltip', `${displayName} · ${state.appUser.email || ''}`);
  }

  const sOrg = $('#sidebarUserOrg');

  if (sOrg) {

    const firstName = displayName.split(' ')[0];

    const isMaster = (state.appUser.email && isVipEmail(state.appUser.email));

    const badgeText = isMaster ? 'UNLIMITED VIP' : (state.appUser.isPro ? 'PRO' : 'FREE');

    const badgeStyle = isMaster ? 'background:linear-gradient(135deg,#D4FF24,#10b981);color:#060b18;font-weight:800;' : '';

    sOrg.innerHTML = `${firstName}'s Workspace <span class="verified-tag" style="font-size:9px;padding:2px 6px;${badgeStyle}">${badgeText}</span>`;

  }

  const greeting = $('#homeGreetingUser');

  if (greeting) {

    greeting.textContent = `Hi ${displayName.split(' ')[0]},`;

  }

  // Topbar Plan Badge
  const topbarBadge = $('#topbarProBadge');
  if (topbarBadge) {
    if (state.appUser.isPro) {
      topbarBadge.innerHTML = `<span>👑</span> ${state.appUser.plan || 'Pro Active'}`;
      topbarBadge.style.background = '';
      topbarBadge.style.color = '';
      topbarBadge.style.borderColor = '';
    } else {
      topbarBadge.innerHTML = `<span>⚡</span> Free Plan · Upgrade`;
      topbarBadge.style.background = '#f1f5f9';
      topbarBadge.style.color = '#475569';
      topbarBadge.style.borderColor = '#cbd5e1';
      topbarBadge.onclick = () => window.openCheckoutModal && window.openCheckoutModal('pro');
      topbarBadge.style.cursor = 'pointer';
    }
  }

  // Topbar Notifications Badge Sync
  try {
    const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
    const token = s.token || localStorage.getItem('hea_token') || sessionStorage.getItem('hea_token');
    if (token) {
      fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(r => r.json()).then(d => {
        if (d && typeof d.unreadCount === 'number') {
          const badges = document.querySelectorAll('.topbar-notif-badge, #topbarNotifBadge');
          badges.forEach(b => {
            b.textContent = d.unreadCount;
            b.style.display = d.unreadCount > 0 ? '' : 'none';
          });
        }
      }).catch(() => {});
    }
  } catch (e) {}

}

try {

  const saved = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');

  if (saved) {

    const p = JSON.parse(saved);

    if (p && p.isVerified) {

      if (p.name) state.appUser.name = p.name;

      if (p.email) state.appUser.email = p.email;

      if (p.city) state.appUser.city = p.city;

      if (p.isp) state.appUser.isp = p.isp;

      if (p.email && isVipEmail(p.email)) {

        state.appUser.isPro = true;

        state.appUser.isAdmin = true;

        state.appUser.plan = 'Unlimited';

      } else if (p.isPro) {

        state.appUser.isPro = true;

        state.appUser.plan = p.plan || 'Core PRO';

      }

    }

  }

} catch (e) {}

export function cleanSafeStr(val, fallback = '') {
  if (typeof val !== 'string') return fallback;
  let s = val.replace(/\[object\s+Object\],?/gi, '').replace(/\bundefined\b/gi, '').trim();
  return s || fallback;
}

export function normalizeLinkItem(l) {
  if (!l || typeof l !== 'object') return null;
  const origin = window.location.origin;
  const item = { ...l };
  item.id = item._id || item.id || ('lnk_' + Date.now());
  item.title = cleanSafeStr(item.title, 'Untitled Link');
  item.slug = cleanSafeStr(item.slug, generateShortSlug(6));
  item.dest = cleanSafeStr(item.dest, '');
  item.url = cleanSafeStr(item.url, '');
  item.realShort = cleanSafeStr(item.realShort, '');
  item.tag = cleanSafeStr(item.tag, 'Website');

  if (!item.dest && item.url) item.dest = item.url;
  const shortCandidate = origin + '/' + item.slug;
  if (!item.realShort || item.realShort === item.dest || item.realShort.includes('da.gd') || item.realShort.length > 60) {
    item.realShort = shortCandidate;
  }
  if (!item.url || item.url === item.dest || item.url.length > 60) {
    item.url = shortCandidate;
  }

  if (Array.isArray(item.clicks)) {
    item.clicks = item.clicks.length;
  } else if (item.clicks && typeof item.clicks === 'object') {
    item.clicks = Object.keys(item.clicks).length;
  } else if (typeof item.clicks !== 'number') {
    const num = parseInt(item.clicks, 10);
    item.clicks = isNaN(num) ? 0 : num;
  }

  if (typeof item.scans !== 'number') {
    const num = parseInt(item.scans, 10);
    item.scans = isNaN(num) ? 0 : num;
  }
  return item;
}

export function getStoredLinks() {
  return state.cachedLinks;
}

export function getAuthToken() {
  try {
    const s = JSON.parse(sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session') || '{}');
    return s.token || sessionStorage.getItem('hea_token') || localStorage.getItem('hea_token') || '';
  } catch (_e) {
    return '';
  }
}

export async function refreshAuthTokenIfNeeded() {
  try {
    const token = getAuthToken();
    if (!token || isJwtExpired(token)) {
      handleUnauthorizedSession();
      return false;
    }
    const payload = getJwtPayload(token);
    const msLeft = payload && payload.exp ? payload.exp * 1000 - Date.now() : 0;
    if (msLeft > 24 * 60 * 60 * 1000) {
      return true;
    }
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401 || res.status === 404) {
      handleUnauthorizedSession();
      return false;
    }
    if (res.ok) {
      const data = await res.json();
      if (data && data.token) {
        const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
        const cur = raw ? JSON.parse(raw) : {};
        const updated = { ...cur, ...(data.user || {}), isVerified: true, token: data.token };
        localStorage.setItem('hea_session', JSON.stringify(updated));
        sessionStorage.setItem('hea_session', JSON.stringify(updated));
        localStorage.setItem('hea_token', data.token);
        sessionStorage.setItem('hea_token', data.token);
        setAppUser(updated);
      }
    }
    return true;
  } catch (_err) {
    return true;
  }
}

export async function syncLinksFromServer() {
  try {
    const token = getAuthToken();
    if (!token) {
      state.cachedLinks = [];
      return state.cachedLinks;
    }
    const res = await fetch('/api/links', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) {
      handleUnauthorizedSession();
      return state.cachedLinks;
    }
    if (!res.ok) return state.cachedLinks;
    const data = await res.json();
    if (data && Array.isArray(data.links)) {
      state.cachedLinks = data.links
        .map(normalizeLinkItem)
        .filter(Boolean);
    }
    return state.cachedLinks;
  } catch (_err) {
    return state.cachedLinks;
  }
}

export async function syncQrsFromServer() {
  try {
    localStorage.removeItem('hea_qrs');
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch('/api/qrs', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) {
      handleUnauthorizedSession();
      return;
    }
    if (!res.ok) return;
    await res.json();
  } catch (_err) {}
}

export async function syncPagesFromServer() {
  try {
    localStorage.removeItem('hea_bios');
    const token = getAuthToken();
    if (!token) {
      state.cachedBios = [];
      return;
    }
    const res = await fetch('/api/bios', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) {
      handleUnauthorizedSession();
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.bios)) {
      const origin = window.location.origin;
      state.cachedBios = data.bios.map(b => ({
        ...b,
        id: b._id || b.id || b.slug,
        url: b.url || `${origin}/m/${b.slug}`
      }));
    }
  } catch (_err) {}
}

export function getStoredPages() {
  if (!Array.isArray(state.cachedBios)) return [];
  return state.cachedBios.filter(page => page &&
    page.slug !== 'hgrgferf' &&
    page.slug !== 'john' &&
    page.slug !== 'sample' &&
    !(page.slug && page.slug.toLowerCase().includes('hgrgferf')) &&
    !(page.url && page.url.includes('hgrgferf')) &&
    !(page.title && page.title.toLowerCase() === 'john' && (page.views || 0) === 0)
  );
}

export async function deletePage(slug) {
  if (!slug) return;
  if (!confirm('Are you sure you want to delete this Bio Page?')) return;
  try {
    const token = getAuthToken();
    if (!token) {
      handleUnauthorizedSession();
      return;
    }
    const res = await fetch('/api/bios/' + encodeURIComponent(slug), {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) {
      handleUnauthorizedSession();
      return;
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      toast(errData.error || 'Failed to delete bio page');
      return;
    }
    state.cachedBios = state.cachedBios.filter(p => p && p.slug !== slug);
    toast('Page deleted successfully');
    const pane = document.getElementById('appMainPane');
    if (pane) renderPages(pane, 'list');
  } catch (e) {
    console.error(e);
    toast('Unable to delete bio page');
  }
}

export async function deleteQr(id, slug) {
  if (!id && !slug) return;
  if (!confirm('Are you sure you want to delete this QR Code?')) return;
  try {
    const token = getAuthToken();
    if (token && id) {
      await fetch('/api/qrs/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      }).catch(() => {});
    }
    if (token && slug) {
      await fetch('/api/links/' + encodeURIComponent(slug), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      }).catch(() => {});
    }
    state.cachedLinks = state.cachedLinks.filter(l => l.id !== id && l._id !== id && l.slug !== slug);
    toast('QR Code deleted successfully');
    const pane = document.getElementById('appMainPane');
    if (pane) renderQr(pane);
  } catch (e) {
    console.error(e);
  }
}

export function renderProLockScreen(container, featureName, featureDescription) {

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


// ========================================================
// 3D DEPTH MOTION CONTROLLER & SCROLL SYSTEM (60fps, GPU Accelerated)
// ========================================================
export function initDashboard3DMotion() {
  const pane = document.getElementById('appMainPane');
  if (!pane) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;

  // 1. Sticky Condensed Header on Scroll & Parallax Orbs
  const header = pane.querySelector('.view-header');
  const ambientOrbs = document.querySelector('.dashboard-ambient-orbs');

  const onScroll = () => {
    const st = pane.scrollTop;

    // Header blur & condense
    if (header) {
      if (st > 18) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    // Parallax on ambient background orbs (GPU translate)
    if (ambientOrbs && !prefersReducedMotion && !isTouchDevice) {
      const orb1 = ambientOrbs.querySelector('.orb-1');
      const orb2 = ambientOrbs.querySelector('.orb-2');
      const orb3 = ambientOrbs.querySelector('.orb-3');
      if (orb1) orb1.style.transform = 'translate3d(0, ' + (st * -0.09) + 'px, 0)';
      if (orb2) orb2.style.transform = 'translate3d(0, ' + (st * 0.07) + 'px, 0)';
      if (orb3) orb3.style.transform = 'translate3d(0, ' + (st * -0.04) + 'px, 0)';
    }
  };

  if (pane._motionScrollHandler) {
    pane.removeEventListener('scroll', pane._motionScrollHandler);
  }
  pane._motionScrollHandler = onScroll;
  pane.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. 3D Card Scroll Entrance (Staggered rotateX + translateZ)
  const cardSelectors = [
    '.bento-card',
    '.bento-welcome-hero',
    '.bento-calendar-card',
    '.bento-stat-card',
    '.bento-recent-card',
    '.bento-activity-card',
    '.dash-white-card',
    '.home-create-card',
    '.qr-card-item',
    '.page-row-card',
    '.campaigns-hero-wrap',
    '.integration-card-white',
    '.analytics-metric-box',
    '.stat-tile',
    '.links-list-item'
  ].join(', ');

  const cards = Array.from(pane.querySelectorAll(cardSelectors));

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: pane, threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    cards.forEach((c) => {
      c.classList.remove('card-3d-reveal');
      c.classList.add('is-revealed');
    });
  } else {
    cards.forEach((c) => c.classList.add('is-revealed'));
  }

  // 3. Hover Tilt with Cursor Glare (Desktop only)
  if (!isTouchDevice && !prefersReducedMotion) {
    cards.forEach((card) => {
      if (!card.querySelector('.card-glare')) {
        const glare = document.createElement('div');
        glare.className = 'card-glare';
        card.appendChild(glare);
      }

      card.classList.add('card-3d-tilt');

      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion) return;

      card.onmousemove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -6;
        const ry = ((x - cx) / cx) * 6;

        card.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
        card.style.setProperty('--mouse-x', ((x / rect.width) * 100).toFixed(1) + '%');
        card.style.setProperty('--mouse-y', ((y / rect.height) * 100).toFixed(1) + '%');
      };

      card.onmouseleave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      };
    });
  }

  
  // Animate Vertical Bar Gauges on Scroll into view
  const gaugeBars = pane.querySelectorAll('.stat-gauge-bar');
  if (gaugeBars.length > 0 && !prefersReducedMotion) {
    setTimeout(() => {
      gaugeBars.forEach((bar) => {
        const targetH = bar.style.getPropertyValue('--gauge-height') || '60%';
        bar.style.height = targetH;
      });
    }, 200);
  }

  // 4. Count-up Numbers for Stats & Analytics
  const numElements = Array.from(pane.querySelectorAll('.count-up, [data-count-up]'));
  if (numElements.length > 0 && !prefersReducedMotion) {
    numElements.forEach((el) => {
      const raw = el.dataset.countUp || el.textContent.trim().replace(/[^0-9.]/g, '');
      const target = parseFloat(raw);
      if (isNaN(target) || target <= 0) return;

      const duration = 850;
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(easeProgress * target);
        el.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          el.textContent = target.toLocaleString();
        }
      };

      requestAnimationFrame(updateCount);
    });
  }

  // 5. Enhance Empty States with Floating 3D Elements
  const emptyCards = pane.querySelectorAll('.dash-white-card');
  emptyCards.forEach((box) => {
    const qrScanBox = box.querySelector('div[style*="rgba(56,189,248"]');
    if (qrScanBox && !box.querySelector('.empty-state-shadow')) {
      box.classList.add('empty-state-container');
      qrScanBox.classList.add('empty-state-floating-card');
      const shadow = document.createElement('div');
      shadow.className = 'empty-state-shadow';
      qrScanBox.parentNode.insertBefore(shadow, qrScanBox.nextSibling);
    }
  });
}



export function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  if (num === 0) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 1000) return sign + String(Math.round(num));
  if (abs < 1000000) return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (abs < 1000000000) return `${sign}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  return `${sign}${(abs / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
}

export function formatWithCommas(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-US');
}

export function formatTrend(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '—';
  const num = Number(pct);
  if (num === 0) return '0%';
  if (num > 0) return `↑ +${num}%`;
  return `↓ ${num}%`;
}

export function openWhatModal() {

  const modal = $('#whatModal');

  if (modal) modal.hidden = false;

}

export function closeWhatModal() {

  const modal = $('#whatModal');

  if (modal) modal.hidden = true;

}

export function toast(msg) {

  const t = document.querySelector('#toast'); if (t) { t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400); }

  else alert(msg);

}

export function copy(t) {

  if (navigator.clipboard) {

    navigator.clipboard.writeText(t).then(() => toast('Copied: ' + t));

  } else {

    toast('Copied: ' + t);

  }

}

export async function updateDisplayName() {

  const n = $('#setDisplayName')?.value.trim();

  if (n) {

    const token = getAuthToken();
    if (!token) {
      handleUnauthorizedSession();
      return;
    }

    try {

      const res = await fetch('/api/auth/update-profile', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },

        body: JSON.stringify({ name: n })

      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Failed to update display name');
        return;
      }

      state.appUser.name = n;

      const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
      const cur = raw ? JSON.parse(raw) : {};
      const updatedSession = { ...cur, name: n, email: state.appUser.email, isVerified: true, token };
      localStorage.setItem('hea_session', JSON.stringify(updatedSession));
      sessionStorage.setItem('hea_session', JSON.stringify(updatedSession));

      const sName = $('#sidebarUserName');

      if (sName) sName.textContent = n;

      const topAv = $('#topbarAvatar');

      if (topAv) topAv.textContent = n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'HA';

      toast('Display name updated: ' + n);

    } catch (e) {
      toast('Unable to reach server to update display name');
    }

  }

}

export async function deleteLink(id, slug) {

  state.cachedLinks = state.cachedLinks.filter(l => l.id !== id && l._id !== id && l.slug !== slug);

  // Call backend API

  try {

    const token = getAuthToken();

    if (token && slug) {

      await fetch('/api/links/' + encodeURIComponent(slug), {

        method: 'DELETE',

        headers: { 'Authorization': 'Bearer ' + token }

      });

    }

  } catch (e) {}

  toast('Link deleted from database');

  navigate('links');

}

export function exportAnalyticsCSV() {

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



export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setProStatus(planName = 'Core PRO') {

  state.appUser.isPro = true;

  state.appUser.plan = planName;

  try {

    const s = JSON.parse(localStorage.getItem('hea_session') || '{}');

    s.isPro = true;

    s.plan = planName;

    localStorage.setItem('hea_session', JSON.stringify(s));

  } catch (e) {}

  const orgEl = $('#sidebarOrgName');

  if (orgEl) {

    orgEl.innerHTML = `${(state.appUser.name || 'User').split(' ')[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO 👑</span>`;

  }

  $$('.topbar-upgrade-btn').forEach(b => {

    b.innerHTML = '👑 PRO Active';

    b.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';

  });

  renderActiveView();

}
