/**
 * Placeholder for features planned for a later phase (PRD 13.3). Says so plainly and
 * points back to what the vendor can do today. No sample figures.
 * File: mobile/src/features/catalog/ComingLater.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../components/ScreenShell';
import { Colors, Spacing as S } from '../../theme/tokens';
import { TypeScale } from '../../theme/typography';
import { Button, useDocumentTitle } from '../onboarding/kit';
import { cardStyle } from './ui';

export default function ComingLater({ title, message }: { title: string; message: string }) {
  const router = useRouter();
  useDocumentTitle(title);
  return (
    <ScreenShell header={{ title, showBack: true }} scroll={false} backgroundColor={Colors.surface}>
      <View style={s.wrap}>
        <View style={[cardStyle, s.card]}>
          <View style={s.icon}>
            <Ionicons name="time-outline" size={26} color={Colors.primary} />
          </View>
          <Text accessibilityRole="header" style={s.heading}>Coming later</Text>
          <Text style={s.body}>{message}</Text>
          <Button label="Go to Inventory" variant="secondary" compact onPress={() => router.replace('/(vendor)/catalog')} style={s.btn} />
        </View>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: S.lg, justifyContent: 'center', alignItems: 'center' },
  card: { padding: S.xl, alignItems: 'center', width: '100%', maxWidth: 480 },
  icon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  heading: { ...TypeScale.title, color: Colors.textPrimary, marginBottom: S.xs },
  body: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center' },
  btn: { marginTop: S.lg, minWidth: 180 },
});
