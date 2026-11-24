---
title: API Rate Limits and HTTP Status Reference
category: developer-api
summary: Understand rate limit headers, quotas, idempotency keys, and standard HTTP error response formats.
updated: 2026-11-20
keywords: api rate limits, http status codes, idempotency, 429 too many requests, error handling
order: 2
---

# API Rate Limits and HTTP Status Reference

To maintain optimal reliability for all users, the HEA Link REST API enforces tiered rate limiting based on your account plan.

## Rate Limit Headers
Every response from `/api/v1` returns telemetry headers detailing your quota status:
- `X-RateLimit-Limit`: Maximum requests permitted per 15-minute rolling window.
- `X-RateLimit-Remaining`: Requests remaining in the current window.
- `X-RateLimit-Reset`: Unix epoch timestamp when your quota resets.
- `X-Request-Id`: Unique identifier for tracing and debugging with support.

## Handling HTTP 429 Too Many Requests
If your application exceeds the rate limit, the API responds with:
```json
{
  "error": "Too many requests. Please slow down and try again shortly."
}
```
Implement exponential backoff and inspect `X-RateLimit-Reset` before retrying.

## Idempotency with `Idempotency-Key`
Prevent duplicate link creation caused by network timeouts or retries by sending an `Idempotency-Key` header:
```http
POST /api/v1/links
Idempotency-Key: req_3a91fbc8-9921
```
HEA Link caches the response for 24 hours. Repeating the same request with the same key returns the cached response with `X-Cache: HIT-Idempotency`.
