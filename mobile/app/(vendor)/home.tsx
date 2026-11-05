/**
 * Store Command Center (PRD screen 09): is the store taking orders, and what needs doing now.
 * Availability is confirmed by the server before the screen says "Online". Counts come from
 * the order list; low stock and today's summary only appear when there is real data.
 * File: mobile/app/(vendor)/home.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import type { Order } from '../../src/store/useVendorStore';
import { useVendorSession } from '../../src/services/session';
import { vendorApi, earningsApi, inventoryApi } from '../../src/services/api';
import { setVendorStatus } from '../../src/services/socket';
import ScreenShell from '../../src/components/ScreenShell';
import {
  OrderCard,
  bucketOf,
  formatAgo,
  formatINR,
  friendlyError,
  isToday,
  useOrdersFeed,
  withTimeout,
} from '../../src/features/orders';
import { Banner, Card, PrimaryButton, SecondaryButton, StateView, ui } from '../../src/features/orders/ui';

const PAUSE_REASONS = ['Store busy', 'Restocking shelves', 'Staff break', 'Closing for the day'];
const LOW_STOCK_LEVEL = 5;

type Availability =
  | 'checking'
  | 'unknown'
  | 'going_online'
  | 'online'
  | 'going_offline'
  | 'offline'
  | 'failed_online';

export default function StoreCommandCenter() {
  const router = useRouter();
  const session = useVendorSession();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const isConnected = useVendorStore(s => s.isConnected);
  const setOnlineStatus = useVendorStore(s => s.setOnlineStatus);
  const inventory = useVendorStore(s => s.inventory);
  const setInventory = useVendorStore(s => s.setInventory);
  const earnings = useVendorStore(s => s.earnings);
  const setEarnings = useVendorStore(s => s.setEarnings);

  const feed = useOrdersFeed();
  const [now, setNow] = useState(() => Date.now());

  const [availability, setAvailability] = useState<Availability>('checking');
  const [availabilityError, setAvailabilityError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeArea, setStoreArea] = useState('');
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<string>(PAUSE_REASONS[0]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Store Command Center | GlowVai Vendor';
    }
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Store name and area: onboarding draft first, then the server profile.
  useEffect(() => {
    AsyncStorage.getItem('onb_step_a')
      .then(raw => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.storeName) setStoreName(String(parsed.storeName).trim());
        const area = [parsed?.locality, parsed?.city].map((x: any) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean).join(', ');
        if (area) setStoreArea(area);
      })
      .catch(() => {});
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res: any = await vendorApi.me();
      const v = res?.vendor;
      if (!v) {
        setAvailability('unknown');
        return;
      }
      if (v.shopName) setStoreName(prev => prev || String(v.shopName));
      const area = [v.locality, v.city].filter(Boolean).join(', ');
      if (area) setStoreArea(prev => prev || area);
      setOnlineStatus(!!v.isOnline);
      setAvailability(v.isOnline ? 'online' : 'offline');
    } catch (err) {
      setAvailability('unknown');
      setAvailabilityError(friendlyError(err));
    }
  }, [setOnlineStatus]);

  const loadExtras = useCallback(async () => {
    inventoryApi
      .getAll()
      .then((res: any) => {
        if (Array.isArray(res?.items)) setInventory(res.items);
        setInventoryLoaded(true);
      })
      .catch(() => {});
    if (session.vendorId) {
      earningsApi
        .getSummary(session.vendorId)
        .then((res: any) => res?.earnings && setEarnings(res.earnings))
        .catch(() => {});
    }
  }, [session.vendorId, setInventory, setEarnings]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (session.loaded) loadExtras();
  }, [session.loaded, loadExtras]);

  const handleRefresh = async () => {
    await Promise.all([feed.refresh(), loadProfile(), loadExtras()]);
  };

  // ── Availability ───────────────────────────────────────────────────────────
  const goOnline = async () => {
    setAvailability('going_online');
    setAvailabilityError('');
    try {
      if (!session.vendorId) throw Object.assign(new Error('no session'), { status: 401 });
      const res: any = await withTimeout(vendorApi.setStatus(session.vendorId, true), 15_000);
      const on = res?.isOnline !== false;
      setOnlineStatus(on);
      if (on) {
        setVendorStatus(session.vendorId, true);
        setAvailability('online');
      } else {
        setAvailability('failed_online');
      }
    } catch (err) {
      setAvailabilityError(friendlyError(err));
      setAvailability('failed_online');
    }
  };

  const goOffline = async () => {
    setPauseOpen(false);
    setAvailability('going_offline');
    setAvailabilityError('');
    try {
      if (!session.vendorId) throw Object.assign(new Error('no session'), { status: 401 });
      await withTimeout(vendorApi.setStatus(session.vendorId, false, pauseReason), 15_000);
      setVendorStatus(session.vendorId, false);
      setOnlineStatus(false);
      setAvailability('offline');
    } catch (err) {
      setAvailabilityError(`Could not go offline. ${friendlyError(err)}`);
      setAvailability('online');
    }
  };

  const isOn = availability === 'online' || availability === 'going_offline';
  const busy = availability === 'going_online' || availability === 'going_offline' || availability === 'checking';
  const onToggle = () => {
    if (busy) return;
    if (isOn) setPauseOpen(true);
    else goOnline();
  };

  const status = (() => {
    switch (availability) {
      case 'checking':
        return { title: 'Checking store status', sub: 'One moment.', tone: 'neutral' as const };
      case 'going_online':
        return { title: 'Going online...', sub: 'Checking with GlowVai that your store can take orders.', tone: 'neutral' as const };
      case 'going_offline':
        return { title: 'Going offline...', sub: 'Stopping new order offers.', tone: 'neutral' as const };
      case 'online':
        return isConnected
          ? { title: 'Online and accepting orders.', sub: 'New orders will ring on this device.', tone: 'online' as const }
          : { title: 'Temporarily unavailable.', sub: 'Reconnecting to GlowVai. New offers may be delayed until the connection is back.', tone: 'warning' as const };
      case 'offline':
        return { title: 'Offline.', sub: 'You will not get new orders. You can still finish the ones you have.', tone: 'neutral' as const };
      case 'failed_online':
        return { title: 'Unable to go online.', sub: availabilityError || 'GlowVai could not put your store online. Try again.', tone: 'danger' as const };
      default:
        return { title: 'Store status unknown', sub: availabilityError || 'We could not load your store status.', tone: 'danger' as const };
    }
  })();

  // ── Orders ─────────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const g = { incoming: [] as Order[], preparing: [] as Order[], ready: [] as Order[], today: 0 };
    for (const o of feed.orders) {
      const b = bucketOf(o.status);
      if (b === 'incoming') g.incoming.push(o);
      else if (b === 'preparing') g.preparing.push(o);
      else if (b === 'ready') g.ready.push(o);
      if (isToday(o.createdAt, now) && b !== 'other') g.today += 1;
    }
    const oldestFirst = (a: Order, b: Order) => (a.createdAt || 0) - (b.createdAt || 0);
    g.incoming.sort(oldestFirst);
    g.preparing.sort(oldestFirst);
    g.ready.sort(oldestFirst);
    return g;
  }, [feed.orders, now]);

  const nextUp = useMemo(
    () => [
      ...groups.incoming.map(o => ({ order: o, action: 'Review' })),
      ...groups.preparing.map(o => ({ order: o, action: 'Pick' })),
    ].slice(0, 3),
    [groups],
  );

  const lowStock = useMemo(
    () =>
      (Array.isArray(inventory) ? inventory : [])
        .filter(it => it.status !== 'deleted' && it.active !== false)
        .map(it => ({ ...it, left: it.availableStock ?? it.stockOnHand ?? it.stock ?? 0 }))
        .filter(it => it.left <= LOW_STOCK_LEVEL)
        .sort((a, b) => a.left - b.left)
        .slice(0, 4),
    [inventory],
  );

  const earningsToday = typeof earnings?.today?.earnings === 'number' ? earnings.today.earnings : undefined;
  const showToday = feed.hasLoaded && (groups.today > 0 || earningsToday !== undefined);

  const openTab = (tab: string) => router.push({ pathname: '/(vendor)/orders', params: { tab } } as any);
  const openOrder = (o: Order) => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: o.orderId } } as any);

  const firstLoadFailed = !feed.hasLoaded && feed.state === 'error';

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: storeName || 'Your store',
          subtitle: storeArea || 'Store Command Center',
          showBell: true,
        }}
        backgroundColor={Colors.surface}
        refreshControl={
          <RefreshControl refreshing={feed.refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        contentContainerStyle={s.scroll}
      >
        <View style={s.stack}>
          {/* Availability */}
          <Card style={[s.availability, status.tone === 'online' && s.availabilityOn]}>
            <View style={s.availabilityRow}>
              <View style={[s.dot, dotStyle(status.tone)]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.availabilityTitle} accessibilityLiveRegion="polite">{status.title}</Text>
                <Text style={s.availabilitySub}>{status.sub}</Text>
              </View>
              <BigToggle on={isOn} busy={busy} onPress={onToggle} disabled={availability === 'unknown'} />
            </View>
            {(availability === 'failed_online' || availability === 'unknown') && (
              <View style={s.availabilityActions}>
                <PrimaryButton
                  label={availability === 'unknown' ? 'Retry' : 'Try again'}
                  onPress={availability === 'unknown' ? () => { setAvailability('checking'); loadProfile(); } : goOnline}
                />
              </View>
            )}
            {availability === 'online' && !!availabilityError && (
              <View style={{ marginTop: Spacing.md }}>
                <Banner tone="danger" message={availabilityError} />
              </View>
            )}
          </Card>

          {firstLoadFailed ? (
            <Card>
              <StateView
                kind="error"
                title="We could not load your orders"
                message={feed.error}
                actionLabel="Retry"
                onAction={feed.refresh}
              />
            </Card>
          ) : (
            <>
              {feed.state === 'error' && feed.hasLoaded && (
                <Banner tone="warning" title="Showing the last loaded orders" message={feed.error} actionLabel="Retry" onAction={feed.refresh} />
              )}

              {/* What needs doing */}
              <View style={s.tiles}>
                <Tile
                  label="Incoming"
                  icon="notifications-outline"
                  count={groups.incoming.length}
                  hint={groups.incoming.length ? 'Waiting for you to accept' : 'No new offers'}
                  loading={!feed.hasLoaded}
                  highlight={groups.incoming.length > 0}
                  onPress={() => openTab('incoming')}
                />
                <Tile
                  label="To pack"
                  icon="basket-outline"
                  count={groups.preparing.length}
                  hint={groups.preparing.length ? `Oldest ${formatAgo(groups.preparing[0].acceptedAt || groups.preparing[0].createdAt, now).toLowerCase()}` : 'Nothing to pack'}
                  loading={!feed.hasLoaded}
                  onPress={() => openTab('preparing')}
                />
                <Tile
                  label="Pickup"
                  icon="bicycle-outline"
                  count={groups.ready.length}
                  hint={groups.ready.length ? 'Packed, awaiting rider' : 'None awaiting rider'}
                  loading={!feed.hasLoaded}
                  onPress={() => openTab('ready')}
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
                  {!feed.hasLoaded ? (
                    <Card><StateView kind="loading" title="Loading orders" /></Card>
                  ) : nextUp.length === 0 ? (
                    <Card>
                      <View style={s.empty}>
                        <Ionicons name="checkmark-done-outline" size={28} color={Colors.textMuted} />
                        <Text style={s.emptyTitle}>Nothing to do right now</Text>
                        <Text style={s.emptySub}>
                          {isOn
                            ? 'New orders ring on this device and show here.'
                            : 'Your store is offline. Go online to receive new orders.'}
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

                {(showToday || lowStock.length > 0) && (
                  <View style={[s.column, isExpanded && { flex: 5 }]}>
                    {showToday && (
                      <>
                        <Text style={[ui.sectionTitle, s.sectionHeadPlain]}>Today</Text>
                        <Card style={s.todayCard}>
                          <View style={s.todayCell}>
                            <Text style={s.todayLabel}>Orders</Text>
                            <Text style={s.todayValue}>{groups.today}</Text>
                          </View>
                          {earningsToday !== undefined && (
                            <Pressable
                              onPress={() => router.push('/(vendor)/earnings')}
                              accessibilityRole="button"
                              accessibilityLabel={`Earnings today ${formatINR(earningsToday)}. Open earnings`}
                              style={[s.todayCell, s.todayCellBorder]}
                            >
                              <Text style={s.todayLabel}>Earnings</Text>
                              <Text style={s.todayValue}>{formatINR(earningsToday)}</Text>
                            </Pressable>
                          )}
                        </Card>
                      </>
                    )}

                    {inventoryLoaded && lowStock.length > 0 && (
                      <>
                        <View style={s.sectionHead}>
                          <Text style={ui.sectionTitle}>Low stock</Text>
                          <Pressable onPress={() => router.push('/(vendor)/catalog')} accessibilityRole="link" style={s.link}>
                            <Text style={s.linkText}>Catalog</Text>
                          </Pressable>
                        </View>
                        <Card style={{ paddingVertical: Spacing.xs }}>
                          {lowStock.map((it, idx) => (
                            <View key={it.productId} style={[s.stockRow, idx > 0 && ui.divider]}>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={s.stockName} numberOfLines={1}>{it.name}</Text>
                                {!!it.bin && <Text style={ui.muted}>Bin {it.bin}</Text>}
                              </View>
                              <Text style={[s.stockLeft, { color: it.left === 0 ? Colors.danger : Colors.warning }]}>
                                {it.left === 0 ? 'Out of stock' : `${it.left} left`}
                              </Text>
                            </View>
                          ))}
                        </Card>
                      </>
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScreenShell>


      {/* Going offline: a reason helps GlowVai support, and keeps the switch from being flipped by accident. */}
      <Modal visible={pauseOpen} transparent animationType="fade" onRequestClose={() => setPauseOpen(false)}>
        <View style={s.overlay}>
          <View style={s.dialog} accessibilityViewIsModal>
            <Text style={s.dialogTitle}>Go offline?</Text>
            <Text style={s.dialogSub}>You will stop getting new orders. Orders you already accepted stay open.</Text>
            <View accessibilityRole="radiogroup" style={{ gap: Spacing.sm }}>
              {PAUSE_REASONS.map(r => {
                const selected = pauseReason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setPauseReason(r)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[s.reason, selected && s.reasonOn]}
                  >
                    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? Colors.primary : Colors.textMuted} />
                    <Text style={[s.reasonText, selected && s.reasonTextOn]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.dialogActions}>
              <SecondaryButton label="Stay online" onPress={() => setPauseOpen(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Go offline" onPress={goOffline} style={{ flex: 1 }} />
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

function BigToggle({ on, busy, disabled, onPress }: { on: boolean; busy: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="switch"
      accessibilityLabel="Store online"
      accessibilityState={{ checked: on, busy, disabled: busy || !!disabled }}
      hitSlop={8}
      style={[s.toggle, on ? s.toggleOn : s.toggleOff, (busy || disabled) && { opacity: 0.6 }]}
    >
      <Text style={[s.toggleText, on ? s.toggleTextOn : s.toggleTextOff]}>{on ? 'ONLINE' : 'OFFLINE'}</Text>
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
        <Ionicons name={icon} size={20} color={highlight ? Colors.primary : Colors.textSecondary} />
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
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  availabilityActions: { marginTop: Spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  availabilityTitle: { fontFamily: FontFamily.semibold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary },
  availabilitySub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, marginTop: 2 },

  toggle: {
    width: 112,
    height: 48,
    borderRadius: BorderRadii.pill,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  toggleOn: { backgroundColor: Colors.success },
  toggleOff: { backgroundColor: Colors.border },
  toggleText: { position: 'absolute', fontFamily: FontFamily.bold, fontSize: 12, letterSpacing: 0.6 },
  toggleTextOn: { left: 14, color: Colors.background },
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
  tile: { flex: 1, minWidth: 0, padding: Spacing.md, gap: 2, minHeight: 120 },
  tileHighlight: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileLabel: { flexShrink: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  tileCount: { fontFamily: FontFamily.bold, fontSize: 30, lineHeight: 38, color: Colors.textPrimary, fontVariant: ['tabular-nums'], marginTop: 4 },
  tileHint: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textMuted },

  columns: { gap: Spacing.lg },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: Spacing.sm, minWidth: 0 },
  list: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeadPlain: { paddingVertical: 12 },
  link: { minHeight: 44, justifyContent: 'center', paddingLeft: Spacing.md },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  empty: { alignItems: 'center', gap: 6, paddingVertical: Spacing.lg },
  emptyTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 22, color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },

  todayCard: { flexDirection: 'row', padding: 0 },
  todayCell: { flex: 1, padding: Spacing.lg, gap: 2, minHeight: 44 },
  todayCellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  todayLabel: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.textMuted },
  todayValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingVertical: Spacing.sm },
  stockName: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  stockLeft: { fontFamily: FontFamily.semibold, fontSize: 13 },

  overlay: { flex: 1, backgroundColor: `${Colors.textPrimary}66`, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  dialog: { width: '100%', maxWidth: 440, backgroundColor: Colors.card, borderRadius: 16, padding: Spacing.xl, gap: Spacing.md },
  dialogTitle: { fontFamily: FontFamily.bold, fontSize: 19, lineHeight: 26, color: Colors.textPrimary },
  dialogSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  dialogActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonOn: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  reasonText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary },
  reasonTextOn: { fontFamily: FontFamily.semibold, color: Colors.primary },
});
