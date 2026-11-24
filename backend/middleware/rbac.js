'use strict';

/**
 * Role-Based Access Control (RBAC) Matrix for Workspaces
 */

const ROLE_PERMISSIONS = {
  owner: [
    'workspace:delete',
    'workspace:transfer',
    'workspace:billing',
    'workspace:update',
    'workspace:read',
    'member:manage',
    'member:read',
    'content:write',
    'content:read',
    'domains:manage',
    'integrations:manage',
    'keys:manage',
    'audit:read',
    'client:manage'
  ],
  admin: [
    'workspace:update',
    'workspace:read',
    'member:manage',
    'member:read',
    'content:write',
    'content:read',
    'domains:manage',
    'integrations:manage',
    'keys:manage',
    'audit:read',
    'client:manage'
  ],
  editor: [
    'workspace:read',
    'content:write',
    'content:read'
  ],
  viewer: [
    'workspace:read',
    'content:read'
  ]
};

function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    // Platform superadmin bypass
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
      return next();
    }

    if (!req.membership || !req.membership.role) {
      return res.status(403).json({
        ok: false,
        error: 'Active workspace membership required.',
        code: 'MEMBERSHIP_REQUIRED'
      });
    }

    if (req.membership.status === 'suspended') {
      return res.status(403).json({
        ok: false,
        error: 'Your workspace membership has been suspended.',
        code: 'MEMBERSHIP_SUSPENDED'
      });
    }

    if (!roles.includes(req.membership.role)) {
      return res.status(403).json({
        ok: false,
        error: `Action requires one of the following roles: ${roles.join(', ')}. Current role: ${req.membership.role}.`,
        code: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    // Platform superadmin bypass
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
      return next();
    }

    if (!req.membership || !req.membership.role) {
      return res.status(403).json({
        ok: false,
        error: 'Active workspace membership required.',
        code: 'MEMBERSHIP_REQUIRED'
      });
    }

    if (req.membership.status === 'suspended') {
      return res.status(403).json({
        ok: false,
        error: 'Your workspace membership has been suspended.',
        code: 'MEMBERSHIP_SUSPENDED'
      });
    }

    if (!hasPermission(req.membership.role, permission)) {
      return res.status(403).json({
        ok: false,
        error: `Insufficient permissions. Operation requires '${permission}'.`,
        code: 'FORBIDDEN_PERMISSION'
      });
    }

    next();
  };
}

module.exports = {
  ROLE_PERMISSIONS,
  hasPermission,
  requireRole,
  requirePermission
};
