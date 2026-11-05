/** Copies text to the clipboard. Resolves true when it worked. */
import { Platform } from 'react-native';

export async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return true;
      }
      return false;
    }
    // The core module is deprecated but still ships with React Native 0.74.
    // Swap for expo-clipboard when it is added to the project.
    const { Clipboard } = require('react-native');
    Clipboard.setString(text);
    return true;
  } catch (_) {
    return false;
  }
}
