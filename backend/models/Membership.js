'use strict';

const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true
    }
  },
  {
    timestamps: true
  }
);

MembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ workspaceId: 1, userEmail: 1 });
MembershipSchema.index({ userId: 1 });

module.exports = mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);
