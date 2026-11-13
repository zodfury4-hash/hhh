const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Link = require('../models/Link');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { optionalAuth } = require('../middleware/auth');
const { assistLimiter } = require('../middleware/rateLimiter');
const { inspectUrlSecurity } = require('../services/abuse-service');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function getRealWorkingShortUrl(destUrl) {
  if (!destUrl) return null;
  try {
    const tuRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(destUrl));
    if (tuRes.ok) {
      const text = (await tuRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (e) {}
  return null;
}

/* =========================================================
   HEA ASSIST AI & INTELLIGENT LINK COPILOT
   ========================================================= */

router.post('/api/assist/generate', assistLimiter, (req, res) => {
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

router.post('/api/ai/ask', assistLimiter, optionalAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const email = (req.user && req.user.email) || req.body.email || 'guest';

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const q = prompt.toLowerCase();
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);

    if (urlMatch) {
      const dest = urlMatch[0];
      const securityCheck = await inspectUrlSecurity(dest);
      if (!securityCheck.safe) {
        return res.status(400).json({ error: securityCheck.reason, code: 'URL_BLOCKED' });
      }

      const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
      let slug = '';
      for (let i = 0; i < 6; i++) slug += chars.charAt(Math.floor(Math.random() * chars.length));

      const host = req.get('host') || 'localhost:3000';
      const proto = req.protocol || 'http';
      const realShort = await getRealWorkingShortUrl(dest);
      const shortUrl = realShort && realShort !== dest ? realShort : `${proto}://${host}/${slug}`;

      if (isDbConnected()) {
        const newLink = new Link({
          title: 'AI Quick Shortened',
          dest,
          slug,
          ownerEmail: email,
          tag: 'AI Assist'
        });
        await newLink.save();
      } else {
        memStore.links.unshift({
          id: 'lnk_' + Date.now(),
          ownerEmail: email,
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
        await firebaseRtdb.saveLink(email, {
          slug,
          dest,
          title: 'AI Quick Shortened',
          tag: 'AI Assist'
        });
      } catch (fbErr) {}

      return res.json({
        success: true,
        reply: `🎉 Link Shortened Successfully!\nShort Link: ${shortUrl}\nOriginal: ${dest}`,
        shortUrl,
        slug,
        dest
      });
    }

    let reply = '';
    if (q.includes('title') || q.includes('headline')) {
      reply = `✨ Suggested link titles:\n• "Unlock Early Access (50% Off Today)"\n• "The Complete 2026 Developer Roadmap"\n• "Start Scaling with HEA Link in Seconds"`;
    } else if (q.includes('utm') || q.includes('tag')) {
      reply = `🏷️ Standard UTM tags:\n?utm_source=linkedin&utm_medium=social&utm_campaign=q2_growth&utm_content=sidebar_cta`;
    } else if (q.includes('qr')) {
      reply = `📱 QR Code Advice:\nUse high contrast colors and maintain a minimum of 2cm print size for seamless mobile camera scanning.`;
    } else {
      reply = `⚡ HEA Assist Engine ready! Type or paste any destination URL to shorten it instantly, or ask for UTM tags, title ideas, and QR recommendations.`;
    }

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
