# Changelog

All notable engineering, architecture, and release changes to HEA Link are documented in this file.

## [2.1.0] - 2026-11-28
### Added & Consolidated
- **Single Render Target & Clean Ingress:** Focused deployment entirely on Render (`render.yaml` + multi-stage `Dockerfile`), deleting legacy `vercel.json` and `api/index.js`.
- **Strict Production Environment Validation (`validateEnv()`):** Startup immediately fails loudly if `MONGODB_URI`, `JWT_SECRET`, email transport (`SMTP_*` or `EMAIL_PROVIDER`/`EMAIL_API_KEY`), or `GOOGLE_CLIENT_ID` are missing or invalid. Apple Sign-In button stays cleanly hidden unless `APPLE_CLIENT_ID` is explicitly provided.
- **Single Production Deployment Guide (`docs/DEPLOY.md`):** Complete Render setup checklist, cloud MongoDB Atlas guide, email provider config (SMTP/Resend/Brevo), Google OAuth credentials, and custom domain DNS. Consolidated docs and removed duplicate `docs/DEPLOYMENT.md`, `docs/README.md`, `docs/CHANGELOG.md`.
- **Cleaned Public Assets:** Emptied output directory before builds and purged 73 stale hashed chunks from `public/assets/`, leaving only active bundles referenced by `public/index.html`.
- **Source Archive Script (`npm run pack`):** Deterministic source packer (`scripts/pack.js`) that creates `hea-link-source.zip` strictly excluding `.env*`, `node_modules`, `.git`, `dist`, and `test-artifacts`.
- **Server-Driven Redirects:** Clean server-side Express redirects for `/#solutions`, `/#qr-codes`, `/#bio-pages`, `/#analytics`, and `/#ai` replacing legacy static HTML forwarders.

## [2.0.0] - 2026-11-27
- **Vite/React Landing & Unified Auth:** Migrated landing experience to high-performance React 18 + Vite (`frontend-landing/`) with Three.js WebGL background, Lenis momentum scrolling, and unified interactive `AuthModal` supporting Email OTP verification, Resend cooldown, and Google OAuth2 TokenClient popups.
- **Enterprise MongoDB Persistence:** Full persistence layer across MongoDB Atlas with 24 Mongoose models, resilient in-memory fallback for test harnesses, and atomic TTL click logging.
- **Security & CSP Nonces:** Per-request cryptographically signed CSP nonces, strict Helmet directives (`frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`), SSRF validation, and Pino secret redaction.

## [1.0.0] - November 2026
- **Initial Core Platform:** High-density vector QR Code studio, mobile link-in-bio hub with live phone simulator, HEA Assist AI slug generator, custom domains management, and UTM campaign telemetry tracking.
