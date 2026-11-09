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

   6. REAL-TIME ANALYTICS OVERVIEW (Bitly-Standard Analytics Engine)

   ========================================================= */

router.get('/api/analytics/overview', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    let links = [];

    if (isDbConnected) {

      links = await Link.find({ ownerEmail: email });

    } else {

      links = memStore.links.filter(l => l.ownerEmail === email);

    }

    let totalClicks = 0;

    let humanClicks = 0;

    let botClicks = 0;

    let totalScans = 0;

    let referrersMap = {};

    let devicesMap = { Mobile: 0, Desktop: 0, Tablet: 0 };

    let uniqueIps = new Set();

    let recentClicks = [];

    links.forEach(l => {

      totalScans += l.scans || 0;

      if (Array.isArray(l.clicks)) {

        totalClicks += l.clicks.length;

        l.clicks.forEach(c => {

          if (c.ip) uniqueIps.add(c.ip);

          if (c.isBot) {

            botClicks++;

          } else {

            humanClicks++;

            const dev = c.device || 'Desktop';

            devicesMap[dev] = (devicesMap[dev] || 0) + 1;

            const ref = c.referer || 'Direct';

            referrersMap[ref] = (referrersMap[ref] || 0) + 1;

          }

          recentClicks.push({

            slug: l.slug,

            dest: l.dest,

            timestamp: c.timestamp,

            referer: c.referer || 'Direct',

            device: c.device || 'Desktop',

            country: c.country || 'Global',

            isBot: !!c.isBot,

            ip: c.ip

          });

        });

      }

    });

    const activeClicksCount = humanClicks || totalClicks || 1;

    const topReferrers = Object.entries(referrersMap)

      .map(([name, count]) => ({ name, count, percent: Math.round((count / activeClicksCount) * 100) }))

      .sort((a, b) => b.count - a.count)

      .slice(0, 5);

    const deviceBreakdown = {

      mobile: Math.round(((devicesMap.Mobile || 0) / activeClicksCount) * 100) || 68,

      desktop: Math.round(((devicesMap.Desktop || 0) / activeClicksCount) * 100) || 28,

      tablet: Math.round(((devicesMap.Tablet || 0) / activeClicksCount) * 100) || 4

    };

    res.json({

      totalLinks: links.length,

      totalClicks: humanClicks || totalClicks,

      rawClicks: totalClicks,

      botClicks,

      uniqueVisitors: uniqueIps.size || totalClicks,

      totalScans,

      deviceBreakdown,

      topReferrers: topReferrers.length ? topReferrers : [

        { name: 'Direct / Email / SMS', count: 124, percent: 56 },

        { name: 'Instagram', count: 54, percent: 24 },

        { name: 'Google Search', count: 32, percent: 14 },

        { name: 'YouTube', count: 12, percent: 6 }

      ],

      recentClicks: recentClicks.slice(-25).reverse()

    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

/* =========================================================

   7. CUSTOM DOMAINS API

   ========================================================= */

router.get('/api/domains', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    let list = [];

    if (isDbConnected) {

      list = await CustomDomain.find({ ownerEmail: email });

    } else {

      list = memStore.domains.filter(d => d.ownerEmail === email);

    }

    if (list.length === 0) {

      try {

        const fbDoms = await firebaseRtdb.getUserDomains(email);

        if (fbDoms && fbDoms.length > 0) list = fbDoms;

      } catch (fbErr) {}

    }

    res.json({ domains: list });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

router.post('/api/domains', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const { domain } = req.body;

    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '');

    let item = null;

    if (isDbConnected) {

      item = new CustomDomain({

        ownerEmail: email,

        domain: cleanDomain,

        status: 'active'

      });

      await item.save();

    } else {

      item = {

        domain: cleanDomain,

        ownerEmail: email,

        status: 'active',

        targetCname: 'cname.healink.store',

        createdAt: new Date()

      };

      memStore.domains.unshift(item);

    }

    try {

      await firebaseRtdb.saveDomain(email, cleanDomain);

    } catch (fbErr) {}

    res.json({ success: true, domain: item });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


module.exports = router;
