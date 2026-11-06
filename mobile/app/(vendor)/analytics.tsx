/**
 * Store activity: this store's own numbers for the last 7 or 30 days, computed by GlowVai from
 * the store's orders (GET /api/vendor/analytics). Orders per day, accepted and declined counts,
 * average time to accept, fulfilment rate, items sold, and the value of the items in accepted
 * orders. The value is not earnings. A number the server cannot compute shows "No data yet";
 * it is never shown as zero. No sample data.
 * File: mobile/app/(vendor)/analytics.tsx
 */
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, LoadingCard, Note, Segmented, SectionLabel, StateCard, ErrorCard, kit, page } from '../../src/features/money/ui';
import { formatINR } from '../../src/features/orders';
import { analyticsApi, type Analytics, type AnalyticsDays } from '../../src/services/vendorApi/analytics';
import { friendlyError } from '../../src/services/vendorApi/http';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

const NO_DATA = 'No data yet';

function durationText(seconds: number | null): string {
  if (seconds === null) return NO_DATA;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function percentText(rate: number | null): string {
  return rate === null ? NO_DATA : `${Math.round(rate * 100)}%`;
}

function dayLabel(date: string, index: number, total: number): string {
  if (index === total - 1) return 'Today';
  if (index === total - 2) return 'Yesterday';
  const d = new Date(`${date}T12:00:00+05:30`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

export default function StoreActivityScreen() {
  const [days, setDays] = useState<AnalyticsDays>(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (d: AnalyticsDays) => {
    setError('');
    try {
      setData(await analyticsApi.get(d));
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    setData(null);
    void load(days);
  }, [days, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(days);
    setRefreshing(false);
  };

  const empty = !!data && data.totals.orders === 0;

  return (
    <ScreenShell
      header={{ title: 'Store activity', showBack: true }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={page.body}>
        <Segmented<'7' | '30'>
          label="Period"
          options={[
            { key: '7', label: 'Last 7 days' },
            { key: '30', label: 'Last 30 days' },
          ]}
          value={String(days) as '7' | '30'}
          onChange={k => setDays(k === '30' ? 30 : 7)}
        />

        {error && !data ? (
          <ErrorCard message={error} onRetry={() => void load(days)} title="Could not load store activity" />
        ) : !data ? (
          <LoadingCard label="Loading store activity" />
        ) : empty ? (
          <StateCard
            icon="stats-chart-outline"
            title={`No orders in the last ${days} days`}
            body="Once you receive and accept orders, how many you handled each day and how fast you accepted them will show here."
          />
        ) : (
          <>
            {error ? <Note>{`Could not refresh: ${error}`}</Note> : null}
            {data.bounds.truncated ? <Note>Showing the latest {data.bounds.perQueryLimit} orders.</Note> : null}

            <SectionLabel>Orders</SectionLabel>
            <View style={s.tiles}>
              <Tile label="Orders" value={String(data.totals.orders)} />
              <Tile label="Accepted" value={String(data.totals.accepted)} />
              <Tile label="Declined" value={String(data.totals.declined)} />
            </View>

            <View style={s.tiles}>
              <Tile label="Avg. time to accept" value={durationText(data.averageAcceptSeconds)} />
              <Tile label="Fulfilment" value={percentText(data.fulfilmentRate)} hint={data.fulfilmentRate === null ? undefined : `${data.fulfilled} of ${data.totals.accepted} accepted`} />
            </View>

            <Card>
              <Text style={kit.muted}>Item value of accepted orders</Text>
              <Text style={s.big}>{formatINR(data.orderValue.amount)}</Text>
              <Text style={kit.muted}>
                {data.orderValue.label}. {data.orderValue.orderCount} {data.orderValue.orderCount === 1 ? 'order' : 'orders'} at GlowVai prices, not what you will be paid.
              </Text>
            </Card>

            <SectionLabel>Per day</SectionLabel>
            <Card padded={false}>
              {data.ordersPerDay.map((d, i, all) => (
                <View
                  key={d.date}
                  style={[s.dayRow, i < all.length - 1 && s.divider]}
                  accessible
                  accessibilityLabel={`${dayLabel(d.date, i, all.length)}: ${d.orders} orders, ${d.accepted} accepted, ${d.declined} declined`}
                >
                  <Text style={s.day}>{dayLabel(d.date, i, all.length)}</Text>
                  <Text style={s.count}>{d.orders} {d.orders === 1 ? 'order' : 'orders'}</Text>
                  <Text style={s.sub}>{d.accepted} acc. · {d.declined} dec.</Text>
                </View>
              ))}
            </Card>

            <SectionLabel>Items sold</SectionLabel>
            {data.itemsSold.length === 0 ? (
              <StateCard icon="cube-outline" title="No items sold yet" body="Items from orders you accepted will be listed here." />
            ) : (
              <Card padded={false}>
                {data.itemsSold.map((it, i) => (
                  <View key={`${it.productId}-${i}`} style={[s.dayRow, i < data.itemsSold.length - 1 && s.divider]}>
                    <Text style={s.itemTitle} numberOfLines={2}>{it.title}</Text>
                    <Text style={s.count}>× {it.quantity}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
        <Note>Calculated by GlowVai from your orders. Times are in India Standard Time.</Note>
      </View>
    </ScreenShell>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={s.tile}>
      <Text style={kit.muted}>{label}</Text>
      <Text style={value === NO_DATA ? s.noData : s.tileValue}>{value}</Text>
      {hint ? <Text style={kit.muted}>{hint}</Text> : null}
    </Card>
  );
}

const s = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: { flex: 1, minWidth: 0, padding: Spacing.md, gap: 2 },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  noData: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 22, color: Colors.textMuted },
  big: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36, color: Colors.textPrimary, marginVertical: 2, fontVariant: ['tabular-nums'] },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 52, paddingVertical: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  day: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary, flex: 1 },
  count: { ...TypeScale.body, color: Colors.textPrimary, fontFamily: FontFamily.semibold, fontVariant: ['tabular-nums'] },
  sub: { ...TypeScale.caption, color: Colors.textSecondary, minWidth: 96, textAlign: 'right' },
  itemTitle: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary, flex: 1, minWidth: 0 },
});
