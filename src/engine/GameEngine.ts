// ROADWISE — Master Game Engine & 3D Simulation Loop
import * as THREE from 'three';
import {
  PlayerProfile,
  DeliveryMission,
  ActiveMissionState,
  CameraViewMode,
  ViolationEvent,
  MinimapData,
} from '../types/game';
import { VEHICLE_ROSTER, COLOR_PALETTE } from '../services/storage';
import { soundEngine } from '../services/audio';
import { VehiclePhysics, VehicleInputs } from './VehiclePhysics';
import { createVehicleModel, VehicleMeshBundle } from './VehicleModel';
import { buildCity, CityBundle } from './CityBuilder';
import { TrafficRuleEngine, PlayerTelemetry } from './TrafficRuleEngine';
import { TrafficAIManager } from './TrafficAI';

export interface GameEngineCallbacks {
  onTelemetryUpdate: (
    speedKmh: number,
    helmet: boolean,
    timeRemaining: number,
    packageHealth: number,
    score: number,
    distanceMeters?: number,
    isNearCheckpoint?: boolean
  ) => void;
  onViolation: (event: ViolationEvent) => void;
  onMissionStatusChange: (state: ActiveMissionState) => void;
  onTwistEvent: (title: string, message: string) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(65, 1, 0.1, 800);

  private city: CityBundle | null = null;
  private trafficAI: TrafficAIManager | null = null;
  private ruleEngine: TrafficRuleEngine = new TrafficRuleEngine();

  private vehicleMesh: VehicleMeshBundle | null = null;
  private physics: VehiclePhysics | null = null;

  private profile: PlayerProfile;
  private activeMission: DeliveryMission;
  private missionState: ActiveMissionState;

  private cameraMode: CameraViewMode = 'CHASE';
  private inputs: VehicleInputs = { throttle: false, brake: false, steerLeft: false, steerRight: false, handbrake: false };

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  private callbacks: GameEngineCallbacks;

  // Minimap road network & A* route caching
  private cachedRoadSegments: [number, number][][] = [];
  private cachedRouteWaypoints: [number, number][] = [];
  private lastRouteCalcTime: number = 0;

  // Natural lighting & atmospheric visual assets
  private sunLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private bikeHeadlight: THREE.SpotLight | null = null;
  private navArrow: THREE.Group | null = null;

  private createNavArrow(): THREE.Group {
    const group = new THREE.Group();
    // 3D Holographic GPS Navigation Arrow hovering above player
    const arrowGeo = new THREE.ConeGeometry(0.36, 1.1, 16);
    arrowGeo.rotateX(Math.PI / 2); // Point forward along Z
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.z = 0.45;
    group.add(arrow);

    const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12);
    shaftGeo.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, arrowMat);
    shaft.position.z = -0.25;
    group.add(shaft);

    return group;
  }

  constructor(
    container: HTMLElement,
    profile: PlayerProfile,
    mission: DeliveryMission,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.profile = profile;
    this.activeMission = mission;
    this.callbacks = callbacks;

    this.missionState = {
      mission,
      currentDropoffIndex: 0,
      timeRemainingSeconds: mission.timeLimitSeconds,
      packageHealth: 100,
      score: 1000,
      violations: [],
      isPickupComplete: false,
      isCompleted: false,
      isFailed: false,
      twistTriggered: false,
      twistResolved: false,
    };

    this.init();
  }

  private init(): void {
    // 1. Renderer Setup with AAA Tone Mapping & Color Management
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.12;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.error('WebGL initialization failure:', e);
      return;
    }

    // 2. Camera Setup
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();

    // 3. Environmental Lighting
    this.setupLighting();

    // 4. Build City & Roads
    this.city = buildCity();
    this.scene.add(this.city.scene);
    this.city.setWeather(this.activeMission.weather);

    // Cache road network polylines for minimap display
    this.cachedRoadSegments = [];
    for (const edge of this.city.roadNetwork.edges.values()) {
      const pts = edge.curve.getPoints(10);
      this.cachedRoadSegments.push(pts.map((p) => [p.x, p.z]));
    }

    // 5. Traffic AI
    this.trafficAI = new TrafficAIManager(this.city.roadNetwork);
    this.scene.add(this.trafficAI.group);

    // 6. Player Vehicle & Physics
    const def = VEHICLE_ROSTER[this.profile.selectedVehicleId];
    const upgrades = this.profile.vehicleUpgrades[this.profile.selectedVehicleId];
    const colorHex = COLOR_PALETTE[upgrades.colorIndex]?.hex || def.modelColor;

    this.physics = new VehiclePhysics(def, upgrades);
    this.physics.setWeather(this.activeMission.weather);
    this.physics.reset(0, 5, 0); // Start on left lane of South Avenue

    // Collision listener
    this.physics.onCollision = (impactSpeedKmh, obstacleName) => {
      soundEngine.playCollisionThud();
      // Package damage proportional to speed
      const dmg = Math.min(30, Math.round(impactSpeedKmh * 0.45));
      this.missionState.packageHealth = Math.max(0, this.missionState.packageHealth - dmg);

      const collisionEvent = this.ruleEngine.triggerCollision(impactSpeedKmh, obstacleName);
      if (collisionEvent) {
        soundEngine.playViolationBuzz();
        this.missionState.violations.push(collisionEvent);
        this.callbacks.onViolation(collisionEvent);
      }

      if (this.missionState.packageHealth <= 0) {
        this.failMission('Package was destroyed due to excessive collision damage!');
      }
    };

    this.vehicleMesh = createVehicleModel(this.profile.selectedVehicleId, colorHex);
    this.scene.add(this.vehicleMesh.root);

    // Motorcycle Dynamic Headlight Spotlight
    this.bikeHeadlight = new THREE.SpotLight(0xfffbeb, 2.8, 42, Math.PI / 4.8, 0.65, 1.2);
    this.bikeHeadlight.castShadow = true;
    this.bikeHeadlight.shadow.mapSize.width = 512;
    this.bikeHeadlight.shadow.mapSize.height = 512;
    this.scene.add(this.bikeHeadlight);
    this.scene.add(this.bikeHeadlight.target);

    // 3D Floating Holographic GPS Waypoint Arrow
    this.navArrow = this.createNavArrow();
    this.scene.add(this.navArrow);

    // 7. Update checkpoint marker positions
    this.updateMarkerPositions();

    // 8. Audio setup
    soundEngine.init();
    soundEngine.startEngine();
    soundEngine.setRain(this.activeMission.weather === 'MONSOON_RAIN');

    // 9. Resize handler
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting(): void {
    const isNight = this.activeMission.weather === 'NIGHT';
    const isRain = this.activeMission.weather === 'MONSOON_RAIN';

    const skyColor = isNight ? 0x050811 : isRain ? 0x334155 : 0x87ceeb;
    const fogColor = isNight ? 0x050811 : isRain ? 0x475569 : 0xbae6fd;
    const fogDensity = isNight ? 0.012 : isRain ? 0.009 : 0.0035;

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // Ambient Hemisphere Light (Sky bounce + Ground reflection)
    this.hemiLight = new THREE.HemisphereLight(
      isNight ? 0x1e293b : isRain ? 0x94a3b8 : 0x7dd3fc,
      isNight ? 0x090d16 : 0x334155,
      isNight ? 0.4 : isRain ? 0.7 : 0.85
    );
    this.scene.add(this.hemiLight);

    // Primary Directional Sun / Moon Light
    this.sunLight = new THREE.DirectionalLight(
      isNight ? 0x38bdf8 : isRain ? 0xbfdbfe : 0xfff7ed,
      isNight ? 0.35 : isRain ? 0.85 : 1.35
    );
    this.sunLight.position.set(65, 95, 45);
    this.sunLight.castShadow = !isNight;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  private updateMarkerPositions(): void {
    if (!this.city) return;
    const [px, , pz] = this.activeMission.pickupPos;
    this.city.pickupMarker.position.set(px, 0, pz);
    this.city.pickupMarker.visible = !this.missionState.isPickupComplete;

    const currentDropoff = this.activeMission.dropoffLocations[this.missionState.currentDropoffIndex];
    if (currentDropoff) {
      const [dx, , dz] = currentDropoff;
      this.city.dropoffMarker.position.set(dx, 0, dz);
      this.city.dropoffMarker.visible = this.missionState.isPickupComplete;
    }
  }

  private onResize = (): void => {
    if (!this.renderer || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setInputs(inputs: VehicleInputs): void {
    this.inputs = inputs;
  }

  public setCameraMode(mode: CameraViewMode): void {
    this.cameraMode = mode;
  }

  public toggleHelmet(): boolean {
    if (!this.physics) return false;
    const result = this.physics.toggleHelmet();
    soundEngine.playClick();
    return result;
  }

  public pause(): void {
    this.isPaused = true;
    soundEngine.stopEngine();
  }

  public resume(): void {
    this.isPaused = false;
    soundEngine.startEngine();
    this.lastTime = performance.now();
  }

  public interact(): void {
    if (!this.physics) return;
    const playerPos = this.physics.position;

    if (!this.missionState.isPickupComplete) {
      // Check distance to pickup
      const [px, , pz] = this.activeMission.pickupPos;
      const dist = Math.hypot(playerPos.x - px, playerPos.z - pz);
      if (dist < 4.5) {
        this.missionState.isPickupComplete = true;
        soundEngine.playSuccessChime();
        this.updateMarkerPositions();
        this.callbacks.onMissionStatusChange(this.missionState);
      }
    } else {
      // Check distance to current dropoff
      const currentDropoff = this.activeMission.dropoffLocations[this.missionState.currentDropoffIndex];
      if (currentDropoff) {
        const [dx, , dz] = currentDropoff;
        const dist = Math.hypot(playerPos.x - dx, playerPos.z - dz);
        if (dist < 4.5) {
          soundEngine.playSuccessChime();
          this.missionState.currentDropoffIndex++;

          if (this.missionState.currentDropoffIndex >= this.activeMission.dropoffLocations.length) {
            // Delivery completed!
            this.completeMission();
          } else {
            // Next dropoff in multi-stop mission
            this.updateMarkerPositions();
            this.callbacks.onMissionStatusChange(this.missionState);
          }
        }
      }
    }
  }

  private completeMission(): void {
    this.missionState.isCompleted = true;
    this.isRunning = false;
    soundEngine.stopEngine();

    const summary = this.ruleEngine.calculateSummary(
      this.missionState.score,
      100,
      this.missionState.packageHealth
    );
    this.missionState.score = summary.finalScore;

    this.callbacks.onMissionStatusChange(this.missionState);
  }

  private failMission(reason: string): void {
    this.missionState.isFailed = true;
    this.missionState.failureReason = reason;
    this.isRunning = false;
    soundEngine.stopEngine();
    soundEngine.playViolationBuzz();
    this.callbacks.onMissionStatusChange(this.missionState);
  }

  private animate = (now: number): void => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Mission Timer Countdown
    this.missionState.timeRemainingSeconds -= delta;
    if (this.missionState.timeRemainingSeconds <= 0) {
      this.failMission('Delivery deadline exceeded! Customer cancelled order.');
      return;
    }

    // 2. City & Weather Updates
    if (this.city) {
      this.city.updateSignals(delta);
      this.city.updateRain(delta);

      // Safe Marker pulsing animations
      const bob = Math.sin(now * 0.004) * 0.3;
      if (this.city.pickupMarker.children[2]) {
        this.city.pickupMarker.children[2].position.y = 2.5 + bob;
        this.city.pickupMarker.children[2].rotation.y += delta * 1.6;
      }
      if (this.city.dropoffMarker.children[2]) {
        this.city.dropoffMarker.children[2].position.y = 2.5 + bob;
        this.city.dropoffMarker.children[2].rotation.y += delta * 1.6;
      }
    }

    // 3. Traffic AI & Pedestrians
    if (this.trafficAI && this.city) {
      this.trafficAI.update(delta, this.city.trafficLights);
    }

    // 4. Vehicle Physics Update
    if (this.physics && this.city) {
      this.physics.update(this.inputs, delta, this.city.obstacles);

      // Sound update
      soundEngine.updateEngine(
        this.physics.speedKmh,
        VEHICLE_ROSTER[this.profile.selectedVehicleId].topSpeedKmh,
        this.inputs.throttle
      );

      if (this.physics.isBraking && this.physics.speedKmh > 18) {
        soundEngine.playBrakeSqueal();
      }

      // Sync 3D Mesh with Physics
      if (this.vehicleMesh) {
        this.vehicleMesh.root.position.copy(this.physics.position);
        this.vehicleMesh.root.rotation.y = this.physics.yaw;
        this.vehicleMesh.updateVisuals(
          this.physics.speedKmh,
          this.physics.steerAngle,
          this.physics.isBraking,
          this.physics.isHelmetFastened,
          delta
        );
      }

      // Sync Headlight with Motorcycle position and heading
      if (this.bikeHeadlight) {
        const yaw = this.physics.yaw;
        const hx = this.physics.position.x + Math.sin(yaw) * 0.6;
        const hz = this.physics.position.z + Math.cos(yaw) * 0.6;
        this.bikeHeadlight.position.set(hx, this.physics.position.y + 0.95, hz);
        this.bikeHeadlight.target.position.set(
          hx + Math.sin(yaw) * 22,
          0.1,
          hz + Math.cos(yaw) * 22
        );
      }

      // Compute Distance to Current Target Checkpoint
      const currentTarget = !this.missionState.isPickupComplete
        ? this.activeMission.pickupPos
        : this.activeMission.dropoffLocations[this.missionState.currentDropoffIndex];

      const distanceMeters = currentTarget
        ? Math.hypot(this.physics.position.x - currentTarget[0], this.physics.position.z - currentTarget[2])
        : 0;
      const isNearCheckpoint = distanceMeters <= 5.0;

      // Update 3D Holographic Waypoint Arrow
      if (this.navArrow && currentTarget) {
        const arrowBob = Math.sin(now * 0.006) * 0.12;
        this.navArrow.position.set(
          this.physics.position.x,
          this.physics.position.y + 1.85 + arrowBob,
          this.physics.position.z
        );
        const targetAngle = Math.atan2(
          currentTarget[0] - this.physics.position.x,
          currentTarget[2] - this.physics.position.z
        );
        this.navArrow.rotation.y = targetAngle;

        // Change color based on stage: Emerald Green (Pickup) vs Amber Gold (Delivery)
        const arrowMesh = this.navArrow.children[0] as THREE.Mesh;
        if (arrowMesh && (arrowMesh.material as THREE.MeshStandardMaterial)) {
          const mat = arrowMesh.material as THREE.MeshStandardMaterial;
          const targetColor = !this.missionState.isPickupComplete ? 0x10b981 : 0xf59e0b;
          mat.color.setHex(targetColor);
          mat.emissive.setHex(targetColor);
        }
      }

      // 5. Update Camera Follow
      this.updateCamera(delta);

      // Route guidance update (A* shortest legal path)
      this.updateRouteWaypoints();

      // 6. Traffic Rule Engine Telemetry Check
      this.evaluateRules(now);

      // 7. Logical Twists Event Triggering
      this.evaluateTwists();

      // UI Telemetry Callback with Distance & Checkpoint Proximity
      this.callbacks.onTelemetryUpdate(
        this.physics.speedKmh,
        this.physics.isHelmetFastened,
        Math.max(0, Math.ceil(this.missionState.timeRemainingSeconds)),
        this.missionState.packageHealth,
        this.missionState.score,
        distanceMeters,
        isNearCheckpoint
      );
    }

    // 8. Render Scene
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private updateCamera(delta: number): void {
    if (!this.physics) return;

    const pos = this.physics.position;
    const yaw = this.physics.yaw;

    if (this.cameraMode === 'CHASE') {
      // Elevated rear chase camera with smooth lerp
      const distBehind = 6.8;
      const height = 3.2;

      const targetX = pos.x - Math.sin(yaw) * distBehind;
      const targetZ = pos.z - Math.cos(yaw) * distBehind;
      const targetY = pos.y + height;

      this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 10.0 * delta);
      this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);

    } else if (this.cameraMode === 'FIRST_PERSON') {
      // Cockpit / Handlebar view
      const camX = pos.x + Math.sin(yaw) * 0.4;
      const camZ = pos.z + Math.cos(yaw) * 0.4;
      this.camera.position.set(camX, pos.y + 1.25, camZ);

      const lookAhead = 15;
      this.camera.lookAt(pos.x + Math.sin(yaw) * lookAhead, pos.y + 0.9, pos.z + Math.cos(yaw) * lookAhead);

    } else {
      // Top-Down tactical view
      this.camera.position.set(pos.x, pos.y + 35, pos.z);
      this.camera.lookAt(pos.x, pos.y, pos.z);
    }
  }

  private evaluateRules(now: number): void {
    if (!this.physics || !this.city || !this.trafficAI) return;

    // Find nearest intersection
    let nearestLight = undefined;
    let minD = Infinity;
    for (const light of this.city.trafficLights) {
      const d = Math.hypot(this.physics.position.x - light.position[0], this.physics.position.z - light.position[2]);
      if (d < minD) {
        minD = d;
        nearestLight = light;
      }
    }

    // Check if player is near construction no-entry zone
    const inNoEntryZone =
      this.physics.position.x > 18 &&
      this.physics.position.x < 30 &&
      this.physics.position.z > -28 &&
      this.physics.position.z < -22;

    const pDist = this.trafficAI.getNearestPedestrianDistance(this.physics.position);
    const ambDist = this.trafficAI.getAmbulanceDistance(this.physics.position);

    const telemetry: PlayerTelemetry = {
      position: [this.physics.position.x, this.physics.position.y, this.physics.position.z],
      velocity: [this.physics.velocity.x, this.physics.velocity.y, this.physics.velocity.z],
      speedKmh: this.physics.speedKmh,
      heading: this.physics.yaw,
      isHelmetFastened: this.physics.isHelmetFastened,
      isInNoEntryZone: inNoEntryZone,
      activeSpeedLimitKmh: this.activeMission.speedLimitKmh,
      nearestIntersection: nearestLight,
      isPedestrianCrossingActive: pDist < 12.0,
      distanceToPedestrian: pDist,
      isAmbulanceNearby: ambDist < 30.0,
      distanceToAmbulance: ambDist,
    };

    const violations = this.ruleEngine.evaluate(telemetry, now);
    for (const v of violations) {
      if (v.severity === 'reward') {
        soundEngine.playSuccessChime();
        this.missionState.score += Math.abs(v.pointsDeduction);
      } else {
        soundEngine.playViolationBuzz();
        this.missionState.violations.push(v);
        this.missionState.score = Math.max(0, this.missionState.score - v.pointsDeduction);
      }
      this.callbacks.onViolation(v);
    }
  }

  private evaluateTwists(): void {
    if (!this.physics || this.missionState.twistTriggered) return;

    // Emergency vehicle twist: start siren when nearing ambulance
    if (this.activeMission.twistType === 'EMERGENCY_VEHICLE' && this.trafficAI) {
      const dist = this.trafficAI.getAmbulanceDistance(this.physics.position);
      if (dist < 35.0) {
        this.missionState.twistTriggered = true;
        soundEngine.startSiren();
        this.callbacks.onTwistEvent(
          'Emergency Vehicle Approaching!',
          'An ambulance is approaching rapidly from behind. Pull over to the left side of the lane and stop.'
        );
      }
    } else if (this.activeMission.twistType === 'SHORTCUT_TRAP') {
      // Player approaching the construction alley
      const distToAlley = Math.hypot(this.physics.position.x - 24, this.physics.position.z - (-25));
      if (distToAlley < 18.0) {
        this.missionState.twistTriggered = true;
        this.callbacks.onTwistEvent(
          'Shortcut Ahead Closed!',
          'Notice the circular NO ENTRY sign and barricades. Follow the legal avenue detour.'
        );
      }
    } else if (this.activeMission.twistType === 'DECEPTIVE_GREEN') {
      // Deceptive green twist: intersection has green light, but child/pedestrian in junction
      if (this.physics.position.distanceTo(new THREE.Vector3(0, 0, -8)) < 16.0) {
        this.missionState.twistTriggered = true;
        this.callbacks.onTwistEvent(
          'Deceptive Green Caution!',
          'The signal is green, but a pedestrian is still crossing the junction. Practice defensive driving and yield!'
        );
      }
    }
  }

  private updateRouteWaypoints(): void {
    if (!this.city || !this.physics) return;
    const now = performance.now();
    if (now - this.lastRouteCalcTime < 400 && this.cachedRouteWaypoints.length > 0) return;
    this.lastRouteCalcTime = now;

    const playerPos: [number, number] = [this.physics.position.x, this.physics.position.z];
    const currentDropoff = this.activeMission.dropoffLocations[this.missionState.currentDropoffIndex];
    const targetPos: [number, number] = !this.missionState.isPickupComplete
      ? [this.activeMission.pickupPos[0], this.activeMission.pickupPos[2]]
      : currentDropoff
        ? [currentDropoff[0], currentDropoff[2]]
        : playerPos;

    const path3D = this.city.findPath(playerPos, targetPos);
    this.cachedRouteWaypoints = path3D.map((p) => [p.x, p.z]);
  }

  public getMinimapData(): MinimapData {
    const playerPos: [number, number] = this.physics
      ? [this.physics.position.x, this.physics.position.z]
      : [0, 0];
    const playerHeading = this.physics ? this.physics.yaw : 0;

    const currentDropoff = this.activeMission.dropoffLocations[this.missionState.currentDropoffIndex];

    return {
      playerPos,
      playerHeading,
      pickupPos: [this.activeMission.pickupPos[0], this.activeMission.pickupPos[2]],
      dropoffPos: currentDropoff ? [currentDropoff[0], currentDropoff[2]] : null,
      trafficLights: this.city
        ? this.city.trafficLights.map((l) => ({ pos: [l.position[0], l.position[2]], state: l.state }))
        : [],
      aiCars: this.trafficAI
        ? this.trafficAI.cars.map((c) => ({ pos: [c.position.x, c.position.z], isAmbulance: c.isAmbulance }))
        : [],
      roadSegments: this.cachedRoadSegments,
      routeWaypoints: this.cachedRouteWaypoints,
    };
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);

    soundEngine.stopEngine();
    soundEngine.stopSiren();
    soundEngine.setRain(false);

    // Thorough Three.js GPU memory cleanup
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
