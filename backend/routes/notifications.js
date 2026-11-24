const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
const Notification = require('../models/Notification');
const memStore = require('../utils/memStore');

/**
 * GET /api/notifications
 * List notifications for the authenticated user
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const ownerEmail = req.user && req.user.email ? String(req.user.email).toLowerCase().trim() : '';
    const onlyUnread = req.query.unread === '1' || req.query.unread === 'true';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const filter = { ownerEmail };
      if (onlyUnread) {
        filter.readAt = null;
      }

      const [notifications, totalCount, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments({ ownerEmail }),
        Notification.countDocuments({ ownerEmail, readAt: null })
      ]);

      return res.json({
        notifications: notifications.map(n => ({
          id: String(n._id),
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          refId: n.refId,
          read: !!n.readAt,
          readAt: n.readAt,
          createdAt: n.createdAt
        })),
        unreadCount,
        totalCount
      });
    }

    // Memory store fallback
    if (!memStore.notifications) memStore.notifications = [];
    const userNotifs = memStore.notifications.filter(n => n.ownerEmail === ownerEmail);
    const filtered = onlyUnread ? userNotifs.filter(n => !n.readAt) : userNotifs;
    const paginated = filtered.slice(skip, skip + limit);
    const unreadCount = userNotifs.filter(n => !n.readAt).length;

    return res.json({
      notifications: paginated.map(n => ({
        id: String(n._id || n.id),
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        refId: n.refId,
        read: !!n.readAt,
        readAt: n.readAt,
        createdAt: n.createdAt
      })),
      unreadCount,
      totalCount: userNotifs.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns lightweight unread count for topbar badges
 */
router.get('/unread-count', authMiddleware, async (req, res, next) => {
  try {
    const ownerEmail = req.user && req.user.email ? String(req.user.email).toLowerCase().trim() : '';
    const isDbConnected = mongoose.connection.readyState === 1;

    let unreadCount = 0;
    if (isDbConnected) {
      unreadCount = await Notification.countDocuments({ ownerEmail, readAt: null });
    } else {
      unreadCount = (memStore.notifications || []).filter(n => n.ownerEmail === ownerEmail && !n.readAt).length;
    }

    return res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/read
 * Mark notifications as read ({ ids: [...] } or { all: true })
 */
router.post('/read', authMiddleware, async (req, res, next) => {
  try {
    const ownerEmail = req.user && req.user.email ? String(req.user.email).toLowerCase().trim() : '';
    const { ids, all } = req.body || {};

    const isDbConnected = mongoose.connection.readyState === 1;
    const now = new Date();

    if (isDbConnected) {
      let updateFilter = { ownerEmail, readAt: null };
      if (!all) {
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ error: 'ids array or all:true required' });
        }
        updateFilter._id = { $in: ids };
      }

      const result = await Notification.updateMany(updateFilter, { $set: { readAt: now } });
      const unreadCount = await Notification.countDocuments({ ownerEmail, readAt: null });

      return res.json({
        success: true,
        updatedCount: result.modifiedCount || 0,
        unreadCount
      });
    }

    // Memory store fallback
    if (!memStore.notifications) memStore.notifications = [];
    let updatedCount = 0;
    memStore.notifications.forEach(n => {
      if (n.ownerEmail === ownerEmail && !n.readAt) {
        const idMatch = all || (Array.isArray(ids) && ids.includes(String(n._id || n.id)));
        if (idMatch) {
          n.readAt = now;
          updatedCount++;
        }
      }
    });

    const unreadCount = memStore.notifications.filter(n => n.ownerEmail === ownerEmail && !n.readAt).length;

    return res.json({
      success: true,
      updatedCount,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const ownerEmail = req.user && req.user.email ? String(req.user.email).toLowerCase().trim() : '';
    const notifId = req.params.id;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const result = await Notification.deleteOne({ _id: notifId, ownerEmail });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      return res.json({ success: true });
    }

    // Memory store fallback
    if (!memStore.notifications) memStore.notifications = [];
    const idx = memStore.notifications.findIndex(n => n.ownerEmail === ownerEmail && String(n._id || n.id) === notifId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    memStore.notifications.splice(idx, 1);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
