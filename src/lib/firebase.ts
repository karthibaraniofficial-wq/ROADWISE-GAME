// ROADWISE — Centralized Firebase Configuration & Modular SDK Provider
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Environment variables provided via .env (Vite / Esbuild define)
export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_API_KEY : '') || '',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_AUTH_DOMAIN : '') || '',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_PROJECT_ID : '') || '',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_STORAGE_BUCKET : '') || '',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : '') || '',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_APP_ID : '') || '',
};

/**
 * Validates whether the active project has real, configured Firebase credentials.
 * Returns false if keys are blank, undefined, or default placeholders.
 */
export function isFirebaseConfigured(): boolean {
  const key = firebaseConfig.apiKey;
  const project = firebaseConfig.projectId;
  return Boolean(
    key &&
    key.trim().length > 10 &&
    !key.includes('ExampleKey') &&
    project &&
    project.trim().length > 3 &&
    !project.includes('example')
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    console.info('[ROADWISE] Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[ROADWISE] Firebase initialization failed. Falling back to local/offline persistence:', err);
    appInstance = null;
    authInstance = null;
    firestoreInstance = null;
  }
} else {
  console.info('[ROADWISE] Firebase credentials not configured. Operating in Offline / Local Save mode.');
}

export const app = appInstance;
export const auth = authInstance;
export const db = firestoreInstance;
