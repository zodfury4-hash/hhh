/**
 * Firebase Realtime Database Service for HEA Link
 * Project: healinks-4ea4d
 * Database: https://healinks-4ea4d-default-rtdb.firebaseio.com
 *
 * Stores all user data partitioned strictly by user email key:
 *   /users/<sanitized_email>/profile
 *   /users/<sanitized_email>/links/<slug>
 *   /users/<sanitized_email>/qrs/<id>
 *   /users/<sanitized_email>/bios/<slug>
 *   /users/<sanitized_email>/domains/<domainKey>
 *
 * Fast O(1) global lookup for redirects:
 *   /slugs/<slug>
 *   /bios/<slug>
 */

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
  const url = `${RTDB_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}.json`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
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
      console.warn(`[Firebase RTDB] ${options.method || 'GET'} ${endpoint} failed with ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Firebase RTDB Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    return null;
  }
}

const firebaseRtdb = {
  emailToKey,
  keyToEmail,
  databaseUrl: RTDB_BASE,

  // --- USERS & AUTH ---
  async getUser(email) {
    if (!email) return null;
    return await rtdbFetch(`/users/${emailToKey(email)}/profile`);
  },

  async getUserByEmailOrUsername(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    if (clean.includes('@')) {
      return await this.getUser(clean);
    }
    // Search across users
    const allUsers = await rtdbFetch('/users') || {};
    for (const k of Object.keys(allUsers)) {
      const u = allUsers[k]?.profile;
      if (u && (u.email === clean || u.username === clean)) return u;
    }
    return null;
  },

  async saveUser(email, profileData) {
    if (!email) return null;
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
    if (!email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/links`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveLink(email, linkObj) {
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

    // Save in user namespace
    await rtdbFetch(`/users/${key}/links/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(cleanLink)
    });

    // Save in global fast lookup table
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
    if (!slug) return null;
    return await rtdbFetch(`/slugs/${slug}`);
  },

  async deleteLink(email, slug) {
    if (!slug) return false;
    const key = emailToKey(email);
    await Promise.all([
      rtdbFetch(`/users/${key}/links/${slug}`, { method: 'DELETE' }),
      rtdbFetch(`/slugs/${slug}`, { method: 'DELETE' })
    ]);
    return true;
  },

  async recordClick(slug, meta = {}) {
    if (!slug) return;
    const slugData = await this.getLinkBySlug(slug);
    if (!slugData) return;

    const clickRecord = {
      timestamp: new Date().toISOString(),
      referer: meta.referer || 'direct',
      ip: meta.ip || '127.0.0.1',
      userAgent: meta.userAgent || ''
    };

    // Append to clicks
    await rtdbFetch(`/clicks/${slug}`, {
      method: 'POST',
      body: JSON.stringify(clickRecord)
    });

    // Update user's link clicks if ownerEmail is known
    if (slugData.ownerEmail && slugData.ownerEmail !== 'guest') {
      const key = emailToKey(slugData.ownerEmail);
      const userLink = await rtdbFetch(`/users/${key}/links/${slug}`) || {};
      const newClicks = Array.isArray(userLink.clicks) ? [...userLink.clicks, clickRecord] : [clickRecord];
      await rtdbFetch(`/users/${key}/links/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify({
          clicks: newClicks,
          clickCount: newClicks.length
        })
      });
    }
  },

  // --- QR CODES ---
  async getUserQrs(email) {
    if (!email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/qrs`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveQr(email, qrObj) {
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
    if (!id) return false;
    const key = emailToKey(email);
    await rtdbFetch(`/users/${key}/qrs/${id}`, { method: 'DELETE' });
    return true;
  },

  // --- BIO PAGES ---
  async getUserBios(email) {
    if (!email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/bios`);
    if (!data) return [];
    return Object.values(data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async saveBio(email, bioObj) {
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
    if (!slug) return null;
    return await rtdbFetch(`/bios/${slug}`);
  },

  // --- CUSTOM DOMAINS ---
  async getUserDomains(email) {
    if (!email) return [];
    const key = emailToKey(email);
    const data = await rtdbFetch(`/users/${key}/domains`);
    if (!data) return [];
    return Object.values(data);
  },

  async saveDomain(email, domainStr) {
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
