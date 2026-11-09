const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Link = require('../models/Link');
const QRCode = require('../models/QRCode');
const BioPage = require('../models/BioPage');
const CustomDomain = require('../models/CustomDomain');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, optionalAuth, JWT_SECRET } = require('../middleware/auth');
const {
  VIP_ADMIN_ACCOUNTS,
  isVipAdminEmail,
  devCodeField,
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, mailTransporter } = require('../utils/mailer');

const IS_PROD = process.env.NODE_ENV === 'production';
function isDbConnected() { return mongoose.connection.readyState === 1; }

/* =========================================================

   BITLY-STANDARD HELPERS & LINK ENGINE

   ========================================================= */

const RESERVED_PATHS = [

  'api', 'admin', 'assets', 'models', 'node_modules', 'public_html', 'data',

  'index.html', 'style.css', 'app.js', 'app-shell.js', 'app-shell.css',

  'heavy-fx.js', 'qrcode.js', 'logo.png', 'favicon.ico', 'cname', 'readme.md',

  'login', 'signup', 'dashboard', 'settings', 'links', 'qr', 'analytics', 'pages',

  'campaigns', 'domains', 'integrations', 'utm', 'solutions', 'resources', 'assist', 'm', 'bio'

];

function validateDestinationUrl(urlStr) {

  try {

    let clean = (urlStr || '').trim();

    if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;

    const parsed = new URL(clean);

    const host = parsed.hostname.toLowerCase();

    // Anti-phishing & SSRF prevention: block internal/loopback

    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {

      return { valid: false, error: 'Destination URL cannot point to internal/local loopback addresses.' };

    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {

      return { valid: false, error: 'Only HTTP and HTTPS destination URLs are allowed.' };

    }

    return { valid: true, cleanUrl: parsed.toString() };

  } catch (e) {

    return { valid: false, error: 'Please enter a valid URL (e.g. https://yourbrand.com/promo)' };

  }

}

function isBotUserAgent(ua = '') {

  const botPatterns = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|slackbot|linkedinbot|discordbot|bingbot|googlebot|yandex|applebot/i;

  return botPatterns.test(ua);

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

/* =========================================================

   2. PUBLIC & GUEST URL SHORTENER ENDPOINT & ONLINE SHORTENER

   ========================================================= */

// Fetch real working short URL via TinyURL or is.gd with zero branding (clean 301 direct redirect, no interstitial)

async function getRealWorkingShortUrl(destUrl) {

  if (!destUrl) return null;

  // 1. Try TinyURL (instant 301 direct redirect with zero warning)

  try {

    const tuRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(destUrl));

    if (tuRes.ok) {

      const text = (await tuRes.text()).trim();

      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;

    }

  } catch (e) {}

  // 2. Try is.gd (instant 301 direct redirect with zero warning)

  try {

    const isRes = await fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(destUrl));

    if (isRes.ok) {

      const text = (await isRes.text()).trim();

      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;

    }

  } catch (e) {}

  return null;

}

// Dedicated endpoint to get working short URL without branding
router.post('/api/shorten-online', async (req, res) => {
  try {
    const { url, slug: requestedSlug } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const check = validateDestinationUrl(url);
    const dest = check.valid ? check.cleanUrl : url;
    const finalSlug = (requestedSlug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();

    // Check external shortener (TinyURL/is.gd)
    let realShort = await getRealWorkingShortUrl(dest);

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShort = (realShort && realShort !== dest) ? realShort : localShort;

    // Immediately cache in memStore & DB so GET /:slug works without delay
    if (isDbConnected) {
      try {
        const clash = await Link.findOne({ slug: finalSlug });
        if (!clash) {
          const l = new Link({
            ownerEmail: 'guest',
            dest,
            slug: finalSlug,
            title: 'Untitled Link',
            tag: 'General',
            qr: true,
            clicks: []
          });
          await l.save();
        }
      } catch (e) {}
    } else {
      const clash = memStore.links.find(l => l.slug.toLowerCase() === finalSlug);
      if (!clash) {
        memStore.links.unshift({
          id: 'lnk_' + Date.now(),
          ownerEmail: 'guest',
          dest,
          slug: finalSlug,
          title: 'Untitled Link',
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

router.post('/api/shorten', optionalAuth, async (req, res) => {

  try {

    let { url, slug, tag, realShort } = req.body;

    if (!url) return res.status(400).json({ error: 'URL is required' });

    const check = validateDestinationUrl(url);

    if (!check.valid) return res.status(400).json({ error: check.error });

    const dest = check.cleanUrl;

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();

    if (RESERVED_PATHS.includes(finalSlug)) {

      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });

    }

    const ownerEmail = (req.user && req.user.email) ? req.user.email : 'guest';

    if (!realShort) {

      realShort = await getRealWorkingShortUrl(dest);

    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShortUrl = (realShort && realShort !== dest) ? realShort : localShort;

    let link = null;

    if (isDbConnected) {

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

    // Persist to Firebase Realtime Database

    try {

      await firebaseRtdb.saveLink(ownerEmail, {

        slug: finalSlug,

        dest,

        title: req.body.title || 'Untitled Link',

        tag: tag || 'General',

        qr: true

      });

    } catch (fbErr) {

      console.warn('[Firebase saveLink warn]', fbErr.message);

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

    res.status(500).json({ error: err.message });

  }

});

/* =========================================================

   3. USER LINKS CRUD & BULK SHORTENER (MongoDB)

   ========================================================= */

// Get all links for authenticated user

router.get('/api/links', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    let list = [];

    if (isDbConnected) {

      list = await Link.find({ ownerEmail: email }).sort({ createdAt: -1 });

    } else {

      list = memStore.links.filter(l => l.ownerEmail === email);

    }

    // Also pull from Firebase Realtime Database

    try {

      const fbLinks = await firebaseRtdb.getUserLinks(email);

      if (Array.isArray(fbLinks) && fbLinks.length > 0) {

        const existingSlugs = new Set(list.map(l => l.slug));

        for (const fl of fbLinks) {

          if (!existingSlugs.has(fl.slug)) {

            list.push(fl);

            existingSlugs.add(fl.slug);

          }

        }

      }

    } catch (fbErr) {

      console.warn('[Firebase RTDB getUserLinks warn]', fbErr.message);

    }

    // Format links with friendly click count

    const formatted = list.map(l => ({

      id: l._id || l.id,

      ownerEmail: l.ownerEmail,

      slug: l.slug,

      dest: l.dest,

      url: `https://${req.get('host') || 'healink.store'}/${l.slug}`,

      redirectUrl: `https://${req.get('host') || 'healink.store'}/r/${l.slug}`,

      title: l.title || 'Untitled Link',

      tag: l.tag || 'General',

      clicks: Array.isArray(l.clicks) ? l.clicks.length : (typeof l.clicks === 'number' ? l.clicks : 0),

      scans: l.scans || 0,

      createdAt: l.createdAt

    }));

    res.json({ links: formatted });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// Create new shortened link for user

router.post('/api/links', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    // Check free user limit unless VIP Admin or Pro user or on localhost/development
    const isMasterUser = email && isVipAdminEmail(email);
    const isLocalhost = req.get('host') && (req.get('host').includes('localhost') || req.get('host').includes('127.0.0.1'));
    if (!isMasterUser && !req.user.isPro && !isLocalhost) {
      let count = 0;
      if (isDbConnected) {
        count = await Link.countDocuments({ ownerEmail: email.toLowerCase() });
      } else {
        count = memStore.links.filter(l => l.ownerEmail === email.toLowerCase()).length;
      }
      if (count >= 100) {
        return res.status(403).json({
          error: 'Free plan limit reached (100 links & QR codes). Upgrade to Pro for unlimited links and QR codes!'
        });
      }
    }

    let { dest, slug, title, tag, qr, password, expiresAt, maxClicks } = req.body;

    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    const check = validateDestinationUrl(dest);

    if (!check.valid) return res.status(400).json({ error: check.error });

    dest = check.cleanUrl;

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();

    if (RESERVED_PATHS.includes(finalSlug)) {

      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });

    }

    let parsedExpires = null;

    if (expiresAt) {

      const expDate = new Date(expiresAt);

      if (!isNaN(expDate.getTime())) parsedExpires = expDate;

    }

    let newLink = null;

    if (isDbConnected) {

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

        maxClicks: maxClicks ? parseInt(maxClicks) : null,

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

        maxClicks: maxClicks ? parseInt(maxClicks) : null,

        scans: 0,

        clicks: [],

        createdAt: new Date()

      };

      memStore.links.unshift(newLink);

    }

    // Persist to Firebase Realtime Database

    try {

      await firebaseRtdb.saveLink(email, {

        slug: finalSlug,

        dest,

        title: title || 'Untitled Link',

        tag: tag || 'General',

        qr: qr !== false,

        password: password ? password.trim() : null,

        expiresAt: parsedExpires ? parsedExpires.toISOString() : null,

        maxClicks: maxClicks ? parseInt(maxClicks) : null,

        scans: 0,

        clicks: []

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB saveLink warn]', fbErr.message);

    }

    let realShort = req.body.realShort;

    if (!realShort) {

      realShort = await getRealWorkingShortUrl(dest);

    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const localShort = `${proto}://${host}/${finalSlug}`;
    const cleanShortUrl = (realShort && realShort !== dest) ? realShort : localShort;

    res.json({

      success: true,

      link: {

        ...newLink._doc || newLink,

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

router.post('/api/links/bulk', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {

      return res.status(400).json({ error: 'urls array is required' });

    }

    const createdLinks = [];

    for (let u of urls) {

      u = (u || '').trim();

      if (!u) continue;

      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;

      const slug = Math.random().toString(36).substring(2, 8);

      const realShort = await getRealWorkingShortUrl(u);

      const cleanUrl = (realShort && realShort !== u) ? realShort : `${proto}://${host}/${slug}`;

      if (isDbConnected) {

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

// Update link

router.put('/api/links/:slug', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const slug = req.params.slug;

    const { dest, title, tag } = req.body;

    if (isDbConnected) {

      const link = await Link.findOne({ ownerEmail: email, slug });

      if (!link) return res.status(404).json({ error: 'Link not found' });

      if (dest) link.dest = dest;

      if (title) link.title = title;

      if (tag) link.tag = tag;

      await link.save();

      try {

        await firebaseRtdb.saveLink(email, { slug, dest: link.dest, title: link.title, tag: link.tag });

      } catch (e) {}

      return res.json({ success: true, link });

    } else {

      const link = memStore.links.find(l => l.ownerEmail === email && l.slug === slug);

      if (!link) return res.status(404).json({ error: 'Link not found' });

      if (dest) link.dest = dest;

      if (title) link.title = title;

      if (tag) link.tag = tag;

      try {

        await firebaseRtdb.saveLink(email, { slug, dest: link.dest, title: link.title, tag: link.tag });

      } catch (e) {}

      return res.json({ success: true, link });

    }

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// Delete link

router.delete('/api/links/:slug', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const slug = req.params.slug;

    if (isDbConnected) {

      await Link.deleteOne({ ownerEmail: email, slug });

    } else {

      memStore.links = memStore.links.filter(l => !(l.ownerEmail === email && l.slug === slug));

    }

    try {

      await firebaseRtdb.deleteLink(email, slug);

    } catch (fbErr) {

      console.warn('[Firebase RTDB deleteLink warn]', fbErr.message);

    }

    res.json({ success: true, message: 'Link deleted successfully' });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


/* =========================================================

   9. FAST URL REDIRECTION ENGINE (HTTP 302 DIRECT)

   Handles /r/:slug, /go/:slug, and top-level /:slug

   ========================================================= */

const handleRedirect = async (req, res, next) => {

  try {

    const slug = (req.params.slug || '').trim().toLowerCase();

    if (!slug) return next();

    let link = null;

    if (isDbConnected) {

      link = await Link.findOne({ slug });
      if (!link) {
        link = await Link.findOne({ slug: new RegExp('^' + slug + '$', 'i') });
      }

    } else {

      link = memStore.links.find(l => l.slug.toLowerCase() === slug);

    }

    if (!link) {

      try {

        link = await firebaseRtdb.getLinkBySlug(slug);

      } catch (fbErr) {}

    }

    if (link && link.dest) {

      // 1. Bitly-Style Expiration Check

      const isTimeExpired = link.expiresAt && new Date() > new Date(link.expiresAt);

      const isClicksExpired = link.maxClicks && Array.isArray(link.clicks) && link.clicks.filter(c => !c.isBot).length >= link.maxClicks;

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

      // 2. Bitly-Style Password Protection Check

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

      // 3. Bitly-Style Rich Telemetry & Bot Filtration

      const userAgent = req.headers['user-agent'] || '';

      const isBot = isBotUserAgent(userAgent);

      const device = parseDevice(userAgent);

      const referer = parseReferrer(req.headers.referer || '');

      const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || 'US';

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

      if (isDbConnected) {

        await link.save();

      }

      // Also record click in Firebase Realtime Database

      try {

        firebaseRtdb.recordClick(slug, {

          ip: req.ip,

          referer,

          userAgent,

          device

        });

      } catch (fbErr) {}

      console.log(`⚡ [REDIRECT] ${slug} ──▶ ${link.dest} (Device: ${device}, Referer: ${referer}, Bot: ${isBot})`);

      return res.redirect(302, link.dest);

    }

    // Check if it's a bio page slug

    let bio = null;

    if (isDbConnected) {

      bio = await BioPage.findOne({ slug });

    } else {

      bio = memStore.bios.find(b => b.slug.toLowerCase() === slug);

    }

    if (!bio) {

      try {

        bio = await firebaseRtdb.getBioBySlug(slug);

      } catch (fbErr) {}

    }

    if (bio) {

      return res.redirect(302, `/m/${slug}`);

    }

    // Not found in links or bios, pass to next middleware (static files or index.html)

    return next();

  } catch (err) {

    console.error('Redirect error:', err);

    return next();

  }

};


router.get('/r/:slug', handleRedirect);

router.get('/go/:slug', handleRedirect);

// Top-level slug redirect (e.g. http://localhost:3000/summer-26 or /3WeOEOz)

router.get('/:slug', (req, res, next) => {

  const raw = req.params.slug.toLowerCase();

  if (RESERVED_PATHS.includes(raw) || raw.includes('.')) {

    return next();

  }

  return handleRedirect(req, res, next);

});


module.exports = router;
