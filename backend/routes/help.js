const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { z } = require('zod');

const HelpFeedback = require('../models/HelpFeedback');
const SupportTicket = require('../models/SupportTicket');
const mailer = require('../utils/mailer');
const rateLimiter = require('../middleware/rateLimiter');
const { sendHtmlWithNonce } = require('../utils/cspNonce');

const router = express.Router();
const projectRoot = path.resolve(__dirname, '..', '..');

// Zod Validation Schemas
const feedbackSchema = z.object({
  articleSlug: z.string().min(1, 'Article slug is required').max(128),
  helpful: z.boolean(),
  comment: z.string().max(1000).optional().default('')
});

const supportTicketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email address is required').max(150),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  category: z.enum(['general', 'billing', 'technical', 'api', 'abuse']).default('general'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  honeypot: z.string().optional().default('')
});

/**
 * GET /help -> Help Home Hub
 */
router.get('/help', (req, res) => {
  return sendHtmlWithNonce(res, path.join(projectRoot, 'pages', 'help-home.html'));
});

/**
 * GET /help/contact -> Contact Support Form
 */
router.get('/help/contact', (req, res) => {
  return sendHtmlWithNonce(res, path.join(projectRoot, 'pages', 'help-contact.html'));
});

/**
 * GET /help/:category/:slug -> Rendered Article Page
 */
router.get('/help/:category/:slug', (req, res) => {
  const { category, slug } = req.params;
  // Sanitize path segments to prevent directory traversal
  const safeCategory = category.replace(/[^a-z0-9_-]/gi, '');
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, '');

  const articlePath = path.join(projectRoot, 'pages', 'help', safeCategory, `${safeSlug}.html`);
  if (fs.existsSync(articlePath)) {
    return sendHtmlWithNonce(res, articlePath);
  }

  // If not found, render Help Hub with 404 status
  res.status(404);
  return sendHtmlWithNonce(res, path.join(projectRoot, 'pages', 'help-home.html'));
});

/**
 * GET /faq -> Standalone FAQ Page
 */
router.get('/faq', (req, res) => {
  return sendHtmlWithNonce(res, path.join(projectRoot, 'pages', 'faq.html'));
});

/**
 * POST /api/help/feedback -> Article Feedback (Thumbs up/down + comment)
 */
router.post('/api/help/feedback', rateLimiter.apiLimiter, async (req, res) => {
  try {
    const parseResult = feedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map(i => i.message)
      });
    }

    const { articleSlug, helpful, comment } = parseResult.data;
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const dateSalt = new Date().toISOString().slice(0, 10);
    const ipHash = crypto.createHash('sha256').update(`${ip}_${dateSalt}`).digest('hex');

    const result = await HelpFeedback.recordFeedback({
      articleSlug,
      helpful,
      comment,
      ipHash
    });

    return res.status(200).json({
      success: true,
      duplicate: result.duplicate,
      message: result.duplicate ? 'Feedback already recorded for today' : 'Thank you for your feedback'
    });
  } catch (err) {
    if (req.log) req.log.error({ err }, 'Error recording help feedback');
    else console.error('Error recording help feedback:', err);
    return res.status(500).json({ error: 'Internal server error recording feedback' });
  }
});

/**
 * POST /api/support -> Submit Support Ticket
 */
router.post('/api/support', rateLimiter.apiLimiter, async (req, res) => {
  try {
    const parseResult = supportTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map(i => i.message)
      });
    }

    const { name, email, subject, category, message, honeypot } = parseResult.data;

    // Honeypot bot protection: if honeypot was filled, drop silently with 200
    if (honeypot && honeypot.trim() !== '') {
      if (req.log) req.log.warn({ ip: req.ip, honeypot }, 'Support honeypot triggered by spambot');
      return res.status(200).json({
        success: true,
        ticketId: 'TICK-' + Date.now().toString(36).toUpperCase()
      });
    }

    const ticket = await SupportTicket.createTicket({
      name,
      email,
      subject,
      category,
      message,
      ip: req.ip || ''
    });

    // Dispatch asynchronous email confirmation
    mailer.sendSupportTicketConfirmation(email, name, ticket.ticketId, subject).catch(err => {
      if (req.log) req.log.error({ err, ticketId: ticket.ticketId }, 'Failed to dispatch ticket confirmation email');
      else console.error('Failed to dispatch ticket confirmation email:', err);
    });

    return res.status(201).json({
      success: true,
      ticketId: ticket.ticketId,
      message: 'Support ticket submitted successfully'
    });
  } catch (err) {
    if (req.log) req.log.error({ err }, 'Error submitting support ticket');
    else console.error('Error submitting support ticket:', err);
    return res.status(500).json({ error: 'Internal server error creating support ticket' });
  }
});

module.exports = router;
