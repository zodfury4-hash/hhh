(function () {
  function clearSession() {
    try {
      sessionStorage.removeItem('hea_session');
      localStorage.removeItem('hea_session');
      sessionStorage.removeItem('hea_token');
      localStorage.removeItem('hea_token');
    } catch (_e) {}
  }

  function isJwtExpired(token) {
    try {
      if (!token || typeof token !== 'string') return true;
      var parts = token.split('.');
      if (parts.length !== 3) return true;
      var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var payload = JSON.parse(atob(b64));
      if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) return true;
      return false;
    } catch (_e) {
      return true;
    }
  }

  try {
    var h = (window.location.hash || '').split('?')[0].toLowerCase();
    var raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
    var s = raw ? JSON.parse(raw) : null;
    var token = (s && s.token) || sessionStorage.getItem('hea_token') || localStorage.getItem('hea_token') || '';
    var isValid = !!(s && s.isVerified && s.email && s.email !== 'john@example.com' && token && !isJwtExpired(token));

    if (!isValid) {
      clearSession();
      if (h === '#signup') {
        window.location.replace('/#signup');
      } else if (h === '' || h === '#home') {
        window.location.replace('/');
      } else {
        window.location.replace('/#login');
      }
      return;
    }

    if (h === '' || h === '#home' || h === '#app' || h === '#login' || h === '#signup') {
      window.location.hash = '#dashboard';
    }
  } catch (_e) {
    clearSession();
    window.location.replace('/#login');
  }
})();
