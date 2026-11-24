---
title: Creating Your First Short Link
category: getting-started
summary: Learn how to paste long destinations, customize back-half slugs, and share instant short links on healink.store.
updated: 2026-11-20
keywords: short link, create url, custom backhalf, slug, getting started
order: 1
---

# Creating Your First Short Link

Short links make long, complex URLs memorable, clean, and trackable across social media, email campaigns, SMS, and print materials.

## Quickstart: Creating a Link in 3 Steps

1. **Paste Destination URL:** Navigate to the HEA Link homepage or your authenticated dashboard. Enter your destination website (must begin with `http://` or `https://`).
2. **Choose a Memorable Slug:** Leave the back-half blank to receive an automated crypto-random slug (e.g., `healink.store/a9f2`), or specify a custom keyword (e.g., `healink.store/spring-sale`).
3. **Click Shorten:** Your link is generated instantly and saved to your account. Click **Copy** to share it anywhere.

## Slug Format & Reserved Keywords

Custom back-halves must adhere to standard web rules:
- Length: Between 2 and 64 characters.
- Allowed characters: Letters (`a-z`, `A-Z`), digits (`0-9`), hyphens (`-`), and underscores (`_`).
- Reserved names: System paths like `login`, `signup`, `api`, `admin`, `help`, `faq`, and `developers` cannot be used as link slugs.

## What Happens When Someone Clicks?

When a visitor navigates to your short link, HEA Link performs a high-speed **HTTP 301 or 302 redirect**:
- Any incoming query parameters (such as `?utm_source=twitter`) and anchor hashes (`#features`) are preserved and passed to the destination URL.
- Real-time click telemetry records the visit anonymously.
- Redirection latency averages under 10 milliseconds.
