const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  ownerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    default: 'My QR Code'
  },
  dest: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#38bdf8'
  },
  scans: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
