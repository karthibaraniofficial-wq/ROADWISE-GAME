// ROADWISE — useCloudSave React Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SaveSlot,
  PlayerProfile,
  GameSettings,
  CloudSyncStatus,
  AuthUser,
} from '../types/game';
import {
  listPlayerSaveSlots,
  savePlayerGame,
  renamePlayerSaveSlot,
  deletePlayerSaveSlot,
  getActiveSaveSlotId,
  DEFAULT_GAME_SETTINGS,
} from '../services/saveGameService';
import { isFirebaseConfigured } from '../lib/firebase';

export interface UseCloudSaveReturn {
  syncStatus: CloudSyncStatus;
  slots: SaveSlot[];
  activeSlotId: string;
  activeSlot: SaveSlot | null;
  saveProgress: (profile: PlayerProfile, settings?: GameSettings) => Promise<void>;
  createSlot: (name: string, profile: PlayerProfile, settings?: GameSettings) => Promise<SaveSlot>;
  loadSlot: (slotId: string) => SaveSlot | null;
  renameSlot: (slotId: string, name: string) => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
  refreshSlots: () => Promise<void>;
}

export function useCloudSave(user: AuthUser | null): UseCloudSaveReturn {
  const effectiveUserId = user ? user.uid : 'guest_local_user';
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [activeSlotId, setActiveSlotIdState] = useState<string>(() => getActiveSaveSlotId());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(
    isFirebaseConfigured() ? 'IDLE' : 'OFFLINE_LOCAL'
  );

  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0] || null;

  // Refresh slots
  const refreshSlots = useCallback(async () => {
    if (isFirebaseConfigured()) setSyncStatus('SYNCING');
    try {
      const fetched = await listPlayerSaveSlots(effectiveUserId);
      setSlots(fetched);
      setSyncStatus(isFirebaseConfigured() ? 'SYNCED' : 'OFFLINE_LOCAL');
    } catch (err) {
      console.warn('[ROADWISE] Refresh slots error:', err);
      setSyncStatus('ERROR');
    }
  }, [effectiveUserId]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  // Save progress
  const saveProgress = useCallback(
    async (profile: PlayerProfile, settings: GameSettings = DEFAULT_GAME_SETTINGS) => {
      setSyncStatus('SYNCING');
      try {
        const slotName = activeSlot ? activeSlot.saveName : 'Current Career';
        const updated = await savePlayerGame(
          effectiveUserId,
          activeSlotId,
          slotName,
          profile,
          settings
        );

        setSlots((prev) => {
          const idx = prev.findIndex((s) => s.id === activeSlotId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [...prev, updated];
        });

        setSyncStatus(isFirebaseConfigured() ? 'SYNCED' : 'OFFLINE_LOCAL');
      } catch (err) {
        console.error('[ROADWISE] Save progress failure:', err);
        setSyncStatus('ERROR');
      }
    },
    [effectiveUserId, activeSlotId, activeSlot]
  );

  // Create new slot
  const createSlot = useCallback(
    async (name: string, profile: PlayerProfile, settings: GameSettings = DEFAULT_GAME_SETTINGS) => {
      setSyncStatus('SYNCING');
      const newSlotId = `slot_${Date.now()}`;
      const newSlot = await savePlayerGame(effectiveUserId, newSlotId, name, profile, settings);
      setSlots((prev) => [...prev, newSlot]);
      setActiveSlotIdState(newSlotId);
      setSyncStatus(isFirebaseConfigured() ? 'SYNCED' : 'OFFLINE_LOCAL');
      return newSlot;
    },
    [effectiveUserId]
  );

  // Load slot
  const loadSlot = useCallback(
    (slotId: string): SaveSlot | null => {
      const match = slots.find((s) => s.id === slotId);
      if (match) {
        setActiveSlotIdState(slotId);
        return match;
      }
      return null;
    },
    [slots]
  );

  // Rename slot
  const renameSlot = useCallback(
    async (slotId: string, name: string) => {
      await renamePlayerSaveSlot(effectiveUserId, slotId, name);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, saveName: name, updatedAt: Date.now() } : s))
      );
    },
    [effectiveUserId]
  );

  // Delete slot
  const deleteSlot = useCallback(
    async (slotId: string) => {
      await deletePlayerSaveSlot(effectiveUserId, slotId);
      await refreshSlots();
    },
    [effectiveUserId, refreshSlots]
  );

  return {
    syncStatus,
    slots,
    activeSlotId,
    activeSlot,
    saveProgress,
    createSlot,
    loadSlot,
    renameSlot,
    deleteSlot,
    refreshSlots,
  };
}
