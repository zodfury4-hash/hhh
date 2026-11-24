#!/usr/bin/env node
/**
 * Migration Script: Hash Plaintext Link Passwords
 * Converts legacy plaintext `password` fields on Link documents to bcrypt hashes in `passwordHash`.
 *
 * Usage:
 *   node scripts/hash-link-passwords.js [--dry-run]
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Link = require('../backend/models/Link');
const config = require('../backend/config');

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🔒 Starting Link Password Hash Migration ${isDryRun ? '(DRY RUN)' : ''}...`);

  const mongoUri = config.mongoUri;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not configured.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    // Find links that have plaintext password and either no passwordHash or different
    const cursor = Link.find({
      password: { $ne: null, $exists: true }
    }).cursor();

    let countFound = 0;
    let countHashed = 0;
    let countErrors = 0;

    for await (const link of cursor) {
      countFound++;
      if (!link.password || link.password.trim() === '') {
        if (!isDryRun) {
          link.password = null;
          await link.save();
        }
        continue;
      }

      try {
        const plain = link.password.trim();
        // Check if password already looks like a bcrypt hash ($2a$ or $2b$)
        const alreadyBcrypt = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(plain);

        if (alreadyBcrypt) {
          if (!isDryRun) {
            link.passwordHash = plain;
            link.password = null;
            await link.save();
            countHashed++;
          }
        } else {
          const hash = await bcrypt.hash(plain, 10);
          console.log(`  🔑 Hashing password for slug: [${link.slug}]`);
          if (!isDryRun) {
            link.passwordHash = hash;
            link.password = null;
            await link.save();
            countHashed++;
          }
        }
      } catch (err) {
        console.error(`  ❌ Error processing slug [${link.slug}]:`, err.message);
        countErrors++;
      }
    }

    console.log('\n====================================');
    console.log(`Migration Complete:`);
    console.log(`  Total links checked: ${countFound}`);
    console.log(`  Total passwords hashed: ${countHashed}`);
    console.log(`  Errors: ${countErrors}`);
    console.log('====================================');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
