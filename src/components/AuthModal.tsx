// ROADWISE — Firebase Authentication Modal (Email/Password, Google Sign-in, Phone Auth)
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthTab = 'LOGIN' | 'REGISTER' | 'PHONE' | 'FORGOT';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    loading,
    error,
    isFirebaseLive,
    login,
    register,
    loginGoogle,
    loginGoogleRedirect,
    loginGuest,
    sendOtp,
    verifyOtp,
    resetPassword,
    clearError,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [localValidation, setLocalValidation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        // Error captured in useAuth
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

  const handleGoogleSignIn = async () => {
    setLocalValidation(null);
    clearError();
    try {
      await loginGoogle();
      onSuccess();
      onClose();
    } catch {
      // Error is set in useAuth
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setLocalValidation(null);
    clearError();
    try {
      await loginGoogleRedirect();
    } catch {
      // Error is set in useAuth
    }
  };

  const handleGuestSignIn = () => {
    loginGuest('Rider_' + Math.floor(1000 + Math.random() * 9000));
    onSuccess();
    onClose();
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setLocalValidation('Please enter a valid phone number with country code (e.g. +91 98765 43210).');
      return;
    }

    try {
      await sendOtp(cleanPhone, 'recaptcha-container');
      setOtpSent(true);
    } catch {
      // Error handled by useAuth
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setLocalValidation('Please enter the 6-digit SMS verification code.');
      return;
    }

    try {
      await verifyOtp(cleanCode, phoneNumber);
      onSuccess();
      onClose();
    } catch {
      // Error handled by useAuth
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
          maxWidth: '470px',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(2, 132, 199, 0.15)',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Invisible reCAPTCHA container for Phone Auth */}
        <div id="recaptcha-container"></div>

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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              fontSize: '26px',
              fontWeight: 900,
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
              marginBottom: '10px',
            }}
          >
            R
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            ROADWISE CLOUD
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Firebase Authentication & Cloud Firestore Database
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
            marginBottom: '18px',
          }}
        >
          <span>
            {isFirebaseLive ? '● Connected to roadwise-e5b11' : '● Offline / Local Storage Mode'}
          </span>
        </div>

        {/* Tabs: Sign In / Create Account / Phone OTP */}
        {tab !== 'FORGOT' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '14px',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '4px',
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
                padding: '9px 4px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Email Sign In
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
                padding: '9px 4px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('PHONE');
                setLocalValidation(null);
                clearError();
              }}
              style={{
                background: tab === 'PHONE' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: tab === 'PHONE' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 4px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📱 Phone OTP
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
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>⚠️</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{localValidation || error}</span>
            </div>
            {error && (error.toLowerCase().includes('popup') || error.toLowerCase().includes('blocked') || error.toLowerCase().includes('redirect')) && (
              <button
                type="button"
                onClick={handleGoogleRedirectSignIn}
                disabled={loading}
                style={{
                  marginTop: '4px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                }}
              >
                <span>🔄</span>
                <span>Sign In with Full-Page Redirect</span>
              </button>
            )}
          </div>
        )}

        {/* Google Sign-in Button */}
        {tab !== 'FORGOT' && (
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
                color: '#64748b',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            </div>
          </div>
        )}

        {/* -------------------- PHONE AUTH FORM -------------------- */}
        {tab === 'PHONE' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    MOBILE PHONE NUMBER (WITH COUNTRY CODE)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#f8fafc',
                      fontSize: '15px',
                      outline: 'none',
                      letterSpacing: '0.05em',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    A 6-digit SMS verification code will be sent via Firebase Auth.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '13px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Sending SMS OTP...' : 'Send OTP Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#7dd3fc',
                    textAlign: 'center',
                  }}
                >
                  SMS OTP sent to <strong>{phoneNumber}</strong>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    ENTER 6-DIGIT OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#f8fafc',
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '0.3em',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '13px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'center',
                  }}
                >
                  ← Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        {/* -------------------- EMAIL/PASSWORD FORM -------------------- */}
        {tab !== 'PHONE' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                marginTop: '6px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? 'Processing...'
                : tab === 'LOGIN'
                ? 'Sign In to ROADWISE'
                : tab === 'REGISTER'
                ? 'Register Account'
                : 'Send Reset Link'}
            </button>

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
        )}

        {/* Instant Guest / Offline Play Bypass */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleGuestSignIn}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed rgba(255, 255, 255, 0.22)',
              borderRadius: '12px',
              padding: '11px 16px',
              color: '#e2e8f0',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#38bdf8';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <span>🎮</span>
            <span>Play as Guest / Offline Rider</span>
          </button>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
            Instant access — no Google login or popup permissions required
          </div>
        </div>
      </div>
    </div>
  );
};
