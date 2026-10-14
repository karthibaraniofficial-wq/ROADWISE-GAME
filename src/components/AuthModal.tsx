// ROADWISE — Firebase Authentication Modal
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, loading, error, isFirebaseLive, login, register, resetPassword, clearError } = useAuth();

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    if (!email || !email.includes('@')) {
      setLocalValidation('Please enter a valid email address.');
      return;
    }

    if (tab === 'FORGOT') {
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch {
        // Error is set in useAuth
      }
      return;
    }

    if (!password || password.length < 6) {
      setLocalValidation('Password must be at least 6 characters.');
      return;
    }

    if (tab === 'REGISTER') {
      if (password !== confirmPassword) {
        setLocalValidation('Passwords do not match. Please verify.');
        return;
      }
      try {
        await register(email, password, displayName || email.split('@')[0]);
        onSuccess();
        onClose();
      } catch {
        // Error captured by useAuth
      }
    } else {
      try {
        await login(email, password);
        onSuccess();
        onClose();
      } catch {
        // Error captured by useAuth
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(2, 132, 199, 0.15)',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#94a3b8',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              fontSize: '28px',
              fontWeight: 900,
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
              marginBottom: '12px',
            }}
          >
            R
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            ROADWISE CLOUD
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {isFirebaseLive
              ? 'Sign in to synchronize multi-slot saves & career stats across devices'
              : 'Offline / Local Mode Active (saves persist in local storage)'}
          </p>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: isFirebaseLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isFirebaseLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: isFirebaseLive ? '#34d399' : '#fbbf24',
            marginBottom: '20px',
          }}
        >
          <span>{isFirebaseLive ? '● Firebase Online' : '● Local Save Mode'}</span>
        </div>

        {/* Tabs */}
        {tab !== 'FORGOT' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '14px',
              padding: '4px',
              marginBottom: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setLocalValidation(null);
                clearError();
              }}
              style={{
                background: tab === 'LOGIN' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: tab === 'LOGIN' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setLocalValidation(null);
                clearError();
              }}
              style={{
                background: tab === 'REGISTER' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: tab === 'REGISTER' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Validation Banner */}
        {(error || localValidation) && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{localValidation || error}</span>
          </div>
        )}

        {/* Forgot Password Success */}
        {tab === 'FORGOT' && resetSent && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '14px',
              color: '#6ee7b7',
              fontSize: '13px',
              marginBottom: '18px',
              textAlign: 'center',
            }}
          >
            Password reset link sent to <strong>{email}</strong>! Please check your inbox.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'REGISTER' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                COURIER / DRIVER NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              placeholder="courier@roadwise.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {tab !== 'FORGOT' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                  PASSWORD
                </label>
                {tab === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('FORGOT');
                      setResetSent(false);
                      setLocalValidation(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px 42px 12px 16px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: 0,
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {tab === 'REGISTER' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                CONFIRM PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : tab === 'LOGIN' ? 'Sign In to ROADWISE' : tab === 'REGISTER' ? 'Register Account' : 'Send Reset Link'}
          </button>

          {/* Back to login if forgot password */}
          {tab === 'FORGOT' && (
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setResetSent(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              ← Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
