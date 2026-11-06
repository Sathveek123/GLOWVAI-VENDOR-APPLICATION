/**
 * Incoming order offer (PRD screen 10): only what the vendor needs to decide.
 * Order reference, items and quantities, items value, "Placed N min ago" and whether the
 * store's recorded stock covers every item. No customer details before acceptance.
 *
 * There is no countdown: GlowVai does not expire offers on a timer yet, so none is shown.
 * Accept and Decline wait for the server. Success is shown only after it confirms.
 * File: mobile/src/features/orders/OfferCard.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BorderRadii, Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import useVendorStore, { normalizeOrder, type Order } from '../../store/useVendorStore';
import { VendorApiError, friendlyError } from '../../services/vendorApi/http';
import {
  DECLINE_NOTE_MAX,
  DECLINE_REASONS,
  missingStockFrom,
  ordersApi,
  type DeclineReason,
  type MissingStock,
} from '../../services/vendorApi/orders';
import { invalidateInventory, loadInventory, useInventory } from '../catalog/inventory';
import { soundService } from '../../services/sound';
import { formatAgo, formatINR, stockCoverage, unitCount, unitsLabel, withTimeout } from './model';
import { refreshOrdersNow } from './sync';
import { Banner, PrimaryButton, SecondaryButton } from './ui';

const REQUEST_TIMEOUT_MS = 20_000;

export type OfferPhase = 'idle' | 'accepting' | 'accepted' | 'reasons' | 'declining' | 'taken' | 'cancelled' | 'gone';

export interface OfferCardProps {
  order: Order;
  variant: 'sheet' | 'inline';
  /** Set by the host when the order left this store's offers (taken, cancelled or withdrawn). */
  serverOutcome?: 'gone' | 'cancelled';
  /** Called on the first Accept or Decline tap (stops the alert). */
  onInteract?: () => void;
  /** Called after the server confirmed the accept and the vendor taps "Start packing". */
  onStartPacking?: (order: Order) => void;
  /** Called after a confirmed decline, or to close a finished or unanswered offer. */
  onClose?: () => void;
}

export default function OfferCard({ order, variant, serverOutcome, onInteract, onStartPacking, onClose }: OfferCardProps) {
  const router = useRouter();
  const upsertOrder = useVendorStore(st => st.upsertOrder);
  const removeOrders = useVendorStore(st => st.removeOrders);
  const dismissOffer = useVendorStore(st => st.dismissOffer);
  const { inventory, status: invStatus } = useInventory();

  const [phase, setPhase] = useState<OfferPhase>('idle');
  const [error, setError] = useState('');
  const [missing, setMissing] = useState<MissingStock[]>([]);
  const [reason, setReason] = useState<DeclineReason | null>(null);
  const [note, setNote] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    setPhase('idle');
    setError('');
    setMissing([]);
    setReason(null);
    setNote('');
  }, [order.orderId]);

  useEffect(() => {
    if (serverOutcome && (phase === 'idle' || phase === 'reasons')) setPhase(serverOutcome);
  }, [serverOutcome, phase]);

  // "Placed N min ago" stays current.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const units = unitCount(order);
  const coverage = stockCoverage(order, inventory, invStatus.hasLoaded);

  const handleAccept = async () => {
    if (phase !== 'idle') return;
    onInteract?.();
    setError('');
    setMissing([]);
    setPhase('accepting');
    try {
      const res = await withTimeout(ordersApi.accept(order.orderId), REQUEST_TIMEOUT_MS);
      if (!mounted.current) return;
      // The server confirmed. Use its copy; if it sent none, record the accept and re-read.
      const accepted = res.order
        ? normalizeOrder(res.order)
        : { ...order, isOffer: false, status: 'VENDOR_ACCEPTED', acceptedAt: Date.now(), updatedAt: Date.now() };
      upsertOrder(accepted);
      if (!res.order) void refreshOrdersNow();
      // Stock was reserved for this order on the server.
      invalidateInventory();
      void loadInventory(true);
      soundService.playSuccessDing();
      setPhase('accepted');
    } catch (err) {
      if (!mounted.current) return;
      const code = err instanceof VendorApiError ? err.code : err instanceof Error && err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK';
      switch (code) {
        case 'ORDER_ALREADY_ASSIGNED':
          removeOrders([order.orderId]);
          setPhase('taken');
          break;
        case 'ORDER_CANCELLED':
          removeOrders([order.orderId]);
          setPhase('cancelled');
          break;
        case 'NOT_ELIGIBLE':
        case 'NOT_FOUND':
          removeOrders([order.orderId]);
          setPhase('gone');
          break;
        case 'OUT_OF_STOCK':
          setMissing(missingStockFrom(err instanceof VendorApiError ? err.details : undefined));
          setError(friendlyError(err));
          setReason('OUT_OF_STOCK');
          void loadInventory(true);
          setPhase('idle');
          break;
        case 'TIMEOUT':
          setError('GlowVai did not answer in time. Check Orders before trying again: the order may already be yours.');
          void refreshOrdersNow({ full: true });
          setPhase('idle');
          break;
        default:
          setError(friendlyError(err));
          setPhase('idle');
      }
    }
  };

  const noteNeeded = reason === 'OTHER';
  const noteOk = !noteNeeded || note.trim().length > 0;

  const handleDecline = async () => {
    if (phase !== 'reasons' || !reason || !noteOk) return;
    setError('');
    setPhase('declining');
    try {
      await withTimeout(ordersApi.decline(order.orderId, reason, noteNeeded ? note : undefined), REQUEST_TIMEOUT_MS);
      if (!mounted.current) return;
      dismissOffer(order.orderId);
      onClose?.();
    } catch (err) {
      if (!mounted.current) return;
      const code = err instanceof VendorApiError ? err.code : '';
      if (code === 'ORDER_ALREADY_ASSIGNED' || code === 'NOT_ELIGIBLE' || code === 'NOT_FOUND') {
        dismissOffer(order.orderId);
        setPhase(code === 'ORDER_ALREADY_ASSIGNED' ? 'taken' : 'gone');
      } else if (code === 'ORDER_CANCELLED') {
        dismissOffer(order.orderId);
        setPhase('cancelled');
      } else {
        setError(err instanceof Error && err.name === 'TimeoutError'
          ? 'GlowVai did not answer in time. Try again.'
          : friendlyError(err));
        setPhase('reasons');
      }
    }
  };

  const openInventory = () => {
    onClose?.();
    router.push({ pathname: '/(vendor)/catalog', params: { filter: 'low' } } as any);
  };

  // ── Finished states ────────────────────────────────────────────────────────
  if (phase === 'accepted' || phase === 'taken' || phase === 'gone' || phase === 'cancelled') {
    const copy = {
      accepted: {
        icon: 'checkmark-circle' as const,
        color: Colors.success,
        title: 'Order accepted',
        body: `Order ${order.reference} is yours. The stock for it is now held. Pack the items next.`,
      },
      taken: {
        icon: 'storefront-outline' as const,
        color: Colors.textSecondary,
        title: 'Another store accepted this order first',
        body: 'Nothing to do here. New offers appear while your store is online.',
      },
      cancelled: {
        icon: 'close-circle-outline' as const,
        color: Colors.textSecondary,
        title: 'This order was cancelled',
        body: 'Nothing to do here.',
      },
      gone: {
        icon: 'remove-circle-outline' as const,
        color: Colors.textSecondary,
        title: 'This order is no longer available',
        body: 'It is no longer offered to your store. Nothing to do here.',
      },
    }[phase];
    return (
      <View style={[oc.finished, variant === 'inline' && oc.inlinePad]} accessibilityLiveRegion="assertive">
        <Ionicons name={copy.icon} size={48} color={copy.color} />
        <Text style={oc.finishedTitle}>{copy.title}</Text>
        <Text style={oc.finishedBody}>{copy.body}</Text>
        <View style={oc.finishedActions}>
          {phase === 'accepted' && onStartPacking ? (
            <PrimaryButton label="Start packing" tall icon="basket-outline" onPress={() => onStartPacking(order)} />
          ) : null}
          {onClose ? (
            phase === 'accepted'
              ? <SecondaryButton label="Close" onPress={onClose} />
              : <PrimaryButton label={variant === 'inline' ? 'Back to orders' : 'Close'} onPress={onClose} />
          ) : null}
        </View>
      </View>
    );
  }

  // ── Open offer ─────────────────────────────────────────────────────────────
  const busy = phase === 'accepting' || phase === 'declining';

  return (
    <View style={oc.wrap}>
      <View style={[oc.head, variant === 'inline' && oc.inlinePadX]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={oc.kicker}>New order offer</Text>
          <Text style={oc.ref} numberOfLines={1} selectable>{order.reference}</Text>
          <Text style={oc.placed}>Placed {formatAgo(order.placedAt, now)}</Text>
        </View>
        {variant === 'sheet' && onClose ? (
          <Pressable
            onPress={onClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Close. The offer stays in Orders, Offers"
            style={({ pressed }) => [oc.close, pressed && { backgroundColor: Colors.surface }]}
          >
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={[oc.facts, variant === 'inline' && oc.inlineMarginX]}>
        <Fact label="Items" value={unitsLabel(units)} />
        <Fact label="Items value" value={formatINR(order.itemsValue)} />
      </View>

      <ScrollView
        style={variant === 'sheet' ? oc.itemsScroll : undefined}
        contentContainerStyle={variant === 'inline' ? oc.inlinePadX : undefined}
        nestedScrollEnabled
      >
        {order.items.length === 0 ? (
          <Text style={oc.muted}>GlowVai did not list any items for this order.</Text>
        ) : (
          order.items.map((it, idx) => {
            const short = coverage.kind === 'short' && coverage.lines.some(l => l.productId === it.productId);
            return (
              <View key={`${it.productId}-${idx}`} style={[oc.itemRow, idx > 0 && oc.divider]}>
                <Thumb uri={it.imageUrl} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  {it.brand ? <Text style={oc.brand} numberOfLines={1}>{it.brand}</Text> : null}
                  <Text style={oc.itemName} numberOfLines={2}>{it.productName}</Text>
                  <Text style={[oc.muted, short && { color: Colors.warningText }]}>
                    {formatINR(it.price)} each{short ? ' · not enough stock' : ''}
                  </Text>
                </View>
                <View style={oc.qty}>
                  <Text style={oc.qtyText}>x{it.quantity}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Stock check, computed on this phone */}
      <View style={variant === 'inline' ? oc.inlinePadX : undefined}>
        <CoverageLineView coverage={coverage} loading={invStatus.state === 'loading'} failed={invStatus.state === 'error' && !invStatus.hasLoaded} />
      </View>

      <View style={[oc.privacy, variant === 'inline' && oc.inlinePadX]}>
        <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
        <Text style={oc.muted}>Customer details stay private. You see a first name after you accept.</Text>
      </View>

      <View style={[oc.footer, variant === 'inline' && oc.inlinePadX]}>
        {error ? (
          <View style={{ gap: Spacing.sm }}>
            <Banner tone={missing.length ? 'warning' : 'danger'} message={error} />
            {missing.length > 0 ? (
              <View style={oc.missingBox}>
                {missing.map(m => (
                  <Text key={m.productId || m.title} style={oc.missingLine}>
                    {m.title}: need {m.need}, you have {m.have}
                  </Text>
                ))}
                <Pressable onPress={openInventory} accessibilityRole="link" style={oc.linkBtn}>
                  <Text style={oc.linkText}>Update stock in Inventory</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === 'reasons' || phase === 'declining' ? (
          <View style={oc.reasons}>
            <Text style={oc.reasonsTitle} nativeID="declineReasonLabel">Why are you declining?</Text>
            <View style={oc.chips} accessibilityRole="radiogroup" accessibilityLabel="Reason for declining">
              {DECLINE_REASONS.map(r => {
                const selected = reason === r.code;
                return (
                  <Pressable
                    key={r.code}
                    onPress={() => setReason(r.code)}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: busy }}
                    style={({ pressed }) => [oc.chip, selected && oc.chipOn, pressed && !selected && { backgroundColor: Colors.surface }]}
                  >
                    {selected ? <Ionicons name="checkmark" size={16} color={Colors.primary} /> : null}
                    <Text style={[oc.chipText, selected && oc.chipTextOn]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {noteNeeded ? (
              <View style={{ gap: 4 }}>
                <TextInput
                  value={note}
                  onChangeText={t => setNote(t.slice(0, DECLINE_NOTE_MAX))}
                  placeholder="Tell GlowVai the reason"
                  placeholderTextColor={Colors.textSubtle}
                  multiline
                  editable={!busy}
                  accessibilityLabel="Reason for declining, required"
                  style={oc.note}
                />
                <Text style={oc.counter}>{note.length}/{DECLINE_NOTE_MAX}</Text>
              </View>
            ) : null}
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
                disabled={!reason || !noteOk}
                busy={phase === 'declining'}
                style={{ flex: 1.4 }}
              />
            </View>
            {!reason ? <Text style={oc.helper}>Choose a reason to decline.</Text> : null}
            {reason && !noteOk ? <Text style={oc.helper}>Write a short reason to decline.</Text> : null}
          </View>
        ) : (
          <View style={oc.actionRow}>
            <SecondaryButton
              label="Decline"
              tall
              onPress={() => { onInteract?.(); setError(''); setMissing([]); setPhase('reasons'); }}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label={phase === 'accepting' ? 'Accepting' : 'Accept order'}
              tall
              onPress={handleAccept}
              busy={phase === 'accepting'}
              accessibilityLabel={`Accept order ${order.reference}`}
              style={{ flex: 2 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function CoverageLineView({
  coverage,
  loading,
  failed,
}: {
  coverage: ReturnType<typeof stockCoverage>;
  loading: boolean;
  failed: boolean;
}) {
  if (coverage.kind === 'covered') {
    return (
      <View style={[oc.cover, oc.coverOk]}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.successText} />
        <Text style={[oc.coverText, { color: Colors.successText }]}>Your stock covers every item</Text>
      </View>
    );
  }
  if (coverage.kind === 'short') {
    const n = coverage.lines.length;
    return (
      <View style={[oc.cover, oc.coverShort]}>
        <Ionicons name="alert-circle-outline" size={18} color={Colors.warningText} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[oc.coverText, { color: Colors.warningText }]}>
            {n === 1 ? '1 item is' : `${n} items are`} short in your recorded stock
          </Text>
          {coverage.lines.slice(0, 3).map(l => (
            <Text key={l.productId} style={oc.coverDetail} numberOfLines={1}>
              {l.title}: need {l.need}, have {l.have}
            </Text>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={[oc.cover, oc.coverUnknown]}>
      <Ionicons name="cube-outline" size={18} color={Colors.textMuted} />
      <Text style={oc.coverDetail}>
        {loading ? 'Checking your stock' : failed ? 'Your stock could not be checked. GlowVai checks it when you accept.' : 'Checking your stock'}
      </Text>
    </View>
  );
}

function Thumb({ uri }: { uri?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={oc.thumb}>
      {uri && !failed ? (
        <Image source={{ uri }} style={oc.thumbImg} resizeMode="contain" onError={() => setFailed(true)} accessibilityIgnoresInvertColors />
      ) : (
        <Ionicons name="cube-outline" size={20} color={Colors.textMuted} />
      )}
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
  ref: { fontFamily: FontFamily.monoBold, fontSize: 18, lineHeight: 26, color: Colors.textPrimary },
  placed: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textMuted },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: -6, marginRight: -8 },

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

  itemsScroll: { maxHeight: 260 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, minHeight: 60 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.border },
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
  brand: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16, color: Colors.textMuted },
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

  cover: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1 },
  coverOk: { backgroundColor: Colors.successLight, borderColor: Colors.successBorder },
  coverShort: { backgroundColor: Colors.warningLight, borderColor: Colors.warningBorder },
  coverUnknown: { backgroundColor: Colors.surface, borderColor: Colors.border },
  coverText: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  coverDetail: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },

  privacy: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  footer: { gap: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  missingBox: { gap: 2, paddingHorizontal: Spacing.xs },
  missingLine: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, color: Colors.textPrimary },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
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
  note: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  counter: { alignSelf: 'flex-end', fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted },
  helper: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  finished: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  finishedTitle: { fontFamily: FontFamily.bold, fontSize: 19, lineHeight: 26, color: Colors.textPrimary, textAlign: 'center' },
  finishedBody: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 340 },
  finishedActions: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.md },
});
