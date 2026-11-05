/**
 * Add from GlowVai catalogue (PRD screen 15 and 3.1, option 1).
 * The vendor searches the published GlowVai catalogue, picks a product and enters the
 * quantity on the shelf, with an optional expiry date and shelf location. Product
 * details, photos and price come from the catalogue and are never typed by the vendor,
 * so no duplicate products are created. Anything missing goes to "Request a product".
 * File: mobile/app/(vendor)/add-sku.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import { inventoryApi } from '../../src/services/api';
import type { InventoryItem } from '../../src/store/useVendorStore';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { Banner, Button, TextField, useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import {
  CATALOG_CATEGORIES,
  catalogSku,
  matchesCatalogSearch,
  type CatalogProduct,
} from '../../src/features/catalog/catalogSource';
import { useCatalogue, useStoreInventory } from '../../src/features/catalog/hooks';
import { daysUntil, findCatalogMatch, formatDate, formatRupees, friendlyError, NEAR_EXPIRY_DAYS, parseDate } from '../../src/features/catalog/stock';
import {
  Chip,
  ChipRow,
  EmptyState,
  Pill,
  ProductThumb,
  SearchBox,
  Sheet,
  SkeletonRows,
  Toast,
  cardStyle,
  useToast,
} from '../../src/features/catalog/ui';

const MAX_QTY = 9999;

export default function AddFromCatalogueScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Add from catalogue');

  const catalogue = useCatalogue();
  const inventory = useStoreInventory();
  const { toast, showToast } = useToast(5000);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [picked, setPicked] = useState<CatalogProduct | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Catalogue ids already stocked by this store.
  const stocked = useMemo(() => {
    const ids = new Set<string>();
    for (const item of inventory.items) {
      const match = findCatalogMatch(item, catalogue.byId, catalogue.products);
      if (match) ids.add(match.id);
    }
    return ids;
  }, [inventory.items, catalogue.byId, catalogue.products]);

  const visible = useMemo(
    () => catalogue.products.filter(p => (category === 'All' || p.category === category) && matchesCatalogSearch(p, search)),
    [catalogue.products, category, search],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([catalogue.reload(true), inventory.reload()]);
    setRefreshing(false);
  };

  const pad = isPhone ? S.lg : S.xl;
  const count = catalogue.products.length;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Add from catalogue',
          subtitle: catalogue.state === 'ready' ? `${count} GlowVai ${count === 1 ? 'product' : 'products'}` : undefined,
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
                <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </ChipRow>
          </View>

          {catalogue.state === 'loading' ? (
            <SkeletonRows count={5} />
          ) : catalogue.state === 'error' ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="The catalogue did not load"
              message={catalogue.error}
              action={{ label: 'Try again', onPress: () => void catalogue.reload(true) }}
            />
          ) : count === 0 ? (
            <EmptyState
              icon="albums-outline"
              title="No products in the catalogue yet"
              message="GlowVai has not published any products yet. Check again later, or ask for a product you sell."
              action={{ label: 'Request a product', onPress: () => setRequestOpen(true) }}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Not in the GlowVai catalogue"
              message={
                category !== 'All' && CATALOG_CATEGORIES.includes(category as any) && !catalogue.products.some(p => p.category === category)
                  ? `There are no ${category.toLowerCase()} in the catalogue yet.`
                  : 'No product matches this search. Check the spelling, or ask GlowVai to add it.'
              }
              action={{ label: 'Request a product', onPress: () => setRequestOpen(true) }}
              secondary={search || category !== 'All' ? { label: 'Clear search', onPress: () => { setSearch(''); setCategory('All'); } } : undefined}
            />
          ) : (
            <View style={[cardStyle, s.list]}>
              {visible.map((p, i) => (
                <CatalogueRow key={p.id} product={p} first={i === 0} inStore={stocked.has(p.id)} onPress={() => setPicked(p)} />
              ))}
            </View>
          )}

          {catalogue.state === 'ready' && visible.length > 0 ? (
            <Pressable onPress={() => setRequestOpen(true)} accessibilityRole="button" style={({ pressed }) => [s.link, pressed && { opacity: 0.7 }]}>
              <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
              <Text style={s.linkText}>Can't find it? Request a product</Text>
            </Pressable>
          ) : null}
        </View>
      </ScreenShell>

      <AddSheet
        product={picked}
        inStore={!!picked && stocked.has(picked.id)}
        onClose={() => setPicked(null)}
        onGoToInventory={() => {
          setPicked(null);
          router.push('/(vendor)/catalog');
        }}
        onAdded={(item, qty) => {
          if (item) inventory.addInventoryItem(item);
          setPicked(null);
          showToast(`Added to your store with ${qty} on the shelf. GlowVai reviews new items before they go on sale.`);
        }}
      />

      <Sheet visible={requestOpen} title="Request a product" onClose={() => setRequestOpen(false)}>
        <Banner
          tone="info"
          title="Not available yet"
          message="Product requests cannot be sent from the app yet. Until they can, tell GlowVai support the brand, product name and size, and a photo of the pack if you have one."
        />
        <Text style={s.requestNote}>
          Products that are not in the GlowVai catalogue cannot be sold on GlowVai. GlowVai checks every new product before adding it.
        </Text>
        <Button
          label="Contact GlowVai support"
          variant="secondary"
          onPress={() => {
            setRequestOpen(false);
            router.push('/(vendor)/support');
          }}
          style={{ marginTop: S.lg }}
        />
      </Sheet>

      <Toast text={toast} />
    </View>
  );
}

function CatalogueRow({ product, first, inStore, onPress }: { product: CatalogProduct; first: boolean; inStore: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.brandName} ${product.productName}${product.volume ? ', ' + product.volume : ''}${product.brandPrice ? ', ' + formatRupees(product.brandPrice) : ''}${inStore ? ', already in your store' : ''}`}
      style={({ pressed }) => [s.row, !first && s.rowDivider, pressed && { backgroundColor: Colors.surface }]}
    >
      <ProductThumb uri={product.pictures[0]} brand={product.brandName} label={product.productName} size={56} />
      <View style={s.rowInfo}>
        <Text style={s.brand} numberOfLines={1}>{product.brandName}</Text>
        <Text style={s.name} numberOfLines={2}>{product.productName}</Text>
        <Text style={s.meta} numberOfLines={1}>
          {[product.volume, product.category].filter(Boolean).join(' · ')}
        </Text>
        {inStore ? <Pill label="In your store" tone="info" icon="checkmark" /> : null}
      </View>
      <View style={s.priceCol}>
        {product.brandPrice ? <Text style={s.price}>{formatRupees(product.brandPrice)}</Text> : null}
        <Ionicons name={inStore ? 'checkmark-circle' : 'add-circle-outline'} size={24} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

function AddSheet({
  product,
  inStore,
  onClose,
  onGoToInventory,
  onAdded,
}: {
  product: CatalogProduct | null;
  inStore: boolean;
  onClose: () => void;
  onGoToInventory: () => void;
  onAdded: (item: InventoryItem | null, qty: number) => void;
}) {
  const [qty, setQty] = useState('');
  const [expiry, setExpiry] = useState('');
  const [shelf, setShelf] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);

  if (product && product.id !== lastId) {
    setLastId(product.id);
    setQty('');
    setExpiry('');
    setShelf('');
    setTouched(false);
    setError('');
  }

  if (!product) return <Sheet visible={false} title="" onClose={onClose}>{null}</Sheet>;

  const n = /^\d+$/.test(qty) ? Number(qty) : NaN;
  const qtyError = !qty ? 'Enter how many you have.' : !(n >= 1) ? 'Enter 1 or more.' : n > MAX_QTY ? `That is more than ${MAX_QTY}. Check the number.` : '';

  const expiryTrim = expiry.trim();
  const expiryDays = daysUntil(expiryTrim);
  const expiryError = !expiryTrim
    ? ''
    : !parseDate(expiryTrim)
      ? 'Use the date printed on the pack as YYYY-MM-DD, for example 2027-03-31.'
      : expiryDays !== null && expiryDays < 0
        ? 'This stock has already expired. Expired products cannot be sold.'
        : '';
  const expiryWarn = !expiryError && expiryDays !== null && expiryDays <= NEAR_EXPIRY_DAYS
    ? `Expires in ${expiryDays} ${expiryDays === 1 ? 'day' : 'days'} (${formatDate(expiryTrim)}). Sell it first.`
    : '';

  const noPrice = !(product.brandPrice > 0);
  const canSave = !inStore && !noPrice && !qtyError && !expiryError && !saving;

  const save = async () => {
    setTouched(true);
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const body: Record<string, any> = {
        name: product.productName,
        brand: product.brandName,
        category: 'Skincare',
        shopCategory: product.category,
        packSize: product.volume,
        images: product.pictures.slice(0, 6),
        keyActives: product.keyActives,
        sku: catalogSku(product.id),
        mrp: product.mrp || product.brandPrice,
        sellingPrice: product.brandPrice,
        stock: n,
      };
      if (shelf.trim()) body.bin = shelf.trim();
      if (expiryTrim) body.expiryDate = expiryTrim;
      const res: any = await inventoryApi.add(body);
      onAdded(res?.item || null, n);
    } catch (err) {
      setError(`Not added. ${friendlyError(err, 'Please try again.')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible
      title={inStore ? 'Already in your store' : 'Add to your store'}
      onClose={onClose}
      footer={
        inStore ? (
          <Button label="Update stock in Inventory" onPress={onGoToInventory} />
        ) : (
          <Button label="Add to my store" onPress={save} loading={saving} disabled={noPrice || saving} />
        )
      }
    >
      <View style={[cardStyle, s.summary]}>
        <ProductThumb uri={product.pictures[0]} brand={product.brandName} label={product.productName} size={72} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={s.brand}>{product.brandName}</Text>
          <Text style={s.name}>{product.productName}</Text>
          <Text style={s.meta}>{[product.volume, product.category].filter(Boolean).join(' · ')}</Text>
          {product.brandPrice ? (
            <Text style={s.meta}>
              Price on GlowVai <Text style={s.priceInline}>{formatRupees(product.brandPrice)}</Text>
              {product.mrp > product.brandPrice ? ` · MRP ${formatRupees(product.mrp)}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {inStore ? (
        <Text style={s.requestNote}>This product is already in your store. Change its quantity from Inventory so there is only one entry for it.</Text>
      ) : noPrice ? (
        <Banner tone="warning" title="Not ready to stock" message="GlowVai has not set a price for this product yet, so it cannot be added. Try again later." />
      ) : (
        <>
          <TextField
            label="Quantity on the shelf"
            value={qty}
            onChangeText={t => setQty(t.replace(/[^0-9]/g, '').slice(0, 5))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            error={touched || qty ? qtyError || undefined : undefined}
            inputStyle={s.qtyInput}
          />
          <TextField
            label="Expiry date of this stock"
            optional
            value={expiry}
            onChangeText={setExpiry}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            error={expiryError || undefined}
            helper="Printed on the pack. Expired stock must not be sold."
          />
          {expiryWarn ? <Banner tone="warning" message={expiryWarn} style={{ marginTop: -S.sm }} /> : null}
          <TextField
            label="Shelf location"
            optional
            value={shelf}
            onChangeText={setShelf}
            placeholder="For example Rack 2, top shelf"
            maxLength={60}
            helper="Helps your staff find it when packing orders."
          />
          <Text style={s.batchNote}>Batch numbers can be recorded once batch tracking is available.</Text>
          {error ? <Banner tone="error" message={error} style={{ marginTop: S.md, marginBottom: 0 }} /> : null}
        </>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingTop: S.lg, paddingBottom: S.xxl * 2, gap: S.md },
  intro: { ...TypeScale.body, color: Colors.textSecondary },
  toolbar: { gap: S.sm },

  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 80 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 3 },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },
  priceCol: { alignItems: 'flex-end', gap: 6 },
  price: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  priceInline: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },

  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'center' },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  summary: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, marginBottom: S.lg },
  qtyInput: { fontFamily: FontFamily.semibold, fontSize: 20, fontVariant: ['tabular-nums'] },
  requestNote: { ...TypeScale.body, color: Colors.textSecondary },
  batchNote: { ...TypeScale.caption, color: Colors.textMuted },
});
