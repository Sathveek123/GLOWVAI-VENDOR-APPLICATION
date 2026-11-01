/**
 * Rider handover: the rider gives the 4-digit pickup PIN, the vendor enters it and confirms the handover.
 * Only the real order is shown. No rider details are invented: the order record does not carry them yet.
 * File: mobile/app/(vendor)/ready-pickup.tsx
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
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import type { Order } from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import ScreenShell from '../../src/components/ScreenShell';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'New offer',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready for pickup',
  DISPATCHED: 'Handed over',
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

export default function ReadyPickupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, state, errorMessage: loadError, retry } = useOrderRecord(orderId);
  const updateOrder = useVendorStore(st => st.updateOrder);

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Rider handover #${orderId || ''} | GlowVAI Vendor`;
    }
  }, [orderId]);

  // The PIN the rider must give. It comes only from the order record, never from a constant.
  const pickupCode = order?.otp || '';
  const items = useMemo(() => order?.items ?? [], [order]);
  const itemCount = items.reduce((n, it) => n + (it.quantity || 0), 0);

  const isReadyToHand = !!order && (order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP');
  const alreadyDispatched = !!order && order.status === 'DISPATCHED';
  const canConfirm = isReadyToHand && !!pickupCode && pin.length === 4 && !submitting;

  const handleConfirm = async () => {
    if (!order || !canConfirm) return;
    if (pin !== pickupCode) {
      setSubmitError('The PIN does not match this order. Ask the rider to check it again.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await ordersApi.dispatch(order.orderId, { otp: pin });
      updateOrder(order.orderId, { status: 'DISPATCHED', dispatchedAt: Date.now() });
      setHandedOver(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Handover could not be confirmed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading, missing and error states ──────────────────────────────────────
  if (state === 'loading') {
    return (
      <ScreenShell header={{ title: 'Rider handover', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.mutedText}>Loading order</Text>
        </View>
      </ScreenShell>
    );
  }

  if (state === 'missing' || !order) {
    return (
      <ScreenShell header={{ title: 'Rider handover', showBack: true }} scroll={false} backgroundColor={Colors.surface}>
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

  // ── Handover confirmed ─────────────────────────────────────────────────────
  if (handedOver || alreadyDispatched) {
    return (
      <ScreenShell header={{ title: `Order #${order.orderId}`, showBack: false }} scroll={false} backgroundColor={Colors.surface}>
        <View style={s.centerBox}>
          <View style={s.doneIcon}>
            <Ionicons name="checkmark" size={36} color={Colors.success} />
          </View>
          <Text style={s.stateTitle}>{handedOver ? 'Handover confirmed' : 'Already handed over'}</Text>
          <Text style={s.stateSub}>Order #{order.orderId} is with the delivery rider.</Text>
          <Pressable onPress={() => router.replace('/(vendor)/orders')} accessibilityRole="button" style={({ pressed }) => [s.primaryBtn, s.stateBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.primaryBtnText}>Back to orders</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(vendor)/home')} accessibilityRole="button" style={({ pressed }) => [s.secondaryBtn, s.stateBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.secondaryBtnText}>Back to home</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const isPacking = order.status === 'ACCEPTED' || order.status === 'PREPARING';

  let footer: React.ReactNode = undefined;
  if (isReadyToHand) {
    footer = (
      <View style={s.footer}>
        {!!submitError && (
          <View style={s.bannerError} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={s.bannerErrorText}>{submitError}</Text>
          </View>
        )}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirm handover to rider"
          accessibilityState={{ disabled: !canConfirm, busy: submitting }}
          style={({ pressed }) => [s.primaryBtn, !canConfirm && s.primaryBtnDisabled, pressed && canConfirm && { opacity: 0.85 }]}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={[s.primaryBtnText, !canConfirm && s.primaryBtnTextDisabled]}>Confirm handover</Text>}
        </Pressable>
      </View>
    );
  }

  const pinCard = (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Rider PIN</Text>
      <Text style={s.mutedText}>
        {pickupCode
          ? 'Ask the rider for the 4-digit pickup PIN and enter it here.'
          : 'No pickup PIN is available for this order, so handover is blocked. Do not hand over the parcel.'}
      </Text>
      <TextInput
        style={[s.pinInput, !pickupCode && s.pinInputDisabled]}
        value={pin}
        onChangeText={v => { setPin(v.replace(/\D/g, '').slice(0, 4)); setSubmitError(''); }}
        keyboardType="number-pad"
        maxLength={4}
        editable={!!pickupCode && isReadyToHand && !submitting}
        placeholder="0000"
        placeholderTextColor={Colors.textSubtle}
        accessibilityLabel="Rider pickup PIN"
        accessibilityHint="Enter the 4-digit pickup PIN from the rider"
      />
      {!pickupCode && (
        <Pressable onPress={() => router.push('/(vendor)/support' as any)} accessibilityRole="link" accessibilityLabel="Contact support about the pickup PIN" style={s.linkHit}>
          <Text style={s.linkText}>Contact support</Text>
        </Pressable>
      )}
    </View>
  );

  const orderCard = (
    <View style={s.card}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Order #{order.orderId}</Text>
        <View style={s.statusPill}>
          <Text style={s.statusPillText}>{statusLabel}</Text>
        </View>
      </View>
      {!!order.customerName && <Text style={s.customerName}>{order.customerName}</Text>}
      {!!order.shippingAddress?.fullAddress && <Text style={s.mutedText}>{order.shippingAddress.fullAddress}</Text>}
      <View style={s.factRow}>
        <Text style={s.mutedText}>Pickup bay</Text>
        <Text style={s.factVal}>{order.pickupBay || 'Not assigned yet'}</Text>
      </View>
      <View style={s.factRow}>
        <Text style={s.mutedText}>Items</Text>
        <Text style={s.factVal}>{itemCount} {itemCount === 1 ? 'unit' : 'units'}</Text>
      </View>
      <View style={s.factRow}>
        <Text style={s.mutedText}>Order total</Text>
        <Text style={s.factVal}>{formatINR(order.pricing?.grandTotal)}</Text>
      </View>
    </View>
  );

  const riderCard = (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Rider</Text>
      <Text style={s.mutedText}>Rider details are not on this order yet. Confirm the rider by their PIN.</Text>
    </View>
  );

  return (
    <ScreenShell
      header={{ title: 'Rider handover', subtitle: `Order #${order.orderId}`, showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scrollContent}
      keyboardAvoiding
      stickyFooter={footer}
    >
      {!isReadyToHand && (
        <View style={[s.infoBox, { marginBottom: Spacing.lg }]}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.infoText}>
              {isPacking
                ? 'This order is not packed yet. Pack it before the rider arrives.'
                : `This order is ${statusLabel.toLowerCase()}, so there is no handover to confirm.`}
            </Text>
            {isPacking && (
              <Pressable onPress={() => router.push({ pathname: '/(vendor)/pack-order', params: { orderId: order.orderId } } as any)} accessibilityRole="link" accessibilityLabel="Go to packing" style={s.linkHit}>
                <Text style={s.linkText}>Go to packing</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {isExpanded ? (
        <View style={s.wideRow}>
          <View style={s.wideLeft}>{pinCard}</View>
          <View style={s.wideRight}>
            {orderCard}
            {riderCard}
          </View>
        </View>
      ) : (
        <View style={s.stack}>
          {orderCard}
          {riderCard}
          {pinCard}
        </View>
      )}
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  stack: { gap: Spacing.lg },
  wideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  wideLeft: { flex: 6, minWidth: 0 },
  wideRight: { flex: 5, minWidth: 0, gap: Spacing.lg },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  stateTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary, textAlign: 'center' },
  stateSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  stateBtn: { alignSelf: 'stretch', minWidth: 200, marginTop: Spacing.sm, flex: 0 },
  doneIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.successLight,
    borderWidth: 1, borderColor: Colors.successBorder, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  customerName: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  mutedText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  factVal: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadii.pill, backgroundColor: Colors.primaryLight },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.primary },

  pinInput: {
    alignSelf: 'center', width: 200, minHeight: 60, marginTop: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: BorderRadii.input,
    textAlign: 'center', fontFamily: FontFamily.bold, fontSize: 26, letterSpacing: 10,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  pinInputDisabled: { backgroundColor: Colors.surface, borderColor: Colors.border },
  linkHit: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md,
    borderRadius: BorderRadii.card, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  infoText: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: '#1E3A8A' },

  footer: { gap: Spacing.sm },
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
  secondaryBtn: {
    minHeight: 48, borderRadius: BorderRadii.input, borderWidth: 1, borderColor: '#CBD5E1',
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  secondaryBtnText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
});
