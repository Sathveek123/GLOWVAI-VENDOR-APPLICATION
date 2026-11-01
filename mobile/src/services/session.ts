/**
 * GlowVAI Vendor App — Session storage helpers
 * Single place that reads, writes and clears the vendor session keys.
 *
 * The backend issues a signed session token after OTP sign-in and after onboarding.
 * The token carries the vendorId/storeId; the backend never trusts ids sent in a body.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_KEYS = [
  'vendor_session_token',
  'vendor_id',
  'vendor_store_id',
  'vendor_kyc_status',
  'vendor_registered',
  'vendor_onboarding_status',
  'vendor_phone',
] as const;

export interface VendorSession {
  token: string | null;
  vendorId: string | null;
  storeId: string | null;
  kycStatus: string | null;
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...SESSION_KEYS]);
  } catch (_) {}
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('vendor_session_token');
  } catch (_) {
    return null;
  }
}

export async function getSession(): Promise<VendorSession> {
  try {
    const [token, vendorId, storeId, kycStatus] = await Promise.all([
      AsyncStorage.getItem('vendor_session_token'),
      AsyncStorage.getItem('vendor_id'),
      AsyncStorage.getItem('vendor_store_id'),
      AsyncStorage.getItem('vendor_kyc_status'),
    ]);
    return { token, vendorId, storeId, kycStatus };
  } catch (_) {
    return { token: null, vendorId: null, storeId: null, kycStatus: null };
  }
}

/** Stores what the backend returned from sign-in or onboarding. */
export async function saveSession(s: {
  token: string;
  vendorId?: string | null;
  storeId?: string | null;
  kycStatus?: string | null;
}): Promise<void> {
  const pairs: [string, string][] = [['vendor_session_token', s.token]];
  const removals: string[] = [];
  const put = (key: string, value?: string | null) => {
    if (value) pairs.push([key, value]);
    else removals.push(key);
  };
  put('vendor_id', s.vendorId);
  put('vendor_store_id', s.storeId);
  put('vendor_kyc_status', s.kycStatus);
  await AsyncStorage.multiSet(pairs);
  if (removals.length) await AsyncStorage.multiRemove(removals);
}

/**
 * The signed-in vendor's ids, read from storage. Falls back to the EXPO_PUBLIC_* values
 * (development only) until the session has loaded.
 */
export function useVendorSession(): VendorSession & { loaded: boolean } {
  const [state, setState] = useState<VendorSession & { loaded: boolean }>({
    token: null,
    vendorId: process.env.EXPO_PUBLIC_VENDOR_ID || null,
    storeId: process.env.EXPO_PUBLIC_STORE_ID || null,
    kycStatus: null,
    loaded: false,
  });
  useEffect(() => {
    let active = true;
    getSession().then(s => {
      if (!active) return;
      setState(prev => ({
        token: s.token,
        vendorId: s.vendorId || prev.vendorId,
        storeId: s.storeId || prev.storeId,
        kycStatus: s.kycStatus,
        loaded: true,
      }));
    });
    return () => { active = false; };
  }, []);
  return state;
}
