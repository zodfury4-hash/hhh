/**
 * HEA Link Integrations Catalog
 * Single source of truth for honest integration availability.
 * Status: 'available' (working end-to-end today) or 'coming_soon' (waitlist enabled)
 */

const INTEGRATIONS_CATALOG = [
  // AVAILABLE NOW
  {
    id: 'webhooks',
    name: 'Outbound Webhooks',
    category: 'developer',
    status: 'available',
    icon: '⚡',
    shortDesc: 'Real-time HTTP POST event dispatch with HMAC-SHA256 signatures and automated retries.',
    description: 'Receive real-time payloads whenever a link is created, clicked, or updated. Features cryptographic signing (X-HEA-Signature), SSRF protection, customizable event subscriptions, and delivery attempt logging.',
    eventsSupported: ['link.created', 'link.clicked', 'link.deleted', 'qr.created', 'domain.verified'],
    authType: 'secret',
    docsUrl: '/developers#webhooks'
  },
  {
    id: 'slack',
    name: 'Slack Incoming Webhooks',
    category: 'productivity',
    status: 'available',
    icon: '💬',
    shortDesc: 'Automated Slack notifications for new shortlinks and high-traffic click spikes.',
    description: 'Post structured, rich block-kit cards to your team channels when new marketing links are generated or when campaign click milestones (+100, +1,000, +10,000) are achieved.',
    eventsSupported: ['link.created', 'milestone.reached'],
    authType: 'webhook_url',
    docsUrl: '/integrations#slack'
  },
  {
    id: 'discord',
    name: 'Discord Webhooks',
    category: 'marketing',
    status: 'available',
    icon: '🎮',
    shortDesc: 'Rich Discord embeds alerting your community or moderation team to link activity.',
    description: 'Connect Discord server channels via incoming webhook URLs. Automatically formats color-coded embed messages with destination previews, creator tags, and real-time visitor counts.',
    eventsSupported: ['link.created', 'milestone.reached'],
    authType: 'webhook_url',
    docsUrl: '/integrations#discord'
  },
  {
    id: 'utm_builder',
    name: 'Google Analytics & UTM Engine',
    category: 'analytics',
    status: 'available',
    icon: '📊',
    shortDesc: 'Standardized campaign attribution with automatic UTM parameter preservation.',
    description: 'Build, audit, and normalize UTM parameters across channels (Google, Meta, TikTok, Email). Destination queries are automatically preserved and merged into shortlink redirects without dropping tracking data.',
    eventsSupported: ['analytics.tracked'],
    authType: 'none',
    docsUrl: '/resources/utm-guide'
  },
  {
    id: 'data_export',
    name: 'Streamed CSV & JSON Export',
    category: 'developer',
    status: 'available',
    icon: '📥',
    shortDesc: 'High-throughput data export for external BI dashboards and data warehouses.',
    description: 'Stream all links, QR telemetry, and click log datasets directly into CSV or newline-delimited JSON for import into BigQuery, Snowflake, Excel, or Tableau.',
    eventsSupported: ['export.streamed'],
    authType: 'api_key',
    docsUrl: '/developers#export'
  },
  {
    id: 'bookmarklet',
    name: 'Browser Quick Shortener',
    category: 'productivity',
    status: 'available',
    icon: '🔖',
    shortDesc: 'One-click browser bookmarklet to shorten the active tab without switching context.',
    description: 'Drag our secure JavaScript bookmarklet to your browser bookmarks bar to instantly shorten and copy any active webpage link in 1-click.',
    eventsSupported: [],
    authType: 'none',
    docsUrl: '/integrations#bookmarklet'
  },
  {
    id: 'embeds',
    name: 'Embed Snippets & Bio Badges',
    category: 'marketing',
    status: 'available',
    icon: '🧩',
    shortDesc: 'Lightweight HTML iframe and script widgets for embedding link tools anywhere.',
    description: 'Drop responsive shortening bars, live click counters, or link-in-bio widgets into any HTML website, Notion doc, or Webflow landing page.',
    eventsSupported: [],
    authType: 'none',
    docsUrl: '/integrations#embeds'
  },

  // COMING SOON (HONEST WAITLIST)
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'automation',
    status: 'coming_soon',
    icon: '⚡',
    shortDesc: 'Trigger Zaps on new clicks and create branded shortlinks from 5,000+ app triggers.',
    description: 'Official Zapier integration currently undergoing partner review. Connect HEA Link triggers and actions to Google Sheets, Typeform, Airtable, and Mailchimp.',
    authType: 'oauth2'
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    category: 'automation',
    status: 'coming_soon',
    icon: '🟣',
    shortDesc: 'Visual automation scenarios with custom branches, routers, and data filters.',
    description: 'Build complex multi-step data pipelines connecting link analytics to CRM tools, Slack channels, and SQL databases.',
    authType: 'oauth2'
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'marketing',
    status: 'coming_soon',
    icon: '🧡',
    shortDesc: 'Sync link click attribution directly into HubSpot contact timelines and deals.',
    description: 'Map campaign shortlink clicks to specific HubSpot contact records and trigger automated workflows based on click behavior.',
    authType: 'oauth2'
  },
  {
    id: 'shopify',
    name: 'Shopify Storefront',
    category: 'ecommerce',
    status: 'coming_soon',
    icon: '🛍️',
    shortDesc: 'Auto-generate branded shortlinks and product QR codes for orders and marketing drops.',
    description: 'Automatically create trackable product links for SMS campaigns, influencer discounts, and physical packaging QR stickers.',
    authType: 'oauth2'
  },
  {
    id: 'notion',
    name: 'Notion Sync',
    category: 'productivity',
    status: 'coming_soon',
    icon: '📓',
    shortDesc: 'Auto-sync generated links and live visitor totals into a Notion database table.',
    description: 'Keep your marketing asset register in Notion updated in real-time with click totals and redirect targets.',
    authType: 'oauth2'
  },
  {
    id: 'wordpress',
    name: 'WordPress Plugin',
    category: 'marketing',
    status: 'coming_soon',
    icon: '🌐',
    shortDesc: 'Auto-shorten published blog post and WooCommerce URLs directly inside WordPress.',
    description: 'Generate branded short links and QR codes automatically on post publish with custom social share buttons.',
    authType: 'api_key'
  }
];

function getIntegration(id) {
  return INTEGRATIONS_CATALOG.find((item) => item.id === id) || null;
}

function getAvailableIntegrations() {
  return INTEGRATIONS_CATALOG.filter((item) => item.status === 'available');
}

function getComingSoonIntegrations() {
  return INTEGRATIONS_CATALOG.filter((item) => item.status === 'coming_soon');
}

module.exports = {
  INTEGRATIONS_CATALOG,
  getIntegration,
  getAvailableIntegrations,
  getComingSoonIntegrations
};
