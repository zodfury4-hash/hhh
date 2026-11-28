const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.rawKey',
      '*.rawToken',
      '*.secret',
      '*.apiKey',
      '*.clientSecret',
      'MONGODB_URI',
      'JWT_SECRET',
      'SMTP_PASS',
      'STRIPE_SECRET_KEY',
      'RESEND_API_KEY',
      'BREVO_API_KEY',
      'EMAIL_API_KEY',
      'APPLE_CLIENT_SECRET',
      'GOOGLE_CLIENT_SECRET'
    ],
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  }
});

module.exports = logger;
