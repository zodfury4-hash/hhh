const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Link = require('../models/Link');
const QRCode = require('../models/QRCode');
const BioPage = require('../models/BioPage');
const CustomDomain = require('../models/CustomDomain');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, optionalAuth, JWT_SECRET } = require('../middleware/auth');
const {
  VIP_ADMIN_ACCOUNTS,
  isVipAdminEmail,
  devCodeField,
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, mailTransporter } = require('../utils/mailer');

const IS_PROD = process.env.NODE_ENV === 'production';
function isDbConnected() { return mongoose.connection.readyState === 1; }

/* =========================================================

   4. QR CODES CRUD

   ========================================================= */

router.get('/api/qrs', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    let list = [];

    if (isDbConnected()) {

      list = await QRCode.find({ ownerEmail: email }).sort({ createdAt: -1 });

    } else {

      list = memStore.qrs.filter(q => q.ownerEmail === email);

    }

    if (list.length === 0) {

      try {

        const fbQrs = await firebaseRtdb.getUserQrs(email);

        if (fbQrs && fbQrs.length > 0) list = fbQrs;

      } catch (fbErr) {}

    }

    res.json({ qrs: list });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

router.post('/api/qrs', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const { title, dest, color } = req.body;

    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    let qr = null;

    if (isDbConnected()) {

      qr = new QRCode({

        ownerEmail: email,

        title: title || 'My QR Code',

        dest,

        color: color || '#ff007f',

        scans: 0

      });

      await qr.save();

    } else {

      qr = {

        id: 'qr_' + Date.now(),

        ownerEmail: email,

        title: title || 'My QR Code',

        dest,

        color: color || '#ff007f',

        scans: 0,

        createdAt: new Date()

      };

      memStore.qrs.unshift(qr);

    }

    try {

      await firebaseRtdb.saveQr(email, {

        id: qr._id || qr.id,

        title: qr.title,

        dest: qr.dest,

        color: qr.color,

        scans: 0

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB saveQr warn]', fbErr.message);

    }

    res.json({ success: true, qr });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

router.delete('/api/qrs/:id', authMiddleware, async (req, res) => {

  try {

    const email = req.user.email;

    const id = req.params.id;

    if (isDbConnected()) {

      await QRCode.deleteOne({ ownerEmail: email, _id: id });

    } else {

      memStore.qrs = memStore.qrs.filter(q => !(q.ownerEmail === email && q.id === id));

    }

    try {

      await firebaseRtdb.deleteQr(email, id);

    } catch (fbErr) {}

    res.json({ success: true, message: 'QR Code deleted' });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


module.exports = router;
