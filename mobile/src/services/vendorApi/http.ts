/**
 * GlowVai Vendor App: the one HTTP client for the GlowVai vendor API (https://glowvai.in/api/vendor/*).
 *
 * Every call sends the signed-in vendor's Firebase ID token. The server checks who the vendor is,
 * applies rate limits and writes Firestore (glowvai-38bde) itself; the app never writes the database.
 * Contract: docs/VENDOR_API.md.
 */
import { getFirebaseAuth } from '../../config/firebase';
import { ENV } from '../../config/env';

/** A failed call, with copy that is safe to show the vendor as is. */
export class VendorApiError extends Error {
  status: number;
  code: string;
  /** Extra fields the server sent with the error (for example `missing` items on OUT_OF_STOCK). */
  details: Record<string, unknown>;
  constructor(message: string, status: number, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const NETWORK_ERROR_COPY = "Can't reach GlowVai. Check your internet and try again.";

/** Friendly copy for each server error code. The server's own sentence is used when a code is not listed. */
const COPY: Record<string, string> = {
  UNAUTHENTICATED: 'Your session has ended. Please sign in again.',
  NOT_A_VENDOR_ACCOUNT: 'This account is not a GlowVai store account. Sign in with your store email.',
  EMAIL_NOT_VERIFIED: 'Verify your email address first. We sent you a link.',
  NOT_APPROVED: 'Your store is not approved yet, so this is not available.',
  APPLICATION_LOCKED: 'Your application is being reviewed, so it cannot be changed right now.',
  ORDER_ALREADY_ASSIGNED: 'Another store accepted this order first.',
  ORDER_CANCELLED: 'This order was cancelled.',
  OUT_OF_STOCK: 'You do not have enough stock for every item in this order.',
  NOT_ELIGIBLE: 'This order is no longer available to your store.',
  NOT_FOUND: 'We could not find that.',
  RATE_LIMITED: 'Too many requests. Please wait a minute and try again.',
};

export function friendlyError(err: unknown): string {
  if (err instanceof VendorApiError) return err.message;
  return NETWORK_ERROR_COPY;
}

const baseUrl = (): string => ENV.apiUrl.replace(/\/+$/, '');

/** The current Firebase ID token, or null when nobody is signed in. */
async function idToken(forceRefresh = false): Promise<string | null> {
  try {
    const user = getFirebaseAuth().currentUser;
    return user ? await user.getIdToken(forceRefresh) : null;
  } catch {
    return null;
  }
}

/**
 * Calls the vendor API and returns the parsed `{ ok: true, ... }` body.
 * Throws VendorApiError for every failure; network failures use NETWORK_ERROR_COPY.
 * A 401 is retried once with a fresh token (tokens expire after an hour).
 */
export async function vendorFetch<T>(path: string, init: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const token = await idToken(retried);
  if (!token) throw new VendorApiError(COPY.UNAUTHENTICATED, 401, 'UNAUTHENTICATED');
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new VendorApiError(NETWORK_ERROR_COPY, 0, 'NETWORK');
  }
  let data: Record<string, unknown> | null = null;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }
  if (res.status === 401 && !retried) return vendorFetch<T>(path, init, true);
  if (!res.ok || !data || data.ok !== true) {
    const code = typeof data?.code === 'string' ? data.code : res.status === 429 ? 'RATE_LIMITED' : `HTTP_${res.status}`;
    const serverCopy = typeof data?.error === 'string' ? data.error : '';
    const message = COPY[code] ?? (serverCopy || 'Something went wrong. Please try again.');
    const { ok: _ok, error: _error, code: _code, ...details } = data ?? {};
    throw new VendorApiError(message, res.status, code, details);
  }
  return data as T;
}
