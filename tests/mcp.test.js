const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const ApiToken = require('../backend/models/ApiToken');
const McpAuditLog = require('../backend/models/McpAuditLog');
const { executeTool } = require('../backend/mcp/tools');
const memStore = require('../backend/utils/memStore');

let server = null;
let baseUrl = '';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function pass(name) {
  console.log(`  ✅ PASS: ${name}`);
}

function fail(name, err) {
  console.error(`  ❌ FAIL: ${name}`, err);
  process.exit(1);
}

function makeToken(email, role = 'user') {
  return jwt.sign({ email, role, id: 'u_' + Date.now() }, config.jwtSecret, { expiresIn: '1h' });
}

async function run() {
  console.log('\n⚙️ Starting Model Context Protocol (MCP) Server Test Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    const user1Email = 'mcp_owner_1@example.com';
    const user2Email = 'mcp_other_2@example.com';
    const user1Jwt = makeToken(user1Email);

    // 1. GET /ai/mcp Dedicated Studio Page
    try {
      const res = await request('/ai/mcp');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('HEA Link MCP Server'));
      assert.ok(res.body.includes('claude_desktop_config.json'));
      pass('GET /ai/mcp returns 200 with dedicated MCP configuration studio');
    } catch (err) {
      fail('GET /ai/mcp returns 200 with dedicated MCP configuration studio', err);
    }

    // 2. GET /mcp/status & GET /mcp/tools
    try {
      const resStatus = await request('/mcp/status');
      assert.strictEqual(resStatus.status, 200);
      assert.strictEqual(resStatus.json.status, 'online');
      assert.strictEqual(resStatus.json.server, 'hea-link-mcp');

      const resTools = await request('/mcp/tools');
      assert.strictEqual(resTools.status, 200);
      assert.ok(Array.isArray(resTools.json.tools));
      assert.strictEqual(resTools.json.tools.length, 8);
      pass('Public metadata endpoints /mcp/status and /mcp/tools report online server and 8 tools');
    } catch (err) {
      fail('Public metadata endpoints /mcp/status and /mcp/tools report online server and 8 tools', err);
    }

    // 3. Personal Access Token (PAT) Generation & Verification Lifecycle
    let testPat = null;
    try {
      const generated = await ApiToken.generateToken({
        userEmail: user1Email,
        name: 'Test Claude Token',
        scopes: ['links:read', 'links:write']
      });
      testPat = generated.rawToken;
      assert.ok(testPat.startsWith('hea_pat_'));

      const verified = await ApiToken.verifyToken(testPat);
      assert.ok(verified);
      assert.strictEqual(verified.userEmail, user1Email);
      assert.deepStrictEqual(verified.scopes, ['links:read', 'links:write']);

      pass('Personal Access Token (hea_pat_...) generation and SHA-256 hash verification succeed');
    } catch (err) {
      fail('Personal Access Token (hea_pat_...) generation and SHA-256 hash verification succeed', err);
    }

    // 4. REST PAT Management APIs (/api/tokens)
    let apiPatTokenId = null;
    try {
      const resCreate = await request('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + user1Jwt
        },
        body: {
          name: 'Cursor Desktop Token',
          scopes: ['links:read', 'analytics:read']
        }
      });
      assert.strictEqual(resCreate.status, 201);
      assert.ok(resCreate.json.rawToken.startsWith('hea_pat_'));
      apiPatTokenId = resCreate.json.token.tokenId;

      const resList = await request('/api/tokens', {
        headers: {
          'Authorization': 'Bearer ' + user1Jwt
        }
      });
      assert.strictEqual(resList.status, 200);
      assert.ok(Array.isArray(resList.json.tokens));
      assert.ok(resList.json.tokens.some((t) => t.tokenId === apiPatTokenId));

      const resDelete = await request('/api/tokens/' + apiPatTokenId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + user1Jwt
        }
      });
      assert.strictEqual(resDelete.status, 200);
      assert.strictEqual(resDelete.json.success, true);

      pass('REST token management (/api/tokens POST, GET, DELETE) operates securely with JWT auth');
    } catch (err) {
      fail('REST token management (/api/tokens POST, GET, DELETE) operates securely with JWT auth', err);
    }

    // 5. MCP Remote SSE Endpoint Authentication Handshake
    try {
      // Unauthenticated
      const resNoAuth = await request('/mcp/sse');
      assert.strictEqual(resNoAuth.status, 401);

      // Invalid token
      const resBadAuth = await request('/mcp/sse', {
        headers: { 'Authorization': 'Bearer hea_pat_invalid_fake_token_12345' }
      });
      assert.strictEqual(resBadAuth.status, 401);

      // Valid token connects to SSE stream
      const sseReq = http.request(new URL('/mcp/sse', baseUrl), {
        headers: { 'Authorization': 'Bearer ' + testPat }
      });

      const sseConnected = await new Promise((resolve, reject) => {
        sseReq.on('response', (res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.ok(res.headers['content-type'].includes('text/event-stream'));
          res.destroy();
          resolve(true);
        });
        sseReq.on('error', reject);
        sseReq.end();
      });

      assert.strictEqual(sseConnected, true);
      pass('Remote SSE transport (/mcp/sse) rejects unauthenticated calls and opens SSE with valid PAT');
    } catch (err) {
      fail('Remote SSE transport (/mcp/sse) rejects unauthenticated calls and opens SSE with valid PAT', err);
    }

    // 6. MCP Tool Execution: Tenant Isolation & Scope Enforcement
    try {
      // Execute hea_create_link
      const linkRes = await executeTool({
        toolName: 'hea_create_link',
        params: {
          dest: 'https://developer.mozilla.org',
          slug: 'mcp-test-link-' + Date.now(),
          title: 'MDN Web Docs',
          password: 'securePassword123'
        },
        user: { email: user1Email },
        token: { tokenId: 'tok_test', scopes: ['links:read', 'links:write'] }
      });
      assert.strictEqual(linkRes.success, true);
      assert.ok(linkRes.shortUrl);

      // Execute hea_list_links
      const listRes = await executeTool({
        toolName: 'hea_list_links',
        params: { limit: 10 },
        user: { email: user1Email },
        token: { tokenId: 'tok_test', scopes: ['links:read'] }
      });
      assert.ok(Array.isArray(listRes.links));
      assert.ok(listRes.links.some((l) => l.slug === linkRes.slug));

      // Attempt to access user1 link as user2 (must reject)
      let leaked = false;
      try {
        await executeTool({
          toolName: 'hea_get_link',
          params: { slug: linkRes.slug },
          user: { email: user2Email },
          token: { tokenId: 'tok_user2', scopes: ['links:read'] }
        });
        leaked = true;
      } catch (e) {
        assert.ok(e.message.includes('not found'));
      }
      assert.strictEqual(leaked, false);

      // Attempt to execute write tool with read-only scope (must reject)
      let scopeBypassed = false;
      try {
        await executeTool({
          toolName: 'hea_delete_link',
          params: { slug: linkRes.slug },
          user: { email: user1Email },
          token: { tokenId: 'tok_read_only', scopes: ['links:read'] }
        });
        scopeBypassed = true;
      } catch (e) {
        assert.ok(e.message.includes('Forbidden: Token lacks required scope'));
      }
      assert.strictEqual(scopeBypassed, false);

      pass('MCP tool execution strictly enforces tenant isolation and PAT scope restrictions');
    } catch (err) {
      fail('MCP tool execution strictly enforces tenant isolation and PAT scope restrictions', err);
    }

    // 7. Security Audit Logging with Sensitive Parameter Scrubbing
    try {
      assert.ok(McpAuditLog && McpAuditLog.schema);
      const logs = memStore.mcpAuditLogs || [];
      const createLog = logs.find((l) => l.toolName === 'hea_create_link');
      assert.ok(createLog);
      assert.strictEqual(createLog.params.password, '[REDACTED]');
      pass('MCP audit logging captures tool executions and scrubs sensitive credentials');
    } catch (err) {
      fail('MCP audit logging captures tool executions and scrubs sensitive credentials', err);
    }

    console.log('\n🎉 ALL 7 Model Context Protocol (MCP) tests passed!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

run();
