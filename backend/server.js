const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const { VIP_ADMIN_ACCOUNTS } = require('./utils/helpers');
const { getCompiledHtml } = require('../tools/build_html');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink';
const projectRoot = path.join(__dirname, '..');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Guard for sensitive files (.env, *.db, *.log, etc.)
app.use((req, res, next) => {
  const cleanPath = (req.path || '').toLowerCase();
  if (
    cleanPath.includes('.env') ||
    cleanPath.includes('.git') ||
    cleanPath.endsWith('.db') ||
    cleanPath.endsWith('.sqlite') ||
    cleanPath.endsWith('.log')
  ) {
    return res.status(403).json({ error: 'Access Denied: Sensitive file access is blocked for security.' });
  }
  next();
});

// MongoDB Connection with automatic fallback
let isDbConnected = false;
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 4000
})
.then(async () => {
  isDbConnected = true;
  const sanitizedUri = (MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
  console.log('✅ [MongoDB] Connected successfully to:', sanitizedUri);
  await seedVipAdminAccounts();
})
.catch(err => {
  isDbConnected = false;
  console.warn('⚠️ [MongoDB] Connection failed (' + err.message + ').');
  console.warn('💡 Set your MONGODB_URI in .env (e.g. MongoDB Atlas connection string). Running in resilient hybrid mode.');
});

async function seedVipAdminAccounts() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const bcrypt = require('bcryptjs');
    for (const [email, info] of Object.entries(VIP_ADMIN_ACCOUNTS)) {
      const existing = await User.findOne({ email });
      if (!existing) {
        const hash = await bcrypt.hash(info.pass, 10);
        await User.create({
          email,
          name: info.name,
          password: hash,
          isVerified: true,
          plan: 'pro'
        });
        console.log(`👑 [VIP Admin Seeded] ${email}`);
      }
    }
  } catch (err) {
    console.warn('[VIP Seed Warning]', err.message);
  }
}

// ---------------- MOUNT MODULAR API ROUTERS ---------------- //
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/links'));
app.use('/', require('./routes/qr'));
app.use('/', require('./routes/bio'));
app.use('/', require('./routes/analytics'));
app.use('/', require('./routes/billing'));
app.use('/', require('./routes/assist'));

// ---------------- STATIC ASSETS & CLIENT SPA ROUTES ---------------- //
// Explicit auth and dashboard routes
app.get('/login', (req, res) => res.redirect('/#login'));
app.get('/signup', (req, res) => res.redirect('/#signup'));
app.get('/dashboard', (req, res) => res.redirect('/#dashboard'));
app.get('/app', (req, res) => res.redirect('/#dashboard'));

// Serve dynamically compiled HTML for entry routes
app.get(['/', '/index.html', '/app.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getCompiledHtml());
});

// Serve static project files (CSS, JS, images, icons)
app.use(express.static(projectRoot, { dotfiles: 'ignore' }));

// Client-side fallback to compiled HTML
app.use((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getCompiledHtml());
});

// ---------------- SERVER INITIALIZATION ---------------- //
if (require.main === module || require.main?.filename === path.join(projectRoot, 'server.js') || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 HEA Link Full-Stack Server running at: http://localhost:${PORT}`);
    console.log(`🌐 Public Landing Page: http://localhost:${PORT}#home`);
    console.log(`🔒 Logged-in Dashboard: http://localhost:${PORT}#dashboard (Strict Auth Enforced)`);
    console.log(`🗄️  MongoDB Status: Connecting / Resilient Hybrid Mode`);
    console.log(`========================================================\n`);
  });
}

module.exports = app;
