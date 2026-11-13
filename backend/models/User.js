const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'John'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  resetPasswordCode: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  city: {
    type: String,
    default: 'New York'
  },
  country: {
    type: String,
    default: 'United States'
  },
  isp: {
    type: String,
    default: 'Global Internet'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isPro: {
    type: Boolean,
    default: false
  },
  plan: {
    type: String,
    default: 'Free'
  },
  subscriptionDate: {
    type: Date,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
