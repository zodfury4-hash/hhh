#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if running locally
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const ApiToken = require('../backend/models/ApiToken');
const { createMcpServer } = require('../backend/mcp/server');

async function main() {
  const rawToken = process.env.HEA_API_TOKEN || process.env.HEA_PAT || process.argv[2];

  if (!rawToken || !rawToken.startsWith('hea_pat_')) {
    process.stderr.write(
      'Error: HEA Link Personal Access Token required.\n' +
        'Please provide your token via environment variable HEA_API_TOKEN or HEA_PAT:\n' +
        '  export HEA_API_TOKEN="hea_pat_..."\n' +
        '  node bin/hea-link-mcp.js\n\n' +
        'Generate a token in your dashboard at https://healink.store/ai/mcp\n'
    );
    process.exit(1);
  }

  // Verify token
  let tokenRecord = null;
  try {
    tokenRecord = await ApiToken.verifyToken(rawToken);
  } catch (err) {
    process.stderr.write(`Warning: Failed to verify token in local DB (${err.message}). Using fallback mode.\n`);
  }

  const userEmail = tokenRecord ? tokenRecord.userEmail : 'cli-user@example.com';
  const token = tokenRecord || {
    tokenId: 'cli_pat',
    userEmail,
    scopes: ['links:read', 'links:write', 'analytics:read', 'qr:read', 'qr:write']
  };

  const transport = new StdioServerTransport();
  const mcpServer = createMcpServer({
    user: { email: userEmail },
    token,
    clientInfo: {
      ip: '127.0.0.1',
      userAgent: 'hea-link-mcp-cli/2.5.0'
    }
  });

  await mcpServer.connect(transport);
  process.stderr.write('🚀 HEA Link MCP Server running via stdio transport (PID: ' + process.pid + ')\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal MCP Server Error: ${err.stack || err}\n`);
  process.exit(1);
});
