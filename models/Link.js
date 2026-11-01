const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
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
    default: 0
  },
  clicks: [
    {
      timestamp: { type: Date, default: Date.now },
      ip: String,
      country: String,
      referer: String,
      userAgent: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Link', linkSchema);
