const crypto = require('crypto');
const path = require('path');
const config = require('./config');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const AbuseReport = require('./models/AbuseReport');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { verifyMailTransport } = require('./utils/mailer');
const { startScheduledCleanup } = require('./utils/cleanup');
const { abuseReportLimiter } = require('./middleware/rateLimiter');
const { validate, abuseReportSchema } = require('./middleware/validation');
const { requireDatabase } = require('./middleware/dbCheck');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', config.trustProxy);
const PORT = config.port;
const MONGODB_URI = (config.mongoUri || '').trim().replace(/^['"]|['"]$/g, '');
const projectRoot = path.join(__dirname, '..');

// Correlation Request ID + structured Pino HTTP request logging
app.use(requestLogger);

// Per-request cryptographic CSP nonce
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// 1. Helmet Security Headers with strict nonce CSP (zero unsafe-eval / unsafe-inline in scriptSrc)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
          'https://js.stripe.com',
          'https://accounts.google.com',
          'https://appleid.cdn-apple.com'
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        workerSrc: ["'self'", 'blob:'],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com'
        ],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://tinyurl.com',
          'https://is.gd',
          'https://safebrowsing.googleapis.com',
          'https://accounts.google.com',
          'https://appleid.apple.com'
        ],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
          'https://accounts.google.com',
          'https://appleid.apple.com'
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Allowlist (always permit true same-origin browser module/preflight requests)
const allowedOrigins = config.corsOrigins;

app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    if (!origin) return callback(null, { origin: false });
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, { origin: true, credentials: true });
    }
    try {
      const u = new URL(origin);
      const reqHost = (req.get('host') || '').toLowerCase();
      if (reqHost && u.host.toLowerCase() === reqHost) {
        return callback(null, { origin: true, credentials: true });
      }
      if (
        process.env.NODE_ENV !== 'production' &&
        (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
      ) {
        return callback(null, { origin: true, credentials: true });
      }
    } catch (_e) {}
    return callback(new Error('CORS request blocked by security policy'));
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

// 5. Database Connection & Mail Transport Verification (No admin seeding in boot path)
let _isDbConnected = false;
mongoose.connection.on('disconnected', () => {
  _isDbConnected = false;
  logger.warn('⚠️ [MongoDB] Connection lost; awaiting automatic reconnect.');
});
mongoose.connection.on('reconnected', () => {
  _isDbConnected = true;
  logger.info('✅ [MongoDB] Reconnected cleanly.');
});

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 20,
    retryWrites: true
  })
  .then(() => {
    _isDbConnected = true;
    const sanitizedUri = (MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
    logger.info(`✅ [MongoDB] Connected successfully to: ${sanitizedUri}`);
  })
  .catch((err) => {
    _isDbConnected = false;
    logger.warn(`⚠️ [MongoDB] Connection failed (${err.message}).`);
    if (process.env.NODE_ENV !== 'test') {
      logger.error('CRITICAL: MongoDB is unavailable. Incoming API queries will return 503.');
    } else {
      logger.info('💡 Test environment without active MongoDB URI yet.');
    }
  });

if (process.env.NODE_ENV !== 'test') {
  verifyMailTransport().then((status) => {
    if (!status.ok) {
      logger.warn({ mailStatus: status }, '[Email Service] Transport verification failed or unconfigured at boot.');
    } else {
      logger.info({ provider: status.provider }, '✅ [Email Service] Transport verified cleanly at boot.');
    }
  });
}

// 6. Require Database for API Routes (503 when MongoDB is disconnected in non-test or DISABLE_MEMSTORE)
app.use('/api', requireDatabase);

// 7. Abuse Reporting API Endpoint
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

// 8. System Liveness (/health) & Readiness (/ready) Endpoints
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const allowMem =
    (process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') &&
    process.env.DISABLE_MEMSTORE !== 'true';
  const isHealthy = dbState === 1 || allowMem;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    ok: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    reqId: req.id,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const allowMem =
    (process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') &&
    process.env.DISABLE_MEMSTORE !== 'true';
  const dbReady = dbState === 1 || allowMem;
  const jwtReady = typeof config.jwtSecret === 'string' && config.jwtSecret.length >= 32;
  const ready = dbReady && jwtReady;

  return res.status(ready ? 200 : 503).json({
    ok: ready,
    ready,
    reqId: req.id,
    checks: {
      database: dbState === 1 ? 'up' : allowMem ? 'memstore' : 'down',
      config: jwtReady ? 'valid' : 'invalid',
      mailTransport: config.features.emailOtp ? 'configured' : 'disabled'
    },
    timestamp: new Date().toISOString()
  });
});

// Start non-blocking scheduled cleanup loop in non-test, non-serverless modes
if (!process.env.VERCEL) {
  startScheduledCleanup();
}

// ---------------- MOUNT MODULAR API ROUTERS ---------------- //
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/links'));
app.use('/', require('./routes/qr'));
app.use('/', require('./routes/bio'));
app.use('/', require('./routes/analytics'));
app.use('/', require('./routes/domains'));
app.use('/', require('./routes/billing'));
app.use('/', require('./routes/assist'));
app.use('/', require('./routes/slugs'));
app.use('/', require('./routes/tokens'));
app.use('/', require('./routes/keys'));
app.use('/', require('./routes/mcp'));
app.use('/', require('./routes/integrations'));
app.use('/', require('./routes/export'));
app.use('/', require('./routes/help'));
app.use('/', require('./routes/plans'));
app.use('/', require('./routes/workspaces'));
app.use('/', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/v1', require('./routes/v1'));

// ---------------- STATIC ASSETS & CLIENT SPA ROUTES ---------------- //
app.get('/login', (req, res) => res.redirect('/#login'));
app.get('/signup', (req, res) => res.redirect('/#signup'));
app.get('/dashboard', (req, res) => res.redirect('/app.html#dashboard'));
app.get('/app', (req, res) => res.redirect('/app.html#dashboard'));

const { sendHtmlWithNonce } = require('./utils/cspNonce');
const publicDir = path.join(projectRoot, 'public');

// Serve React landing page for root (with per-request CSP nonce for JSON-LD schema)
app.get(['/', '/index.html'], (req, res) => {
  return sendHtmlWithNonce(res, path.join(publicDir, 'index.html'));
});

// Serve dashboard SPA for /app and /dashboard paths
app.get(['/app.html', '/app', '/dashboard'], (req, res) => {
  if (req.path === '/dashboard' || req.path === '/app') {
    return res.redirect('/app.html#dashboard');
  }
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  return res.sendFile(path.join(projectRoot, 'app.html'));
});

// Explicit clean URL route table for all public marketing, docs, AI, and legal pages
const PUBLIC_PAGE_ROUTES = [
  [['/pricing'], 'pages/pricing.html'],
  [['/solutions'], 'pages/solutions.html'],
  [['/qr-code'], 'pages/qr-code.html'],
  [['/bio-pages'], 'pages/bio-pages.html'],
  [['/analytics'], 'pages/analytics.html'],
  [['/integrations'], 'pages/integrations.html'],
  [['/developers'], 'pages/developers.html'],
  [['/faq'], 'pages/faq.html'],
  [['/help-contact'], 'pages/help-contact.html'],
  [['/ai/slug-generator', '/ai/slugs'], 'pages/ai-slug-generator.html'],
  [['/ai/assist', '/ai'], 'pages/ai-assist.html'],
  [['/ai/mcp'], 'pages/ai-mcp.html'],
  [['/resources/utm-guide', '/utm-guide'], 'pages/resources-utm-guide.html'],
  [['/privacy'], 'public/privacy.html'],
  [['/terms'], 'public/terms.html'],
  [['/report-abuse'], 'public/report-abuse.html']
];

for (const [paths, relFile] of PUBLIC_PAGE_ROUTES) {
  app.get(paths, (req, res) => sendHtmlWithNonce(res, path.join(projectRoot, relFile)));
}

// Serve static assets from /public (with immutable caching for hashed bundles) and dashboard client dirs
const staticCacheOpts = (dir) =>
  express.static(dir, {
    dotfiles: 'ignore',
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else if (/[-.][0-9a-f]{6,}\.(js|css)$/i.test(filePath) || /[\\/](assets|dashboard)[\\/]/.test(filePath)) {
        res.setHeader(
          'Cache-Control',
          process.env.NODE_ENV === 'production' ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
        );
      } else if (filePath.match(/\.(js|css|webp|png|jpg|svg|woff2)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  });

app.use(staticCacheOpts(publicDir));
app.use('/css', staticCacheOpts(path.join(projectRoot, 'css')));
app.use('/js', staticCacheOpts(path.join(projectRoot, 'js')));
app.use('/locales', staticCacheOpts(path.join(projectRoot, 'locales')));
app.use('/content', staticCacheOpts(path.join(projectRoot, 'content')));

// Real SPA fallback ONLY for dashboard sub-paths; all other unmatched routes fall through to 404
app.use((req, res, next) => {
  if (req.path.startsWith('/app/') || req.path.startsWith('/dashboard/')) {
    return res.sendFile(path.join(projectRoot, 'app.html'));
  }
  return next();
});

// 404 handler for unmatched routes (API JSON or branded 404 HTML)
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
