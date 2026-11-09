# ⚡ HEA Link — Universal Short Links, Vector QR Studio & Mobile Bio Pages

A full-stack, enterprise-grade URL shortener, vector QR code generator, and link-in-bio platform built with a high-performance **Modern Glassmorphic UI**, **Responsive CSS Design Tokens**, **Progressive Scroll Animations**, and **Node.js + Express + MongoDB**.

🌐 **Live Website:** [https://www.healink.store](https://www.healink.store)

---

## 🌟 Core Highlights

* 🔗 **Clean Short Slugs:** Generates 5–6 character random alphanumeric slugs (e.g. `healink.store/r/7xK9p2`).
* ⚡ **Universal 0ms Redirection:** Dual-mode redirection working on GitHub Pages via `404.html` and on Node.js via HTTP 302 with click telemetry.
* 🤖 **HEA Assist AI (Real-Time In-Chat Tools):** Auto-shorten links directly in chat, render live vector QR codes in chat bubbles, and generate UTM campaign tags on demand.
* 🔑 **2-Step Forgot Password System:** Automated 6-digit OTP reset codes sent via Nodemailer SMTP with instant on-screen testing fallback and auto-login.
* ▦ **Vector QR Studio:** Real-time canvas QR rendering with 4 neon color palettes and high-resolution PNG/SVG download.
* 📦 **Bulk URL Shortener:** Shorten up to 20 links in a single batch with 1-click copy.
* 📱 **Mobile Link-in-Bio Studio:** Live smartphone frame simulator with customizable social links and themes.
* 👑 **Core PRO Upgrade:** Interactive monthly/annual checkout modal with dynamic 20% discount calculations and instant PRO membership activation.
* 🚀 **Responsive & Motion Suite:** Mobile-first architecture tested across 14 device viewports, desktop smooth scrolling (Lenis), and hardware-accelerated intersection reveals.

---

## 📁 Project Architecture & Directory Structure

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

## 🚀 Getting Started

### 1. Static Mode (GitHub Pages / Standalone Browser)
Open `index.html` in any web browser. All frontend capabilities, QR generation, local AI heuristics, and `404.html` redirection work autonomously with zero dependencies.

### 2. Full-Stack Mode (Node.js + Express)
```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
# Copy .env.example to .env and configure MONGODB_URI, JWT_SECRET, and SMTP credentials:
cp .env.example .env

# 3. Start development server
npm start
```
The server will boot at [http://localhost:3000](http://localhost:3000):
- **Landing Page:** [http://localhost:3000#home](http://localhost:3000#home)
- **Dashboard:** [http://localhost:3000#dashboard](http://localhost:3000#dashboard)
- **API Health:** [http://localhost:3000/api/config](http://localhost:3000/api/config)

### 3. Windows 1-Click Launch
Double-click `run_server.bat` to launch the Node.js development server and open the application in your default browser.

---

## 🌐 Deployment Guidelines

- **GitHub Pages:** Set publishing source to `main` branch root `/`. `CNAME`, `.nojekyll`, and `404.html` ensure direct short-link routing and custom domain resolution.
- **Vercel:** Connect repository. `vercel.json` automatically maps API endpoints through `@vercel/node` and serves static assets.
- **Docker / VPS:** Run `npm start` (or `node server.js`). Reverse proxy port 3000 through Nginx or Caddy.

---

## 🛡️ License
ISC © 2026 HEA Link Team. All rights reserved.
