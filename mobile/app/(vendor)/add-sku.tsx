/**
 * Add from GlowVai catalogue (PRD screen 15).
 * The vendor finds a published GlowVai product that is not in the store yet and enters how
 * many are on the shelf (and, optionally, their own price up to the MRP). Product details,
 * photos and the GlowVai price come from the catalogue, so no duplicate products are created.
 * Requesting a product that is not in the catalogue is not available yet; the screen says so.
 * File: mobile/app/(vendor)/add-sku.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import { CATALOG_CATEGORIES, catalogTitle, matchesCatalogSearch, type CatalogProduct } from '../../src/features/catalog/catalogSource';
import { useCatalogue } from '../../src/features/catalog/hooks';
import { useInventory } from '../../src/features/catalog/inventory';
import { formatRupees } from '../../src/features/catalog/stock';
import StockSheet from '../../src/features/catalog/StockSheet';
import { Chip, ChipRow, EmptyState, ProductThumb, SearchBox, SkeletonRows, Toast, cardStyle, useToast } from '../../src/features/catalog/ui';
import { Banner } from '../../src/features/orders/ui';

export default function AddFromCatalogueScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Add from catalogue');

  const catalogue = useCatalogue();
  const { inventory, status: inv, reload: reloadInventory } = useInventory();
  const { toast, showToast } = useToast(5000);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [picked, setPicked] = useState<CatalogProduct | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const notStocked = useMemo(() => catalogue.products.filter(p => !inventory[p.id]), [catalogue.products, inventory]);
  const visible = useMemo(
    () => notStocked.filter(p => (category === 'All' || p.category === category) && matchesCatalogSearch(p, search)),
    [notStocked, category, search],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([catalogue.reload(true), reloadInventory()]);
    setRefreshing(false);
  };

  const pad = isPhone ? S.lg : S.xl;
  const ready = catalogue.state === 'ready' && inv.hasLoaded;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Add from catalogue',
          subtitle: ready ? `${notStocked.length} GlowVai ${notStocked.length === 1 ? 'product' : 'products'} not in your store` : undefined,
          showBack: true,
        }}
        backgroundColor={Colors.surface}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        testID="add-from-catalogue-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          <Text style={s.intro}>
            Find the product, then enter how many you have on the shelf. Product details, photos and price come from GlowVai.
          </Text>

          <View style={s.toolbar}>
            <SearchBox value={search} onChange={setSearch} placeholder="Search brand, product or active" label="Search the GlowVai catalogue" />
            <ChipRow>
              {['All', ...CATALOG_CATEGORIES].map(c => (
                <Chip key={c} label={c === 'All' ? 'All categories' : c} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </ChipRow>
          </View>

          {catalogue.state === 'loading' || (!inv.hasLoaded && inv.state !== 'error') ? (
            <SkeletonRows count={5} />
          ) : catalogue.state === 'error' ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="The catalogue did not load"
              message={catalogue.error}
              action={{ label: 'Try again', onPress: () => void catalogue.reload(true) }}
            />
          ) : !inv.hasLoaded ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="Your stock did not load"
              message={inv.error || 'Try again in a moment.'}
              action={{ label: 'Try again', onPress: () => void reloadInventory() }}
            />
          ) : catalogue.products.length === 0 ? (
            <EmptyState icon="albums-outline" title="No products in the catalogue yet" message="GlowVai has not published any products yet. Check again later." />
          ) : notStocked.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Every GlowVai product is in your store"
              message="Update quantities from Inventory."
              action={{ label: 'Go to Inventory', onPress: () => router.replace('/(vendor)/catalog') }}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No match in the GlowVai catalogue"
              message="Check the spelling, or try another category. It may already be in your store."
              action={{ label: 'Clear search', onPress: () => { setSearch(''); setCategory('All'); } }}
            />
          ) : (
            <View style={[cardStyle, s.list]}>
              {visible.map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => setPicked(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.brandName} ${catalogTitle(p)}, ${formatRupees(p.brandPrice)}. Add to your store`}
                  style={({ pressed }) => [s.row, i > 0 && s.rowDivider, pressed && { backgroundColor: Colors.surface }]}
                >
                  <ProductThumb uri={p.pictures[0]} brand={p.brandName} label={p.productName} size={52} />
                  <View style={s.rowInfo}>
                    {p.brandName ? <Text style={s.brand} numberOfLines={1}>{p.brandName}</Text> : null}
                    <Text style={s.name} numberOfLines={2}>{catalogTitle(p)}</Text>
                    <Text style={s.meta}>
                      {formatRupees(p.brandPrice)}{p.mrp > p.brandPrice ? ` · MRP ${formatRupees(p.mrp)}` : ''}{p.category ? ` · ${p.category}` : ''}
                    </Text>
                  </View>
                  <View style={s.addChip}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={s.addChipText}>Add</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Banner
            tone="info"
            title="Not in the GlowVai catalogue?"
            message="Asking GlowVai to add a new product is not available in the app yet. Only products already in the catalogue can be stocked for now."
          />
        </View>
      </ScreenShell>

      <StockSheet
        product={picked}
        record={picked ? inventory[picked.id] : undefined}
        onClose={() => setPicked(null)}
        onSaved={message => {
          setPicked(null);
          showToast(`${message} It is now in your Inventory.`);
        }}
      />
      <Toast text={toast} bottom={24} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingTop: S.lg, paddingBottom: 96, gap: S.md },
  intro: { ...TypeScale.body, color: Colors.textSecondary },
  toolbar: { gap: S.sm },
  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 76 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 3 },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },
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
});
