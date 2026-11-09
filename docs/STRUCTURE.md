# 🚀 HEA Link — Complete Architecture & File Specification

This document outlines the directory structure, architecture, routing, and role of every file in the **HEA Link** project.

---

## 📁 Repository Directory Tree

```text
hhh/
├── index.html                  # Master entrypoint (GitHub Pages / Vercel web root)
├── app.html                    # Dashboard shell entrypoint
├── 404.html                    # Universal GitHub Pages client-side redirect router
├── r.html, r/index.html        # Direct short-link resolvers
├── CNAME, .nojekyll            # GitHub Pages deployment configuration
├── vercel.json                 # Vercel serverless functions & rewrite rules
├── firebase.json, .firebaserc  # Firebase Realtime Database configuration
├── database.rules.json         # Firebase Realtime Database security rules
├── favicon.svg, logo.png       # Brand vector icons and graphics
├── server.js                   # Root entrypoint wrapper (delegates to backend/server.js)
├── run_server.bat              # 1-click Windows server launch script
├── package.json                # Project dependencies and NPM scripts
│
├── pages/                      # Standalone URL forwarders (for direct bookmarks)
│   ├── ai.html                 # Redirects to index.html#assist
│   ├── analytics.html          # Redirects to index.html#analytics
│   ├── bio-pages.html          # Redirects to index.html#pages
│   ├── dashboard.html          # Redirects to index.html#dashboard
│   ├── login.html              # Redirects to index.html#login
│   ├── pricing.html            # Redirects to index.html#pricing
│   ├── qr-code.html            # Redirects to index.html#qr
│   └── solutions.html          # Redirects to index.html#solutions
│
├── css/                        # Modular CSS Design System
│   ├── tokens.css              # Fluid clamp() typography, spacing, radius, z-index scale
│   ├── base.css                # Base resets, container widths, and core layout styles
│   ├── landing.css             # Vanilla marketing landing page styles
│   ├── dashboard.css           # Full dashboard layout, sidebar, tables, and metrics
│   └── legacy/style.css        # Preserved global stylesheet for backward compatibility
│
├── js/                         # Modular Frontend JavaScript Codebase
│   ├── shared/                 # Shared utilities and vendor libraries
│   │   ├── qrcode.js           # Canvas QR code rendering engine
│   │   └── motion.config.js    # Central motion timing and observer configuration
│   ├── auth/                   # Client-side authentication logic
│   │   ├── firebase-config.js  # Firebase client credentials
│   │   └── firebase-service.js # Client-side RTDB helper service
│   ├── landing/
│   │   └── landing-clean.js    # Marketing landing page event handlers
│   ├── dashboard/              # Core application logic
│   │   ├── app-shell.js        # Full dashboard SPA router, sidebar, and tab state
│   │   └── app.js              # Shortener, HEA Assist AI, modals, and password reset
│   └── legacy/
│       └── heavy-fx.js         # Smooth-scroll and progressive enhancement fallbacks
│
├── images/                     # Graphic assets and SVG icon collections (products/)
├── locales/                    # Multilingual localization bundles (en.json, i18n.js)
│
├── backend/                    # Primary Full-Stack Node.js Backend
│   ├── server.js               # Express app, middleware, and router mounting
│   ├── models/                 # Mongoose schemas (MongoDB)
│   │   ├── User.js             # User accounts, hashed passwords, verification OTPs
│   │   ├── Link.js             # Short URLs, slugs, click counts, geo-telemetry
│   │   ├── QRCode.js           # QR configurations, color palettes, scan tracking
│   │   ├── BioPage.js          # Mobile bio profile templates, themes, links
│   │   └── CustomDomain.js     # Branded custom domain records and CNAME status
│   ├── routes/                 # Feature-split Express API routers
│   │   ├── auth.js             # /api/auth (register, verify, login, me, google, config)
│   │   ├── links.js            # /api/links, /api/shorten, /r/:slug, /go/:slug
│   │   ├── qr.js               # /api/qrs (CRUD)
│   │   ├── bio.js              # /api/bios, /m/:slug (Bio page rendering)
│   │   ├── analytics.js        # /api/analytics/overview, /api/domains
│   │   ├── billing.js          # /api/stripe (Checkout sessions, webhooks)
│   │   └── assist.js           # /api/assist/generate, /api/ai/ask
│   ├── middleware/
│   │   └── auth.js             # JWT verification (authMiddleware, optionalAuth)
│   ├── utils/
│   │   ├── helpers.js          # Rate-limiting, secure OTP generator, VIP accounts
│   │   ├── mailer.js           # Nodemailer SMTP email dispatcher
│   │   └── memStore.js         # In-memory hybrid store when MongoDB is offline
│   ├── firebase-service.js     # Backend Firebase Realtime Database bridge
│   └── .env.example            # Safe environment template
│
├── archive/                    # Archived legacy assets (excluded from production)
│   ├── built-assets/           # Deprecated Vite 3D landing assets
│   ├── landing-react-3d/       # Old React + Three.js landing source
│   ├── public_html-php/        # Legacy PHP 8 + SQLite prototype
│   ├── scratch/                # Diagnostic scripts and debug tools
│   └── tooling/                # Tooling caches (.agents, .taste-skill)
│
└── docs/                       # Project Documentation & Reports
    ├── README.md               # Repository documentation
    ├── STRUCTURE.md            # Architecture and folder layout specification
    ├── RESTRUCTURE_PLAN.md     # Pre-restructure audit and discovery plan
    ├── MIGRATION_MAP.md        # File mapping and relocation reference table
    ├── AUDIT.md                # Initial code audit report
    ├── CHANGELOG.md            # Detailed chronological changelog
    ├── TEST_CHECKLIST.md       # Automated cross-device test matrix
    └── reports/                # Project Word reports (.docx)
```

---

## 🔍 Detailed Component Architecture

### 1. Frontend Core (`index.html` & `app.html`)
- Unified single-page application entrypoint containing both the marketing landing page and the logged-in dashboard shell.
- Zero WebGL/Three.js 3D runtime overhead.
- Clean progressive enhancement through `css/tokens.css`, `css/base.css`, `css/dashboard.css`, and `css/landing.css`.
- Modular script loading from `js/shared/`, `js/auth/`, `js/landing/`, and `js/dashboard/`.

### 2. Universal Redirection Engine (`404.html`, `r.html`, `r/index.html`)
- Supports instant 0ms redirection on static hosts (GitHub Pages) by inspecting `location.pathname` and `location.search`.
- Normalizes `.html` suffixes and forwards to the SPA hash router (`/#dashboard`, `/#login`, `/#pages`, etc.).
- Direct slug lookups first check `localStorage` caches and then redirect to destination URLs.

### 3. Backend Engine (`backend/`)
- **`backend/server.js`**: Core Express orchestrator with CORS, JSON body parser, rate-limiting, MongoDB connection management, and router dispatching.
- **`backend/routes/auth.js`**: Complete authentication lifecycle (registration, 6-digit OTP verification, login, password recovery, Google SSO, and user profile management).
- **`backend/routes/links.js`**: Short link creation (`/api/shorten`), bulk shortening, update, delete, and HTTP 302 redirection (`/r/:slug`, `/go/:slug`).
- **`backend/routes/qr.js`**: QR code CRUD and customization settings.
- **`backend/routes/bio.js`**: Link-in-bio profile configuration and live public mobile views (`/m/:slug`).
- **`backend/routes/analytics.js`**: Real-time click stream aggregation, device breakdowns, referrers, and custom domain management.
- **`backend/routes/billing.js`**: Stripe Checkout integration and webhook lifecycle.
- **`backend/routes/assist.js`**: HEA Assist AI smart URL suggestions and automated title heuristics.
