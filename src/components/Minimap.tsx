// ROADWISE — Real-time 2D Canvas Minimap with Dynamic Route Line & Road Network
import React, { useEffect, useRef } from 'react';
import { MinimapData } from '../types/game';

interface MinimapProps {
  getMinimapData: () => MinimapData;
  isPickupComplete: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({ getMinimapData, isPickupComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 160;
      canvas.width = size;
      canvas.height = size;

      const data = getMinimapData();
      const [px, pz] = data.playerPos;

      // Clear radar background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, 0, size, size);

      // Radar circular mask / border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Save context and center on player position
      ctx.save();
      ctx.translate(size / 2, size / 2);

      // Scale: 1 unit in 3D = 0.85 pixels on minimap (~180m visible window)
      const scale = 0.85;

      // 1. Draw Connected Road Network (Curved splines & straight avenues)
      if (data.roadSegments && data.roadSegments.length > 0) {
        // Draw road surface ribbons
        for (const segment of data.roadSegments) {
          if (segment.length < 2) continue;

          // Road base / asphalt
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

          // Road centerline dashes
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
      } else {
        // Fallback grid
        ctx.fillStyle = '#334155';
        for (const ax of [-50, 0, 50]) {
          const screenX = (ax - px) * scale;
          ctx.fillRect(screenX - 5 * scale, -size, 10 * scale, size * 2);
        }
        for (const sz of [-50, 0, 50]) {
          const screenZ = (sz - pz) * scale;
          ctx.fillRect(-size, screenZ - 5 * scale, size * 2, 10 * scale);
        }
      }

      // 2. Draw Traffic Lights
      for (const light of data.trafficLights) {
        const lx = (light.pos[0] - px) * scale;
        const lz = (light.pos[1] - pz) * scale;

        ctx.beginPath();
        ctx.arc(lx, lz, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = light.state === 'RED' ? '#ef4444' : light.state === 'AMBER' ? '#f59e0b' : '#10b981';
        ctx.fill();
      }

      // 3. Draw Legal Route Along Road Network (A* Waypoints)
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
      } else {
        // Fallback straight line
        const targetPos = !isPickupComplete ? data.pickupPos : data.dropoffPos;
        if (targetPos) {
          const tx = (targetPos[0] - px) * scale;
          const tz = (targetPos[1] - pz) * scale;
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(0, 0);
          ctx.lineTo(tx, tz);
          ctx.strokeStyle = !isPickupComplete ? 'rgba(16, 185, 129, 0.7)' : 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Pulsing Target Beacon (Pickup or Current Dropoff)
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

      // 4. Draw AI Vehicles
      for (const car of data.aiCars) {
        const cx = (car.pos[0] - px) * scale;
        const cz = (car.pos[1] - pz) * scale;

        ctx.fillStyle = car.isAmbulance ? (Date.now() % 400 < 200 ? '#ef4444' : '#38bdf8') : '#94a3b8';
        ctx.fillRect(cx - 3, cz - 3, 6, 6);
      }

      // 5. Draw Player Vehicle Arrow at Center
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
      ctx.fillStyle = '#38bdf8'; // Sky blue player arrow
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Cardinal N marker
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('N', size / 2 - 3, 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [getMinimapData, isPickupComplete]);

  return (
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
    </div>
  );
};
