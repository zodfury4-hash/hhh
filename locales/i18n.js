/**
 * HEA Link - Lightweight Client-Side Localization (i18n) Engine
 * 
 * Usage:
 *   await window.i18n.init('en'); // or 'ur', 'ar', 'es', etc.
 *   const heading = window.i18n.t('landing.hero.title_line1');
 *   const saveBtn = window.i18n.t('common.actions.save');
 */
(function (root) {
  const i18n = {
    currentLocale: 'en',
    translations: {},

    async init(locale = 'en') {
      this.currentLocale = locale;
      try {
        const res = await fetch(`/locales/${locale}.json`);
        if (res.ok) {
          this.translations = await res.json();
        }
      } catch (err) {
        console.warn(`[i18n] Failed to load locale "${locale}":`, err);
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
