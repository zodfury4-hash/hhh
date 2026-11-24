const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const memStore = require('../utils/memStore');

/**
 * Creates a notification for a user, with automatic deduplication.
 * @param {Object} params
 * @param {string} params.ownerEmail - User's email
 * @param {string} [params.userId] - User ID
 * @param {string} [params.workspaceId] - Workspace ID
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Short title
 * @param {string} params.body - Detailed message body
 * @param {string} [params.link] - Action URL or route
 * @param {string} [params.refId] - Entity reference ID (for deduplication)
 * @returns {Promise<Object>} The created notification object
 */
async function createNotification({ ownerEmail, userId, workspaceId, type, title, body, link = '', refId = '' }) {
  if (!ownerEmail) return null;
  const email = String(ownerEmail).trim().toLowerCase();

  const isDbConnected = mongoose.connection.readyState === 1;

  // Deduplication check: if notification with same ownerEmail, type, and refId was created in last 1 hour, skip
  if (refId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (isDbConnected) {
      const existing = await Notification.findOne({
        ownerEmail: email,
        type,
        refId,
        createdAt: { $gte: oneHourAgo }
      }).lean();
      if (existing) return null;
    } else {
      const existing = (memStore.notifications || []).find(n => 
        n.ownerEmail === email && 
        n.type === type && 
        n.refId === refId && 
        new Date(n.createdAt) >= oneHourAgo
      );
      if (existing) return null;
    }
  }

  const notifData = {
    userId: userId || null,
    ownerEmail: email,
    workspaceId: workspaceId || null,
    type: type || 'system',
    title: String(title || 'Notification'),
    body: String(body || ''),
    link: String(link || ''),
    refId: String(refId || ''),
    readAt: null,
    createdAt: new Date()
  };

  if (isDbConnected) {
    const doc = await Notification.create(notifData);
    return doc.toObject();
  }

  if (!memStore.notifications) memStore.notifications = [];
  notifData._id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  notifData.id = notifData._id;
  memStore.notifications.unshift(notifData);
  return notifData;
}

module.exports = {
  createNotification
};
