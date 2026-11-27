const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');
const memStore = require('../utils/memStore');
const { isMemStoreAllowed } = require('./dbCheck');

const JWT_SECRET = config.jwtSecret;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function parseCookies(req) {
  const header = req && req.headers && req.headers.cookie;
  const out = {};
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch (_e) {
      out[k] = v;
    }
  }
  return out;
}

function safeEqual(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function setAuthCookies(res, token) {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  res.cookie('hea_token', token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs
  });
  res.cookie('hea_csrf', csrfToken, {
    httpOnly: false,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs
  });
  return csrfToken;
}

function clearAuthCookies(res) {
  res.clearCookie('hea_token', { path: '/', httpOnly: true, sameSite: 'lax', secure: config.isProd });
  res.clearCookie('hea_csrf', { path: '/', httpOnly: false, sameSite: 'lax', secure: config.isProd });
}

function authMiddleware(req, res, next) {
  let token = null;
  let viaCookie = false;
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (cookies.hea_token) {
    token = cookies.hea_token;
    viaCookie = true;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided', code: 'NO_TOKEN' });
  }

  if (viaCookie && MUTATING_METHODS.has((req.method || '').toUpperCase())) {
    const csrfHeader = req.headers['x-csrf-token'];
    if (!cookies.hea_csrf || !safeEqual(String(csrfHeader || ''), cookies.hea_csrf)) {
      return res.status(403).json({
        error: 'Forbidden: Missing or invalid CSRF token',
        code: 'CSRF_INVALID'
      });
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const cleanEmail = (decoded.email || '').toLowerCase().trim();

    if (decoded.tokenVersion !== undefined) {
      if (mongoose.connection.readyState === 1) {
        const User = require('../models/User');
        User.findOne({ email: cleanEmail }, 'tokenVersion status')
          .lean()
          .then((dbUser) => {
            if (dbUser && (dbUser.tokenVersion || 0) > decoded.tokenVersion) {
              return res.status(401).json({
                error: 'Unauthorized: Session revoked. Please log in again.',
                code: 'SESSION_REVOKED'
              });
            }
            req.user = decoded;
            next();
          })
          .catch(next);
        return;
      } else if (isMemStoreAllowed()) {
        const memUser = (memStore.users || []).find((u) => u.email === cleanEmail);
        if (memUser && (memUser.tokenVersion || 0) > decoded.tokenVersion) {
          return res.status(401).json({
            error: 'Unauthorized: Session revoked. Please log in again.',
            code: 'SESSION_REVOKED'
          });
        }
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token', code: 'INVALID_TOKEN' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req);
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookies.hea_token || null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_e) {
      // Optional auth failure is safely ignored
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && !req.user.isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required', code: 'FORBIDDEN' });
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  setAuthCookies,
  clearAuthCookies,
  parseCookies,
  JWT_SECRET
};
