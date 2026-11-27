# HEA Link Architecture

## High-Level System Overview

HEA Link runs as a unified Node.js / Express 5 application (`server.js` -> `backend/server.js`) backed by MongoDB (Mongoose 9):

1. **Public Landing & Auth (`/` -> `public/index.html`):**
   - Built from `frontend-landing/` (React 18 + TypeScript + Vite + Framer Motion + Tailwind).
   - Output bundles (`public/index.html`, `public/assets/index-*.js`, `public/assets/index-*.css`) are served by Express with `no-cache` on HTML and `immutable` 1-year caching on hashed assets.
   - Owns all unauthenticated marketing home, anonymous URL/QR/bulk shortener (`POST /api/shorten-online`), and `AuthModal` (email/OTP signup, login, password reset, Google GIS, Apple Sign-In).

2. **Authenticated Dashboard (`/app.html` + `dashboard/src/`):**
   - HTML shell compiled from `partials/index.template.html` -> `app.html` (`tools/build_html.js`).
   - Feature modules live in `dashboard/src/modules/` (`state`, `billing`, `home`, `links`, `qr`, `bio`, `analytics`, `domains`, `integrations`, `settings`, `notifications`, `assist`, `router`) and bundle via `esbuild` (`tools/build_dashboard.js`) into hashed minified `public/dashboard/app.[hash].js`.
   - Zero shared user data persists in `localStorage`; all links, QRs, bio pages, domains, notifications, and API keys are scoped to the signed-in user's normalized email (`ownerEmail` / `userEmail`) via REST APIs.

3. **Backend API & Redirect Engine (`backend/`):**
   - `backend/config/`: Startup environment validation (`validateEnv()`), feature flags (`/api/config`), and subscription tier limits (`plans.js`).
   - `backend/controllers/` & `backend/routes/`: Auth, Links + fast 302 redirect engine (`/:slug`, `/r/:slug`, `/go/:slug`), QR, Bio (`/m/:slug`), Custom Domains + DNS verification, Analytics/Export, Assist AI, Billing/Stripe webhooks, Workspaces, Notifications, API Keys, PATs, and Versioned Developer API (`/api/v1/*`, `/api/v1/openapi.json`).
   - `backend/services/`: Security/SSRF/Safe Browsing (`abuse-service.js`), telemetry (`telemetry-service.js`), page metadata (`pageMetadataService.js`), audit logging (`auditService.js`), OpenAPI generator (`openapi.service.js`), OAuth (`socialAuth.js`), MCP tools.
   - `backend/middleware/`: Helmet nonce CSP (`cspNonce.js`), JWT + HttpOnly cookie + CSRF (`auth.js`), Zod validation (`validation.js`), rate limiters (`rateLimiter.js`), DB health gate (`dbCheck.js`), centralized error/404 handler (`errorHandler.js`).
