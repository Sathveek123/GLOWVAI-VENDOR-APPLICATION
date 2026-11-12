/**
 * Pack order (PRD screens 12 and 13, packing half).
 * A checklist of every item in the order. "Mark as packed" is enabled only when every item is
 * ticked; it sends the ticked product ids to GlowVai (POST /orders/{id}/packed), and the order
 * shows as packed only after GlowVai confirms. Ticks are kept on this phone until then.
 * Missing or damaged items cannot be reported from the app yet: the vendor contacts support.
 * File: mobile/app/(vendor)/pack-order.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore, { normalizeOrder, type OrderItem } from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/vendorApi/orders';
import { VendorApiError, friendlyError } from '../../src/services/vendorApi/http';
import { soundService } from '../../src/services/sound';
import ScreenShell from '../../src/components/ScreenShell';
import {
  StatusStrip,
  bucketOf,
  formatAgo,
  refreshOrdersNow,
  unitCount,
  unitsLabel,
  useOrder,
  withTimeout,
} from '../../src/features/orders';
import { Banner, Card, PrimaryButton, SecondaryButton, StateView, StatusPill, ui } from '../../src/features/orders/ui';
import { OrderTimeline, SubstitutionCard } from '../../src/features/orders/OrderExtras';

const ticksKey = (orderId: string) => `pack_ticks_${orderId}`;
const lineKey = (it: OrderItem, idx: number) => `${idx}:${it.productId}`;

export default function PackOrderScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, state, error: loadError, retry } = useOrder(orderId);
  const upsertOrder = useVendorStore(s => s.upsertOrder);

  const [ticks, setTicks] = useState<Record<string, true>>({});
  const [ticksLoaded, setTicksLoaded] = useState(false);
  const [packing, setPacking] = useState(false);
  const [packError, setPackError] = useState('');
  const [justPacked, setJustPacked] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Pack order · GlowVai Seller';
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    AsyncStorage.getItem(ticksKey(orderId))
      .then(raw => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const next: Record<string, true> = {};
          parsed.forEach(k => typeof k === 'string' && (next[k] = true));
          setTicks(next);
        }
      })
      .catch(() => {})
      .finally(() => active && setTicksLoaded(true));
    return () => {
      active = false;
    };
  }, [orderId]);

  const items = useMemo(() => order?.items ?? [], [order]);
  const keys = useMemo(() => items.map(lineKey), [items]);
  const ticked = keys.filter(k => ticks[k]).length;
  const allTicked = items.length > 0 && ticked === items.length;

  const toggle = (key: string) => {
    setPackError('');
    setTicks(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      if (orderId) AsyncStorage.setItem(ticksKey(orderId), JSON.stringify(Object.keys(next))).catch(() => {});
      return next;
    });
  };

  const markPacked = async () => {
    if (!order || !allTicked || packing) return;
    setPacking(true);
    setPackError('');
    const checkedProductIds = [...new Set(items.map(it => it.productId).filter(Boolean))];
    try {
      const res = await withTimeout(ordersApi.packed(order.orderId, checkedProductIds), 20_000);
      upsertOrder(
        res.order
          ? normalizeOrder(res.order)
          : { ...order, status: 'PACKED', vendorStatus: 'PACKED', packedAt: Date.now(), updatedAt: Date.now() },
      );
      if (!res.order) void refreshOrdersNow();
      AsyncStorage.removeItem(ticksKey(order.orderId)).catch(() => {});
      soundService.playSuccessDing();
      setJustPacked(true);
    } catch (err) {
      const code = err instanceof VendorApiError ? err.code : '';
      if (code === 'ORDER_CANCELLED') {
        setCancelled(true);
        void refreshOrdersNow({ full: true });
      } else if (err instanceof Error && err.name === 'TimeoutError') {
        setPackError('GlowVai did not answer in time. Check the order status before trying again.');
        void refreshOrdersNow();
      } else {
        setPackError(friendlyError(err));
      }
    } finally {
      setPacking(false);
    }
  };

  const header = { title: 'Pack order', showBack: true };

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
        <StateView kind="error" title="We could not load this order" message={loadError} actionLabel="Retry" onAction={retry} />
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
          message="It may have been removed, or the link is out of date."
          actionLabel="Back to orders"
          onAction={() => router.replace('/(vendor)/orders')}
        />
      </ScreenShell>
    );
  }

  const bucket = bucketOf(order);

  if (justPacked || bucket === 'packed') {
    return (
      <ScreenShell
        header={header}
        backgroundColor={Colors.surface}
        contentContainerStyle={s.scroll}
        stickyFooter={
          <View style={s.footer}>
            <PrimaryButton
              label="Pickup status"
              tall
              icon="cube-outline"
              onPress={() => router.replace({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } } as any)}
            />
            <SecondaryButton label="Next order" onPress={() => router.replace({ pathname: '/(vendor)/orders', params: { tab: 'preparing' } } as any)} />
          </View>
        }
      >
        <View style={s.stack}>
          <Card><StatusStrip order={order} /></Card>
          <Card style={s.doneCard}>
            <Ionicons name="checkmark-circle" size={44} color={Colors.success} />
            <Text style={s.doneTitle}>{justPacked ? 'Order packed' : 'This order is packed'}</Text>
            <Text style={s.doneSub}>
              GlowVai has it as packed. Keep it ready with the reference {order.reference} on it. GlowVai assigns the delivery partner.
            </Text>
          </Card>
        </View>
      </ScreenShell>
    );
  }

  if (cancelled || bucket === 'cancelled') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView
          kind="empty"
          icon="close-circle-outline"
          title="This order was cancelled"
          message="Do not pack it. Put any picked items back on the shelf."
          actionLabel="Back to orders"
          onAction={() => router.replace('/(vendor)/orders')}
        />
      </ScreenShell>
    );
  }

  if (bucket !== 'preparing') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView
          kind="empty"
          icon="basket-outline"
          title={bucket === 'offers' ? 'Accept this order first' : 'Nothing to pack here'}
          message={bucket === 'offers' ? 'You can pack an order after GlowVai confirms it is yours.' : 'This order is past packing.'}
          actionLabel="Open order"
          onAction={() => router.replace({ pathname: '/(vendor)/order-detail', params: { orderId: order.orderId } } as any)}
        />
      </ScreenShell>
    );
  }

  const units = unitCount(order);
  const left = items.length - ticked;

  return (
    <ScreenShell
      header={header}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scroll}
      stickyFooter={
        <View style={s.footer}>
          {packError ? <Banner tone="danger" message={packError} /> : null}
          <Text style={s.helper} accessibilityLiveRegion="polite">
            {!ticksLoaded ? 'Loading your ticks' : allTicked ? 'Every item is ticked.' : `Tick every item first. ${left} left.`}
          </Text>
          <PrimaryButton
            label="Mark as packed"
            tall
            icon="cube-outline"
            onPress={markPacked}
            disabled={!allTicked || !ticksLoaded}
            busy={packing}
          />
        </View>
      }
    >
      <View style={s.stack}>
        <Card><StatusStrip order={order} /></Card>

        <SubstitutionCard preference={order.substitutionPreference} />

        <Card style={{ gap: Spacing.sm }}>
          <View style={s.refRow}>
            <Text style={ui.code} selectable numberOfLines={1}>{order.reference}</Text>
            <StatusPill order={order} />
          </View>
          <Text style={ui.muted}>
            {[
              order.customerFirstName ? `For ${order.customerFirstName}` : '',
              unitsLabel(units),
              order.acceptedAt ? `Accepted ${formatAgo(order.acceptedAt)}` : '',
            ].filter(Boolean).join(' · ')}
          </Text>
          <View style={s.progressHead}>
            <Text style={s.progressText}>{ticked} of {items.length} ticked</Text>
          </View>
          <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: items.length, now: ticked }}>
            <View style={[s.fill, { width: `${items.length ? (ticked / items.length) * 100 : 0}%` }]} />
          </View>
        </Card>

        <Card style={{ paddingVertical: Spacing.xs }}>
          {items.length === 0 ? (
            <StateView kind="empty" icon="cube-outline" title="No items on this order" message="Contact GlowVai support: this order has no items to pack." />
          ) : (
            items.map((it, idx) => {
              const key = keys[idx];
              const on = !!ticks[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => toggle(key)}
                  disabled={!ticksLoaded || packing}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled: !ticksLoaded || packing }}
                  accessibilityLabel={`${it.brand ? `${it.brand} ` : ''}${it.productName}, quantity ${it.quantity}`}
                  style={({ pressed }) => [s.item, idx > 0 && ui.divider, pressed && { opacity: 0.7 }]}
                >
                  <View style={[s.box, on && s.boxOn]}>
                    {on ? <Ionicons name="checkmark" size={20} color={Colors.textOnPrimary} /> : null}
                  </View>
                  <Thumb uri={it.imageUrl} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    {it.brand ? <Text style={ui.muted} numberOfLines={1}>{it.brand}</Text> : null}
                    <Text style={[s.itemName, on && s.itemNameDone]} numberOfLines={2}>{it.productName}</Text>
                    {it.variantLabel ? <Text style={ui.muted}>{it.variantLabel}</Text> : null}
                  </View>
                  <View style={s.qty}>
                    <Text style={s.qtyText}>x{it.quantity}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>

        <View style={s.help}>
          <Ionicons name="help-circle-outline" size={18} color={Colors.textSecondary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ui.body}>
              Missing or damaged item? Do not pack the order. Reporting it from the app is not available yet, so contact GlowVai support.
            </Text>
            <Pressable onPress={() => router.push('/(vendor)/support')} accessibilityRole="link" style={s.link}>
              <Text style={s.linkText}>Contact support</Text>
            </Pressable>
          </View>
        </View>
        <Text style={s.savedNote}>Ticks are saved on this phone until the order is packed.</Text>
      </View>
    </ScreenShell>
  );
}

function Thumb({ uri }: { uri?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={s.thumb}>
      {uri && !failed ? (
        <Image source={{ uri }} style={s.thumbImg} resizeMode="contain" onError={() => setFailed(true)} />
      ) : (
        <Ionicons name="cube-outline" size={18} color={Colors.textMuted} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  stack: { gap: Spacing.md },
  footer: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  helper: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, color: Colors.textSecondary, textAlign: 'center' },

  refRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  progressText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 72, paddingVertical: Spacing.sm },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  boxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: Colors.textPrimary },
  itemNameDone: { color: Colors.textSecondary },
  qty: {
    minWidth: 52,
    height: 40,
    paddingHorizontal: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  help: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
  savedNote: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  doneCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  doneTitle: { fontFamily: FontFamily.bold, fontSize: 19, color: Colors.textPrimary },
  doneSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 360 },
});
