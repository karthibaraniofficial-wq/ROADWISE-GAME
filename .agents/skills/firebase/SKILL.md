---
name: firebase-agent
description: Comprehensive workflow and architecture for managing Firebase backend services, including Firebase Authentication (Email/Password, Google Sign-In, Phone OTP) and Cloud Firestore database for the ROADWISE driving simulator.
---

# Firebase Agent Skill: Authentication & Cloud Firestore Integration

This skill outlines the procedures, protocols, and modular interfaces for integrating Google Firebase backend services into the ROADWISE 3D driving simulator game.

## Target Project & App Scope
- **Project ID**: `roadwise-e5b11`
- **Web App ID**: `1:862417180172:web:bbded7ab3cc18d8276c029`
- **Region**: `asia-south1` (Mumbai)
- **Database**: Cloud Firestore Native `(default)`

---

## 1. Authentication Modalities

The ROADWISE platform supports three primary authentication methods:

### A. Email & Password
- Registration with client-side credential validation (min 6 chars, email format).
- Login with friendly Firebase error mapping.
- Password reset email workflow.
- Session persistence via `onAuthStateChanged`.

### B. Google Sign-In
- Uses `GoogleAuthProvider` and `signInWithPopup(auth, provider)`.
- Automatically retrieves player's Google displayName, email, and photoURL avatar.
- Upserts the user profile in Firestore `users/{uid}`.

### C. Phone Authentication (SMS OTP)
- Utilizes `RecaptchaVerifier` (invisible or compact mode bound to a container element `recaptcha-container`).
- Triggers `signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier)`.
- Returns a `ConfirmationResult` object stored in application state.
- Player enters the 6-digit SMS OTP, verified via `confirmationResult.confirm(verificationCode)`.
- Creates or retrieves `users/{uid}` profile with the phone credential.

---

## 2. Cloud Firestore Data Schema

All persistent game data is user-scoped and tenant-isolated:

```text
users/{uid}
 ├── displayName: string
 ├── email: string | null
 ├── phoneNumber: string | null
 ├── avatar: string
 ├── playerLevel: number
 ├── totalXP: number
 ├── totalCurrency: number
 ├── safetyRating: number
 ├── createdAt: timestamp
 └── updatedAt: timestamp

users/{uid}/gameSaves/{saveId}
 ├── id: string
 ├── saveName: string
 ├── schemaVersion: number (2)
 ├── updatedAt: timestamp
 ├── profile: PlayerProfile (currency, XP, level, ratings, stats)
 ├── vehicles: Record<VehicleId, { isUnlocked, upgrades, colorIndex }>
 ├── unlockedMissions: number[]
 └── completedMissions: number[]

users/{uid}/missionHistory/{missionId}
 ├── missionId: number
 ├── missionTitle: string
 ├── score: number
 ├── earnedCurrency: number
 ├── violations: ViolationReport[]
 └── completedAt: timestamp
```

---

## 3. Fallback & Safe Degradation
- If network connection drops or Firebase services are temporarily unavailable, the app falls back to `ROADWISE_SAVES_V2` in local storage without losing player progression.
- Conflict resolution guarantees newer cloud/local data is preserved.
- Currency balance is strictly clamped with `Math.max(0, ...)` both client-side and via `firestore.rules`.
