/**
 * SCREEN 14: Catalog Matrix & Live Stock Steppers
 * Desktop 1440x1024 High-Density Beauty Inventory Workstation
 * File: mobile/app/(vendor)/catalog.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { inventoryApi } from '../../src/services/api';
import type { InventoryItem } from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import AppHeader from '../../src/components/AppHeader';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const CATEGORIES = [
  'All',
  'Skincare',
  'Makeup',
  'Hair care',
  'Fragrance',
  'Bath & Body',
  'Tools & Brushes',
];

const SORT_OPTIONS = [
  { key: 'stock_asc', label: 'Stock: Low to High' },
  { key: 'best_sellers', label: 'Best Sellers' },
  { key: 'recently_updated', label: 'Recently Updated' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'expiry_risk', label: 'Expiry Risk' },
];

const INITIAL_CATALOG: InventoryItem[] = [
  {
    productId: 'P-101',
    name: 'Minimalist 10% Niacinamide Face Serum 30ml',
    category: 'Skincare',
    sku: 'SKU-MIN-101',
    mrp: 599,
    sellingPrice: 549,
    stock: 24,
    bin: 'Shelf A-01-05',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Minimalist',
    description: 'Niacinamide 10% + Zinc 1% for blemish treatment',
    expiryDate: '2027-04-30',
    updatedAt: Date.now() - 3600000,
  },
  {
    productId: 'P-102',
    name: 'Cetaphil Gentle Skin Cleanser 125ml',
    category: 'Skincare',
    sku: 'SKU-CET-102',
    mrp: 399,
    sellingPrice: 369,
    stock: 4,
    bin: 'Shelf A-01-08',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Cetaphil',
    description: 'Hydrating cleanser for sensitive skin',
    expiryDate: '2026-11-15',
    updatedAt: Date.now() - 7200000,
  },
  {
    productId: 'P-103',
    name: 'Maybelline Fit Me Matte Foundation (128 Warm Nude)',
    category: 'Makeup',
    sku: 'SKU-MAY-103',
    mrp: 549,
    sellingPrice: 499,
    stock: 0,
    bin: 'Shelf B-02-01',
    gstPercent: 18,
    images: [],
    active: false,
    brand: 'Maybelline',
    description: 'Matte + Poreless liquid foundation 30ml',
    expiryDate: '2026-09-01',
    updatedAt: Date.now() - 86400000,
  },
  {
    productId: 'P-104',
    name: 'Dot & Key Watermelon Sunscreen SPF 50 50g',
    category: 'Skincare',
    sku: 'SKU-DOT-104',
    mrp: 495,
    sellingPrice: 445,
    stock: 18,
    bin: 'Shelf A-03-02',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Dot & Key',
    description: 'Cooling hyaluronic acid water-light sunscreen 50g',
    expiryDate: '2027-02-28',
    updatedAt: Date.now() - 1800000,
  },
  {
    productId: 'P-105',
    name: 'L’Oréal Paris Hyaluronic Moisture Shampoo 250ml',
    category: 'Hair care',
    sku: 'SKU-LOR-105',
    mrp: 349,
    sellingPrice: 315,
    stock: 3,
    bin: 'Shelf C-01-04',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'L’Oréal Paris',
    description: '72hr moisture fill shampoo for dry hair',
    expiryDate: '2026-12-10',
    updatedAt: Date.now() - 5000000,
  },
  {
    productId: 'P-106',
    name: 'Plum BodyLovin’ Vanilla Vibes Eau De Parfum 50ml',
    category: 'Fragrance',
    sku: 'SKU-PLU-106',
    mrp: 899,
    sellingPrice: 799,
    stock: 12,
    bin: 'Shelf D-01-02',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Plum',
    description: 'Warm & sweet vanilla long-lasting fragrance',
    expiryDate: '2028-01-01',
    updatedAt: Date.now() - 1200000,
  },
  {
    productId: 'P-107',
    name: 'Real Techniques Everyday Essentials Brush Set',
    category: 'Tools & Brushes',
    sku: 'SKU-RT-107',
    mrp: 1499,
    sellingPrice: 1299,
    stock: 2,
    bin: 'Shelf E-03-01',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Real Techniques',
    description: '4 synthetic makeup brushes + miracle complexion sponge',
    expiryDate: '2029-06-30',
    updatedAt: Date.now() - 900000,
  },
  {
    productId: 'P-108',
    name: 'Nivea Soft Refreshing Moisturizing Cream 200ml',
    category: 'Bath & Body',
    sku: 'SKU-NIV-108',
    mrp: 325,
    sellingPrice: 295,
    stock: 30,
    bin: 'Shelf F-01-06',
    gstPercent: 18,
    images: [],
    active: true,
    brand: 'Nivea',
    description: 'Light moisturizer with Vitamin E & Jojoba Oil',
    expiryDate: '2027-08-15',
    updatedAt: Date.now() - 15000000,
  },
];

const SAMPLE_CSV = `SKU,Product Name,Category,MRP,SellingPrice,Stock,Bin
SKU-GLOW-201,Minimalist 2% Salicylic Acid Face Wash 100ml,Skincare,299,269,40,Shelf A-01-09
SKU-GLOW-202,Nykaa Matte to Last Liquid Lipstick (Chai),Makeup,675,599,15,Shelf B-02-04
SKU-GLOW-203,Biotique Botanical Bio Kelp Protein Shampoo 340ml,Hair care,399,329,22,Shelf C-01-09
SKU-GLOW-204,Bella Vita Organic Luxury Woman Perfume Gift Set,Fragrance,599,499,8,Shelf D-01-08`;

export default function CatalogScreen() {
  const router = useRouter();
  const { inventory, setInventory, updateInventoryItem } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [metricFilter, setMetricFilter] = useState<'all' | 'low' | 'out' | 'inactive'>('all');
  const [selectedSort, setSelectedSort] = useState('stock_asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // System Edge States
  const [isOffline, setIsOffline] = useState(false);
  const [hasSyncConflict, setHasSyncConflict] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; undoAction?: () => void } | null>(null);

  // Bulk CSV Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  // Detail Drawer State
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryItem | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAll(STORE_ID);
      if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
        setInventory(res.items);
      } else if (inventory.length === 0) {
        setInventory(INITIAL_CATALOG);
      }
    } catch (_) {
      if (inventory.length === 0) {
        setInventory(INITIAL_CATALOG);
      }
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }, [inventory.length, setInventory]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Catalog Matrix & Live Stock | GlowVAI Vendor Console';
    }
    loadCatalog();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Metric Counts
  const totalCount = inventory.length;
  const lowStockCount = useMemo(() => inventory.filter(i => i.stock > 0 && i.stock < 5).length, [inventory]);
  const outOfStockCount = useMemo(() => inventory.filter(i => i.stock === 0).length, [inventory]);
  const inactiveCount = useMemo(() => inventory.filter(i => !i.active).length, [inventory]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return inventory
      .filter(item => {
        const query = search.trim().toLowerCase();
        const matchSearch =
          query === '' ||
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          (item.bin && item.bin.toLowerCase().includes(query));

        const matchCat = selectedCat === 'All' || item.category === selectedCat;

        let matchMetric = true;
        if (metricFilter === 'low') matchMetric = item.stock > 0 && item.stock < 5;
        if (metricFilter === 'out') matchMetric = item.stock === 0;
        if (metricFilter === 'inactive') matchMetric = !item.active;

        return matchSearch && matchCat && matchMetric;
      })
      .sort((a, b) => {
        if (selectedSort === 'stock_asc') return a.stock - b.stock;
        if (selectedSort === 'price_desc') return b.mrp - a.mrp;
        if (selectedSort === 'recently_updated') return b.updatedAt - a.updatedAt;
        if (selectedSort === 'expiry_risk') {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 9999999999999;
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 9999999999999;
          return dateA - dateB;
        }
        return b.stock - a.stock;
      });
  }, [inventory, search, selectedCat, metricFilter, selectedSort]);

  // Handle Quick Stock Adjust with Throttling, Optimistic Rollback & Undo
  const handleAdjustStock = async (productId: string, delta: number) => {
    if (updatingItems[productId]) return;

    const targetItem = inventory.find(i => i.productId === productId);
    if (!targetItem) return;

    const previousStock = targetItem.stock;
    const previousActive = targetItem.active;
    const newStock = Math.max(0, previousStock + delta);
    const newActive = newStock > 0 ? previousActive : false;

    setUpdatingItems(prev => ({ ...prev, [productId]: true }));
    updateInventoryItem(productId, { stock: newStock, active: newActive, updatedAt: Date.now() });

    try {
      if (isOffline) {
        setToastMessage({
          text: `📶 Offline Mode: Stock set to ${newStock} (Queued locally)`,
        });
      } else {
        await inventoryApi.adjustStock(productId, delta, 'Vendor manual adjustment');
        setToastMessage({
          text: `✓ Stock for "${targetItem.name.slice(0, 22)}…" set to ${newStock}`,
          undoAction: () => {
            updateInventoryItem(productId, { stock: previousStock, active: previousActive });
            setToastMessage({ text: `Reverted stock back to ${previousStock}` });
          },
        });
      }
    } catch (err: any) {
      updateInventoryItem(productId, { stock: previousStock, active: previousActive });
      setToastMessage({ text: `❌ Update failed: ${err.message || 'Server error'}. Stock reverted.` });
    } finally {
      setTimeout(() => {
        setUpdatingItems(prev => ({ ...prev, [productId]: false }));
      }, 300);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    const targetItem = inventory.find(i => i.productId === productId);
    if (!targetItem) return;

    const newActive = !currentActive;
    updateInventoryItem(productId, { active: newActive, updatedAt: Date.now() });

    try {
      await inventoryApi.update(productId, { active: newActive });
      setToastMessage({
        text: `SKU is now ${newActive ? 'LIVE on customer app' : 'HIDDEN from app'}`,
        undoAction: () => {
          updateInventoryItem(productId, { active: currentActive });
        },
      });
    } catch (err: any) {
      updateInventoryItem(productId, { active: currentActive });
      setToastMessage({ text: `Failed to toggle status: ${err.message}` });
    }
  };

  const handleProcessCsv = async () => {
    if (!csvText.trim()) {
      setToastMessage({ text: 'Please paste CSV lines to import' });
      return;
    }
    setImporting(true);
    try {
      const res = await inventoryApi.bulkUpload([], csvText, STORE_ID);
      setToastMessage({ text: `🚀 Synced ${res.count || 'all'} beauty SKUs into catalog` });
      setCsvModalOpen(false);
      setCsvText('');
      await loadCatalog();
    } catch (err: any) {
      setToastMessage({ text: `CSV Import Error: ${err.message || 'Invalid format'}` });
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Desktop Left Navigation Rail ───────────────────────────────────────── */}
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

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
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

              <TouchableOpacity style={s.railProfileCard} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <View style={s.railAvatar}>
                  <Text style={s.railAvatarText}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Store account</Text>
                  <Text style={s.railProfileRole}>Store Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Header */}
          <AppHeader
            title="Products"
            subtitle={`Live Sync • ${totalCount} SKUs • Store ID: ${STORE_ID}`}
            showBell={true}
            rightActions={
              <TouchableOpacity
                style={s.addSkuHeaderBtn}
                onPress={() => router.push('/(vendor)/add-sku')}
                activeOpacity={0.8}
              >
                <Text style={s.addSkuHeaderBtnText}>+ Add SKU</Text>
              </TouchableOpacity>
            }
          />

          {/* Console Scroll Body */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* System Banners */}
            {isOffline && (
              <View style={s.systemBannerOffline}>
                <Text style={s.systemBannerText}>📶 Offline Mode — Stock updates queued locally</Text>
                <TouchableOpacity onPress={() => setIsOffline(false)}>
                  <Text style={s.bannerDismiss}>Reconnect</Text>
                </TouchableOpacity>
              </View>
            )}

            {hasSyncConflict && (
              <View style={s.systemBannerConflict}>
                <Text style={s.systemBannerText}>⚠️ Sync Conflict — 2 SKUs updated in Central Admin</Text>
                <TouchableOpacity onPress={() => setHasSyncConflict(false)}>
                  <Text style={s.bannerDismiss}>Resolve Sync</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── CLICKABLE METRICS STRIP (5 Filter Cards) ───────────────────── */}
            <View style={s.metricsStripRow}>
              <TouchableOpacity
                style={[s.metricCard, metricFilter === 'all' && s.metricCardActive]}
                onPress={() => setMetricFilter('all')}
                activeOpacity={0.7}
              >
                <Text style={s.metricCountText}>{totalCount}</Text>
                <Text style={s.metricLabelText}>Total SKUs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.metricCard, metricFilter === 'low' && s.metricCardActive, { borderColor: Colors.warning }]}
                onPress={() => setMetricFilter('low')}
                activeOpacity={0.7}
              >
                <Text style={[s.metricCountText, { color: Colors.warning }]}>{lowStockCount}</Text>
                <Text style={s.metricLabelText}>Low Stock (&lt;5)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.metricCard, metricFilter === 'out' && s.metricCardActive, { borderColor: Colors.danger }]}
                onPress={() => setMetricFilter('out')}
                activeOpacity={0.7}
              >
                <Text style={[s.metricCountText, { color: Colors.danger }]}>{outOfStockCount}</Text>
                <Text style={s.metricLabelText}>Out of Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.metricCard, metricFilter === 'inactive' && s.metricCardActive]}
                onPress={() => setMetricFilter('inactive')}
                activeOpacity={0.7}
              >
                <Text style={[s.metricCountText, { color: Colors.textMuted }]}>{inactiveCount}</Text>
                <Text style={s.metricLabelText}>Inactive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.metricCard}
                onPress={() => router.push('/(vendor)/expiry')}
                activeOpacity={0.7}
              >
                <Text style={[s.metricCountText, { color: Colors.warning }]}>2</Text>
                <Text style={s.metricLabelText}>Expiring Soon</Text>
              </TouchableOpacity>
            </View>

            {/* ── SEARCH & CATEGORY FILTER BAR ──────────────────────────────── */}
            <View style={s.toolbarCard}>
              <View style={s.searchInputWrap}>
                <Ionicons name="search-outline" size={18} color="#475569" style={s.searchIcon} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search product name, brand, SKU, or shelf location…"
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Pills Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catPillScroll}>
                {CATEGORIES.map(cat => {
                  const active = selectedCat === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCat(cat)}
                      style={[s.catPill, active && s.catPillActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.catPillText, active && s.catPillTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Content Layout with Side Drawer when item clicked */}
            <View style={s.queueLayoutRow}>
              
              {/* Product Table List */}
              <View style={{ flex: 1 }}>
                {loading ? (
                  <View style={s.skeletonList}>
                    {[1, 2, 3].map(i => (
                      <View key={i} style={s.skeletonCard} />
                    ))}
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={s.emptyStateBox}>
                    <Ionicons name="cube-outline" size={18} color="#475569" style={s.emptyIcon} />
                    <Text style={s.emptyTitle}>No matching catalog products</Text>
                    <Text style={s.emptySub}>
                      {search.length > 0
                        ? `No products found matching "${search}". Try resetting search filter.`
                        : 'No items found under the selected category or filter.'}
                    </Text>
                    <TouchableOpacity
                      style={s.clearFiltersBtn}
                      onPress={() => {
                        setSearch('');
                        setSelectedCat('All');
                        setMetricFilter('all');
                      }}
                    >
                      <Text style={s.clearFiltersBtnText}>Reset All Filters</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.productList}>
                    {filteredProducts.map(item => {
                      const isLow = item.stock > 0 && item.stock < 5;
                      const isOut = item.stock === 0;
                      const isUpdating = !!updatingItems[item.productId];
                      const isSelected = selectedItemDetail?.productId === item.productId;

                      return (
                        <View
                          key={item.productId}
                          style={[
                            s.productCard,
                            isLow && s.productCardLow,
                            isOut && s.productCardOut,
                            !item.active && s.productCardInactive,
                            isSelected && s.productCardSelected,
                          ]}
                        >
                          <TouchableOpacity
                            style={s.cardHeaderRow}
                            onPress={() => setSelectedItemDetail(item)}
                            activeOpacity={0.85}
                          >
                            <View style={s.thumbBox}>
                              <Ionicons name="cube-outline" size={18} color="#475569" style={s.thumbEmoji} />
                            </View>

                            <View style={{ flex: 1 }}>
                              <View style={s.badgeMetaRow}>
                                <Text style={s.brandLabelText}>{item.brand || 'GlowVAI'}</Text>
                                <Text style={s.skuCodeText}>{item.sku}</Text>
                                <View style={s.binChip}>
                                  <Text style={s.binChipText}>📍 {item.bin || 'Shelf A-01'}</Text>
                                </View>
                              </View>

                              <Text style={s.productTitleText} numberOfLines={2}>{item.name}</Text>
                              {item.description && (
                                <Text style={s.productVariantText} numberOfLines={1}>{item.description}</Text>
                              )}
                            </View>

                            {/* Live Toggle Pill */}
                            <TouchableOpacity
                              style={[s.statusToggleBtn, item.active ? s.statusToggleBtnLive : s.statusToggleBtnOff]}
                              onPress={() => handleToggleActive(item.productId, item.active)}
                              activeOpacity={0.8}
                            >
                              <Text style={[s.statusToggleText, item.active ? s.statusToggleTextLive : s.statusToggleTextOff]}>
                                {item.active ? 'LIVE' : 'OFF'}
                              </Text>
                            </TouchableOpacity>
                          </TouchableOpacity>

                          {/* Zero Stock Explanation Banner */}
                          {isOut && (
                            <View style={s.outOfStockNotice}>
                              <Text style={s.outOfStockNoticeText}>
                                🚫 Out of Stock — Item automatically hidden from customer search & ordering.
                              </Text>
                            </View>
                          )}

                          {/* Card Footer: Pricing & Prominent Live Stepper */}
                          <View style={s.cardFooterRow}>
                            <View style={s.priceBlock}>
                              <Text style={s.mrpText}>MRP ₹{item.mrp}</Text>
                              <View style={s.payoutRow}>
                                <Text style={s.sellingPriceText}>₹{item.sellingPrice || item.mrp}</Text>
                                <View style={s.netPayoutBadge}>
                                  <Text style={s.netPayoutBadgeText}>Net Payout (88%): ₹{Math.round((item.sellingPrice || item.mrp) * 0.88)}</Text>
                                </View>
                              </View>
                            </View>

                            {/* Prominent Live Stock Stepper Control */}
                            <View style={s.stepperWrap}>
                              <TouchableOpacity
                                style={[s.stepTouchBtn, item.stock === 0 && s.stepTouchBtnDisabled]}
                                onPress={() => handleAdjustStock(item.productId, -1)}
                                disabled={item.stock === 0 || isUpdating}
                                activeOpacity={0.7}
                              >
                                <Text style={s.stepTouchText}>−</Text>
                              </TouchableOpacity>

                              <View style={s.stockDisplayBox}>
                                {isUpdating ? (
                                  <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                  <>
                                    <Text style={[
                                      s.stockNumberText,
                                      isLow && { color: Colors.warning },
                                      isOut && { color: Colors.danger },
                                    ]}>
                                      {item.stock}
                                    </Text>
                                    <Text style={s.stockUnitLabel}>in stock</Text>
                                  </>
                                )}
                              </View>

                              <TouchableOpacity
                                style={s.stepTouchBtn}
                                onPress={() => handleAdjustStock(item.productId, 1)}
                                disabled={isUpdating}
                                activeOpacity={0.7}
                              >
                                <Text style={s.stepTouchText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Right Side SKU Inspection Drawer */}
              {isExpanded && selectedItemDetail && (
                <View style={s.previewDrawer}>
                  <View style={s.drawerHeader}>
                    <View>
                      <Text style={s.drawerTitle}>{selectedItemDetail.name}</Text>
                      <Text style={s.drawerSub}>SKU: {selectedItemDetail.sku}</Text>
                    </View>
                    <TouchableOpacity style={s.drawerCloseBtn} onPress={() => setSelectedItemDetail(null)}>
                      <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={s.drawerSectionCard}>
                      <Text style={s.drawerSectionLabel}>LOCATION & BATCH DETAILS</Text>
                      <Text style={s.drawerValueText}>📍 Warehouse Bin: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{selectedItemDetail.bin || 'Shelf A-01-05'}</Text></Text>
                      <Text style={s.drawerValueText}>⏳ Batch Expiry Date: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{selectedItemDetail.expiryDate || '2027-04-30'}</Text></Text>
                      <Text style={s.drawerValueText}>🏷️ Brand: {selectedItemDetail.brand || 'Minimalist'}</Text>
                    </View>

                    <View style={s.drawerSectionCard}>
                      <Text style={s.drawerSectionLabel}>PRICING & REVENUE SPLIT</Text>
                      <View style={s.drawerFeeRow}>
                        <Text style={s.drawerFeeLabel}>MRP</Text>
                        <Text style={s.drawerFeeVal}>₹{selectedItemDetail.mrp}</Text>
                      </View>
                      <View style={s.drawerFeeRow}>
                        <Text style={s.drawerFeeLabel}>Selling Price</Text>
                        <Text style={s.drawerFeeVal}>₹{selectedItemDetail.sellingPrice || selectedItemDetail.mrp}</Text>
                      </View>
                      <View style={[s.drawerFeeRow, s.drawerPayoutRow]}>
                        <Text style={s.drawerPayoutLabel}>Vendor Net Payout (88%)</Text>
                        <Text style={s.drawerPayoutVal}>₹{Math.round((selectedItemDetail.sellingPrice || selectedItemDetail.mrp) * 0.88)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={s.drawerEditBtn}
                      onPress={() => router.push({ pathname: '/(vendor)/add-sku', params: { sku: selectedItemDetail.sku } })}
                    >
                      <Text style={s.drawerEditBtnText}>✏️ Edit SKU Specifications</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* Floating Action / Toast Banner */}
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

      {/* Bulk CSV Importer Modal */}
      <Modal
        visible={csvModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCsvModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>⚡ CSV Bulk Inventory Sync</Text>
                <Text style={s.modalSub}>Batch update SKUs, stock levels, and shelf locations</Text>
              </View>
              <TouchableOpacity onPress={() => setCsvModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.loadSampleBtn}
              onPress={() => setCsvText(SAMPLE_CSV)}
              activeOpacity={0.7}
            >
              <Text style={s.loadSampleText}>📋 Load Sample Beauty CSV Data</Text>
            </TouchableOpacity>

            <TextInput
              style={s.modalCsvInput}
              placeholder="SKU,Product Name,Category,MRP,SellingPrice,Stock,Bin..."
              placeholderTextColor={Colors.textMuted}
              value={csvText}
              onChangeText={setCsvText}
              multiline
              numberOfLines={6}
            />

            <View style={s.modalActionsRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setCsvModalOpen(false)}>
                <Text style={s.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalSubmitBtn} onPress={handleProcessCsv} disabled={importing}>
                {importing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.modalSubmitBtnText}>🚀 Sync Live Catalog</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab="catalog" />
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
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  railNavGroup: {
    gap: 6,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  railNavLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  railNavLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  railFooter: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: 8,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingVertical: 4,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  railProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 6,
  },
  railAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railProfileName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railProfileRole: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Main Console Area */
  mainConsole: {
    flex: 1,
  },
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  syncPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  syncPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  storeSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bulkCsvBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
  },
  bulkCsvBtnText: {
    color: '#C084FC',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  addSkuHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
  },
  addSkuHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Body Scroll Area */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  container1200: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },

  /* System Banners */
  systemBannerOffline: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemBannerConflict: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bannerDismiss: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Metrics Strip */
  metricsStripRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  metricCountText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metricLabelText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* Toolbar Card */
  toolbarCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    height: 40,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  clearSearchText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  catPillScroll: {
    gap: Spacing.xs,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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

  /* Queue Layout Row */
  queueLayoutRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  productList: {
    gap: Spacing.md,
  },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  productCardLow: {
    borderColor: Colors.warningBorder,
    backgroundColor: Colors.warningLight,
  },
  productCardOut: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
  },
  productCardInactive: {
    opacity: 0.75,
  },
  productCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardHeaderRow: {
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
    fontSize: 22,
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
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  skuCodeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    
  },
  binChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  binChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  productTitleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  productVariantText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  statusToggleBtnLive: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.successBorder,
  },
  statusToggleBtnOff: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  statusToggleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusToggleTextLive: {
    color: Colors.success,
  },
  statusToggleTextOff: {
    color: Colors.textMuted,
  },
  outOfStockNotice: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  outOfStockNoticeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    textAlign: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceBlock: {
    flex: 1,
  },
  mrpText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sellingPriceText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  netPayoutBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  netPayoutBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  /* Stepper */
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: 4,
  },
  stepTouchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTouchBtnDisabled: {
    opacity: 0.4,
  },
  stepTouchText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stockDisplayBox: {
    alignItems: 'center',
    minWidth: 48,
  },
  stockNumberText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stockUnitLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Right Side Preview Drawer */
  previewDrawer: {
    width: 360,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: Spacing.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
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
    color: Colors.textMuted,
  },
  drawerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  drawerSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  drawerValueText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  drawerFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  drawerFeeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  drawerFeeVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerPayoutRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  drawerPayoutLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  drawerPayoutVal: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  drawerEditBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  drawerEditBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Empty State & Skeletons */
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  clearFiltersBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  clearFiltersBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  skeletonList: {
    gap: Spacing.md,
  },
  skeletonCard: {
    height: 80,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Toast Banner */
  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  toastUndoBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
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
  modalBox: {
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
    marginBottom: Spacing.md,
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
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: Colors.textMuted,
  },
  loadSampleBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loadSampleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  modalCsvInput: {
    height: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
