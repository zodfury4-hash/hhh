const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const assistConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: 120
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system', 'tool'],
          required: true
        },
        content: {
          type: String,
          default: ''
        },
        toolCalls: {
          type: Array,
          default: []
        },
        toolResults: {
          type: Array,
          default: []
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    pendingAction: {
      actionId: { type: String, default: null },
      toolName: { type: String, default: null },
      params: { type: Object, default: null },
      summary: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'expired'],
        default: 'pending'
      }
    }
  },
  {
    timestamps: true
  }
);

assistConversationSchema.index({ userEmail: 1, updatedAt: -1 });

let AssistConversationModel = null;
try {
  AssistConversationModel = mongoose.model('AssistConversation', assistConversationSchema);
} catch (_e) {
  AssistConversationModel = mongoose.model('AssistConversation');
}

/**
 * In-memory fallback helper
 */
if (!Array.isArray(memStore.assistConversations)) {
  memStore.assistConversations = [];
}

const AssistConversation = {
  schema: assistConversationSchema,
  model: AssistConversationModel,

  async findByUser(userEmail, limit = 20) {
    if (isDbConnected()) {
      return AssistConversationModel.find({ userEmail: userEmail.toLowerCase() })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
    }
    return memStore.assistConversations
      .filter((c) => c.userEmail === userEmail.toLowerCase())
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, limit);
  },

  async findByConversationId(conversationId, userEmail) {
    if (isDbConnected()) {
      return AssistConversationModel.findOne({
        conversationId,
        userEmail: userEmail.toLowerCase()
      });
    }
    return memStore.assistConversations.find(
      (c) => c.conversationId === conversationId && c.userEmail === userEmail.toLowerCase()
    );
  },

  async create(data) {
    const doc = {
      ...data,
      userEmail: data.userEmail.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (isDbConnected()) {
      return AssistConversationModel.create(doc);
    }
    memStore.assistConversations.push(doc);
    return doc;
  },

  async save(conversation) {
    conversation.updatedAt = new Date();
    if (isDbConnected() && typeof conversation.save === 'function') {
      return conversation.save();
    }
    const idx = memStore.assistConversations.findIndex(
      (c) => c.conversationId === conversation.conversationId
    );
    if (idx >= 0) {
      memStore.assistConversations[idx] = conversation;
    } else {
      memStore.assistConversations.push(conversation);
    }
    return conversation;
  },

  async deleteOne(conversationId, userEmail) {
    if (isDbConnected()) {
      return AssistConversationModel.deleteOne({
        conversationId,
        userEmail: userEmail.toLowerCase()
      });
    }
    const idx = memStore.assistConversations.findIndex(
      (c) => c.conversationId === conversationId && c.userEmail === userEmail.toLowerCase()
    );
    if (idx >= 0) {
      memStore.assistConversations.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
};

module.exports = AssistConversation;
