'use strict';

/**
 * Migration Script: Migrate Users to Personal Workspaces & Backfill workspaceId
 * Idempotent, supports --dry-run
 */

const mongoose = require('mongoose');
const config = require('../backend/config');
const User = require('../backend/models/User');
const Workspace = require('../backend/models/Workspace');
const Membership = require('../backend/models/Membership');
const Link = require('../backend/models/Link');
const QRCode = require('../backend/models/QRCode');
const BioPage = require('../backend/models/BioPage');
const CustomDomain = require('../backend/models/CustomDomain');
const ApiKey = require('../backend/models/ApiKey');

async function migrateWorkspaces(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run');
  const logPrefix = isDryRun ? '[DRY-RUN] ' : '';

  console.log(`\n🚀 Starting Workspaces & Multi-User Ownership Migration ${isDryRun ? '(DRY-RUN MODE)' : ''}...`);

  let isDb = mongoose.connection.readyState === 1;
  let ownConnection = false;
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 1500 });
      isDb = mongoose.connection.readyState === 1;
      ownConnection = isDb;
    } catch (_err) {
      isDb = false;
    }
  }

  const stats = {
    usersScanned: 0,
    workspacesCreated: 0,
    workspacesExisting: 0,
    membershipsCreated: 0,
    linksUpdated: 0,
    qrsUpdated: 0,
    biosUpdated: 0,
    domainsUpdated: 0,
    apiKeysUpdated: 0
  };

  if (!isDb) {
    const memStore = require('../backend/utils/memStore');
    stats.usersScanned = memStore.users.length;
    for (const user of memStore.users) {
      const email = (user.email || '').toLowerCase().trim();
      let ws = memStore.workspaces.find((w) => w.ownerEmail === email);
      if (!ws) {
        ws = {
          _id: `ws_mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: `${user.name || 'Personal'} Workspace`,
          slug: `personal-${email.replace(/[^a-z0-9]/gi, '-')}`,
          ownerId: user._id || user.id,
          ownerEmail: email,
          type: 'personal',
          planKey: user.plan || 'free',
          settings: { allowInvites: true },
          createdAt: new Date()
        };
        if (!isDryRun) memStore.workspaces.push(ws);
        stats.workspacesCreated++;
      } else {
        stats.workspacesExisting++;
      }
    }
    console.log(`[Resilient Fallback] Migrated ${stats.workspacesCreated} memory workspaces.`);
    return stats;
  }

  const users = await User.find().lean();
  stats.usersScanned = users.length;
  console.log(`Found ${users.length} users to inspect.`);

  for (const user of users) {
    const email = user.email.toLowerCase().trim();
    const userId = user._id;

    // 1. Resolve or create user's personal workspace
    let ws = await Workspace.findOne({
      $or: [{ ownerId: userId }, { ownerEmail: email }]
    });

    if (ws) {
      stats.workspacesExisting++;
    } else {
      const cleanSlug = `${email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase()}-${Date.now().toString(36)}`;
      const name = `${user.name || 'Personal'}'s Workspace`;
      const planKey = user.plan === 'pro' || user.isPro ? 'pro' : 'free';

      if (!isDryRun) {
        ws = await Workspace.create({
          name,
          slug: cleanSlug,
          ownerId: userId,
          ownerEmail: email,
          planKey,
          seatLimit: planKey === 'pro' ? 1 : 1
        });
      } else {
        ws = { _id: new mongoose.Types.ObjectId(), name, slug: cleanSlug };
      }
      stats.workspacesCreated++;
      console.log(`${logPrefix}Created workspace "${name}" for ${email}`);
    }

    const wsId = ws._id;

    // 2. Ensure owner membership exists
    const mem = await Membership.findOne({ workspaceId: wsId, userId });
    if (!mem) {
      if (!isDryRun) {
        await Membership.create({
          workspaceId: wsId,
          userId,
          userEmail: email,
          role: 'owner',
          status: 'active'
        });
      }
      stats.membershipsCreated++;
    }

    // 3. Backfill workspaceId on user's links
    if (!isDryRun) {
      const linkRes = await Link.updateMany(
        { ownerEmail: email, $or: [{ workspaceId: null }, { workspaceId: { $exists: false } }] },
        { $set: { workspaceId: wsId } }
      );
      stats.linksUpdated += linkRes.modifiedCount || 0;

      const qrRes = await QRCode.updateMany(
        { ownerEmail: email, $or: [{ workspaceId: null }, { workspaceId: { $exists: false } }] },
        { $set: { workspaceId: wsId } }
      );
      stats.qrsUpdated += qrRes.modifiedCount || 0;

      const bioRes = await BioPage.updateMany(
        { ownerEmail: email, $or: [{ workspaceId: null }, { workspaceId: { $exists: false } }] },
        { $set: { workspaceId: wsId } }
      );
      stats.biosUpdated += bioRes.modifiedCount || 0;

      const domRes = await CustomDomain.updateMany(
        { ownerEmail: email, $or: [{ workspaceId: null }, { workspaceId: { $exists: false } }] },
        { $set: { workspaceId: wsId } }
      );
      stats.domainsUpdated += domRes.modifiedCount || 0;

      const keyRes = await ApiKey.updateMany(
        { userEmail: email, $or: [{ workspaceId: null }, { workspaceId: { $exists: false } }] },
        { $set: { workspaceId: wsId } }
      );
      stats.apiKeysUpdated += keyRes.modifiedCount || 0;
    } else {
      const lCount = await Link.countDocuments({ ownerEmail: email, workspaceId: null });
      stats.linksUpdated += lCount;
      const qCount = await QRCode.countDocuments({ ownerEmail: email, workspaceId: null });
      stats.qrsUpdated += qCount;
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration Summary ${isDryRun ? '(DRY-RUN)' : '(COMMITTED)'}:`);
  console.log(`  Users Scanned:          ${stats.usersScanned}`);
  console.log(`  Workspaces Created:     ${stats.workspacesCreated}`);
  console.log(`  Existing Workspaces:    ${stats.workspacesExisting}`);
  console.log(`  Memberships Created:    ${stats.membershipsCreated}`);
  console.log(`  Links Backfilled:       ${stats.linksUpdated}`);
  console.log(`  QR Codes Backfilled:    ${stats.qrsUpdated}`);
  console.log(`  Bio Pages Backfilled:   ${stats.biosUpdated}`);
  console.log(`  Domains Backfilled:     ${stats.domainsUpdated}`);
  console.log(`  API Keys Backfilled:    ${stats.apiKeysUpdated}`);
  console.log(`========================================\n`);

  if (ownConnection) {
    await mongoose.connection.close();
  }

  return stats;
}

if (require.main === module) {
  migrateWorkspaces()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

module.exports = { migrateWorkspaces };
