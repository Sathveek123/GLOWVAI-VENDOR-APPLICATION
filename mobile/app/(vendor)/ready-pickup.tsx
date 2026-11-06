/**
 * Ready for pickup (PRD screen 13, handover half): the packed orders waiting at the store.
 *
 * GlowVai assigns the delivery partner and records the pickup; this screen follows it.
 * Pickup verification (QR or code) comes later, so there is no handover button and no
 * rider details here: nothing on this screen changes an order.
 * File: mobile/app/(vendor)/ready-pickup.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import type { Order } from '../../src/store/useVendorStore';
import ScreenShell from '../../src/components/ScreenShell';
import {
  SyncNotice,
  bucketOf,
  formatAgo,
  formatClock,
  refreshOrdersNow,
  unitCount,
  unitsLabel,
  useOrdersDemand,
  useOrdersSync,
} from '../../src/features/orders';
import { Banner, Card, StateView, ui } from '../../src/features/orders/ui';

export default function ReadyForPickupScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  useOrdersDemand();
  const sync = useOrdersSync();
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Ready for pickup · GlowVai Seller';
    }
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const waiting = useMemo(
    () => sync.orders.filter(o => bucketOf(o) === 'packed').sort((a, b) => (a.packedAt || a.placedAt) - (b.packedAt || b.placedAt)),
    [sync.orders],
  );
  const focus = orderId ? sync.orders.find(o => o.orderId === orderId) : undefined;
  const focusBucket = focus ? bucketOf(focus) : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrdersNow();
    setRefreshing(false);
  };

  const open = (o: Order) => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: o.orderId } } as any);

  return (
    <ScreenShell
      header={{ title: 'Ready for pickup', subtitle: sync.hasLoaded ? `${waiting.length} waiting` : undefined, showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={s.stack}>
        <SyncNotice />

        {focus && focusBucket === 'completed' ? (
          <Banner tone="success" message={`Order ${focus.reference} is with GlowVai's delivery partner. Nothing more to do.`} />
        ) : null}
        {focus && focusBucket === 'cancelled' ? (
          <Banner tone="warning" title={`Order ${focus.reference} was cancelled`} message="Do not hand it over. Put the items back on the shelf." />
        ) : null}

        <Card style={s.info}>
          <View style={s.infoIcon}>
            <Ionicons name="bicycle-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={ui.sectionTitle}>GlowVai assigns the delivery partner</Text>
            <Text style={ui.body}>
              Keep each packed order together with its reference on it. When the delivery partner arrives, match the reference before you hand it over. Pickup verification in the app comes later.
            </Text>
          </View>
        </Card>

        {!sync.hasLoaded && sync.state === 'error' ? (
          <Card><StateView kind="error" title="We could not load your orders" message={sync.error || undefined} actionLabel="Retry" onAction={sync.retry} /></Card>
        ) : !sync.hasLoaded ? (
          <Card><StateView kind="loading" title="Loading orders" /></Card>
        ) : waiting.length === 0 ? (
          <Card>
            <StateView
              kind="empty"
              icon="cube-outline"
              title="No packed orders waiting"
              message="Orders you mark as packed wait here until GlowVai's delivery partner picks them up."
            />
          </Card>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {waiting.map(o => (
              <Pressable
                key={o.orderId}
                onPress={() => open(o)}
                accessibilityRole="button"
                accessibilityLabel={`Order ${o.reference}, ${unitsLabel(unitCount(o))}, packed ${formatAgo(o.packedAt, now)}`}
                style={({ pressed }) => [ui.card, s.row, o.orderId === orderId && s.rowFocus, pressed && { backgroundColor: Colors.surface }]}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={s.ref} numberOfLines={1} selectable>{o.reference}</Text>
                  <Text style={ui.muted}>
                    {[
                      unitsLabel(unitCount(o)),
                      o.packedAt ? `packed at ${formatClock(o.packedAt)}` : '',
                      o.status === 'READY_FOR_PICKUP' ? 'ready for pickup' : 'waiting for GlowVai',
                    ].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  stack: { gap: Spacing.md },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  infoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 72 },
  rowFocus: { borderColor: Colors.primaryBorder },
  ref: { fontFamily: FontFamily.mono, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
});
