// ROADWISE — Real-time 2D Canvas Minimap & Expandable Tactical Navigation Map
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimapData } from '../types/game';

interface MinimapProps {
  getMinimapData: () => MinimapData;
  isPickupComplete: boolean;
  isMapOpen?: boolean;
  onToggleMap?: () => void;
}

const DISTRICT_LANDMARKS = [
  { name: 'Commercial Market', desc: 'MG Road Bazaar (40 km/h)', x: 0, z: -10, color: '#38bdf8' },
  { name: 'Residential Colony', desc: 'Green Valley (40 km/h)', x: 0, z: 50, color: '#34d399' },
  { name: 'IT Park Hub', desc: 'Tech Towers & Roundabout (45 km/h)', x: 65, z: 55, color: '#818cf8' },
  { name: 'School Zone', desc: 'Strict School Gate (30 km/h)', x: 0, z: -78, color: '#f59e0b' },
  { name: 'Hospital District', desc: 'Emergency Ward (30-40 km/h)', x: -68, z: 62, color: '#ef4444' },
  { name: 'Industrial Zone', desc: 'Freight Depot & Cargo (35-40 km/h)', x: 0, z: 98, color: '#fb923c' },
  { name: 'Heritage Quarter', desc: 'Sandstone Temple (25 km/h)', x: -75, z: -55, color: '#d97706' },
  { name: 'Ring Road Highway', desc: 'Express Outer Bypass (50-60 km/h)', x: 60, z: -130, color: '#a855f7' },
];

export const Minimap: React.FC<MinimapProps> = ({
  getMinimapData,
  isPickupComplete,
  isMapOpen: controlledIsOpen,
  onToggleMap: controlledToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalExpanded;

  const toggleExpanded = useCallback(() => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [controlledToggle]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tacticalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Global keydown listener for [M]
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'KeyM') {
        toggleExpanded();
      } else if (e.code === 'Escape' && isExpanded) {
        toggleExpanded();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleExpanded, isExpanded]);

  // Mini Radar Loop
  useEffect(() => {
    let animId: number;

    const renderMini = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 160;
      canvas.width = size;
      canvas.height = size;

      const data = getMinimapData();
      const [px, pz] = data.playerPos;

      // Radar background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      const scale = 0.85;

      // Draw Road Ribbons
      if (data.roadSegments && data.roadSegments.length > 0) {
        for (const segment of data.roadSegments) {
          if (segment.length < 2) continue;
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const [firstX, firstZ] = segment[0];
          ctx.moveTo((firstX - px) * scale, (firstZ - pz) * scale);
          for (let i = 1; i < segment.length; i++) {
            const [sx, sz] = segment[i];
            ctx.lineTo((sx - px) * scale, (sz - pz) * scale);
          }
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 10 * scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.setLineDash([2, 3]);
          ctx.moveTo((firstX - px) * scale, (firstZ - pz) * scale);
          for (let i = 1; i < segment.length; i++) {
            const [sx, sz] = segment[i];
            ctx.lineTo((sx - px) * scale, (sz - pz) * scale);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw Traffic Signals
      for (const light of data.trafficLights) {
        const lx = (light.pos[0] - px) * scale;
        const lz = (light.pos[1] - pz) * scale;
        ctx.beginPath();
        ctx.arc(lx, lz, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = light.state === 'RED' ? '#ef4444' : light.state === 'AMBER' ? '#f59e0b' : '#10b981';
        ctx.fill();
      }

      // Draw A* Route Line
      if (data.routeWaypoints && data.routeWaypoints.length > 1) {
        ctx.beginPath();
        ctx.setLineDash([4, 3]);
        const [w0X, w0Z] = data.routeWaypoints[0];
        ctx.moveTo((w0X - px) * scale, (w0Z - pz) * scale);
        for (let i = 1; i < data.routeWaypoints.length; i++) {
          const [wx, wz] = data.routeWaypoints[i];
          ctx.lineTo((wx - px) * scale, (wz - pz) * scale);
        }
        ctx.strokeStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Destination Beacon
      const targetPos = !isPickupComplete ? data.pickupPos : data.dropoffPos;
      if (targetPos) {
        const tx = (targetPos[0] - px) * scale;
        const tz = (targetPos[1] - pz) * scale;
        const pulse = Math.sin(Date.now() * 0.007) * 3;
        ctx.beginPath();
        ctx.arc(tx, tz, 7 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tx, tz, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.fill();
      }

      // AI Cars
      for (const car of data.aiCars) {
        const cx = (car.pos[0] - px) * scale;
        const cz = (car.pos[1] - pz) * scale;
        ctx.fillStyle = car.isAmbulance ? (Date.now() % 400 < 200 ? '#ef4444' : '#38bdf8') : '#94a3b8';
        ctx.fillRect(cx - 3, cz - 3, 6, 6);
      }

      // Player Arrow
      ctx.restore();
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(-data.playerHeading);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('N', size / 2 - 3, 14);

      animId = requestAnimationFrame(renderMini);
    };

    animId = requestAnimationFrame(renderMini);
    return () => cancelAnimationFrame(animId);
  }, [getMinimapData, isPickupComplete]);

  // Tactical Full Map Loop (When opened)
  useEffect(() => {
    if (!isExpanded) return;
    let animId: number;

    const renderTactical = () => {
      const canvas = tacticalCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 560;
      canvas.width = size;
      canvas.height = size;

      const data = getMinimapData();
      const [px, pz] = data.playerPos;

      // Dark tactical blueprint background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, size, size);

      // Grid blueprint coordinates
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x <= size; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }
      for (let y = 0; y <= size; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      ctx.save();
      // Center on city origin [0, 0], scale to fit ~340m city across 560px
      ctx.translate(size / 2, size / 2);
      const scale = 1.65;

      // Draw all roads
      if (data.roadSegments && data.roadSegments.length > 0) {
        for (const segment of data.roadSegments) {
          if (segment.length < 2) continue;
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(segment[0][0] * scale, segment[0][1] * scale);
          for (let i = 1; i < segment.length; i++) {
            ctx.lineTo(segment[i][0] * scale, segment[i][1] * scale);
          }
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 12 * scale;
          ctx.stroke();

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 9 * scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.setLineDash([3, 4]);
          ctx.moveTo(segment[0][0] * scale, segment[0][1] * scale);
          for (let i = 1; i < segment.length; i++) {
            ctx.lineTo(segment[i][0] * scale, segment[i][1] * scale);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw A* Route Line
      if (data.routeWaypoints && data.routeWaypoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(data.routeWaypoints[0][0] * scale, data.routeWaypoints[0][1] * scale);
        for (let i = 1; i < data.routeWaypoints.length; i++) {
          ctx.lineTo(data.routeWaypoints[i][0] * scale, data.routeWaypoints[i][1] * scale);
        }
        ctx.strokeStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Target Beacon
      const targetPos = !isPickupComplete ? data.pickupPos : data.dropoffPos;
      if (targetPos) {
        const tx = targetPos[0] * scale;
        const tz = targetPos[1] * scale;
        const pulse = Math.sin(Date.now() * 0.006) * 4;

        ctx.beginPath();
        ctx.arc(tx, tz, 10 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tx, tz, 5, 0, Math.PI * 2);
        ctx.fillStyle = !isPickupComplete ? '#10b981' : '#f59e0b';
        ctx.fill();
      }

      // District Labels
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      for (const d of DISTRICT_LANDMARKS) {
        const dx = d.x * scale;
        const dz = d.z * scale;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(dx, dz, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
        ctx.fillText(d.name, dx + 7, dz + 3);
      }

      // Player Arrow
      ctx.save();
      ctx.translate(px * scale, pz * scale);
      ctx.rotate(-data.playerHeading);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 9);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(renderTactical);
    };

    animId = requestAnimationFrame(renderTactical);
    return () => cancelAnimationFrame(animId);
  }, [isExpanded, getMinimapData, isPickupComplete]);

  // Compute live distance along route
  const currentData = getMinimapData();
  const routePoints = currentData.routeWaypoints || [];
  let routeDistMeters = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const dx = routePoints[i][0] - routePoints[i - 1][0];
    const dz = routePoints[i][1] - routePoints[i - 1][1];
    routeDistMeters += Math.hypot(dx, dz);
  }
  const estSeconds = Math.max(1, Math.round(routeDistMeters / 9.5));

  return (
    <>
      {/* 1. Compact HUD Radar (Top-Right) */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          right: '24px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 50,
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '8px',
            fontSize: '10px',
            fontWeight: '800',
            color: '#94a3b8',
            letterSpacing: '0.06em',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          LHT RADAR
        </div>

        {/* Expand Tactical Map Button */}
        <button
          onClick={toggleExpanded}
          title="Open Tactical City Map [M]"
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            padding: '3px 6px',
            fontSize: '10px',
            fontWeight: '800',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ⛶ [M]
        </button>
      </div>

      {/* 2. Expandable Tactical Full City Map Modal */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 26, 0.92)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '920px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🗺️ TACTICAL CITY MAP — 8 DISTRICTS
                </h2>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                  A* Shortest Legal Route &bull; Left-Hand Traffic (LHT) &bull; Live Telemetry
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <div>
                    <span style={{ color: '#94a3b8' }}>ROUTE DIST: </span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{Math.round(routeDistMeters)}m</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>EST. TRANSIT: </span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>~{estSeconds}s</span>
                  </div>
                </div>

                <button
                  onClick={toggleExpanded}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✕ Close [M / Esc]
                </button>
              </div>
            </div>

            {/* Map Canvas & District Info Row */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
              {/* Tactical Canvas */}
              <div
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <canvas ref={tacticalCanvasRef} style={{ display: 'block', width: '560px', height: '560px' }} />
              </div>

              {/* District Sidebar */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '560px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  City Districts &amp; Speed Limits
                </div>

                {DISTRICT_LANDMARKS.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{d.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
