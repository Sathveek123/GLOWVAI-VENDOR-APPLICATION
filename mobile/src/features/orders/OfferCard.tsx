/**
 * Incoming order offer (PRD screen 10): what the vendor needs to decide, and nothing more.
 * Order reference, items and quantities, estimated earnings and prep time (only when the
 * server sends them), a countdown only when the server sends an expiry, Accept, and
 * Decline with a required reason. No customer name, address or phone before acceptance.
 *
 * Accept and Decline wait for the server's answer. Success is shown only after it.
 * File: mobile/src/features/orders/OfferCard.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BorderRadii, Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import useVendorStore from '../../store/useVendorStore';
import type { Order } from '../../store/useVendorStore';
import { ordersApi } from '../../services/api';
import { useVendorSession } from '../../services/session';
import {
  DECLINE_REASONS,
  formatINR,
  friendlyError,
  isOfferGone,
  isTakenByOther,
  serverEarnings,
  unitCount,
  unitsLabel,
  withTimeout,
} from './model';
import { Banner, PrimaryButton, SecondaryButton } from './ui';

const REQUEST_TIMEOUT_MS = 15_000;

export type OfferPhase =
  | 'idle'
  | 'accepting'
  | 'accepted'
  | 'reasons'
  | 'declining'
  | 'taken'
  | 'gone'
  | 'expired';

export interface OfferCardProps {
  order: Order;
  /** Offer expiry on this device's clock (ms). Undefined when the server sent none. */
  expiresAt?: number;
  /** When the offer arrived on this device, used to size the countdown bar. */
  receivedAt?: number;
  variant: 'sheet' | 'inline';
  /** Set by the host when the server says the offer closed: taken by another store, or cancelled. */
  serverOutcome?: 'taken' | 'gone';
  /** Called on the first Accept or Decline tap (stops the alert sound). */
  onInteract?: () => void;
  /** Called after the server confirmed the accept and the vendor taps "Start picking". */
  onStartPicking?: (order: Order) => void;
  /** Called after the server confirmed the decline, or to close a finished offer. */
  onClose?: () => void;
}

export default function OfferCard({
  order,
  expiresAt,
  receivedAt,
  variant,
  serverOutcome,
  onInteract,
  onStartPicking,
  onClose,
}: OfferCardProps) {
  const session = useVendorSession();
  const upsertOrder = useVendorStore(st => st.upsertOrder);
  const updateOrder = useVendorStore(st => st.updateOrder);

  const [phase, setPhase] = useState<OfferPhase>('idle');
  const [error, setError] = useState('');
  const [reason, setReason] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const announced = useRef<Set<number>>(new Set());
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  // A new offer resets the card.
  useEffect(() => {
    setPhase('idle');
    setError('');
    setReason(null);
    announced.current = new Set();
  }, [order.orderId]);

  useEffect(() => {
    if (serverOutcome && (phase === 'idle' || phase === 'reasons')) setPhase(serverOutcome);
  }, [serverOutcome, phase]);

  // Countdown, only when the server gave an expiry.
  const open = phase === 'idle' || phase === 'reasons';
  useEffect(() => {
    if (!expiresAt || !open) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [expiresAt, open]);

  const secondsLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;

  useEffect(() => {
    if (secondsLeft === null || !open) return;
    if (secondsLeft <= 0) {
      setPhase('expired');
      return;
    }
    for (const mark of [30, 10, 5]) {
      if (secondsLeft <= mark && !announced.current.has(mark)) {
        announced.current.add(mark);
        AccessibilityInfo.announceForAccessibility?.(`${secondsLeft} seconds left to accept`);
        break;
      }
    }
  }, [secondsLeft, open]);

  const units = unitCount(order);
  const earnings = serverEarnings(order);
  const prep = order.prepTimeMinutes;

  const handleAccept = async () => {
    if (phase !== 'idle') return;
    onInteract?.();
    setError('');
    setPhase('accepting');
    try {
      const res: any = await withTimeout(ordersApi.accept(order.orderId, session.vendorId || ''), REQUEST_TIMEOUT_MS);
      if (!mounted.current) return;
      if (res?.order) upsertOrder(res.order);
      else updateOrder(order.orderId, { status: 'ACCEPTED' });
      setPhase('accepted');
    } catch (err: any) {
      if (!mounted.current) return;
      if (isTakenByOther(err)) {
        setPhase('taken');
      } else if (isOfferGone(err)) {
        setPhase('gone');
      } else if (err?.name === 'TimeoutError') {
        setError('We could not confirm the accept. Check Orders before trying again, it may already be yours.');
        setPhase('idle');
        // Find out what actually happened.
        ordersApi.getById(order.orderId).then((r: any) => r?.order && upsertOrder(r.order)).catch(() => {});
      } else {
        setError(friendlyError(err, 'The order could not be accepted. Try again.'));
        setPhase('idle');
      }
    }
  };

  const handleDecline = async () => {
    if (phase !== 'reasons' || !reason) return;
    setError('');
    setPhase('declining');
    try {
      const res: any = await withTimeout(
        ordersApi.reject(order.orderId, session.vendorId || '', reason),
        REQUEST_TIMEOUT_MS,
      );
      if (!mounted.current) return;
      if (res?.order) upsertOrder(res.order);
      else updateOrder(order.orderId, { status: 'REJECTED', rejectionReason: reason });
      onClose?.();
    } catch (err: any) {
      if (!mounted.current) return;
      if (isOfferGone(err)) {
        setPhase('gone');
      } else {
        setError(friendlyError(err, 'The order could not be declined. Try again.'));
        setPhase('reasons');
      }
    }
  };

  // ── Finished states ────────────────────────────────────────────────────────
  if (phase === 'accepted' || phase === 'taken' || phase === 'gone' || phase === 'expired') {
    const copy = {
      accepted: {
        icon: 'checkmark-circle' as const,
        color: Colors.success,
        title: 'Order accepted',
        body: `Order #${order.orderId} is yours. Start picking the items now.`,
      },
      taken: {
        icon: 'storefront-outline' as const,
        color: Colors.textSecondary,
        title: 'Order already taken by another store',
        body: 'Nothing to do here. New offers will appear as they come in.',
      },
      gone: {
        icon: 'remove-circle-outline' as const,
        color: Colors.textSecondary,
        title: 'This order is no longer available',
        body: 'It may have been cancelled or offered elsewhere. Nothing to do here.',
      },
      expired: {
        icon: 'time-outline' as const,
        color: Colors.textSecondary,
        title: 'Offer expired',
        body: 'The time to accept this order ran out.',
      },
    }[phase];
    return (
      <View style={[oc.finished, variant === 'inline' && oc.inlinePad]} accessibilityLiveRegion="assertive">
        <Ionicons name={copy.icon} size={48} color={copy.color} />
        <Text style={oc.finishedTitle}>{copy.title}</Text>
        <Text style={oc.finishedBody}>{copy.body}</Text>
        <View style={oc.finishedActions}>
          {phase === 'accepted' && onStartPicking && (
            <PrimaryButton label="Start picking" tall icon="basket-outline" onPress={() => onStartPicking(order)} />
          )}
          {onClose && (
            phase === 'accepted'
              ? <SecondaryButton label="Close" onPress={onClose} />
              : <PrimaryButton label={variant === 'inline' ? 'Back to orders' : 'Close'} onPress={onClose} />
          )}
        </View>
      </View>
    );
  }

  // ── Open offer ─────────────────────────────────────────────────────────────
  const urgent = secondsLeft !== null && secondsLeft <= 15;
  const critical = secondsLeft !== null && secondsLeft <= 5;
  const timerColor = critical ? Colors.danger : urgent ? Colors.warning : Colors.primary;
  const total = expiresAt && receivedAt ? Math.max(1, expiresAt - receivedAt) : 0;
  const fraction = expiresAt && total ? Math.max(0, Math.min(1, (expiresAt - now) / total)) : 0;
  const busy = phase === 'accepting' || phase === 'declining';

  return (
    <View style={oc.wrap}>
      <View style={[oc.head, variant === 'inline' && oc.inlinePadX]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={oc.kicker}>New order offer</Text>
          <Text style={oc.ref} numberOfLines={1} selectable>#{order.orderId}</Text>
        </View>
        {variant === 'sheet' && onClose && (
          <Pressable
            onPress={onClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Close. The offer stays in Orders, Incoming"
            style={({ pressed }) => [oc.close, pressed && { backgroundColor: Colors.surface }]}
          >
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Time to respond */}
      <View style={[oc.timerBox, variant === 'inline' && oc.inlineMarginX]}>
        {secondsLeft !== null ? (
          <>
            <View style={oc.timerRow}>
              <Ionicons name="timer-outline" size={18} color={timerColor} />
              <Text style={[oc.timerText, { color: timerColor }]}>
                {`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              </Text>
              <Text style={oc.timerHint}>left to respond</Text>
            </View>
            {total > 0 && (
              <View style={oc.track}>
                <View style={[oc.fill, { width: `${fraction * 100}%`, backgroundColor: timerColor }]} />
              </View>
            )}
          </>
        ) : (
          <View style={oc.timerRow}>
            <Ionicons name="hourglass-outline" size={18} color={Colors.primary} />
            <Text style={oc.waitText}>Waiting for your confirmation</Text>
          </View>
        )}
      </View>

      {/* Key facts */}
      <View style={[oc.facts, variant === 'inline' && oc.inlineMarginX]}>
        <Fact label="Items" value={unitsLabel(units)} />
        {earnings !== undefined && <Fact label="Est. earnings" value={formatINR(earnings)} />}
        {typeof prep === 'number' && prep > 0 && <Fact label="Prep time" value={`${prep} min`} />}
      </View>

      {/* Items */}
      <ScrollView
        style={variant === 'sheet' ? oc.itemsScroll : undefined}
        contentContainerStyle={[oc.items, variant === 'inline' && oc.inlinePadX]}
        nestedScrollEnabled
      >
        {order.items.length === 0 ? (
          <Text style={oc.muted}>The server did not list any items for this order.</Text>
        ) : (
          order.items.map((it, idx) => (
            <View key={`${it.productId || it.sku || it.productName}-${idx}`} style={[oc.itemRow, idx > 0 && oc.divider]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={oc.itemName} numberOfLines={2}>{it.productName}</Text>
                {(it.variant || it.sku) && (
                  <Text style={oc.muted} numberOfLines={1}>
                    {[it.variant, it.sku ? `SKU ${it.sku}` : ''].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <View style={oc.qty}>
                <Text style={oc.qtyText}>x{it.quantity}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[oc.privacy, variant === 'inline' && oc.inlinePadX]}>
        <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
        <Text style={oc.muted}>Customer details stay private until you accept.</Text>
      </View>

      {/* Actions */}
      <View style={[oc.footer, variant === 'inline' && oc.inlinePadX]}>
        {!!error && <Banner tone="danger" message={error} />}

        {phase === 'reasons' || phase === 'declining' ? (
          <View style={oc.reasons} accessibilityRole="radiogroup" accessibilityLabel="Reason for declining">
            <Text style={oc.reasonsTitle}>Why are you declining?</Text>
            <View style={oc.chips}>
              {DECLINE_REASONS.map(r => {
                const selected = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: busy }}
                    style={({ pressed }) => [oc.chip, selected && oc.chipOn, pressed && !selected && { backgroundColor: Colors.surface }]}
                  >
                    {selected && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                    <Text style={[oc.chipText, selected && oc.chipTextOn]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={oc.actionRow}>
              <SecondaryButton
                label="Back"
                onPress={() => { setPhase('idle'); setError(''); }}
                disabled={busy}
                style={{ flex: 1 }}
              />
              <SecondaryButton
                label="Decline order"
                danger
                onPress={handleDecline}
                disabled={!reason}
                busy={phase === 'declining'}
                style={{ flex: 1.4 }}
              />
            </View>
            {!reason && <Text style={oc.helper}>Choose a reason to decline.</Text>}
          </View>
        ) : (
          <View style={oc.actionRow}>
            <SecondaryButton
              label="Decline"
              tall
              onPress={() => { onInteract?.(); setError(''); setPhase('reasons'); }}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label={phase === 'accepting' ? 'Accepting' : 'Accept order'}
              tall
              onPress={handleAccept}
              busy={phase === 'accepting'}
              accessibilityLabel={`Accept order ${order.orderId}`}
              style={{ flex: 2 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={oc.fact}>
      <Text style={oc.factLabel}>{label}</Text>
      <Text style={oc.factValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const oc = StyleSheet.create({
  wrap: { gap: Spacing.md },
  inlinePad: { padding: Spacing.lg },
  inlinePadX: { paddingHorizontal: Spacing.lg },
  inlineMarginX: { marginHorizontal: Spacing.lg },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  kicker: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: Colors.primary },
  ref: { fontFamily: FontFamily.monoBold, fontSize: 20, lineHeight: 28, color: Colors.textPrimary },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginRight: -8,
  },

  timerBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 28 },
  timerText: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  timerHint: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  waitText: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.primary },
  track: { height: 4, borderRadius: 2, backgroundColor: Colors.primaryBorder, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },

  facts: { flexDirection: 'row', gap: Spacing.sm },
  fact: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  factLabel: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16, color: Colors.textMuted },
  factValue: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  itemsScroll: { maxHeight: 248 },
  items: {},
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, minHeight: 52 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.border },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  qty: {
    minWidth: 44,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  qtyText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  muted: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textMuted },

  privacy: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  footer: { gap: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  reasons: { gap: Spacing.sm },
  reasonsTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.card,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textPrimary },
  chipTextOn: { fontFamily: FontFamily.semibold, color: Colors.primary },
  helper: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  finished: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  finishedTitle: { fontFamily: FontFamily.bold, fontSize: 19, lineHeight: 26, color: Colors.textPrimary, textAlign: 'center' },
  finishedBody: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 340 },
  finishedActions: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.md },
});
