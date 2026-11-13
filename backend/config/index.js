const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Validate JWT Secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (isTest) {
    JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';
    process.env.JWT_SECRET = JWT_SECRET;
  } else {
    const errMsg = 'FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
}

const config = {
  env: NODE_ENV,
  isProd,
  isTest,
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink',
  jwtSecret: JWT_SECRET,
  corsOrigins: (
    process.env.CORS_ORIGIN ||
    'http://localhost:3000,http://127.0.0.1:3000,https://www.healink.store,https://healink.store'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  admin: {
    email: (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'HEA Link Admin'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    from: process.env.EMAIL_FROM || `"HEA Link" <${process.env.SMTP_USER || 'noreply@healink.store'}>`
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    safeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_KEY || ''
  },
  firebase: {
    enableRtdb: process.env.ENABLE_FIREBASE_RTDB === 'true',
    databaseUrl: process.env.FIREBASE_DATABASE_URL || 'https://healinks-4ea4d-default-rtdb.firebaseio.com'
  }
};

module.exports = config;
