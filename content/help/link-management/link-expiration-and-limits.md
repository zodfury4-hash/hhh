---
title: Setting Link Expiration Dates and Click Limits
category: link-management
summary: Automatically deactivate promotional links based on a future date/time or after reaching a maximum click quota.
updated: 2026-11-20
keywords: link expiration, click limits, 410 gone, temporary links, flash sale
order: 2
---

# Setting Link Expiration Dates and Click Limits

Automate the lifecycle of limited-time promotions, event RSVPs, promo discount codes, and beta invites by configuring expiration boundaries.

## Setting an Expiration Date

1. In the link creation modal or link settings drawer, toggle **Link Expiration**.
2. Select your target **Expiration Date & Time** in UTC.
3. Save the link.

Once the clock reaches this timestamp, our redirection engine immediately stops forwarding visitors and responds with an **HTTP 410 Gone** status.

## Configuring Maximum Click Limits

You can optionally configure a hard ceiling on the number of successful redirects:
- Example: Set **Max Clicks** to `500` for a first-500 customers discount drop.
- Each human redirect decrements the remaining budget atomically via MongoDB `$inc` operations, preventing race conditions during viral traffic spikes.
- Search engine crawlers and web preview bots (e.g. Slackbot, Discordbot) are detected and filtered, ensuring bot checks do not consume your promotional click quota.

## Custom Expiration Notice

When an expired or maxed-out link is visited, visitors see a clean notification indicating that the promotional offer has concluded, preventing broken-page confusion.
