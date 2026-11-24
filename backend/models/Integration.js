const mongoose = require('mongoose');
const crypto = require('crypto');
const memStore = require('../utils/memStore');
const { encrypt, decrypt, maskSecret } = require('../utils/cryptoEnc');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const integrationSchema = new mongoose.Schema(
  {
    integrationId: {
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
    provider: {
      type: String,
      required: true,
      index: true,
      enum: ['webhooks', 'slack', 'discord', 'zapier', 'make', 'hubspot', 'shopify', 'notion', 'wordpress']
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    configEnc: {
      type: String,
      required: true
    },
    events: {
      type: [String],
      default: ['link.created']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    failureCount: {
      type: Number,
      default: 0
    },
    lastTriggeredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

let IntegrationModel = null;
try {
  IntegrationModel = mongoose.model('Integration', integrationSchema);
} catch (_e) {
  IntegrationModel = mongoose.model('Integration');
}

if (!Array.isArray(memStore.integrations)) {
  memStore.integrations = [];
}

const Integration = {
  schema: integrationSchema,
  model: IntegrationModel,

  async createIntegration({ userEmail, provider, name, config, events }) {
    const integrationId = `int_${crypto.randomBytes(10).toString('hex')}`;
    const configEnc = encrypt(JSON.stringify(config || {}));

    const doc = {
      integrationId,
      userEmail: userEmail.toLowerCase().trim(),
      provider,
      name: (name || `${provider} integration`).trim().slice(0, 80),
      configEnc,
      events: Array.isArray(events) && events.length > 0 ? events : ['link.created'],
      isActive: true,
      failureCount: 0,
      lastTriggeredAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      await IntegrationModel.create(doc);
    } else {
      memStore.integrations.push(doc);
    }

    return this.sanitize(doc, config);
  },

  async findByUser(userEmail) {
    const email = userEmail.toLowerCase().trim();
    let records = [];
    if (isDbConnected()) {
      records = await IntegrationModel.find({ userEmail: email }).sort({ createdAt: -1 });
    } else {
      records = (memStore.integrations || []).filter((i) => i.userEmail === email);
    }
    return records.map((r) => this.sanitize(r));
  },

  async findById(integrationId, userEmail = null) {
    let doc = null;
    if (isDbConnected()) {
      const q = { integrationId };
      if (userEmail) q.userEmail = userEmail.toLowerCase().trim();
      doc = await IntegrationModel.findOne(q);
    } else {
      doc = (memStore.integrations || []).find((i) => {
        if (i.integrationId !== integrationId) return false;
        if (userEmail && i.userEmail !== userEmail.toLowerCase().trim()) return false;
        return true;
      });
    }
    return doc;
  },

  async getDecryptedConfig(integrationDoc) {
    if (!integrationDoc || !integrationDoc.configEnc) return {};
    const dec = decrypt(integrationDoc.configEnc);
    if (!dec) return {};
    try {
      return JSON.parse(dec);
    } catch (_e) {
      return {};
    }
  },

  async updateIntegration(integrationId, userEmail, updates) {
    const doc = await this.findById(integrationId, userEmail);
    if (!doc) return null;

    if (updates.name) doc.name = updates.name.trim().slice(0, 80);
    if (Array.isArray(updates.events)) doc.events = updates.events;
    if (typeof updates.isActive === 'boolean') doc.isActive = updates.isActive;
    if (updates.config) {
      doc.configEnc = encrypt(JSON.stringify(updates.config));
    }
    doc.updatedAt = new Date();

    if (isDbConnected()) {
      await IntegrationModel.updateOne({ integrationId }, { $set: doc });
    }
    return this.sanitize(doc, updates.config);
  },

  async deleteIntegration(integrationId, userEmail) {
    const email = userEmail.toLowerCase().trim();
    if (isDbConnected()) {
      const res = await IntegrationModel.deleteOne({ integrationId, userEmail: email });
      return res.deletedCount > 0;
    } else {
      const idx = (memStore.integrations || []).findIndex(
        (i) => i.integrationId === integrationId && i.userEmail === email
      );
      if (idx !== -1) {
        memStore.integrations.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  sanitize(rawDoc, plainConfig = null) {
    if (!rawDoc) return null;
    let cfg = plainConfig;
    if (!cfg && rawDoc.configEnc) {
      try {
        const dec = decrypt(rawDoc.configEnc);
        if (dec) cfg = JSON.parse(dec);
      } catch (_e) {}
    }
    cfg = cfg || {};

    const maskedConfig = {};
    if (cfg.url) maskedConfig.url = maskSecret(cfg.url);
    if (cfg.secret) maskedConfig.secret = maskSecret(cfg.secret);
    if (cfg.channel) maskedConfig.channel = cfg.channel;

    return {
      integrationId: rawDoc.integrationId,
      provider: rawDoc.provider,
      name: rawDoc.name,
      events: rawDoc.events,
      isActive: rawDoc.isActive,
      failureCount: rawDoc.failureCount || 0,
      lastTriggeredAt: rawDoc.lastTriggeredAt,
      createdAt: rawDoc.createdAt,
      updatedAt: rawDoc.updatedAt,
      config: maskedConfig
    };
  }
};

module.exports = Integration;
