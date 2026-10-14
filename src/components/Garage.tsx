// ROADWISE — Vehicle Garage & Upgrade Hub
import React, { useState } from 'react';
import { PlayerProfile, VehicleId } from '../types/game';
import { VEHICLE_ROSTER, COLOR_PALETTE } from '../services/storage';

interface GarageProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onBack: () => void;
}

export const Garage: React.FC<GarageProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<VehicleId>(profile.selectedVehicleId);
  const vehicle = VEHICLE_ROSTER[selectedId];
  const isOwned = profile.ownedVehicles.includes(selectedId);
  const upgrades = profile.vehicleUpgrades[selectedId];

  const handleSelectActive = () => {
    if (!isOwned) return;
    onUpdateProfile((prev) => ({
      ...prev,
      selectedVehicleId: selectedId,
    }));
  };

  const handleBuyVehicle = () => {
    if (profile.currencyINR < vehicle.priceINR) {
      alert(`Insufficient funds! You need ₹${vehicle.priceINR.toLocaleString()} to purchase ${vehicle.name}.`);
      return;
    }

    onUpdateProfile((prev) => ({
      ...prev,
      currencyINR: prev.currencyINR - vehicle.priceINR,
      ownedVehicles: [...prev.ownedVehicles, selectedId],
      selectedVehicleId: selectedId,
    }));
  };

  const handleUpgradeEngine = () => {
    const cost = 250 * (upgrades.engineStage + 1);
    if (upgrades.engineStage >= 3) return;
    if (profile.currencyINR < cost) {
      alert(`Insufficient funds for Engine Stage ${upgrades.engineStage + 1}! Need ₹${cost}.`);
      return;
    }

    onUpdateProfile((prev) => ({
      ...prev,
      currencyINR: prev.currencyINR - cost,
      vehicleUpgrades: {
        ...prev.vehicleUpgrades,
        [selectedId]: {
          ...prev.vehicleUpgrades[selectedId],
          engineStage: prev.vehicleUpgrades[selectedId].engineStage + 1,
        },
      },
    }));
  };

  const handleUpgradeBrakes = () => {
    const cost = 200 * (upgrades.brakeStage + 1);
    if (upgrades.brakeStage >= 2) return;
    if (profile.currencyINR < cost) {
      alert(`Insufficient funds for Brake Upgrade! Need ₹${cost}.`);
      return;
    }

    onUpdateProfile((prev) => ({
      ...prev,
      currencyINR: prev.currencyINR - cost,
      vehicleUpgrades: {
        ...prev.vehicleUpgrades,
        [selectedId]: {
          ...prev.vehicleUpgrades[selectedId],
          brakeStage: prev.vehicleUpgrades[selectedId].brakeStage + 1,
        },
      },
    }));
  };

  const handleUpgradeTires = () => {
    const cost = 220 * (upgrades.tireStage + 1);
    if (upgrades.tireStage >= 2) return;
    if (profile.currencyINR < cost) {
      alert(`Insufficient funds for Tire Upgrade! Need ₹${cost}.`);
      return;
    }

    onUpdateProfile((prev) => ({
      ...prev,
      currencyINR: prev.currencyINR - cost,
      vehicleUpgrades: {
        ...prev.vehicleUpgrades,
        [selectedId]: {
          ...prev.vehicleUpgrades[selectedId],
          tireStage: prev.vehicleUpgrades[selectedId].tireStage + 1,
        },
      },
    }));
  };

  const handleSelectColor = (index: number) => {
    onUpdateProfile((prev) => ({
      ...prev,
      vehicleUpgrades: {
        ...prev.vehicleUpgrades,
        [selectedId]: {
          ...prev.vehicleUpgrades[selectedId],
          colorIndex: index,
        },
      },
    }));
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
            Fleet Garage & Workshop
          </h2>
        </div>

        {/* Live Wallet Balance */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#facc15', fontSize: '18px' }}>₹</span>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#facc15' }}>
            {profile.currencyINR.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Garage Layout */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Left Column: Vehicle Selector List */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.values(VEHICLE_ROSTER).map((v) => {
            const owned = profile.ownedVehicles.includes(v.id);
            const isSelected = selectedId === v.id;
            const isActive = profile.selectedVehicleId === v.id;

            return (
              <div
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                style={{
                  background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{v.name}</span>
                    {isActive && (
                      <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        EQUIPPED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{v.category}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {owned ? (
                    <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 700 }}>OWNED</span>
                  ) : (
                    <span style={{ color: '#facc15', fontSize: '14px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{v.priceINR}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Vehicle Specs, Upgrades & Paint */}
        <div style={{
          flex: '2',
          minWidth: '400px',
          background: 'rgba(30, 41, 59, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '28px',
        }}>
          {/* Header & Equip/Buy */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc' }}>{vehicle.name}</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '480px', marginTop: '4px' }}>
                {vehicle.description}
              </p>
            </div>

            <div>
              {isOwned ? (
                <button
                  disabled={profile.selectedVehicleId === selectedId}
                  onClick={handleSelectActive}
                  style={{
                    background: profile.selectedVehicleId === selectedId ? '#334155' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: profile.selectedVehicleId === selectedId ? '#94a3b8' : '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: profile.selectedVehicleId === selectedId ? 'default' : 'pointer',
                  }}
                >
                  {profile.selectedVehicleId === selectedId ? 'EQUIPPED ✓' : 'EQUIP RIDE'}
                </button>
              ) : (
                <button
                  onClick={handleBuyVehicle}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  BUY FOR ₹{vehicle.priceINR}
                </button>
              )}
            </div>
          </div>

          {/* Performance Specs Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '20px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                <span>Top Speed</span>
                <span style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                  {Math.round(vehicle.topSpeedKmh * (1 + upgrades.engineStage * 0.15))} km/h
                </span>
              </div>
              <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(vehicle.topSpeedKmh / 75) * 100}%`, height: '100%', background: '#38bdf8' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                <span>Acceleration</span>
                <span style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                  {(vehicle.acceleration * (1 + upgrades.engineStage * 0.15)).toFixed(1)} m/s²
                </span>
              </div>
              <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(vehicle.acceleration / 10) * 100}%`, height: '100%', background: '#38bdf8' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                <span>Braking Response</span>
                <span style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                  {upgrades.brakeStage === 0 ? 'Standard Drum' : upgrades.brakeStage === 1 ? 'Front Disc' : 'Dual ABS Pro'}
                </span>
              </div>
              <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${((upgrades.brakeStage + 1) / 3) * 100}%`, height: '100%', background: '#10b981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                <span>Monsoon Wet Grip</span>
                <span style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                  {upgrades.tireStage === 0 ? 'City Nylon' : upgrades.tireStage === 1 ? 'Soft Compound' : 'All-Weather Radial'}
                </span>
              </div>
              <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${((upgrades.tireStage + 1) / 3) * 100}%`, height: '100%', background: '#f59e0b' }} />
              </div>
            </div>
          </div>

          {/* Workshop Upgrades Section */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Performance Upgrades</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* Engine Tuning */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Engine Tuning</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 10px' }}>
                  Stage {upgrades.engineStage}/3 (+{upgrades.engineStage * 15}% Top Speed)
                </div>
                <button
                  disabled={!isOwned || upgrades.engineStage >= 3}
                  onClick={handleUpgradeEngine}
                  style={{
                    width: '100%',
                    background: upgrades.engineStage >= 3 ? '#334155' : '#0284c7',
                    border: 'none',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: upgrades.engineStage >= 3 ? 'default' : 'pointer',
                  }}
                >
                  {upgrades.engineStage >= 3 ? 'MAXED OUT' : `UPGRADE (₹${250 * (upgrades.engineStage + 1)})`}
                </button>
              </div>

              {/* Brakes Upgrade */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Braking System</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 10px' }}>
                  Stage {upgrades.brakeStage}/2 (Shortens Stopping Distance)
                </div>
                <button
                  disabled={!isOwned || upgrades.brakeStage >= 2}
                  onClick={handleUpgradeBrakes}
                  style={{
                    width: '100%',
                    background: upgrades.brakeStage >= 2 ? '#334155' : '#10b981',
                    border: 'none',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: upgrades.brakeStage >= 2 ? 'default' : 'pointer',
                  }}
                >
                  {upgrades.brakeStage >= 2 ? 'MAXED OUT' : `UPGRADE (₹${200 * (upgrades.brakeStage + 1)})`}
                </button>
              </div>

              {/* Tires Upgrade */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Monsoon Wet Tires</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 10px' }}>
                  Stage {upgrades.tireStage}/2 (Hydroplane Resistance)
                </div>
                <button
                  disabled={!isOwned || upgrades.tireStage >= 2}
                  onClick={handleUpgradeTires}
                  style={{
                    width: '100%',
                    background: upgrades.tireStage >= 2 ? '#334155' : '#f59e0b',
                    border: 'none',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: upgrades.tireStage >= 2 ? 'default' : 'pointer',
                  }}
                >
                  {upgrades.tireStage >= 2 ? 'MAXED OUT' : `UPGRADE (₹${220 * (upgrades.tireStage + 1)})`}
                </button>
              </div>
            </div>
          </div>

          {/* Custom Livery / Color Selection */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>Custom Paint Finish</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {COLOR_PALETTE.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectColor(idx)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: upgrades.colorIndex === idx ? '3px solid #ffffff' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: upgrades.colorIndex === idx ? '0 0 12px ' + c.hex : 'none',
                    transition: 'all 0.15s',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
