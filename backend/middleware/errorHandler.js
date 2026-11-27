const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  logger.error({
    msg: err.message || 'Unhandled Application Error',
    path: req.originalUrl || req.path,
    method: req.method,
    ip: req.ip,
    status: statusCode,
    stack: isProd ? undefined : err.stack
  });

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      ok: false,
      error: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY_ERROR'
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      ok: false,
      error: messages.join('; ') || 'Database validation failed.',
      code: 'VALIDATION_ERROR'
    });
  }

  // Handle JSON parsing error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      error: 'Malformed JSON payload.',
      code: 'BAD_REQUEST'
    });
  }

  // Safe client response (no stack traces in production)
  const clientMessage =
    isProd && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    ok: false,
    error: clientMessage,
    code: err.code || 'INTERNAL_ERROR',
    ...(err.meta ? { meta: err.meta } : {}),
    ...(isProd ? {} : { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  if (req.path.startsWith('/api/') || (req.headers.accept || '').includes('application/json') && !(req.headers.accept || '').includes('text/html')) {
    return res.status(404).json({
      ok: false,
      error: `Endpoint not found: ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    });
  }
  const notFoundPage = path.join(__dirname, '../../public/404.html');
  if (fs.existsSync(notFoundPage)) {
    return res.status(404).sendFile(notFoundPage);
  }
  return res.status(404).send('404 — Page Not Found');
}

module.exports = {
  errorHandler,
  notFoundHandler
};
