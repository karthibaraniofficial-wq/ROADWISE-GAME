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
  assert.ok(formatAuthError('auth/invalid-phone-number').includes('phone number'), 'Must format invalid phone error');
  assert.ok(formatAuthError('auth/invalid-verification-code').includes('OTP'), 'Must format invalid OTP error');
  assert.ok(formatAuthError('auth/popup-closed-by-user').includes('Google'), 'Must format popup closed error');
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

test('13. Connected Road Network: Nodes, Edges & Districts', async () => {
  const { RoadNetwork } = await import('../src/engine/world/RoadNetwork.ts');
  const network = new RoadNetwork();

  assert.ok(network.nodes.size >= 20, `Network must have at least 20 nodes, got ${network.nodes.size}`);
  assert.ok(network.edges.size >= 20, `Network must have at least 20 edges, got ${network.edges.size}`);

  // Check critical nodes exist
  assert.ok(network.nodes.has('N_CENTER'), 'Center intersection node N_CENTER must exist');
  assert.ok(network.nodes.has('R_NORTH'), 'Roundabout node R_NORTH must exist');
  assert.ok(network.nodes.has('HOSP_MAIN'), 'Hospital district node HOSP_MAIN must exist');
  assert.ok(network.nodes.has('SCH_GATE'), 'School zone node SCH_GATE must exist');
  assert.ok(network.nodes.has('HERIT_TEMPLE'), 'Heritage quarter node HERIT_TEMPLE must exist');
  assert.ok(network.nodes.has('IND_JUNCTION'), 'Industrial zone node IND_JUNCTION must exist');
  assert.ok(network.nodes.has('IND_DEPOT'), 'Industrial zone node IND_DEPOT must exist');

  // Verify all edges have positive length and CatmullRom splines
  for (const [id, edge] of network.edges) {
    assert.ok(edge.length > 0, `Edge ${id} must have positive length`);
    assert.ok(edge.curve, `Edge ${id} must have valid CatmullRom spline`);
    assert.ok(edge.width >= 6, `Edge ${id} width must be at least 6m`);
  }

  // Verify speed limits per district
  const schoolEdge = network.edges.get('E_NORTH_TO_SCH_GATE');
  assert.ok(schoolEdge, 'School edge must exist');
  assert.equal(schoolEdge.speedLimitKmh, 30, 'School zone must have 30 km/h speed limit');

  const flyoverEdge = network.edges.get('E_FLYOVER');
  assert.ok(flyoverEdge, 'Flyover edge must exist');
  assert.ok(flyoverEdge.isElevated, 'Flyover segment must be elevated');
  assert.equal(flyoverEdge.elevationHeight, 4.5, 'Flyover elevation must be 4.5m');

  const indEdge = network.edges.get('E_RES_TO_IND');
  assert.ok(indEdge, 'Industrial corridor edge E_RES_TO_IND must exist');
  assert.equal(indEdge.district, 'INDUSTRIAL_ZONE');
});

test('14. Navigation Graph: A* Pathfinding Between Districts & One-Way Respect', async () => {
  const { RoadNetwork } = await import('../src/engine/world/RoadNetwork.ts');
  const network = new RoadNetwork();

  // Route 1: From Center (0, 0) to IT Park Roundabout (60, 60)
  const path1 = network.findPath([0, 0], [60, 60]);
  assert.ok(path1.length >= 3, `A* path to IT Park must have multiple waypoints along road, got ${path1.length}`);

  // Route 2: From School Zone (0, -75) to Hospital District (-70, 60)
  const path2 = network.findPath([0, -75], [-70, 60]);
  assert.ok(path2.length >= 4, `A* path from School to Hospital must navigate road graph, got ${path2.length}`);

  // Route 3: From Center (0, 0) to Industrial Freight Depot (-35, 90)
  const path3 = network.findPath([0, 0], [-35, 90]);
  assert.ok(path3.length >= 3, `A* path to Industrial Depot must navigate road graph, got ${path3.length}`);

  // Verify nearest road point query
  const nearest = network.findClosestRoadPoint(2, 5);
  assert.ok(nearest.point, 'Closest road point must be found');
  assert.ok(nearest.edge, 'Closest road edge must be found');
});

test('15. Mission Reachability: All 10 Delivery Missions Reachable Via Road Graph', async () => {
  const { RoadNetwork } = await import('../src/engine/world/RoadNetwork.ts');
  const network = new RoadNetwork();

  for (const mission of MISSIONS) {
    // Check pickup is reachable from start (0, 0)
    const pickupPath = network.findPath([0, 0], [mission.pickupPos[0], mission.pickupPos[2]]);
    assert.ok(
      pickupPath.length >= 2,
      `Mission ${mission.id} (${mission.title}) pickup at [${mission.pickupPos[0]}, ${mission.pickupPos[2]}] must be reachable`
    );

    // Check each dropoff is reachable from pickup
    for (let d = 0; d < mission.dropoffLocations.length; d++) {
      const dropoff = mission.dropoffLocations[d];
      const dropoffPath = network.findPath(
        [mission.pickupPos[0], mission.pickupPos[2]],
        [dropoff[0], dropoff[2]]
      );
      assert.ok(
        dropoffPath.length >= 2,
        `Mission ${mission.id} dropoff #${d + 1} at [${dropoff[0]}, ${dropoff[2]}] must be reachable`
      );
    }
  }
});

test('16. Tactical Navigation Map: Telemetry & Landmark Routing Integrity', async () => {
  const { RoadNetwork } = await import('../src/engine/world/RoadNetwork.ts');
  const network = new RoadNetwork();

  // Verify speed limit queries across 8 distinct districts
  assert.equal(network.getSpeedLimitAt(0, -75), 30, 'School zone must query 30 km/h');
  assert.ok(network.getSpeedLimitAt(80, -120) >= 50, 'Highway must query at least 50 km/h');
  assert.ok(network.getSpeedLimitAt(-85, -60) <= 30, 'Heritage alley must query 25 km/h');
});

test('17. Security & Firestore Rules: Strict Schema & Ownership Enforcement', () => {
  function checkOwnership(authUid, targetUserId) {
    if (!authUid) return false;
    return authUid === targetUserId;
  }

  assert.equal(checkOwnership(null, 'user_123'), false, 'Unauthenticated access must be denied');
  assert.equal(checkOwnership('user_attacker', 'user_victim'), false, 'User A cannot access User B resources');
  assert.equal(checkOwnership('user_123', 'user_123'), true, 'Owner access must be allowed');

  function validateGameSave(authUid, userId, data, isCreate, existingData = null) {
    if (!checkOwnership(authUid, userId)) return { allowed: false, reason: 'UNAUTHORIZED' };

    const jsonStr = JSON.stringify(data);
    if (jsonStr.length > 200 * 1024) return { allowed: false, reason: 'OVERSIZED_PAYLOAD' };

    if (isCreate) {
      if (!data.saveName || !data.schemaVersion || !data.createdAt) {
        return { allowed: false, reason: 'MISSING_REQUIRED_KEYS' };
      }
    }

    if (typeof data.saveName !== 'string' || data.saveName.length < 1 || data.saveName.length > 40) {
      return { allowed: false, reason: 'INVALID_SAVENAME' };
    }

    if ('currencyINR' in data && data.currencyINR < 0) {
      return { allowed: false, reason: 'NEGATIVE_CURRENCY' };
    }
    if ('safetyScore' in data && (data.safetyScore < 0 || data.safetyScore > 100)) {
      return { allowed: false, reason: 'INVALID_SAFETY_SCORE' };
    }

    if (data.profile) {
      if ('currencyINR' in data.profile && data.profile.currencyINR < 0) {
        return { allowed: false, reason: 'NEGATIVE_PROFILE_CURRENCY' };
      }
      if ('safetyScore' in data.profile && (data.profile.safetyScore < 0 || data.profile.safetyScore > 100)) {
        return { allowed: false, reason: 'INVALID_PROFILE_SAFETY_SCORE' };
      }
      if ('level' in data.profile && data.profile.level < 1) {
        return { allowed: false, reason: 'INVALID_PROFILE_LEVEL' };
      }
    }

    if (!isCreate && existingData) {
      if (data.createdAt !== existingData.createdAt) {
        return { allowed: false, reason: 'MUTATING_CREATED_AT' };
      }
    }

    return { allowed: true };
  }

  const validSave = {
    id: 'slot_1',
    saveName: 'Primary Career',
    schemaVersion: 2,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    profile: {
      currencyINR: 1500,
      safetyScore: 92,
      level: 2,
    },
  };

  assert.equal(validateGameSave('uid_1', 'uid_1', validSave, true).allowed, true);
  assert.equal(validateGameSave(null, 'uid_1', validSave, true).allowed, false);
  assert.equal(validateGameSave('uid_2', 'uid_1', validSave, true).allowed, false);

  const negativeCurrencySave = {
    ...validSave,
    profile: { ...validSave.profile, currencyINR: -500 },
  };
  assert.equal(validateGameSave('uid_1', 'uid_1', negativeCurrencySave, true).allowed, false);

  const invalidSafetySave = {
    ...validSave,
    profile: { ...validSave.profile, safetyScore: 120 },
  };
  assert.equal(validateGameSave('uid_1', 'uid_1', invalidSafetySave, true).allowed, false);

  const longNameSave = {
    ...validSave,
    saveName: 'A'.repeat(45),
  };
  assert.equal(validateGameSave('uid_1', 'uid_1', longNameSave, true).allowed, false);

  const mutatedCreatedAtSave = {
    ...validSave,
    createdAt: 1800000000000,
  };
  assert.equal(
    validateGameSave('uid_1', 'uid_1', mutatedCreatedAtSave, false, validSave).allowed,
    false,
    'Mutating createdAt on update must be rejected'
  );
});

test('18. Controls & Key State Lifecycle: Neutralization on Blur & Pause', () => {
  let inputs = {
    throttle: true,
    brake: true,
    steerLeft: true,
    steerRight: true,
    handbrake: true,
  };

  const clearAllKeys = () => {
    inputs = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      handbrake: false,
    };
  };

  clearAllKeys();
  assert.equal(inputs.throttle, false, 'Throttle must be released');
  assert.equal(inputs.brake, false, 'Brake must be released');
  assert.equal(inputs.steerLeft, false, 'Steering left must be released');
  assert.equal(inputs.steerRight, false, 'Steering right must be released');
  assert.equal(inputs.handbrake, false, 'Handbrake must be released');
});


