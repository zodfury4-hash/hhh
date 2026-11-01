const mongoose = require('mongoose');

const customDomainSchema = new mongoose.Schema({
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
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'pending_verification', 'inactive'],
    default: 'pending_verification'
  },
  targetCname: {
    type: String,
    default: 'cname.healink.store'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CustomDomain', customDomainSchema);
