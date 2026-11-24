const crypto = require('crypto');
const { EventEmitter } = require('events');
const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');

const Click = require('../models/Click');
const Link = require('../models/Link');
const memStore = require('../utils/memStore');
const mongoose = require('mongoose');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Global Event Emitter for Real-Time SSE Click Stream
const analyticsEmitter = new EventEmitter();
analyticsEmitter.setMaxListeners(200);

/**
 * Generate a privacy-preserving daily-salted IP hash
 * Raw IPs are never stored in the database.
 */
function hashIp(ip = '', date = new Date()) {
  const cleanIp = (ip || '').toString().trim() || '127.0.0.1';
  const dayStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const salt = process.env.IP_SALT || process.env.JWT_SECRET || 'healink-telemetry-salt-2026';
  return crypto.createHash('sha256').update(`${cleanIp}:${dayStr}:${salt}`).digest('hex');
}

/**
 * Determine country using Cloudflare headers or geoip-lite lookup
 * Returns 'Unknown' if not found — NEVER hardcodes 'US'.
 */
function resolveCountry(req) {
  if (!req) return 'Unknown';

  // 1. Cloudflare / CDN headers
  const cfCountry = req.headers ? req.headers['cf-ipcountry'] : null;
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return String(cfCountry).trim().toUpperCase();
  }

  const xCountry = req.headers ? req.headers['x-country'] : null;
  if (xCountry && xCountry.trim()) {
    return String(xCountry).trim().toUpperCase();
  }

  // 2. GeoIP lookup from client IP
  const rawIp = req.ip || req.connection?.remoteAddress || '';
  const cleanIp = rawIp.replace(/^::ffff:/, '').trim();

  // Skip local/loopback
  if (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('172.')
  ) {
    return 'Unknown';
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      return String(geo.country).trim().toUpperCase();
    }
  } catch (_e) {}

  return 'Unknown';
}

/**
 * Determine city from GeoIP
 */
function resolveCity(req) {
  if (!req) return 'Unknown';
  const rawIp = req.ip || req.connection?.remoteAddress || '';
  const cleanIp = rawIp.replace(/^::ffff:/, '').trim();

  if (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.')
  ) {
    return 'Unknown';
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.city) {
      return String(geo.city).trim();
    }
  } catch (_e) {}

  return 'Unknown';
}

/**
 * Known Bot User-Agent patterns
 */
const BOT_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|slackbot|linkedinbot|discordbot|bingbot|googlebot|yandex|applebot|curl|wget|python-requests|headlesschrome|phantomjs/i;

/**
 * Parse User-Agent using ua-parser-js with bot detection
 */
function parseUserAgent(uaString = '') {
  const ua = (uaString || '').trim();
  const isBot = BOT_REGEX.test(ua);

  const parser = new UAParser(ua);
  const result = parser.getResult();

  // Device detection: Mobile, Tablet, Desktop, or Other
  let device = 'Desktop';
  const devType = result.device.type; // 'mobile', 'tablet', etc.

  if (devType === 'tablet' || /ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = 'Tablet';
  } else if (devType === 'mobile' || /mobile|iphone|ipod|android|blackberry|iemobile/i.test(ua)) {
    device = 'Mobile';
  } else if (isBot) {
    device = 'Other';
  }

  const browser = result.browser.name || (isBot ? 'Bot' : 'Unknown');
  const os = result.os.name || 'Unknown';

  return {
    device,
    browser,
    os,
    isBot
  };
}

/**
 * Parse clean referrer channel
 */
function parseReferrer(rawReferer = '') {
  if (!rawReferer || rawReferer === 'direct') return 'Direct';
  try {
    const host = new URL(rawReferer).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('linkedin') || host.includes('lnkd.in')) return 'LinkedIn';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('pinterest')) return 'Pinterest';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('whatsapp')) return 'WhatsApp';
    return host;
  } catch (_e) {
    return 'Direct';
  }
}

/**
 * Record a click in the background (called via setImmediate so 302 redirect is instantaneous)
 */
async function recordClick({ link, slug, req, isQr = false, skipCounterIncrement = false }) {
  try {
    const now = new Date();
    const rawIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers ? req.headers['user-agent'] || '' : '';
    const refererHeader = req.headers ? req.headers.referer || req.headers.referrer || '' : '';

    const ipHash = hashIp(rawIp, now);
    const country = resolveCountry(req);
    const city = resolveCity(req);
    const { device, browser, os, isBot } = parseUserAgent(userAgent);
    const referrer = parseReferrer(refererHeader);

    const ownerEmail = (link?.ownerEmail || '').toLowerCase().trim();
    const linkId = link?._id || null;

    const q = req.query || {};
    const utmSource = (q.utm_source || link?.utm?.source || '').toString().trim().toLowerCase().slice(0, 100) || null;
    const utmMedium = (q.utm_medium || link?.utm?.medium || '').toString().trim().toLowerCase().slice(0, 100) || null;
    const utmCampaign = (q.utm_campaign || link?.utm?.campaign || '').toString().trim().toLowerCase().slice(0, 100) || null;
    const utmTerm = (q.utm_term || link?.utm?.term || '').toString().trim().toLowerCase().slice(0, 100) || null;
    const utmContent = (q.utm_content || link?.utm?.content || '').toString().trim().toLowerCase().slice(0, 100) || null;

    const clickData = {
      linkId,
      slug: (slug || link?.slug || '').toLowerCase().trim(),
      ownerEmail,
      timestamp: now,
      ipHash,
      country,
      city,
      device,
      browser,
      os,
      referrer,
      isBot,
      isQr: !!isQr,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    };

    // 1. Save to MongoDB Click collection
    if (isDbConnected()) {
      const clickDoc = await Click.create(clickData);

      // Increment counters on Link document ($inc only, avoiding unbounded array growth)
      if (linkId && !skipCounterIncrement) {
        await Link.updateOne(
          { _id: linkId },
          {
            $inc: {
              totalClicks: 1,
              humanClicks: isBot ? 0 : 1,
              botClicks: isBot ? 1 : 0,
              totalScans: isQr ? 1 : 0,
              scans: isQr ? 1 : 0
            }
          }
        );
      }

      // Broadcast to real-time subscribers
      analyticsEmitter.emit('click', clickDoc.toObject());
    } else {
      // In-memory fallback
      if (!Array.isArray(memStore.clicks)) memStore.clicks = [];
      memStore.clicks.push(clickData);

      if (link && !skipCounterIncrement) {
        link.totalClicks = (link.totalClicks || 0) + 1;
        if (isBot) {
          link.botClicks = (link.botClicks || 0) + 1;
        } else {
          link.humanClicks = (link.humanClicks || 0) + 1;
        }
        if (isQr) {
          link.totalScans = (link.totalScans || 0) + 1;
          link.scans = (link.scans || 0) + 1;
        }
      }

      analyticsEmitter.emit('click', clickData);
    }
  } catch (err) {
    console.warn('[Telemetry recordClick error]', err.message);
  }
}

module.exports = {
  hashIp,
  resolveCountry,
  resolveCity,
  parseUserAgent,
  parseReferrer,
  recordClick,
  analyticsEmitter
};
