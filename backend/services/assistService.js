const crypto = require('crypto');
const mongoose = require('mongoose');
const Link = require('../models/Link');
const QRCode = require('../models/QRCode');
const AssistConversation = require('../models/AssistConversation');
const { generateUniqueSlug } = require('../utils/slugGenerator');
const { toolLoop, isAiConfigured } = require('./llm');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const { ASSIST_SYSTEM_PROMPT, ASSIST_TOOLS, executeAssistTool } = require('./assistTools');

/**
 * Handle a chat turn
 */
async function handleChatTurn({ user, message, conversationId, onEvent = () => {} }) {
  const userEmail = (user.email || '').toLowerCase().trim();

  // 1. Load or initialize conversation
  let conv = null;
  const targetId = conversationId || `conv_${crypto.randomBytes(8).toString('hex')}`;

  conv = await AssistConversation.findByConversationId(targetId, userEmail);
  if (!conv) {
    conv = await AssistConversation.create({
      conversationId: targetId,
      userEmail,
      title: message.slice(0, 40) || 'New Conversation',
      messages: []
    });
  }

  // 2. Append incoming user message
  const userMsgObj = {
    role: 'user',
    content: message,
    createdAt: new Date()
  };
  conv.messages.push(userMsgObj);

  // 3. Fallback heuristic response if Anthropic LLM is unconfigured
  if (!isAiConfigured()) {
    onEvent({ type: 'notice', text: 'Rule-based smart heuristics active (AI model in standby)' });

    let replyText = '';
    let pendingAction = null;

    const lower = message.toLowerCase();
    if (lower.includes('list') || lower.includes('links') || lower.includes('show my')) {
      const data = await executeAssistTool('list_links', { limit: 5 }, user);
      if (data.count === 0) {
        replyText = "You don't have any shortlinks created yet. Would you like me to help you shorten your first URL?";
      } else {
        replyText = `Here are your recent shortlinks:\n\n` +
          data.links.map((l) => `- [**${l.slug}**](${l.shortUrl}) → \`${l.dest}\` (${l.clicks} clicks)`).join('\n');
      }
    } else if (lower.includes('shorten') || lower.includes('create link')) {
      const urlMatch = message.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        const dest = urlMatch[0];
        const res = await executeAssistTool('create_link', { dest }, user);
        replyText = res.message;
        pendingAction = res.pendingAction;
      } else {
        replyText = 'Please provide the URL you want to shorten (e.g. `shorten https://mybrand.com/products`).';
      }
    } else if (lower.includes('analytics') || lower.includes('traffic') || lower.includes('clicks')) {
      const stats = await executeAssistTool('get_account_analytics', { range: '7d' }, user);
      replyText = `📊 **Account Overview (Last 7 Days)**:\n- Total links: **${stats.totalLinks}**\n- Total recorded clicks: **${stats.totalClicks}**\n- Average per link: **${stats.averageClicksPerLink}** clicks`;
    } else {
      replyText = `Hello! I am **HEA Assist**. I can help you with:\n- Viewing your links and click analytics\n- Proposing new shortlinks and custom QR codes\n- Generating high-CTR slugs and UTM tracking parameters.\n\n*Notice: Operating in heuristic mode while ANTHROPIC_API_KEY is in standby.*`;
    }

    const assistantMsg = {
      role: 'assistant',
      content: replyText,
      createdAt: new Date()
    };
    conv.messages.push(assistantMsg);

    if (pendingAction) {
      conv.pendingAction = pendingAction;
    }

    await AssistConversation.save(conv);

    onEvent({ type: 'content_block_delta', delta: { text: replyText } });
    if (pendingAction) {
      onEvent({ type: 'action_proposed', pendingAction });
    }
    onEvent({ type: 'done', conversationId: conv.conversationId });

    return {
      conversationId: conv.conversationId,
      reply: replyText,
      pendingAction,
      isFallback: true
    };
  }

  // 4. Multi-turn LLM Tool Loop
  const llmMessages = conv.messages
    .slice(-10)
    .map((m) => ({
      role: m.role === 'tool' ? 'user' : m.role,
      content: m.content
    }));

  const result = await toolLoop({
    system: ASSIST_SYSTEM_PROMPT,
    messages: llmMessages,
    tools: ASSIST_TOOLS,
    onToolCall: async (name, input) => {
      onEvent({ type: 'tool_call', name, input });
      return executeAssistTool(name, input, user);
    },
    onEvent
  });

  const assistantMsg = {
    role: 'assistant',
    content: result.text || '',
    createdAt: new Date()
  };
  conv.messages.push(assistantMsg);

  if (result.pendingAction) {
    conv.pendingAction = result.pendingAction;
    onEvent({ type: 'action_proposed', pendingAction: result.pendingAction });
  }

  await AssistConversation.save(conv);
  onEvent({ type: 'done', conversationId: conv.conversationId });

  return {
    conversationId: conv.conversationId,
    reply: result.text,
    pendingAction: result.pendingAction || null,
    isFallback: false
  };
}

/**
 * Execute a confirmed pending action
 */
async function confirmAction({ actionId, user }) {
  const userEmail = (user.email || '').toLowerCase().trim();

  // Find conversation holding this action
  let conv = null;
  if (isDbConnected()) {
    conv = await mongoose.model('AssistConversation').findOne({
      userEmail,
      'pendingAction.actionId': actionId,
      'pendingAction.status': 'pending'
    });
  } else {
    conv = (memStore.assistConversations || []).find(
      (c) => c.userEmail === userEmail && c.pendingAction?.actionId === actionId && c.pendingAction?.status === 'pending'
    );
  }

  if (!conv || !conv.pendingAction) {
    const err = new Error('Action not found, already confirmed, or expired.');
    err.status = 404;
    throw err;
  }

  const { toolName, params } = conv.pendingAction;
  let actionResult = null;

  if (toolName === 'create_link') {
    let existing = null;
    if (isDbConnected()) {
      try {
        existing = await Link.findOne({ slug: params.slug });
      } catch (_e) {}
    } else {
      existing = (memStore.links || []).find((l) => l.slug === params.slug);
    }
    if (existing) {
      params.slug = await generateUniqueSlug();
    }

    const newLinkData = {
      slug: params.slug,
      dest: params.dest,
      title: params.title || '',
      ownerEmail: userEmail,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      maxClicks: params.maxClicks || null,
      utmCampaign: params.utmCampaign || '',
      utmSource: params.utmSource || '',
      utmMedium: params.utmMedium || ''
    };

    if (isDbConnected()) {
      actionResult = await Link.create(newLinkData);
    } else {
      if (!Array.isArray(memStore.links)) memStore.links = [];
      memStore.links.push(newLinkData);
      actionResult = newLinkData;
    }
  } else if (toolName === 'delete_link') {
    if (isDbConnected()) {
      actionResult = await Link.deleteOne({ slug: params.slug, ownerEmail: userEmail });
    } else {
      const idx = (memStore.links || []).findIndex(
        (l) => l.slug === params.slug && (l.ownerEmail || '').toLowerCase() === userEmail
      );
      if (idx >= 0) memStore.links.splice(idx, 1);
      actionResult = { deleted: true };
    }
  } else if (toolName === 'update_link_expiry') {
    const update = {};
    if (params.expiresAt !== undefined) update.expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
    if (params.maxClicks !== undefined) update.maxClicks = params.maxClicks;

    if (isDbConnected()) {
      actionResult = await Link.findOneAndUpdate({ slug: params.slug, ownerEmail: userEmail }, { $set: update }, { new: true });
    } else {
      const l = (memStore.links || []).find((x) => x.slug === params.slug && (x.ownerEmail || '').toLowerCase() === userEmail);
      if (l) Object.assign(l, update);
      actionResult = l;
    }
  } else if (toolName === 'create_qr') {
    const qrData = {
      name: params.name || 'Assist QR Code',
      data: params.data,
      color: params.color || '#0070f3',
      bgColor: params.bgColor || '#ffffff',
      ownerEmail: userEmail
    };
    if (isDbConnected()) {
      actionResult = await QRCode.create(qrData);
    } else {
      if (!Array.isArray(memStore.qrs)) memStore.qrs = [];
      memStore.qrs.push(qrData);
      actionResult = qrData;
    }
  }

  conv.pendingAction.status = 'confirmed';
  conv.messages.push({
    role: 'system',
    content: `✅ Action confirmed and executed successfully: ${conv.pendingAction.summary}`,
    createdAt: new Date()
  });

  await AssistConversation.save(conv);

  return {
    success: true,
    actionId,
    summary: conv.pendingAction.summary,
    result: actionResult
  };
}

/**
 * Cancel a pending action
 */
async function cancelAction({ actionId, user }) {
  const userEmail = (user.email || '').toLowerCase().trim();

  let conv = null;
  if (isDbConnected()) {
    conv = await mongoose.model('AssistConversation').findOne({
      userEmail,
      'pendingAction.actionId': actionId
    });
  } else {
    conv = (memStore.assistConversations || []).find(
      (c) => c.userEmail === userEmail && c.pendingAction?.actionId === actionId
    );
  }

  if (!conv || !conv.pendingAction) {
    const err = new Error('Action not found');
    err.status = 404;
    throw err;
  }

  conv.pendingAction.status = 'rejected';
  conv.messages.push({
    role: 'system',
    content: `❌ Action cancelled by user: ${conv.pendingAction.summary}`,
    createdAt: new Date()
  });

  await AssistConversation.save(conv);

  return {
    success: true,
    actionId,
    status: 'rejected'
  };
}

module.exports = {
  ASSIST_SYSTEM_PROMPT,
  ASSIST_TOOLS,
  executeAssistTool,
  handleChatTurn,
  confirmAction,
  cancelAction
};
