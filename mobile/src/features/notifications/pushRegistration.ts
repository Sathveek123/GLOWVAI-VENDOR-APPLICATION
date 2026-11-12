/**
 * Turns on order-update push notifications for the vendor. Called only from the "Turn on order updates" button, never
 * on load. Steps: check the EAS project id, set up the Android channel, ask for permission, get the Expo push token and
 * send it to the server (POST /api/vendor/push-token with the vendor's Firebase ID token, as tokenType EXPO).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { VendorApiError } from '../../services/vendorApi/http';
import { registerVendorPushToken } from '../../services/vendorApi/push';
import {
  easProjectIdFrom,
  isExpoPushToken,
  ORDER_UPDATES_CHANNEL,
  tokenRegistrationBody,
  type EnableOutcome,
} from './pushRules';

// Foreground pushes show as a banner. Set once when this module loads, before any notification can arrive.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export function resolveEasProjectId(): string | null {
  return easProjectIdFrom(Constants.expoConfig) ?? easProjectIdFrom(Constants.easConfig);
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ORDER_UPDATES_CHANNEL.id, {
    name: ORDER_UPDATES_CHANNEL.name,
    description: ORDER_UPDATES_CHANNEL.description,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: ORDER_UPDATES_CHANNEL.lightColor,
  });
}

export async function enableOrderUpdates(): Promise<EnableOutcome> {
  if (Platform.OS === 'web') return { kind: 'unsupported' };
  const projectId = resolveEasProjectId();
  if (!projectId) return { kind: 'not-set-up' };
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return { kind: 'denied' };

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!isExpoPushToken(token)) return { kind: 'failed', message: 'This device did not give a push token.' };

    await registerVendorPushToken(tokenRegistrationBody(token));
    return { kind: 'registered' };
  } catch (err) {
    // Simulators and some devices cannot get a push token. Server refusals carry the server's own wording.
    const message = err instanceof VendorApiError ? err.message : 'We could not turn on order updates. Please try again.';
    return { kind: 'failed', message };
  }
}
