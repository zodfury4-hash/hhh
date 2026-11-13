const path = require('path');
const config = require('./config');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const User = require('./models/User');
const AbuseReport = require('./models/AbuseReport');
const logger = require('./utils/logger');
const { getCompiledHtml } = require('../tools/build_html');
const { abuseReportLimiter } = require('./middleware/rateLimiter');
const { validate, abuseReportSchema } = require('./middleware/validation');
const { requireDatabase } = require('./middleware/dbCheck');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = config.port;
const MONGODB_URI = config.mongoUri;
const projectRoot = path.join(__dirname, '..');

// 1. Helmet Security Headers with robust CSP
app.use(
  helmet({
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
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Allowlist
const allowedOrigins = config.corsOrigins;

app.use(
  cors({
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
        } catch (_e) {}
      }
      return callback(new Error('CORS request blocked by security policy'));
    },
    credentials: true
  })
);

// 3. Body Size Limits & Stripe Raw Body verification
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith('/api/stripe/webhook')) {
        req.rawBody = buf;
      }
    }
  })
);
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
    return res.status(403).json({ ok: false, error: 'Access Denied: Protected resource.', code: 'FORBIDDEN' });
  }
  next();
});

// 5. Database Connection & Admin Seeding
let _isDbConnected = false;
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 4000
  })
  .then(async () => {
    _isDbConnected = true;
    const sanitizedUri = (MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
    logger.info(`✅ [MongoDB] Connected successfully to: ${sanitizedUri}`);
    await seedAdminUser();
  })
  .catch((err) => {
    _isDbConnected = false;
    logger.warn(`⚠️ [MongoDB] Connection failed (${err.message}).`);
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: MongoDB is unavailable in production. Incoming API queries will return 503.');
    } else {
      logger.info('💡 Running in resilient hybrid mode for local development/test.');
    }
  });

async function seedAdminUser() {
  if (mongoose.connection.readyState !== 1) return;
  const adminEmail = config.admin.email;
  const adminPassword = config.admin.password;
  const adminName = config.admin.name;

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
      logger.info(`👑 [Admin Initialized] Seeded admin user: ${cleanEmail}`);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isVerified = true;
      existing.isPro = true;
      existing.plan = 'Unlimited';
      await existing.save();
      logger.info(`👑 [Admin Updated] Promoted account to admin: ${cleanEmail}`);
    }
  } catch (err) {
    logger.warn(`[Admin Seed Warning] ${err.message}`);
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

    logger.warn({ url, slug, reason, ip }, '🚨 Abuse Report Filed');

    return res.json({
      ok: true,
      success: true,
      message: 'Thank you for your report. Our security team has received the alert and will investigate immediately.'
    });
  } catch (err) {
    logger.error({ err }, 'Abuse report error');
    return res
      .status(500)
      .json({ ok: false, error: 'Failed to submit abuse report: ' + err.message, code: 'INTERNAL_ERROR' });
  }
});

// 7. System Health Endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1 || process.env.NODE_ENV !== 'production';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    ok: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 8. Require Database in Production for API Routes
app.use('/api', requireDatabase);

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

// Serve static project files with intelligent caching
app.use(express.static(projectRoot, {
  dotfiles: 'ignore',
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.match(/\.(js|css|webp|png|jpg|svg|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Client-side fallback to compiled HTML for unmatched web routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getCompiledHtml());
});

// 404 handler for unmatched API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ---------------- SERVER INITIALIZATION & GRACEFUL SHUTDOWN ---------------- //
let server = null;
if (require.main === module || require.main?.filename === path.join(projectRoot, 'server.js') || !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    logger.info(`🚀 HEA Link Full-Stack Server running at: http://localhost:${PORT}`);
    logger.info(`🌐 Public Landing Page: http://localhost:${PORT}#home`);
    logger.info(`🔒 Logged-in Dashboard: http://localhost:${PORT}#dashboard`);
    logger.info(`🗄️  MongoDB Status: Connecting / Resilient Hybrid Mode`);
  });
}

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
      } catch (err) {
        logger.error({ err }, 'Error closing MongoDB connection');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
