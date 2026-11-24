---
title: Generating and Managing Developer API Keys
category: developer-api
summary: Authenticate with the HEA Link v1 REST API using live and test API keys with granular scopes and SHA-256 storage.
updated: 2026-11-20
keywords: api keys, authentication, bearer token, sha256, test mode
order: 1
---

# Generating and Managing Developer API Keys

The HEA Link Developer REST API (`/api/v1`) enables automated programmatic creation and management of short links, QR codes, domains, and analytics.

## Live vs Test Keys

HEA Link provides two types of API keys:
- **Live Keys (`hea_live_...`):** Affect production records, real customer redirects, and live analytics.
- **Test Keys (`hea_test_...`):** Isolate testing in sandbox mode. Test links are flagged with `isTest: true` and will not pollute production analytics.

## Generating a New API Key

1. Navigate to the **Developer Hub** at `/developers`.
2. Click **Create New API Key**.
3. Select desired permissions / scopes (`links:read`, `links:write`, `qr:create`, `analytics:read`, `domains:manage`).
4. **Copy your secret key immediately:** For security, HEA Link only stores a one-way cryptographic SHA-256 hash. The plaintext secret is shown only once and cannot be recovered if lost.

## Authenticating Requests
Include your API key in either of the following HTTP request headers:
```http
Authorization: Bearer hea_live_9f82...
```
or
```http
X-API-Key: hea_live_9f82...
```
