'use strict';

const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100
    },
    ownerId: {
      type: mongoose.Schema.Types.Mixed, // string id or ObjectId
      required: true,
      index: true
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    planKey: {
      type: String,
      enum: ['free', 'pro', 'business', 'agency', 'enterprise'],
      default: 'free'
    },
    stripeCustomerId: {
      type: String,
      default: null
    },
    stripeSubscriptionId: {
      type: String,
      default: null
    },
    seatLimit: {
      type: Number,
      default: 1
    },
    settings: {
      requireSso: { type: Boolean, default: false },
      allowedEmailDomains: [{ type: String, lowercase: true, trim: true }],
      sessionTimeoutMinutes: { type: Number, default: 1440 },
      ipAllowlist: [{ type: String, trim: true }],
      enforce2fa: { type: Boolean, default: false }
    },
    parentWorkspaceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    isClientWorkspace: {
      type: Boolean,
      default: false
    },
    clientMeta: {
      clientName: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#0070f3' },
      shareToken: { type: String, default: null, index: true },
      shareTokenExpiresAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index({ ownerEmail: 1 });
WorkspaceSchema.index({ parentWorkspaceId: 1 });

module.exports = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
