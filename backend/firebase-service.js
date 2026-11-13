/**
 * Firebase Realtime Database Service - ISOLATED & DEPRECATED
 *
 * PRIMARY DATABASE: MongoDB (via Mongoose models: User, Link, QRCode, BioPage, CustomDomain).
 * All production user data, links, QR codes, bio pages, custom domains, and analytics
 * are stored in MongoDB as the single source of truth.
 *
 * Firebase Realtime Database is ISOLATED and disabled by default (ENABLE_FIREBASE_RTDB=false).
 * No unauthenticated or redundant network requests are sent to Firebase RTDB during normal operations.
 *
 * NOTE: The client-side Firebase SDK (`js/auth/firebase-config.js`) is retained strictly and
 * exclusively for browser Google Sign-In popup authentication (`firebase.auth.GoogleAuthProvider`).
 */

const ENABLE_RTDB = process.env.ENABLE_FIREBASE_RTDB === 'true';
const RTDB_BASE = process.env.FIREBASE_DATABASE_URL || 'https://healinks-4ea4d-default-rtdb.firebaseio.com';

function emailToKey(email) {
  if (!email) return 'guest';
  return String(email).toLowerCase().trim().replace(/[\.\$\#\[\]\/]/g, '_dot_');
}

function keyToEmail(key) {
  if (!key) return '';
  return String(key).replace(/_dot_/g, '.');
}

async function rtdbFetch(endpoint, options = {}) {
  if (!ENABLE_RTDB) {
    return null;
  }

  const url = `${RTDB_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}.json`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    return null;
  }
}

const firebaseRtdb = {
  emailToKey,
  keyToEmail,
  databaseUrl: RTDB_BASE,
  isEnabled: ENABLE_RTDB,

  // --- USERS & AUTH ---
  async getUser(email) {
    if (!ENABLE_RTDB || !email) return null;
    return await rtdbFetch(`/users/${emailToKey(email)}/profile`);
  },

  async getUserByEmailOrUsername(identifier) {
    if (!ENABLE_RTDB || !identifier) return null;
    const clean = identifier.trim().toLowerCase();
    if (clean.includes('@')) {
      return await this.getUser(clean);
    }
    const allUsers = await rtdbFetch('/users') || {};
    for (const k of Object.keys(allUsers)) {
      const u = allUsers[k]?.profile;
      if (u && (u.email === clean || u.username === clean)) return u;
    }
    return null;
  },

  async saveUser(email, profileData) {
    if (!ENABLE_RTDB || !email) return null;
    const key = emailToKey(email);
    const existing = await this.getUser(email) || {};
    const updated = {
      ...existing,
      ...profileData,
      email: email.trim().toLowerCase(),
      updatedAt: new Date().toISOString()
    };
    if (!updated.createdAt) updated.createdAt = new Date().toISOString();
    await rtdbFetch(`/users/${key}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    return updated;
  },

  // --- SHORT LINKS ---
  async getUserLinks(email) {
    if (!ENABLE_RTDB || !email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/links`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveLink(email, linkObj) {
    if (!ENABLE_RTDB) return linkObj;
    const key = emailToKey(email);
    const slug = linkObj.slug;
    const cleanLink = {
      ...linkObj,
      ownerEmail: email ? email.trim().toLowerCase() : 'guest',
      createdAt: linkObj.createdAt || new Date().toISOString(),
      clicks: Array.isArray(linkObj.clicks) ? linkObj.clicks : [],
      clickCount: Array.isArray(linkObj.clicks) ? linkObj.clicks.length : (linkObj.clicks || 0),
      scans: linkObj.scans || 0
    };

    await rtdbFetch(`/users/${key}/links/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(cleanLink)
    });

    await rtdbFetch(`/slugs/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({
        slug,
        dest: cleanLink.dest,
        ownerEmail: cleanLink.ownerEmail,
        title: cleanLink.title || 'Untitled',
        tag: cleanLink.tag || 'Website',
        createdAt: cleanLink.createdAt,
        password: cleanLink.password || null,
        expiresAt: cleanLink.expiresAt || null
      })
    });

    return cleanLink;
  },

  async getLinkBySlug(slug) {
    if (!ENABLE_RTDB || !slug) return null;
    return await rtdbFetch(`/slugs/${slug}`);
  },

  async deleteLink(email, slug) {
    if (!ENABLE_RTDB || !slug) return true;
    const key = emailToKey(email);
    await Promise.all([
      rtdbFetch(`/users/${key}/links/${slug}`, { method: 'DELETE' }),
      rtdbFetch(`/slugs/${slug}`, { method: 'DELETE' })
    ]);
    return true;
  },

  async recordClick(slug, meta = {}) {
    if (!ENABLE_RTDB || !slug) return;
    const clickRecord = {
      timestamp: new Date().toISOString(),
      referer: meta.referer || 'direct',
      ip: meta.ip || '127.0.0.1',
      userAgent: meta.userAgent || ''
    };
    await rtdbFetch(`/clicks/${slug}`, {
      method: 'POST',
      body: JSON.stringify(clickRecord)
    });
  },

  // --- QR CODES ---
  async getUserQrs(email) {
    if (!ENABLE_RTDB || !email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/qrs`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveQr(email, qrObj) {
    if (!ENABLE_RTDB) return qrObj;
    const key = emailToKey(email);
    const id = qrObj.id || 'qr_' + Date.now();
    const cleanQr = {
      ...qrObj,
      id,
      ownerEmail: email ? email.trim().toLowerCase() : 'guest',
      createdAt: qrObj.createdAt || new Date().toISOString()
    };
    await rtdbFetch(`/users/${key}/qrs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanQr)
    });
    return cleanQr;
  },

  async deleteQr(email, id) {
    if (!ENABLE_RTDB || !id) return true;
    const key = emailToKey(email);
    await rtdbFetch(`/users/${key}/qrs/${id}`, { method: 'DELETE' });
    return true;
  },

  // --- BIO PAGES ---
  async getUserBios(email) {
    if (!ENABLE_RTDB || !email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/bios`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveBio(email, bioObj) {
    if (!ENABLE_RTDB) return bioObj;
    const key = emailToKey(email);
    const slug = bioObj.slug;
    const cleanBio = {
      ...bioObj,
      ownerEmail: email ? email.trim().toLowerCase() : 'guest',
      createdAt: bioObj.createdAt || new Date().toISOString()
    };
    await rtdbFetch(`/users/${key}/bios/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(cleanBio)
    });
    await rtdbFetch(`/bios/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(cleanBio)
    });
    return cleanBio;
  },

  async getBioBySlug(slug) {
    if (!ENABLE_RTDB || !slug) return null;
    return await rtdbFetch(`/bios/${slug}`);
  },

  // --- CUSTOM DOMAINS ---
  async getUserDomains(email) {
    if (!ENABLE_RTDB || !email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/domains`);
    if (!data) return [];
    return Object.values(data);
  },

  async saveDomain(email, domainStr) {
    if (!ENABLE_RTDB) {
      return {
        domain: domainStr.toLowerCase(),
        ownerEmail: email ? email.trim().toLowerCase() : 'guest',
        status: 'active',
        targetCname: 'cname.healink.store',
        createdAt: new Date().toISOString()
      };
    }
    const key = emailToKey(email);
    const domKey = domainStr.toLowerCase().replace(/[\.\$\#\[\]\/]/g, '_');
    const domainObj = {
      domain: domainStr.toLowerCase(),
      ownerEmail: email ? email.trim().toLowerCase() : 'guest',
      status: 'active',
      targetCname: 'cname.healink.store',
      createdAt: new Date().toISOString()
    };
    await rtdbFetch(`/users/${key}/domains/${domKey}`, {
      method: 'PUT',
      body: JSON.stringify(domainObj)
    });
    return domainObj;
  }
};

module.exports = firebaseRtdb;
