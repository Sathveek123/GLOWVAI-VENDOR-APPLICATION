/**
 * Order detail and picking checklist.
 * Lists the order's real items for picking. Picks are saved on this device only.
 * The order comes from the store, or from the API when it is not in the store yet.
 * File: mobile/app/(vendor)/order-detail.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import type { Order } from '../../src/store/useVendorStore';
import { useVendorSession } from '../../src/services/session';
import { ordersApi } from '../../src/services/api';
import ScreenShell from '../../src/components/ScreenShell';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'New offer',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready for pickup',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const formatINR = (value: number | undefined | null) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

/**
 * Reads one order: from the store when it is there, otherwise from the API.
 * Returns a state the screen can show as loading, error, not found, or ready.
 */
function useOrderRecord(orderId: string | undefined) {
  const storeOrder = useVendorStore(st => st.orders.find(o => o.orderId === orderId));
  const [fetched, setFetched] = useState<Order | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setState('missing');
      return;
    }
    if (storeOrder) {
      setState('ready');
      return;
    }
    let cancelled = false;
    setState('loading');
    ordersApi
      .getById(orderId)
      .then((res: any) => {
        if (cancelled) return;
        if (res?.order) {
          setFetched(res.order);
          setState('ready');
        } else {
          setState('missing');
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.status === 404) {
          setState('missing');
        } else {
          setErrorMessage(err?.message || 'We could not reach the server.');
          setState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, attempt, !!storeOrder]);

  return {
    order: storeOrder ?? fetched,
    state: storeOrder ? 'ready' : state,
    errorMessage,
    retry: () => setAttempt(a => a + 1),
  };
}

/** Picks are per order and per device, so a half-picked order survives leaving the screen. */
const pickKey = (orderId: string) => `pick_state_${orderId}`;

interface PickState {
  picked: Record<number, boolean>;
  unavailable: Record<number, boolean>;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const vendorSession = useVendorSession();
  const VENDOR_ID = vendorSession.vendorId || '';
  const { order, state, errorMessage: loadError, retry } = useOrderRecord(orderId);
  const updateOrder = useVendorStore(st => st.updateOrder);

  const [pick, setPick] = useState<PickState>({ picked: {}, unavailable: {} });
  const [pickLoaded, setPickLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Order #${orderId || ''} | GlowVAI Vendor`;
    }
  }, [orderId]);

  // Restore saved picks for this order.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    AsyncStorage.getItem(pickKey(orderId))
      .then(raw => {
        if (cancelled) return;
        if (raw) {
          try {
            setPick(JSON.parse(raw));
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPickLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const updatePick = (next: PickState) => {
    setPick(next);
    if (orderId) AsyncStorage.setItem(pickKey(orderId), JSON.stringify(next)).catch(() => {});
  };

  const togglePicked = (idx: number) => {
    if (pick.unavailable[idx]) return;
    updatePick({ ...pick, picked: { ...pick.picked, [idx]: !pick.picked[idx] } });
  };

  const toggleUnavailable = (idx: number) => {
    const isUnavailable = !pick.unavailable[idx];
    updatePick({
      picked: { ...pick.picked, [idx]: false },
      unavailable: { ...pick.unavailable, [idx]: isUnavailable },
    });
  };

  const items = useMemo(() => order?.items ?? [], [order]);
  const q = search.trim().toLowerCase();
  const visibleItems = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => !q || item.productName?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q));

  const handledCount = items.reduce((n, _, idx) => n + (pick.picked[idx] || pick.unavailable[idx] ? 1 : 0), 0);
  const unavailableCount = items.reduce((n, _, idx) => n + (pick.unavailable[idx] ? 1 : 0), 0);
  const allHandled = items.length > 0 && handledCount === items.length;
  const progress = items.length ? Math.round((handledCount / items.length) * 100) : 0;

  const handleAccept = async () => {
    if (!order || accepting) return;
    setAccepting(true);
    setActionError('');
    try {
      await ordersApi.accept(order.orderId, VENDOR_ID);
      updateOrder(order.orderId, { status: 'ACCEPTED', vendorId: VENDOR_ID });
    } catch (err: any) {
      setActionError(err?.message || 'Could not accept this order. Try again.');
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading, missing and error states ──────────────────────────────────────
  if (state === 'loading') {
    return (
      <ScreenShell header={{ title: 'Order', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.mutedText}>Loading order</Text>
        </View>
      </ScreenShell>
    );
  }

  if (state === 'missing' || !order) {
    return (
      <ScreenShell header={{ title: 'Order', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <Ionicons name="search-outline" size={32} color={Colors.textSubtle} />
          <Text style={s.stateTitle}>Order not found</Text>
          <Text style={s.stateSub}>It may have been removed, or the link is out of date.</Text>
          <Pressable onPress={() => router.replace('/(vendor)/orders')} accessibilityRole="button" style={({ pressed }) => [s.primaryBtn, s.stateBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.primaryBtnText}>Back to orders</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  if (state === 'error') {
    return (
      <ScreenShell header={{ title: `Order #${orderId}`, showBack: true }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
          <Text style={s.stateTitle}>We could not load this order</Text>
          <Text style={s.stateSub}>{loadError} Check your connection and try again.</Text>
          <Pressable onPress={retry} accessibilityRole="button" style={({ pressed }) => [s.primaryBtn, s.stateBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.primaryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const isNew = order.status === 'PENDING';
  const isPicking = order.status === 'ACCEPTED' || order.status === 'PREPARING';
  const isReady = order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP';
  const pricing = order.pricing;

  let ctaLabel = '';
  let ctaDisabled = false;
  let ctaHelper = '';
  let ctaAction: () => void = () => {};
  if (isNew) {
    ctaLabel = accepting ? 'Accepting…' : 'Accept order';
    ctaDisabled = accepting;
    ctaAction = handleAccept;
  } else if (isPicking) {
    ctaLabel = 'Start packing';
    ctaDisabled = !allHandled || !pickLoaded;
    ctaHelper = allHandled ? '' : `Pick or mark each item first. ${items.length - handledCount} left.`;
    ctaAction = () => router.push({ pathname: '/(vendor)/pack-order', params: { orderId: order.orderId } } as any);
  } else if (isReady) {
    ctaLabel = 'Go to rider handover';
    ctaAction = () => router.push({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } } as any);
  }

  const showFooter = !!ctaLabel;

  const checklist = (
    <View style={s.card}>
      <View style={s.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Items ({items.length})</Text>
          <Text style={s.mutedText}>
            {pickLoaded ? `${handledCount} of ${items.length} handled. Saved on this device.` : 'Loading picks'}
          </Text>
        </View>
      </View>

      {items.length > 3 && (
        <TextInput
          style={s.searchInput}
          placeholder="Find an item"
          placeholderTextColor={Colors.textSubtle}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Find an item"
        />
      )}

      <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }}>
        <View style={[s.progressFill, { width: `${progress}%` }]} />
      </View>

      {items.length === 0 ? (
        <View style={s.emptyBlock}>
          <Ionicons name="cube-outline" size={28} color={Colors.textSubtle} />
          <Text style={s.stateTitle}>No items on this order</Text>
        </View>
      ) : visibleItems.length === 0 ? (
        <Text style={[s.mutedText, { paddingVertical: Spacing.lg }]}>No items match “{search}”.</Text>
      ) : (
        visibleItems.map(({ item, idx }, pos) => {
          const isPicked = !!pick.picked[idx];
          const isUnavailable = !!pick.unavailable[idx];
          return (
            <View key={`${item.sku ?? item.productName}-${idx}`} style={[s.itemRow, pos > 0 && s.rowDivider]}>
              <Pressable
                onPress={() => togglePicked(idx)}
                disabled={isUnavailable || !isPicking}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isPicked, disabled: isUnavailable || !isPicking }}
                accessibilityLabel={`Picked: ${item.productName}`}
                style={s.checkHit}
              >
                <View style={[s.checkbox, isPicked && s.checkboxOn, isUnavailable && s.checkboxUnavailable]}>
                  {isPicked && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  {isUnavailable && <Ionicons name="remove" size={18} color={Colors.warning} />}
                </View>
              </Pressable>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.itemName, isPicked && s.itemNamePicked]} numberOfLines={2}>{item.productName}</Text>
                <Text style={s.mutedText}>
                  Qty {item.quantity}
                  {item.sku ? ` • SKU ${item.sku}` : ''}
                  {` • ${formatINR(item.price * item.quantity)}`}
                </Text>
                {isUnavailable && (
                  <Text style={s.unavailableNote}>Marked unavailable. Contact support before packing.</Text>
                )}
              </View>

              {isPicking && (
                <Pressable
                  onPress={() => toggleUnavailable(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={isUnavailable ? `Undo unavailable for ${item.productName}` : `Mark ${item.productName} unavailable`}
                  style={({ pressed }) => [s.smallBtn, isUnavailable && s.smallBtnOn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[s.smallBtnText, isUnavailable && s.smallBtnTextOn]}>
                    {isUnavailable ? 'Undo' : 'Unavailable'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      {unavailableCount > 0 && (
        <Pressable onPress={() => router.push('/(vendor)/support' as any)} accessibilityRole="link" accessibilityLabel="Contact support about unavailable items" style={s.linkHit}>
          <Text style={s.linkText}>Contact support about unavailable items</Text>
        </Pressable>
      )}
    </View>
  );

  const summary = (
    <>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Customer</Text>
        <Text style={s.customerName}>{order.customerName || 'Name not shared'}</Text>
        {!!order.shippingAddress?.fullAddress && (
          <Text style={s.mutedText}>{order.shippingAddress.fullAddress}</Text>
        )}
        <Text style={s.privacyNote}>The customer's phone number is not shown in the vendor app.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Payment</Text>
        <View style={s.totalRow}><Text style={s.mutedText}>Subtotal</Text><Text style={s.totalVal}>{formatINR(pricing?.subtotal)}</Text></View>
        {!!pricing?.discount && (
          <View style={s.totalRow}><Text style={s.mutedText}>Discount</Text><Text style={s.totalVal}>-{formatINR(pricing.discount)}</Text></View>
        )}
        <View style={s.totalRow}><Text style={s.mutedText}>Delivery fee</Text><Text style={s.totalVal}>{formatINR(pricing?.deliveryFee)}</Text></View>
        <View style={[s.totalRow, s.grandRow]}>
          <Text style={s.grandLabel}>Order total</Text>
          <Text style={s.grandVal}>{formatINR(pricing?.grandTotal)}</Text>
        </View>
        {!!order.payment?.method && (
          <Text style={s.mutedText}>
            Paid by {order.payment.method}{order.payment.status ? ` • ${order.payment.status.toLowerCase()}` : ''}
          </Text>
        )}
      </View>

      <Pressable onPress={() => router.push('/(vendor)/support' as any)} accessibilityRole="link" accessibilityLabel="Report an issue with this order" style={s.linkHit}>
        <Text style={s.linkText}>Report an issue with this order</Text>
      </Pressable>
    </>
  );

  return (
    <ScreenShell
      header={{
        title: `Order #${order.orderId}`,
        subtitle: statusLabel,
        showBack: true,
      }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scrollContent}
      stickyFooter={showFooter ? (
        <View style={s.footer}>
          {!!actionError && (
            <View style={s.bannerError} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={s.bannerErrorText}>{actionError}</Text>
            </View>
          )}
          {!!ctaHelper && <Text style={s.ctaHelper}>{ctaHelper}</Text>}
          <Pressable
            onPress={ctaAction}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            accessibilityState={{ disabled: ctaDisabled, busy: accepting }}
            style={({ pressed }) => [s.primaryBtn, ctaDisabled && s.primaryBtnDisabled, pressed && !ctaDisabled && { opacity: 0.85 }]}
          >
            <Text style={[s.primaryBtnText, ctaDisabled && s.primaryBtnTextDisabled]}>{ctaLabel}</Text>
          </Pressable>
        </View>
      ) : undefined}
    >
      {isExpanded ? (
        <View style={s.wideRow}>
          <View style={s.wideLeft}>{checklist}</View>
          <View style={s.wideRight}>{summary}</View>
        </View>
      ) : (
        <View style={s.stack}>
          {!isNew && !isPicking && !isReady && (
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={s.infoText}>This order is {statusLabel.toLowerCase()}. There is nothing left to pick.</Text>
            </View>
          )}
          {checklist}
          {summary}
        </View>
      )}
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  stack: { gap: Spacing.lg },
  wideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  wideLeft: { flex: 7, minWidth: 0 },
  wideRight: { flex: 5, minWidth: 0, gap: Spacing.lg },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  stateTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: Colors.textPrimary, textAlign: 'center' },
  stateSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  stateBtn: { alignSelf: 'stretch', minWidth: 180, marginTop: Spacing.md, flex: 0 },

  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  mutedText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  searchInput: {
    minHeight: 44, borderRadius: BorderRadii.input, borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary,
  },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  checkHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.inputBorder,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkboxUnavailable: { backgroundColor: Colors.warningLight, borderColor: Colors.warning },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  itemNamePicked: { color: Colors.textSubtle, textDecorationLine: 'line-through' },
  unavailableNote: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 16, color: Colors.warning, marginTop: 4 },
  smallBtn: {
    minHeight: 44, paddingHorizontal: 12, borderRadius: BorderRadii.input, borderWidth: 1,
    borderColor: Colors.border, justifyContent: 'center',
  },
  smallBtnOn: { borderColor: Colors.warningBorder, backgroundColor: Colors.warningLight },
  smallBtnText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSecondary },
  smallBtnTextOn: { color: Colors.warning },
  emptyBlock: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },

  customerName: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  privacyNote: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textSubtle, marginTop: 4 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  totalVal: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  grandRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 6, paddingTop: 8 },
  grandLabel: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textPrimary },
  grandVal: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary },

  linkHit: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
    borderRadius: BorderRadii.card, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  infoText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: '#1E3A8A' },

  footer: { gap: Spacing.sm },
  ctaHelper: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSubtle, textAlign: 'center' },
  bannerError: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: BorderRadii.card,
  },
  bannerErrorText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: '#7F1D1D' },
  primaryBtn: {
    minHeight: 48, borderRadius: BorderRadii.input, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFFFFF' },
  primaryBtnTextDisabled: { color: Colors.textSubtle },
});
