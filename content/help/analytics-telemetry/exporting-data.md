---
title: Exporting Analytics Data in CSV and JSON
category: analytics-telemetry
summary: Stream raw link performance and visitor click records directly into spreadsheets, BI dashboards, and warehouse pipelines.
updated: 2026-11-20
keywords: export data, csv export, json export, streaming analytics, bi pipeline
order: 4
---

# Exporting Analytics Data in CSV and JSON

HEA Link provides direct streaming export endpoints for importing link metrics and click telemetry into Google Sheets, Microsoft Excel, Tableau, or data warehouses.

## Available Export Endpoints

- **Links CSV:** `GET /api/export/links.csv` — Full inventory of your links with title, short slug, destination, total clicks, QR scans, and creation dates.
- **Links JSON:** `GET /api/export/links.json` — Structured JSON array of your link catalog.
- **Clicks CSV:** `GET /api/export/clicks.csv` — Granular click records including timestamp, slug, country, city, device, browser, OS, referrer, and UTM parameters.
- **Clicks JSON:** `GET /api/export/clicks.json` — High-fidelity NDJSON/JSON stream for automated ETL pipelines.

## How to Export from the Dashboard

1. Navigate to **Analytics** (`#analytics`) or **Integrations** (`/integrations`).
2. Select your desired timeframe (Last 7 Days, Last 30 Days, or All Time).
3. Click **Export CSV** or **Export JSON**. Your browser will stream the file directly to your downloads folder.
