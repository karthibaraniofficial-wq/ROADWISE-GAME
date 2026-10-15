// ROADWISE — Redesigned Premium Heads-Up Display (HUD)
import React from 'react';
import { CameraViewMode, ViolationEvent, CloudSyncStatus } from '../types/game';

interface HUDProps {
  speedKmh: number;
  speedLimitKmh: number;
  isHelmetFastened: boolean;
  timeRemainingSeconds: number;
  packageHealth: number;
  score: number;
  objectiveText: string;
  cameraMode: CameraViewMode;
  latestViolation: ViolationEvent | null;
  twistBanner: { title: string; message: string } | null;
  currencyINR?: number;
  syncStatus?: CloudSyncStatus;
  distanceMeters?: number;
  isNearCheckpoint?: boolean;
  onToggleHelmet: () => void;
  onToggleCamera: () => void;
  onPlayHorn: () => void;
  onInteract: () => void;
  onPause: () => void;
  onToggleMap?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmh,
  speedLimitKmh,
  isHelmetFastened,
  timeRemainingSeconds,
  packageHealth,
  score,
  objectiveText,
  cameraMode,
  latestViolation,
  twistBanner,
  currencyINR = 0,
  syncStatus = 'IDLE',
  distanceMeters,
  isNearCheckpoint = false,
  onToggleHelmet,
  onToggleCamera,
  onPlayHorn,
  onInteract,
  onPause,
  onToggleMap,
}) => {
  const isSpeeding = speedKmh > speedLimitKmh + 2;
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const getPackageHealthColor = () => {
    if (packageHealth > 65) return '#10b981'; // Green
    if (packageHealth > 30) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: '#f8fafc',
        zIndex: 50,
      }}
    >
      {/* ================= TOP SECTION ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        {/* TOP LEFT: Reorganized Mission Panel */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.78))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '16px 20px',
            maxWidth: '340px',
            width: '100%',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Header Row: Title & Countdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#38bdf8',
                textTransform: 'uppercase',
              }}
            >
              ACTIVE ORDER
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: timeRemainingSeconds < 25 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(2, 132, 199, 0.2)',
                border: `1px solid ${timeRemainingSeconds < 25 ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`,
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                color: timeRemainingSeconds < 25 ? '#f87171' : '#38bdf8',
              }}
            >
              <span>⏱️</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Objective Description */}
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4, marginBottom: '12px' }}>
            {objectiveText}
          </div>

          {/* Enhanced Distance & Destination Beacon Indicator */}
          {distanceMeters !== undefined && (
            <div
              style={{
                fontSize: '12px',
                color: isNearCheckpoint ? '#34d399' : '#94a3b8',
                fontWeight: 700,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isNearCheckpoint ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `1px solid ${isNearCheckpoint ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                boxShadow: isNearCheckpoint ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px' }}>{isNearCheckpoint ? '🎯' : '📍'}</span>
                <span>{isNearCheckpoint ? 'CHECKPOINT REACHED' : 'TARGET DISTANCE'}</span>
              </div>
              <strong style={{ color: isNearCheckpoint ? '#34d399' : '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                {Math.round(distanceMeters)}m
              </strong>
            </div>
          )}

          {/* Package Health Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '5px' }}>
              <span style={{ color: '#94a3b8' }}>PACKAGE HEALTH</span>
              <span style={{ color: getPackageHealthColor() }}>{packageHealth}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                style={{
                  width: `${packageHealth}%`,
                  height: '100%',
                  background: getPackageHealthColor(),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* TOP CENTER: Infraction & Reward Notification Banners */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 20px', gap: '8px' }}>
          {/* Logical Twist Alert */}
          {twistBanner && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.95), rgba(194, 65, 12, 0.9))',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '14px',
                padding: '10px 20px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)',
                animation: 'bannerPop 0.3s ease-out',
                maxWidth: '480px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.04em' }}>
                ⚠️ {twistBanner.title.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.95 }}>
                {twistBanner.message}
              </div>
            </div>
          )}

          {/* Traffic Violation / Reward Toast */}
          {latestViolation && (
            <div
              style={{
                background:
                  latestViolation.severity === 'reward'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.92), rgba(5, 150, 105, 0.9))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.92), rgba(185, 28, 28, 0.9))',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '16px',
                padding: '12px 22px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                animation: 'slideDownFade 0.3s ease-out',
                maxWidth: '500px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 800 }}>
                <span>{latestViolation.severity === 'reward' ? '✅' : '🚨'}</span>
                <span>{latestViolation.title}</span>
                {latestViolation.fineINR > 0 && (
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      color: '#facc15',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    -₹{latestViolation.fineINR}
                  </span>
                )}
                {latestViolation.pointsDeduction < 0 && (
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      color: '#34d399',
                    }}
                  >
                    +{Math.abs(latestViolation.pointsDeduction)} PTS
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.92, fontWeight: 500 }}>
                {latestViolation.advice}
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT: Telemetry & Safety Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          {/* Speedometer & Speed Limit Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.78))',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Speed Value */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: isSpeeding ? '#ef4444' : '#f8fafc',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {Math.round(speedKmh)}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                KM / H
              </div>
            </div>

            {/* Indian Circular Speed Limit Sign */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '4px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: '15px',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)',
              }}
            >
              {speedLimitKmh}
            </div>
          </div>

          {/* Wallet, Score & Helmet Indicators */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Score Indicator */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: '#94a3b8' }}>PTS: </span>
              <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>{score}</span>
            </div>

            {/* Helmet Indicator */}
            <div
              style={{
                background: isHelmetFastened ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                border: `1px solid ${isHelmetFastened ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 800,
                color: isHelmetFastened ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>🪖</span>
              <span>{isHelmetFastened ? 'HELMET ON' : 'NO HELMET'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        {/* BOTTOM LEFT: Quick Actions / Keybinding Reminders */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '8px 14px',
            borderRadius: '14px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={onToggleHelmet}
            title="Fasten or unfasten helmet [H]"
            style={{
              background: isHelmetFastened ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isHelmetFastened ? '#10b981' : '#ef4444'}`,
              color: isHelmetFastened ? '#34d399' : '#f87171',
              padding: '8px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            🪖 [H] {isHelmetFastened ? 'Unbuckle' : 'Fasten'}
          </button>

          <button
            onClick={onToggleCamera}
            title="Switch camera view mode [C]"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            🎥 [C] {cameraMode === 'CHASE' ? 'Chase' : cameraMode === 'FIRST_PERSON' ? 'FPS' : 'Top-Down'}
          </button>

          <button
            onClick={onPlayHorn}
            title="Sound vehicle horn [E] or [Space]"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            📢 Horn
          </button>

          {onToggleMap && (
            <button
              onClick={onToggleMap}
              title="Open tactical city map [M]"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: '8px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              🗺️ [M] Map
            </button>
          )}
        </div>

        {/* BOTTOM CENTER: Contextual Checkpoint Action Prompt [E] */}
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={onInteract}
            style={{
              background: isNearCheckpoint
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 28px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              boxShadow: isNearCheckpoint
                ? '0 0 30px rgba(16, 185, 129, 0.6)'
                : '0 8px 24px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              [E]
            </span>
            <span>{isNearCheckpoint ? 'DELIVER / PICKUP HERE' : 'INTERACT / DELIVER'}</span>
          </button>
        </div>

        {/* BOTTOM RIGHT: Pause Button */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={onPause}
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '10px 18px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
            }}
          >
            ⏸️ [Esc] Pause
          </button>
        </div>
      </div>
    </div>
  );
};
