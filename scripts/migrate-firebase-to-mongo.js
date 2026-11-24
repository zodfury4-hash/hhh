#!/usr/bin/env node
/**
 * One-off idempotent Firebase Realtime Database -> MongoDB Migration Script
 *
 * Usage:
 *   node scripts/migrate-firebase-to-mongo.js [path/to/rtdb-export.json] [--dry-run]
 *
 * Reads FIREBASE_DATABASE_URL via plain HTTP REST (<url>/.json) if reachable,
 * or reads a local Firebase RTDB JSON export file passed on the command line.
 * Upserts users, links, QR codes, bio pages, custom domains, and click counts
 * into MongoDB without overwriting newer MongoDB records.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../backend/models/User');
const Link = require('../backend/models/Link');
const QRCode = require('../backend/models/QRCode');
const BioPage = require('../backend/models/BioPage');
const CustomDomain = require('../backend/models/CustomDomain');

function decodeKeyEmail(key, profile) {
  if (profile && typeof profile.email === 'string' && profile.email.includes('@')) {
    return profile.email.toLowerCase().trim();
  }
  const restored = String(key || '').replace(/_dot_/g, '.');
  return restored.includes('@') ? restored.toLowerCase().trim() : '';
}

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isIncomingNewer(existingDoc, incomingObj) {
  if (!existingDoc) return true;
  const incUpdated = toDate(incomingObj.updatedAt || incomingObj.createdAt);
  const curUpdated = toDate(existingDoc.updatedAt || existingDoc.createdAt);
  if (!incUpdated || !curUpdated) return false;
  return incUpdated.getTime() > curUpdated.getTime();
}

async function loadFirebaseSnapshot(fileArg) {
  if (fileArg) {
    const resolved = path.resolve(process.cwd(), fileArg);
    if (!fs.existsSync(resolved)) {
      throw new Error(`JSON export file not found: ${resolved}`);
    }
    const raw = fs.readFileSync(resolved, 'utf8');
    return JSON.parse(raw);
  }

  const baseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error(
      'No export file path provided and FIREBASE_DATABASE_URL is not set in environment.'
    );
  }

  const secret = process.env.FIREBASE_DATABASE_SECRET || '';
  const url = secret ? `${baseUrl}/.json?auth=${encodeURIComponent(secret)}` : `${baseUrl}/.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase RTDB snapshot: HTTP ${res.status}`);
  }
  return await res.json();
}

function makeStats() {
  return {
    users: { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 },
    links: { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 },
    qrs: { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 },
    bios: { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 },
    domains: { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 }
  };
}

async function migrateSnapshot(snapshot, { dryRun = false } = {}) {
  const stats = makeStats();
  if (!snapshot || typeof snapshot !== 'object') {
    return stats;
  }

  const seenLinkSlugs = new Set();
  const seenBioSlugs = new Set();

  const usersNode = snapshot.users && typeof snapshot.users === 'object' ? snapshot.users : {};

  // 1. Migrate per-user subtrees
  for (const [userKey, userBucket] of Object.entries(usersNode)) {
    if (!userBucket || typeof userBucket !== 'object') continue;

    const profile = userBucket.profile && typeof userBucket.profile === 'object' ? userBucket.profile : userBucket;
    const ownerEmail = decodeKeyEmail(userKey, profile);

    if (ownerEmail) {
      stats.users.found++;
      try {
        const existingUser = await User.findOne({ email: ownerEmail });
        if (!existingUser) {
          if (!dryRun) {
            await User.create({
              name: profile.name || ownerEmail.split('@')[0],
              email: ownerEmail,
              password: null,
              authProviders: profile.provider === 'google' || profile.provider === 'firebase-google' ? ['google'] : [],
              isVerified: profile.isVerified !== undefined ? Boolean(profile.isVerified) : true,
              isPro: Boolean(profile.isPro),
              role: profile.isAdmin || profile.role === 'admin' ? 'admin' : 'user',
              plan: profile.plan || (profile.isPro ? 'Core PRO' : 'Free'),
              avatar: profile.avatar || '',
              createdAt: toDate(profile.createdAt) || new Date()
            });
          }
          stats.users.inserted++;
        } else if (isIncomingNewer(existingUser, profile)) {
          if (!dryRun) {
            if (!existingUser.name && profile.name) existingUser.name = profile.name;
            if (profile.isPro && !existingUser.isPro) {
              existingUser.isPro = true;
              existingUser.plan = profile.plan || existingUser.plan;
            }
            await existingUser.save();
          }
          stats.users.updated++;
        } else {
          stats.users.skipped++;
        }
      } catch (err) {
        stats.users.failed++;
        console.warn(`[User failed] ${ownerEmail}: ${err.message}`);
      }
    }

    // 1a. User links
    const userLinks = userBucket.links && typeof userBucket.links === 'object' ? userBucket.links : {};
    for (const [slugKey, linkData] of Object.entries(userLinks)) {
      if (!linkData || typeof linkData !== 'object') continue;
      const slug = String(linkData.slug || slugKey || '').trim().toLowerCase();
      if (!slug || !linkData.dest || seenLinkSlugs.has(slug)) continue;
      seenLinkSlugs.add(slug);
      stats.links.found++;

      const clickCount =
        typeof linkData.totalClicks === 'number'
          ? linkData.totalClicks
          : typeof linkData.clicks === 'number'
            ? linkData.clicks
            : Array.isArray(linkData.clicks)
              ? linkData.clicks.length
              : 0;
      const scanCount = typeof linkData.scans === 'number' ? linkData.scans : 0;

      try {
        const existing = await Link.findOne({ slug });
        if (!existing) {
          if (!dryRun) {
            await Link.create({
              ownerEmail: (linkData.ownerEmail || ownerEmail || 'guest').toLowerCase().trim(),
              slug,
              dest: String(linkData.dest).trim(),
              title: linkData.title || 'Untitled Link',
              tag: linkData.tag || 'General',
              totalClicks: clickCount,
              humanClicks: clickCount,
              scans: scanCount,
              totalScans: scanCount,
              createdAt: toDate(linkData.createdAt) || new Date()
            });
          }
          stats.links.inserted++;
        } else if (clickCount > (existing.totalClicks || 0)) {
          if (!dryRun) {
            existing.totalClicks = clickCount;
            if (clickCount > (existing.humanClicks || 0)) existing.humanClicks = clickCount;
            if (scanCount > (existing.scans || 0)) {
              existing.scans = scanCount;
              existing.totalScans = scanCount;
            }
            await existing.save();
          }
          stats.links.updated++;
        } else {
          stats.links.skipped++;
        }
      } catch (err) {
        stats.links.failed++;
        console.warn(`[Link failed] ${slug}: ${err.message}`);
      }
    }

    // 1b. User QRs
    const userQrs = userBucket.qrs && typeof userBucket.qrs === 'object' ? userBucket.qrs : {};
    for (const qrData of Object.values(userQrs)) {
      if (!qrData || typeof qrData !== 'object' || !qrData.dest) continue;
      const qrOwner = (qrData.ownerEmail || ownerEmail || 'guest').toLowerCase().trim();
      stats.qrs.found++;

      try {
        const existing = await QRCode.findOne({
          ownerEmail: qrOwner,
          dest: String(qrData.dest).trim(),
          title: qrData.title || 'My QR Code'
        });
        if (!existing) {
          if (!dryRun) {
            await QRCode.create({
              ownerEmail: qrOwner,
              title: qrData.title || 'My QR Code',
              dest: String(qrData.dest).trim(),
              color: qrData.color || '#38bdf8',
              scans: typeof qrData.scans === 'number' ? qrData.scans : 0,
              createdAt: toDate(qrData.createdAt) || new Date()
            });
          }
          stats.qrs.inserted++;
        } else {
          stats.qrs.skipped++;
        }
      } catch (err) {
        stats.qrs.failed++;
        console.warn(`[QR failed] ${qrOwner}: ${err.message}`);
      }
    }

    // 1c. User Bios
    const userBios = userBucket.bios && typeof userBucket.bios === 'object' ? userBucket.bios : {};
    for (const [bioKey, bioData] of Object.entries(userBios)) {
      if (!bioData || typeof bioData !== 'object') continue;
      const slug = String(bioData.slug || bioKey || '').trim().toLowerCase();
      if (!slug || seenBioSlugs.has(slug)) continue;
      seenBioSlugs.add(slug);
      stats.bios.found++;

      try {
        const existing = await BioPage.findOne({ slug });
        if (!existing) {
          if (!dryRun) {
            await BioPage.create({
              ownerEmail: (bioData.ownerEmail || ownerEmail || 'guest').toLowerCase().trim(),
              slug,
              title: bioData.title || 'My Bio Page',
              tagline: bioData.tagline || '',
              avatar: bioData.avatar || '',
              theme: bioData.theme || 'cyber-dark',
              links: Array.isArray(bioData.links) ? bioData.links : [],
              views: typeof bioData.views === 'number' ? bioData.views : 0,
              createdAt: toDate(bioData.createdAt) || new Date()
            });
          }
          stats.bios.inserted++;
        } else {
          stats.bios.skipped++;
        }
      } catch (err) {
        stats.bios.failed++;
        console.warn(`[Bio failed] ${slug}: ${err.message}`);
      }
    }

    // 1d. User Domains
    const userDomains = userBucket.domains && typeof userBucket.domains === 'object' ? userBucket.domains : {};
    for (const domData of Object.values(userDomains)) {
      if (!domData || typeof domData !== 'object' || !domData.domain) continue;
      const domainName = String(domData.domain).toLowerCase().trim();
      const domOwner = (domData.ownerEmail || ownerEmail || '').toLowerCase().trim();
      if (!domOwner) continue;
      stats.domains.found++;

      try {
        const existing = await CustomDomain.findOne({ ownerEmail: domOwner, domain: domainName });
        if (!existing) {
          if (!dryRun) {
            await CustomDomain.create({
              ownerEmail: domOwner,
              domain: domainName,
              status: domData.status === 'active' ? 'active' : 'pending_verification',
              verificationToken: domData.verificationToken || `hea-verify-${crypto.randomBytes(12).toString('hex')}`,
              cnameTarget: domData.cnameTarget || process.env.CNAME_TARGET || 'cname.healink.store',
              createdAt: toDate(domData.createdAt) || new Date()
            });
          }
          stats.domains.inserted++;
        } else {
          stats.domains.skipped++;
        }
      } catch (err) {
        stats.domains.failed++;
        console.warn(`[Domain failed] ${domainName}: ${err.message}`);
      }
    }
  }

  // 2. Top-level /slugs fallback for slugs not already under /users
  const topSlugs = snapshot.slugs && typeof snapshot.slugs === 'object' ? snapshot.slugs : {};
  for (const [slugKey, linkData] of Object.entries(topSlugs)) {
    if (!linkData || typeof linkData !== 'object') continue;
    const slug = String(linkData.slug || slugKey || '').trim().toLowerCase();
    if (!slug || !linkData.dest || seenLinkSlugs.has(slug)) continue;
    seenLinkSlugs.add(slug);
    stats.links.found++;

    try {
      const existing = await Link.findOne({ slug });
      if (!existing) {
        if (!dryRun) {
          await Link.create({
            ownerEmail: (linkData.ownerEmail || 'guest').toLowerCase().trim(),
            slug,
            dest: String(linkData.dest).trim(),
            title: linkData.title || 'Untitled Link',
            tag: linkData.tag || 'General',
            totalClicks: typeof linkData.clicks === 'number' ? linkData.clicks : 0,
            humanClicks: typeof linkData.clicks === 'number' ? linkData.clicks : 0,
            createdAt: toDate(linkData.createdAt) || new Date()
          });
        }
        stats.links.inserted++;
      } else {
        stats.links.skipped++;
      }
    } catch (err) {
      stats.links.failed++;
      console.warn(`[Top Slug failed] ${slug}: ${err.message}`);
    }
  }

  // 3. Top-level /bios fallback
  const topBios = snapshot.bios && typeof snapshot.bios === 'object' ? snapshot.bios : {};
  for (const [bioKey, bioData] of Object.entries(topBios)) {
    if (!bioData || typeof bioData !== 'object') continue;
    const slug = String(bioData.slug || bioKey || '').trim().toLowerCase();
    if (!slug || seenBioSlugs.has(slug)) continue;
    seenBioSlugs.add(slug);
    stats.bios.found++;

    try {
      const existing = await BioPage.findOne({ slug });
      if (!existing) {
        if (!dryRun) {
          await BioPage.create({
            ownerEmail: (bioData.ownerEmail || 'guest').toLowerCase().trim(),
            slug,
            title: bioData.title || 'My Bio Page',
            tagline: bioData.tagline || '',
            avatar: bioData.avatar || '',
            theme: bioData.theme || 'cyber-dark',
            links: Array.isArray(bioData.links) ? bioData.links : [],
            views: typeof bioData.views === 'number' ? bioData.views : 0,
            createdAt: toDate(bioData.createdAt) || new Date()
          });
        }
        stats.bios.inserted++;
      } else {
        stats.bios.skipped++;
      }
    } catch (err) {
      stats.bios.failed++;
      console.warn(`[Top Bio failed] ${slug}: ${err.message}`);
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => !a.startsWith('--')) || null;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  console.log(`🚀 Starting Firebase -> MongoDB migration (${dryRun ? 'DRY-RUN' : 'LIVE'})...`);

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  try {
    const snapshot = await loadFirebaseSnapshot(fileArg);
    const stats = await migrateSnapshot(snapshot, { dryRun });

    console.log('\n📊 Migration Summary:');
    for (const [entity, s] of Object.entries(stats)) {
      console.log(
        `   ${entity.padEnd(8)} -> found: ${s.found}, inserted: ${s.inserted}, updated: ${s.updated}, skipped: ${s.skipped}, failed: ${s.failed}`
      );
    }
    console.log(`\n✅ Migration ${dryRun ? 'dry-run ' : ''}complete.`);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  });
}

module.exports = {
  migrateSnapshot,
  loadFirebaseSnapshot,
  decodeKeyEmail
};
