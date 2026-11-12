/**
 * Pure rules for vendor API failures: the copy shown for each server error code, and how a route that is not live
 * yet is reported. No native imports, so the unit tests run in Node. http.ts uses these.
 *
 * A route that is not live shows as "This is not available yet". That covers a 503 with code NOT_AVAILABLE (the
 * server's own gated message is used when it sends one) and a 404 with no JSON body (a route that is not deployed).
 * The app never invents data for these.
 */

export const NOT_AVAILABLE_CODE = 'NOT_AVAILABLE';
export const NOT_AVAILABLE_COPY = 'This is not available yet.';

/** Friendly copy for each server error code. The server's own sentence is used when a code is not listed. */
export const FAILURE_COPY: Record<string, string> = {
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

export interface DescribedFailure {
  /** Copy that is safe to show the vendor as is. */
  message: string;
  /** The error code: the server's code, RATE_LIMITED, NOT_AVAILABLE, or HTTP_<status> when the server sent none. */
  code: string;
  /** Extra fields the server sent with the error (for example `missing` items on OUT_OF_STOCK). */
  details: Record<string, unknown>;
}

/** True when the route is not live: a 503 NOT_AVAILABLE, or a 404 that carries no server code (route not deployed). */
export function isNotAvailableFailure(status: number, code: string): boolean {
  return (status === 503 && code === NOT_AVAILABLE_CODE) || (status === 404 && code === 'HTTP_404');
}

/** Turns a failed response (status and parsed JSON body, or null when the body is not JSON) into what the screen shows. */
export function describeFailure(status: number, data: Record<string, unknown> | null): DescribedFailure {
  const code = typeof data?.code === 'string' ? data.code : status === 429 ? 'RATE_LIMITED' : `HTTP_${status}`;
  const serverCopy = typeof data?.error === 'string' ? data.error : '';
  const { ok: _ok, error: _error, code: _code, ...details } = data ?? {};
  if (isNotAvailableFailure(status, code)) {
    return { message: serverCopy || NOT_AVAILABLE_COPY, code: NOT_AVAILABLE_CODE, details };
  }
  return {
    message: FAILURE_COPY[code] ?? (serverCopy || 'Something went wrong. Please try again.'),
    code,
    details,
  };
}
