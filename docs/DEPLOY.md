# HEA Link Production Deployment Checklist (Render)

HEA Link is a full-stack Node.js / Express 5 application with MongoDB/Mongoose. It serves the Vite-built React landing page (`/`), authenticated dashboard workspace (`/app.html`), clean marketing URLs (`/pricing`, `/integrations`, `/developers`, etc.), dynamic short links (`/:slug`), vector QR codes, and API services (`/api/*`).

> **Target Platform:** Render (`render.yaml` blueprint or Dockerfile container).  
> **Never Deploy to GitHub Pages:** Static hosts reject `POST /api/*` requests (`405 Method Not Allowed`) and cannot resolve server routes or MongoDB transactions.

---

## 1. Quick Checklist

- [ ] **Render Blueprint**: Connected to `render.yaml` (Node.js runtime, `npm ci && npm run build:landing`, `npm start`).
- [ ] **Cloud Database**: MongoDB Atlas cluster with active database user credentials and network IP access (`0.0.0.0/0` on dynamic cloud PaaS).
- [ ] **Email Delivery**: SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) OR HTTP API provider (`EMAIL_PROVIDER=resend` / `brevo` + `EMAIL_API_KEY`).
- [ ] **Google OAuth**: `GOOGLE_CLIENT_ID` configured in Render environment and added to Google Cloud Console Authorized JavaScript origins (`https://healink.store`, `https://www.healink.store`).
- [ ] **DNS Records**: Namecheap / Cloudflare DNS configured for `healink.store` (Apex) and `cname.healink.store` (CNAME target).

---

## 2. Render Deployment (`render.yaml`)

1. Connect the GitHub repository in your **Render Dashboard** as a **Blueprint** or **Web Service**.
2. Service specifications:
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build:landing`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
   - **Port**: `3000`
3. Fill in all environment secrets in **Render Dashboard → Environment**.

---

## 3. Required Production Environment Variables

| Variable | Requirement & Description |
| :--- | :--- |
| `NODE_ENV` | Must be `production`. |
| `PORT` | `3000` (Render default). |
| `MONGODB_URI` | **Required.** Must be a cloud connection string (e.g. `mongodb+srv://...`). Localhost/127.0.0.1 triggers a fatal startup error in production. |
| `JWT_SECRET` | **Required.** At least 32 cryptographically random characters (`openssl rand -hex 32`). Weak placeholders fail validation. |
| `INTERNAL_ROUTER_SECRET` | **Required.** Secret token for internal proxy and domain validation routes. |
| `CORS_ORIGIN` | **Required.** Comma-separated allowed origins: `https://healink.store,https://www.healink.store`. |
| `PRIMARY_HOSTS` | `healink.store,www.healink.store` |
| `CNAME_TARGET` | `cname.healink.store` |
| `EMAIL_PROVIDER` & `EMAIL_API_KEY` *(or `SMTP_*`)* | **Required.** Email transport for verification OTPs and password resets. In production, startup fails if both are missing. |
| `GOOGLE_CLIENT_ID` | **Required.** Google OAuth2 Client ID for Google Sign-In. Startup fails in production if missing. |
| `APPLE_CLIENT_ID` | **Optional.** Apple Services ID. **Note:** Apple Sign-In stays completely hidden in the UI unless `APPLE_CLIENT_ID` is set. |
| `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` | **Optional.** Stripe billing for Pro upgrades and webhook processing. |
| `INTEGRATIONS_ENC_KEY` | Recommended 64-character hex key for encrypting webhook credentials at rest. |

---

## 4. DNS Configuration for `healink.store`

Configure the following records on your DNS provider (Namecheap / Cloudflare):

| Type | Host / Name | Target / Value | TTL | Note |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | Render outbound IP / ANAME | Automatic | Directs apex domain to Render. |
| **CNAME** | `www` | `healink-app.onrender.com` | Automatic | Subdomain routing. |
| **CNAME** | `cname` | `healink-app.onrender.com` | Automatic | Target for user-branded custom domains. |

---

## 5. Third-Party Console Configurations

### Google Cloud Console (OAuth 2.0 Credentials)
1. Go to **APIs & Services → Credentials → OAuth 2.0 Client IDs**.
2. Under **Authorized JavaScript origins**, add:
   - `https://healink.store`
   - `https://www.healink.store`
3. Under **Authorized redirect URIs**, add:
   - `https://healink.store`
   - `https://www.healink.store`
4. Save and allow 2–3 minutes for edge propagation.

### Apple Developer (Services ID)
- If configuring Apple Sign-In, add `healink.store` to Domains & Return URLs (`https://healink.store/api/auth/apple`).
- When `APPLE_CLIENT_ID` is not supplied, the Apple Sign-In button automatically remains hidden in all login and signup modals.

---

## 6. Verification & Health Monitoring

1. **Liveness Check**:
   ```bash
   curl -s https://healink.store/health
   # Expected: 200 {"ok":true,"status":"healthy","database":"connected","environment":"production"}
   ```
2. **Readiness Check**:
   ```bash
   curl -s https://healink.store/ready
   # Expected: 200 {"ready":true,"checks":{"db":true,"jwt":true,"email":true}}
   ```
3. **Route Validation**:
   - `GET /` $\rightarrow$ 200 (React landing)
   - `GET /app.html#dashboard` $\rightarrow$ 200 (Dashboard workspace)
   - `GET /pricing` $\rightarrow$ 200
   - `GET /integrations` $\rightarrow$ 200
   - `GET /developers` $\rightarrow$ 200
   - `POST /api/auth/login` (empty body) $\rightarrow$ 400 (Never 405 Method Not Allowed)
