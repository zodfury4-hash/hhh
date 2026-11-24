const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Link = require('../models/Link');
const Click = require('../models/Click');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { analyticsEmitter } = require('../services/telemetry-service');
const { getEntitlements } = require('../config/plans');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/* =========================================================
   REAL-TIME ANALYTICS OVERVIEW (MONGODB AGGREGATION & ZERO FAKES)
   ========================================================= */

router.get('/api/analytics/overview', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const range = (req.query.range || '7d').toLowerCase();
    const slug = (req.query.slug || '').toLowerCase().trim();
    const campaign = (req.query.campaign || '').toLowerCase().trim();

    // 1. Calculate time window & clamp to plan analyticsRetentionDays
    const now = new Date();
    let sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let isHourly = false;

    if (range === '24h') {
      sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      isHourly = true;
    } else if (range === '30d') {
      sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      sinceDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '365d') {
      sinceDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const entitlements = getEntitlements(req.user);
    const retentionDays = isAdmin ? 1095 : (entitlements.analyticsRetentionDays || 30);
    const oldestAllowedDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    if (sinceDate < oldestAllowedDate) {
      sinceDate = oldestAllowedDate;
    }

    // 2. Fetch total links owned by user
    let userLinks = [];
    if (isDbConnected()) {
      const linkQuery = isAdmin ? {} : { ownerEmail: email };
      userLinks = await Link.find(linkQuery).select('slug dest totalClicks totalScans title createdAt');
    } else {
      userLinks = isAdmin ? memStore.links : memStore.links.filter((l) => l.ownerEmail === email);
    }

    const totalLinks = userLinks.length;
    let totalScans = userLinks.reduce((sum, l) => sum + (l.totalScans || l.scans || 0), 0);

    // If slug requested, verify ownership
    if (slug) {
      const owned = userLinks.find((l) => l.slug.toLowerCase() === slug);
      if (!owned && !isAdmin) {
        return res.status(404).json({ error: 'Short link not found or unauthorized' });
      }
    }

    // 3. Match criteria for Clicks
    const match = {
      timestamp: { $gte: sinceDate }
    };
    if (!isAdmin) {
      match.ownerEmail = email;
    }
    if (slug) {
      match.slug = slug;
    }
    if (campaign) {
      match.utmCampaign = campaign;
    }

    if (isDbConnected()) {
      const dateGroupingFormat = isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

      const results = await Click.aggregate([
        { $match: match },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalClicks: { $sum: 1 },
                  humanClicks: { $sum: { $cond: [{ $eq: ['$isBot', true] }, 0, 1] } },
                  botClicks: { $sum: { $cond: [{ $eq: ['$isBot', true] }, 1, 0] } },
                  scans: { $sum: { $cond: [{ $eq: ['$isQr', true] }, 1, 0] } }
                }
              }
            ],
            uniqueVisitors: [
              { $match: { isBot: false } },
              { $group: { _id: '$ipHash' } },
              { $count: 'count' }
            ],
            topCountries: [
              { $match: { isBot: false } },
              { $group: { _id: '$country', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            topReferrers: [
              { $match: { isBot: false } },
              { $group: { _id: '$referrer', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            devices: [
              { $match: { isBot: false } },
              { $group: { _id: '$device', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            browsers: [
              { $match: { isBot: false } },
              { $group: { _id: '$browser', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 8 }
            ],
            os: [
              { $match: { isBot: false } },
              { $group: { _id: '$os', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 8 }
            ],
            byCampaign: [
              { $match: { isBot: false, utmCampaign: { $ne: null } } },
              { $group: { _id: '$utmCampaign', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 15 }
            ],
            bySource: [
              { $match: { isBot: false, utmSource: { $ne: null } } },
              { $group: { _id: '$utmSource', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 15 }
            ],
            byMedium: [
              { $match: { isBot: false, utmMedium: { $ne: null } } },
              { $group: { _id: '$utmMedium', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 15 }
            ],
            timeseries: [
              {
                $group: {
                  _id: { $dateToString: { format: dateGroupingFormat, date: '$timestamp' } },
                  clicks: { $sum: { $cond: [{ $eq: ['$isBot', true] }, 0, 1] } },
                  bots: { $sum: { $cond: [{ $eq: ['$isBot', true] }, 1, 0] } }
                }
              },
              { $sort: { _id: 1 } }
            ],
            recentClicks: [
              { $sort: { timestamp: -1 } },
              { $limit: 25 },
              {
                $project: {
                  _id: 0,
                  slug: 1,
                  timestamp: 1,
                  country: 1,
                  city: 1,
                  device: 1,
                  browser: 1,
                  os: 1,
                  referrer: 1,
                  isBot: 1,
                  isQr: 1,
                  utmCampaign: 1,
                  utmSource: 1,
                  utmMedium: 1
                }
              }
            ],
            topLinks: [
              { $match: { isBot: false } },
              { $group: { _id: '$slug', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]);

      const facet = results[0] || {};
      const totalsObj = facet.totals?.[0] || { totalClicks: 0, humanClicks: 0, botClicks: 0, scans: 0 };
      const humanClicks = totalsObj.humanClicks || 0;
      const rawClicks = totalsObj.totalClicks || 0;
      const botClicks = totalsObj.botClicks || 0;
      const uniqueVisitors = facet.uniqueVisitors?.[0]?.count || 0;
      if (totalsObj.scans) totalScans = Math.max(totalScans, totalsObj.scans);

      // Top Referrers with clean percentages (guarded against divide-by-zero)
      const topReferrers = (facet.topReferrers || []).map((r) => ({
        name: r._id || 'Direct',
        count: r.count,
        percent: humanClicks > 0 ? Math.round((r.count / humanClicks) * 100) : 0
      }));

      // Device breakdown
      const devicesMap = {};
      (facet.devices || []).forEach((d) => {
        devicesMap[d._id] = d.count;
      });
      const deviceBreakdown = {
        mobile: humanClicks > 0 ? Math.round(((devicesMap.Mobile || 0) / humanClicks) * 100) : 0,
        desktop: humanClicks > 0 ? Math.round(((devicesMap.Desktop || 0) / humanClicks) * 100) : 0,
        tablet: humanClicks > 0 ? Math.round(((devicesMap.Tablet || 0) / humanClicks) * 100) : 0
      };

      const topCountries = (facet.topCountries || []).map((c) => ({
        country: c._id || 'Unknown',
        count: c.count,
        percent: humanClicks > 0 ? Math.round((c.count / humanClicks) * 100) : 0
      }));

      const topLinks = (facet.topLinks || []).map((l) => ({
        slug: l._id,
        count: l.count,
        percent: humanClicks > 0 ? Math.round((l.count / humanClicks) * 100) : 0
      }));

      const byCampaign = (facet.byCampaign || []).map((c) => ({
        campaign: c._id,
        count: c.count,
        percent: humanClicks > 0 ? Math.round((c.count / humanClicks) * 100) : 0
      }));

      const bySource = (facet.bySource || []).map((s) => ({
        source: s._id,
        count: s.count,
        percent: humanClicks > 0 ? Math.round((s.count / humanClicks) * 100) : 0
      }));

      const byMedium = (facet.byMedium || []).map((m) => ({
        medium: m._id,
        count: m.count,
        percent: humanClicks > 0 ? Math.round((m.count / humanClicks) * 100) : 0
      }));

      return res.json({
        range,
        slug: slug || null,
        campaign: campaign || null,
        totalLinks,
        totalClicks: humanClicks,
        rawClicks,
        botClicks,
        uniqueVisitors,
        totalScans,
        deviceBreakdown,
        topReferrers,
        topCountries,
        topLinks,
        byCampaign,
        bySource,
        byMedium,
        devices: facet.devices || [],
        browsers: facet.browsers || [],
        os: facet.os || [],
        timeseries: facet.timeseries || [],
        recentClicks: facet.recentClicks || []
      });
    }

    // In-memory fallback
    const allClicks = Array.isArray(memStore.clicks) ? memStore.clicks : [];
    const matched = allClicks.filter((c) => {
      if (!isAdmin && c.ownerEmail !== email) return false;
      if (slug && c.slug !== slug) return false;
      if (campaign && (c.utmCampaign || '').toLowerCase() !== campaign.toLowerCase()) return false;
      if (new Date(c.timestamp) < sinceDate) return false;
      return true;
    });

    const rawClicks = matched.length;
    let botClicks = 0;
    let humanClicks = 0;
    const uniqueHashes = new Set();
    const referrersMap = {};
    const devicesMap = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const countriesMap = {};
    const campaignsMap = {};
    const sourcesMap = {};
    const mediumsMap = {};

    matched.forEach((c) => {
      if (c.isBot) {
        botClicks++;
      } else {
        humanClicks++;
        if (c.ipHash) uniqueHashes.add(c.ipHash);
        const ref = c.referrer || 'Direct';
        referrersMap[ref] = (referrersMap[ref] || 0) + 1;
        const dev = c.device || 'Desktop';
        devicesMap[dev] = (devicesMap[dev] || 0) + 1;
        const co = c.country || 'Unknown';
        countriesMap[co] = (countriesMap[co] || 0) + 1;
        if (c.utmCampaign) campaignsMap[c.utmCampaign] = (campaignsMap[c.utmCampaign] || 0) + 1;
        if (c.utmSource) sourcesMap[c.utmSource] = (sourcesMap[c.utmSource] || 0) + 1;
        if (c.utmMedium) mediumsMap[c.utmMedium] = (mediumsMap[c.utmMedium] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(referrersMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: humanClicks > 0 ? Math.round((count / humanClicks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const deviceBreakdown = {
      mobile: humanClicks > 0 ? Math.round(((devicesMap.Mobile || 0) / humanClicks) * 100) : 0,
      desktop: humanClicks > 0 ? Math.round(((devicesMap.Desktop || 0) / humanClicks) * 100) : 0,
      tablet: humanClicks > 0 ? Math.round(((devicesMap.Tablet || 0) / humanClicks) * 100) : 0
    };

    const topCountries = Object.entries(countriesMap)
      .map(([country, count]) => ({
        country,
        count,
        percent: humanClicks > 0 ? Math.round((count / humanClicks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byCampaign = Object.entries(campaignsMap)
      .map(([camp, count]) => ({
        campaign: camp,
        count,
        percent: humanClicks > 0 ? Math.round((count / humanClicks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const bySource = Object.entries(sourcesMap)
      .map(([src, count]) => ({
        source: src,
        count,
        percent: humanClicks > 0 ? Math.round((count / humanClicks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const byMedium = Object.entries(mediumsMap)
      .map(([med, count]) => ({
        medium: med,
        count,
        percent: humanClicks > 0 ? Math.round((count / humanClicks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return res.json({
      range,
      retentionDays,
      slug: slug || null,
      campaign: campaign || null,
      totalLinks,
      totalClicks: humanClicks,
      rawClicks,
      botClicks,
      uniqueVisitors: uniqueHashes.size,
      totalScans,
      deviceBreakdown,
      topReferrers,
      topCountries,
      topLinks: [],
      byCampaign,
      bySource,
      byMedium,
      devices: Object.entries(devicesMap).map(([k, v]) => ({ _id: k, count: v })),
      browsers: [],
      os: [],
      timeseries: [],
      recentClicks: matched.slice(-25).reverse()
    });
  } catch (err) {
    console.error('[Analytics overview error]', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
   ========================================================= */

router.get('/api/analytics/stream', authMiddleware, (req, res) => {
  const email = (req.user.email || '').toLowerCase().trim();
  const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date() })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  const clickListener = (click) => {
    if (isAdmin || (click.ownerEmail && click.ownerEmail.toLowerCase() === email)) {
      res.write(`event: click\ndata: ${JSON.stringify(click)}\n\n`);
    }
  };

  analyticsEmitter.on('click', clickListener);

  req.on('close', () => {
    clearInterval(heartbeat);
    analyticsEmitter.off('click', clickListener);
  });
});

module.exports = router;

