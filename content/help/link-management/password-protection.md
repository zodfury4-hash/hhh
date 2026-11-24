---
title: Password-Protecting Sensitive Short Links
category: link-management
summary: Secure private files, internal wikis, and investor decks by locking your short links behind an encrypted password gate.
updated: 2026-11-20
keywords: password protection, encrypted links, private urls, link security, pbkdf2
order: 1
---

# Password-Protecting Sensitive Short Links

Password protection allows you to share confidential links—such as staging previews, investor presentations, unreleased beta APKs, and internal documents—with full peace of mind.

## How to Password Protect a Link

1. When creating or editing a link, toggle the **Password Protection** switch.
2. Enter your chosen password (minimum 4 characters).
3. Save the link.

## What the Visitor Experiences

When a visitor opens a password-protected short link:
1. They are presented with a clean, branded verification screen requesting the access passcode.
2. The destination URL is not disclosed in the HTML source code or headers prior to verification.
3. Upon entering the correct password, a signed session cookie (`hea_auth_<slug>`) is issued granting immediate access and redirecting to the target URL.

## Security Architecture & Brute-Force Safeguards
- **Cryptographic Hashing:** Passwords are never stored in plaintext. They are hashed using PBKDF2 with HMAC-SHA-512 and a random cryptographic salt.
- **Rate Limiting:** Consecutive failed unlock attempts trigger progressive exponential rate limiting to thwart automated dictionary and brute-force attacks.
- **Tenant Isolation:** Unlocking one link does not unlock other password-protected links under the same account.
