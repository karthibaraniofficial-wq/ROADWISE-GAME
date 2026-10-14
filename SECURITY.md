# Security Policy — ROADWISE

## 1. Supported Versions

| Version | Supported | Security Maintenance |
|---|---|---|
| 1.0.x (Current) | ✅ Yes | Full active security and bugfix patches |
| < 1.0.0 | ❌ No | Deprecated development prototypes |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability within ROADWISE, please notify the lead release team privately:

- **Email**: [karthibaraniofficial@gmail.com](mailto:karthibaraniofficial@gmail.com)
- **Subject**: `[SECURITY VULNERABILITY] ROADWISE — <Brief Description>`

Please include:
1. Steps to reproduce or proof-of-concept code.
2. Affected components (e.g., Firebase Authentication, Firestore rules, input sanitization).
3. Any known mitigations.

We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure timeline. Please do **not** file public GitHub issues for sensitive security vulnerabilities.

---

## 3. Security Standards & Best Practices

- **Zero Hardcoded Secrets**: No private API keys or service-account credentials are ever checked into git.
- **Tenant Isolation**: Cloud Firestore security rules strictly enforce `request.auth.uid == userId`.
- **Negative Balance Protection**: All financial transactions (vehicle purchases, upgrades) are clamped and validated.
- **Offline Safety**: Network interruptions never delete or destroy valid local save slots.
