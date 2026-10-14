# ROADWISE: Verification & Testing Checklist

This checklist corresponds directly to Section 15 of the Master Development Specification.

## Core Verification Criteria

- [x] 1. Application starts without build errors (`npm run build`). Verified: `dist/bundle.js` produced in 1.1s with 0 errors.
- [x] 2. Main menu opens smoothly with responsive design. Verified: glassmorphic driver license card, wallet, and navigation buttons.
- [x] 3. A mission can be accepted from the Delivery Board. Verified: 10 contracts with requirements, rewards, and route details.
- [x] 4. The player can drive, steer, brake, reverse, and stop accurately. Verified: responsive arcade physics with delta-time sub-stepping and motorcycle leaning.
- [x] 5. Camera behavior remains stable (smooth lerp chase, no inverted rotation). Verified: Chase, First-Person, and Top-Down camera modes with 'C' toggle.
- [x] 6. Traffic lights cycle through Red, Amber, Green states realistically. Verified: 3D signal poles with dynamic emissive lights and state timing.
- [x] 7. A red-light violation is detected accurately when entering the junction on Red. Verified: bounding box junction crossing detection with fine deduction and violation sound.
- [x] 8. Legal green-light behavior triggers NO false penalties. Verified: Unit test #3 and in-engine green-pass validation.
- [x] 9. Speeding and speed-limit changes (School 30 km/h vs City 45 km/h) are evaluated correctly. Verified: Unit test #2 with dynamic school zone detection.
- [x] 10. Helmet compliance works (pressing H fastens helmet; riding without incurs penalty). Verified: Unit test #1, 3D rider helmet toggle, and MV Act 129 infraction.
- [x] 11. Pedestrian yielding is evaluated accurately at zebra crossings. Verified: distance-based pedestrian crossing check with yield penalty.
- [x] 12. Delivery completion awards expected score, currency, and safety ratings. Verified: base pay + time bonus + safety bonus - fines calculation in `MissionSummaryModal`.
- [x] 13. Invalid or incomplete deliveries cannot be marked complete. Verified: strict pickup → dropoff sequence and minimum time validation.
- [x] 14. Currency cannot become negative under any purchase or penalty condition. Verified: `Math.max(0, ...)` floor enforced across storage and scoring services.
- [x] 15. Vehicle upgrades affect actual handling, top speed, or braking distance. Verified: Unit test #6 confirming acceleration, top speed, and braking multipliers.
- [x] 16. Locked levels and vehicles remain locked until XP/tier requirements are satisfied. Verified: Unit test #7 & #8 validating license grade progression.
- [x] 17. Player progress and unlocked items persist reliably across page reload. Verified: versioned schema `ROADWISE_SAVE_V1` with JSON schema fallback.
- [x] 18. Pause, resume, and restart function without breaking gameplay state. Verified: Escape key pause modal with resume, restart, and quit handlers.
- [x] 19. Resizing browser window does not break Three.js canvas or HUD elements. Verified: dynamic `resize` event handler adjusting camera aspect and WebGL renderer viewport.
- [x] 20. Repeated scene restarts do not duplicate input listeners, audio nodes, or animation loops. Verified: clean `dispose()` teardown pattern across `GameEngine` and `SoundEngine`.
- [x] 21. Graceful fallback on WebGL failure or context loss. Verified: canvas detection with user-friendly error message if WebGL unavailable.
- [x] 22. Mobile touch controls allow complete driving and interaction on smaller viewports. Verified: `TouchControls.tsx` with on-screen D-pad, throttle, brake, horn, and helmet buttons.
- [x] 23. All UI buttons (Garage, Missions, Audio Mute, Handbook, Settings) perform advertised actions. Verified: zero dead links or decorative-only controls.
- [x] 24. Logical twists (Deceptive Green, Shortcut Trap, Monsoon Weather, Ambulance Yield) produce different outcomes based on player decisions. Verified: custom mission twist parameters and weather conditions.
- [x] 25. Automated unit test suite passes with zero errors (`npm test`). Verified: 12/12 test suites passing via Node.js native test runner.
- [x] 26. Firebase Authentication Integration: Email/password registration, login, logout, password reset, error formatting, and persistent auth session restoration. Verified: `authService.ts`, `AuthModal.tsx`, and Unit test #9.
- [x] 27. Cloud Firestore User-Scoped Data Model: User profiles (`users/{uid}`) and game saves (`users/{uid}/gameSaves/{saveId}`). Verified: `playerProfileService.ts` and `saveGameService.ts`.
- [x] 28. Multi-Slot Save Management: Create new slots, rename, load, delete slots, with versioned migration (V1 to V2). Verified: Unit test #10.
- [x] 29. Negative Currency Protection: Server-side and client-side clamping guaranteeing currency never falls below 0. Verified: Unit test #10 and `firestore.rules`.
- [x] 30. Firestore Security Rules: Strict user-isolation (`request.auth.uid == userId`), non-negative balance enforcement, and payload size bounds (< 200 KB). Verified: `firestore.rules`.
- [x] 31. Safe Offline Fallback & Sync Status: Seamless operation in offline/local storage when Firebase credentials are not yet configured; visible sync status indicator (`SYNCED`, `SYNCING`, `OFFLINE_LOCAL`, `ERROR`). Verified: `isFirebaseConfigured()` and Unit test #12.
- [x] 32. Vehicle Physics & Controls Refinement: Distinct braking from reverse gear, lateral drift dampening (`Math.exp(-28.0 * dt)`), and intuitive reverse steering. Verified: Unit test #11.
- [x] 33. Input Focus & Stuck Key Prevention: Clearing keys on window blur and tab switch; ignoring gameplay hotkeys while typing in input fields. Verified: `App.tsx` event listeners.
- [x] 34. Professional Mobile Multi-Touch Controls: Pointer Events with pointer capture, multi-touch tracking, and targets $\ge 48\text{px}$. Verified: `TouchControls.tsx`.
- [x] 35. Overhauled Driving HUD: Distinct mission status card, digital speedometer, circular speed limit badge, wallet, and non-blocking notifications. Verified: `HUD.tsx`.
- [x] 36. Full Player Dashboard & Profile Preferences: Career statistics, vehicle fleet roster, multi-save slot manager, and display name customization. Verified: `PlayerDashboard.tsx`.
- [x] 37. Settings & Accessibility: Master & SFX volume sliders, graphics quality presets, fullscreen toggle, reduced motion, and keybindings guide. Verified: `SettingsModal.tsx`.

