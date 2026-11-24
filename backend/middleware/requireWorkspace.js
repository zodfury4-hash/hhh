'use strict';

const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const memStore = require('../utils/memStore');

if (!memStore.workspaces) memStore.workspaces = [];
if (!memStore.memberships) memStore.memberships = [];
if (!memStore.invites) memStore.invites = [];
if (!memStore.auditLogs) memStore.auditLogs = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Middleware resolving active workspace and validating membership.
 * Attaches req.workspace and req.membership.
 */
async function requireWorkspace(req, res, next) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required to access workspace resources.',
        code: 'UNAUTHORIZED'
      });
    }

    const email = req.user.email.toLowerCase().trim();
    const userId = req.user._id || req.user.id || email;
    const isPlatformAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const requestedWsId = req.headers['x-workspace-id'] || req.query.workspaceId || (req.body && req.body.workspaceId);

    let workspace = null;
    let membership = null;

    if (requestedWsId) {
      // 1. Explicit workspace requested by ID or slug
      if (isDbConnected()) {
        if (mongoose.isValidObjectId(requestedWsId)) {
          workspace = await Workspace.findById(requestedWsId);
        }
        if (!workspace) {
          workspace = await Workspace.findOne({ slug: requestedWsId.toLowerCase() });
        }
      } else {
        workspace = memStore.workspaces.find(
          (w) => String(w._id || w.id) === String(requestedWsId) || w.slug === requestedWsId.toLowerCase()
        );
      }

      if (!workspace) {
        return res.status(404).json({
          ok: false,
          error: 'Requested workspace was not found.',
          code: 'WORKSPACE_NOT_FOUND'
        });
      }

      // Check membership
      if (isPlatformAdmin) {
        membership = {
          workspaceId: workspace._id || workspace.id,
          userId,
          userEmail: email,
          role: 'owner',
          status: 'active'
        };
      } else {
        if (isDbConnected()) {
          membership = await Membership.findOne({
            workspaceId: workspace._id,
            $or: [{ userId }, { userEmail: email }]
          });
        } else {
          membership = memStore.memberships.find(
            (m) =>
              String(m.workspaceId) === String(workspace._id || workspace.id) &&
              (String(m.userId) === String(userId) || m.userEmail === email)
          );
        }

        if (!membership || membership.status === 'suspended') {
          return res.status(403).json({
            ok: false,
            error: 'You are not an active member of this workspace.',
            code: 'WORKSPACE_ACCESS_DENIED'
          });
        }
      }
    } else {
      // 2. Default workspace resolution: find first active membership
      if (isDbConnected()) {
        membership = await Membership.findOne({
          $or: [{ userId }, { userEmail: email }],
          status: 'active'
        }).sort({ createdAt: 1 });

        if (membership) {
          workspace = await Workspace.findById(membership.workspaceId);
        }
      } else {
        membership = memStore.memberships.find(
          (m) => (String(m.userId) === String(userId) || m.userEmail === email) && m.status === 'active'
        );
        if (membership) {
          workspace = memStore.workspaces.find((w) => String(w._id || w.id) === String(membership.workspaceId));
        }
      }

      // If user has no workspace yet, auto-provision personal workspace
      if (!workspace) {
        const cleanBase = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user';
        const slug = `${cleanBase}-${Date.now().toString(36)}`;
        const name = `${req.user.name || cleanBase}'s Workspace`;
        const planKey = req.user.plan || (req.user.isPro ? 'pro' : 'free');

        if (isDbConnected()) {
          workspace = new Workspace({
            name,
            slug,
            ownerId: userId,
            ownerEmail: email,
            planKey,
            seatLimit: 1
          });
          await workspace.save();

          membership = new Membership({
            workspaceId: workspace._id,
            userId,
            userEmail: email,
            role: 'owner',
            status: 'active'
          });
          await membership.save();
        } else {
          workspace = {
            id: 'ws_' + Date.now(),
            name,
            slug,
            ownerId: userId,
            ownerEmail: email,
            planKey,
            seatLimit: 1,
            settings: { requireSso: false, allowedEmailDomains: [] },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          workspace._id = workspace.id;
          memStore.workspaces.push(workspace);

          membership = {
            id: 'mem_' + Date.now(),
            workspaceId: workspace.id,
            userId,
            userEmail: email,
            role: 'owner',
            status: 'active',
            createdAt: new Date()
          };
          membership._id = membership.id;
          memStore.memberships.push(membership);
        }
      }
    }

    req.workspace = workspace;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireWorkspace,
  isDbConnected
};
