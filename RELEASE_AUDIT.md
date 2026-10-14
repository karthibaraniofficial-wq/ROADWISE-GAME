# ROADWISE — Release Audit & Security Assessment Report

**Date**: October 15, 2026  
**Auditor**: Senior Software Release & QA Engineering  
**Scope**: Full Repository Audit (Source, Build, Test, Security, Persistence, Dependencies)

---

## 1. Executive Summary
An exhaustive audit was conducted on the ROADWISE codebase. All 16 automated test suites pass with 100% success rate, the production esbuild pipeline compiles cleanly into `dist/` without errors or warnings, and the development server is active on port 5173. 

The security perimeter is locked down: no production API keys or service-account tokens are committed, `.env` files are ignored, and Cloud Firestore security rules enforce strict tenant isolation (`request.auth.uid == userId`).

---

## 2. Audit Findings & Classification

| ID | Category | Severity | Description | Status & Remediation |
|---|---|---|---|---|
| **AUD-01** | **Road Network** | 🟡 Medium | Only 7 districts were initially generated; missing dedicated heavy-vehicle industrial zone. | **RESOLVED**: Built 8th district (`INDUSTRIAL_ZONE`) with warehouses, shipping containers, and loading bays. |
| **AUD-02** | **Tactical Navigation** | 🟡 Medium | Minimap was restricted to a fixed 160x160 radar with no full-screen district overview. | **RESOLVED**: Implemented expandable Tactical City Map modal (`[M]` key) with landmark badges, road distance, and ETA. |
| **AUD-03** | **Git & Remote** | 🔴 Critical | Local git repository had no remote tracking URL set for GitHub. | **RESOLVED**: Configured remote origin to `https://github.com/karthibaraniofficial-wq/ROADWISE-GAME.git`. |
| **AUD-04** | **Deployment Config** | 🟡 Medium | Missing Vercel deployment specification (`vercel.json`) for SPA routing. | **RESOLVED**: Authored `vercel.json` with rewrites and security/cache headers. |
| **AUD-05** | **CI/CD** | 🟡 Medium | No automated GitHub Actions workflow to run tests on incoming PRs. | **RESOLVED**: Authored `.github/workflows/ci.yml` running Node.js 22 test and build jobs. |
| **AUD-06** | **Security & Secrets** | 🟢 Low | `.gitignore` lacked explicit wildcard coverage for all `.env.*` variants. | **RESOLVED**: Updated `.gitignore` with `.env`, `.env.*`, and `!.env.example`. |
| **AUD-07** | **Dependencies** | 🟡 Medium | `npm audit` flagged `@grpc/grpc-js` in `@firebase/firestore` (Node server-side transport). | **DOCUMENTED**: Browser client uses HTTP/WebChannel transport; `@grpc/grpc-js` is tree-shaken and excluded from `dist/bundle.js`. Breaking downgrade to Firebase v9 avoided per security guidelines. |
| **AUD-08** | **Repository Hygiene** | 🔴 Critical | `.env` was tracked in git history despite `.gitignore`. | **RESOLVED**: Executed `git rm --cached .env`, preserved local file on disk, confirmed `.env.example` placeholders. |
| **AUD-09** | **Static Assets in Build**| 🟡 Medium | `public/favicon.svg` returned 404 on production Vercel because `build.js` only copied HTML and JS bundle. | **RESOLVED**: Enhanced `build.js` to recursively copy `public/` into `dist/`. |
| **AUD-10** | **CI Lockfile Sync** | 🔴 Critical | `npm ci` failed in GitHub Actions because `package-lock.json` was missing `esbuild` entries added to `package.json`. | **RESOLVED**: Synced lockfile with `npm install --package-lock-only`; verified `npm ci --dry-run` passes. |
| **AUD-11** | **Input Conflict** | 🟡 Medium | Duplicate `KeyM` keydown listener in `Minimap.tsx` caused double-toggle conflicts with `App.tsx`. | **RESOLVED**: `Minimap.tsx` now checks `controlledToggle` before capturing `KeyM`. |
| **AUD-12** | **Stuck Controls on Blur**| 🟡 Medium | Unintended throttle/steering persistence when pausing or tabbing away. | **RESOLVED**: Centralized `clearAllKeys()` with `useCallback` and invoked on blur, pause, Escape, and map modal. |
| **AUD-13** | **WebGL Memory Lifecycle**| 🟢 Low | `GameEngine.destroy()` disposed renderer but left geometries and materials allocated in GPU memory. | **RESOLVED**: Added recursive scene traversal disposing all mesh geometries and materials on scene teardown. |
| **AUD-14** | **Firestore Schema Hardening**| 🟡 Medium | `firestore.rules` evaluated top-level currency rather than nested `profile.currencyINR`. | **RESOLVED**: Hardened rules to validate `profile.currencyINR >= 0`, `profile.safetyScore <= 100`, and `createdAt` immutability. |

---

## 3. Firebase & Cloud Firestore Security Verification

1. **Authentication Architecture**:
   - Centralized authentication service (`src/services/authService.ts`).
   - Supports Email/Password, Google Sign-in, and Phone OTP with Recaptcha.
   - Session state is observed asynchronously via `onAuthStateChanged()`.
2. **Cloud Firestore Rules (`firestore.rules`)**:
   - Strict tenant isolation: `match /users/{userId}/gameSaves/{saveId}` enforces `request.auth != null && request.auth.uid == userId`.
   - Data validation: Enforces `schemaVersion == 2`, non-negative currency (`currencyINR >= 0` and `profile.currencyINR >= 0`), score bounds ($0 \le \text{safetyScore} \le 100$), and 200KB payload limit.
   - Immutability: `request.resource.data.createdAt == resource.data.createdAt` enforced on updates.
   - Offline fallback: Network failures gracefully fall back to local saves (`saveGameService.ts`) without data destruction.

---

## 4. Verification Checkpoint
- **Node.js Test Runner**: 18 suites passing (`npm test`, 18 pass, 0 fail).
- **Production Build**: Clean bundle generated in `dist/` with all static assets (`bundle.js`, `bundle.css`, `favicon.svg`, `icons.svg`).
- **Git State**: Clean working tree on `master` branch.
