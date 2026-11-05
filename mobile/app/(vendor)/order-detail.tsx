/**
 * Order detail and Pick & pack (PRD screens 12 and 13, first half).
 *  - New offer: the offer (items, Accept, Decline with reason). No checklist until accepted.
 *  - Accepted: one checklist. Tap a row when the item is in the bag, or "Can't find".
 *    "Mark as packed" stays disabled until every item is checked or reported.
 *  - Packed or later: a short summary and the way to the pickup screen.
 * Picks are saved on this device only. Customer details: first name only, after acceptance.
 * File: mobile/app/(vendor)/order-detail.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BorderRadii, Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import type { OrderItem } from '../../src/store/useVendorStore';
import { useVendorSession } from '../../src/services/session';
import { ordersApi } from '../../src/services/api';
import ScreenShell from '../../src/components/ScreenShell';
import {
  OfferCard,
  StatusStrip,
  bucketOf,
  formatAgo,
  friendlyError,
  statusMeta,
  unitCount,
  unitsLabel,
  useOrder,
  withTimeout,
} from '../../src/features/orders';
import { Banner, Card, PrimaryButton, SecondaryButton, StateView, StatusPill, ui } from '../../src/features/orders/ui';

type PickMark = 'picked' | 'missing';
type PickState = Record<string, PickMark>;

const pickKey = (orderId: string) => `pick_state_${orderId}`;
const itemKey = (it: OrderItem, idx: number) => it.productId || it.sku || `${idx}:${it.productName}`;

export default function PickAndPackScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const session = useVendorSession();
  const { order, state, error: loadError, retry } = useOrder(orderId);
  const upsertOrder = useVendorStore(s => s.upsertOrder);
  const updateOrder = useVendorStore(s => s.updateOrder);

  const [picks, setPicks] = useState<PickState>({});
  const [picksLoaded, setPicksLoaded] = useState(false);
  const [confirmMissing, setConfirmMissing] = useState(false);
  const [packing, setPacking] = useState(false);
  const [packError, setPackError] = useState('');
  const [justPacked, setJustPacked] = useState(false);
  const prepareSent = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Order #${orderId || ''} | GlowVai Vendor`;
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    AsyncStorage.getItem(pickKey(orderId))
      .then(raw => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        // Older saves used another shape; only keep valid marks.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const clean: PickState = {};
          Object.entries(parsed).forEach(([k, v]) => {
            if (v === 'picked' || v === 'missing') clean[k] = v;
          });
          setPicks(clean);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPicksLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const items = useMemo(() => order?.items ?? [], [order]);
  const keys = useMemo(() => items.map(itemKey), [items]);
  const pickedCount = keys.filter(k => picks[k] === 'picked').length;
  const missingCount = keys.filter(k => picks[k] === 'missing').length;
  const handled = pickedCount + missingCount;
  const allHandled = items.length > 0 && handled === items.length;

  const save = (next: PickState) => {
    setPicks(next);
    setConfirmMissing(false);
    setPackError('');
    if (orderId) AsyncStorage.setItem(pickKey(orderId), JSON.stringify(next)).catch(() => {});
    // Tell the server picking has started (ACCEPTED -> PREPARING). Best effort; the
    // status shown only changes when the server answers.
    if (order && !prepareSent.current && (order.status === 'ACCEPTED' || order.status === 'VENDOR_ACCEPTED')) {
      prepareSent.current = true;
      ordersApi
        .prepare(order.orderId, session.vendorId || '')
        .then((res: any) => res?.order && upsertOrder(res.order))
        .catch(() => {
          prepareSent.current = false;
        });
    }
  };

  const toggle = (key: string) => {
    const next = { ...picks };
    if (next[key] === 'picked') delete next[key];
    else next[key] = 'picked';
    save(next);
  };

  const markMissing = (key: string, missing: boolean) => {
    const next = { ...picks };
    if (missing) next[key] = 'missing';
    else delete next[key];
    save(next);
  };

  const pack = async () => {
    if (!order || !allHandled || packing) return;
    if (missingCount > 0 && !confirmMissing) {
      setConfirmMissing(true);
      return;
    }
    setPacking(true);
    setPackError('');
    try {
      const res: any = await withTimeout(
        ordersApi.pack(order.orderId, session.vendorId || '', order.pickupBay || undefined),
        15_000,
      );
      if (res?.order) upsertOrder(res.order);
      else updateOrder(order.orderId, { status: 'PACKED', packedAt: Date.now() });
      AsyncStorage.removeItem(pickKey(order.orderId)).catch(() => {});
      setJustPacked(true);
      setConfirmMissing(false);
    } catch (err) {
      setPackError(friendlyError(err, 'The order could not be marked as packed. Try again.'));
    } finally {
      setPacking(false);
    }
  };

  // ── Loading, missing and error states ──────────────────────────────────────
  const header = { title: orderId ? `Order #${orderId}` : 'Order', showBack: true };
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
        <StateView kind="error" title="We could not load this order" message={loadError} actionLabel="Retry" onAction={retry} />
      </ScreenShell>
    );
  }

  const bucket = bucketOf(order.status);
  const units = unitCount(order);

  // ── New offer: decide first, no checklist yet ──────────────────────────────
  if (bucket === 'incoming') {
    return (
      <ScreenShell header={{ ...header, title: 'New order offer' }} backgroundColor={Colors.surface} contentContainerStyle={s.scroll}>
        <View style={s.stack}>
          <Card><StatusStrip status={order.status} /></Card>
          <Card style={{ paddingHorizontal: 0 }}>
            <OfferCard
              order={order}
              variant="inline"
              onClose={() => router.replace({ pathname: '/(vendor)/orders', params: { tab: 'incoming' } } as any)}
            />
          </Card>
        </View>
      </ScreenShell>
    );
  }

  // ── Packed or later ────────────────────────────────────────────────────────
  if (bucket !== 'preparing') {
    const closed = bucket === 'cancelled' || bucket === 'other';
    return (
      <ScreenShell
        header={header}
        backgroundColor={Colors.surface}
        contentContainerStyle={s.scroll}
        stickyFooter={
          bucket === 'ready' || bucket === 'completed' ? (
            <View style={s.footer}>
              <PrimaryButton
                label={bucket === 'ready' ? 'Go to pickup' : 'View pickup status'}
                tall
                icon="bicycle-outline"
                onPress={() => router.replace({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } } as any)}
              />
              {justPacked && (
                <SecondaryButton label="Next order" onPress={() => router.replace({ pathname: '/(vendor)/orders', params: { tab: 'preparing' } } as any)} />
              )}
            </View>
          ) : undefined
        }
      >
        <View style={s.stack}>
          {!closed && <Card><StatusStrip status={order.status} /></Card>}
          {justPacked ? (
            <Card style={s.doneCard}>
              <Ionicons name="checkmark-circle" size={44} color={Colors.success} />
              <Text style={s.doneTitle}>Order packed</Text>
              <Text style={s.doneSub}>GlowVai has it as packed. Keep it ready for the rider.</Text>
            </Card>
          ) : (
            <Card style={{ gap: Spacing.sm }}>
              <View style={s.refRow}>
                <Text style={ui.code} selectable>#{order.orderId}</Text>
                <StatusPill status={order.status} />
              </View>
              <Text style={ui.body}>
                {closed
                  ? order.rejectionReason
                    ? `${statusMeta(order.status).label}: ${order.rejectionReason}`
                    : 'This order is closed. Nothing more to do.'
                  : 'Picking is done for this order.'}
              </Text>
            </Card>
          )}
          <ItemsSummary items={items} units={units} />
        </View>
      </ScreenShell>
    );
  }

  // ── Pick & pack ────────────────────────────────────────────────────────────
  const helper = !picksLoaded
    ? 'Loading saved picks'
    : allHandled
      ? missingCount > 0
        ? `${missingCount} ${missingCount === 1 ? 'item' : 'items'} reported as can't find.`
        : 'All items checked.'
      : `Check every item first. ${items.length - handled} left.`;

  return (
    <ScreenShell
      header={{ ...header, title: 'Pick & pack' }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.scroll}
      stickyFooter={
        <View style={s.footer}>
          {!!packError && <Banner tone="danger" message={packError} />}
          {confirmMissing ? (
            <View style={s.confirm}>
              <Banner
                tone="warning"
                title={`Pack without ${missingCount} ${missingCount === 1 ? 'item' : 'items'}?`}
                message="Reporting a missing item from the app is not available yet. Call GlowVai support first so the customer can be told."
              />
              <View style={s.row}>
                <SecondaryButton label="Go back" onPress={() => setConfirmMissing(false)} style={{ flex: 1 }} />
                <PrimaryButton label="Pack anyway" onPress={pack} busy={packing} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <>
              <Text style={s.helper} accessibilityLiveRegion="polite">{helper}</Text>
              <PrimaryButton
                label="Mark as packed"
                tall
                icon="cube-outline"
                onPress={pack}
                disabled={!allHandled || !picksLoaded}
                busy={packing}
              />
            </>
          )}
        </View>
      }
    >
      <View style={s.stack}>
        <Card><StatusStrip status={order.status} /></Card>

        <Card style={{ gap: Spacing.sm }}>
          <View style={s.refRow}>
            <Text style={ui.code} selectable>#{order.orderId}</Text>
            <StatusPill status={order.status} />
          </View>
          <Text style={ui.muted}>
            {[
              order.customerFirstName ? `For ${order.customerFirstName}` : '',
              unitsLabel(units),
              order.acceptedAt ? `Accepted ${formatAgo(order.acceptedAt).toLowerCase()}` : '',
              order.prepTimeMinutes ? `Pack within ${order.prepTimeMinutes} min` : '',
            ].filter(Boolean).join(' · ')}
          </Text>
          <View style={s.progressHead}>
            <Text style={s.progressText}>{pickedCount} of {items.length} picked</Text>
            {missingCount > 0 && <Text style={s.missingText}>{missingCount} can't find</Text>}
          </View>
          <View
            style={s.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: items.length, now: handled }}
          >
            <View style={[s.fill, { width: `${items.length ? (handled / items.length) * 100 : 0}%` }]} />
          </View>
          {!!order.packingInstructions && (
            <Banner tone="info" title="Packing note" message={order.packingInstructions} />
          )}
        </Card>

        <Card style={{ paddingVertical: Spacing.xs }}>
          {items.length === 0 ? (
            <StateView kind="empty" icon="cube-outline" title="No items on this order" message="Contact GlowVai support: this order has no items to pack." />
          ) : (
            items.map((it, idx) => {
              const key = keys[idx];
              const mark = picks[key];
              return (
                <View key={key} style={[s.item, idx > 0 && ui.divider, mark === 'missing' && s.itemMissing]}>
                  <Pressable
                    onPress={() => (mark === 'missing' ? undefined : toggle(key))}
                    disabled={mark === 'missing' || !picksLoaded}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: mark === 'picked', disabled: mark === 'missing' }}
                    accessibilityLabel={`${it.productName}${it.variant ? `, ${it.variant}` : ''}, quantity ${it.quantity}`}
                    style={({ pressed }) => [s.itemMain, pressed && { opacity: 0.7 }]}
                  >
                    <View style={[s.box, mark === 'picked' && s.boxOn, mark === 'missing' && s.boxMissing]}>
                      {mark === 'picked' && <Ionicons name="checkmark" size={20} color={Colors.background} />}
                      {mark === 'missing' && <Ionicons name="remove" size={20} color={Colors.warning} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={[s.itemName, mark === 'picked' && s.itemNameDone]} numberOfLines={2}>{it.productName}</Text>
                      {!!it.variant && <Text style={s.variant} numberOfLines={1}>{it.variant}</Text>}
                      <View style={s.metaRow}>
                        {!!it.sku && <Text style={s.sku}>SKU {it.sku}</Text>}
                        {!!it.bin && (
                          <View style={s.bin}><Text style={s.binText}>Bin {it.bin}</Text></View>
                        )}
                      </View>
                    </View>
                    <View style={s.qty}>
                      <Text style={s.qtyText}>x{it.quantity}</Text>
                    </View>
                  </Pressable>
                  {mark === 'missing' ? (
                    <View style={s.missingRow}>
                      <Text style={s.missingNote}>Reported as can't find. Not counted as packed.</Text>
                      <Pressable onPress={() => markMissing(key, false)} accessibilityRole="button" accessibilityLabel={`Undo can't find for ${it.productName}`} style={s.linkBtn}>
                        <Text style={s.linkText}>Undo</Text>
                      </Pressable>
                    </View>
                  ) : mark !== 'picked' ? (
                    <Pressable
                      onPress={() => markMissing(key, true)}
                      disabled={!picksLoaded}
                      accessibilityRole="button"
                      accessibilityLabel={`Can't find ${it.productName}`}
                      style={[s.linkBtn, s.cantFind]}
                    >
                      <Text style={s.cantFindText}>Can't find</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </Card>
        <Text style={s.savedNote}>Picks are saved on this device.</Text>
      </View>
    </ScreenShell>
  );
}

function ItemsSummary({ items, units }: { items: OrderItem[]; units: number }) {
  return (
    <Card style={{ paddingVertical: Spacing.xs }}>
      <Text style={[ui.sectionTitle, { paddingVertical: Spacing.sm }]}>Items · {unitsLabel(units)}</Text>
      {items.map((it, idx) => (
        <View key={`${itemKey(it, idx)}`} style={[s.summaryRow, ui.divider]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.summaryName} numberOfLines={2}>{it.productName}</Text>
            {!!it.variant && <Text style={ui.muted}>{it.variant}</Text>}
          </View>
          <Text style={s.summaryQty}>x{it.quantity}</Text>
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  stack: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  footer: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  confirm: { gap: Spacing.sm },
  helper: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, color: Colors.textSecondary, textAlign: 'center' },

  refRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  progressText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  missingText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.warning },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  item: { paddingVertical: Spacing.sm },
  itemMissing: {},
  itemMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64 },
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
  boxMissing: { backgroundColor: Colors.warningLight, borderColor: Colors.warningBorder },
  itemName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: Colors.textPrimary },
  itemNameDone: { color: Colors.textSecondary },
  variant: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  sku: { fontFamily: FontFamily.mono, fontSize: 12, lineHeight: 16, color: Colors.textMuted },
  bin: { backgroundColor: Colors.binBg, borderColor: Colors.binBorder, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  binText: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.binText },
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

  linkBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
  cantFind: { alignSelf: 'flex-start', marginLeft: 28 + Spacing.md - Spacing.sm },
  cantFindText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textSecondary, textDecorationLine: 'underline' },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginLeft: 28 + Spacing.md,
    paddingLeft: Spacing.md,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.warningLight,
  },
  missingNote: { flex: 1, fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, color: Colors.warning },
  savedNote: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  doneCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  doneTitle: { fontFamily: FontFamily.bold, fontSize: 19, color: Colors.textPrimary },
  doneSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, paddingVertical: Spacing.sm },
  summaryName: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  summaryQty: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
});
