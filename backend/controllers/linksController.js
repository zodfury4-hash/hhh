'use strict';

const Link = require('../models/Link');
const memStore = require('../utils/memStore');
const { isDbConnected, isMemStoreAllowed, createDbUnavailableError } = require('../middleware/dbCheck');
const { RESERVED_SLUGS } = require('../middleware/validation');
const { inspectUrlSecurity } = require('../services/abuse-service');
const { generateCryptoSlug } = require('../utils/slugGenerator');

/**
 * Resolve a fallback external shortener URL when available.
 */
async function getRealWorkingShortUrl(destUrl) {
  if (!destUrl) return null;
  try {
    const tuRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(destUrl));
    if (tuRes.ok) {
      const text = (await tuRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (_e) {}

  try {
    const isRes = await fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(destUrl));
    if (isRes.ok) {
      const text = (await isRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (_e) {}

  return null;
}

/**
 * POST /api/shorten-online — Public anonymous quick-shorten endpoint with SSRF & slug collision protection.
 */
async function shortenOnlineHandler(req, res) {
  try {
    const { url, slug: requestedSlug } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Destination URL is required' });
    }

    const rawUrl = url.trim();
    if (rawUrl.length > 2048) {
      return res.status(400).json({ error: 'URL exceeds maximum length of 2048 characters', code: 'URL_TOO_LONG' });
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawUrl) && !/^https?:\/\//i.test(rawUrl)) {
      return res.status(400).json({ error: 'Only http:// and https:// URLs are allowed.', code: 'URL_BLOCKED' });
    }

    const dest = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
    if (dest.length > 2048) {
      return res.status(400).json({ error: 'URL exceeds maximum length of 2048 characters', code: 'URL_TOO_LONG' });
    }

    try {
      const parsed = new URL(dest);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return res.status(400).json({ error: 'Please enter a valid public domain URL.', code: 'URL_INVALID' });
      }
    } catch (_urlErr) {
      return res.status(400).json({ error: 'Please enter a valid URL.', code: 'URL_INVALID' });
    }

    const securityCheck = await inspectUrlSecurity(dest);
    if (!securityCheck.safe) {
      return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
    }

    const hasCustomSlug = typeof requestedSlug === 'string' && requestedSlug.trim().length > 0;
    let finalSlug = hasCustomSlug ? requestedSlug.trim().toLowerCase() : generateCryptoSlug(6).toLowerCase();

    if (hasCustomSlug) {
      if (finalSlug.length < 2 || finalSlug.length > 60 || !/^[a-zA-Z0-9_-]+$/.test(finalSlug)) {
        return res.status(400).json({
          error: 'Back-half must be 2–60 characters using letters, numbers, hyphens, or underscores.'
        });
      }
      if (RESERVED_SLUGS.has(finalSlug)) {
        return res.status(400).json({ error: 'This slug is reserved by the system. Please choose another.' });
      }
    } else {
      while (RESERVED_SLUGS.has(finalSlug)) {
        finalSlug = generateCryptoSlug(6).toLowerCase();
      }
    }

    if (isDbConnected()) {
      let clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        if (hasCustomSlug) {
          return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
        }
        for (let i = 0; i < 5 && clash; i++) {
          finalSlug = generateCryptoSlug(6).toLowerCase();
          clash = await Link.findOne({ slug: finalSlug });
        }
        if (clash) {
          return res.status(409).json({ error: 'Unable to allocate unique slug. Please retry.', code: 'SLUG_COLLISION' });
        }
      }
      try {
        const l = new Link({
          ownerEmail: 'guest',
          dest,
          slug: finalSlug,
          title: 'Quick Shortlink',
          tag: 'General',
          qr: true
        });
        await l.save();
      } catch (e) {
        if (e.code === 11000) {
          return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
        }
        throw e;
      }
    } else if (isMemStoreAllowed()) {
      let clash = memStore.links.find((l) => l.slug.toLowerCase() === finalSlug);
      if (clash) {
        if (hasCustomSlug) {
          return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
        }
        for (let i = 0; i < 5 && clash; i++) {
          finalSlug = generateCryptoSlug(6).toLowerCase();
          clash = memStore.links.find((l) => l.slug.toLowerCase() === finalSlug);
        }
      }
      memStore.links.unshift({
        id: 'lnk_' + Date.now(),
        ownerEmail: 'guest',
        dest,
        slug: finalSlug,
        title: 'Quick Shortlink',
        tag: 'General',
        qr: true,
        createdAt: new Date()
      });
    } else {
      throw createDbUnavailableError();
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;

    return res.json({
      success: true,
      shortUrl: localShort,
      realShort: localShort,
      localShort,
      slug: finalSlug,
      dest
    });
  } catch (e) {
    if (e.statusCode === 503) {
      return res.status(503).json({ ok: false, error: e.message, code: e.code });
    }
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

/**
 * POST /api/shorten — Quick shortlink creation supporting optional authentication.
 */
async function shortenLegacyHandler(req, res) {
  try {
    let { url, slug, tag, realShort } = req.body;
    if (!url) return res.status(400).json({ error: 'Destination URL is required' });

    let dest = url.trim();
    if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest;

    const securityCheck = await inspectUrlSecurity(dest);
    if (!securityCheck.safe) {
      return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
    }

    const finalSlug = (slug || generateCryptoSlug(6)).trim().toLowerCase();
    if (RESERVED_SLUGS.has(finalSlug)) {
      return res.status(400).json({ error: 'This slug is reserved. Please pick another back-half.' });
    }

    const ownerEmail = req.user && req.user.email ? req.user.email : 'guest';

    if (!realShort) {
      realShort = await getRealWorkingShortUrl(dest);
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShortUrl = realShort && realShort !== dest ? realShort : localShort;

    let link = null;
    if (isDbConnected()) {
      const clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
      }

      link = new Link({
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0
      });
      await link.save();
    } else if (isMemStoreAllowed()) {
      const clash = memStore.links.find((l) => l.slug.toLowerCase() === finalSlug);
      if (clash) {
        return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
      }
      link = {
        id: 'lnk_' + Date.now(),
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0,
        createdAt: new Date()
      };
      memStore.links.unshift(link);
    } else {
      throw createDbUnavailableError();
    }

    return res.json({
      success: true,
      slug: finalSlug,
      dest,
      shortUrl: cleanShortUrl,
      realShort: cleanShortUrl,
      redirectUrl: cleanShortUrl,
      link
    });
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This custom back-half is already taken', code: 'SLUG_COLLISION' });
    }
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
}

/**
 * GET /api/links — Return all links owned by the authenticated user (or all for admin).
 */
async function listLinksHandler(req, res) {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    let list = [];

    if (isDbConnected()) {
      const query = isAdmin ? {} : { ownerEmail: email };
      list = await Link.find(query).sort({ createdAt: -1 });
    } else if (isMemStoreAllowed()) {
      list = isAdmin ? memStore.links : memStore.links.filter((l) => l.ownerEmail === email);
    } else {
      throw createDbUnavailableError();
    }

    const host = req.get('host') || 'healink.store';
    const formatted = list.map((l) => ({
      id: l._id || l.id,
      ownerEmail: l.ownerEmail,
      slug: l.slug,
      dest: l.dest,
      url: `https://${host}/${l.slug}`,
      redirectUrl: `https://${host}/r/${l.slug}`,
      title: l.title || 'Untitled Link',
      tag: l.tag || 'General',
      clicks:
        l.humanClicks ??
        l.totalClicks ??
        (Array.isArray(l.clicks) ? l.clicks.length : typeof l.clicks === 'number' ? l.clicks : 0),
      scans: l.scans || 0,
      hasPassword: !!(l.passwordHash || l.password),
      expiresAt: l.expiresAt || null,
      maxClicks: l.maxClicks || null,
      utm: l.utm || null,
      createdAt: l.createdAt
    }));

    return res.json({ links: formatted });
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = {
  getRealWorkingShortUrl,
  shortenOnlineHandler,
  shortenLegacyHandler,
  listLinksHandler
};
