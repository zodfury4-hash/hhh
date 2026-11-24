const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');
const { executeTool } = require('./tools');

function createMcpServer({ user, token, clientInfo = {} }) {
  const server = new McpServer({
    name: 'hea-link-mcp',
    version: '2.5.0'
  });

  // 1. hea_list_links
  server.tool(
    'hea_list_links',
    "List the authenticated user's short links with pagination and optional tag filtering.",
    {
      limit: z.number().optional().describe('Maximum links to return (1-200, default 50)'),
      offset: z.number().optional().describe('Number of links to skip (default 0)'),
      tag: z.string().optional().describe('Optional tag filter')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_list_links',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 2. hea_get_link
  server.tool(
    'hea_get_link',
    'Get details, destination URL, tags, and click counts for a specific short link by slug.',
    {
      slug: z.string().describe('Short link slug/back-half')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_get_link',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 3. hea_create_link
  server.tool(
    'hea_create_link',
    'Create a new branded short link with optional custom slug, tags, password, or expiration.',
    {
      dest: z.string().describe('Destination URL (must be valid HTTP/HTTPS)'),
      slug: z.string().optional().describe('Optional custom slug (auto-generated if omitted)'),
      title: z.string().optional().describe('Descriptive title for dashboard'),
      tag: z.string().optional().describe('Categorization tag'),
      password: z.string().optional().describe('Optional passcode required for visitors to redirect'),
      expiresAt: z.string().optional().describe('Optional ISO timestamp when link ceases redirection')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_create_link',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 4. hea_update_link
  server.tool(
    'hea_update_link',
    'Update the destination URL, title, tags, password protection, or expiration of an existing link.',
    {
      slug: z.string().describe('Slug of the link to update'),
      dest: z.string().optional().describe('New destination URL'),
      title: z.string().optional().describe('New descriptive title'),
      tag: z.string().optional().describe('New tag'),
      password: z.string().optional().describe('New passcode (set empty string to remove)'),
      expiresAt: z.string().optional().describe('New ISO expiration date')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_update_link',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 5. hea_delete_link
  server.tool(
    'hea_delete_link',
    'Delete a short link owned by the authenticated user.',
    {
      slug: z.string().describe('Slug of the link to delete')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_delete_link',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 6. hea_get_analytics
  server.tool(
    'hea_get_analytics',
    'Retrieve real-world click counts, visitor telemetry, top countries, and referrers for user links.',
    {
      range: z.enum(['24h', '7d', '30d', '90d']).optional().describe('Time range (default 7d)'),
      slug: z.string().optional().describe('Optional specific slug to filter analytics')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_get_analytics',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 7. hea_generate_slugs
  server.tool(
    'hea_generate_slugs',
    'Use AI to generate memorable, highly available short link slug candidates for a destination URL.',
    {
      url: z.string().describe('Destination URL to analyze'),
      tone: z.enum(['brand', 'creative', 'short', 'seo']).optional().describe('Style tone'),
      count: z.number().optional().describe('Number of candidates (1-10, default 5)')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_generate_slugs',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  // 8. hea_create_qr
  server.tool(
    'hea_create_qr',
    'Generate high-resolution QR code URLs and vector payloads for an existing short link.',
    {
      slug: z.string().describe('Slug of the short link'),
      size: z.number().optional().describe('Pixel size of the PNG QR code (default 256)')
    },
    async (params) => {
      try {
        const result = await executeTool({
          toolName: 'hea_create_qr',
          params,
          user,
          token,
          clientInfo
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error: ${err.message}` }]
        };
      }
    }
  );

  return server;
}

module.exports = {
  createMcpServer
};
