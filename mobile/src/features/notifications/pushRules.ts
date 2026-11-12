/**
 * Pure rules for order-update push notifications: what the app asks the device for, what it sends to the shop, and
 * when push is simply not set up. No native imports, so the unit tests run in Node. The device work is in
 * pushRegistration.ts.
 */

/** Shown above the permission button. iOS shows its own system prompt after the user taps the button. */
export const PUSH_PERMISSION_COPY = 'GlowVai sends order updates and delivery alerts. You can change this anytime in Settings.';

export const NOT_SET_UP_MESSAGE = 'Notifications are not set up yet';

/** Android channel for order updates. Importance 4 is "high" (heads-up), the value expo-notifications uses for HIGH. */
export const ORDER_UPDATES_CHANNEL = {
  id: 'order-updates',
  name: 'Order updates',
  description: 'Order status, delivery alerts and refunds',
  importance: 4,
  lightColor: '#0057FB',
} as const;

/** The token kinds the shop server accepts on POST /api/shop/notifications/token. */
export type PushTokenType = 'EXPO' | 'FCM';

export interface PushTokenRegistrationBody {
  token: string;
  tokenType: PushTokenType;
}

/** The body for the token route. The app only ever registers Expo push tokens. */
export function tokenRegistrationBody(token: string): PushTokenRegistrationBody {
  return { token, tokenType: 'EXPO' };
}

/** Expo push tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] (or ExpoPushToken[...] on newer SDKs). */
export function isExpoPushToken(value: unknown): value is string {
  return typeof value === 'string' && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,200}\]$/.test(value);
}

/** Reads the EAS project id from the app config (expo.extra.eas.projectId). Blank or missing means not set up. */
export function easProjectIdFrom(config: unknown): string | null {
  const id = (config as { extra?: { eas?: { projectId?: unknown } } } | null)?.extra?.eas?.projectId;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

export type EnableOutcome =
  | { kind: 'not-set-up' }
  | { kind: 'unsupported' }
  | { kind: 'denied' }
  | { kind: 'failed'; message: string }
  | { kind: 'registered' };

export const ENABLE_MESSAGES = {
  'not-set-up': NOT_SET_UP_MESSAGE,
  unsupported: 'Order updates are available in the GlowVai app on your phone.',
  denied: 'Notifications are off for GlowVai. You can turn them on in your phone settings.',
  failed: 'We could not turn on order updates. Please try again.',
} as const;

/** The line shown under the button after a tap. */
export function enableMessage(outcome: EnableOutcome): string {
  if (outcome.kind === 'registered') return 'Order updates are on for this device.';
  if (outcome.kind === 'failed') return outcome.message;
  return ENABLE_MESSAGES[outcome.kind];
}
