/**
 * GlowVai Vendor App: Firebase client for the shared project glowvai-38bde.
 *
 * Values come only from EXPO_PUBLIC_FIREBASE_* (see mobile/.env.example and src/config/env.ts).
 * There are no hardcoded fallbacks: if the config is missing or names another project,
 * the first call below throws a clear error instead of silently talking to the wrong database.
 *
 * Everything is created lazily, so importing this file has no side effects.
 * Realtime Database is not used; the shared platform is on Cloud Firestore.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { ENV, firebaseConfigIssues } from './env';

let appInstance: FirebaseApp | null = null;
let authInstance: FirebaseAuth.Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const issues = firebaseConfigIssues();
  if (issues.length) {
    throw new Error(
      'Firebase is not configured: ' + issues.map(i => `${i.key} ${i.message}`).join(' '),
    );
  }
  appInstance = getApps().length ? getApp() : initializeApp({ ...ENV.firebase });
  return appInstance;
}

/**
 * Firebase Auth. On Android/iOS the session is persisted in AsyncStorage
 * (getReactNativePersistence exists only in the React Native build of firebase/auth,
 * so it is looked up at runtime); on web the SDK's default browser persistence is used.
 */
export function getFirebaseAuth(): FirebaseAuth.Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    authInstance = FirebaseAuth.getAuth(app);
    return authInstance;
  }
  const getReactNativePersistence = (FirebaseAuth as unknown as {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
  }).getReactNativePersistence;
  try {
    authInstance = getReactNativePersistence
      ? FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
      : FirebaseAuth.getAuth(app);
  } catch {
    // initializeAuth throws if Auth already exists (for example after a fast refresh).
    authInstance = FirebaseAuth.getAuth(app);
  }
  return authInstance;
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
