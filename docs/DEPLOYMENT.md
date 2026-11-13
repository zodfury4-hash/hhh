# HEA Link Production Deployment Guide

This guide describes how to deploy HEA Link to **Render** (Node.js web service) with a managed **MongoDB Atlas** cluster.

---

## 1. Database Provisioning (MongoDB Atlas)

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** &rarr; **Add IP Address** &rarr; Select `0.0.0.0/0` (Allow Access from Anywhere) or the static IP range of your Render outbound IPs.
3. Go to **Database Access** &rarr; **Add New Database User**:
   - Authentication Method: Password
   - Database User Privileges: `Read and write to any database`
4. Go to **Clusters** &rarr; **Connect** &rarr; **Connect your application**:
   - Copy the SRV connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/healink?retryWrites=true&w=majority
   ```
5. **Backups:** Under Atlas cluster settings, enable **Continuous Cloud Backups** (point-in-time recovery) or Daily Snapshots.

---

## 2. Web Service Deployment (Render)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository (`zodfury4-hash/hhh`).
4. Configure service parameters:
   - **Name:** `hea-link`
   - **Region:** Frankfurt (EU) or Oregon (US)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build:html`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. Click **Advanced** &rarr; **Add Environment Variables**:

| Variable Name | Example Value / Purpose |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (or leave default, Render sets `PORT` automatically) |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.abcde.mongodb.net/healink` |
| `JWT_SECRET` | *(64-character random string, e.g. run `openssl rand -hex 32`)* |
| `CORS_ORIGIN` | `https://healink.store,https://www.healink.store` |
| `ADMIN_EMAIL` | `admin@healink.store` |
| `ADMIN_PASSWORD` | *(Secure initial admin password, min 12 chars)* |
| `ADMIN_NAME` | `HEA Link Admin` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `SMTP_HOST` | `smtp.gmail.com` (or SendGrid / Postmark) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `noreply@healink.store` |
| `SMTP_PASS` | *(Application-specific SMTP password)* |
| `EMAIL_FROM` | `"HEA Link" <noreply@healink.store>` |
| `GOOGLE_SAFE_BROWSING_KEY` | *(Optional Google Safe Browsing API Key)* |

6. Click **Create Web Service**. Render will clone, build, and launch the service with zero downtime.

---

## 3. Stripe Webhook Configuration

1. In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), click **Add endpoint**.
2. **Endpoint URL:** `https://your-service.onrender.com/api/stripe/webhook` (or `https://healink.store/api/stripe/webhook`).
3. **Events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** (`whsec_...`) and paste it into Render environment variables as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Custom Domain & HTTPS Setup

1. In Render, go to your Web Service &rarr; **Settings** &rarr; **Custom Domains**.
2. Add your custom domains:
   - `healink.store`
   - `www.healink.store`
3. Update your DNS provider (Cloudflare, Namecheap, GoDaddy):
   - **Type:** `CNAME` | **Name:** `www` | **Value:** `hea-link.onrender.com`
   - **Type:** `A` (or `ANAME`/`ALIAS`) | **Name:** `@` | **Value:** `216.24.57.1` (Render's root IP)
4. Render automatically provisions and renews a free Let's Encrypt SSL certificate for all domains.

---

## 5. Verification & Health Monitoring

1. Test health check:
   ```bash
   curl -i https://healink.store/health
   # Expected response: HTTP 200 {"ok":true,"status":"healthy","database":"connected",...}
   ```
2. Run test short link redirect:
   ```bash
   curl -I https://healink.store/<slug>
   # Expected response: HTTP 302 Found, Location: <destination>
   ```
