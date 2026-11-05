/**
 * Store summary: a simple operations view of today's orders, the items ordered most today
 * and orders by status. Money lives on Earnings, so no amounts are shown here.
 *
 * Data: GET /api/analytics/:storeId -> { analytics: { today, topProducts, orderStatusBreakdown } }.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { friendlyError, num, pickNum } from '../../src/features/money/format';
import { Card, ErrorCard, InfoRow, LinkRow, LoadingCard, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import { analyticsApi } from '../../src/services/api';
import { getSession } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

interface Summary {
  received: number | null;
  delivered: number | null;
  waiting: number | null;
  topItems: { name: string; count: number }[];
  byStatus: { key: string; label: string; count: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting for you',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  DISPATCHED: 'With delivery partner',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function toSummary(res: any): Summary {
  const a = res?.analytics ?? {};
  const today = a.today ?? {};
  const topItems = (Array.isArray(a.topProducts) ? a.topProducts : [])
    .map((p: any) => ({ name: typeof p?.name === 'string' ? p.name : '', count: num(p?.count) ?? 0 }))
    .filter((p: { name: string; count: number }) => p.name && p.count > 0);
  const breakdown = a.orderStatusBreakdown && typeof a.orderStatusBreakdown === 'object' ? a.orderStatusBreakdown : {};
  const byStatus = Object.keys(STATUS_LABEL)
    .map((key) => ({ key, label: STATUS_LABEL[key], count: num(breakdown[key]) ?? 0 }))
    .filter((r) => r.count > 0);
  return {
    received: pickNum(today, ['ordersTotal']),
    delivered: pickNum(today, ['ordersDelivered']),
    waiting: pickNum(today, ['ordersPending']),
    topItems,
    byStatus,
  };
}

type Load = { state: 'loading' } | { state: 'no-store' } | { state: 'error'; message: string } | { state: 'ready'; data: Summary };

export default function StoreSummaryScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoad({ state: 'loading' });
    try {
      const session = await getSession();
      if (!session.storeId) {
        setLoad({ state: 'no-store' });
        return;
      }
      const res = await analyticsApi.getDashboard(session.storeId);
      setLoad({ state: 'ready', data: toSummary(res) });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  return (
    <ScreenShell
      header={{ title: 'Store summary', showBack: true }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={page.body}>
        {load.state === 'loading' ? <LoadingCard label="Loading your store summary" /> : null}
        {load.state === 'error' ? <ErrorCard title="Could not load the summary" message={load.message} onRetry={() => fetchData()} /> : null}
        {load.state === 'no-store' ? (
          <StateCard icon="storefront-outline" title="No store linked yet" body="Your store summary appears here once your store is approved." />
        ) : null}

        {load.state === 'ready' ? (
          <>
            <SectionLabel>Today</SectionLabel>
            <Card style={s.stats}>
              <Stat label="Received" value={load.data.received} />
              <View style={s.statDivider} />
              <Stat label="Delivered" value={load.data.delivered} />
              <View style={s.statDivider} />
              <Stat label="Waiting" value={load.data.waiting} />
            </Card>

            <SectionLabel>Most ordered today</SectionLabel>
            {load.data.topItems.length === 0 ? (
              <Card>
                <Text style={kit.body}>No items ordered yet today.</Text>
              </Card>
            ) : (
              <Card padded={false}>
                {load.data.topItems.map((p, i, arr) => (
                  <InfoRow key={p.name} label={`${i + 1}`} value={p.name} last={i === arr.length - 1} right={<Text style={kit.amount}>{p.count} sold</Text>} />
                ))}
              </Card>
            )}

            <SectionLabel>All orders by status</SectionLabel>
            {load.data.byStatus.length === 0 ? (
              <Card>
                <Text style={kit.body}>No orders yet. Orders appear here once customers start ordering from your store.</Text>
              </Card>
            ) : (
              <Card padded={false}>
                {load.data.byStatus.map((r, i, arr) => (
                  <View key={r.key} style={[s.statusRow, i < arr.length - 1 && s.divider]}>
                    <Text style={kit.body}>{r.label}</Text>
                    <Text style={kit.amount}>{r.count}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : null}

        <Card padded={false}>
          <LinkRow icon="wallet-outline" label="Earnings" detail="What you will receive and your settlements" onPress={() => router.push('/(vendor)/earnings')} last />
        </Card>
      </View>
    </ScreenShell>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${value ?? 'not available'}`}>
      <Text style={s.statValue}>{value ?? '—'}</Text>
      <Text style={kit.muted}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: FontFamily.semibold, fontSize: 24, lineHeight: 30, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: Colors.border },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, minHeight: 48 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  label: { ...TypeScale.body },
});
