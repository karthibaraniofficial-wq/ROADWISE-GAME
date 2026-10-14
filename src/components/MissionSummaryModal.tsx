// ROADWISE — Mission Summary & Debriefing Modal
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ActiveMissionState, PlayerProfile } from '../types/game';

interface MissionSummaryModalProps {
  state: ActiveMissionState;
  profile: PlayerProfile;
  onContinue: () => void;
  onRetry: () => void;
}

export const MissionSummaryModal: React.FC<MissionSummaryModalProps> = ({
  state,
  profile,
  onContinue,
  onRetry,
}) => {
  const isWin = state.isCompleted && !state.isFailed;

  useEffect(() => {
    if (isWin) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#facc15', '#10b981'],
        });
      } catch {}
    }
  }, [isWin]);

  const violationsCount = state.violations.length;
  const isClean = isWin && violationsCount === 0;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 110,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        border: `1.5px solid ${isWin ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        color: '#f8fafc',
      }}>
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isWin ? '#34d399' : '#f87171',
            background: isWin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '4px 14px',
            borderRadius: '20px',
            marginBottom: '10px',
          }}>
            {isWin ? 'MISSION ACCOMPLISHED' : 'CONTRACT FAILED'}
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isWin ? 'Package Delivered!' : 'Delivery Incomplete'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            {isWin
              ? state.mission.title
              : state.failureReason || 'Failed to meet delivery requirements safely.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Score</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#facc15', fontFamily: 'JetBrains Mono, monospace' }}>
              {state.score}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Earnings</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{isWin ? state.mission.rewardINR + (isClean ? 50 : 0) : 0}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Violations</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: violationsCount === 0 ? '#10b981' : '#ef4444',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {violationsCount}
            </div>
          </div>
        </div>

        {/* Clean Delivery Bonus Callout */}
        {isClean && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>
              <strong>Zero-Infraction Bonus:</strong> +50 Pts & ₹50 Safety Tip awarded!
            </div>
          </div>
        )}

        {/* Violations breakdown if any */}
        {violationsCount > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Infractions Recorded
            </div>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.violations.map((v, i) => (
                <div key={i} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', fontWeight: 700 }}>
                    <span>🚨 {v.title}</span>
                    <span>-₹{v.fineINR}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '2px' }}>{v.advice}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onRetry}
            style={{
              flex: '1',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            RETRY MISSION
          </button>

          <button
            onClick={onContinue}
            style={{
              flex: '2',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
            }}
          >
            RETURN TO HUB ➔
          </button>
        </div>
      </div>
    </div>
  );
};
