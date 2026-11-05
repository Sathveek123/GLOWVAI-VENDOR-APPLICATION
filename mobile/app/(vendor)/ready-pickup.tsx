/**
 * Ready for pickup (PRD screen 13, handover half).
 * Shows the pickup status, what to match with the rider, and rider details only when
 * the server provides them. The vendor does not record pickup or delivery here:
 * GlowVai records the pickup, and this screen follows it. QR verification is not built yet,
 * and the customer's delivery code is never used as a handover PIN.
 * File: mobile/app/(vendor)/ready-pickup.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import ScreenShell from '../../src/components/ScreenShell';
import {
  StatusStrip,
  bucketOf,
  formatClock,
  unitCount,
  unitsLabel,
  useOrder,
} from '../../src/features/orders';
import { Banner, Card, PrimaryButton, SecondaryButton, StateView, ui } from '../../src/features/orders/ui';

const REFRESH_MS = 20_000;

export default function ReadyForPickupScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, state, error, retry, refresh } = useOrder(orderId);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Pickup #${orderId || ''} | GlowVai Vendor`;
    }
  }, [orderId]);

  // Follow the pickup while waiting for the rider.
  const waiting = !!order && bucketOf(order.status) === 'ready';
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => { refresh(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [waiting, refresh]);

  const header = { title: 'Ready for pickup', showBack: true };

  if (state === 'loading') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView kind="loading" title="Loading order" />
      </ScreenShell>
    );
  }
  if (state === 'missing' || (!order && state !== 'error')) {
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
  if (state === 'error' || !order) {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView kind="error" title="We could not load this order" message={error} actionLabel="Retry" onAction={retry} />
      </ScreenShell>
    );
  }

  const bucket = bucketOf(order.status);

  if (bucket === 'incoming' || bucket === 'preparing') {
    return (
      <ScreenShell header={header} scroll={false} backgroundColor={Colors.surface}>
        <StateView
          kind="empty"
          icon="basket-outline"
          title="This order is not packed yet"
          message="Finish Pick & pack first. The order comes here once it is marked as packed."
          actionLabel="Go to Pick & pack"
          onAction={() => router.replace({ pathname: '/(vendor)/order-detail', params: { orderId: order.orderId } } as any)}
        />
      </ScreenShell>
    );
  }

  const statusCard = (() => {
    switch (order.status) {
      case 'PACKED':
        return {
          icon: 'cube-outline' as const,
          color: Colors.warning,
          bg: Colors.warningLight,
          title: 'Packed. Waiting for the rider',
          sub: order.packedAt ? `Packed at ${formatClock(order.packedAt)}. Keep it at the pickup point.` : 'Keep it at the pickup point.',
        };
      case 'READY_FOR_PICKUP':
        return {
          icon: 'cube-outline' as const,
          color: Colors.warning,
          bg: Colors.warningLight,
          title: 'Ready for pickup',
          sub: 'Hand the package over when the rider arrives.',
        };
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
        return {
          icon: 'bicycle-outline' as const,
          color: Colors.success,
          bg: Colors.successLight,
          title: 'Picked up by the rider',
          sub: order.dispatchedAt ? `Pickup recorded at ${formatClock(order.dispatchedAt)}. Nothing more to do.` : 'Pickup recorded. Nothing more to do.',
        };
      case 'DELIVERED':
        return {
          icon: 'checkmark-circle-outline' as const,
          color: Colors.success,
          bg: Colors.successLight,
          title: 'Delivered',
          sub: 'The delivery was confirmed. Nothing more to do.',
        };
      default:
        return {
          icon: 'close-circle-outline' as const,
          color: Colors.textSecondary,
          bg: Colors.surface,
          title: bucket === 'cancelled' ? 'This order was cancelled' : 'Status is updating',
          sub: bucket === 'cancelled' ? 'Do not hand this package over. Contact GlowVai support if a rider arrives.' : 'Check again in a moment.',
        };
    }
  })();

  const rider = order.rider;
  const checkNow = async () => {
    setChecking(true);
    const ok = await refresh();
    setCheckFailed(!ok);
    setChecking(false);
  };

  return (
    <ScreenShell
      header={header}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scroll}
      stickyFooter={
        <View style={s.footer}>
          {checkFailed && (
            <Banner tone="warning" message="We could not check the status. Check your internet connection and try again." />
          )}
          {bucket === 'ready' ? (
            <SecondaryButton label="Check pickup status" icon="refresh" onPress={checkNow} busy={checking} />
          ) : (
            <PrimaryButton label="Back to orders" onPress={() => router.replace('/(vendor)/orders')} />
          )}
        </View>
      }
    >
      <View style={s.stack}>
        <Card><StatusStrip status={order.status} /></Card>

        {/* Status */}
        <Card style={s.statusCard}>
          <View style={[s.statusIcon, { backgroundColor: statusCard.bg }]}>
            <Ionicons name={statusCard.icon} size={28} color={statusCard.color} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.statusTitle} accessibilityLiveRegion="polite">{statusCard.title}</Text>
            <Text style={ui.body}>{statusCard.sub}</Text>
          </View>
        </Card>

        {/* What to match with the rider */}
        <Card style={{ gap: Spacing.md }}>
          <Text style={ui.sectionTitle}>Match with the rider</Text>
          <Field label="Order reference" value={`#${order.orderId}`} mono />
          <Field label="Package" value={unitsLabel(unitCount(order))} />
          {!!order.pickupBay && <Field label="Pickup point" value={order.pickupBay} mono />}
          {!!order.packageRef && <Field label="Package reference" value={order.packageRef} mono />}
        </Card>

        {/* Rider */}
        <Card style={{ gap: Spacing.md }}>
          <Text style={ui.sectionTitle}>Rider</Text>
          {rider ? (
            <View style={s.riderRow}>
              <View style={s.riderAvatar}>
                <Ionicons name="person-outline" size={22} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.riderName}>{rider.name || 'Rider assigned'}</Text>
                <Text style={ui.muted}>
                  {[
                    rider.partner,
                    typeof rider.etaMinutes === 'number' ? `Arriving in about ${rider.etaMinutes} min` : '',
                    rider.status,
                  ].filter(Boolean).join(' · ') || 'Details will update here.'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={ui.body}>
              {bucket === 'ready'
                ? 'No rider assigned yet. Rider details appear here when GlowVai assigns one.'
                : 'Rider details were not shared for this order.'}
            </Text>
          )}
        </Card>

        {bucket === 'ready' && (
          <Banner
            tone="info"
            title="QR pickup check is coming"
            message="For now, check the order reference with the rider before handing over. GlowVai records the pickup, and this screen updates by itself."
          />
        )}
      </View>
    </ScreenShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={[s.fieldValue, mono && s.fieldMono]} selectable numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  stack: { gap: Spacing.md },
  footer: { gap: Spacing.sm, paddingBottom: Spacing.xs },

  statusCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary, marginBottom: 2 },

  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, minHeight: 28 },
  fieldLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  fieldValue: { flexShrink: 1, fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, textAlign: 'right' },
  fieldMono: { fontFamily: FontFamily.monoBold, fontSize: 16 },

  riderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  riderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  riderName: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
});
