const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const User = require('./models/User');
const AbuseReport = require('./models/AbuseReport');
const { getCompiledHtml } = require('../tools/build_html');
const { abuseReportLimiter } = require('./middleware/rateLimiter');
const { validate, abuseReportSchema } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink';
const projectRoot = path.join(__dirname, '..');

// 1. Helmet Security Headers with robust CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net',
        'https://js.stripe.com',
        'https://apis.google.com',
        'https://accounts.google.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://tinyurl.com',
        'https://is.gd',
        'https://safebrowsing.googleapis.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://*.firebaseio.com'
      ],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://accounts.google.com'
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. CORS Allowlist
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,https://www.healink.store,https://healink.store';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {}
    }
    return callback(new Error('CORS request blocked by security policy'));
  },
  credentials: true
}));

// 3. Body Size Limits & Stripe Raw Body verification
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith('/api/stripe/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Security Guard: Prevent file-path probing
app.use((req, res, next) => {
  const cleanPath = (req.path || '').toLowerCase();
  if (
    cleanPath.includes('.env') ||
    cleanPath.includes('.git') ||
    cleanPath.endsWith('.db') ||
    cleanPath.endsWith('.sqlite') ||
    cleanPath.endsWith('.log')
  ) {
    return res.status(403).json({ error: 'Access Denied: Protected resource.' });
  }
  next();
});

// 5. Database Connection & Admin Seeding
let isDbConnected = false;
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 4000
})
.then(async () => {
  isDbConnected = true;
  const sanitizedUri = (MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
  console.log('✅ [MongoDB] Connected successfully to:', sanitizedUri);
  await seedAdminUser();
})
.catch(err => {
  isDbConnected = false;
  console.warn('⚠️ [MongoDB] Connection failed (' + err.message + ').');
  console.warn('💡 Set your MONGODB_URI in .env (e.g. MongoDB Atlas connection string). Running in resilient hybrid mode.');
});

async function seedAdminUser() {
  if (mongoose.connection.readyState !== 1) return;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'HEA Link Admin';

  if (!adminEmail || !adminPassword) {
    return;
  }

  try {
    const bcrypt = require('bcryptjs');
    const cleanEmail = adminEmail.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: cleanEmail,
        name: adminName,
        password: hash,
        role: 'admin',
        isVerified: true,
        isPro: true,
        plan: 'Unlimited'
      });
      console.log(`👑 [Admin Initialized] Seeded admin user: ${cleanEmail}`);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isVerified = true;
      existing.isPro = true;
      existing.plan = 'Unlimited';
      await existing.save();
      console.log(`👑 [Admin Updated] Promoted account to admin: ${cleanEmail}`);
    }
  } catch (err) {
    console.warn('[Admin Seed Warning]', err.message);
  }
}

// 6. Abuse Reporting API Endpoint
app.post('/api/abuse/report', abuseReportLimiter, validate(abuseReportSchema), async (req, res) => {
  try {
    const { slug, url, reason, details, reporterEmail } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    if (mongoose.connection.readyState === 1) {
      await AbuseReport.create({
        slug: slug || null,
        url,
        reason,
        details: details || '',
        reporterEmail: reporterEmail || 'anonymous',
        reporterIp: ip
      });
    }

    console.warn(`🚨 [Abuse Report Filed] URL: ${url} | Slug: ${slug} | Reason: ${reason}`);

    return res.json({
      success: true,
      message: 'Thank you for your report. Our security team has received the alert and will investigate immediately.'
    });
  } catch (err) {
    console.error('Abuse report error:', err);
    return res.status(500).json({ error: 'Failed to submit abuse report: ' + err.message });
  }
});

// 7. System Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ---------------- MOUNT MODULAR API ROUTERS ---------------- //
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/links'));
app.use('/', require('./routes/qr'));
app.use('/', require('./routes/bio'));
app.use('/', require('./routes/analytics'));
app.use('/', require('./routes/billing'));
app.use('/', require('./routes/assist'));

// ---------------- STATIC ASSETS & CLIENT SPA ROUTES ---------------- //
app.get('/login', (req, res) => res.redirect('/#login'));
app.get('/signup', (req, res) => res.redirect('/#signup'));
app.get('/dashboard', (req, res) => res.redirect('/#dashboard'));
app.get('/app', (req, res) => res.redirect('/#dashboard'));

// Serve dynamically compiled HTML for entry routes
app.get(['/', '/index.html', '/app.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getCompiledHtml());
});

// Serve static project files
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
