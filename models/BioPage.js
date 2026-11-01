const mongoose = require('mongoose');

const bioPageSchema = new mongoose.Schema({
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
    default: 'My Bio Page'
  },
  tagline: {
    type: String,
    default: 'Welcome to my official links'
  },
  avatar: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'cyber-dark'
  },
  links: [
    {
      label: String,
      url: String,
      icon: String
    }
  ],
  views: {
    type: Number,
    default: 0
  },
  engagements: {
    type: Number,
    default: 0
  },
  unpublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BioPage', bioPageSchema);
