# MIGRATION_MAP.md: HEA Link Architecture Migration Table

This document tracks all files relocated, modularized, or archived during the repository restructure.

---

## 1. Migration Directory Mapping

| Old Path | New Path | Status | Reason & Description |
| :--- | :--- | :---: | :--- |
| `dashboard-tokens.css` | `css/tokens.css` | **Moved** | Design tokens for typography, fluid scaling, and spacing. (Forwarding `@import` kept at root). |
| `style.css` (part) | `css/base.css` | **Extracted** | Shared resets, global typography, and foundation containers. |
| `style.css` (full) | `css/legacy/style.css` | **Preserved** | Legacy stylesheet preserved for backward compatibility. |
| `app-shell.css` | `css/dashboard.css` | **Moved** | Full dashboard layout, tables, metrics, and assist drawer styles. (Forwarding `@import` kept at root). |
| `landing-clean.css` | `css/landing.css` | **Moved** | Vanilla landing page hero, feature cards, and footer styles. (Forwarding `@import` kept at root). |
| `qrcode.js` | `js/shared/qrcode.js` | **Relocated** | Shared vector QR canvas generation engine. (Forwarding wrapper kept at root). |
| `motion.config.js` | `js/shared/motion.config.js` | **Relocated** | Shared animation tokens, easing curves, and observer settings. (Root copy preserved). |
| `firebase-config.js` | `js/auth/firebase-config.js` | **Relocated** | Client-side Firebase credentials and browser auth initialization. |
| `firebase-service.js` | `js/auth/firebase-service.js` | **Relocated** | Client-side Firebase Realtime Database helpers. |
| `firebase-service.js` | `backend/firebase-service.js` | **Mounted** | Backend Firebase Realtime Database bridge. |
| `landing-clean.js` | `js/landing/landing-clean.js` | **Relocated** | Vanilla landing page interactions and mobile menu handler. (Alias: `js/landing/landing.js`). |
| `app-shell.js` | `js/dashboard/app-shell.js` | **Relocated** | Core dashboard shell, sidebar navigation, and tab router. |
| `app.js` | `js/dashboard/app.js` | **Relocated** | URL shortener logic, HEA Assist AI heuristics, and password recovery. |
| `heavy-fx.js` | `js/legacy/heavy-fx.js` | **Preserved** | Legacy smooth-scroll and animation fallbacks. |
| `models/*.js` | `backend/models/*.js` | **Relocated** | Mongoose schemas (`User`, `Link`, `QRCode`, `BioPage`, `CustomDomain`). |
| `server.js` (core) | `backend/server.js` | **Modularized** | Express server application mounting routes and static assets. |
| `server.js` (auth) | `backend/routes/auth.js` | **Extracted** | Dedicated authentication endpoints (`/api/auth/*` and `/api/config`). |
| `server.js` (links)| `backend/routes/links.js` | **Extracted** | Link shortening, links CRUD, bulk generator, and `/r/:slug` redirects. |
| `server.js` (qr) | `backend/routes/qr.js` | **Extracted** | QR code CRUD operations (`/api/qrs`). |
| `server.js` (bio) | `backend/routes/bio.js` | **Extracted** | Bio pages CRUD and mobile preview renderers (`/m/:slug`). |
| `server.js` (analytics)| `backend/routes/analytics.js` | **Extracted** | Click analytics aggregation and custom domains endpoints. |
| `server.js` (billing)| `backend/routes/billing.js` | **Extracted** | Stripe checkout session creation, verification, and webhooks. |
| `server.js` (assist)| `backend/routes/assist.js` | **Extracted** | HEA Assist AI chat and content recommendation endpoints. |
| `server.js` (root) | `server.js` | **Thin Wrapper** | 1-line delegation wrapper to `backend/server.js` for Vercel and Node compatibility. |
| `ai.html` | `pages/ai.html` | **Relocated** | Legacy forwarder stub (rewritten via `vercel.json` and `404.html`). |
| `analytics.html` | `pages/analytics.html` | **Relocated** | Legacy forwarder stub. |
| `bio-pages.html` | `pages/bio-pages.html` | **Relocated** | Legacy forwarder stub. |
| `dashboard.html` | `pages/dashboard.html` | **Relocated** | Legacy forwarder stub. |
| `login.html` | `pages/login.html` | **Relocated** | Legacy forwarder stub. |
| `pricing.html` | `pages/pricing.html` | **Relocated** | Legacy forwarder stub. |
| `qr-code.html` | `pages/qr-code.html` | **Relocated** | Legacy forwarder stub. |
| `solutions.html` | `pages/solutions.html` | **Relocated** | Legacy forwarder stub. |
| `public_html/` | `archive/public_html-php/`| **Archived** | Legacy PHP 8 + SQLite prototype admin panel. |
| `landing/` (React) | `archive/landing-react-3d/`| **Archived** | Deprecated Three.js / React build source. |
| `assets/` (Vite) | `archive/built-assets/` | **Archived** | Deprecated Vite 3D landing assets. |
| `scratch/` | `archive/scratch/` | **Archived** | Internal debug and scratch execution scripts. |
| `.agents/`, `.taste-skill/` | `archive/tooling/` | **Archived** | Antigravity AI skill caches and metadata (gitignored). |
| `HEA_Link_*.docx` | `docs/reports/*.docx` | **Relocated** | Project documentation reports. |
| `STRUCTURE.md` | `docs/STRUCTURE.md` | **Relocated** | Project architecture specification document. |
| `AUDIT.md` | `docs/AUDIT.md` | **Relocated** | Pre-upgrade audit findings. |
| `CHANGELOG.md` | `docs/CHANGELOG.md` | **Relocated** | Chronological upgrade log. |
| `TEST_CHECKLIST.md` | `docs/TEST_CHECKLIST.md` | **Relocated** | Cross-device QA verification matrix. |

---

## 2. Backward Compatibility Guarantees

1. **Deploy Path Invariance**:
   - `index.html`, `app.html`, `404.html`, `CNAME`, `.nojekyll`, `r.html`, and `r/index.html` remain at the repository root.
2. **Vercel Routing**:
   - `vercel.json` routes `/api/(.*)` to `server.js` (which delegates to `backend/server.js`), and rewrites all legacy URLs (`/dashboard.html`, `/login.html`, etc.) directly to their SPA hash targets.
3. **GitHub Pages Slug Resolution**:
   - `404.html` normalizes `.html` suffixes and forwards to the unified SPA router.
4. **Style & Script Resolution**:
   - Both modular paths (`css/...`, `js/...`) and root paths (`style.css`, `app.js`, etc.) resolve cleanly without 404 errors.
