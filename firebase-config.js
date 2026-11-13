/**
 * Firebase Client Configuration & Authentication Helper for HEA Link
 * Project ID: healinks-4ea4d
 * Realtime Database: https://healinks-4ea4d-default-rtdb.firebaseio.com
 */

const FIREBASE_CONFIG = {
  projectId: "healinks-4ea4d",
  appId: "1:508844833856:web:9053c0ceaf467efb9cb3a5",
  databaseURL: "https://healinks-4ea4d-default-rtdb.firebaseio.com",
  storageBucket: "healinks-4ea4d.firebasestorage.app",
  apiKey: "AIzaSyA2M_oEr5dymNNr26XrtSsdmAvN3xO-OHg",
  authDomain: "healinks-4ea4d.firebaseapp.com",
  messagingSenderId: "508844833856",
  measurementId: "G-BYX6TD128H",
  projectNumber: "508844833856"
};

function isVipAdminEmail() {
  return false;
}

function emailToKey(email) {
  if (!email) return 'guest';
  return String(email).toLowerCase().trim().replace(/[\.\$\#\[\]\/]/g, '_dot_');
}

// Client-side Firebase Realtime Database persistence engine
const fbRtdbClient = {
  baseUrl: FIREBASE_CONFIG.databaseURL,

  async rtdbFetch(path, method = 'GET', data = null) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}.json`;
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (data && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
        opts.body = JSON.stringify(data);
      }
      const res = await fetch(url, opts);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[fbRtdbClient REST error]', path, e.message);
      return null;
    }
  },

  async saveUser(email, profileData = {}) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const key = emailToKey(cleanEmail);
    const isVip = isVipAdminEmail(cleanEmail);
    const payload = {
      email: cleanEmail,
      name: profileData.name || (cleanEmail.split('@')[0]),
      isVerified: true,
      isPro: isVip ? true : !!profileData.isPro,
      isAdmin: isVip ? true : !!profileData.isAdmin,
      plan: isVip ? 'Unlimited' : (profileData.plan || 'Free'),
      updatedAt: new Date().toISOString()
    };
    if (profileData.createdAt) payload.createdAt = profileData.createdAt;

    // 1. Native Firebase Database SDK write
    try {
      if (typeof window !== 'undefined' && window.fbDb) {
        window.fbDb.ref(`users/${key}/profile`).update(payload);
      }
    } catch (e) {}

    // 2. Direct REST write for guaranteed persistence
    await this.rtdbFetch(`/users/${key}/profile`, 'PUT', payload);
    console.log('✅ [Firebase RTDB] User profile saved:', cleanEmail);
    return payload;
  },

  async saveLink(email, linkObj) {
    if (!linkObj || !linkObj.slug) return null;
    const cleanEmail = (email || 'guest').toLowerCase().trim();
    const key = emailToKey(cleanEmail);
    const slug = linkObj.slug;
    const cleanLink = {
      id: linkObj.id || 'lnk_' + Date.now(),
      slug: slug,
      dest: linkObj.dest || linkObj.url || '',
      url: linkObj.url || linkObj.dest || '',
      title: linkObj.title || 'Untitled Link',
      tag: linkObj.tag || 'Website',
      ownerEmail: cleanEmail,
      clicks: typeof linkObj.clicks === 'number' ? linkObj.clicks : (Array.isArray(linkObj.clicks) ? linkObj.clicks.length : 0),
      scans: typeof linkObj.scans === 'number' ? linkObj.scans : 0,
      createdAt: linkObj.createdAt || new Date().toISOString()
    };

    // 1. Native Firebase Database SDK write
    try {
      if (typeof window !== 'undefined' && window.fbDb) {
        window.fbDb.ref(`users/${key}/links/${slug}`).set(cleanLink);
        window.fbDb.ref(`slugs/${slug}`).set({
          slug,
          dest: cleanLink.dest,
          ownerEmail: cleanEmail,
          title: cleanLink.title,
          tag: cleanLink.tag,
          createdAt: cleanLink.createdAt
        });
      }
    } catch (e) {}

    // 2. Direct REST write
    await Promise.all([
      this.rtdbFetch(`/users/${key}/links/${slug}`, 'PUT', cleanLink),
      this.rtdbFetch(`/slugs/${slug}`, 'PUT', {
        slug,
        dest: cleanLink.dest,
        ownerEmail: cleanEmail,
        title: cleanLink.title,
        tag: cleanLink.tag,
        createdAt: cleanLink.createdAt
      })
    ]);
    console.log('✅ [Firebase RTDB] Link saved:', slug);
    return cleanLink;
  },

  async deleteLink(email, slug) {
    if (!slug) return false;
    const cleanEmail = (email || 'guest').toLowerCase().trim();
    const key = emailToKey(cleanEmail);
    try {
      if (typeof window !== 'undefined' && window.fbDb) {
        window.fbDb.ref(`users/${key}/links/${slug}`).remove();
        window.fbDb.ref(`slugs/${slug}`).remove();
      }
    } catch (e) {}
    await Promise.all([
      this.rtdbFetch(`/users/${key}/links/${slug}`, 'DELETE'),
      this.rtdbFetch(`/slugs/${slug}`, 'DELETE')
    ]);
    return true;
  },

  async saveQr(email, qrObj) {
    if (!qrObj) return null;
    const cleanEmail = (email || 'guest').toLowerCase().trim();
    const key = emailToKey(cleanEmail);
    const id = qrObj.id || 'qr_' + Date.now();
    const cleanQr = {
      ...qrObj,
      id,
      ownerEmail: cleanEmail,
      createdAt: qrObj.createdAt || new Date().toISOString()
    };
    try {
      if (typeof window !== 'undefined' && window.fbDb) {
        window.fbDb.ref(`users/${key}/qrs/${id}`).set(cleanQr);
      }
    } catch (e) {}
    await this.rtdbFetch(`/users/${key}/qrs/${id}`, 'PUT', cleanQr);
    console.log('✅ [Firebase RTDB] QR saved:', id);
    return cleanQr;
  },

  async saveBio(email, bioObj) {
    if (!bioObj || !bioObj.slug) return null;
    const cleanEmail = (email || 'guest').toLowerCase().trim();
    const key = emailToKey(cleanEmail);
    const slug = bioObj.slug;
    const cleanBio = {
      ...bioObj,
      ownerEmail: cleanEmail,
      createdAt: bioObj.createdAt || new Date().toISOString()
    };
    try {
      if (typeof window !== 'undefined' && window.fbDb) {
        window.fbDb.ref(`users/${key}/bios/${slug}`).set(cleanBio);
        window.fbDb.ref(`bios/${slug}`).set(cleanBio);
      }
    } catch (e) {}
    await Promise.all([
      this.rtdbFetch(`/users/${key}/bios/${slug}`, 'PUT', cleanBio),
      this.rtdbFetch(`/bios/${slug}`, 'PUT', cleanBio)
    ]);
    console.log('✅ [Firebase RTDB] Bio saved:', slug);
    return cleanBio;
  }
};

// Global browser exports
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.isVipAdminEmail = isVipAdminEmail;
  window.emailToKey = emailToKey;
  window.fbRtdbClient = fbRtdbClient;

  // Initialize Firebase App, Auth & Realtime Database when SDK is loaded
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      if (typeof firebase.auth === 'function') {
        window.fbAuth = firebase.auth();
      }
      if (typeof firebase.database === 'function') {
        window.fbDb = firebase.database();
        console.log('✅ Firebase Realtime Database initialized for HEA Link:', FIREBASE_CONFIG.projectId);
      }
      console.log('✅ Firebase Authentication initialized for HEA Link:', FIREBASE_CONFIG.projectId);
    } catch (e) {
      console.warn('Firebase init warning:', e.message);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIREBASE_CONFIG,
    isVipAdminEmail,
    emailToKey,
    fbRtdbClient
  };
}
