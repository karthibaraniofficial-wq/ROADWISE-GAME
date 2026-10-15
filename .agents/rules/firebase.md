# Antigravity Workspace Rule: Firebase Backend Integration

This rule instructs Antigravity to always use Google Firebase for all backend operations in this repository.

## Active Firebase Scope
- **Project ID**: `roadwise-e5b11`
- **Web App ID**: `1:862417180172:web:bbded7ab3cc18d8276c029`
- **Region**: `asia-south1`
- **Database**: Cloud Firestore Native `(default)`

## Directives for Antigravity
1. **Always activate and follow the `firebase-agent` skill** when performing tasks related to authentication, user profiles, game saves, or data storage.
2. Maintain support for:
   - Email/password authentication
   - Google Sign-In (with popup and redirect support)
   - Phone Authentication (SMS OTP with reCAPTCHA verifier)
   - Cloud Firestore multi-slot saves under `users/{uid}/gameSaves/{slotId}`
   - Delivery mission history audits under `users/{uid}/missionHistory/{missionId}`
3. Keep security rules in `firestore.rules` synchronized with data access patterns.
4. Ensure non-breaking offline fallback to localStorage whenever network connectivity is interrupted.
