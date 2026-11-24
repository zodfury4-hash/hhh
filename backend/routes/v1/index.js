const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { apiKeyAuth } = require('../../middleware/apiKeyAuth');
const { idempotency } = require('../../middleware/idempotency');
const linksService = require('../../services/links.service');
const ApiUsage = require('../../models/ApiUsage');
const CustomDomain = require('../../models/CustomDomain');
const memStore = require('../../utils/memStore');
const mongoose = require('mongoose');
const { getOpenApiSpec } = require('../../services/openapi.service');

// Public OpenAPI 3.1 Spec Endpoint
router.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json(getOpenApiSpec());
});

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Zod Validation Schemas
const createLinkSchema = z.object({
  dest: z.string().url('Destination must be a valid URL with http or https protocol'),
  slug: z.string().max(60).regex(/^[a-zA-Z0-9-_]+$/, 'Slug must only contain alphanumeric, dash, or underscore characters').optional(),
  title: z.string().max(120).optional(),
  tag: z.string().max(50).optional(),
  password: z.string().min(4).max(64).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.string().datetime().optional()),
  maxClicks: z.number().int().positive().max(1000000).optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional()
  }).optional()
});

const updateLinkSchema = z.object({
  dest: z.string().url('Destination must be a valid URL').optional(),
  title: z.string().max(120).optional(),
  tag: z.string().max(50).optional(),
  password: z.string().min(4).max(64).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional()
});

// Middleware to parse and validate Zod body
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload.',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          })),
          requestId: req.requestId
        }
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

// ----------------------------------------------------
// 1. LINKS CRUD
// ----------------------------------------------------

// POST /api/v1/links
router.post('/links', apiKeyAuth('links:write'), idempotency(), validateBody(createLinkSchema), async (req, res) => {
  try {
    const link = await linksService.createLink({
      ...req.validatedBody,
      ownerEmail: req.user.email,
      isTest: req.isTest
    });
    return res.status(201).json({
      data: link,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    const status = err.code === 'SLUG_CONFLICT' ? 409 : 400;
    return res.status(status).json({
      error: {
        code: err.code || 'BAD_REQUEST',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// GET /api/v1/links
router.get('/links', apiKeyAuth('links:read'), async (req, res) => {
  try {
    const { limit, cursor, q, tag, sort } = req.query;
    const page = await linksService.listLinks({
      ownerEmail: req.user.email,
      limit: parseInt(limit, 10) || 50,
      cursor: cursor || null,
      search: q || '',
      tag: tag || '',
      sort: sort === 'asc' ? 'asc' : 'desc',
      isTest: req.isTest
    });

    return res.json({
      data: page.items,
      pagination: {
        limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
        nextCursor: page.nextCursor,
        hasMore: page.hasMore
      },
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// GET /api/v1/links/:slug
router.get('/links/:slug', apiKeyAuth('links:read'), async (req, res) => {
  try {
    const link = await linksService.getLink({
      slug: req.params.slug,
      ownerEmail: req.user.email,
      isTest: req.isTest
    });
    return res.json({
      data: link,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 500;
    return res.status(status).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// PATCH /api/v1/links/:slug
router.patch('/links/:slug', apiKeyAuth('links:write'), validateBody(updateLinkSchema), async (req, res) => {
  try {
    const link = await linksService.updateLink({
      slug: req.params.slug,
      updates: req.validatedBody,
      ownerEmail: req.user.email,
      isTest: req.isTest
    });
    return res.json({
      data: link,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 400;
    return res.status(status).json({
      error: {
        code: err.code || 'BAD_REQUEST',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// DELETE /api/v1/links/:slug
router.delete('/links/:slug', apiKeyAuth('links:write'), async (req, res) => {
  try {
    const result = await linksService.deleteLink({
      slug: req.params.slug,
      ownerEmail: req.user.email,
      isTest: req.isTest
    });
    return res.json({
      data: result,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 500;
    return res.status(status).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// ----------------------------------------------------
// 2. ANALYTICS
// ----------------------------------------------------

// GET /api/v1/links/:slug/analytics
router.get('/links/:slug/analytics', apiKeyAuth('analytics:read'), async (req, res) => {
  try {
    const analytics = await linksService.getLinkAnalytics({
      slug: req.params.slug,
      ownerEmail: req.user.email,
      range: req.query.range || '7d',
      isTest: req.isTest
    });
    return res.json({
      data: analytics,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// GET /api/v1/analytics
router.get('/analytics', apiKeyAuth('analytics:read'), async (req, res) => {
  try {
    const analytics = await linksService.getAggregateAnalytics({
      ownerEmail: req.user.email,
      range: req.query.range || '7d',
      isTest: req.isTest
    });
    return res.json({
      data: analytics,
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// ----------------------------------------------------
// 3. QR CODES & DOMAINS
// ----------------------------------------------------

// POST /api/v1/qr
router.post('/qr', apiKeyAuth('qr:write'), async (req, res) => {
  try {
    const { url, size = 300, format = 'png' } = req.body || {};
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Valid URL (http/https) is required.',
          requestId: req.requestId
        }
      });
    }

    const sz = Math.min(Math.max(parseInt(size, 10) || 300, 64), 1024);
    const fmt = format === 'svg' ? 'svg' : 'png';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${sz}x${sz}&data=${encodeURIComponent(url)}${fmt === 'svg' ? '&format=svg' : ''}`;

    return res.json({
      data: {
        url,
        qrUrl,
        size: sz,
        format: fmt
      },
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// GET /api/v1/domains (read-only)
router.get('/domains', apiKeyAuth('links:read'), async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    let domains = [];
    if (isDbConnected()) {
      domains = await CustomDomain.find({ userEmail: email, status: 'active' }).select('domain status createdAt verifiedAt').lean();
    } else {
      domains = (memStore.domains || []).filter((d) => (d.userEmail || '').toLowerCase() === email && d.status === 'active');
    }

    return res.json({
      data: domains.map((d) => ({
        domain: d.domain,
        status: d.status,
        createdAt: d.createdAt,
        verifiedAt: d.verifiedAt || null
      })),
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

// ----------------------------------------------------
// 4. ME / ACCOUNT LIMITS
// ----------------------------------------------------

// GET /api/v1/me
router.get('/me', apiKeyAuth(), async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const monthUsage = await ApiUsage.getMonthUsage(email);
    const isPro = req.user.plan === 'pro' || req.user.plan === 'enterprise';

    return res.json({
      data: {
        email,
        plan: isPro ? 'pro' : 'free',
        apiKey: {
          keyId: req.apiKey.keyId,
          name: req.apiKey.name,
          prefix: req.apiKey.prefix,
          isTest: req.apiKey.isTest,
          scopes: req.apiKey.scopes
        },
        limits: {
          requestsPerMinute: req.isTest ? 60 : (isPro ? 600 : 120),
          monthlyQuota: isPro ? 100000 : 5000,
          currentMonthUsage: monthUsage
        }
      },
      meta: {
        requestId: req.requestId,
        isTest: req.isTest
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.requestId
      }
    });
  }
});

module.exports = router;
