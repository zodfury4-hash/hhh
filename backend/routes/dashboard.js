'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { z } = require('zod');

const Link = require('../models/Link');
const Click = require('../models/Click');
const Notification = require('../models/Notification');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { getEntitlements } = require('../config/plans');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Short-term in-memory cache for dashboard summary (15-30s TTL per user+range+tz)
const summaryCache = new Map();
const CACHE_TTL_MS = 20 * 1000;

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, item] of summaryCache.entries()) {
    if (item.expiresAt <= now) {
      summaryCache.delete(key);
    }
  }
}

// Periodic cleanup every 60s
setInterval(cleanExpiredCache, 60 * 1000).unref();

function validateTimezone(tz) {
  if (!tz || typeof tz !== 'string') return 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch (_e) {
    return 'UTC';
  }
}

function formatInTz(date, timeZone, isHourly) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(isHourly ? { hour: '2-digit', hour12: false } : {})
  });
  const parts = formatter.formatToParts(d);
  const partMap = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });
  if (isHourly) {
    return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:00`;
  }
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

function generateTimeSlots(now, range, tz) {
  const isHourly = range === '24h';
  const count = isHourly ? 24 : range === '30d' ? 30 : 7;
  const stepMs = isHourly ? 3600000 : 86400000;
  const slots = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * stepMs);
    const t = formatInTz(d, tz, isHourly);
    slots.push({ t, clicks: 0, uniques: 0 });
  }
  return slots;
}

function calculateTrend(current, previous) {
  if (previous === 0 || previous == null) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return Math.min(999, Math.max(-999, pct));
}

function getShortBaseUrl(req) {
  if (process.env.PUBLIC_SHORT_BASE_URL) {
    return process.env.PUBLIC_SHORT_BASE_URL.replace(/\/+$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}`;
}

const querySchema = z.object({
  range: z.enum(['24h', '7d', '30d']).optional().default('7d'),
  tz: z.string().optional()
});

/**
 * GET /api/dashboard/summary
 * Primary Single Source of Truth for Dashboard Home View
 */
router.get('/api/dashboard/summary', apiLimiter, authMiddleware, async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid query parameters',
        details: parsed.error.issues
      });
    }

    const { range } = parsed.data;
    const tz = validateTimezone(parsed.data.tz);
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const workspaceId = req.headers['x-workspace-id'] || null;

    // Check short-term cache
    const cacheKey = `${email}:${range}:${tz}:${workspaceId || 'default'}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.payload);
    }

    const now = new Date();
    const isHourly = range === '24h';
    const durationMs = isHourly ? 24 * 3600000 : range === '30d' ? 30 * 86400000 : 7 * 86400000;
    const sinceDate = new Date(now.getTime() - durationMs);
    const previousSince = new Date(sinceDate.getTime() - durationMs);

    // Plan entitlements check
    const entitlements = getEntitlements(req.user);
    const retentionDays = isAdmin ? 1095 : entitlements.analyticsRetentionDays || 30;
    const oldestAllowed = new Date(now.getTime() - retentionDays * 86400000);
    const clampedSince = sinceDate < oldestAllowed ? oldestAllowed : sinceDate;

    // 1. Fetch user's links
    let userLinks = [];
    if (isDbConnected()) {
      const linkQuery = isAdmin ? {} : { ownerEmail: email };
      if (workspaceId) {
        linkQuery.workspaceId = workspaceId;
      }
      userLinks = await Link.find(linkQuery).sort({ createdAt: -1 }).lean();
    } else {
      userLinks = (memStore.links || []).filter((l) => {
        if (!isAdmin && (l.ownerEmail || '').toLowerCase() !== email) return false;
        if (workspaceId && String(l.workspaceId) !== String(workspaceId)) return false;
        return true;
      });
    }

    const totalLinks = userLinks.length;
    const previousLinksCount = userLinks.filter((l) => new Date(l.createdAt || 0) < sinceDate).length;
    const totalQrScans = userLinks.reduce((sum, l) => sum + (l.totalScans || l.scans || 0), 0);

    // 2. Fetch clicks in current and previous windows
    let currentClicks = [];
    let prevClicks = [];

    if (isDbConnected()) {
      const clickQuery = {
        timestamp: { $gte: clampedSince, $lte: now }
      };
      if (!isAdmin) {
        clickQuery.ownerEmail = email;
      }
      currentClicks = await Click.find(clickQuery).lean();

      const prevQuery = {
        timestamp: { $gte: previousSince, $lt: clampedSince },
        isBot: false
      };
      if (!isAdmin) {
        prevQuery.ownerEmail = email;
      }
      prevClicks = await Click.find(prevQuery, 'ipHash').lean();
    } else {
      const allClicks = Array.isArray(memStore.clicks) ? memStore.clicks : [];
      currentClicks = allClicks.filter((c) => {
        if (!isAdmin && (c.ownerEmail || '').toLowerCase() !== email) return false;
        const ts = new Date(c.timestamp);
        return ts >= clampedSince && ts <= now;
      });
      prevClicks = allClicks.filter((c) => {
        if (!isAdmin && (c.ownerEmail || '').toLowerCase() !== email) return false;
        if (c.isBot) return false;
        const ts = new Date(c.timestamp);
        return ts >= previousSince && ts < clampedSince;
      });
    }

    // Human vs bot split
    const humanClicks = currentClicks.filter((c) => !c.isBot);
    const botClicks = currentClicks.filter((c) => c.isBot);
    const qrClicks = currentClicks.filter((c) => c.isQr);

    const currentHumanClicksCount = humanClicks.length;
    const currentBotClicksCount = botClicks.length;
    const currentQrScansCount = qrClicks.length || totalQrScans;

    const uniqueIps = new Set(humanClicks.map((c) => c.ipHash).filter(Boolean));
    const currentUniqueVisitors = uniqueIps.size;

    // Previous window metrics
    const prevHumanClicksCount = prevClicks.length;
    const prevUniqueVisitors = new Set(prevClicks.map((c) => c.ipHash).filter(Boolean)).size;

    // 3. Trends calculation
    const trends = {
      clicksPct: calculateTrend(currentHumanClicksCount, prevHumanClicksCount),
      visitorsPct: calculateTrend(currentUniqueVisitors, prevUniqueVisitors),
      linksPct: calculateTrend(totalLinks, previousLinksCount)
    };

    // 4. Timeseries aggregation with zero-filled slots in timezone
    const slots = generateTimeSlots(now, range, tz);
    const slotMap = new Map();
    slots.forEach((s) => slotMap.set(s.t, s));
    const slotUniques = new Map();

    humanClicks.forEach((c) => {
      const t = formatInTz(c.timestamp, tz, isHourly);
      if (slotMap.has(t)) {
        const slot = slotMap.get(t);
        slot.clicks++;
        if (!slotUniques.has(t)) slotUniques.set(t, new Set());
        if (c.ipHash) slotUniques.get(t).add(c.ipHash);
      }
    });

    slots.forEach((s) => {
      s.uniques = slotUniques.has(s.t) ? slotUniques.get(s.t).size : 0;
    });

    // Peak determination
    let peak = null;
    slots.forEach((s) => {
      if (s.clicks > 0 && (!peak || s.clicks > peak.clicks)) {
        peak = { t: s.t, clicks: s.clicks };
      }
    });

    // 5. Top Performer Link
    const slugClickCounts = {};
    humanClicks.forEach((c) => {
      if (c.slug) {
        slugClickCounts[c.slug] = (slugClickCounts[c.slug] || 0) + 1;
      }
    });

    let topSlug = null;
    let topCount = 0;
    Object.entries(slugClickCounts).forEach(([s, cnt]) => {
      if (cnt > topCount) {
        topCount = cnt;
        topSlug = s;
      }
    });

    let topPerformer = null;
    if (topSlug) {
      const topLink = userLinks.find((l) => l.slug === topSlug);
      topPerformer = {
        slug: topSlug,
        title: topLink?.title || topSlug,
        clicks: topCount
      };
    }

    // 6. Top Referrers
    const refCounts = {};
    humanClicks.forEach((c) => {
      const r = (c.referrer || 'Direct').trim();
      refCounts[r] = (refCounts[r] || 0) + 1;
    });

    const sortedRefs = Object.entries(refCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: currentHumanClicksCount > 0 ? Math.round((count / currentHumanClicksCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    let referrers = [];
    if (sortedRefs.length <= 4) {
      referrers = sortedRefs;
    } else {
      const top4 = sortedRefs.slice(0, 4);
      const othersCount = sortedRefs.slice(4).reduce((sum, r) => sum + r.count, 0);
      const othersPercent = currentHumanClicksCount > 0 ? Math.round((othersCount / currentHumanClicksCount) * 100) : 0;
      referrers = [...top4, { name: 'Others', count: othersCount, percent: othersPercent }];
    }

    // 7. Recent Links (Latest 3-5 with 7-day sparkline)
    const baseUrl = getShortBaseUrl(req);
    const sparklineDays = 7;
    const sparklineSlots = [];
    for (let i = sparklineDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      sparklineSlots.push(formatInTz(d, tz, false));
    }

    const recentLinks = userLinks.slice(0, 5).map((l) => {
      // Calculate sparkline points for this specific link over last 7 days
      const sparkMap = {};
      sparklineSlots.forEach((day) => {
        sparkMap[day] = 0;
      });

      humanClicks.forEach((c) => {
        if (c.slug === l.slug) {
          const day = formatInTz(c.timestamp, tz, false);
          if (sparkMap[day] !== undefined) {
            sparkMap[day]++;
          }
        }
      });

      const sparkline = sparklineSlots.map((day) => sparkMap[day]);

      return {
        slug: l.slug,
        shortUrl: `${baseUrl}/${l.slug}`,
        dest: l.dest,
        title: l.title || l.slug,
        clicks: l.totalClicks || l.clicks || 0,
        sparkline
      };
    });

    // 8. Active Now (unique ipHash in last 5 minutes across user links)
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const activeIps = new Set(
      humanClicks
        .filter((c) => new Date(c.timestamp) >= fiveMinAgo && c.ipHash)
        .map((c) => c.ipHash)
    );
    const activeNow = { visitors: activeIps.size };

    // 9. Unread Notifications Count
    let unreadCount = 0;
    if (isDbConnected()) {
      try {
        unreadCount = await Notification.countDocuments({
          ownerEmail: email,
          readAt: null
        });
      } catch (_e) {
        unreadCount = 0;
      }
    } else {
      const notifs = Array.isArray(memStore.notifications) ? memStore.notifications : [];
      unreadCount = notifs.filter((n) => (n.ownerEmail || '').toLowerCase() === email && !n.readAt).length;
    }

    // 10. Avg clicks / link calculation
    const avgClicksPerLink = totalLinks > 0 ? parseFloat((currentHumanClicksCount / totalLinks).toFixed(1)) : 0;

    const payload = {
      range,
      generatedAt: now.toISOString(),
      totals: {
        links: totalLinks,
        humanClicks: currentHumanClicksCount,
        botClicks: currentBotClicksCount,
        uniqueVisitors: currentUniqueVisitors,
        qrScans: currentQrScansCount,
        avgClicksPerLink
      },
      previous: {
        humanClicks: prevHumanClicksCount,
        uniqueVisitors: prevUniqueVisitors,
        links: previousLinksCount
      },
      trends,
      topPerformer,
      timeseries: slots,
      peak,
      referrers,
      recentLinks,
      activeNow,
      notifications: { unread: unreadCount },
      plan: {
        key: entitlements.planKey,
        name: entitlements.name,
        badge: entitlements.badge,
        isPaid: entitlements.priceMonthly > 0
      }
    };

    summaryCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
