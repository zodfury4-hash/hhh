'use strict';

const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer',
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

InviteSchema.index({ workspaceId: 1, email: 1 });
InviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
