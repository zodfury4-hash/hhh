# HEA Link Model Context Protocol (MCP) Server Guide

## 1. Overview
The HEA Link MCP Server exposes native URL shortening, analytics querying, QR code generation, and semantic slug generation capabilities to external AI models and developer environments using Anthropic's official **Model Context Protocol (MCP)** specification.

Supported clients:
- **Claude Desktop** (macOS, Windows, Linux)
- **Cursor IDE**
- **Claude Code CLI** (`claude mcp add`)
- **Antigravity AI / Custom Agent Runtimes**

---

## 2. Supported Transports
HEA Link supports both official MCP transport mechanisms:

1. **Local Stdio Transport**:
   - Packaged as an executable binary in `bin/hea-link-mcp.js`.
   - Run via `npx -y hea-link-mcp` or `node bin/hea-link-mcp.js`.
   - Reads your Personal Access Token from `process.env.HEA_API_TOKEN` or `process.env.HEA_PAT`.

2. **Remote Streamable HTTP/SSE Transport**:
   - `GET /mcp/sse`: Establishes the real-time server-sent events connection.
   - `POST /mcp/messages?sessionId=<id>`: Receives incoming JSON-RPC requests from clients.
   - Authenticated via standard `Authorization: Bearer hea_pat_...` header or `?token=hea_pat_...` query parameter.

---

## 3. Client Configuration Quickstart

### Claude Desktop
Edit your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hea-link": {
      "command": "npx",
      "args": ["-y", "hea-link-mcp"],
      "env": {
        "HEA_API_TOKEN": "hea_pat_your_token_here"
      }
    }
  }
}
```

### Cursor IDE
1. Open Cursor Settings > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Choose **stdio** transport:
   - **Name**: `hea-link`
   - **Command**: `npx -y hea-link-mcp`
   - **Environment Variables**: `HEA_API_TOKEN=hea_pat_your_token_here`

### Claude Code CLI
Run the following command in your terminal:
```bash
export HEA_API_TOKEN="hea_pat_your_token_here"
claude mcp add healink -- npx -y hea-link-mcp
```

### Remote HTTP/SSE Client
Point your MCP SSE client to:
```
https://healink.store/mcp/sse
```
Header: `Authorization: Bearer hea_pat_your_token_here`

---

## 4. Personal Access Tokens (PAT)
- **Token Format**: `hea_pat_<48-character cryptographically secure hex>`
- **Storage**: Never stored in plaintext; stored as a salted SHA-256 hash in the database.
- **Generation & Revocation**: Generate and revoke tokens in the dedicated UI at `/ai/mcp` or via the REST API:
  - `POST /api/tokens`: `{ name: 'Cursor Mac', expiresInDays: 90 }`
  - `GET /api/tokens`: Lists caller's active tokens.
  - `DELETE /api/tokens/:id`: Instantly revokes token access.

### Supported Scopes
- `links:read`: View and inspect owned links.
- `links:write`: Create, modify, and delete short links.
- `analytics:read`: Query click telemetry and visitor attribution.
- `qr:read` / `qr:write`: Generate and retrieve QR code assets.
- `*`: Full administrative access.

---

## 5. Available Tools Reference

### `hea_list_links`
List short links owned by the caller.
- **Parameters**:
  - `limit` *(optional number)*: 1 to 200 (default: 50)
  - `offset` *(optional number)*: pagination offset
  - `tag` *(optional string)*: filter links by tag
- **Required Scope**: `links:read`

### `hea_get_link`
Retrieve full metadata and click counts for a single link.
- **Parameters**:
  - `slug` *(required string)*: Link slug
- **Required Scope**: `links:read`

### `hea_create_link`
Create a new branded short link.
- **Parameters**:
  - `dest` *(required string)*: Destination URL (http/https)
  - `slug` *(optional string)*: Custom back-half
  - `title` *(optional string)*: Friendly dashboard label
  - `tag` *(optional string)*: Category tag
  - `password` *(optional string)*: Passcode protection
  - `expiresAt` *(optional string ISO)*: Link expiration
- **Required Scope**: `links:write`

### `hea_update_link`
Update parameters of an existing short link.
- **Parameters**:
  - `slug` *(required string)*: Target link slug
  - `dest`, `title`, `tag`, `password`, `expiresAt` *(optional)*
- **Required Scope**: `links:write`

### `hea_delete_link`
Delete an owned link.
- **Parameters**:
  - `slug` *(required string)*: Target link slug
- **Required Scope**: `links:write`

### `hea_get_analytics`
Query real click telemetry, unique visitors, top countries, and referrers.
- **Parameters**:
  - `range` *(optional string)*: `'24h'`, `'7d'`, `'30d'`, or `'90d'`
  - `slug` *(optional string)*: Filter to a specific short link
- **Required Scope**: `analytics:read`

### `hea_generate_slugs`
Use semantic AI to analyze a destination page and return available slugs.
- **Parameters**:
  - `url` *(required string)*: Destination URL
  - `tone` *(optional string)*: `'brand'`, `'creative'`, `'short'`, `'seo'`
  - `count` *(optional number)*: Number of candidates (1-10)
- **Required Scope**: `links:read`

### `hea_create_qr`
Generate vector SVG and high-res PNG QR codes for a short link.
- **Parameters**:
  - `slug` *(required string)*: Link slug
  - `size` *(optional number)*: Pixel dimension (default 256)
- **Required Scope**: `links:read`

---

## 6. Security & Audit Logging
- **Strict Tenant Isolation**: All operations query against the token's bound `userEmail`. It is programmatically impossible for an MCP client to view or modify another user's links or analytics.
- **Zero Sensitive Data Logging**: Passwords, passcodes, and raw tokens are scrubbed (`[REDACTED]`) before writing to `McpAuditLog`.
- **DNS Rebinding & CORS Protection**: SSE connections validate host and origin headers against authorized domains.
