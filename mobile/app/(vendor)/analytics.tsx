/**
 * Store activity: simple, real numbers from this store's recent orders (the same list the
 * Orders screen shows): orders per day for the last 7 days, the value of the items in them,
 * and how many were accepted, packed and cancelled. No earnings: GlowVai's fees are not
 * known to the app. No sample data.
 * File: mobile/app/(vendor)/analytics.tsx
 */
import React, { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, LoadingCard, Note, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import {
  SyncNotice,
  bucketOf,
  formatINR,
  refreshOrdersNow,
  startOfDay,
  useOrdersDemand,
  useOrdersSync,
} from '../../src/features/orders';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

const DAY_MS = 86_400_000;

export default function StoreActivityScreen() {
  useOrdersDemand();
  const sync = useOrdersSync();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const today = startOfDay();
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today - i * DAY_MS);
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      return { from, to: from + DAY_MS, orders: 0, value: 0 };
    });
    const weekStart = days[days.length - 1].from;
    let accepted = 0;
    let packed = 0;
    let cancelled = 0;
    let value = 0;
    for (const o of sync.orders) {
      if (o.isOffer) continue;
      const at = o.acceptedAt || o.placedAt;
      if (!at || at < weekStart) continue;
      const b = bucketOf(o);
      if (b === 'cancelled') {
        cancelled += 1;
        continue;
      }
      accepted += 1;
      if (o.packedAt || b === 'packed' || b === 'completed') packed += 1;
      value += o.itemsValue;
      const day = days.find(d => at >= d.from && at < d.to);
      if (day) {
        day.orders += 1;
        day.value += o.itemsValue;
      }
    }
    return { days, accepted, packed, cancelled, value };
  }, [sync.orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrdersNow();
    setRefreshing(false);
  };

  const dayLabel = (from: number, i: number) =>
    i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(from).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <ScreenShell
      header={{ title: 'Store activity', showBack: true }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={page.body}>
        <SyncNotice />
        {!sync.hasLoaded && sync.state === 'error' ? (
          <StateCard icon="cloud-offline-outline" tone="danger" title="Could not load your orders" body={sync.error || undefined} action={{ label: 'Retry', onPress: () => void sync.retry() }} />
        ) : !sync.hasLoaded ? (
          <LoadingCard label="Loading your orders" />
        ) : stats.accepted + stats.cancelled === 0 ? (
          <StateCard
            icon="stats-chart-outline"
            title="No orders in the last 7 days"
            body="Once you accept orders, how many you handled each day and the value of their items will show here."
          />
        ) : (
          <>
            <SectionLabel>Last 7 days</SectionLabel>
            <View style={s.tiles}>
              <Tile label="Accepted" value={String(stats.accepted)} />
              <Tile label="Packed" value={String(stats.packed)} />
              <Tile label="Cancelled" value={String(stats.cancelled)} />
            </View>
            <Card>
              <Text style={kit.muted}>Items value of accepted orders</Text>
              <Text style={s.big}>{formatINR(stats.value)}</Text>
              <Text style={kit.muted}>What the items were worth at GlowVai prices. This is not your payout.</Text>
            </Card>

            <SectionLabel>Orders per day</SectionLabel>
            <Card padded={false}>
              {stats.days.map((d, i) => (
                <View
                  key={d.from}
                  style={[s.dayRow, i < stats.days.length - 1 && s.divider]}
                  accessible
                  accessibilityLabel={`${dayLabel(d.from, i)}: ${d.orders} ${d.orders === 1 ? 'order' : 'orders'}, items value ${formatINR(d.value)}`}
                >
                  <Text style={s.day}>{dayLabel(d.from, i)}</Text>
                  <Text style={s.count}>{d.orders} {d.orders === 1 ? 'order' : 'orders'}</Text>
                  <Text style={s.value}>{d.orders ? formatINR(d.value) : '–'}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
        <Note>Counted from your most recent orders on GlowVai (up to the latest 50). Cancelled orders are not counted in the value.</Note>
      </View>
    </ScreenShell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={s.tile}>
      <Text style={kit.muted}>{label}</Text>
      <Text style={s.tileValue}>{value}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: { flex: 1, minWidth: 0, padding: Spacing.md },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  big: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36, color: Colors.textPrimary, marginVertical: 2, fontVariant: ['tabular-nums'] },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 52 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  day: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary, flex: 1 },
  count: { ...TypeScale.body, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  value: { ...TypeScale.bodyStrong, color: Colors.textPrimary, minWidth: 72, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
