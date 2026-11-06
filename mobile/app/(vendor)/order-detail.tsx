/**
 * Order detail (PRD screen 12).
 *  - New offer: the offer itself (items, stock check, Accept, Decline with a reason).
 *  - Accepted or later: status, items with quantities and prices, times, and the next step
 *    (Pack this order, or the pickup status). The customer's first name shows only after
 *    this store accepted. No phone, address or location, ever.
 * Vendors never mark an order delivered or out for delivery: GlowVai does.
 * File: mobile/app/(vendor)/order-detail.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import type { OrderItem } from '../../src/store/useVendorStore';
import ScreenShell from '../../src/components/ScreenShell';
import {
  OfferCard,
  StatusStrip,
  SyncNotice,
  bucketOf,
  formatDayTime,
  formatINR,
  unitCount,
  unitsLabel,
  useOrder,
} from '../../src/features/orders';
import { Banner, Card, PrimaryButton, StateView, StatusPill, ui } from '../../src/features/orders/ui';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, state, error, retry } = useOrder(orderId);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Order ${order?.reference || orderId || ''} · GlowVai Seller`;
    }
  }, [orderId, order?.reference]);

  const header = { title: 'Order', showBack: true };

  if (state === 'loading') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView kind="loading" title="Loading order" />
      </ScreenShell>
    );
  }
  if (state === 'error') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView kind="error" title="We could not load this order" message={error} actionLabel="Retry" onAction={retry} />
      </ScreenShell>
    );
  }
  if (!order) {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView
          kind="empty"
          icon="search-outline"
          title="Order not found"
          message="It is no longer offered to your store, or the link is out of date."
          actionLabel="Back to orders"
          onAction={() => router.replace('/(vendor)/orders')}
        />
      </ScreenShell>
    );
  }

  const bucket = bucketOf(order);

  if (bucket === 'offers') {
    return (
      <ScreenShell header={{ ...header, title: 'New order offer' }} backgroundColor={Colors.surface} contentContainerStyle={s.scroll}>
        <View style={s.stack}>
          <SyncNotice />
          <Card style={{ paddingHorizontal: 0 }}>
            <OfferCard
              order={order}
              variant="inline"
              onStartPacking={o => router.replace({ pathname: '/(vendor)/pack-order', params: { orderId: o.orderId } } as any)}
              onClose={() => router.replace({ pathname: '/(vendor)/orders', params: { tab: 'offers' } } as any)}
            />
          </Card>
        </View>
      </ScreenShell>
    );
  }

  const units = unitCount(order);
  const footer =
    bucket === 'preparing' ? (
      <PrimaryButton
        label="Pack this order"
        tall
        icon="basket-outline"
        onPress={() => router.push({ pathname: '/(vendor)/pack-order', params: { orderId: order.orderId } } as any)}
      />
    ) : bucket === 'packed' ? (
      <PrimaryButton
        label="Pickup status"
        tall
        icon="cube-outline"
        onPress={() => router.push({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } } as any)}
      />
    ) : undefined;

  return (
    <ScreenShell
      header={header}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scroll}
      stickyFooter={footer ? <View style={s.footer}>{footer}</View> : undefined}
    >
      <View style={s.stack}>
        <SyncNotice />
        {bucket !== 'cancelled' ? <Card><StatusStrip order={order} /></Card> : null}

        <Card style={{ gap: Spacing.sm }}>
          <View style={s.refRow}>
            <Text style={ui.code} selectable numberOfLines={1}>{order.reference}</Text>
            <StatusPill order={order} />
          </View>
          <Text style={ui.body}>
            {[order.customerFirstName ? `For ${order.customerFirstName}` : '', unitsLabel(units), `Items value ${formatINR(order.itemsValue)}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <View style={s.times}>
            <Time label="Placed" at={order.placedAt} />
            <Time label="Accepted" at={order.acceptedAt} />
            <Time label="Packed" at={order.packedAt} />
          </View>
        </Card>

        {bucket === 'cancelled' ? (
          <Banner
            tone="warning"
            title="This order was cancelled"
            message={`${order.cancellationReason ? `${order.cancellationReason}. ` : ''}Do not hand it over. Put any picked items back on the shelf.`}
          />
        ) : null}
        {bucket === 'completed' ? (
          <Banner tone="success" message="GlowVai's delivery partner has this order. Nothing more to do." />
        ) : null}
        {bucket === 'other' ? (
          <Banner tone="info" message="GlowVai is updating this order. Check again in a moment." />
        ) : null}

        <Card style={{ paddingVertical: Spacing.xs }}>
          <Text style={[ui.sectionTitle, { paddingVertical: Spacing.sm }]}>Items · {unitsLabel(units)}</Text>
          {order.items.map((it, idx) => (
            <ItemRow key={`${it.productId}-${idx}`} item={it} />
          ))}
          <View style={[s.totalRow, ui.divider]}>
            <Text style={s.totalLabel}>Items value</Text>
            <Text style={s.totalValue}>{formatINR(order.itemsValue)}</Text>
          </View>
        </Card>

        <View style={s.privacy}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
          <Text style={ui.muted}>
            GlowVai keeps the customer's phone and address private. Its delivery partner handles delivery.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

function Time({ label, at }: { label: string; at?: number }) {
  if (!at) return null;
  return (
    <View style={s.time}>
      <Text style={s.timeLabel}>{label}</Text>
      <Text style={s.timeValue}>{formatDayTime(at)}</Text>
    </View>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[s.item, ui.divider]}>
      <View style={s.thumb}>
        {item.imageUrl && !failed ? (
          <Image source={{ uri: item.imageUrl }} style={s.thumbImg} resizeMode="contain" onError={() => setFailed(true)} />
        ) : (
          <Ionicons name="cube-outline" size={20} color={Colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {item.brand ? <Text style={ui.muted} numberOfLines={1}>{item.brand}</Text> : null}
        <Text style={s.itemName} numberOfLines={2}>{item.productName}</Text>
        <Text style={ui.muted}>{formatINR(item.price)} each</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.qty}>x{item.quantity}</Text>
        <Text style={ui.muted}>{formatINR(item.price * item.quantity)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  stack: { gap: Spacing.md },
  footer: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  refRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, marginTop: Spacing.xs },
  time: { gap: 2 },
  timeLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.textMuted },
  timeValue: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64, paddingVertical: Spacing.sm },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  qty: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  totalLabel: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  totalValue: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: Spacing.xs },
});
