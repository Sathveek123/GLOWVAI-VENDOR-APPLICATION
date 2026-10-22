/**
 * SCREEN 22: Weekly Bank Settlement & UTR Receipts
 * Desktop 1440x1024 Bank Reconciliation & Settlement Console
 * File: mobile/app/(vendor)/payout-detail.tsx
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
  RefreshControl,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

export interface SettlementBatch {
  id: string;
  cycleName: string;
  dateRange: string;
  payoutDate: string;
  grossAmount: number;
  platformFee: number; // 12%
  gstOnFee: number; // 18% on fee
  tcsDeduction: number; // 1%
  tdsDeduction: number; // 1%
  refunds: number;
  netPayout: number;
  destinationBank: string; // e.g. "HDFC Bank ••••4589"
  status: 'PAID' | 'PROCESSING' | 'FAILED' | 'ON_HOLD';
  utr?: string;
  failureReason?: string;
  orderCount: number;
}

const MOCK_SETTLEMENT_HISTORY: SettlementBatch[] = [
  {
    id: 'SET-2026-W40',
    cycleName: 'Week 40 (Oct 1 – Oct 7)',
    dateRange: 'Oct 1 – Oct 7, 2026',
    payoutDate: 'Oct 7, 2026 (06:00 AM)',
    grossAmount: 42500,
    platformFee: 5100,
    gstOnFee: 918,
    tcsDeduction: 425,
    tdsDeduction: 425,
    refunds: 62,
    netPayout: 35570,
    destinationBank: 'HDFC Bank ••••4589',
    status: 'PAID',
    utr: 'UTR-4021-8856-3321',
    orderCount: 34,
  },
  {
    id: 'SET-2026-W39',
    cycleName: 'Week 39 (Sep 24 – Sep 30)',
    dateRange: 'Sep 24 – Sep 30, 2026',
    payoutDate: 'Sep 30, 2026 (06:00 AM)',
    grossAmount: 49000,
    platformFee: 5880,
    gstOnFee: 1058,
    tcsDeduction: 490,
    tdsDeduction: 490,
    refunds: 0,
    netPayout: 41082,
    destinationBank: 'HDFC Bank ••••4589',
    status: 'PAID',
    utr: 'UTR-3918-7742-1092',
    orderCount: 41,
  },
  {
    id: 'SET-2026-W38',
    cycleName: 'Week 38 (Sep 17 – Sep 23)',
    dateRange: 'Sep 17 – Sep 23, 2026',
    payoutDate: 'Sep 23, 2026 (Attempted)',
    grossAmount: 34000,
    platformFee: 4080,
    gstOnFee: 734,
    tcsDeduction: 340,
    tdsDeduction: 340,
    refunds: 200,
    netPayout: 28306,
    destinationBank: 'HDFC Bank ••••4589',
    status: 'FAILED',
    failureReason: 'IFSC branch code mismatch reported by beneficiary bank. Bank profile update required.',
    orderCount: 26,
  },
  {
    id: 'SET-2026-W37',
    cycleName: 'Week 37 (Sep 10 – Sep 16)',
    dateRange: 'Sep 10 – Sep 16, 2026',
    payoutDate: 'Sep 16, 2026 (On Hold)',
    grossAmount: 18000,
    platformFee: 2160,
    gstOnFee: 388,
    tcsDeduction: 180,
    tdsDeduction: 180,
    refunds: 0,
    netPayout: 15092,
    destinationBank: 'HDFC Bank ••••4589',
    status: 'ON_HOLD',
    failureReason: 'Annual GST compliance audit hold. Verification in progress by Ops Tower.',
    orderCount: 14,
  },
];

function PayoutDetailScreen() {
  const router = useRouter();
  const { vendor } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Screen States
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'PAID' | 'PROCESSING' | 'FAILED'>('ALL');
  const [copiedUtrId, setCopiedUtrId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<SettlementBatch | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edge & Simulation States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isStaleData, setIsStaleData] = useState<boolean>(false);
  const [isFetchFailed, setIsFetchFailed] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportError, setShowExportError] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [forceMissingUtr, setForceMissingUtr] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Weekly Bank Settlements & UTR | GlowVAI Vendor Console';
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setIsFetchFailed(false);
    }, 800);
  };

  const handleCopyUtr = (utr: string, batchId: string) => {
    // Only report success when the text really reached the clipboard.
    // Native clipboard support is not installed yet.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(utr).then(() => {
        setCopiedUtrId(batchId);
        setTimeout(() => setCopiedUtrId(null), 2500);
      }).catch(() => {});
      return;
    }
    Alert.alert('Copy not available', `Select and copy the UTR manually: ${utr}`);
  };

  const handleDownloadBatchReceipt = (batch: SettlementBatch) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Settlement Receipt Generated 📄',
        `A4 PDF receipt for ${batch.cycleName} (${batch.id}) has been generated with UTR reference and tax schedule.`
      );
    }, 1000);
  };

  const filteredSettlements = useMemo(() => {
    return MOCK_SETTLEMENT_HISTORY.filter((item) => {
      if (cycleFilter === 'ALL') return true;
      return item.status === cycleFilter;
    });
  }, [cycleFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.desktopLayout}>

        {/* ── Left Navigation Rail ─────────────────────────────────────────────── */}
        {isExpanded && (
          <View style={styles.navRail}>
            <View style={styles.railBrandGroup}>
              <View style={styles.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.railBrandLogoIcon} />
              </View>
              <View>
                <Wordmark size={17} />
                <Text style={styles.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={styles.railNavGroup}>
              <TouchableOpacity style={styles.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={styles.railNavIcon} />
                <Text style={styles.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railNavItem} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={styles.railNavIcon} />
                <Text style={styles.railNavLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={styles.railNavIcon} />
                <Text style={styles.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railNavItem} onPress={() => router.push('/(vendor)/returns')} activeOpacity={0.8}>
                <Text style={styles.railNavIcon}>↩️</Text>
                <Text style={styles.railNavLabel}>Returns</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railNavItem} onPress={() => router.push('/(vendor)/reviews')} activeOpacity={0.8}>
                <Text style={styles.railNavIcon}>⭐</Text>
                <Text style={styles.railNavLabel}>Reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.railNavItem, styles.railNavItemActive]} onPress={() => router.push('/(vendor)/earnings')} activeOpacity={0.8}>
                <Ionicons name="wallet-outline" size={18} color="#475569" style={styles.railNavIcon} />
                <Text style={[styles.railNavLabel, styles.railNavLabelActive]}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railNavItem} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={18} color="#475569" style={styles.railNavIcon} />
                <Text style={styles.railNavLabel}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.railFooter}>
              <TouchableOpacity style={styles.storeSelectorPill} activeOpacity={0.8}>
                <Text style={styles.storeSelectorText} numberOfLines={1}>📍 Benz Circle Store ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.railHelpBtn} activeOpacity={0.8}>
                <Text style={styles.railHelpText}>Help & Support 💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={styles.mainConsole}>

          {/* Top Header & Breadcrumb Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(vendor)/earnings')} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>‹</Text>
              </TouchableOpacity>

              <View>
                <View style={styles.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.replace('/(vendor)/earnings')}>
                    <Text style={styles.breadcrumbLink}>Finance</Text>
                  </TouchableOpacity>
                  <Text style={styles.breadcrumbSep}>/</Text>
                  <Text style={styles.breadcrumbCurrent}>Settlements & UTR Receipts</Text>
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Bank Settlements & UTR</Text>
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>🏦 RBI IMPS T+1 Schedule</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.headerActionsRight}>
              <TouchableOpacity
                style={styles.headerExportBtn}
                onPress={() => handleDownloadBatchReceipt(MOCK_SETTLEMENT_HISTORY[0])}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.headerExportBtnText}>📥 Download Receipts</Text>
                )}
              </TouchableOpacity>

              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* System Edge State Simulation Strip */}
          {__DEV__ && (
          <View style={styles.devStrip}>
            <Text style={styles.devTitle}>TEST SETTLEMENT EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
              <TouchableOpacity
                style={[styles.devPill, isLoading && styles.devPillActive]}
                onPress={() => setIsLoading(!isLoading)}
              >
                <Text style={[styles.devPillText, isLoading && styles.devPillTextActive]}>Skeleton Loaders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, isFetchFailed && styles.devPillActive]}
                onPress={() => setIsFetchFailed(!isFetchFailed)}
              >
                <Text style={[styles.devPillText, isFetchFailed && styles.devPillTextActive]}>Fetch Error</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, isOffline && styles.devPillActive]}
                onPress={() => setIsOffline(!isOffline)}
              >
                <Text style={[styles.devPillText, isOffline && styles.devPillTextActive]}>Offline Mode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, isStaleData && styles.devPillActive]}
                onPress={() => setIsStaleData(!isStaleData)}
              >
                <Text style={[styles.devPillText, isStaleData && styles.devPillTextActive]}>Stale Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, forceMissingUtr && styles.devPillActive]}
                onPress={() => setForceMissingUtr(!forceMissingUtr)}
              >
                <Text style={[styles.devPillText, forceMissingUtr && styles.devPillTextActive]}>Missing UTR Demo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, isPermissionDenied && styles.devPillActive]}
                onPress={() => setIsPermissionDenied(!isPermissionDenied)}
              >
                <Text style={[styles.devPillText, isPermissionDenied && styles.devPillTextActive]}>Permission Denied</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devPill}
                onPress={() => setShowExportError(true)}
              >
                <Text style={styles.devPillText}>Export Failure Error</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Edge Banners */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                ⚡ Offline Mode — Displaying cached bank settlement history and UTR records.
              </Text>
            </View>
          )}

          {isStaleData && (
            <TouchableOpacity style={styles.staleBanner} onPress={onRefresh}>
              <Text style={styles.staleBannerText}>
                ⚠️ Settlement data cached at 01:00 AM. Tap to re-sync UTR records from central bank gateway.
              </Text>
            </TouchableOpacity>
          )}

          {isPermissionDenied && (
            <View style={styles.deniedBanner}>
              <Text style={styles.deniedBannerText}>
                🔒 Permission Denied — Only authorized Store Owners or Finance Managers can inspect bank UTR records.
              </Text>
            </View>
          )}

          {/* Main Content Area */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.maxContentContainer}>

              {/* ── 1. "NEXT PAYOUT" HERO CARD ────────────────────────────────────── */}
              {isLoading ? (
                <View style={[styles.heroCard, { backgroundColor: '#CBD5E1' }]}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 8 }}>Loading settlement status...</Text>
                </View>
              ) : isFetchFailed ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Failed to sync settlement records</Text>
                  <Text style={styles.errorSub}>The bank gateway service is currently unresponsive. Tap retry.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                    <Text style={styles.retryBtnText}>Retry Bank Sync</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.heroCard}>
                  <View style={styles.heroHeaderRow}>
                    <Text style={styles.heroSubtitle}>NEXT EXPECTED BANK PAYOUT</Text>
                    <View style={styles.statusPillProcessing}>
                      <Text style={styles.heroStatusTextProcessing}>🟡 PROCESSING (T+1 IMPS BATCH)</Text>
                    </View>
                  </View>

                  <Text style={styles.heroAmount}>₹12,450.00</Text>
                  <Text style={styles.heroSchedule}>Expected Settlement: Tomorrow, Oct 8 at 06:00 AM</Text>

                  <View style={styles.destBox}>
                    <Text style={styles.destLabel}>Destination Bank Account (Masked for Security)</Text>
                    <Text style={styles.destValue}>HDFC Bank ••••4589 (IFSC: HDFC0001234)</Text>
                  </View>

                  <View style={styles.helperBox}>
                    <Text style={styles.helperText}>
                      ℹ️ Payout timing may adjust dynamically due to pending unverified orders, active return inspection claims, bank clearing holidays, or account security cooling periods.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── 2. CHRONOLOGICAL SETTLEMENT MATRIX TABLE ──────────────────────── */}
              {!isLoading && !isFetchFailed && !isPermissionDenied && (
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardTitle}>CHRONOLOGICAL SETTLEMENT RECONCILIATION</Text>
                      <Text style={styles.cardSub}>Click any settlement cycle row to inspect itemized tax invoice & UTR receipt</Text>
                    </View>

                    {/* Cycle Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
                      {(['ALL', 'PAID', 'PROCESSING', 'FAILED'] as const).map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.filterPill, cycleFilter === st && styles.filterPillActive]}
                          onPress={() => setCycleFilter(st)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.filterPillText, cycleFilter === st && styles.filterPillTextActive]}>
                            {st === 'ALL' ? 'All Settlements' : st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Settlement Rows */}
                  {filteredSettlements.map((batch) => {
                    const displayUtr = forceMissingUtr ? null : batch.utr;
                    return (
                      <TouchableOpacity
                        key={batch.id}
                        style={styles.batchRow}
                        onPress={() => setSelectedBatch(batch)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.batchLeft}>
                          <View style={styles.cycleHeaderRow}>
                            <Text style={styles.cycleName}>{batch.cycleName}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                batch.status === 'PAID'
                                  ? styles.statusPaid
                                  : batch.status === 'PROCESSING'
                                  ? styles.statusProcessing
                                  : batch.status === 'FAILED'
                                  ? styles.statusFailed
                                  : styles.statusHold,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  batch.status === 'PAID'
                                    ? styles.statusTextPaid
                                    : batch.status === 'PROCESSING'
                                    ? styles.statusTextProcessing
                                    : batch.status === 'FAILED'
                                    ? styles.statusTextFailed
                                    : styles.statusTextHold,
                                ]}
                              >
                                {batch.status === 'PAID' ? '✓ PAID' : batch.status === 'PROCESSING' ? '🟡 PROCESSING' : batch.status === 'FAILED' ? '❌ FAILED' : '🔒 ON HOLD'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.batchDate}>{batch.dateRange} • {batch.orderCount} orders</Text>
                          <Text style={styles.batchBank}>{batch.destinationBank}</Text>

                          {/* UTR Chip with 1-tap Copy */}
                          {batch.status === 'PAID' && (
                            <View style={styles.utrWrap}>
                              {displayUtr ? (
                                <TouchableOpacity
                                  style={styles.utrChip}
                                  onPress={() => handleCopyUtr(displayUtr, batch.id)}
                                  accessibilityLabel={`Copy UTR ${displayUtr}`}
                                >
                                  <Text style={styles.utrChipText}>{displayUtr}</Text>
                                  <Text style={styles.copyIcon}>{copiedUtrId === batch.id ? '✓' : '📋'}</Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={styles.missingUtrText}>⚠️ UTR Pending Bank Generation</Text>
                              )}
                              {copiedUtrId === batch.id && (
                                <Text style={styles.copiedToastText}>✓ Copied UTR to clipboard!</Text>
                              )}
                            </View>
                          )}

                          {/* Actionable Failure Banner */}
                          {batch.status === 'FAILED' && (
                            <View style={styles.failureBox}>
                              <Text style={styles.failureText}>🚫 Failure Reason: {batch.failureReason}</Text>
                              <TouchableOpacity
                                style={styles.supportActionBtn}
                                onPress={() =>
                                  Alert.alert(
                                    'Contact Finance Support',
                                    'Bank transfer retries are managed by GlowVAI Finance Tower after bank profile correction. A ticket has been created for your store.'
                                  )
                                }
                              >
                                <Text style={styles.supportActionBtnText}>Contact GlowVAI Finance Support 🛡️ →</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        <View style={styles.batchRight}>
                          <Text style={styles.batchNetAmount}>₹{batch.netPayout.toLocaleString('en-IN')}</Text>
                          <Text style={styles.batchGrossSub}>Gross Sales: ₹{batch.grossAmount.toLocaleString('en-IN')}</Text>
                          <Text style={styles.inspectHint}>Inspect Breakdown →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* ── ITEMIZED INVOICE BREAKDOWN DRAWER MODAL ─────────────────────────── */}
      <Modal visible={!!selectedBatch} transparent animationType="fade" onRequestClose={() => setSelectedBatch(null)}>
        {selectedBatch && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Settlement Tax Invoice & UTR Receipt</Text>
                  <Text style={styles.modalSub}>{selectedBatch.cycleName} ({selectedBatch.id})</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBatch(null)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Gross Customer Sales ({selectedBatch.orderCount} orders)</Text>
                  <Text style={styles.breakdownVal}>₹{selectedBatch.grossAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>GlowVAI Platform Fee (12%)</Text>
                  <Text style={[styles.breakdownVal, { color: COLOR_DANGER }]}>
                    −₹{selectedBatch.platformFee.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>GST on Fee (18% on platform fee)</Text>
                  <Text style={[styles.breakdownVal, { color: COLOR_SLATE }]}>
                    −₹{selectedBatch.gstOnFee.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>TCS Deduction (1% under Section 52)</Text>
                  <Text style={[styles.breakdownVal, { color: COLOR_SLATE }]}>
                    −₹{selectedBatch.tcsDeduction.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>TDS Deduction (1% under Section 194O)</Text>
                  <Text style={[styles.breakdownVal, { color: COLOR_SLATE }]}>
                    −₹{selectedBatch.tdsDeduction.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Customer Refunds & Adjustments</Text>
                  <Text style={[styles.breakdownVal, { color: COLOR_DANGER }]}>
                    −₹{selectedBatch.refunds.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>Final Net Settled Payout</Text>
                  <Text style={styles.breakdownTotalVal}>₹{selectedBatch.netPayout.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.utrDetailBox}>
                  <Text style={styles.utrDetailTitle}>UTR REFERENCE NUMBER</Text>
                  <Text style={styles.utrDetailCode}>{selectedBatch.utr || 'Pending Bank Generation'}</Text>
                  <Text style={styles.utrDetailSub}>Destination Bank: {selectedBatch.destinationBank}</Text>
                </View>
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => handleDownloadBatchReceipt(selectedBatch)}
                >
                  <Text style={styles.modalSecondaryBtnText}>📥 Print A4 PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => setSelectedBatch(null)}
                >
                  <Text style={styles.modalPrimaryBtnText}>Close Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* EXPORT FAILURE MODAL */}
      <Modal visible={showExportError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>⚠️ Receipt Download Failed</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12 }}>
              Could not generate PDF receipt for settlement batch due to central server network timeout. Verify connection and try again.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowExportError(false)}>
              <Text style={styles.modalPrimaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Left Rail */
  navRail: {
    width: 240,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railNavGroup: {
    gap: 4,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  railNavLabel: {
    fontSize: 13,
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
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  railHelpText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Main Console */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
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
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  verifiedPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerExportBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  headerExportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Banners */
  offlineBanner: {
    backgroundColor: COLOR_AMBER,
    paddingVertical: 6,
    paddingHorizontal: Spacing.xl,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  staleBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  staleBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  deniedBanner: {
    backgroundColor: Colors.dangerLight,
    paddingVertical: 8,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dangerBorder,
  },
  deniedBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    textAlign: 'center',
  },

  /* Scroll Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  maxContentContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  /* Dev Simulation Strip */
  devStrip: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  devTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  devPillRow: {
    gap: Spacing.xs,
  },
  devPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  devPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  devPillTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: COLOR_ROYAL_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  statusPillProcessing: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  heroStatusTextProcessing: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FDE68A',
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroSchedule: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  destBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  destLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  destValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  helperBox: {
    marginTop: 4,
  },
  helperText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 15,
  },

  /* Errors & Cards */
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_DANGER,
  },
  errorSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLOR_DANGER,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    marginTop: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  cardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  filterPillRow: {
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

  batchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  batchLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cycleName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusProcessing: { backgroundColor: Colors.warningLight },
  statusFailed: { backgroundColor: Colors.dangerLight },
  statusHold: { backgroundColor: Colors.surface },

  statusBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  statusTextPaid: { color: COLOR_EMERALD },
  statusTextProcessing: { color: COLOR_AMBER },
  statusTextFailed: { color: COLOR_DANGER },
  statusTextHold: { color: Colors.textSecondary },

  batchDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  batchBank: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },

  utrWrap: {
    marginTop: Spacing.xs,
  },
  utrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  utrChipText: {
    fontSize: 12,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  copyIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  copiedToastText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
    marginTop: 4,
  },
  missingUtrText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_AMBER,
    marginTop: 4,
  },

  failureBox: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  failureText: {
    fontSize: 12,
    color: COLOR_DANGER,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  supportActionBtn: {
    marginTop: 6,
  },
  supportActionBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  batchRight: {
    alignItems: 'flex-end',
  },
  batchNetAmount: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  batchGrossSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  inspectHint: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginTop: 12,
  },

  /* Modal Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 560,
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
    fontSize: 17,
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
  closeModalBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 22,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownVal: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breakdownTotalVal: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_EMERALD,
  },

  utrDetailBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  utrDetailTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  utrDetailCode: {
    fontSize: 14,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginTop: 2,
  },
  utrDetailSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.input,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  modalSecondaryBtnText: {
    color: COLOR_ROYAL_BLUE,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: BorderRadii.input,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default withComingSoon(PayoutDetailScreen, 'Settlements & UTR');
