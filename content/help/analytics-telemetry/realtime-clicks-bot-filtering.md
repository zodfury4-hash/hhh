---
title: Real-Time Click Streaming and Bot Filtering
category: analytics-telemetry
summary: Monitor live visitor clicks via Server-Sent Events (SSE) and learn how automated bot crawlers are filtered.
updated: 2026-11-20
keywords: real-time analytics, sse, bot filtering, crawler detection, live stream
order: 3
---

# Real-Time Click Streaming and Bot Filtering

Evaluating campaign launches in real-time requires instantaneous telemetry without requiring page refreshes or polling loops.

## Server-Sent Events (SSE) Live Stream
The Analytics pane connects to `/api/analytics/stream` using HTML5 Server-Sent Events (SSE). When visitors click any of your links anywhere in the world, event payloads stream directly to your dashboard in milliseconds.

## Bot Filtering Rules
Search engines, social media platforms, and messaging apps automatically deploy automated crawlers to generate link previews (e.g., WhatsApp link previews, Twitter cards, Slack unfurlers).
- **User-Agent Parsing:** Using `ua-parser-js` and comprehensive crawler pattern matching, HEA Link detects bots like Googlebot, Bingbot, Twitterbot, Discordbot, and Applebot.
- **Bot Flagging:** Automated visits are tagged with `isBot: true` in the `Click` model.
- **Reporting Isolation:** Bot checks are segregated from human engagement statistics and do not decrement link click limits.
