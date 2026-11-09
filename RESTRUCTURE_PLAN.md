# RESTRUCTURE_PLAN.md: HEA Link Safe Architecture Plan

> **Date:** 2026-11-09  
> **Status:** Step 0 Discovery Completed — Ready for Phased Execution  
> **Branch:** `restructure`  

---

## 1. Executive Summary & Goals

This document defines the safe, non-breaking restructuring plan for **HEA Link** (`d:\github\hhh`). The objective is to organize the repository into a clean, modern, and maintainable architecture (`css/`, `js/`, `backend/`, `archive/`, `docs/`, `pages/`) while:
- Preserving 100% of live functionality across all deployment environments (GitHub Pages, Vercel, Node.js).
- Maintaining zero data loss (archiving deprecated assets rather than deleting).
- Enforcing strict secret hygiene (`.env` omitted, `.env.example` audited).
- Verifying each step with automated browser and runtime testing.

---

## 2. Discovery Findings (Step 0 Audit)

### a. Deployment Infrastructure
The repository supports a hybrid deployment model:
1. **GitHub Pages (`www.healink.store`)**:
   - `CNAME` defines custom domain `www.healink.store`.
   - `.nojekyll` bypasses Jekyll processing so client-side redirect rules and assets serve smoothly.
   - `404.html` acts as the universal client-side redirect router for GitHub Pages, resolving short slugs (`/r/:slug`, `/:slug`) and SPA tabs (`/#dashboard`, `/#login`, etc.) via `localStorage` and URL parameters.
   - `r.html` and `r/index.html` serve as root-level short link forwarders.
2. **Vercel (`vercel.json`)**:
   - Routes `/api/(.*)` requests to `server.js` using `@vercel/node`.
   - Routes `/(.*)` requests to static HTML using `@vercel/static`.
3. **Dedicated Node.js Server (`server.js` / `package.json`)**:
   - Express server listening on `PORT` (default 3000), serving the static frontend from repo root and routing `/api/*` endpoints.

### b. Deploy-Critical Files (Must Remain at Repository Root)
These files MUST NOT be moved or removed from repo root to ensure zero downtime on GitHub Pages and Vercel:
- `index.html` (Master entrypoint)
- `app.html` (Direct dashboard shell fallback)
- `404.html` (GitHub Pages redirect engine)
- `r.html` & `r/index.html` (Root short link resolvers)
- `CNAME` (GitHub Pages custom domain)
- `.nojekyll` (GitHub Pages bypass marker)
- `vercel.json` (Vercel serverless routing config)
- `firebase.json` & `.firebaserc` (Firebase Realtime Database configuration)
- `favicon.svg` & `logo.png` (Root brand assets)

### c. Frontend State Analysis
- **Source of Truth**: `index.html` and `app.html` have been unified into identical, clean vanilla HTML single-page applications.
- **Active Assets**:
  - CSS: `style.css`, `dashboard-tokens.css`, `app-shell.css`, `landing-clean.css`.
  - JS: `qrcode.js`, `firebase-config.js`, `heavy-fx.js`, `motion.config.js`, `landing-clean.js`, `app-shell.js`, `app.js`.
  - Locales: `locales/en.json`, `locales/i18n.js`.
- **Legacy React 3D Bundle**: `landing/src` and `assets/index-8VKGSSYB.js` are already unreferenced by both `index.html` and `app.html`, safely archived in `archive/landing` and `archive/assets`.
- **Unreferenced Root Forwarders**: `ai.html`, `analytics.html`, `bio-pages.html`, `dashboard.html`, `login.html`, `pricing.html`, `qr-code.html`, `solutions.html`. These are ~400-byte bookmark forwarders that redirect to `index.html#<route>`. They will be grouped into `pages/` while retaining backward-compatible rewrite rules in `vercel.json` and `404.html`.

### d. Backend State Analysis
- **Primary Backend**: Node.js + Express (`server.js`), Mongoose schemas (`models/User.js`, `Link.js`, `QRCode.js`, `BioPage.js`, `CustomDomain.js`), Stripe integration, Nodemailer SMTP, and Firebase Realtime Database bridge (`firebase-service.js`). All frontend `fetch('/api/...')` calls target these Express endpoints.
- **Legacy PHP/SQLite Backend**: `public_html/` (`index.php`, `redirect.php`, `admin/`, `inc/`) and `data/app.db`. This was an earlier prototype. Confirmed unreferenced by the live Node/static stack. Will be moved to `archive/public_html-php/`.
- **Firebase Database**: Actively leveraged as a resilient O(1) global datastore for shortlink resolution and bio profile records (`healinks-4ea4d-default-rtdb.firebaseio.com`). Retained in primary architecture.

### e. Size & Storage Audit
| Directory / Component | Item Count | Disk Size | Target Destination |
| :--- | :---: | :---: | :--- |
| `archive/` | 14,257 | ~264 MB | Keep as `/archive` (ignored in production) |
| `node_modules/` | 5,937 | ~57 MB | Ignored via `.gitignore` |
| `.git/` | 621 | ~50 MB | Version control repository |
| `.agents/` | 1,617 | ~35 MB | Move to `archive/tooling/.agents` (gitignored) |
| `.taste-skill/` | 318 | ~7.6 MB | Move to `archive/tooling/.taste-skill` (gitignored) |
| `images/` | 47 | ~4.3 MB | Keep at root `images/` |
| `backup/` | 11 | ~1.1 MB | Keep in `/backup` |
| `scratch/` | 297 | ~0.5 MB | Move to `archive/scratch/` (gitignored) |
| `public_html/` | 52 | ~0.4 MB | Move to `archive/public_html-php/` |
| `data/` | 2 | ~0.04 MB | Keep `data/.htaccess`, gitignore `data/*.db` |

---

## 3. Target Architecture Layout

```text
hhh/
├── index.html                  # Entrypoint (stays at root for GitHub Pages / Vercel)
├── app.html                    # Dashboard shell entrypoint (stays at root)
├── 404.html                    # Universal GitHub Pages client-side redirect engine
├── r.html, r/index.html        # Short-link resolvers
├── CNAME, .nojekyll            # GitHub Pages config
├── vercel.json                 # Vercel routing (updated with /pages/ rewrites)
├── firebase.json, .firebaserc  # Firebase database configuration
├── database.rules.json         # Firebase Realtime Database security rules
├── favicon.svg, logo.png       # Brand assets
│
├── pages/                      # Standalone URL forwarders
│   ├── ai.html
│   ├── analytics.html
│   ├── bio-pages.html
│   ├── dashboard.html
│   ├── login.html
│   ├── pricing.html
│   ├── qr-code.html
│   └── solutions.html
│
├── css/                        # Modular CSS stylesheets
│   ├── tokens.css              # From dashboard-tokens.css
│   ├── base.css                # Base resets & typography (from style.css)
│   ├── landing.css             # From landing-clean.css
│   ├── dashboard.css           # Modular dashboard bundle (from app-shell.css)
│   │   ├── layout.css          # Sidebar, topbar, content row
│   │   ├── components.css      # Buttons, cards, tables, modals, badges
│   │   ├── views.css           # View-specific styles (qr, bio, analytics, etc.)
│   │   └── responsive.css      # Breakpoints & safe-area insets
│   └── legacy/
│       └── style.css           # Preserved legacy stylesheet for backward compatibility
│
├── js/                         # Modular JavaScript application code
│   ├── shared/                 # Common libraries & helpers
│   │   ├── qrcode.js           # QR code generation engine
│   │   ├── motion.config.js    # Motion configuration tokens
│   │   └── utils.js            # Shared DOM & format helpers
│   ├── auth/                   # Authentication logic
│   │   ├── firebase-config.js  # Firebase client credentials
│   │   └── firebase-service.js # RTDB client service
│   ├── landing/
│   │   └── landing.js          # From landing-clean.js
│   ├── dashboard/              # Split dashboard feature modules
│   │   ├── app-shell.js        # Core dashboard shell
│   │   └── app.js              # Shortener, AI heuristics, forgot password
│   └── legacy/
│       └── heavy-fx.js         # Legacy effects & animation fallbacks
│
├── images/                     # Images and SVG icons (including products/)
├── locales/                    # Multilingual JSON dictionaries (en.json, i18n.js)
│
├── backend/                    # Primary Node.js / Express backend
│   ├── server.js               # Clean root server orchestrator
│   ├── models/                 # Mongoose schema models
│   │   ├── User.js
│   │   ├── Link.js
│   │   ├── QRCode.js
│   │   ├── BioPage.js
│   │   └── CustomDomain.js
│   ├── routes/                 # Feature-split Express routers
│   │   ├── auth.js             # /api/auth (login, register, reset, google, verify)
│   │   ├── links.js            # /api/links & /api/shorten
│   │   ├── qr.js               # /api/qr
│   │   ├── bio.js              # /api/bio
│   │   ├── analytics.js        # /api/analytics
│   │   ├── billing.js          # /api/stripe
│   │   └── assist.js           # /api/ai
│   └── .env.example            # Safe environment template
│
├── archive/                    # Archived legacy & generated assets (never deployed)
│   ├── landing-react-3d/       # Old React + Three.js landing source
│   ├── built-assets/           # Old built Vite bundle
│   ├── public_html-php/        # PHP + SQLite legacy admin panel
│   ├── scratch/                # Debug & test scripts
│   └── tooling/                # .agents, .taste-skill, skills-lock.json
│
└── docs/                       # Project documentation & reports
    ├── README.md               # Up-to-date documentation
    ├── STRUCTURE.md            # Comprehensive architecture specification
    ├── AUDIT.md                # Phase 1 audit notes
    ├── CHANGELOG.md            # Chronological upgrade log
    ├── TEST_CHECKLIST.md       # Cross-device QA checklist
    ├── RESTRUCTURE_PLAN.md     # This discovery & plan specification
    ├── MIGRATION_MAP.md        # File mapping reference table
    └── reports/                # Project Word reports (.docx)
```

---

## 4. Execution Roadmap & Verification Steps

1. **Step 1: Clean & Protect Environment**:
   - Update `.gitignore` with all generated, database, and temporary paths.
   - Archive temporary tooling (`scratch/`, `.agents/`, `.taste-skill/`, `skills-lock.json`) and reports (`*.docx`).
   - Audit `.env.example` to ensure all secret variable names are represented with dummy values.
2. **Step 2: Create Directory Layout & Move Non-Code Files**:
   - Create target directories: `css/`, `js/`, `pages/`, `backend/`, `archive/`, `docs/`.
   - Move standalone redirect pages into `pages/`.
   - Move legacy PHP system to `archive/public_html-php/`.
   - Move reports to `docs/reports/`.
3. **Step 3: Move CSS & JS Assets with Path Rewriting**:
   - Move stylesheets into `css/` (`tokens.css`, `base.css`, `landing.css`, `dashboard.css`, `legacy/style.css`).
   - Move scripts into `js/` (`shared/`, `auth/`, `landing/`, `dashboard/`, `legacy/`).
   - Update HTML `<link>` and `<script>` paths in `index.html`, `app.html`, `404.html`, `r.html`, and `r/index.html`.
4. **Step 4: Restructure Backend**:
   - Move `models/` into `backend/models/`.
   - Split `server.js` into modular Express routers in `backend/routes/`.
   - Provide a clean `backend/server.js` and keep a thin root `server.js` wrapper for Vercel/Node backward compatibility.
   - Update `run_server.bat` and `package.json` scripts.
5. **Step 5: Reference Verification & Grep Audit**:
   - Re-grep codebase for stale paths.
   - Verify all static asset links, image URLs, and API endpoints.
6. **Step 6: Comprehensive QA Test Run**:
   - Run headless Chrome test runner to verify 0 errors, no 404s, responsive sidebar, and operational routing.
   - Document final state in `MIGRATION_MAP.md`.
