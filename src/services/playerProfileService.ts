// ROADWISE — Player Profile Service (Firestore & Local Fallback)
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { PlayerProfile, AuthUser } from '../types/game';

const LOCAL_PROFILE_KEY = 'ROADWISE_USER_PROFILE_V2';

export interface FirestoreUserProfile {
  displayName: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  avatar: string;
  selectedVehicleId: string;
  playerLevel: number;
  totalXP: number;
  totalCurrency: number;
  safetyRating: number;
  lifetimeDeliveries: number;
  lifetimeViolations: number;
  tutorialCompleted: boolean;
}

export function getDefaultUserProfile(user: AuthUser, profile: PlayerProfile): FirestoreUserProfile {
  return {
    displayName: user.displayName || profile.name || 'Courier Partner',
    email: user.email || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    avatar: '🛵',
    selectedVehicleId: profile.selectedVehicleId,
    playerLevel: profile.level,
    totalXP: profile.xp,
    totalCurrency: profile.currencyINR,
    safetyRating: profile.safetyScore,
    lifetimeDeliveries: profile.stats.deliveriesCompleted,
    lifetimeViolations: profile.stats.violationsCount,
    tutorialCompleted: profile.completedMissionIds.length > 0,
  };
}

/**
 * Fetch or initialize the user profile document in users/{uid}.
 */
export async function getOrInitializeUserProfile(
  user: AuthUser,
  fallbackProfile: PlayerProfile
): Promise<FirestoreUserProfile> {
  const localRaw = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${user.uid}`);
  let localData: FirestoreUserProfile | null = null;
  if (localRaw) {
    try {
      localData = JSON.parse(localRaw);
    } catch {
      localData = null;
    }
  }

  if (!isFirebaseConfigured() || !db) {
    if (localData) return localData;
    const initial = getDefaultUserProfile(user, fallbackProfile);
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${user.uid}`, JSON.stringify(initial));
    return initial;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as FirestoreUserProfile;
      localStorage.setItem(`${LOCAL_PROFILE_KEY}_${user.uid}`, JSON.stringify(data));
      return data;
    } else {
      // Create new profile
      const newProfile = getDefaultUserProfile(user, fallbackProfile);
      await setDoc(userDocRef, newProfile);
      localStorage.setItem(`${LOCAL_PROFILE_KEY}_${user.uid}`, JSON.stringify(newProfile));
      return newProfile;
    }
  } catch (err) {
    console.warn('[ROADWISE] Failed to fetch cloud profile; using local fallback:', err);
    if (localData) return localData;
    return getDefaultUserProfile(user, fallbackProfile);
  }
}

/**
 * Update player profile metadata (displayName, avatar, or progression stats).
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<FirestoreUserProfile>
): Promise<void> {
  updates.updatedAt = Date.now();

  // Save to local cache
  const localKey = `${LOCAL_PROFILE_KEY}_${userId}`;
  const existing = localStorage.getItem(localKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      const merged = { ...parsed, ...updates };
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch (e) {
      console.warn('[ROADWISE] Local profile update cache error:', e);
    }
  }

  if (isFirebaseConfigured() && db) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, updates);
    } catch (err) {
      console.warn('[ROADWISE] Failed to update Firestore profile:', err);
    }
  }
}
