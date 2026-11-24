const dns = require('dns').promises;
const { isPrivateOrReservedHost } = require('../middleware/validation');

/**
 * Safely resolves domain name and ensures no resolved IP is private/loopback/cloud-metadata
 */
async function isSafePublicHost(hostname) {
  if (isPrivateOrReservedHost(hostname)) return false;

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateOrReservedHost(addr.address)) {
        return false;
      }
    }
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Safely fetch page metadata (title and description) server-side
 * Max 3 redirects, 3s timeout, 200 KB cap, text/html only
 */
async function fetchSafePageMetadata(initialUrl) {
  let currentUrl = initialUrl;
  const maxRedirects = 3;
  const timeoutMs = 3000;
  const maxBytes = 200 * 1024; // 200 KB

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const parsed = new URL(currentUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { title: null, description: null };
      }

      const isSafe = await isSafePublicHost(parsed.hostname);
      if (!isSafe) {
        return { title: null, description: null };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HEA-Link-Bot/2.0; +https://healink.store)',
            Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
          },
          redirect: 'manual',
          signal: controller.signal
        });

        clearTimeout(timer);

        // Handle redirects manually to re-verify host on each hop
        if ([301, 302, 303, 307, 308].includes(res.status)) {
          const loc = res.headers.get('location');
          if (!loc) return { title: null, description: null };
          currentUrl = new URL(loc, currentUrl).href;
          continue;
        }

        if (!res.ok) {
          return { title: null, description: null };
        }

        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('text/html')) {
          return { title: null, description: null };
        }

        // Read up to 200 KB of body
        const reader = res.body.getReader();
        const chunks = [];
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalBytes += value.length;
          if (totalBytes >= maxBytes) {
            reader.cancel();
            break;
          }
        }

        const buffer = Buffer.concat(chunks);
        const html = buffer.toString('utf-8', 0, Math.min(buffer.length, maxBytes));

        // Extract title
        let title = null;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim().replace(/\s+/g, ' ').slice(0, 150);
        }

        // Extract description
        let description = null;
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (metaDescMatch && metaDescMatch[1]) {
          description = metaDescMatch[1].trim().replace(/\s+/g, ' ').slice(0, 250);
        }

        return { title, description };
      } catch (_fetchErr) {
        clearTimeout(timer);
        return { title: null, description: null };
      }
    }
  } catch (_err) {
    return { title: null, description: null };
  }

  return { title: null, description: null };
}

module.exports = {
  isSafePublicHost,
  fetchSafePageMetadata
};
