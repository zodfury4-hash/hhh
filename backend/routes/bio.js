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

   5. LINK-IN-BIO PAGES CRUD & LIVE PAGE RENDERER

   ========================================================= */

router.get('/api/bios', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    let list = [];

    if (isDbConnected) {

      list = await BioPage.find({ ownerEmail: email }).sort({ createdAt: -1 });

    } else {

      list = memStore.bios.filter(b => b.ownerEmail === email);

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

router.post('/api/bios', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const { slug, title, tagline, avatar, theme, links } = req.body;

    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    let page = null;

    if (isDbConnected) {

      page = await BioPage.findOne({ slug });

      if (page) {

        if (page.ownerEmail !== email) {

          return res.status(400).json({ error: 'This bio slug is already claimed by another user.' });

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

          slug,

          title: title || 'My Bio Page',

          tagline: tagline || '',

          avatar: avatar || '',

          theme: theme || 'cyber-dark',

          links: links || []

        });

        await page.save();

      }

    } else {

      page = memStore.bios.find(b => b.slug === slug);

      if (page) {

        page.title = title || page.title;

        page.tagline = tagline || page.tagline;

        page.links = links || page.links;

      } else {

        page = {

          id: 'bio_' + Date.now(),

          ownerEmail: email,

          slug,

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

        slug,

        title: title || (page && page.title) || 'My Bio Page',

        tagline: tagline || (page && page.tagline) || '',

        avatar: avatar || (page && page.avatar) || '',

        theme: theme || (page && page.theme) || 'cyber-dark',

        links: links || (page && page.links) || []

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB saveBio warn]', fbErr.message);

    }

    res.json({ success: true, page });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// Live Bio Page Renderer (/m/:slug or /bio/:slug)

router.get(['/m/:slug', '/bio/:slug'], async (req, res) => {

  try {

    const slug = req.params.slug;

    let bio = null;

    if (isDbConnected) {

      bio = await BioPage.findOne({ slug });

      if (bio) {

        bio.views = (bio.views || 0) + 1;

        await bio.save();

      }

    } else {

      bio = memStore.bios.find(b => b.slug === slug);

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

    // Render beautiful mobile-first bio page

    const html = `

      <!DOCTYPE html>

      <html lang="en">

      <head>

        <meta charset="utf-8">

        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>${bio.title} · HEA Link</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">

        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">

        <style>

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {

            font-family: 'Plus Jakarta Sans', sans-serif;

            background: #060b18;

            color: #ffffff;

            min-height: 100vh;

            display: flex;

            justify-content: center;

            align-items: center;

            padding: 40px 16px;

            background-image: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 60%);

          }

          .bio-card {

            width: 100%;

            max-width: 440px;

            text-align: center;

          }

          .bio-avatar {

            width: 96px;

            height: 96px;

            border-radius: 50%;

            object-fit: cover;

            border: 3px solid #38bdf8;

            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);

            margin-bottom: 16px;

          }

          .bio-avatar-fallback {

            width: 96px;

            height: 96px;

            border-radius: 50%;

            background: linear-gradient(135deg, #38bdf8, #0066ff);

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

            backdrop-filter: blur(12px);

            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

          }

          .bio-btn:hover {

            transform: translateY(-3px) scale(1.01);

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

          ${bio.avatar

            ? `<img src="${bio.avatar}" alt="${bio.title}" class="bio-avatar">`

            : `<div class="bio-avatar-fallback">${(bio.title || 'H').slice(0, 2).toUpperCase()}</div>`

          }

          <h1 class="bio-title">${bio.title}</h1>

          <p class="bio-tagline">${bio.tagline || ''}</p>

          <div class="bio-links">

            ${(bio.links || []).map(l => `

              <a href="${l.url}" target="_blank" rel="noopener" class="bio-btn">

                <span>${l.icon || '🔗'}</span>

                <span>${l.label || l.url}</span>

                <span style="opacity:0.6">↗</span>

              </a>

            `).join('')}

          </div>

          <div class="bio-brand">

            Powered by <a href="/#home">HEA Link</a> · Branded bio pages

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
