/**
 * SCREEN 15: Add / Edit Product SKU with Shades & Variants
 * Desktop 1440x1024 1200px Two-Column Beauty Merchant Workstation
 * File: mobile/app/(vendor)/add-sku.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { inventoryApi } from '../../src/services/api';
import type { InventoryItem } from '../../src/store/useVendorStore';
import AppHeader from '../../src/components/AppHeader';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const CATEGORIES = [
  'Skincare',
  'Makeup',
  'Hair care',
  'Fragrance',
  'Bath & Body',
  'Tools & Brushes',
];

const GST_SLABS = [
  { label: '5% GST (Essential Oils & Soaps)', value: 5 },
  { label: '18% GST (Standard Beauty & Cosmetics)', value: 18 },
  { label: '28% GST (Luxury Fragrance & Deos)', value: 28 },
];

const INITIAL_MAKEUP_SHADES = [
  { id: 'v1', name: '120 Classic Ivory', color: '#F5D6BA' },
  { id: 'v2', name: '220 Natural Beige', color: '#E4B896' },
  { id: 'v3', name: '310 Sun Beige', color: '#C8936C' },
  { id: 'v4', name: 'Ruby Red (08)', color: '#B91C1C' },
  { id: 'v5', name: 'Nude Nuance (12)', color: '#9A5B49' },
];

const VOLUME_SIZES = ['30 ml', '50 ml', '100 ml', '200 ml', '250 ml', '500 ml'];

export default function AddSkuScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { inventory, addInventoryItem, updateInventoryItem } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const existingItem = productId ? inventory.find(i => i.productId === productId) : null;
  const isEditing = !!existingItem;

  // Form Basic Info State
  const [productName, setProductName] = useState(existingItem?.name || '');
  const [brand, setBrand] = useState(existingItem?.brand || '');
  const [category, setCategory] = useState(existingItem?.category || 'Skincare');
  const [description, setDescription] = useState(existingItem?.description || '');

  // Variant Management State
  const [shadeVariants, setShadeVariants] = useState(INITIAL_MAKEUP_SHADES);
  const [activeVariantId, setActiveVariantId] = useState('v1');
  const [selectedShadeName, setSelectedShadeName] = useState('120 Classic Ivory');
  const [selectedVolume, setSelectedVolume] = useState('30 ml');
  const [newShadeInput, setNewShadeInput] = useState('');
  const [newShadeHex, setNewShadeHex] = useState('#E0A899');
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);

  // Pricing & Tax State
  const [mrp, setMrp] = useState(existingItem ? String(existingItem.mrp) : '');
  const [sellingPrice, setSellingPrice] = useState(existingItem ? String(existingItem.sellingPrice) : '');
  const [gstPercent, setGstPercent] = useState(existingItem?.gstPercent || 18);

  // Inventory & Storage State
  const [skuCode, setSkuCode] = useState(existingItem?.sku || '');
  const [initialStock, setInitialStock] = useState(existingItem ? String(existingItem.stock) : '20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [shelfLocation, setShelfLocation] = useState(existingItem?.bin || 'Shelf A-01-05');
  const [batchExpiry, setBatchExpiry] = useState(existingItem?.expiryDate || '2027-04-30');

  // Images State
  const [images, setImages] = useState<string[]>(
    existingItem?.images && existingItem.images.length > 0
      ? existingItem.images
      : ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400']
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageScanError, setImageScanError] = useState(false);

  // Submission & Validation States
  const [loading, setLoading] = useState(false);
  const [draftSavedText, setDraftSavedText] = useState('Draft saved 2 mins ago');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProductPreview, setCreatedProductPreview] = useState<any>(null);

  // System Edge States
  const [isOffline, setIsOffline] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState('');
  const [isDuplicateSku, setIsDuplicateSku] = useState(false);
  const [restoredDraftNotice, setRestoredDraftNotice] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `${isEditing ? 'Edit Product SKU' : 'Add Product SKU'} | GlowVAI Vendor`;
    }

    // Auto-generate SKU code if blank
    if (!isEditing && skuCode === '' && brand !== '' && productName !== '') {
      const generated = `SKU-${brand.slice(0, 3).toUpperCase()}-${productName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      setSkuCode(generated);
    }
  }, [brand, productName, isEditing]);

  // Draft Auto-Save Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (productName.length > 0 || brand.length > 0) {
        setDraftSavedText(`Draft saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [productName, brand]);

  // Tax & Payout Calculations
  const mrpNum = parseFloat(mrp) || 0;
  const sellingNum = parseFloat(sellingPrice) || 0;
  const activePrice = sellingNum || mrpNum;
  const netPayout = Math.round(activePrice * 0.88 * 100) / 100;
  const glowvaiFee = Math.round(activePrice * 0.12 * 100) / 100;

  // Validation Handler
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!productName.trim()) errors.productName = 'Product name is required.';
    if (!brand.trim()) errors.brand = 'Brand name is required.';
    if (!skuCode.trim()) errors.skuCode = 'SKU code is required.';
    if (isDuplicateSku) errors.skuCode = 'Duplicate SKU code detected in catalog.';

    if (!mrp || isNaN(mrpNum) || mrpNum <= 0) {
      errors.mrp = 'Enter a valid MRP greater than ₹0.';
    }
    if (!sellingPrice || isNaN(sellingNum) || sellingNum <= 0) {
      errors.sellingPrice = 'Enter a valid selling price.';
    } else if (sellingNum > mrpNum) {
      errors.sellingPrice = 'Selling price cannot exceed MRP.';
    }

    const stockNum = parseInt(initialStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.initialStock = 'Initial stock cannot be negative.';
    }

    if (!shelfLocation.trim()) {
      errors.shelfLocation = 'Shelf location is required (e.g. Shelf A-01-05).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Custom Variant Actions
  const handleAddCustomVariant = () => {
    if (!newShadeInput.trim()) return;
    const newId = `v-${Date.now()}`;
    const newVariant = { id: newId, name: newShadeInput.trim(), color: newShadeHex };
    setShadeVariants(prev => [...prev, newVariant]);
    setSelectedShadeName(newVariant.name);
    setActiveVariantId(newId);
    setNewShadeInput('');
    setShowAddVariantForm(false);
  };

  const handleDuplicateVariant = (vId: string) => {
    const target = shadeVariants.find(v => v.id === vId);
    if (!target) return;
    const dup = { ...target, id: `v-${Date.now()}`, name: `${target.name} (Copy)` };
    setShadeVariants(prev => [...prev, dup]);
    setActiveVariantId(dup.id);
    setSelectedShadeName(dup.name);
  };

  const handleRemoveVariant = (vId: string) => {
    if (shadeVariants.length <= 1) return;
    setShadeVariants(prev => prev.filter(v => v.id !== vId));
    if (activeVariantId === vId) {
      const remaining = shadeVariants.filter(v => v.id !== vId);
      setActiveVariantId(remaining[0].id);
      setSelectedShadeName(remaining[0].name);
    }
  };

  // Image Upload Simulation Handler
  const handleSimulateImageUpload = () => {
    if (images.length >= 3) {
      setApiErrorMsg('Maximum 3 product images allowed.');
      return;
    }
    setUploadingImage(true);
    setImageScanError(false);
    setImageUploadProgress(10);

    const interval = setInterval(() => {
      setImageUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setUploadingImage(false);
          setImages(curr => [
            ...curr,
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
          ]);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const next = [...prev];
      const selected = next.splice(index, 1)[0];
      return [selected, ...next];
    });
  };

  // Save Product SKU Handler
  const handleSaveProduct = async () => {
    setApiErrorMsg('');
    if (!validateForm()) return;

    setLoading(true);

    const variantDetail = category === 'Makeup' ? `Shade: ${selectedShadeName}` : `Size: ${selectedVolume}`;
    const payload: InventoryItem = {
      productId: existingItem?.productId || `P-${Date.now().toString().slice(-4)}`,
      name: productName,
      brand,
      category,
      description: `${description} (${variantDetail})`,
      sku: skuCode,
      mrp: mrpNum,
      sellingPrice: sellingNum,
      gstPercent,
      stock: parseInt(initialStock, 10) || 0,
      bin: shelfLocation,
      expiryDate: batchExpiry,
      images,
      active: (parseInt(initialStock, 10) || 0) > 0,
      updatedAt: Date.now(),
    };

    try {
      if (isOffline) {
        setApiErrorMsg('📶 Offline Mode: SKU saved locally. Will sync when reconnected.');
        if (isEditing && existingItem) {
          updateInventoryItem(existingItem.productId, payload);
        } else {
          addInventoryItem(payload);
        }
      } else {
        if (isEditing && existingItem) {
          await inventoryApi.update(existingItem.productId, payload);
          updateInventoryItem(existingItem.productId, payload);
        } else {
          const res = await inventoryApi.add(payload);
          if (res?.item) {
            addInventoryItem(res.item);
          } else {
            addInventoryItem(payload);
          }
        }
      }

      setCreatedProductPreview(payload);
      setShowSuccessModal(true);
    } catch (err: any) {
      setApiErrorMsg(err.message || 'Failed to save product SKU. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setProductName('');
    setBrand('');
    setDescription('');
    setMrp('');
    setSellingPrice('');
    setSkuCode('');
    setInitialStock('20');
    setFormErrors({});
    setImages(['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400']);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Left Navigation Rail ─────────────────────────────────────────────── */}
        {isExpanded && (
          <View style={s.navRail}>
            <View style={s.railBrandGroup}>
              <View style={s.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={s.railBrandLogoIcon} />
              </View>
              <View>
                <Wordmark size={17} color="#FFFFFF" />
                <Text style={s.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={s.railNavGroup}>
              <TouchableOpacity style={s.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/earnings')} activeOpacity={0.8}>
                <Ionicons name="wallet-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={s.railFooter}>
              <TouchableOpacity style={s.storeSelectorPill} activeOpacity={0.8}>
                <Text style={s.storeSelectorText} numberOfLines={1}>📍 Benz Circle Store ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railHelpBtn} activeOpacity={0.8}>
                <Text style={s.railHelpText}>Help & Support 💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Area ───────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Page Header */}
          <AppHeader
            title={isEditing ? 'Edit product' : 'Add product'}
            subtitle={isEditing ? 'Edit product SKU & variant specs' : 'Add new product SKU & variant specs'}
            showBack={true}
          />

          {/* System Edge Simulations Strip */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST SKU FORM EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, isOffline && s.simChipActive]}
                onPress={() => setIsOffline(!isOffline)}
              >
                <Text style={[s.simChipText, isOffline && s.simChipTextActive]}>{isOffline ? 'Go Online' : 'Simulate Offline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, isDuplicateSku && s.simChipActive]}
                onPress={() => {
                  setIsDuplicateSku(!isDuplicateSku);
                  setFormErrors(prev => ({
                    ...prev,
                    skuCode: !isDuplicateSku ? 'Duplicate SKU code detected in catalog.' : '',
                  }));
                }}
              >
                <Text style={[s.simChipText, isDuplicateSku && s.simChipTextActive]}>Duplicate SKU</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.simChip}
                onPress={() => setApiErrorMsg('⚠️ API Failure: Server connection timed out while saving SKU.')}
              >
                <Text style={s.simChipText}>API Timeout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.simChip}
                onPress={() => setImageScanError(!imageScanError)}
              >
                <Text style={s.simChipText}>{imageScanError ? 'Image Verified' : 'Image Scan Error'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.simChip}
                onPress={() => setRestoredDraftNotice(!restoredDraftNotice)}
              >
                <Text style={s.simChipText}>Restored Draft</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Banners */}
          {restoredDraftNotice && (
            <View style={s.restoredDraftBanner}>
              <Text style={s.restoredDraftBannerText}>📋 Restored draft from your previous session at 10:42 PM.</Text>
              <TouchableOpacity onPress={() => setRestoredDraftNotice(false)}>
                <Text style={s.bannerDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {apiErrorMsg !== '' && (
            <View style={s.apiErrorBanner}>
              <Text style={s.apiErrorText}>{apiErrorMsg}</Text>
            </View>
          )}

          {/* Form Scroll Container inside 1200px Grid */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {/* 2-Column Layout */}
              <View style={s.gridRow}>

                {/* ── LEFT COLUMN: Form Cards (760px) ───────────────────────────────── */}
                <View style={s.leftFormColumn}>

                  {/* CARD 1: Basic Information */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionHeaderLabel}>1. BASIC PRODUCT INFORMATION</Text>

                    {/* Product Name */}
                    <View style={s.fieldGroup}>
                      <Text style={s.fieldLabel}>Product Name *</Text>
                      <TextInput
                        style={[s.fieldInput, formErrors.productName ? s.fieldInputError : null]}
                        placeholder="e.g. Minimalist 10% Niacinamide Face Serum"
                        placeholderTextColor={Colors.textMuted}
                        value={productName}
                        onChangeText={text => {
                          setProductName(text);
                          if (formErrors.productName) setFormErrors({ ...formErrors, productName: '' });
                        }}
                      />
                      {formErrors.productName ? <Text style={s.errorText}>{formErrors.productName}</Text> : null}
                    </View>

                    {/* Brand & Category Row */}
                    <View style={s.fieldRow}>
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Brand Name *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.brand ? s.fieldInputError : null]}
                          placeholder="e.g. Minimalist"
                          placeholderTextColor={Colors.textMuted}
                          value={brand}
                          onChangeText={text => {
                            setBrand(text);
                            if (formErrors.brand) setFormErrors({ ...formErrors, brand: '' });
                          }}
                        />
                        {formErrors.brand ? <Text style={s.errorText}>{formErrors.brand}</Text> : null}
                      </View>

                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catPillsRow}>
                          {CATEGORIES.map(cat => (
                            <TouchableOpacity
                              key={cat}
                              style={[s.catPill, category === cat && s.catPillActive]}
                              onPress={() => setCategory(cat)}
                            >
                              <Text style={[s.catPillText, category === cat && s.catPillTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    {/* Short Description */}
                    <View style={s.fieldGroup}>
                      <Text style={s.fieldLabel}>Short Description & Key Ingredients</Text>
                      <TextInput
                        style={[s.fieldInput, s.multilineInput]}
                        placeholder="e.g. Niacinamide 10% + Zinc 1% for blemish treatment, oil control, and pore refining."
                        placeholderTextColor={Colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>

                  {/* CARD 2: Category-Adaptive Variants Card */}
                  <View style={s.sectionCard}>
                    <View style={s.sectionHeaderRow}>
                      <Text style={s.sectionHeaderLabel}>2. SHADE & SIZE VARIANTS ({category.toUpperCase()})</Text>
                      {category === 'Makeup' && (
                        <TouchableOpacity
                          style={s.addVariantBtnHeader}
                          onPress={() => setShowAddVariantForm(!showAddVariantForm)}
                        >
                          <Text style={s.addVariantBtnText}>+ Add Custom Shade</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {category === 'Makeup' ? (
                      <View>
                        {/* Custom Shade Form if toggled */}
                        {showAddVariantForm && (
                          <View style={s.customShadeBox}>
                            <Text style={s.customShadeBoxTitle}>Add Custom Shade Swatch</Text>
                            <View style={s.fieldRow}>
                              <TextInput
                                style={[s.fieldInput, { flex: 2 }]}
                                placeholder="Shade Name (e.g. Rosewood 05)"
                                value={newShadeInput}
                                onChangeText={setNewShadeInput}
                              />
                              <TextInput
                                style={[s.fieldInput, { flex: 1 }]}
                                placeholder="Hex Color (#E0A899)"
                                value={newShadeHex}
                                onChangeText={setNewShadeHex}
                              />
                              <TouchableOpacity style={s.saveCustomShadeBtn} onPress={handleAddCustomVariant}>
                                <Text style={s.saveCustomShadeText}>Save Shade</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <Text style={s.fieldLabel}>Available Shades Matrix (Click to select editing target)</Text>
                        <View style={s.shadesGrid}>
                          {shadeVariants.map(sItem => {
                            const isSelected = activeVariantId === sItem.id;
                            return (
                              <View
                                key={sItem.id}
                                style={[s.shadeCard, isSelected && s.shadeCardActive]}
                              >
                                <TouchableOpacity
                                  style={s.shadeCardMainTouch}
                                  onPress={() => {
                                    setActiveVariantId(sItem.id);
                                    setSelectedShadeName(sItem.name);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <View style={[s.shadeSwatchCircle, { backgroundColor: sItem.color }]} />
                                  <Text style={s.shadeNameText} numberOfLines={1}>{sItem.name}</Text>
                                </TouchableOpacity>

                                {/* Variant Action Buttons */}
                                <View style={s.shadeActionsRow}>
                                  <TouchableOpacity onPress={() => handleDuplicateVariant(sItem.id)}>
                                    <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.shadeActionIcon} />
                                  </TouchableOpacity>
                                  {shadeVariants.length > 1 && (
                                    <TouchableOpacity onPress={() => handleRemoveVariant(sItem.id)}>
                                      <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        <Text style={s.editingNotice}>
                          ✨ Currently Editing Variant: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{selectedShadeName}</Text>
                        </Text>
                      </View>
                    ) : (
                      <View style={s.fieldGroup}>
                        <Text style={s.fieldLabel}>Select Bottle / Pack Volume Size</Text>
                        <View style={s.sizesRow}>
                          {VOLUME_SIZES.map(vSize => (
                            <TouchableOpacity
                              key={vSize}
                              style={[s.sizePill, selectedVolume === vSize && s.sizePillActive]}
                              onPress={() => setSelectedVolume(vSize)}
                            >
                              <Text style={[s.sizePillText, selectedVolume === vSize && s.sizePillTextActive]}>{vSize}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* CARD 3: Pricing and Tax Card */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionHeaderLabel}>3. PRICING & TAXATION (88/12 PAYOUT)</Text>

                    <View style={s.fieldRow}>
                      {/* Selling Price */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Selling Price (₹) *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.sellingPrice ? s.fieldInputError : null]}
                          placeholder="e.g. 549"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={sellingPrice}
                          onChangeText={text => {
                            setSellingPrice(text);
                            if (formErrors.sellingPrice) setFormErrors({ ...formErrors, sellingPrice: '' });
                          }}
                        />
                        {formErrors.sellingPrice ? <Text style={s.errorText}>{formErrors.sellingPrice}</Text> : null}
                      </View>

                      {/* Fixed MRP */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Fixed MRP (₹) *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.mrp ? s.fieldInputError : null]}
                          placeholder="e.g. 599"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={mrp}
                          onChangeText={text => {
                            setMrp(text);
                            if (formErrors.mrp) setFormErrors({ ...formErrors, mrp: '' });
                          }}
                        />
                        {formErrors.mrp ? <Text style={s.errorText}>{formErrors.mrp}</Text> : null}
                      </View>
                    </View>

                    {/* GST Slab Options */}
                    <View style={s.fieldGroup}>
                      <Text style={s.fieldLabel}>GST Tax Slab Selection</Text>
                      <View style={s.gstOptionsRow}>
                        {GST_SLABS.map(slab => (
                          <TouchableOpacity
                            key={slab.value}
                            style={[s.gstOptionBtn, gstPercent === slab.value && s.gstOptionBtnActive]}
                            onPress={() => setGstPercent(slab.value)}
                          >
                            <Text style={[s.gstOptionText, gstPercent === slab.value && s.gstOptionTextActive]}>
                              {slab.value}% GST
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Backend Authoritative Payout Validation Hint */}
                    <View style={s.payoutValidationHintCard}>
                      <Text style={s.payoutHintTitle}>💰 Estimated Net Bank Payout Breakdown</Text>
                      <View style={s.payoutBreakdownRow}>
                        <Text style={s.payoutHintText}>Customer Price: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>₹{activePrice || 0}</Text></Text>
                        <Text style={s.payoutHintText}>GlowVAI Fee (12%): <Text style={{ color: Colors.danger }}>−₹{glowvaiFee}</Text></Text>
                        <Text style={s.payoutHintBoldText}>Net Payout (88%): ₹{netPayout}</Text>
                      </View>
                      <Text style={s.taxDisclaimer}>
                        * Backend authoritative tax calculation notice: Final GST invoices and settlements calculated by central server.
                      </Text>
                    </View>
                  </View>

                  {/* CARD 4: Inventory & Storage Location */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionHeaderLabel}>4. INVENTORY & DARK STORE STORAGE</Text>

                    <View style={s.fieldRow}>
                      {/* SKU Code */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Product SKU Code *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.skuCode ? s.fieldInputError : null]}
                          placeholder="e.g. SKU-MIN-101"
                          placeholderTextColor={Colors.textMuted}
                          value={skuCode}
                          onChangeText={text => {
                            setSkuCode(text);
                            if (formErrors.skuCode) setFormErrors({ ...formErrors, skuCode: '' });
                          }}
                        />
                        {formErrors.skuCode ? <Text style={s.errorText}>{formErrors.skuCode}</Text> : null}
                      </View>

                      {/* Initial Stock */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Initial Stock Quantity *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.initialStock ? s.fieldInputError : null]}
                          placeholder="e.g. 20"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={initialStock}
                          onChangeText={text => {
                            setInitialStock(text);
                            if (formErrors.initialStock) setFormErrors({ ...formErrors, initialStock: '' });
                          }}
                        />
                        {formErrors.initialStock && <Text style={s.errorText}>{formErrors.initialStock}</Text>}
                      </View>
                    </View>

                    <View style={s.fieldRow}>
                      {/* Low Stock Alert Threshold */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Low-Stock Alert Threshold</Text>
                        <TextInput
                          style={s.fieldInput}
                          placeholder="e.g. 5"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={lowStockThreshold}
                          onChangeText={setLowStockThreshold}
                        />
                      </View>

                      {/* Shelf Bin Location */}
                      <View style={[s.fieldGroup, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Dark Store Shelf Location Bin *</Text>
                        <TextInput
                          style={[s.fieldInput, formErrors.shelfLocation ? s.fieldInputError : null]}
                          placeholder="e.g. Shelf A-01-05"
                          placeholderTextColor={Colors.textMuted}
                          value={shelfLocation}
                          onChangeText={text => {
                            setShelfLocation(text);
                            if (formErrors.shelfLocation) setFormErrors({ ...formErrors, shelfLocation: '' });
                          }}
                        />
                        {formErrors.shelfLocation ? (
                          <Text style={s.errorText}>{formErrors.shelfLocation}</Text>
                        ) : (
                          <Text style={s.fieldHint}>Format: Shelf A-01-05</Text>
                        )}
                      </View>
                    </View>

                    {/* Batch & Expiry Date Reference */}
                    <View style={s.fieldGroup}>
                      <Text style={s.fieldLabel}>Batch Lot Expiry Date (YYYY-MM-DD)</Text>
                      <TextInput
                        style={s.fieldInput}
                        placeholder="e.g. 2027-04-30"
                        placeholderTextColor={Colors.textMuted}
                        value={batchExpiry}
                        onChangeText={setBatchExpiry}
                      />
                    </View>
                  </View>

                </View>

                {/* ── RIGHT COLUMN: Product Media & Live Preview (440px) ───────────────── */}
                <View style={s.rightMediaColumn}>

                  {/* CARD 5: Product Images Media Card */}
                  <View style={s.sectionCard}>
                    <View style={s.sectionHeaderRow}>
                      <Text style={s.sectionHeaderLabel}>PRODUCT IMAGES (UP TO 3)</Text>
                      <Text style={s.imageCountText}>{images.length}/3 Photos</Text>
                    </View>

                    {imageScanError ? (
                      <View style={s.imageScanErrorCard}>
                        <Text style={s.imageScanErrorTitle}>⚠️ Image Scan Validation Failed</Text>
                        <Text style={s.imageScanErrorText}>Image resolution too low or unreadable brand label.</Text>
                        <TouchableOpacity style={s.retryScanBtn} onPress={() => setImageScanError(false)}>
                          <Text style={s.retryScanText}>Retry Image Scan</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={s.imageGuidanceBox}>
                        <Text style={s.imageGuidanceText}>
                          📷 Drag & Drop or click photo upload. PNG/JPG up to 5MB. Clear front angle with visible brand label.
                        </Text>
                      </View>
                    )}

                    {/* Upload Dropzone and Previews */}
                    <View style={s.imageGridContainer}>
                      {images.map((imgUri, idx) => (
                        <View key={idx} style={s.imagePreviewCardFull}>
                          <Image source={{ uri: imgUri }} style={s.imagePreviewFull} />
                          {idx === 0 && (
                            <View style={s.primaryBadge}>
                              <Text style={s.primaryBadgeText}>PRIMARY PHOTO</Text>
                            </View>
                          )}

                          <View style={s.imageActionOverlay}>
                            {idx !== 0 && (
                              <TouchableOpacity style={s.setPrimaryBtn} onPress={() => handleSetPrimaryImage(idx)}>
                                <Text style={s.setPrimaryText}>Set Primary</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity style={s.removeImageBtn} onPress={() => handleRemoveImage(idx)}>
                              <Text style={s.removeImageText}>Remove ✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      {images.length < 3 && (
                        <TouchableOpacity
                          style={s.dropzoneCard}
                          onPress={handleSimulateImageUpload}
                          disabled={uploadingImage}
                          activeOpacity={0.8}
                        >
                          {uploadingImage ? (
                            <View style={{ alignItems: 'center' }}>
                              <ActivityIndicator size="small" color={Colors.primary} />
                              <Text style={s.uploadingProgressText}>{imageUploadProgress}% uploading…</Text>
                            </View>
                          ) : (
                            <>
                              <Ionicons name="camera-outline" size={18} style={{ color: '#475569' }} />
                              <Text style={s.dropzoneText}>+ Upload Photo ({images.length + 1}/3)</Text>
                              <Text style={s.dropzoneSub}>Drag and drop image here</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* CARD 6: Live Customer Preview Card */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionHeaderLabel}>LIVE CUSTOMER APP PREVIEW</Text>
                    <Text style={s.customerPreviewSub}>How this SKU appears to nearby buyers in GlowVAI app</Text>

                    <View style={s.customerPreviewCard}>
                      <View style={s.customerPreviewHeader}>
                        <View style={s.previewThumbBox}>
                          <Ionicons name="cube-outline" size={18} color="#475569" style={s.previewEmoji} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={s.previewBrandRow}>
                            <Text style={s.previewBrandLabel}>{brand || 'GlowVAI'}</Text>
                            <View style={s.liveStatusChip}>
                              <Text style={s.liveStatusChipText}>
                                {(parseInt(initialStock, 10) || 0) > 0 ? '🟢 LIVE' : '🔴 HIDDEN'}
                              </Text>
                            </View>
                          </View>

                          <Text style={s.previewTitleText} numberOfLines={2}>
                            {productName || 'Sample Beauty Product Name'}
                          </Text>

                          <View style={s.previewVariantChip}>
                            <Text style={s.previewVariantChipText}>
                              {category === 'Makeup' ? `Shade: ${selectedShadeName}` : `Size: ${selectedVolume}`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={s.customerPreviewFooter}>
                        <div>
                          <Text style={s.customerPriceText}>₹{sellingNum || mrpNum || 0}</Text>
                          {mrpNum > sellingNum && sellingNum > 0 && (
                            <Text style={s.customerMrpText}>₹{mrpNum}</Text>
                          )}
                        </div>

                        <View style={s.stockPillBox}>
                          <Text style={s.stockPillText}>
                            {(parseInt(initialStock, 10) || 0) > 0
                              ? `In Stock (${initialStock} units)`
                              : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                </View>

              </View>

            </View>
            <View style={{ height: 60 }} />
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={s.stickyFooter}>
            <View style={s.footerContainer}>
              <View style={s.footerLeftGroup}>
                <TouchableOpacity
                  style={s.cancelFooterBtn}
                  onPress={() => router.replace('/(vendor)/catalog')}
                >
                  <Text style={s.cancelFooterBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.saveDraftFooterBtn} onPress={() => setDraftSavedText(`Draft manually saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}>
                  <Text style={s.saveDraftFooterBtnText}>Save Draft</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.primaryCtaBtn, loading && s.primaryCtaBtnDisabled]}
                onPress={handleSaveProduct}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.primaryCtaBtnText}>
                    {isEditing ? 'Save Product SKU Changes →' : 'Save Product SKU →'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>

      {/* Success Modal */}
      {showSuccessModal && createdProductPreview && (
        <View style={s.modalOverlay}>
          <View style={s.successCard}>
            <View style={s.successIconBox}>
              <Ionicons name="sparkles" size={18} color="#475569" style={s.successIconText} />
            </View>
            <Text style={s.successTitle}>Product SKU Saved Successfully!</Text>
            <Text style={s.successSub}>
              "{createdProductPreview.name}" is now live and updated in your dark store catalog.
            </Text>

            <View style={s.previewSummaryBox}>
              <Text style={s.previewBrand}>{createdProductPreview.brand}</Text>
              <Text style={s.previewTitle}>{createdProductPreview.name}</Text>
              <Text style={s.previewMeta}>
                SKU: {createdProductPreview.sku} • Stock: {createdProductPreview.stock} • {createdProductPreview.bin}
              </Text>
              <Text style={s.previewPrice}>MRP ₹{createdProductPreview.mrp} (Selling Price ₹{createdProductPreview.sellingPrice})</Text>
            </View>

            <View style={s.successActionsRow}>
              <TouchableOpacity
                style={s.viewCatalogBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace('/(vendor)/catalog');
                }}
              >
                <Text style={s.viewCatalogBtnText}>View in Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.addAnotherBtn}
                onPress={handleAddAnother}
              >
                <Text style={s.addAnotherBtnText}>+ Add Another SKU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm Off-White #F8FAFC
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Desktop Navigation Rail ────────────────────────────────────────────────── */
  navRail: {
    width: 240,
    backgroundColor: '#0F172A', // Dark Navy
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 38,
    height: 38,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  railBrandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  railNavGroup: {
    gap: 6,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primary,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  railNavLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#94A3B8',
  },
  railNavLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  railFooter: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
  },
  storeSelectorPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#CBD5E1',
  },
  railHelpBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primaryLight,
  },

  /* ── Main Console Area ──────────────────────────────────────────────────────── */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  /* Top Breadcrumbs Header */
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  breadcrumbSep: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  draftSavedPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  draftSavedPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  /* Edge Simulation Strip */
  simStripCard: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 6,
  },
  simTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  simScrollContainer: {
    gap: Spacing.xs,
  },
  simChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  simChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  simChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* System Banners */
  restoredDraftBanner: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restoredDraftBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  bannerDismiss: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  apiErrorBanner: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
  },
  apiErrorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },

  /* Main 1200px Grid Layout */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  maxContentContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  leftFormColumn: {
    flex: 7,
  },
  rightMediaColumn: {
    flex: 5,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  /* Form Fields */
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  fieldInput: {
    height: 42,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  fieldInputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },
  fieldHint: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },

  /* Category Pills */
  catPillsRow: {
    gap: Spacing.xs,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Variant Management */
  addVariantBtnHeader: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  addVariantBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  customShadeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  customShadeBoxTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  saveCustomShadeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCustomShadeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shadesGrid: {
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  shadeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shadeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  shadeCardMainTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shadeSwatchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  shadeNameText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  shadeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shadeActionIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  shadeActionIconDel: {
    fontSize: 14,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  editingNotice: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  sizePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sizePillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Pricing & Tax Breakdown */
  gstOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  gstOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  gstOptionBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  gstOptionText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  gstOptionTextActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  payoutValidationHintCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  payoutHintTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  payoutBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  payoutHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  payoutHintBoldText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  taxDisclaimer: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  /* Right Media Column */
  imageCountText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  imageGuidanceBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  imageGuidanceText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  imageScanErrorCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageScanErrorTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  imageScanErrorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  retryScanBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.input,
  },
  retryScanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  imageGridContainer: {
    gap: Spacing.md,
  },
  imagePreviewCardFull: {
    height: 140,
    borderRadius: BorderRadii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  imagePreviewFull: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  imageActionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setPrimaryBtn: {
    padding: 2,
  },
  setPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  removeImageBtn: {
    padding: 2,
  },
  removeImageText: {
    color: '#FF4D4D',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  dropzoneCard: {
    height: 100,
    borderRadius: BorderRadii.card,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  dropzoneIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  dropzoneText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  dropzoneSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  uploadingProgressText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },

  /* Live Customer Preview Card */
  customerPreviewSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  customerPreviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  customerPreviewHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewThumbBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 24,
  },
  previewBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBrandLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  liveStatusChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  liveStatusChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  previewTitleText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  previewVariantChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  previewVariantChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  customerPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  customerPriceText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerMrpText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stockPillBox: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  stockPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Sticky Footer Action Bar */
  stickyFooter: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cancelFooterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelFooterBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveDraftFooterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveDraftFooterBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryCtaBtn: {
    height: 48,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary, // Royal Blue #1D4ED8
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  primaryCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Success Modal */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 32,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  successSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  previewSummaryBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  previewBrand: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  previewMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  previewPrice: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
    marginTop: 4,
  },
  successActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  viewCatalogBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCatalogBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addAnotherBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
