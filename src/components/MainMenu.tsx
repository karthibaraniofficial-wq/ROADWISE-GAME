// ROADWISE — Main Menu Screen
import React from 'react';
import { PlayerProfile, AuthUser } from '../types/game';
import { VEHICLE_ROSTER } from '../services/storage';

interface MainMenuProps {
  user?: AuthUser | null;
  profile: PlayerProfile;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenDeliveryBoard: () => void;
  onOpenDashboard?: () => void;
  onOpenAuth?: () => void;
  onOpenHandbook: () => void;
  onOpenSettings: () => void;
  isAudioMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  user,
  profile,
  onStartGame,
  onOpenGarage,
  onOpenDeliveryBoard,
  onOpenDashboard,
  onOpenAuth,
  onOpenHandbook,
  onOpenSettings,
  isAudioMuted,
  onToggleMute,
}) => {
  const currentVehicle = VEHICLE_ROSTER[profile.selectedVehicleId];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0a0e17 80%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 40px',
      color: '#f8fafc',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* --- TOP BAR --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '22px',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
          }}>
            R
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              ROADWISE
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              INDIAN TRAFFIC RULES & DELIVERY SIMULATION
            </div>
          </div>
        </div>

        {/* Dashboard, Cloud Auth, Currency & Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Career Dashboard Button */}
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              style={{
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '9px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📊</span>
              <span>DASHBOARD</span>
            </button>
          )}

          {/* Cloud Auth Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              style={{
                background: user ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: user ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                color: user ? '#34d399' : '#ffffff',
                padding: '9px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{user ? '👤' : '☁️'}</span>
              <span>{user ? user.displayName || 'Account' : 'Cloud Sign In'}</span>
            </button>
          )}

          {/* Wallet */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#facc15', fontSize: '16px' }}>₹</span>
            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>
              {profile.currencyINR.toLocaleString()}
            </span>
          </div>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            {isAudioMuted ? '🔇 MUTED' : '🔊 AUDIO'}
          </button>
        </div>
      </div>

      {/* --- CENTER SECTION: HERO & DRIVER LICENSE --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        gap: '40px',
        flexWrap: 'wrap',
      }}>
        {/* Left: Title & Quick Launch */}
        <div style={{ flex: '1', minWidth: '320px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '16px',
          }}>
            LEFT-HAND TRAFFIC SIMULATOR
          </div>
          <h1 style={{
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Deliver Fast.<br />Drive Safe.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, maxWidth: '480px', marginBottom: '28px' }}>
            Earn contracts across a living Indian road network. Stop before stop lines, yield to pedestrians and ambulances, master rainy weather, and upgrade your motorcycle.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenDeliveryBoard}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#ffffff',
                padding: '16px 36px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              DELIVERY BOARD 📋
            </button>

            <button
              onClick={onOpenGarage}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                padding: '16px 28px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              GARAGE 🛵
            </button>
          </div>
        </div>

        {/* Right: Official Driver Profile Card */}
        <div style={{
          flex: '1',
          maxWidth: '420px',
          minWidth: '300px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))',
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Driver Identification
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                {profile.name}
              </div>
            </div>
            <div style={{
              background: profile.safetyScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${profile.safetyScore >= 80 ? '#10b981' : '#f59e0b'}`,
              color: profile.safetyScore >= 80 ? '#34d399' : '#fbbf24',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
            }}>
              {profile.licenseGrade}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Safety Rating</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: profile.safetyScore >= 80 ? '#10b981' : '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                {profile.safetyScore}%
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Driver Level</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                LVL {profile.level}
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Deliveries Done</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                {profile.stats.deliveriesCompleted}
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Clean Deliveries</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                {profile.stats.cleanDeliveries}
              </div>
            </div>
          </div>

          {/* Active Vehicle preview */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              Active Ride: <strong style={{ color: '#38bdf8' }}>{currentVehicle.name}</strong>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentVehicle.category}</span>
          </div>
        </div>
      </div>

      {/* --- FOOTER NAVIGATION --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Controls: [W/A/S/D] Drive | [Space] Brake | [E] Interact | [H] Helmet | [C] Camera | [Esc] Pause
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <button
            onClick={onOpenHandbook}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            📖 TRAFFIC HANDBOOK
          </button>
          <button
            onClick={onOpenSettings}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            ⚙️ SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
