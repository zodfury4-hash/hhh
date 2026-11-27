# HEA Link API Reference

Machine-readable OpenAPI 3.1 specification is served live at **`GET /api/v1/openapi.json`** and documented interactively at **`/developers`**.

## Authentication & Sessions
- `GET /api/config` — Public auth/billing feature flags and client IDs.
- `POST /api/auth/register` — Create user + send 6-digit hashed OTP (`503 EMAIL_SERVICE_UNAVAILABLE` in prod if mail unconfigured).
- `POST /api/auth/verify-email` — Verify OTP, issue JWT + `HttpOnly` `hea_token` & `hea_csrf` cookies.
- `POST /api/auth/login` — Authenticate user, issue JWT + cookies.
- `POST /api/auth/logout` — Increment `tokenVersion` (revokes prior JWTs) and clear auth cookies.
- `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- `POST /api/auth/google`, `POST /api/auth/apple` — Verified OAuth ID token login / account linking.

## Core Dashboard Endpoints (Authenticated via Bearer JWT or HttpOnly Cookie + CSRF)
- **Links:** `POST /api/shorten-online`, `GET /api/links`, `POST /api/links`, `POST /api/links/bulk`, `PUT /api/links/:slug`, `DELETE /api/links/:slug`
- **QR Codes:** `GET /api/qrs`, `POST /api/qrs`, `DELETE /api/qrs/:id`
- **Bio Pages:** `GET /api/bios`, `POST /api/bios`, `DELETE /api/bios/:slug`, `GET /m/:slug`
- **Domains:** `GET /api/domains`, `POST /api/domains`, `POST /api/domains/:id/verify`, `DELETE /api/domains/:id`
- **Analytics & Exports:** `GET /api/dashboard/summary`, `GET /api/analytics/overview`, `GET /api/analytics/stream`, `GET /api/export/links.csv|json`, `GET /api/export/clicks.csv|json`
- **Notifications, Integrations & Keys:** `/api/notifications/*`, `/api/integrations/*`, `/api/keys/*`, `/api/tokens/*`, `/api/assist/*`
- **Billing:** `GET /api/stripe/config`, `POST /api/stripe/create-checkout-session`, `GET /api/stripe/verify-session/:sessionId`, `POST /api/stripe/webhook`

## Public REST API v1 (`Bearer hea_live_...` / `X-API-Key`)
- `GET /api/v1/openapi.json`
- `GET /api/v1/me`
- `POST /api/v1/links`, `GET /api/v1/links` (cursor pagination), `GET /api/v1/links/:slug`, `PATCH /api/v1/links/:slug`, `DELETE /api/v1/links/:slug`
- `POST /api/v1/qr`, `GET /api/v1/analytics/overview`, `GET /api/v1/analytics/links/:slug`
