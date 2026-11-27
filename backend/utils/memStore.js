// In-memory fallback datastore for resilient hybrid operation
const bcrypt = require('bcryptjs');

const defaultHashedPassword = bcrypt.hashSync('Password123!', 10);

const memStore = {
  users: [
    {
      id: 'u_demo_1',
      _id: 'u_demo_1',
      name: 'Demo Admin',
      email: 'demo@healink.store',
      password: defaultHashedPassword,
      isVerified: true,
      tokenVersion: 0,
      role: 'admin',
      plan: 'Unlimited',
      isAdmin: true,
      createdAt: new Date()
    }
  ],
  links: [],
  qrs: [],
  bios: [],
  domains: [],
  clicks: [],
  notifications: [],
  workspaces: [],
  memberships: [],
  invites: [],
  auditLogs: []
};

module.exports = memStore;
