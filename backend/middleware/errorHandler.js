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
    ...(isProd ? {} : { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      ok: false,
      error: `Endpoint not found: ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    });
  }
  // For non-API routes, pass to HTML handler or 404
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>404 — Link Not Found</title>
      <link rel="icon" type="image/png" href="/logo.png">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b18; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
        .box { background: #090f22; border: 1px solid rgba(56,189,248,0.2); border-radius: 20px; padding: 40px 32px; max-width: 440px; box-shadow: 0 25px 60px rgba(0,0,0,0.7); }
        h1 { font-size: 48px; margin: 0 0 12px; color: #38bdf8; font-weight: 800; }
        h2 { font-size: 20px; margin: 0 0 10px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        a { display: inline-block; background: linear-gradient(135deg, #0284c7, #38bdf8); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>404</h1>
        <h2>Page or Link Not Found</h2>
        <p>The shortlink or page you requested could not be found or may have been deleted by its creator.</p>
        <a href="/#home">Return to HEA Link Home →</a>
      </div>
    </body>
    </html>
  `);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
