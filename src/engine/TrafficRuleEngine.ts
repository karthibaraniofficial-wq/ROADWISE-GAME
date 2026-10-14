// ROADWISE — Centralized Traffic Rule Evaluation Engine
// Evaluates real-time player telemetry against Indian Left-Hand-Traffic (LHT) rules
// Features deduplication, cooldown windows, clear educational advice, and zero false penalties.

import {
  RuleViolationType,
  ViolationEvent,
  TrafficLightData,
} from '../types/game';

export interface PlayerTelemetry {
  position: [number, number, number];
  velocity: [number, number, number];
  speedKmh: number;
  heading: number; // yaw angle in radians
  isHelmetFastened: boolean;
  isInNoEntryZone: boolean;
  activeSpeedLimitKmh: number;
  nearestIntersection?: TrafficLightData;
  isPedestrianCrossingActive: boolean;
  distanceToPedestrian: number;
  isAmbulanceNearby: boolean;
  distanceToAmbulance: number;
}

export class TrafficRuleEngine {
  private lastViolationTimes: Map<RuleViolationType, number> = new Map();
  private safeStopRewardedLights: Set<string> = new Set();
  private violationHistory: ViolationEvent[] = [];

  // Cooldown durations in milliseconds to avoid spamming penalties
  private readonly COOLDOWNS: Record<RuleViolationType, number> = {
    RULE_RED_LIGHT: 3500,
    RULE_STOP_LINE: 3000,
    RULE_SPEEDING: 2500,
    RULE_HELMET: 4000,
    RULE_WRONG_WAY: 3000,
    RULE_ZEBRA_YIELD: 4000,
    RULE_EMERGENCY_YIELD: 5000,
    RULE_COLLISION: 1500,
    RULE_ILLEGAL_ENTRY: 3000,
    RULE_SAFE_STOP: 8000,
  };

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.lastViolationTimes.clear();
    this.safeStopRewardedLights.clear();
    this.violationHistory = [];
  }

  public getHistory(): ViolationEvent[] {
    return [...this.violationHistory];
  }

  private canTrigger(type: RuleViolationType, now: number): boolean {
    const last = this.lastViolationTimes.get(type) || 0;
    const cd = this.COOLDOWNS[type] || 3000;
    return now - last >= cd;
  }

  private recordEvent(event: ViolationEvent, now: number): ViolationEvent {
    this.lastViolationTimes.set(event.type, now);
    this.violationHistory.push(event);
    return event;
  }

  /**
   * Main evaluation step called every game tick (e.g. 60Hz or fixed physics step)
   */
  public evaluate(telemetry: PlayerTelemetry, now: number = Date.now()): ViolationEvent[] {
    const emittedEvents: ViolationEvent[] = [];

    // 1. HELMET CHECK
    // If vehicle is moving (> 5 km/h) without a fastened helmet
    if (telemetry.speedKmh > 5 && !telemetry.isHelmetFastened) {
      if (this.canTrigger('RULE_HELMET', now)) {
        emittedEvents.push(
          this.recordEvent(
            {
              id: `helmet_${now}`,
              type: 'RULE_HELMET',
              title: 'Helmet Not Fastened',
              message: 'Motor Vehicles Act Sec 129: Wearing a protective BIS-certified helmet is mandatory for all two-wheeler riders.',
              advice: 'Press [H] to securely fasten your helmet before throttle input.',
              pointsDeduction: 30,
              fineINR: 100,
              timestamp: now,
              severity: 'moderate',
            },
            now
          )
        );
      }
    }

    // 2. SPEED LIMIT EVALUATION
    // Buffer of 4 km/h before issuing infraction to account for slight speedometer fluctuations
    const speedThreshold = telemetry.activeSpeedLimitKmh + 4;
    if (telemetry.speedKmh > speedThreshold) {
      if (this.canTrigger('RULE_SPEEDING', now)) {
        const excess = Math.round(telemetry.speedKmh - telemetry.activeSpeedLimitKmh);
        const isSchoolZone = telemetry.activeSpeedLimitKmh <= 30;
        emittedEvents.push(
          this.recordEvent(
            {
              id: `speed_${now}`,
              type: 'RULE_SPEEDING',
              title: isSchoolZone ? 'School Zone Speeding' : 'Speed Limit Exceeded',
              message: `Recorded ${Math.round(telemetry.speedKmh)} km/h in a ${telemetry.activeSpeedLimitKmh} km/h zone (+${excess} km/h).`,
              advice: 'Ease off throttle and tap [S] to maintain safe braking distance.',
              pointsDeduction: isSchoolZone ? 30 : 15,
              fineINR: isSchoolZone ? 150 : 75,
              timestamp: now,
              severity: isSchoolZone ? 'critical' : 'minor',
            },
            now
          )
        );
      }
    }

    // 3. TRAFFIC LIGHT & STOP LINE EVALUATION
    const light = telemetry.nearestIntersection;
    if (light) {
      const [px, , pz] = telemetry.position;
      const [sx, , sz] = light.stopLinePos;
      const distToStopLine = Math.hypot(px - sx, pz - sz);

      // Stop Line / Red Light boundary check
      // Player is approaching the junction from the approach lane
      if (distToStopLine < 12.0) {
        if (light.state === 'RED') {
          // If player is moving through or crossing stop line into junction
          if (distToStopLine < 6.5 && telemetry.speedKmh > 8) {
            if (this.canTrigger('RULE_RED_LIGHT', now)) {
              emittedEvents.push(
                this.recordEvent(
                  {
                    id: `red_${light.id}_${now}`,
                    type: 'RULE_RED_LIGHT',
                    title: 'Red-Light Violation',
                    message: 'Entered junction during RED signal phase. Danger of right-angle t-bone collision.',
                    advice: 'Always stop before the solid white stop line until the signal turns green.',
                    pointsDeduction: 50,
                    fineINR: 200,
                    timestamp: now,
                    severity: 'critical',
                  },
                  now
                )
              );
            }
          } else if (distToStopLine < 3.0 && telemetry.speedKmh > 2 && telemetry.speedKmh <= 8) {
            // Overhanging stop line on red
            if (this.canTrigger('RULE_STOP_LINE', now)) {
              emittedEvents.push(
                this.recordEvent(
                  {
                    id: `stopline_${light.id}_${now}`,
                    type: 'RULE_STOP_LINE',
                    title: 'Stop-Line Overhang',
                    message: 'Vehicle halted past the marked stop line, encroaching on pedestrian refuge.',
                    advice: 'Bring your vehicle to a complete stop prior to the solid white line.',
                    pointsDeduction: 15,
                    fineINR: 50,
                    timestamp: now,
                    severity: 'minor',
                  },
                  now
                )
              );
            }
          } else if (distToStopLine < 5.0 && telemetry.speedKmh < 1.0) {
            // Positive feedback: safely stopped before stop line on red
            if (!this.safeStopRewardedLights.has(light.id) && this.canTrigger('RULE_SAFE_STOP', now)) {
              this.safeStopRewardedLights.add(light.id);
              emittedEvents.push(
                this.recordEvent(
                  {
                    id: `safestop_${light.id}_${now}`,
                    type: 'RULE_SAFE_STOP',
                    title: 'Safe Stop Compliance',
                    message: 'Clean stop executed behind the stop line during RED phase.',
                    advice: 'Excellent discipline! Wait calmly for green phase.',
                    pointsDeduction: -15, // Negative deduction = bonus reward points!
                    fineINR: 0,
                    timestamp: now,
                    severity: 'reward',
                  },
                  now
                )
              );
            }
          }
        } else if (light.state === 'GREEN') {
          // Reset safe stop reward for next cycle
          this.safeStopRewardedLights.delete(light.id);
        }
      }
    }

    // 4. PEDESTRIAN ZEBRA CROSSING YIELDING
    if (telemetry.isPedestrianCrossingActive && telemetry.distanceToPedestrian < 14.0) {
      // If pedestrian is on crossing and player fails to stop/yield (< 6m away and speed > 15 km/h)
      if (telemetry.distanceToPedestrian < 7.0 && telemetry.speedKmh > 14) {
        if (this.canTrigger('RULE_ZEBRA_YIELD', now)) {
          emittedEvents.push(
            this.recordEvent(
              {
                id: `zebra_${now}`,
                type: 'RULE_ZEBRA_YIELD',
                title: 'Failure to Yield to Pedestrians',
                message: 'Pedestrians have absolute right-of-way on zebra crossings.',
                advice: 'Slow down and come to a complete stop before the zebra stripes until pedestrians cross.',
                pointsDeduction: 45,
                fineINR: 150,
                timestamp: now,
                severity: 'critical',
              },
              now
            )
          );
        }
      }
    }

    // 5. EMERGENCY VEHICLE YIELD (Ambulance with siren active)
    if (telemetry.isAmbulanceNearby && telemetry.distanceToAmbulance < 25.0) {
      // Rule: In left-hand traffic, rider must pull over to the LEFT side of the lane and slow down/stop
      // If player continues at high speed (> 25 km/h) without slowing down
      if (telemetry.speedKmh > 26) {
        if (this.canTrigger('RULE_EMERGENCY_YIELD', now)) {
          emittedEvents.push(
            this.recordEvent(
              {
                id: `emergency_${now}`,
                type: 'RULE_EMERGENCY_YIELD',
                title: 'Failure to Yield to Ambulance',
                message: 'Emergency vehicles on sirens have mandatory immediate priority under MV Act Sec 194E.',
                advice: 'Safely pull over to the left shoulder and stop until the emergency vehicle clears.',
                pointsDeduction: 50,
                fineINR: 250,
                timestamp: now,
                severity: 'critical',
              },
              now
            )
          );
        }
      }
    }

    // 6. NO-ENTRY / ILLEGAL ZONE ENTRY (e.g. shortcut trap or barricaded road)
    if (telemetry.isInNoEntryZone) {
      if (this.canTrigger('RULE_ILLEGAL_ENTRY', now)) {
        emittedEvents.push(
          this.recordEvent(
            {
              id: `no_entry_${now}`,
              type: 'RULE_ILLEGAL_ENTRY',
              title: 'No-Entry Zone Violation',
              message: 'Entered restricted or under-construction road sector against regulatory signage.',
              advice: 'Observe circular red-and-white No Entry signs and follow designated diversion routes.',
              pointsDeduction: 35,
              fineINR: 100,
              timestamp: now,
              severity: 'moderate',
            },
            now
          )
        );
      }
    }

    return emittedEvents;
  }

  /**
   * Directly record a physical collision event
   */
  public triggerCollision(speedKmh: number, obstacleName: string = 'obstacle', now: number = Date.now()): ViolationEvent | null {
    if (!this.canTrigger('RULE_COLLISION', now)) return null;

    const pointsDeduction = Math.min(80, Math.max(30, Math.round(speedKmh * 1.5)));
    return this.recordEvent(
      {
        id: `collision_${now}`,
        type: 'RULE_COLLISION',
        title: 'Traffic Collision',
        message: `Impact with ${obstacleName} at ${Math.round(speedKmh)} km/h caused package & vehicle damage.`,
        advice: 'Maintain defensive following distance and scan corners before making turning maneuvers.',
        pointsDeduction,
        fineINR: 100,
        timestamp: now,
        severity: 'critical',
      },
      now
    );
  }

  /**
   * Calculate final score and rewards
   */
  public calculateSummary(baseScore: number, initialPackageHealth: number, packageHealth: number): {
    totalViolations: number;
    pointsDeducted: number;
    finesINR: number;
    finalScore: number;
    cleanDeliveryBonus: boolean;
    safetyScoreAdjustment: number;
  } {
    let pointsDeducted = 0;
    let finesINR = 0;
    let violationsCount = 0;

    for (const v of this.violationHistory) {
      if (v.severity === 'reward') {
        pointsDeducted += v.pointsDeduction; // negative number adds points
      } else {
        pointsDeducted += v.pointsDeduction;
        finesINR += v.fineINR;
        violationsCount++;
      }
    }

    const cleanDelivery = violationsCount === 0 && packageHealth >= 90;
    const cleanBonus = cleanDelivery ? 50 : 0;
    const finalScore = Math.max(0, baseScore - pointsDeducted + cleanBonus);

    // Safety score adjustment: +2% for clean delivery, -3% per violation
    const safetyScoreAdjustment = cleanDelivery ? 2 : -(violationsCount * 3);

    return {
      totalViolations: violationsCount,
      pointsDeducted,
      finesINR,
      finalScore,
      cleanDeliveryBonus: cleanDelivery,
      safetyScoreAdjustment,
    };
  }
}
