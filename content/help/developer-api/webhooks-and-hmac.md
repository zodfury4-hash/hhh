---
title: Setting Up Webhooks and Verifying HMAC Signatures
category: developer-api
summary: Receive real-time HTTP POST notifications when links are created or clicked, and verify HMAC-SHA256 payload integrity.
updated: 2026-11-20
keywords: webhooks, hmac signature, x-hea-signature, real-time events, payload security
order: 3
---

# Setting Up Webhooks and Verifying HMAC Signatures

Outbound webhooks allow your backend systems to react instantly whenever a link is created or clicked.

## Configuring a Webhook
1. Open **Integrations** (`/integrations`).
2. Click **Connect Webhook**.
3. Provide your endpoint HTTPS URL, select events (`link.created`, `link.clicked`), and enter an optional shared signing secret.

## Payload Delivery & Retry Policy
- **SSRF Protection:** Webhook URLs pointing to loopback (`127.0.0.1`), private RFC1918 subnets, or cloud metadata endpoints are strictly rejected.
- **Retries:** Failed delivery attempts (HTTP status non-2xx or timeouts > 5s) retry up to 5 times with exponential backoff.

## Verifying the HMAC-SHA256 Signature
Each delivery includes an `X-HEA-Signature` header calculated using your secret:
```javascript
const crypto = require('crypto');

function verifyWebhook(payloadString, signatureHeader, secret) {
  const [timestampPart, sigPart] = signatureHeader.split(',');
  const timestamp = timestampPart.split('=')[1];
  const signature = sigPart.split('=')[1];

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}
```
Always use timing-safe comparison to prevent timing side-channel attacks.
