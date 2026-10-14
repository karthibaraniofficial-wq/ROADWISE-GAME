// ROADWISE — Master Application Coordinator & State Integrator
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerProfile,
  DeliveryMission,
  ActiveMissionState,
  CameraViewMode,
  ViolationEvent,
  GameSettings,
} from './types/game';
import { loadPlayerProfile, savePlayerProfile, resetPlayerProfile } from './services/storage';
import { soundEngine } from './services/audio';
import { MISSIONS } from './engine/MissionManager';
import { GameEngine } from './engine/GameEngine';
import { VehicleInputs } from './engine/VehiclePhysics';
import { useAuth } from './hooks/useAuth';
import { useCloudSave } from './hooks/useCloudSave';
import { recordMissionHistory, DEFAULT_GAME_SETTINGS } from './services/saveGameService';

import { MainMenu } from './components/MainMenu';
import { DeliveryBoard } from './components/DeliveryBoard';
import { Garage } from './components/Garage';
import { TrafficHandbook } from './components/TrafficHandbook';
import { PlayerDashboard } from './components/PlayerDashboard';
import { AuthModal } from './components/AuthModal';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { TouchControls } from './components/TouchControls';
import { MissionSummaryModal } from './components/MissionSummaryModal';
import { SettingsModal } from './components/SettingsModal';

type AppScreen = 'MAIN_MENU' | 'DELIVERY_BOARD' | 'GARAGE' | 'HANDBOOK' | 'DASHBOARD' | 'PLAYING';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('MAIN_MENU');
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [activeMission, setActiveMission] = useState<DeliveryMission>(MISSIONS[0]);
  const [activeMissionState, setActiveMissionState] = useState<ActiveMissionState | null>(null);

  // Authentication & Cloud Sync
  const { user, logout: authLogout } = useAuth();
  const {
    syncStatus,
    slots,
    activeSlotId,
    saveProgress: cloudSaveProgress,
    loadSlot: cloudLoadSlot,
    createSlot: cloudCreateSlot,
    renameSlot: cloudRenameSlot,
    deleteSlot: cloudDeleteSlot,
  } = useCloudSave(user);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // In-Game HUD & Telemetry state
  const [speedKmh, setSpeedKmh] = useState(0);
  const [isHelmetFastened, setIsHelmetFastened] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [packageHealth, setPackageHealth] = useState(100);
  const [score, setScore] = useState(1000);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CHASE');
  const [latestViolation, setLatestViolation] = useState<ViolationEvent | null>(null);
  const [twistBanner, setTwistBanner] = useState<{ title: string; message: string } | null>(null);

  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const inputsRef = useRef<VehicleInputs>({
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
  });

  // Save profile helper (local + cloud sync)
  const updateProfile = useCallback(
    (updater: (prev: PlayerProfile) => PlayerProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        savePlayerProfile(next);
        // Trigger cloud synchronization
        cloudSaveProgress(next, settings).catch((err) => {
          console.warn('[ROADWISE] Cloud autosave note:', err);
        });
        return next;
      });
    },
    [cloudSaveProgress, settings]
  );

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      soundEngine.setMute(next);
      return next;
    });
  }, []);

  // Reset all save progress
  const handleResetProgress = useCallback(() => {
    const fresh = resetPlayerProfile();
    setProfile(fresh);
    cloudSaveProgress(fresh, settings).catch(() => {});
  }, [cloudSaveProgress, settings]);

  // Launch a Mission
  const startMission = (mission: DeliveryMission) => {
    setActiveMission(mission);
    setScreen('PLAYING');
    setIsPaused(false);
    setLatestViolation(null);
    setTwistBanner(null);
    setTimeRemainingSeconds(mission.timeLimitSeconds);
    setPackageHealth(100);
    setScore(1000);
  };

  // Instantiate GameEngine when entering 'PLAYING' screen
  useEffect(() => {
    if (screen !== 'PLAYING' || !gameContainerRef.current) return;

    const engine = new GameEngine(gameContainerRef.current, profile, activeMission, {
      onTelemetryUpdate: (speed, helmet, time, health, currentScore) => {
        setSpeedKmh(speed);
        setIsHelmetFastened(helmet);
        setTimeRemainingSeconds(time);
        setPackageHealth(health);
        setScore(currentScore);
      },
      onViolation: (violation) => {
        setLatestViolation(violation);
        setTimeout(() => {
          setLatestViolation((curr) => (curr?.id === violation.id ? null : curr));
        }, 4500);
      },
      onMissionStatusChange: (newState) => {
        setActiveMissionState({ ...newState });

        if (newState.isCompleted && !newState.isFailed) {
          // Record mission history in Firestore
          if (user) {
            recordMissionHistory(user.uid, newState).catch((e) => console.warn(e));
          }

          // Apply rewards to profile & persist to cloud
          updateProfile((prev) => {
            const cleanBonus = newState.violations.length === 0 ? 50 : 0;
            const earnedINR = newState.mission.rewardINR + cleanBonus;
            const earnedXP = newState.mission.rewardXP;
            const completedList = prev.completedMissionIds.includes(newState.mission.id)
              ? prev.completedMissionIds
              : [...prev.completedMissionIds, newState.mission.id];

            return {
              ...prev,
              currencyINR: prev.currencyINR + earnedINR,
              xp: prev.xp + earnedXP,
              completedMissionIds: completedList,
              stats: {
                ...prev.stats,
                deliveriesCompleted: prev.stats.deliveriesCompleted + 1,
                cleanDeliveries: prev.stats.cleanDeliveries + (cleanBonus > 0 ? 1 : 0),
                violationsCount: prev.stats.violationsCount + newState.violations.length,
              },
            };
          });
        }
      },
      onTwistEvent: (title, message) => {
        setTwistBanner({ title, message });
        setTimeout(() => {
          setTwistBanner(null);
        }, 6000);
      },
    });

    gameEngineRef.current = engine;

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, [screen, activeMission, profile.selectedVehicleId, updateProfile, user]);

  const clearAllKeys = useCallback(() => {
    inputsRef.current = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      handbrake: false,
    };
    gameEngineRef.current?.setInputs(inputsRef.current);
  }, []);

  // Robust Keyboard Controls Overhaul (Phase 6)
  useEffect(() => {
    const isInputFocused = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return false;
      const tag = target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused(e)) return; // Ignore driving keys when typing in inputs

      const code = e.code;
      const drivingCodes = ['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'Space'];

      if (screen === 'PLAYING') {
        if (drivingCodes.includes(code)) {
          e.preventDefault(); // Prevent browser window scrolling
        }

        if (code === 'KeyW' || code === 'ArrowUp') inputsRef.current.throttle = true;
        if (code === 'KeyS' || code === 'ArrowDown') inputsRef.current.brake = true;
        if (code === 'KeyA' || code === 'ArrowLeft') inputsRef.current.steerLeft = true;
        if (code === 'KeyD' || code === 'ArrowRight') inputsRef.current.steerRight = true;
        if (code === 'Space') inputsRef.current.handbrake = true;

        if (code === 'KeyE') {
          gameEngineRef.current?.interact();
        }

        if (code === 'KeyH') {
          gameEngineRef.current?.toggleHelmet();
        }

        if (code === 'KeyC') {
          setCameraMode((prev) => {
            const next: CameraViewMode =
              prev === 'CHASE' ? 'FIRST_PERSON' : prev === 'FIRST_PERSON' ? 'TOP_DOWN' : 'CHASE';
            gameEngineRef.current?.setCameraMode(next);
            return next;
          });
        }

        if (code === 'KeyM') {
          clearAllKeys();
          setIsMapOpen((prev) => !prev);
        }

        gameEngineRef.current?.setInputs(inputsRef.current);
      }

      if (code === 'Escape') {
        if (screen === 'PLAYING') {
          clearAllKeys();
          setIsPaused((prev) => {
            const next = !prev;
            if (next) gameEngineRef.current?.pause();
            else gameEngineRef.current?.resume();
            return next;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputFocused(e)) return;

      const code = e.code;
      if (screen === 'PLAYING') {
        if (code === 'KeyW' || code === 'ArrowUp') inputsRef.current.throttle = false;
        if (code === 'KeyS' || code === 'ArrowDown') inputsRef.current.brake = false;
        if (code === 'KeyA' || code === 'ArrowLeft') inputsRef.current.steerLeft = false;
        if (code === 'KeyD' || code === 'ArrowRight') inputsRef.current.steerRight = false;
        if (code === 'Space') inputsRef.current.handbrake = false;

        gameEngineRef.current?.setInputs(inputsRef.current);
      }
    };

    // Release all inputs on focus loss or tab change to prevent stuck keys
    const handleBlur = () => clearAllKeys();
    const handleVisibilityChange = () => {
      if (document.hidden) clearAllKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [screen]);

  // Objective guidance text
  const objectiveText = activeMissionState?.isPickupComplete
    ? `Step 2: Deliver to Destination (${activeMission.dropoffLocations.length > 1 ? `${activeMissionState.currentDropoffIndex + 1}/${activeMission.dropoffLocations.length}` : 'Drop-off'}) — Press [E] inside bay`
    : 'Step 1: Ride to Pickup Checkpoint & Press [E]';

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 3D Game Canvas Host */}
      <div
        ref={gameContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          display: screen === 'PLAYING' ? 'block' : 'none',
        }}
      />

      {/* Main Menu Screen */}
      {screen === 'MAIN_MENU' && (
        <MainMenu
          user={user}
          profile={profile}
          onStartGame={() => startMission(MISSIONS[0])}
          onOpenGarage={() => setScreen('GARAGE')}
          onOpenDeliveryBoard={() => setScreen('DELIVERY_BOARD')}
          onOpenDashboard={() => setScreen('DASHBOARD')}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenHandbook={() => setScreen('HANDBOOK')}
          onOpenSettings={() => setShowSettings(true)}
          isAudioMuted={isAudioMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Delivery Board Screen */}
      {screen === 'DELIVERY_BOARD' && (
        <DeliveryBoard
          profile={profile}
          onSelectMission={startMission}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* Garage Screen */}
      {screen === 'GARAGE' && (
        <Garage
          profile={profile}
          onUpdateProfile={updateProfile}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* Handbook Screen */}
      {screen === 'HANDBOOK' && <TrafficHandbook onBack={() => setScreen('MAIN_MENU')} />}

      {/* Player Dashboard Screen (Phase 9) */}
      {screen === 'DASHBOARD' && (
        <PlayerDashboard
          user={user}
          profile={profile}
          slots={slots}
          activeSlotId={activeSlotId}
          syncStatus={syncStatus}
          onLoadSlot={(slotId) => {
            const loaded = cloudLoadSlot(slotId);
            if (loaded) {
              setProfile(loaded.profile);
              setSettings(loaded.settings);
            }
          }}
          onCreateSlot={(name) => {
            cloudCreateSlot(name, profile, settings);
          }}
          onRenameSlot={(slotId, name) => {
            cloudRenameSlot(slotId, name);
          }}
          onDeleteSlot={(slotId) => {
            cloudDeleteSlot(slotId);
          }}
          onSaveCurrent={() => {
            cloudSaveProgress(profile, settings);
          }}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={async () => {
            await authLogout();
          }}
          onUpdateDisplayName={(newName) => {
            updateProfile((prev) => ({ ...prev, name: newName }));
          }}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* In-Game HUD & Minimap & Touch Controls (Phases 6, 7, 8) */}
      {screen === 'PLAYING' && (
        <>
          <HUD
            speedKmh={speedKmh}
            speedLimitKmh={activeMission.speedLimitKmh}
            isHelmetFastened={isHelmetFastened}
            timeRemainingSeconds={timeRemainingSeconds}
            packageHealth={packageHealth}
            score={score}
            objectiveText={objectiveText}
            cameraMode={cameraMode}
            latestViolation={latestViolation}
            twistBanner={twistBanner}
            currencyINR={profile.currencyINR}
            syncStatus={syncStatus}
            onToggleHelmet={() => gameEngineRef.current?.toggleHelmet()}
            onToggleCamera={() => {
              setCameraMode((prev) => {
                const next: CameraViewMode =
                  prev === 'CHASE' ? 'FIRST_PERSON' : prev === 'FIRST_PERSON' ? 'TOP_DOWN' : 'CHASE';
                gameEngineRef.current?.setCameraMode(next);
                return next;
              });
            }}
            onPlayHorn={() => soundEngine.playHorn()}
            onInteract={() => gameEngineRef.current?.interact()}
            onToggleMap={() => {
              clearAllKeys();
              setIsMapOpen((prev) => !prev);
            }}
            onPause={() => {
              clearAllKeys();
              setIsPaused(true);
              gameEngineRef.current?.pause();
            }}
          />

          <Minimap
            getMinimapData={() =>
              gameEngineRef.current?.getMinimapData() || {
                playerPos: [0, 0],
                playerHeading: 0,
                pickupPos: [0, 0],
                dropoffPos: null,
                trafficLights: [],
                aiCars: [],
                roadSegments: [],
                routeWaypoints: [],
              }
            }
            isPickupComplete={activeMissionState?.isPickupComplete || false}
            isMapOpen={isMapOpen}
            onToggleMap={() => {
              clearAllKeys();
              setIsMapOpen((prev) => !prev);
            }}
          />

          <TouchControls
            onInputChange={(updater) => {
              inputsRef.current = updater(inputsRef.current);
              gameEngineRef.current?.setInputs(inputsRef.current);
            }}
            onInteract={() => gameEngineRef.current?.interact()}
            onToggleHelmet={() => gameEngineRef.current?.toggleHelmet()}
            onHorn={() => soundEngine.playHorn()}
            onToggleCamera={() => {
              setCameraMode((prev) => {
                const next: CameraViewMode =
                  prev === 'CHASE' ? 'FIRST_PERSON' : prev === 'FIRST_PERSON' ? 'TOP_DOWN' : 'CHASE';
                gameEngineRef.current?.setCameraMode(next);
                return next;
              });
            }}
            onPause={() => {
              setIsPaused(true);
              gameEngineRef.current?.pause();
            }}
          />
        </>
      )}

      {/* Mission Results Modal */}
      {activeMissionState && (activeMissionState.isCompleted || activeMissionState.isFailed) && (
        <MissionSummaryModal
          state={activeMissionState}
          profile={profile}
          onContinue={() => {
            setActiveMissionState(null);
            setScreen('DELIVERY_BOARD');
          }}
          onRetry={() => {
            setActiveMissionState(null);
            startMission(activeMission);
          }}
        />
      )}

      {/* Settings Modal (Phase 10) */}
      {(showSettings || isPaused) && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            soundEngine.setMasterVolume(newSettings.masterVolume);
          }}
          isMuted={isAudioMuted}
          onToggleMute={handleToggleMute}
          onResetProgress={handleResetProgress}
          onClose={() => {
            setShowSettings(false);
            if (isPaused) {
              setIsPaused(false);
              gameEngineRef.current?.resume();
            }
          }}
        />
      )}

      {/* Authentication Modal (Phase 2) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};

export default App;
