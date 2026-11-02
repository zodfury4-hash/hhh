# 🚀 HEA Link — Complete Architecture & File Structure

This document outlines the full directory structure, architecture, routing, and role of every file in the **HEA Link** project.

---

## 📁 Project Directory Tree

```text
d:\github\hhh\
│
├── 🌐 1. FRONTEND CORE & UNIVERSAL REDIRECTION
│   ├── index.html                  # Master Single Page Application (SPA) & Marketing Landing Page
│   ├── 404.html                    # Universal GitHub Pages 0-ms Client-Side Redirect Engine
│   ├── r.html                      # Standalone direct short link resolver
│   ├── r/
│   │   └── index.html              # Fallback path redirector for /r/:slug
│   ├── .nojekyll                   # GitHub Pages config (disables Jekyll to serve 404 cleanly)
│   ├── CNAME                       # Production custom domain mapping (healink.store)
│   │
│   └── 📑 Standalone URL Hash Forwarders (Direct Browser Bookmarks)
│       ├── dashboard.html          # Redirects to index.html#dashboard
│       ├── qr-code.html            # Redirects to index.html#qr
│       ├── bio-pages.html          # Redirects to index.html#pages
│       ├── analytics.html          # Redirects to index.html#analytics
│       ├── pricing.html            # Redirects to index.html#pricing
│       ├── solutions.html          # Redirects to index.html#solutions
│       ├── login.html              # Redirects to index.html#login
│       └── ai.html                 # Redirects to index.html#assist
│
├── 🎨 2. STYLING & 3D MOTION ENGINES
│   ├── style.css                   # Cyber-dark glassmorphic design system, modals, hero layout
│   ├── app-shell.css               # Dashboard sidebar, metrics cards, data tables, chat drawer
│   ├── heavy-fx.js                 # Three.js 3D WebGL stage, Lenis smooth scrolling, Framer Motion springs
│   ├── qrcode.js                   # High-density vector QR code rendering engine
│   └── logo.png                    # Brand neon identity asset
│
├── ⚙️ 3. CLIENT-SIDE JAVASCRIPT & REAL-TIME AI
│   ├── app.js                      # URL Shortener, HEA Assist AI (in-chat tools), Forgot Password, Modals
│   └── app-shell.js                # Full dashboard routing, links CRUD, QR studio, bio builder, CSV export
│
├── 🖥️ 4. FULL-STACK BACKEND & DATABASE (Node.js + MongoDB)
│   ├── server.js                   # Express REST API, JWT Auth, Nodemailer OTP, MongoDB 302 redirects
│   ├── models/                     # Mongoose Schemas
│   │   ├── User.js                 # Accounts, hashed passwords, verification & reset OTPs, PRO flag
│   │   ├── Link.js                 # Slugs, destination URLs, click timestamps, IPs, referrers
│   │   ├── QRCode.js               # QR styling configurations, color palettes, scan telemetry
│   │   ├── BioPage.js              # Mobile bio landing pages, social buttons, theme styling
│   │   └── CustomDomain.js         # Custom branded domains & DNS CNAME verification status
│   ├── .env                        # Environment secrets (MongoDB URI, JWT Secret, SMTP credentials)
│   ├── .env.example                # Safe environment template for onboarding
│   ├── package.json                # Project dependencies and startup scripts
│   ├── package-lock.json           # Exact dependency version lock
│   └── run_server.bat              # 1-click Windows startup batch script
│
└── 🗄️ 5. STANDALONE PHP BACKEND MIRROR (Apache / cPanel)
    ├── public_html/                # Classic PHP / SQLite deployment root
    │   ├── index.php               # PHP glassmorphism view
    │   ├── redirect.php            # PHP 302 redirect handler
    │   ├── admin/                  # PHP admin dashboard and authentication
    │   └── inc/                    # PHP database connection and security helpers
    └── data/
        └── app.db                  # Local SQLite database
```

---

## 🔍 Detailed Role & Functionality of Key Files

### 1. `index.html` (Master Landing Page & SPA Container)
* **Hero Section:** URL Shortener with input validation, dynamic live click counters, and Three.js 3D backdrop.
* **Vector QR Code Studio:** Canvas generator with 4 neon color chips and PNG export.
* **Bulk URL Shortener:** Multi-line textarea generating up to 20 links in a single click.
* **Authentication & Forgot Password:** Split-screen auth card supporting Google SSO, Email OTP registration, and 2-step Forgot Password with 6-digit code reset.
* **Interactive Feature Modals:**
  * `#mobileLinksModal`: Deep-linking into iOS/Android apps with SMS fallback.
  * `#devHubModal`: Live REST API tester with copyable cURL, Node.js, and Python snippets.
  * `#trustModal`: Trust & Compliance Center (SOC 2, GDPR, 99.99% SLA).
  * `#reportModal`: The 2026 Click Expectation Report research data.
  * `#salesModal`: Enterprise consultation booking.
  * `#bioPreviewModal`: Live interactive mobile phone mockup simulator.
  * `#analyticsSandboxModal`: Live telemetry charts (device split, top countries).
  * `#mcpModal`: Model Context Protocol agent configuration.
  * `#checkoutModal`: Core PRO monthly/annual subscription checkout.

---

### 2. `app.js` (Client-Side Logic & Real-Time AI)
* **Short Link Generator:** Creates clean 5–6 character random slugs (`generateShortSlug(6)`).
* **Universal Mega Menus:** Links every item in the Products, AI, Solutions, and Resources dropdowns to real-time interactive actions.
* **HEA Assist AI Engine:**
  * Auto-shortens URLs detected in chat with an interactive copy card.
  * Renders live vector QR codes directly in the chat bubble on command (`qr https://...`).
  * Generates high-converting UTM campaign tags on demand.
  * Calls backend `/api/ai/ask` or falls back to intelligent local marketing heuristics.
* **Forgot Password Engine:**
  * Handles Step 1 (email submission, OTP dispatch) and Step 2 (code validation, password reset).
  * Works both with the live Node.js server and client-side offline mode.

---

### 3. `app-shell.js` (Dashboard & Workspace Application)
* **Single Page Application Routing:** Manages active views without page reloads:
  * `#dashboard`: Overview cards, quick actions, recent activity.
  * `#links` / `#create-link`: Comprehensive links table with real-time search, copy, delete, and CSV export.
  * `#qr`: QR Code Studio with color palette chips and PNG download.
  * `#pages`: Mobile Link-in-Bio page builder with theme selector.
  * `#analytics`: Real-time traffic analytics (Mobile 72%, Desktop 24%).
  * `#campaigns` / `#utm`: UTM parameter generator.
  * `#domains`: Custom branded domains with DNS CNAME verification.
  * `#integrations`: Slack, Zapier, Webhook, Shopify, Canva, HubSpot connections.
  * `#settings`: Profile editor, API token generator, and security controls.

---

### 4. `server.js` (Full-Stack Express & MongoDB Backend)
* **Authentication Endpoints:**
  * `POST /api/auth/register`: Creates unverified account, sends 6-digit OTP via Nodemailer SMTP.
  * `POST /api/auth/verify-email`: Verifies 6-digit code, issues JWT token.
  * `POST /api/auth/login`: Authenticates user with hashed Bcrypt password.
  * `POST /api/auth/forgot-password`: Generates 6-digit reset code and emails user.
  * `POST /api/auth/reset-password`: Verifies reset code and updates Bcrypt password hash.
* **Link Management Endpoints:**
  * `POST /api/shorten`: Shortens URL and persists to MongoDB.
  * `GET /api/links`: Fetches links belonging to authenticated user.
  * `DELETE /api/links/:slug`: Deletes short link.
  * `GET /r/:slug` & `/:slug`: HTTP 302 redirect engine with click telemetry.
* **AI Endpoints:**
  * `POST /api/ai/ask`: Real-time conversational AI marketing engine.

---

### 5. `404.html` & `.nojekyll` (GitHub Pages Universal Redirection)
* On static hosts like GitHub Pages, servers do not support custom Node.js routes out of the box.
* Whenever a user navigates to `https://healink.store/r/:slug` or `/:slug`, GitHub Pages serves `404.html`.
* `404.html` reads the slug from the URL path, looks up the target destination in `localStorage`, and instantly executes `window.location.replace(targetUrl)` in **0 milliseconds**.
* `.nojekyll` guarantees that GitHub Pages does not run Jekyll, preventing 404 or file-filtering bugs.

---

### 6. `heavy-fx.js` (3D WebGL & Motion Physics)
* **Three.js WebGL Stage:** 3D glowing neon orbital rings with subtle floating sphere dynamics.
* **Lenis Smooth Scrolling:** 60fps momentum scroll without layout shifts.
* **Framer Motion / Motion One:** Spring physics on buttons, badge interactions, and floating HUD telemetry cards.

---

## 🚀 How to Run the Project

### Option A: Static Frontend Mode (GitHub Pages / Local Browser)
1. Open `index.html` directly in any web browser or deploy to GitHub Pages.
2. All frontend features (Shortening, Vector QR Studio, HEA Assist AI, Bio Pages preview, Modals, 404 Redirection) work out of the box with zero setup.

### Option B: Full-Stack Mode (Node.js + MongoDB + SMTP)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` with your MongoDB connection string and SMTP credentials.
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.
