// ROADWISE — Indian Traffic Rules & Signage Handbook
import React, { useState } from 'react';

interface TrafficHandbookProps {
  onBack: () => void;
}

export const TrafficHandbook: React.FC<TrafficHandbookProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'signs' | 'penalties'>('rules');

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
            Official Traffic Code & Rider Handbook
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Learn the rules of the road under the Motor Vehicles Act and defensivedriving standards.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.7)', padding: '6px', borderRadius: '14px' }}>
          {(['rules', 'signs', 'penalties'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#0284c7' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'rules' ? 'Core Rules' : tab === 'signs' ? 'Road Signs' : 'Fine Schedule'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      {activeTab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚗⬅️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
              Left-Hand Traffic (LHT) Lane Keeping
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              In India, vehicles must drive on the <strong>left side</strong> of the carriageway. Overtaking must strictly be conducted on the right side of the vehicle ahead. Never overtake on the inside (left curb) or weave across lanes.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛑</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#facc15', marginBottom: '8px' }}>
              Stop Line & Traffic Signal Phasing
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              The solid white line preceding an intersection marks where vehicles must halt on RED and AMBER signals. <strong>Overhanging or crossing the stop line on red is a direct traffic violation</strong> and encroaches into the pedestrian refuge area.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚶‍♂️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
              Pedestrian Priority on Zebra Stripes
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              Pedestrians have absolute right-of-way once they step onto a marked zebra crossing. Drivers must anticipate pedestrian movement, decelerate in advance, and come to a complete stop until crosswalks are clear.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚑</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>
              Emergency Vehicle Yielding (MV Act 194E)
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              When an ambulance, fire tender, or emergency vehicle approaches with flashing lights or audible sirens, you must <strong>immediately steer to the left side of your lane</strong> and come to a safe stop until it has passed.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🪖</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
              Protective Headgear (MV Act 129)
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              Every person riding a motorcycle or scooter must wear a securely fastened BIS-certified helmet. Riding without fastening the retention strap invalidates protection and incurs immediate penalties. Press [H] to fasten your helmet.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🌧️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#06b6d4', marginBottom: '8px' }}>
              Monsoon & Wet Asphalt Defensive Driving
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              Rain water creates a thin film over asphalt, reducing tire grip by over 40% and drastically extending stopping distance. Avoid sudden panic braking; apply gentle, progressive brake pressure and keep your speed under 30 km/h.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'signs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 12px', background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '44px', height: '10px', background: '#fff' }} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>NO ENTRY</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Mandatory regulatory sign. Vehicles must not proceed past this point under any circumstances.</p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 12px', background: '#ffffff', border: '6px solid #dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '22px' }}>
              30
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>SPEED LIMIT (30 KM/H)</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Enforced around school zones, residential lanes, and medical facilities.</p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 12px', background: '#ffffff', border: '6px solid #dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '22px' }}>
              45
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>SPEED LIMIT (45 KM/H)</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Standard maximum speed on dual-lane urban city avenues.</p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '38px', marginBottom: '8px' }}>🚸</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#facc15' }}>SCHOOL AHEAD</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Warning sign. Expect children crossing unexpectedly. Reduce speed immediately.</p>
          </div>
        </div>
      )}

      {activeTab === 'penalties' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Standard Fine & Score Deduction Schedule</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '10px 14px' }}>Violation</th>
                <th style={{ padding: '10px 14px' }}>Legal Citation</th>
                <th style={{ padding: '10px 14px' }}>Fine</th>
                <th style={{ padding: '10px 14px' }}>Safety Penalty</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ef4444' }}>Red Light Jumping</td>
                <td style={{ padding: '12px 14px' }}>MV Act Sec 184</td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>₹200</td>
                <td style={{ padding: '12px 14px', color: '#f87171' }}>-50 PTS</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ef4444' }}>Blocking Emergency Vehicle</td>
                <td style={{ padding: '12px 14px' }}>MV Act Sec 194E</td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>₹250</td>
                <td style={{ padding: '12px 14px', color: '#f87171' }}>-50 PTS</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f59e0b' }}>Riding Without Helmet</td>
                <td style={{ padding: '12px 14px' }}>MV Act Sec 129</td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>₹100</td>
                <td style={{ padding: '12px 14px', color: '#f87171' }}>-30 PTS</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f59e0b' }}>Speeding in School Zone</td>
                <td style={{ padding: '12px 14px' }}>MV Act Sec 183</td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>₹150</td>
                <td style={{ padding: '12px 14px', color: '#f87171' }}>-30 PTS</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10b981' }}>Safe Stop Compliance</td>
                <td style={{ padding: '12px 14px' }}>Defensive Standard</td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>₹0</td>
                <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 800 }}>+15 BONUS PTS</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
