/**
 * Seller application status: one normalised set of states for the splash router,
 * the (vendor) route guard and the status screen.
 *
 * The vendor backend currently sends `kycStatus` PENDING / APPROVED / REJECTED. The shop
 * and admin side (glowvai-38bde) use `applicationStatus` / `status` with PENDING_APPROVAL /
 * APPROVED / REJECTED / SUSPENDED. Both are read here so the app keeps working when the
 * data layer moves to the shared Firebase project.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vendorApi, ApiError } from '../../services/api';
import { clearSession, getSession } from '../../services/session';
import { getResumeStep } from './draft';

/** True when a fetch failed before reaching the server (offline, DNS, CORS, server down). */
export function isNetworkError(e: any): boolean {
  if (!e || e instanceof ApiError) return false;
  return e.name === 'TypeError' || /network|fetch|timed? ?out|load failed/i.test(String(e.message));
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'UNKNOWN';

const ALIASES: Record<string, ApplicationStatus> = {
  PENDING: 'SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  PENDING_APPROVAL: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  IN_REVIEW: 'UNDER_REVIEW',
  REVIEWING: 'UNDER_REVIEW',
  INFO_REQUIRED: 'INFO_REQUIRED',
  MORE_INFO_REQUIRED: 'INFO_REQUIRED',
  NEEDS_INFO: 'INFO_REQUIRED',
  RESUBMISSION_REQUIRED: 'INFO_REQUIRED',
  APPROVED: 'APPROVED',
  ACTIVE: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  BLOCKED: 'SUSPENDED',
};

/** Reads whichever status field the server sent. Unknown values stay UNKNOWN (never "approved"). */
export function normalizeStatus(vendor: any): ApplicationStatus {
  if (!vendor) return 'UNKNOWN';
  if (vendor.suspended === true || vendor.isSuspended === true) return 'SUSPENDED';
  const raw = String(vendor.applicationStatus || vendor.status || vendor.kycStatus || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return ALIASES[raw] ?? 'UNKNOWN';
}

/** A reason or note the reviewer left, from any of the fields the backends use. */
export function statusReason(vendor: any): string {
  const v = vendor || {};
  return String(v.kycRejectionReason || v.rejectionReason || v.suspensionReason || v.statusReason || v.reviewNote || '').trim();
}

/** Specific items the reviewer asked for, when the server lists them. */
export function requestedItems(vendor: any): string[] {
  const list = vendor?.requiredInfo || vendor?.infoRequested || vendor?.missingItems;
  return Array.isArray(list) ? list.map((x: any) => String(x?.label || x)).filter(Boolean) : [];
}

// ── Device cache ──────────────────────────────────────────────────────────────
// The last status the server confirmed is kept in 'vendor_kyc_status' (a session key, so it is
// cleared on sign-out), so the app can still route while offline. The onboarding step to resume
// lives separately in 'vendor_onboarding_status' (see draft.ts), so neither overwrites the other.
const STATUS_KEY = 'vendor_kyc_status';

export async function cacheStatus(status: ApplicationStatus): Promise<void> {
  if (status === 'UNKNOWN') return;
  try {
    await AsyncStorage.multiSet([
      [STATUS_KEY, status],
      ['vendor_registered', 'true'],
    ]);
  } catch (_) {}
}

export async function getCachedStatus(): Promise<ApplicationStatus | null> {
  try {
    const v = await AsyncStorage.getItem(STATUS_KEY);
    const status = v ? normalizeStatus({ kycStatus: v }) : 'UNKNOWN';
    return status === 'UNKNOWN' ? null : status;
  } catch (_) {
    return null;
  }
}

// ── Server check ──────────────────────────────────────────────────────────────
export type StatusCheck =
  | { kind: 'ok'; status: ApplicationStatus; vendor: any }
  | { kind: 'signed_out' }
  | { kind: 'not_found' }
  | { kind: 'offline' }
  | { kind: 'error' };

/**
 * Asks the backend for the signed-in vendor. A 401 clears the session (it is no longer
 * valid); a 404 does NOT sign the vendor out, the caller shows a clear message instead.
 */
export async function checkVendorStatus(): Promise<StatusCheck> {
  try {
    const res: any = await vendorApi.me();
    const vendor = res?.vendor ?? null;
    const status = normalizeStatus(vendor);
    await cacheStatus(status);
    return { kind: 'ok', status, vendor };
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401) {
      await clearSession();
      return { kind: 'signed_out' };
    }
    if (e instanceof ApiError && e.status === 404) return { kind: 'not_found' };
    if (isNetworkError(e)) return { kind: 'offline' };
    return { kind: 'error' };
  }
}

export const STATUS_ROUTE = '/(onboarding)/pending' as const;
export const HOME_ROUTE = '/(vendor)/home' as const;
export const LOGIN_ROUTE = '/(auth)/login' as const;

/** Where a status should land: approved stores open the dashboard, everything else the status screen. */
function routeForStatus(status: ApplicationStatus, resumeStep: string | null): string {
  if (status === 'APPROVED') return HOME_ROUTE;
  // A seller fixing a rejected or incomplete application goes back to the step they were editing.
  if ((status === 'REJECTED' || status === 'INFO_REQUIRED') && resumeStep) return `/(onboarding)/${resumeStep}`;
  return STATUS_ROUTE;
}

export type StartRoute = { route: string } | { offline: true };

/**
 * Decides the first screen: no session -> sign in; no application yet -> the onboarding
 * step to resume; otherwise the server's status decides (cached status when offline).
 */
export async function resolveStartRoute(): Promise<StartRoute> {
  const session = await getSession();
  if (!session.token) return { route: LOGIN_ROUTE };

  const resume = await getResumeStep();
  if (!session.vendorId) return { route: `/(onboarding)/${resume || 'step-a'}` };

  const check = await checkVendorStatus();
  switch (check.kind) {
    case 'ok':
      return { route: routeForStatus(check.status, resume) };
    case 'signed_out':
      return { route: LOGIN_ROUTE };
    case 'not_found':
      return { route: STATUS_ROUTE };
    default: {
      const cached = await getCachedStatus();
      if (cached) return { route: routeForStatus(cached, resume) };
      if (resume) return { route: `/(onboarding)/${resume}` };
      return { offline: true };
    }
  }
}
