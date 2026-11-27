# HEA Link

Full-stack link management, dynamic vector QR code studio, mobile link-in-bio pages, custom domains, audience analytics, and AI assistant (`Node.js / Express 5 + MongoDB / Mongoose + React 18 / Vite + esbuild`).

## 5-Minute Quick Start

### 1. Prerequisites
- **Node.js >= 20** (see `.nvmrc`, Node 22 recommended)
- **MongoDB** (local `mongod` or [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster)

### 2. Install & Configure
```bash
npm install
npm --prefix frontend-landing install
cp .env.example .env
```
Edit `.env` and set at minimum:
- `MONGODB_URI` (local or Atlas URI)
- `JWT_SECRET` (32+ random characters)
- `INTERNAL_ROUTER_SECRET` (random secret for custom-domain ingress)
- Optional integrations: `SMTP_*` (or `EMAIL_PROVIDER=resend|brevo` + `EMAIL_API_KEY`), `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `STRIPE_*`, `ANTHROPIC_API_KEY`

### 3. Build Frontend & Dashboard Bundles
```bash
npm run build:landing
npm run build:dashboard
```

### 4. Seed Optional Admin & Run
```bash
npm run seed:admin   # optional: uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
npm start
```
- Public Landing & Auth: `http://localhost:3000/`
- Dashboard SPA: `http://localhost:3000/app.html#dashboard`
- Health / Readiness: `http://localhost:3000/health` & `http://localhost:3000/ready`
- Developer API Docs & OpenAPI 3.1 spec: `http://localhost:3000/developers` (`/api/v1/openapi.json`)

## Scripts
- `npm start` — Run Express 5 full-stack server (`server.js`)
- `npm run build:landing` — Compile React/Vite landing (`frontend-landing/`) -> `public/index.html` + `public/assets/`
- `npm run build:dashboard` — Bundle modular ES dashboard (`dashboard/src/`) with `esbuild` -> `public/dashboard/app.[hash].js` + rebuild `app.html`
- `npm run build:html` — Compile `partials/index.template.html` -> `app.html` and Help Center pages
- `npm run build:pages` — Sync shared header/footer partials across static marketing pages
- `npm run lint` — ESLint across `backend`, `tests`, `tools`, `scripts`, `dashboard/src`, and `frontend-landing/src`
- `npm run format` — Prettier formatting check/write
- `npm test` — Run all automated security, API, and integration suites
- `npm run test:e2e` — Run browser E2E suite

## Repository Layout
```
├── backend/              Express app, config, controllers, services, models, middleware, routes, mcp
├── frontend-landing/     React + TypeScript + Tailwind landing source (builds to public/assets/)
├── dashboard/src/        Modular ES dashboard source (bundled to public/dashboard/app.[hash].js)
├── public/               Served static assets, hashed bundles, images, favicon, robots.txt, sitemap.xml
├── pages/                Marketing, docs, AI studio, and Help Center HTML pages
├── partials/             HTML layout & dashboard template partials compiled into app.html
├── scripts/              Admin seeding, DB maintenance, migrations, smoke tests
├── tools/                Build scripts (build_landing.js, build_dashboard.js, build_html.js, build_help.js)
├── tests/                Automated unit, API, security, and Playwright browser tests
└── docs/                 ARCHITECTURE.md, DEPLOY.md, API.md, SECURITY.md, BASELINE.md
```
