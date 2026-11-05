/**
 * Bank account (PRD screen 24): the payout account on file, masked to the last four digits.
 *
 * Changing the account needs extra authentication, an audit trail and protection against
 * payout redirection. None of that exists in the backend yet, so the app does not offer a
 * change form; it sends the vendor to GlowVai support.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { friendlyError } from '../../src/features/money/format';
import { readBankAccount, type BankAccount } from '../../src/features/money/records';
import { Card, ErrorCard, InfoRow, LoadingCard, Pill, StateCard, page } from '../../src/features/money/ui';
import { SupportContactActions } from '../../src/features/support/contact';
import { vendorApi } from '../../src/services/api';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; account: BankAccount | null };

export default function BankAccountScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await vendorApi.me();
      setLoad({ state: 'ready', account: readBankAccount(res?.vendor) });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ScreenShell header={{ title: 'Bank account', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        {load.state === 'loading' ? <LoadingCard label="Loading your payout account" /> : null}
        {load.state === 'error' ? <ErrorCard title="Could not load your bank account" message={load.message} onRetry={fetchData} /> : null}

        {load.state === 'ready' && !load.account ? (
          <StateCard
            icon="card-outline"
            title="No payout account on file"
            body="Your bank account will show here with only the last four digits visible. To add it, contact GlowVai support."
          >
            <SupportContactActions subject="Add payout bank account" />
          </StateCard>
        ) : null}

        {load.state === 'ready' && load.account ? (
          <>
            <Card padded={false}>
              <View style={s.head}>
                <Text style={s.bank} numberOfLines={2}>
                  {[load.account.bankName, load.account.accountMasked].filter(Boolean).join('  ') || 'Payout account'}
                </Text>
                {load.account.verified === true ? (
                  <Pill tone="success" label={load.account.verifiedOn ? `Verified ${load.account.verifiedOn}` : 'Verified'} />
                ) : load.account.verified === false ? (
                  <Pill tone="warning" label="Not verified yet" />
                ) : null}
              </View>
              {load.account.holderName ? <InfoRow label="Account holder" value={load.account.holderName} /> : null}
              {load.account.ifsc ? <InfoRow label="IFSC" value={load.account.ifsc} mono /> : null}
              {load.account.upiMasked ? <InfoRow label="UPI ID" value={load.account.upiMasked} mono /> : null}
              <InfoRow label="Account number" value={load.account.accountMasked || 'Not on file'} mono last />
            </Card>

            <StateCard
              icon="lock-closed-outline"
              title="Changing your bank account"
              body="Bank changes are not available in the app yet — contact GlowVai support."
            >
              <SupportContactActions subject="Change payout bank account" />
            </StateCard>
          </>
        ) : null}

        {load.state === 'ready' ? (
          <Text style={s.foot} onPress={() => router.push('/(vendor)/payout-detail')} accessibilityRole="link">
            View settlements
          </Text>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  head: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bank: { ...TypeScale.subtitle, fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  foot: { ...TypeScale.bodyStrong, color: Colors.primary, textAlign: 'center', paddingVertical: Spacing.md },
});
