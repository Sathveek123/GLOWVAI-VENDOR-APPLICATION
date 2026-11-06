/**
 * The signed-in vendor's account and store state, from GET /api/vendor/me, plus the calls that change it.
 * Contract: docs/VENDOR_API.md (VendorMe).
 */
import { useCallback, useEffect, useState } from 'react';
import { vendorFetch, VendorApiError, friendlyError } from './http';

export type VendorState =
  | 'NO_APPLICATION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'REJECTED'
  | 'APPROVED_ACTIVE'
  | 'APPROVED_PAUSED'
  | 'SUSPENDED';

export interface OperatingHours {
  openTime: string;
  closeTime: string;
  isOpenToday: boolean;
}

export interface VendorApplicationView {
  storeName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
  servicePincodes: string[];
  operatingHours: OperatingHours;
  categories: string[];
  panLast4?: string;
  bank?: { holderName: string; bankName: string; ifscMasked: string; accLast4: string; upiVpa?: string };
  submittedAt: number;
  updatedAt: number;
}

export interface VendorMe {
  applicationId: string;
  state: VendorState;
  canOperate: boolean;
  isOnline: boolean;
  lastSeenAt: number | null;
  reason?: string;
  requestedDocuments?: string[];
  application: VendorApplicationView | null;
}

export interface MeResponse {
  account: { uid: string; email: string; emailVerified: boolean };
  vendor: VendorMe;
}

/** What onboarding sends. The server validates every field again. */
export interface ApplicationInput {
  storeName: string;
  ownerName: string;
  contactNumber: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: { latitude: number; longitude: number };
  servicePincodes: string[];
  operatingHours: OperatingHours;
  categories: string[];
  /** Full PAN for format checking; the server stores only the last 4 characters. */
  pan?: string;
  /** The full account number is never sent; only its last 4 digits. */
  bank?: { holderName: string; bankName: string; ifsc: string; accLast4: string; upiVpa?: string };
}

export const accountApi = {
  me: () => vendorFetch<{ ok: true } & MeResponse>('/api/vendor/me'),
  submitApplication: (input: ApplicationInput) =>
    vendorFetch<{ ok: true; vendor: VendorMe }>('/api/vendor/application', { method: 'POST', body: input }),
  setOnline: (isOnline: boolean) =>
    vendorFetch<{ ok: true; isOnline: boolean; lastSeenAt: number }>('/api/vendor/status', { method: 'POST', body: { isOnline } }),
};

// One shared copy of /me for every screen, so opening screens does not cost extra server calls.
let cached: MeResponse | null = null;
let cachedAt = 0;
let inflight: Promise<MeResponse> | null = null;
const listeners = new Set<(me: MeResponse | null) => void>();
const FRESH_MS = 30_000;

function publish(me: MeResponse | null) {
  cached = me;
  cachedAt = me ? Date.now() : 0;
  listeners.forEach(l => l(me));
}

/** Loads /me, reusing a copy younger than 30 seconds unless `force` is set. */
export async function loadVendorMe(force = false): Promise<MeResponse> {
  if (!force && cached && Date.now() - cachedAt < FRESH_MS) return cached;
  if (!inflight) {
    inflight = accountApi
      .me()
      .then(({ account, vendor }) => {
        const me = { account, vendor };
        publish(me);
        return me;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Updates the shared copy after a call that returned a fresh VendorMe (application submit, online toggle). */
export function updateVendorMe(patch: Partial<VendorMe>) {
  if (cached) publish({ ...cached, vendor: { ...cached.vendor, ...patch } });
}

/** Forgets the shared copy (sign-out). */
export function clearVendorMe() {
  publish(null);
}

/** The signed-in vendor's state for a screen. `error` is friendly copy; call `refresh` to retry. */
export function useVendorMe(): {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => Promise<void>;
} {
  const [me, setMe] = useState<MeResponse | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const run = useCallback(async (force: boolean) => {
    setLoading(true);
    try {
      await loadVendorMe(force);
      setError(null);
      setErrorCode(null);
    } catch (e) {
      setError(friendlyError(e));
      setErrorCode(e instanceof VendorApiError ? e.code : 'NETWORK');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listeners.add(setMe);
    run(false);
    return () => {
      listeners.delete(setMe);
    };
  }, [run]);

  return { me, loading, error, errorCode, refresh: () => run(true) };
}
