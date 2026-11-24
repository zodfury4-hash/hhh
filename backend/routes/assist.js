const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Link = require('../models/Link');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const AssistConversation = require('../models/AssistConversation');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { assistLimiter } = require('../middleware/rateLimiter');
const { inspectUrlSecurity } = require('../services/abuse-service');
const { generateCryptoSlug } = require('../utils/slugGenerator');
const {
  handleChatTurn,
  confirmAction,
  cancelAction
} = require('../services/assistService');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function getRealWorkingShortUrl(destUrl) {
  if (!destUrl) return null;
  try {
    const tuRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(destUrl));
    if (tuRes.ok) {
      const text = (await tuRes.text()).trim();
      if (/^https?:\/\//i.test(text) && !text.includes('error') && text !== destUrl) return text;
    }
  } catch (_e) {}
  return null;
}

/* =========================================================
   CONVERSATIONAL HEA ASSIST AI API (Phase 2)
   ========================================================= */

// 1. List user conversations
router.get('/api/assist/conversations', authMiddleware, async (req, res) => {
  try {
    const list = await AssistConversation.findByUser(req.user.email, 20);
    res.json({
      success: true,
      conversations: list.map((c) => ({
        conversationId: c.conversationId,
        title: c.title,
        updatedAt: c.updatedAt || c.createdAt,
        messageCount: c.messages?.length || 0,
        hasPendingAction: !!(c.pendingAction && c.pendingAction.status === 'pending')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations: ' + err.message });
  }
});

// 2. Get specific conversation history
router.get('/api/assist/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conv = await AssistConversation.findByConversationId(req.params.id, req.user.email);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({
      success: true,
      conversation: {
        conversationId: conv.conversationId,
        title: conv.title,
        messages: conv.messages || [],
        pendingAction: conv.pendingAction?.status === 'pending' ? conv.pendingAction : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversation: ' + err.message });
  }
});

// 3. Delete conversation
router.delete('/api/assist/conversations/:id', authMiddleware, async (req, res) => {
  try {
    await AssistConversation.deleteOne(req.params.id, req.user.email);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation: ' + err.message });
  }
});

// 4. Send chat message (SSE Streaming by default or JSON fallback)
router.post('/api/assist/chat', assistLimiter, authMiddleware, async (req, res) => {
  const { message, conversationId, stream: clientStream } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const wantsSse = clientStream !== false && req.headers.accept?.includes('text/event-stream');

  if (wantsSse) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      await handleChatTurn({
        user: req.user,
        message: message.trim(),
        conversationId,
        onEvent: (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      });
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming JSON response
    try {
      const result = await handleChatTurn({
        user: req.user,
        message: message.trim(),
        conversationId,
        onEvent: () => {}
      });
      res.json({
        success: true,
        conversationId: result.conversationId,
        reply: result.reply,
        pendingAction: result.pendingAction,
        isFallback: result.isFallback
      });
    } catch (err) {
      res.status(500).json({ error: 'Assist error: ' + err.message });
    }
  }
});

// 5. Confirm pending write action
router.post('/api/assist/actions/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const result = await confirmAction({ actionId: req.params.id, user: req.user });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// 6. Cancel pending write action
router.post('/api/assist/actions/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await cancelAction({ actionId: req.params.id, user: req.user });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/* =========================================================
   LEGACY COMPATIBILITY ENDPOINTS (Preserved for existing flows)
   ========================================================= */

router.post('/api/assist/generate', assistLimiter, (req, res) => {
  const { prompt } = req.body;
  const p = (prompt || '').toLowerCase();
  let answer = '';
  let utm = null;

  if (p.includes('title') || p.includes('catchy')) {
    answer = `✨ Here are 3 high-converting title suggestions for your link:\n1. "Exclusive Summer Drop 2026 — Limited VIP Access"\n2. "The Ultimate Resource Guide (Free Instant Download)"\n3. "Join 10,000+ Creators Scaling with HEA Link"`;
  } else if (p.includes('utm') || p.includes('campaign') || p.includes('tag') || p.includes('facebook') || p.includes('ad')) {
    let source = 'facebook';
    let medium = 'cpc';
    let campaign = 'spring_launch_2026';
    let content = 'hero_banner_v1';

    if (p.includes('google') || p.includes('search')) {
      source = 'google';
      medium = 'cpc';
      campaign = 'search_intent_2026';
    } else if (p.includes('linkedin')) {
      source = 'linkedin';
      medium = 'social';
      campaign = 'b2b_growth_2026';
    } else if (p.includes('tiktok')) {
      source = 'tiktok';
      medium = 'video';
      campaign = 'viral_growth_2026';
    } else if (p.includes('email') || p.includes('newsletter')) {
      source = 'newsletter';
      medium = 'email';
      campaign = 'product_digest_2026';
    }

    utm = {
      source,
      medium,
      campaign,
      content,
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      utm_content: content
    };
    answer = `🚀 Suggested Campaign Architecture:\n- Source: ${source}\n- Medium: ${medium}\n- Campaign: ${campaign}\n- Content Tag: ${content}\n\nAppended seamlessly to your shortlink!`;
  } else if (p.includes('qr') || p.includes('design') || p.includes('color')) {
    answer = `🎨 QR Best Practices:\n- Minimum contrast ratio 4.5:1 for crisp camera recognition\n- Embed a transparent central brand badge\n- High error correction level (H) for printed physical media`;
  } else {
    answer = `I am HEA Assist Copilot. I analyze traffic anomalies, suggest campaign UTMs, optimize QR scan contrast, and auto-generate readable link back-halves. Ask me anything about scaling your audience!`;
  }

  res.json({
    success: true,
    reply: answer,
    answer,
    utm,
    timestamp: new Date().toISOString()
  });
});

router.post('/api/ai/ask', assistLimiter, optionalAuth, async (req, res) => {
  try {
    const { prompt, dest, customSlug } = req.body;
    if (!prompt && !dest) {
      return res.status(400).json({ error: 'Prompt or destination URL is required.' });
    }

    let realShort = null;
    let fallbackSlug = customSlug || generateCryptoSlug(6);

    if (dest) {
      const security = await inspectUrlSecurity(dest);
      if (!security.safe) {
        return res.status(400).json({ error: security.reason || 'Blocked destination URL' });
      }

      realShort = await getRealWorkingShortUrl(dest);

      const ownerEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : 'guest@healink.store';
      const linkPayload = {
        slug: fallbackSlug,
        dest,
        title: (prompt || 'AI Created Link').slice(0, 80),
        realShort: realShort || '',
        ownerEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: []
      };

      if (isDbConnected()) {
        try {
          await Link.create(linkPayload);
        } catch (_dbErr) {}
      } else {
        if (!Array.isArray(memStore.links)) memStore.links = [];
        memStore.links.push(linkPayload);
      }

      if (firebaseRtdb) {
        try {
          await firebaseRtdb.ref(`links/${fallbackSlug}`).set({
            slug: fallbackSlug,
            dest,
            realShort: realShort || '',
            ownerEmail,
            createdAt: new Date().toISOString()
          });
        } catch (_fbErr) {}
      }
    }

    return res.json({
      answer: `Shortlink prepared successfully! Points to ${dest}.`,
      shortUrl: `https://healink.store/${fallbackSlug}`,
      slug: fallbackSlug,
      realShort,
      notice: 'Legacy AI endpoint. Recommend migrating to /api/assist/chat.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'AI Assistant error: ' + err.message });
  }
});

module.exports = router;
