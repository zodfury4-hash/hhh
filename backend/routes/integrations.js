const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const Integration = require('../models/Integration');
const WebhookDelivery = require('../models/WebhookDelivery');
const IntegrationWaitlist = require('../models/IntegrationWaitlist');
const { INTEGRATIONS_CATALOG, getIntegration } = require('../integrations/catalog');
const { eventsService, validateUrlForSsrf } = require('../services/events');

// Zod schemas
const createIntegrationSchema = z.object({
  provider: z.enum(['webhooks', 'slack', 'discord', 'zapier', 'make', 'hubspot', 'shopify', 'notion', 'wordpress']),
  name: z.string().min(1).max(80).optional(),
  config: z.object({
    url: z.string().url('Must be a valid HTTP or HTTPS URL'),
    secret: z.string().max(128).optional(),
    channel: z.string().max(80).optional()
  }),
  events: z.array(z.string()).min(1).optional()
});

const waitlistSchema = z.object({
  email: z.string().email('Valid email address required'),
  provider: z.string().min(2).max(40),
  useCase: z.string().max(300).optional()
});

// 1. Public / Authenticated Catalog
router.get('/api/integrations/catalog', (req, res) => {
  return res.json({
    success: true,
    catalog: INTEGRATIONS_CATALOG
  });
});

// 2. List user configured integrations
router.get('/api/integrations', authMiddleware, async (req, res) => {
  try {
    const list = await Integration.findByUser(req.user.email);
    return res.json({
      success: true,
      integrations: list
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list integrations: ' + err.message });
  }
});

// 3. Create integration
router.post('/api/integrations', authMiddleware, async (req, res) => {
  const result = createIntegrationSchema.safeParse(req.body);
  if (!result.success) {
    const errs = result.error.issues || result.error.errors || [];
    return res.status(400).json({
      error: 'Validation failed',
      details: errs.map((e) => e.message)
    });
  }

  const { provider, name, config, events } = result.data;

  // SSRF check on target URL
  try {
    await validateUrlForSsrf(config.url);
  } catch (ssrfErr) {
    return res.status(400).json({
      error: ssrfErr.message
    });
  }

  try {
    const item = await Integration.createIntegration({
      userEmail: req.user.email,
      provider,
      name: name || `${provider} integration`,
      config,
      events: events || ['link.created']
    });

    return res.status(201).json({
      success: true,
      integration: item
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create integration: ' + err.message });
  }
});

// 4. Update integration
router.patch('/api/integrations/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const updated = await Integration.updateIntegration(id, req.user.email, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    return res.json({ success: true, integration: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update integration: ' + err.message });
  }
});

// 5. Delete integration
router.delete('/api/integrations/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const deleted = await Integration.deleteIntegration(id, req.user.email);
    if (!deleted) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    return res.json({ success: true, message: 'Integration deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete integration: ' + err.message });
  }
});

// 6. Test integration dispatch (Send test ping)
router.post('/api/integrations/:id/test', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const testResult = await eventsService.dispatchToIntegration(
      id,
      'ping',
      {
        message: 'HEA Link test webhook ping',
        timestamp: new Date().toISOString(),
        slug: 'test-ping-link',
        shortUrl: 'https://hea.link/test-ping',
        dest: 'https://hea.link'
      },
      req.user.email
    );

    return res.json({
      success: testResult.status === 'delivered',
      delivery: testResult
    });
  } catch (err) {
    return res.status(400).json({ error: 'Test dispatch failed: ' + err.message });
  }
});

// 7. Get delivery logs for an integration
router.get('/api/integrations/:id/deliveries', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const integration = await Integration.findById(id, req.user.email);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    const deliveries = await WebhookDelivery.findByIntegration(id, 20);
    return res.json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch deliveries: ' + err.message });
  }
});

// 8. Join Waitlist for "Coming Soon" integrations
router.post('/api/integrations/waitlist', async (req, res) => {
  const result = waitlistSchema.safeParse(req.body);
  if (!result.success) {
    const errs = result.error.issues || result.error.errors || [];
    return res.status(400).json({
      error: 'Validation failed',
      details: errs.map((e) => e.message)
    });
  }

  const { email, provider, useCase } = result.data;
  const item = getIntegration(provider);
  if (!item) {
    return res.status(400).json({ error: 'Unknown integration provider' });
  }

  try {
    const entry = await IntegrationWaitlist.join({ email, provider, useCase });
    return res.json({
      success: true,
      message: `You're on the waitlist for ${item.name}! We will notify ${email} as soon as it launches.`,
      entry: {
        email: entry.email,
        provider: entry.provider,
        createdAt: entry.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to join waitlist: ' + err.message });
  }
});

module.exports = router;
