/**
 * Earnings (PRD screen 21). GlowVai has no payout provider or commission rate for stores yet, so
 * the app shows no earnings, percentages, fees or payouts. It shows the real gross value of the
 * items in this store's accepted, packed and delivered orders (from GET /api/vendor/analytics),
 * labelled "Order value — not your earnings".
 * File: mobile/app/(vendor)/earnings.tsx
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, ErrorCard, LinkRow, LoadingCard, Note, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import { formatINR } from '../../src/features/orders';
import { analyticsApi, type Analytics } from '../../src/services/vendorApi/analytics';
import { friendlyError, isNotAvailableError } from '../../src/services/vendorApi/http';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';

export default function EarningsScreen() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setUnavailable(false);
    try {
      setData(await analyticsApi.get(30));
    } catch (err) {
      setUnavailable(isNotAvailableError(err));
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Earnings' }}
        backgroundColor={Colors.surface}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={page.body}>
          <StateCard
            icon="wallet-outline"
            title="Settlements will appear here once GlowVai sets up payouts"
            body="No payout has been made through the app yet, so there is no amount to show as your earnings."
          />

          <SectionLabel>Order value (last 30 days)</SectionLabel>
          {error && !data && unavailable ? (
            <StateCard icon="time-outline" title={error} body="Order value is not live yet. No amount is shown." />
          ) : error && !data ? (
            <ErrorCard message={error} onRetry={() => void load()} title="Could not load order value" />
          ) : !data ? (
            <LoadingCard label="Loading order value" />
          ) : data.orderValue.orderCount === 0 ? (
            <StateCard icon="receipt-outline" title="No accepted orders in the last 30 days" body="Order value appears here once you accept orders." />
          ) : (
            <Card>
              <Text style={kit.muted}>{data.orderValue.label}</Text>
              <Text style={s.big}>{formatINR(data.orderValue.amount)}</Text>
              <Text style={kit.muted}>
                {data.orderValue.orderCount} {data.orderValue.orderCount === 1 ? 'order' : 'orders'}: accepted, packed and delivered. Cancelled orders are not counted.
              </Text>
              {data.bounds.truncated ? <Text style={kit.muted}>Based on the latest {data.bounds.perQueryLimit} orders.</Text> : null}
            </Card>
          )}

          <SectionLabel>Your orders</SectionLabel>
          <Card padded={false}>
            <LinkRow
              icon="stats-chart-outline"
              label="Store activity"
              detail="Orders per day, accepted and declined"
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

          <Note>For a payment question, contact GlowVai support.</Note>
        </View>
      </ScreenShell>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: Spacing.lg },
  big: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36, color: Colors.textPrimary, marginVertical: 2, fontVariant: ['tabular-nums'] },
});
