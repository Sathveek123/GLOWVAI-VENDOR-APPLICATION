/**
 * Inventory (PRD screen 14): the store's stock of GlowVai products.
 * Search, the five catalogue categories, low / out-of-stock / expiry views, a calm
 * "needs attention" card, and exact-quantity stock updates in a sheet (one save, with a
 * reason). Stock comes from the vendor backend (inventoryApi); product photos and
 * categories come from the GlowVai catalogue. No sample data.
 * File: mobile/app/(vendor)/catalog.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import type { InventoryItem } from '../../src/store/useVendorStore';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import { CATALOG_CATEGORIES } from '../../src/features/catalog/catalogSource';
import { useCatalogue, useStoreInventory } from '../../src/features/catalog/hooks';
import {
  expiryLine,
  expiryState,
  findCatalogMatch,
  isLow,
  isOut,
  onHand,
  reserved,
  sellState,
  SELL_LABEL,
  NEAR_EXPIRY_DAYS,
  type SellState,
} from '../../src/features/catalog/stock';
import {
  Chip,
  ChipRow,
  EmptyState,
  Pill,
  ProductThumb,
  SearchBox,
  SkeletonRows,
  Toast,
  cardStyle,
  useToast,
  type PillTone,
} from '../../src/features/catalog/ui';
import StockSheet from '../../src/features/catalog/StockSheet';

type View_ = 'all' | 'low' | 'out' | 'expiry';

interface Row {
  item: InventoryItem;
  photo?: string;
  category: string;
  volume: string;
  state: SellState;
}

const SELL_TONE: Record<SellState, PillTone> = {
  selling: 'success',
  paused: 'neutral',
  out: 'danger',
  expired: 'danger',
  pending: 'info',
  rejected: 'danger',
};

export default function InventoryScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Inventory');

  const { items, state, error, reload, updateInventoryItem } = useStoreInventory();
  const catalogue = useCatalogue();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [view, setView] = useState<View_>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const rows: Row[] = useMemo(
    () =>
      items.map(item => {
        const match = findCatalogMatch(item, catalogue.byId, catalogue.products);
        return {
          item,
          photo: item.images?.[0] || match?.pictures[0],
          category: match?.category || item.shopCategory || item.category || '',
          volume: match?.volume || item.packSize || '',
          state: sellState(item),
        };
      }),
    [items, catalogue.byId, catalogue.products],
  );

  const counts = useMemo(
    () => ({
      out: rows.filter(r => isOut(r.item) && expiryState(r.item) !== 'expired').length,
      low: rows.filter(r => isLow(r.item)).length,
      expired: rows.filter(r => expiryState(r.item) === 'expired' && onHand(r.item) > 0).length,
      soon: rows.filter(r => expiryState(r.item) === 'soon').length,
    }),
    [rows],
  );
  const attention = counts.out + counts.low + counts.expired + counts.soon;

  const visible = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter(r => {
        if (category !== 'All' && r.category !== category) return false;
        if (view === 'low' && !isLow(r.item)) return false;
        if (view === 'out' && !isOut(r.item)) return false;
        if (view === 'expiry' && !['expired', 'soon'].includes(expiryState(r.item))) return false;
        if (!words.length) return true;
        const hay = `${r.item.brand || ''} ${r.item.name} ${r.volume} ${r.category} ${r.item.sku || ''} ${r.item.bin || ''}`.toLowerCase();
        return words.every(w => hay.includes(w));
      })
      .sort((a, b) => {
        // Problems first, then by name.
        const rank = (r: Row) => (r.state === 'expired' ? 0 : isOut(r.item) ? 1 : isLow(r.item) ? 2 : 3);
        return rank(a) - rank(b) || a.item.name.localeCompare(b.item.name);
      });
  }, [rows, search, category, view]);

  const editing = rows.find(r => r.item.productId === editingId) || null;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), catalogue.reload(true)]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setView('all');
  };

  const goAdd = () => router.push('/(vendor)/add-sku');
  const pad = isPhone ? S.lg : S.xl;
  const ready = state === 'ready';

  const subtitle = ready
    ? items.length === 0
      ? 'No products yet'
      : `${items.length} ${items.length === 1 ? 'product' : 'products'}${attention ? ` · ${attention} need attention` : ''}`
    : undefined;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Inventory',
          subtitle,
          showBell: true,
          rightActions: (
            <Pressable
              onPress={goAdd}
              accessibilityRole="button"
              accessibilityLabel="Add a product from the GlowVai catalogue"
              style={({ pressed }) => [s.addBtn, pressed && { backgroundColor: Colors.primaryPressed }]}
            >
              <Ionicons name="add" size={18} color={Colors.background} />
              <Text style={s.addText}>Add</Text>
            </Pressable>
          ),
        }}
        backgroundColor={Colors.surface}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        testID="inventory-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {state === 'loading' ? (
            <SkeletonRows count={4} />
          ) : state === 'error' ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="Your stock did not load"
              message={error}
              action={{ label: 'Try again', onPress: () => void reload() }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No products in your store yet"
              message={
                catalogue.state === 'ready' && catalogue.products.length
                  ? `Pick from ${catalogue.products.length} products in the GlowVai catalogue and enter how many you have on the shelf.`
                  : 'Pick products from the GlowVai catalogue and enter how many you have on the shelf.'
              }
              action={{ label: 'Add from GlowVai catalogue', onPress: goAdd }}
            />
          ) : (
            <>
              {attention > 0 ? (
                <View style={[cardStyle, s.attention]}>
                  <Text accessibilityRole="header" style={s.attentionTitle}>Needs attention</Text>
                  {counts.expired > 0 ? (
                    <AttentionRow icon="ban-outline" tone="danger" text={`${counts.expired} expired · not for sale`} onPress={() => setView('expiry')} />
                  ) : null}
                  {counts.out > 0 ? (
                    <AttentionRow icon="remove-circle-outline" tone="danger" text={`${counts.out} out of stock`} onPress={() => setView('out')} />
                  ) : null}
                  {counts.low > 0 ? (
                    <AttentionRow icon="trending-down-outline" tone="warning" text={`${counts.low} running low`} onPress={() => setView('low')} />
                  ) : null}
                  {counts.soon > 0 ? (
                    <AttentionRow icon="time-outline" tone="warning" text={`${counts.soon} expiring within ${NEAR_EXPIRY_DAYS} days`} onPress={() => setView('expiry')} />
                  ) : null}
                </View>
              ) : (
                <View style={[cardStyle, s.calm]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                  <Text style={s.calmText}>Nothing needs attention right now.</Text>
                </View>
              )}

              <View style={s.toolbar}>
                <SearchBox value={search} onChange={setSearch} placeholder="Search brand or product" label="Search your products" />
                <ChipRow>
                  {['All', ...CATALOG_CATEGORIES].map(c => (
                    <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
                  ))}
                </ChipRow>
                <ChipRow>
                  <Chip label="All stock" active={view === 'all'} onPress={() => setView('all')} />
                  <Chip label="Low" count={counts.low} active={view === 'low'} onPress={() => setView('low')} />
                  <Chip label="Out of stock" count={rows.filter(r => isOut(r.item)).length} active={view === 'out'} onPress={() => setView('out')} />
                  <Chip label="Expiry" count={counts.expired + counts.soon} active={view === 'expiry'} onPress={() => setView('expiry')} />
                </ChipRow>
              </View>

              {visible.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="Nothing matches"
                  message="No products match this search or filter."
                  action={{ label: 'Clear filters', onPress: clearFilters }}
                />
              ) : (
                <View style={[cardStyle, s.list]}>
                  {visible.map((r, i) => (
                    <StockRow key={r.item.productId} row={r} first={i === 0} onPress={() => setEditingId(r.item.productId)} />
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => router.push('/(vendor)/expiry')}
                accessibilityRole="link"
                style={({ pressed }) => [s.link, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={s.linkText}>Batches and expiry</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </Pressable>
            </>
          )}
        </View>
      </ScreenShell>

      <StockSheet
        item={editing?.item || null}
        photo={editing?.photo}
        volume={editing?.volume}
        onClose={() => setEditingId(null)}
        onSaved={(id, fields, message) => {
          updateInventoryItem(id, fields);
          setEditingId(null);
          showToast(message);
        }}
      />

      <Toast text={toast} bottom={isPhone ? 84 : 24} />
      <MobileBottomNav currentTab="catalog" />
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
  tone: 'danger' | 'warning';
  text: string;
  onPress: () => void;
}) {
  const color = tone === 'danger' ? Colors.danger : Colors.warning;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Show ${text}`} style={({ pressed }) => [s.attRow, pressed && { backgroundColor: Colors.surface }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={s.attText}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function StockRow({ row, first, onPress }: { row: Row; first: boolean; onPress: () => void }) {
  const { item, photo, volume, state } = row;
  const stock = onHand(item);
  const held = reserved(item);
  const exp = expiryState(item);
  const stockColor = state === 'expired' || stock === 0 ? Colors.danger : isLow(item) ? Colors.warning : Colors.textPrimary;
  const label = `${item.brand ? item.brand + ' ' : ''}${item.name}${volume ? ', ' + volume : ''}. ${stock} on the shelf${held ? `, ${held} held for orders` : ''}. ${SELL_LABEL[state]}. Update stock.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.row, !first && s.rowDivider, pressed && { backgroundColor: Colors.surface }]}
    >
      <ProductThumb uri={photo} brand={item.brand} label={item.name} size={56} />
      <View style={s.rowInfo}>
        {item.brand ? <Text style={s.brand} numberOfLines={1}>{item.brand}</Text> : null}
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        <View style={s.metaRow}>
          {volume ? <Text style={s.meta}>{volume}</Text> : null}
          {item.bin && item.bin !== 'BIN-UNASSIGNED' ? <Text style={s.bin}>{item.bin}</Text> : null}
        </View>
        {state !== 'selling' ? <Pill label={SELL_LABEL[state]} tone={SELL_TONE[state]} /> : null}
        {exp === 'soon' ? <Text style={s.soon}>{expiryLine(item.expiryDate)}</Text> : null}
      </View>
      <View style={s.stockCol}>
        <Text style={[s.stockNum, { color: stockColor }]}>{stock}</Text>
        <Text style={s.stockLabel}>{held ? `${held} held` : 'on shelf'}</Text>
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
  addText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.background },

  attention: { paddingTop: S.md, paddingBottom: S.xs },
  attentionTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary, paddingHorizontal: S.lg, marginBottom: S.xs },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: 44, paddingHorizontal: S.lg },
  attText: { ...TypeScale.body, color: Colors.textPrimary, flex: 1 },
  calm: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.lg },
  calmText: { ...TypeScale.body, color: Colors.textSecondary },

  toolbar: { gap: S.sm },

  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 80 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 3 },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },
  bin: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.binText },
  soon: { ...TypeScale.caption, color: Colors.warning },
  stockCol: { alignItems: 'flex-end', minWidth: 56 },
  stockNum: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  stockLabel: { ...TypeScale.caption, color: Colors.textMuted },

  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
});
