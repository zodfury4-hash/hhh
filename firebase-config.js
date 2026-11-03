/**
 * Firebase Client Configuration for HEA Link
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

if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIREBASE_CONFIG;
}
