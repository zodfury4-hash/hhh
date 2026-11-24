---
title: Attaching and Verifying a Custom Domain
category: getting-started
summary: Brand your short links with your own custom apex domain or subdomain using DNS CNAME and TXT ownership verification.
updated: 2026-11-20
keywords: custom domain, cname, dns verification, txt record, branded links
order: 2
---

# Attaching and Verifying a Custom Domain

Branded domains replace the default `healink.store` domain with your organization's own URL (e.g. `links.yourcompany.com/launch`), boosting click-through rates by up to 34%.

## Prerequisites
- Access to your DNS provider (Cloudflare, Namecheap, GoDaddy, AWS Route 53, etc.).
- A dedicated subdomain (e.g., `go.brand.com` or `link.brand.com`) or root domain.

## Step 1: Add the Domain in HEA Link
1. Go to **Dashboard → Custom Domains** or navigate to `/domains`.
2. Enter your fully qualified domain name (e.g. `go.mybrand.com`).
3. Click **Add Custom Domain**. The system will generate a unique verification token: `hea-verify=<token>`.

## Step 2: Configure Your DNS Records
Log into your domain registrar or DNS management portal and add two records:

1. **CNAME Record (Routing):**
   - **Type:** `CNAME`
   - **Host / Name:** `go` (or your chosen subdomain prefix)
   - **Target / Value:** `healink.store`
   - **TTL:** Auto or 300 seconds

2. **TXT Record (Ownership Verification):**
   - **Type:** `TXT`
   - **Host / Name:** `_hea-verify.go` (or `@` for apex domains)
   - **Value:** `hea-verify=<your_verification_token>`
   - **TTL:** Auto or 300 seconds

## Step 3: Verify Ownership
Once your DNS records propagate (typically 2 to 10 minutes), return to the Domains tab and click **Verify Domain**. Our automated DNS resolver checks the TXT challenge. Once confirmed, status switches to **Active**, and all links created under this domain will resolve immediately.
