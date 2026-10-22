/**
 * SCREEN 18: Customer Returns & Inspection
 * Desktop 1440x1024 Split-Layout Inspection Workstation
 * File: mobile/app/(vendor)/returns.tsx
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
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

export interface CustomerReturnRequest {
  returnId: string;
  orderId: string;
  customerName: string; // Privacy safe: "Priya S."
  customerArea: string; // "Benz Circle"
  productName: string;
  brand: string;
  itemPrice: number;
  refundRequestedAmount: number;
  reason: 'Damaged' | 'Incorrect Item' | 'Leaking Seal' | 'Expired Item' | 'Customer Changed Mind';
  customerNote: string;
  purchaseDate: string;
  requestAge: string;
  slaHoursRemaining: number;
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

const INITIAL_RETURNS: CustomerReturnRequest[] = [
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

function ReturnsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [returnRequests, setReturnRequests] = useState<CustomerReturnRequest[]>(INITIAL_RETURNS);
  const [search, setSearch] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('All');
  const [selectedTabFilter, setSelectedTabFilter] = useState<'action' | 'all' | 'escalated' | 'resolved'>('action');

  // Inspection Modal / Split Workspace State
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturnRequest | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [merchantNotes, setMerchantNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Confirmation Step State
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingDecisionType, setPendingDecisionType] = useState<'refund' | 'reject' | 'escalate'>('refund');
  const [rejectionReason, setRejectionReason] = useState('Evidence insufficient or seal intact');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; undoAction?: () => void } | null>(null);

  // System Edge States
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

  // Counts
  const openCount = useMemo(() => returnRequests.filter(r => r.status === 'Awaiting Review').length, [returnRequests]);
  const awaitingReviewCount = openCount;
  const escalatedCount = useMemo(() => returnRequests.filter(r => r.status === 'Escalated').length, [returnRequests]);
  const resolvedCount = useMemo(() => returnRequests.filter(r => r.status === 'Resolved').length, [returnRequests]);

  // Filtered List
  const filteredRequests = useMemo(() => {
    return returnRequests.filter(req => {
      const query = search.trim().toLowerCase();
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
    setMerchantNotes('');
  };

  const handlePromptDecision = (type: 'refund' | 'reject' | 'escalate') => {
    setPendingDecisionType(type);
    setConfirmationModalOpen(true);
  };

  const handleConfirmFinalDecision = () => {
    if (!selectedReturn) return;

    setSubmittingDecision(true);

    const returnId = selectedReturn.returnId;
    let newStatus: CustomerReturnRequest['status'] = 'Resolved';
    let decisionText = '';

    if (pendingDecisionType === 'refund') {
      newStatus = 'Resolved';
      decisionText = `✓ Full refund of ₹${selectedReturn.refundRequestedAmount} recommended for Order #${selectedReturn.orderId}`;
    } else if (pendingDecisionType === 'escalate') {
      newStatus = 'Escalated';
      decisionText = `🛡️ Escalated return ${returnId} to GlowVAI Support Audit`;
    } else {
      newStatus = 'Resolved';
      decisionText = `❌ Claim rejected: ${rejectionReason}`;
    }

    setTimeout(() => {
      setReturnRequests(prev =>
        prev.map(r => (r.returnId === returnId ? { ...r, status: newStatus } : r))
      );

      setSubmittingDecision(false);
      setConfirmationModalOpen(false);
      setSelectedReturn(null);

      setToastMessage({ text: decisionText });
    }, 500);
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

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
                <Text style={s.railNavIcon}>↩️</Text>
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Returns</Text>
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

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Breadcrumb & Header Bar */}
          <View style={s.topHeader}>
            <View style={s.headerLeftGroup}>
              <TouchableOpacity onPress={() => router.replace('/(vendor)/orders')} style={s.backBtn} activeOpacity={0.8}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>

              <View>
                <View style={s.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.replace('/(vendor)/orders')}>
                    <Text style={s.breadcrumbLink}>Orders</Text>
                  </TouchableOpacity>
                  <Text style={s.breadcrumbSep}>/</Text>
                  <Text style={s.breadcrumbCurrent}>Returns & Inspection</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Customer Returns & Inspection</Text>
                  <View style={s.policyPill}>
                    <Text style={s.policyPillText}>🛡️ Privacy-Safe Customer Identity</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* System Edge Simulation Strip */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST RETURNS EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, isOffline && s.simChipActive]}
                onPress={() => setIsOffline(!isOffline)}
              >
                <Text style={[s.simChipText, isOffline && s.simChipTextActive]}>{isOffline ? 'Go Online' : 'Simulate Offline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, missingPhotosDemo && s.simChipActive]}
                onPress={() => setMissingPhotosDemo(!missingPhotosDemo)}
              >
                <Text style={[s.simChipText, missingPhotosDemo && s.simChipTextActive]}>Missing Photos Demo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, unreadablePhotoDemo && s.simChipActive]}
                onPress={() => setUnreadablePhotoDemo(!unreadablePhotoDemo)}
              >
                <Text style={[s.simChipText, unreadablePhotoDemo && s.simChipTextActive]}>Unreadable Evidence</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, duplicateClaimDemo && s.simChipActive]}
                onPress={() => setDuplicateClaimDemo(!duplicateClaimDemo)}
              >
                <Text style={[s.simChipText, duplicateClaimDemo && s.simChipTextActive]}>Duplicate Claim</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Banners */}
          {isOffline && (
            <View style={s.systemBannerOffline}>
              <Text style={s.systemBannerText}>📶 Offline Mode — Return inspection decisions queued locally</Text>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {/* ── CLICKABLE SUMMARY METRICS STRIP (4 Cards) ────────────────── */}
              <View style={s.summaryStripRow}>
                <TouchableOpacity
                  style={[s.summaryCard, selectedTabFilter === 'action' && s.summaryCardActive]}
                  onPress={() => setSelectedTabFilter('action')}
                  activeOpacity={0.7}
                >
                  <Text style={s.summaryCountText}>{openCount}</Text>
                  <Text style={s.summaryLabelText}>Open Claims</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.summaryCard, selectedTabFilter === 'action' && s.summaryCardActive, { borderColor: Colors.warning }]}
                  onPress={() => setSelectedTabFilter('action')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.summaryCountText, { color: Colors.warning }]}>{awaitingReviewCount}</Text>
                  <Text style={s.summaryLabelText}>Awaiting Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.summaryCard, selectedTabFilter === 'escalated' && s.summaryCardActive, { borderColor: Colors.danger }]}
                  onPress={() => setSelectedTabFilter('escalated')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.summaryCountText, { color: Colors.danger }]}>{escalatedCount}</Text>
                  <Text style={s.summaryLabelText}>Escalated</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.summaryCard, selectedTabFilter === 'resolved' && s.summaryCardActive, { borderColor: Colors.success }]}
                  onPress={() => setSelectedTabFilter('resolved')}
                  activeOpacity={0.7}
                >
                  <Text style={[s.summaryCountText, { color: Colors.success }]}>{resolvedCount}</Text>
                  <Text style={s.summaryLabelText}>Resolved</Text>
                </TouchableOpacity>
              </View>

              {/* ── SEARCH & RETURN REASON FILTER BAR ───────────────────────── */}
              <View style={s.toolbarCard}>
                <View style={s.searchInputWrap}>
                  <Ionicons name="search-outline" size={18} color="#475569" style={s.searchIcon} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search Order #, Return ID, or product name…"
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

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
                  {['All', 'Damaged', 'Incorrect Item', 'Leaking Seal', 'Expired Item', 'Customer Changed Mind'].map(r => {
                    const active = selectedReasonFilter === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[s.filterPill, active && s.filterPillActive]}
                        onPress={() => setSelectedReasonFilter(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.filterPillText, active && s.filterPillTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── DENSE DESKTOP RETURNS TABLE MATRIX ──────────────────────── */}
              {filteredRequests.length === 0 ? (
                <View style={s.emptyStateBox}>
                  <Ionicons name="cube-outline" size={18} color="#475569" style={s.emptyIcon} />
                  <Text style={s.emptyTitle}>No return requests found</Text>
                  <Text style={s.emptySub}>
                    {search.length > 0
                      ? `No returns found matching "${search}".`
                      : 'All customer return claims are up to date!'}
                  </Text>
                </View>
              ) : (
                <View style={s.requestList}>
                  {filteredRequests.map(req => {
                    const isUrgent = req.slaHoursRemaining > 0 && req.slaHoursRemaining <= 2;
                    const isEscalated = req.status === 'Escalated';
                    const isResolved = req.status === 'Resolved';

                    return (
                      <View key={req.returnId} style={s.requestCard}>
                        {/* Header Row */}
                        <View style={s.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <View style={s.badgeMetaRow}>
                              <Text style={s.orderIdText}>Order #{req.orderId}</Text>
                              <Text style={s.returnIdText}>Claim #{req.returnId}</Text>
                            </View>
                            <Text style={s.customerMetaText}>
                              Customer: {req.customerName} • {req.customerArea} (Privacy Safe — No Phone Displayed)
                            </Text>
                          </View>

                          {/* Status Pill */}
                          <View style={[
                            s.statusPillTag,
                            isEscalated && s.statusPillEscalated,
                            isResolved && s.statusPillResolved,
                            req.status === 'Awaiting Review' && s.statusPillAwaiting,
                          ]}>
                            <Text style={[
                              s.statusPillText,
                              isEscalated && s.statusPillTextEscalated,
                              isResolved && s.statusPillTextResolved,
                              req.status === 'Awaiting Review' && s.statusPillTextAwaiting,
                            ]}>
                              {isEscalated ? '🛡️ Escalated' : isResolved ? '✓ Resolved' : '⌛ Awaiting Review'}
                            </Text>
                          </View>
                        </View>

                        {/* Product & Claim Info */}
                        <View style={s.productDetailsRow}>
                          <View style={s.thumbBox}>
                            <Ionicons name="cube-outline" size={18} color="#475569" style={s.thumbEmoji} />
                          </View>

                          <View style={{ flex: 1 }}>
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
                            <Text style={s.refundLabel}>REFUND REQ</Text>
                            <Text style={s.refundAmountText}>₹{req.refundRequestedAmount}</Text>
                          </View>
                        </View>

                        {/* SLA Urgency Warning */}
                        {isUrgent && (
                          <View style={s.slaWarningBanner}>
                            <Text style={s.slaWarningBannerText}>
                              ⏱️ SLA Risk Warning: Policy response required within {req.slaHoursRemaining}h to prevent automated refund release.
                            </Text>
                          </View>
                        )}

                        {/* Action Footer */}
                        <View style={s.cardFooterRow}>
                          <Text style={s.policyGuidanceHintText}>Inspect unboxing photo evidence & seal condition before authorizing decision</Text>

                          <TouchableOpacity
                            style={s.reviewRequestBtn}
                            onPress={() => handleOpenInspection(req)}
                            activeOpacity={0.8}
                          >
                            <Text style={s.reviewRequestBtnText}>Open Inspection →</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* ── SPLIT INSPECTION WORKSPACE MODAL ───────────────────────────────────── */}
      {selectedReturn && (
        <Modal
          visible={!!selectedReturn}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedReturn(null)}
        >
          <View style={s.modalOverlay}>
            <View style={s.splitModalCard}>
              
              {/* Top Header */}
              <View style={s.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitleText}>Inspection Workspace: Order #{selectedReturn.orderId}</Text>
                  <Text style={s.modalSubText}>
                    Customer: {selectedReturn.customerName} • Purchased {selectedReturn.purchaseDate} • Claim #{selectedReturn.returnId}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setSelectedReturn(null)} style={s.closeModalBtn}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              </View>

              {/* 2-Column Inspection Content */}
              <View style={s.splitWorkspaceBody}>

                {/* LEFT COLUMN: Photo Viewer & Evidence (540px) */}
                <View style={s.leftPhotoColumn}>
                  <View style={s.photoViewerCard}>
                    <View style={s.photoHeaderRow}>
                      <Text style={s.photoViewerTitle}>UNBOXING PHOTO EVIDENCE</Text>
                      <Text style={s.photoCounterText}>
                        Photo {missingPhotosDemo ? 0 : activePhotoIdx + 1} of {missingPhotosDemo ? 0 : selectedReturn.photos.length}
                      </Text>
                    </View>

                    {missingPhotosDemo || selectedReturn.photos.length === 0 ? (
                      <View style={s.missingPhotosBox}>
                        <Text style={s.missingPhotosText}>📷 No unboxing photo uploaded by customer</Text>
                      </View>
                    ) : (
                      <View style={s.photoDisplayBox}>
                        <Image
                          source={{ uri: selectedReturn.photos[activePhotoIdx] }}
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
                          <TouchableOpacity style={s.imgCtrlBtn} onPress={handleRotatePhoto}>
                            <Text style={s.imgCtrlBtnText}>🔄 Rotate</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={s.imgCtrlBtn} onPress={handleZoomToggle}>
                            <Text style={s.imgCtrlBtnText}>{photoZoom > 1 ? '🔍 Reset Zoom' : '🔍 Zoom 1.5x'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Written Customer Statement */}
                  <View style={s.claimDetailsCard}>
                    <Text style={s.claimHeaderTitle}>CLAIM REASON: {selectedReturn.reason.toUpperCase()}</Text>
                    <Text style={s.claimNoteText}>"{selectedReturn.customerNote}"</Text>
                  </View>
                </View>

                {/* RIGHT COLUMN: Policy Checklist & Notes (640px) */}
                <View style={s.rightChecklistColumn}>
                  
                  {/* Policy Guidance Card */}
                  <View style={s.policyGuidanceCard}>
                    <Text style={s.policyGuidanceTitle}>🛡️ GlowVAI Beauty Return Policy Guidance</Text>
                    <Text style={s.policyGuidanceText}>
                      Beauty items damaged in transit or with broken seals upon arrival qualify for 100% full customer refund. Merchant payout is protected if transit damage is verified.
                    </Text>
                  </View>

                  {/* Structured Evidence Checklist */}
                  <View style={s.evidenceChecklistCard}>
                    <Text style={s.evidenceChecklistTitle}>STRUCTURED INSPECTION EVIDENCE CHECKLIST</Text>

                    <View style={s.checklistGrid}>
                      <View style={s.checklistItemRow}>
                        <Text style={s.checkLabel}>1. Seal Condition:</Text>
                        <Text style={[s.checkVal, selectedReturn.evidenceChecklist.sealCondition === 'Broken' && { color: Colors.danger }]}>
                          {selectedReturn.evidenceChecklist.sealCondition}
                        </Text>
                      </View>

                      <View style={s.checklistItemRow}>
                        <Text style={s.checkLabel}>2. Product Authenticity:</Text>
                        <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.authenticity}</Text>
                      </View>

                      <View style={s.checklistItemRow}>
                        <Text style={s.checkLabel}>3. Expiry Status:</Text>
                        <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.expiryStatus}</Text>
                      </View>

                      <View style={s.checklistItemRow}>
                        <Text style={s.checkLabel}>4. Damage Type:</Text>
                        <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.damageType}</Text>
                      </View>

                      <View style={s.checklistItemRow}>
                        <Text style={s.checkLabel}>5. Original Packaging:</Text>
                        <Text style={s.checkVal}>{selectedReturn.evidenceChecklist.packagingIncluded ? 'Included' : 'Missing'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Internal Merchant Notes */}
                  <View style={s.notesCard}>
                    <Text style={s.notesTitle}>🔒 INTERNAL NOTE (VISIBLE TO GLOWVAI SUPPORT ONLY)</Text>
                    <TextInput
                      style={s.notesInput}
                      placeholder="Add optional notes for platform audit records…"
                      placeholderTextColor={Colors.textMuted}
                      value={merchantNotes}
                      onChangeText={setMerchantNotes}
                      multiline
                    />
                  </View>
                </View>

              </View>

              {/* Differentiated Bottom Action Bar */}
              <View style={s.modalFooterActionBar}>
                <TouchableOpacity
                  style={s.rejectDangerBtn}
                  onPress={() => handlePromptDecision('reject')}
                  activeOpacity={0.85}
                >
                  <Text style={s.rejectDangerBtnText}>Reject / Escalate Claim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.recommendRefundPrimaryBtn}
                  onPress={() => handlePromptDecision('refund')}
                  activeOpacity={0.85}
                >
                  <Text style={s.recommendRefundPrimaryBtnText}>
                    Recommend Full Refund (₹{selectedReturn.refundRequestedAmount}) →
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation Step Summary Modal */}
      {confirmationModalOpen && selectedReturn && (
        <Modal
          visible={confirmationModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setConfirmationModalOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.confirmCard}>
              <Text style={s.confirmTitle}>Confirm Decision Summary</Text>
              <Text style={s.confirmSub}>Review decision details before submitting to platform audit engine.</Text>

              <View style={s.confirmDetailsBox}>
                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Order ID:</Text>
                  <Text style={s.confirmRowVal}>#{selectedReturn.orderId}</Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Decision Type:</Text>
                  <Text style={[s.confirmRowVal, pendingDecisionType === 'refund' ? { color: Colors.success } : { color: Colors.danger }]}>
                    {pendingDecisionType === 'refund' ? 'Full Refund Recommendation' : 'Reject / Escalate Claim'}
                  </Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Refund Amount:</Text>
                  <Text style={s.confirmRowVal}>
                    {pendingDecisionType === 'refund' ? `₹${selectedReturn.refundRequestedAmount}` : '₹0'}
                  </Text>
                </View>

                <View style={s.confirmRow}>
                  <Text style={s.confirmRowLabel}>Final Decision Maker:</Text>
                  <Text style={s.confirmRowVal}>GlowVAI Support Audit (within 2h)</Text>
                </View>
              </View>

              {pendingDecisionType === 'reject' && (
                <View style={s.rejectionReasonBox}>
                  <Text style={s.rejectionReasonLabel}>Select Rejection Reason:</Text>
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
                >
                  <Text style={s.cancelConfirmBtnText}>Back to Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.submitConfirmBtn}
                  onPress={handleConfirmFinalDecision}
                  disabled={submittingDecision}
                >
                  {submittingDecision ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={s.submitConfirmBtnText}>Submit Decision →</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
  policyPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  policyPillText: {
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

  /* System Simulation Strip */
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

  /* Summary Strip */
  summaryStripRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  summaryCountText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryLabelText: {
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
    marginBottom: Spacing.md,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  returnIdText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    
  },
  customerMetaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  statusPillAwaiting: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
  },
  statusPillEscalated: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.dangerBorder,
  },
  statusPillResolved: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.successBorder,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusPillTextAwaiting: {
    color: Colors.warning,
  },
  statusPillTextEscalated: {
    color: Colors.danger,
  },
  statusPillTextResolved: {
    color: Colors.success,
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
    width: 44,
    height: 44,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  brandLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  productTitleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reasonRow: {
    flexDirection: 'row',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  requestAgeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  refundAmountBox: {
    alignItems: 'flex-end',
  },
  refundLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  refundAmountText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  slaWarningBanner: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  slaWarningBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
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
  policyGuidanceHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  reviewRequestBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadii.pill,
  },
  reviewRequestBtnText: {
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

  /* Split Inspection Modal Workspace */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  splitModalCard: {
    width: '100%',
    maxWidth: 1100,
    maxHeight: '92%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  modalTitleText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textMuted,
  },
  splitWorkspaceBody: {
    flexDirection: 'row',
    gap: Spacing.xl,
    flex: 1,
  },
  leftPhotoColumn: {
    flex: 5,
  },
  rightChecklistColumn: {
    flex: 6,
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  photoCounterText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  missingPhotosBox: {
    height: 180,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingPhotosText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  photoDisplayBox: {
    height: 240,
    backgroundColor: '#0F172A',
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  imgCtrlBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  imgCtrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  claimNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    marginTop: 4,
  },

  policyGuidanceCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  policyGuidanceTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  policyGuidanceText: {
    fontFamily: 'PlusJakartaSans_400Regular',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  checklistGrid: {
    gap: 8,
  },
  checklistItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  checkLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  notesCard: {
    marginBottom: Spacing.md,
  },
  notesTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  notesInput: {
    height: 60,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },

  modalFooterActionBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rejectDangerBtn: {
    paddingHorizontal: 18,
    height: 48,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectDangerBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  recommendRefundPrimaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary, // Royal Blue #1D4ED8
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendRefundPrimaryBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Confirm Modal */
  confirmCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 480,
  },
  confirmTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
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
  },
  confirmRowLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confirmRowVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rejectionReasonBox: {
    marginBottom: Spacing.md,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rejectionInput: {
    height: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default withComingSoon(ReturnsScreen, 'Returns');
