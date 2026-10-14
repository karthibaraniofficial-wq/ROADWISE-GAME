// ROADWISE — Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { AuthUser } from '../types/game';

// Configure persistence if auth instance is available
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[ROADWISE AUTH] Persistence initialization note:', err.message);
  });
}

const LOCAL_STORAGE_GUEST_KEY = 'ROADWISE_GUEST_USER_V1';

export function formatAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please enter a valid email.';
    case 'auth/user-disabled':
      return 'This player account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account was found with this email address. Please register first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and retry.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long and include numbers or symbols.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily restricted. Try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network connection failure. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires a fresh login session.';
    default:
      return 'An authentication error occurred. Please try again.';
  }
}

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Courier Rider',
    emailVerified: user.emailVerified,
    avatarUrl: user.photoURL || undefined,
  };
}

/**
 * Register a new player account with Email, Password, and Display Name.
 */
export async function registerPlayer(
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> {
  const cleanEmail = email.trim();
  const cleanName = displayName.trim() || 'Courier Partner';

  if (!cleanEmail) throw new Error('Email is required.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  if (!isFirebaseConfigured() || !auth) {
    // Local / Offline mode fallback
    const guestUser: AuthUser = {
      uid: 'offline_guest_' + Date.now(),
      email: cleanEmail,
      displayName: cleanName,
      emailVerified: true,
    };
    localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, JSON.stringify(guestUser));
    return guestUser;
  }

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  if (cleanName && credential.user) {
    await updateProfile(credential.user, { displayName: cleanName });
  }

  // Attempt to trigger email verification (non-blocking)
  try {
    if (credential.user) {
      await sendEmailVerification(credential.user);
    }
  } catch (err) {
    console.info('[ROADWISE AUTH] Note on email verification:', err);
  }

  const mapped = mapFirebaseUser(credential.user);
  if (!mapped) throw new Error('Registration failed to create user session.');
  return mapped;
}

/**
 * Sign in existing player with email & password.
 */
export async function loginPlayer(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim();
  if (!cleanEmail) throw new Error('Email is required.');
  if (!password) throw new Error('Password is required.');

  if (!isFirebaseConfigured() || !auth) {
    // Local / Offline mode fallback
    const saved = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    const guestUser: AuthUser = {
      uid: 'offline_guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      emailVerified: true,
    };
    localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, JSON.stringify(guestUser));
    return guestUser;
  }

  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const mapped = mapFirebaseUser(credential.user);
  if (!mapped) throw new Error('Login failed to establish user session.');
  return mapped;
}

/**
 * Sign out current player session.
 */
export async function logoutPlayer(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  }
  localStorage.removeItem(LOCAL_STORAGE_GUEST_KEY);
}

/**
 * Send password reset email.
 */
export async function sendPlayerPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim();
  if (!cleanEmail) throw new Error('Please enter the email address for password reset.');

  if (!isFirebaseConfigured() || !auth) {
    console.info('[ROADWISE AUTH] Password reset requested in Offline/Local mode for:', cleanEmail);
    return;
  }

  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Resend verification email to current player.
 */
export async function resendVerificationEmail(): Promise<void> {
  if (isFirebaseConfigured() && auth && auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/**
 * Subscribe to auth state changes.
 */
export function subscribeToAuthState(callback: (user: AuthUser | null) => void): () => void {
  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, (user) => {
      callback(mapFirebaseUser(user));
    });
  }

  // Local/Offline check
  const saved = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
  if (saved) {
    try {
      callback(JSON.parse(saved));
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }

  return () => {};
}

/**
 * Get current active user synchronously if available.
 */
export function getCurrentAuthUser(): AuthUser | null {
  if (isFirebaseConfigured() && auth && auth.currentUser) {
    return mapFirebaseUser(auth.currentUser);
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}
