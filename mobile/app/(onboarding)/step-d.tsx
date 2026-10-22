/**
 * SCREEN 07: Beauty Categories & Catalog Seed (Step 4/4)
 * Desktop 1440x1024 Reference Layout with 2-Column Responsive Widescreen Grid (1200px max-width)
 * File: mobile/app/(onboarding)/step-d.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingApi } from '../../src/services/api';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import AppHeader from '../../src/components/AppHeader';

const STEP_LABELS = ['Store', 'Documents', 'Bank', 'Catalog'];

const CATEGORIES = [
  { id: 'skincare', name: 'Skincare', icon: '🧴', desc: 'Serums, cleansers, moisturizers & sunscreens' },
  { id: 'makeup', name: 'Makeup', icon: '💄', desc: 'Foundations, lipsticks, mascaras & palettes' },
  { id: 'haircare', name: 'Hair care', icon: '💇‍♀️', desc: 'Shampoos, conditioners, serums & masks' },
  { id: 'fragrance', name: 'Fragrance', icon: '✨', desc: 'Perfumes, body mists & deodorants' },
  { id: 'bath_body', name: 'Bath & body', icon: '🧼', desc: 'Body washes, scrubs, lotions & soaps' },
  { id: 'tools', name: 'Tools', icon: '✂️', desc: 'Brushes, sponges, curlers & applicators' },
];

interface StarterProduct {
  id: string;
  name: string;
  brand: string;
  size: string;
  mrp: string;
  price: string;
  icon: string;
  category: string;
}

const STARTER_PRODUCTS: StarterProduct[] = [
  { id: 'sku_1', name: 'Minimalist 10% Niacinamide Serum', brand: 'Minimalist', size: '30 ml', mrp: '₹599', price: '₹549', icon: '🧴', category: 'skincare' },
  { id: 'sku_2', name: 'Cetaphil Gentle Skin Cleanser', brand: 'Cetaphil', size: '125 ml', mrp: '₹399', price: '₹369', icon: '🧼', category: 'skincare' },
  { id: 'sku_3', name: 'Maybelline Fit Me Matte Foundation', brand: 'Maybelline', size: '30 ml', mrp: '₹549', price: '₹499', icon: '💄', category: 'makeup' },
  { id: 'sku_4', name: 'L’Oréal Paris Extraordinary Oil Serum', brand: 'L’Oréal Paris', size: '100 ml', mrp: '₹799', price: '₹699', icon: '✨', category: 'haircare' },
  { id: 'sku_5', name: 'Plum BodyLovin’ Vanilla Mist', brand: 'Plum', size: '150 ml', mrp: '₹525', price: '₹475', icon: '✨', category: 'fragrance' },
  { id: 'sku_6', name: 'Real Techniques Miracle Sponge', brand: 'Real Techniques', size: '1 Unit', mrp: '₹699', price: '₹629', icon: '✂️', category: 'tools' },
];

export default function OnboardingStepD() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Selected Categories State
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // Selected Seed SKUs with Stock Stepper State
  const [selectedSkus, setSelectedSkus] = useState<Record<string, number>>({});

  // Category Filter & Search State
  const [activeCatFilter, setActiveCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Draft Auto-Save State
  const [lastSavedTime, setLastSavedTime] = useState('');

  // Confirmation Modal & Submission State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Demo Edge State Simulator State
  const [demoState, setDemoState] = useState<'normal' | 'seeding_progress' | 'api_failure' | 'offline' | 'duplicate_sku'>('normal');

  // Restore saved data on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Choose What You Sell (Step 4/4) | GlowVAI Vendor Onboarding";
    }

    AsyncStorage.getItem('onb_step_d').then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.selectedCats) setSelectedCats(parsed.selectedCats);
          if (parsed.selectedSkus) setSelectedSkus(parsed.selectedSkus);
        } catch (e) {
          // Ignore invalid parse
        }
      }
    });
  }, []);

  // Category Selection Toggle
  const toggleCategory = (catId: string) => {
    setSubmitError('');
    if (selectedCats.includes(catId)) {
      if (selectedCats.length === 1) {
        setSubmitError('Please select at least 1 store specialty category.');
        return;
      }
      setSelectedCats(selectedCats.filter(c => c !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  // SKU Checkbox Selection Toggle
  const toggleProductSelection = (skuId: string) => {
    setSelectedSkus(prev => {
      const copy = { ...prev };
      if (copy[skuId] !== undefined) {
        delete copy[skuId];
      } else {
        copy[skuId] = 5; // Default initial stock
      }
      return copy;
    });
  };

  // Stock Stepper (+ / -)
  const updateStock = (skuId: string, delta: number) => {
    setSelectedSkus(prev => {
      const current = prev[skuId] || 5;
      const next = Math.max(1, current + delta);
      return { ...prev, [skuId]: next };
    });
  };

  // Bulk Actions
  const handleSelectAllVisible = () => {
    const visibleSkus = filteredProducts.map(p => p.id);
    setSelectedSkus(prev => {
      const copy = { ...prev };
      visibleSkus.forEach(id => {
        if (copy[id] === undefined) copy[id] = 5;
      });
      return copy;
    });
  };

  const handleClearSelection = () => {
    setSelectedSkus({});
  };

  // Filtered Products List
  const filteredProducts = STARTER_PRODUCTS.filter(p => {
    const matchesCat = activeCatFilter === 'all' || p.category === activeCatFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedCatsCount = selectedCats.length;
  const selectedSkusCount = Object.keys(selectedSkus).length;
  const totalStockCount = Object.values(selectedSkus).reduce((acc, curr) => acc + curr, 0);

  // Draft Save Handler
  const handleSaveDraft = async () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    const draftData = { selectedCats, selectedSkus, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem('onb_step_d', JSON.stringify(draftData));
  };

  // Open Confirmation Dialog
  const handleOpenConfirm = () => {
    if (selectedCats.length === 0) {
      setSelectedCats(['skincare', 'makeup']);
    }
    setAgreedTerms(true);
    setSubmitError('');
    setShowConfirmModal(true);
  };

  // Final Submission to Compliance Review (/onboarding/pending)
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      if (demoState === 'api_failure') {
        throw new Error('Catalog submission gateway failure. Please check server connection and retry.');
      }
      if (demoState === 'offline') {
        throw new Error('Network offline. Unable to submit store for compliance audit.');
      }

      const stepDData = {
        selectedCats,
        selectedSkus,
        totalStockCount,
        submittedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('onb_step_d', JSON.stringify(stepDData));

      const [rawA, rawB, rawC, phone] = await Promise.all([
        AsyncStorage.getItem('onb_step_a'),
        AsyncStorage.getItem('onb_step_b'),
        AsyncStorage.getItem('onb_step_c'),
        AsyncStorage.getItem('vendor_phone'),
      ]);
      if (!rawA || !rawB || !rawC) {
        throw new Error('Complete store, tax and payout details before submitting.');
      }
      const stepA = JSON.parse(rawA);
      const stepB = JSON.parse(rawB);
      const stepC = JSON.parse(rawC);

      // The full bank account number is intentionally not stored on the device.
      // The server must receive it through a secure channel (see audit section 2, C6/C7).
      await onboardingApi.submit({
        ownerName: stepA.ownerName,
        shopName: stepA.storeName,
        phone: phone ?? '',
        city: stepA.city,
        locality: stepA.locality,
        pincode: stepA.pincode,
        openTime: stepA.openTime,
        closeTime: stepA.closeTime,
        latitude: stepA.latitude,
        longitude: stepA.longitude,
        gstin: stepB.gstin,
        pan: stepB.pan,
        cosmeticLicense: stepB.cosmeticLicense,
        licenseExpiry: stepB.licenseExpiry,
        tradeLicense: stepB.tradeLicense,
        beneficiaryName: stepC.beneficiaryName,
        bankName: stepC.selectedBank,
        maskedAccountNumber: stepC.maskedAccountNumber,
        ifsc: stepC.ifsc,
        upiVpa: stepC.upiVpa,
        categories: selectedCats,
        seedSkus: selectedSkus,
      });

      await AsyncStorage.setItem('vendor_onboarding_status', 'pending');

      setShowConfirmModal(false);
      router.replace('/(onboarding)/pending');
    } catch (err: any) {
      setShowConfirmModal(false);
      setSubmitError(err.message || 'Submission failed. Please check connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Widescreen Onboarding Header Shell */}
      <AppHeader
        title="Products"
        subtitle="Step 4 of 4 • Catalog Seed"
        showBack={true}
      />

          {/* Center 4-Step Horizontal Progress Tracker */}
          <View style={s.headerProgressWrap}>
            <View style={s.progressTrackRow}>
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === 4;
                const isCompleted = stepNum <= 4;

                return (
                  <React.Fragment key={label}>
                    <View style={s.trackerStepItem}>
                      <View style={[
                        s.trackerCircle,
                        isCompleted && s.trackerCircleCompleted,
                        isActive && s.trackerCircleActive,
                      ]}>
                        <Text style={[
                          s.trackerCircleText,
                          (isCompleted || isActive) && s.trackerCircleTextActive,
                        ]}>
                          {isCompleted ? '✓' : stepNum}
                        </Text>
                      </View>
                      <Text style={[
                        s.trackerStepLabel,
                        isActive && s.trackerStepLabelActive,
                        isCompleted && s.trackerStepLabelCompleted,
                      ]}>
                        {label}
                      </Text>
                    </View>
                    {idx < STEP_LABELS.length - 1 && (
                      <View style={[s.trackerLine, isCompleted && s.trackerLineCompleted]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Right Draft Status & Help Link */}
          <View style={s.headerMetaRight}>
            {lastSavedTime ? (
              <View style={s.draftBadge}>
                <Text style={s.draftBadgeText}>✓ Draft saved at {lastSavedTime}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={s.supportLink} activeOpacity={0.7}>
              <Text style={s.supportLinkText}>Need help?</Text>
            </TouchableOpacity>
          </View>

      {/* Main Body Layout */}
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.maxContainer, isExpanded && s.maxContainerExpanded]}>
          
          {/* Opening Greeting Banner */}
          <View style={s.openingCard}>
            <Text style={s.openingTitle}>✨ Choose what you sell</Text>
            <Text style={s.openingSub}>
              Select your primary beauty specialties and seed initial stock for popular quick-start products before submitting for compliance audit.
            </Text>
          </View>

          {/* Interactive Demo Overrides Bar */}
          {__DEV__ && (
          <View style={s.demoStateBar}>
            <Text style={s.demoStateLabel}>🧪 Test Catalog Edge States:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.demoChipRow}>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'normal' && s.demoChipActive]}
                onPress={() => { setDemoState('normal'); setSubmitError(''); }}
              >
                <Text style={[s.demoChipText, demoState === 'normal' && s.demoChipTextActive]}>Default State</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'seeding_progress' && s.demoChipActive]}
                onPress={() => setDemoState('seeding_progress')}
              >
                <Text style={[s.demoChipText, demoState === 'seeding_progress' && s.demoChipTextActive]}>Seeding Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'api_failure' && s.demoChipActive]}
                onPress={() => { setDemoState('api_failure'); setSubmitError('Gateway Submission Failed'); }}
              >
                <Text style={[s.demoChipText, demoState === 'api_failure' && s.demoChipTextActive]}>API Failure</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'duplicate_sku' && s.demoChipActive]}
                onPress={() => { setDemoState('duplicate_sku'); setSubmitError('Duplicate SKU in inventory'); }}
              >
                <Text style={[s.demoChipText, demoState === 'duplicate_sku' && s.demoChipTextActive]}>Duplicate SKU Alert</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Error Banner */}
          {submitError !== '' && (
            <View style={s.errorCard}>
              <Text style={s.errorCardText}>⚠️ {submitError}</Text>
            </View>
          )}

          {/* 2-Column Responsive Widescreen Grid */}
          <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>
            
            {/* Left Column (5/12): Store Specialties Tiles */}
            <View style={s.colLeft}>
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>Store specialties</Text>
                    <Text style={s.sectionSub}>Select the main beauty categories available at your storefront</Text>
                  </View>
                  <View style={s.badgePill}>
                    <Text style={s.badgePillText}>{selectedCatsCount} Selected</Text>
                  </View>
                </View>

                {/* Category Grid Tiles */}
                <View style={s.categoryGrid}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCats.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[s.categoryCard, isSelected && s.categoryCardSelected]}
                        onPress={() => toggleCategory(cat.id)}
                        activeOpacity={0.8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <View style={s.categoryHeaderRow}>
                          <Text style={s.categoryIcon}>{cat.icon}</Text>
                          <View style={[s.checkIndicator, isSelected && s.checkIndicatorSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
                          </View>
                        </View>
                        <Text style={[s.categoryName, isSelected && s.categoryNameSelected]}>
                          {cat.name}
                        </Text>
                        <Text style={s.categoryDesc} numberOfLines={2}>
                          {cat.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedCatsCount === 0 && (
                  <Text style={s.emptyCategoryWarning}>⚠️ Select at least 1 category to proceed</Text>
                )}
              </View>
            </View>

            {/* Right Column (7/12): Quick-Start Products Workspace */}
            <View style={s.colRight}>
              
              {/* Helper Banner */}
              <View style={s.helperBannerCard}>
                <Text style={s.helperBannerText}>
                  💡 These are starter suggestions. Review availability and stock before submitting.
                </Text>
              </View>

              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>Quick-start products</Text>
                    <Text style={s.sectionSub}>Popular beauty SKUs ready to seed in your initial inventory</Text>
                  </View>
                  <View style={s.bulkActionRow}>
                    <TouchableOpacity onPress={handleSelectAllVisible} activeOpacity={0.7}>
                      <Text style={s.selectAllLinkText}>Select all visible</Text>
                    </TouchableOpacity>
                    <Text style={s.dividerDot}>•</Text>
                    <TouchableOpacity onPress={handleClearSelection} activeOpacity={0.7}>
                      <Text style={s.clearLinkText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Toolbar: Category Filter Chips & Search Bar */}
                <View style={s.toolbarBox}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChipRow}>
                    <TouchableOpacity
                      style={[s.filterChip, activeCatFilter === 'all' && s.filterChipActive]}
                      onPress={() => setActiveCatFilter('all')}
                    >
                      <Text style={[s.filterChipText, activeCatFilter === 'all' && s.filterChipTextActive]}>All SKUs</Text>
                    </TouchableOpacity>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[s.filterChip, activeCatFilter === c.id && s.filterChipActive]}
                        onPress={() => setActiveCatFilter(c.id)}
                      >
                        <Text style={[s.filterChipText, activeCatFilter === c.id && s.filterChipTextActive]}>
                          {c.icon} {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={s.searchInput}
                    placeholder="Search starter SKUs by brand or product name..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    accessibilityLabel="Search starter products"
                  />
                </View>

                {/* Product List */}
                {filteredProducts.length === 0 ? (
                  <View style={s.emptyProductsBox}>
                    <Text style={s.emptyProductsText}>🔍 No SKUs found matching "{searchQuery}"</Text>
                  </View>
                ) : (
                  <View style={s.productList}>
                    {filteredProducts.map(prod => {
                      const isSelected = selectedSkus[prod.id] !== undefined;
                      const stockCount = selectedSkus[prod.id] || 5;

                      return (
                        <View key={prod.id} style={[s.productRow, isSelected && s.productRowSelected]}>
                          {/* Selection Checkbox */}
                          <TouchableOpacity
                            style={s.productCheckArea}
                            onPress={() => toggleProductSelection(prod.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[s.checkbox, isSelected && s.checkboxChecked]}>
                              {isSelected && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
                            </View>
                          </TouchableOpacity>

                          {/* Thumbnail & Product Details */}
                          <View style={s.productThumbnail}>
                            <Text style={s.productIconText}>{prod.icon}</Text>
                          </View>

                          <View style={s.productDetailsWrap}>
                            <Text style={s.productName}>{prod.name}</Text>
                            <Text style={s.productSub}>
                              {prod.brand} • {prod.size} • Selling: <Text style={s.priceText}>{prod.price}</Text> (MRP: {prod.mrp})
                            </Text>
                          </View>

                          {/* Inline Stock Stepper */}
                          {isSelected ? (
                            <View style={s.stepperWrap}>
                              <Text style={s.stepperLabel}>Stock:</Text>
                              <View style={s.stepperBox}>
                                <TouchableOpacity
                                  style={s.stepperBtn}
                                  onPress={() => updateStock(prod.id, -1)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={s.stepperBtnText}>-</Text>
                                </TouchableOpacity>

                                <Text style={s.stepperCount}>{stockCount}</Text>

                                <TouchableOpacity
                                  style={s.stepperBtn}
                                  onPress={() => updateStock(prod.id, 1)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={s.stepperBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Final Compliance Confirmation Checkbox */}
          <TouchableOpacity
            style={s.agreementRow}
            onPress={() => setAgreedTerms(!agreedTerms)}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, agreedTerms && s.checkboxChecked]}>
              {agreedTerms && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
            </View>
            <Text style={s.agreementText}>
              I confirm that my store info, tax records, payout account, and initial inventory stock choices are accurate.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={s.stickyFooter}>
        <View style={s.footerContainer}>
          <View style={s.footerLeftRow}>
            <TouchableOpacity
              style={s.footerBackBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={s.footerBackText}>← Back to bank setup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.saveDraftBtn}
              onPress={handleSaveDraft}
              activeOpacity={0.7}
            >
              <Text style={s.saveDraftText}>💾 Save draft</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              s.ctaBtn,
              (selectedCatsCount === 0 || !agreedTerms || submitting) && s.ctaBtnDisabled
            ]}
            onPress={handleOpenConfirm}
            disabled={selectedCatsCount === 0 || !agreedTerms || submitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Submit store for review"
          >
            {submitting ? (
              <View style={s.submittingWrap}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={s.submittingText}>Submitting store...</Text>
              </View>
            ) : (
              <View style={s.ctaTextWrap}>
                <Text style={s.ctaMainText}>Submit store for review →</Text>
                <Text style={s.ctaSubText}>
                  {selectedCatsCount} categories • {selectedSkusCount} products ({totalStockCount} units) • Step 4 of 4
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pre-Submission Confirmation Dialog Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.modalIcon} />
            <Text style={s.modalTitle}>Submit Store for Compliance Audit?</Text>
            <Text style={s.modalSub}>
              Your store profile, verified tax documents, bank details, and starter catalog choices will be routed to the GlowVAI audit team.
            </Text>

            <View style={s.modalSummaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Selected Specialties:</Text>
                <Text style={s.summaryVal}>{selectedCatsCount} Categories</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Starter Catalog SKUs:</Text>
                <Text style={s.summaryVal}>{selectedSkusCount} SKUs</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Total Initial Units:</Text>
                <Text style={s.summaryVal}>{totalStockCount} Units</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Audit SLA Target:</Text>
                <Text style={s.summaryValHighlight}>Within 24 Hours</Text>
              </View>
            </View>

            <View style={s.modalActionsRow}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelText}>Review catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.modalConfirmBtn}
                onPress={handleFinalSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.modalConfirmText}>Confirm & Submit →</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },

  /* Desktop Header Shell */
  desktopHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  brandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* 4-Step Horizontal Progress Tracker */
  headerProgressWrap: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  progressTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackerStepItem: {
    alignItems: 'center',
    gap: 4,
  },
  trackerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  trackerCircleCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  trackerCircleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  trackerCircleTextActive: {
    color: '#FFFFFF',
  },
  trackerStepLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  trackerStepLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  trackerStepLabelCompleted: {
    color: Colors.primary,
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
    marginTop: -14,
  },
  trackerLineCompleted: {
    backgroundColor: Colors.primary,
  },

  headerMetaRight: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  draftBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  draftBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  supportLink: {
    paddingVertical: 4,
  },
  supportLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  maxContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  maxContainerExpanded: {
    maxWidth: 1200,
  },

  /* Opening Banner Card */
  openingCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  openingTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  openingSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  /* Demo State Switcher Bar */
  demoStateBar: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  demoStateLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  demoChipRow: {
    gap: 6,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  demoChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  demoChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Helper Banner */
  helperBannerCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  helperBannerText: {
    fontSize: 12,
    color: '#D97706',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    lineHeight: 16,
  },

  /* Error Banner */
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorCardText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Grid Columns */
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridRowExpanded: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 5,
  },
  colRight: {
    flex: 7,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  badgePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Category Tiles Grid */
  categoryGrid: {
    gap: Spacing.sm,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkIndicatorSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryNameSelected: {
    color: Colors.primary,
  },
  categoryDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyCategoryWarning: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.sm,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Quick-Start Products Workspace */
  bulkActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  dividerDot: {
    color: Colors.textMuted,
  },
  clearLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toolbarBox: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterChipRow: {
    gap: 6,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  productList: {
    gap: Spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  productRowSelected: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
  },
  productCheckArea: {
    paddingRight: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  productThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  productDetailsWrap: {
    flex: 1,
  },
  productName: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyProductsBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },

  /* Stepper */
  stepperWrap: {
    alignItems: 'flex-end',
  },
  stepperLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  stepperBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stepperCount: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  /* Agreement Row */
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Persistent Bottom Action Bar */
  stickyFooter: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  footerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  footerBackText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveDraftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primaryLight,
  },
  saveDraftText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  ctaBtn: {
    height: 52,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary, // Royal Blue
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submittingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submittingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  ctaTextWrap: {
    alignItems: 'center',
  },
  ctaMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  ctaSubText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Confirmation Dialog Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  modalIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    gap: 8,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  summaryValHighlight: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1.4,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
