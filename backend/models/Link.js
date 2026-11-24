const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
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
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    default: 'Untitled Link'
  },
  dest: {
    type: String,
    required: true,
    trim: true
  },
  tag: {
    type: String,
    default: 'General'
  },
  realShort: {
    type: String,
    default: null
  },
  qr: {
    type: Boolean,
    default: true
  },
  scans: {
    type: Number,
    default: 0,
    min: 0
  },
  totalClicks: {
    type: Number,
    default: 0,
    min: 0
  },
  humanClicks: {
    type: Number,
    default: 0,
    min: 0
  },
  botClicks: {
    type: Number,
    default: 0,
    min: 0
  },
  totalScans: {
    type: Number,
    default: 0,
    min: 0
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
    index: true
  },
  utm: {
    source: { type: String, lowercase: true, trim: true, default: null },
    medium: { type: String, lowercase: true, trim: true, default: null },
    campaign: { type: String, lowercase: true, trim: true, default: null },
    term: { type: String, lowercase: true, trim: true, default: null },
    content: { type: String, lowercase: true, trim: true, default: null }
  },
  password: {
    type: String,
    default: null
  },
  passwordHash: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  maxClicks: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

linkSchema.index({ slug: 1 }, { unique: true });
linkSchema.index({ ownerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Link', linkSchema);
