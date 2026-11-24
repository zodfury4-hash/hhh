const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const Link = require('../models/Link');
const BioPage = require('../models/BioPage');
const CustomDomain = require('../models/CustomDomain');
const memStore = require('../utils/memStore');
const { isDbConnected, isMemStoreAllowed, createDbUnavailableError } = require('../middleware/dbCheck');
const config = require('../config');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { linkCreateLimiter, bulkShortenLimiter, passwordAttemptLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  createLinkSchema,
  updateLinkSchema,
  bulkShortenSchema,
  isValidDestinationUrl,
  RESERVED_SLUGS
} = require('../middleware/validation');
const { inspectUrlSecurity } = require('../services/abuse-service');
const { recordClick } = require('../services/telemetry-service');
const { isSlugAuthorized, setSlugCookie } = require('../utils/cookieAuth');
const { renderPasswordChallengeHtml, renderExpiredLinkHtml } = require('../utils/protectedLinkHtml');
const { generateCryptoSlug } = require('../utils/slugGenerator');
const { getEntitlements, assertWithinLimit } = require('../config/plans');
const { createNotification } = require('../services/notificationService');

// Working short URL helper (TinyURL fallback)
async function getRealWorkingShortUrl(destUrl) {
  if (!destUrl) return null;
  try {
    const tuRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(destUrl));
    if (tuRes.ok) {
      const text = (await tuRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (e) {}

  try {
    const isRes = await fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(destUrl));
    if (isRes.ok) {
      const text = (await isRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (e) {}

  return null;
}

/* =========================================================
   PUBLIC QUICK SHORTENER (WITH ABUSE / SSRF FILTRATION)
   ========================================================= */

router.post('/api/shorten-online', linkCreateLimiter, async (req, res) => {
  try {
    const { url, slug: requestedSlug } = req.body;
    if (!url) return res.status(400).json({ error: 'Destination URL is required' });

    let dest = url.trim();
    if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest;

    const securityCheck = await inspectUrlSecurity(dest);
    if (!securityCheck.safe) {
      return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
    }

    const finalSlug = (requestedSlug || generateCryptoSlug(6)).trim().toLowerCase();
    if (RESERVED_SLUGS.has(finalSlug)) {
      return res.status(400).json({ error: 'This slug is reserved by the system. Please choose another.' });
    }

    let realShort = await getRealWorkingShortUrl(dest);
    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShort = realShort && realShort !== dest ? realShort : localShort;

    if (isDbConnected()) {
      try {
        const clash = await Link.findOne({ slug: finalSlug });
        if (!clash) {
          const l = new Link({
            ownerEmail: 'guest',
            dest,
            slug: finalSlug,
            title: 'Quick Shortlink',
            tag: 'General',
            qr: true
          });
          await l.save();
        }
      } catch (e) {
        if (e.code === 11000 && requestedSlug) {
          return res.status(409).json({ error: 'Back-half is already taken', code: 'SLUG_COLLISION' });
        }
      }
    } else if (isMemStoreAllowed()) {
      const clash = memStore.links.find((l) => l.slug.toLowerCase() === finalSlug);
      if (!clash) {
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
      }
    } else {
      throw createDbUnavailableError();
    }

    return res.json({
      success: true,
      shortUrl: cleanShort,
      realShort: cleanShort,
      localShort,
      slug: finalSlug,
      dest
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/api/shorten', linkCreateLimiter, optionalAuth, async (req, res) => {
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

    res.json({
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/* =========================================================
   USER LINKS CRUD & BULK SHORTENER
   ========================================================= */

// Get all links for authenticated user (or all if admin)
router.get('/api/links', authMiddleware, async (req, res) => {
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

    res.json({ links: formatted });
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Create new shortened link for authenticated user
router.post('/api/links', authMiddleware, linkCreateLimiter, validate(createLinkSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

    // Plan entitlement check (bypassed for system Admin)
    const entitlements = getEntitlements(req.user);
    if (!isAdmin) {
      let count = 0;
      if (isDbConnected()) {
        count = await Link.countDocuments({ ownerEmail: email.toLowerCase() });
      } else if (isMemStoreAllowed()) {
        count = memStore.links.filter((l) => l.ownerEmail === email.toLowerCase()).length;
      } else {
        throw createDbUnavailableError();
      }
      assertWithinLimit(entitlements, 'links', count);
    }

    let { dest, slug, title, tag, qr, password, expiresAt, maxClicks, utm } = req.body;

    const securityCheck = await inspectUrlSecurity(dest);
    if (!securityCheck.safe) {
      return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
    }

    const finalSlug = (slug || generateCryptoSlug(6)).trim().toLowerCase();
    if (RESERVED_SLUGS.has(finalSlug)) {
      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });
    }

    let parsedExpires = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (!isNaN(expDate.getTime())) parsedExpires = expDate;
    }

    const parsedMaxClicks = maxClicks ? parseInt(maxClicks, 10) : null;

    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    let newLink = null;
    if (isDbConnected()) {
      const clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        return res.status(409).json({ error: 'This custom back-half is already taken', code: 'SLUG_COLLISION' });
      }

      newLink = new Link({
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: null,
        passwordHash,
        expiresAt: parsedExpires,
        maxClicks: parsedMaxClicks,
        utm: utm || null,
        scans: 0
      });
      await newLink.save();
    } else if (isMemStoreAllowed()) {
      const clash = memStore.links.find((l) => l.slug.toLowerCase() === finalSlug);
      if (clash) {
        return res.status(409).json({ error: 'This custom back-half is already taken', code: 'SLUG_COLLISION' });
      }
      newLink = {
        id: 'lnk_' + Date.now(),
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: null,
        passwordHash,
        expiresAt: parsedExpires,
        maxClicks: parsedMaxClicks,
        utm: utm || null,
        scans: 0,
        createdAt: new Date()
      };
      memStore.links.unshift(newLink);
    } else {
      throw createDbUnavailableError();
    }

    let realShort = req.body.realShort;
    if (!realShort) {
      realShort = await getRealWorkingShortUrl(dest);
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShortUrl = realShort && realShort !== dest ? realShort : localShort;

    const linkDoc = newLink._doc ? { ...newLink._doc } : { ...newLink };
    delete linkDoc.password;
    delete linkDoc.passwordHash;
    linkDoc.hasPassword = !!passwordHash;
    linkDoc.url = cleanShortUrl;
    linkDoc.realShort = cleanShortUrl;
    linkDoc.redirectUrl = cleanShortUrl;
    linkDoc.clicks = 0;

    try {
      createNotification({
        ownerEmail: email,
        userId: req.user ? (req.user._id || req.user.id) : null,
        type: 'system',
        title: 'Short Link Created',
        body: `Your short link /${finalSlug} is now live and routing to ${dest}`,
        link: cleanShortUrl,
        refId: `link_${finalSlug}_created`
      }).catch(() => {});
    } catch (_notifErr) {}

    res.json({
      success: true,
      link: linkDoc
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Bulk shorten links
router.post('/api/links/bulk', authMiddleware, bulkShortenLimiter, validate(bulkShortenSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const { urls } = req.body;
    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';

    const createdLinks = [];

    for (let u of urls) {
      u = (u || '').trim();
      if (!u) continue;
      if (!isValidDestinationUrl(u)) continue;

      const slug = generateCryptoSlug(6).toLowerCase();
      const realShort = await getRealWorkingShortUrl(u);
      const cleanUrl = realShort && realShort !== u ? realShort : `${proto}://${host}/${slug}`;

      if (isDbConnected()) {
        const item = new Link({
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk'
        });
        await item.save();
        createdLinks.push({ slug, dest: u, url: cleanUrl, realShort: cleanUrl });
      } else if (isMemStoreAllowed()) {
        const item = {
          id: 'lnk_' + Date.now() + generateCryptoSlug(4).toLowerCase(),
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          createdAt: new Date()
        };
        memStore.links.unshift(item);
        createdLinks.push({ slug, dest: u, url: cleanUrl, realShort: cleanUrl });
      } else {
        throw createDbUnavailableError();
      }
    }

    res.json({ success: true, links: createdLinks });
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Update link with strict ownership verification
router.put('/api/links/:slug', authMiddleware, validate(updateLinkSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const slug = req.params.slug.toLowerCase().trim();
    const { dest, title, tag, password, removePassword, expiresAt, maxClicks, utm } = req.body;

    if (dest) {
      const securityCheck = await inspectUrlSecurity(dest);
      if (!securityCheck.safe) {
        return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
      }
    }

    let parsedExpires = undefined;
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        parsedExpires = null;
      } else {
        const expDate = new Date(expiresAt);
        if (!isNaN(expDate.getTime())) parsedExpires = expDate;
      }
    }

    let parsedMaxClicks = undefined;
    if (maxClicks !== undefined) {
      if (maxClicks === null || maxClicks === '') {
        parsedMaxClicks = null;
      } else {
        const mc = parseInt(maxClicks, 10);
        if (!isNaN(mc) && mc > 0) parsedMaxClicks = mc;
      }
    }

    let newPasswordHash = undefined;
    if (removePassword === true || password === '') {
      newPasswordHash = null;
    } else if (password && typeof password === 'string' && password.trim()) {
      newPasswordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (isDbConnected()) {
      const link = await Link.findOne({ slug });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      // Ownership authorization check
      if (!isAdmin && link.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to modify this link', code: 'FORBIDDEN' });
      }

      if (dest) link.dest = dest;
      if (title) link.title = title;
      if (tag) link.tag = tag;
      if (newPasswordHash !== undefined) {
        link.passwordHash = newPasswordHash;
        link.password = null;
      }
      if (parsedExpires !== undefined) link.expiresAt = parsedExpires;
      if (parsedMaxClicks !== undefined) link.maxClicks = parsedMaxClicks;
      if (utm !== undefined) link.utm = utm;

      await link.save();

      const sanitized = link._doc ? { ...link._doc } : { ...link };
      delete sanitized.password;
      delete sanitized.passwordHash;
      sanitized.hasPassword = !!link.passwordHash;

      return res.json({ success: true, link: sanitized });
    } else if (isMemStoreAllowed()) {
      const link = memStore.links.find((l) => l.slug === slug);
      if (!link) return res.status(404).json({ error: 'Link not found' });

      if (!isAdmin && link.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to modify this link', code: 'FORBIDDEN' });
      }

      if (dest) link.dest = dest;
      if (title) link.title = title;
      if (tag) link.tag = tag;
      if (newPasswordHash !== undefined) {
        link.passwordHash = newPasswordHash;
        link.password = null;
      }
      if (parsedExpires !== undefined) link.expiresAt = parsedExpires;
      if (parsedMaxClicks !== undefined) link.maxClicks = parsedMaxClicks;
      if (utm !== undefined) link.utm = utm;

      const sanitized = { ...link };
      delete sanitized.password;
      delete sanitized.passwordHash;
      sanitized.hasPassword = !!link.passwordHash;

      return res.json({ success: true, link: sanitized });
    } else {
      throw createDbUnavailableError();
    }
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Delete link with strict ownership verification
router.delete('/api/links/:slug', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const slug = req.params.slug.toLowerCase().trim();

    if (isDbConnected()) {
      const link = await Link.findOne({ slug });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      // Ownership authorization check
      if (!isAdmin && link.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this link', code: 'FORBIDDEN' });
      }

      await Link.deleteOne({ slug });
    } else if (isMemStoreAllowed()) {
      const link = memStore.links.find((l) => l.slug === slug);
      if (!link) return res.status(404).json({ error: 'Link not found' });

      if (!isAdmin && link.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this link', code: 'FORBIDDEN' });
      }

      memStore.links = memStore.links.filter((l) => l.slug !== slug);
    } else {
      throw createDbUnavailableError();
    }

    res.json({ success: true, message: 'Link deleted successfully' });
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/* =========================================================
   FAST & SECURE URL REDIRECTION & PASSWORD VERIFICATION
   ========================================================= */

const handleRedirect = async (req, res, next) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    if (!slug) return next();

    // 1. Resolve host (Branded Custom Domain vs Primary Host)
    const reqHost = (req.hostname || req.get('host') || '').toLowerCase().split(':')[0];
    const isPrimaryHost = config.primaryHosts && config.primaryHosts.has(reqHost);

    let domainOwnerEmail = null;
    if (!isPrimaryHost) {
      let customDomain = null;
      if (isDbConnected()) {
        customDomain = await CustomDomain.findOne({ domain: reqHost, status: 'active' });
      } else if (isMemStoreAllowed()) {
        customDomain = memStore.domains.find((d) => d.domain === reqHost && d.status === 'active');
      } else {
        return res.status(503).send('Database service temporarily unavailable');
      }
      if (!customDomain) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Domain Not Active - HEA Link</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b132b;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;} .card{max-width:440px;background:#1c2541;padding:32px;border-radius:16px;border:1px solid #3a506b;} h1{color:#38bdf8;font-size:22px;margin:0 0 12px;} p{color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;} a{color:#0070f3;text-decoration:none;font-weight:600;}</style></head>
          <body>
            <div class="card">
              <h1>🌐 Custom Domain Not Active</h1>
              <p>The domain <strong>${reqHost}</strong> is pointing to HEA Link, but has not been verified or activated.</p>
              <a href="https://healink.store">Go to HEA Link Homepage →</a>
            </div>
          </body>
          </html>
        `);
      }
      domainOwnerEmail = customDomain.ownerEmail.toLowerCase().trim();
    }

    // 2. Fetch Link (scoped to custom domain owner if routed through custom domain)
    let link = null;
    const query = { slug };
    if (domainOwnerEmail) {
      query.ownerEmail = domainOwnerEmail;
    }

    if (isDbConnected()) {
      link = await Link.findOne(query);
    } else if (isMemStoreAllowed()) {
      link = memStore.links.find(
        (l) => l.slug.toLowerCase() === slug && (!domainOwnerEmail || l.ownerEmail.toLowerCase() === domainOwnerEmail)
      );
    } else {
      return res.status(503).send('Database service temporarily unavailable');
    }

    if (link && link.dest) {
      // 3. Expiration Check (Time-based, returns HTTP 410 Gone)
      if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
        return res.status(410).send(renderExpiredLinkHtml({ reason: 'date' }));
      }

      // 4. Click Capacity Limit Check (Atomic findOneAndUpdate check, returns HTTP 410 Gone)
      if (link.maxClicks && link.maxClicks > 0) {
        if (isDbConnected()) {
          const updated = await Link.findOneAndUpdate(
            {
              _id: link._id,
              $expr: { $lt: ['$humanClicks', link.maxClicks] }
            },
            { $inc: { humanClicks: 1, totalClicks: 1 } },
            { new: true }
          );
          if (!updated) {
            return res.status(410).send(renderExpiredLinkHtml({ reason: 'clicks' }));
          }
          link = updated;
        } else {
          if ((link.humanClicks || 0) >= link.maxClicks) {
            return res.status(410).send(renderExpiredLinkHtml({ reason: 'clicks' }));
          }
          link.humanClicks = (link.humanClicks || 0) + 1;
          link.totalClicks = (link.totalClicks || 0) + 1;
        }
      }

      // 5. Password Protection Check (Strict signed HMAC cookie, NO ?pwd= query bypass)
      const hasPasswordProtection = !!(link.passwordHash || link.password);
      if (hasPasswordProtection) {
        const authorized = isSlugAuthorized(req, slug);
        if (!authorized) {
          // Serve clean password challenge HTML
          return res.status(200).send(renderPasswordChallengeHtml({ slug }));
        }
      }

      // 6. Asynchronous Telemetry Recording (Never block 302 redirect)
      const isQr = req.query.qr === '1';
      const skipCounterIncrement = !!(link.maxClicks && link.maxClicks > 0);
      setImmediate(async () => {
        try {
          await recordClick({ link, slug, req, isQr, skipCounterIncrement });
          const clicksNow = (link.humanClicks || link.totalClicks || 0) + 1;
          if ([10, 50, 100, 500, 1000, 5000, 10000].includes(clicksNow)) {
            const email = link.ownerEmail || link.userEmail || link.email;
            if (email) {
              createNotification({
                ownerEmail: email,
                userId: link.userId,
                type: 'link_milestone',
                title: `Link Milestone: ${clicksNow} Clicks! 🔥`,
                body: `Your short link /${slug} just reached ${clicksNow} total clicks.`,
                link: `/${slug}`,
                refId: `link_${slug}_milestone_${clicksNow}`
              }).catch(() => {});
            }
          }
        } catch (recordErr) {
          console.warn('[Telemetry record click warn]', recordErr.message);
        }
      });

      // 7. Destination URL with UTM Parameters (WHATWG URL API)
      let finalDest = link.dest;
      try {
        const urlObj = new URL(link.dest);
        if (link.utm) {
          if (link.utm.source && !urlObj.searchParams.has('utm_source')) {
            urlObj.searchParams.set('utm_source', link.utm.source);
          }
          if (link.utm.medium && !urlObj.searchParams.has('utm_medium')) {
            urlObj.searchParams.set('utm_medium', link.utm.medium);
          }
          if (link.utm.campaign && !urlObj.searchParams.has('utm_campaign')) {
            urlObj.searchParams.set('utm_campaign', link.utm.campaign);
          }
          if (link.utm.term && !urlObj.searchParams.has('utm_term')) {
            urlObj.searchParams.set('utm_term', link.utm.term);
          }
          if (link.utm.content && !urlObj.searchParams.has('utm_content')) {
            urlObj.searchParams.set('utm_content', link.utm.content);
          }
        }
        // Forward non-internal query parameters
        for (const [key, val] of Object.entries(req.query || {})) {
          const lowerKey = key.toLowerCase();
          if (!['pwd', 'password', 'qr'].includes(lowerKey) && !urlObj.searchParams.has(key)) {
            urlObj.searchParams.set(key, val);
          }
        }
        finalDest = urlObj.toString();
      } catch (_urlErr) {}

      // 8. Instant HTTP 302 Redirect
      return res.redirect(302, finalDest);
    }

    // Check if it's a bio page slug
    let bio = null;
    if (isDbConnected()) {
      bio = await BioPage.findOne({ slug });
    } else if (isMemStoreAllowed()) {
      bio = memStore.bios.find((b) => b.slug.toLowerCase() === slug);
    } else {
      return res.status(503).send('Database service temporarily unavailable');
    }

    if (bio) {
      return res.redirect(302, `/m/${slug}`);
    }

    // On branded custom domains, missing links must return 404 (never fallback to platform index.html)
    if (domainOwnerEmail) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Not Found</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b132b;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;} .card{max-width:440px;background:#1c2541;padding:32px;border-radius:16px;border:1px solid #3a506b;} h1{color:#38bdf8;font-size:22px;margin:0 0 12px;} p{color:#94a3b8;font-size:14px;line-height:1.6;margin:0;}</style></head>
        <body>
          <div class="card">
            <h1>404 · Link Not Found</h1>
            <p>The requested shortlink does not exist on this custom domain.</p>
          </div>
        </body>
        </html>
      `);
    }

    return next();
  } catch (err) {
    console.error('Redirect error:', err);
    return next();
  }
};

// Password verification handler (Form POST)
const handlePasswordVerification = async (req, res, next) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    if (!slug || RESERVED_SLUGS.has(slug)) return next();

    let link = null;
    if (isDbConnected()) {
      link = await Link.findOne({ slug });
    } else if (isMemStoreAllowed()) {
      link = memStore.links.find((l) => l.slug.toLowerCase() === slug);
    } else {
      return res.status(503).send('Database service temporarily unavailable');
    }

    if (!link) return next();

    const pwdHash = link.passwordHash;
    const legacyPwd = link.password;

    if (!pwdHash && !legacyPwd) {
      return res.redirect(302, `/${slug}`);
    }

    const submitted = (req.body?.password || req.body?.pwd || '').trim();
    if (!submitted) {
      return res.status(401).send(
        renderPasswordChallengeHtml({
          slug,
          error: 'Please enter a passcode to continue.'
        })
      );
    }

    let isMatch = false;
    if (pwdHash) {
      isMatch = await bcrypt.compare(submitted, pwdHash);
    } else if (legacyPwd) {
      isMatch = submitted === legacyPwd;
      if (isMatch) {
        // Upgrade legacy plaintext password to bcrypt hash
        try {
          const hashed = await bcrypt.hash(legacyPwd, 10);
          link.passwordHash = hashed;
          link.password = null;
          if (isDbConnected()) await link.save();
        } catch (_hashErr) {}
      }
    }

    if (!isMatch) {
      return res.status(401).send(
        renderPasswordChallengeHtml({
          slug,
          error: 'Incorrect passcode. Please check and try again.'
        })
      );
    }

    // Passcode verified! Set signed HMAC cookie and redirect
    setSlugCookie(res, slug);
    return res.redirect(302, `/${slug}`);
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// Mount Password Verification POST Routes
router.post('/r/:slug', passwordAttemptLimiter, handlePasswordVerification);
router.post('/api/links/:slug/verify-password', passwordAttemptLimiter, handlePasswordVerification);
router.post('/:slug', passwordAttemptLimiter, (req, res, next) => {
  const raw = req.params.slug.toLowerCase();
  if (RESERVED_SLUGS.has(raw) || raw.includes('.')) {
    return next();
  }
  return handlePasswordVerification(req, res, next);
});

// Mount Redirection GET Routes
router.get('/r/:slug', handleRedirect);
router.get('/go/:slug', handleRedirect);

// Top-level slug redirect (e.g. /summer-26)
router.get('/:slug', (req, res, next) => {
  const raw = req.params.slug.toLowerCase();
  if (RESERVED_SLUGS.has(raw) || raw.includes('.')) {
    return next();
  }
  return handleRedirect(req, res, next);
});

module.exports = router;
