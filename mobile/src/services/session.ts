/**
 * GlowVai Vendor App: the signed-in vendor's session.
 *
 * The session is the Firebase Auth state of project glowvai-38bde (email + password sign-in).
 * Firebase keeps the user signed in across restarts (AsyncStorage on phones, browser storage
 * on web) and refreshes the ID token itself; nothing here stores a token of its own.
 *
 * Vendor id everywhere: "VAPP-" + Firebase uid (docs/VENDOR_API.md, Identity).
 *
 * The older AsyncStorage token session is retired. These exports keep their names so existing
 * screens compile; their values now come from Firebase.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { clearVendorMe } from './vendorApi/account';
import { clearAllDrafts } from '../features/onboarding/draft';

/** Device keys from the retired token session and the status cache. Removed on sign-out. */
export const SESSION_KEYS = [
  'vendor_session_token',
  'vendor_id',
  'vendor_store_id',
  'vendor_kyc_status',
  'vendor_registered',
  'vendor_onboarding_status',
  'vendor_phone',
  'vendor_submitted_at',
] as const;

export interface VendorSession {
  /**
   * Signed-in marker: the Firebase uid, or null when nobody is signed in.
   * It is not a bearer token; API calls fetch the Firebase ID token themselves (vendorApi/http.ts).
   */
  token: string | null;
  /** "VAPP-{uid}", the vendor's id in the vendor API and the admin panel. */
  vendorId: string | null;
  /** Same value as vendorId (one store per vendor account). */
  storeId: string | null;
  /** Always null: the store state comes from GET /api/vendor/me (useVendorMe). */
  kycStatus: string | null;
}

export const vendorIdFor = (uid: string) => `VAPP-${uid}`;

const EMPTY: VendorSession = { token: null, vendorId: null, storeId: null, kycStatus: null };

function sessionFor(user: User | null): VendorSession {
  if (!user) return EMPTY;
  const id = vendorIdFor(user.uid);
  return { token: user.uid, vendorId: id, storeId: id, kycStatus: null };
}

/** Firebase Auth, or null when this build has no Firebase settings (the config gate reports that). */
function authOrNull() {
  try {
    return getFirebaseAuth();
  } catch {
    return null;
  }
}

/** Resolves once Firebase has restored any saved sign-in, with the signed-in user (or null). */
export async function authReady(): Promise<User | null> {
  const auth = authOrNull();
  if (!auth) return null;
  try {
    await auth.authStateReady();
  } catch {
    // Older SDKs: fall back to the first auth state event.
    await new Promise<void>(resolve => {
      const stop = onAuthStateChanged(auth, () => {
        stop();
        resolve();
      });
    });
  }
  return auth.currentUser;
}

/** The current Firebase user without waiting (null before restore finishes). */
export function currentUser(): User | null {
  return authOrNull()?.currentUser ?? null;
}

export async function getSession(): Promise<VendorSession> {
  return sessionFor(await authReady());
}

/** A Firebase ID token for the legacy API client. Prefer vendorFetch, which handles this itself. */
export async function getSessionToken(): Promise<string | null> {
  const user = await authReady();
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Signs the vendor out of this device: Firebase sign-out, the shared /me copy, the onboarding
 * drafts (they hold store, PAN and bank details) and the retired session keys.
 */
export async function signOutVendor(): Promise<void> {
  clearVendorMe();
  await clearAllDrafts();
  try {
    await AsyncStorage.multiRemove([...SESSION_KEYS]);
  } catch {}
  const auth = authOrNull();
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch {}
  }
}

/** Kept for existing callers: same as signOutVendor. */
export const clearSession = signOutVendor;

let watching = false;
let lastUid: string | null | undefined;

/**
 * Starts the one app-wide auth listener (root layout). When the signed-in account changes or
 * signs out, the shared /me copy is dropped so one vendor never sees another vendor's store.
 */
export function startAuthSession(): void {
  if (watching) return;
  const auth = authOrNull();
  if (!auth) return;
  watching = true;
  onAuthStateChanged(auth, user => {
    const uid = user?.uid ?? null;
    if (lastUid !== undefined && lastUid !== uid) clearVendorMe();
    lastUid = uid;
  });
}

/** The signed-in Firebase user, live. `ready` is false until Firebase has restored the session. */
export function useAuthUser(): { user: User | null; ready: boolean } {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>(() => {
    const user = currentUser();
    return { user, ready: !!user };
  });
  useEffect(() => {
    const auth = authOrNull();
    if (!auth) {
      setState({ user: null, ready: true });
      return;
    }
    return onAuthStateChanged(auth, user => setState({ user, ready: true }));
  }, []);
  return state;
}

/**
 * The signed-in vendor's ids. Ids are null until Firebase has restored the session (`loaded`)
 * and stay null when nobody is signed in; there is no fallback vendor id.
 */
export function useVendorSession(): VendorSession & { loaded: boolean } {
  const { user, ready } = useAuthUser();
  return { ...sessionFor(user), loaded: ready };
}
