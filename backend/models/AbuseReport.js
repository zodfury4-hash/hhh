const mongoose = require('mongoose');

const abuseReportSchema = new mongoose.Schema({
  slug: {
    type: String,
    trim: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['phishing', 'malware', 'spam', 'illegal', 'harassment', 'other'],
    default: 'phishing'
  },
  details: {
    type: String,
    trim: true,
    default: ''
  },
  reporterEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: 'anonymous'
  },
  reporterIp: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AbuseReport', abuseReportSchema);
