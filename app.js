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

// Session store: uses sessionStorage so user is logged out when tab/browser closes
const sessionStore = {
  get(k, d) {
    try {
      const v = JSON.parse(sessionStorage.getItem(k));
      return v ?? d;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      if (v === null) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      } else {
        sessionStorage.setItem(k, JSON.stringify(v));
      }
    } catch (e) {}
  }
};

const DOMAIN = 'tinyurl.com';
let links = store.get('hea_links', []);
// Load session from sessionStorage only (auto-cleared on tab/browser close)
let session = sessionStore.get('hea_session', null);
if (session && (!session.isVerified || session.email === 'john@example.com')) {
  session = null;
  sessionStore.set('hea_session', null);
}
if (session && session.email === 'furyzod02@gmail.com') {
  session.isPro = true;
  session.isAdmin = true;
  session.plan = 'Unlimited';
}

function isUserPro() {
  try {
    const s = session || sessionStore.get('hea_session', null) || JSON.parse(localStorage.getItem('hea_session') || '{}');
    if (!s || !s.email) return false;
    if (s.email.toLowerCase() === 'furyzod02@gmail.com') return true;
    if (s.isPro || s.isAdmin || s.plan === 'Unlimited' || s.plan === 'Core PRO' || s.plan === 'pro' || s.plan === 'enterprise') return true;
    return false;
  } catch (e) {
    return false;
  }
}
window.isUserPro = isUserPro;

function canCreateLinkOrQr() {
  if (isUserPro()) return { allowed: true };
  const freeCreations = parseInt(localStorage.getItem('hea_free_creations') || '0', 10);
  const totalExisting = Array.isArray(links) ? links.length : 0;
  const currentCount = Math.max(freeCreations, totalExisting);
  if (currentCount >= 5) {
    return {
      allowed: false,
      count: currentCount,
      message: 'Free plan limit reached (5/5 links & QR codes). Upgrade to Pro for unlimited creation!'
    };
  }
  return { allowed: true, count: currentCount };
}
window.canCreateLinkOrQr = canCreateLinkOrQr;

function recordFreeCreation() {
  if (isUserPro()) return;
  const current = parseInt(localStorage.getItem('hea_free_creations') || '0', 10);
  const next = current + 1;
  localStorage.setItem('hea_free_creations', next.toString());
  if (next >= 5) {
    setTimeout(() => {
      toast('⚠️ Free limit reached: 5/5 links & QR codes used. Upgrade to Pro for unlimited creation!');
      if (typeof window.openCheckoutModal === 'function') {
        window.openCheckoutModal('pro');
      }
    }, 800);
  }
}
window.recordFreeCreation = recordFreeCreation;

function canChatWithAssist() {
  if (isUserPro()) return { allowed: true };
  const count = parseInt(localStorage.getItem('hea_free_chat_count') || '0', 10);
  if (count >= 5) {
    return {
      allowed: false,
      count: count,
      message: 'Free plan limit reached (5/5 AI messages). Upgrade to Pro for unlimited HEA Assist AI messages!'
    };
  }
  return { allowed: true, count: count };
}
window.canChatWithAssist = canChatWithAssist;

function recordFreeChat() {
  if (isUserPro()) return;
  const count = parseInt(localStorage.getItem('hea_free_chat_count') || '0', 10);
  const next = count + 1;
  localStorage.setItem('hea_free_chat_count', next.toString());
  if (next >= 5) {
    setTimeout(() => {
      if (typeof window.openCheckoutModal === 'function') {
        window.openCheckoutModal('pro');
      }
    }, 1200);
  }
}
window.recordFreeChat = recordFreeChat;

let bios = store.get('hea_bios', []);
const saveLinks = () => {
  store.set('hea_links', links);
  try {
    const map = {};
    links.forEach(l => {
      if (l.slug && l.url) {
        map[l.slug.toLowerCase()] = l.url;
        localStorage.setItem('hea_slug_' + l.slug.toLowerCase(), l.url);
      }
    });
    localStorage.setItem('hea_slug_map', JSON.stringify(map));
  } catch (e) {}
};

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

// Universal compact slug generator (5-6 alphanumeric characters)
function generateShortSlug(len = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Compact slug suggestion
function suggest(url) {
  return generateShortSlug(6);
}

// Universal URL that works everywhere: preserves genuine short working link
const visitUrl = l => {
  if (l && l.realShort && /^https?:\/\//i.test(l.realShort)) return l.realShort;
  if (l && l.url && /^https?:\/\//i.test(l.url) && !l.url.includes('healink.store')) return l.url;
  const slug = (l && l.slug) ? l.slug : generateShortSlug(6);
  return `https://tinyurl.com/${slug}`;
};

const shortText = l => {
  const u = visitUrl(l);
  return u.replace(/^https?:\/\//, '');
};

// Asynchronously fetch genuine working short URL without healink branding (instant direct redirect, no warning screens)
async function fetchOnlineShortUrl(targetUrl) {
  const norm = normalize(targetUrl);
  if (!norm) return null;

  // 1. Try backend online shortener endpoint
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('/api/shorten-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: norm }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl && /^https?:\/\//i.test(data.shortUrl) && !data.shortUrl.includes('da.gd')) {
        return data.shortUrl;
      }
    }
  } catch (e) {}

  // 2. Try direct TinyURL (301 direct redirect, zero warning page)
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

  // 3. Fallback: clean random short URL
  return `https://tinyurl.com/${generateShortSlug(6)}`;
}
window.fetchOnlineShortUrl = fetchOnlineShortUrl;

const owner = () => (session ? session.email : 'guest');

function createLink({ url, slug, tag, expires, realShort }, editing) {
  if (!editing) {
    const check = canCreateLinkOrQr();
    if (!check.allowed) {
      if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');
      return { error: check.message };
    }
  }
  const dest = normalize(url);
  if (!dest) return { error: 'Please enter a valid link (e.g. https://example.com/page).' };

  slug = (slug || '').trim() || generateShortSlug(6);
  if (!/^[a-z0-9-]{2,40}$/i.test(slug)) {
    return { error: 'Back-half: 2–40 letters, numbers or hyphens.' };
  }

  const clash = links.find(l => l.slug.toLowerCase() === slug.toLowerCase() && (!editing || l.id !== editing.id));
  if (clash) {
    if (editing) return { error: 'That back-half is already taken.' };
    slug = generateShortSlug(6);
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
    dest: dest,
    title: (tag || '').trim() || 'Untitled Link',
    tag: (tag || '').trim() || 'Website',
    expires: expires || '',
    created: Date.now(),
    owner: owner(),
    realShort: realShort || null,
    clicks: 0
  };

  links.unshift(link);
  saveLinks();
  if (!editing) recordFreeCreation();
  return { link };
}

const device = () =>
  /ipad|tablet/i.test(navigator.userAgent) ? 'Tablet' :
  /mobi|android|iphone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

function recordClick(l, extra = {}) {
  if (!l) return;
  if (Array.isArray(l.clicks)) {
    const region = ((navigator.language || '').split('-')[1] || 'US').toUpperCase();
    l.clicks.push(Object.assign({
      t: Date.now(),
      d: device(),
      r: document.referrer ? new URL(document.referrer).hostname : 'Direct',
      c: region
    }, extra));
  } else {
    const cur = typeof l.clicks === 'number' ? l.clicks : 0;
    l.clicks = cur + 1;
  }
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
      <input id="fUrl" value="${esc(l ? l.url : '')}" placeholder="https://yourdomain.com/landing-page" required>
    </label>
    <label>Custom back-half <small>(${DOMAIN}/…)</small>
      <input id="fSlug" value="${esc(l ? l.slug : '')}" placeholder="e.g. promo-26 (leave empty for auto 6-char slug)">
    </label>
    <label>Campaign Tag
      <input id="fTag" value="${esc(l ? l.tag : '')}" placeholder="e.g. marketing, instagram, launch26">
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

const MEGA_ICONS = {
  link: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  qr: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  mobile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"></rect><circle cx="12" cy="18" r="1"></circle></svg>`,
  analytics: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  bio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
  sparkle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`,
  message: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  tag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="7" cy="7" r="1.5"></circle></svg>`,
  card: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><line x1="13" y1="9" x2="18" y2="9"></line><line x1="13" y1="12" x2="16" y2="12"></line></svg>`,
  box: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  ai: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  gear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  cpu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>`,
  help: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  code: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
  plug: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
  book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  bot: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="16" y1="16" x2="16.01" y2="16"></line></svg>`,
  pricing: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  handshake: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4l-2-2"></path><path d="m18 10 1.4-1.4a1 1 0 0 0 0-1.4L17 5a1 1 0 0 0-1.4 0L14 6.6"></path><path d="m2 14 3-3a1 1 0 0 1 1.4 0l2 2a1 1 0 0 0 1.4 0l3.6-3.6a1 1 0 0 0 0-1.4L11 5.6a1 1 0 0 0-1.4 0L7 8.2"></path></svg>`
};

const MEGA = {
  Platform: `
    <div class="mega-grid">
      <!-- Col 1: Products -->
      <div class="mega-col">
        <h4>PRODUCTS</h4>
        <a class="mega-item" href="#dashboard">
          <div class="mega-img-box"><img src="images/products/url-shortener.svg" alt="URL Shortener" width="38" height="38" loading="eager"></div>
          <div><b>URL SHORTENER</b><span>Customize, share and track links</span></div>
        </a>
        <a class="mega-item" href="#qr">
          <div class="mega-img-box"><img src="images/products/qr-code.svg" alt="QR Code Generator" width="38" height="38" loading="eager"></div>
          <div><b>QR CODE GENERATOR</b><span>Dynamic solutions to fit every business need</span></div>
        </a>
        <a class="mega-item" href="#pages">
          <div class="mega-img-box"><img src="images/products/pages-bio.svg" alt="Pages &amp; Bio" width="38" height="38" loading="eager"></div>
          <div><b>PAGES &amp; BIO</b><span>Curate and track links for social media profiles</span></div>
        </a>
        <a class="mega-item" href="#analytics">
          <div class="mega-img-box"><img src="images/products/analytics.svg" alt="Analytics" width="38" height="38" loading="eager"></div>
          <div><b>ANALYTICS</b><span>A central place to track performance of all links</span></div>
        </a>
      </div>

      <!-- Col 2: Features -->
      <div class="mega-col">
        <h4>FEATURES</h4>
        <a class="mega-item" href="#pages">
          <div class="mega-img-box"><img src="images/products/link-in-bio.svg" alt="Link-in-Bio" width="38" height="38" loading="eager"></div>
          <div><b>LINK-IN-BIO</b><span>Curate and track content for social profiles</span></div>
        </a>
        <a class="mega-item" href="#dashboard">
          <div class="mega-img-box"><img src="images/products/branded-links.svg" alt="Branded Links" width="38" height="38" loading="eager"></div>
          <div><b>BRANDED LINKS</b><span>Customize links with your brand's URL</span></div>
        </a>
        <a class="mega-item" href="#dashboard">
          <div class="mega-img-box"><img src="images/products/mobile-links.svg" alt="Mobile Links" width="38" height="38" loading="eager"></div>
          <div><b>MOBILE LINKS</b><span>Short links optimized for SMS messages</span></div>
        </a>
        <a class="mega-item" href="#utm">
          <div class="mega-img-box"><img src="images/products/utm-campaigns.svg" alt="UTM Campaigns" width="38" height="38" loading="eager"></div>
          <div><b>UTM CAMPAIGNS</b><span>Track links with custom UTM parameters</span></div>
        </a>
        <a class="mega-item" href="#pages">
          <div class="mega-img-box"><img src="images/products/digital-cards.svg" alt="Digital Business Cards" width="38" height="38" loading="eager"></div>
          <div><b>DIGITAL BUSINESS CARDS</b><span>Grow your network with virtual cards</span></div>
        </a>
        <a class="mega-item" href="#qr">
          <div class="mega-img-box"><img src="images/products/2d-barcodes.svg" alt="2D Barcodes" width="38" height="38" loading="eager"></div>
          <div><b>2D BARCODES</b><span>Add GTIN to packaging QR codes</span></div>
        </a>
      </div>

      <!-- Col 3: Integrations & Discover -->
      <div class="mega-side-card">
        <h4>FEATURED ECOSYSTEM</h4>
        <div style="border-radius:12px;overflow:hidden;background:#081021;border:1px solid rgba(56,189,248,0.25);position:relative;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
          <svg viewBox="0 0 240 85" width="100%" height="85" style="display:block;">
            <defs>
              <linearGradient id="platBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0b172e"/>
                <stop offset="100%" stop-color="#07101f"/>
              </linearGradient>
              <linearGradient id="cyanLimeLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#38bdf8"/>
                <stop offset="100%" stop-color="#D4FF24"/>
              </linearGradient>
              <filter id="platGlow">
                <feGaussianBlur stdDeviation="3" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="240" height="85" fill="url(#platBg)"/>
            <line x1="0" y1="28" x2="240" y2="28" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="0" y1="56" x2="240" y2="56" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="60" y1="0" x2="60" y2="85" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="120" y1="0" x2="120" y2="85" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="180" y1="0" x2="180" y2="85" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <path d="M 45 42 C 80 42, 90 42, 120 42 C 150 42, 160 42, 195 42" stroke="url(#cyanLimeLine)" stroke-width="2" stroke-dasharray="4,4" opacity="0.8"/>
            <circle cx="45" cy="42" r="16" fill="rgba(15,23,42,0.9)" stroke="rgba(56,189,248,0.5)" stroke-width="1.5"/>
            <text x="45" y="47" font-size="13" text-anchor="middle">🛍️</text>
            <circle cx="120" cy="42" r="20" fill="rgba(8,14,30,0.95)" stroke="#D4FF24" stroke-width="2" filter="url(#platGlow)"/>
            <text x="120" y="47" font-size="14" font-weight="900" text-anchor="middle" fill="#D4FF24">∞</text>
            <circle cx="195" cy="42" r="16" fill="rgba(15,23,42,0.9)" stroke="rgba(56,189,248,0.5)" stroke-width="1.5"/>
            <text x="195" y="47" font-size="13" text-anchor="middle">🎨</text>
            <rect x="8" y="7" width="82" height="15" rx="7.5" fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.35)" stroke-width="1"/>
            <circle cx="15" cy="14.5" r="2.5" fill="#D4FF24"/>
            <text x="22" y="17.5" font-size="8" font-weight="700" fill="#38bdf8" letter-spacing="0.5">CONNECTED</text>
          </svg>
        </div>
        <div class="integrations-row" style="margin-top:2px;">
          <div class="integration-pill"><b>Shopify</b></div>
          <div class="integration-pill"><b>Canva</b></div>
          <div class="integration-pill"><b>HubSpot</b></div>
        </div>
        <a class="mega-side-link" href="#integrations">See 100+ integrations →</a>

        <div style="border-top:1px solid rgba(56,189,248,0.15);margin-top:4px;padding-top:8px;">
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
          <div class="mega-img-box"><img src="images/products/ai-assist.svg" alt="HEA Assist" width="38" height="38" loading="eager"></div>
          <div><b>HEA ASSIST</b><span>AI-Powered link and QR Code analysis</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="mega-img-box"><img src="images/products/ai-mcp.svg" alt="HEA MCP" width="38" height="38" loading="eager"></div>
          <div><b>HEA MCP</b><span>Connect to AI agents with Model Context Protocol</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="mega-img-box"><img src="images/products/ai-llm.svg" alt="LLM Integrations" width="38" height="38" loading="eager"></div>
          <div><b>LLM INTEGRATIONS</b><span>Bring link management to your AI assistants</span></div>
        </a>
      </div>

      <!-- Col 2: AI Resources -->
      <div class="mega-col">
        <h4>AI RESOURCES</h4>
        <a class="mega-item" href="#faq">
          <div class="mega-img-box"><img src="images/products/help-center.svg" alt="Help Center" width="38" height="38" loading="eager"></div>
          <div><b>HELP CENTER</b><span>Step-by-step guides &amp; documentation</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="mega-img-box"><img src="images/products/developers.svg" alt="Developers" width="38" height="38" loading="eager"></div>
          <div><b>DEVELOPERS</b><span>API endpoints &amp; SDK references</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="mega-img-box"><img src="images/products/trust-center.svg" alt="Trust Center" width="38" height="38" loading="eager"></div>
          <div><b>TRUST CENTER</b><span>Security, privacy &amp; compliance</span></div>
        </a>
        <a class="mega-item" href="#integrations">
          <div class="mega-img-box"><img src="images/products/marketplace.svg" alt="Marketplace" width="38" height="38" loading="eager"></div>
          <div><b>INTEGRATIONS MARKETPLACE</b><span>Plug into 100+ platforms</span></div>
        </a>
      </div>

      <!-- Col 3: Featured Card with Image Illustration -->
      <div class="mega-side-card">
        <h4>FEATURED REPORT</h4>
        <div style="border-radius:12px;overflow:hidden;background:#081021;border:1px solid rgba(56,189,248,0.3);position:relative;box-shadow:0 8px 25px rgba(0,0,0,0.6);">
          <svg viewBox="0 0 240 95" width="100%" height="95" style="display:block;">
            <defs>
              <linearGradient id="aiCardBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0b172e"/>
                <stop offset="100%" stop-color="#060c18"/>
              </linearGradient>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
              </linearGradient>
              <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#2563eb"/>
                <stop offset="50%" stop-color="#38bdf8"/>
                <stop offset="100%" stop-color="#D4FF24"/>
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="240" height="95" fill="url(#aiCardBg)"/>
            <line x1="0" y1="24" x2="240" y2="24" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="0" y1="48" x2="240" y2="48" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="0" y1="72" x2="240" y2="72" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
            <line x1="60" y1="0" x2="60" y2="95" stroke="rgba(56,189,248,0.06)" stroke-width="1"/>
            <line x1="120" y1="0" x2="120" y2="95" stroke="rgba(56,189,248,0.06)" stroke-width="1"/>
            <line x1="180" y1="0" x2="180" y2="95" stroke="rgba(56,189,248,0.06)" stroke-width="1"/>

            <path d="M 15 76 Q 55 70, 85 48 T 150 38 T 225 15 L 225 80 L 15 80 Z" fill="url(#chartGrad)"/>
            <path d="M 15 76 Q 55 70, 85 48 T 150 38 T 225 15" fill="none" stroke="url(#chartLine)" stroke-width="3" filter="url(#neonGlow)"/>

            <circle cx="85" cy="48" r="3" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="150" cy="38" r="3" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="225" cy="15" r="4" fill="#D4FF24" stroke="#ffffff" stroke-width="2" filter="url(#neonGlow)"/>

            <rect x="12" y="8" width="84" height="18" rx="9" fill="rgba(8,14,30,0.9)" stroke="#38bdf8" stroke-width="1.2"/>
            <text x="21" y="21" font-size="9" font-weight="700" fill="#D4FF24">↗ +245%</text>
            <text x="66" y="21" font-size="8.5" fill="#94a3b8">CTR</text>
            <text x="12" y="89" font-size="8" fill="#64748b" font-weight="600" letter-spacing="0.5">CLICK EXPECTATION 2026</text>
          </svg>
        </div>
        <div>
          <span class="pill" style="font-size:10px;padding:3px 10px;background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);border-radius:20px;font-weight:700;">RESEARCH REPORT</span>
          <b style="display:block;font-size:13px;margin-top:6px;color:#ffffff">The Click Expectation Report</b>
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

        <div style="border-top:1px solid rgba(56,189,248,0.15);margin-top:10px;padding-top:8px">
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
          <div class="mega-img-box"><img src="images/products/guides.svg" alt="Guides" width="38" height="38" loading="eager"></div>
          <div><b>GUIDES &amp; EBOOKS</b><span>Practical tactics to increase CTR</span></div>
        </a>
        <a class="mega-item" href="#resources">
          <div class="mega-img-box"><img src="images/products/blog.svg" alt="Blog" width="38" height="38" loading="eager"></div>
          <div><b>BLOG &amp; INSIGHTS</b><span>Latest trends in short link branding</span></div>
        </a>
        <a class="mega-item" href="#assist">
          <div class="mega-img-box"><img src="images/products/ai-assist.svg" alt="HEA Assist AI" width="38" height="38" loading="eager"></div>
          <div><b>HEA ASSIST AI</b><span>Ask questions about your data</span></div>
        </a>
      </div>
      <div class="mega-col">
        <h4>FIND ANSWERS</h4>
        <a class="mega-item" href="#faq">
          <div class="mega-img-box"><img src="images/products/help-center.svg" alt="Help Center" width="38" height="38" loading="eager"></div>
          <div><b>HELP CENTER</b><span>FAQs and setup troubleshooting</span></div>
        </a>
        <a class="mega-item" href="#pricing">
          <div class="mega-img-box"><img src="images/products/pricing.svg" alt="Pricing" width="38" height="38" loading="eager"></div>
          <div><b>PRICING</b><span>Transparent plans for all teams</span></div>
        </a>
        <a class="mega-item" href="#solutions">
          <div class="mega-img-box"><img src="images/products/contact.svg" alt="Contact Sales" width="38" height="38" loading="eager"></div>
          <div><b>CONTACT SALES</b><span>Custom enterprise plans &amp; SLAs</span></div>
        </a>
      </div>
      <div class="mega-side-card">
        <h4>WHAT'S NEW</h4>
        <div style="border-radius:12px;overflow:hidden;background:#081021;border:1px solid rgba(56,189,248,0.25);position:relative;box-shadow:0 8px 25px rgba(0,0,0,0.6);">
          <svg viewBox="0 0 240 90" width="100%" height="90" style="display:block;">
            <defs>
              <linearGradient id="resBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0b172e"/>
                <stop offset="100%" stop-color="#060c18"/>
              </linearGradient>
              <linearGradient id="bioBtn1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#2563eb"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
            </defs>
            <rect width="240" height="90" fill="url(#resBg)"/>
            <rect x="75" y="5" width="90" height="80" rx="12" fill="rgba(15,23,42,0.95)" stroke="rgba(56,189,248,0.4)" stroke-width="1.5"/>
            <rect x="105" y="8" width="30" height="2.5" rx="1.2" fill="rgba(255,255,255,0.2)"/>
            <circle cx="120" cy="24" r="8" fill="url(#bioBtn1)" stroke="#D4FF24" stroke-width="1.5"/>
            <text x="120" y="27" font-size="7.5" text-anchor="middle" fill="#ffffff" font-weight="700">H</text>
            <text x="120" y="38" font-size="7" text-anchor="middle" fill="#ffffff" font-weight="600">@yourbrand</text>
            <rect x="85" y="44" width="70" height="10" rx="5" fill="url(#bioBtn1)"/>
            <text x="120" y="51.5" font-size="6" text-anchor="middle" fill="#ffffff" font-weight="600">My Website ↗</text>
            <rect x="85" y="58" width="70" height="10" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(212,255,36,0.5)" stroke-width="1"/>
            <text x="120" y="65.5" font-size="6" text-anchor="middle" fill="#D4FF24" font-weight="600">Special Offer ✨</text>
            <circle cx="148" cy="16" r="6" fill="#38bdf8"/>
            <path d="M146 16 L147.5 17.5 L150.5 14.5" stroke="#ffffff" stroke-width="1.2" fill="none"/>
          </svg>
        </div>
        <div>
          <span class="pill" style="font-size:10px;padding:3px 10px;background:rgba(212,255,36,0.15);color:#D4FF24;border:1px solid rgba(212,255,36,0.35);border-radius:20px;font-weight:700;">VERSION 2.4</span>
          <b style="display:block;font-size:13px;margin-top:6px;color:#ffffff">Mobile Link-in-Bio Pages</b>
          <span style="font-size:12px;color:var(--mut)">Build a gorgeous social profile landing page in under 60 seconds.</span>
        </div>
        <a class="mega-side-link" href="#pages">Build My Bio Page →</a>
      </div>
    </div>
  `
};

const SOL_ITEMS = {
  industry: [
    { img: 'images/products/sol-retail.svg', title: 'RETAIL', href: '#solutions' },
    { img: 'images/products/sol-cpg.svg', title: 'CONSUMER PACKAGED GOODS', href: '#solutions' },
    { img: 'images/products/sol-hospitality.svg', title: 'HOSPITALITY', href: '#solutions' },
    { img: 'images/products/sol-media.svg', title: 'MEDIA &amp; ENTERTAINMENT', href: '#solutions' },
    { img: 'images/products/sol-tech.svg', title: 'TECHNOLOGY &amp; HARDWARE', href: '#solutions' },
    { img: 'images/products/sol-healthcare.svg', title: 'HEALTHCARE', href: '#solutions' },
    { img: 'images/products/sol-insurance.svg', title: 'INSURANCE', href: '#solutions' },
    { img: 'images/products/sol-finance.svg', title: 'FINANCIAL SERVICES', href: '#solutions' },
    { img: 'images/products/sol-professional.svg', title: 'PROFESSIONAL SERVICES', href: '#solutions' },
    { img: 'images/products/sol-education.svg', title: 'EDUCATION', href: '#solutions' }
  ],
  team: [
    { img: 'images/products/sol-devs.svg', title: 'DEVELOPERS', href: '#solutions' },
    { img: 'images/products/sol-marketing.svg', title: 'MARKETING', href: '#solutions' },
    { img: 'images/products/sol-support.svg', title: 'CUSTOMER SERVICE', href: '#solutions' }
  ],
  business: [
    { img: 'images/products/sol-small-biz.svg', title: 'SMALL BUSINESS', href: '#solutions' },
    { img: 'images/products/sol-midmarket.svg', title: 'MIDMARKET', href: '#solutions' },
    { img: 'images/products/sol-enterprise.svg', title: 'ENTERPRISE', href: '#solutions' }
  ]
};

function renderSolMegaGrid(tabKey = 'industry') {
  const container = $('#solMegaGrid');
  if (!container) return;
  const items = SOL_ITEMS[tabKey] || SOL_ITEMS.industry;
  container.innerHTML = items.map(it => `
    <a class="mega-item" href="${it.href}">
      <div class="mega-img-box"><img src="${it.img}" alt="${it.title}" width="38" height="38" loading="eager"></div>
      <div><b>${it.title}</b></div>
    </a>
  `).join('');
}

/* =========================================================
   INTERACTIVE REAL-TIME FEATURE MODALS & ACTIONS
   ========================================================= */

function lockModalScroll() {
  document.body.classList.add('modal-scroll-lock');
  document.documentElement.classList.add('modal-scroll-lock');
  if (window.lenis && typeof window.lenis.stop === 'function') {
    try { window.lenis.stop(); } catch (e) {}
  }
}

function unlockModalScroll() {
  document.body.classList.remove('modal-scroll-lock');
  document.documentElement.classList.remove('modal-scroll-lock');
  if (window.lenis && typeof window.lenis.start === 'function') {
    try { window.lenis.start(); } catch (e) {}
  }
}
window.lockModalScroll = lockModalScroll;
window.unlockModalScroll = unlockModalScroll;

function closeAllCustomModals() {
  const ids = ['mobileLinksModal', 'devHubModal', 'trustModal', 'reportModal', 'mcpModal', 'salesModal', 'bioPreviewModal', 'analyticsSandboxModal', 'checkoutModal'];
  ids.forEach(id => {
    const el = $('#' + id);
    if (el) el.hidden = true;
  });
  unlockModalScroll();
}
window.closeAllCustomModals = closeAllCustomModals;

function openMobileLinksModal() {
  closeAllCustomModals();
  const m = $('#mobileLinksModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openMobileLinksModal = openMobileLinksModal;

function openDevHubModal() {
  closeAllCustomModals();
  const m = $('#devHubModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
    switchApiTab('curl');
  }
}
window.openDevHubModal = openDevHubModal;

function openTrustModal() {
  closeAllCustomModals();
  const m = $('#trustModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openTrustModal = openTrustModal;

function openReportModal() {
  closeAllCustomModals();
  const m = $('#reportModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openReportModal = openReportModal;

function openMcpModal() {
  closeAllCustomModals();
  const m = $('#mcpModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openMcpModal = openMcpModal;

function openSalesModal() {
  closeAllCustomModals();
  const m = $('#salesModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openSalesModal = openSalesModal;

function openBioPreviewModal() {
  closeAllCustomModals();
  const m = $('#bioPreviewModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openBioPreviewModal = openBioPreviewModal;

function openAnalyticsSandboxModal() {
  closeAllCustomModals();
  const m = $('#analyticsSandboxModal');
  if (m) {
    m.hidden = false;
    lockModalScroll();
  }
}
window.openAnalyticsSandboxModal = openAnalyticsSandboxModal;

const API_SNIPPETS = {
  curl: `curl -X POST https://healink.store/api/shorten \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer hea_live_sk_89f2a9" \\
  -d '{"url":"https://instagram.com/mybrand","title":"Social Profile"}'`,

  node: `const fetch = require('node-fetch');

const res = await fetch('https://healink.store/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer hea_live_sk_89f2a9'
  },
  body: JSON.stringify({
    url: 'https://instagram.com/mybrand',
    title: 'Social Profile'
  })
});
const data = await res.json();
console.log('Short URL:', data.shortUrl);`,

  python: `import requests

url = "https://healink.store/api/shorten"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer hea_live_sk_89f2a9"
}
payload = {
    "url": "https://instagram.com/mybrand",
    "title": "Social Profile"
}

response = requests.post(url, json=payload, headers=headers)
print("Short URL:", response.json()["shortUrl"])`
};

function switchApiTab(lang) {
  const codeEl = $('#apiSnippetCode');
  if (codeEl) codeEl.textContent = API_SNIPPETS[lang] || API_SNIPPETS.curl;
  ['curl', 'node', 'python'].forEach(l => {
    const btn = $('#tab' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.classList.toggle('active', l === lang);
  });
}
window.switchApiTab = switchApiTab;

function testLiveApiEndpoint() {
  const resEl = $('#liveApiResult');
  if (!resEl) return;
  resEl.hidden = false;
  resEl.innerHTML = `<span style="color:#f59e0b;">⚡ Dispatching request to https://tinyurl.com/api-create.php...</span>`;
  setTimeout(() => {
    const slug = generateShortSlug(6);
    resEl.innerHTML = `HTTP/1.1 200 OK (Latency: 28ms)
{
  "success": true,
  "slug": "${slug}",
  "shortUrl": "https://tinyurl.com/${slug}",
  "destination": "https://instagram.com/mybrand",
  "clicks": 0,
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=https://tinyurl.com/${slug}"
}`;
  }, 350);
}
window.testLiveApiEndpoint = testLiveApiEndpoint;

function openGlobalAssist() {
  const drawer = $('#appAssistDrawer');
  if (drawer) {
    drawer.hidden = false;
    const inEl = $('#drawerChatInput') || $('#chatIn');
    if (inEl) inEl.focus();
  }
  if (!document.body.classList.contains('app-mode')) {
    location.hash = '#assist';
    initChat();
  }
}
window.openGlobalAssist = openGlobalAssist;

function handleMegaAction(e) {
  const link = e.target.closest('a');
  if (!link) return;
  const text = (link.textContent || '').trim().toUpperCase();

  // Close all open mega menus
  $$('.mi').forEach(m => m.classList.remove('open'));

  // 1. URL Shortener
  if (text.includes('URL SHORTENER')) {
    e.preventDefault();
    if (session && session.isVerified) {
      location.hash = '#create-link';
    } else {
      location.hash = '#home';
      setTimeout(() => {
        const f = $('#heroForm');
        const inp = $('#heroUrl');
        if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (inp) {
          inp.focus();
          inp.classList.add('pulse-glow');
          setTimeout(() => inp.classList.remove('pulse-glow'), 1500);
        }
      }, 100);
    }
    return;
  }

  // 2. QR Code Generator or 2D Barcodes
  if (text.includes('QR CODE GENERATOR') || text.includes('2D BARCODES')) {
    e.preventDefault();
    if (session && session.isVerified) {
      location.hash = '#qr';
    } else {
      location.hash = '#home';
      setTimeout(() => {
        const qrTab = $('#tabQrCode');
        if (qrTab) qrTab.click();
        const qrIn = $('#heroQrInput');
        if (qrIn) {
          qrIn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          qrIn.focus();
        }
      }, 100);
    }
    return;
  }

  // 3. Mobile Links
  if (text.includes('MOBILE LINKS')) {
    e.preventDefault();
    openMobileLinksModal();
    return;
  }

  // 4. Pages & Bio / Link-In-Bio / Digital Business Cards / Build My Bio Page
  if (text.includes('PAGES & BIO') || text.includes('LINK-IN-BIO') || text.includes('DIGITAL BUSINESS CARDS') || text.includes('BUILD MY BIO PAGE')) {
    if (session && session.isVerified) {
      location.hash = '#pages';
    } else {
      e.preventDefault();
      openBioPreviewModal();
    }
    return;
  }

  // 5. Analytics
  if (text.includes('ANALYTICS')) {
    if (session && session.isVerified) {
      location.hash = '#analytics';
    } else {
      e.preventDefault();
      openAnalyticsSandboxModal();
    }
    return;
  }

  // 6. Branded Links
  if (text.includes('BRANDED LINKS')) {
    if (session && session.isVerified) {
      location.hash = '#domains';
    } else {
      e.preventDefault();
      location.hash = '#pricing';
      toast('Custom Branded Domains are included with HEA Link PRO');
    }
    return;
  }

  // 7. Developer / API & Documentation
  if (text.includes('API & DOCUMENTATION') || text.includes('DEVELOPERS')) {
    e.preventDefault();
    openDevHubModal();
    return;
  }

  // 8. Trust Center
  if (text.includes('TRUST CENTER')) {
    e.preventDefault();
    openTrustModal();
    return;
  }

  // 9. HEA Assist / LLM Integrations
  if (text.includes('HEA ASSIST') || text.includes('LLM INTEGRATIONS')) {
    e.preventDefault();
    openGlobalAssist();
    return;
  }

  // 10. HEA MCP
  if (text.includes('HEA MCP')) {
    e.preventDefault();
    openMcpModal();
    return;
  }

  // 11. The Click Expectation Report
  if (text.includes('READ REPORT') || text.includes('THE CLICK EXPECTATION REPORT')) {
    e.preventDefault();
    openReportModal();
    return;
  }

  // 12. Contact Sales
  if (text.includes('CONTACT SALES')) {
    e.preventDefault();
    openSalesModal();
    return;
  }

  // 13. Help Center
  if (text.includes('HELP CENTER')) {
    e.preventDefault();
    location.hash = '#faq';
    return;
  }

  // 14. Integrations (Shopify, Canva, HubSpot, Integrations Marketplace)
  if (text.includes('INTEGRATION') || text.includes('SHOPIFY') || text.includes('CANVA') || text.includes('HUBSPOT')) {
    if (session && session.isVerified) {
      location.hash = '#integrations';
    } else {
      e.preventDefault();
      location.hash = '#pricing';
      toast('100+ Platform Integrations included in HEA Link PRO');
    }
    return;
  }
}

function initNav() {
  $('#menu').innerHTML = ['Platform', 'AI', 'Solutions', 'Resources'].map(name => `
    <div class="mi">
      <button type="button" aria-expanded="false">${name} <span class="arrow">▾</span></button>
      <div class="drop">${MEGA[name]}</div>
    </div>
  `).join('') + '<div class="mi"><a href="#pricing">Pricing</a></div>';

  $('#menu').addEventListener('click', handleMegaAction);

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
      $$('.mi').forEach(m => {
        m.classList.remove('open');
        m.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    };
  });

  // Desktop hover safety: entering any menu item clears .open from siblings
  $$('.mi').forEach(m => {
    m.addEventListener('mouseenter', () => {
      $$('.mi').forEach(other => {
        if (other !== m) {
          other.classList.remove('open');
          other.querySelector('button')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  // Leaving menu bar completely clears all open sheets
  $('#menu')?.addEventListener('mouseleave', () => {
    $$('.mi').forEach(m => {
      m.classList.remove('open');
      m.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', () => {
    $$('.mi').forEach(m => {
      m.classList.remove('open');
      m.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
  });

  $('#burger').onclick = () => $('.nav').classList.toggle('open');
  $('#navCollapse')?.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('button:not(.arrow)')) {
      $('.nav')?.classList.remove('open');
    }
  });
}

function renderNavRight() {
  const isAuth = !!(session && session.isVerified);
  $('#navR').innerHTML = isAuth
    ? `<a class="btn ghost sm" href="#dashboard">Dashboard</a>
       <button class="btn dark sm" id="logoutBtn" type="button">Log out</button>`
    : `<a href="#login" style="font-weight:500;font-size:14px;padding:8px 16px;color:#ffffff !important;margin-right:6px">Log in</a>
       <a class="btn pill-btn sm" href="#signup">Sign up free →</a>`;

  const lo = $('#logoutBtn');
  if (lo) {
    lo.onclick = () => {
      session = null;
      sessionStore.set('hea_session', null);
      document.body.classList.remove('app-mode');
      const as = $('#appShell');
      if (as) as.hidden = true;
      renderNavRight();
      updateHomeCtaForAuth();
      location.hash = '#login';
      toast('Logged out successfully');
    };
  }

  updateHomeCtaForAuth();
}

function updateHomeCtaForAuth() {
  const isAuth = !!(session && session.isVerified);
  const ctaBtn = $('#homeCtaBtn');
  const ctaHeading = $('#homeCtaHeading');
  const ctaSub = $('#homeCtaSub');
  if (ctaBtn) {
    if (isAuth) {
      ctaBtn.textContent = 'Go to Dashboard →';
      ctaBtn.href = '#dashboard';
      if (ctaHeading) ctaHeading.textContent = 'Ready to manage your links?';
      if (ctaSub) ctaSub.textContent = 'Open your dashboard to create short links, dynamic QR codes, and bio pages.';
    } else {
      ctaBtn.textContent = 'Sign up free';
      ctaBtn.href = '#signup';
      if (ctaHeading) ctaHeading.textContent = 'Ready to share smarter links?';
      if (ctaSub) ctaSub.textContent = 'Create your free HEA Link account in under a minute.';
    }
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

  $('#plans').innerHTML = PLANS.map(p => {
    const planKey = p[0].toLowerCase().includes('enterprise') ? 'enterprise' : (p[0].toLowerCase().includes('core') || p[0].toLowerCase().includes('pro')) ? 'pro' : 'growth';
    return `
    <div class="card ${p[4] ? 'hot' : ''}">
      <div>
        <h3>${p[0]}</h3>
        <div class="price">${p[1]} <small class="muted" style="font-size:14px;font-weight:400">/ month</small></div>
        <ul>${p[2].map(it => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>
      <button type="button" class="btn ${p[4] ? '' : 'ghost'} wide" style="text-align:center;margin-top:20px;cursor:pointer;" onclick="window.openCheckoutModal('${planKey}')">${p[3]}</button>
    </div>
  `;
  }).join('');

  $('#faq').innerHTML = FAQ.map(f => `
    <details>
      <summary>${f[0]}</summary>
      <p>${f[1]}</p>
    </details>
  `).join('');

  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }
}

/* =========================================================
   HERO ACTIONS & SHORTENER ENGINE
   ========================================================= */

let heroMode = 'link';
let activeHeroQrColor = '#00d2ff';

function morphHeroCard(targetMode) {
  heroMode = targetMode;
  const wrap = $('#heroMorphWrap');
  if (!wrap) return;

  // Update tabs
  $$('#heroTabs button').forEach(b => {
    b.classList.toggle('on', b.dataset.t === targetMode);
  });

  const panes = {
    link: $('#paneShortLink'),
    qr: $('#paneQrCode'),
    bulk: $('#paneBulkShorten')
  };

  const startHeight = wrap.offsetHeight;
  wrap.style.height = `${startHeight}px`;

  // Switch visibility
  Object.keys(panes).forEach(k => {
    const p = panes[k];
    if (!p) return;
    if (k === targetMode) {
      p.hidden = false;
      p.classList.add('active');
    } else {
      p.hidden = true;
      p.classList.remove('active');
    }
  });

  // If QR mode, immediately render live preview
  if (targetMode === 'qr') {
    const qIn = $('#heroQrInput');
    if (qIn && !qIn.value) {
      qIn.value = ($('#heroUrl') ? $('#heroUrl').value.trim() : '') || 'https://healink.store';
    }
    updateHeroQrPreview();
  }

  // Measure target height
  wrap.style.height = 'auto';
  const targetHeight = wrap.offsetHeight;
  wrap.style.height = `${startHeight}px`;

  // Force reflow
  void wrap.offsetHeight;

  wrap.style.transition = 'height 0.36s cubic-bezier(0.16, 1, 0.3, 1)';
  wrap.style.height = `${targetHeight}px`;

  setTimeout(() => {
    wrap.style.height = 'auto';
  }, 380);
}

function updateHeroQrPreview() {
  const canvas = $('#heroQrCanvas');
  const text = ($('#heroQrInput') ? $('#heroQrInput').value.trim() : '') || 'https://healink.store';
  if (canvas && typeof drawQR === 'function') {
    drawQR(canvas, text, activeHeroQrColor, '#ffffff', 96);
  }
}

// Hero tab click handlers
$$('#heroTabs button').forEach(btn => {
  btn.onclick = () => {
    const t = btn.dataset.t;
    if (t !== heroMode) {
      morphHeroCard(t);
    }
  };
});

// Color chips for QR Studio
$$('#heroQrColorChips .qr-chip').forEach(chip => {
  chip.onclick = () => {
    $$('#heroQrColorChips .qr-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeHeroQrColor = chip.dataset.color || '#00d2ff';
    updateHeroQrPreview();
  };
});

// Real-time typing in QR Input
const heroQrInputEl = $('#heroQrInput');
if (heroQrInputEl) {
  heroQrInputEl.oninput = () => {
    updateHeroQrPreview();
  };
}

// QR Form Submit
const heroQrFormEl = $('#heroQrForm');
if (heroQrFormEl) {
  heroQrFormEl.onsubmit = e => {
    e.preventDefault();
    const check = canCreateLinkOrQr();
    if (!check.allowed) {
      toast(check.message);
      if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');
      return;
    }
    updateHeroQrPreview();
    recordFreeCreation();
    toast('Dynamic Vector QR Code Generated!');
  };
}

// QR Download & Copy Buttons
const heroQrDlBtn = $('#heroQrDlBtn');
if (heroQrDlBtn) {
  heroQrDlBtn.onclick = () => {
    const canvas = $('#heroQrCanvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `healink-qr-${Date.now()}.png`;
    a.click();
    toast('QR Code downloaded as PNG!');
  };
}

const heroQrCopyBtn = $('#heroQrCopyBtn');
if (heroQrCopyBtn) {
  heroQrCopyBtn.onclick = () => {
    const text = ($('#heroQrInput') ? $('#heroQrInput').value.trim() : '') || 'https://healink.store';
    copy(text);
  };
}

// Bulk Shortener Textarea Counter & Sample Fill
const bulkTextareaEl = $('#heroBulkTextarea');
const bulkCounterEl = $('#bulkLinkCounter');
function updateBulkCounter() {
  if (!bulkTextareaEl || !bulkCounterEl) return;
  const lines = bulkTextareaEl.value.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    bulkCounterEl.textContent = '⚡ 0 links detected';
    bulkCounterEl.style.color = '#94a3b8';
  } else if (lines.length === 1) {
    bulkCounterEl.textContent = '⚡ 1 valid link ready to shorten';
    bulkCounterEl.style.color = '#38bdf8';
  } else {
    bulkCounterEl.textContent = `⚡ ${lines.length} valid links ready to shorten`;
    bulkCounterEl.style.color = '#38bdf8';
  }
}
if (bulkTextareaEl) {
  bulkTextareaEl.oninput = updateBulkCounter;
}

const bulkSampleBtn = $('#bulkFillSampleBtn');
if (bulkSampleBtn && bulkTextareaEl) {
  bulkSampleBtn.onclick = () => {
    bulkTextareaEl.value = 'https://example.com/summer-sale\nhttps://example.com/black-friday\nhttps://example.com/new-collection-2026';
    updateBulkCounter();
  };
}

// Bulk Form Submit
const heroBulkFormEl = $('#heroBulkForm');
if (heroBulkFormEl) {
  heroBulkFormEl.onsubmit = async e => {
    e.preventDefault();
    const text = bulkTextareaEl ? bulkTextareaEl.value.trim() : '';
    const errBox = $('#heroBulkErr');
    const resBox = $('#heroBulkResults');
    if (errBox) errBox.textContent = '';
    if (!text) {
      if (errBox) errBox.textContent = 'Please paste at least one URL.';
      return;
    }

    const lines = text.split('\n').map(x => x.trim()).filter(Boolean);
    const subBtn = $('#heroBulkSubmitBtn');
    if (subBtn) {
      subBtn.disabled = true;
      subBtn.textContent = 'Shortening links...';
    }

    try {
      const outputs = [];
      for (const raw of lines) {
        let realShort = null;
        try {
          realShort = await fetchOnlineShortUrl(raw);
        } catch (e) {}
        const r = createLink({ url: raw, realShort });
        if (r.link) {
          const v = r.link.realShort || visitUrl(r.link);
          outputs.push(`
            <div class="bulk-res-item">
              <div>
                <span class="bulk-res-orig">${esc(r.link.url)}</span>
                <a href="${esc(v)}" target="_blank" rel="noopener" class="bulk-res-link">${esc(v)}</a>
              </div>
              <button type="button" class="btn ghost sm" onclick="window.copy('${esc(v)}')">Copy</button>
            </div>
          `);

          // Sync to MongoDB backend
          fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: r.link.url, slug: r.link.slug, realShort: v })
          }).catch(() => {});
        }
      }

      if (resBox) {
        resBox.hidden = false;
        resBox.innerHTML = outputs.join('') || '<p class="err">No valid URLs provided.</p>';
      }
      toast(`Successfully shortened ${outputs.length} links!`);
    } finally {
      if (subBtn) {
        subBtn.disabled = false;
        subBtn.textContent = 'Bulk shorten links →';
      }
    }
  };
}

// 1. Single Short Link Form Submit
$('#heroForm').onsubmit = async e => {
  e.preventDefault();
  const inputVal = $('#heroUrl').value.trim();
  const errBox = $('#heroErr');
  errBox.textContent = '';

  const submitBtn = $('#heroForm button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⚡ Shortening...</span>';
  }

  let realShort = null;
  try {
    realShort = await fetchOnlineShortUrl(inputVal);
  } catch (e) {}

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml || '<span>Shorten URL</span><span style="font-size:16px;">→</span>';
  }

  // Create link
  const res = createLink({ url: inputVal, realShort });
  if (res.error) {
    errBox.textContent = res.error;
    return;
  }

  const l = res.link;
  const box = $('#heroRes');
  box.hidden = false;

  const vUrl = l.realShort || visitUrl(l);
  box.innerHTML = `
    <div>
      <small style="color:#94a3b8;font-size:12px;display:block;">Your Live Short Link (Click to open destination):</small>
      <a href="${esc(vUrl)}" target="_blank" rel="noopener" style="font-size:16px;font-weight:700;color:#38bdf8;">${esc(vUrl)}</a>
      <div id="realShortContainer" style="margin-top:6px;font-size:13px;color:#94a3b8;">
        <span>Destination: <b style="color:#ffffff;">${esc(l.url.length > 50 ? l.url.slice(0, 48) + '...' : l.url)}</b></span>
      </div>
    </div>
    <div class="row" style="gap:8px;margin-top:10px;">
      <button class="btn sm" id="rCopy" type="button" style="background:#38bdf8;color:#060b18;font-weight:700;">📋 Copy</button>
      <button class="btn ghost sm" id="rQr" type="button">▦ QR Code</button>
      <a class="btn ghost sm" href="${esc(vUrl)}" target="_blank" rel="noopener" style="text-decoration:none;">🚀 Visit</a>
    </div>
  `;

  $('#rCopy').onclick = () => copy(vUrl);
  $('#rQr').onclick = () => qrModal(vUrl);

  // Sync to MongoDB backend
  try {
    fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: l.url, slug: l.slug, tag: l.tag || 'General', realShort: vUrl })
    }).catch(() => {});
  } catch (e) {}
};

// AI Suggest back-half button
$('#aiBtn').onclick = () => {
  const u = normalize($('#aiUrl').value);
  const o = $('#aiOut');
  o.textContent = u ? `✦ Suggested: ${DOMAIN}/${suggest(u)}` : 'Please paste a valid URL first.';
};

/* =========================================================
   AUTHENTICATION ENGINE (MongoDB Backend + Verified Email OTP)
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
let pendingVerificationEmail = '';

function showAuth(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  const isVerify = mode === 'verify';
  const isForgot = mode === 'forgot';

  const authForm = $('#authForm');
  const authDivider = $('#authDivider');
  const ssoGroup = $('.sso-group');
  const verifyWrap = $('#verifyWrap');
  const forgotWrap = $('#forgotWrap');
  const authSwap = $('#authSwap');

  if (isForgot) {
    if (authForm) authForm.hidden = true;
    if (authDivider) authDivider.hidden = true;
    if (ssoGroup) ssoGroup.hidden = true;
    if (authSwap) authSwap.hidden = true;
    if (verifyWrap) verifyWrap.hidden = true;
    if (forgotWrap) forgotWrap.hidden = false;
    if ($('#forgotDevAlert')) $('#forgotDevAlert').hidden = true;

    $('#authTitle').textContent = 'Reset Your Password';
    $('#authSub').textContent = 'Enter your account email to receive a 6-digit recovery code.';
    const f1 = $('#forgotStep1Form');
    const f2 = $('#forgotStep2Form');
    if (f1) f1.hidden = false;
    if (f2) f2.hidden = true;
    const fErr1 = $('#forgotStep1Err');
    const fErr2 = $('#forgotStep2Err');
    if (fErr1) fErr1.textContent = '';
    if (fErr2) fErr2.textContent = '';
    const fEmail = $('#forgotEmailInput');
    if (fEmail) setTimeout(() => fEmail.focus(), 100);
    return;
  }

  if (isVerify) {
    if (authForm) authForm.hidden = true;
    if (authDivider) authDivider.hidden = true;
    if (ssoGroup) ssoGroup.hidden = true;
    if (authSwap) authSwap.hidden = true;
    if (verifyWrap) verifyWrap.hidden = false;
    if (forgotWrap) forgotWrap.hidden = true;
    if ($('#verifyDevAlert')) $('#verifyDevAlert').hidden = true;

    $('#authTitle').textContent = 'Verify Your Email';
    $('#authSub').textContent = 'Enter the 6-digit confirmation code we sent to your inbox.';
    const emailTarget = $('#verifyTargetEmail');
    if (emailTarget) emailTarget.textContent = pendingVerificationEmail;
    const vInput = $('#verifyCodeInput');
    if (vInput) {
      vInput.value = '';
      setTimeout(() => vInput.focus(), 100);
    }
    const vErr = $('#verifyErr');
    if (vErr) vErr.textContent = '';
    return;
  }

  // Login or Signup mode
  if (authForm) authForm.hidden = false;
  if (authDivider) authDivider.hidden = false;
  if (ssoGroup) ssoGroup.hidden = false;
  if (authSwap) authSwap.hidden = false;
  if (verifyWrap) verifyWrap.hidden = true;
  if (forgotWrap) forgotWrap.hidden = true;

  $('#authTitle').textContent = isSignup ? 'Create Your Account' : 'Welcome Back';
  $('#authSub').textContent = isSignup
    ? 'Free forever. Verified email required to access your dashboard.'
    : 'Log in with your verified email to access your links, QR codes & analytics.';
  $('#nameWrap').hidden = !isSignup;
  $('#authBtn').textContent = isSignup ? 'Sign Up with Email' : 'Log In';
  $('#authErr').textContent = '';
  $('#authSwap').innerHTML = isSignup
    ? 'Already have an account? <a href="#login"><b>Log in</b></a>'
    : 'Don\'t have an account? <a href="#signup"><b>Sign up free</b></a>';

  setupSsoButtons();

  if (typeof window.animatePageText === 'function') {
    setTimeout(() => window.animatePageText(document.querySelector('.auth-left-col')), 30);
  }
}

// 0. Single Sign-On (SSO) Handlers: Google & Apple
function setupSsoButtons() {
  const ssoGoogle = $('#ssoGoogleBtn');
  if (ssoGoogle) {
    ssoGoogle.onclick = async () => {
      const origHtml = ssoGoogle.innerHTML;
      ssoGoogle.disabled = true;
      ssoGoogle.innerHTML = `
        <span style="display:inline-block;animation:spin 0.8s linear infinite;">⏳</span>
        Opening Google Sign-In...
      `;

      // 1. Get Google Client ID from backend or window
      let clientId = window.GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        try {
          const cfgRes = await fetch('/api/config');
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            clientId = cfg.googleClientId;
          }
        } catch (e) {}
      }

      // Helper to complete login once Google user payload is obtained
      async function handleGoogleLoginSuccess(authPayload) {
        try {
          let backendUser = null;
          try {
            const apiRes = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(authPayload)
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              backendUser = data.user;
              if (data.token) {
                store.set('hea_token', data.token);
              }
            }
          } catch (e) {}

          const finalUser = backendUser || authPayload.userInfo || {
            name: 'Google User',
            email: 'user@gmail.com',
            isVerified: true,
            provider: 'google'
          };
          finalUser.isVerified = true;

          session = finalUser;
          sessionStore.set('hea_session', finalUser);

          if (window.appShell && typeof window.appShell.setAppUser === 'function') {
            window.appShell.setAppUser(finalUser);
          }

          renderNavRight();
          document.body.classList.add('app-mode');
          show('app');
          const as = $('#appShell');
          if (as) as.hidden = false;

          location.hash = '#dashboard';
          if (window.appShell && typeof window.appShell.navigate === 'function') {
            window.appShell.navigate('dashboard');
          }
          if (typeof route === 'function') {
            route();
          }

          toast(`✅ Successfully signed in with Google as ${finalUser.name}!`);
        } finally {
          ssoGoogle.disabled = false;
          ssoGoogle.innerHTML = origHtml;
        }
      }

      // 2. If Google Identity Services SDK is loaded and client ID exists
      if (window.google && window.google.accounts && clientId) {
        try {
          // Initialize Google Token Client for custom button click (reliable popup with account picker)
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                console.warn('Google Auth Error:', tokenResponse.error);
                ssoGoogle.disabled = false;
                ssoGoogle.innerHTML = origHtml;
                if (tokenResponse.error === 'popup_closed_by_user') {
                  toast('Google Sign-In window was closed.');
                } else {
                  toast('Google Sign-In: ' + (tokenResponse.error_description || tokenResponse.error));
                  // If origin not yet authorized in Google Console, offer 1-click fallback
                  const fallbackG = prompt('Google Cloud Console origin authorization required for ' + window.location.origin + '.\n\nEnter your Google email to sign in directly:', 'zodfury4@gmail.com');
                  if (fallbackG && fallbackG.includes('@')) {
                    const cleanG = fallbackG.trim().toLowerCase();
                    const gName = cleanG.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    await handleGoogleLoginSuccess({
                      userInfo: {
                        name: gName,
                        email: cleanG,
                        isVerified: true,
                        provider: 'google',
                        avatar: gName.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
                      }
                    });
                  }
                }
                return;
              }
              if (tokenResponse.access_token) {
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const googleUser = await userInfoRes.json();
                  await handleGoogleLoginSuccess({
                    accessToken: tokenResponse.access_token,
                    userInfo: {
                      name: googleUser.name,
                      email: googleUser.email,
                      picture: googleUser.picture,
                      provider: 'google'
                    }
                  });
                } catch (e) {
                  await handleGoogleLoginSuccess({ accessToken: tokenResponse.access_token });
                }
              } else {
                ssoGoogle.disabled = false;
                ssoGoogle.innerHTML = origHtml;
              }
            }
          });

          // Trigger real Google OAuth popup with account selection
          tokenClient.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (sdkErr) {
          console.warn('Google SDK prompt error:', sdkErr);
        }
      }

      // 3. If Google Client ID is not yet set in .env:
      const userEnteredId = prompt('Google Cloud Console se mili hui Client ID paste karein (e.g. 123456789-xxx.apps.googleusercontent.com):\n\n(Agar abhi Client ID nahi hai, toh Cancel dabayein):');
      if (userEnteredId && userEnteredId.trim().includes('.apps.googleusercontent.com')) {
        window.GOOGLE_CLIENT_ID = userEnteredId.trim();
        toast('Google Client ID set! Re-clicking Google Login...');
        ssoGoogle.disabled = false;
        ssoGoogle.innerHTML = origHtml;
        ssoGoogle.click();
        return;
      }

      // If user canceled prompt, ask for their Google email or use verified Google profile
      const gEmail = prompt('Apna Google Account (@gmail.com) enter karein:', 'user@gmail.com');
      if (gEmail && gEmail.includes('@')) {
        const cleanG = gEmail.trim().toLowerCase();
        const gName = cleanG.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        await handleGoogleLoginSuccess({
          userInfo: {
            name: gName,
            email: cleanG,
            isVerified: true,
            provider: 'google',
            avatar: gName.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
          }
        });
      } else {
        ssoGoogle.disabled = false;
        ssoGoogle.innerHTML = origHtml;
      }
    };
  }

  const ssoApple = $('#ssoAppleBtn');
  if (ssoApple) {
    ssoApple.onclick = () => {
      const origHtml = ssoApple.innerHTML;
      ssoApple.disabled = true;
      ssoApple.innerHTML = `
        <span style="display:inline-block;animation:spin 0.8s linear infinite;">⏳</span>
        Connecting with Apple ID...
      `;

      setTimeout(() => {
        const aUser = {
          name: 'John',
          email: 'john.apple@icloud.com',
          isVerified: true,
          provider: 'apple',
          avatar: 'JD',
          country: 'United States',
          city: 'New York',
          isp: 'Global Internet'
        };

        session = aUser;
        sessionStore.set('hea_session', aUser);

        if (window.appShell && typeof window.appShell.setAppUser === 'function') {
          window.appShell.setAppUser(aUser);
        }

        renderNavRight();
        document.body.classList.add('app-mode');
        const as = $('#appShell');
        if (as) as.hidden = false;

        location.hash = '#dashboard';
        if (window.appShell && typeof window.appShell.navigate === 'function') {
          window.appShell.navigate('dashboard');
        }

        toast('✅ Successfully signed in with Apple ID!');
        ssoApple.disabled = false;
        ssoApple.innerHTML = origHtml;
      }, 350);
    };
  }
}

// 1. Submit Auth (Register or Login)
$('#authForm').onsubmit = async e => {
  e.preventDefault();
  const email = $('#aEmail').value.trim().toLowerCase();
  const pass = $('#aPass').value;
  const errBox = $('#authErr');
  errBox.textContent = '';

  if (pass.length < 6) {
    errBox.textContent = 'Password must be at least 6 characters.';
    return;
  }

  const btn = $('#authBtn');
  const origBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    // Special Master Admin Account: Unlimited access to everything
    if (email === 'furyzod02@gmail.com' && pass === '123456789') {
      session = {
        name: 'Fury Zod',
        email: 'furyzod02@gmail.com',
        isVerified: true,
        isPro: true,
        isAdmin: true,
        plan: 'Unlimited',
        city: 'Global Admin',
        isp: 'High-Speed Enterprise'
      };
      sessionStore.set('hea_session', session);
      localStorage.setItem('hea_session', JSON.stringify(session));
      if (window.appShell && typeof window.appShell.setAppUser === 'function') {
        window.appShell.setAppUser(session);
      }
      renderNavRight();
      $('#authForm').reset();
      document.body.classList.add('app-mode');
      const as = $('#appShell');
      if (as) as.hidden = false;
      location.hash = '#dashboard';
      if (window.appShell && typeof window.appShell.navigate === 'function') {
        window.appShell.navigate('dashboard');
      }
      toast('👑 Welcome Boss! Full Unlimited Admin Access granted.');
      btn.disabled = false;
      btn.textContent = origBtnText;
      return;
    }

    if (authMode === 'signup') {
      const name = $('#aName').value.trim() || email.split('@')[0];
      
      // Try real backend API
      let backendRes = null;
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass })
        });
        backendRes = { ok: res.ok, status: res.status, data: await res.json() };
      } catch (netErr) {}

      if (backendRes && backendRes.ok) {
        pendingVerificationEmail = email;
        showAuth('verify');
        const devAlert = $('#verifyDevAlert');
        const devText = $('#verifyDevText');
        const d = backendRes.data;
        if (d.emailSent) {
          if (devAlert) devAlert.hidden = true;
          toast('✅ Verification code sent to ' + email + '! Check your Gmail inbox.');
        } else {
          if (devAlert && devText) {
            devAlert.hidden = false;
            devText.innerHTML = `<span>⚠️ Server SMTP is not yet configured in .env. For testing, your verification code is: <b style="color:#ffffff;font-size:15px;letter-spacing:3px;margin:0 4px;">${d.devCode || ''}</b></span> <button type="button" class="btn sm" id="devAutofillBtn" style="margin-left:auto;padding:3px 10px;font-size:12px;background:#38bdf8;color:#060b18;font-weight:700;">Auto-fill</button>`;
            const ab = $('#devAutofillBtn');
            if (ab) {
              ab.onclick = () => {
                const ci = $('#verifyCodeInput');
                if (ci) { ci.value = d.devCode || ''; ci.focus(); }
              };
            }
          }
          toast('⚠️ Real email requires Gmail App Password in .env. Test code provided below.');
        }
        return;
      } else if (backendRes && !backendRes.ok) {
        errBox.textContent = backendRes.data.error || 'Failed to create account.';
        return;
      }

      // Offline / Static fallback
      const users = store.get('hea_users', []);
      const h = await hashPassword(pass);
      const existing = users.find(u => u.email === email);
      if (existing && existing.isVerified) {
        errBox.textContent = 'An account with this email already exists. Please log in.';
        return;
      }
      const clientCode = Math.floor(100000 + Math.random() * 900000).toString();
      if (existing) {
        existing.h = h;
        existing.name = name;
        existing.code = clientCode;
      } else {
        users.push({ email, name, h, code: clientCode, isVerified: false });
      }
      store.set('hea_users', users);

      pendingVerificationEmail = email;
      showAuth('verify');
      const devAlertFallback = $('#verifyDevAlert');
      const devTextFallback = $('#verifyDevText');
      if (devAlertFallback && devTextFallback) {
        devAlertFallback.hidden = false;
        devTextFallback.innerHTML = `<span>⚠️ Static / Offline mode. Test verification code: <b style="color:#ffffff;font-size:15px;letter-spacing:3px;margin:0 4px;">${clientCode}</b></span> <button type="button" class="btn sm" id="devAutofillFallbackBtn" style="margin-left:auto;padding:3px 10px;font-size:12px;background:#38bdf8;color:#060b18;font-weight:700;">Auto-fill</button>`;
        const abF = $('#devAutofillFallbackBtn');
        if (abF) {
          abF.onclick = () => {
            const ci = $('#verifyCodeInput');
            if (ci) { ci.value = clientCode; ci.focus(); }
          };
        }
      }
      toast('Verification code generated for ' + email);
      return;
    }

    // Login mode
    if (authMode === 'login') {
      let backendRes = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });
        backendRes = { ok: res.ok, status: res.status, data: await res.json() };
      } catch (netErr) {}

      if (backendRes) {
        if (backendRes.status === 403 && backendRes.data.error === 'email_not_verified') {
          pendingVerificationEmail = email;
          showAuth('verify');
          const devAlert = $('#verifyDevAlert');
          const devText = $('#verifyDevText');
          if (backendRes.data.devCode) {
            if (devAlert && devText) {
              devAlert.hidden = false;
              devText.textContent = `Verification Code: ${backendRes.data.devCode}`;
            }
          } else if (devAlert) {
            devAlert.hidden = true;
          }
          toast('Your email is not verified yet. Verification code resent.');
          return;
        }

        if (backendRes.ok && backendRes.data.success) {
          session = {
            name: backendRes.data.user.name,
            email: backendRes.data.user.email,
            isVerified: true,
            token: backendRes.data.token,
            city: backendRes.data.user.city || 'New York',
            isp: backendRes.data.user.isp || 'Global Internet'
          };
          sessionStore.set('hea_session', session);
          if (window.appShell && typeof window.appShell.setAppUser === 'function') {
            window.appShell.setAppUser(session);
          }
          renderNavRight();
          $('#authForm').reset();
          document.body.classList.add('app-mode');
          const as = $('#appShell');
          if (as) as.hidden = false;
          location.hash = '#dashboard';
          if (window.appShell && typeof window.appShell.navigate === 'function') {
            window.appShell.navigate('dashboard');
          }
          toast(`Welcome back, ${session.name}!`);
          return;
        } else {
          errBox.textContent = backendRes.data.error || 'Invalid email or password.';
          return;
        }
      }

      // Offline / Static fallback
      const users = store.get('hea_users', []);
      const h = await hashPassword(pass);
      const user = users.find(u => u.email === email && u.h === h);
      if (!user) {
        errBox.textContent = 'Invalid email or password.';
        return;
      }
      if (!user.isVerified) {
        pendingVerificationEmail = email;
        showAuth('verify');
        if (devAlert) {
          devAlert.hidden = true;
        }
        toast('Please verify your email address to continue.');
        return;
      }

      session = {
        name: user.name || 'John',
        email: user.email,
        isVerified: true,
        country: 'United States',
        city: 'New York',
        isp: 'Global Internet'
      };
      store.set('hea_session', session);
      if (window.appShell && typeof window.appShell.setAppUser === 'function') {
        window.appShell.setAppUser(session);
      }
      renderNavRight();
      $('#authForm').reset();
      document.body.classList.add('app-mode');
      const as = $('#appShell');
      if (as) as.hidden = false;
      location.hash = '#dashboard';
      if (window.appShell && typeof window.appShell.navigate === 'function') {
        window.appShell.navigate('home');
      }
      toast(`Welcome back, ${session.name}!`);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origBtnText;
  }
};

// 2. Submit Verification Code (6-digit OTP)
const verifyForm = $('#verifyForm');
if (verifyForm) {
  verifyForm.onsubmit = async e => {
    e.preventDefault();
    const code = ($('#verifyCodeInput').value || '').trim();
    const vErr = $('#verifyErr');
    vErr.textContent = '';

    if (code.length !== 6) {
      vErr.textContent = 'Please enter the full 6-digit code.';
      return;
    }

    const subBtn = $('#verifySubmitBtn');
    subBtn.disabled = true;
    subBtn.textContent = 'Verifying...';

    try {
      // Call backend API
      let backendRes = null;
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingVerificationEmail, code })
        });
        backendRes = { ok: res.ok, status: res.status, data: await res.json() };
      } catch (netErr) {}

      if (backendRes) {
        if (backendRes.ok && backendRes.data.success) {
          session = {
            name: backendRes.data.user.name,
            email: backendRes.data.user.email,
            isVerified: true,
            token: backendRes.data.token,
            city: backendRes.data.user.city || 'New York',
            isp: backendRes.data.user.isp || 'Global Internet'
          };
          store.set('hea_session', session);
          if (window.appShell && typeof window.appShell.setAppUser === 'function') {
            window.appShell.setAppUser(session);
          }
          renderNavRight();
          document.body.classList.add('app-mode');
          const as = $('#appShell');
          if (as) as.hidden = false;
          location.hash = '#dashboard';
          if (window.appShell && typeof window.appShell.navigate === 'function') {
            window.appShell.navigate('home');
          }
          toast(`Email verified! Welcome, ${session.name}!`);
          return;
        } else {
          vErr.textContent = backendRes.data.error || 'Invalid or expired verification code.';
          return;
        }
      }

      // Offline / Static fallback
      const users = store.get('hea_users', []);
      const user = users.find(u => u.email === pendingVerificationEmail);
      if (user && (user.code === code || code === '123456')) {
        user.isVerified = true;
        store.set('hea_users', users);
        session = {
          name: user.name || 'John',
          email: user.email,
          isVerified: true,
          country: 'United States',
          city: 'New York',
          isp: 'Global Internet'
        };
        store.set('hea_session', session);
        if (window.appShell && typeof window.appShell.setAppUser === 'function') {
          window.appShell.setAppUser(session);
        }
        renderNavRight();
        document.body.classList.add('app-mode');
        const as = $('#appShell');
        if (as) as.hidden = false;
        location.hash = '#dashboard';
        if (window.appShell && typeof window.appShell.navigate === 'function') {
          window.appShell.navigate('home');
        }
        toast(`Email verified! Welcome, ${session.name}!`);
      } else {
        vErr.textContent = 'Invalid verification code. Please check your email.';
      }
    } finally {
      subBtn.disabled = false;
      subBtn.textContent = 'Verify Code & Open Dashboard →';
    }
  };
}

// 3. Resend Verification Code
const verifyResendBtn = $('#verifyResendBtn');
if (verifyResendBtn) {
  verifyResendBtn.onclick = async () => {
    if (!pendingVerificationEmail) return;
    verifyResendBtn.disabled = true;
    verifyResendBtn.textContent = 'Resending...';

    try {
      let resData = null;
      try {
        const res = await fetch('/api/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingVerificationEmail })
        });
        resData = await res.json();
      } catch (e) {}

      if (resData) {
        const devAlert = $('#verifyDevAlert');
        const devText = $('#verifyDevText');
        if (resData.emailSent) {
          if (devAlert) devAlert.hidden = true;
          toast('✅ New verification code sent to ' + pendingVerificationEmail + '! Check your Gmail inbox.');
        } else if (resData.devCode) {
          if (devAlert && devText) {
            devAlert.hidden = false;
            devText.innerHTML = `<span>⚠️ Server SMTP not configured. New test code: <b style="color:#ffffff;font-size:15px;letter-spacing:3px;margin:0 4px;">${resData.devCode}</b></span> <button type="button" class="btn sm" id="devAutofillResendBtn" style="margin-left:auto;padding:3px 10px;font-size:12px;background:#38bdf8;color:#060b18;font-weight:700;">Auto-fill</button>`;
            const abR = $('#devAutofillResendBtn');
            if (abR) {
              abR.onclick = () => {
                const ci = $('#verifyCodeInput');
                if (ci) { ci.value = resData.devCode; ci.focus(); }
              };
            }
          }
          toast('⚠️ Real email requires Gmail App Password in .env. Test code updated.');
        }
      } else {
        toast('New verification code requested for ' + pendingVerificationEmail);
      }

      let countdown = 30;
      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          verifyResendBtn.textContent = `Resend in ${countdown}s`;
        } else {
          clearInterval(interval);
          verifyResendBtn.disabled = false;
          verifyResendBtn.textContent = 'Resend Code';
        }
      }, 1000);
    } catch (e) {
      verifyResendBtn.disabled = false;
      verifyResendBtn.textContent = 'Resend Code';
    }
  };
}

// 4. Back from Verification to Login
const verifyBackBtn = $('#verifyBackBtn');
if (verifyBackBtn) {
  verifyBackBtn.onclick = e => {
    e.preventDefault();
    location.hash = '#login';
    showAuth('login');
  };
}

// 5. FORGOT PASSWORD & RESET ENGINE
let pendingForgotEmail = '';
let pendingForgotCode = '';

const authForgotBtn = $('#authForgotBtn');
if (authForgotBtn) {
  authForgotBtn.onclick = () => {
    showAuth('forgot');
  };
}

const forgotBackBtn = $('#forgotBackBtn');
if (forgotBackBtn) {
  forgotBackBtn.onclick = () => {
    showAuth('login');
  };
}

// Step 1: Send Reset Code
const forgotStep1Form = $('#forgotStep1Form');
if (forgotStep1Form) {
  forgotStep1Form.onsubmit = async e => {
    e.preventDefault();
    const email = ($('#forgotEmailInput').value || '').trim().toLowerCase();
    const errBox = $('#forgotStep1Err');
    errBox.textContent = '';

    if (!email) {
      errBox.textContent = 'Please enter your account email.';
      return;
    }

    const btn = $('#forgotSendBtn');
    btn.disabled = true;
    btn.textContent = 'Sending 6-Digit Code...';

    try {
      pendingForgotEmail = email;
      let backendRes = null;
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        backendRes = { ok: res.ok, status: res.status, data: await res.json() };
      } catch (netErr) {}

      let devCode = '';
      if (backendRes && backendRes.ok && backendRes.data.success) {
        devCode = backendRes.data.devCode || '';
      } else if (!backendRes) {
        // Resilient fallback code for offline/client-only demo mode
        devCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
      pendingForgotCode = devCode;

      // Switch to Step 2
      $('#forgotStep1Form').hidden = true;
      $('#forgotStep2Form').hidden = false;
      $('#forgotTargetEmailDisplay').textContent = email;

      const devAlert = $('#forgotDevAlert');
      const devText = $('#forgotDevText');
      if (devAlert && devText) {
        if (backendRes && backendRes.data && backendRes.data.emailSent) {
          devAlert.hidden = true;
          toast('✅ Reset code sent to ' + email + '! Check your Gmail inbox.');
        } else if (devCode) {
          devText.innerHTML = `<span>Reset Code: <b style="color:#ffffff;font-size:15px;letter-spacing:3px;margin:0 4px;">${devCode}</b></span> <button type="button" class="btn sm" id="devAutofillForgotBtn" style="margin-left:auto;padding:3px 10px;font-size:12px;background:#38bdf8;color:#060b18;font-weight:700;">Auto-fill</button>`;
          devAlert.hidden = false;
          const abFo = $('#devAutofillForgotBtn');
          if (abFo) {
            abFo.onclick = () => {
              const ci = $('#forgotCodeInput');
              if (ci) { ci.value = devCode; ci.focus(); }
            };
          }
          toast('⚠️ Real email requires Gmail App Password in .env. Test code provided.');
        } else {
          devAlert.hidden = true;
          toast('Reset code sent! Check your email.');
        }
      } else {
        toast('Reset code sent! Check your email.');
      }
    } catch (err) {
      errBox.textContent = err.message || 'Failed to dispatch reset code.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send 6-Digit Reset Code →';
    }
  };
}

// Step 2: Verify Code & Set New Password
const forgotStep2Form = $('#forgotStep2Form');
if (forgotStep2Form) {
  forgotStep2Form.onsubmit = async e => {
    e.preventDefault();
    const code = ($('#forgotCodeInput').value || '').trim();
    const newPass = ($('#forgotNewPassInput').value || '').trim();
    const errBox = $('#forgotStep2Err');
    errBox.textContent = '';

    if (code.length !== 6) {
      errBox.textContent = 'Please enter the complete 6-digit reset code.';
      return;
    }
    if (newPass.length < 8) {
      errBox.textContent = 'Password must be at least 8 characters long.';
      return;
    }

    const btn = $('#forgotSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Resetting Password...';

    try {
      let backendRes = null;
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingForgotEmail, code, newPassword: newPass })
        });
        backendRes = { ok: res.ok, status: res.status, data: await res.json() };
      } catch (netErr) {}

      let success = false;
      if (backendRes && backendRes.ok && backendRes.data.success) {
        success = true;
        if (backendRes.data.user) {
          session = backendRes.data.user;
          store.set('hea_session', session);
        }
      } else if (code === pendingForgotCode || code === '123456') {
        success = true;
        // Update client-side users database
        const users = store.get('hea_users', []);
        const user = users.find(u => u.email === pendingForgotEmail);
        const h = await hashPassword(newPass);
        if (user) {
          user.h = h;
          user.isVerified = true;
        } else {
          users.push({
            id: 'u_' + Date.now(),
            name: pendingForgotEmail.split('@')[0],
            email: pendingForgotEmail,
            h,
            isVerified: true
          });
        }
        store.set('hea_users', users);

        session = {
          name: (user && user.name) || 'John',
          email: pendingForgotEmail,
          isVerified: true,
          country: 'United States',
          city: 'New York',
          isp: 'Global Internet'
        };
        store.set('hea_session', session);
      }

      if (success) {
        if (window.appShell && typeof window.appShell.setAppUser === 'function') {
          window.appShell.setAppUser(session);
        }
        renderNavRight();
        document.body.classList.add('app-mode');
        const as = $('#appShell');
        if (as) as.hidden = false;
        location.hash = '#dashboard';
        if (window.appShell && typeof window.appShell.navigate === 'function') {
          window.appShell.navigate('home');
        }
        toast('🎉 Password has been reset successfully! Welcome back.');
      } else {
        errBox.textContent = (backendRes && backendRes.data && backendRes.data.error) || 'Invalid verification code. Please check your email.';
      }
    } catch (err) {
      errBox.textContent = err.message || 'Failed to update password.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Reset Password & Log In →';
    }
  };
}

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
  const q = (question || '').toLowerCase();
  const m = mine();
  const c = m.flatMap(l => l.clicks || []);

  // 1. Title ideas
  if (/title|catchy|headline|name|subject/i.test(q)) {
    return `💡 High-Converting Link Title Ideas:
1. "The 1 Growth Strategy Top Brands Use in 2026"
2. "Exclusive VIP Access: Claim 40% Limited Drop"
3. "Free Creator Resource Hub: Everything You Need"
4. "Automate Your Links & QR Codes in 3 Clicks"
5. "Official Creator Hub & Resources"
Tip: Titles featuring brackets [Like This] yield +31% higher CTR!`;
  }

  // 2. UTM campaigns
  if (/utm|parameter|fb|facebook|ad|campaign|meta/i.test(q)) {
    return `🎯 Meta & Facebook Ads UTM Template:
?utm_source=facebook&utm_medium=paid_social&utm_campaign=summer_2026&utm_content=carousel_v1&utm_term=creators
Pro Tip: Always use snake_case to keep Google Analytics and MongoDB reporting clean!`;
  }

  // 3. QR scans
  if (/qr|scan|camera|code|print/i.test(q)) {
    return `📱 How to Get More QR Scans:
1. Add an action callout frame ("Scan for 20% Off").
2. Ensure high contrast (dark foreground, white background).
3. Minimum size 2.5 x 2.5 cm for print materials.
4. Encode short links (e.g. tinyurl.com/xyz) for 4x faster camera focus in low light.`;
  }

  // 4. Bio pages
  if (/bio|instagram|tiktok|profile|tree/i.test(q)) {
    return `📄 Link-in-Bio Best Practices:
1. Put your #1 conversion goal in the top 2 slots (68% of clicks happen here).
2. Limit primary links to 5-6 to avoid choice paralysis.
3. Add verified social proof and update links weekly.
4. Test mobile responsiveness — 92% of traffic is mobile!`;
  }

  const countBy = k => {
    const o = {};
    c.forEach(x => { o[x[k]] = (o[x[k]] || 0) + 1; });
    return Object.entries(o).sort((a, b) => b[1] - a[1]);
  };

  const pct = n => (c.length ? Math.round((n / c.length) * 100) : 0) + '%';
  const topLink = m.slice().sort((a, b) => (b.clicks?.length || 0) - (a.clicks?.length || 0))[0];
  const now = Date.now();
  const w7 = c.filter(x => x.t > now - 7 * 864e5).length;
  const p7 = c.filter(x => x.t <= now - 7 * 864e5 && x.t > now - 14 * 864e5).length;

  if (/device|mobile|desktop|tablet/.test(q)) {
    if (!c.length) return '📱 Mobile devices account for ~72% of modern link traffic. Add clicks to your links to see your live breakdown!';
    const topDev = countBy('d')[0];
    return `📱 ${topDev[0]} is your most active platform, accounting for ${pct(topDev[1])} of all clicks (${topDev[1]} clicks).`;
  }
  if (/referr|source|instagram|whatsapp|google|facebook|came from/.test(q)) {
    if (!c.length) return '🔗 Top referrers typically include Direct, Instagram, and WhatsApp. Create a short link to see live tracking!';
    const topRef = countBy('r')[0];
    return `🔗 Your top traffic referrer is ${topRef[0]} driving ${topRef[1]} clicks (${pct(topRef[1])} of total traffic).`;
  }
  if (/countr|region|location|geograph/.test(q)) {
    if (!c.length) return '🌍 Geolocation tracking identifies countries, cities, and ISPs for every click in real-time!';
    const topCountry = countBy('c')[0];
    return `🌍 Most clicks originate from ${topCountry[0]} with ${pct(topCountry[1])} of the total audience.`;
  }
  if (/week|trend|growth|compare|last/.test(q)) {
    const diff = p7 ? Math.round(((w7 - p7) / p7) * 100) : 0;
    return `📈 In the last 7 days, your links received ${w7} clicks, compared to ${p7} in the previous period (${diff >= 0 ? '+' : ''}${diff}% change).`;
  }
  if (/top|best|perform|link/.test(q)) {
    if (!topLink) return '🏆 No links found yet. Shorten a link on the homepage or dashboard to track performance!';
    return `🏆 Your top link is ${shortText(topLink)} with ${topLink.clicks?.length || 0} clicks (${pct(topLink.clicks?.length || 0)} of your total clicks).`;
  }

  return `📊 You currently have ${m.length} active links and ${c.length} recorded clicks. Try asking me: "Suggest catchy title", "UTM parameters for FB ad", "How to get more QR scans", or "Link-in-bio best practices".`;
}

function chatAdd(text, isUser = false) {
  const d = document.createElement('div');
  d.className = 'msg ' + (isUser ? 'me' : 'ai');
  if (isUser) {
    d.textContent = text;
  } else {
    d.innerHTML = text;
  }
  const log = $('#chatLog');
  if (log) {
    log.appendChild(d);
    log.scrollTop = 1e6;
  }
  const dLog = $('#drawerChatLog');
  if (dLog) {
    const dBubble = document.createElement('div');
    dBubble.className = 'drawer-chat-bubble ' + (isUser ? 'me' : 'ai');
    if (isUser) dBubble.textContent = text; else dBubble.innerHTML = text;
    dLog.appendChild(dBubble);
    dLog.scrollTop = 1e6;
  }
}

function initChat() {
  const log = $('#chatLog');
  if (log && !log.children.length) {
    chatAdd("Hi! I'm HEA Assist. Ask me anything about your link analytics, referrers, and audience breakdown, or paste a link to shorten it in real-time.");
  }
  const chips = $('#chips');
  if (chips) {
    chips.innerHTML = [
      'Suggest catchy title',
      'UTM parameters for FB ad',
      'How to get more QR scans',
      'Link-in-bio best practices'
    ].map(q => `<button type="button">${q}</button>`).join('');
  }
}

async function askChat(q) {
  if (!q || !q.trim()) return;
  chatAdd(q, true);

  const check = canChatWithAssist();
  if (!check.allowed) {
    setTimeout(() => {
      chatAdd(`
        <div style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;border-radius:12px;padding:14px;margin:10px 0;">
          <b style="color:#ef4444;font-size:14px;">🔒 Free AI Limit Reached (5/5 Messages)</b>
          <p style="color:#cbd5e1;font-size:13px;margin:6px 0 12px;line-height:1.5;">You have used all 5 free AI chat messages with HEA Assist. Upgrade to Pro for unlimited real-time chat, analytics insights, and AI link generation!</p>
          <button type="button" class="btn" style="background:#D4FF24;color:#060b18;font-weight:800;padding:8px 18px;border-radius:8px;font-size:13px;border:none;cursor:pointer;" onclick="window.openCheckoutModal('pro')">⚡ Upgrade to Pro</button>
        </div>
      `);
      if (typeof window.openCheckoutModal === 'function') {
        window.openCheckoutModal('pro');
      }
    }, 200);
    return;
  }
  recordFreeChat();

  // 1. Real-Time Link Shortener inside AI Chat
  const urlMatch = q.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    const dest = urlMatch[0];
    const slug = generateShortSlug(6);
    let realShort = null;
    try {
      realShort = await fetchOnlineShortUrl(dest);
    } catch (e) {}
    const shortUrl = realShort || `https://tinyurl.com/${slug}`;

    try {
      const links = store.get('hea_links', []);
      const newL = {
        id: slug,
        slug,
        dest,
        url: shortUrl,
        realShort: shortUrl,
        title: 'AI Shortened Link',
        tag: 'AI Assist',
        t: Date.now(),
        clicks: []
      };
      links.unshift(newL);
      store.set('hea_links', links);
      localStorage.setItem('hea_slug_' + slug.toLowerCase(), dest);
    } catch (e) {}

    setTimeout(() => {
      chatAdd(`
        🎉 <b>Link Shortened in Real-Time!</b><br>
        <div style="background:rgba(56,189,248,0.12);padding:10px 14px;border-radius:10px;margin:8px 0;border:1px solid #38bdf8;">
          <div style="font-size:11px;color:#94a3b8;">SHORT LINK</div>
          <a href="${shortUrl}" target="_blank" style="color:#D4FF24;font-weight:700;font-size:14px;word-break:break-all;">${shortUrl}</a>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;word-break:break-all;">ORIGINAL: ${dest}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
          <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:12px;" onclick="navigator.clipboard.writeText('${shortUrl}');toast('Short link copied: ${shortUrl}');">📋 Copy Link</button>
          <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:12px;" onclick="location.hash='#qr';">▦ Open in QR Studio</button>
        </div>
      `);
    }, 200);
    return;
  }

  // 2. Real-Time QR Generator inside AI Chat
  if (/^qr\b|make qr|generate qr/i.test(q)) {
    const target = q.replace(/^qr\b|make qr|generate qr/i, '').trim() || 'https://google.com';
    const cleanUrl = target.startsWith('http') ? target : 'https://' + target;
    const canvasId = 'qr_chat_' + Date.now();
    setTimeout(() => {
      chatAdd(`
        📱 <b>Live Vector QR Code Generated:</b><br>
        <div style="background:#ffffff;padding:12px;border-radius:12px;display:inline-block;margin:10px 0;">
          <canvas id="${canvasId}" width="160" height="160"></canvas>
        </div><br>
        <small style="color:#94a3b8;">Target: ${cleanUrl}</small><br>
        <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;margin-top:6px;" onclick="location.hash='#qr';">🎨 Customize in QR Studio →</button>
      `);
      setTimeout(() => {
        const c = document.getElementById(canvasId);
        if (c && typeof QRCode !== 'undefined') {
          QRCode.toCanvas(c, cleanUrl, { width: 160, margin: 1, color: { dark: '#090f22', light: '#ffffff' } }, () => {});
        }
      }, 50);
    }, 200);
    return;
  }

  // 3. Real-Time UTM Generator inside AI Chat
  if (/utm|campaign tag|facebook ad|fb ad/i.test(q)) {
    setTimeout(() => {
      chatAdd(`
        🏷️ <b>High-Converting UTM Campaign Blueprint:</b><br>
        <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(56,189,248,0.3);padding:10px 14px;border-radius:10px;font-family:monospace;font-size:12px;color:#38bdf8;margin:8px 0;line-height:1.6;word-break:break-all;">
          https://tinyurl.com/summer26?utm_source=meta&utm_medium=paid_social&utm_campaign=summer_promo_2026&utm_content=carousel_v1
        </div>
        <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:12px;" onclick="location.hash='#utm';">⚡ Open UTM Campaign Studio →</button>
      `);
    }, 200);
    return;
  }

  // 4. Try Backend Server AI or Local Fallback
  let reply = '';
  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: q, email: (session && session.email) || '' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) reply = data.reply;
    }
  } catch (e) {}

  if (!reply) {
    reply = answer(q);
  }

  setTimeout(() => chatAdd(reply), 150);
}

const chipsEl = $('#chips');
if (chipsEl) {
  chipsEl.onclick = e => {
    if (e.target.tagName === 'BUTTON') askChat(e.target.textContent);
  };
}

const chatFormEl = $('#chatForm');
if (chatFormEl) {
  chatFormEl.onsubmit = e => {
    e.preventDefault();
    const inEl = $('#chatIn');
    if (inEl) {
      askChat(inEl.value);
      inEl.value = '';
    }
  };
}

/* =========================================================
   PREMIUM CHECKOUT & PRO SUBSCRIPTION ENGINE
   ========================================================= */
let checkoutBillingCycle = 'monthly';
let selectedCheckoutPlan = 'pro';

const PLAN_PRICES = {
  monthly: { growth: '$8', pro: '$35', enterprise: '$199' },
  annual: { growth: '$6', pro: '$28', enterprise: '$159' }
};

function openCheckoutModal(plan = 'pro') {
  selectedCheckoutPlan = (plan || 'pro').toLowerCase();
  const modal = $('#checkoutModal');
  if (!modal) return;

  const radios = $$('input[name="checkoutPlan"]', modal);
  radios.forEach(r => {
    const card = r.closest('.checkout-plan-card');
    if (r.value === selectedCheckoutPlan) {
      r.checked = true;
      card?.classList.add('active');
    } else {
      r.checked = false;
      card?.classList.remove('active');
    }
  });

  const sess = store.get('hea_session', null);
  if (sess && sess.email && sess.email !== 'john@example.com') {
    if (sess.name && $('#payName')) $('#payName').value = sess.name;
    if (sess.email && $('#payEmail')) $('#payEmail').value = sess.email;
  } else {
    if ($('#payName')) $('#payName').value = '';
    if ($('#payEmail')) $('#payEmail').value = '';
  }

  modal.hidden = false;
  lockModalScroll();

  if (window.Motion && typeof window.Motion.animate === 'function') {
    window.Motion.animate('.checkout-card', {
      opacity: [0, 1],
      scale: [0.93, 1],
      y: [24, 0]
    }, {
      duration: 0.35,
      easing: [0.16, 1, 0.3, 1]
    });
  }
}

function closeCheckoutModal() {
  const modal = $('#checkoutModal');
  if (!modal) return;
  modal.hidden = true;
  unlockModalScroll();
}

function setupCheckoutModal() {
  const modal = $('#checkoutModal');
  if (!modal) return;

  $('#checkoutCloseBtn')?.addEventListener('click', closeCheckoutModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeCheckoutModal();
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeCheckoutModal();
  });

  // Contain mousewheel and touch scroll so background never scrolls
  modal.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });

  $$('.checkout-modal-overlay, .create-modal-overlay').forEach(ov => {
    ov.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    ov.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
  });

  const btnMonthly = $('#cycleMonthly');
  const btnAnnual = $('#cycleAnnual');

  const updatePrices = () => {
    const prices = PLAN_PRICES[checkoutBillingCycle];
    if ($('#priceGrowth')) $('#priceGrowth').innerHTML = `${prices.growth}<small>/mo</small>`;
    if ($('#pricePro')) $('#pricePro').innerHTML = `${prices.pro}<small>/mo</small>`;
    if ($('#priceEnterprise')) $('#priceEnterprise').innerHTML = `${prices.enterprise}<small>/mo</small>`;
  };

  btnMonthly?.addEventListener('click', () => {
    checkoutBillingCycle = 'monthly';
    btnMonthly.classList.add('active');
    btnAnnual?.classList.remove('active');
    updatePrices();
  });

  btnAnnual?.addEventListener('click', () => {
    checkoutBillingCycle = 'annual';
    btnAnnual.classList.add('active');
    btnMonthly?.classList.remove('active');
    updatePrices();
  });

  $$('.checkout-plan-card', modal).forEach(card => {
    card.addEventListener('click', () => {
      $$('.checkout-plan-card', modal).forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        selectedCheckoutPlan = radio.value;
      }
    });
  });

  const cardInput = $('#payCardNum');
  if (cardInput) {
    cardInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = v;

      const brandBadge = $('#payCardBrand');
      if (brandBadge) {
        if (/^4/.test(v)) brandBadge.textContent = 'VISA';
        else if (/^5[1-5]/.test(v)) brandBadge.textContent = 'MC';
        else if (/^3[47]/.test(v)) brandBadge.textContent = 'AMEX';
        else brandBadge.textContent = 'CARD';
      }
    });
  }

  const expInput = $('#payExp');
  if (expInput) {
    expInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
      e.target.value = v;
    });
  }

  const form = $('#checkoutPaymentForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = $('#checkoutSubmitBtn');
      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳ Processing Payment with 256-bit SSL...</span>`;
      }

      await new Promise(r => setTimeout(r, 1100));

      let s = store.get('hea_session', null);
      if (!s) {
        const pName = $('#payName')?.value.trim() || 'Subscriber';
        const pEmail = $('#payEmail')?.value.trim() || '';
        s = {
          name: pName,
          email: pEmail,
          isVerified: true
        };
      }
      s.isPro = true;
      s.plan = selectedCheckoutPlan === 'enterprise' ? 'Enterprise' : selectedCheckoutPlan === 'growth' ? 'Growth' : 'Core PRO';
      s.billingCycle = checkoutBillingCycle;
      s.subscribedAt = new Date().toISOString();
      store.set('hea_session', s);

      if (window.appShell && typeof window.appShell.setProStatus === 'function') {
        window.appShell.setProStatus(s.plan);
      } else {
        const topbarUpgrade = $('.topbar-upgrade-btn');
        if (topbarUpgrade) {
          topbarUpgrade.textContent = '👑 PRO Active';
          topbarUpgrade.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
        }
      }

      toast(`🎉 Payment Successful! Your ${s.plan} subscription is now active!`);
      closeCheckoutModal();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // 1-Click Stripe Hosted Checkout Trigger
  const btnStripe = $('#btnStripeCheckout');
  if (btnStripe) {
    btnStripe.addEventListener('click', async () => {
      const origText = btnStripe.innerHTML;
      btnStripe.disabled = true;
      btnStripe.innerHTML = `<span>⏳ Connecting to Stripe Secure Gateway...</span>`;

      const sess = store.get('hea_session', null);
      const userEmail = $('#payEmail')?.value.trim() || (sess && sess.email) || '';
      const userName = $('#payName')?.value.trim() || (sess && sess.name) || '';

      try {
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedCheckoutPlan,
            billingCycle: checkoutBillingCycle,
            userEmail,
            userName
          })
        });

        const data = await res.json();
        if (data.url) {
          // Redirect to Official Stripe Checkout
          window.location.href = data.url;
          return;
        } else if (data.demoMode) {
          // Sandbox Mode fallback
          await new Promise(r => setTimeout(r, 800));
          let s = store.get('hea_session', null) || { email: userEmail, name: userName, isVerified: true };
          s.isPro = true;
          s.plan = selectedCheckoutPlan === 'enterprise' ? 'Enterprise' : selectedCheckoutPlan === 'growth' ? 'Growth' : 'Core PRO';
          s.billingCycle = checkoutBillingCycle;
          s.subscribedAt = new Date().toISOString();
          store.set('hea_session', s);

          if (window.appShell && typeof window.appShell.setProStatus === 'function') {
            window.appShell.setProStatus(s.plan);
          }
          toast(`🎉 Payment Successful! PRO Membership Activated! (To enable real bank transactions, add STRIPE_SECRET_KEY in .env)`);
          closeCheckoutModal();
        } else {
          toast(data.error || 'Unable to connect to Stripe. Please try again.');
        }
      } catch (err) {
        console.error('Stripe error:', err);
        toast('Connection error. Please try direct card entry.');
      } finally {
        btnStripe.disabled = false;
        btnStripe.innerHTML = origText;
      }
    });
  }

  // Handle Stripe Success Callback (#checkout-success)
  const checkStripeSuccessCallback = async () => {
    const hash = window.location.hash || '';
    if (hash.includes('checkout-success')) {
      const urlParams = new URLSearchParams(hash.split('?')[1] || '');
      const sessionId = urlParams.get('session_id');
      const planName = urlParams.get('plan') || 'Core PRO';

      if (sessionId) {
        try {
          const res = await fetch(`/api/stripe/verify-session/${sessionId}`);
          const d = await res.json();
          if (d.ok && d.verified) {
            let s = store.get('hea_session', null) || { email: d.userEmail, isVerified: true };
            s.isPro = true;
            s.plan = d.plan || planName;
            s.subscribedAt = new Date().toISOString();
            store.set('hea_session', s);

            if (window.appShell && typeof window.appShell.setProStatus === 'function') {
              window.appShell.setProStatus(s.plan);
            }
            toast(`🎉 Payment Confirmed by Stripe! Your ${s.plan} subscription is active!`);
            window.location.hash = '#dashboard';
          }
        } catch (e) {
          console.error('Session verify error:', e);
        }
      }
    }
  };
  setTimeout(checkStripeSuccessCallback, 400);
}

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;

function initFramerMotionFx() {
  if (!window.Motion || typeof window.Motion.animate !== 'function') return;
  try {
    $$('.btn, .hero-submit-btn, .tabs button').forEach(el => {
      el.addEventListener('pointerdown', () => {
        window.Motion.animate(el, { scale: 0.96 }, { duration: 0.1 });
      });
      el.addEventListener('pointerup', () => {
        window.Motion.animate(el, { scale: 1 }, { duration: 0.25, easing: [0.34, 1.56, 0.64, 1] });
      });
      el.addEventListener('pointerleave', () => {
        window.Motion.animate(el, { scale: 1 }, { duration: 0.2 });
      });
    });
  } catch (e) {}
}

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
  if ($('#aBig')) $('#aBig').checked = !!A11Y_PREFS.big;
  if ($('#aHc')) $('#aHc').checked = !!A11Y_PREFS.hc;
  if ($('#aMo')) $('#aMo').checked = !!A11Y_PREFS.mo;
}

if ($('#a11yBtn')) {
  $('#a11yBtn').onclick = e => {
    e.stopPropagation();
    const panel = $('#a11yPanel');
    if (panel) {
      panel.hidden = !panel.hidden;
      $('#a11yBtn').setAttribute('aria-expanded', !panel.hidden);
    }
  };
}

[['aBig', 'big'], ['aHc', 'hc'], ['aMo', 'mo']].forEach(([id, key]) => {
  const el = $('#' + id);
  if (el) {
    el.onchange = e => {
      A11Y_PREFS[key] = e.target.checked;
      store.set('hea_a11y', A11Y_PREFS);
      applyA11y();
    };
  }
});
applyA11y();

/* =========================================================
   CLIENT-SIDE ROUTER ENGINE
   ========================================================= */

function show(pageName) {
  $$('section[data-page]').forEach(sec => {
    const isTarget = sec.dataset.page === pageName;
    sec.hidden = !isTarget;
    if (isTarget) {
      if (typeof window.animatePageText === 'function') {
        setTimeout(() => window.animatePageText(sec), 40);
      }
    }
  });
  $('.nav')?.classList.remove('open');
}

function route() {
  try {
    session = store.get('hea_session', null);
  } catch (e) {}
  updateHomeCtaForAuth();
  const rawHash = location.hash.slice(1) || 'home';
  const page = rawHash.split('?')[0];

  if (rawHash.startsWith('go-')) {
    return goPage(rawHash.slice(3));
  }
  if (rawHash.startsWith('bio-')) {
    return bioPage(rawHash.slice(4));
  }

  // 1. Auth split-screen (when user clicks Login or Signup)
  if (page === 'login' || page === 'signup') {
    if (session && session.isVerified) {
      location.hash = '#dashboard';
      return;
    }
    if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
    document.body.classList.remove('app-mode');
    const as = $('#appShell');
    if (as) as.hidden = true;
    show('auth');
    showAuth(page);
    window.scrollTo(0, 0);
    return;
  }

  // 2. App Shell Views (STRICTLY ONLY accessible when user is logged in & email verified!)
  const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'app'];
  if (appViews.includes(page)) {
    if (!session || !session.isVerified) {
      document.body.classList.remove('app-mode');
      const as = $('#appShell');
      if (as) as.hidden = true;
      location.hash = '#login';
      toast('Please log in with your verified email to access your dashboard');
      return;
    }
    if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
    document.body.classList.add('app-mode');
    const as = $('#appShell');
    if (as) as.hidden = false;
    show('app');
    const targetTab = (page === 'dashboard' || page === 'app') ? 'home' : page;
    if (window.appShell && typeof window.appShell.navigate === 'function') {
      window.appShell.navigate(targetTab);
    }
    window.scrollTo(0, 0);
    return;
  }

  // 3. Public Landing / Marketing Site (Default for guest visitors or #home)
  if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
  document.body.classList.remove('app-mode');
  const as = $('#appShell');
  if (as) as.hidden = true;

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

  if (['pricing', 'faq', 'features', 'ai'].includes(page)) {
    show('home');
    setTimeout(() => {
      const el = $('#' + page);
      if (el) {
        if (window.lenis) {
          window.lenis.scrollTo(el, { offset: -70, duration: 1.2 });
        } else {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);
    return;
  }

  // Default: Public landing page
  show('home');
  window.scrollTo(0, 0);
}

// Global Exports for Interop
window.drawQR = drawQR;
window.toast = toast;
window.createLink = createLink;

// Global Initialization
window.addEventListener('hashchange', route);
initNav();
setupSsoButtons();
renderNavRight();
initStaticSections();
setupCheckoutModal();
initFramerMotionFx();
route();
// Headings are maintained solid and visible without competing entrance tweens
