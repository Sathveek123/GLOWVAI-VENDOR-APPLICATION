/**
 * Tax documents (PRD screen 23). Statements come from GlowVai once settlements are set up for
 * the store. No tax rate, regime or sample document is assumed here.
 * File: mobile/app/(vendor)/tax-documents.tsx
 */
import React from 'react';
import { View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { StateCard, page } from '../../src/features/money/ui';
import { SupportContactActions } from '../../src/features/support/contact';
import { Colors } from '../../src/theme/tokens';

export default function TaxDocumentsScreen() {
  return (
    <ScreenShell header={{ title: 'Tax documents', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        <StateCard
          icon="document-text-outline"
          title="Statements will appear here"
          body="Settlements are set up by GlowVai. Once yours are, the statements and invoices GlowVai issues for your store will be listed here by financial year, with a download where a file is available. If you need a document now, contact GlowVai support."
        >
          <SupportContactActions subject="Tax document request" />
        </StateCard>
      </View>
    </ScreenShell>
  );
}
