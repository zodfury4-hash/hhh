const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      index: true,
      default: null
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipHash: {
      type: String,
      required: true,
      index: true
    },
    country: {
      type: String,
      default: 'Unknown',
      trim: true
    },
    city: {
      type: String,
      default: 'Unknown',
      trim: true
    },
    device: {
      type: String,
      enum: ['Mobile', 'Desktop', 'Tablet', 'Other'],
      default: 'Desktop'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    referrer: {
      type: String,
      default: 'Direct'
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true
    },
    isQr: {
      type: Boolean,
      default: false
    },
    utmSource: {
      type: String,
      maxlength: 100,
      lowercase: true,
      trim: true,
      default: null
    },
    utmMedium: {
      type: String,
      maxlength: 100,
      lowercase: true,
      trim: true,
      default: null
    },
    utmCampaign: {
      type: String,
      maxlength: 100,
      lowercase: true,
      trim: true,
      default: null
    },
    utmTerm: {
      type: String,
      maxlength: 100,
      lowercase: true,
      trim: true,
      default: null
    },
    utmContent: {
      type: String,
      maxlength: 100,
      lowercase: true,
      trim: true,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Configurable TTL (default 400 days) for automatic lifecycle management and privacy compliance
      expires: parseInt(process.env.CLICK_RETENTION_DAYS || '400', 10) * 86400
    }
  },
  {
    versionKey: false
  }
);

// High-performance compound indexes for aggregations
clickSchema.index({ linkId: 1, timestamp: -1 });
clickSchema.index({ ownerEmail: 1, timestamp: -1 });
clickSchema.index({ slug: 1, timestamp: -1 });
clickSchema.index({ ownerEmail: 1, isBot: 1, timestamp: -1 });
clickSchema.index({ ownerEmail: 1, slug: 1, timestamp: -1 });
clickSchema.index({ ownerEmail: 1, utmCampaign: 1, timestamp: -1 });

module.exports = mongoose.model('Click', clickSchema);
