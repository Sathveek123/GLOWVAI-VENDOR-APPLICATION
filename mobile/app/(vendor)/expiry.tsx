/**
 * Expiry and batch lots, ordered by earliest expiry (FEFO).
 * Batch data is not connected to the API yet, so production shows the empty state and
 * no register or action controls. Sample lots appear only in development builds, labelled
 * "Sample data", and changes to them are never saved.
 * File: mobile/app/(vendor)/expiry.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, StyleSheet, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell from '../../src/components/ScreenShell';
import {
  Banner,
  Button,
  FieldRow,
  TextField,
  S,
  R,
  SellerColors as C,
  useLayout,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

const CRITICAL_DAYS = 15;
const NEAR_DAYS = 45;
const DISCOUNT_PERCENT = 25;

type TabKey = 'action' | 'all' | 'cleared';
type StatusKey = 'all' | 'critical' | 'near' | 'healthy' | 'cleared';
type BatchStatus = 'Critical' | 'Near expiry' | 'Healthy' | 'Cleared';

interface BatchItem {
  batchId: string;
  productName: string;
  brand: string;
  lotCode: string;
  shelf: string;
  expiryDate: string;
  qtyReceived: number;
  qtyRemaining: number;
  supplier?: string;
  cleared: boolean;
  discounted: boolean;
  priorityShelf: boolean;
}

function dateFromNow(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

// Development-only sample lots. Expiry dates are relative to today so the days-left stay correct.
function buildSampleBatches(): BatchItem[] {
  return [
    { batchId: 'BAT-101', productName: 'Minimalist 10% Niacinamide Serum 30ml', brand: 'Minimalist', lotCode: 'LOT-MIN-991', shelf: 'Shelf A-01-05', expiryDate: dateFromNow(17), qtyReceived: 30, qtyRemaining: 8, supplier: 'Minimalist Direct India', cleared: false, discounted: false, priorityShelf: false },
    { batchId: 'BAT-102', productName: 'Cetaphil Gentle Skin Cleanser 125ml', brand: 'Cetaphil', lotCode: 'LOT-CET-442', shelf: 'Shelf A-01-08', expiryDate: dateFromNow(33), qtyReceived: 25, qtyRemaining: 4, supplier: 'Galderma India Logistics', cleared: false, discounted: false, priorityShelf: false },
    { batchId: 'BAT-103', productName: 'Maybelline Fit Me Foundation 120 Ivory', brand: 'Maybelline', lotCode: 'LOT-MAY-881', shelf: 'Shelf B-02-01', expiryDate: dateFromNow(7), qtyReceived: 20, qtyRemaining: 6, supplier: 'L’Oréal India Distribution', cleared: false, discounted: false, priorityShelf: false },
    { batchId: 'BAT-104', productName: 'Dot & Key Watermelon Sunscreen SPF 50', brand: 'Dot & Key', lotCode: 'LOT-DOT-303', shelf: 'Shelf A-03-02', expiryDate: dateFromNow(509), qtyReceived: 40, qtyRemaining: 28, supplier: 'Dot & Key Central Depot', cleared: false, discounted: false, priorityShelf: false },
    { batchId: 'BAT-105', productName: 'L’Oréal Paris Hyaluronic Shampoo 250ml', brand: 'L’Oréal Paris', lotCode: 'LOT-LOR-119', shelf: 'Shelf C-01-04', expiryDate: dateFromNow(53), qtyReceived: 15, qtyRemaining: 3, supplier: 'L’Oréal South Regional Hub', cleared: false, discounted: false, priorityShelf: false },
    { batchId: 'BAT-106', productName: 'Plum BodyLovin’ Vanilla EDP 50ml', brand: 'Plum', lotCode: 'LOT-PLU-772', shelf: 'Shelf D-01-02', expiryDate: dateFromNow(-30), qtyReceived: 10, qtyRemaining: 0, supplier: 'Pureplay Skin Sciences', cleared: true, discounted: false, priorityShelf: false },
  ];
}

/** Whole days until the expiry date, or null when the date is missing or invalid. */
function daysUntil(date: string): number | null {
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function batchStatus(b: BatchItem): { status: BatchStatus; days: number | null } {
  const days = daysUntil(b.expiryDate);
  if (b.cleared) return { status: 'Cleared', days };
  if (days !== null && days <= CRITICAL_DAYS) return { status: 'Critical', days };
  if (days !== null && days <= NEAR_DAYS) return { status: 'Near expiry', days };
  return { status: 'Healthy', days };
}

function daysLabel(days: number | null) {
  if (days === null) return 'Date not set';
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
  if (days === 0) return 'Expires today';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

const STATUS_STYLE: Record<BatchStatus, { bg: string; text: string }> = {
  Critical: { bg: C.dangerLight, text: C.errorText },
  'Near expiry': { bg: '#FFFBEB', text: '#B45309' },
  Healthy: { bg: '#F0FDF4', text: '#15803D' },
  Cleared: { bg: '#F1F5F9', text: C.textSecondary },
};

export default function ExpiryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPhone, canSplit } = useLayout();
  useDocumentTitle('Expiry and batches');

  // Development-only sample lots. Production has no batch source yet, so the list stays empty.
  const [batches, setBatches] = useState<BatchItem[]>(() => (__DEV__ ? buildSampleBatches() : []));
  const [tab, setTab] = useState<TabKey>('action');
  const [status, setStatus] = useState<StatusKey>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ text: string; onUndo?: () => void } | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({ productName: '', lotCode: '', expiryDate: '', qtyReceived: '', qtyRemaining: '', shelf: '', supplier: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const withStatus = useMemo(() => batches.map(b => ({ batch: b, ...batchStatus(b) })), [batches]);

  const counts = useMemo(() => ({
    critical: withStatus.filter(x => x.status === 'Critical').length,
    near: withStatus.filter(x => x.status === 'Near expiry').length,
    healthy: withStatus.filter(x => x.status === 'Healthy').length,
    cleared: withStatus.filter(x => x.status === 'Cleared').length,
  }), [withStatus]);
  const attention = counts.critical + counts.near;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withStatus
      .filter(({ batch: b, status: st }) => {
        if (tab === 'action' && !(st === 'Critical' || st === 'Near expiry')) return false;
        if (tab === 'cleared' && st !== 'Cleared') return false;
        if (status === 'critical' && st !== 'Critical') return false;
        if (status === 'near' && st !== 'Near expiry') return false;
        if (status === 'healthy' && st !== 'Healthy') return false;
        if (status === 'cleared' && st !== 'Cleared') return false;
        if (!q) return true;
        return [b.productName, b.lotCode, b.brand, b.shelf].some(v => v.toLowerCase().includes(q));
      })
      .sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  }, [withStatus, tab, status, search]);

  // Local changes only. Batch changes are not saved anywhere yet.
  const changeBatch = (batchId: string, patch: Partial<BatchItem>, message: string, undo?: Partial<BatchItem>) => {
    setBatches(prev => prev.map(b => (b.batchId === batchId ? { ...b, ...patch } : b)));
    setToast({
      text: __DEV__ ? `Sample data: ${message} Not saved.` : message,
      onUndo: undo ? () => setBatches(prev => prev.map(b => (b.batchId === batchId ? { ...b, ...undo } : b))) : undefined,
    });
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!form.productName.trim()) next.productName = 'Enter the product name.';
    if (!form.lotCode.trim()) next.lotCode = 'Enter the lot code.';
    else if (batches.some(b => b.lotCode.toUpperCase() === form.lotCode.trim().toUpperCase())) next.lotCode = 'This lot code is already registered.';
    const expiry = daysUntil(form.expiryDate.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate.trim()) || expiry === null) next.expiryDate = 'Use the format YYYY-MM-DD.';
    else if (expiry <= 0) next.expiryDate = 'The expiry date must be in the future.';
    const received = parseInt(form.qtyReceived, 10);
    if (isNaN(received) || received <= 0) next.qtyReceived = 'Enter a quantity greater than 0.';
    const remaining = parseInt(form.qtyRemaining, 10);
    if (isNaN(remaining) || remaining < 0 || (!isNaN(received) && remaining > received)) {
      next.qtyRemaining = 'Enter a number from 0 up to the received quantity.';
    }
    if (!form.shelf.trim()) next.shelf = 'Enter the shelf location.';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const registerBatch = () => {
    if (!validateForm()) return;
    const batch: BatchItem = {
      batchId: `BAT-${Date.now().toString().slice(-6)}`,
      productName: form.productName.trim(),
      brand: '',
      lotCode: form.lotCode.trim().toUpperCase(),
      shelf: form.shelf.trim(),
      expiryDate: form.expiryDate.trim(),
      qtyReceived: parseInt(form.qtyReceived, 10),
      qtyRemaining: parseInt(form.qtyRemaining, 10),
      supplier: form.supplier.trim() || undefined,
      cleared: false,
      discounted: false,
      priorityShelf: false,
    };
    setBatches(prev => [batch, ...prev]);
    setRegisterOpen(false);
    setForm({ productName: '', lotCode: '', expiryDate: '', qtyReceived: '', qtyRemaining: '', shelf: '', supplier: '' });
    setFormErrors({});
    setToast({ text: __DEV__ ? `Sample data: lot ${batch.lotCode} added. Not saved.` : `Lot ${batch.lotCode} registered.` });
  };

  const closeRegister = () => {
    setRegisterOpen(false);
    setFormErrors({});
  };

  const hasFilters = search.trim() !== '' || status !== 'all';
  const pad = isPhone ? S.lg : S.xl;
  const cardWidth: DimensionValue = !isPhone && canSplit ? '48.5%' : '100%';

  const tiles: { key: StatusKey; label: string; value: number; tone: string }[] = [
    { key: 'critical', label: `Critical (under ${CRITICAL_DAYS} days)`, value: counts.critical, tone: C.errorText },
    { key: 'near', label: `Near expiry (under ${NEAR_DAYS} days)`, value: counts.near, tone: '#B45309' },
    { key: 'healthy', label: 'Healthy', value: counts.healthy, tone: '#15803D' },
    { key: 'cleared', label: 'Cleared lots', value: counts.cleared, tone: C.textSubtle },
  ];

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Expiry and batches', showBack: true }}
        backgroundColor={C.page}
        testID="expiry-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {__DEV__ ? (
            <Banner tone="warning" title="Sample data" message="These lots are for layout review only. Changes are not saved." />
          ) : (
            <Banner tone="info" message="Batch tracking is not connected to your store yet. Lots will appear here once it is." />
          )}

          {__DEV__ && attention > 0 ? (
            <Banner
              tone="warning"
              title={`${attention} ${attention === 1 ? 'lot needs' : 'lots need'} attention within ${NEAR_DAYS} days`}
              message="Apply a discount or move the stock to a priority shelf to limit losses."
            />
          ) : null}

          {batches.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="time-outline" size={24} color={C.primary} />
              </View>
              <Text accessibilityRole="header" style={s.emptyTitle}>No batches tracked yet</Text>
              <Text style={s.emptyMessage}>
                Each stock lot with an expiry date is tracked here, earliest expiry first, so near-expiry stock is picked before newer stock.
              </Text>
              <Button label="Go to catalog" variant="secondary" compact onPress={() => router.push('/(vendor)/catalog')} style={s.emptyBtn} />
            </View>
          ) : (
            <>
              <View style={s.tiles}>
                {tiles.map(t => {
                  const on = status === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setStatus(on ? 'all' : t.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${t.label}: ${t.value}`}
                      style={({ pressed }) => [s.tile, isPhone ? s.tilePhone : s.tileWide, on && s.tileOn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={[s.tileValue, { color: t.tone }]}>{t.value}</Text>
                      <Text style={[s.tileLabel, on && { color: C.primary }]} numberOfLines={2}>{t.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.toolbar}>
                <View style={s.searchBox}>
                  <Ionicons name="search-outline" size={18} color={C.textSubtle} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search product, lot code or shelf"
                    placeholderTextColor={C.textSubtle}
                    style={s.searchInput}
                    accessibilityLabel="Search lots"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {search ? (
                    <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} style={s.clearBtn}>
                      <Ionicons name="close-circle" size={18} color={C.textSubtle} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={s.segment} accessibilityRole="radiogroup">
                  {([
                    { key: 'action', label: `Needs action (${attention})` },
                    { key: 'all', label: `All lots (${batches.length})` },
                    { key: 'cleared', label: `Cleared (${counts.cleared})` },
                  ] as { key: TabKey; label: string }[]).map(t => {
                    const on = tab === t.key;
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => setTab(t.key)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={t.label}
                        style={[s.segmentItem, on && s.segmentOn]}
                      >
                        <Text style={[s.segmentText, on && s.segmentTextOn]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={s.hint}>Sorted by earliest expiry first.</Text>
              </View>

              {visible.length === 0 ? (
                <View style={s.empty}>
                  <Text accessibilityRole="header" style={s.emptyTitle}>
                    {hasFilters ? 'No lots match these filters' : 'Nothing needs action'}
                  </Text>
                  <Text style={s.emptyMessage}>
                    {hasFilters ? 'Try another search or clear the status filter.' : 'Every tracked lot is healthy for now.'}
                  </Text>
                  {hasFilters ? (
                    <Button label="Clear filters" variant="secondary" compact onPress={() => { setSearch(''); setStatus('all'); }} style={s.emptyBtn} />
                  ) : null}
                </View>
              ) : (
                <View style={s.list}>
                  {visible.map(({ batch: b, status: st, days }) => (
                    <BatchCard
                      key={b.batchId}
                      batch={b}
                      status={st}
                      days={days}
                      width={cardWidth}
                      onPriority={() => changeBatch(b.batchId, { priorityShelf: true }, `${b.lotCode} moved to the priority shelf.`, { priorityShelf: false })}
                      onDiscount={() => changeBatch(b.batchId, { discounted: true }, `${DISCOUNT_PERCENT}% clearance discount applied to ${b.lotCode}.`, { discounted: false })}
                      onCleared={() => changeBatch(b.batchId, { cleared: true, qtyRemaining: 0 }, `${b.lotCode} marked as cleared.`, { cleared: false, qtyRemaining: b.qtyRemaining })}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {__DEV__ ? (
            <Button label="Register a lot" variant="secondary" icon="add" onPress={() => setRegisterOpen(true)} />
          ) : null}
        </View>
      </ScreenShell>

      {toast ? (
        <View style={s.toastWrap} pointerEvents="box-none">
          <View style={[s.toast, { bottom: 24 + Math.max(insets.bottom, 0) }]}>
            <Text style={s.toastText}>{toast.text}</Text>
            {toast.onUndo ? (
              <Pressable onPress={() => { toast.onUndo?.(); setToast(null); }} accessibilityRole="button" accessibilityLabel="Undo" style={s.toastUndo}>
                <Text style={s.toastUndoText}>Undo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <Modal visible={registerOpen} transparent animationType="fade" onRequestClose={closeRegister}>
        <View style={s.overlay}>
          <View style={[s.sheet, { padding: pad }]}>
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={s.sheetTitle}>Register a lot</Text>
                <Text style={s.sheetSub}>Enter the lot as it arrived at the store.</Text>
              </View>
              <Pressable onPress={closeRegister} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={s.closeBtn}>
                <Ionicons name="close" size={20} color={C.textSecondary} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
              <TextField label="Product name" value={form.productName} onChangeText={v => setForm({ ...form, productName: v })} error={formErrors.productName} />
              <FieldRow>
                <TextField label="Lot code" value={form.lotCode} onChangeText={v => setForm({ ...form, lotCode: v })} placeholder="e.g. LOT-CRV-991" autoCapitalize="characters" autoCorrect={false} error={formErrors.lotCode} />
                <TextField label="Expiry date" value={form.expiryDate} onChangeText={v => setForm({ ...form, expiryDate: v })} placeholder="YYYY-MM-DD" error={formErrors.expiryDate} />
              </FieldRow>
              <FieldRow>
                <TextField label="Received quantity" value={form.qtyReceived} onChangeText={v => setForm({ ...form, qtyReceived: v })} keyboardType="number-pad" error={formErrors.qtyReceived} />
                <TextField label="Quantity now on shelf" value={form.qtyRemaining} onChangeText={v => setForm({ ...form, qtyRemaining: v })} keyboardType="number-pad" error={formErrors.qtyRemaining} />
              </FieldRow>
              <TextField label="Shelf location" value={form.shelf} onChangeText={v => setForm({ ...form, shelf: v })} placeholder="e.g. Shelf A-01-05" autoCapitalize="characters" autoCorrect={false} error={formErrors.shelf} />
              <TextField label="Supplier" optional value={form.supplier} onChangeText={v => setForm({ ...form, supplier: v })} placeholder="e.g. Minimalist Direct India" last />
            </ScrollView>

            <View style={s.sheetActions}>
              <Button label="Cancel" variant="secondary" onPress={closeRegister} style={s.flex1} />
              <Button label="Save lot" onPress={registerBatch} style={s.flex1} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BatchCard({
  batch,
  status,
  days,
  width,
  onPriority,
  onDiscount,
  onCleared,
}: {
  batch: BatchItem;
  status: BatchStatus;
  days: number | null;
  width: DimensionValue;
  onPriority: () => void;
  onDiscount: () => void;
  onCleared: () => void;
}) {
  const tone = STATUS_STYLE[status];
  const open = status !== 'Cleared';
  const urgent = status === 'Critical' || status === 'Near expiry';

  return (
    <View style={[s.card, { width }]}>
      <View style={s.cardTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.metaRow}>
            {batch.brand ? <Text style={s.brand} numberOfLines={1}>{batch.brand}</Text> : null}
            <Text style={s.lot}>{batch.lotCode}</Text>
          </View>
          <Text style={s.name} numberOfLines={2}>{batch.productName}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[s.statusText, { color: tone.text }]}>{status}</Text>
        </View>
      </View>

      <View style={s.metaRow}>
        <View style={s.shelfChip}>
          <Ionicons name="location-outline" size={12} color={C.primary} />
          <Text style={s.shelfText}>{batch.shelf}</Text>
        </View>
        {batch.supplier ? <Text style={s.supplier} numberOfLines={1}>{batch.supplier}</Text> : null}
      </View>

      <View style={s.facts}>
        <View style={s.fact}>
          <Text style={s.factLabel}>Expiry</Text>
          <Text style={[s.factValue, urgent && { color: tone.text }]}>{batch.expiryDate}</Text>
          <Text style={[s.factSub, urgent && { color: tone.text }]}>{daysLabel(days)}</Text>
        </View>
        <View style={s.fact}>
          <Text style={s.factLabel}>On shelf</Text>
          <Text style={s.factValue}>{batch.qtyRemaining} of {batch.qtyReceived}</Text>
          <Text style={s.factSub}>units</Text>
        </View>
      </View>

      {batch.discounted || batch.priorityShelf ? (
        <View style={s.badges}>
          {batch.discounted ? <Text style={s.badge}>{DISCOUNT_PERCENT}% clearance discount</Text> : null}
          {batch.priorityShelf ? <Text style={s.badge}>Priority shelf</Text> : null}
        </View>
      ) : null}

      {open ? (
        <View style={s.actions}>
          <ActionButton label="Priority shelf" onPress={onPriority} />
          <ActionButton label={`${DISCOUNT_PERCENT}% discount`} onPress={onDiscount} />
          <ActionButton label="Mark cleared" onPress={onCleared} danger />
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.actionBtn, danger && s.actionBtnDanger, pressed && { opacity: 0.8 }]}
    >
      <Text style={[s.actionText, danger && s.actionTextDanger]}>{label}</Text>
    </Pressable>
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
  tileOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28 },
  tileLabel: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16, color: C.textSecondary, marginTop: 2 },

  toolbar: { backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: S.md, gap: S.sm },
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
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FontFamily.regular, fontSize: 15, color: C.textPrimary, paddingVertical: 10 },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs, backgroundColor: C.surface, borderRadius: R.input, padding: 3, borderWidth: 1, borderColor: C.border },
  segmentItem: { flexGrow: 1, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.sm },
  segmentOn: { backgroundColor: C.background, borderWidth: 1, borderColor: C.primary },
  segmentText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  segmentTextOn: { color: C.primary },
  hint: { fontFamily: FontFamily.regular, fontSize: 12, color: C.textSubtle },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  card: { backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: S.lg, gap: S.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  brand: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: 0.3 },
  lot: { fontFamily: FontFamily.mono, fontSize: 12, color: C.textSecondary },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary, marginTop: 2 },
  statusPill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  shelfChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: C.primaryLight,
    borderWidth: 1,
    borderColor: C.primaryBorder,
  },
  shelfText: { fontFamily: FontFamily.mono, fontSize: 12, color: C.primary },
  supplier: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSecondary, flexShrink: 1 },

  facts: { flexDirection: 'row', gap: S.sm },
  fact: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: C.border, borderRadius: R.input, padding: S.sm, backgroundColor: C.surface },
  factLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: C.textSubtle },
  factValue: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginTop: 2 },
  factSub: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: C.textSecondary },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  badge: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.primary, backgroundColor: C.primaryLight, paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.sm },
  actionBtn: { minHeight: 44, paddingHorizontal: S.md, borderRadius: R.input, borderWidth: 1, borderColor: C.border, justifyContent: 'center', backgroundColor: C.background },
  actionBtnDanger: { borderColor: C.dangerBorder },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textPrimary },
  actionTextDanger: { color: C.errorText },

  empty: { backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: S.xl, alignItems: 'center' },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: C.textPrimary, textAlign: 'center' },
  emptyMessage: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: C.textSecondary, textAlign: 'center', marginTop: S.xs, maxWidth: 480 },
  emptyBtn: { minWidth: 180, marginTop: S.lg },

  toastWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end' },
  toast: {
    position: 'absolute',
    left: S.lg,
    right: S.lg,
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    backgroundColor: '#0F172A',
    borderRadius: R.input,
    paddingLeft: S.lg,
    paddingRight: S.sm,
    paddingVertical: S.sm,
  },
  toastText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: '#FFFFFF' },
  toastUndo: { minHeight: 44, paddingHorizontal: S.md, justifyContent: 'center' },
  toastUndoText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#93C5FD' },

  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: S.lg },
  sheet: { width: '100%', maxWidth: 560, backgroundColor: C.background, borderRadius: R.card },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, marginBottom: S.md },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: C.textPrimary },
  sheetSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary, marginTop: 2 },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -S.sm, marginTop: -S.xs },
  sheetActions: { flexDirection: 'row', gap: S.md, marginTop: S.lg },
});
