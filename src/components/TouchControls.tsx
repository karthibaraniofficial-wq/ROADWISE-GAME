// ROADWISE — Professional Mobile Touch Controls (Pointer Events & Multi-Touch)
import React, { useState } from 'react';
import { VehicleInputs } from '../engine/VehiclePhysics';

interface TouchControlsProps {
  onInputChange: (updater: (prev: VehicleInputs) => VehicleInputs) => void;
  onInteract: () => void;
  onToggleHelmet: () => void;
  onHorn: () => void;
  onToggleCamera?: () => void;
  onPause?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInputChange,
  onInteract,
  onToggleHelmet,
  onHorn,
  onToggleCamera,
  onPause,
}) => {
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  const handlePointerDown = (key: keyof VehicleInputs, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
    }
    setActiveKeys((prev) => ({ ...prev, [key]: true }));
    onInputChange((prev) => ({ ...prev, [key]: true }));
  };

  const handlePointerUp = (key: keyof VehicleInputs, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setActiveKeys((prev) => ({ ...prev, [key]: false }));
    onInputChange((prev) => ({ ...prev, [key]: false }));
  };

  const handlePointerCancel = (key: keyof VehicleInputs, e: React.PointerEvent) => {
    setActiveKeys((prev) => ({ ...prev, [key]: false }));
    onInputChange((prev) => ({ ...prev, [key]: false }));
  };

  const baseBtnStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px)',
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '800',
    borderRadius: '20px',
    width: '68px',
    height: '68px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
    transition: 'transform 0.08s ease, background 0.08s ease',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '24px 28px',
        zIndex: 55,
        touchAction: 'none',
      }}
    >
      {/* --- LEFT: Steering Controls (Left & Right) --- */}
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '16px' }}>
        <button
          style={{
            ...baseBtnStyle,
            transform: activeKeys['steerLeft'] ? 'scale(0.92)' : 'scale(1)',
            background: activeKeys['steerLeft'] ? 'rgba(2, 132, 199, 0.8)' : 'rgba(15, 23, 42, 0.8)',
            borderColor: activeKeys['steerLeft'] ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
          }}
          onPointerDown={(e) => handlePointerDown('steerLeft', e)}
          onPointerUp={(e) => handlePointerUp('steerLeft', e)}
          onPointerCancel={(e) => handlePointerCancel('steerLeft', e)}
          aria-label="Steer Left"
        >
          <span>◀</span>
          <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>LEFT</span>
        </button>

        <button
          style={{
            ...baseBtnStyle,
            transform: activeKeys['steerRight'] ? 'scale(0.92)' : 'scale(1)',
            background: activeKeys['steerRight'] ? 'rgba(2, 132, 199, 0.8)' : 'rgba(15, 23, 42, 0.8)',
            borderColor: activeKeys['steerRight'] ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
          }}
          onPointerDown={(e) => handlePointerDown('steerRight', e)}
          onPointerUp={(e) => handlePointerUp('steerRight', e)}
          onPointerCancel={(e) => handlePointerCancel('steerRight', e)}
          aria-label="Steer Right"
        >
          <span>▶</span>
          <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>RIGHT</span>
        </button>
      </div>

      {/* --- CENTER: Utility Quick Actions --- */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '8px 16px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={onHorn}
          style={{
            ...baseBtnStyle,
            width: '50px',
            height: '50px',
            fontSize: '18px',
            borderRadius: '14px',
          }}
          aria-label="Horn"
          title="Sound Horn"
        >
          📢
        </button>

        <button
          onClick={onToggleHelmet}
          style={{
            ...baseBtnStyle,
            width: '50px',
            height: '50px',
            fontSize: '18px',
            borderRadius: '14px',
          }}
          aria-label="Helmet"
          title="Toggle Helmet"
        >
          🪖
        </button>

        {onToggleCamera && (
          <button
            onClick={onToggleCamera}
            style={{
              ...baseBtnStyle,
              width: '50px',
              height: '50px',
              fontSize: '18px',
              borderRadius: '14px',
            }}
            aria-label="Camera"
            title="Switch Camera View"
          >
            🎥
          </button>
        )}

        <button
          onClick={onInteract}
          style={{
            ...baseBtnStyle,
            width: '68px',
            height: '50px',
            fontSize: '13px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            borderColor: '#38bdf8',
          }}
          aria-label="Interact or Deliver"
        >
          [E] USE
        </button>
      </div>

      {/* --- RIGHT: Pedals (Brake & Throttle) --- */}
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '16px' }}>
        <button
          style={{
            ...baseBtnStyle,
            transform: activeKeys['brake'] ? 'scale(0.92)' : 'scale(1)',
            background: activeKeys['brake'] ? 'rgba(239, 68, 68, 0.95)' : 'rgba(185, 28, 28, 0.8)',
            borderColor: '#ef4444',
          }}
          onPointerDown={(e) => handlePointerDown('brake', e)}
          onPointerUp={(e) => handlePointerUp('brake', e)}
          onPointerCancel={(e) => handlePointerCancel('brake', e)}
          aria-label="Brake and Reverse"
        >
          <span style={{ fontSize: '18px' }}>🛑</span>
          <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>BRAKE</span>
        </button>

        <button
          style={{
            ...baseBtnStyle,
            transform: activeKeys['throttle'] ? 'scale(0.92)' : 'scale(1)',
            background: activeKeys['throttle'] ? 'rgba(16, 185, 129, 0.95)' : 'rgba(5, 150, 105, 0.8)',
            borderColor: '#10b981',
          }}
          onPointerDown={(e) => handlePointerDown('throttle', e)}
          onPointerUp={(e) => handlePointerUp('throttle', e)}
          onPointerCancel={(e) => handlePointerCancel('throttle', e)}
          aria-label="Accelerate"
        >
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>GAS</span>
        </button>
      </div>
    </div>
  );
};
