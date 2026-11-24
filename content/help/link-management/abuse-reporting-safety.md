---
title: Link Safety and Abuse Reporting
category: link-management
summary: Learn how HEA Link protects visitors from malware, phishing, and scam links, and how to file abuse reports.
updated: 2026-11-20
keywords: abuse report, phishing, malware, link safety, ssrf protection, blocklist
order: 5
---

# Link Safety and Abuse Reporting

HEA Link maintains a zero-tolerance policy regarding phishing, malware distribution, credential theft, and spam abuse.

## Automated Threat Protection

Every link submitted to HEA Link passes through automated multi-layer security filters:
- **SSRF Prevention:** Private IP addresses (e.g. `127.0.0.1`, RFC1918 internal subnets `10.0.0.0/8`, `192.168.0.0/16`, and cloud metadata IP `169.254.169.254`) are strictly rejected.
- **Dangerous Schemes:** Non-web protocols such as `javascript:`, `data:`, `file:`, and `vbscript:` are permanently disallowed.
- **Phishing Blocklist:** Known malicious domains, IP loggers (e.g. `grabify.link`, `iplogger.org`), and flagged phishing origins are blocked at creation time.

## Reporting a Malicious Link

If you discover a link violating our Acceptable Use Policy:
1. Navigate to the public abuse report endpoint at `/api/abuse/report` or contact `support@healink.store`.
2. Provide the offending short URL and specify the violation category (`phishing`, `malware`, `spam`, `copyright`).
3. Reports are reviewed by our trust and safety team, and verified violations are immediately deactivated globally.
