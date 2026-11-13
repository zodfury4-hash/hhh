# ⚡ HEA Link — Universal Short Links, Vector QR Studio & Mobile Bio Pages

A full-stack, enterprise-grade URL shortener, vector QR code generator, and link-in-bio platform built with a high-performance **Glassmorphic UI**, **Express 5 + Mongoose 9 + Node.js**, **Zod Input Validation**, **Stripe Payment Gateway**, and **Comprehensive Automated Tests**.

🌐 **Live Website:** [https://www.healink.store](https://www.healink.store)  
📖 **Deployment Guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)  
🛡️ **Security Audit & Manual Checklist:** [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

---

## 🌟 Core Highlights

* 🔗 **Fast Redirection (HTTP 302):** Indexed MongoDB lookups with asynchronous click tracking (`setImmediate`) that never blocks user redirection.
* 🛡️ **Hardened Enterprise Security:** Strict SSRF blocking (private IPs, loopback, AWS metadata), dangerous protocol filtering (`javascript:`, `data:`), rate limiting across auth and creation routes, Helmet CSP, and zero client credential leakage.
* 🤖 **HEA Assist AI:** In-chat link copilot, automated UTM campaign tags, and intelligent slug generator.
* 🔑 **Resilient Authentication:** Secure bcrypt hashing, role-based access control (`user` / `admin`), 7-day expiring JWTs with `/api/auth/refresh`, single-use expiring OTP email verification, and Google Sign-In (GIS).
* ▦ **Vector QR Studio:** Real-time canvas QR rendering with neon palettes and high-resolution PNG/SVG export.
* 📱 **Mobile Link-in-Bio Studio:** Live smartphone frame preview, theme selection, and sanitized server-side rendered profile pages.
* 💳 **Stripe PRO Billing:** Secure Stripe Checkout with mandatory webhook signature verification (`STRIPE_WEBHOOK_SECRET`) and idempotent payment processing (`ProcessedPayment` model).
* 🧪 **Automated Testing Suite:** 46 automated tests covering baseline security, input sanitization, and full end-to-end user lifecycles (`npm test`).

---

## 📁 Repository Structure

```text
hhh/
├── .github/workflows/ci.yml    # GitHub Actions Continuous Integration (Lint + Test)
├── backend/                    # Modular Express 5 Application
│   ├── config/index.js         # Centralized environment variable validation
│   ├── middleware/             # Security middleware (auth, rateLimit, validation, dbCheck, errorHandler)
│   ├── models/                 # Mongoose schemas (User, Link, QRCode, BioPage, CustomDomain, AbuseReport, ProcessedPayment)
│   ├── routes/                 # Modular API routers (auth, links, qr, bio, analytics, billing, assist)
│   ├── services/               # Core services (abuse-service.js)
│   ├── utils/                  # Structured logger (Pino), Nodemailer mailer, memStore
│   └── server.js               # Application server with graceful shutdown handlers
├── partials/                   # HTML layout and template components
├── tools/build_html.js         # Automated template compiler producing index.html & app.html
├── tests/                      # Automated test runners
│   ├── baseline.test.js        # Phase 1 Security & Guard test suite (23 tests)
│   ├── e2e.test.js             # Phase 2 End-to-End API test suite (23 tests)
│   └── index.js                # Unified test runner (46/46 passing)
├── docs/                       # Architectural documentation & deployment guides
│   └── DEPLOYMENT.md           # Render + MongoDB Atlas production deployment guide
├── privacy.html                # GDPR/CCPA compliant privacy policy
├── terms.html                  # Terms of Service & acceptable use policy
├── report-abuse.html           # Interactive public abuse reporting portal
├── robots.txt & sitemap.xml    # SEO basics & search crawler definitions
├── database.rules.json         # Locked Firebase RTDB security rules (closed by default)
├── eslint.config.js            # ESLint v10 flat configuration
└── package.json                # Project scripts and dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or higher
- MongoDB instance (local or MongoDB Atlas connection string)

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/zodfury4-hash/hhh.git
cd hhh

# Install project dependencies
npm install

# Copy environment variables template
cp backend/.env.example .env

# Start development server
npm start
```
The server will start at [http://localhost:3000](http://localhost:3000).

---

## 🧪 NPM Scripts

| Command | Description |
|---|---|
| `npm start` | Boots the full-stack server (`backend/server.js`) |
| `npm test` | Runs the automated security & E2E test suites (46 tests) |
| `npm run lint` | Runs ESLint across backend and test directories |
| `npm run format` | Runs Prettier to format codebase |
| `npm run build:html` | Compiles `/partials` into static `index.html` and `app.html` |

---

## 🌐 Production Deployment

Refer to [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step instructions on deploying HEA Link to **Render** or **Railway** with **MongoDB Atlas**, custom domain DNS configuration, and automated SSL.

---

## 🛡️ License
ISC © 2026 HEA Link Team. All rights reserved.
