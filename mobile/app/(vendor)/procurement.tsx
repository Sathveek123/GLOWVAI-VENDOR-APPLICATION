/**
 * Procurement: supplier purchase orders and reorder suggestions.
 * Purchase orders are not connected to the API yet, so production shows empty states and
 * no create or receive controls. Sample data appears only in development builds, labelled
 * "Sample data", and changes to it are never saved.
 * File: mobile/app/(vendor)/procurement.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, StyleSheet, type DimensionValue } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import {
  Banner,
  Button,
  Section,
  TextField,
  S,
  R,
  SellerColors as C,
  useLayout,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

type POStatus = 'Confirmed' | 'Partially Received' | 'Overdue' | 'Received';
type FilterKey = 'all' | 'open' | 'partial' | 'overdue';

interface POItem {
  id: string;
  productName: string;
  variant: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  batchNumber?: string;
  expiryMonth?: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  expectedOn: string;
  status: POStatus;
  items: POItem[];
}

interface ReorderSuggestion {
  id: string;
  productName: string;
  variant: string;
  supplier: string;
  currentStock: number;
  threshold: number;
  suggestedQty: number;
  unitCost: number;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'partial', label: 'Partial' },
  { key: 'overdue', label: 'Overdue' },
];

function dateFromNow(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Development-only sample data. Dates are relative to today.
function buildSamplePOs(): PurchaseOrder[] {
  return [
    {
      id: 'PO-9912',
      supplier: 'L’Oréal Beauty India Pvt Ltd',
      expectedOn: dateFromNow(-5),
      status: 'Partially Received',
      items: [
        { id: 'i1', productName: 'Maybelline Fit Me Foundation', variant: 'Shade 128 (30 ml)', orderedQty: 60, receivedQty: 36, unitCost: 350, batchNumber: 'LOT-MAY-88', expiryMonth: '2028-09' },
        { id: 'i2', productName: 'L’Oréal Paris Hyaluronic Serum', variant: '30 ml bottle', orderedQty: 60, receivedQty: 36, unitCost: 358, batchNumber: 'LOT-LOR-12', expiryMonth: '2028-11' },
      ],
    },
    {
      id: 'PO-9880',
      supplier: 'Minimalist Skincare Distributors',
      expectedOn: dateFromNow(4),
      status: 'Confirmed',
      items: [
        { id: 'i3', productName: 'Minimalist 10% Niacinamide Serum', variant: '30 ml', orderedQty: 50, receivedQty: 0, unitCost: 355 },
        { id: 'i4', productName: 'Minimalist Salicylic Acid Cleanser', variant: '100 ml', orderedQty: 30, receivedQty: 0, unitCost: 355 },
      ],
    },
    {
      id: 'PO-9750',
      supplier: 'Cetaphil India Official Vendor',
      expectedOn: dateFromNow(-3),
      status: 'Overdue',
      items: [
        { id: 'i5', productName: 'Cetaphil Gentle Skin Cleanser', variant: '125 ml', orderedQty: 50, receivedQty: 0, unitCost: 370 },
      ],
    },
    {
      id: 'PO-9640',
      supplier: 'Nykaa Merchant Wholesale Hub',
      expectedOn: dateFromNow(-40),
      status: 'Received',
      items: [
        { id: 'i6', productName: 'Lakmé Absolute Matte Lipstick', variant: 'Red Velvet', orderedQty: 200, receivedQty: 200, unitCost: 320, batchNumber: 'LOT-LAK-99', expiryMonth: '2028-06' },
      ],
    },
  ];
}

// Development-only sample reorder suggestions.
const SAMPLE_REORDERS: ReorderSuggestion[] = [
  { id: 'REC-01', productName: 'Maybelline Fit Me Foundation', variant: 'Shade 128 (30 ml)', supplier: 'L’Oréal Beauty India Pvt Ltd', currentStock: 3, threshold: 15, suggestedQty: 30, unitCost: 350 },
  { id: 'REC-02', productName: 'Minimalist 10% Niacinamide Serum', variant: '30 ml bottle', supplier: 'Minimalist Skincare Distributors', currentStock: 2, threshold: 20, suggestedQty: 40, unitCost: 355 },
  { id: 'REC-03', productName: 'Cetaphil Gentle Skin Cleanser', variant: '125 ml bottle', supplier: 'Cetaphil India Official Vendor', currentStock: 4, threshold: 12, suggestedQty: 25, unitCost: 370 },
];

function totals(po: PurchaseOrder) {
  const ordered = po.items.reduce((sum, i) => sum + i.orderedQty, 0);
  const received = po.items.reduce((sum, i) => sum + i.receivedQty, 0);
  const cost = po.items.reduce((sum, i) => sum + i.orderedQty * i.unitCost, 0);
  return { ordered, received, cost };
}

const STATUS_STYLE: Record<POStatus, { bg: string; text: string }> = {
  Confirmed: { bg: C.primaryLight, text: C.primary },
  'Partially Received': { bg: '#FFFBEB', text: '#B45309' },
  Overdue: { bg: C.dangerLight, text: C.errorText },
  Received: { bg: '#F0FDF4', text: '#15803D' },
};

export default function ProcurementScreen() {
  const { isPhone, canSplit } = useLayout();
  useDocumentTitle('Procurement');

  // Development-only sample data. Production has no purchase order source yet.
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => (__DEV__ ? buildSamplePOs() : []));
  const reorders: ReorderSuggestion[] = __DEV__ ? SAMPLE_REORDERS : [];

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [receiveError, setReceiveError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [pickedReorderId, setPickedReorderId] = useState<string | null>(null);
  const [createQty, setCreateQty] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createError, setCreateError] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const pad = isPhone ? S.lg : S.xl;
  const cardWidth: DimensionValue = !isPhone && canSplit ? '48.5%' : '100%';

  const counts = useMemo(() => ({
    open: orders.filter(o => o.status === 'Confirmed').length,
    partial: orders.filter(o => o.status === 'Partially Received').length,
    overdue: orders.filter(o => o.status === 'Overdue').length,
  }), [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (filter === 'open' && o.status !== 'Confirmed') return false;
      if (filter === 'partial' && o.status !== 'Partially Received') return false;
      if (filter === 'overdue' && o.status !== 'Overdue') return false;
      if (!q) return true;
      return [o.id, o.supplier, o.status].some(v => v.toLowerCase().includes(q));
    });
  }, [orders, filter, search]);

  const openOrder = orders.find(o => o.id === openId) || null;

  const closeDetail = () => {
    setOpenId(null);
    setReceiving(false);
    setBatchNumber('');
    setExpiryMonth('');
    setReceiveError('');
  };

  const recordDelivery = () => {
    if (!openOrder) return;
    if (!batchNumber.trim()) {
      setReceiveError('Enter the batch or lot number.');
      return;
    }
    if (expiryMonth.trim() && !/^\d{4}-\d{2}$/.test(expiryMonth.trim())) {
      setReceiveError('Use the expiry format YYYY-MM.');
      return;
    }
    setOrders(prev => prev.map(o => (o.id !== openOrder.id ? o : {
      ...o,
      status: 'Received',
      items: o.items.map(i => ({
        ...i,
        receivedQty: i.orderedQty,
        batchNumber: batchNumber.trim(),
        expiryMonth: expiryMonth.trim() || undefined,
      })),
    })));
    setToast(__DEV__ ? `Sample data: delivery recorded for ${openOrder.id}. Not saved.` : `Delivery recorded for ${openOrder.id}.`);
    closeDetail();
  };

  const openCreate = (suggestion?: ReorderSuggestion) => {
    setPickedReorderId(suggestion?.id ?? reorders[0]?.id ?? null);
    setCreateQty(String(suggestion?.suggestedQty ?? reorders[0]?.suggestedQty ?? ''));
    setCreateDate(dateFromNow(7));
    setCreateError('');
    setCreateOpen(true);
  };

  const createOrder = () => {
    const pick = reorders.find(r => r.id === pickedReorderId);
    const qty = parseInt(createQty, 10);
    if (!pick) {
      setCreateError('Choose a product to order.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setCreateError('Enter a quantity greater than 0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(createDate.trim()) || isNaN(new Date(createDate.trim()).getTime())) {
      setCreateError('Use the delivery date format YYYY-MM-DD.');
      return;
    }
    const po: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplier: pick.supplier,
      expectedOn: createDate.trim(),
      status: 'Confirmed',
      items: [{ id: `item-${Date.now()}`, productName: pick.productName, variant: pick.variant, orderedQty: qty, receivedQty: 0, unitCost: pick.unitCost }],
    };
    setOrders(prev => [po, ...prev]);
    setCreateOpen(false);
    setToast(__DEV__ ? `Sample data: ${po.id} added. Not saved.` : `Purchase order ${po.id} created.`);
  };

  const showCreate = __DEV__;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Procurement', subtitle: 'Supplier purchase orders', showBack: true }}
        backgroundColor={C.page}
        testID="procurement-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {__DEV__ ? (
            <Banner tone="warning" title="Sample data" message="These purchase orders are for layout review only. Changes are not saved." />
          ) : (
            <Banner tone="info" message="Purchase orders are not connected to your store yet. They will appear here once they are." />
          )}

          <View style={s.tiles}>
            <Tile label="Reorder suggestions" value={reorders.length} tone={C.textPrimary} isPhone={isPhone} />
            <Tile label="Open orders" value={counts.open} tone={C.primary} isPhone={isPhone} />
            <Tile label="Partly received" value={counts.partial} tone="#B45309" isPhone={isPhone} />
            <Tile label="Overdue" value={counts.overdue} tone={C.errorText} isPhone={isPhone} />
          </View>

          <Section
            title="Reorder suggestions"
            description="Products running low against their reorder point."
            right={showCreate && reorders.length > 0 ? <Button label="New order" compact icon="add" onPress={() => openCreate()} /> : undefined}
          >
            {reorders.length === 0 ? (
              <Text style={s.hint}>No reorder suggestions yet. They appear when stock falls below the reorder point for a product.</Text>
            ) : (
              <View style={s.list}>
                {reorders.map(r => (
                  <View key={r.id} style={[s.reorder, { width: cardWidth }]}>
                    <Text style={s.name}>{r.productName}</Text>
                    <Text style={s.sub}>{r.variant} · {r.supplier}</Text>
                    <Text style={s.sub}>On hand {r.currentStock} · Reorder point {r.threshold}</Text>
                    <View style={s.reorderFooter}>
                      <Text style={s.reorderQty}>Suggested {r.suggestedQty} units · {formatRupees(r.suggestedQty * r.unitCost)}</Text>
                      {showCreate ? <Button label="Add to order" variant="secondary" compact onPress={() => openCreate(r)} /> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section title="Purchase orders" description="Select an order to see its items and record a delivery.">
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={18} color={C.textSubtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search order number or supplier"
                placeholderTextColor={C.textSubtle}
                style={s.searchInput}
                accessibilityLabel="Search purchase orders"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={C.textSubtle} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              {FILTERS.map(f => {
                const on = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[s.chip, on && s.chipOn]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {orders.length === 0 ? (
              <Text style={s.hint}>No purchase orders yet. Orders you send to suppliers will be listed here.</Text>
            ) : visible.length === 0 ? (
              <Text style={s.hint}>No orders match this filter or search.</Text>
            ) : (
              <View style={s.list}>
                {visible.map(po => {
                  const t = totals(po);
                  const tone = STATUS_STYLE[po.status];
                  return (
                    <Pressable
                      key={po.id}
                      onPress={() => setOpenId(po.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${po.id}, ${po.supplier}, ${po.status}`}
                      style={({ pressed }) => [s.po, { width: cardWidth }, pressed && { opacity: 0.94 }]}
                    >
                      <View style={s.poTop}>
                        <Text style={s.poId}>{po.id}</Text>
                        <View style={[s.statusPill, { backgroundColor: tone.bg }]}>
                          <Text style={[s.statusText, { color: tone.text }]}>{po.status}</Text>
                        </View>
                      </View>
                      <Text style={s.name} numberOfLines={1}>{po.supplier}</Text>
                      <View style={s.poFacts}>
                        <Text style={s.sub}>Due {formatDate(po.expectedOn)}</Text>
                        <Text style={s.sub}>{t.received} of {t.ordered} units</Text>
                        <Text style={s.poCost}>{formatRupees(t.cost)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Section>
        </View>
      </ScreenShell>

      {toast ? (
        <View style={s.toastWrap} pointerEvents="box-none">
          <View style={s.toast}>
            <Text style={s.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      <Modal visible={!!openOrder} transparent animationType="fade" onRequestClose={closeDetail}>
        {openOrder ? (
          <View style={s.overlay}>
            <View style={[s.sheet, { padding: pad }]}>
              <View style={s.sheetHead}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text accessibilityRole="header" style={s.sheetTitle}>{openOrder.id}</Text>
                  <Text style={s.sub}>{openOrder.supplier}</Text>
                  <Text style={s.sub}>Due {formatDate(openOrder.expectedOn)}</Text>
                </View>
                <Pressable onPress={closeDetail} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color={C.textSecondary} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                {openOrder.items.map(item => (
                  <View key={item.id} style={s.line}>
                    <Text style={s.name}>{item.productName}</Text>
                    <Text style={s.sub}>{item.variant} · {formatRupees(item.unitCost)} per unit</Text>
                    <Text style={s.sub}>Ordered {item.orderedQty} · Received {item.receivedQty}</Text>
                    {item.batchNumber ? (
                      <Text style={s.lot}>Batch {item.batchNumber}{item.expiryMonth ? ` · expires ${item.expiryMonth}` : ''}</Text>
                    ) : null}
                  </View>
                ))}

                {receiving ? (
                  <View style={s.receive}>
                    {receiveError ? <Banner tone="error" message={receiveError} /> : null}
                    <TextField label="Batch or lot number" value={batchNumber} onChangeText={v => { setBatchNumber(v); setReceiveError(''); }} placeholder="e.g. LOT-MAY-2026-99" autoCapitalize="characters" autoCorrect={false} />
                    <TextField label="Expiry month" optional value={expiryMonth} onChangeText={v => { setExpiryMonth(v); setReceiveError(''); }} placeholder="YYYY-MM" last />
                    <Text style={s.hint}>Received quantities cannot be more than the ordered quantities.</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={s.sheetActions}>
                {openOrder.status === 'Received' ? (
                  <Button label="Close" variant="secondary" onPress={closeDetail} style={s.flex1} />
                ) : receiving ? (
                  <>
                    <Button label="Back" variant="secondary" onPress={() => { setReceiving(false); setReceiveError(''); }} style={s.flex1} />
                    <Button label="Confirm delivery" onPress={recordDelivery} style={s.flex1} />
                  </>
                ) : showCreate ? (
                  <>
                    <Button label="Close" variant="secondary" onPress={closeDetail} style={s.flex1} />
                    <Button label="Record delivery" onPress={() => setReceiving(true)} style={s.flex1} />
                  </>
                ) : (
                  <Button label="Close" variant="secondary" onPress={closeDetail} style={s.flex1} />
                )}
              </View>
            </View>
          </View>
        ) : null}
      </Modal>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { padding: pad }]}>
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={s.sheetTitle}>New purchase order</Text>
                <Text style={s.sheetSub}>Choose a product from the reorder suggestions.</Text>
              </View>
              <Pressable onPress={() => setCreateOpen(false)} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={s.closeBtn}>
                <Ionicons name="close" size={20} color={C.textSecondary} />
              </Pressable>
            </View>

            {createError ? <Banner tone="error" message={createError} /> : null}

            <Text style={s.label}>Product</Text>
            <View style={s.chipRow}>
              {reorders.map(r => {
                const on = pickedReorderId === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => { setPickedReorderId(r.id); setCreateQty(String(r.suggestedQty)); setCreateError(''); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={r.productName}
                    style={[s.chip, on && s.chipOn, { maxWidth: '100%' }]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]} numberOfLines={1}>{r.productName}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: S.md }}>
              <TextField label="Quantity" value={createQty} onChangeText={v => { setCreateQty(v); setCreateError(''); }} keyboardType="number-pad" />
              <TextField label="Expected delivery" value={createDate} onChangeText={v => { setCreateDate(v); setCreateError(''); }} placeholder="YYYY-MM-DD" last />
            </View>

            <View style={s.sheetActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} style={s.flex1} />
              <Button label="Create order" onPress={createOrder} style={s.flex1} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Tile({ label, value, tone, isPhone }: { label: string; value: number; tone: string; isPhone: boolean }) {
  return (
    <View style={[s.tile, isPhone ? s.tilePhone : s.tileWide]} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[s.tileValue, { color: tone }]}>{value}</Text>
      <Text style={s.tileLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  body: { paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },
  flex1: { flex: 1 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  tile: { minHeight: 76, backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: S.md, justifyContent: 'center' },
  tilePhone: { flexBasis: '48%', flexGrow: 1 },
  tileWide: { flexBasis: 0, flexGrow: 1 },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28 },
  tileLabel: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16, color: C.textSecondary, marginTop: 2 },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  reorder: { borderWidth: 1, borderColor: C.border, borderRadius: R.input, padding: S.md, backgroundColor: C.background, gap: 2 },
  reorderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  reorderQty: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textPrimary },

  po: { borderWidth: 1, borderColor: C.border, borderRadius: R.input, padding: S.md, backgroundColor: C.background, gap: 4 },
  poTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  poId: { fontFamily: FontFamily.mono, fontSize: 13, color: C.textSecondary },
  poFacts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.md, marginTop: 2 },
  poCost: { fontFamily: FontFamily.bold, fontSize: 14, color: C.textPrimary },
  statusPill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontFamily: FontFamily.semibold, fontSize: 12 },

  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: C.textSecondary },
  lot: { fontFamily: FontFamily.mono, fontSize: 12, color: C.primary, marginTop: 2 },
  hint: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: C.textSubtle, marginTop: S.xs },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textPrimary, marginBottom: S.sm },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    minHeight: 46,
    paddingLeft: S.md,
    paddingRight: S.xs,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: R.input,
    marginBottom: S.sm,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FontFamily.regular, fontSize: 15, color: C.textPrimary, paddingVertical: 10 },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: S.sm, paddingVertical: 2, marginBottom: S.md, flexWrap: 'wrap' },
  chip: { minHeight: 44, paddingHorizontal: S.md, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  chipTextOn: { color: '#FFFFFF' },

  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: S.lg },
  sheet: { width: '100%', maxWidth: 560, backgroundColor: C.background, borderRadius: R.card },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, marginBottom: S.md },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: C.textPrimary },
  sheetSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary, marginTop: 2 },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -S.sm, marginTop: -S.xs },
  sheetActions: { flexDirection: 'row', gap: S.md, marginTop: S.lg },
  line: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: S.md, gap: 2 },
  receive: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.md, marginTop: S.sm },

  toastWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end' },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: S.lg,
    right: S.lg,
    maxWidth: 560,
    backgroundColor: '#0F172A',
    borderRadius: R.input,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  toastText: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: '#FFFFFF' },
});
