/**
 * Push token registration for the vendor app: POST /api/vendor/push-token with the vendor's Firebase ID token.
 * The body is always { token, tokenType: 'EXPO' } (see tokenRegistrationBody in features/notifications/pushRules.ts).
 */
import { vendorFetch } from './http';

export interface PushTokenResult {
  ok: true;
  maxDevices?: number;
}

export function registerVendorPushToken(body: { token: string; tokenType: 'EXPO' | 'FCM' }): Promise<PushTokenResult> {
  return vendorFetch<PushTokenResult>('/api/vendor/push-token', { method: 'POST', body });
}
