/**
 * Catalog: the store's products, live stock steppers and LIVE/HIDDEN toggles.
 * Data: inventoryApi (live). Production shows the honest empty or error state.
 * Sample products appear only in development builds, labelled "Sample data".
 * File: mobile/app/(vendor)/catalog.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  type DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import { useVendorSession } from '../../src/services/session';
import { inventoryApi } from '../../src/services/api';
import useVendorStore from '../../src/store/useVendorStore';
import type { InventoryItem } from '../../src/store/useVendorStore';
import {
  Banner,
  Button,
  TextField,
  S,
  R,
  SellerColors as C,
  useLayout,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Hair care', 'Fragrance', 'Bath & Body', 'Tools & Brushes'];

const SORTS = [
  { key: 'stock', label: 'Lowest stock' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'expiry', label: 'Expiring first' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

type MetricKey = 'all' | 'low' | 'out' | 'expiring' | 'hidden';

const LOW_STOCK_BELOW = 5;
const EXPIRY_WINDOW_DAYS = 45;
const NET_AFTER_FEE = 0.88; // GlowVAI keeps a 12% fee on each sale
const CSV_HEADER = 'SKU,Product Name,Category,MRP,SellingPrice,Stock,Bin';

// Development-only sample products. Shown only when __DEV__ and the live catalog is empty or unreachable.
const SAMPLE_CATALOG: InventoryItem[] = [
  { productId: 'P-101', name: 'Minimalist 10% Niacinamide Face Serum 30ml', category: 'Skincare', sku: 'SKU-MIN-101', mrp: 599, sellingPrice: 549, stock: 24, bin: 'Shelf A-01-05', gstPercent: 18, images: [], active: true, brand: 'Minimalist', description: 'Niacinamide 10% + Zinc 1%', expiryDate: '2027-04-30', updatedAt: Date.now() - 3600000 },
  { productId: 'P-102', name: 'Cetaphil Gentle Skin Cleanser 125ml', category: 'Skincare', sku: 'SKU-CET-102', mrp: 399, sellingPrice: 369, stock: 4, bin: 'Shelf A-01-08', gstPercent: 18, images: [], active: true, brand: 'Cetaphil', description: 'Hydrating cleanser for sensitive skin', expiryDate: '2026-11-15', updatedAt: Date.now() - 7200000 },
  { productId: 'P-103', name: 'Maybelline Fit Me Matte Foundation 128', category: 'Makeup', sku: 'SKU-MAY-103', mrp: 549, sellingPrice: 499, stock: 0, bin: 'Shelf B-02-01', gstPercent: 18, images: [], active: false, brand: 'Maybelline', description: 'Matte liquid foundation 30ml', expiryDate: '2026-09-01', updatedAt: Date.now() - 86400000 },
  { productId: 'P-104', name: 'Dot & Key Watermelon Sunscreen SPF 50 50g', category: 'Skincare', sku: 'SKU-DOT-104', mrp: 495, sellingPrice: 445, stock: 18, bin: 'Shelf A-03-02', gstPercent: 18, images: [], active: true, brand: 'Dot & Key', description: 'Water-light sunscreen', expiryDate: '2027-02-28', updatedAt: Date.now() - 1800000 },
  { productId: 'P-105', name: 'L’Oréal Paris Hyaluronic Moisture Shampoo 250ml', category: 'Hair care', sku: 'SKU-LOR-105', mrp: 349, sellingPrice: 315, stock: 3, bin: 'Shelf C-01-04', gstPercent: 18, images: [], active: true, brand: 'L’Oréal Paris', description: '72hr moisture fill shampoo', expiryDate: '2026-12-10', updatedAt: Date.now() - 5000000 },
  { productId: 'P-106', name: 'Plum BodyLovin’ Vanilla Vibes EDP 50ml', category: 'Fragrance', sku: 'SKU-PLU-106', mrp: 899, sellingPrice: 799, stock: 12, bin: 'Shelf D-01-02', gstPercent: 18, images: [], active: true, brand: 'Plum', description: 'Vanilla long-lasting fragrance', expiryDate: '2028-01-01', updatedAt: Date.now() - 1200000 },
];

function isLow(item: InventoryItem) {
  return item.stock > 0 && item.stock < LOW_STOCK_BELOW;
}

function isOut(item: InventoryItem) {
  return item.stock === 0;
}

/** Whole days until the expiry date, or null when the date is missing or invalid. */
function daysUntil(date?: string): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function isExpiring(item: InventoryItem) {
  const days = daysUntil(item.expiryDate);
  return days !== null && days <= EXPIRY_WINDOW_DAYS;
}

function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function approvalText(item: InventoryItem) {
  if (item.listing?.live) return 'On the GlowVAI shop';
  if (item.approvalStatus === 'REJECTED') return `Not approved: ${item.rejectionReason || 'contact support'}`;
  if (item.approvalStatus === 'PENDING') return 'Waiting for GlowVAI approval';
  const blockers = item.listing?.blockers || [];
  return blockers.length ? `Not on the shop yet: ${blockers.join(', ')}` : 'Not on the shop yet';
}

export default function CatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPhone, canSplit } = useLayout();
  useDocumentTitle('Catalog');

  // The signed-in vendor's store (the backend also takes it from the session token).
  const vendorSession = useVendorSession();
  const storeId = vendorSession.storeId || '';
  const { inventory, setInventory, updateInventoryItem } = useVendorStore();
  const items = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [metric, setMetric] = useState<MetricKey>('all');
  const [sort, setSort] = useState<SortKey>('stock');

  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; onUndo?: () => void } | null>(null);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const res: any = await inventoryApi.getAll(storeId);
      const live: InventoryItem[] = Array.isArray(res?.items) ? res.items : [];
      if (live.length === 0 && __DEV__) {
        setInventory(SAMPLE_CATALOG);
        setIsSample(true);
      } else {
        setInventory(live);
        setIsSample(false);
      }
      setLoadError('');
      setLoadState('ready');
    } catch (err: any) {
      if (__DEV__) {
        setInventory(SAMPLE_CATALOG);
        setIsSample(true);
        setLoadState('ready');
      } else {
        setInventory([]);
        setLoadError(err?.message || 'Check your connection and try again.');
        setLoadState('error');
      }
    }
  }, [storeId, setInventory]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  };

  const setBusy = (productId: string, value: boolean) => {
    setBusyIds(prev => ({ ...prev, [productId]: value }));
  };

  const counts: Record<MetricKey, number> = useMemo(
    () => ({
      all: items.length,
      low: items.filter(isLow).length,
      out: items.filter(isOut).length,
      expiring: items.filter(isExpiring).length,
      hidden: items.filter(i => !i.active).length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(item => {
        if (category !== 'All' && item.category !== category) return false;
        if (metric === 'low' && !isLow(item)) return false;
        if (metric === 'out' && !isOut(item)) return false;
        if (metric === 'expiring' && !isExpiring(item)) return false;
        if (metric === 'hidden' && item.active) return false;
        if (!q) return true;
        return [item.name, item.sku, item.brand, item.bin].some(v => (v || '').toLowerCase().includes(q));
      })
      .slice()
      .sort((a, b) => {
        if (sort === 'stock') return a.stock - b.stock;
        if (sort === 'updated') return b.updatedAt - a.updatedAt;
        return (daysUntil(a.expiryDate) ?? 1e9) - (daysUntil(b.expiryDate) ?? 1e9);
      });
  }, [items, search, category, metric, sort]);

  const showToast = (text: string, onUndo?: () => void) => setToast({ text, onUndo });

  // Stock change: optimistic, rolled back if the server refuses it. Undo sends the opposite change.
  const adjustStock = async (item: InventoryItem, delta: number, undoable: boolean) => {
    if (busyIds[item.productId]) return;
    const before = item.stock;
    const next = Math.max(0, before + delta);
    const applied = next - before;
    if (applied === 0) return;

    updateInventoryItem(item.productId, { stock: next, updatedAt: Date.now() });
    if (isSample) {
      showToast('Sample data: this change is not saved.');
      return;
    }

    setBusy(item.productId, true);
    try {
      await inventoryApi.adjustStock(item.productId, applied, 'Vendor manual adjustment');
      showToast(
        `${item.name}: stock is now ${next}`,
        undoable ? () => { void adjustStock({ ...item, stock: next }, -applied, false); } : undefined,
      );
    } catch (err: any) {
      updateInventoryItem(item.productId, { stock: before });
      showToast(`Stock not saved: ${err?.message || 'server error'}. Reverted.`);
    } finally {
      setBusy(item.productId, false);
    }
  };

  const toggleLive = async (item: InventoryItem) => {
    const next = !item.active;
    updateInventoryItem(item.productId, { active: next, updatedAt: Date.now() });
    if (isSample) {
      showToast('Sample data: this change is not saved.');
      return;
    }
    try {
      await inventoryApi.update(item.productId, { active: next });
      showToast(next ? `${item.name} is visible to customers` : `${item.name} is hidden from customers`);
    } catch (err: any) {
      updateInventoryItem(item.productId, { active: item.active });
      showToast(`Could not change visibility: ${err?.message || 'server error'}`);
    }
  };

  const closeCsv = () => {
    setCsvOpen(false);
    setCsvError('');
  };

  const importCsv = async () => {
    if (!csvText.trim()) {
      setCsvError('Paste at least one product row.');
      return;
    }
    setCsvError('');
    setImporting(true);
    try {
      const res: any = await inventoryApi.bulkUpload([], csvText, storeId);
      setCsvOpen(false);
      setCsvText('');
      showToast(res?.count ? `Imported ${res.count} products` : 'Import complete');
      await loadCatalog();
    } catch (err: any) {
      setCsvError(err?.message || 'Import failed. Check the format and try again.');
    } finally {
      setImporting(false);
    }
  };

  const hasFilters = search.trim() !== '' || category !== 'All' || metric !== 'all';
  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setMetric('all');
  };

  const pad = isPhone ? S.lg : S.xl;
  const cardWidth: DimensionValue = !isPhone && canSplit ? '48.5%' : '100%';
  const toastBottom = (isPhone ? 84 : 24) + Math.max(insets.bottom, 0);

  const metricTiles: { key: MetricKey; label: string; tone: string }[] = [
    { key: 'all', label: 'All products', tone: C.textPrimary },
    { key: 'low', label: `Low stock (under ${LOW_STOCK_BELOW})`, tone: '#B45309' },
    { key: 'out', label: 'Out of stock', tone: C.errorText },
    { key: 'expiring', label: `Expiring in ${EXPIRY_WINDOW_DAYS} days`, tone: '#B45309' },
    { key: 'hidden', label: 'Hidden from customers', tone: C.textSubtle },
  ];

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Catalog',
          subtitle: loadState === 'ready' ? `${items.length} ${items.length === 1 ? 'product' : 'products'}` : undefined,
          showBell: true,
          rightActions: (
            <Pressable
              onPress={() => router.push('/(vendor)/add-sku')}
              accessibilityRole="button"
              accessibilityLabel="Add product"
              style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={s.addBtnText}>Add</Text>
            </Pressable>
          ),
        }}
        backgroundColor={C.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        testID="catalog-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {isSample ? (
            <Banner
              tone="warning"
              title="Sample data"
              message="These products are for layout review only. They are not from your store, and changes are not saved."
            />
          ) : null}

          {loadState === 'error' ? (
            <Banner tone="error" title="We could not load your catalog" message={loadError}>
              <Button label="Try again" variant="secondary" compact onPress={loadCatalog} style={s.bannerBtn} />
            </Banner>
          ) : null}

          {/* Stock and visibility summary. Tapping a tile filters the list. */}
          <View style={s.metrics}>
            {metricTiles.map(m => {
              const active = metric === m.key;
              const value = loadState === 'loading' ? '–' : String(counts[m.key]);
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMetric(active && m.key !== 'all' ? 'all' : m.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${m.label}: ${value}`}
                  style={({ pressed }) => [s.tile, isPhone ? s.tilePhone : s.tileWide, active && s.tileActive, pressed && { opacity: 0.9 }]}
                >
                  <Text style={[s.tileValue, { color: m.tone }]}>{value}</Text>
                  <Text style={[s.tileLabel, active && { color: C.primary }]} numberOfLines={2}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search, category and sort controls */}
          <View style={s.toolbar}>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={18} color={C.textSubtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, brand, SKU or shelf"
                placeholderTextColor={C.textSubtle}
                style={s.searchInput}
                accessibilityLabel="Search products"
                returnKeyType="search"
                autoCorrect={false}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={C.textSubtle} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              {CATEGORIES.map(cat => (
                <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
              ))}
            </ScrollView>

            <View style={s.sortRow}>
              <Text style={s.sortLabel}>Sort</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                {SORTS.map(o => (
                  <Chip key={o.key} label={o.label} active={sort === o.key} onPress={() => setSort(o.key)} />
                ))}
              </ScrollView>
            </View>

            <Pressable
              onPress={() => router.push('/(vendor)/expiry')}
              accessibilityRole="link"
              accessibilityLabel="Open expiry and batch tracker"
              style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="time-outline" size={16} color={C.primary} />
              <Text style={s.linkText}>Expiry and batch tracker</Text>
              <Ionicons name="chevron-forward" size={16} color={C.primary} />
            </Pressable>
          </View>

          {/* Product list */}
          {loadState === 'loading' ? (
            <View style={s.list}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[s.skeleton, { width: cardWidth }]} />
              ))}
            </View>
          ) : loadState === 'error' ? null : items.length === 0 ? (
            <EmptyCard
              icon="cube-outline"
              title="No products yet"
              message="Add a product SKU one at a time, or import a CSV file. Products appear on the GlowVAI shop after GlowVAI approves them."
              primary={{ label: 'Add product', onPress: () => router.push('/(vendor)/add-sku') }}
              secondary={{ label: 'Import CSV', onPress: () => setCsvOpen(true) }}
            />
          ) : visible.length === 0 ? (
            <EmptyCard
              icon="search-outline"
              title="No products match these filters"
              message="Try another search, category or stock filter."
              primary={{ label: 'Clear filters', onPress: clearFilters }}
            />
          ) : (
            <View style={s.list}>
              {visible.map(item => (
                <ProductCard
                  key={item.productId}
                  item={item}
                  width={cardWidth}
                  busy={!!busyIds[item.productId]}
                  onOpen={() => router.push({ pathname: '/(vendor)/add-sku', params: { productId: item.productId } })}
                  onToggleLive={() => toggleLive(item)}
                  onStock={delta => adjustStock(item, delta, true)}
                />
              ))}
            </View>
          )}

          {loadState === 'ready' && items.length > 0 ? (
            <View style={s.bulkRow}>
              <Button label="Import products from CSV" variant="secondary" onPress={() => setCsvOpen(true)} />
            </View>
          ) : null}

          {hasFilters && items.length > 0 && visible.length > 0 ? (
            <Text style={s.resultNote}>Showing {visible.length} of {items.length}</Text>
          ) : null}
        </View>
      </ScreenShell>

      {toast ? (
        <View style={s.toastWrap} pointerEvents="box-none">
          <View style={[s.toast, { bottom: toastBottom }]}>
            <Text style={s.toastText}>{toast.text}</Text>
            {toast.onUndo ? (
              <Pressable onPress={() => { toast.onUndo?.(); setToast(null); }} accessibilityRole="button" accessibilityLabel="Undo" style={s.toastUndo}>
                <Text style={s.toastUndoText}>Undo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <Modal visible={csvOpen} transparent animationType="fade" onRequestClose={closeCsv}>
        <View style={s.overlay}>
          <View style={[s.sheet, { padding: pad }]}>
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={s.sheetTitle}>Import products from CSV</Text>
                <Text style={s.sheetSub}>Paste one product per line. The first line must be the header row.</Text>
              </View>
              <Pressable onPress={closeCsv} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={s.closeBtn}>
                <Ionicons name="close" size={20} color={C.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => setCsvText(current => (current.trim() ? current : CSV_HEADER))}
              accessibilityRole="button"
              accessibilityLabel="Insert the header row"
              style={({ pressed }) => [s.headerInsert, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text-outline" size={16} color={C.primary} />
              <Text style={s.linkText}>Insert the header row</Text>
            </Pressable>

            <TextField
              label="CSV rows"
              value={csvText}
              onChangeText={text => {
                setCsvText(text);
                if (csvError) setCsvError('');
              }}
              placeholder={CSV_HEADER}
              placeholderTextColor={C.textSubtle}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              error={csvError || undefined}
              inputStyle={s.csvInput}
              last
            />

            <View style={s.sheetActions}>
              <Button label="Cancel" variant="secondary" onPress={closeCsv} style={s.flex1} />
              <Button
                label="Import"
                onPress={importCsv}
                loading={importing}
                disabled={!csvText.trim()}
                style={s.flex1}
              />
            </View>
          </View>
        </View>
      </Modal>

      <MobileBottomNav currentTab="catalog" />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [s.chip, active && s.chipActive, pressed && { opacity: 0.8 }]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ProductCard({
  item,
  width,
  busy,
  onOpen,
  onToggleLive,
  onStock,
}: {
  item: InventoryItem;
  width: DimensionValue;
  busy: boolean;
  onOpen: () => void;
  onToggleLive: () => void;
  onStock: (delta: number) => void;
}) {
  const price = item.sellingPrice || item.mrp;
  const out = isOut(item);
  const low = isLow(item);
  const expiring = isExpiring(item);
  const stockTone = out ? C.errorText : low ? '#B45309' : C.textPrimary;
  const stockLabel = out ? 'Out of stock' : low ? 'Low stock' : 'In stock';

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name}`}
      style={({ pressed }) => [s.card, { width }, !item.active && s.cardHidden, pressed && { opacity: 0.94 }]}
    >
      <View style={s.cardTop}>
        <View style={s.thumb}>
          <Ionicons name="cube-outline" size={20} color={C.textSubtle} />
        </View>

        <View style={s.cardInfo}>
          <View style={s.metaRow}>
            <Text style={s.brand} numberOfLines={1}>{item.brand || 'Brand not set'}</Text>
            <Text style={s.sku} numberOfLines={1}>{item.sku}</Text>
          </View>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          <View style={s.metaRow}>
            <Text style={s.category} numberOfLines={1}>{item.category}</Text>
            {item.bin ? (
              <View style={s.binChip}>
                <Ionicons name="location-outline" size={12} color={C.primary} />
                <Text style={s.binText} numberOfLines={1}>{item.bin}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onToggleLive}
          accessibilityRole="switch"
          accessibilityState={{ checked: item.active }}
          accessibilityLabel={`${item.name} visible to customers`}
          hitSlop={4}
          style={[s.liveToggle, item.active ? s.liveOn : s.liveOff]}
        >
          <Text style={[s.liveText, item.active ? s.liveTextOn : s.liveTextOff]}>{item.active ? 'Live' : 'Hidden'}</Text>
        </Pressable>
      </View>

      <View style={s.priceRow}>
        <Text style={s.price}>{formatRupees(price)}</Text>
        {item.mrp > price ? <Text style={s.mrp}>{formatRupees(item.mrp)}</Text> : null}
        <Text style={s.payout}>Net {formatRupees(price * NET_AFTER_FEE)} after 12% fee</Text>
      </View>

      {item.approvalStatus ? (
        <Text style={[s.approval, item.approvalStatus === 'REJECTED' && { color: C.errorText }]}>{approvalText(item)}</Text>
      ) : null}

      <View style={s.cardFooter}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.stockLabel, { color: stockTone }]}>{stockLabel}</Text>
          {expiring && item.expiryDate ? <Text style={s.expiryNote}>Expires {item.expiryDate}</Text> : null}
        </View>

        <View style={s.stepper}>
          <StepButton icon="remove" label="Decrease stock" disabled={out || busy} onPress={() => onStock(-1)} />
          <View style={s.stepValue}>
            {busy ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Text style={[s.stepNum, { color: stockTone }]}>{item.stock}</Text>
            )}
          </View>
          <StepButton icon="add" label="Increase stock" disabled={busy} onPress={() => onStock(1)} />
        </View>
      </View>
    </Pressable>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [s.stepBtn, disabled && { opacity: 0.4 }, pressed && !disabled && { backgroundColor: C.surface }]}
    >
      <Ionicons name={icon} size={20} color={C.textPrimary} />
    </Pressable>
  );
}

function EmptyCard({
  icon,
  title,
  message,
  primary,
  secondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={24} color={C.primary} />
      </View>
      <Text accessibilityRole="header" style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyMessage}>{message}</Text>
      <View style={s.emptyActions}>
        <Button label={primary.label} onPress={primary.onPress} compact style={s.emptyBtn} />
        {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} compact style={s.emptyBtn} /> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  body: { paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },
  flex1: { flex: 1 },

  addBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: S.md,
    borderRadius: R.input,
    backgroundColor: C.primary,
  },
  addBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },

  bannerBtn: { alignSelf: 'flex-start', marginTop: S.sm },

  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  tile: {
    minHeight: 76,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.md,
    justifyContent: 'center',
  },
  tilePhone: { flexBasis: '48%', flexGrow: 1 },
  tileWide: { flexBasis: 0, flexGrow: 1 },
  tileActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, color: C.textPrimary },
  tileLabel: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16, color: C.textSecondary, marginTop: 2 },

  toolbar: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.md,
    gap: S.sm,
  },
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
    backgroundColor: C.background,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: C.textPrimary,
    paddingVertical: 10,
  },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  chipRow: { gap: S.sm, alignItems: 'center', paddingVertical: 2 },
  chip: {
    minHeight: 44,
    paddingHorizontal: S.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  sortLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: 0.4 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.primary },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  skeleton: { height: 140, backgroundColor: C.background, borderRadius: R.card, borderWidth: 1, borderColor: C.border },

  card: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.lg,
    gap: S.sm,
  },
  cardHidden: { backgroundColor: C.surface },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.page,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  brand: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 1 },
  sku: { fontFamily: FontFamily.mono, fontSize: 12, color: C.textSecondary },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  category: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSecondary },
  binChip: {
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
  binText: { fontFamily: FontFamily.mono, fontSize: 12, color: C.primary },

  liveToggle: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: S.md,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveOn: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  liveOff: { backgroundColor: C.background, borderColor: C.border },
  liveText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  liveTextOn: { color: '#15803D' },
  liveTextOff: { color: C.textSubtle },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: S.sm },
  price: { fontFamily: FontFamily.bold, fontSize: 17, color: C.textPrimary },
  mrp: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSubtle, textDecorationLine: 'line-through' },
  payout: { fontFamily: FontFamily.medium, fontSize: 13, color: '#15803D' },
  approval: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: C.textSecondary },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  stockLabel: { fontFamily: FontFamily.semibold, fontSize: 13 },
  expiryNote: { fontFamily: FontFamily.regular, fontSize: 12, color: '#B45309', marginTop: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.input,
    backgroundColor: C.surface,
    padding: 2,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 52, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: FontFamily.bold, fontSize: 17, color: C.textPrimary },

  empty: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: C.textPrimary, textAlign: 'center' },
  emptyMessage: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: C.textSecondary, textAlign: 'center', marginTop: S.xs, maxWidth: 480 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: S.sm, marginTop: S.lg },
  emptyBtn: { minWidth: 160 },

  bulkRow: { alignItems: 'flex-start' },
  resultNote: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSubtle, textAlign: 'center' },

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
  headerInsert: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
  csvInput: {
    minHeight: 160,
    textAlignVertical: 'top',
    fontFamily: FontFamily.mono,
    fontSize: 13,
    lineHeight: 19,
  },
  sheetActions: { flexDirection: 'row', gap: S.md, marginTop: S.lg },
});
