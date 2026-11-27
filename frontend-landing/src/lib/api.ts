export interface ShortenResult {
  success: boolean;
  shortUrl: string;
  slug: string;
  dest: string;
  error?: string;
}

const MAX_URL_LENGTH = 2048;

export function normalizeUrl(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw || raw.length > MAX_URL_LENGTH) return null;

  // Reject dangerous or non-HTTP(S) schemes before prepending https://
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && !/^https?:\/\//i.test(raw)) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
  if (candidate.length > MAX_URL_LENGTH) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export async function shortenUrl(rawUrl: string, customSlug?: string): Promise<ShortenResult> {
  const dest = normalizeUrl(rawUrl);
  if (!dest) {
    return {
      success: false,
      shortUrl: '',
      slug: '',
      dest: '',
      error: 'Please enter a valid http:// or https:// URL (max 2048 characters).',
    };
  }

  const payload: { url: string; slug?: string } = { url: dest };
  const cleanSlug = (customSlug || '').toLowerCase().trim();
  if (cleanSlug) {
    payload.slug = cleanSlug;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('/api/shorten-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let data: {
      success?: boolean;
      shortUrl?: string;
      localShort?: string;
      slug?: string;
      dest?: string;
      error?: string;
    } | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok || !data || !data.success || (!data.shortUrl && !data.localShort)) {
      let msg = data?.error || `Failed to shorten link (HTTP ${res.status})`;
      if (res.status === 409) {
        msg = data?.error || 'This custom back-half is already taken. Please choose another.';
      }
      return {
        success: false,
        shortUrl: '',
        slug: '',
        dest: '',
        error: msg,
      };
    }

    const slug = data.slug || cleanSlug || '';
    const shortUrl = data.localShort || data.shortUrl || '';
    return {
      success: true,
      shortUrl,
      slug,
      dest: data.dest || dest,
    };
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      success: false,
      shortUrl: '',
      slug: '',
      dest: '',
      error: isAbort
        ? 'Request timed out while contacting the server. Please try again.'
        : 'Unable to reach the server. Please check your connection and try again.',
    };
  }
}
