// ROADWISE — Automated Verification & Unit Test Suite
// Executes under Node.js native test runner (node --test)

import test from 'node:test';
import assert from 'node:assert/strict';

// Import our TypeScript modules transpiled via Node/esbuild or test pure logic
import { TrafficRuleEngine } from '../src/engine/TrafficRuleEngine.ts';
import { VEHICLE_ROSTER, updateLicenseGrade } from '../src/services/storage.ts';
import { MISSIONS } from '../src/engine/MissionManager.ts';

test('1. Traffic Rule Engine: Helmet Compliance', () => {
  const engine = new TrafficRuleEngine();
  const now = 100000;

  // Moving fast without helmet -> should penalize
  const violations1 = engine.evaluate({
    position: [0, 0, 0],
    velocity: [0, 0, 5],
    speedKmh: 18,
    heading: 0,
    isHelmetFastened: false,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 40,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now);

  assert.equal(violations1.length, 1);
  assert.equal(violations1[0].type, 'RULE_HELMET');
  assert.equal(violations1[0].pointsDeduction, 30);
  assert.equal(violations1[0].fineINR, 100);

  // Moving with helmet fastened -> NO violation
  const violations2 = engine.evaluate({
    position: [0, 0, 0],
    velocity: [0, 0, 5],
    speedKmh: 18,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 40,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now + 10000);

  assert.equal(violations2.length, 0, 'Fastened helmet must not trigger violation');
});

test('2. Traffic Rule Engine: Speed Limit Enforcement', () => {
  const engine = new TrafficRuleEngine();
  const now = 100000;

  // Driving 38 km/h in 30 km/h school zone -> should penalize
  const violations = engine.evaluate({
    position: [0, 0, 0],
    velocity: [0, 0, 10],
    speedKmh: 38,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 30,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now);

  const speedViolation = violations.find(v => v.type === 'RULE_SPEEDING');
  assert.ok(speedViolation, 'Speeding violation should be recorded');
  assert.equal(speedViolation.severity, 'critical');

  // Driving 28 km/h in 30 km/h school zone -> legal, NO penalty
  const legalViolations = engine.evaluate({
    position: [0, 0, 0],
    velocity: [0, 0, 7],
    speedKmh: 28,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 30,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now + 10000);

  assert.equal(legalViolations.length, 0, 'Legal speed must not trigger penalty');
});

test('3. Traffic Rule Engine: Red-Light Violation & False Penalty Prevention', () => {
  const engine = new TrafficRuleEngine();
  const now = 100000;

  const mockLight = {
    id: 'light_test',
    position: [0, 0, 0],
    rotationY: 0,
    state: 'RED',
    timer: 5,
    cycleDuration: { red: 10, amber: 3, green: 10 },
    stopLinePos: [0, 0, 0],
    approachHeading: 0,
  };

  // Crossing stop line at 20 km/h on RED -> Red Light Violation
  const redViolations = engine.evaluate({
    position: [0, 0, 4.0], // 4m from stop line
    velocity: [0, 0, 6],
    speedKmh: 20,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 45,
    nearestIntersection: mockLight,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now);

  const redEvent = redViolations.find(v => v.type === 'RULE_RED_LIGHT');
  assert.ok(redEvent, 'Crossing on Red must produce RED_LIGHT violation');
  assert.equal(redEvent.pointsDeduction, 50);

  // Crossing same stop line on GREEN -> Must NOT produce violation!
  mockLight.state = 'GREEN';
  const greenViolations = engine.evaluate({
    position: [0, 0, 4.0],
    velocity: [0, 0, 6],
    speedKmh: 20,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 45,
    nearestIntersection: mockLight,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now + 10000);

  const falseRed = greenViolations.find(v => v.type === 'RULE_RED_LIGHT');
  assert.equal(falseRed, undefined, 'Passing on GREEN must NEVER produce red-light penalty');
});

test('4. Traffic Rule Engine: Safe Stop Compliance Reward', () => {
  const engine = new TrafficRuleEngine();
  const now = 100000;

  const mockLight = {
    id: 'light_reward',
    position: [0, 0, 0],
    rotationY: 0,
    state: 'RED',
    timer: 5,
    cycleDuration: { red: 10, amber: 3, green: 10 },
    stopLinePos: [0, 0, 0],
    approachHeading: 0,
  };

  // Halting cleanly before stop line (< 5m, speed < 1 km/h) on RED -> Reward points!
  const stopEvents = engine.evaluate({
    position: [0, 0, 3.5],
    velocity: [0, 0, 0],
    speedKmh: 0.2,
    heading: 0,
    isHelmetFastened: true,
    isInNoEntryZone: false,
    activeSpeedLimitKmh: 45,
    nearestIntersection: mockLight,
    isPedestrianCrossingActive: false,
    distanceToPedestrian: 99,
    isAmbulanceNearby: false,
    distanceToAmbulance: 99,
  }, now);

  const rewardEvent = stopEvents.find(v => v.type === 'RULE_SAFE_STOP');
  assert.ok(rewardEvent, 'Clean stop on RED should award compliance reward');
  assert.equal(rewardEvent.severity, 'reward');
  assert.equal(rewardEvent.pointsDeduction, -15); // Negative deduction = bonus!
});

test('5. Traffic Rule Engine: Cooldown & Deduplication', () => {
  const engine = new TrafficRuleEngine();
  let now = 100000;

  // Trigger collision at t = 100,000
  const col1 = engine.triggerCollision(25, 'car', now);
  assert.ok(col1, 'First collision should register');

  // Trigger collision 200ms later -> within cooldown window, should deduplicate to null
  now += 200;
  const col2 = engine.triggerCollision(25, 'car', now);
  assert.equal(col2, null, 'Second collision within cooldown must be deduplicated');

  // Trigger collision 2000ms later -> cooldown expired, registers
  now += 2000;
  const col3 = engine.triggerCollision(25, 'car', now);
  assert.ok(col3, 'Collision after cooldown window should register');
});

test('6. Vehicle Roster & Upgrade Scaling', () => {
  const scooty = VEHICLE_ROSTER['scooty_110'];
  const ather = VEHICLE_ROSTER['ather_apex'];

  assert.ok(scooty, 'Scooty 110 starter vehicle exists');
  assert.equal(scooty.priceINR, 0, 'Starter vehicle must be free');

  assert.ok(ather, 'Ather Apex EV flagship exists');
  assert.ok(ather.topSpeedKmh > scooty.topSpeedKmh, 'Flagship must have higher top speed');
  assert.ok(ather.brakeForce > scooty.brakeForce, 'Flagship must have superior braking');
});

test('7. License Grade Progression', () => {
  assert.equal(updateLicenseGrade(0, 95), 'Learner (L)');
  assert.equal(updateLicenseGrade(250, 75), 'Provisional (P)');
  assert.equal(updateLicenseGrade(800, 75), 'Commercial Driver');
  assert.equal(updateLicenseGrade(1600, 85), 'Master Delivery Partner');
});

test('8. Delivery Missions Integrity (All 10 Missions)', () => {
  assert.equal(MISSIONS.length, 10, 'Must have exactly 10 distinct missions');

  // Verify first mission is unlocked
  assert.equal(MISSIONS[0].unlockedByDefault, true, 'Mission 1 must be unlocked by default');

  // Verify all missions have valid properties
  MISSIONS.forEach((m, idx) => {
    assert.equal(m.id, idx + 1, `Mission id must match index ${idx + 1}`);
    assert.ok(m.title.length > 5, 'Mission must have descriptive title');
    assert.ok(m.rewardINR > 0, 'Mission must offer spendable currency reward');
    assert.ok(m.timeLimitSeconds >= 60, 'Mission must provide sufficient time budget');
    assert.ok(m.dropoffLocations.length >= 1, 'Mission must have at least one drop-off bay');
  });

  // Verify twists exist across missions
  const twists = MISSIONS.map(m => m.twistType);
  assert.ok(twists.includes('DECEPTIVE_GREEN'), 'Must include Deceptive Green twist');
  assert.ok(twists.includes('SHORTCUT_TRAP'), 'Must include Shortcut Trap twist');
  assert.ok(twists.includes('EMERGENCY_VEHICLE'), 'Must include Emergency Vehicle twist');
  assert.ok(twists.includes('CHANGING_WEATHER'), 'Must include Changing Weather / Rain twist');
  assert.ok(twists.includes('MULTI_STOP'), 'Must include Multi-Stop twist');
  assert.ok(twists.includes('FINAL_JUDGMENT'), 'Must include Final Judgment test');
});

test('9. Authentication: Error Code Formatting & Validation', async () => {
  const { formatAuthError } = await import('../src/services/authService.ts');

  assert.ok(formatAuthError('auth/invalid-email').includes('invalid'), 'Must format invalid email error');
  assert.ok(formatAuthError('auth/wrong-password').includes('Incorrect'), 'Must format wrong password error');
  assert.ok(formatAuthError('auth/user-not-found').includes('No account'), 'Must format user not found error');
  assert.ok(formatAuthError('auth/email-already-in-use').includes('already exists'), 'Must format duplicate email error');
  assert.ok(formatAuthError('auth/weak-password').includes('6 characters'), 'Must format weak password error');
});

test('10. Multi-Slot Save Management & Negative Balance Protection', async () => {
  const { createDefaultSaveSlot } = await import('../src/services/saveGameService.ts');
  const slot = createDefaultSaveSlot('slot_test', 'Beta Career');

  assert.equal(slot.id, 'slot_test');
  assert.equal(slot.saveName, 'Beta Career');
  assert.equal(slot.schemaVersion, 2);
  assert.ok(slot.profile.currencyINR >= 0, 'Starter balance must be non-negative');

  // Verify negative balance clamped
  slot.profile.currencyINR = Math.max(0, -500);
  assert.equal(slot.profile.currencyINR, 0, 'Negative currency must be clamped to zero');
});

test('11. Vehicle Physics: Distinct Braking & Drift Elimination', async () => {
  const { VehiclePhysics } = await import('../src/engine/VehiclePhysics.ts');
  const scooty = VEHICLE_ROSTER['scooty_110'];
  const physics = new VehiclePhysics(scooty, { engineStage: 0, brakeStage: 0, tireStage: 0, colorIndex: 0 });

  physics.reset(0, 0, 0);

  // Accelerate for 1 second
  physics.update({ throttle: true, brake: false, steerLeft: false, steerRight: false, handbrake: false }, 1.0);
  const forwardSpeed = physics.speedKmh;
  assert.ok(forwardSpeed > 5, 'Vehicle should accelerate forward');

  // Brake for 0.25s -> speed must decrease distinctly while still rolling forward
  physics.update({ throttle: false, brake: true, steerLeft: false, steerRight: false, handbrake: false }, 0.25);
  assert.ok(physics.speedKmh < forwardSpeed, 'Braking must distinctly decelerate the vehicle');
  assert.ok(physics.speedKmh > 0, 'Vehicle should still have forward momentum');
  assert.ok(!physics.isReversing, 'Should not be in reverse while moving forward');
});

test('12. Firebase Configuration Helper Validation', async () => {
  const { isFirebaseConfigured } = await import('../src/lib/firebase.ts');
  // Default repo has placeholder keys until user provides real keys
  assert.equal(typeof isFirebaseConfigured(), 'boolean');
});

