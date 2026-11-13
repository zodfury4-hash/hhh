const { z } = require('zod');

// Reserved words that cannot be used as custom shortlink slugs
const RESERVED_SLUGS = new Set([
  'api', 'login', 'signup', 'dashboard', 'app', 'auth', 'admin', 'billing',
  'webhook', 'stripe', 'assets', 'css', 'js', 'images', 'favicon.ico',
  'robots.txt', 'sitemap.xml', 'health', 'abuse', 'terms', 'privacy',
  'docs', 'm', 'r', 'go', 'bio', 'settings', 'index', 'home', 'verify',
  'reset', 'pricing', 'logout', 'help', 'contact', 'support', 'status'
]);

// Known abusive or phishing domains
const BLOCKED_DOMAINS = new Set([
  'grabify.link', 'iplogger.org', '2no.co', 'yip.su', 'iplis.ru', 'psh.re',
  'bit.do', 'shorte.st', 'adf.ly', 'bc.vc', 'linkshrink.net'
]);

function isPrivateOrReservedHost(hostname) {
  if (!hostname) return true;
  const clean = hostname.toLowerCase().trim();

  // Exact names
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1' || clean === '0.0.0.0') {
    return true;
  }
  if (clean.endsWith('.local') || clean.endsWith('.internal') || clean.endsWith('.localhost')) {
    return true;
  }

  // Check IPv4 ranges
  const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, a, b, c, d] = ipv4Match.map(Number);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;
    if (a === 127) return true; // Loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Cloud metadata API)
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 0) return true; // Current network
    if (a >= 224) return true; // Multicast & experimental
  }

  // Check IPv6 loopback / local prefixes
  if (clean.startsWith('fc') || clean.startsWith('fd') || clean.startsWith('fe80:')) {
    return true;
  }

  return false;
}

function isValidDestinationUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();

  // Strict check against dangerous URI schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (isPrivateOrReservedHost(host)) {
      return false;
    }
    if (BLOCKED_DOMAINS.has(host)) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Zod URL Validator
const destinationUrlSchema = z.string()
  .min(3, 'URL is too short')
  .max(2048, 'URL exceeds maximum length of 2048 characters')
  .refine(val => isValidDestinationUrl(val), {
    message: 'Invalid destination URL: Must start with http:// or https:// and cannot target private/loopback IP addresses or blocked domains'
  });

// Zod Slug Validator
const slugSchema = z.string()
  .min(2, 'Slug must be at least 2 characters')
  .max(60, 'Slug cannot exceed 60 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Slug may only contain letters, numbers, hyphens, and underscores')
  .refine(val => !RESERVED_SLUGS.has(val.toLowerCase()), {
    message: 'This slug is reserved by the system. Please choose a different back-half.'
  });

// Register validation
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name cannot exceed 60 characters').optional(),
  email: z.string().trim().email('Please enter a valid email address').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128)
});

// Login validation
const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

// Verify email OTP validation
const verifyEmailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  code: z.string().trim().min(4, 'Verification code must be at least 4 digits').max(10)
});

// Forgot password validation
const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address')
});

// Reset password validation
const resetPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  code: z.string().trim().min(4, 'Reset code is required').max(10),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(128)
});

// Create link validation
const createLinkSchema = z.object({
  dest: destinationUrlSchema,
  slug: slugSchema.optional(),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),
  tag: z.string().trim().max(50, 'Tag cannot exceed 50 characters').optional(),
  qr: z.boolean().optional(),
  password: z.string().trim().max(64).optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.union([z.number(), z.string()]).optional()
});

// Bulk shorten validation
const bulkShortenSchema = z.object({
  urls: z.array(destinationUrlSchema).min(1, 'At least one URL is required').max(50, 'Maximum 50 URLs allowed per bulk request')
});

// QR Code validation
const createQrSchema = z.object({
  dest: destinationUrlSchema,
  title: z.string().trim().max(120).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Color must be a valid hex color code').optional()
});

// Bio page validation
const bioPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().max(100, 'Title cannot exceed 100 characters').optional(),
  tagline: z.string().trim().max(250, 'Tagline cannot exceed 250 characters').optional(),
  avatar: z.string().trim().max(2048).optional(),
  theme: z.string().trim().max(50).optional(),
  links: z.array(z.object({
    url: destinationUrlSchema,
    label: z.string().trim().max(100).optional(),
    icon: z.string().trim().max(30).optional()
  })).max(30, 'Maximum 30 links allowed per bio page').optional()
});

// Custom domain validation
const customDomainSchema = z.object({
  domain: z.string().trim()
    .min(3, 'Domain is too short')
    .max(120, 'Domain is too long')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Must be a valid domain or subdomain (e.g. link.brand.com)')
    .refine(val => !isPrivateOrReservedHost(val), {
      message: 'Private, loopback, or internal domains are not permitted.'
    })
});

// Abuse report validation
const abuseReportSchema = z.object({
  slug: z.string().trim().max(60).optional(),
  url: z.string().trim().min(3).max(2048),
  reason: z.enum(['phishing', 'malware', 'spam', 'illegal', 'harassment', 'other']),
  details: z.string().trim().max(1000).optional(),
  reporterEmail: z.string().trim().email().optional()
});

// Generic middleware validator factory
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const errorMessage = firstIssue ? `${firstIssue.path.join('.') || 'input'}: ${firstIssue.message}` : 'Validation error';
        return res.status(400).json({
          error: errorMessage,
          code: 'VALIDATION_ERROR',
          details: err.issues
        });
      }
      return res.status(400).json({ error: 'Invalid request input', code: 'VALIDATION_ERROR' });
    }
  };
}

module.exports = {
  isValidDestinationUrl,
  isPrivateOrReservedHost,
  RESERVED_SLUGS,
  BLOCKED_DOMAINS,
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createLinkSchema,
  bulkShortenSchema,
  createQrSchema,
  bioPageSchema,
  customDomainSchema,
  abuseReportSchema
};
