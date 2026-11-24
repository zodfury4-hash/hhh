const crypto = require('crypto');
const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const apiKeySchema = new mongoose.Schema(
  {
    keyId: {
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
    userId: {
      type: String,
      default: null,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    prefix: {
      type: String,
      required: true
    },
    isTest: {
      type: Boolean,
      default: false,
      index: true
    },
    scopes: {
      type: [String],
      default: ['links:read', 'links:write', 'analytics:read', 'qr:write', 'webhooks:write']
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

let ApiKeyModel = null;
try {
  ApiKeyModel = mongoose.model('ApiKey', apiKeySchema);
} catch (_e) {
  ApiKeyModel = mongoose.model('ApiKey');
}

if (!Array.isArray(memStore.apiKeys)) {
  memStore.apiKeys = [];
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const ApiKey = {
  schema: apiKeySchema,
  model: ApiKeyModel,

  async generateKey({ userEmail, name, scopes, isTest = false, expiresInDays = null }) {
    const rawSecret = crypto.randomBytes(32).toString('base64url');
    const prefixStr = isTest ? 'hea_test_' : 'hea_live_';
    const rawKey = `${prefixStr}${rawSecret}`;
    const keyHash = hashKey(rawKey);
    const keyId = `key_${crypto.randomBytes(10).toString('hex')}`;
    const displayPrefix = rawKey.slice(0, 16) + '...';

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const doc = {
      keyId,
      userEmail: userEmail.toLowerCase().trim(),
      userId: userEmail.toLowerCase().trim(),
      name: (name || 'Default API Key').trim().slice(0, 80),
      keyHash,
      prefix: displayPrefix,
      isTest: !!isTest,
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['links:read', 'links:write', 'analytics:read', 'qr:write', 'webhooks:write'],
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      await ApiKeyModel.create(doc);
    } else {
      memStore.apiKeys.push(doc);
    }

    return {
      rawKey,
      key: {
        keyId: doc.keyId,
        name: doc.name,
        prefix: doc.prefix,
        isTest: doc.isTest,
        scopes: doc.scopes,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt
      },
      doc
    };
  },

  async verifyKey(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') return null;
    if (!rawKey.startsWith('hea_live_') && !rawKey.startsWith('hea_test_')) {
      return null;
    }

    const inputHash = hashKey(rawKey);
    let record = null;

    if (isDbConnected()) {
      record = await ApiKeyModel.findOne({ keyHash: inputHash, revokedAt: null });
    } else {
      record = (memStore.apiKeys || []).find(
        (k) => k.keyHash === inputHash && !k.revokedAt
      );
    }

    if (!record) return null;

    // Constant-time compare verification
    if (!safeCompare(inputHash, record.keyHash)) {
      return null;
    }

    // Check expiration
    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      return null;
    }

    // Update lastUsedAt asynchronously
    record.lastUsedAt = new Date();
    if (isDbConnected() && typeof record.save === 'function') {
      record.save().catch(() => {});
    }

    return record;
  },

  async listByUser(userEmail) {
    const email = userEmail.toLowerCase().trim();
    if (isDbConnected()) {
      return ApiKeyModel.find({ userEmail: email, revokedAt: null })
        .sort({ createdAt: -1 })
        .select('keyId name prefix isTest scopes lastUsedAt expiresAt createdAt')
        .lean();
    }
    return (memStore.apiKeys || [])
      .filter((k) => k.userEmail === email && !k.revokedAt)
      .map((k) => ({
        keyId: k.keyId,
        name: k.name,
        prefix: k.prefix,
        isTest: k.isTest,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt
      }));
  },

  async revokeKey(keyId, userEmail) {
    const email = userEmail.toLowerCase().trim();
    const now = new Date();
    if (isDbConnected()) {
      const res = await ApiKeyModel.updateOne(
        { keyId, userEmail: email, revokedAt: null },
        { $set: { revokedAt: now, updatedAt: now } }
      );
      return res.modifiedCount > 0;
    }
    const key = (memStore.apiKeys || []).find(
      (k) => k.keyId === keyId && k.userEmail === email && !k.revokedAt
    );
    if (key) {
      key.revokedAt = now;
      return true;
    }
    return false;
  }
};

module.exports = ApiKey;
