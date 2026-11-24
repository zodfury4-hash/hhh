---
title: Data Retention, Privacy and GDPR Compliance
category: account-billing
summary: Details on how HEA Link handles click retention, salted IP hashing, and GDPR/CCPA data privacy compliance.
updated: 2026-11-20
keywords: data retention, gdpr, privacy policy, 400 day ttl, salted ip hash
order: 4
---

# Data Retention, Privacy and GDPR Compliance

HEA Link is engineered from the ground up to respect visitor privacy and comply with global data protection regulations including the EU General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).

## 400-Day Click Data Retention Policy
Individual raw click telemetry entries in the `Click` collection automatically expire after **400 days** using MongoDB native TTL (Time-To-Live) index expiration:
- This allows full year-over-year seasonal performance comparisons while preventing unbounded data hoarding.
- High-level lifetime counters (`totalClicks`, `totalScans`) stored directly on your `Link` documents are preserved indefinitely.

## Salted Hash Anonymization
HEA Link never logs or retains raw visitor IP addresses in plain text:
- Each redirect generates a daily-salted SHA-256 hash.
- Because the salt rotates daily, visitor behavior cannot be tracked across different calendar days or third-party web domains.

## Data Subject Rights & Deletion
Account holders can request a complete copy of their account data or request full deletion of their user profile and associated links by contacting `privacy@healink.store`.
