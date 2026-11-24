const express = require('express');
const router = express.Router();

const QRCode = require('../models/QRCode');
const memStore = require('../utils/memStore');
const { isDbConnected, isMemStoreAllowed, createDbUnavailableError } = require('../middleware/dbCheck');
const { authMiddleware } = require('../middleware/auth');
const { validate, createQrSchema } = require('../middleware/validation');
const { getEntitlements, assertWithinLimit } = require('../config/plans');

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
    } else if (isMemStoreAllowed()) {
      list = isAdmin ? memStore.qrs : memStore.qrs.filter((q) => q.ownerEmail === email);
    } else {
      throw createDbUnavailableError();
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
      } else if (isMemStoreAllowed()) {
        currentUsage = memStore.qrs.filter((q) => q.ownerEmail === email.toLowerCase()).length;
      } else {
        throw createDbUnavailableError();
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
    } else if (isMemStoreAllowed()) {
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
    } else {
      throw createDbUnavailableError();
    }

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
    } else if (isMemStoreAllowed()) {
      const qr = memStore.qrs.find((q) => q.id === id);
      if (!qr) return res.status(404).json({ error: 'QR Code not found' });

      if (!isAdmin && qr.ownerEmail !== email) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You do not have permission to delete this QR code', code: 'FORBIDDEN' });
      }

      memStore.qrs = memStore.qrs.filter((q) => q.id !== id);
    } else {
      throw createDbUnavailableError();
    }

    res.json({ success: true, message: 'QR Code deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
