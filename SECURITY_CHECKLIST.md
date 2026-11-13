# HEA Link — Security Audit & Remediation Checklist (Phase 1)

This document details the critical security enhancements applied during **Phase 1: Security Hardening** and outlines the mandatory manual actions required by project owners to guarantee production security.

---

## 🛡️ Applied Security Fixes

### 1. Database & Firebase Realtime Database Security Rules
- **Vulnerability**: Previously, `database.rules.json` allowed unauthenticated public reads and writes (`.read: true`, `.write: true`).
- **Remediation**: Locked down rules to deny by default (`.read: false`, `.write: false`) and restricted access exclusively to authenticated users matching their unique User ID (`auth.uid == $uid`).
- **File**: `database.rules.json`

### 2. Elimination of Hardcoded VIP Admin Credentials & Client-Side Privilege Escalation
- **Vulnerability**: Plaintext passwords and administrator emails (`furyzod02@gmail.com`, `healink@gmail.com`) were hardcoded in `js/auth/firebase-config.js` and `js/dashboard/app.js` (`vipPasses`), allowing arbitrary client-side privilege escalation without backend verification.
- **Remediation**:
  - Completely purged `VIP_ADMIN_ACCOUNTS`, `vipPasses`, and hardcoded passwords from both client and backend code.
  - Implemented a formal `role: { type: String, enum: ['user', 'admin'], default: 'user' }` in `backend/models/User.js`.
  - Added an idempotent `seedAdminUser()` routine in `backend/server.js` that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` and hashes credentials using `bcrypt` (10 rounds).
  - Admin access is strictly enforced via server-signed JWT tokens and `requireAdmin` / `req.user.role === 'admin'`.

### 3. JWT Hardening & Mandatory Secret Enforcement
- **Vulnerability**: JWT used an insecure fallback secret (`'healink_jwt_super_secret_key_2026_xyz'`), permitting token forgery if `JWT_SECRET` was omitted from `.env`.
- **Remediation**:
  - Removed all hardcoded fallback secrets.
  - The server now refuses to start in development or production if `JWT_SECRET` is missing or shorter than 32 characters (`FATAL: JWT_SECRET environment variable is missing...`).
  - Added token expiration (`expiresIn: '7d'`), standard error codes (`TOKEN_EXPIRED`, `INVALID_TOKEN`, `NO_TOKEN`), and a secure `/api/auth/refresh` endpoint.
- **Files**: `backend/middleware/auth.js`, `backend/routes/auth.js`

### 4. OTP Lifecycle & Leak Prevention
- **Vulnerability**: Authentication endpoints returned `devCode` in JSON responses, allowing any attacker to bypass email verification.
- **Remediation**:
  - Completely eradicated `devCode` from all API responses.
  - Set OTP expiration to 10 minutes (`10 * 60 * 1000`).
  - Enforced single-use OTP invalidation (`verificationCode = null`, `verificationCodeExpires = null`) immediately upon verification or password reset.
  - Added server-side attempt rate locking (5 failed attempts = 15-minute lock).
  - Allowed development-only console logging (`console.log`) restricted to `NODE_ENV === 'development'`.
- **Files**: `backend/routes/auth.js`, `backend/utils/helpers.js`, `js/dashboard/app.js`

### 5. Removal of `Host: localhost` Plan Limit Bypass
- **Vulnerability**: Free link limits could be bypassed in production by sending an arbitrary `Host: localhost` header.
- **Remediation**: Replaced header sniffing with strict runtime environment verification (`process.env.NODE_ENV === 'development'`).
- **File**: `backend/routes/links.js`

### 6. Billing, Webhook Verification & Payment Idempotency
- **Vulnerability**: Demo/sandbox mode could be triggered by any caller, and Stripe webhooks were accepted without signature verification if `STRIPE_WEBHOOK_SECRET` was absent.
- **Remediation**:
  - Demo/sandbox mode is permitted strictly when `NODE_ENV === 'development'`. In production, payments require verified Stripe checkout sessions or cryptographically verified webhook signatures.
  - Webhooks without `STRIPE_WEBHOOK_SECRET` or valid `stripe-signature` headers are strictly rejected (`HTTP 400/500`).
  - Created `backend/models/ProcessedPayment.js` with unique `paymentId` indexing to guarantee idempotency and prevent duplicate credits.
- **Files**: `backend/routes/billing.js`, `backend/models/ProcessedPayment.js`, `backend/server.js`

### 7. Helmet Security Headers, Rate Limiting, Body Size & CORS
- **Vulnerability**: Missing HTTP security headers, unrestricted JSON body parsing, missing IP rate limits, and permissive CORS.
- **Remediation**:
  - Mounted `helmet` with comprehensive Content-Security-Policy (CSP) allowing only verified CDNs (Stripe, Google Identity, Cloudflare).
  - Configured strict rate limiting with `express-rate-limit`:
    - `authLimiter`: 20 requests per 15 minutes on login, signup, verification, reset.
    - `linkCreateLimiter`: 40 requests per minute on link creation.
    - `bulkShortenLimiter`: 10 requests per minute on bulk creation.
    - `assistLimiter`: 30 requests per minute on AI copilot endpoints.
    - `abuseReportLimiter`: 10 reports per hour.
  - Enforced `1mb` body limit (`express.json({ limit: '1mb' })`).
  - Restricted CORS to `CORS_ORIGIN` allowlist.
- **Files**: `backend/server.js`, `backend/middleware/rateLimiter.js`

### 8. Input Validation & SSRF Prevention with Zod
- **Vulnerability**: URLs, slugs, and auth inputs lacked schema validation, permitting Server-Side Request Forgery (SSRF) to internal cloud metadata (`169.254.169.254`), loopbacks, and private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Remediation**:
  - Implemented comprehensive `zod` schemas for all routes in `backend/middleware/validation.js`.
  - Blocked non-HTTP protocols (`javascript:`, `data:`, `file:`, `vbscript:`).
  - Blocked SSRF targeting private IP ranges, loopbacks (`127.0.0.1`), link-local metadata services, and internal `.local` / `.internal` hostnames.
  - Protected system reserved paths (`api`, `admin`, `billing`, etc.) from slug collisions.
- **File**: `backend/middleware/validation.js`

### 9. XSS Prevention & Bio Page Sanitization
- **Vulnerability**: Dynamic Bio Page HTML (`/m/:slug`) interpolated `bio.title`, `bio.tagline`, and link URLs directly into the DOM without escaping.
- **Remediation**:
  - Added HTML escaping (`escapeHtml`) across all user-controlled text fields.
  - Enforced `sanitizeUrl` to prevent `javascript:` execution in bio links.
  - Purged raw unescaped innerHTML injections across dashboard rendering.
- **Files**: `backend/routes/bio.js`, `js/dashboard/app.js`, `js/dashboard/app-shell.js`

### 10. Resource Authorization & Guest Fallback Removal
- **Vulnerability**: Unauthenticated callers could manipulate or read user data by passing arbitrary `email` query/body parameters.
- **Remediation**:
  - Enforced `authMiddleware` on all dashboard endpoints (`/api/links`, `/api/qrs`, `/api/bios`, `/api/domains`, `/api/analytics/overview`).
  - Checked that the resource `ownerEmail` strictly matches `req.user.email` (or `req.user.role === 'admin'`). Non-owners receive `HTTP 403 Forbidden`.
  - Guest links created from the public landing page quick shortener cannot be modified or deleted without ownership tokens.
- **Files**: `backend/routes/links.js`, `backend/routes/qr.js`, `backend/routes/bio.js`, `backend/routes/analytics.js`

### 11. Shortener Abuse Protection & Reporting Endpoint
- **Vulnerability**: Absence of abuse reporting mechanism and automated blocking of known malicious shortener targets.
- **Remediation**:
  - Added domain blocklist for notorious IP loggers and phishing redirects.
  - Added optional Google Safe Browsing Lookup v4 integration via `GOOGLE_SAFE_BROWSING_KEY`.
  - Created `POST /api/abuse/report` and `AbuseReport` model in MongoDB.
  - Added "🚩 Report Suspicious Link" button and reporting modal on the redirect screen (`r.html`).
- **Files**: `backend/services/abuse-service.js`, `backend/models/AbuseReport.js`, `backend/server.js`, `r.html`

---

## 📋 Mandatory Manual Steps for Project Owner

To complete deployment to production, perform the following manual tasks:

1. **Rotate Secrets in Production `.env`**:
   - Generate a brand-new random 32+ character string for `JWT_SECRET`:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Update `MONGODB_URI` with strong credentials on MongoDB Atlas.
   - Set a strong, unique `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the master admin account.
2. **Stripe Dashboard Configuration**:
   - Obtain your Live/Test Secret Key (`sk_live_...` or `sk_test_...`) and Publishable Key (`pk_live_...`).
   - Configure a webhook endpoint in Stripe Dashboard pointing to: `https://yourdomain.com/api/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy the Signing Secret (`whsec_...`) and place it into `STRIPE_WEBHOOK_SECRET` in `.env`.
3. **SMTP Email Credentials**:
   - Provide active SMTP credentials in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) so users receive real 6-digit verification codes and password reset emails.
4. **Firebase Console Rules (If RTDB is retained)**:
   - Go to [Firebase Console](https://console.firebase.google.com/) -> Realtime Database -> Rules.
   - Paste the contents of `database.rules.json` and click **Publish**.
5. **Google Safe Browsing API Key (Optional)**:
   - Enable "Google Safe Browsing API" in Google Cloud Console and paste the API key into `GOOGLE_SAFE_BROWSING_KEY` in `.env`.

---

## 🧪 Verification & Test Results
- **Test Suite**: `npm test`
- **Result**: `23 Passed, 0 Failed`
- **HTML Compilation**: `npm run build:html` (Clean compile, 0 errors)
