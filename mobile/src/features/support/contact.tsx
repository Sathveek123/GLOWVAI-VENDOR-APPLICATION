/**
 * How a vendor reaches GlowVai support today.
 *
 * The official phone number and email come from build config
 * (EXPO_PUBLIC_SUPPORT_PHONE, EXPO_PUBLIC_SUPPORT_EMAIL). Nothing is invented here:
 * without config the copy points to the contact GlowVai shared during onboarding.
 */
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../money/ui';
import { Colors, Spacing } from '../../theme/tokens';
import { TypeScale } from '../../theme/typography';

export const SUPPORT_PHONE = (process.env.EXPO_PUBLIC_SUPPORT_PHONE || '').trim();
export const SUPPORT_EMAIL = (process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '').trim();
export const HAS_SUPPORT_CONTACT = !!(SUPPORT_PHONE || SUPPORT_EMAIL);

/** Call or email buttons when configured; otherwise one plain sentence. */
export function SupportContactActions({ subject }: { subject?: string }) {
  if (!HAS_SUPPORT_CONTACT) {
    return (
      <Text style={s.fallback}>
        Use the GlowVai support contact shared with you when your store was set up.
      </Text>
    );
  }
  const mail = () => {
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    Linking.openURL(`mailto:${SUPPORT_EMAIL}${q}`).catch(() => undefined);
  };
  const call = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`).catch(() => undefined);
  };
  return (
    <View style={s.row}>
      {SUPPORT_PHONE ? <Button label="Call support" icon="call-outline" variant="secondary" onPress={call} style={s.btn} /> : null}
      {SUPPORT_EMAIL ? <Button label="Email support" icon="mail-outline" variant="secondary" onPress={mail} style={s.btn} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xs },
  btn: { minWidth: 150 },
  fallback: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center' },
});
