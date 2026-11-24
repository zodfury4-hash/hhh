---
title: Geographic Attribution and Location Accuracy
category: analytics-telemetry
summary: How HEA Link determines country and city locations using edge headers and GeoIP databases without guessing.
updated: 2026-11-20
keywords: geo attribution, country breakdown, geoip, location tracking, cf-ipcountry
order: 2
---

# Geographic Attribution and Location Accuracy

Understanding the geographic distribution of your audience enables you to optimize regional ad spend, schedule social drops at peak local times, and translate landing pages.

## How Country Attribution Works

During redirect processing, HEA Link evaluates location using a priority chain:
1. **Edge CDN Headers:** If deployed behind Cloudflare or a compatible CDN, HEA Link reads the verified edge header `cf-ipcountry` or `x-country`.
2. **Local GeoIP Lookup:** When edge headers are absent (e.g. direct server connections), HEA Link evaluates the visitor's public IP using `geoip-lite`.
3. **No Fabricated Fallbacks:** If the country cannot be resolved with certainty (such as with local testing, loopback requests, or masked proxies), HEA Link marks the visit as **Unknown**. We never substitute hardcoded defaults like "US".

## City-Level Intelligence
For major traffic streams, city-level attribution is extracted alongside the country ISO code, allowing you to review top metro areas in your Analytics overview.
