/**
 * Inventory (PRD screen 14): every published GlowVai product, with this store's stock.
 *
 * Products come from the GlowVai catalogue (Firestore `products`, PUBLISHED only, read-only).
 * The store's numbers come from GET /api/vendor/inventory and are saved with PUT, one product
 * at a time (the stock sheet) or many at once ("Count stock", sent in batches of up to 100).
 * Low stock means 3 or fewer on the shelf. No sample data.
 * File: mobile/app/(vendor)/catalog.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { friendlyError } from '../../src/services/vendorApi/http';
import { MAX_STOCK, inventoryKey, type CatalogVariant, type InventoryInput, type InventoryRecord } from '../../src/services/vendorApi/inventory';
import useVendorStore from '../../src/store/useVendorStore';
import { useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import { CATALOG_CATEGORIES, catalogTitle, matchesCatalogSearch } from '../../src/features/catalog/catalogSource';
import { useCatalogue } from '../../src/features/catalog/hooks';
import { LOW_STOCK_LEVEL, saveInventory, useInventory } from '../../src/features/catalog/inventory';
import { STATE_LABEL, STATE_TONE, buildRows, formatRupees, type ProductRow } from '../../src/features/catalog/stock';
import {
  Chip,
  ChipRow,
  EmptyState,
  Pill,
  type PillTone,
  ProductThumb,
  SearchBox,
  SkeletonRows,
  Toast,
  cardStyle,
  useToast,
} from '../../src/features/catalog/ui';
import { Banner, PrimaryButton, SecondaryButton } from '../../src/features/orders/ui';
import StockSheet from '../../src/features/catalog/StockSheet';

type ViewKey = 'store' | 'low' | 'paused' | 'not_stocked' | 'all';
const VIEWS: ViewKey[] = ['store', 'low', 'paused', 'not_stocked', 'all'];

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { isPhone } = useLayout();
  useDocumentTitle('Inventory');

  const catalogue = useCatalogue();
  const { inventory, status: inv, reload: reloadInventory } = useInventory();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [view, setView] = useState<ViewKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ productId: string; variantId: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [counting, setCounting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchError, setBatchError] = useState('');

  // Home links here with ?filter=low.
  useEffect(() => {
    if (params.filter && VIEWS.includes(params.filter as ViewKey)) setView(params.filter as ViewKey);
  }, [params.filter]);

  const rows = useMemo(() => buildRows(catalogue.products, inventory), [catalogue.products, inventory]);
  const counts = useMemo(() => {
    const c = { store: 0, low: 0, out: 0, paused: 0, not_stocked: 0 };
    for (const r of rows) {
      if (r.record) c.store += 1;
      if (r.state === 'low' || r.state === 'out') c.low += 1;
      if (r.state === 'out') c.out += 1;
      if (r.state === 'paused') c.paused += 1;
      if (r.state === 'not_stocked') c.not_stocked += 1;
    }
    return c;
  }, [rows]);

  // Default view: the store's own products if it has any, otherwise the whole catalogue.
  const activeView: ViewKey = view ?? (inv.hasLoaded && counts.store === 0 ? 'all' : 'store');

  const visible = useMemo(() => {
    return rows
      .filter(r => {
        if (category !== 'All' && r.product.category !== category) return false;
        if (activeView === 'store' && !r.record) return false;
        if (activeView === 'low' && !(r.state === 'low' || r.state === 'out')) return false;
        if (activeView === 'paused' && r.state !== 'paused') return false;
        if (activeView === 'not_stocked' && r.record) return false;
        return matchesCatalogSearch(r.product, search);
      })
      .sort((a, b) => {
        if (activeView === 'low') return (a.record?.stock ?? 0) - (b.record?.stock ?? 0);
        return 0;
      });
  }, [rows, category, activeView, search]);

  const editing = rows.find(r => r.product.id === editingId) || null;
  const variantCatalogue = useVendorStore(s => s.variantCatalogue);
  const editingVariantTarget = editingVariant
    ? (variantCatalogue[editingVariant.productId] ?? []).find(v => v.id === editingVariant.variantId) ?? null
    : null;
  const canEdit = inv.hasLoaded;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadInventory(), catalogue.reload(true)]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setView('all');
  };

  // ── Count stock (batch) ────────────────────────────────────────────────────
  const changes: InventoryInput[] = useMemo(() => {
    const out: InventoryInput[] = [];
    for (const [productId, text] of Object.entries(drafts)) {
      const t = text.trim();
      if (!/^\d+$/.test(t)) continue;
      const n = Number(t);
      if (n > MAX_STOCK) continue;
      const rec = inventory[productId];
      if (rec && rec.stock === n) continue;
      out.push({ productId, stock: n, isAvailable: rec ? rec.isAvailable : true, unitPriceOverride: rec?.unitPriceOverride });
    }
    return out;
  }, [drafts, inventory]);

  const startCounting = () => {
    setDrafts({});
    setBatchError('');
    setCounting(true);
  };

  const stopCounting = () => {
    setCounting(false);
    setDrafts({});
    setBatchError('');
  };

  const saveBatch = async () => {
    if (!changes.length || savingBatch) return;
    setSavingBatch(true);
    setBatchError('');
    let saved = 0;
    try {
      await saveInventory(changes, n => {
        saved = n;
      });
      stopCounting();
      showToast(`Saved stock for ${changes.length} ${changes.length === 1 ? 'product' : 'products'}.`);
    } catch (err) {
      setBatchError(
        `${saved ? `${saved} saved, the rest were not. ` : 'Not saved. '}${friendlyError(err)}`,
      );
    } finally {
      setSavingBatch(false);
    }
  };

  const goAdd = () => router.push('/(vendor)/add-sku');
  const pad = isPhone ? S.lg : S.xl;
  const ready = catalogue.state === 'ready';

  const subtitle = ready && inv.hasLoaded
    ? `${counts.store} in your store${counts.low ? ` · ${counts.low} running low` : ''}`
    : undefined;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Inventory',
          subtitle,
          showBell: true,
          rightActions: !counting && ready && canEdit ? (
            <Pressable
              onPress={goAdd}
              accessibilityRole="button"
              accessibilityLabel="Add a product from the GlowVai catalogue"
              style={({ pressed }) => [s.addBtn, pressed && { backgroundColor: Colors.primaryPressed }]}
            >
              <Ionicons name="add" size={18} color={Colors.textOnPrimary} />
              <Text style={s.addText}>Add</Text>
            </Pressable>
          ) : undefined,
        }}
        backgroundColor={Colors.surface}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        testID="inventory-screen"
        stickyFooter={
          counting ? (
            <View style={s.footer}>
              {batchError ? <Banner tone="danger" message={batchError} /> : null}
              <View style={s.footerRow}>
                <SecondaryButton label="Cancel" onPress={stopCounting} disabled={savingBatch} style={{ flex: 1 }} />
                <PrimaryButton
                  label={changes.length ? `Save ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}` : 'No changes yet'}
                  onPress={saveBatch}
                  disabled={!changes.length}
                  busy={savingBatch}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          ) : undefined
        }
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {catalogue.state === 'loading' ? (
            <SkeletonRows count={4} />
          ) : catalogue.state === 'error' ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="The GlowVai catalogue did not load"
              message={catalogue.error}
              action={{ label: 'Try again', onPress: () => void catalogue.reload(true) }}
            />
          ) : catalogue.products.length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title="No products in the catalogue yet"
              message="GlowVai has not published any products yet. Products you can stock will appear here."
            />
          ) : (
            <>
              {inv.state === 'error' && !inv.hasLoaded ? (
                <Banner tone="danger" title="Your stock did not load" message={inv.error || ''} actionLabel="Retry" onAction={() => void reloadInventory()} />
              ) : null}
              {inv.state === 'error' && inv.hasLoaded ? (
                <Banner tone="warning" message={`Couldn't refresh your stock. ${inv.error || ''}`} actionLabel="Retry" onAction={() => void reloadInventory()} />
              ) : null}

              {inv.hasLoaded && !counting ? (
                counts.low + counts.paused > 0 ? (
                  <View style={[cardStyle, s.attention]}>
                    <Text accessibilityRole="header" style={s.attentionTitle}>Needs attention</Text>
                    {counts.out > 0 ? (
                      <AttentionRow icon="remove-circle-outline" tone="danger" text={`${counts.out} out of stock`} onPress={() => setView('low')} />
                    ) : null}
                    {counts.low - counts.out > 0 ? (
                      <AttentionRow icon="trending-down-outline" tone="warning" text={`${counts.low - counts.out} with ${LOW_STOCK_LEVEL} or fewer left`} onPress={() => setView('low')} />
                    ) : null}
                    {counts.paused > 0 ? (
                      <AttentionRow icon="pause-circle-outline" tone="neutral" text={`${counts.paused} paused by you`} onPress={() => setView('paused')} />
                    ) : null}
                  </View>
                ) : counts.store > 0 ? (
                  <View style={[cardStyle, s.calm]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.successText} />
                    <Text style={s.calmText}>Nothing needs attention right now.</Text>
                  </View>
                ) : (
                  <View style={[cardStyle, s.calm]}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                    <Text style={s.calmText}>
                      Your store has no stock yet. Tap a product below and enter how many you have on the shelf.
                    </Text>
                  </View>
                )
              ) : null}

              <View style={s.toolbar}>
                <SearchBox value={search} onChange={setSearch} placeholder="Search brand, product or active" label="Search products" />
                <ChipRow>
                  <Chip label="In my store" count={inv.hasLoaded ? counts.store : undefined} active={activeView === 'store'} onPress={() => setView('store')} />
                  <Chip label="Low" count={inv.hasLoaded ? counts.low : undefined} active={activeView === 'low'} onPress={() => setView('low')} />
                  <Chip label="Paused" count={inv.hasLoaded ? counts.paused : undefined} active={activeView === 'paused'} onPress={() => setView('paused')} />
                  <Chip label="Not stocked" count={inv.hasLoaded ? counts.not_stocked : undefined} active={activeView === 'not_stocked'} onPress={() => setView('not_stocked')} />
                  <Chip label="All products" active={activeView === 'all'} onPress={() => setView('all')} />
                </ChipRow>
                <ChipRow>
                  {['All', ...CATALOG_CATEGORIES].map(c => (
                    <Chip key={c} label={c === 'All' ? 'All categories' : c} active={category === c} onPress={() => setCategory(c)} />
                  ))}
                </ChipRow>
              </View>

              {canEdit && visible.length > 0 ? (
                <View style={s.countRow}>
                  <Text style={s.countHint}>
                    {counting ? 'Type the number on the shelf for each product you counted.' : `${visible.length} ${visible.length === 1 ? 'product' : 'products'}`}
                  </Text>
                  {!counting ? (
                    <Pressable onPress={startCounting} accessibilityRole="button" style={({ pressed }) => [s.countBtn, pressed && { opacity: 0.7 }]}>
                      <Ionicons name="create-outline" size={16} color={Colors.primary} />
                      <Text style={s.countBtnText}>Count stock</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {!inv.hasLoaded && inv.state !== 'error' ? (
                <SkeletonRows count={4} />
              ) : visible.length === 0 ? (
                activeView === 'store' && counts.store === 0 && !search && category === 'All' ? (
                  <EmptyState
                    icon="cube-outline"
                    title="No products in your store yet"
                    message={`Pick from ${catalogue.products.length} GlowVai products and enter how many you have on the shelf.`}
                    action={{ label: 'Show all products', onPress: () => setView('all') }}
                  />
                ) : (
                  <EmptyState
                    icon="search-outline"
                    title="Nothing matches"
                    message="No products match this search or filter."
                    action={{ label: 'Clear filters', onPress: clearFilters }}
                  />
                )
              ) : (
                <View style={[cardStyle, s.list]}>
                  {visible.map((r, i) => (
                    <React.Fragment key={r.product.id}>
                      <StockRow
                        row={r}
                        first={i === 0}
                        counting={counting}
                        draft={drafts[r.product.id]}
                        onDraft={t => setDrafts(d => ({ ...d, [r.product.id]: t.replace(/[^0-9]/g, '').slice(0, 6) }))}
                        onPress={() => (canEdit ? setEditingId(r.product.id) : undefined)}
                        disabled={!canEdit}
                      />
                      {!counting && (variantCatalogue[r.product.id]?.length ?? 0) > 0 ? (
                        <VariantRows
                          productId={r.product.id}
                          variants={variantCatalogue[r.product.id]}
                          records={inventory}
                          disabled={!canEdit}
                          onPress={variantId => setEditingVariant({ productId: r.product.id, variantId })}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}
                </View>
              )}

              {!counting ? (
                <View style={s.links}>
                  <Pressable onPress={() => router.push('/(vendor)/expiry')} accessibilityRole="link" style={({ pressed }) => [s.link, pressed && { opacity: 0.7 }]}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <Text style={s.linkText}>Batches and expiry</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScreenShell>

      <StockSheet
        product={editing?.product || null}
        record={editing?.record}
        onClose={() => setEditingId(null)}
        onSaved={message => {
          setEditingId(null);
          showToast(message);
        }}
      />
      <StockSheet
        product={editingVariant ? rows.find(r => r.product.id === editingVariant.productId)?.product ?? null : null}
        record={editingVariant && editingVariantTarget ? inventory[inventoryKey(editingVariant.productId, editingVariant.variantId)] : undefined}
        variant={editingVariantTarget}
        onClose={() => setEditingVariant(null)}
        onSaved={message => {
          setEditingVariant(null);
          showToast(message);
        }}
      />

      <Toast text={toast} bottom={isPhone ? 84 : 24} />
    </View>
  );
}

function AttentionRow({
  icon,
  tone,
  text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'danger' | 'warning' | 'neutral';
  text: string;
  onPress: () => void;
}) {
  const color = tone === 'danger' ? Colors.dangerText : tone === 'warning' ? Colors.warningText : Colors.textSecondary;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Show ${text}`} style={({ pressed }) => [s.attRow, pressed && { backgroundColor: Colors.surface }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={s.attText}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

/** A product's variants, nested under its row. Each variant is its own stock line; tap to set its stock. */
function VariantRows({
  productId,
  variants,
  records,
  disabled,
  onPress,
}: {
  productId: string;
  variants: CatalogVariant[];
  records: Record<string, InventoryRecord>;
  disabled: boolean;
  onPress: (variantId: string) => void;
}) {
  return (
    <View style={s.variantBox}>
      {variants.map(v => {
        const rec = records[inventoryKey(productId, v.id)];
        const label = rec
          ? !rec.isAvailable
            ? 'Paused'
            : rec.stock === 0
              ? 'Out of stock'
              : rec.stock <= LOW_STOCK_LEVEL
                ? 'Running low'
                : 'Selling'
          : 'Not set';
        const tone: PillTone = !rec || !rec.isAvailable ? 'neutral' : rec.stock === 0 ? 'danger' : rec.stock <= LOW_STOCK_LEVEL ? 'warning' : 'success';
        return (
          <Pressable
            key={v.id}
            onPress={() => onPress(v.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${v.label}, ${rec ? `${rec.stock} on the shelf, ${label}` : 'stock not set'}. Update variant stock`}
            style={({ pressed }) => [s.variantRow, pressed && { backgroundColor: Colors.surface }]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.variantLabel} numberOfLines={1}>{v.label}</Text>
              <Text style={s.meta}>
                {formatRupees(v.price)}
                {!v.isAvailable ? ' · not on sale at GlowVai' : ''}
              </Text>
            </View>
            <Pill label={label} tone={tone} />
            <Text style={s.variantStock}>{rec ? rec.stock : '–'}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

function StockRow({
  row,
  first,
  counting,
  draft,
  onDraft,
  onPress,
  disabled,
}: {
  row: ProductRow;
  first: boolean;
  counting: boolean;
  draft?: string;
  onDraft: (t: string) => void;
  onPress: () => void;
  disabled: boolean;
}) {
  const { product, record, state } = row;
  const stock = record?.stock;
  const stockColor = state === 'out' ? Colors.dangerText : state === 'low' ? Colors.warningText : Colors.textPrimary;
  const price = record?.unitPriceOverride ?? product.brandPrice;
  const label = `${product.brandName ? product.brandName + ' ' : ''}${catalogTitle(product)}. ${
    record ? `${record.stock} on the shelf. ${STATE_LABEL[state]}.` : 'Not in your store.'
  } ${counting ? '' : record ? 'Update stock.' : 'Add to your store.'}`;

  const body = (
    <>
      <ProductThumb uri={product.pictures[0]} brand={product.brandName} label={product.productName} size={52} />
      <View style={s.rowInfo}>
        {product.brandName ? <Text style={s.brand} numberOfLines={1}>{product.brandName}</Text> : null}
        <Text style={s.name} numberOfLines={2}>{catalogTitle(product)}</Text>
        <View style={s.metaRow}>
          <Text style={s.meta}>
            {formatRupees(price)}{record?.unitPriceOverride ? ' your price' : ''}
          </Text>
          {state !== 'selling' && state !== 'not_stocked' ? <Pill label={STATE_LABEL[state]} tone={STATE_TONE[state]} /> : null}
        </View>
      </View>
    </>
  );

  if (counting) {
    return (
      <View style={[s.row, !first && s.rowDivider]}>
        {body}
        <TextInput
          value={draft ?? (stock !== undefined ? String(stock) : '')}
          onChangeText={onDraft}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="–"
          placeholderTextColor={Colors.textSubtle}
          accessibilityLabel={`Units on the shelf for ${product.productName}`}
          style={[s.countInput, draft !== undefined && draft !== String(stock ?? '') && s.countInputChanged]}
          selectTextOnFocus
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.row, !first && s.rowDivider, pressed && { backgroundColor: Colors.surface }]}
    >
      {body}
      <View style={s.stockCol}>
        {record ? (
          <>
            <Text style={[s.stockNum, { color: stockColor }]}>{stock}</Text>
            <Text style={s.stockLabel}>on shelf</Text>
          </>
        ) : (
          <View style={s.addChip}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={s.addChipText}>Add</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingTop: S.lg, paddingBottom: 120, gap: S.md },

  addBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: S.md,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  addText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textOnPrimary },

  attention: { paddingTop: S.md, paddingBottom: S.xs },
  attentionTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary, paddingHorizontal: S.lg, marginBottom: S.xs },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: 44, paddingHorizontal: S.lg },
  attText: { ...TypeScale.body, color: Colors.textPrimary, flex: 1 },
  calm: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.lg },
  calmText: { ...TypeScale.body, color: Colors.textSecondary, flex: 1 },

  toolbar: { gap: S.sm },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.md, minHeight: 44 },
  countHint: { ...TypeScale.caption, color: Colors.textSecondary, flex: 1 },
  countBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: S.xs },
  countBtnText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 76 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 3 },
  variantBox: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.surface, paddingLeft: S.lg + 52 + S.md, paddingRight: S.lg },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 56, paddingVertical: S.sm },
  variantLabel: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  variantStock: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary, minWidth: 36, textAlign: 'right', fontVariant: ['tabular-nums'] },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm },
  meta: { ...TypeScale.caption, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  stockCol: { alignItems: 'flex-end', minWidth: 56 },
  stockNum: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  stockLabel: { ...TypeScale.caption, color: Colors.textMuted },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: S.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
  },
  addChipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.primary },
  countInput: {
    width: 76,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  countInputChanged: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

  footer: { gap: S.sm, paddingBottom: S.xs },
  footerRow: { flexDirection: 'row', gap: S.sm },

  links: { gap: S.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
});
