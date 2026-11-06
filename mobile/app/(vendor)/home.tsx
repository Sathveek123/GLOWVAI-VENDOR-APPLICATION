/**
 * Store Command Center (PRD screen 09): is the store taking orders, and what needs doing now.
 *
 * - Online / offline comes from GlowVai (GET /api/vendor/me) and changes only after
 *   POST /api/vendor/status confirms. A paused store is told that GlowVai paused new offers.
 * - Offer, preparing and packed counts, today's orders and items value come from the real
 *   order list (src/features/orders/sync.ts). Low stock comes from the store's inventory.
 * - No earnings figure: the app does not know GlowVai's fees, so it says when earnings appear.
 * File: mobile/app/(vendor)/home.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, Platform, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import type { Order } from '../../src/store/useVendorStore';
import useVendorStore from '../../src/store/useVendorStore';
import { accountApi, loadVendorMe, updateVendorMe, useVendorMe } from '../../src/services/vendorApi/account';
import { VendorApiError, friendlyError } from '../../src/services/vendorApi/http';
import ScreenShell from '../../src/components/ScreenShell';
import {
  OrderCard,
  SyncNotice,
  bucketOf,
  formatAgo,
  formatINR,
  isToday,
  noteStatusWritten,
  refreshOrdersNow,
  useOrdersDemand,
  useOrdersSync,
  withTimeout,
} from '../../src/features/orders';
import { Card, PrimaryButton, SecondaryButton, StateView, ui } from '../../src/features/orders/ui';
import { LOW_STOCK_LEVEL, useInventory } from '../../src/features/catalog/inventory';

type Pending = null | 'online' | 'offline';

export default function StoreCommandCenter() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  useOrdersDemand();
  const sync = useOrdersSync();
  const { me, error: meError, refresh: refreshMe } = useVendorMe();
  const heartbeatFailed = useVendorStore(s => s.heartbeatFailed);
  const { inventory, status: invStatus, reload: reloadInventory } = useInventory();

  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<Pending>(null);
  const [toggleError, setToggleError] = useState('');
  const [confirmOffline, setConfirmOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Home · GlowVai Seller';
    }
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const vendor = me?.vendor;
  const app = vendor?.application;
  const paused = vendor?.state === 'APPROVED_PAUSED';
  const canOperate = !!vendor?.canOperate;
  const isOnline = !!vendor?.isOnline && canOperate;

  // ── Availability ───────────────────────────────────────────────────────────
  const setOnline = async (next: boolean) => {
    setConfirmOffline(false);
    setPending(next ? 'online' : 'offline');
    setToggleError('');
    try {
      const res = await withTimeout(accountApi.setOnline(next), 20_000);
      const confirmed = res.isOnline === next;
      updateVendorMe({ isOnline: !!res.isOnline, lastSeenAt: res.lastSeenAt ?? Date.now() });
      noteStatusWritten();
      if (!confirmed) {
        setToggleError(next ? 'GlowVai did not put your store online. Try again.' : 'GlowVai did not take your store offline. Try again.');
      }
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'TimeoutError';
      setToggleError(timedOut ? 'GlowVai did not answer in time. Check your internet and try again.' : friendlyError(err));
      if (err instanceof VendorApiError && err.code === 'NOT_APPROVED') void loadVendorMe(true).catch(() => {});
    } finally {
      setPending(null);
    }
  };

  const status = (() => {
    if (!vendor) {
      return meError
        ? { title: 'Store status not loaded', sub: meError, tone: 'danger' as const }
        : { title: 'Checking store status', sub: 'One moment.', tone: 'neutral' as const };
    }
    if (paused) {
      return {
        title: 'New offers paused by GlowVai',
        sub: 'GlowVai has paused new order offers for your store. You can still finish the orders you have and update your stock.',
        tone: 'warning' as const,
      };
    }
    if (!canOperate) {
      return { title: 'Temporarily unavailable.', sub: 'Your store cannot take orders right now. Contact GlowVai support.', tone: 'warning' as const };
    }
    if (pending === 'online') return { title: 'Going online...', sub: 'Checking with GlowVai that your store can take orders.', tone: 'neutral' as const };
    if (pending === 'offline') return { title: 'Going offline...', sub: 'Stopping new order offers.', tone: 'neutral' as const };
    if (toggleError && !isOnline) return { title: 'Unable to go online.', sub: toggleError, tone: 'danger' as const };
    if (isOnline && heartbeatFailed) {
      return {
        title: 'Temporarily unavailable.',
        sub: 'This phone cannot reach GlowVai, so new offers may stop. We keep trying.',
        tone: 'warning' as const,
      };
    }
    if (isOnline) {
      return { title: 'Online and accepting orders.', sub: 'New offers appear and ring while this app is open.', tone: 'online' as const };
    }
    return { title: 'Offline.', sub: 'You will not get new offers. You can still finish the orders you have.', tone: 'neutral' as const };
  })();

  const busy = pending !== null;
  const showToggle = !!vendor && canOperate && !paused;

  // ── Orders ─────────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const g = { offers: [] as Order[], preparing: [] as Order[], packed: [] as Order[], todayCount: 0, todayValue: 0 };
    for (const o of sync.orders) {
      const b = bucketOf(o);
      if (b === 'offers') g.offers.push(o);
      else if (b === 'preparing') g.preparing.push(o);
      else if (b === 'packed') g.packed.push(o);
      if ((b === 'preparing' || b === 'packed' || b === 'completed') && isToday(o.acceptedAt || o.placedAt, now)) {
        g.todayCount += 1;
        g.todayValue += o.itemsValue;
      }
    }
    const oldestFirst = (a: Order, b: Order) => a.placedAt - b.placedAt;
    g.offers.sort(oldestFirst);
    g.preparing.sort(oldestFirst);
    g.packed.sort(oldestFirst);
    return g;
  }, [sync.orders, now]);

  const nextUp = useMemo(
    () => [
      ...groups.offers.map(o => ({ order: o, action: 'Review' })),
      ...groups.preparing.map(o => ({ order: o, action: 'Pack' })),
    ].slice(0, 3),
    [groups],
  );

  const lowStock = useMemo(() => Object.values(inventory).filter(r => r.stock <= LOW_STOCK_LEVEL).length, [inventory]);

  const openTab = (tab: string) => router.push({ pathname: '/(vendor)/orders', params: { tab } } as any);
  const openOrder = (o: Order) => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: o.orderId } } as any);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshOrdersNow(), refreshMe(), reloadInventory()]);
    setRefreshing(false);
  };

  const firstLoadFailed = !sync.hasLoaded && sync.state === 'error';
  const loadingOrders = !sync.hasLoaded && !firstLoadFailed;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: app?.storeName || 'Your store',
          subtitle: app?.city || undefined,
          showBell: true,
        }}
        backgroundColor={Colors.surface}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        contentContainerStyle={s.scroll}
      >
        <View style={s.stack}>
          {/* Availability */}
          <Card style={[s.availability, status.tone === 'online' && s.availabilityOn, status.tone === 'warning' && s.availabilityWarn]}>
            <View style={s.availabilityRow}>
              <View style={[s.dot, dotStyle(status.tone)]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.availabilityTitle} accessibilityLiveRegion="polite">{status.title}</Text>
                <Text style={s.availabilitySub}>{status.sub}</Text>
              </View>
              {showToggle ? (
                <Toggle on={isOnline} busy={busy} onPress={() => (isOnline ? setConfirmOffline(true) : setOnline(true))} />
              ) : null}
            </View>
            {!vendor && meError ? (
              <View style={s.availabilityActions}>
                <PrimaryButton label="Retry" onPress={() => void refreshMe()} />
              </View>
            ) : null}
            {toggleError && !isOnline && showToggle ? (
              <View style={s.availabilityActions}>
                <PrimaryButton label="Try again" onPress={() => setOnline(true)} busy={pending === 'online'} />
              </View>
            ) : null}
            {toggleError && isOnline ? <Text style={s.inlineError}>{toggleError}</Text> : null}
            {paused ? (
              <Pressable onPress={() => router.push('/(vendor)/support')} accessibilityRole="link" style={s.link}>
                <Text style={s.linkText}>Contact GlowVai support</Text>
              </Pressable>
            ) : null}
          </Card>

          <SyncNotice />

          {firstLoadFailed ? (
            <Card>
              <StateView kind="error" title="We could not load your orders" message={sync.error || undefined} actionLabel="Retry" onAction={sync.retry} />
            </Card>
          ) : (
            <>
              {/* What needs doing */}
              <View style={s.tiles}>
                <Tile
                  label="Offers"
                  icon="notifications-outline"
                  count={groups.offers.length}
                  hint={groups.offers.length ? 'Waiting for you' : isOnline ? 'None right now' : 'Go online for offers'}
                  loading={loadingOrders}
                  highlight={groups.offers.length > 0}
                  onPress={() => openTab('offers')}
                />
                <Tile
                  label="Preparing"
                  icon="basket-outline"
                  count={groups.preparing.length}
                  hint={groups.preparing.length ? `Oldest placed ${formatAgo(groups.preparing[0].placedAt, now)}` : 'Nothing to pack'}
                  loading={loadingOrders}
                  onPress={() => openTab('preparing')}
                />
                <Tile
                  label="Packed"
                  icon="cube-outline"
                  count={groups.packed.length}
                  hint={groups.packed.length ? 'Awaiting pickup' : 'None waiting'}
                  loading={loadingOrders}
                  onPress={() => router.push('/(vendor)/ready-pickup')}
                />
              </View>

              <View style={[s.columns, isExpanded && s.columnsWide]}>
                <View style={[s.column, isExpanded && { flex: 7 }]}>
                  <View style={s.sectionHead}>
                    <Text style={ui.sectionTitle}>Next up</Text>
                    <Pressable onPress={() => router.push('/(vendor)/orders')} accessibilityRole="link" style={s.link}>
                      <Text style={s.linkText}>All orders</Text>
                    </Pressable>
                  </View>
                  {loadingOrders ? (
                    <Card><StateView kind="loading" title="Loading orders" /></Card>
                  ) : nextUp.length === 0 ? (
                    <Card>
                      <View style={s.empty}>
                        <Ionicons name="checkmark-done-outline" size={28} color={Colors.textMuted} />
                        <Text style={s.emptyTitle}>Nothing to do right now</Text>
                        <Text style={s.emptySub}>
                          {isOnline
                            ? 'New offers appear here while this app is open.'
                            : paused
                              ? 'New offers are paused. Orders you already have show here.'
                              : 'Your store is offline. Go online to get new offers.'}
                        </Text>
                      </View>
                    </Card>
                  ) : (
                    <View style={s.list}>
                      {nextUp.map(({ order, action }) => (
                        <OrderCard key={order.orderId} order={order} now={now} actionLabel={action} onPress={() => openOrder(order)} />
                      ))}
                    </View>
                  )}
                </View>

                <View style={[s.column, isExpanded && { flex: 5 }]}>
                  <Text style={[ui.sectionTitle, s.sectionHeadPlain]}>Today</Text>
                  <Card style={s.todayCard}>
                    <View style={s.todayCell}>
                      <Text style={s.todayLabel}>Orders</Text>
                      <Text style={s.todayValue}>{loadingOrders ? '–' : groups.todayCount}</Text>
                    </View>
                    <View style={[s.todayCell, s.todayCellBorder]}>
                      <Text style={s.todayLabel}>Items value</Text>
                      <Text style={s.todayValue}>{loadingOrders ? '–' : formatINR(groups.todayValue)}</Text>
                    </View>
                  </Card>

                  <Pressable
                    onPress={() => router.push({ pathname: '/(vendor)/catalog', params: { filter: 'low' } } as any)}
                    accessibilityRole="button"
                    accessibilityLabel="Open low stock in Inventory"
                    style={({ pressed }) => [ui.card, s.stockCard, pressed && { backgroundColor: Colors.surface }]}
                  >
                    <View style={[s.stockIcon, lowStock > 0 && { backgroundColor: Colors.warningLight }]}>
                      <Ionicons name="cube-outline" size={20} color={lowStock > 0 ? Colors.warningText : Colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.stockTitle}>
                        {!invStatus.hasLoaded
                          ? invStatus.state === 'error' ? 'Stock not loaded' : 'Checking stock'
                          : lowStock === 0
                            ? 'No products running low'
                            : `${lowStock} ${lowStock === 1 ? 'product' : 'products'} running low`}
                      </Text>
                      <Text style={ui.muted}>
                        {invStatus.state === 'error' && !invStatus.hasLoaded ? 'Tap to open Inventory and try again.' : `${LOW_STOCK_LEVEL} or fewer left on the shelf`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>

                  <View style={[ui.card, s.noteCard]}>
                    <Ionicons name="wallet-outline" size={20} color={Colors.textSecondary} />
                    <Text style={s.noteText}>
                      Earnings appear here after GlowVai sets up settlements for your store. Items value is what the items in your orders are worth, not your payout.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScreenShell>

      {/* Going offline: one confirmation so the switch is not flipped by accident. */}
      <Modal visible={confirmOffline} transparent animationType="fade" onRequestClose={() => setConfirmOffline(false)}>
        <View style={s.overlay}>
          <View style={s.dialog} accessibilityViewIsModal>
            <Text style={s.dialogTitle}>Go offline?</Text>
            <Text style={s.dialogSub}>You will stop getting new offers. Orders you already accepted stay open and you can finish them.</Text>
            <View style={s.dialogActions}>
              <SecondaryButton label="Stay online" onPress={() => setConfirmOffline(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Go offline" onPress={() => setOnline(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function dotStyle(tone: 'online' | 'warning' | 'danger' | 'neutral') {
  if (tone === 'online') return { backgroundColor: Colors.success };
  if (tone === 'warning') return { backgroundColor: Colors.warning };
  if (tone === 'danger') return { backgroundColor: Colors.danger };
  return { backgroundColor: Colors.textMuted };
}

function Toggle({ on, busy, onPress }: { on: boolean; busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="switch"
      accessibilityLabel="Store online"
      accessibilityState={{ checked: on, busy, disabled: busy }}
      hitSlop={8}
      style={[s.toggle, on ? s.toggleOn : s.toggleOff, busy && { opacity: 0.6 }]}
    >
      <Text style={[s.toggleText, on ? s.toggleTextOn : s.toggleTextOff]}>{on ? 'Online' : 'Offline'}</Text>
      <View style={[s.knob, on ? s.knobOn : s.knobOff]} />
    </Pressable>
  );
}

function Tile({
  label, icon, count, hint, onPress, loading, highlight,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  hint: string;
  onPress: () => void;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${loading ? 'loading' : count}. ${hint}`}
      style={({ pressed }) => [ui.card, s.tile, highlight && s.tileHighlight, pressed && { backgroundColor: Colors.surface }]}
    >
      <View style={s.tileTop}>
        <Ionicons name={icon} size={18} color={highlight ? Colors.primary : Colors.textSecondary} />
        <Text style={s.tileLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[s.tileCount, highlight && { color: Colors.primary }]}>{loading ? '–' : count}</Text>
      <Text style={s.tileHint} numberOfLines={2}>{loading ? 'Loading' : hint}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  stack: { gap: Spacing.lg },

  availability: { padding: Spacing.lg },
  availabilityOn: { borderColor: Colors.successBorder },
  availabilityWarn: { borderColor: Colors.warningBorder },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  availabilityActions: { marginTop: Spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  availabilityTitle: { fontFamily: FontFamily.semibold, fontSize: 17, lineHeight: 24, color: Colors.textPrimary },
  availabilitySub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, marginTop: 2 },
  inlineError: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.dangerText, marginTop: Spacing.sm },

  toggle: { width: 104, height: 44, borderRadius: BorderRadii.pill, justifyContent: 'center', paddingHorizontal: 4 },
  toggleOn: { backgroundColor: Colors.success },
  toggleOff: { backgroundColor: Colors.disabledBg },
  toggleText: { position: 'absolute', fontFamily: FontFamily.semibold, fontSize: 13 },
  toggleTextOn: { left: 14, color: Colors.textOnPrimary },
  toggleTextOff: { right: 12, color: Colors.textSecondary },
  knob: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },

  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: { flex: 1, minWidth: 0, padding: Spacing.md, gap: 2, minHeight: 116 },
  tileHighlight: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileLabel: { flexShrink: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  tileCount: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36, color: Colors.textPrimary, fontVariant: ['tabular-nums'], marginTop: 4 },
  tileHint: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textMuted },

  columns: { gap: Spacing.lg },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: Spacing.sm, minWidth: 0 },
  list: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeadPlain: { paddingVertical: 12 },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: Spacing.md },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  empty: { alignItems: 'center', gap: 6, paddingVertical: Spacing.lg },
  emptyTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 22, color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },

  todayCard: { flexDirection: 'row', padding: 0 },
  todayCell: { flex: 1, padding: Spacing.lg, gap: 2 },
  todayCellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  todayLabel: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.textMuted },
  todayValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  stockCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  stockIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stockTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: Colors.textPrimary },

  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginTop: Spacing.xs, backgroundColor: Colors.surface, shadowOpacity: 0, elevation: 0 },
  noteText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },

  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  dialog: { width: '100%', maxWidth: 440, backgroundColor: Colors.card, borderRadius: 16, padding: Spacing.xl, gap: Spacing.md },
  dialogTitle: { fontFamily: FontFamily.bold, fontSize: 19, lineHeight: 26, color: Colors.textPrimary },
  dialogSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  dialogActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
