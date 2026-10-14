// ROADWISE — Vehicle Controller & Arcade Physics Simulation
// Implements responsive motorcycle dynamics, delta-time independence,
// upgrade parameters, wet-road friction scaling, and safe obstacle bouncing.

import * as THREE from 'three';
import { VehicleDefinition, VehicleUpgrades, WeatherType } from '../types/game';

export interface VehicleInputs {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
}

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name?: string;
}

export class VehiclePhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0; // facing direction in radians
  public speedKmh: number = 0;
  public steerAngle: number = 0;
  public isReversing: boolean = false;
  public isBraking: boolean = false;
  public isHelmetFastened: boolean = false;

  // Collision callback
  public onCollision?: (impactSpeedKmh: number, obstacleName: string) => void;

  private vehicleDef: VehicleDefinition;
  private upgrades: VehicleUpgrades;
  private weather: WeatherType = 'DAY_CLEAR';

  // Physical constants
  private readonly DRAG_COEFFICIENT = 0.35;
  private readonly ROLLING_RESISTANCE = 2.5;
  private readonly FIXED_STEP = 1 / 60;

  constructor(definition: VehicleDefinition, upgrades: VehicleUpgrades) {
    this.vehicleDef = definition;
    this.upgrades = upgrades;
  }

  public setWeather(weather: WeatherType): void {
    this.weather = weather;
  }

  public setVehicle(definition: VehicleDefinition, upgrades: VehicleUpgrades): void {
    this.vehicleDef = definition;
    this.upgrades = upgrades;
  }

  public reset(x: number = 0, z: number = 0, yaw: number = 0): void {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.speedKmh = 0;
    this.steerAngle = 0;
    this.isReversing = false;
    this.isBraking = false;
  }

  public toggleHelmet(): boolean {
    this.isHelmetFastened = !this.isHelmetFastened;
    return this.isHelmetFastened;
  }

  public update(inputs: VehicleInputs, delta: number, obstacles: ObstacleBox[] = []): void {
    // Sub-stepping for physics stability even at variable frame rates
    const steps = Math.min(4, Math.max(1, Math.ceil(delta / this.FIXED_STEP)));
    const dt = delta / steps;

    for (let i = 0; i < steps; i++) {
      this.stepPhysics(inputs, dt, obstacles);
    }

    this.speedKmh = this.velocity.length() * 3.6;
  }

  private stepPhysics(inputs: VehicleInputs, dt: number, obstacles: ObstacleBox[]): void {
    // Compute upgraded vehicle attributes
    const engineMultiplier = 1 + this.upgrades.engineStage * 0.15;
    const brakeMultiplier = 1 + this.upgrades.brakeStage * 0.25;
    const tireGripMultiplier = 1 + this.upgrades.tireStage * 0.20;

    // Weather effects on grip
    let surfaceGrip = 1.0;
    if (this.weather === 'MONSOON_RAIN') {
      // Monsoon reduces standard grip by 40%, mitigated by tire upgrade
      surfaceGrip = 0.60 * tireGripMultiplier;
    }

    const maxSpeedMs = (this.vehicleDef.topSpeedKmh * engineMultiplier) / 3.6;
    const accelRate = this.vehicleDef.acceleration * engineMultiplier * surfaceGrip;
    const brakeRate = this.vehicleDef.brakeForce * brakeMultiplier * surfaceGrip;

    // Current forward and right unit vectors based on vehicle yaw
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const forwardSpeed = this.velocity.dot(forward);

    // 1. Steering computation (speed-sensitive steering)
    const speedRatio = Math.min(1.0, Math.abs(forwardSpeed) / (maxSpeedMs * 0.8));
    const maxSteer = THREE.MathUtils.lerp(0.58, 0.28, speedRatio);
    const steerSpeed = 6.0 * dt;

    let targetSteer = 0;
    if (inputs.steerLeft) targetSteer += maxSteer;
    if (inputs.steerRight) targetSteer -= maxSteer;

    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, steerSpeed * 3);

    // Turn vehicle if in motion
    if (Math.abs(forwardSpeed) > 0.08) {
      // In reverse, turn direction reverses intuitively
      const turnDirection = forwardSpeed >= 0 ? 1 : -1;
      const turnRate = (forwardSpeed / 2.0) * Math.tan(this.steerAngle) * dt * turnDirection;
      this.yaw += turnRate;
    }

    // 2. Throttle & Braking forces
    this.isBraking = false;
    let driveForce = 0;

    if (inputs.throttle && !inputs.brake) {
      if (forwardSpeed < maxSpeedMs) {
        driveForce += accelRate;
      }
      this.isReversing = false;
    }

    if (inputs.brake) {
      if (forwardSpeed > 0.3) {
        // Active forward braking
        driveForce -= brakeRate;
        this.isBraking = true;
        this.isReversing = false;
      } else {
        // Reverse gear when stopped or very slow
        const maxReverseMs = 3.6; // ~13 km/h
        if (forwardSpeed > -maxReverseMs) {
          driveForce -= accelRate * 0.6;
          this.isReversing = true;
        }
      }
    } else {
      this.isReversing = false;
    }

    if (inputs.handbrake) {
      driveForce -= brakeRate * 1.8;
      this.isBraking = true;
    }

    // 3. Environmental Resistance (Air Drag + Rolling Resistance)
    const dragForce = -0.5 * this.DRAG_COEFFICIENT * forwardSpeed * Math.abs(forwardSpeed);
    const rollingForce = -Math.sign(forwardSpeed) * Math.min(Math.abs(forwardSpeed), this.ROLLING_RESISTANCE);

    const totalForwardAccel = driveForce + dragForce + rollingForce;
    let newForwardSpeed = forwardSpeed + totalForwardAccel * dt;

    // If braking while moving forward, clamp to 0 so we don't overshoot into reverse during braking
    if (inputs.brake && forwardSpeed > 0.1 && newForwardSpeed < 0) {
      newForwardSpeed = 0;
      this.isReversing = false;
    }

    // Lateral friction: aggressively eliminate sideways drift except slight slip in monsoon rain
    const lateralSpeed = this.velocity.dot(right);
    const lateralDampingFactor = this.weather === 'MONSOON_RAIN' ? Math.exp(-9.0 * dt) : Math.exp(-28.0 * dt);
    const newLateralSpeed = lateralSpeed * lateralDampingFactor;

    // Reconstruct velocity
    this.velocity.copy(forward).multiplyScalar(newForwardSpeed).addScaledVector(right, newLateralSpeed);

    // Stop completely if speed is negligible and no input is active
    if (this.velocity.lengthSq() < 0.008 && !inputs.throttle && !inputs.brake && !inputs.handbrake) {
      this.velocity.set(0, 0, 0);
    }

    // 4. Position Integration
    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;

    // 5. Collision Detection against city obstacles (buildings, barriers)
    const bikeRadius = 0.65;
    let collided = false;
    let collidedObstacleName = 'barrier';

    for (const obs of obstacles) {
      if (
        nextX + bikeRadius > obs.minX &&
        nextX - bikeRadius < obs.maxX &&
        nextZ + bikeRadius > obs.minZ &&
        nextZ - bikeRadius < obs.maxZ
      ) {
        collided = true;
        collidedObstacleName = obs.name || 'barrier';

        // Elastic bounce & velocity dampening
        this.velocity.multiplyScalar(-0.35); // Slight bounce back

        // Notify collision listener
        if (this.speedKmh > 10 && this.onCollision) {
          this.onCollision(this.speedKmh, collidedObstacleName);
        }
        break;
      }
    }

    if (!collided) {
      this.position.x = nextX;
      this.position.z = nextZ;
    }
  }
}
