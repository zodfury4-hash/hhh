const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const BioPage = require('../models/BioPage');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { validate, bioPageSchema } = require('../middleware/validation');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '#';
  const clean = urlStr.trim();
  if (/^https?:\/\//i.test(clean)) {
    return escapeHtml(clean);
  }
  return '#';
}

/* =========================================================
   LINK-IN-BIO CRUD (STRICT AUTH & SANITIZED HTML)
   ========================================================= */

// Get all bio pages for authenticated user
router.get('/api/bios', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    let list = [];

    if (isDbConnected()) {
      const query = isAdmin ? {} : { ownerEmail: email };
      list = await BioPage.find(query).sort({ createdAt: -1 });
    } else {
      list = isAdmin ? memStore.bios : memStore.bios.filter((b) => b.ownerEmail === email);
    }

    if (list.length === 0) {
      try {
        const fbBios = await firebaseRtdb.getUserBios(email);
        if (fbBios && fbBios.length > 0) list = fbBios;
      } catch (fbErr) {}
    }

    res.json({ bios: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update bio page
router.post('/api/bios', authMiddleware, validate(bioPageSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const { slug, title, tagline, avatar, theme, links } = req.body;
    const cleanSlug = slug.toLowerCase().trim();

    let page = null;
    if (isDbConnected()) {
      page = await BioPage.findOne({ slug: cleanSlug });
      if (page) {
        if (!isAdmin && page.ownerEmail !== email) {
          return res.status(403).json({
            error: 'Forbidden: This bio slug is owned by another user.',
            code: 'FORBIDDEN'
          });
        }
        page.title = title || page.title;
        page.tagline = tagline || page.tagline;
        page.avatar = avatar || page.avatar;
        page.theme = theme || page.theme;
        page.links = links || page.links;
        await page.save();
      } else {
        page = new BioPage({
          ownerEmail: email,
          slug: cleanSlug,
          title: title || 'My Bio Page',
          tagline: tagline || '',
          avatar: avatar || '',
          theme: theme || 'cyber-dark',
          links: links || []
        });
        await page.save();
      }
    } else {
      page = memStore.bios.find((b) => b.slug === cleanSlug);
      if (page) {
        if (!isAdmin && page.ownerEmail !== email) {
          return res.status(403).json({
            error: 'Forbidden: This bio slug is owned by another user.',
            code: 'FORBIDDEN'
          });
        }
        page.title = title || page.title;
        page.tagline = tagline || page.tagline;
        page.links = links || page.links;
      } else {
        page = {
          id: 'bio_' + Date.now(),
          ownerEmail: email,
          slug: cleanSlug,
          title: title || 'My Bio Page',
          tagline: tagline || '',
          avatar: avatar || '',
          theme: theme || 'cyber-dark',
          links: links || [],
          views: 0,
          engagements: 0,
          createdAt: new Date()
        };
        memStore.bios.unshift(page);
      }
    }

    try {
      await firebaseRtdb.saveBio(email, {
        slug: cleanSlug,
        title: title || (page && page.title) || 'My Bio Page',
        tagline: tagline || (page && page.tagline) || '',
        avatar: avatar || (page && page.avatar) || '',
        theme: theme || (page && page.theme) || 'cyber-dark',
        links: links || (page && page.links) || []
      });
    } catch (fbErr) {}

    res.json({ success: true, page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bio page with strict ownership check
router.delete('/api/bios/:slug', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const slug = req.params.slug.toLowerCase().trim();

    if (isDbConnected()) {
      const page = await BioPage.findOne({ slug });
      if (!page) return res.status(404).json({ error: 'Bio page not found' });

      if (!isAdmin && page.ownerEmail !== email) {
        return res.status(403).json({ error: 'Forbidden: You do not own this bio page', code: 'FORBIDDEN' });
      }

      await BioPage.deleteOne({ slug });
    } else {
      const page = memStore.bios.find((b) => b.slug === slug);
      if (!page) return res.status(404).json({ error: 'Bio page not found' });

      if (!isAdmin && page.ownerEmail !== email) {
        return res.status(403).json({ error: 'Forbidden: You do not own this bio page', code: 'FORBIDDEN' });
      }

      memStore.bios = memStore.bios.filter((b) => b.slug !== slug);
    }

    res.json({ success: true, message: 'Bio page deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Bio Page Renderer (/m/:slug or /bio/:slug) with full XSS prevention
router.get(['/m/:slug', '/bio/:slug'], async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    let bio = null;

    if (isDbConnected()) {
      bio = await BioPage.findOne({ slug });
      if (bio) {
        setImmediate(async () => {
          try {
            await BioPage.updateOne({ slug }, { $inc: { views: 1 } });
          } catch (e) {}
        });
      }
    } else {
      bio = memStore.bios.find((b) => b.slug === slug);
      if (bio) bio.views = (bio.views || 0) + 1;
    }

    if (!bio) {
      try {
        bio = await firebaseRtdb.getBioBySlug(slug);
      } catch (fbErr) {}
    }

    if (!bio) {
      return res.redirect('/#home');
    }

    const safeTitle = escapeHtml(bio.title || 'HEA Link Bio');
    const safeTagline = escapeHtml(bio.tagline || '');
    const safeAvatar = bio.avatar && /^https?:\/\//i.test(bio.avatar) ? escapeHtml(bio.avatar) : null;
    const safeFallbackInitials = escapeHtml((bio.title || 'H').slice(0, 2).toUpperCase());

    const safeLinksHtml = (bio.links || [])
      .map((l) => {
        const safeUrl = sanitizeUrl(l.url);
        const safeLabel = escapeHtml(l.label || l.url || 'Link');
        const safeIcon = escapeHtml(l.icon || '🔗');
        return `
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="bio-btn">
          <span>${safeIcon}</span>
          <span>${safeLabel}</span>
          <span style="opacity:0.6">↗</span>
        </a>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle} — HEA Link</title>
        <link rel="icon" type="image/png" href="/logo.png">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background: #030712;
            color: #f8fafc;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 16px;
          }
          .bio-card {
            width: 100%;
            max-width: 480px;
            background: #090f22;
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 24px;
            padding: 40px 24px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
            text-align: center;
          }
          .bio-avatar {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #38bdf8;
            margin: 0 auto 16px;
            display: block;
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
          }
          .bio-avatar-fallback {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            color: #ffffff;
            font-size: 32px;
            font-weight: 800;
            display: grid;
            place-items: center;
            margin: 0 auto 16px;
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
          }
          .bio-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
          }
          .bio-tagline {
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 28px;
            line-height: 1.5;
          }
          .bio-links {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .bio-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: rgba(13, 23, 46, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .bio-btn:hover {
            transform: translateY(-2px);
            border-color: #38bdf8;
            box-shadow: 0 8px 25px rgba(56, 189, 248, 0.25);
            color: #38bdf8;
          }
          .bio-brand {
            margin-top: 36px;
            font-size: 12px;
            color: #64748b;
          }
          .bio-brand a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="bio-card">
          ${
            safeAvatar
              ? `<img src="${safeAvatar}" alt="${safeTitle}" class="bio-avatar">`
              : `<div class="bio-avatar-fallback">${safeFallbackInitials}</div>`
          }
          <h1 class="bio-title">${safeTitle}</h1>
          <p class="bio-tagline">${safeTagline}</p>
          <div class="bio-links">
            ${safeLinksHtml}
          </div>
          <div class="bio-brand">
            Powered by <a href="/#home">HEA Link</a> · Branded Bio Pages
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.redirect('/#home');
  }
});

module.exports = router;
