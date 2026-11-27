# HEA Link Production Deployment Checklist

This project runs a full-stack Node.js/Express 5 server (`server.js` -> `backend/server.js`) with MongoDB/Mongoose and serves the Vite-built React landing page (`/`), dashboard (`/app.html`), clean marketing URLs (`/pricing`, `/integrations`, `/developers`, etc.), short-link redirects (`/:slug`, `/r/:slug`), and API routes (`/api/*`).

> Do NOT deploy on GitHub Pages. Static hosts reject `POST /api/*` (`405`) and break clean URLs (`404`).

---

## 1. MongoDB Atlas Setup (Database)
1. Create a free **M0** cluster in MongoDB Atlas (`ap-south-1` or `us-east-1` close to your host).
2. Under **Database Access**, create a dedicated user with **Read and write to any database** (e.g. `healink_prod`) and a strong generated password.
3. Under **Network Access**, allow access from your Node host's outbound IPs (or `0.0.0.0/0` only alongside strong credentials + TLS if your PaaS uses dynamic IPs).
4. Copy the SRV connection string (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/healink?retryWrites=true&w=majority`).

## 2. Node Hosting (Render via `render.yaml` or Docker via `Dockerfile`)
### Option A: Render
1. Push your branch to GitHub and create a **Blueprint** or **Web Service** on Render pointing to `render.yaml`.
2. Verify:
   - Build Command: `npm ci && npm run build:landing`
   - Start Command: `npm start`
   - Health Check Path: `/health`
3. Populate every `sync: false` secret in Render **Environment**.

### Option B: Any Container Host (Docker)
Build and run with `Dockerfile` (`node:22-alpine`, non-root `healink` user, built-in `/health` `HEALTHCHECK`):
```bash
docker build -t healink:latest .
docker run -d -p 3000:3000 --env-file .env.production healink:latest
```

## 3. Required Production Environment Variables
| Variable | Requirement in `NODE_ENV=production` |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Required. Must NOT be `localhost` or `127.0.0.1`. |
| `JWT_SECRET` | Required. At least 32 random characters; no placeholder values. |
| `INTERNAL_ROUTER_SECRET` | Required. Must NOT be missing or the default dev value. |
| `CORS_ORIGIN` | Required. Comma-separated origins, e.g. `https://www.healink.store,https://healink.store`. |
| `PRIMARY_HOSTS` | `healink.store,www.healink.store` |
| `CNAME_TARGET` | `cname.healink.store` (or your host CNAME target) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Required for signup & password-reset OTP email delivery. Without SMTP, `/api/config` marks email verification unavailable. |
| `GOOGLE_CLIENT_ID` | Optional. Required to enable Google Sign-In. |
| `APPLE_CLIENT_ID` | Optional. Required to enable Apple Sign-In. |
| `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional. Required for Pro checkout & webhooks. |
| `INTEGRATIONS_ENC_KEY` | Recommended 64-hex-char AES-256 key (`crypto.randomBytes(32).toString('hex')`). |

## 4. DNS Migration (`www.healink.store` away from GitHub Pages)
1. Remove any GitHub Pages A records (`185.199.108-111.153`) and any `*.github.io` CNAME on your DNS provider.
2. Add a `CNAME` record for `www` pointing to your Render/PaaS hostname (e.g. `healink-app.onrender.com`).
3. Configure apex (`healink.store`) ALIAS/ANAME or `A` record as instructed by your host and wait for TLS certificate issuance.

## 5. Third-Party Console Callbacks & Webhooks
- **Google OAuth (Google Cloud Console → Credentials):**
  - Authorized JavaScript origins: `https://www.healink.store`, `https://healink.store`
  - Authorized redirect URIs: `https://www.healink.store`, `https://www.healink.store/#login`
- **Apple Sign-In (Apple Developer → Services ID):**
  - Domains & Subdomains: `www.healink.store`
  - Return URL: `https://www.healink.store/api/auth/apple`
- **Stripe Webhooks (Stripe Dashboard → Developers → Webhooks):**
  - Endpoint URL: `https://www.healink.store/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`
  - Copy the signing secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.
- **SMTP (Gmail App Password / Resend / Brevo):**
  - For Gmail: enable 2-Step Verification, create a 16-char App Password, set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
  - On hosts blocking outbound SMTP port 587/465, set `EMAIL_PROVIDER=resend` or `EMAIL_PROVIDER=brevo` with `EMAIL_API_KEY`.

## 6. Post-Deploy Verification & Rollback
1. Run smoke check:
   ```bash
   node scripts/smoke.js https://www.healink.store
   ```
2. Verify `/health` returns `200`, `/` and `/pricing` return `200`, unknown paths return `404`, and `POST /api/auth/login` with empty body returns `400` (not `405`).
3. **Rollback:** In Render → **Deploys**, select the previous known-good deploy and click **Rollback to this deploy** (or redeploy the prior container image tag). If schema/index changes occurred, restore the latest automated MongoDB Atlas snapshot before rolling back application traffic.

## 7. Observability, Backups & Maintenance Operations
- **Liveness vs Readiness:**
  - `GET /health` reports process health, uptime, and database state (`200` when healthy, `503` when DB degraded).
  - `GET /ready` verifies DB readiness, JWT configuration validity, and mail transport status (`200` ready, `503` not ready).
- **Uptime Monitoring:** Point UptimeRobot / BetterStack HTTP monitor at `https://www.healink.store/ready` (60s interval) with alerts on non-200 responses.
- **Error Tracking & Request Correlation:**
  - Every HTTP request carries `X-Request-Id` and emits redacted structured Pino JSON logs.
  - Set `SENTRY_DSN` in production to forward unhandled `5xx` errors automatically.
- **Database Backups & TTL Retention:**
  - Enable MongoDB Atlas Cloud Backups / continuous snapshots (or M0 daily export via `mongodump`).
  - `clicks` collection includes an automatic TTL index (`expires`) and `{ linkId: 1, timestamp: -1 }` query index.
  - Built-in background cleanup (`backend/utils/cleanup.js`) prunes expired guest links and stale OTP tokens periodically without blocking requests.
