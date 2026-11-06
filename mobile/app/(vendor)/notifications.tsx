/**
 * Alerts: what happened to this store's orders recently, newest first, built from the real
 * order list (new offers, accepted, packed, out for delivery, delivered, cancelled).
 * GlowVai does not send separate messages to stores yet; the screen says so.
 * File: mobile/app/(vendor)/notifications.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, LoadingCard, Note, StateCard, kit, page } from '../../src/features/money/ui';
import type { Order } from '../../src/store/useVendorStore';
import {
  SyncNotice,
  bucketOf,
  formatDayTime,
  refreshOrdersNow,
  useOrdersDemand,
  useOrdersSync,
} from '../../src/features/orders';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;

interface AlertRow {
  id: string;
  orderId: string;
  at: number;
  title: string;
  icon: IconName;
  tone: 'action' | 'neutral' | 'success' | 'danger';
}

function alertsFrom(orders: Order[]): AlertRow[] {
  const out: AlertRow[] = [];
  for (const o of orders) {
    const b = bucketOf(o);
    if (b === 'offers') {
      out.push({ id: `${o.orderId}:offer`, orderId: o.orderId, at: o.placedAt, title: `New order offer ${o.reference}`, icon: 'notifications-outline', tone: 'action' });
      continue;
    }
    if (o.acceptedAt) out.push({ id: `${o.orderId}:accepted`, orderId: o.orderId, at: o.acceptedAt, title: `You accepted ${o.reference}`, icon: 'checkmark-outline', tone: 'neutral' });
    if (o.packedAt) out.push({ id: `${o.orderId}:packed`, orderId: o.orderId, at: o.packedAt, title: `${o.reference} packed`, icon: 'cube-outline', tone: 'neutral' });
    if (b === 'completed' && o.updatedAt) {
      out.push({
        id: `${o.orderId}:${o.status}`,
        orderId: o.orderId,
        at: o.updatedAt,
        title: o.status === 'DELIVERED' ? `${o.reference} delivered` : `${o.reference} is out for delivery`,
        icon: o.status === 'DELIVERED' ? 'checkmark-circle-outline' : 'bicycle-outline',
        tone: 'success',
      });
    }
    if (b === 'cancelled' && o.updatedAt) {
      out.push({ id: `${o.orderId}:cancelled`, orderId: o.orderId, at: o.updatedAt, title: `${o.reference} was cancelled`, icon: 'close-circle-outline', tone: 'danger' });
    }
  }
  return out.filter(a => a.at > 0).sort((a, b) => b.at - a.at).slice(0, 60);
}

const TONE: Record<AlertRow['tone'], { fg: string; bg: string }> = {
  action: { fg: Colors.primary, bg: Colors.primaryLight },
  neutral: { fg: Colors.textSecondary, bg: Colors.surface },
  success: { fg: Colors.successText, bg: Colors.successLight },
  danger: { fg: Colors.dangerText, bg: Colors.dangerLight },
};

export default function AlertsScreen() {
  const router = useRouter();
  useOrdersDemand();
  const sync = useOrdersSync();
  const [refreshing, setRefreshing] = useState(false);
  const alerts = useMemo(() => alertsFrom(sync.orders), [sync.orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrdersNow();
    setRefreshing(false);
  };

  return (
    <ScreenShell
      header={{ title: 'Alerts', showBack: true }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={page.body}>
        <SyncNotice />
        {!sync.hasLoaded && sync.state === 'error' ? (
          <StateCard icon="cloud-offline-outline" tone="danger" title="Could not load your orders" body={sync.error || undefined} action={{ label: 'Retry', onPress: () => void sync.retry() }} />
        ) : !sync.hasLoaded ? (
          <LoadingCard label="Loading alerts" />
        ) : alerts.length === 0 ? (
          <StateCard
            icon="notifications-outline"
            title="No alerts yet"
            body="New offers and changes to your orders will be listed here."
          />
        ) : (
          <Card padded={false}>
            {alerts.map((a, i) => {
              const tone = TONE[a.tone];
              return (
                <Pressable
                  key={a.id}
                  onPress={() => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: a.orderId } } as any)}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.title}, ${formatDayTime(a.at)}. Open order`}
                  style={({ pressed }) => [s.row, i < alerts.length - 1 && s.divider, pressed && { backgroundColor: Colors.surface }]}
                >
                  <View style={[s.icon, { backgroundColor: tone.bg }]}>
                    <Ionicons name={a.icon} size={18} color={tone.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.title} numberOfLines={2}>{a.title}</Text>
                    <Text style={kit.muted}>{formatDayTime(a.at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </Pressable>
              );
            })}
          </Card>
        )}
        <Note>Built from your recent orders. Messages from GlowVai to your store will appear here later.</Note>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 64 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
});
