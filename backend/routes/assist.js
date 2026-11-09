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

   8. HEA ASSIST AI ENDPOINT

   ========================================================= */

router.post('/api/assist/generate', (req, res) => {

  const { prompt } = req.body;

  const p = (prompt || '').toLowerCase();

  let answer = '';

  if (p.includes('title') || p.includes('catchy')) {

    answer = `✨ Here are 3 high-converting title suggestions for your link:\n1. "Exclusive Summer Drop 2026 — Limited VIP Access"\n2. "The Ultimate Resource Guide (Free Instant Download)"\n3. "Join 10,000+ Creators Scaling with HEA Link"`;

  } else if (p.includes('utm') || p.includes('facebook') || p.includes('campaign')) {

    answer = `🎯 Generated UTM parameters for your campaign:\n?utm_source=facebook&utm_medium=cpc&utm_campaign=spring_launch_2026&utm_content=hero_banner_v1`;

  } else if (p.includes('qr') || p.includes('scan')) {

    answer = `📱 Top 3 Tips to boost QR Code scans:\n1. Include an enticing CTA below the code (e.g. "Scan for 20% Off").\n2. Maintain high contrast (Cyan or Pink on Dark surface).\n3. Keep quiet zone around the matrix for instantaneous scanning.`;

  } else if (p.includes('bio') || p.includes('page')) {

    answer = `📄 Link-in-Bio Strategy:\n• Put your #1 conversion goal in the top button.\n• Add verified social icons to build instant trust.\n• Keep bio under 2 sentences to minimize bounce rate.`;

  } else {

    answer = `✨ I analyzed your request: "${prompt}".\nEverything is set up for high performance! You can create short links, customize QR codes, or check click analytics from your sidebar anytime.`;

  }

  res.json({ success: true, reply: answer });

});


/* =========================================================

   9. HEA ASSIST & REAL-TIME AI ENDPOINTS

   ========================================================= */

router.post('/api/ai/ask', async (req, res) => {

  try {

    const { prompt, email } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const q = prompt.toLowerCase();

    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);

    if (urlMatch) {

      const dest = urlMatch[0];

      const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

      let slug = '';

      for (let i = 0; i < 6; i++) slug += chars.charAt(Math.floor(Math.random() * chars.length));

      const realShort = await getRealWorkingShortUrl(dest);

      const shortUrl = (realShort && realShort !== dest) ? realShort : `${proto}://${host}/${slug}`;

      if (isDbConnected) {

        const newLink = new Link({

          title: 'AI Quick Shortened',

          dest,

          slug,

          ownerEmail: email || 'guest',

          tag: 'AI Assist'

        });

        await newLink.save();

      } else {

        memStore.links.unshift({

          id: 'lnk_' + Date.now(),

          ownerEmail: email || 'guest',

          title: 'AI Quick Shortened',

          dest,

          slug,

          tag: 'AI Assist',

          clicks: [],

          scans: 0,

          createdAt: new Date()

        });

      }

      try {

        await firebaseRtdb.saveLink(email || 'guest', {

          slug,

          dest,

          title: 'AI Quick Shortened',

          tag: 'AI Assist'

        });

      } catch (fbErr) {}

      return res.json({

        success: true,

        reply: `🎉 <b>Link Shortened Successfully!</b><br><br>Short Link: <a href="${shortUrl}" target="_blank" style="color:#D4FF24;font-weight:700;">${shortUrl}</a><br>Original: <span style="color:#94a3b8;">${dest}</span>`,

        shortUrl,

        slug,

        dest

      });

    }

    let reply = '';

    if (q.includes('title') || q.includes('headline')) {

      reply = `✨ <b>High-Converting Title Recommendations:</b><br>1. 🎯 "The 1 Growth Strategy Top Brands Use in 2026"<br>2. 🔥 "Exclusive Access: Claim Your 40% Limited Drop"<br>3. ⚡ "Free Creator Resource Hub: Everything You Need"<br>4. 🚀 "Get Started in 60 Seconds - Instant Setup"`;

    } else if (q.includes('utm') || q.includes('campaign') || q.includes('fb')) {

      reply = `🏷️ <b>Recommended UTM Tag Parameters:</b><br><code style="color:#38bdf8;">?utm_source=facebook&utm_medium=paid_social&utm_campaign=summer_promo_2026&utm_content=carousel_v1</code>`;

    } else if (q.includes('qr') || q.includes('scan')) {

      reply = `📱 <b>How to Maximize QR Code Scans:</b><br>1. Add a clear call-to-action frame (e.g. "Scan for 20% Off").<br>2. Use a high-contrast palette (#090f22 on #ffffff).<br>3. Keep your short link under 20 chars for rapid autofocus!`;

    } else {

      reply = `🤖 <b>HEA Assist AI:</b> Real-time intelligence online. You can ask me to shorten links, generate QR codes, build UTM tracking links, or optimize conversion rates!`;

    }

    return res.json({ success: true, reply });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});


module.exports = router;
