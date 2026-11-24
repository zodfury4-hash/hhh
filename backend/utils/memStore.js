// In-memory fallback datastore for resilient hybrid operation
const memStore = {
  users: [],
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
