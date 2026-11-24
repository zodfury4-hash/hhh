const express = require('express');
const router = express.Router();
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const ApiToken = require('../models/ApiToken');
const { createMcpServer } = require('../mcp/server');
const { TOOL_DEFINITIONS } = require('../mcp/tools');

// Active SSE Transports Map: sessionId -> { transport, server, userEmail, token }
const activeSessions = new Map();

// Helper to extract raw token from Authorization header or query param
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.query && req.query.token) {
    return String(req.query.token).trim();
  }
  return null;
}

// GET /mcp/status - Public health/metadata check
router.get('/mcp/status', (req, res) => {
  return res.json({
    status: 'online',
    server: 'hea-link-mcp',
    version: '2.5.0',
    transports: ['sse', 'stdio'],
    endpoint: '/mcp/sse',
    toolsCount: TOOL_DEFINITIONS.length
  });
});

// GET /mcp/tools - Public tool definitions list with input schemas
router.get('/mcp/tools', (req, res) => {
  return res.json({
    tools: TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      requiredScope: t.requiredScope
    }))
  });
});

// GET /mcp/sse - Establish remote SSE MCP transport
router.get('/mcp/sse', async (req, res) => {
  try {
    const rawToken = extractToken(req);
    if (!rawToken) {
      return res.status(401).json({
        error: 'Unauthorized: Personal Access Token required (Authorization: Bearer hea_pat_... or ?token=hea_pat_...)'
      });
    }

    const tokenRecord = await ApiToken.verifyToken(rawToken);
    if (!tokenRecord) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid, expired, or revoked Personal Access Token'
      });
    }

    const clientInfo = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'MCP-Client'
    };

    const transport = new SSEServerTransport('/mcp/messages', res);
    const mcpServer = createMcpServer({
      user: { email: tokenRecord.userEmail },
      token: tokenRecord,
      clientInfo
    });

    await mcpServer.connect(transport);

    const sessionId = transport.sessionId;
    activeSessions.set(sessionId, {
      transport,
      server: mcpServer,
      userEmail: tokenRecord.userEmail,
      token: tokenRecord
    });

    transport.onclose = () => {
      activeSessions.delete(sessionId);
    };

    res.on('close', () => {
      activeSessions.delete(sessionId);
    });
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: `MCP SSE initialization failed: ${err.message}` });
    }
  }
});

// POST /mcp/messages - Dispatch JSON-RPC message to established SSE transport
router.post('/mcp/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId || !activeSessions.has(sessionId)) {
      return res.status(404).json({ error: 'MCP session not found or connection terminated' });
    }

    const session = activeSessions.get(sessionId);
    await session.transport.handlePostMessage(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: `Error processing MCP message: ${err.message}` });
    }
  }
});

module.exports = router;
