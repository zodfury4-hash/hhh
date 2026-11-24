const mongoose = require('mongoose');
const Link = require('../models/Link');
const Click = require('../models/Click');
const memStore = require('../utils/memStore');
const slugAiService = require('../services/slugAiService');
const slugGen = require('../utils/slugGenerator');
const McpAuditLog = require('../models/McpAuditLog');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const TOOL_DEFINITIONS = [
  {
    name: 'hea_list_links',
    description: "List the authenticated user's short links with pagination and optional tag filtering.",
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum links to return (1-200, default 50)' },
        offset: { type: 'number', description: 'Number of links to skip (default 0)' },
        tag: { type: 'string', description: 'Optional tag filter' }
      }
    },
    requiredScope: 'links:read'
  },
  {
    name: 'hea_get_link',
    description: 'Get details, destination URL, tags, and click counts for a specific short link by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Short link slug/back-half' }
      },
      required: ['slug']
    },
    requiredScope: 'links:read'
  },
  {
    name: 'hea_create_link',
    description: 'Create a new branded short link with optional custom slug, tags, password, or expiration.',
    inputSchema: {
      type: 'object',
      properties: {
        dest: { type: 'string', description: 'Destination URL (must be valid HTTP/HTTPS)' },
        slug: { type: 'string', description: 'Optional custom slug (auto-generated if omitted)' },
        title: { type: 'string', description: 'Descriptive title for dashboard' },
        tag: { type: 'string', description: 'Categorization tag' },
        password: { type: 'string', description: 'Optional passcode required for visitors to redirect' },
        expiresAt: { type: 'string', description: 'Optional ISO timestamp when link ceases redirection' }
      },
      required: ['dest']
    },
    requiredScope: 'links:write'
  },
  {
    name: 'hea_update_link',
    description: 'Update the destination URL, title, tags, password protection, or expiration of an existing link.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug of the link to update' },
        dest: { type: 'string', description: 'New destination URL' },
        title: { type: 'string', description: 'New descriptive title' },
        tag: { type: 'string', description: 'New tag' },
        password: { type: 'string', description: 'New passcode (set empty string to remove)' },
        expiresAt: { type: 'string', description: 'New ISO expiration date' }
      },
      required: ['slug']
    },
    requiredScope: 'links:write'
  },
  {
    name: 'hea_delete_link',
    description: 'Delete a short link owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug of the link to delete' }
      },
      required: ['slug']
    },
    requiredScope: 'links:write'
  },
  {
    name: 'hea_get_analytics',
    description: 'Retrieve real-world click counts, visitor telemetry, top countries, and referrers for all user links or a specific slug.',
    inputSchema: {
      type: 'object',
      properties: {
        range: { type: 'string', enum: ['24h', '7d', '30d', '90d'], description: 'Time range (default 7d)' },
        slug: { type: 'string', description: 'Optional specific slug to filter analytics' }
      }
    },
    requiredScope: 'analytics:read'
  },
  {
    name: 'hea_generate_slugs',
    description: 'Use AI to generate memorable, highly available short link slug candidates for a destination URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Destination URL to analyze' },
        tone: { type: 'string', enum: ['brand', 'creative', 'short', 'seo'], description: 'Style tone' },
        count: { type: 'number', description: 'Number of candidates (1-10, default 5)' }
      },
      required: ['url']
    },
    requiredScope: 'links:read'
  },
  {
    name: 'hea_create_qr',
    description: 'Generate high-resolution QR code URLs and vector payloads for an existing short link.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug of the short link' },
        size: { type: 'number', description: 'Pixel size of the PNG QR code (default 256)' }
      },
      required: ['slug']
    },
    requiredScope: 'links:read'
  }
];

async function executeTool({ toolName, params, user, token, clientInfo = {} }) {
  const startTime = Date.now();
  const userEmail = (user.email || user.userEmail || '').toLowerCase().trim();
  const tokenScopes = token && token.scopes ? token.scopes : ['links:read', 'links:write', 'analytics:read', 'qr:read', 'qr:write'];

  const toolDef = TOOL_DEFINITIONS.find((t) => t.name === toolName);
  if (!toolDef) {
    const err = new Error(`Unknown tool: ${toolName}`);
    await McpAuditLog.log({
      tokenId: token ? token.tokenId : null,
      userEmail,
      toolName,
      params,
      durationMs: Date.now() - startTime,
      success: false,
      error: err.message,
      ip: clientInfo.ip || '127.0.0.1',
      userAgent: clientInfo.userAgent || 'MCP-Client'
    });
    throw err;
  }

  // Enforce Scope Check
  if (toolDef.requiredScope && !tokenScopes.includes(toolDef.requiredScope) && !tokenScopes.includes('*')) {
    const err = new Error(`Forbidden: Token lacks required scope '${toolDef.requiredScope}'`);
    await McpAuditLog.log({
      tokenId: token ? token.tokenId : null,
      userEmail,
      toolName,
      params,
      durationMs: Date.now() - startTime,
      success: false,
      error: err.message,
      ip: clientInfo.ip || '127.0.0.1',
      userAgent: clientInfo.userAgent || 'MCP-Client'
    });
    throw err;
  }

  try {
    let result = null;

    switch (toolName) {
      case 'hea_list_links': {
        const limit = Math.min(Math.max(parseInt(params.limit, 10) || 50, 1), 200);
        const offset = Math.max(parseInt(params.offset, 10) || 0, 0);
        const query = { ownerEmail: userEmail, isActive: { $ne: false } };
        if (params.tag) query.tag = params.tag;

        let links = [];
        let total = 0;

        if (isDbConnected()) {
          [links, total] = await Promise.all([
            Link.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
            Link.countDocuments(query)
          ]);
        } else {
          const all = (memStore.links || []).filter((l) => (l.ownerEmail || '').toLowerCase() === userEmail && l.isActive !== false);
          const filtered = params.tag ? all.filter((l) => l.tag === params.tag) : all;
          total = filtered.length;
          links = filtered.slice(offset, offset + limit);
        }

        result = {
          total,
          limit,
          offset,
          links: links.map((l) => ({
            slug: l.slug,
            dest: l.dest,
            title: l.title || '',
            tag: l.tag || 'general',
            totalClicks: l.totalClicks || 0,
            shortUrl: `https://healink.store/${l.slug}`,
            hasPassword: !!l.password,
            expiresAt: l.expiresAt || null,
            createdAt: l.createdAt
          }))
        };
        break;
      }

      case 'hea_get_link': {
        const { slug } = params;
        if (!slug) throw new Error('slug parameter is required');

        let link = null;
        if (isDbConnected()) {
          link = await Link.findOne({ slug, ownerEmail: userEmail, isActive: { $ne: false } }).lean();
        } else {
          link = (memStore.links || []).find((l) => l.slug === slug && (l.ownerEmail || '').toLowerCase() === userEmail && l.isActive !== false);
        }

        if (!link) throw new Error(`Link not found with slug: ${slug}`);

        result = {
          slug: link.slug,
          dest: link.dest,
          title: link.title || '',
          tag: link.tag || 'general',
          totalClicks: link.totalClicks || 0,
          shortUrl: `https://healink.store/${link.slug}`,
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://healink.store/${link.slug}`,
          hasPassword: !!link.password,
          expiresAt: link.expiresAt || null,
          createdAt: link.createdAt
        };
        break;
      }

      case 'hea_create_link': {
        const { dest, title, tag, password, expiresAt } = params;
        if (!dest || !/^https?:\/\//i.test(dest)) {
          throw new Error('Valid destination URL (http/https) is required');
        }

        let slug = params.slug ? params.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') : '';
        if (slug) {
          const exists = isDbConnected()
            ? await Link.findOne({ slug })
            : (memStore.links || []).find((l) => l.slug === slug);
          if (exists) throw new Error(`Slug '${slug}' is already in use`);
        } else {
          slug = slugGen.generateRandomSlug(6);
        }

        const linkDoc = {
          slug,
          dest,
          title: title ? title.trim() : (slug ? `Link ${slug}` : 'Short Link'),
          tag: tag ? tag.trim() : 'general',
          ownerEmail: userEmail,
          password: password ? password.trim() : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          totalClicks: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        if (isDbConnected()) {
          await Link.create(linkDoc);
        } else {
          if (!Array.isArray(memStore.links)) memStore.links = [];
          memStore.links.push(linkDoc);
        }

        result = {
          success: true,
          shortUrl: `https://healink.store/${slug}`,
          slug,
          dest,
          title: linkDoc.title,
          tag: linkDoc.tag,
          createdAt: linkDoc.createdAt
        };
        break;
      }

      case 'hea_update_link': {
        const { slug, dest, title, tag, password, expiresAt } = params;
        if (!slug) throw new Error('slug is required');

        const updates = { updatedAt: new Date() };
        if (dest !== undefined) {
          if (!/^https?:\/\//i.test(dest)) throw new Error('Invalid destination URL');
          updates.dest = dest;
        }
        if (title !== undefined) updates.title = title;
        if (tag !== undefined) updates.tag = tag;
        if (password !== undefined) updates.password = password ? password.trim() : null;
        if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;

        let updated = null;
        if (isDbConnected()) {
          updated = await Link.findOneAndUpdate(
            { slug, ownerEmail: userEmail, isActive: { $ne: false } },
            { $set: updates },
            { new: true }
          ).lean();
        } else {
          const l = (memStore.links || []).find((item) => item.slug === slug && (item.ownerEmail || '').toLowerCase() === userEmail && item.isActive !== false);
          if (l) {
            Object.assign(l, updates);
            updated = l;
          }
        }

        if (!updated) throw new Error(`Link not found: ${slug}`);

        result = {
          success: true,
          message: 'Link updated successfully',
          link: {
            slug: updated.slug,
            dest: updated.dest,
            title: updated.title,
            tag: updated.tag,
            shortUrl: `https://healink.store/${updated.slug}`,
            hasPassword: !!updated.password,
            expiresAt: updated.expiresAt,
            updatedAt: updated.updatedAt
          }
        };
        break;
      }

      case 'hea_delete_link': {
        const { slug } = params;
        if (!slug) throw new Error('slug is required');

        let deleted = false;
        if (isDbConnected()) {
          const res = await Link.updateOne(
            { slug, ownerEmail: userEmail },
            { $set: { isActive: false, deletedAt: new Date() } }
          );
          deleted = res.modifiedCount > 0;
        } else {
          const l = (memStore.links || []).find((item) => item.slug === slug && (item.ownerEmail || '').toLowerCase() === userEmail);
          if (l) {
            l.isActive = false;
            deleted = true;
          }
        }

        if (!deleted) throw new Error(`Link not found or already deleted: ${slug}`);

        result = {
          success: true,
          message: `Link '${slug}' successfully deleted`
        };
        break;
      }

      case 'hea_get_analytics': {
        const range = params.range || '7d';
        const hours = range === '24h' ? 24 : range === '30d' ? 720 : range === '90d' ? 2160 : 168;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const filter = { ownerEmail: userEmail, createdAt: { $gte: since } };
        if (params.slug) filter.slug = params.slug;

        let totalClicks = 0;
        let uniqueVisitors = 0;
        let topCountries = [];
        let topReferrers = [];

        if (isDbConnected()) {
          const [totals, countries, referrers] = await Promise.all([
            Click.aggregate([
              { $match: filter },
              { $group: { _id: null, total: { $sum: 1 }, ips: { $addToSet: '$ipHash' } } }
            ]),
            Click.aggregate([
              { $match: filter },
              { $group: { _id: '$country', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ]),
            Click.aggregate([
              { $match: filter },
              { $group: { _id: '$referrer', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ])
          ]);

          if (totals.length > 0) {
            totalClicks = totals[0].total;
            uniqueVisitors = (totals[0].ips || []).length;
          }
          topCountries = countries.map((c) => ({ country: c._id || 'Unknown', clicks: c.count }));
          topReferrers = referrers.map((r) => ({ referrer: r._id || 'Direct', clicks: r.count }));
        } else {
          // Fallback in memory
          const clicks = (memStore.clicks || []).filter((c) => (c.ownerEmail || '').toLowerCase() === userEmail && new Date(c.createdAt) >= since);
          totalClicks = clicks.length;
          const ipSet = new Set(clicks.map((c) => c.ipHash));
          uniqueVisitors = ipSet.size;
        }

        result = {
          range,
          slug: params.slug || 'all',
          totalClicks,
          uniqueVisitors,
          topCountries,
          topReferrers
        };
        break;
      }

      case 'hea_generate_slugs': {
        const { url, tone = 'brand', count = 5 } = params;
        const candidates = await slugAiService.generateSlugs({ url, tone, count });
        result = {
          url,
          tone,
          candidates
        };
        break;
      }

      case 'hea_create_qr': {
        const { slug, size = 256 } = params;
        if (!slug) throw new Error('slug is required');
        const shortUrl = `https://healink.store/${slug}`;
        result = {
          slug,
          shortUrl,
          qrPngUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}`,
          qrSvgUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=svg&data=${encodeURIComponent(shortUrl)}`
        };
        break;
      }

      default:
        throw new Error(`Unhandled tool: ${toolName}`);
    }

    // Log success in MCP Audit
    await McpAuditLog.log({
      tokenId: token ? token.tokenId : null,
      userEmail,
      toolName,
      params,
      durationMs: Date.now() - startTime,
      success: true,
      error: null,
      ip: clientInfo.ip || '127.0.0.1',
      userAgent: clientInfo.userAgent || 'MCP-Client'
    });

    return result;
  } catch (err) {
    await McpAuditLog.log({
      tokenId: token ? token.tokenId : null,
      userEmail,
      toolName,
      params,
      durationMs: Date.now() - startTime,
      success: false,
      error: err.message,
      ip: clientInfo.ip || '127.0.0.1',
      userAgent: clientInfo.userAgent || 'MCP-Client'
    });
    throw err;
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool
};
