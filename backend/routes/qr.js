const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const QRCode = require('../models/QRCode');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { validate, createQrSchema } = require('../middleware/validation');
const { getEntitlements, assertWithinLimit } = require('../config/plans');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/* =========================================================
   QR CODES CRUD (STRICT AUTH & OWNERSHIP)
   ========================================================= */

// Get all QR codes for authenticated user (or all if admin)
router.get('/api/qrs', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    let list = [];

    if (isDbConnected()) {
      const query = isAdmin ? {} : { ownerEmail: email };
      list = await QRCode.find(query).sort({ createdAt: -1 });
    } else {
      list = isAdmin ? memStore.qrs : memStore.qrs.filter((q) => q.ownerEmail === email);
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

// Create new QR Code
router.post('/api/qrs', authMiddleware, validate(createQrSchema), async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const { title, dest, color } = req.body;

    const entitlements = getEntitlements(req.user);
    if (!isAdmin) {
      let currentUsage = 0;
      if (isDbConnected()) {
        currentUsage = await QRCode.countDocuments({ ownerEmail: email.toLowerCase() });
      } else {
        currentUsage = memStore.qrs.filter((q) => q.ownerEmail === email.toLowerCase()).length;
      }
      assertWithinLimit(entitlements, 'qrCodes', currentUsage);
    }

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
    } catch (fbErr) {}

    res.json({ success: true, qr });
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete QR Code with strict ownership check
router.delete('/api/qrs/:id', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const id = req.params.id;

    if (isDbConnected()) {
      const qr = await QRCode.findById(id);
      if (!qr) return res.status(404).json({ error: 'QR Code not found' });

      if (!isAdmin && qr.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this QR code', code: 'FORBIDDEN' });
      }

      await QRCode.deleteOne({ _id: id });
    } else {
      const qr = memStore.qrs.find((q) => q.id === id);
      if (!qr) return res.status(404).json({ error: 'QR Code not found' });

      if (!isAdmin && qr.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this QR code', code: 'FORBIDDEN' });
      }

      memStore.qrs = memStore.qrs.filter((q) => q.id !== id);
    }

    try {
      await firebaseRtdb.deleteQr(email, id);
    } catch (fbErr) {}

    res.json({ success: true, message: 'QR Code deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
