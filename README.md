# ⚡ HEA Link — Universal Short Links, Vector QR Studio & Mobile Bio Pages

A full-stack, enterprise-grade URL shortener, vector QR code generator, and link-in-bio platform built with a high-performance **Glassmorphic Cyber-Dark UI**, **Three.js 3D WebGL**, **Framer Motion**, and **Node.js + Express + MongoDB**.

🌐 **Live Website:** [https://www.healink.store](https://www.healink.store)

---

## 🌟 Core Highlights

* 🔗 **Clean Short Slugs:** Generates 5–6 character random alphanumeric slugs (e.g. `healink.store/r/7xK9p2`).
* ⚡ **Universal 0ms Redirection:** Dual-mode redirection working on GitHub Pages via `404.html` and on Node.js via HTTP 302 with click telemetry.
* 🤖 **HEA Assist AI (Real-Time In-Chat Tools):** Auto-shorten links directly in chat, render live vector QR codes in chat bubbles, and generate UTM campaign tags on demand.
* 🔑 **2-Step Forgot Password System:** Automated 6-digit OTP reset codes sent via Nodemailer SMTP with instant on-screen testing fallback and auto-login.
* ▦ **Vector QR Studio:** Real-time canvas QR rendering with 4 neon color palettes and high-resolution PNG download.
* 📦 **Bulk URL Shortener:** Shorten up to 20 links in a single batch with 1-click copy.
* 📱 **Mobile Link-in-Bio Studio:** Live smartphone frame simulator with customizable social links and themes.
* 👑 **Core PRO Upgrade:** Interactive monthly/annual checkout modal with dynamic 20% discount calculations and instant PRO membership activation.
* 🎨 **Three.js WebGL & Framer Motion:** 3D glowing orbital stage, Lenis 60fps smooth scrolling, and spring physics on every interaction.

---

## 📁 Project Architecture & Files Structure

```text
d:\github\hhh\
│
├── 🌐 Frontend Core & Routing
│   ├── index.html                  # Master SPA Landing Page & App Shell Container
│   ├── 404.html                    # Universal GitHub Pages 0-ms Client-Side Redirect Engine
│   ├── r.html                      # Standalone Direct Short Link Resolver
│   ├── r/index.html                # Path Fallback Redirector (/r/:slug)
│   ├── .nojekyll                   # GitHub Pages Jekyll bypass
│   ├── CNAME                       # Production Custom Domain (healink.store)
│   │
│   └── 📑 Standalone URL Forwarders (Direct Bookmarks)
│       ├── dashboard.html          ──> index.html#dashboard
│       ├── qr-code.html            ──> index.html#qr
│       ├── bio-pages.html          ──> index.html#pages
│       ├── analytics.html          ──> index.html#analytics
│       ├── pricing.html            ──> index.html#pricing
│       ├── solutions.html          ──> index.html#solutions
│       ├── login.html              ──> index.html#login
│       └── ai.html                 ──> index.html#assist
│
├── 🎨 Styling & 3D Motion
│   ├── style.css                   # Cyber-dark Glassmorphic UI & Modal Systems
│   ├── app-shell.css               # Dashboard Layout, Metrics, Sidebar & Tables
│   ├── heavy-fx.js                 # Three.js 3D WebGL Canvas, Lenis Scroll, Framer Motion
│   ├── qrcode.js                   # High-density vector QR code rendering library
│   └── logo.png                    # Brand neon logo asset
│
├── ⚙️ Client-Side JavaScript Logic
│   ├── app.js                      # URL Shortener, Mega Menus, Modals, Forgot Password, HEA Assist AI
│   └── app-shell.js                # Full Dashboard SPA Router, CRUD actions, CSV Export
│
├── 🖥️ Full-Stack Backend & Database (Node.js + MongoDB)
│   ├── server.js                   # Express REST API, JWT, Nodemailer OTP, HTTP 302 Redirects
│   ├── models/
│   │   ├── User.js                 # Users, Hashed Passwords, OTP Codes, Pro status
│   │   ├── Link.js                 # Short Links, Slugs, Clicks History, Referrers, Geo-IPs
│   │   ├── QRCode.js               # QR Designs, Color Palettes, Scan Telemetry
│   │   ├── BioPage.js              # Mobile Bio Profiles, Social Buttons, Themes
│   │   └── CustomDomain.js         # Custom Branded Domains & CNAME Verification
│   ├── .env                        # Environment Secrets (MongoDB URI, JWT Secret, SMTP)
│   ├── package.json                # Dependencies and NPM scripts
│   └── run_server.bat              # Windows 1-click startup script
│
└── 📖 Documentation
    ├── STRUCTURE.md                # Comprehensive Architecture & File Specification
    └── README.md                   # Project Overview & Setup Guide
```

---

## 🚀 Getting Started

### 1. Run via Static Mode (GitHub Pages / Browser)
Simply open `index.html` in your web browser. All frontend capabilities, QR generation, local AI heuristics, and `404.html` redirection work autonomously with zero dependencies.

### 2. Run via Full-Stack Mode (Node.js + MongoDB)
```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
# Add MONGODB_URI, JWT_SECRET, and SMTP credentials

# 3. Start development server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ License
ISC © 2026 HEA Link Team. All rights reserved.
