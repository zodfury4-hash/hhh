'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Assigns a per-request correlation ID (X-Request-Id) and emits structured Pino timing logs.
 */
function requestLogger(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const reqId = typeof incoming === 'string' && incoming.trim() ? incoming.trim().slice(0, 64) : crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = res.statusCode;
    const payload = {
      reqId,
      method: req.method,
      path: req.originalUrl || req.path,
      status,
      durationMs: Math.round(durationMs * 100) / 100
    };
    if (status >= 500) {
      logger.error(payload, 'http_request_error');
    } else if (status >= 400) {
      logger.warn(payload, 'http_request_warn');
    } else if (process.env.NODE_ENV !== 'test') {
      logger.info(payload, 'http_request');
    }
  });

  next();
}

module.exports = requestLogger;
