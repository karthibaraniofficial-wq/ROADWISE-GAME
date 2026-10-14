// ROADWISE — Multi-Slot Game Save & Persistence Coordinator
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  PlayerProfile,
  GameSettings,
  SaveSlot,
  ActiveMissionState,
} from '../types/game';
import {
  DEFAULT_PLAYER_PROFILE,
  loadPlayerProfile as loadLegacyV1Profile,
} from './storage';

const SAVE_SLOTS_LOCAL_PREFIX = 'ROADWISE_SAVE_SLOTS_V2';
const ACTIVE_SLOT_LOCAL_KEY = 'ROADWISE_ACTIVE_SLOT_ID';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.85,
  graphicsQuality: 'HIGH',
  cameraSensitivity: 1.0,
  hudScale: 1.0,
  reducedMotion: false,
  keyBindings: {
    forward: 'KeyW',
    brake: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    handbrake: 'Space',
    interact: 'KeyE',
    helmet: 'KeyH',
    horn: 'KeyE',
    camera: 'KeyC',
    pause: 'Escape',
  },
};

/**
 * Creates a default starter save slot.
 */
export function createDefaultSaveSlot(
  id: string = 'slot_1',
  name: string = 'Primary Career',
  initialProfile?: PlayerProfile
): SaveSlot {
  return {
    id,
    saveName: name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    schemaVersion: 2,
    profile: initialProfile || { ...DEFAULT_PLAYER_PROFILE },
    settings: { ...DEFAULT_GAME_SETTINGS },
  };
}

/**
 * Migrate legacy V1 save data from localStorage if available.
 */
function getMigratedLegacySlots(userId: string): SaveSlot[] {
  const legacyProfile = loadLegacyV1Profile();
  const starterSlot = createDefaultSaveSlot('slot_1', 'Legacy Career', legacyProfile);
  const slots = [starterSlot];
  saveSlotsToLocalStorage(userId, slots);
  return slots;
}

function getLocalSlots(userId: string): SaveSlot[] {
  const key = `${SAVE_SLOTS_LOCAL_PREFIX}_${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    return getMigratedLegacySlots(userId);
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[ROADWISE] Corrupted local save slots cache; resetting to default:', err);
  }
  return getMigratedLegacySlots(userId);
}

function saveSlotsToLocalStorage(userId: string, slots: SaveSlot[]): void {
  const key = `${SAVE_SLOTS_LOCAL_PREFIX}_${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(slots));
  } catch (err) {
    console.error('[ROADWISE] Failed to cache save slots to localStorage:', err);
  }
}

/**
 * Fetch all available save slots for the player (from Firestore or local fallback).
 */
export async function listPlayerSaveSlots(userId: string): Promise<SaveSlot[]> {
  const localSlots = getLocalSlots(userId);

  if (!isFirebaseConfigured() || !db) {
    return localSlots;
  }

  try {
    const savesCollection = collection(db, 'users', userId, 'gameSaves');
    const q = query(savesCollection, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      // First cloud visit: initialize cloud with local slots
      for (const slot of localSlots) {
        await setDoc(doc(savesCollection, slot.id), slot);
      }
      return localSlots;
    }

    const cloudSlots: SaveSlot[] = [];
    snap.forEach((docSnap) => {
      cloudSlots.push(docSnap.data() as SaveSlot);
    });

    // Cache latest cloud slots locally
    saveSlotsToLocalStorage(userId, cloudSlots);
    return cloudSlots;
  } catch (err) {
    console.warn('[ROADWISE] Could not reach Firestore for save slots; falling back to local:', err);
    return localSlots;
  }
}

/**
 * Save progress into a designated slot.
 */
export async function savePlayerGame(
  userId: string,
  slotId: string,
  saveName: string,
  profile: PlayerProfile,
  settings: GameSettings = DEFAULT_GAME_SETTINGS
): Promise<SaveSlot> {
  const localSlots = getLocalSlots(userId);
  const existingIdx = localSlots.findIndex((s) => s.id === slotId);

  const updatedSlot: SaveSlot = {
    id: slotId,
    saveName: saveName.trim() || 'Courier Slot',
    createdAt: existingIdx >= 0 ? localSlots[existingIdx].createdAt : Date.now(),
    updatedAt: Date.now(),
    schemaVersion: 2,
    profile: {
      ...profile,
      currencyINR: Math.max(0, Math.round(profile.currencyINR)),
      safetyScore: Math.min(100, Math.max(0, Math.round(profile.safetyScore))),
    },
    settings,
  };

  if (existingIdx >= 0) {
    localSlots[existingIdx] = updatedSlot;
  } else {
    localSlots.push(updatedSlot);
  }

  saveSlotsToLocalStorage(userId, localSlots);
  setActiveSaveSlotId(slotId);

  // Sync to Firestore if online
  if (isFirebaseConfigured() && db) {
    try {
      const slotDoc = doc(db, 'users', userId, 'gameSaves', slotId);
      await setDoc(slotDoc, updatedSlot);
    } catch (err) {
      console.warn('[ROADWISE] Could not sync save slot to cloud; saved locally:', err);
    }
  }

  return updatedSlot;
}

/**
 * Rename an existing save slot.
 */
export async function renamePlayerSaveSlot(
  userId: string,
  slotId: string,
  newName: string
): Promise<void> {
  const localSlots = getLocalSlots(userId);
  const target = localSlots.find((s) => s.id === slotId);
  if (!target) return;

  target.saveName = newName.trim();
  target.updatedAt = Date.now();
  saveSlotsToLocalStorage(userId, localSlots);

  if (isFirebaseConfigured() && db) {
    try {
      const slotDoc = doc(db, 'users', userId, 'gameSaves', slotId);
      await updateDoc(slotDoc, {
        saveName: target.saveName,
        updatedAt: target.updatedAt,
      });
    } catch (err) {
      console.warn('[ROADWISE] Failed to rename slot on cloud:', err);
    }
  }
}

/**
 * Delete a save slot.
 */
export async function deletePlayerSaveSlot(userId: string, slotId: string): Promise<void> {
  const localSlots = getLocalSlots(userId);
  const filtered = localSlots.filter((s) => s.id !== slotId);

  // Prevent zero save slots
  if (filtered.length === 0) {
    filtered.push(createDefaultSaveSlot('slot_1', 'Primary Career'));
  }

  saveSlotsToLocalStorage(userId, filtered);

  if (getActiveSaveSlotId() === slotId) {
    setActiveSaveSlotId(filtered[0].id);
  }

  if (isFirebaseConfigured() && db) {
    try {
      const slotDoc = doc(db, 'users', userId, 'gameSaves', slotId);
      await deleteDoc(slotDoc);
    } catch (err) {
      console.warn('[ROADWISE] Failed to delete slot on cloud:', err);
    }
  }
}

/**
 * Load a specific save slot.
 */
export async function loadPlayerSaveSlot(
  userId: string,
  slotId: string
): Promise<SaveSlot | null> {
  const localSlots = getLocalSlots(userId);
  const localMatch = localSlots.find((s) => s.id === slotId);

  if (!isFirebaseConfigured() || !db) {
    if (localMatch) setActiveSaveSlotId(slotId);
    return localMatch || null;
  }

  try {
    const slotDoc = doc(db, 'users', userId, 'gameSaves', slotId);
    const snap = await getDoc(slotDoc);

    if (snap.exists()) {
      const cloudSlot = snap.data() as SaveSlot;
      setActiveSaveSlotId(slotId);
      return cloudSlot;
    }
  } catch (err) {
    console.warn('[ROADWISE] Cloud load error; using local save slot:', err);
  }

  if (localMatch) {
    setActiveSaveSlotId(slotId);
  }
  return localMatch || null;
}

/**
 * Record mission completion to users/{userId}/missionHistory/{missionId}.
 */
export async function recordMissionHistory(
  userId: string,
  state: ActiveMissionState
): Promise<void> {
  const historyItem = {
    missionId: state.mission.id,
    missionTitle: state.mission.title,
    completionStatus: state.isCompleted && !state.isFailed ? 'SUCCESS' : 'FAILED',
    finalScore: state.score,
    safetyScore: Math.round(state.packageHealth),
    deliveryDurationSeconds: state.mission.timeLimitSeconds - state.timeRemainingSeconds,
    violationsCount: state.violations.length,
    violations: state.violations.map((v) => ({
      type: v.type,
      title: v.title,
      fineINR: v.fineINR,
      timestamp: v.timestamp,
    })),
    completedAt: Date.now(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      const historyDoc = doc(
        db,
        'users',
        userId,
        'missionHistory',
        `mission_${state.mission.id}_${Date.now()}`
      );
      await setDoc(historyDoc, historyItem);
    } catch (err) {
      console.warn('[ROADWISE] Failed to record cloud mission history:', err);
    }
  }
}

export function getActiveSaveSlotId(): string {
  return localStorage.getItem(ACTIVE_SLOT_LOCAL_KEY) || 'slot_1';
}

export function setActiveSaveSlotId(slotId: string): void {
  localStorage.setItem(ACTIVE_SLOT_LOCAL_KEY, slotId);
}
