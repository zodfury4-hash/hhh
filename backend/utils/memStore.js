// In-memory fallback datastore for resilient hybrid operation
const memStore = {
  users: [],
  links: [],
  qrs: [],
  bios: [],
  domains: []
};

module.exports = memStore;
