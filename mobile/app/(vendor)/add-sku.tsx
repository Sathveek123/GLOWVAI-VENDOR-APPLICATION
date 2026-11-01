/**
 * Add or edit a product SKU. Saves through inventoryApi (live) and uploads photos through uploadsApi.
 * Shades are kept with the product description for now; the API has no variant field yet.
 * File: mobile/app/(vendor)/add-sku.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import ScreenShell from '../../src/components/ScreenShell';
import useVendorStore from '../../src/store/useVendorStore';
import type { InventoryItem } from '../../src/store/useVendorStore';
import { inventoryApi, uploadsApi } from '../../src/services/api';
import {
  Banner,
  Button,
  FieldRow,
  Section,
  TextField,
  S,
  R,
  SellerColors as C,
  useLayout,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

const CATEGORIES = ['Skincare', 'Makeup', 'Hair care', 'Fragrance', 'Bath & Body', 'Tools & Brushes'];

// Categories used by the GlowVAI shop. Only Skincare products with one of these are listed there for now.
const SHOP_CATEGORIES = ['Serums', 'Moisturizers', 'Suncare', 'Cleansers', 'Treatments'];

const VOLUME_SIZES = ['30 ml', '50 ml', '100 ml', '200 ml', '250 ml', '500 ml'];

const GST_SLABS = [
  { value: 5, note: 'Essential oils and soaps' },
  { value: 18, note: 'Standard beauty and cosmetics' },
  { value: 28, note: 'Luxury fragrance and deodorants' },
];

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const NET_AFTER_FEE = 0.88; // GlowVAI keeps a 12% fee on each sale
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface Shade {
  id: string;
  name: string;
  color: string;
}

export default function AddSkuScreen() {
  const router = useRouter();
  const { isPhone, canSplit } = useLayout();
  const params = useLocalSearchParams<{
    productId?: string;
    name?: string;
    brand?: string;
    category?: string;
    mrp?: string;
  }>();
  const { productId } = params;
  const { inventory, addInventoryItem, updateInventoryItem } = useVendorStore();
  const items = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);

  const existingItem = productId ? items.find(i => i.productId === productId) : undefined;
  const isEditing = !!productId;
  const missingProduct = isEditing && !existingItem;
  useDocumentTitle(isEditing ? 'Edit product' : 'Add product');

  // A new product can start from a recommendation (name, brand, category, MRP passed in the route).
  const presetCategory = CATEGORIES.includes(params.category || '') ? params.category : undefined;

  // Basic information
  const [productName, setProductName] = useState(existingItem?.name || params.name || '');
  const [brand, setBrand] = useState(existingItem?.brand || params.brand || '');
  const [category, setCategory] = useState(existingItem?.category || presetCategory || 'Skincare');
  const [shopCategory, setShopCategory] = useState<string>(existingItem?.shopCategory || '');
  const [keyActivesText, setKeyActivesText] = useState((existingItem?.keyActives || []).join(', '));
  const [description, setDescription] = useState(existingItem?.description || '');

  // Shade (makeup) and pack size (everything else)
  const [shades, setShades] = useState<Shade[]>([]);
  const [selectedShadeId, setSelectedShadeId] = useState<string | null>(null);
  const [showShadeForm, setShowShadeForm] = useState(false);
  const [newShadeName, setNewShadeName] = useState('');
  const [newShadeHex, setNewShadeHex] = useState('#E0A899');
  const [shadeError, setShadeError] = useState('');
  const [selectedVolume, setSelectedVolume] = useState(existingItem?.packSize || '');

  // Pricing and tax
  const [mrp, setMrp] = useState(existingItem ? String(existingItem.mrp) : params.mrp || '');
  const [sellingPrice, setSellingPrice] = useState(existingItem ? String(existingItem.sellingPrice) : '');
  const [gstPercent, setGstPercent] = useState(existingItem?.gstPercent || 18);

  // Stock and storage
  const [skuCode, setSkuCode] = useState(existingItem?.sku || '');
  const [initialStock, setInitialStock] = useState(existingItem ? String(existingItem.stock) : '');
  const [shelfLocation, setShelfLocation] = useState(existingItem?.bin || '');
  const [batchExpiry, setBatchExpiry] = useState(existingItem?.expiryDate || '');

  // Photos
  const [images, setImages] = useState<string[]>(existingItem?.images || []);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  // Save state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedItem, setSavedItem] = useState<InventoryItem | null>(null);

  const isMakeup = category === 'Makeup';
  const isSkincare = category === 'Skincare';
  const selectedShade = shades.find(sh => sh.id === selectedShadeId) || null;

  const mrpNum = parseFloat(mrp) || 0;
  const sellingNum = parseFloat(sellingPrice) || 0;
  const activePrice = sellingNum || mrpNum;
  const netPayout = activePrice * NET_AFTER_FEE;
  const glowvaiFee = activePrice - netPayout;

  // Another product in the store already uses this SKU code.
  const duplicateSku = useMemo(() => {
    const code = skuCode.trim().toLowerCase();
    if (!code) return false;
    return items.some(i => i.sku.toLowerCase() === code && i.productId !== existingItem?.productId);
  }, [items, skuCode, existingItem]);

  // Suggest a SKU code for new products until the team types their own.
  useEffect(() => {
    if (!isEditing && skuCode === '' && brand.trim() !== '' && productName.trim() !== '') {
      const suffix = Math.floor(100 + Math.random() * 900);
      setSkuCode(`SKU-${brand.trim().slice(0, 3).toUpperCase()}-${productName.trim().slice(0, 3).toUpperCase()}-${suffix}`);
    }
  }, [brand, productName, isEditing]);

  const clearError = (key: string) => {
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};

    if (!productName.trim()) next.productName = 'Enter the product name.';
    if (!brand.trim()) next.brand = 'Enter the brand name.';
    if (isSkincare && !SHOP_CATEGORIES.includes(shopCategory)) {
      next.shopCategory = 'Choose the shop category for this Skincare product.';
    }
    if (!skuCode.trim()) next.skuCode = 'Enter a SKU code.';
    else if (duplicateSku) next.skuCode = 'Another product already uses this SKU code.';

    if (!mrp || isNaN(mrpNum) || mrpNum <= 0) {
      next.mrp = 'Enter an MRP greater than ₹0.';
    }
    if (!sellingPrice || isNaN(sellingNum) || sellingNum <= 0) {
      next.sellingPrice = 'Enter a selling price greater than ₹0.';
    } else if (sellingNum > mrpNum) {
      next.sellingPrice = 'Selling price cannot be more than the MRP.';
    }

    if (!/^\d+$/.test(initialStock.trim())) {
      next.initialStock = 'Enter a whole number of 0 or more.';
    }

    if (!shelfLocation.trim()) {
      next.shelfLocation = 'Enter the shelf location, for example Shelf A-01-05.';
    }

    if (batchExpiry.trim() && !DATE_PATTERN.test(batchExpiry.trim())) {
      next.batchExpiry = 'Use the format YYYY-MM-DD.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddShade = () => {
    const name = newShadeName.trim();
    if (!name) {
      setShadeError('Enter a shade name.');
      return;
    }
    if (!HEX_PATTERN.test(newShadeHex.trim())) {
      setShadeError('Use a colour code like #E0A899.');
      return;
    }
    const id = `shade-${Date.now()}`;
    setShades(prev => [...prev, { id, name, color: newShadeHex.trim() }]);
    setSelectedShadeId(id);
    setNewShadeName('');
    setShadeError('');
    setShowShadeForm(false);
  };

  const handleRemoveShade = (id: string) => {
    setShades(prev => prev.filter(sh => sh.id !== id));
    if (selectedShadeId === id) setSelectedShadeId(null);
  };

  const handlePickImage = async () => {
    if (images.length >= MAX_IMAGES) return;
    setImageError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if ((asset.size ?? 0) > MAX_IMAGE_BYTES) {
        setImageError('This photo is larger than 5 MB. Choose a smaller one.');
        return;
      }
      setUploading(true);
      const res = await uploadsApi.image({
        uri: asset.uri,
        name: asset.name || 'photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        file: (asset as any).file,
      });
      setImages(curr => [...curr, res.url]);
    } catch (err: any) {
      setImageError(err?.message || 'The photo could not be uploaded. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  };

  const handleSave = async () => {
    setSaveError('');
    if (missingProduct || !validateForm()) {
      if (!missingProduct) setSaveError('Check the highlighted fields and try again.');
      return;
    }

    const body = {
      name: productName.trim(),
      brand: brand.trim(),
      category,
      shopCategory: isSkincare ? shopCategory : null,
      description: selectedShade
        ? `${description.trim()} (Shade: ${selectedShade.name})`.trim()
        : description.trim(),
      packSize: isMakeup ? '' : selectedVolume,
      keyActives: keyActivesText.split(',').map(k => k.trim()).filter(Boolean),
      sku: skuCode.trim(),
      mrp: mrpNum,
      sellingPrice: sellingNum,
      gstPercent,
      stock: parseInt(initialStock, 10) || 0,
      bin: shelfLocation.trim(),
      expiryDate: batchExpiry.trim(),
      images,
    };

    setSaving(true);
    try {
      // The backend assigns productId, vendorId, storeId and the approval status.
      const res: any = isEditing && existingItem
        ? await inventoryApi.update(existingItem.productId, body)
        : await inventoryApi.add(body);
      if (res?.item) {
        if (isEditing && existingItem) updateInventoryItem(existingItem.productId, res.item);
        else addInventoryItem(res.item);
      }
      setSavedItem(res?.item || { ...body, productId: existingItem?.productId || '', active: true, updatedAt: Date.now() } as InventoryItem);
      setSavedOpen(true);
    } catch (err: any) {
      setSaveError(err?.message || 'The product could not be saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForNext = () => {
    setSavedOpen(false);
    setProductName('');
    setBrand('');
    setDescription('');
    setKeyActivesText('');
    setMrp('');
    setSellingPrice('');
    setSkuCode('');
    setInitialStock('');
    setShelfLocation('');
    setBatchExpiry('');
    setImages([]);
    setErrors({});
    setSaveError('');
  };

  const goToCatalog = () => {
    setSavedOpen(false);
    router.replace('/(vendor)/catalog');
  };

  const pad = isPhone ? S.lg : S.xl;

  const formColumn = (
    <View style={[s.column, canSplit && s.columnMain]}>
      <Section title="Product details" description="What shoppers see first.">
        <FieldRow>
          <TextField
            label="Product name"
            value={productName}
            onChangeText={text => { setProductName(text); clearError('productName'); }}
            placeholder="e.g. Minimalist 10% Niacinamide Face Serum"
            error={errors.productName}
          />
          <TextField
            label="Brand"
            value={brand}
            onChangeText={text => { setBrand(text); clearError('brand'); }}
            placeholder="e.g. Minimalist"
            error={errors.brand}
          />
        </FieldRow>

        <View style={s.field}>
          <Text style={s.label}>Category</Text>
          <ChipRow>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </ChipRow>
        </View>

        {isSkincare ? (
          <View style={s.field}>
            <Text style={s.label}>Shop category</Text>
            <ChipRow>
              {SHOP_CATEGORIES.map(sc => (
                <Chip
                  key={sc}
                  label={sc}
                  active={shopCategory === sc}
                  onPress={() => { setShopCategory(sc); clearError('shopCategory'); }}
                />
              ))}
            </ChipRow>
            {errors.shopCategory ? <Text style={s.errorText}>{errors.shopCategory}</Text> : null}
            <Text style={s.hint}>
              New products, and edits to the name, brand, category, description, photos or size, are reviewed by GlowVAI before they go live.
            </Text>
          </View>
        ) : (
          <Text style={[s.hint, s.fieldGap]}>
            Only Skincare products are listed on the GlowVAI shop for now. You can still add this product to your catalog.
          </Text>
        )}

        <TextField
          label="Key actives"
          optional
          value={keyActivesText}
          onChangeText={setKeyActivesText}
          placeholder="e.g. Niacinamide, Zinc PCA"
          helper="Separate with commas."
        />

        <TextField
          label="Short description"
          optional
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Niacinamide 10% + Zinc 1% for blemish treatment"
          multiline
          inputStyle={s.multiline}
          last
        />
      </Section>

      <Section
        title={isMakeup ? 'Shade' : 'Pack size'}
        description={isMakeup ? 'Optional. Shades are saved with the product description for now.' : 'Choose the pack size shown to shoppers.'}
      >
        {isMakeup ? (
          <>
            {shades.length === 0 && !showShadeForm ? (
              <Text style={s.hint}>No shades added yet.</Text>
            ) : null}

            {shades.map(sh => {
              const selected = selectedShadeId === sh.id;
              return (
                <View key={sh.id} style={[s.shadeRow, selected && s.shadeRowOn]}>
                  <Pressable
                    onPress={() => setSelectedShadeId(selected ? null : sh.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Use shade ${sh.name}`}
                    style={s.shadeMain}
                  >
                    <View style={[s.swatch, { backgroundColor: sh.color }]} />
                    <Text style={s.shadeName} numberOfLines={1}>{sh.name}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={C.primary} /> : null}
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveShade(sh.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove shade ${sh.name}`}
                    hitSlop={6}
                    style={s.iconBtn}
                  >
                    <Ionicons name="close" size={18} color={C.textSecondary} />
                  </Pressable>
                </View>
              );
            })}

            {showShadeForm ? (
              <View style={s.shadeForm}>
                <FieldRow keepOnPhone>
                  <TextField
                    label="Shade name"
                    value={newShadeName}
                    onChangeText={text => { setNewShadeName(text); setShadeError(''); }}
                    placeholder="e.g. 120 Classic Ivory"
                  />
                  <TextField
                    label="Colour"
                    value={newShadeHex}
                    onChangeText={text => { setNewShadeHex(text); setShadeError(''); }}
                    placeholder="#E0A899"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    error={shadeError || undefined}
                    last
                  />
                </FieldRow>
                <View style={s.shadeFormActions}>
                  <Button label="Cancel" variant="secondary" compact onPress={() => { setShowShadeForm(false); setShadeError(''); }} style={s.shadeBtn} />
                  <Button label="Save shade" compact onPress={handleAddShade} style={s.shadeBtn} />
                </View>
              </View>
            ) : (
              <Button
                label="Add shade"
                variant="secondary"
                icon="add"
                compact
                onPress={() => setShowShadeForm(true)}
                style={s.addShadeBtn}
              />
            )}
          </>
        ) : (
          <ChipRow>
            {VOLUME_SIZES.map(vSize => (
              <Chip key={vSize} label={vSize} active={selectedVolume === vSize} onPress={() => setSelectedVolume(vSize)} />
            ))}
          </ChipRow>
        )}
      </Section>

      <Section title="Price and tax" description="Shoppers pay the selling price. MRP is the printed price.">
        <FieldRow>
          <TextField
            label="Selling price (₹)"
            value={sellingPrice}
            onChangeText={text => { setSellingPrice(text); clearError('sellingPrice'); }}
            placeholder="e.g. 549"
            keyboardType="decimal-pad"
            error={errors.sellingPrice}
          />
          <TextField
            label="MRP (₹)"
            value={mrp}
            onChangeText={text => { setMrp(text); clearError('mrp'); }}
            placeholder="e.g. 599"
            keyboardType="decimal-pad"
            error={errors.mrp}
          />
        </FieldRow>

        <View style={s.field}>
          <Text style={s.label}>GST rate</Text>
          <View style={s.gstList}>
            {GST_SLABS.map(slab => {
              const on = gstPercent === slab.value;
              return (
                <Pressable
                  key={slab.value}
                  onPress={() => setGstPercent(slab.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${slab.value}% GST, ${slab.note}`}
                  style={[s.gstOption, on && s.gstOptionOn]}
                >
                  <View style={[s.radio, on && s.radioOn]}>
                    {on ? <View style={s.radioDot} /> : null}
                  </View>
                  <Text style={[s.gstText, on && s.gstTextOn]}>{slab.value}%</Text>
                  <Text style={s.gstNote}>{slab.note}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.payoutBox}>
          <Text style={s.payoutTitle}>Payout per unit</Text>
          <PayoutRow label="Price to shopper" value={formatRupees(activePrice)} />
          <PayoutRow label="GlowVAI fee (12%)" value={`− ${formatRupees(glowvaiFee)}`} />
          <PayoutRow label="Your payout (88%)" value={formatRupees(netPayout)} strong />
          <Text style={s.payoutNote}>Final invoice and settlement amounts are calculated by GlowVAI.</Text>
        </View>
      </Section>

      <Section title="Stock and storage" description="Where this product sits in your store.">
        <FieldRow>
          <TextField
            label="SKU code"
            value={skuCode}
            onChangeText={text => { setSkuCode(text); clearError('skuCode'); }}
            placeholder="e.g. SKU-MIN-101"
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.skuCode || (duplicateSku ? 'Another product already uses this SKU code.' : undefined)}
          />
          <TextField
            label="Opening stock"
            value={initialStock}
            onChangeText={text => { setInitialStock(text); clearError('initialStock'); }}
            placeholder="e.g. 20"
            keyboardType="number-pad"
            error={errors.initialStock}
          />
        </FieldRow>
        <FieldRow>
          <TextField
            label="Shelf location"
            value={shelfLocation}
            onChangeText={text => { setShelfLocation(text); clearError('shelfLocation'); }}
            placeholder="e.g. Shelf A-01-05"
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.shelfLocation}
            helper={errors.shelfLocation ? undefined : 'Format: Shelf A-01-05'}
          />
          <TextField
            label="Batch expiry"
            optional
            value={batchExpiry}
            onChangeText={text => { setBatchExpiry(text); clearError('batchExpiry'); }}
            placeholder="YYYY-MM-DD"
            error={errors.batchExpiry}
            last
          />
        </FieldRow>
      </Section>
    </View>
  );

  const sideColumn = (
    <View style={[s.column, canSplit && s.columnSide]}>
      <Section title="Photos" description={`Up to ${MAX_IMAGES} photos, JPEG, PNG or WebP, 5 MB each. The first photo is the main one.`}>
        {imageError ? (
          <Banner tone="error" message={imageError} style={s.inlineBanner} />
        ) : null}

        {images.length === 0 ? (
          <Text style={s.hint}>No photos yet. A clear front view with the brand label reads best.</Text>
        ) : null}

        {images.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={s.photoRow}>
            <Image source={{ uri }} style={s.photo} accessibilityLabel={idx === 0 ? 'Main product photo' : `Product photo ${idx + 1}`} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.photoTitle}>{idx === 0 ? 'Main photo' : `Photo ${idx + 1}`}</Text>
              <View style={s.photoActions}>
                {idx !== 0 ? (
                  <Pressable onPress={() => handleSetMainImage(idx)} accessibilityRole="button" accessibilityLabel={`Make photo ${idx + 1} the main photo`} style={s.textAction}>
                    <Text style={s.textActionText}>Make main</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => handleRemoveImage(idx)} accessibilityRole="button" accessibilityLabel={`Remove photo ${idx + 1}`} style={s.textAction}>
                  <Text style={[s.textActionText, { color: C.errorText }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {images.length < MAX_IMAGES ? (
          <Button
            label={uploading ? 'Uploading…' : 'Add photo'}
            variant="secondary"
            icon="camera-outline"
            compact
            loading={uploading}
            onPress={handlePickImage}
            style={s.addShadeBtn}
          />
        ) : null}
      </Section>

      <Section title="Preview" description="How this product is set up. The shop listing depends on GlowVAI approval.">
        <View style={s.preview}>
          <View style={s.previewThumb}>
            {images[0] ? (
              <Image source={{ uri: images[0] }} style={s.previewImage} />
            ) : (
              <Ionicons name="cube-outline" size={24} color={C.textSubtle} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.previewBrand} numberOfLines={1}>{brand.trim() || 'Brand'}</Text>
            <Text style={s.previewName} numberOfLines={2}>{productName.trim() || 'Product name'}</Text>
            <Text style={s.previewMeta} numberOfLines={1}>
              {isMakeup ? (selectedShade ? `Shade: ${selectedShade.name}` : 'No shade selected') : selectedVolume || 'Pack size not set'}
            </Text>
            <View style={s.previewPriceRow}>
              <Text style={s.previewPrice}>{formatRupees(activePrice)}</Text>
              {mrpNum > activePrice && activePrice > 0 ? <Text style={s.previewMrp}>{formatRupees(mrpNum)}</Text> : null}
            </View>
          </View>
        </View>
      </Section>
    </View>
  );

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: isEditing ? 'Edit product' : 'Add product', showBack: true }}
        backgroundColor={C.page}
        keyboardAvoiding
        testID="add-sku-screen"
        stickyFooter={
          missingProduct ? (
            <Button label="Back to catalog" variant="secondary" onPress={goToCatalog} />
          ) : (
            <View style={s.footer}>
              <Button label="Cancel" variant="secondary" onPress={goToCatalog} style={s.footerBtn} />
              <Button
                label={isEditing ? 'Save changes' : 'Save product'}
                onPress={handleSave}
                loading={saving}
                disabled={uploading}
                style={s.footerBtn}
              />
            </View>
          )
        }
      >
        {missingProduct ? (
          <View style={[s.body, { paddingHorizontal: pad }]}>
            <Banner
              tone="error"
              title="This product could not be found"
              message="It may have been removed, or your catalog has not loaded yet. Go back to the catalog and open it again."
            />
          </View>
        ) : (
          <View style={[s.body, { paddingHorizontal: pad }]}>
            {saveError ? <Banner tone="error" title="Could not save" message={saveError} /> : null}
            <View style={[s.layout, canSplit && s.layoutWide]}>
              {formColumn}
              {sideColumn}
            </View>
          </View>
        )}
      </ScreenShell>

      <Modal visible={savedOpen} transparent animationType="fade" onRequestClose={goToCatalog}>
        <View style={s.overlay}>
          <View style={[s.sheet, { padding: pad }]}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark" size={26} color={C.successText} />
            </View>
            <Text accessibilityRole="header" style={s.sheetTitle}>Product saved</Text>
            <Text style={s.sheetBody}>
              {`${savedItem?.name || productName.trim() || 'The product'} is saved.`}
              {' It appears on the GlowVAI shop after GlowVAI approves it'}
              {isSkincare ? '.' : ' (only Skincare products are listed on the shop for now).'}
            </Text>
            {savedItem?.sku ? <Text style={s.sheetMeta}>SKU {savedItem.sku}</Text> : null}
            <View style={s.sheetActions}>
              <Button label="View in catalog" onPress={goToCatalog} style={s.sheetBtn} />
              {!isEditing ? (
                <Button label="Add another product" variant="secondary" onPress={resetForNext} style={s.sheetBtn} />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function PayoutRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.payoutRow}>
      <Text style={[s.payoutLabel, strong && s.payoutStrong]}>{label}</Text>
      <Text style={[s.payoutValue, strong && s.payoutStrong]}>{value}</Text>
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={s.chipRow}>{children}</View>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [s.chip, active && s.chipOn, pressed && { opacity: 0.8 }]}
    >
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  body: { paddingTop: S.lg, paddingBottom: S.xxl },
  layout: { gap: S.lg },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: 0, width: '100%' },
  columnMain: { flex: 1.6, minWidth: 0 },
  columnSide: { flex: 1, minWidth: 0, maxWidth: 380 },
  fieldGap: { marginBottom: S.lg },

  field: { marginBottom: S.lg },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginBottom: S.sm },
  hint: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: C.textSubtle, marginTop: S.xs },
  errorText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: C.errorText, marginTop: S.xs },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  inlineBanner: { marginBottom: S.md },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
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
  chipOn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  chipTextOn: { color: C.primary },

  shadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.input,
    marginBottom: S.sm,
    backgroundColor: C.background,
  },
  shadeRowOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  shadeMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: 48, paddingHorizontal: S.md },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  shadeName: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 15, color: C.textPrimary },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  shadeForm: { borderWidth: 1, borderColor: C.border, borderRadius: R.input, padding: S.md, marginTop: S.xs, backgroundColor: C.surface },
  shadeFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: S.sm, marginTop: S.xs },
  shadeBtn: { minWidth: 120 },
  addShadeBtn: { alignSelf: 'flex-start', marginTop: S.xs },

  gstList: { gap: S.sm },
  gstOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 48,
    paddingHorizontal: S.md,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  gstOptionOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  gstText: { fontFamily: FontFamily.bold, fontSize: 15, color: C.textPrimary, minWidth: 40 },
  gstTextOn: { color: C.primary },
  gstNote: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, color: C.textSecondary },

  payoutBox: { backgroundColor: C.page, borderRadius: R.input, padding: S.md, gap: S.xs, marginTop: S.xs },
  payoutTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.textPrimary, marginBottom: S.xs },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', gap: S.md },
  payoutLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: C.textSecondary },
  payoutValue: { fontFamily: FontFamily.medium, fontSize: 14, color: C.textPrimary },
  payoutStrong: { fontFamily: FontFamily.bold, color: C.textPrimary },
  payoutNote: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18, color: C.textSubtle, marginTop: S.xs },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.sm, borderTopWidth: 1, borderTopColor: C.border },
  photo: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.page },
  photoTitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textPrimary },
  photoActions: { flexDirection: 'row', gap: S.md, marginTop: 2 },
  textAction: { minHeight: 44, justifyContent: 'center' },
  textActionText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.primary },

  preview: { flexDirection: 'row', gap: S.md, borderWidth: 1, borderColor: C.border, borderRadius: R.input, padding: S.md, backgroundColor: C.background },
  previewThumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.page, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: 72, height: 72 },
  previewBrand: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: 0.3 },
  previewName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  previewMeta: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSecondary, marginTop: 2 },
  previewPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: S.sm, marginTop: S.xs },
  previewPrice: { fontFamily: FontFamily.bold, fontSize: 16, color: C.textPrimary },
  previewMrp: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSubtle, textDecorationLine: 'line-through' },

  footer: { flexDirection: 'row', gap: S.md },
  footerBtn: { flex: 1 },

  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: S.lg },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: C.background, borderRadius: R.card },
  successIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: C.textPrimary },
  sheetBody: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.xs },
  sheetMeta: { fontFamily: FontFamily.mono, fontSize: 13, color: C.textSubtle, marginTop: S.sm },
  sheetActions: { gap: S.sm, marginTop: S.lg },
  sheetBtn: { width: '100%' },
});
