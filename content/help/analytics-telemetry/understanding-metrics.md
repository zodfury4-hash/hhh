---
title: Understanding Total Clicks vs Unique Visitors
category: analytics-telemetry
summary: Understand how HEA Link measures total clicks, unique visitors, and QR scans with privacy-first salted hashing.
updated: 2026-11-20
keywords: analytics metrics, total clicks, unique visitors, qr scans, click telemetry
order: 1
---

# Understanding Total Clicks vs Unique Visitors

HEA Link delivers real-time visitor intelligence across three primary key performance indicators (KPIs):

## 1. Total Clicks
**Total Clicks** represents the cumulative number of times any visitor or device triggered your short URL. If one individual clicks your link 5 times in an hour, it counts as 5 total clicks.

## 2. Unique Visitors
**Unique Visitors** measures the distinct human audience members who engaged with your link within a given time period.
- **Privacy-First Salted IP Hash:** To protect personal data and comply with global privacy standards (GDPR, CCPA), HEA Link never stores raw visitor IP addresses.
- Instead, each visit calculates an anonymous SHA-256 hash combined with a daily rotating cryptographic salt.
- Multiple clicks from the same device within the same calendar day count as a single unique visitor.

## 3. QR Scans
**QR Scans** records specifically how many visits originated from physical or camera QR code scanners (identified by the `isQr=true` query flag or scanning headers) versus standard web browser links.
