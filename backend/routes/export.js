const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
const Link = require('../models/Link');
const Click = require('../models/Click');
const memStore = require('../utils/memStore');
const { getEntitlements, assertWithinLimit } = require('../config/plans');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. Export Links as CSV
router.get('/api/export/links.csv', authMiddleware, async (req, res) => {
  try {
    if (req.user && (req.user.planKey || req.user.isPro !== undefined)) {
      const entitlements = getEntitlements(req.user);
      assertWithinLimit(entitlements, 'exportData');
    }
    const userEmail = req.user.email.toLowerCase().trim();
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hea-links-${dateStr}.csv"`);

    // CSV Header row
    res.write('Slug,Destination URL,Short URL,Title,Tag,Total Clicks,Created At,Active\r\n');

    let links = [];
    if (isDbConnected()) {
      links = await Link.find({ ownerEmail: userEmail }).sort({ createdAt: -1 }).lean();
    } else {
      links = (memStore.links || []).filter((l) => (l.ownerEmail || '').toLowerCase() === userEmail);
    }

    for (const l of links) {
      const row = [
        escapeCsv(l.slug),
        escapeCsv(l.dest),
        escapeCsv(`https://hea.link/${l.slug}`),
        escapeCsv(l.title || ''),
        escapeCsv(l.tag || ''),
        l.totalClicks || 0,
        escapeCsv(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
        l.isActive !== false ? 'true' : 'false'
      ].join(',');
      res.write(row + '\r\n');
    }

    return res.end();
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    return res.status(500).json({ error: 'Failed to export links: ' + err.message });
  }
});

// 2. Export Links as JSON
router.get('/api/export/links.json', authMiddleware, async (req, res) => {
  try {
    if (req.user && (req.user.planKey || req.user.isPro !== undefined)) {
      const entitlements = getEntitlements(req.user);
      assertWithinLimit(entitlements, 'exportData');
    }
    const userEmail = req.user.email.toLowerCase().trim();
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hea-links-${dateStr}.json"`);

    let links = [];
    if (isDbConnected()) {
      links = await Link.find({ ownerEmail: userEmail }).sort({ createdAt: -1 }).lean();
    } else {
      links = (memStore.links || []).filter((l) => (l.ownerEmail || '').toLowerCase() === userEmail);
    }

    return res.json({
      exportedAt: new Date().toISOString(),
      count: links.length,
      links: links.map((l) => ({
        slug: l.slug,
        dest: l.dest,
        shortUrl: `https://hea.link/${l.slug}`,
        title: l.title,
        tag: l.tag,
        totalClicks: l.totalClicks || 0,
        createdAt: l.createdAt,
        isActive: l.isActive !== false
      }))
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
    return res.status(500).json({ error: 'Failed to export links: ' + err.message });
  }
});

// 3. Export Clicks as CSV
router.get('/api/export/clicks.csv', authMiddleware, async (req, res) => {
  try {
    if (req.user && (req.user.planKey || req.user.isPro !== undefined)) {
      const entitlements = getEntitlements(req.user);
      assertWithinLimit(entitlements, 'exportData');
    }
    const userEmail = req.user.email.toLowerCase().trim();
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hea-clicks-${dateStr}.csv"`);

    // CSV Header row
    res.write('Timestamp,Slug,Country,City,Device,Browser,OS,Referrer,Is Bot,Is QR\r\n');

    let clicks = [];
    if (isDbConnected()) {
      clicks = await Click.find({ ownerEmail: userEmail }).sort({ timestamp: -1 }).limit(10000).lean();
    } else {
      clicks = (memStore.clicks || []).filter((c) => (c.ownerEmail || '').toLowerCase() === userEmail).slice(0, 5000);
    }

    for (const c of clicks) {
      const row = [
        escapeCsv(c.timestamp ? new Date(c.timestamp).toISOString() : ''),
        escapeCsv(c.slug),
        escapeCsv(c.country || 'Unknown'),
        escapeCsv(c.city || 'Unknown'),
        escapeCsv(c.device || 'desktop'),
        escapeCsv(c.browser || 'Unknown'),
        escapeCsv(c.os || 'Unknown'),
        escapeCsv(c.referrer || 'Direct'),
        c.isBot ? 'true' : 'false',
        c.isQr ? 'true' : 'false'
      ].join(',');
      res.write(row + '\r\n');
    }

    return res.end();
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    return res.status(500).json({ error: 'Failed to export clicks: ' + err.message });
  }
});

// 4. Export Clicks as JSON
router.get('/api/export/clicks.json', authMiddleware, async (req, res) => {
  try {
    if (req.user && (req.user.planKey || req.user.isPro !== undefined)) {
      const entitlements = getEntitlements(req.user);
      assertWithinLimit(entitlements, 'exportData');
    }
    const userEmail = req.user.email.toLowerCase().trim();
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hea-clicks-${dateStr}.json"`);

    let clicks = [];
    if (isDbConnected()) {
      clicks = await Click.find({ ownerEmail: userEmail }).sort({ timestamp: -1 }).limit(10000).lean();
    } else {
      clicks = (memStore.clicks || []).filter((c) => (c.ownerEmail || '').toLowerCase() === userEmail).slice(0, 5000);
    }

    return res.json({
      exportedAt: new Date().toISOString(),
      count: clicks.length,
      clicks: clicks.map((c) => ({
        timestamp: c.timestamp,
        slug: c.slug,
        country: c.country,
        city: c.city,
        device: c.device,
        browser: c.browser,
        os: c.os,
        referrer: c.referrer,
        isBot: !!c.isBot,
        isQr: !!c.isQr
      }))
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
    return res.status(500).json({ error: 'Failed to export clicks: ' + err.message });
  }
});

module.exports = router;
