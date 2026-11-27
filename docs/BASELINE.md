# HEA Link — Phase 0 Baseline Audit

Date: 2026-11-28
Branch: `cleanup/auth-single`

## 1. Baseline Command Results

| Command | Result | Details |
| :--- | :--- | :--- |
| `npm install` | PASS | `up to date in 1s`, 0 errors |
| `npm run lint` (`eslint backend tests`) | PASS | 0 errors, 0 warnings |
| `npm run build:landing` | PASS | Built `frontend-landing` (`2502` modules) -> `index.html` + `assets/index-B5uH2hdj.js` (`1,436.20 kB`, gzip `415.73 kB`) + `assets/index-VmR8onJ7.css` (`48.92 kB`); Vite warns chunk > 500 kB |
| `npm test` (`node tests/index.js`) | PARTIAL (HANG) | Suites 1–17 passed and exited 0 (`baseline`, `e2e`, `analytics`, `password-expiry`, `utm`, `domains`, `ai-slugs`, `assist`, `mcp`, `api-v1`, `integrations`, `utm-guide`, `help`, `plans`, `workspaces`, `dashboard-summary`, `format-number`). Suite 18 (`notifications.test.js`) passed all 10 assertions then hung on exit because `notifications.test.js` lacks explicit exit cleanup. Suite 19 (`no-fake-numbers.test.js`) passed when run directly (`0` banned strings across 12 production files). |
| `npm audit` | 3 moderate | 3 moderate severity vulnerabilities reported |

## 2. Backend Routes, Pages & Client API Parity

- **Backend API & Web Routes:** 98 route declarations scanned across `backend/server.js` and `backend/routes/*.js` (`auth`, `links`, `qr`, `bio`, `analytics`, `dashboard`, `domains`, `export`, `help`, `integrations`, `keys`, `mcp`, `notifications`, `plans`, `slugs`, `tokens`, `workspaces`, `billing`, `assist`, `v1/index`).
- **Static & Marketing Pages (`pages/`):**
  - `ai-assist.html`, `ai-mcp.html`, `ai-slug-generator.html`, `ai.html`, `analytics.html`, `bio-pages.html`, `dashboard.html`, `developers.html`, `faq.html`, `help-contact.html`, `help-home.html`, `integrations.html`, `login.html`, `pricing.html`, `qr-code.html`, `resources-utm-guide.html`, `solutions.html`, plus 20 help articles under `pages/help/**`.
  - Root legal/shortener pages: `privacy.html`, `terms.html`, `report-abuse.html`, `r.html`, `404.html`.
- **Client `fetch('/api/...')` Audit:**
  - All dashboard/landing/subpage API calls resolve to real Express routes (`OK`), with one doc snippet mismatch:
    - `pages/developers.html` example snippet still references `https://hea.link/api/v1/links` instead of `https://www.healink.store/api/v1/links`.
  - `404.html` and `r.html` still contain GitHub-Pages SPA fallback redirect logic / client-side shortlink handling.

## 3. Dead-Code, Unused Assets & Dependency Inventory

- **Empty/Legacy Directories:** `archive/` contains `0` files (referenced only by `tests/migration-mongo.test.js`).
- **Overlapping Documentation / Old Reports:**
  - Root: `AUDIT.md`, `AUTH_CLEANUP_REPORT.md`, `MIGRATION.md`, `MIGRATION_MAP.md`, `RESTRUCTURE_PLAN.md`, `STRUCTURE.md`, `TEST_CHECKLIST.md`, `SECURITY_CHECKLIST.md`, `HEA_Link_Project_Architecture_Guide.docx`.
  - `docs/`: `AUDIT.md`, `RESTRUCTURE_PLAN.md`, `STRUCTURE.md`, `TEST_CHECKLIST.md`, `reports/`.
- **Stub / Legacy CSS & Unreferenced Files:**
  - Root CSS stubs (0 external references): `app-shell.css` (35 bytes), `dashboard-tokens.css` (32 bytes).
  - Legacy CSS chains: `style.css` (38 bytes) -> `css/legacy/style.css`; `css/landing.css` still used by static files in `pages/`.
  - `run_server.bat` (0 references).
- **Unused Image Assets:**
  - `images/carousel-analytics.jpg`, `images/carousel-bio.jpg`, `images/carousel-qrcode.jpg`, `images/carousel-shortlinks.jpg` (0 code references).
  - `images/products/*.svg` (37 files, 0 references in `frontend-landing/`, `pages/`, `partials/`, `app.html`, or `js/`).
  - Active landing hero images: `images/hero-infinity-hd.webp` and `images/hero-infinity-hd.png` (used by `frontend-landing/src/sections/Hero.tsx`).
- **Firebase Leftovers:**
  - `backend/server.js` lines 65–66 still list `https://identitytoolkit.googleapis.com` and `https://securetoken.googleapis.com` in Helmet CSP `connectSrc`.
  - `scripts/migrate-firebase-to-mongo.js` (one-off migration script).
- **Dependencies (`depcheck`):**
  - Root `package.json`: 0 unused dependencies.
  - `frontend-landing/package.json`: `clsx` and `tailwind-merge` are unused in `frontend-landing/src/`.
