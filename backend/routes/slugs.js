const express = require('express');
const router = express.Router();
const { z } = require('zod');

const { optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { assistLimiter } = require('../middleware/rateLimiter');
const { checkAiQuota, recordAiUsage } = require('../models/AiUsage');
const { generateAiSlugs } = require('../services/slugAiService');

const slugRequestSchema = z.object({
  url: z
    .string({ required_error: 'Destination URL is required' })
    .trim()
    .min(3, 'Destination URL is too short')
    .max(2048, 'URL exceeds 2048 characters')
    .regex(/^https?:\/\//i, 'Destination URL must begin with http:// or https://'),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),
  keywords: z.string().trim().max(200, 'Keywords cannot exceed 200 characters').optional(),
  tone: z
    .enum(['short', 'brandable', 'descriptive', 'campaign', 'catchy', 'professional', 'minimalist', 'playful'])
    .default('short'),
  count: z.coerce.number().int().min(3).max(8).default(5),
  brandName: z.string().trim().max(50, 'Brand name cannot exceed 50 characters').optional(),
  brand: z.string().trim().max(50, 'Brand name cannot exceed 50 characters').optional()
});

/* =========================================================
   AI SLUG ARCHITECT & GENERATOR API
   ========================================================= */

router.post('/api/ai/slugs', assistLimiter, optionalAuth, validate(slugRequestSchema), async (req, res) => {
  try {
    // 1. Quota Verification
    const quota = await checkAiQuota(req);
    if (!quota.allowed) {
      return res.status(429).json({
        error: `Daily AI quota reached (${quota.limit} requests/day). ${req.user ? 'Upgrade to Core PRO for 200 requests/day.' : 'Please sign in or upgrade for higher limits.'}`,
        code: 'AI_QUOTA_EXCEEDED',
        remaining: 0,
        limit: quota.limit,
        resetsAt: quota.resetsAt
      });
    }

    const { url, title, keywords, tone, count } = req.body;
    const brandName = req.body.brandName || req.body.brand;

    // 2. Generate Slugs
    const result = await generateAiSlugs({
      url,
      title,
      keywords,
      tone,
      count,
      brandName
    });

    // 3. Record Usage
    await recordAiUsage(req, { inputTokens: 40, outputTokens: 60 });
    const remaining = Math.max(0, quota.remaining - 1);

    res.json({
      success: true,
      suggestions: result.suggestions,
      candidates: result.suggestions,
      usedAI: result.usedAI,
      isFallback: !result.usedAI,
      notice: result.notice || null,
      inputMetadata: result.inputMetadata || null,
      remaining,
      limit: quota.limit,
      quota: {
        used: quota.limit - remaining,
        limit: quota.limit,
        remaining
      }
    });
  } catch (err) {
    if (err.code === 'URL_BLOCKED' || err.status === 400) {
      return res.status(400).json({ error: err.message, code: 'URL_BLOCKED' });
    }
    console.error('[AI Slugs Error]', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to generate slugs', code: err.code || 'AI_ERROR' });
  }
});

module.exports = router;
