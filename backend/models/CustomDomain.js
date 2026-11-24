const mongoose = require('mongoose');

const customDomainSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'failed', 'inactive'],
      default: 'pending_verification',
      index: true
    },
    verificationToken: {
      type: String,
      required: true,
      trim: true
    },
    cnameTarget: {
      type: String,
      default: process.env.CNAME_TARGET || 'cname.healink.store',
      trim: true
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    lastCheckedAt: {
      type: Date,
      default: null
    },
    lastError: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Partial unique index: Only one active verification can exist per domain across all users
customDomainSchema.index(
  { domain: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Compound index for user lookups
customDomainSchema.index({ ownerEmail: 1, domain: 1 });

module.exports = mongoose.model('CustomDomain', customDomainSchema);
