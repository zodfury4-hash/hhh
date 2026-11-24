'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'link.expiring_soon',
        'link.expired',
        'link.max_clicks_reached',
        'link.first_click',
        'link.milestone_clicks',
        'domain.verified',
        'domain.failed',
        'payment.succeeded',
        'payment.failed',
        'plan.limit_warning',
        'plan.limit_reached',
        'system.announcement'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      default: null
    },
    refId: {
      type: String,
      default: null,
      index: true
    },
    readAt: {
      type: Date,
      default: null,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

// Compound indexes for user query performance and de-duplication
notificationSchema.index({ ownerEmail: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ ownerEmail: 1, type: 1, refId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
