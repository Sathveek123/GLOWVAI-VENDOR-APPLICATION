/**
 * Settlements (PRD screen 22). GlowVai has not set up payouts for stores yet, so there are no
 * transfers to list: no sample transfers, amounts, UTRs or payout cycles.
 * File: mobile/app/(vendor)/payout-detail.tsx
 */
import React from 'react';
import { View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Note, StateCard, page } from '../../src/features/money/ui';
import { SupportContactActions } from '../../src/features/support/contact';
import { Colors } from '../../src/theme/tokens';

export default function SettlementsScreen() {
  return (
    <ScreenShell header={{ title: 'Settlements', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        <StateCard
          icon="swap-horizontal-outline"
          title="Settlements will appear here once GlowVai sets up payouts"
          body="When payouts are set up for your store, each bank transfer will show here. Nothing has been paid through the app yet."
        >
          <SupportContactActions subject="Payout question" />
        </StateCard>
        <Note>The app does not hold your bank account number. Payouts go to the account on record with GlowVai.</Note>
      </View>
    </ScreenShell>
  );
}
