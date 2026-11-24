/**
 * HEA Link Shared UTM Normalization & URL Builder
 * Standard GA4 Attribution Module
 * Isomorphic (Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HeaUtm = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PRESETS = {
    google_ads: {
      name: 'Google Ads',
      source: 'google',
      medium: 'cpc'
    },
    meta: {
      name: 'Facebook / Meta',
      source: 'facebook',
      medium: 'paid_social'
    },
    instagram: {
      name: 'Instagram',
      source: 'instagram',
      medium: 'paid_social'
    },
    tiktok: {
      name: 'TikTok',
      source: 'tiktok',
      medium: 'paid_social'
    },
    linkedin: {
      name: 'LinkedIn',
      source: 'linkedin',
      medium: 'paid_social'
    },
    newsletter: {
      name: 'Email Newsletter',
      source: 'newsletter',
      medium: 'email'
    },
    twitter: {
      name: 'Twitter / X',
      source: 'twitter',
      medium: 'social'
    }
  };

  /**
   * Normalizes a UTM parameter according to standard GA4 conventions
   * - Trim whitespace
   * - Lowercase (prevents GA4 reporting fragmentation)
   * - Replaces spaces with hyphens
   * - Strips illegal characters: only a-z, 0-9, _, -, . allowed
   * - Collapses consecutive hyphens
   */
  function normalizeParam(val, options = {}) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (!str) return '';

    const lower = options.lowercase !== false;
    if (lower) {
      str = str.toLowerCase();
    }

    // Replace whitespace with hyphens
    str = str.replace(/\s+/g, '-');

    // Strip characters that disrupt URL analytics
    if (lower) {
      str = str.replace(/[^a-z0-9_.-]/g, '');
    } else {
      str = str.replace(/[^a-zA-Z0-9_.-]/g, '');
    }

    // Collapse multiple hyphens into a single hyphen
    str = str.replace(/-+/g, '-');

    // Remove leading and trailing hyphens/dots
    str = str.replace(/^[-.]+|[-.]+$/g, '');

    return str;
  }

  /**
   * Validates a destination URL
   */
  function validateDestination(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { valid: false, error: 'Destination URL is required' };
    }
    const trimmed = rawUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return { valid: false, error: 'Destination URL must start with http:// or https://' };
    }
    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname || parsed.hostname.indexOf('.') === -1 && parsed.hostname !== 'localhost') {
        return { valid: false, error: 'Destination URL must include a valid domain' };
      }
      return { valid: true, url: parsed };
    } catch (_e) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Builds a UTM tagged URL preserving existing query parameters and hash
   * @param {string} destination - Base destination URL
   * @param {object} params - UTM parameters { source, medium, campaign, term, content }
   * @param {object} options - Options { normalize: true, lowercase: true }
   */
  function buildUtmUrl(destination, params = {}, options = {}) {
    const normalize = options.normalize !== false;
    const validation = validateDestination(destination);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const url = new URL(validation.url.toString());

    const keys = [
      { key: 'utm_source', val: params.utm_source || params.source },
      { key: 'utm_medium', val: params.utm_medium || params.medium },
      { key: 'utm_campaign', val: params.utm_campaign || params.campaign },
      { key: 'utm_term', val: params.utm_term || params.term },
      { key: 'utm_content', val: params.utm_content || params.content }
    ];

    for (const item of keys) {
      if (item.val !== undefined && item.val !== null && String(item.val).trim() !== '') {
        const finalVal = normalize
          ? normalizeParam(item.val, options)
          : String(item.val).trim();
        if (finalVal) {
          url.searchParams.set(item.key, finalVal);
        } else {
          url.searchParams.delete(item.key);
        }
      }
    }

    return url.toString();
  }

  /**
   * Parses an existing URL and extracts its UTM parameters
   */
  function parseUtmUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      const utm = {};
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      for (const k of utmKeys) {
        if (url.searchParams.has(k)) {
          utm[k] = url.searchParams.get(k);
        }
      }
      return {
        valid: true,
        destination: `${url.origin}${url.pathname}`,
        utm,
        hash: url.hash
      };
    } catch (_e) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  return {
    PRESETS,
    normalizeParam,
    validateDestination,
    buildUtmUrl,
    parseUtmUrl
  };
});
