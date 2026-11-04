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

// Default Unlimited Admin VIP Accounts
const VIP_ADMIN_ACCOUNTS = {
  'furyzod02@gmail.com': { name: 'Fury Zod', pass: '123456789' },
  'arfatghuman86@gmail.com': { name: 'Arfat Ghuman', pass: '123456789' },
  'emanxhaudhry2005@gmail.com': { name: 'Eman Chaudhry', pass: '123456789' },
  'hayyamameer3030@gmail.com': { name: 'Hayyam Ameer', pass: '123456789' }
};

function isVipAdminEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return !!VIP_ADMIN_ACCOUNTS[clean];
}

// Global browser exports
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.VIP_ADMIN_ACCOUNTS = VIP_ADMIN_ACCOUNTS;
  window.isVipAdminEmail = isVipAdminEmail;

  // Initialize Firebase App & Auth when Firebase SDK is present
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      window.fbAuth = firebase.auth();
      console.log('✅ Firebase Authentication initialized for HEA Link:', FIREBASE_CONFIG.projectId);
    } catch (e) {
      console.warn('Firebase init warning:', e.message);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIREBASE_CONFIG,
    VIP_ADMIN_ACCOUNTS,
    isVipAdminEmail
  };
}
