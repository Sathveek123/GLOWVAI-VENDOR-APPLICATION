/**
 * SCREEN 18: Customer Returns & Inspection
 * Desktop 1440x1024 Split-Layout Inspection Workstation; single column on phone
 * No returns API exists yet, so production starts with an honest empty state.
 * Sample claims and edge-state toggles are developer-only (__DEV__).
 * File: mobile/app/(vendor)/returns.tsx
 */
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
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

export interface CustomerReturnRequest {
  returnId: string;
  orderId: string;
  customerName: string; // Privacy safe: first name and initial only
  customerArea: string;
  productName: string;
  brand: string;
  itemPrice: number;
  refundRequestedAmount: number;
  reason: 'Damaged' | 'Incorrect Item' | 'Leaking Seal' | 'Expired Item' | 'Customer Changed Mind';
  customerNote: string;
  purchaseDate: string;
  requestAge: string;
  slaHoursRemaining?: number; // Only set when a policy response timer applies
  status: 'Awaiting Review' | 'Escalated' | 'Resolved' | 'Refund Pending';
  photos: string[];
  evidenceChecklist: {
    sealCondition: 'Broken' | 'Intact' | 'Unsure';
    authenticity: 'Verified SKU' | 'Unknown';
    expiryStatus: 'Valid Expiry' | 'Expired';
    damageType: 'Leaking Packaging' | 'Transit Damage' | 'None';
    packagingIncluded: boolean;
  };
  hasUnreadablePhoto?: boolean;
  isDuplicateClaim?: boolean;
}

type TabFilter = 'all' | 'action' | 'escalated' | 'resolved';

// Sample claims for developer builds only. Never shown in production.
const SAMPLE_RETURNS: CustomerReturnRequest[] = [
  {
    returnId: 'RET-9908-1',
    orderId: 'GV-9908',
    customerName: 'Priya S.',
    customerArea: 'Benz Circle',
    productName: 'Minimalist 10% Niacinamide Serum 30ml',
    brand: 'Minimalist',
    itemPrice: 549,
    refundRequestedAmount: 549,
    reason: 'Leaking Seal',
    customerNote: 'Bottle cap was loose upon delivery and liquid leaked inside outer packaging pouch.',
    purchaseDate: '05 Oct 2026',
    requestAge: '2h ago',
    slaHoursRemaining: 4,
    status: 'Awaiting Review',
    photos: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    ],
    evidenceChecklist: {
      sealCondition: 'Broken',
      authenticity: 'Verified SKU',
      expiryStatus: 'Valid Expiry',
      damageType: 'Leaking Packaging',
      packagingIncluded: true,
    },
  },
  {
    returnId: 'RET-9912-2',
    orderId: 'GV-9912',
    customerName: 'Kavitha M.',
    customerArea: 'Moghalrajpuram',
    productName: 'Maybelline Fit Me Foundation (120 Ivory)',
    brand: 'Maybelline',
    itemPrice: 675,
    refundRequestedAmount: 675,
    reason: 'Damaged',
    customerNote: 'Outer glass bottle cracked during express bike dispatch.',
    purchaseDate: '06 Oct 2026',
    requestAge: '5h ago',
    slaHoursRemaining: 1,
    status: 'Awaiting Review',
    photos: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    ],
    evidenceChecklist: {
      sealCondition: 'Broken',
      authenticity: 'Verified SKU',
      expiryStatus: 'Valid Expiry',
      damageType: 'Transit Damage',
      packagingIncluded: true,
    },
  },
  {
    returnId: 'RET-9901-3',
    orderId: 'GV-9901',
    customerName: 'Ananya R.',
    customerArea: 'Governorpet',
    productName: 'Plum BodyLovin’ Vanilla EDP 50ml',
    brand: 'Plum',
    itemPrice: 899,
    refundRequestedAmount: 899,
    reason: 'Incorrect Item',
    customerNote: 'Received Vanilla Vibes Body Mist instead of Eau De Parfum bottle.',
    purchaseDate: '04 Oct 2026',
    requestAge: '1d ago',
    slaHoursRemaining: 0,
    status: 'Escalated',
    photos: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
    ],
    evidenceChecklist: {
      sealCondition: 'Intact',
      authenticity: 'Unknown',
      expiryStatus: 'Valid Expiry',
      damageType: 'None',
      packagingIncluded: true,
    },
  },
  {
    returnId: 'RET-9884-4',
    orderId: 'GV-9884',
    customerName: 'Sujatha K.',
    customerArea: 'Labbipet',
    productName: 'Cetaphil Gentle Skin Cleanser 125ml',
    brand: 'Cetaphil',
    itemPrice: 359,
    refundRequestedAmount: 359,
    reason: 'Expired Item',
    customerNote: 'Expiry date printed on base shows 09/2026.',
    purchaseDate: '02 Oct 2026',
    requestAge: '2d ago',
    slaHoursRemaining: 0,
    status: 'Resolved',
    photos: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    ],
    evidenceChecklist: {
      sealCondition: 'Intact',
      authenticity: 'Verified SKU',
      expiryStatus: 'Expired',
      damageType: 'None',
      packagingIncluded: true,
    },
  },
];

// Production starts empty until a returns API exists.
const INITIAL_RETURNS: CustomerReturnRequest[] = __DEV__ ? SAMPLE_RETURNS : [];

const REASON_FILTERS = ['All', 'Damaged', 'Incorrect Item', 'Leaking Seal', 'Expired Item', 'Customer Changed Mind'];

const RAIL_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; route: Href }[] = [
  { label: 'Home', icon: 'home-outline', route: '/(vendor)/home' },
  { label: 'Orders', icon: 'clipboard-outline', route: '/(vendor)/orders' },
  { label: 'Catalog', icon: 'cube-outline', route: '/(vendor)/catalog' },
  { label: 'Returns', icon: 'return-up-back-outline', route: '/(vendor)/returns' },
  { label: 'Reviews', icon: 'star-outline', route: '/(vendor)/reviews' },
  { label: 'Messages', icon: 'chatbubble-outline', route: '/(vendor)/messages' },
  { label: 'Earnings', icon: 'wallet-outline', route: '/(vendor)/earnings' },
  { label: 'Settings', icon: 'settings-outline', route: '/(vendor)/profile' },
];

const STATUS_STYLE: Record<CustomerReturnRequest['status'], { bg: string; border: string; text: string }> = {
  'Awaiting Review': { bg: Colors.warningLight, border: Colors.warningBorder, text: Colors.warning },
  Escalated: { bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
  Resolved: { bg: Colors.successLight, border: Colors.successBorder, text: Colors.success },
  'Refund Pending': { bg: Colors.primaryLight, border: Colors.primaryBorder, text: Colors.primary },
};

function ReturnsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const gutter = isExpanded ? Spacing.xl : Spacing.lg;

  // No live returns fetch exists yet. Wire loading and error here when the API lands.
  const [isLoading] = useState(false);

  const [returnRequests, setReturnRequests] = useState<CustomerReturnRequest[]>(INITIAL_RETURNS);
  const [search, setSearch] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('All');
  const [selectedTabFilter, setSelectedTabFilter] = useState<TabFilter>('all');

  // Inspection Modal / Split Workspace State
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturnRequest | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [internalNote, setInternalNote] = useState('');

  // Decision Confirmation State (developer preview only, local state)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingDecisionType, setPendingDecisionType] = useState<'refund' | 'reject'>('refund');
  const [rejectionReason, setRejectionReason] = useState('Evidence insufficient or seal intact');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Developer edge-state toggles (set only from the __DEV__ strip)
  const [isOffline, setIsOffline] = useState(false);
  const [missingPhotosDemo, setMissingPhotosDemo] = useState(false);
  const [unreadablePhotoDemo, setUnreadablePhotoDemo] = useState(false);
  const [duplicateClaimDemo, setDuplicateClaimDemo] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Customer Returns & Inspection | GlowVAI Vendor Console';
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Counts (derived from the data actually shown)
  const totalCount = returnRequests.length;
  const awaitingCount = useMemo(() => returnRequests.filter(r => r.status === 'Awaiting Review').length, [returnRequests]);
  const escalatedCount = useMemo(() => returnRequests.filter(r => r.status === 'Escalated').length, [returnRequests]);
  const resolvedCount = useMemo(
    () => returnRequests.filter(r => r.status === 'Resolved' || r.status === 'Refund Pending').length,
    [returnRequests]
  );

  // Filtered List
  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return returnRequests.filter(req => {
      const matchSearch =
        query === '' ||
        req.orderId.toLowerCase().includes(query) ||
        req.returnId.toLowerCase().includes(query) ||
        req.productName.toLowerCase().includes(query) ||
        req.customerName.toLowerCase().includes(query);

      const matchReason = selectedReasonFilter === 'All' || req.reason === selectedReasonFilter;

      let matchTab = true;
      if (selectedTabFilter === 'action') matchTab = req.status === 'Awaiting Review';
      if (selectedTabFilter === 'escalated') matchTab = req.status === 'Escalated';
      if (selectedTabFilter === 'resolved') matchTab = req.status === 'Resolved' || req.status === 'Refund Pending';

      return matchSearch && matchReason && matchTab;
    });
  }, [returnRequests, search, selectedReasonFilter, selectedTabFilter]);

  const hasActiveFilters = search.trim() !== '' || selectedReasonFilter !== 'All' || selectedTabFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setSelectedReasonFilter('All');
    setSelectedTabFilter('all');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(vendor)/home');
    }
  };

  const handleRotatePhoto = () => {
    setPhotoRotation(prev => (prev + 90) % 360);
  };

  const handleZoomToggle = () => {
    setPhotoZoom(prev => (prev === 1 ? 1.5 : 1));
  };

  const handleOpenInspection = (req: CustomerReturnRequest) => {
    setSelectedReturn(req);
    setActivePhotoIdx(0);
    setPhotoRotation(0);
    setPhotoZoom(1);
    setInternalNote('');
  };

  const handleCloseInspection = () => {
    setConfirmationModalOpen(false);
    setSelectedReturn(null);
  };

  const handlePromptDecision = (type: 'refund' | 'reject') => {
    setPendingDecisionType(type);
    setConfirmationModalOpen(true);
  };

  // Developer preview only: updates local state, nothing is sent to a server.
  const handleConfirmFinalDecision = () => {
    if (!selectedReturn || !__DEV__) return;

    const returnId = selectedReturn.returnId;
    const decisionText =
      pendingDecisionType === 'refund'
        ? `Full refund of ₹${selectedReturn.refundRequestedAmount} recommended for order #${selectedReturn.orderId} (local preview)`
        : `Claim ${returnId} rejected: ${rejectionReason} (local preview)`;

    setReturnRequests(prev =>
      prev.map(r => (r.returnId === returnId ? { ...r, status: 'Resolved' } : r))
    );
    setConfirmationModalOpen(false);
    setSelectedReturn(null);
    setToastMessage(decisionText);
  };

  // Photos actually shown in the inspection workspace
  const visiblePhotos = selectedReturn && !missingPhotosDemo ? selectedReturn.photos : [];
  const activePhoto = visiblePhotos[activePhotoIdx];
  const photoUnreadable = unreadablePhotoDemo || !!selectedReturn?.hasUnreadablePhoto;
  const showDuplicateWarning = duplicateClaimDemo || !!selectedReturn?.isDuplicateClaim;

  const renderSummaryCard = (label: string, count: number, tab: TabFilter, color: string, borderColor?: string) => {
    const active = selectedTabFilter === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[
          s.summaryCard,
          !isExpanded && s.summaryCardPhone,
          active && s.summaryCardActive,
          borderColor ? { borderColor } : null,
        ]}
        onPress={() => setSelectedTabFilter(tab)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Text style={[s.summaryCountText, { color }]}>{count}</Text>
        <Text style={s.summaryLabelText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (returnRequests.length === 0) {
      return (
        <View style={s.stateBox}>
          <Ionicons name="return-up-back-outline" size={40} color={Colors.textMuted} />
          <Text style={s.stateTitle}>No return requests yet</Text>
          <Text style={s.stateSub}>
            Return and damage claims on your orders will appear here, with unboxing photos and the inspection checklist.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
            <Text style={s.primaryBtnText}>View orders</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.stateBox}>
        <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
        <Text style={s.stateTitle}>No claims match these filters</Text>
        <Text style={s.stateSub}>Try a different order number, return ID or reason.</Text>
        <TouchableOpacity style={s.secondaryBtn} onPress={clearFilters} activeOpacity={0.8}>
          <Text style={s.secondaryBtnText}>Clear filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Left Navigation Rail (desktop only) ─────────────────────────────── */}
        {isExpanded && (
          <View style={s.navRail}>
            <View style={s.railBrandGroup}>
              <View style={s.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Wordmark size={17} />
                <Text style={s.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={s.railNavGroup}>
              {RAIL_ITEMS.map(item => {
                const active = item.route === '/(vendor)/returns';
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[s.railNavItem, active && s.railNavItemActive]}
                    onPress={() => router.push(item.route)}
                    disabled={active}
                    activeOpacity={0.8}
                    accessibilityRole="link"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? '#FFFFFF' : Colors.textMuted}
                    />
                    <Text style={[s.railNavLabel, active && s.railNavLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.railFooter}>
              <TouchableOpacity
                style={s.railHelpBtn}
                onPress={() => router.push('/(vendor)/support')}
                activeOpacity={0.8}
                accessibilityRole="link"
              >
                <Ionicons name="help-circle-outline" size={16} color={Colors.primaryLight} />
                <Text style={s.railHelpText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Breadcrumb & Header Bar */}
          <View style={[s.topHeader, { paddingHorizontal: gutter }]}>
            <View style={s.headerLeftGroup}>
              <TouchableOpacity
                onPress={handleBack}
                style={s.backBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>

              <View style={s.headerTextCol}>
                <View style={s.breadcrumbRow}>
                  <TouchableOpacity
                    onPress={() => router.push('/(vendor)/orders')}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  >
                    <Text style={s.breadcrumbLink}>Orders</Text>
                  </TouchableOpacity>
                  <Text style={s.breadcrumbSep}>/</Text>
                  <Text style={s.breadcrumbCurrent}>Returns & Inspection</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Customer Returns & Inspection</Text>
                  <View style={s.policyPill}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={Colors.primary} />
                    <Text style={s.policyPillText}>Privacy-safe customer identity</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <CustomerAppRedirectButton />
            </View>
          </View>

          {/* Developer tooling: sample data and edge states (dev builds only) */}
          {__DEV__ && (
            <View style={s.devStrip}>
              <Text style={s.devStripTitle}>DEV TOOLING: EDGE STATES (NOT SHOWN IN PRODUCTION)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.devScrollContainer}>
                <TouchableOpacity
                  style={[s.devChip, isOffline && s.devChipActive]}
                  onPress={() => setIsOffline(!isOffline)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.devChipText, isOffline && s.devChipTextActive]}>Offline preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.devChip, missingPhotosDemo && s.devChipActive]}
                  onPress={() => setMissingPhotosDemo(!missingPhotosDemo)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.devChipText, missingPhotosDemo && s.devChipTextActive]}>Missing photos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.devChip, unreadablePhotoDemo && s.devChipActive]}
                  onPress={() => setUnreadablePhotoDemo(!unreadablePhotoDemo)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.devChipText, unreadablePhotoDemo && s.devChipTextActive]}>Unreadable photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.devChip, duplicateClaimDemo && s.devChipActive]}
                  onPress={() => setDuplicateClaimDemo(!duplicateClaimDemo)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.devChipText, duplicateClaimDemo && s.devChipTextActive]}>Duplicate claim</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Banners */}
          {__DEV__ && isOffline && (
            <View style={s.systemBannerOffline}>
              <Text style={s.systemBannerText}>Offline preview (dev tooling). Nothing is sent or saved.</Text>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView
            style={s.scrollBody}
            contentContainerStyle={[s.scrollContent, { paddingHorizontal: gutter }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={s.maxContentContainer}>

              {__DEV__ && returnRequests.length > 0 && (
                <View style={s.sampleChipRow}>
                  <View style={s.sampleChip}>
                    <Text style={s.sampleChipText}>Sample data</Text>
                  </View>
                </View>
              )}

              {/* ── SUMMARY METRICS STRIP (derived from the claims shown) ────── */}
              <View style={s.summaryStripRow}>
                {renderSummaryCard('Total claims', totalCount, 'all', Colors.textPrimary)}
                {renderSummaryCard('Awaiting review', awaitingCount, 'action', Colors.warning, Colors.warning)}
                {renderSummaryCard('Escalated', escalatedCount, 'escalated', Colors.danger, Colors.danger)}
                {renderSummaryCard('Resolved', resolvedCount, 'resolved', Colors.success, Colors.success)}
              </View>

              {/* ── SEARCH & RETURN REASON FILTER BAR ───────────────────────── */}
              <View style={s.toolbarCard}>
                <View style={s.searchInputWrap}>
                  <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search order #, return ID or product"
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    accessibilityLabel="Search return claims"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearch('')}
                      style={s.iconBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons name="close" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
                  {REASON_FILTERS.map(r => {
                    const active = selectedReasonFilter === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[s.filterPill, active && s.filterPillActive]}
                        onPress={() => setSelectedReasonFilter(r)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[s.filterPillText, active && s.filterPillTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── CLAIM LIST ──────────────────────────────────────────────── */}
              {isLoading ? (
                <View style={s.stateBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={s.stateSub}>Loading return requests…</Text>
                </View>
              ) : filteredRequests.length === 0 ? (
                renderEmptyState()
              ) : (
                <View style={s.requestList}>
                  {filteredRequests.map(req => {
                    const isUrgent =
                      req.slaHoursRemaining !== undefined && req.slaHoursRemaining > 0 && req.slaHoursRemaining <= 2;
                    const tone = STATUS_STYLE[req.status];
                    const thumbUri = req.photos[0];

                    return (
                      <View key={req.returnId} style={s.requestCard}>
                        {/* Header Row */}
                        <View style={s.cardHeaderRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={s.badgeMetaRow}>
                              <Text style={s.orderIdText}>Order #{req.orderId}</Text>
                              <Text style={s.returnIdText}>Claim #{req.returnId}</Text>
                            </View>
                            <Text style={s.customerMetaText}>
                              Customer: {req.customerName} • {req.customerArea} (privacy safe, no phone shown)
                            </Text>
                          </View>

                          <View style={[s.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                            <Text style={[s.statusPillText, { color: tone.text }]}>{req.status}</Text>
                          </View>
                        </View>

                        {/* Product & Claim Info */}
                        <View style={s.productDetailsRow}>
                          <View style={s.thumbBox}>
                            {thumbUri ? (
                              <Image source={{ uri: thumbUri }} style={s.thumbImage} resizeMode="cover" />
                            ) : (
                              <Ionicons name="cube-outline" size={20} color={Colors.textSecondary} />
                            )}
                          </View>

                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.brandLabel}>{req.brand}</Text>
                            <Text style={s.productTitleText}>{req.productName}</Text>

                            <View style={s.reasonRow}>
                              <View style={s.reasonChipTag}>
                                <Text style={s.reasonChipTagText}>Reason: {req.reason}</Text>
                              </View>
                              <Text style={s.requestAgeText}>Requested {req.requestAge}</Text>
                            </View>
                          </View>

                          <View style={s.refundAmountBox}>
                            <Text style={s.refundLabel}>Refund req.</Text>
                            <Text style={s.refundAmountText}>₹{req.refundRequestedAmount}</Text>
                          </View>
                        </View>

                        {/* Response deadline warning (only when the claim has a timer) */}
                        {isUrgent && (
                          <View style={s.slaWarningBanner}>
                            <Text style={s.slaWarningBannerText}>
                              Policy response needed within {req.slaHoursRemaining}h.
                            </Text>
                          </View>
                        )}

                        {/* Action Footer */}
                        <View style={s.cardFooterRow}>
                          <Text style={s.policyGuidanceHintText}>
                            Check unboxing photos and seal condition before deciding.
                          </Text>

                          <TouchableOpacity
                            style={s.reviewRequestBtn}
                            onPress={() => handleOpenInspection(req)}
                            activeOpacity={0.8}
                          >
                            <Text style={s.reviewRequestBtnText}>Open inspection</Text>
                            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

            </View>
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </View>
      </View>

      {/* ── INSPECTION WORKSPACE MODAL ─────────────────────────────────────────── */}
      {selectedReturn && (
        <Modal
          visible={!!selectedReturn}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseInspection}
        >
          <View style={[s.modalOverlay, { padding: isExpanded ? Spacing.xl : Spacing.sm }]}>
            <View style={[s.splitModalCard, { padding: isExpanded ? Spacing.xl : Spacing.md }]}>

              {/* Top Header */}
              <View style={s.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.modalTitleText}>Inspection Workspace: Order #{selectedReturn.orderId}</Text>
                  <Text style={s.modalSubText}>
                    Customer: {selectedReturn.customerName} • Purchased {selectedReturn.purchaseDate} • Claim #{selectedReturn.returnId}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCloseInspection}
                  style={s.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close inspection"
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={s.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 2-Column Inspection Content (stacked on phone) */}
                <View style={[s.splitWorkspaceBody, !isExpanded && s.splitWorkspaceStacked]}>

                  {/* LEFT COLUMN: Photo Viewer & Evidence */}
                  <View style={[s.leftPhotoColumn, !isExpanded && s.columnStacked]}>
                    <View style={s.photoViewerCard}>
                      <View style={s.photoHeaderRow}>
                        <Text style={s.photoViewerTitle}>UNBOXING PHOTO EVIDENCE</Text>
                        <Text style={s.photoCounterText}>
                          {visiblePhotos.length > 0 ? `Photo ${activePhotoIdx + 1} of ${visiblePhotos.length}` : 'No photos'}
                        </Text>
                      </View>

                      {photoUnreadable ? (
                        <View style={s.missingPhotosBox}>
                          <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
                          <Text style={s.missingPhotosText}>This photo could not be read. Evidence may be insufficient.</Text>
                        </View>
                      ) : visiblePhotos.length === 0 || !activePhoto ? (
                        <View style={s.missingPhotosBox}>
                          <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                          <Text style={s.missingPhotosText}>No unboxing photo uploaded by customer</Text>
                        </View>
                      ) : (
                        <View style={s.photoDisplayBox}>
                          <Image
                            source={{ uri: activePhoto }}
                            style={[
                              s.activeInspectionImage,
                              {
                                transform: [
                                  { rotate: `${photoRotation}deg` },
                                  { scale: photoZoom },
                                ],
                              },
                            ]}
                            resizeMode="contain"
                          />

                          {/* Image Controls Overlay */}
                          <View style={s.imageControlsBar}>
                            <TouchableOpacity style={s.imgCtrlBtn} onPress={handleRotatePhoto} accessibilityRole="button" accessibilityLabel="Rotate photo">
                              <Ionicons name="refresh" size={14} color="#FFFFFF" />
                              <Text style={s.imgCtrlBtnText}>Rotate</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.imgCtrlBtn} onPress={handleZoomToggle} accessibilityRole="button" accessibilityLabel="Toggle zoom">
                              <Ionicons name="search-outline" size={14} color="#FFFFFF" />
                              <Text style={s.imgCtrlBtnText}>{photoZoom > 1 ? 'Reset zoom' : 'Zoom 1.5x'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {!photoUnreadable && visiblePhotos.length > 1 && (
                        <View style={s.thumbStrip}>
                          {visiblePhotos.map((uri, idx) => (
                            <TouchableOpacity
                              key={`${uri}-${idx}`}
                              onPress={() => setActivePhotoIdx(idx)}
                              style={[s.photoThumbBtn, idx === activePhotoIdx && s.photoThumbBtnActive]}
                              accessibilityRole="button"
                              accessibilityLabel={`Show photo ${idx + 1}`}
                            >
                              <Image source={{ uri }} style={s.photoThumbImg} resizeMode="cover" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Written Customer Statement */}
                    <View style={s.claimDetailsCard}>
                      <Text style={s.claimHeaderTitle}>CLAIM REASON: {selectedReturn.reason.toUpperCase()}</Text>
                      <Text style={s.claimNoteText}>"{selectedReturn.customerNote}"</Text>
                    </View>
                  </View>

                  {/* RIGHT COLUMN: Policy Checklist & Notes */}
                  <View style={[s.rightChecklistColumn, !isExpanded && s.columnStacked]}>

                    {showDuplicateWarning && (
                      <View style={s.duplicateBanner}>
                        <Ionicons name="warning-outline" size={16} color={Colors.primary} />
                        <Text style={s.duplicateBannerText}>
                          Possible duplicate claim for this order. Check the claim history before deciding.
                        </Text>
                      </View>
                    )}

                    {/* Policy Guidance Card */}
                    <View style={s.policyGuidanceCard}>
                      <Text style={s.policyGuidanceTitle}>Return policy guidance</Text>
                      <Text style={s.policyGuidanceText}>
                        Beauty items damaged in transit or with broken seals upon arrival qualify for 100% full customer refund. Merchant payout is protected if transit damage is verified.
                      </Text>
                    </View>

                    {/* Structured Evidence Checklist */}
                    <View style={s.evidenceChecklistCard}>
                      <Text style={s.evidenceChecklistTitle}>STRUCTURED INSPECTION EVIDENCE CHECKLIST</Text>

                      <View style={s.checklistGrid}>
                        <View style={s.checklistItemRow}>
                          <Text style={s.checkLabel}>1. Seal condition:</Text>
                          <Text style={[s.checkVal, selectedReturn.evidenceChecklist.sealCondition === 'Broken' && { color: Colors.danger }]}>
                            {selectedReturn.evidenceChecklist.sealCondition}
                          </Text>
                        </View>

                        <View style={s.checklistItemRow}>
                          <Text style={s.checkLabel}>2. Product authenticity:</Text>
                          <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.authenticity}</Text>
                        </View>

                        <View style={s.checklistItemRow}>
                          <Text style={s.checkLabel}>3. Expiry status:</Text>
                          <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.expiryStatus}</Text>
                        </View>

                        <View style={s.checklistItemRow}>
                          <Text style={s.checkLabel}>4. Damage type:</Text>
                          <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.damageType}</Text>
                        </View>

                        <View style={s.checklistItemRow}>
                          <Text style={s.checkLabel}>5. Original packaging:</Text>
                          <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.packagingIncluded ? 'Included' : 'Missing'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Internal Notes (local only) */}
                    <View style={s.notesCard}>
                      <Text style={s.notesTitle}>INTERNAL NOTE (NOT SAVED YET)</Text>
                      <TextInput
                        style={s.notesInput}
                        placeholder="Optional notes for your records"
                        placeholderTextColor={Colors.textMuted}
                        value={internalNote}
                        onChangeText={setInternalNote}
                        multiline
                        accessibilityLabel="Internal note"
                      />
                    </View>
                  </View>

                </View>
              </ScrollView>

              {/* Action bar: decisions only exist in developer preview */}
              <View style={s.modalFooterActionBar}>
                {__DEV__ ? (
                  <>
                    <TouchableOpacity
                      style={s.rejectDangerBtn}
                      onPress={() => handlePromptDecision('reject')}
                      activeOpacity={0.85}
                    >
                      <Text style={s.rejectDangerBtnText}>Reject claim</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.recommendRefundPrimaryBtn}
                      onPress={() => handlePromptDecision('refund')}
                      activeOpacity={0.85}
                    >
                      <Text style={s.recommendRefundPrimaryBtnText}>
                        Recommend full refund (₹{selectedReturn.refundRequestedAmount})
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={s.decisionUnavailableText}>Return decisions are not available yet.</Text>
                )}
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* Decision Confirmation Modal (developer preview only) */}
      {__DEV__ && confirmationModalOpen && selectedReturn && (
        <Modal
          visible={confirmationModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setConfirmationModalOpen(false)}
        >
          <View style={[s.modalOverlay, { padding: isExpanded ? Spacing.xl : Spacing.lg }]}>
            <View style={s.confirmCard}>
              <Text style={s.confirmTitle}>Confirm decision summary</Text>
              <Text style={s.confirmSub}>Developer preview: this updates local state only.</Text>

              <View style={s.confirmDetailsBox}>
                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Order ID:</Text>
                  <Text style={s.confirmRowVal}>#{selectedReturn.orderId}</Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Decision type:</Text>
                  <Text style={[s.confirmRowVal, pendingDecisionType === 'refund' ? { color: Colors.success } : { color: Colors.danger }]}>
                    {pendingDecisionType === 'refund' ? 'Full refund recommendation' : 'Reject claim'}
                  </Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Refund amount:</Text>
                  <Text style={s.confirmRowVal}>
                    {pendingDecisionType === 'refund' ? `₹${selectedReturn.refundRequestedAmount}` : '₹0'}
                  </Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Final decision maker:</Text>
                  <Text style={s.confirmRowVal}>GlowVAI Support Audit</Text>
                </View>
              </View>

              {pendingDecisionType === 'reject' && (
                <View style={s.rejectionReasonBox}>
                  <Text style={s.rejectionReasonLabel}>Rejection reason:</Text>
                  <TextInput
                    style={s.rejectionInput}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                  />
                </View>
              )}

              <View style={s.confirmActionsRow}>
                <TouchableOpacity
                  style={s.cancelConfirmBtn}
                  onPress={() => setConfirmationModalOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={s.cancelConfirmBtnText}>Back to review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.submitConfirmBtn}
                  onPress={handleConfirmFinalDecision}
                  activeOpacity={0.8}
                >
                  <Text style={s.submitConfirmBtnText}>Submit (preview)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Toast Banner */}
      {toastMessage && (
        <View style={[s.toastBanner, { left: gutter, right: gutter }]} accessibilityLiveRegion="polite">
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Desktop Navigation Rail ────────────────────────────────────────────────── */
  navRail: {
    width: 240,
    backgroundColor: Colors.textPrimary,
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
  railBrandSub: {
    fontFamily: 'Inter_400Regular',
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
    minHeight: 44,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primary,
  },
  railNavLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  railNavLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  railFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
  },
  railHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLeftGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  breadcrumbSep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  policyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  policyPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  /* Developer tooling strip (__DEV__ only) */
  devStrip: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  devStripTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  devScrollContainer: {
    gap: Spacing.xs,
  },
  devChip: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  devChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  devChipTextActive: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  systemBannerOffline: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  systemBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },

  /* Main Scroll Content */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.xl,
  },
  maxContentContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  sampleChipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  sampleChip: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  sampleChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },

  /* Summary Strip */
  summaryStripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 64,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardPhone: {
    flexGrow: 0,
    flexBasis: '47%',
  },
  summaryCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  summaryCountText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryLabelText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
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
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    minHeight: 44,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    gap: Spacing.xs,
  },
  filterPill: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
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
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  /* Empty / Loading States */
  stateBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
  },
  primaryBtn: {
    marginTop: Spacing.xs,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: Spacing.xs,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  /* Request List */
  requestList: {
    gap: Spacing.md,
  },
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  returnIdText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  customerMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  productDetailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  brandLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  productTitleText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 3,
  },
  reasonChipTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  reasonChipTagText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  requestAgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  refundAmountBox: {
    alignItems: 'flex-end',
  },
  refundLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  refundAmountText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  slaWarningBanner: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  slaWarningBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
    textAlign: 'center',
  },

  cardFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  policyGuidanceHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  reviewRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: BorderRadii.pill,
  },
  reviewRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  /* Split Inspection Modal Workspace */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitModalCard: {
    width: '100%',
    maxWidth: 1100,
    maxHeight: '92%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  modalTitleText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalBodyContent: {
    paddingBottom: Spacing.md,
  },
  splitWorkspaceBody: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  splitWorkspaceStacked: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  leftPhotoColumn: {
    flex: 5,
    minWidth: 0,
  },
  rightChecklistColumn: {
    flex: 6,
    minWidth: 0,
  },
  columnStacked: {
    flex: 0,
    width: '100%',
  },

  photoViewerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  photoViewerTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  photoCounterText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  missingPhotosBox: {
    minHeight: 180,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  missingPhotosText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  photoDisplayBox: {
    height: 240,
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadii.input,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeInspectionImage: {
    width: '100%',
    height: '100%',
  },
  imageControlsBar: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadii.pill,
  },
  imgCtrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  imgCtrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  thumbStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  photoThumbBtn: {
    width: 56,
    height: 56,
    borderRadius: BorderRadii.input,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  photoThumbBtnActive: {
    borderColor: Colors.primary,
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },

  claimDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  claimHeaderTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  claimNoteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    marginTop: 4,
  },

  duplicateBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  duplicateBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 16,
  },

  policyGuidanceCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  policyGuidanceTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  policyGuidanceText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  evidenceChecklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  evidenceChecklistTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  checklistGrid: {
    gap: 8,
  },
  checklistItemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  checkLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkVal: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  notesCard: {
    marginBottom: Spacing.md,
  },
  notesTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  notesInput: {
    minHeight: 72,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },

  modalFooterActionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rejectDangerBtn: {
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectDangerBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  recommendRefundPrimaryBtn: {
    flexGrow: 1,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendRefundPrimaryBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  decisionUnavailableText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },

  /* Confirm Modal (developer preview) */
  confirmCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 480,
  },
  confirmTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  confirmDetailsBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginBottom: Spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  confirmRowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confirmRowVal: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  rejectionReasonBox: {
    marginBottom: Spacing.md,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rejectionInput: {
    minHeight: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelConfirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitConfirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Toast Banner */
  toastBanner: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});

export default ReturnsScreen;
