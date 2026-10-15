# Antigravity Project Instructions — ROADWISE

## Backend Integration
- **Platform**: Google Firebase
- **Project ID**: `roadwise-e5b11`
- **Web App ID**: `1:862417180172:web:bbded7ab3cc18d8276c029`
- **Active Skills**: Always use the `firebase-agent` skill for any backend, auth, or database tasks.

## Authentication
1. **Email / Password**: Full registration, login, verification, and reset flow.
2. **Google Sign-In**: Popup and full-page redirect flow.
3. **Phone Authentication**: SMS 6-digit OTP verification via invisible reCAPTCHA.
4. **Guest Mode**: Offline instant access fallback.

## Database (Cloud Firestore)
- `users/{uid}`: Player profile, XP, rating, currency.
- `users/{uid}/gameSaves/{slotId}`: Multi-slot cloud saves.
- `users/{uid}/missionHistory/{missionId}`: Mission delivery audits.
- Strict security rules in `firestore.rules`.
