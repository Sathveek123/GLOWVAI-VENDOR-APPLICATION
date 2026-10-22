/**
 * GlowVAI Vendor App — Firebase Client Configuration
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            || '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         || '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             || '',
  databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL       || '',
};

// Prevent re-initialization
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth      = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const rtdb      = getDatabase(firebaseApp);
export const storage   = getStorage(firebaseApp);
export default firebaseApp;
