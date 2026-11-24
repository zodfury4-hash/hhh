'use strict';

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    actorEmail: {
      type: String,
      default: '',
      trim: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      required: true,
      index: true
    },
    targetId: {
      type: String,
      default: ''
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipHash: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
