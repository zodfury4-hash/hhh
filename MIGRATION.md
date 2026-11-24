# 🚀 HEA Link Production Migration & Runbook

This runbook guides devops engineers and administrators through migrating HEA Link from the legacy hybrid setup to the high-performance, hardened enterprise architecture (Phases 1, 2, and 3).

---

## 1. What Has Changed

| Component | Legacy Behavior | Modernized Production Behavior |
| :--- | :--- | :--- |
| **Link Passwords** | Stored in plain text; checked via `?pwd=` query param | Hashed with **bcrypt (cost 10)**; verified via **signed HMAC HTTP-only cookies** |
| **Link Expiration & Caps** | Non-atomic check against `clicks.length` | **Atomic `$expr` limit** on database update; returns standard **HTTP 410 Gone** |
| **Click Telemetry** | Unbounded embedded array in `Link` doc (risk of 16MB cap) | Dedicated **`Click` collection** with compound indexes, TTL, and daily-salted privacy hashes |
| **UTM Attribution** | UI URL string builder only; zero click tracking | Destination merge via **WHATWG URL**, click attribution capture, and `$facet` breakdown |
| **Custom Domains** | Instant active status without verification; no host routing | **DNS verification (CNAME/TXT)**, partial unique index, and **strict tenant isolation** |
| **Reverse Proxy / TLS** | None | High-speed ingress ask endpoint: `GET /internal/domain-allowed` |
| **AI Slugs** | Random Math.random suffix generator | Anthropic LLM semantic slug generator with deterministic availability check |
| **HEA Assist AI** | Hardcoded keyword if/else fake replies | Conversational multi-turn assistant with tool calling and user confirmation |
| **Model Context Protocol** | Broken mock file path modal | Official `@modelcontextprotocol/sdk` supporting both SSE and stdio with PAT auth |
| **Developer REST API** | Fake `hea_live_sk_...` key & simulated setTimeout | Real versioned `/api/v1` REST API with OpenAPI 3.1, SHA-256 keys, and idempotency |
| **Integrations & Webhooks** | Inflated "100+ integrations" claim; fake toasts | Honest catalog, AES-256-GCM encryption, HMAC-SHA256 signed webhooks, and streaming CSV/JSON |
| **UTM Campaign Guide** | Scattered UI inputs | Standard GA4 guide at `/resources/utm-guide` with shared `HeaUtm` engine & Schema.org JSON-LD |
| **Help Center & FAQ** | Static unsearchable snippets | 21 Markdown articles, full-text search index, master `content/faq.yml`, and support ticketing |

---

## 2. Environment Variables Specification

Ensure your production `.env` includes the following configuration parameters:

```env
# Server Runtime
PORT=3000
NODE_ENV=production
PRIMARY_HOSTS=healink.store,www.healink.store,localhost,127.0.0.1
TRUST_PROXY=1

# Database & Security
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/healink?retryWrites=true&w=majority
JWT_SECRET=YOUR_SUPER_SECURE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS

# Custom Domains & Ingress
CNAME_TARGET=cname.healink.store
INTERNAL_ROUTER_SECRET=YOUR_STRONG_INTERNAL_ROUTER_SECRET_KEY

# Retention & Telemetry
CLICK_RETENTION_DAYS=400

# Integrations & Encryption (AES-256-GCM 32-byte hex key)
# Generate via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTEGRATIONS_ENC_KEY=YOUR_64_HEX_CHAR_ENCRYPTION_KEY

# Email & Support Desk
SUPPORT_EMAIL=support@healink.store
```

### Key Parameters Description
- `PRIMARY_HOSTS`: Comma-separated list of primary domains that host the application and dashboard. Requests with any other Host header are treated as custom branded domains.
- `TRUST_PROXY`: Configures Express `trust proxy` (set to `1` or your proxy hop count) so `req.ip` correctly resolves client IPs behind Cloudflare/ALB/Nginx.
- `CNAME_TARGET`: The canonical CNAME destination that custom domains point toward.
- `INTERNAL_ROUTER_SECRET`: Secret token used by reverse proxies (e.g. Caddy On-Demand TLS) to query `/internal/domain-allowed`.
- `CLICK_RETENTION_DAYS`: Configures the automatic MongoDB TTL index on the `Click` collection (default 400 days) for automatic privacy compliance.
- `INTEGRATIONS_ENC_KEY`: 32-byte AES-256-GCM key used to encrypt outbound webhook secrets, Slack endpoints, and third-party credentials at rest.
- `SUPPORT_EMAIL`: Inbox destination for escalated support tickets.

---

## 3. Database Migration Procedures

Run migrations in the specified order before restarting the application in production:

### Step 1: Migrate Legacy Embedded Clicks
Unwinds legacy embedded `clicks[]` arrays from `Link` documents into the new `Click` collection and computes persistent counters (`totalClicks`, `humanClicks`, `botClicks`, `scans`):

```bash
node scripts/migrate-clicks.js
```

**Verification:**
The script logs:
- Total link documents processed
- Total click records created in `clicks`
- Execution duration and validation status

---

### Step 2: Migrate Legacy Plaintext Passwords
Finds any link documents containing legacy unhashed `password` strings, hashes them using bcrypt (salt cost 10) to `passwordHash`, and unsets the plaintext `password` property:

```bash
node scripts/hash-link-passwords.js
```

**Verification:**
The script logs:
- Number of protected links updated
- Confirms zero plaintext passwords remain in the database

---

## 4. Verification & Smoke Testing

After applying environment variables and running migrations:

1. **Execute Automated Test Runner:**
   ```bash
   npm test
   ```
   *All 13 test suites (142 tests) must pass with exit code 0:*
   - `tests/baseline.test.js` (Security guardrails & schema validation)
   - `tests/e2e.test.js` (Full end-to-end API lifecycle)
   - `tests/analytics.test.js` (Telemetry, GeoIP, and privacy hashes)
   - `tests/password-expiry.test.js` (HMAC cookie access, 410 Gone, and atomic limits)
   - `tests/utm.test.js` (WHATWG URL merge and multi-channel attribution)
   - `tests/domains.test.js` (DNS verification, reverse-proxy ask endpoint, and tenant isolation)
   - `tests/ai-slugs.test.js` (Semantic slug generation, SSRF guardrails, and quota enforcement)
   - `tests/assist.test.js` (Conversational tool execution and action confirmation safety)
   - `tests/mcp.test.js` (Model Context Protocol SSE handshake, PAT lifecycle, and tool isolation)
   - `tests/api-v1.test.js` (Developer REST API v1, OpenAPI 3.1, and idempotency)
   - `tests/integrations.test.js` (Integrations catalog, AES-256 encryption, and HMAC-signed webhooks)
   - `tests/utm-guide.test.js` (GA4 UTM normalization engine and public interactive builder)
   - `tests/help.test.js` (Help Center articles, search index, FAQ, feedback, and support tickets)

2. **Verify Code Quality:**
   ```bash
   npm run lint
   ```
   *Must exit with 0 errors and 0 warnings.*

3. **Verify Dashboard Compilation:**
   ```bash
   npm run build:html
   ```

---

## 5. Rollback Plan

If unexpected issues occur during deployment:

1. **Revert Application Deployment:**
   Re-deploy the previous container/commit.
2. **Database Compatibility:**
   - The new `passwordHash` field does not interfere with old code. If rolling back, legacy code that does not read `passwordHash` will treat links as unprotected.
   - The `Click` collection is independent of `Link`. The old code reads `link.clicks` if populated.
3. **Rollback Script:**
   To restore plaintext passwords if needed for legacy compatibility, run a rollback script to re-populate `password` from backups.
