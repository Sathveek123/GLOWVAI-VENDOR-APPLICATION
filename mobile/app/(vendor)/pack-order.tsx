/**
 * Packing: check each item off, confirm the tamper-evident seal, then mark the order ready for the rider.
 * Items come from the real order. Checks are saved on this device until the order is packed.
 * File: mobile/app/(vendor)/pack-order.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
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

/** Reads one order: from the store when it is there, otherwise from the API. */
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

const packKey = (orderId: string) => `pack_state_${orderId}`;

interface PackState {
  verified: Record<number, boolean>;
  sealConfirmed: boolean;
}

export default function PackOrderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const vendorSession = useVendorSession();
  const VENDOR_ID = vendorSession.vendorId || '';
  const { order, state, errorMessage: loadError, retry } = useOrderRecord(orderId);
  const updateOrder = useVendorStore(st => st.updateOrder);

  const [pack, setPack] = useState<PackState>({ verified: {}, sealConfirmed: false });
  const [packLoaded, setPackLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Packing #${orderId || ''} | GlowVAI Vendor`;
    }
  }, [orderId]);

  // Restore saved checks for this order.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    AsyncStorage.getItem(packKey(orderId))
      .then(raw => {
        if (cancelled || !raw) return;
        try {
          setPack(JSON.parse(raw));
        } catch (_) {}
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPackLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const updatePack = (next: PackState) => {
    setPack(next);
    if (orderId) AsyncStorage.setItem(packKey(orderId), JSON.stringify(next)).catch(() => {});
  };

  const toggleVerified = (idx: number) => {
    setSubmitError('');
    updatePack({ ...pack, verified: { ...pack.verified, [idx]: !pack.verified[idx] } });
  };

  const toggleSeal = () => {
    setSubmitError('');
    updatePack({ ...pack, sealConfirmed: !pack.sealConfirmed });
  };

  const items = useMemo(() => order?.items ?? [], [order]);
  const verifiedCount = items.reduce((n, _, idx) => n + (pack.verified[idx] ? 1 : 0), 0);
  const allVerified = items.length > 0 && verifiedCount === items.length;
  const canSubmit = allVerified && pack.sealConfirmed && packLoaded;

  const handleMarkReady = async () => {
    if (!order || submitting || !canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await ordersApi.pack(order.orderId, VENDOR_ID, order.pickupBay || undefined);
      updateOrder(order.orderId, { status: 'PACKED', packedAt: Date.now() });
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not mark this order ready. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading, missing and error states ──────────────────────────────────────
  if (state === 'loading') {
    return (
      <ScreenShell header={{ title: 'Packing', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.mutedText}>Loading order</Text>
        </View>
      </ScreenShell>
    );
  }

  if (state === 'missing' || !order) {
    return (
      <ScreenShell header={{ title: 'Packing', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
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
  const isPacking = order.status === 'ACCEPTED' || order.status === 'PREPARING';
  const isPacked = order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP';

  let footer: React.ReactNode = undefined;
  if (isPacking) {
    const helper = !allVerified
      ? `Check every item first. ${items.length - verifiedCount} left.`
      : !pack.sealConfirmed
      ? 'Confirm the tamper-evident seal to continue.'
      : '';
    footer = (
      <View style={s.footer}>
        {!!submitError && (
          <View style={s.bannerError} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={s.bannerErrorText}>{submitError}</Text>
          </View>
        )}
        {!!helper && <Text style={s.ctaHelper}>{helper}</Text>}
        <Pressable
          onPress={handleMarkReady}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Mark order ready for rider"
          accessibilityState={{ disabled: !canSubmit || submitting, busy: submitting }}
          style={({ pressed }) => [s.primaryBtn, (!canSubmit || submitting) && s.primaryBtnDisabled, pressed && canSubmit && { opacity: 0.85 }]}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={[s.primaryBtnText, (!canSubmit) && s.primaryBtnTextDisabled]}>Mark ready for rider</Text>}
        </Pressable>
      </View>
    );
  } else if (isPacked) {
    footer = (
      <View style={s.footer}>
        <Pressable
          onPress={() => router.push({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } } as any)}
          accessibilityRole="button"
          accessibilityLabel="Go to rider handover"
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.primaryBtnText}>Go to rider handover</Text>
        </Pressable>
      </View>
    );
  } else if (order.status === 'PENDING') {
    footer = (
      <View style={s.footer}>
        <Pressable
          onPress={() => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: order.orderId } } as any)}
          accessibilityRole="button"
          accessibilityLabel="Open order to accept it"
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.primaryBtnText}>Open order to accept</Text>
        </Pressable>
      </View>
    );
  }

  const stepsDone = [allVerified, pack.sealConfirmed, isPacked];

  const verifyList = (
    <View style={s.card}>
      <View style={s.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Items to verify</Text>
          <Text style={s.mutedText}>{verifiedCount} of {items.length} checked. Saved on this device.</Text>
        </View>
      </View>

      <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: items.length, now: verifiedCount }}>
        <View style={[s.progressFill, { width: `${items.length ? (verifiedCount / items.length) * 100 : 0}%` }]} />
      </View>

      {items.length === 0 ? (
        <View style={s.emptyBlock}>
          <Ionicons name="cube-outline" size={28} color={Colors.textSubtle} />
          <Text style={s.stateTitle}>No items on this order</Text>
        </View>
      ) : (
        items.map((item, idx) => {
          const checked = !!pack.verified[idx];
          return (
            <Pressable
              key={`${item.sku ?? item.productName}-${idx}`}
              onPress={() => isPacking && toggleVerified(idx)}
              disabled={!isPacking}
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled: !isPacking }}
              accessibilityLabel={`${item.productName}, quantity ${item.quantity}`}
              style={({ pressed }) => [s.itemRow, idx > 0 && s.rowDivider, pressed && isPacking && { opacity: 0.85 }]}
            >
              <View style={[s.checkbox, checked && s.checkboxOn]}>
                {checked && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.itemName, checked && s.itemNameChecked]} numberOfLines={2}>{item.productName}</Text>
                <Text style={s.mutedText}>
                  {item.sku ? `SKU ${item.sku} • ` : ''}{formatINR(item.price * item.quantity)}
                </Text>
              </View>
              <View style={s.qtyBadge}>
                <Text style={s.qtyText}>x{item.quantity}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const sealCard = (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Seal and handover</Text>
      <Pressable
        onPress={() => isPacking && toggleSeal()}
        disabled={!isPacking}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: pack.sealConfirmed, disabled: !isPacking }}
        accessibilityLabel="Order is sealed in tamper-evident packaging"
        style={({ pressed }) => [s.sealRow, pressed && isPacking && { opacity: 0.85 }]}
      >
        <View style={[s.checkbox, pack.sealConfirmed && s.checkboxOn]}>
          {pack.sealConfirmed && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </View>
        <Text style={s.sealText}>This order is sealed in tamper-evident packaging.</Text>
      </Pressable>

      <View style={s.factRow}>
        <Text style={s.mutedText}>Pickup bay</Text>
        <Text style={s.factVal}>{order.pickupBay || 'Not assigned yet'}</Text>
      </View>
      <View style={s.factRow}>
        <Text style={s.mutedText}>Status</Text>
        <Text style={s.factVal}>{statusLabel}</Text>
      </View>

      {isPacked && (
        <View style={s.successBox} accessibilityRole="alert">
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={s.successText}>Packed. Hand it to the rider at the pickup bay.</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenShell
      header={{ title: `Order #${order.orderId}`, subtitle: statusLabel, showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scrollContent}
      stickyFooter={footer}
    >
      {!isPacking && !isPacked && (
        <View style={[s.infoBox, { marginBottom: Spacing.lg }]}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={s.infoText}>
            {order.status === 'PENDING'
              ? 'Accept this order before packing it.'
              : `This order is ${statusLabel.toLowerCase()}, so there is nothing to pack.`}
          </Text>
        </View>
      )}

      {isExpanded ? (
        <View style={s.wideRow}>
          <View style={s.wideLeft}>{verifyList}</View>
          <View style={s.wideRight}>{sealCard}</View>
        </View>
      ) : (
        <View style={s.stack}>
          {isPacking && (
            <View style={s.stepsRow} accessibilityLabel="Packing steps">
              {['Check items', 'Seal', 'Ready'].map((label, i) => (
                <View key={label} style={s.step}>
                  <View style={[s.stepDot, stepsDone[i] && s.stepDotDone]}>
                    {stepsDone[i]
                      ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      : <Text style={s.stepNum}>{i + 1}</Text>}
                  </View>
                  <Text style={[s.stepLabel, stepsDone[i] && s.stepLabelDone]}>{label}</Text>
                </View>
              ))}
            </View>
          )}
          {verifyList}
          {sealCard}
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
  wideRight: { flex: 5, minWidth: 0 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  stateTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: Colors.textPrimary, textAlign: 'center' },
  stateSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  stateBtn: { alignSelf: 'stretch', minWidth: 180, marginTop: Spacing.md, flex: 0 },

  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm },
  step: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.inputBorder,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepNum: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.textSecondary },
  stepLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSubtle },
  stepLabelDone: { color: Colors.success },

  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  mutedText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.success },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.inputBorder,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  itemNameChecked: { color: Colors.textSubtle },
  qtyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadii.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  qtyText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSecondary },
  emptyBlock: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },

  sealRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, paddingVertical: 6 },
  sealText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  factVal: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
    borderRadius: BorderRadii.input, backgroundColor: Colors.successLight, borderWidth: 1, borderColor: Colors.successBorder,
  },
  successText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: '#14532D' },
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
