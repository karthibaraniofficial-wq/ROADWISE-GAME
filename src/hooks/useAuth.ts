// ROADWISE — useAuth React Hook
import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types/game';
import {
  subscribeToAuthState,
  loginPlayer,
  registerPlayer,
  logoutPlayer,
  sendPlayerPasswordReset,
  resendVerificationEmail,
  formatAuthError,
} from '../services/authService';
import { isFirebaseConfigured } from '../lib/firebase';

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isFirebaseLive: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const loggedIn = await loginPlayer(email, pass);
      setUser(loggedIn);
    } catch (err: any) {
      const msg = err.code ? formatAuthError(err.code) : err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const registered = await registerPlayer(email, pass, name);
      setUser(registered);
    } catch (err: any) {
      const msg = err.code ? formatAuthError(err.code) : err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutPlayer();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPlayerPasswordReset(email);
    } catch (err: any) {
      const msg = err.code ? formatAuthError(err.code) : err.message;
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const resendVerification = useCallback(async () => {
    setError(null);
    try {
      await resendVerificationEmail();
    } catch (err: any) {
      setError(err.message || 'Could not send verification email.');
    }
  }, []);

  return {
    user,
    loading,
    error,
    isFirebaseLive: isFirebaseConfigured(),
    login,
    register,
    logout,
    resetPassword,
    resendVerification,
    clearError,
  };
}
