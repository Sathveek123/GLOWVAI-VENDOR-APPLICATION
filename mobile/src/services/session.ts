/**
 * GlowVAI Vendor App — Session storage helpers
 * Single place that reads and clears the vendor session keys.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_KEYS = [
  'vendor_session_token',
  'vendor_id',
  'vendor_registered',
  'vendor_onboarding_status',
  'vendor_phone',
] as const;

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...SESSION_KEYS]);
  } catch (_) {}
}
