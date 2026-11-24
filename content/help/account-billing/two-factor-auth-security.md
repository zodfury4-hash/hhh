---
title: Two-Factor Authentication and Security
category: account-billing
summary: Protect your account and links with email verification codes, secure session cookies, and strong passwords.
updated: 2026-11-20
keywords: 2fa, two-factor auth, account security, password security, session cookies
order: 3
---

# Two-Factor Authentication and Security

Securing your link infrastructure is vital to prevent unauthorized modifications or hijacking of critical marketing routes.

## Email OTP Verification

During registration and password recovery, HEA Link dispatches a cryptographically secure 6-digit one-time password (OTP) to your verified email:
- OTP codes remain valid for exactly 15 minutes.
- Codes are single-use and rate-limited against brute-force verification attempts.
- Development mode leaks and predictable seeds are strictly blocked in production.

## Password Guidelines
All account passwords must be at least 8 characters in length and are hashed using salted PBKDF2/scrypt before database storage.

## Session Management
- Authentication tokens use industry-standard JSON Web Tokens (JWT) signed with high-entropy HMAC keys.
- Tokens are transmitted via secure, HttpOnly, SameSite cookies or explicit `Authorization: Bearer` headers.
- Signing out from the dashboard invalidates the local session across all active browser windows.
