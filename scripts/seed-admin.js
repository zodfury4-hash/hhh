'use strict';

/**
 * Standalone admin seed script (`npm run seed:admin`).
 * Separated from Express server boot so production startups remain idempotent and side-effect free.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../backend/config');
const User = require('../backend/models/User');

async function seedAdmin() {
  const adminEmail = config.admin.email;
  const adminPassword = config.admin.password;
  const adminName = config.admin.name;

  if (!adminEmail || !adminPassword) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 5,
    retryWrites: true
  });

  const cleanEmail = adminEmail.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });

  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      email: cleanEmail,
      name: adminName,
      password: hash,
      role: 'admin',
      isVerified: true,
      isPro: true,
      plan: 'Unlimited'
    });
    console.log(`Seeded admin account: ${cleanEmail}`);
  } else {
    existing.role = 'admin';
    existing.isVerified = true;
    existing.isPro = true;
    existing.plan = 'Unlimited';
    if (process.env.RESET_ADMIN_PASSWORD === 'true') {
      existing.password = await bcrypt.hash(adminPassword, 12);
    }
    await existing.save();
    console.log(`Updated admin privileges for existing account: ${cleanEmail}`);
  }

  await mongoose.connection.close(false);
}

seedAdmin().catch((err) => {
  console.error('Admin seed failed:', err.message);
  process.exit(1);
});
