# 🌐 Branded Custom Domains Guide: HEA Link

Attach your custom branded domains and subdomains (e.g. `links.yourbrand.com`, `go.company.io`) to HEA Link with automatic SSL, zero-trust tenant isolation, and atomic DNS verification.

---

## 1. How Custom Domains Work

When you attach a branded domain to HEA Link:
1. **Ownership Verification**: Before any domain can route traffic, HEA Link verifies ownership via **CNAME** or **TXT** records. Unverified or pending domains cannot claim or block active traffic.
2. **Strict Tenant Isolation**: Links requested through `https://links.yourbrand.com/promo` **only** resolve links created by the verified owner of `links.yourbrand.com`. A slug created by another user on `healink.store` can never be served from your branded domain.
3. **No Domain Squatting**: Partial unique indexing ensures a pending verification request cannot block the legitimate owner from registering and verifying their domain.

---

## 2. DNS Configuration Instructions

You can verify your domain using either **CNAME Routing** (recommended for subdomains) or **TXT Challenge** (recommended for apex/root domains or pre-launch validation).

### Option A: CNAME Record (Recommended)
Point your branded subdomain directly to HEA Link's edge:

| Record Type | Host / Name | Target / Value | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `links` (or your subdomain) | `cname.healink.store` | Automatic / 300s | **DNS only** (Gray cloud in Cloudflare) |

> [!IMPORTANT]
> If using Cloudflare, set proxy status to **DNS only (Gray cloud)** during initial setup so HEA Link can verify the CNAME target directly.

---

### Option B: TXT Ownership Challenge
If your registrar does not support CNAME or you prefer verifying ownership prior to cutting over traffic:

1. Copy the unique verification token generated upon domain creation:
   `hea-verify-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. Add a TXT record in your DNS provider:

| Record Type | Host / Name | Value | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `_hea-challenge.links` | `hea-verify-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 300s / 1 min |

---

## 3. Registrar-Specific Walkthroughs

### Cloudflare
1. Log in to your Cloudflare dashboard and select your zone.
2. Navigate to **DNS** > **Records** > **Add record**.
3. Type: `CNAME`, Name: `links`, Target: `cname.healink.store`.
4. Switch Proxy status to **DNS only** (gray cloud).
5. Click **Save**.

### Namecheap
1. Go to **Domain List** > click **Manage** next to your domain.
2. Select the **Advanced DNS** tab.
3. Click **Add New Record**:
   - Type: `CNAME Record`
   - Host: `links` (or desired subdomain)
   - Target: `cname.healink.store`
   - TTL: `Automatic`
4. Save changes.

### GoDaddy
1. Navigate to **Domain Portfolio** > select your domain > **DNS**.
2. Click **Add New Record**:
   - Type: `CNAME`
   - Name: `links`
   - Value: `cname.healink.store`
   - TTL: `1/2 Hour`
3. Save changes.

### AWS Route 53
1. Open the Route 53 console and select your **Hosted zone**.
2. Click **Create record**:
   - Record name: `links`
   - Record type: `CNAME`
   - Value: `cname.healink.store`
   - TTL: `300`
3. Click **Create records**.

---

## 4. Reverse Proxy & Ingress Integration (`/internal/domain-allowed`)

If running behind an edge reverse proxy (such as Nginx, Caddy, or Traefik with On-Demand TLS), HEA Link provides a high-speed internal check endpoint to verify whether an incoming Host is registered and active:

### Endpoint Specification
- **Method**: `GET /internal/domain-allowed?domain=<hostname>`
- **Header**: `x-router-secret: <INTERNAL_ROUTER_SECRET>`

#### Success Response (Domain is Active)
```json
{
  "allowed": true,
  "domain": "links.yourbrand.com",
  "ownerEmail": "alex@yourbrand.com",
  "verifiedAt": "2026-11-24T12:00:00.000Z"
}
```

#### Inactive or Unregistered Domain
```json
{
  "allowed": false,
  "domain": "unregistered.com"
}
```

### Example Caddy On-Demand TLS Configuration
```caddyfile
{
    on_demand_tls {
        ask http://127.0.0.1:3000/internal/domain-allowed
    }
}

:443 {
    tls {
        on_demand
    }
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Forwarded-Host {host}
    }
}
```

---

## 5. Security & Verification Guarantees

- **No Domain Takeover**: Active domain claims require verifiable DNS records.
- **Tenant Privacy**: Shortlink analytics and click tracking on custom domains are strictly partitioned to the domain owner's dashboard.
- **Cryptographic Verification**: Challenge tokens use 128-bit cryptographically secure pseudorandom tokens (`crypto.randomBytes(16)`).
