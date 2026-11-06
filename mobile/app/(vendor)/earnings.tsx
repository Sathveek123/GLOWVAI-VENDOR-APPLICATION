/**
 * Earnings (PRD screen 21). The app does not know GlowVai's fees for a store, so it shows no
 * earnings figure, commission or payout cycle. Earnings appear here after GlowVai sets up
 * settlements for the store. The order value the store handled is on Home and in Store activity.
 * File: mobile/app/(vendor)/earnings.tsx
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, LinkRow, Note, SectionLabel, StateCard, page } from '../../src/features/money/ui';
import { Colors, Spacing } from '../../src/theme/tokens';

export default function EarningsScreen() {
  const router = useRouter();
  return (
    <View style={s.screen}>
      <ScreenShell header={{ title: 'Earnings' }} backgroundColor={Colors.surface} contentContainerStyle={s.content}>
        <View style={page.body}>
          <StateCard
            icon="wallet-outline"
            title="Earnings appear after GlowVai sets up settlements"
            body="GlowVai sets up settlements for each store. Once yours is set up, what you will receive for your orders, and each transfer to your bank, will show here. No amounts are shown before then, so you never see a guess."
          />

          <SectionLabel>Your orders</SectionLabel>
          <Card padded={false}>
            <LinkRow
              icon="stats-chart-outline"
              label="Store activity"
              detail="Orders per day and the value of items you handled"
              onPress={() => router.push('/(vendor)/analytics')}
              last
            />
          </Card>

          <SectionLabel>Payouts</SectionLabel>
          <Card padded={false}>
            <LinkRow icon="swap-horizontal-outline" label="Settlements" detail="Bank transfers from GlowVai" onPress={() => router.push('/(vendor)/payout-detail')} />
            <LinkRow icon="card-outline" label="Bank account" detail="Where your payouts are sent" onPress={() => router.push('/(vendor)/bank-edit')} />
            <LinkRow icon="document-text-outline" label="Tax documents" detail="Statements from GlowVai" onPress={() => router.push('/(vendor)/tax-documents')} last />
          </Card>

          <Note>Fees and deductions follow your agreement with GlowVai. For a payment question, contact GlowVai support.</Note>
        </View>
      </ScreenShell>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: Spacing.lg },
});
