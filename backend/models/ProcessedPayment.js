const mongoose = require('mongoose');

const processedPaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  plan: {
    type: String,
    default: 'Core PRO'
  },
  amount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['webhook', 'verify_session', 'sandbox'],
    default: 'webhook'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProcessedPayment', processedPaymentSchema);
