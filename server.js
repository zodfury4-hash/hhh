/**
 * HEA Link Server Entrypoint
 * Delegates execution to the modular backend in ./backend/server.js
 * Compatible with Vercel (@vercel/node), PM2, Docker, and standard Node.js runtime.
 */
module.exports = require('./backend/server.js');
