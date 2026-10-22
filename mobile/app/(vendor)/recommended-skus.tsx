/**
 * SCREEN 17: AI Recommended SKUs & Demand Insights
 * Desktop 1440x1024 Explainable Merchant Intelligence Workstation
 * File: mobile/app/(vendor)/recommended-skus.tsx
 */
import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

export interface AIRecommendationItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  category: string;
  mrp: number;
  estimatedDemand: string;
  estimatedOrdersPerMonth: number;
  potentialMarginPercent: number;
  confidenceLabel: string;
  suggestedStartQty: number;
  alreadyInCatalog: boolean;
  supplierAvailable: boolean;
  reasons: string[];
  comparableProduct?: string;
  expectedPriceBand?: string;
  stockRiskExplanation?: string;
}

const INITIAL_RECOMMENDATIONS: AIRecommendationItem[] = [
  {
    id: 'REC-101',
    brand: 'Minimalist',
    name: 'Minimalist 2% Alpha Arbutin Serum 30ml',
    variant: '30 ml',
    category: 'Skincare',
    mrp: 549,
    estimatedDemand: 'About 140 nearby orders/month',
    estimatedOrdersPerMonth: 140,
    potentialMarginPercent: 22,
    confidenceLabel: '⚡ 94% High Demand Signal',
    suggestedStartQty: 12,
    alreadyInCatalog: false,
    supplierAvailable: true,
    reasons: ['240+ customer searches in Benz Circle this week', 'Zero nearby dark stores stocking Alpha Arbutin', 'Fast supplier replenishment (1-day ETA)'],
    comparableProduct: 'Minimalist 10% Niacinamide Serum',
    expectedPriceBand: '₹499 – ₹549',
    stockRiskExplanation: 'Low shelf risk due to 2-year batch stability.',
  },
  {
    id: 'REC-102',
    brand: 'Nykaa',
    name: 'Nykaa Matte to Last Liquid Lipstick (Chai)',
    variant: 'Shade 18 Chai',
    category: 'Makeup',
    mrp: 675,
    estimatedDemand: 'About 95 nearby orders/month',
    estimatedOrdersPerMonth: 95,
    potentialMarginPercent: 25,
    confidenceLabel: '🔥 Trending Shade',
    suggestedStartQty: 10,
    alreadyInCatalog: false,
    supplierAvailable: true,
    reasons: ['Top requested nude lipstick shade in Vijayawada', '25% high potential net payout margin'],
    comparableProduct: 'Maybelline Sensational Liquid Matte',
    expectedPriceBand: '₹599 – ₹675',
    stockRiskExplanation: 'Moderate trend risk; monitor seasonal demand.',
  },
  {
    id: 'REC-103',
    brand: 'Plum',
    name: 'Plum Green Tea Pore Cleansing Face Wash 100ml',
    variant: '100 ml',
    category: 'Skincare',
    mrp: 349,
    estimatedDemand: 'About 180 nearby orders/month',
    estimatedOrdersPerMonth: 180,
    potentialMarginPercent: 20,
    confidenceLabel: '⭐ Local Best Seller',
    suggestedStartQty: 15,
    alreadyInCatalog: true, // Existing SKU demo
    supplierAvailable: true,
    reasons: ['High repeat purchase rate in Benz Circle', 'Consistent daily searches'],
    comparableProduct: 'Cetaphil Gentle Skin Cleanser',
    expectedPriceBand: '₹315 – ₹349',
    stockRiskExplanation: 'Extremely low risk; steady daily sales velocity.',
  },
  {
    id: 'REC-104',
    brand: 'Biotique',
    name: 'Biotique Bio Kelp Fresh Growth Shampoo 340ml',
    variant: '340 ml',
    category: 'Hair care',
    mrp: 399,
    estimatedDemand: 'About 80 nearby orders/month',
    estimatedOrdersPerMonth: 80,
    potentialMarginPercent: 24,
    confidenceLabel: '🌱 Rising Category',
    suggestedStartQty: 8,
    alreadyInCatalog: false,
    supplierAvailable: true,
    reasons: ['Herbal haircare demand spike in Q3', 'Low competitor stock availability'],
    comparableProduct: 'L’Oréal Hyaluronic Shampoo',
    expectedPriceBand: '₹329 – ₹399',
    stockRiskExplanation: 'Low shelf risk; long batch shelf life.',
  },
  {
    id: 'REC-105',
    brand: 'Bella Vita',
    name: 'Bella Vita Luxury CEO Woman EDP Perfume 100ml',
    variant: '100 ml',
    category: 'Fragrance',
    mrp: 899,
    estimatedDemand: 'About 110 nearby orders/month',
    estimatedOrdersPerMonth: 110,
    potentialMarginPercent: 28,
    confidenceLabel: '💎 28% Highest Margin',
    suggestedStartQty: 6,
    alreadyInCatalog: false,
    supplierAvailable: true,
    reasons: ['High luxury fragrance margin', 'Gifting demand surge in festive season'],
    comparableProduct: 'Plum BodyLovin’ EDP 50ml',
    expectedPriceBand: '₹799 – ₹899',
    stockRiskExplanation: 'Higher capital commitment; recommended low starting stock.',
  },
  {
    id: 'REC-106',
    brand: 'CeraVe',
    name: 'CeraVe Moisturizing Lotion 237ml',
    variant: '237 ml',
    category: 'Skincare',
    mrp: 1199,
    estimatedDemand: 'About 60 nearby orders/month',
    estimatedOrdersPerMonth: 60,
    potentialMarginPercent: 18,
    confidenceLabel: '⚠️ Supplier Out of Stock',
    suggestedStartQty: 5,
    alreadyInCatalog: false,
    supplierAvailable: false,
    reasons: ['High customer query frequency', 'Supplier restocking expected in 3 days'],
    comparableProduct: 'Cetaphil Moisturizing Lotion',
    expectedPriceBand: '₹1099 – ₹1199',
    stockRiskExplanation: 'Currently backordered at primary regional distributor.',
  },
];

function RecommendedSkusScreen() {
  const router = useRouter();
  const { inventory, addInventoryItem } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>(INITIAL_RECOMMENDATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; undoAction?: () => void } | null>(null);

  // Selected Item Drawer State
  const [selectedRecDetail, setSelectedRecDetail] = useState<AIRecommendationItem | null>(INITIAL_RECOMMENDATIONS[0]);

  // System Edge States
  const [isStaleInsights, setIsStaleInsights] = useState(false);
  const [isLimitedData, setIsLimitedData] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'AI Recommended SKUs | GlowVAI Vendor Console';
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(item => {
      if (dismissedIds.includes(item.id)) return false;

      if (selectedCategory === 'Highest Demand') {
        return item.estimatedOrdersPerMonth >= 120;
      }
      if (selectedCategory === 'Highest Margin') {
        return item.potentialMarginPercent >= 24;
      }
      if (selectedCategory !== 'All') {
        return item.category === selectedCategory;
      }
      return true;
    });
  }, [recommendations, dismissedIds, selectedCategory]);

  const handleAddToStore = (item: AIRecommendationItem) => {
    const newSkuCode = `SKU-${item.brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    addInventoryItem({
      productId: `P-${Date.now().toString().slice(-5)}`,
      name: item.name,
      brand: item.brand,
      category: item.category,
      sku: newSkuCode,
      mrp: item.mrp,
      sellingPrice: Math.round(item.mrp * 0.88),
      stock: 0,
      bin: 'Shelf A-01-01',
      gstPercent: 18,
      images: [],
      active: true,
      description: `AI recommended item. ${item.estimatedDemand}`,
      updatedAt: Date.now(),
    });

    setAddedIds(prev => [...prev, item.id]);

    setToastMessage({
      text: `✓ Added "${item.name.slice(0, 22)}…" to catalog (0 Stock staged)`,
      undoAction: () => {
        setAddedIds(prev => prev.filter(id => id !== item.id));
        setToastMessage({ text: `Removed "${item.name.slice(0, 20)}…" from draft catalog` });
      },
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
    setToastMessage({
      text: 'Suggestion dismissed.',
      undoAction: () => {
        setDismissedIds(prev => prev.filter(dId => dId !== id));
      },
    });
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
                <Wordmark size={17} />
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

          {/* Top Breadcrumbs & Page Header */}
          <View style={s.topHeader}>
            <View style={s.headerLeftGroup}>
              <TouchableOpacity onPress={() => router.replace('/(vendor)/catalog')} style={s.backBtn} activeOpacity={0.8}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>

              <View>
                <View style={s.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.replace('/(vendor)/catalog')}>
                    <Text style={s.breadcrumbLink}>Catalog</Text>
                  </TouchableOpacity>
                  <Text style={s.breadcrumbSep}>/</Text>
                  <Text style={s.breadcrumbCurrent}>Recommendations</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Recommended for your store</Text>
                  <View style={s.aiBadge}>
                    <Text style={s.aiBadgeText}>✨ AI Insights</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <Text style={s.freshnessText}>Updated 10 mins ago • Model v2.4</Text>
              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* Edge Simulation Strip */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST AI EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, isStaleInsights && s.simChipActive]}
                onPress={() => setIsStaleInsights(!isStaleInsights)}
              >
                <Text style={[s.simChipText, isStaleInsights && s.simChipTextActive]}>Stale Insights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, isLimitedData && s.simChipActive]}
                onPress={() => setIsLimitedData(!isLimitedData)}
              >
                <Text style={[s.simChipText, isLimitedData && s.simChipTextActive]}>Limited Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, networkError && s.simChipActive]}
                onPress={() => {
                  setNetworkError(!networkError);
                  if (!networkError) setToastMessage({ text: '❌ Network Error: Failed to fetch live recommendations.' });
                }}
              >
                <Text style={[s.simChipText, networkError && s.simChipTextActive]}>Network Error</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.simChip}
                onPress={() => setDismissedIds([])}
              >
                <Text style={s.simChipText}>Reset Dismissed ({dismissedIds.length})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Edge Banners */}
          {isStaleInsights && (
            <View style={s.staleBanner}>
              <Text style={s.staleBannerText}>⚠️ Stale Insights: Demand models updated 3 days ago. Tap to refresh.</Text>
              <TouchableOpacity onPress={() => setIsStaleInsights(false)}>
                <Text style={s.bannerLink}>Refresh Model</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLimitedData && (
            <View style={s.limitedDataBanner}>
              <Text style={s.limitedDataText}>ℹ️ Limited Local Data: Low query density in Benz Circle. Showing regional best sellers.</Text>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {/* Primary Explanatory Card: "Why these products?" */}
              <View style={s.explanationCard}>
                <View style={s.explanationHeader}>
                  <View style={s.explanationTitleRow}>
                    <Ionicons name="bulb-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.explanationTitle}>Why these products?</Text>
                  </View>

                  <TouchableOpacity
                    style={s.howItWorksLinkBtn}
                    onPress={() => setExplanationModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.howItWorksLinkText}>How recommendations work ℹ️</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.reasonsGrid}>
                  <View style={s.reasonItem}>
                    <Ionicons name="trending-up-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.reasonTitle}>1. Local Order Trends</Text>
                    <Text style={s.reasonSub}>High customer search & order frequency within 5km of Benz Circle, Vijayawada.</Text>
                  </View>

                  <View style={s.reasonItem}>
                    <Ionicons name="locate-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.reasonTitle}>2. Catalog Gaps</Text>
                    <Text style={s.reasonSub}>Missing high-demand beauty SKUs currently unfulfilled by neighboring stores.</Text>
                  </View>

                  <View style={s.reasonItem}>
                    <Ionicons name="wallet-outline" size={18} color="#475569" style={s.reasonIcon} />
                    <Text style={s.reasonTitle}>3. Estimated Margin</Text>
                    <Text style={s.reasonSub}>Healthy 20%–28% net merchant payout margins after flat 12% GlowVAI fee.</Text>
                  </View>
                </View>
              </View>

              {/* Filter Toolbar */}
              <View style={s.filterBarCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
                  {['All', 'Skincare', 'Makeup', 'Hair care', 'Fragrance', 'Highest Demand', 'Highest Margin'].map(cat => {
                    const active = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[s.filterPill, active && s.filterPillActive]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.filterPillText, active && s.filterPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Split Layout: Recommendations List on Left + AI Insight Drawer on Right */}
              <View style={s.splitLayoutRow}>

                {/* ── LEFT COLUMN: Recommendations List (760px) ────────────────────── */}
                <View style={{ flex: 1 }}>
                  {filteredRecommendations.length === 0 ? (
                    <View style={s.emptyStateBox}>
                      <Ionicons name="sparkles" size={18} color="#475569" style={s.emptyIcon} />
                      <Text style={s.emptyTitle}>No recommendations matching filter</Text>
                      <Text style={s.emptySub}>All suggested SKUs in this filter have been added or dismissed.</Text>
                      <TouchableOpacity style={s.resetFilterBtn} onPress={() => setSelectedCategory('All')}>
                        <Text style={s.resetFilterBtnText}>Show All Recommendations</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={s.recommendationsList}>
                      {filteredRecommendations.map(item => {
                        const isAdded = addedIds.includes(item.id);
                        const isExisting = item.alreadyInCatalog;
                        const isSupplierUnavailable = !item.supplierAvailable;
                        const isSelected = selectedRecDetail?.id === item.id;

                        return (
                          <View
                            key={item.id}
                            style={[s.recommendationCard, isSelected && s.recommendationCardSelected]}
                          >
                            <TouchableOpacity
                              style={s.cardTopRow}
                              onPress={() => setSelectedRecDetail(item)}
                              activeOpacity={0.85}
                            >
                              <View style={s.thumbBox}>
                                <Ionicons name="sparkles" size={18} color="#475569" style={s.thumbEmoji} />
                              </View>

                              <View style={{ flex: 1 }}>
                                <View style={s.badgeMetaRow}>
                                  <Text style={s.brandLabelText}>{item.brand}</Text>
                                  <Text style={s.categoryTagText}>{item.category} • {item.variant}</Text>
                                </View>
                                <Text style={s.productTitleText}>{item.name}</Text>
                              </View>

                              {/* Confidence Tag */}
                              <View style={s.confidenceTag}>
                                <Text style={s.confidenceTagText}>{item.confidenceLabel}</Text>
                              </View>
                            </TouchableOpacity>

                            {/* Commercial Grounding Metrics Grid */}
                            <View style={s.metricsGrid}>
                              <View style={s.metricBox}>
                                <Text style={s.metricBoxLabel}>ESTIMATED DEMAND</Text>
                                <Text style={s.metricBoxValueText}>{item.estimatedDemand}</Text>
                              </View>

                              <View style={s.metricBox}>
                                <Text style={s.metricBoxLabel}>POTENTIAL MARGIN</Text>
                                <Text style={s.metricBoxMarginText}>Estimated {item.potentialMarginPercent}% Margin</Text>
                              </View>

                              <View style={s.metricBox}>
                                <Text style={s.metricBoxLabel}>SUGGESTED START</Text>
                                <Text style={s.metricBoxValueText}>{item.suggestedStartQty} units</Text>
                              </View>
                            </View>

                            {/* AI Reasons Bullet List */}
                            <View style={s.reasonsListRow}>
                              {item.reasons.map((r, rIdx) => (
                                <View key={rIdx} style={s.reasonChip}>
                                  <Text style={s.reasonChipText}>• {r}</Text>
                                </View>
                              ))}
                            </View>

                            {/* Footer Price & Reversible Action Row */}
                            <View style={s.cardFooterRow}>
                              <View style={s.priceSummaryBox}>
                                <Text style={s.mrpText}>MRP ₹{item.mrp}</Text>
                                <Text style={s.payoutText}>Est. Net Payout (88%): <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>₹{Math.round(item.mrp * 0.88)}</Text></Text>
                              </View>

                              <View style={s.actionBtnGroup}>
                                {isSupplierUnavailable ? (
                                  <View style={s.unavailableBadge}>
                                    <Text style={s.unavailableBadgeText}>⚠️ Out of stock at distributor</Text>
                                  </View>
                                ) : isExisting ? (
                                  <TouchableOpacity
                                    style={s.existingUpdateBtn}
                                    onPress={() => router.push('/(vendor)/catalog')}
                                  >
                                    <Text style={s.existingUpdateBtnText}>Already in catalog (Update Stock) →</Text>
                                  </TouchableOpacity>
                                ) : isAdded ? (
                                  <View style={s.addedContainerRow}>
                                    <View style={s.addedBadge}>
                                      <Text style={s.addedBadgeText}>✓ Added to Catalog (0 Stock)</Text>
                                    </View>

                                    <TouchableOpacity
                                      style={s.setStockBtn}
                                      onPress={() => router.push('/(vendor)/catalog')}
                                    >
                                      <Text style={s.setStockBtnText}>Set Stock →</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={s.undoAddBtn}
                                      onPress={() => {
                                        setAddedIds(prev => prev.filter(id => id !== item.id));
                                        setToastMessage({ text: 'Removed from draft catalog' });
                                      }}
                                    >
                                      <Text style={s.undoAddBtnText}>Undo</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <View style={s.addActionsRow}>
                                    <TouchableOpacity
                                      style={s.dismissBtn}
                                      onPress={() => handleDismiss(item.id)}
                                    >
                                      <Text style={s.dismissBtnText}>Dismiss</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={s.addBtn}
                                      onPress={() => handleAddToStore(item)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={s.addBtnText}>+ Add to store inventory</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* ── RIGHT COLUMN: Selected Product AI Insight Drawer (440px) ───── */}
                {isExpanded && selectedRecDetail && (
                  <View style={s.previewDrawer}>
                    <View style={s.drawerHeader}>
                      <View>
                        <Text style={s.drawerTitle}>{selectedRecDetail.name}</Text>
                        <Text style={s.drawerSub}>Brand: {selectedRecDetail.brand} • {selectedRecDetail.category}</Text>
                      </View>
                      <TouchableOpacity style={s.drawerCloseBtn} onPress={() => setSelectedRecDetail(null)}>
                        <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                      <View style={s.drawerSectionCard}>
                        <Text style={s.drawerSectionLabel}>DEMAND SIGNAL & PRICE BAND</Text>
                        <Text style={s.drawerValueText}>📈 Monthly Demand: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{selectedRecDetail.estimatedDemand}</Text></Text>
                        <Text style={s.drawerValueText}>🏷️ Price Band: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{selectedRecDetail.expectedPriceBand || '₹499 – ₹549'}</Text></Text>
                        <Text style={s.drawerValueText}>🔄 Comparable Local SKU: {selectedRecDetail.comparableProduct || 'Cetaphil Cleanser'}</Text>
                      </View>

                      <View style={s.drawerSectionCard}>
                        <Text style={s.drawerSectionLabel}>MARGIN ASSUMPTIONS & STOCK RISK</Text>
                        <Text style={s.drawerValueText}>💰 Potential Net Margin: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.success }}>Estimated {selectedRecDetail.potentialMarginPercent}% Margin</Text></Text>
                        <Text style={s.drawerValueText}>📦 Suggested Opening Stock: {selectedRecDetail.suggestedStartQty} units</Text>
                        <Text style={s.drawerValueText}>⚠️ Stock Risk: {selectedRecDetail.stockRiskExplanation || 'Low shelf risk; long batch stability.'}</Text>
                      </View>

                      {/* Commercial Disclaimer Box */}
                      <View style={s.disclaimerBox}>
                        <Text style={s.disclaimerText}>
                          💡 Honest AI Disclaimer: Demand estimates and margin figures are derived from observed 30-day regional order signals. GlowVAI never describes recommendations as guaranteed sales or profit.
                        </Text>
                      </View>
                    </ScrollView>
                  </View>
                )}

              </View>

            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* Toast Banner */}
      {toastMessage && (
        <View style={s.toastBanner}>
          <Text style={s.toastText}>{toastMessage.text}</Text>
          {toastMessage.undoAction && (
            <TouchableOpacity onPress={toastMessage.undoAction} style={s.toastUndoBtn}>
              <Text style={s.toastUndoText}>Undo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Explanatory Modal */}
      <Modal
        visible={explanationModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExplanationModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>🧠 How AI Recommendations Work</Text>
                <Text style={s.modalSub}>Data sources and methodology behind demand suggestions</Text>
              </View>
              <TouchableOpacity onPress={() => setExplanationModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={s.howItWorksItem}>
                <Text style={s.howItWorksTitle}>1. Anonymized Hyper-Local Customer Searches</Text>
                <Text style={s.howItWorksBody}>
                  We analyze customer search terms within a 5km radius around Benz Circle, Vijayawada to identify active product demand that local dark stores currently lack.
                </Text>
              </View>

              <View style={s.howItWorksItem}>
                <Text style={s.howItWorksTitle}>2. Catalog Availability & Stock-Out Analysis</Text>
                <Text style={s.howItWorksBody}>
                  When customers search for a beauty SKU that is out of stock across neighboring fulfillment hubs, our model flags it as a high-conversion catalog gap.
                </Text>
              </View>

              <View style={s.howItWorksItem}>
                <Text style={s.howItWorksTitle}>3. Margin Benchmarks & Wholesale Availability</Text>
                <Text style={s.howItWorksBody}>
                  We cross-reference brand MRPs with standard 12% GlowVAI fulfillment fees to surface SKUs yielding healthy 20%-28% net merchant payouts.
                </Text>
              </View>

              <View style={s.howItWorksNote}>
                <Text style={s.howItWorksNoteText}>
                  🛡️ Data Integrity Guarantee: Customer data remains 100% privacy-safe. Recommendations are non-binding operational suggestions.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={s.understandBtn}
              onPress={() => setExplanationModalOpen(false)}
            >
              <Text style={s.understandBtnText}>Understood</Text>
            </TouchableOpacity>
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
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Navigation Rail */
  navRail: {
    width: 240,
    backgroundColor: '#0F172A',
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

  /* Main Console Area */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
    gap: Spacing.xs,
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  aiBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#4F46E5',
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  freshnessText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* System Simulation Card */
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
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  simChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  simChipTextActive: {
    color: '#4F46E5',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  staleBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staleBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  limitedDataBanner: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
  },
  limitedDataText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  bannerLink: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  /* Main Scroll Content */
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

  /* Explanation Card */
  explanationCard: {
    backgroundColor: '#EEF2FF', // Violet-indigo tint
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  explanationSparkle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  explanationTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#3730A3',
  },
  howItWorksLinkBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  howItWorksLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#4F46E5',
  },

  reasonsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  reasonItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  reasonIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    marginBottom: 4,
  },
  reasonTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#3730A3',
    marginBottom: 2,
  },
  reasonSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  /* Filter Bar Card */
  filterBarCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterScroll: {
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Split Layout */
  splitLayoutRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },

  /* Recommendations List */
  recommendationsList: {
    gap: Spacing.md,
  },
  recommendationCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  recommendationCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  thumbBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  brandLabelText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  categoryTagText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  productTitleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confidenceTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  confidenceTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#4F46E5',
  },

  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  metricBox: {
    flex: 1,
    gap: 2,
  },
  metricBoxLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  metricBoxValueText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricBoxMarginText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  reasonsListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceSummaryBox: {
    flex: 1,
  },
  mrpText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  payoutText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 1,
  },

  actionBtnGroup: {
    alignItems: 'flex-end',
  },
  addActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  dismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  dismissBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: Colors.primary, // Royal Blue
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadii.pill,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  addedContainerRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  addedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  addedBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  setStockBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  setStockBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  undoAddBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  undoAddBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },

  existingUpdateBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  existingUpdateBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  unavailableBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  unavailableBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },

  /* AI Insight Drawer */
  previewDrawer: {
    width: 320,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  drawerTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  drawerSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerCloseText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  drawerSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  drawerValueText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  disclaimerBox: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
  },
  disclaimerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 15,
  },

  /* Empty State */
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resetFilterBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Toast Banner */
  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  toastUndoBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    marginLeft: Spacing.md,
  },
  toastUndoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textMuted,
  },

  howItWorksItem: {
    marginBottom: Spacing.md,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  howItWorksBody: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  howItWorksNote: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    marginTop: Spacing.xs,
  },
  howItWorksNoteText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 16,
  },
  understandBtn: {
    marginTop: Spacing.lg,
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  understandBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
});

export default withComingSoon(RecommendedSkusScreen, 'Recommended products');
