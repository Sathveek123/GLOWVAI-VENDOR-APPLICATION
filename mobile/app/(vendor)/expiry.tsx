/**
 * SCREEN 16: Expiry & Batch Lot Tracker (FEFO Operations)
 * Desktop 1440x1024 High-Density FEFO Retail Compliance Workstation
 * File: mobile/app/(vendor)/expiry.tsx
 */
import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
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
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

export interface BatchItem {
  batchId: string;
  productId: string;
  productName: string;
  brand: string;
  lotCode: string;
  shelf: string;
  mfgDate: string;
  expiryDate: string;
  daysToExpiry: number;
  qtyReceived: number;
  qtyRemaining: number;
  receivedDate: string;
  supplier?: string;
  status: 'Critical' | 'Near expiry' | 'Good' | 'Cleared';
  discountApplied?: number;
  movedToPriority?: boolean;
}

const INITIAL_BATCHES: BatchItem[] = [
  {
    batchId: 'BAT-101',
    productId: 'P-101',
    productName: 'Minimalist 10% Niacinamide Serum 30ml',
    brand: 'Minimalist',
    lotCode: 'LOT-MIN-991',
    shelf: 'Shelf A-01-05',
    mfgDate: '2024-11-01',
    expiryDate: '2026-10-25',
    daysToExpiry: 17,
    qtyReceived: 30,
    qtyRemaining: 8,
    receivedDate: '15 Nov 2024',
    supplier: 'Minimalist Direct India',
    status: 'Critical',
  },
  {
    batchId: 'BAT-102',
    productId: 'P-102',
    productName: 'Cetaphil Gentle Skin Cleanser 125ml',
    brand: 'Cetaphil',
    lotCode: 'LOT-CET-442',
    shelf: 'Shelf A-01-08',
    mfgDate: '2025-01-10',
    expiryDate: '2026-11-10',
    daysToExpiry: 33,
    qtyReceived: 25,
    qtyRemaining: 4,
    receivedDate: '20 Jan 2025',
    supplier: 'Galderma India Logistics',
    status: 'Near expiry',
  },
  {
    batchId: 'BAT-103',
    productId: 'P-103',
    productName: 'Maybelline Fit Me Foundation (120 Ivory)',
    brand: 'Maybelline',
    lotCode: 'LOT-MAY-881',
    shelf: 'Shelf B-02-01',
    mfgDate: '2024-08-15',
    expiryDate: '2026-10-15',
    daysToExpiry: 7,
    qtyReceived: 20,
    qtyRemaining: 6,
    receivedDate: '01 Sep 2024',
    supplier: 'L’Oréal India Distribution',
    status: 'Critical',
  },
  {
    batchId: 'BAT-104',
    productId: 'P-104',
    productName: 'Dot & Key Watermelon Sunscreen SPF 50',
    brand: 'Dot & Key',
    lotCode: 'LOT-DOT-303',
    shelf: 'Shelf A-03-02',
    mfgDate: '2025-03-01',
    expiryDate: '2027-03-01',
    daysToExpiry: 509,
    qtyReceived: 40,
    qtyRemaining: 28,
    receivedDate: '10 Mar 2025',
    supplier: 'Dot & Key Central Depot',
    status: 'Good',
  },
  {
    batchId: 'BAT-105',
    productId: 'P-105',
    productName: 'L’Oréal Hyaluronic Shampoo 250ml',
    brand: 'L’Oréal Paris',
    lotCode: 'LOT-LOR-119',
    shelf: 'Shelf C-01-04',
    mfgDate: '2024-12-01',
    expiryDate: '2026-11-30',
    daysToExpiry: 53,
    qtyReceived: 15,
    qtyRemaining: 3,
    receivedDate: '18 Dec 2024',
    supplier: 'L’Oréal South Regional Hub',
    status: 'Near expiry',
  },
  {
    batchId: 'BAT-106',
    productId: 'P-106',
    productName: 'Plum BodyLovin’ Vanilla EDP 50ml',
    brand: 'Plum',
    lotCode: 'LOT-PLU-772',
    shelf: 'Shelf D-01-02',
    mfgDate: '2024-05-10',
    expiryDate: '2026-09-30',
    daysToExpiry: 0,
    qtyReceived: 10,
    qtyRemaining: 0,
    receivedDate: '01 Jun 2024',
    supplier: 'Pureplay Skin Sciences',
    status: 'Cleared',
  },
];

function ExpiryTrackerScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [batches, setBatches] = useState<BatchItem[]>(INITIAL_BATCHES);
  const [selectedTab, setSelectedTab] = useState<'action' | 'all' | 'cleared'>('action');
  const [metricFilter, setMetricFilter] = useState<'all' | 'critical' | 'near' | 'good' | 'cleared'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; undoAction?: () => void } | null>(null);

  // Selected Batch Detail Drawer
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<BatchItem | null>(null);

  // Register New Batch Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [newLotCode, setNewLotCode] = useState('');
  const [newProductName, setNewProductName] = useState('Minimalist 10% Niacinamide Serum 30ml');
  const [newBrand, setNewBrand] = useState('Minimalist');
  const [newMfgDate, setNewMfgDate] = useState('2025-01-01');
  const [newExpDate, setNewExpDate] = useState('2026-12-31');
  const [newQtyReceived, setNewQtyReceived] = useState('24');
  const [newQtyRemaining, setNewQtyRemaining] = useState('24');
  const [newShelf, setNewShelf] = useState('Shelf A-01-05');
  const [newSupplier, setNewSupplier] = useState('Minimalist Direct India');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Edge Simulation States
  const [isOffline, setIsOffline] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Expiry & Batch Lot Tracker | GlowVAI Vendor';
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Counts
  const criticalCount = useMemo(() => batches.filter(b => b.status === 'Critical').length, [batches]);
  const nearExpiryCount = useMemo(() => batches.filter(b => b.status === 'Near expiry').length, [batches]);
  const healthyCount = useMemo(() => batches.filter(b => b.status === 'Good').length, [batches]);
  const clearedCount = useMemo(() => batches.filter(b => b.status === 'Cleared').length, [batches]);
  const attentionCount = criticalCount + nearExpiryCount;

  // FEFO Filter & Sort Rules (Earliest Expiry First)
  const filteredBatches = useMemo(() => {
    return batches
      .filter(b => {
        const query = search.trim().toLowerCase();
        const matchSearch =
          query === '' ||
          b.productName.toLowerCase().includes(query) ||
          b.lotCode.toLowerCase().includes(query) ||
          b.brand.toLowerCase().includes(query) ||
          b.shelf.toLowerCase().includes(query);

        let matchMetric = true;
        if (metricFilter === 'critical') matchMetric = b.status === 'Critical';
        if (metricFilter === 'near') matchMetric = b.status === 'Near expiry';
        if (metricFilter === 'good') matchMetric = b.status === 'Good';
        if (metricFilter === 'cleared') matchMetric = b.status === 'Cleared';

        let matchTab = true;
        if (selectedTab === 'action') matchTab = b.status === 'Critical' || b.status === 'Near expiry';
        if (selectedTab === 'cleared') matchTab = b.status === 'Cleared';

        return matchSearch && matchMetric && matchTab;
      })
      .sort((a, b) => {
        // FEFO rule: Sort by earliest expiry date
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  }, [batches, search, metricFilter, selectedTab]);

  // Actions
  const handleApplyDiscount = (batchId: string) => {
    if (permissionDenied) {
      setToastMessage({ text: '🔒 Permission Denied: Store Admin authorization required for discount.' });
      return;
    }

    setBatches(prev =>
      prev.map(b => (b.batchId === batchId ? { ...b, discountApplied: 25 } : b))
    );

    const item = batches.find(b => b.batchId === batchId);
    setToastMessage({
      text: `✓ Applied 25% FEFO clearance discount to ${item?.lotCode}`,
      undoAction: () => {
        setBatches(prev => prev.map(b => (b.batchId === batchId ? { ...b, discountApplied: undefined } : b)));
      },
    });
  };

  const handleMoveToPriority = (batchId: string) => {
    setBatches(prev =>
      prev.map(b => (b.batchId === batchId ? { ...b, movedToPriority: true } : b))
    );
    const item = batches.find(b => b.batchId === batchId);
    setToastMessage({
      text: `📍 Moved ${item?.lotCode} to Priority Front Picking Shelf`,
    });
  };

  const handleMarkCleared = (batchId: string) => {
    if (permissionDenied) {
      setToastMessage({ text: '🔒 Permission Denied: Store Admin authorization required.' });
      return;
    }

    const previousBatch = batches.find(b => b.batchId === batchId);
    setBatches(prev =>
      prev.map(b => (b.batchId === batchId ? { ...b, status: 'Cleared' as const, qtyRemaining: 0 } : b))
    );

    setToastMessage({
      text: `✓ Lot ${previousBatch?.lotCode} marked cleared from active inventory`,
      undoAction: () => {
        if (previousBatch) {
          setBatches(prev => prev.map(b => (b.batchId === batchId ? previousBatch : b)));
        }
      },
    });
  };

  // Form Validation
  const validateBatchForm = () => {
    const errors: { [key: string]: string } = {};

    if (!newLotCode.trim()) {
      errors.newLotCode = 'Lot code is required.';
    } else if (batches.some(b => b.lotCode.toUpperCase() === newLotCode.trim().toUpperCase())) {
      errors.newLotCode = 'Duplicate lot code detected.';
    }

    const mfgTime = new Date(newMfgDate).getTime();
    const expTime = new Date(newExpDate).getTime();
    const nowTime = Date.now();

    if (isNaN(expTime)) {
      errors.newExpDate = 'Enter a valid expiry date (YYYY-MM-DD).';
    } else if (expTime <= nowTime) {
      errors.newExpDate = 'Expiry date cannot be in the past (expired on entry).';
    }

    if (isNaN(mfgTime)) {
      errors.newMfgDate = 'Enter a valid manufacturing date.';
    } else if (mfgTime >= expTime) {
      errors.newMfgDate = 'Mfg date must be BEFORE expiry date.';
    }

    const recQty = parseInt(newQtyReceived, 10);
    if (isNaN(recQty) || recQty <= 0) {
      errors.newQtyReceived = 'Received quantity must be > 0.';
    }

    const remQty = parseInt(newQtyRemaining, 10);
    if (isNaN(remQty) || remQty < 0 || remQty > recQty) {
      errors.newQtyRemaining = 'Remaining qty must be between 0 and received qty.';
    }

    if (!newShelf.trim()) {
      errors.newShelf = 'Shelf location bin is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterBatch = () => {
    if (!validateBatchForm()) return;

    setLoading(true);

    const expTime = new Date(newExpDate).getTime();
    const daysDiff = Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)));

    let status: BatchItem['status'] = 'Good';
    if (daysDiff <= 15) status = 'Critical';
    else if (daysDiff <= 45) status = 'Near expiry';

    const newBatch: BatchItem = {
      batchId: `BAT-${Date.now().toString().slice(-4)}`,
      productId: 'P-NEW',
      productName: newProductName,
      brand: newBrand,
      lotCode: newLotCode.toUpperCase().trim(),
      shelf: newShelf,
      mfgDate: newMfgDate,
      expiryDate: newExpDate,
      daysToExpiry: daysDiff,
      qtyReceived: parseInt(newQtyReceived, 10),
      qtyRemaining: parseInt(newQtyRemaining, 10),
      receivedDate: 'Today',
      supplier: newSupplier,
      status,
    };

    setTimeout(() => {
      setBatches([newBatch, ...batches]);
      setLoading(false);
      setModalOpen(false);
      setNewLotCode('');
      setFormErrors({});
      setToastMessage({ text: `✨ Registered new batch ${newBatch.lotCode} under FEFO tracking` });
    }, 400);
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

          {/* Top Breadcrumb & Header Bar */}
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
                  <Text style={s.breadcrumbCurrent}>Expiry & batches</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Expiry & Batch Lot Tracker</Text>
                  <View style={s.fefoPill}>
                    <Text style={s.fefoPillText}>🟢 Live Sync • FEFO Active</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <TouchableOpacity
                style={s.addBatchHeaderBtn}
                onPress={() => setModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={s.addBatchHeaderBtnText}>+ Register New Batch</Text>
              </TouchableOpacity>

              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* System Edge Simulation Strip */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST BATCH TRACKER EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, isOffline && s.simChipActive]}
                onPress={() => setIsOffline(!isOffline)}
              >
                <Text style={[s.simChipText, isOffline && s.simChipTextActive]}>{isOffline ? 'Go Online' : 'Simulate Offline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, permissionDenied && s.simChipActive]}
                onPress={() => setPermissionDenied(!permissionDenied)}
              >
                <Text style={[s.simChipText, permissionDenied && s.simChipTextActive]}>Permission Denied</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, syncFailed && s.simChipActive]}
                onPress={() => {
                  setSyncFailed(!syncFailed);
                  if (!syncFailed) setToastMessage({ text: '❌ FEFO Sync Failed: Server connection retry queued.' });
                }}
              >
                <Text style={[s.simChipText, syncFailed && s.simChipTextActive]}>Sync Failure</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Banners */}
          {isOffline && (
            <View style={s.systemBannerOffline}>
              <Text style={s.systemBannerText}>📶 Offline Mode — Local FEFO Queue Active</Text>
            </View>
          )}

          {/* Calm High-Priority Attention Banner */}
          {attentionCount > 0 && (
            <View style={s.attentionBanner}>
              <View style={s.attentionIconBox}>
                <Text style={s.attentionIconText}>⏳</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.attentionBannerTitle}>
                  {attentionCount} {attentionCount === 1 ? 'batch needs' : 'batches need'} attention within 45 days
                </Text>
                <Text style={s.attentionBannerSub}>
                  Apply FEFO clearance discounts or stage items to priority picking shelves to prevent loss.
                </Text>
              </View>

              <TouchableOpacity
                style={s.reviewStockBtn}
                onPress={() => setSelectedTab('action')}
                activeOpacity={0.8}
              >
                <Text style={s.reviewStockBtnText}>Review Expiring Stock →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {/* ── CLICKABLE METRICS STRIP (4 Cards) ────────────────────────── */}
              <View style={s.metricsStripRow}>
                <TouchableOpacity
                  style={[s.metricCard, metricFilter === 'critical' && s.metricCardActive, { borderColor: Colors.danger }]}
                  onPress={() => setMetricFilter('critical')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.metricCountText, { color: Colors.danger }]}>{criticalCount}</Text>
                  <Text style={s.metricLabelText}>Critical (&lt;15 days)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.metricCard, metricFilter === 'near' && s.metricCardActive, { borderColor: Colors.warning }]}
                  onPress={() => setMetricFilter('near')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.metricCountText, { color: Colors.warning }]}>{nearExpiryCount}</Text>
                  <Text style={s.metricLabelText}>Near Expiry (&lt;45 days)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.metricCard, metricFilter === 'good' && s.metricCardActive, { borderColor: Colors.success }]}
                  onPress={() => setMetricFilter('good')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.metricCountText, { color: Colors.success }]}>{healthyCount}</Text>
                  <Text style={s.metricLabelText}>Good / Healthy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.metricCard, metricFilter === 'cleared' && s.metricCardActive]}
                  onPress={() => setMetricFilter('cleared')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.metricCountText, { color: Colors.textMuted }]}>{clearedCount}</Text>
                  <Text style={s.metricLabelText}>Cleared Lots</Text>
                </TouchableOpacity>
              </View>

              {/* ── SEARCH & TABS TOOLBAR BAR ─────────────────────────────────── */}
              <View style={s.toolbarCard}>
                <View style={s.searchInputWrap}>
                  <Ionicons name="search-outline" size={18} color="#475569" style={s.searchIcon} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search product name, lot code, or shelf location bin…"
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

                <View style={s.tabsHeaderRow}>
                  <View style={s.tabsSegmentRow}>
                    <TouchableOpacity
                      style={[s.tabPill, selectedTab === 'action' && s.tabPillActive]}
                      onPress={() => setSelectedTab('action')}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.tabPillText, selectedTab === 'action' && s.tabPillTextActive]}>
                        Needs Action ({attentionCount})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.tabPill, selectedTab === 'all' && s.tabPillActive]}
                      onPress={() => setSelectedTab('all')}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.tabPillText, selectedTab === 'all' && s.tabPillTextActive]}>
                        All Batches ({batches.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.tabPill, selectedTab === 'cleared' && s.tabPillActive]}
                      onPress={() => setSelectedTab('cleared')}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.tabPillText, selectedTab === 'cleared' && s.tabPillTextActive]}>
                        Cleared ({clearedCount})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={s.fefoSortHelperText}>
                    ⬇️ Sorted by earliest expiry (FEFO Rule)
                  </Text>
                </View>
              </View>

              {/* Main Split Layout: Table Matrix on Left + Inspection Drawer on Right */}
              <View style={s.splitLayoutRow}>
                
                {/* ── DENSE DESKTOP BATCH TABLE ───────────────────────────────── */}
                <View style={{ flex: 1 }}>
                  {filteredBatches.length === 0 ? (
                    <View style={s.emptyStateBox}>
                      <Ionicons name="shield-checkmark-outline" size={18} style={{ color: '#475569' }} />
                      <Text style={s.emptyTitle}>
                        {search.length > 0 ? 'No matching lot codes found' : 'All batches are healthy!'}
                      </Text>
                      <Text style={s.emptySub}>
                        {search.length > 0
                          ? `No batch matching "${search}". Try clearing search filter.`
                          : 'No items currently require FEFO clearance action.'}
                      </Text>

                      {search.length > 0 && (
                        <TouchableOpacity
                          style={s.clearSearchBtn}
                          onPress={() => {
                            setSearch('');
                            setMetricFilter('all');
                          }}
                        >
                          <Text style={s.clearSearchBtnText}>Reset All Filters</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={s.batchList}>
                      {filteredBatches.map(batch => {
                        const isCritical = batch.status === 'Critical';
                        const isNear = batch.status === 'Near expiry';
                        const isCleared = batch.status === 'Cleared';
                        const isSelected = selectedBatchDetail?.batchId === batch.batchId;

                        return (
                          <View
                            key={batch.batchId}
                            style={[
                              s.batchCard,
                              isCritical && s.batchCardCritical,
                              isNear && s.batchCardNear,
                              isCleared && s.batchCardCleared,
                              isSelected && s.batchCardSelected,
                            ]}
                          >
                            <TouchableOpacity
                              style={s.cardHeaderRow}
                              onPress={() => setSelectedBatchDetail(batch)}
                              activeOpacity={0.85}
                            >
                              <View style={s.thumbBox}>
                                <Ionicons name="cube-outline" size={18} color="#475569" style={s.thumbEmoji} />
                              </View>

                              <View style={{ flex: 1 }}>
                                <View style={s.badgeMetaRow}>
                                  <Text style={s.brandLabelText}>{batch.brand}</Text>
                                  <Text style={s.lotCodeText}>LOT: {batch.lotCode}</Text>
                                  <View style={s.shelfChip}>
                                    <Text style={s.shelfChipText}>📍 {batch.shelf}</Text>
                                  </View>
                                </View>
                                <Text style={s.productTitleText}>{batch.productName}</Text>
                              </View>

                              {/* Status Tag */}
                              <View style={[
                                s.statusTag,
                                isCritical && s.statusTagCritical,
                                isNear && s.statusTagNear,
                                batch.status === 'Good' && s.statusTagGood,
                                isCleared && s.statusTagCleared,
                              ]}>
                                <Text style={[
                                  s.statusTagText,
                                  isCritical && s.statusTagTextCritical,
                                  isNear && s.statusTagTextNear,
                                  batch.status === 'Good' && s.statusTagTextGood,
                                  isCleared && s.statusTagTextCleared,
                                ]}>
                                  {isCritical ? '🔴 Critical' : isNear ? '🟡 Near Expiry' : isCleared ? '✓ Cleared' : '🟢 Healthy'}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {/* Expiry Metrics Row */}
                            <View style={s.metricsRow}>
                              <View style={s.metricCol}>
                                <Text style={s.metricLabel}>EXPIRY DATE</Text>
                                <Text style={[
                                  s.metricValueText,
                                  isCritical && { color: Colors.danger },
                                  isNear && { color: Colors.warning },
                                ]}>
                                  {batch.expiryDate} ({batch.daysToExpiry} days left)
                                </Text>
                              </View>

                              <View style={s.metricCol}>
                                <Text style={s.metricLabel}>REMAINING STOCK</Text>
                                <Text style={s.metricValueText}>
                                  {batch.qtyRemaining} of {batch.qtyReceived} units
                                </Text>
                              </View>

                              <View style={s.metricCol}>
                                <Text style={s.metricLabel}>RECEIVED DATE</Text>
                                <Text style={s.metricValueText}>{batch.receivedDate}</Text>
                              </View>
                            </View>

                            {/* Active Applied Badges */}
                            {(batch.discountApplied || batch.movedToPriority) && (
                              <View style={s.appliedBadgesRow}>
                                {batch.discountApplied && (
                                  <View style={s.appliedDiscountBadge}>
                                    <Text style={s.appliedDiscountBadgeText}>🏷️ {batch.discountApplied}% FEFO Clearance Discount Applied</Text>
                                  </View>
                                )}
                                {batch.movedToPriority && (
                                  <View style={s.appliedPriorityBadge}>
                                    <Text style={s.appliedPriorityBadgeText}>📍 Staged on Front Priority Shelf</Text>
                                  </View>
                                )}
                              </View>
                            )}

                            {/* Contextual Actions Row */}
                            {!isCleared && (
                              <View style={s.cardActionsRow}>
                                <TouchableOpacity
                                  style={s.actionBtnSecondary}
                                  onPress={() => handleMoveToPriority(batch.batchId)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={s.actionBtnSecondaryText}>Move to Priority Shelf</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={s.actionBtnSecondary}
                                  onPress={() => handleMarkCleared(batch.batchId)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={s.actionBtnSecondaryText}>Mark Cleared</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={s.actionBtnPrimary}
                                  onPress={() => handleApplyDiscount(batch.batchId)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={s.actionBtnPrimaryText}>Apply 25% Discount</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* ── RIGHT SIDE LOT INSPECTION DRAWER ──────────────────────── */}
                {isExpanded && selectedBatchDetail && (
                  <View style={s.previewDrawer}>
                    <View style={s.drawerHeader}>
                      <View>
                        <Text style={s.drawerTitle}>Lot: {selectedBatchDetail.lotCode}</Text>
                        <Text style={s.drawerSub}>{selectedBatchDetail.productName}</Text>
                      </View>
                      <TouchableOpacity style={s.drawerCloseBtn} onPress={() => setSelectedBatchDetail(null)}>
                        <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                      <View style={s.drawerSectionCard}>
                        <Text style={s.drawerSectionLabel}>MANUFACTURING & EXPIRY DATES</Text>
                        <Text style={s.drawerValueText}>🏭 Mfg Date: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{selectedBatchDetail.mfgDate}</Text></Text>
                        <Text style={s.drawerValueText}>⏳ Expiry Date: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.danger }}>{selectedBatchDetail.expiryDate}</Text> ({selectedBatchDetail.daysToExpiry} days remaining)</Text>
                        <Text style={s.drawerValueText}>📍 Warehouse Bin: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{selectedBatchDetail.shelf}</Text></Text>
                      </View>

                      <View style={s.drawerSectionCard}>
                        <Text style={s.drawerSectionLabel}>SUPPLIER & RECEIVING AUDIT</Text>
                        <Text style={s.drawerValueText}>🚚 Supplier: {selectedBatchDetail.supplier || 'Direct Distributor'}</Text>
                        <Text style={s.drawerValueText}>📦 Initial Received: {selectedBatchDetail.qtyReceived} units</Text>
                        <Text style={s.drawerValueText}>📊 Current Stock: {selectedBatchDetail.qtyRemaining} units</Text>
                        <Text style={s.drawerValueText}>🗓️ Audit Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>

                      <TouchableOpacity
                        style={s.drawerClearBtn}
                        onPress={() => {
                          handleMarkCleared(selectedBatchDetail.batchId);
                          setSelectedBatchDetail(null);
                        }}
                      >
                        <Text style={s.drawerClearBtnText}>✓ Mark Lot Cleared from Inventory</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}

              </View>

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

      {/* "Register New Batch" Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Register New Batch Lot</Text>
                <Text style={s.modalSub}>FEFO automated expiry tracking for incoming stock arrival</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Product Name */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={s.fieldInput}
                  value={newProductName}
                  onChangeText={setNewProductName}
                />
              </View>

              {/* Lot Code */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Lot Number / Code *</Text>
                <TextInput
                  style={[s.fieldInput, formErrors.newLotCode ? s.fieldInputError : null]}
                  placeholder="e.g. LOT-CRV-991"
                  placeholderTextColor={Colors.textMuted}
                  value={newLotCode}
                  onChangeText={text => {
                    setNewLotCode(text);
                    if (formErrors.newLotCode) setFormErrors({ ...formErrors, newLotCode: '' });
                  }}
                />
                {formErrors.newLotCode ? <Text style={s.errorText}>{formErrors.newLotCode}</Text> : null}
              </View>

              {/* Mfg Date & Expiry Date Row */}
              <View style={s.fieldRow}>
                <View style={[s.fieldGroup, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Mfg Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={[s.fieldInput, formErrors.newMfgDate ? s.fieldInputError : null]}
                    placeholder="2025-01-01"
                    placeholderTextColor={Colors.textMuted}
                    value={newMfgDate}
                    onChangeText={setNewMfgDate}
                  />
                  {formErrors.newMfgDate ? <Text style={s.errorText}>{formErrors.newMfgDate}</Text> : null}
                </View>

                <View style={[s.fieldGroup, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Expiry Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={[s.fieldInput, formErrors.newExpDate ? s.fieldInputError : null]}
                    placeholder="2026-12-31"
                    placeholderTextColor={Colors.textMuted}
                    value={newExpDate}
                    onChangeText={setNewExpDate}
                  />
                  {formErrors.newExpDate ? <Text style={s.errorText}>{formErrors.newExpDate}</Text> : null}
                </View>
              </View>

              {/* Qty Received & Qty Remaining Row */}
              <View style={s.fieldRow}>
                <View style={[s.fieldGroup, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Received Qty *</Text>
                  <TextInput
                    style={[s.fieldInput, formErrors.newQtyReceived ? s.fieldInputError : null]}
                    keyboardType="numeric"
                    value={newQtyReceived}
                    onChangeText={setNewQtyReceived}
                  />
                  {formErrors.newQtyReceived ? <Text style={s.errorText}>{formErrors.newQtyReceived}</Text> : null}
                </View>

                <View style={[s.fieldGroup, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Current Stock Qty *</Text>
                  <TextInput
                    style={[s.fieldInput, formErrors.newQtyRemaining ? s.fieldInputError : null]}
                    keyboardType="numeric"
                    value={newQtyRemaining}
                    onChangeText={setNewQtyRemaining}
                  />
                  {formErrors.newQtyRemaining ? <Text style={s.errorText}>{formErrors.newQtyRemaining}</Text> : null}
                </View>
              </View>

              {/* Shelf Location */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Shelf Location Bin *</Text>
                <TextInput
                  style={[s.fieldInput, formErrors.newShelf ? s.fieldInputError : null]}
                  placeholder="e.g. Shelf A-01-05"
                  placeholderTextColor={Colors.textMuted}
                  value={newShelf}
                  onChangeText={setNewShelf}
                />
                {formErrors.newShelf && <Text style={s.errorText}>{formErrors.newShelf}</Text>}
              </View>

              {/* Supplier */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Supplier / Distributor Name</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="e.g. Minimalist Direct India"
                  placeholderTextColor={Colors.textMuted}
                  value={newSupplier}
                  onChangeText={setNewSupplier}
                />
              </View>
            </ScrollView>

            <View style={s.modalActionsRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={s.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.modalSubmitBtn}
                onPress={handleRegisterBatch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.modalSubmitBtnText}>Save Batch Lot →</Text>
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
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Desktop Navigation Rail ────────────────────────────────────────────────── */
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

  /* Header */
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
  fefoPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  fefoPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addBatchHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  addBatchHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
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

  systemBannerOffline: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
  },
  systemBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },

  /* Calm Attention Banner */
  attentionBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: BorderRadii.card,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  attentionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  attentionBannerTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B45309',
  },
  attentionBannerSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  reviewStockBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  reviewStockBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B45309',
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
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  metricCountText: {
    fontSize: 22,
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
    height: 42,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
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

  tabsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabsSegmentRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  fefoSortHelperText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },

  /* Split Layout */
  splitLayoutRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },

  /* Batch Cards */
  batchList: {
    gap: Spacing.md,
  },
  batchCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  batchCardCritical: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
  },
  batchCardNear: {
    borderColor: Colors.warningBorder,
    backgroundColor: Colors.warningLight,
  },
  batchCardCleared: {
    opacity: 0.65,
  },
  batchCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  thumbBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
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
  lotCodeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    
  },
  shelfChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shelfChipText: {
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

  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  statusTagCritical: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.dangerBorder,
  },
  statusTagNear: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
  },
  statusTagGood: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.successBorder,
  },
  statusTagCleared: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  statusTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusTagTextCritical: {
    color: Colors.danger,
  },
  statusTagTextNear: {
    color: Colors.warning,
  },
  statusTagTextGood: {
    color: Colors.success,
  },
  statusTagTextCleared: {
    color: Colors.textMuted,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  metricCol: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  metricValueText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  appliedBadgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  appliedDiscountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  appliedDiscountBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  appliedPriorityBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  appliedPriorityBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  cardActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Inspection Drawer */
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
  drawerClearBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerClearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
  },
  clearSearchBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  clearSearchBtnText: {
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
    maxWidth: 500,
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
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textMuted,
  },
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
    marginBottom: 4,
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
  fieldInputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
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
    height: 46,
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

export default withComingSoon(ExpiryTrackerScreen, 'Expiry & batches');
