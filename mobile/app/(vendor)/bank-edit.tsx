/**
 * Bank account (PRD screen 24): the payout account on file, from GET /api/vendor/me.
 *
 * GlowVai never holds the full account number or the full IFSC in the app; the server sends the
 * last 4 digits and a masked IFSC only. Changing the account is a support request, so a
 * payout account can never be redirected from a stolen phone.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Button, Card, ErrorCard, InfoRow, LoadingCard, Note, StateCard, page } from '../../src/features/money/ui';
import { changeRequestRoute } from '../../src/features/profile/account';
import { useVendorMe } from '../../src/services/vendorApi/account';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

export default function BankAccountScreen() {
  const router = useRouter();
  const { me, loading, error, refresh } = useVendorMe();
  const bank = me?.vendor.application?.bank ?? null;

  const requestChange = (subject: string) => router.push(changeRequestRoute(subject) as never);

  return (
    <ScreenShell header={{ title: 'Bank account', showBack: true }} backgroundColor={Colors.canvas}>
      <View style={page.body}>
        {!me && loading ? <LoadingCard label="Loading your payout account" /> : null}
        {!me && error ? <ErrorCard title="Could not load your bank account" message={error} onRetry={refresh} /> : null}

        {me && !bank ? (
          <StateCard
            icon="card-outline"
            title="No payout account on file"
            body="Your application has no bank details. Send a request and GlowVai’s team will add your payout account with you."
            action={{ label: 'Request to add a bank account', onPress: () => requestChange('Add my payout bank account') }}
          />
        ) : null}

        {me && bank ? (
          <>
            <Card padded={false}>
              <View style={s.head}>
                <Text style={s.bank} numberOfLines={2}>
                  {bank.bankName || 'Payout account'}
                </Text>
                <Text style={s.sub}>Account ending in {bank.accLast4}</Text>
              </View>
              <InfoRow label="Account holder" value={bank.holderName} />
              <InfoRow label="IFSC" value={bank.ifscMasked} mono />
              <InfoRow label="Account number" value={`•••• ${bank.accLast4}`} mono last={!bank.upiVpa} />
              {bank.upiVpa ? <InfoRow label="UPI ID" value={bank.upiVpa} mono last /> : null}
            </Card>

            <Note icon="shield-checkmark-outline">
              For your safety, GlowVai never stores your full account number. Our team confirms your bank details with you before
              payouts start.
            </Note>

            <Card style={{ gap: Spacing.md }}>
              <Text style={s.title}>Need to change this account?</Text>
              <Text style={s.body}>
                Bank changes are checked by GlowVai’s team to protect your payouts. Send a request and we will contact you.
              </Text>
              <Button label="Request a change" variant="secondary" icon="create-outline" onPress={() => requestChange('Change my payout bank account')} />
            </Card>
          </>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  head: {
    padding: Spacing.lg,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bank: { ...TypeScale.subtitle, fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  sub: { ...TypeScale.body, color: Colors.textSecondary },
  title: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  body: { ...TypeScale.body, color: Colors.textSecondary },
});
