# Changelog

All notable engineering and release changes to HEA Link are documented in this file.

## [2.1.0] - 2026-11-28
### Added
- **Phase 1 (Deployment & Routing):** `render.yaml`, multi-stage non-root `Dockerfile`, `.dockerignore`, `docs/DEPLOY.md`, startup production environment validator (`validateEnv()`), `/api/config` feature flags, complete clean public URL routing table, branded `public/404.html` with real HTTP 404 responses, removed GitHub Pages (`CNAME`, `.nojekyll`) & `vercel.json`.
- **Phase 2 (Auth, Email OTP & DB):** SHA-256 OTP hashing with per-email+IP lockout, provider-agnostic mailer (`SMTP` + HTTP API for `resend`/`brevo` with boot check & retry), `HttpOnly` `hea_token` + double-submit `hea_csrf` cookies, server-side `tokenVersion` revocation on logout and password change, Mongoose pool/retry options, standalone `scripts/seed-admin.js` (`npm run seed:admin`), Firebase leftovers purged.
- **Phase 3 (Security):** Per-request CSP nonces eliminating `'unsafe-eval'` and `'unsafe-inline'` in `scriptSrc`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, self-domain redirect-loop SSRF block, `apiKeysLimiter`, `pino` secret redaction, Stripe refund/cancel/payment-failed webhook handlers, `npm audit` clean (`0 vulnerabilities`), `docs/SECURITY.md`, `.nvmrc`.
- **Phase 4 (Structure & Modularization):** Reorganized static assets under `public/`, extracted modular ES dashboard under `dashboard/src/` bundled with `esbuild` (`npm run build:dashboard`), extracted backend response helpers & controllers, cleaned dead assets & overlapping docs, consolidated docs (`README.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `CHANGELOG.md`).

## [2.0.0] - 2026-11-27
- Migrated landing home to Vite/React (`frontend-landing/`) and consolidated authentication in `AuthModal` with strict per-email user isolation.
