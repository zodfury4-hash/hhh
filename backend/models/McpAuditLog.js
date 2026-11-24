const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const mcpAuditLogSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      default: null,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    toolName: {
      type: String,
      required: true,
      index: true
    },
    params: {
      type: Object,
      default: {}
    },
    durationMs: {
      type: Number,
      default: 0
    },
    success: {
      type: Boolean,
      default: true
    },
    error: {
      type: String,
      default: null
    },
    ip: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: 'MCP-Client'
    }
  },
  {
    timestamps: true
  }
);

let McpAuditLogModel = null;
try {
  McpAuditLogModel = mongoose.model('McpAuditLog', mcpAuditLogSchema);
} catch (_e) {
  McpAuditLogModel = mongoose.model('McpAuditLog');
}

if (!Array.isArray(memStore.mcpAuditLogs)) {
  memStore.mcpAuditLogs = [];
}

const McpAuditLog = {
  schema: mcpAuditLogSchema,
  model: McpAuditLogModel,

  async log({ tokenId, userEmail, toolName, params = {}, durationMs = 0, success = true, error = null, ip = '127.0.0.1', userAgent = 'MCP-Client' }) {
    // Scrub sensitive params
    const sanitizedParams = { ...params };
    if (sanitizedParams.password) sanitizedParams.password = '[REDACTED]';
    if (sanitizedParams.passcode) sanitizedParams.passcode = '[REDACTED]';

    const entry = {
      tokenId: tokenId || null,
      userEmail: (userEmail || 'unknown').toLowerCase().trim(),
      toolName,
      params: sanitizedParams,
      durationMs,
      success,
      error,
      ip,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      try {
        await McpAuditLogModel.create(entry);
      } catch (_e) {}
    } else {
      memStore.mcpAuditLogs.push(entry);
    }
    return entry;
  },

  async getRecent(userEmail, limit = 50) {
    const email = userEmail.toLowerCase().trim();
    if (isDbConnected()) {
      return McpAuditLogModel.find({ userEmail: email }).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return (memStore.mcpAuditLogs || [])
      .filter((l) => l.userEmail === email)
      .slice(-limit)
      .reverse();
  }
};

module.exports = McpAuditLog;
