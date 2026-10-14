// ROADWISE — Delivery Missions Board
import React from 'react';
import { DeliveryMission, PlayerProfile } from '../types/game';
import { MISSIONS } from '../engine/MissionManager';

interface DeliveryBoardProps {
  profile: PlayerProfile;
  onSelectMission: (mission: DeliveryMission) => void;
  onBack: () => void;
}

export const DeliveryBoard: React.FC<DeliveryBoardProps> = ({
  profile,
  onSelectMission,
  onBack,
}) => {
  const isMissionUnlocked = (m: DeliveryMission) => {
    if (m.unlockedByDefault) return true;
    // Unlocked if previous mission completed
    return profile.completedMissionIds.includes(m.id - 1);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(10, 14, 23, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 40px',
      color: '#f8fafc',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            ← BACK TO HUB
          </button>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Dispatch & Delivery Board
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Choose your next commercial dispatch contract. Master progressive road challenges to advance your courier license.
          </p>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Completed:</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
            {profile.completedMissionIds.length} / {MISSIONS.length}
          </span>
        </div>
      </div>

      {/* Contracts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
        paddingBottom: '30px',
      }}>
        {MISSIONS.map((m) => {
          const unlocked = isMissionUnlocked(m);
          const completed = profile.completedMissionIds.includes(m.id);

          return (
            <div
              key={m.id}
              style={{
                background: completed
                  ? 'rgba(15, 23, 42, 0.7)'
                  : unlocked
                  ? 'rgba(30, 41, 59, 0.65)'
                  : 'rgba(15, 23, 42, 0.4)',
                border: completed
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : unlocked
                  ? '1px solid rgba(56, 189, 248, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '18px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: unlocked ? 1 : 0.55,
                transition: 'all 0.2s',
              }}
            >
              <div>
                {/* Top Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: m.difficulty === 'Beginner' ? '#38bdf8' : m.difficulty === 'Intermediate' ? '#facc15' : m.difficulty === 'Advanced' ? '#f97316' : '#a855f7',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                  }}>
                    {m.difficulty}
                  </span>

                  {completed ? (
                    <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                      ✓ COMPLETED
                    </span>
                  ) : !unlocked ? (
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                      🔒 LOCKED (Finish Mission #{m.id - 1})
                    </span>
                  ) : (
                    <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
                      AVAILABLE
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Client: {m.client}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 8px' }}>
                  #{m.id}. {m.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
                  {m.briefing}
                </p>

                {/* Highlighted Rules Tag */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {m.rulesHighlight.map((rule, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10px',
                        background: 'rgba(2, 132, 199, 0.15)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom details & Accept CTA */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  marginBottom: '14px',
                  fontSize: '12px',
                }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Reward: </span>
                    <strong style={{ color: '#facc15', fontFamily: 'JetBrains Mono, monospace' }}>₹{m.rewardINR}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>XP: </span>
                    <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>+{m.rewardXP}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Time: </span>
                    <strong style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>{m.timeLimitSeconds}s</strong>
                  </div>
                </div>

                <button
                  disabled={!unlocked}
                  onClick={() => onSelectMission(m)}
                  style={{
                    width: '100%',
                    background: unlocked ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#334155',
                    color: unlocked ? '#ffffff' : '#64748b',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    boxShadow: unlocked ? '0 4px 16px rgba(2, 132, 199, 0.3)' : 'none',
                  }}
                >
                  {completed ? 'REPLAY MISSION ↺' : 'ACCEPT CONTRACT ➔'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
