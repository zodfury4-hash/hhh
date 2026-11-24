#!/usr/bin/env node
/**
 * One-time idempotent migration script:
 * Migrates embedded Link.clicks[] arrays into the dedicated Click collection.
 *
 * Usage:
 *   node scripts/migrate-clicks.js
 *   node scripts/migrate-clicks.js --clear-old
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Link = require('../backend/models/Link');
const Click = require('../backend/models/Click');
const { hashIp } = require('../backend/services/telemetry-service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink';
const clearOld = process.argv.includes('--clear-old');
const dryRun = process.argv.includes('--dry-run');

async function migrate() {
  console.log('🚀 Starting Clicks Migration into dedicated Click collection...');
  if (dryRun) console.log('🔍 DRY RUN MODE ENABLED: No changes will be written to database.');
  console.log(`🔗 Connecting to MongoDB: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const linksWithClicks = await Link.find({
    $or: [{ 'clicks.0': { $exists: true } }, { clicks: { $exists: true, $ne: [] } }]
  });

  console.log(`📦 Found ${linksWithClicks.length} links with legacy embedded clicks.`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let linksUpdated = 0;

  for (const link of linksWithClicks) {
    const rawClicks = Array.isArray(link.clicks) ? link.clicks : [];
    if (!rawClicks.length) continue;

    const clicksToInsert = [];

    for (const c of rawClicks) {
      const clickTime = c.timestamp ? new Date(c.timestamp) : new Date(link.createdAt || Date.now());
      const ip = c.ip || '127.0.0.1';
      const ipHash = hashIp(ip, clickTime);

      // Check if already migrated (idempotency guard)
      const existing = await Click.findOne({
        slug: link.slug,
        ownerEmail: link.ownerEmail,
        timestamp: clickTime,
        ipHash
      });

      if (existing) {
        totalSkipped++;
        continue;
      }

      clicksToInsert.push({
        linkId: link._id,
        slug: link.slug,
        ownerEmail: link.ownerEmail,
        timestamp: clickTime,
        ipHash,
        country: c.country && c.country !== 'US' ? c.country : c.country || 'Unknown',
        city: 'Unknown',
        device: c.device === 'Mobile' || c.device === 'Tablet' ? c.device : 'Desktop',
        browser: 'Unknown',
        os: 'Unknown',
        referrer: c.referer || c.referrer || 'Direct',
        isBot: !!c.isBot,
        isQr: false
      });
    }

    if (clicksToInsert.length > 0) {
      if (!dryRun) {
        await Click.insertMany(clicksToInsert, { ordered: false });
      }
      totalMigrated += clicksToInsert.length;
    }

    const bots = rawClicks.filter((c) => c.isBot).length;
    const humans = rawClicks.length - bots;

    // Update link counters
    const updatePayload = {
      $set: {
        totalClicks: Math.max(link.totalClicks || 0, rawClicks.length),
        humanClicks: Math.max(link.humanClicks || 0, humans),
        botClicks: Math.max(link.botClicks || 0, bots),
        scans: Math.max(link.scans || 0, link.totalScans || 0),
        totalScans: Math.max(link.totalScans || 0, link.scans || 0)
      }
    };

    if (clearOld) {
      updatePayload.$unset = { clicks: 1 };
    }

    if (!dryRun) {
      await Link.updateOne({ _id: link._id }, updatePayload);
    }
    linksUpdated++;
  }

  console.log('\n========================================');
  console.log(`🎉 Migration Completed Successfully!`);
  console.log(`   - Links Updated:   ${linksUpdated}`);
  console.log(`   - Clicks Migrated: ${totalMigrated}`);
  console.log(`   - Clicks Skipped:  ${totalSkipped}`);
  if (clearOld) {
    console.log(`   - Legacy arrays:   Removed ($unset: clicks)`);
  } else {
    console.log(`   - Legacy arrays:   Preserved (run with --clear-old to prune)`);
  }
  console.log('========================================\n');

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
