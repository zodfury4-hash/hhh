const mongoose = require('mongoose');
const config = require('../config');
const memStore = require('../utils/memStore');
const { hashIp } = require('../services/telemetry-service');

const aiUsageSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    requestCount: {
      type: Number,
      default: 0
    },
    inputTokens: {
      type: Number,
      default: 0
    },
    outputTokens: {
      type: Number,
      default: 0
    },
    lastRequestAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

aiUsageSchema.index({ identifier: 1, date: 1 }, { unique: true });

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function getTodayUtcString() {
  return new Date().toISOString().slice(0, 10);
}

function getNextUtcMidnight() {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow;
}

function getRequestIdentifier(req) {
  if (req.user && (req.user.userId || req.user.id || req.user.email)) {
    return `user:${(req.user.userId || req.user.id || req.user.email).toLowerCase().trim()}`;
  }
  const rawIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  return `guest:${hashIp(rawIp, new Date())}`;
}

function getPlanLimit(req) {
  if (!req.user) {
    return config.ai.quotaGuest; // Default 3
  }
  if (req.user.role === 'admin' || req.user.isAdmin) {
    return 10000;
  }
  if (req.user.isPro) {
    return config.ai.quotaPro; // Default 200
  }
  return config.ai.quotaFree; // Default 10
}

/**
 * Check AI Quota for current user or guest
 * @param {Object} req - Express request
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number, resetsAt: Date }>}
 */
async function checkAiQuota(req) {
  const identifier = getRequestIdentifier(req);
  const date = getTodayUtcString();
  const limit = getPlanLimit(req);
  const resetsAt = getNextUtcMidnight();

  let used = 0;

  if (isDbConnected()) {
    const usage = await mongoose.model('AiUsage').findOne({ identifier, date });
    if (usage) used = usage.requestCount;
  } else {
    if (!Array.isArray(memStore.aiUsage)) memStore.aiUsage = [];
    const entry = memStore.aiUsage.find((u) => u.identifier === identifier && u.date === date);
    if (entry) used = entry.requestCount;
  }

  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;

  return {
    allowed,
    remaining,
    limit,
    used,
    resetsAt
  };
}

/**
 * Record usage after an AI request completes
 * @param {Object} req - Express request
 * @param {Object} tokens - { inputTokens, outputTokens }
 */
async function recordAiUsage(req, tokens = {}) {
  const identifier = getRequestIdentifier(req);
  const date = getTodayUtcString();
  const inputTokens = tokens.inputTokens || 0;
  const outputTokens = tokens.outputTokens || 0;

  if (isDbConnected()) {
    await mongoose.model('AiUsage').updateOne(
      { identifier, date },
      {
        $inc: {
          requestCount: 1,
          inputTokens,
          outputTokens
        },
        $set: { lastRequestAt: new Date() }
      },
      { upsert: true }
    );
  } else {
    if (!Array.isArray(memStore.aiUsage)) memStore.aiUsage = [];
    let entry = memStore.aiUsage.find((u) => u.identifier === identifier && u.date === date);
    if (!entry) {
      entry = {
        identifier,
        date,
        requestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        lastRequestAt: new Date()
      };
      memStore.aiUsage.push(entry);
    }
    entry.requestCount += 1;
    entry.inputTokens += inputTokens;
    entry.outputTokens += outputTokens;
    entry.lastRequestAt = new Date();
  }
}

module.exports = {
  AiUsage: mongoose.model('AiUsage', aiUsageSchema),
  checkAiQuota,
  recordAiUsage,
  getRequestIdentifier
};
