/**
 * Where a vendor belongs, decided from Firebase Auth and GET /api/vendor/me.
 *
 *   not signed in                          -> sign in
 *   signed in, email not verified          -> verify email
 *   NO_APPLICATION                         -> onboarding (the saved step, else step A)
 *   SUBMITTED / UNDER_REVIEW /
 *   DOCUMENTS_REQUESTED / REJECTED         -> application status
 *   APPROVED_ACTIVE / APPROVED_PAUSED      -> vendor home
 *   SUSPENDED                              -> application status (suspended view)
 *
 * Used by the splash router (app/index.tsx), the onboarding guard and, through the older
 * checkVendorStatus/getCachedStatus exports, the (vendor) layout.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadVendorMe, type VendorState } from '../../services/vendorApi/account';
import { VendorApiError, friendlyError } from '../../services/vendorApi/http';
import { authReady, currentUser, signOutVendor } from '../../services/session';
import { claimDrafts, getResumeStep, type StepRoute } from './draft';

export const LOGIN_ROUTE = '/(auth)/login' as const;
export const VERIFY_ROUTE = '/(auth)/verify-email' as const;
export const STATUS_ROUTE = '/(onboarding)/pending' as const;
export const HOME_ROUTE = '/(vendor)/home' as const;

export const isApproved = (s: VendorState) => s === 'APPROVED_ACTIVE' || s === 'APPROVED_PAUSED';
/** States in which the server accepts a (re)submitted application. */
export const canEditApplication = (s: VendorState) =>
  s === 'NO_APPLICATION' || s === 'SUBMITTED' || s === 'DOCUMENTS_REQUESTED' || s === 'REJECTED';

export function routeForState(state: VendorState, resume?: StepRoute | null): string {
  if (state === 'NO_APPLICATION') return `/(onboarding)/${resume || 'step-a'}`;
  if (isApproved(state)) return HOME_ROUTE;
  return STATUS_ROUTE;
}

/** True when a call failed before reaching the server (offline, DNS, server down). */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof VendorApiError) return e.code === 'NETWORK';
  const err = e as { name?: string; message?: string } | null;
  return !!err && (err.name === 'TypeError' || /network|fetch|timed? ?out|load failed/i.test(String(err.message)));
}

export type StartRoute = { route: string } | { error: string; code: string };

/**
 * Decides the first screen. Never throws: a failure comes back as friendly copy and a code
 * so the caller can show it with a Retry.
 */
export async function resolveStartRoute(force = false): Promise<StartRoute> {
  const user = await authReady();
  if (!user) return { route: LOGIN_ROUTE };
  await claimDrafts(user.uid);
  if (!user.emailVerified) return { route: VERIFY_ROUTE };
  try {
    const { vendor } = await loadVendorMe(force);
    await cacheStatus(toApplicationStatus(vendor.state));
    const resume = vendor.state === 'NO_APPLICATION' ? await getResumeStep() : null;
    return { route: routeForState(vendor.state, resume) };
  } catch (e) {
    const code = e instanceof VendorApiError ? e.code : 'NETWORK';
    if (code === 'UNAUTHENTICATED') {
      await signOutVendor();
      return { route: LOGIN_ROUTE };
    }
    return { error: friendlyError(e), code };
  }
}

// ── Older interface, still used by app/(vendor)/_layout.tsx ───────────────────
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'UNKNOWN';

export function toApplicationStatus(state: VendorState): ApplicationStatus {
  switch (state) {
    case 'APPROVED_ACTIVE':
    case 'APPROVED_PAUSED':
      return 'APPROVED';
    case 'DOCUMENTS_REQUESTED':
      return 'INFO_REQUIRED';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'REJECTED':
    case 'SUSPENDED':
      return state;
    default:
      return 'UNKNOWN';
  }
}

// The last status the server confirmed, per account, so the (vendor) layout can open
// quickly and route sensibly while offline. Removed on sign-out (session.ts SESSION_KEYS).
const STATUS_KEY = 'vendor_kyc_status';

export async function cacheStatus(status: ApplicationStatus): Promise<void> {
  const uid = currentUser()?.uid;
  if (!uid) return;
  try {
    if (status === 'UNKNOWN') await AsyncStorage.removeItem(STATUS_KEY);
    else await AsyncStorage.setItem(STATUS_KEY, JSON.stringify({ uid, status }));
  } catch {}
}

export async function getCachedStatus(): Promise<ApplicationStatus | null> {
  try {
    const user = await authReady();
    const raw = await AsyncStorage.getItem(STATUS_KEY);
    if (!user || !raw) return null;
    const parsed = JSON.parse(raw) as { uid?: string; status?: ApplicationStatus };
    return parsed.uid === user.uid && parsed.status ? parsed.status : null;
  } catch {
    return null;
  }
}

export type StatusCheck =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose on purpose for older callers
  | { kind: 'ok'; status: ApplicationStatus; vendor: any }
  | { kind: 'signed_out' }
  | { kind: 'not_found' }
  | { kind: 'offline' }
  | { kind: 'error' };

/**
 * GET /api/vendor/me for the (vendor) layout. `vendor` merges the application fields
 * (storeName, ownerName, contactNumber, city, ...) onto VendorMe. NO_APPLICATION is `not_found`.
 */
export async function checkVendorStatus(): Promise<StatusCheck> {
  const user = await authReady();
  if (!user) return { kind: 'signed_out' };
  try {
    const { vendor } = await loadVendorMe();
    const status = toApplicationStatus(vendor.state);
    await cacheStatus(status);
    if (vendor.state === 'NO_APPLICATION') return { kind: 'not_found' };
    return { kind: 'ok', status, vendor: { ...(vendor.application ?? {}), ...vendor } };
  } catch (e) {
    if (e instanceof VendorApiError && e.code === 'UNAUTHENTICATED') return { kind: 'signed_out' };
    return isNetworkError(e) ? { kind: 'offline' } : { kind: 'error' };
  }
}
