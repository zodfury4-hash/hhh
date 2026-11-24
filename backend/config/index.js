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
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || ''
  },
  clickRetentionDays: parseInt(process.env.CLICK_RETENTION_DAYS || '400', 10),
  trustProxy: process.env.TRUST_PROXY || '1',
  primaryHosts: new Set(
    (process.env.PRIMARY_HOSTS || 'healink.store,www.healink.store,localhost,127.0.0.1')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  ),
  cnameTarget: process.env.CNAME_TARGET || 'cname.healink.store',
  internalRouterSecret: process.env.INTERNAL_ROUTER_SECRET || 'healink-internal-secret-2026',
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    modelChat: process.env.LLM_MODEL_CHAT || 'claude-3-5-sonnet-20241022',
    modelFast: process.env.LLM_MODEL_FAST || 'claude-3-5-haiku-20241022',
    quotaFree: parseInt(process.env.AI_DAILY_QUOTA_FREE || '10', 10),
    quotaPro: parseInt(process.env.AI_DAILY_QUOTA_PRO || '200', 10),
    quotaGuest: parseInt(process.env.AI_DAILY_QUOTA_GUEST || '3', 10)
  },
  mcp: {
    allowedOrigins: (process.env.MCP_ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
};

module.exports = config;
