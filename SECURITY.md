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

- **Zero Hardcoded Secrets**: No private API keys or service-account credentials are ever checked into git. The tracked `.env` file has been completely removed from git history and `.gitignore` enforces strict exclusion.
- **Firebase Web API vs. Service Account Architecture**:
  - The Firebase web API configuration (`apiKey`, `projectId`, `appId`) identifies the client project to Google Firebase APIs and is public by design for browser apps.
  - No administrative private keys, Firebase service-account tokens, or secret credentials are included in the frontend bundle.
- **Tenant Isolation & Access Control**: Cloud Firestore security rules strictly enforce `request.auth.uid == userId` for all read, write, update, and delete operations on `/users/{userId}`, `/users/{userId}/gameSaves/{saveId}`, and `/users/{userId}/missionHistory/{missionId}`.
- **Strict Payload & Schema Constraints**:
  - Maximum document payload size is capped at 200 KB (`request.resource.size() < 200 * 1024`).
  - Save names are constrained between 1 and 40 characters (`saveName.size() >= 1 && saveName.size() <= 40`).
  - Immutability of creation timestamps: `request.resource.data.createdAt == resource.data.createdAt` is enforced on updates.
  - Nested progression data (`profile.currencyINR >= 0`, `profile.safetyScore >= 0 && profile.safetyScore <= 100`, `profile.level >= 1`) is strictly validated against tampering.
- **Negative Balance & Economy Protection**: All financial transactions (vehicle purchases, engine/brake upgrades, paint shop) validate available currency client-side and in Firestore rules to prevent negative balances.
- **Offline & Conflict Safety**: Network interruptions never delete or destroy valid local save slots. Offline gameplay is preserved through indexed localStorage slots.
- **Dependency Audit Posture**: Transitive dependency notices in `@grpc/grpc-js` within `@firebase/firestore` pertain exclusively to server-side Node.js gRPC listeners and do not affect browser-side WebGL client execution.

