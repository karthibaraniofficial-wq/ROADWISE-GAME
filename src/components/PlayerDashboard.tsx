// ROADWISE — Player Dashboard & Multi-Slot Save Management
import React, { useState } from 'react';
import { PlayerProfile, SaveSlot, CloudSyncStatus, AuthUser } from '../types/game';
import { VEHICLE_ROSTER } from '../services/storage';

interface PlayerDashboardProps {
  user: AuthUser | null;
  profile: PlayerProfile;
  slots: SaveSlot[];
  activeSlotId: string;
  syncStatus: CloudSyncStatus;
  onLoadSlot: (slotId: string) => void;
  onCreateSlot: (name: string) => void;
  onRenameSlot: (slotId: string, name: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onSaveCurrent: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onUpdateDisplayName: (newName: string) => void;
  onBack: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  user,
  profile,
  slots,
  activeSlotId,
  syncStatus,
  onLoadSlot,
  onCreateSlot,
  onRenameSlot,
  onDeleteSlot,
  onSaveCurrent,
  onOpenAuth,
  onLogout,
  onUpdateDisplayName,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SAVES' | 'SETTINGS'>('OVERVIEW');
  const [newSlotName, setNewSlotName] = useState('');
  const [showNewSlotInput, setShowNewSlotInput] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || profile.name);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const currentVehicle = VEHICLE_ROSTER[profile.selectedVehicleId];

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'SYNCED':
        return { text: 'Cloud Synced', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '☁️' };
      case 'SYNCING':
        return { text: 'Syncing...', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)', icon: '🔄' };
      case 'OFFLINE_LOCAL':
        return { text: 'Local Save Active', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '💾' };
      case 'ERROR':
        return { text: 'Sync Error', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '⚠️' };
      default:
        return { text: 'Ready', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: '●' };
    }
  };

  const syncBadge = getSyncBadge();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0e17',
        background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #0a0e17 80%)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        color: '#f8fafc',
        overflowY: 'auto',
      }}
    >
      {/* --- TOP BAR --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 36px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              padding: '10px 18px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            ← Back to Menu
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>PLAYER DASHBOARD</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
              Carrier Profile & Multi-Slot Cloud Saves
            </p>
          </div>
        </div>

        {/* Sync Status Badge & Auth Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: syncBadge.bg,
              border: `1px solid ${syncBadge.color}40`,
              color: syncBadge.color,
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>{syncBadge.icon}</span>
            <span>{syncBadge.text}</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#38bdf8',
                }}
              >
                👤 {user.displayName || user.email?.split('@')[0]}
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              ☁️ Cloud Sign In
            </button>
          )}
        </div>
      </div>

      {/* --- SUB NAVIGATION TABS --- */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 36px',
          background: 'rgba(15, 23, 42, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            background: activeTab === 'OVERVIEW' ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
            border: activeTab === 'OVERVIEW' ? '1px solid #0284c7' : '1px solid transparent',
            color: activeTab === 'OVERVIEW' ? '#38bdf8' : '#94a3b8',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          📊 Career Overview
        </button>
        <button
          onClick={() => setActiveTab('SAVES')}
          style={{
            background: activeTab === 'SAVES' ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
            border: activeTab === 'SAVES' ? '1px solid #0284c7' : '1px solid transparent',
            color: activeTab === 'SAVES' ? '#38bdf8' : '#94a3b8',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          💾 Save Game Slots ({slots.length})
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          style={{
            background: activeTab === 'SETTINGS' ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
            border: activeTab === 'SETTINGS' ? '1px solid #0284c7' : '1px solid transparent',
            color: activeTab === 'SETTINGS' ? '#38bdf8' : '#94a3b8',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          ⚙️ Profile Settings
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div style={{ flex: 1, padding: '36px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Driver Identity Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  🛵
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                    {user?.displayName || profile.name}
                  </h3>
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      marginTop: '6px',
                    }}
                  >
                    {profile.licenseGrade.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Level & XP */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Level {profile.level} Rider</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>{profile.xp} XP</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (profile.xp % 250) / 2.5)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>WALLET BALANCE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#facc15', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    ₹{profile.currencyINR.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>SAFETY RATING</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    {profile.safetyScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Fleet Status */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: '#38bdf8' }}>
                ACTIVE VEHICLE FLEET
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: currentVehicle?.modelColor || '#0ea5e9',
                  }}
                />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{currentVehicle?.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{currentVehicle?.category}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>TOP SPEED</div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{currentVehicle?.topSpeedKmh} km/h</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>BRAKING</div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{currentVehicle?.brakeForce} m/s²</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>WET GRIP</div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{currentVehicle?.wetGrip}/10</div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                  Owned Vehicles: {profile.ownedVehicles.length} of 4 unlocked
                </div>
              </div>
            </div>

            {/* Lifetime Deliveries & Infractions */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: '#38bdf8' }}>
                TRAFFIC PERFORMANCE
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>COMPLETED DELIVERIES</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {profile.stats.deliveriesCompleted}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>CLEAN RUNS</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    {profile.stats.cleanDeliveries}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>TOTAL VIOLATIONS</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: profile.stats.violationsCount > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                    {profile.stats.violationsCount}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>MISSIONS UNLOCKED</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    {Math.min(10, profile.completedMissionIds.length + 1)} / 10
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAVES TAB (Multi-Slot Management) */}
        {activeTab === 'SAVES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>SAVED GAME SLOTS</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                  Manage multiple independent delivery careers with cloud synchronization
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onSaveCurrent}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  💾 Save Current Game
                </button>
                <button
                  onClick={() => setShowNewSlotInput(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  + Create New Slot
                </button>
              </div>
            </div>

            {/* New Slot Creation Input */}
            {showNewSlotInput && (
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #0284c7',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter slot name (e.g. Speedrun Career, Zero Fines)"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    if (newSlotName.trim()) {
                      onCreateSlot(newSlotName);
                      setNewSlotName('');
                      setShowNewSlotInput(false);
                    }
                  }}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowNewSlotInput(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Slots Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {slots.map((slot) => {
                const isActive = slot.id === activeSlotId;
                const dateStr = new Date(slot.updatedAt).toLocaleString();

                return (
                  <div
                    key={slot.id}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(2, 132, 199, 0.2))'
                        : 'rgba(30, 41, 59, 0.5)',
                      border: isActive ? '2px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '18px',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isActive ? '0 8px 24px rgba(2, 132, 199, 0.2)' : 'none',
                    }}
                  >
                    <div>
                      {editingSlotId === slot.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            style={{
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid #0284c7',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              color: '#f8fafc',
                              fontSize: '14px',
                            }}
                          />
                          <button
                            onClick={() => {
                              onRenameSlot(slot.id, editNameValue);
                              setEditingSlotId(null);
                            }}
                            style={{
                              background: '#10b981',
                              border: 'none',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{slot.saveName}</h3>
                          {isActive && (
                            <span
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                        <span>Updated: {dateStr}</span>
                        <span>•</span>
                        <span>Level: {slot.profile?.level || 1}</span>
                        <span>•</span>
                        <span>Wallet: ₹{(slot.profile?.currencyINR || 0).toLocaleString()}</span>
                        <span>•</span>
                        <span>Deliveries: {slot.profile?.stats?.deliveriesCompleted || 0}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!isActive && (
                        <button
                          onClick={() => onLoadSlot(slot.id)}
                          style={{
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Load Game
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingSlotId(slot.id);
                          setEditNameValue(slot.saveName);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: '#f8fafc',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Rename
                      </button>

                      {slots.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete save slot "${slot.saveName}"? This action cannot be undone.`)) {
                              onDeleteSlot(slot.id);
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: 'none',
                            color: '#f87171',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px' }}>PROFILE SETTINGS</h2>

            {savedSettingsNotice && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#34d399',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                Profile settings successfully updated!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                  CALLSIGN / DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  maxLength={30}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                  ACCOUNT STATUS
                </label>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#cbd5e1',
                  }}
                >
                  {user ? (
                    <div>
                      <div>Connected Email: <strong>{user.email}</strong></div>
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>
                        User ID: <code>{user.uid}</code>
                      </div>
                    </div>
                  ) : (
                    <div>
                      Operating in Guest Mode. Connect with Firebase to link all multi-device career stats.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (editDisplayName.trim()) {
                    onUpdateDisplayName(editDisplayName.trim());
                    setSavedSettingsNotice(true);
                    setTimeout(() => setSavedSettingsNotice(false), 3000);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '10px',
                }}
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
