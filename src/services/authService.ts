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
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
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
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by browser. Please enable popups.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Please include your country code (e.g. +91 9876543210).';
    case 'auth/invalid-verification-code':
      return 'Incorrect 6-digit SMS OTP code. Please check and retry.';
    case 'auth/code-expired':
      return 'The SMS OTP code has expired. Please request a new code.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA security check failed. Please refresh and retry.';
    default:
      return 'An authentication error occurred. Please try again.';
  }
}

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName || user.phoneNumber || user.email?.split('@')[0] || 'Courier Rider',
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
 * Sign in using Google OAuth Popup.
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  if (!isFirebaseConfigured() || !auth) {
    const guestUser: AuthUser = {
      uid: 'google_offline_' + Date.now(),
      email: 'rider.google@example.com',
      displayName: 'Google Rider',
      emailVerified: true,
    };
    localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, JSON.stringify(guestUser));
    return guestUser;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  const mapped = mapFirebaseUser(credential.user);
  if (!mapped) throw new Error('Google sign-in failed to establish user session.');
  return mapped;
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;
let activeConfirmationResult: ConfirmationResult | null = null;

/**
 * Initializes invisible reCAPTCHA verifier for Phone Auth.
 */
export function setupPhoneRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (!isFirebaseConfigured() || !auth) return null;
  if (typeof window === 'undefined') return null;

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[ROADWISE AUTH] reCAPTCHA container element not found:', containerId);
    return null;
  }

  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignored if already cleared
    }
    activeRecaptchaVerifier = null;
  }

  activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.info('[ROADWISE AUTH] reCAPTCHA verified for phone authentication.');
    },
    'expired-callback': () => {
      console.warn('[ROADWISE AUTH] reCAPTCHA expired. Prompting new attempt.');
    },
  });

  return activeRecaptchaVerifier;
}

/**
 * Send SMS OTP verification code to a phone number (E.164 format, e.g. +919876543210).
 */
export async function sendPhoneOtp(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<void> {
  const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Please enter a valid phone number with country code (e.g. +91 98765 43210).');
  }

  if (!isFirebaseConfigured() || !auth) {
    console.info('[ROADWISE AUTH] Phone OTP simulated in Offline/Local mode for:', cleanPhone);
    return;
  }

  const verifier = setupPhoneRecaptcha(containerId);
  if (!verifier) {
    throw new Error('Security verification element is not ready. Please refresh the page and try again.');
  }

  const confirmation = await signInWithPhoneNumber(auth, cleanPhone, verifier);
  activeConfirmationResult = confirmation;
}

/**
 * Verify SMS OTP code and establish user session.
 */
export async function verifyPhoneOtp(otpCode: string, fallbackPhone?: string): Promise<AuthUser> {
  const cleanOtp = otpCode.trim();
  if (!cleanOtp || cleanOtp.length < 6) {
    throw new Error('Please enter the 6-digit SMS verification code.');
  }

  if (!isFirebaseConfigured() || !auth || !activeConfirmationResult) {
    // Offline simulation fallback
    const guestUser: AuthUser = {
      uid: 'phone_offline_' + Date.now(),
      email: null,
      phoneNumber: fallbackPhone || '+919876543210',
      displayName: 'Mobile Courier (' + (fallbackPhone?.slice(-4) || '9876') + ')',
      emailVerified: true,
    };
    localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, JSON.stringify(guestUser));
    return guestUser;
  }

  const credential = await activeConfirmationResult.confirm(cleanOtp);
  const mapped = mapFirebaseUser(credential.user);
  if (!mapped) throw new Error('Phone verification failed to establish user session.');
  return mapped;
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
