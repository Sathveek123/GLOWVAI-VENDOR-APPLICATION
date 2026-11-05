/**
 * "View shop" link: opens the GlowVai customer storefront so the seller can see their
 * products as customers do. Hidden until EXPO_PUBLIC_CUSTOMER_APP_URL is configured, so it
 * never points at a developer's machine.
 */
import React from 'react';
import { Pressable, Text, StyleSheet, Linking, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ENV } from '../config/env';
import { Colors, BorderRadii, Spacing } from '../theme/tokens';
import { FontFamily } from '../theme/typography';

interface CustomerAppRedirectButtonProps {
  customUrl?: string;
  /** Used only for the accessibility label. */
  storeName?: string;
}

export const CustomerAppRedirectButton: React.FC<CustomerAppRedirectButtonProps> = ({ customUrl = ENV.customerAppUrl, storeName }) => {
  const [failed, setFailed] = React.useState(false);
  if (!customUrl) return null;

  const open = async () => {
    setFailed(false);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(customUrl, '_blank', 'noopener');
      else await Linking.openURL(customUrl);
    } catch (_) {
      setFailed(true);
    }
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={storeName ? `View ${storeName} on the GlowVai shop` : 'View the GlowVai shop'}
      accessibilityHint={failed ? 'The shop could not be opened. Try again.' : 'Opens in a new window'}
      style={({ pressed }) => [s.button, pressed && { backgroundColor: Colors.primaryLight }]}
    >
      <Ionicons name={failed ? 'alert-circle-outline' : 'open-outline'} size={16} color={failed ? Colors.dangerText : Colors.primary} />
      <Text style={[s.label, failed && { color: Colors.dangerText }]}>{failed ? 'Try again' : 'View shop'}</Text>
    </Pressable>
  );
};

const s = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.card,
  },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
});

export default CustomerAppRedirectButton;
