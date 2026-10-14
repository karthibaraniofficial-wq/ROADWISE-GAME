// ROADWISE — Local Storage & Persistence Service
import { PlayerProfile, VehicleId, VehicleDefinition } from '../types/game';

const STORAGE_KEY = 'ROADWISE_SAVE_V1';

export const VEHICLE_ROSTER: Record<VehicleId, VehicleDefinition> = {
  scooty_110: {
    id: 'scooty_110',
    name: 'Scooty 110',
    category: 'Starter Scooter',
    description: 'Reliable entry-level automatic scooter. Lightweight and agile for navigating narrow traffic.',
    topSpeedKmh: 42,
    acceleration: 4.8,
    brakeForce: 7.0,
    handling: 8.5,
    wetGrip: 6.0,
    priceINR: 0,
    unlockLevel: 1,
    modelColor: '#0ea5e9', // Sky Blue
  },
  tork_125: {
    id: 'tork_125',
    name: 'Tork Cargo 125',
    category: 'Heavy Cargo',
    description: 'Reinforced delivery workhorse with heavy rear cargo rack and high low-end torque.',
    topSpeedKmh: 48,
    acceleration: 5.5,
    brakeForce: 8.5,
    handling: 7.2,
    wetGrip: 7.5,
    priceINR: 650,
    unlockLevel: 2,
    modelColor: '#f97316', // Orange
  },
  pulsar_150: {
    id: 'pulsar_150',
    name: 'Pulsar 150 Street',
    category: 'Sport Commuter',
    description: 'Geared motorcycle with sharp throttle response and front disc brake. Ideal for long avenue runs.',
    topSpeedKmh: 58,
    acceleration: 6.8,
    brakeForce: 9.5,
    handling: 8.0,
    wetGrip: 7.0,
    priceINR: 1400,
    unlockLevel: 4,
    modelColor: '#ef4444', // Red
  },
  ather_apex: {
    id: 'ather_apex',
    name: 'Ather Apex EV',
    category: 'Electric Pro',
    description: 'State-of-the-art electric flagship with instant torque, regenerative ABS braking, and monsoon grip.',
    topSpeedKmh: 65,
    acceleration: 8.2,
    brakeForce: 11.0,
    handling: 9.5,
    wetGrip: 9.0,
    priceINR: 2800,
    unlockLevel: 7,
    modelColor: '#10b981', // Emerald Green
  },
};

export const COLOR_PALETTE = [
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Crimson Fury', hex: '#ef4444' },
  { name: 'Cyber Amber', hex: '#f59e0b' },
  { name: 'Midnight Stealth', hex: '#1e293b' },
  { name: 'Monsoon Emerald', hex: '#10b981' },
  { name: 'Delivery Orange', hex: '#f97316' },
];

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  name: 'Courier Rookie',
  licenseGrade: 'Learner (L)',
  level: 1,
  xp: 0,
  currencyINR: 300, // Starter funds for early upgrade/fine cushion
  safetyScore: 95,
  selectedVehicleId: 'scooty_110',
  ownedVehicles: ['scooty_110'],
  vehicleUpgrades: {
    scooty_110: { engineStage: 0, brakeStage: 0, tireStage: 0, colorIndex: 0 },
    tork_125: { engineStage: 0, brakeStage: 0, tireStage: 0, colorIndex: 5 },
    pulsar_150: { engineStage: 0, brakeStage: 0, tireStage: 0, colorIndex: 1 },
    ather_apex: { engineStage: 0, brakeStage: 0, tireStage: 0, colorIndex: 4 },
  },
  completedMissionIds: [],
  stats: {
    deliveriesCompleted: 0,
    violationsCount: 0,
    cleanDeliveries: 0,
    distanceTraveledKm: 0,
  },
};

export function updateLicenseGrade(xp: number, safetyScore: number): PlayerProfile['licenseGrade'] {
  if (xp >= 1500 && safetyScore >= 80) return 'Master Delivery Partner';
  if (xp >= 700 && safetyScore >= 70) return 'Commercial Driver';
  if (xp >= 200 && safetyScore >= 60) return 'Provisional (P)';
  return 'Learner (L)';
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_PROFILE };

    const parsed = JSON.parse(raw);
    // Validate essential properties
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PLAYER_PROFILE };

    const profile: PlayerProfile = {
      name: typeof parsed.name === 'string' ? parsed.name : DEFAULT_PLAYER_PROFILE.name,
      licenseGrade: DEFAULT_PLAYER_PROFILE.licenseGrade,
      level: Math.max(1, Number(parsed.level) || 1),
      xp: Math.max(0, Number(parsed.xp) || 0),
      currencyINR: Math.max(0, Number(parsed.currencyINR) || 0), // Never negative
      safetyScore: Math.min(100, Math.max(0, Number(parsed.safetyScore) ?? 95)),
      selectedVehicleId: parsed.selectedVehicleId in VEHICLE_ROSTER ? parsed.selectedVehicleId : 'scooty_110',
      ownedVehicles: Array.isArray(parsed.ownedVehicles) && parsed.ownedVehicles.length > 0
        ? parsed.ownedVehicles.filter((id: VehicleId) => id in VEHICLE_ROSTER)
        : ['scooty_110'],
      vehicleUpgrades: parsed.vehicleUpgrades || DEFAULT_PLAYER_PROFILE.vehicleUpgrades,
      completedMissionIds: Array.isArray(parsed.completedMissionIds) ? parsed.completedMissionIds : [],
      stats: {
        deliveriesCompleted: Math.max(0, Number(parsed.stats?.deliveriesCompleted) || 0),
        violationsCount: Math.max(0, Number(parsed.stats?.violationsCount) || 0),
        cleanDeliveries: Math.max(0, Number(parsed.stats?.cleanDeliveries) || 0),
        distanceTraveledKm: Math.max(0, Number(parsed.stats?.distanceTraveledKm) || 0),
      },
    };

    profile.licenseGrade = updateLicenseGrade(profile.xp, profile.safetyScore);
    return profile;
  } catch (err) {
    console.warn('Failed to load save profile; falling back to default:', err);
    return { ...DEFAULT_PLAYER_PROFILE };
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    // Ensure invariants before saving
    profile.currencyINR = Math.max(0, Math.round(profile.currencyINR));
    profile.xp = Math.max(0, Math.round(profile.xp));
    profile.safetyScore = Math.min(100, Math.max(0, Math.round(profile.safetyScore)));
    profile.level = Math.max(1, Math.floor(profile.xp / 250) + 1);
    profile.licenseGrade = updateLicenseGrade(profile.xp, profile.safetyScore);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to persist profile:', err);
  }
}

export function resetPlayerProfile(): PlayerProfile {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not remove storage item:', err);
  }
  return { ...DEFAULT_PLAYER_PROFILE };
}
