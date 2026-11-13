const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Link = require('../models/Link');
const BioPage = require('../models/BioPage');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { linkCreateLimiter, bulkShortenLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  createLinkSchema,
  bulkShortenSchema,
  isValidDestinationUrl,
  RESERVED_SLUGS
} = require('../middleware/validation');
const { inspectUrlSecurity } = require('../services/abuse-service');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function parseDevice(ua = '') {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function parseReferrer(ref = '') {
  if (!ref || ref === 'direct') return 'Direct';
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('youtube')) return 'YouTube';
    return host;
  } catch (e) {
    return 'Direct';
  }
}

function isBotUserAgent(ua = '') {
  const botPatterns =
    /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|slackbot|linkedinbot|discordbot|bingbot|googlebot|yandex|applebot/i;
  return botPatterns.test(ua);
}

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

    const finalSlug = (requestedSlug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
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
            qr: true,
            clicks: []
          });
          await l.save();
        }
      } catch (e) {}
    } else {
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
          clicks: [],
          createdAt: new Date()
        });
      }
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

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
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
        return res.status(400).json({ error: 'Back-half is already taken' });
      }

      link = new Link({
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0,
        clicks: []
      });
      await link.save();
    } else {
      link = {
        id: 'lnk_' + Date.now(),
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0,
        clicks: [],
        createdAt: new Date()
      };
      memStore.links.unshift(link);
    }

    try {
      await firebaseRtdb.saveLink(ownerEmail, {
        slug: finalSlug,
        dest,
        title: req.body.title || 'Untitled Link',
        tag: tag || 'General',
        qr: true
      });
    } catch (fbErr) {}

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
    res.status(500).json({ error: err.message });
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
    } else {
      list = isAdmin ? memStore.links : memStore.links.filter((l) => l.ownerEmail === email);
    }

    try {
      const fbLinks = await firebaseRtdb.getUserLinks(email);
      if (Array.isArray(fbLinks) && fbLinks.length > 0) {
        const existingSlugs = new Set(list.map((l) => l.slug));
        for (const fl of fbLinks) {
          if (!existingSlugs.has(fl.slug)) {
            list.push(fl);
            existingSlugs.add(fl.slug);
          }
        }
      }
    } catch (fbErr) {}

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
      clicks: Array.isArray(l.clicks) ? l.clicks.length : typeof l.clicks === 'number' ? l.clicks : 0,
      scans: l.scans || 0,
      createdAt: l.createdAt
    }));

    res.json({ links: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new shortened link for authenticated user
router.post('/api/links', authMiddleware, linkCreateLimiter, validate(createLinkSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const isPro = !!req.user.isPro;
    const isDev = process.env.NODE_ENV === 'development';

    // Free plan limits: 100 links (bypassed only in dev, or for PRO/Admin)
    if (!isAdmin && !isPro && !isDev) {
      let count = 0;
      if (isDbConnected()) {
        count = await Link.countDocuments({ ownerEmail: email.toLowerCase() });
      } else {
        count = memStore.links.filter((l) => l.ownerEmail === email.toLowerCase()).length;
      }
      if (count >= 100) {
        return res.status(403).json({
          error: 'Free plan limit reached (100 links). Upgrade to Core PRO for unlimited short links and analytics!',
          code: 'PLAN_LIMIT_REACHED'
        });
      }
    }

    let { dest, slug, title, tag, qr, password, expiresAt, maxClicks } = req.body;

    const securityCheck = await inspectUrlSecurity(dest);
    if (!securityCheck.safe) {
      return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
    }

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
    if (RESERVED_SLUGS.has(finalSlug)) {
      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });
    }

    let parsedExpires = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (!isNaN(expDate.getTime())) parsedExpires = expDate;
    }

    let newLink = null;
    if (isDbConnected()) {
      const clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        return res.status(400).json({ error: 'This custom back-half is already taken' });
      }

      newLink = new Link({
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: password ? password.trim() : null,
        expiresAt: parsedExpires,
        maxClicks: maxClicks ? parseInt(maxClicks, 10) : null,
        scans: 0,
        clicks: []
      });
      await newLink.save();
    } else {
      newLink = {
        id: 'lnk_' + Date.now(),
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: password ? password.trim() : null,
        expiresAt: parsedExpires,
        maxClicks: maxClicks ? parseInt(maxClicks, 10) : null,
        scans: 0,
        clicks: [],
        createdAt: new Date()
      };
      memStore.links.unshift(newLink);
    }

    try {
      await firebaseRtdb.saveLink(email, {
        slug: finalSlug,
        dest,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: password ? password.trim() : null,
        expiresAt: parsedExpires ? parsedExpires.toISOString() : null,
        maxClicks: maxClicks ? parseInt(maxClicks, 10) : null,
        scans: 0,
        clicks: []
      });
    } catch (fbErr) {}

    let realShort = req.body.realShort;
    if (!realShort) {
      realShort = await getRealWorkingShortUrl(dest);
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShortUrl = realShort && realShort !== dest ? realShort : localShort;

    res.json({
      success: true,
      link: {
        ...(newLink._doc || newLink),
        url: cleanShortUrl,
        realShort: cleanShortUrl,
        redirectUrl: cleanShortUrl,
        clicks: 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

      const slug = Math.random().toString(36).substring(2, 8);
      const realShort = await getRealWorkingShortUrl(u);
      const cleanUrl = realShort && realShort !== u ? realShort : `${proto}://${host}/${slug}`;

      if (isDbConnected()) {
        const item = new Link({
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          clicks: []
        });
        await item.save();
        createdLinks.push({ slug, dest: u, url: cleanUrl, realShort: cleanUrl });
      } else {
        const item = {
          id: 'lnk_' + Date.now() + Math.random().toString(36).slice(2, 4),
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          clicks: [],
          createdAt: new Date()
        };
        memStore.links.unshift(item);
        createdLinks.push({ slug, dest: u, url: cleanUrl, realShort: cleanUrl });
      }

      try {
        await firebaseRtdb.saveLink(email, {
          slug,
          dest: u,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          clicks: []
        });
      } catch (fbErr) {}
    }

    res.json({ success: true, links: createdLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update link with strict ownership verification
router.put('/api/links/:slug', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const slug = req.params.slug.toLowerCase().trim();
    const { dest, title, tag } = req.body;

    if (dest) {
      const securityCheck = await inspectUrlSecurity(dest);
      if (!securityCheck.safe) {
        return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
      }
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
      await link.save();

      try {
        await firebaseRtdb.saveLink(link.ownerEmail, { slug, dest: link.dest, title: link.title, tag: link.tag });
      } catch (e) {}

      return res.json({ success: true, link });
    } else {
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

      return res.json({ success: true, link });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      try {
        await firebaseRtdb.deleteLink(link.ownerEmail, slug);
      } catch (fbErr) {}
    } else {
      const link = memStore.links.find((l) => l.slug === slug);
      if (!link) return res.status(404).json({ error: 'Link not found' });

      if (!isAdmin && link.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this link', code: 'FORBIDDEN' });
      }

      memStore.links = memStore.links.filter((l) => l.slug !== slug);
    }

    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   FAST & SECURE URL REDIRECTION ENGINE (HTTP 302 DIRECT)
   ========================================================= */

const handleRedirect = async (req, res, next) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    if (!slug) return next();

    let link = null;
    if (isDbConnected()) {
      link = await Link.findOne({ slug });
    } else {
      link = memStore.links.find((l) => l.slug.toLowerCase() === slug);
    }

    if (!link) {
      try {
        link = await firebaseRtdb.getLinkBySlug(slug);
      } catch (fbErr) {}
    }

    if (link && link.dest) {
      // 1. Expiration Checks
      const isTimeExpired = link.expiresAt && new Date() > new Date(link.expiresAt);
      const isClicksExpired =
        link.maxClicks && Array.isArray(link.clicks) && link.clicks.filter((c) => !c.isBot).length >= link.maxClicks;

      if (isTimeExpired || isClicksExpired) {
        return res.status(410).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link Expired · HEA Link</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b18; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
              .box { background: #090f22; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px 30px; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
              h2 { font-size: 22px; margin-top: 12px; color: #f87171; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
              a { display: inline-block; margin-top: 16px; color: #38bdf8; text-decoration: none; font-weight: 700; }
            </style>
          </head>
          <body>
            <div class="box">
              <div style="font-size: 44px;">⏳</div>
              <h2>This Link Has Expired</h2>
              <p>The creator set an expiration date or click limit for this short link, which has now elapsed.</p>
              <a href="/#home">Learn more about HEA Link →</a>
            </div>
          </body>
          </html>
        `);
      }

      // 2. Password Protection Check
      if (link.password) {
        const providedPwd = req.query.pwd || req.body?.pwd;
        if (providedPwd !== link.password) {
          return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Password Required · HEA Link</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b18; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .box { background: #090f22; border: 1px solid rgba(56,189,248,0.25); border-radius: 16px; padding: 36px 30px; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
                h2 { font-size: 20px; margin-top: 10px; color: #fff; }
                p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
                input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px; color: #fff; font-size: 15px; margin-bottom: 12px; outline: none; }
                button { width: 100%; background: linear-gradient(135deg, #0084ff, #00d2ff); border: 0; color: #fff; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; }
              </style>
            </head>
            <body>
              <div class="box">
                <div style="font-size: 38px;">🔒</div>
                <h2>Password Protected Link</h2>
                <p>This link is protected with a password. Please enter the passcode to continue.</p>
                <form method="GET">
                  <input type="password" name="pwd" placeholder="Enter password..." required autofocus>
                  <button type="submit">Unlock &amp; Proceed →</button>
                </form>
              </div>
            </body>
            </html>
          `);
        }
      }

      // 3. Telemetry Click Recording (Asynchronous: do NOT block 302 redirect)
      const userAgent = req.headers['user-agent'] || '';
      const isBot = isBotUserAgent(userAgent);
      const device = parseDevice(userAgent);
      const referer = parseReferrer(req.headers.referer || '');
      const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || 'US';

      // Perform click recording in background
      setImmediate(async () => {
        try {
          if (!Array.isArray(link.clicks)) link.clicks = [];
          link.clicks.push({
            timestamp: new Date(),
            ip: req.ip,
            country,
            referer,
            userAgent,
            device,
            isBot
          });
          if (req.query.qr === '1') {
            link.scans = (link.scans || 0) + 1;
          }
          if (isDbConnected()) {
            await Link.updateOne(
              { slug },
              {
                $push: {
                  clicks: {
                    timestamp: new Date(),
                    ip: req.ip,
                    country,
                    referer,
                    userAgent,
                    device,
                    isBot
                  }
                },
                $inc: { scans: req.query.qr === '1' ? 1 : 0 }
              }
            );
          }
          firebaseRtdb.recordClick(slug, {
            ip: req.ip,
            referer,
            userAgent,
            device
          });
        } catch (recordErr) {
          console.warn('[Telemetry record click warn]', recordErr.message);
        }
      });

      // 4. Instant 302 Redirect
      return res.redirect(302, link.dest);
    }

    // Check if it's a bio page slug
    let bio = null;
    if (isDbConnected()) {
      bio = await BioPage.findOne({ slug });
    } else {
      bio = memStore.bios.find((b) => b.slug.toLowerCase() === slug);
    }

    if (!bio) {
      try {
        bio = await firebaseRtdb.getBioBySlug(slug);
      } catch (fbErr) {}
    }

    if (bio) {
      return res.redirect(302, `/m/${slug}`);
    }

    return next();
  } catch (err) {
    console.error('Redirect error:', err);
    return next();
  }
};

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
