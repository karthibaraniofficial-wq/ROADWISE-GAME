// ROADWISE — Core Type Definitions

export type VehicleId = 'scooty_110' | 'tork_125' | 'pulsar_150' | 'ather_apex';

export interface VehicleDefinition {
  id: VehicleId;
  name: string;
  category: 'Starter Scooter' | 'Heavy Cargo' | 'Sport Commuter' | 'Electric Pro';
  description: string;
  topSpeedKmh: number;
  acceleration: number; // m/s^2
  brakeForce: number;
  handling: number;
  wetGrip: number;
  priceINR: number;
  unlockLevel: number;
  modelColor: string;
}

export interface VehicleUpgrades {
  engineStage: number; // 0, 1, 2, 3
  brakeStage: number;  // 0, 1, 2 (Drum -> Disc -> ABS)
  tireStage: number;   // 0, 1, 2 (Standard -> Soft -> All-Weather Monsoon)
  colorIndex: number;  // index of paint color
}

export type TrafficLightColor = 'RED' | 'AMBER' | 'GREEN';

export interface TrafficLightData {
  id: string;
  position: [number, number, number];
  rotationY: number;
  state: TrafficLightColor;
  timer: number;
  cycleDuration: { red: number; amber: number; green: number };
  stopLinePos: [number, number, number];
  approachHeading: number; // radians (heading of incoming traffic)
}

export type RuleViolationType =
  | 'RULE_RED_LIGHT'
  | 'RULE_STOP_LINE'
  | 'RULE_SPEEDING'
  | 'RULE_HELMET'
  | 'RULE_WRONG_WAY'
  | 'RULE_ZEBRA_YIELD'
  | 'RULE_EMERGENCY_YIELD'
  | 'RULE_COLLISION'
  | 'RULE_ILLEGAL_ENTRY'
  | 'RULE_SAFE_STOP';

export interface ViolationEvent {
  id: string;
  type: RuleViolationType;
  title: string;
  message: string;
  advice: string;
  pointsDeduction: number;
  fineINR: number;
  timestamp: number;
  severity: 'minor' | 'moderate' | 'critical' | 'reward';
}

export type WeatherType = 'DAY_CLEAR' | 'MONSOON_RAIN' | 'NIGHT';

export type LogicalTwistType =
  | 'NONE'
  | 'DECEPTIVE_GREEN'
  | 'SHORTCUT_TRAP'
  | 'CHANGING_WEATHER'
  | 'EMERGENCY_VEHICLE'
  | 'CONFLICTING_INSTRUCTIONS'
  | 'ROAD_CLOSURE'
  | 'DISTRACTED_PEDESTRIAN'
  | 'MULTI_STOP'
  | 'FINAL_JUDGMENT';

export interface DeliveryMission {
  id: number;
  title: string;
  subtitle: string;
  client: string;
  briefing: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  rewardINR: number;
  rewardXP: number;
  timeLimitSeconds: number;
  pickupPos: [number, number, number];
  dropoffLocations: [number, number, number][]; // Supports multi-stop
  weather: WeatherType;
  speedLimitKmh: number;
  twistType: LogicalTwistType;
  rulesHighlight: string[];
  unlockedByDefault: boolean;
}

export interface PlayerStats {
  deliveriesCompleted: number;
  violationsCount: number;
  cleanDeliveries: number;
  distanceTraveledKm: number;
}

export interface PlayerProfile {
  name: string;
  licenseGrade: 'Learner (L)' | 'Provisional (P)' | 'Commercial Driver' | 'Master Delivery Partner';
  level: number;
  xp: number;
  currencyINR: number;
  safetyScore: number; // 0 to 100
  selectedVehicleId: VehicleId;
  ownedVehicles: VehicleId[];
  vehicleUpgrades: Record<VehicleId, VehicleUpgrades>;
  completedMissionIds: number[];
  stats: PlayerStats;
}

export type CameraViewMode = 'CHASE' | 'FIRST_PERSON' | 'TOP_DOWN';

export interface ActiveMissionState {
  mission: DeliveryMission;
  currentDropoffIndex: number;
  timeRemainingSeconds: number;
  packageHealth: number; // 0 to 100
  score: number;
  violations: ViolationEvent[];
  isPickupComplete: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  failureReason?: string;
  twistTriggered: boolean;
  twistResolved: boolean;
  twistSuccess?: boolean;
}

export interface KeyBindings {
  forward: string;
  brake: string;
  left: string;
  right: string;
  handbrake: string;
  interact: string;
  helmet: string;
  horn: string;
  camera: string;
  pause: string;
}

export interface GameSettings {
  masterVolume: number; // 0 to 1
  sfxVolume: number;    // 0 to 1
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  cameraSensitivity: number; // 0.5 to 2.0
  hudScale: number; // 0.8 to 1.3
  reducedMotion: boolean;
  keyBindings: KeyBindings;
}

export interface SaveSlot {
  id: string; // e.g. "slot_1", "slot_2", "slot_3"
  saveName: string;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
  profile: PlayerProfile;
  settings: GameSettings;
}

export type CloudSyncStatus = 'IDLE' | 'SYNCED' | 'SYNCING' | 'OFFLINE_LOCAL' | 'ERROR';

export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  displayName: string | null;
  emailVerified: boolean;
  avatarUrl?: string;
}
