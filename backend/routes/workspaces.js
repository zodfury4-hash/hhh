'use strict';

const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const Invite = require('../models/Invite');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { requireWorkspace } = require('../middleware/requireWorkspace');
const { requirePermission } = require('../middleware/rbac');
const { recordAuditLog } = require('../services/auditService');
const { getEntitlements, assertWithinLimit } = require('../config/plans');
const mailer = require('../utils/mailer');

if (!memStore.workspaces) memStore.workspaces = [];
if (!memStore.memberships) memStore.memberships = [];
if (!memStore.invites) memStore.invites = [];
if (!memStore.auditLogs) memStore.auditLogs = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/* =========================================================
   WORKSPACES CRUD & MANAGEMENT ENDPOINTS
   ========================================================= */

// 1. List all workspaces user is an active member of
router.get('/api/workspaces', authMiddleware, async (req, res, next) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const userId = req.user._id || req.user.id || email;
    const isPlatformAdmin = req.user.role === 'admin' || req.user.isAdmin;

    let workspaces = [];

    if (isPlatformAdmin) {
      if (isDbConnected()) {
        workspaces = await Workspace.find().sort({ createdAt: -1 }).lean();
      } else {
        workspaces = [...memStore.workspaces];
      }
    } else {
      let memberships = [];
      if (isDbConnected()) {
        memberships = await Membership.find({
          $or: [{ userId }, { userEmail: email }],
          status: 'active'
        }).lean();
        const wsIds = memberships.map((m) => m.workspaceId);
        workspaces = await Workspace.find({ _id: { $in: wsIds } }).sort({ createdAt: -1 }).lean();
      } else {
        memberships = memStore.memberships.filter(
          (m) => (String(m.userId) === String(userId) || m.userEmail === email) && m.status === 'active'
        );
        const wsIds = new Set(memberships.map((m) => String(m.workspaceId)));
        workspaces = memStore.workspaces.filter((w) => wsIds.has(String(w._id || w.id)));
      }

      // Attach user role per workspace
      workspaces = workspaces.map((w) => {
        const mem = memberships.find((m) => String(m.workspaceId) === String(w._id || w.id));
        return {
          ...w,
          userRole: mem ? mem.role : 'viewer'
        };
      });
    }

    return res.json({
      ok: true,
      workspaces
    });
  } catch (err) {
    next(err);
  }
});

// 2. Create new workspace
router.post('/api/workspaces', authMiddleware, async (req, res, next) => {
  try {
    const { name, slug } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ ok: false, error: 'Workspace name is required.' });
    }

    const email = req.user.email.toLowerCase().trim();
    const userId = req.user._id || req.user.id || email;

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);

    const finalSlug = `${cleanSlug || 'workspace'}-${Date.now().toString(36)}`;

    // Check plan limits for workspaces (agencies/teams)
    const entitlements = getEntitlements(req.user);
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      let ownedCount = 0;
      if (isDbConnected()) {
        ownedCount = await Workspace.countDocuments({ ownerEmail: email });
      } else {
        ownedCount = memStore.workspaces.filter((w) => w.ownerEmail === email).length;
      }
      // Free/Pro can only own 1 default workspace
      const maxWorkspaces = entitlements.workspaces > 0 ? entitlements.workspaces + 1 : 1;
      if (ownedCount >= maxWorkspaces) {
        return res.status(403).json({
          ok: false,
          error: `Plan limit reached. Your ${entitlements.name} plan allows up to ${maxWorkspaces} workspaces. Upgrade to Agency or Enterprise to create more client workspaces.`,
          code: 'PLAN_LIMIT_REACHED'
        });
      }
    }

    let workspace = null;
    let membership = null;

    if (isDbConnected()) {
      workspace = new Workspace({
        name: name.trim(),
        slug: finalSlug,
        ownerId: userId,
        ownerEmail: email,
        planKey: req.user.plan || (req.user.isPro ? 'pro' : 'free'),
        seatLimit: entitlements.seats || 1
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
        name: name.trim(),
        slug: finalSlug,
        ownerId: userId,
        ownerEmail: email,
        planKey: req.user.plan || (req.user.isPro ? 'pro' : 'free'),
        seatLimit: entitlements.seats || 1,
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

    await recordAuditLog({
      workspaceId: workspace._id || workspace.id,
      actorId: userId,
      actorEmail: email,
      action: 'workspace.create',
      targetType: 'workspace',
      targetId: String(workspace._id || workspace.id),
      meta: { name: workspace.name, slug: workspace.slug },
      ip: req.ip
    });

    return res.status(201).json({
      ok: true,
      workspace,
      membership
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get single workspace details
router.get('/api/workspaces/:id', authMiddleware, requireWorkspace, async (req, res) => {
  return res.json({
    ok: true,
    workspace: req.workspace,
    membership: req.membership
  });
});

// 4. Update workspace settings
router.patch(
  '/api/workspaces/:id',
  authMiddleware,
  requireWorkspace,
  requirePermission('workspace:update'),
  async (req, res, next) => {
    try {
      const { name, settings } = req.body || {};
      const ws = req.workspace;

      if (name && typeof name === 'string' && name.trim()) {
        ws.name = name.trim().slice(0, 100);
      }

      if (settings && typeof settings === 'object') {
        if (typeof settings.requireSso === 'boolean') {
          // SSO can only be enforced on Enterprise
          const entitlements = getEntitlements(ws);
          if (settings.requireSso && !entitlements.sso) {
            return res.status(403).json({
              ok: false,
              error: 'Enforced SSO is an Enterprise-only security capability.',
              code: 'FEATURE_NOT_IN_PLAN'
            });
          }
          ws.settings.requireSso = settings.requireSso;
        }

        if (Array.isArray(settings.allowedEmailDomains)) {
          ws.settings.allowedEmailDomains = settings.allowedEmailDomains.map((d) => String(d).toLowerCase().trim());
        }

        if (typeof settings.sessionTimeoutMinutes === 'number' && settings.sessionTimeoutMinutes >= 15) {
          ws.settings.sessionTimeoutMinutes = settings.sessionTimeoutMinutes;
        }

        if (Array.isArray(settings.ipAllowlist)) {
          ws.settings.ipAllowlist = settings.ipAllowlist.map((ip) => String(ip).trim());
        }
      }

      if (isDbConnected()) {
        await ws.save();
      }

      await recordAuditLog({
        workspaceId: ws._id || ws.id,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'workspace.update',
        targetType: 'workspace',
        targetId: String(ws._id || ws.id),
        meta: { name: ws.name, settings: ws.settings },
        ip: req.ip
      });

      return res.json({
        ok: true,
        workspace: ws
      });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Delete workspace (Owner only)
router.delete(
  '/api/workspaces/:id',
  authMiddleware,
  requireWorkspace,
  requirePermission('workspace:delete'),
  async (req, res, next) => {
    try {
      const ws = req.workspace;
      const wsId = ws._id || ws.id;

      if (isDbConnected()) {
        await Workspace.deleteOne({ _id: wsId });
        await Membership.deleteMany({ workspaceId: wsId });
        await Invite.deleteMany({ workspaceId: wsId });
      } else {
        memStore.workspaces = memStore.workspaces.filter((w) => String(w._id || w.id) !== String(wsId));
        memStore.memberships = memStore.memberships.filter((m) => String(m.workspaceId) !== String(wsId));
        memStore.invites = memStore.invites.filter((i) => String(i.workspaceId) !== String(wsId));
      }

      return res.json({
        ok: true,
        message: 'Workspace successfully deleted.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/* =========================================================
   MEMBERSHIP & INVITE MANAGEMENT
   ========================================================= */

// 6. List workspace members
router.get(
  '/api/workspaces/:id/members',
  authMiddleware,
  requireWorkspace,
  requirePermission('member:read'),
  async (req, res, next) => {
    try {
      const wsId = req.workspace._id || req.workspace.id;
      let members = [];

      if (isDbConnected()) {
        members = await Membership.find({ workspaceId: wsId }).sort({ role: 1, createdAt: 1 }).lean();
      } else {
        members = memStore.memberships.filter((m) => String(m.workspaceId) === String(wsId));
      }

      // Also return pending invites for admins
      let pendingInvites = [];
      const canManage = req.membership.role === 'owner' || req.membership.role === 'admin';
      if (canManage) {
        if (isDbConnected()) {
          pendingInvites = await Invite.find({
            workspaceId: wsId,
            revokedAt: null,
            acceptedAt: null,
            expiresAt: { $gt: new Date() }
          })
            .select('-tokenHash')
            .lean();
        } else {
          pendingInvites = memStore.invites
            .filter(
              (i) =>
                String(i.workspaceId) === String(wsId) &&
                !i.revokedAt &&
                !i.acceptedAt &&
                new Date(i.expiresAt) > new Date()
            )
            .map((i) => ({ ...i, tokenHash: undefined }));
        }
      }

      const entitlements = getEntitlements(req.workspace);
      const activeMembersCount = members.filter((m) => m.status === 'active').length;
      const seatLimit = req.workspace.seatLimit || entitlements.seats || 1;

      return res.json({
        ok: true,
        members,
        pendingInvites,
        seatUsage: {
          used: activeMembersCount,
          limit: seatLimit,
          remaining: Math.max(0, seatLimit - activeMembersCount)
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Invite a teammate to workspace
router.post(
  '/api/workspaces/:id/invites',
  authMiddleware,
  requireWorkspace,
  requirePermission('member:manage'),
  async (req, res, next) => {
    try {
      const { email, role } = req.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ ok: false, error: 'Valid teammate email address is required.' });
      }

      const inviteRole = (role || 'viewer').toLowerCase();
      if (!['admin', 'editor', 'viewer'].includes(inviteRole)) {
        return res.status(400).json({ ok: false, error: 'Invalid invite role. Must be admin, editor, or viewer.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const ws = req.workspace;
      const wsId = ws._id || ws.id;

      // Check domain restrictions if set
      if (ws.settings && Array.isArray(ws.settings.allowedEmailDomains) && ws.settings.allowedEmailDomains.length > 0) {
        const domain = cleanEmail.split('@')[1];
        if (!ws.settings.allowedEmailDomains.includes(domain)) {
          return res.status(400).json({
            ok: false,
            error: `Email domain '${domain}' is not in the workspace's allowed domains list.`,
            code: 'EMAIL_DOMAIN_NOT_ALLOWED'
          });
        }
      }

      // Check current seat limit
      let activeCount = 0;
      if (isDbConnected()) {
        activeCount = await Membership.countDocuments({ workspaceId: wsId, status: 'active' });
      } else {
        activeCount = memStore.memberships.filter((m) => String(m.workspaceId) === String(wsId) && m.status === 'active').length;
      }

      const entitlements = getEntitlements(ws);
      const seatLimit = ws.seatLimit || entitlements.seats || 1;

      assertWithinLimit({ ...entitlements, seats: seatLimit }, 'seats', activeCount);

      // Check if user is already an active member
      let existingMember = null;
      if (isDbConnected()) {
        existingMember = await Membership.findOne({ workspaceId: wsId, userEmail: cleanEmail });
      } else {
        existingMember = memStore.memberships.find(
          (m) => String(m.workspaceId) === String(wsId) && m.userEmail === cleanEmail
        );
      }
      if (existingMember) {
        return res.status(409).json({
          ok: false,
          error: 'This user is already a member of this workspace.',
          code: 'MEMBER_ALREADY_EXISTS'
        });
      }

      // Generate secure 32-byte token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      let invite = null;
      if (isDbConnected()) {
        // Revoke any prior pending invites for this email in this workspace
        await Invite.updateMany({ workspaceId: wsId, email: cleanEmail, acceptedAt: null }, { revokedAt: new Date() });

        invite = new Invite({
          workspaceId: wsId,
          email: cleanEmail,
          role: inviteRole,
          tokenHash,
          invitedBy: req.user._id || req.user.id || req.user.email,
          expiresAt
        });
        await invite.save();
      } else {
        invite = {
          id: 'inv_' + Date.now(),
          workspaceId: wsId,
          email: cleanEmail,
          role: inviteRole,
          tokenHash,
          invitedBy: req.user._id || req.user.id || req.user.email,
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
          createdAt: new Date()
        };
        invite._id = invite.id;
        memStore.invites.push(invite);
      }

      // Dispatch invite email via mailer
      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:3000';
      const acceptUrl = `${origin}/invites/accept?token=${rawToken}`;
      try {
        await mailer.sendWorkspaceInviteEmail(cleanEmail, ws.name, inviteRole, acceptUrl);
      } catch (mailErr) {
        console.warn('Invite email dispatch note:', mailErr.message);
      }

      await recordAuditLog({
        workspaceId: wsId,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'member.invite',
        targetType: 'member',
        targetId: cleanEmail,
        meta: { email: cleanEmail, role: inviteRole },
        ip: req.ip
      });

      return res.status(201).json({
        ok: true,
        message: `Invitation successfully sent to ${cleanEmail}.`,
        invite: {
          id: invite._id || invite.id,
          email: cleanEmail,
          role: inviteRole,
          expiresAt
        },
        devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined
      });
    } catch (err) {
      next(err);
    }
  }
);

// 8. Accept an invitation
router.post('/api/invites/accept', authMiddleware, async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invitation token is required.' });
    }

    const tokenHash = hashToken(token.trim());
    let invite = null;

    if (isDbConnected()) {
      invite = await Invite.findOne({ tokenHash, acceptedAt: null, revokedAt: null });
    } else {
      invite = memStore.invites.find((i) => i.tokenHash === tokenHash && !i.acceptedAt && !i.revokedAt);
    }

    if (!invite) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid, already accepted, or revoked invitation.',
        code: 'INVITE_NOT_FOUND'
      });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({
        ok: false,
        error: 'This invitation has expired. Please request a new invite.',
        code: 'INVITE_EXPIRED'
      });
    }

    const email = req.user.email.toLowerCase().trim();
    if (invite.email.toLowerCase() !== email) {
      return res.status(403).json({
        ok: false,
        error: `This invitation was issued to ${invite.email}. You are currently signed in as ${email}. Please sign in with the invited email address.`,
        code: 'INVITE_EMAIL_MISMATCH'
      });
    }

    const wsId = invite.workspaceId;
    let ws = null;
    if (isDbConnected()) {
      ws = await Workspace.findById(wsId);
    } else {
      ws = memStore.workspaces.find((w) => String(w._id || w.id) === String(wsId));
    }

    if (!ws) {
      return res.status(404).json({ ok: false, error: 'Workspace no longer exists.' });
    }

    // Re-check seat limit race condition
    let activeMembersCount = 0;
    if (isDbConnected()) {
      activeMembersCount = await Membership.countDocuments({ workspaceId: wsId, status: 'active' });
    } else {
      activeMembersCount = memStore.memberships.filter((m) => String(m.workspaceId) === String(wsId) && m.status === 'active').length;
    }

    const entitlements = getEntitlements(ws);
    const seatLimit = ws.seatLimit || entitlements.seats || 1;
    assertWithinLimit({ ...entitlements, seats: seatLimit }, 'seats', activeMembersCount);

    const userId = req.user._id || req.user.id || email;

    let membership = null;
    if (isDbConnected()) {
      membership = await Membership.findOneAndUpdate(
        { workspaceId: wsId, userId },
        { userEmail: email, role: invite.role, status: 'active' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      invite.acceptedAt = new Date();
      await invite.save();
    } else {
      membership = memStore.memberships.find(
        (m) => String(m.workspaceId) === String(wsId) && String(m.userId) === String(userId)
      );
      if (membership) {
        membership.role = invite.role;
        membership.status = 'active';
      } else {
        membership = {
          id: 'mem_' + Date.now(),
          workspaceId: wsId,
          userId,
          userEmail: email,
          role: invite.role,
          status: 'active',
          createdAt: new Date()
        };
        membership._id = membership.id;
        memStore.memberships.push(membership);
      }
      invite.acceptedAt = new Date();
    }

    await recordAuditLog({
      workspaceId: wsId,
      actorId: userId,
      actorEmail: email,
      action: 'member.join',
      targetType: 'member',
      targetId: String(membership._id || membership.id),
      meta: { email, role: invite.role },
      ip: req.ip
    });

    return res.json({
      ok: true,
      message: `Successfully joined ${ws.name}!`,
      workspace: ws,
      membership
    });
  } catch (err) {
    next(err);
  }
});

// 9. Revoke pending invite
router.delete(
  '/api/workspaces/:id/invites/:inviteId',
  authMiddleware,
  requireWorkspace,
  requirePermission('member:manage'),
  async (req, res, next) => {
    try {
      const inviteId = req.params.inviteId;
      const wsId = req.workspace._id || req.workspace.id;

      if (isDbConnected()) {
        const inv = await Invite.findOne({ _id: inviteId, workspaceId: wsId });
        if (!inv) return res.status(404).json({ ok: false, error: 'Invite not found.' });
        inv.revokedAt = new Date();
        await inv.save();
      } else {
        const inv = memStore.invites.find(
          (i) => (String(i._id) === String(inviteId) || String(i.id) === String(inviteId)) && String(i.workspaceId) === String(wsId)
        );
        if (!inv) return res.status(404).json({ ok: false, error: 'Invite not found.' });
        inv.revokedAt = new Date();
      }

      await recordAuditLog({
        workspaceId: wsId,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'member.invite_revoke',
        targetType: 'invite',
        targetId: String(inviteId),
        ip: req.ip
      });

      return res.json({ ok: true, message: 'Invitation revoked.' });
    } catch (err) {
      next(err);
    }
  }
);

// 10. Update member role or status (suspend/activate)
router.patch(
  '/api/workspaces/:id/members/:userId',
  authMiddleware,
  requireWorkspace,
  requirePermission('member:manage'),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const { role, status } = req.body || {};
      const ws = req.workspace;
      const wsId = ws._id || ws.id;

      // Prevent non-owners from modifying owners
      let targetMem = null;
      if (isDbConnected()) {
        const queryOr = [{ userId: targetUserId }, { userEmail: targetUserId.toLowerCase() }];
        if (mongoose.isValidObjectId(targetUserId)) {
          queryOr.push({ _id: targetUserId });
        }
        targetMem = await Membership.findOne({
          workspaceId: wsId,
          $or: queryOr
        });
      } else {
        targetMem = memStore.memberships.find(
          (m) =>
            String(m.workspaceId) === String(wsId) &&
            (String(m.userId) === String(targetUserId) ||
              String(m.userEmail || '').toLowerCase() === String(targetUserId).toLowerCase() ||
              String(m._id || m.id) === String(targetUserId))
        );
      }

      if (!targetMem) {
        return res.status(404).json({ ok: false, error: 'Workspace member not found.' });
      }

      if (targetMem.role === 'owner' && req.membership.role !== 'owner') {
        return res.status(403).json({
          ok: false,
          error: 'Only workspace owners can modify owner accounts.',
          code: 'FORBIDDEN'
        });
      }

      if (role && ['admin', 'editor', 'viewer'].includes(role)) {
        targetMem.role = role;
      }

      if (status && ['active', 'suspended'].includes(status)) {
        targetMem.status = status;
      }

      if (isDbConnected()) {
        await targetMem.save();
      }

      await recordAuditLog({
        workspaceId: wsId,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'member.update',
        targetType: 'member',
        targetId: String(targetMem.userId),
        meta: { newRole: targetMem.role, newStatus: targetMem.status },
        ip: req.ip
      });

      return res.json({
        ok: true,
        member: targetMem
      });
    } catch (err) {
      next(err);
    }
  }
);

// 11. Remove a member from workspace
router.delete(
  '/api/workspaces/:id/members/:userId',
  authMiddleware,
  requireWorkspace,
  requirePermission('member:manage'),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const wsId = req.workspace._id || req.workspace.id;

      let targetMem = null;
      if (isDbConnected()) {
        const queryOr = [{ userId: targetUserId }, { userEmail: targetUserId.toLowerCase() }];
        if (mongoose.isValidObjectId(targetUserId)) {
          queryOr.push({ _id: targetUserId });
        }
        targetMem = await Membership.findOne({
          workspaceId: wsId,
          $or: queryOr
        });
      } else {
        targetMem = memStore.memberships.find(
          (m) =>
            String(m.workspaceId) === String(wsId) &&
            (String(m.userId) === String(targetUserId) ||
              String(m.userEmail || '').toLowerCase() === String(targetUserId).toLowerCase() ||
              String(m._id || m.id) === String(targetUserId))
        );
      }

      if (!targetMem) {
        return res.status(404).json({ ok: false, error: 'Member not found.' });
      }

      if (targetMem.role === 'owner') {
        return res.status(400).json({
          ok: false,
          error: 'Workspace owner cannot be removed. Transfer ownership first.',
          code: 'CANNOT_REMOVE_OWNER'
        });
      }

      if (isDbConnected()) {
        await Membership.deleteOne({ _id: targetMem._id });
      } else {
        memStore.memberships = memStore.memberships.filter((m) => String(m._id || m.id) !== String(targetMem._id || targetMem.id));
      }

      // Bump tokenVersion of removed user so their active JWT cannot perform workspace actions
      if (isDbConnected()) {
        await User.updateOne({ email: targetMem.userEmail }, { $inc: { tokenVersion: 1 } });
      }

      await recordAuditLog({
        workspaceId: wsId,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'member.remove',
        targetType: 'member',
        targetId: String(targetMem.userId),
        meta: { removedEmail: targetMem.userEmail },
        ip: req.ip
      });

      return res.json({
        ok: true,
        message: 'Member successfully removed from workspace.'
      });
    } catch (err) {
      next(err);
    }
  }
);

// 12. Transfer workspace ownership (Owner only)
router.post(
  '/api/workspaces/:id/transfer-ownership',
  authMiddleware,
  requireWorkspace,
  requirePermission('workspace:transfer'),
  async (req, res, next) => {
    try {
      const { newOwnerEmail } = req.body || {};
      if (!newOwnerEmail || typeof newOwnerEmail !== 'string') {
        return res.status(400).json({ ok: false, error: 'New owner email is required.' });
      }

      const cleanNewEmail = newOwnerEmail.toLowerCase().trim();
      const ws = req.workspace;
      const wsId = ws._id || ws.id;

      let targetMem = null;
      if (isDbConnected()) {
        targetMem = await Membership.findOne({ workspaceId: wsId, userEmail: cleanNewEmail, status: 'active' });
      } else {
        targetMem = memStore.memberships.find(
          (m) => String(m.workspaceId) === String(wsId) && m.userEmail === cleanNewEmail && m.status === 'active'
        );
      }

      if (!targetMem) {
        return res.status(404).json({
          ok: false,
          error: 'Target user must already be an active member of this workspace to become owner.'
        });
      }

      // Update old owner to admin, target to owner
      if (isDbConnected()) {
        await Membership.updateOne({ workspaceId: wsId, userId: req.membership.userId }, { role: 'admin' });
        targetMem.role = 'owner';
        await targetMem.save();

        ws.ownerId = targetMem.userId;
        ws.ownerEmail = cleanNewEmail;
        await ws.save();
      } else {
        req.membership.role = 'admin';
        targetMem.role = 'owner';
        ws.ownerId = targetMem.userId;
        ws.ownerEmail = cleanNewEmail;
      }

      await recordAuditLog({
        workspaceId: wsId,
        actorId: req.user._id || req.user.id || req.user.email,
        actorEmail: req.user.email,
        action: 'workspace.transfer',
        targetType: 'workspace',
        targetId: String(wsId),
        meta: { previousOwner: req.user.email, newOwner: cleanNewEmail },
        ip: req.ip
      });

      return res.json({
        ok: true,
        message: `Ownership of ${ws.name} successfully transferred to ${cleanNewEmail}.`
      });
    } catch (err) {
      next(err);
    }
  }
);

// 13. Audit logs (Admin+, paginated, filter, CSV export)
router.get(
  '/api/workspaces/:id/audit-logs',
  authMiddleware,
  requireWorkspace,
  requirePermission('audit:read'),
  async (req, res, next) => {
    try {
      const ws = req.workspace;
      const wsId = ws._id || ws.id;

      // Plan check: Audit logs require Business, Agency, or Enterprise
      const entitlements = getEntitlements(ws);
      assertWithinLimit(entitlements, 'auditLogs');

      const format = req.query.format === 'csv' ? 'csv' : 'json';
      const actionFilter = req.query.action ? String(req.query.action).trim() : null;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
      const page = Math.max(1, parseInt(req.query.page || '1', 10));

      let logs = [];
      let total = 0;

      if (isDbConnected()) {
        const query = { workspaceId: wsId };
        if (actionFilter) query.action = actionFilter;

        total = await AuditLog.countDocuments(query);
        logs = await AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
      } else {
        let all = memStore.auditLogs.filter((l) => String(l.workspaceId) === String(wsId));
        if (actionFilter) all = all.filter((l) => l.action === actionFilter);
        total = all.length;
        logs = all.slice((page - 1) * limit, page * limit);
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${ws.slug}.csv"`);
        res.write('Timestamp,Actor,Action,Target Type,Target ID,IP Hash\r\n');
        for (const log of logs) {
          const row = [
            JSON.stringify(log.createdAt ? new Date(log.createdAt).toISOString() : ''),
            JSON.stringify(log.actorEmail || 'system'),
            JSON.stringify(log.action),
            JSON.stringify(log.targetType),
            JSON.stringify(log.targetId || ''),
            JSON.stringify(log.ipHash || '')
          ].join(',');
          res.write(row + '\r\n');
        }
        return res.end();
      }

      return res.json({
        ok: true,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
        logs
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
