// ROADWISE — Settings, Controls & Accessibility Modal
import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { DEFAULT_GAME_SETTINGS } from '../services/saveGameService';

interface SettingsModalProps {
  settings?: GameSettings;
  onUpdateSettings?: (settings: GameSettings) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings = DEFAULT_GAME_SETTINGS,
  onUpdateSettings,
  isMuted,
  onToggleMute,
  onResetProgress,
  onClose,
}) => {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>(settings);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...currentSettings, [key]: value };
    setCurrentSettings(updated);
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleConfirmReset = () => {
    onResetProgress();
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 110,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          color: '#f8fafc',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>GAME SETTINGS</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
              Audio, Graphics, Accessibility & Keybindings
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Section 1: Audio Volume */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
            🔊 AUDIO CONTROLS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Master Audio Mute</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mute procedural engine sound and sirens</div>
              </div>
              <button
                onClick={onToggleMute}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${isMuted ? '#ef4444' : '#10b981'}`,
                  color: isMuted ? '#f87171' : '#34d399',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {isMuted ? 'MUTED' : 'ENABLED'}
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Master Volume</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8' }}>
                  {Math.round(currentSettings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentSettings.masterVolume}
                onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Display & Graphics Quality */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
            🖥️ GRAPHICS & ACCESSIBILITY
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Graphics Quality</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Affects dynamic shadow maps & rain particle density</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => updateSetting('graphicsQuality', q)}
                    style={{
                      background: currentSettings.graphicsQuality === q ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(30, 41, 59, 0.7)',
                      border: currentSettings.graphicsQuality === q ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: currentSettings.graphicsQuality === q ? '#ffffff' : '#94a3b8',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Fullscreen Mode</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Expand game canvas to full monitor display</div>
              </div>
              <button
                onClick={toggleFullscreen}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Reduced Motion</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Dampens motorcycle camera sway & leans</div>
              </div>
              <button
                onClick={() => updateSetting('reducedMotion', !currentSettings.reducedMotion)}
                style={{
                  background: currentSettings.reducedMotion ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${currentSettings.reducedMotion ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: currentSettings.reducedMotion ? '#34d399' : '#94a3b8',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {currentSettings.reducedMotion ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Desktop Controls Reference */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
            🎮 DRIVING CONTROLS REFERENCE
          </h4>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              padding: '16px',
              borderRadius: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '12px',
            }}
          >
            <div><strong style={{ color: '#38bdf8' }}>[W] / [↑]</strong> : Accelerate / Gas</div>
            <div><strong style={{ color: '#38bdf8' }}>[S] / [↓]</strong> : Brake / Reverse</div>
            <div><strong style={{ color: '#38bdf8' }}>[A] / [←]</strong> : Steer Left</div>
            <div><strong style={{ color: '#38bdf8' }}>[D] / [→]</strong> : Steer Right</div>
            <div><strong style={{ color: '#38bdf8' }}>[Space]</strong> : Emergency Brake / Horn</div>
            <div><strong style={{ color: '#38bdf8' }}>[E]</strong> : Checkpoint Deliver / Pickup</div>
            <div><strong style={{ color: '#38bdf8' }}>[H]</strong> : Fasten / Unfasten Helmet</div>
            <div><strong style={{ color: '#38bdf8' }}>[C]</strong> : Cycle Camera Mode</div>
            <div><strong style={{ color: '#38bdf8' }}>[Esc]</strong> : Pause / Resume Game</div>
          </div>
        </div>

        {/* Section 4: Safe Reset Progress */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          {showConfirmReset ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #ef4444',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>
                Are you sure? This will wipe your active vehicle unlocks, upgrades, and balance.
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={handleConfirmReset}
                  style={{
                    flex: 1,
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  YES, RESET PROGRESS
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  style={{
                    flex: 1,
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Active Career Progress
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            Save & Return to Game
          </button>
        </div>
      </div>
    </div>
  );
};
