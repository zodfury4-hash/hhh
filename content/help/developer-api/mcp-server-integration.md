---
title: Using the HEA Link Model Context Protocol (MCP) Server
category: developer-api
summary: Integrate HEA Link capabilities directly into Claude Desktop, Cursor, and modern AI development environments.
updated: 2026-11-20
keywords: mcp server, model context protocol, claude desktop, cursor, ai tools
order: 4
---

# Using the HEA Link Model Context Protocol (MCP) Server

HEA Link provides an official Model Context Protocol (MCP) server, allowing AI coding assistants to shorten URLs, generate vector QR codes, inspect link telemetry, and configure domains directly from natural language prompts.

## Quickstart Configuration

1. Generate a Personal Access Token (PAT) with `mcp:full` scope at `/ai/mcp`.
2. Add HEA Link to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "hea-link": {
      "command": "node",
      "args": ["bin/mcp-server.js"],
      "env": {
        "HEA_API_KEY": "hea_pat_your_token_here",
        "HEA_BASE_URL": "https://healink.store"
      }
    }
  }
}
```

## Available MCP Tools
- `create_link`: Shorten a URL with optional custom back-half, password, or expiration.
- `get_link`: Look up destination details and lifetime click metrics.
- `generate_qr`: Generate a vector SVG or raster PNG QR code.
- `list_domains`: Check status and DNS verification records for branded domains.
- `get_analytics_summary`: Retrieve click metrics aggregated across your account.
