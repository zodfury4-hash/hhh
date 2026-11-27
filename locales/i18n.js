/**
 * HEA Link - Lightweight Client-Side Localization (i18n) Engine with RTL support
 *
 * Usage:
 *   await window.i18n.init('en'); // or 'ur', 'ar', etc.
 *   const heading = window.i18n.t('landing.hero.title_line1');
 */
(function (root) {
  const RTL_LOCALES = new Set(['ur', 'ar', 'he', 'fa']);

  const i18n = {
    currentLocale: 'en',
    dir: 'ltr',
    translations: {},

    async init(locale = 'en') {
      const cleanLocale = String(locale || 'en').toLowerCase().split('-')[0] || 'en';
      this.currentLocale = cleanLocale;
      this.dir = RTL_LOCALES.has(cleanLocale) ? 'rtl' : 'ltr';
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = cleanLocale;
        document.documentElement.dir = this.dir;
      }
      try {
        const res = await fetch(`/locales/${cleanLocale}.json`);
        if (res.ok) {
          this.translations = await res.json();
        }
      } catch (err) {
        console.warn(`[i18n] Failed to load locale "${cleanLocale}":`, err);
      }
      return this;
    },

    t(keyPath, fallback = '') {
      if (!keyPath) return fallback;
      const keys = keyPath.split('.');
      let val = this.translations;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return fallback || keyPath;
        }
      }
      return typeof val === 'string' ? val : (fallback || keyPath);
    },

    setTranslations(data) {
      this.translations = data || {};
    }
  };

  root.i18n = i18n;
})(typeof window !== 'undefined' ? window : this);
