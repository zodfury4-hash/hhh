const crypto = require('crypto');
const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const apiTokenSchema = new mongoose.Schema(
  {
    tokenId: {
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenPrefix: {
      type: String,
      required: true
    },
    scopes: {
      type: [String],
      default: ['links:read', 'links:write', 'analytics:read', 'qr:read', 'qr:write']
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

let ApiTokenModel = null;
try {
  ApiTokenModel = mongoose.model('ApiToken', apiTokenSchema);
} catch (_e) {
  ApiTokenModel = mongoose.model('ApiToken');
}

if (!Array.isArray(memStore.apiTokens)) {
  memStore.apiTokens = [];
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

const ApiToken = {
  schema: apiTokenSchema,
  model: ApiTokenModel,

  async generateToken({ userEmail, name, scopes, expiresInDays = 90 }) {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawToken = `hea_pat_${rawSecret}`;
    const tokenHash = hashToken(rawToken);
    const tokenId = `tok_${crypto.randomBytes(8).toString('hex')}`;
    const tokenPrefix = rawToken.slice(0, 14) + '...';

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const doc = {
      tokenId,
      userEmail: userEmail.toLowerCase().trim(),
      name: name.trim(),
      tokenHash,
      tokenPrefix,
      scopes: scopes || ['links:read', 'links:write', 'analytics:read', 'qr:read', 'qr:write'],
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: null
    };

    if (isDbConnected()) {
      await ApiTokenModel.create(doc);
    } else {
      memStore.apiTokens.push(doc);
    }

    return {
      rawToken,
      token: {
        tokenId: doc.tokenId,
        name: doc.name,
        tokenPrefix: doc.tokenPrefix,
        scopes: doc.scopes,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt
      }
    };
  },

  async verifyToken(rawToken) {
    if (!rawToken || !rawToken.startsWith('hea_pat_')) return null;

    const tokenHash = hashToken(rawToken);
    let record = null;

    if (isDbConnected()) {
      record = await ApiTokenModel.findOne({ tokenHash, isActive: true });
    } else {
      record = (memStore.apiTokens || []).find((t) => t.tokenHash === tokenHash && t.isActive);
    }

    if (!record) return null;

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
      return ApiTokenModel.find({ userEmail: email, isActive: true })
        .sort({ createdAt: -1 })
        .select('tokenId name tokenPrefix scopes lastUsedAt expiresAt createdAt')
        .lean();
    }
    return (memStore.apiTokens || [])
      .filter((t) => t.userEmail === email && t.isActive)
      .map((t) => ({
        tokenId: t.tokenId,
        name: t.name,
        tokenPrefix: t.tokenPrefix,
        scopes: t.scopes,
        lastUsedAt: t.lastUsedAt,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt
      }));
  },

  async revokeToken(tokenId, userEmail) {
    const email = userEmail.toLowerCase().trim();
    if (isDbConnected()) {
      const res = await ApiTokenModel.updateOne(
        { tokenId, userEmail: email },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
      return res.modifiedCount > 0;
    }
    const token = (memStore.apiTokens || []).find((t) => t.tokenId === tokenId && t.userEmail === email);
    if (token) {
      token.isActive = false;
      return true;
    }
    return false;
  }
};

module.exports = ApiToken;
