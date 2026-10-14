# ROADWISE — Regression Testing Suite & Verification Matrix

## 1. Overview
ROADWISE employs a native Node.js test runner suite (`node --test`) transpiled through `esbuild` (`test.js`), ensuring zero test framework bloat while providing high-speed headless execution ($\approx 500\text{ms}$).

---

## 2. Automated Test Matrix (16 Suites Passing)

```
Test Execution: npm test (node test.js)
Environment: Node.js v24.19.0 native runner
Output: tests 16 | pass 16 | fail 0 | cancelled 0 | skipped 0
```

| # | Test Suite | Scope | Critical Assertions | Status |
|---|---|---|---|---|
| **01** | `Helmet Compliance` | `TrafficRuleEngine.ts` | Penalty deducted if moving $>15\text{ km/h}$ unfastened; 0 penalty if fastened | 🟢 **PASS** |
| **02** | `Speed Limit Enforcement` | `TrafficRuleEngine.ts` | Penalty when exceeding posted limit $> 2\text{ km/h}$; 0 penalty under limit | 🟢 **PASS** |
| **03** | `Red-Light Compliance` | `TrafficRuleEngine.ts` | Penalizes stop-line crossing on RED; yields on GREEN without false positives | 🟢 **PASS** |
| **04** | `Safe Stop Reward` | `TrafficRuleEngine.ts` | Awards compliance bonus points for waiting patiently at RED light | 🟢 **PASS** |
| **05** | `Violation Deduplication` | `TrafficRuleEngine.ts` | Prevents rapid spamming of duplicate fines within a 5-second cooldown window | 🟢 **PASS** |
| **06** | `Vehicle Roster & Scaling` | `storage.ts` | Top speed, acceleration, brake force scale monotonically with upgrade stages | 🟢 **PASS** |
| **07** | `License Progression` | `storage.ts` | Correctly upgrades grade from Learner $\to$ Provisional $\to$ Commercial $\to$ Master | 🟢 **PASS** |
| **08** | `Mission Integrity` | `MissionManager.ts` | All 10 missions define valid checkpoints, positive rewards, time limits, and twists | 🟢 **PASS** |
| **09** | `Auth Error Formatting` | `authService.ts` | Translates Firebase raw codes into user-friendly diagnostic guidance | 🟢 **PASS** |
| **10** | `Multi-Slot Save Bounds` | `saveGameService.ts` | Validates slot isolation, schema version 2, and negative currency clamping | 🟢 **PASS** |
| **11** | `Braking & Drift Control` | `VehiclePhysics.ts` | Forward braking distinctly decelerates without flipping into reverse; lateral drift $\le 0.05$ | 🟢 **PASS** |
| **12** | `Firebase Config Verification` | `firebase.ts` | Validates client helper logic and offline safety fallback | 🟢 **PASS** |
| **13** | `8 Districts & Road Graph` | `RoadNetwork.ts` | 25 nodes, 28 edges, Catmull-Rom splines, flyover height 4.5m, industrial corridor | 🟢 **PASS** |
| **14** | `A* Pathfinding & One-Way` | `RoadNetwork.ts` | Computes smooth multi-point path; respects one-way restrictions on alleys | 🟢 **PASS** |
| **15** | `Mission Reachability` | `RoadNetwork.ts` | All 10 missions have verified legal road paths from start $\to$ pickup $\to$ dropoffs | 🟢 **PASS** |
| **16** | `Tactical Map Telemetry` | `RoadNetwork.ts` | Regulatory speed limits query correctly across all 8 metropolitan districts | 🟢 **PASS** |

---

## 3. Manual Browser Verification Checklist

- [x] **Scene Canvas**: Canvas mounts with WebGL context, antialiasing, and shadows enabled.
- [x] **Controls Responsiveness**: `W`/`Up` accelerates, `S`/`Down` brakes, `A`/`D` turns with natural motorcycle lean.
- [x] **Camera Modes**: `C` cycles smoothly through Chase, Cockpit/FPS, and Top-Down tactical perspectives.
- [x] **Helmet Toggle**: `H` fastens/unfastens helmet and syncs HUD indicator state.
- [x] **Minimap Radar**: Top-right radar renders road ribbons, AI vehicles, and A* navigation path.
- [x] **Tactical Map Modal**: `M` opens full 8-district tactical blueprint with live route distance and ETA.
- [x] **Delivery Completion**: Approaching pickup and dropoff markers with `[E]` triggers sound chime, debriefing modal, and currency rewards.
- [x] **Authentication & Saves**: Supports email/password, Google sign-in, Phone OTP, and cloud slot synchronization.
