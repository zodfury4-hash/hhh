const mongoose = require('mongoose');
const crypto = require('crypto');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const webhookDeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    integrationId: {
      type: String,
      required: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    targetUrl: {
      type: String,
      required: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    statusCode: {
      type: Number,
      default: null
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['delivered', 'failed', 'retrying'],
      default: 'delivered',
      index: true
    },
    attempt: {
      type: Number,
      default: 1
    },
    error: {
      type: String,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

let WebhookDeliveryModel = null;
try {
  WebhookDeliveryModel = mongoose.model('WebhookDelivery', webhookDeliverySchema);
} catch (_e) {
  WebhookDeliveryModel = mongoose.model('WebhookDelivery');
}

if (!Array.isArray(memStore.webhookDeliveries)) {
  memStore.webhookDeliveries = [];
}

const WebhookDelivery = {
  schema: webhookDeliverySchema,
  model: WebhookDeliveryModel,

  async recordDelivery({ integrationId, userEmail, event, targetUrl, payload, statusCode, latencyMs, status, attempt = 1, error = null }) {
    const deliveryId = `del_${crypto.randomBytes(10).toString('hex')}`;
    const doc = {
      deliveryId,
      integrationId,
      userEmail: userEmail.toLowerCase().trim(),
      event,
      targetUrl,
      payload,
      statusCode,
      latencyMs: Math.round(latencyMs || 0),
      status,
      attempt,
      error,
      deliveredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      await WebhookDeliveryModel.create(doc);
    } else {
      memStore.webhookDeliveries.unshift(doc);
      if (memStore.webhookDeliveries.length > 500) {
        memStore.webhookDeliveries.pop();
      }
    }
    return doc;
  },

  async findByIntegration(integrationId, limit = 20) {
    if (isDbConnected()) {
      return await WebhookDeliveryModel.find({ integrationId }).sort({ createdAt: -1 }).limit(limit);
    } else {
      return (memStore.webhookDeliveries || [])
        .filter((d) => d.integrationId === integrationId)
        .slice(0, limit);
    }
  }
};

module.exports = WebhookDelivery;
