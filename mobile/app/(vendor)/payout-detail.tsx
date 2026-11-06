/**
 * Settlements (PRD screen 22). GlowVai sets up settlements for each store; until then there
 * are no transfers to list. No sample transfers, amounts, UTRs or payout cycles.
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
          title="Settlements are set up by GlowVai"
          body="Once GlowVai sets up settlements for your store, each bank transfer will appear here with its date, amount, bank reference (UTR) and status. Nothing has been paid through the app yet."
        >
          <SupportContactActions subject="Payout question" />
        </StateCard>
        <Note>The app does not hold your bank account number. GlowVai pays to the account on record with it.</Note>
      </View>
    </ScreenShell>
  );
}
