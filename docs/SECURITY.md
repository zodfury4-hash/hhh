# HEA Link Security Architecture

## 1. Content Security Policy & HTTP Headers (`backend/server.js`)
- Strict Helmet CSP (`default-src 'self'`) with per-request cryptographic nonces (`res.locals.cspNonce`).
- Zero `'unsafe-eval'` and zero `'unsafe-inline'` in `script-src`; `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`.
- `HSTS` / `upgrade-insecure-requests` enabled automatically when `NODE_ENV=production`.
- Protected file probing guard rejects `.env`, `.git`, `.db`, `.sqlite`, `.log` requests with `HTTP 403`.

## 2. Authentication, Sessions & CSRF (`backend/middleware/auth.js`, `backend/routes/auth.js`)
- Passwords hashed with `bcryptjs` (10+ rounds); OTP verification & reset codes stored as SHA-256 hashes (`hashOtp`) with 10-minute expiry and 5-attempt per-email+IP lockout (`HTTP 429`).
- JWT (`HS256`, 7d expiry, minimum 32-char secret validated at startup) carries `tokenVersion` incremented on logout (`POST /api/auth/logout`), password change, and password reset.
- HttpOnly `hea_token` cookie (`SameSite=Lax`, `Secure` in production) paired with double-submit `hea_csrf` / `X-CSRF-Token` validation for cookie-based mutations.

## 3. Input Validation, SSRF & Abuse Protection (`backend/middleware/validation.js`, `backend/services/abuse-service.js`)
- All request payloads validated via `zod` schemas.
- Destination URLs must use `http:`/`https:`, cannot target private/loopback/cloud-metadata IP ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `fc00::/7`), self-domain hosts (`PRIMARY_HOSTS`) to prevent redirect loops, or blocked abuse domains (`grabify.link`, etc.).
- Optional Google Safe Browsing API check (`GOOGLE_SAFE_BROWSING_KEY`).
- Server-side page metadata fetcher re-resolves DNS (`isSafePublicHost`) on every redirect hop (`maxRedirects: 3`).

## 4. API Keys, Audit Logs & Billing (`backend/models/ApiKey.js`, `backend/services/auditService.js`, `backend/routes/billing.js`)
- API keys (`hea_live_...`, `hea_test_...`) and PATs store SHA-256 hashes only; raw keys are revealed once at creation.
- Sensitive operations write sanitized records (no secrets/passwords/tokens) to `AuditLog`. Pino logs redact `Authorization`, `Cookie`, passwords, tokens, keys, and env secrets.
- Stripe checkout calculates prices exclusively from server `backend/config/plans.js`, verifies webhook raw-body signatures via `STRIPE_WEBHOOK_SECRET`, enforces idempotency via `ProcessedPayment`, and handles `customer.subscription.deleted`, `invoice.payment_failed`, and `charge.refunded`.
