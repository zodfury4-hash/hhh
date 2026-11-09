export interface ShortenResult {
  success: boolean;
  shortUrl: string;
  slug: string;
  dest: string;
  error?: string;
}

export function normalizeUrl(input: string): string | null {
  let u = (input || '').trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function generateSlug(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function shortenUrl(rawUrl: string, customSlug?: string): Promise<ShortenResult> {
  const dest = normalizeUrl(rawUrl);
  if (!dest) {
    return {
      success: false,
      shortUrl: '',
      slug: '',
      dest: '',
      error: 'Please enter a valid URL (e.g. https://yourwebsite.com)',
    };
  }

  const slug = (customSlug || generateSlug()).toLowerCase().trim();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://healink.store';
  const defaultShort = `${origin}/${slug}`;

  let finalShortUrl = defaultShort;

  // 1. Try real Express backend endpoint /api/shorten-online
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('/api/shorten-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: dest, slug }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl) {
        finalShortUrl = data.shortUrl;
      }
    }
  } catch (err) {
    console.info('[HEA Link API] Backend offline or unreachable, using local routing mode:', err);
  }

  // 2. Persist to localStorage for client-side routing & existing app.js sync
  if (typeof window !== 'undefined') {
    try {
      // Sync hea_slug_<slug>
      localStorage.setItem(`hea_slug_${slug}`, dest);

      // Sync hea_slug_map
      const mapStr = localStorage.getItem('hea_slug_map');
      const map = mapStr ? JSON.parse(mapStr) : {};
      map[slug] = dest;
      localStorage.setItem('hea_slug_map', JSON.stringify(map));

      // Sync hea_links
      const linksStr = localStorage.getItem('hea_links');
      const links = linksStr ? JSON.parse(linksStr) : [];
      const newEntry = {
        id: 'lnk_' + Date.now().toString(36),
        slug,
        url: finalShortUrl,
        dest,
        title: 'Shortened Link',
        tag: 'General',
        createdAt: new Date().toISOString(),
      };
      links.unshift(newEntry);
      localStorage.setItem('hea_links', JSON.stringify(links));
    } catch (e) {
      console.warn('[HEA Link API] Storage write error:', e);
    }
  }

  return {
    success: true,
    shortUrl: finalShortUrl,
    slug,
    dest,
  };
}
