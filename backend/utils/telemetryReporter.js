'use strict';

const crypto = require('crypto');

/**
 * Lightweight zero-dependency Sentry error reporting hook triggered only when SENTRY_DSN is set.
 * Never throws or blocks request responses if Sentry is unreachable.
 */
function parseDsn(dsn) {
  try {
    if (!dsn || typeof dsn !== 'string') return null;
    const url = new URL(dsn.trim());
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+/, '').split('/')[0];
    if (!publicKey || !projectId) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      dsn: dsn.trim()
    };
  } catch (_e) {
    return null;
  }
}

async function reportException(err, context = {}) {
  const parsed = parseDsn(process.env.SENTRY_DSN);
  if (!parsed || !err) return { sent: false, reason: 'disabled' };

  const eventId = crypto.randomBytes(16).toString('hex');
  const envelopeHeader = JSON.stringify({ event_id: eventId, dsn: parsed.dsn, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: 'event' });
  const eventPayload = JSON.stringify({
    event_id: eventId,
    level: 'error',
    platform: 'node',
    environment: process.env.NODE_ENV || 'development',
    message: err.message || String(err),
    tags: {
      reqId: context.reqId || undefined,
      method: context.method || undefined,
      path: context.path || undefined
    }
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    await fetch(parsed.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: `${envelopeHeader}\n${itemHeader}\n${eventPayload}\n`,
      signal: controller.signal
    });
    clearTimeout(timer);
    return { sent: true, eventId };
  } catch (_e) {
    return { sent: false, reason: 'network_error' };
  }
}

module.exports = {
  parseDsn,
  reportException
};
