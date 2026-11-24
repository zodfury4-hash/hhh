const crypto = require('crypto');
const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { performance } = require('perf_hooks');

const Integration = require('../models/Integration');
const WebhookDelivery = require('../models/WebhookDelivery');
const logger = require('../utils/logger');

/**
 * Check if an IP address belongs to private, loopback, or cloud metadata ranges
 */
function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const ipType = net.isIP(ip);
  if (!ipType) return true;

  if (ipType === 4) {
    const parts = ip.split('.').map(Number);
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata: 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0
    if (parts[0] === 0) return true;
    return false;
  }

  if (ipType === 6) {
    const clean = ip.toLowerCase();
    // ::1 (Loopback)
    if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true;
    // Unique Local (fc00::/7)
    if (clean.startsWith('fc') || clean.startsWith('fd')) return true;
    // Link Local (fe80::/10)
    if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (clean.startsWith('::ffff:')) {
      const v4 = clean.replace('::ffff:', '');
      return isPrivateOrReservedIp(v4);
    }
    return false;
  }

  return true;
}

/**
 * Validate destination URL against SSRF attacks by resolving DNS
 */
async function validateUrlForSsrf(targetUrl) {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS webhook URLs are supported.');
  }

  // Bypass DNS check for test hosts (e.g. 127.0.0.1) in test/dev mode ONLY when explicitly flagged
  if (process.env.ALLOW_LOCAL_WEBHOOKS === 'true' || process.env.NODE_ENV === 'test') {
    return { hostname: parsed.hostname, ip: '127.0.0.1' };
  }

  // Resolve hostname to IP addresses
  try {
    const addresses = await dns.promises.lookup(parsed.hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr.address)) {
        throw new Error(`SSRF Blocked: Destination IP '${addr.address}' resolves to a restricted/private network.`);
      }
    }
    return { hostname: parsed.hostname, ip: addresses[0].address };
  } catch (dnsErr) {
    if (dnsErr.message.includes('SSRF Blocked')) throw dnsErr;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid Webhook Host: Cannot resolve hostname '${parsed.hostname}'.`);
    }
    return { hostname: parsed.hostname, ip: '127.0.0.1' };
  }
}

/**
 * Format Slack Block Kit message payload
 */
function formatSlackPayload(event, data) {
  const title = event === 'link.created'
    ? '🔗 New Shortlink Created'
    : event === 'milestone.reached'
      ? '🚀 Campaign Click Milestone Achieved'
      : `HEA Link Notification: ${event}`;

  const destUrl = data.dest || 'https://hea.link';
  const shortUrl = data.shortUrl || `https://hea.link/${data.slug || ''}`;
  const clicks = data.totalClicks || data.clicks || 0;

  return {
    text: `${title}: ${shortUrl}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Short URL:*\n<${shortUrl}|${shortUrl}>`
          },
          {
            type: 'mrkdwn',
            text: `*Destination:*\n${destUrl}`
          }
        ]
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Clicks:*\n${clicks}`
          },
          {
            type: 'mrkdwn',
            text: `*Created:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Analytics ↗',
              emoji: true
            },
            url: shortUrl + '+',
            style: 'primary'
          }
        ]
      }
    ]
  };
}

/**
 * Format Discord Rich Embed payload
 */
function formatDiscordPayload(event, data) {
  const shortUrl = data.shortUrl || `https://hea.link/${data.slug || ''}`;
  const destUrl = data.dest || 'https://hea.link';
  const clicks = data.totalClicks || data.clicks || 0;

  return {
    content: null,
    embeds: [
      {
        title: event === 'link.created' ? '🔗 Short Link Created' : `HEA Link Event: ${event}`,
        description: `Your shortened URL is now live and tracking visitors.`,
        url: shortUrl,
        color: 0x0070F3,
        fields: [
          {
            name: 'Short Link',
            value: `[${shortUrl}](${shortUrl})`,
            inline: true
          },
          {
            name: 'Total Clicks',
            value: `${clicks}`,
            inline: true
          },
          {
            name: 'Destination URL',
            value: `\`${destUrl}\``,
            inline: false
          }
        ],
        footer: {
          text: 'HEA Link Telemetry & Webhooks'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Dispatch an HTTP request with HMAC-SHA256 signature
 */
function sendRawWebhook({ targetUrl, payload, secret, event, deliveryId }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Compute HMAC signature
    const hmacSecret = secret || 'hea-webhook-default-secret';
    const signature = crypto.createHmac('sha256', hmacSecret).update(bodyString).digest('hex');
    const timestamp = Date.now().toString();

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyString),
      'User-Agent': 'HEA-Link-Webhooks/1.0 (+https://hea.link)',
      'X-HEA-Event': event,
      'X-HEA-Delivery': deliveryId,
      'X-HEA-Timestamp': timestamp,
      'X-HEA-Signature': `sha256=${signature}`
    };

    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(parsed, { method: 'POST', headers, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Webhook request timed out after 8000ms'));
    });

    req.on('error', reject);
    req.write(bodyString);
    req.end();
  });
}

/**
 * Event Bus & Dispatcher
 */
const eventsService = {
  /**
   * Emit an event for a user's integrations
   */
  async emit(event, data, userEmail) {
    if (!userEmail) return;

    try {
      const allIntegrations = await Integration.findByUser(userEmail);
      const active = allIntegrations.filter(
        (i) => i.isActive && (i.events.includes(event) || i.events.includes('*'))
      );

      if (active.length === 0) return;

      // Dispatch asynchronously without blocking caller
      setImmediate(async () => {
        for (const integ of active) {
          try {
            await this.dispatchToIntegration(integ.integrationId, event, data, userEmail);
          } catch (err) {
            logger.warn(`⚠️ Webhook delivery failed for integration ${integ.integrationId}: ${err.message}`);
          }
        }
      });
    } catch (err) {
      logger.error(`Error querying integrations for event '${event}': ${err.message}`);
    }
  },

  /**
   * Deliver event to a specific integration
   */
  async dispatchToIntegration(integrationId, event, data, userEmail) {
    const rawDoc = await Integration.findById(integrationId, userEmail);
    if (!rawDoc || !rawDoc.isActive) {
      throw new Error('Integration not found or inactive');
    }

    const cfg = await Integration.getDecryptedConfig(rawDoc);
    const targetUrl = cfg.url;
    if (!targetUrl) {
      throw new Error('Integration has no configured target URL');
    }

    // SSRF Check
    await validateUrlForSsrf(targetUrl);

    let outboundPayload = null;
    if (rawDoc.provider === 'slack') {
      outboundPayload = formatSlackPayload(event, data);
    } else if (rawDoc.provider === 'discord') {
      outboundPayload = formatDiscordPayload(event, data);
    } else {
      // Standard outbound webhook format
      outboundPayload = {
        event,
        id: `evt_${crypto.randomBytes(12).toString('hex')}`,
        createdAt: new Date().toISOString(),
        data
      };
    }

    const deliveryId = `del_${crypto.randomBytes(10).toString('hex')}`;
    const startTime = performance.now();

    let statusCode = null;
    let status = 'delivered';
    let errorMsg = null;

    try {
      const res = await sendRawWebhook({
        targetUrl,
        payload: outboundPayload,
        secret: cfg.secret,
        event,
        deliveryId
      });
      statusCode = res.statusCode;
      if (statusCode >= 400) {
        status = 'failed';
        errorMsg = `HTTP ${statusCode}`;
      }
    } catch (err) {
      status = 'failed';
      errorMsg = err.message;
    }

    const latencyMs = performance.now() - startTime;

    // Record delivery log
    await WebhookDelivery.recordDelivery({
      integrationId,
      userEmail,
      event,
      targetUrl,
      payload: outboundPayload,
      statusCode,
      latencyMs,
      status,
      attempt: 1,
      error: errorMsg
    });

    // Update integration lastTriggeredAt
    rawDoc.lastTriggeredAt = new Date();
    if (status === 'failed') {
      rawDoc.failureCount = (rawDoc.failureCount || 0) + 1;
    } else {
      rawDoc.failureCount = 0;
    }

    return {
      deliveryId,
      status,
      statusCode,
      latencyMs: Math.round(latencyMs),
      error: errorMsg
    };
  }
};

module.exports = {
  eventsService,
  validateUrlForSsrf,
  isPrivateOrReservedIp,
  formatSlackPayload,
  formatDiscordPayload,
  sendRawWebhook
};
