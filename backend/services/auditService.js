'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const memStore = require('../utils/memStore');

if (!memStore.auditLogs) memStore.auditLogs = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function hashIp(ip) {
  if (!ip) return '';
  const salt = process.env.AUDIT_IP_SALT || 'hea_audit_salt_2026';
  return crypto.createHmac('sha256', salt).update(String(ip)).digest('hex').slice(0, 16);
}

/**
 * Record an audit log entry for a workspace.
 */
async function recordAuditLog({
  workspaceId,
  actorId = null,
  actorEmail = '',
  action,
  targetType,
  targetId = '',
  meta = {},
  ip = ''
}) {
  try {
    const ipHash = hashIp(ip);
    // Sanitize meta: never store raw secrets, passwords, or tokens
    const cleanMeta = { ...meta };
    delete cleanMeta.password;
    delete cleanMeta.secret;
    delete cleanMeta.token;
    delete cleanMeta.clientSecret;

    if (isDbConnected()) {
      await AuditLog.create({
        workspaceId,
        actorId,
        actorEmail,
        action,
        targetType,
        targetId,
        meta: cleanMeta,
        ipHash
      });
    } else {
      memStore.auditLogs.unshift({
        id: 'log_' + Date.now(),
        workspaceId,
        actorId,
        actorEmail,
        action,
        targetType,
        targetId,
        meta: cleanMeta,
        ipHash,
        createdAt: new Date()
      });
      if (memStore.auditLogs.length > 5000) {
        memStore.auditLogs = memStore.auditLogs.slice(0, 5000);
      }
    }
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = {
  recordAuditLog,
  hashIp
};
