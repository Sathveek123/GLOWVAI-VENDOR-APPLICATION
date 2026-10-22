/**
 * Production placeholder for screens that are not connected to live store data yet.
 * In development builds the full screen renders, so the design can still be reviewed.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenShell from './ScreenShell';
import { Colors, BorderRadii, Spacing } from '../theme/tokens';
import { TypeScale } from '../theme/typography';

export function ComingSoonView({ title }: { title: string }) {
  return (
    <ScreenShell header={{ title, showBack: true }} scroll={false} backgroundColor={Colors.surface}>
      <View style={s.wrap}>
        <View style={s.card}>
          <View style={s.iconBox}>
            <Ionicons name="construct-outline" size={26} color={Colors.primary} />
          </View>
          <Text style={s.heading}>Coming soon</Text>
          <Text style={s.body}>
            This section is being connected to live store data. Nothing is shown here yet, so sample figures are never mistaken for real ones.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

export function withComingSoon<P extends object>(Screen: React.ComponentType<P>, title: string) {
  return function ComingSoonGate(props: P) {
    if (__DEV__) return <Screen {...props} />;
    return <ComingSoonView title={title} />;
  };
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heading: { ...TypeScale.headline, color: Colors.textPrimary, marginBottom: Spacing.xs },
  body: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center' },
});
