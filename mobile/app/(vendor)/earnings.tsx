/**
 * SCREEN 21 — Financial Revenue Ledger & Merchant Payout Hub
 * File: mobile/app/(vendor)/earnings.tsx
 * Desktop 1440x1024 Merchant Financial Console for GlowVAI Vendor
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
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import AppHeader from '../../src/components/AppHeader';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

export interface LedgerItem {
  id: string;
  orderId: string;
  date: string;
  time: string;
  customerName: string;
  grossAmount: number;
  platformFee: number; // 12%
  refundAmount: number;
  netPayout: number;
  payoutStatus: 'SETTLED' | 'PENDING' | 'REFUNDED';
  hasRefundAdjustment: boolean;
}

const MOCK_LEDGER_DATA: LedgerItem[] = [
  {
    id: 'led-1',
    orderId: 'GV-9912',
    date: '07 Oct 2026',
    time: '01:30 PM',
    customerName: 'Priya S.',
    grossAmount: 1450,
    platformFee: 174,
    refundAmount: 0,
    netPayout: 1276,
    payoutStatus: 'PENDING',
    hasRefundAdjustment: false,
  },
  {
    id: 'led-2',
    orderId: 'GV-9910',
    date: '07 Oct 2026',
    time: '11:15 AM',
    customerName: 'Ananya R.',
    grossAmount: 2800,
    platformFee: 336,
    refundAmount: 0,
    netPayout: 2464,
    payoutStatus: 'PENDING',
    hasRefundAdjustment: false,
  },
  {
    id: 'led-3',
    orderId: 'GV-9908',
    date: '06 Oct 2026',
    time: '05:45 PM',
    customerName: 'Kavitha M.',
    grossAmount: 1850,
    platformFee: 222,
    refundAmount: 350,
    netPayout: 1278,
    payoutStatus: 'REFUNDED',
    hasRefundAdjustment: true,
  },
  {
    id: 'led-4',
    orderId: 'GV-9904',
    date: '06 Oct 2026',
    time: '02:10 PM',
    customerName: 'Sujatha K.',
    grossAmount: 3200,
    platformFee: 384,
    refundAmount: 0,
    netPayout: 2816,
    payoutStatus: 'SETTLED',
    hasRefundAdjustment: false,
  },
  {
    id: 'led-5',
    orderId: 'GV-9899',
    date: '05 Oct 2026',
    time: '06:20 PM',
    customerName: 'Divya P.',
    grossAmount: 950,
    platformFee: 114,
    refundAmount: 0,
    netPayout: 836,
    payoutStatus: 'SETTLED',
    hasRefundAdjustment: false,
  },
];

const WEEKLY_CHART_POINTS = [
  { day: 'Mon', date: 'Oct 1', net: 4200, gross: 4772, orders: 4 },
  { day: 'Tue', date: 'Oct 2', net: 6800, gross: 7727, orders: 6 },
  { day: 'Wed', date: 'Oct 3', net: 8900, gross: 10113, orders: 8 },
  { day: 'Thu', date: 'Oct 4', net: 5100, gross: 5795, orders: 5 },
  { day: 'Fri', date: 'Oct 5', net: 11200, gross: 12727, orders: 11 },
  { day: 'Sat', date: 'Oct 6', net: 9450, gross: 10738, orders: 9 },
  { day: 'Sun', date: 'Oct 7', net: 3740, gross: 4250, orders: 3 },
];

function EarningsScreen() {
  const router = useRouter();
  const { vendor } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Screen State
  const [dateRange, setDateRange] = useState<'this_week' | 'this_month' | 'custom'>('this_month');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartMetric, setChartMetric] = useState<'net' | 'gross' | 'orders'>('net');
  const [payoutFilter, setPayoutFilter] = useState<'ALL' | 'SETTLED' | 'PENDING' | 'REFUNDED'>('ALL');
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(false);
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edge & Simulation States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isStaleData, setIsStaleData] = useState<boolean>(false);
  const [isFetchFailed, setIsFetchFailed] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportError, setShowExportError] = useState<boolean>(false);
  const [forceEmptyState, setForceEmptyState] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Financial Revenue Ledger | GlowVAI Vendor Console';
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setIsFetchFailed(false);
    }, 800);
  };

  const backendSummary = useMemo(() => {
    return {
      netEarnings: 142850,
      prevNetEarnings: 125080,
      periodGrowthPct: '+14.2%',
      pendingPayout: 12450,
      settledPayout: 130400,
      nextSettlementDate: 'Tomorrow, Oct 8 (06:00 AM)',
      grossSales: 162330,
      platformFee: 19480, // 12%
      gstOnFee: 3506, // 18% on fee
      refunds: 1494,
      totalOrdersCount: 184,
    };
  }, [dateRange]);

  const filteredLedger = useMemo(() => {
    if (forceEmptyState) return [];
    return MOCK_LEDGER_DATA.filter((item) => {
      if (payoutFilter === 'ALL') return true;
      return item.payoutStatus === payoutFilter;
    });
  }, [payoutFilter, forceEmptyState]);

  const formatCurrency = (amount: number) => {
    if (isPrivacyMasked) return '••••••';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleExportStatement = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Tax Statement & Payout Summary Exported',
        'Your financial ledger CSV and GST Tax Invoice PDF have been downloaded and sent to your registered merchant email.'
      );
    }, 1000);
  };

  const maxChartVal = useMemo(() => {
    return Math.max(...WEEKLY_CHART_POINTS.map((p) => p[chartMetric]), 1);
  }, [chartMetric]);

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

              <TouchableOpacity style={[styles.railNavItem, styles.railNavItemActive]} activeOpacity={0.8}>
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
          <AppHeader
            title="Earnings"
            subtitle="Backend-Authoritative Finance • Benz Circle Store"
            showBell={true}
            showBack={true}
            rightActions={<CustomerAppRedirectButton storeName="Your store" />}
          />

          {/* System Edge State Simulation Strip */}
          {__DEV__ && (
          <View style={styles.devStrip}>
            <Text style={styles.devTitle}>TEST FINANCIAL EDGE STATES:</Text>
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
                <Text style={[styles.devPillText, isStaleData && styles.devPillTextActive]}>Stale Finance Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devPill, forceEmptyState && styles.devPillActive]}
                onPress={() => setForceEmptyState(!forceEmptyState)}
              >
                <Text style={[styles.devPillText, forceEmptyState && styles.devPillTextActive]}>No Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devPill}
                onPress={() => setShowExportError(true)}
              >
                <Text style={styles.devPillText}>Export Error</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Edge State Banners */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                ⚡ Offline Mode — Displaying cached financial ledger data from last sync.
              </Text>
            </View>
          )}

          {isStaleData && (
            <TouchableOpacity style={styles.staleBanner} onPress={onRefresh}>
              <Text style={styles.staleBannerText}>
                ⚠️ Finance sync delayed — figures cached 15 mins ago. Tap to re-sync with central ledger.
              </Text>
            </TouchableOpacity>
          )}

          {/* Main Scroll Content Container */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.maxContentContainer}>

              {/* DATE RANGE SELECTOR & COMPARISON BAR */}
              <View style={styles.toolbarCard}>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.dateFilterPill, dateRange === 'this_week' && styles.dateFilterPillActive]}
                    onPress={() => setDateRange('this_week')}
                  >
                    <Text style={[styles.dateFilterText, dateRange === 'this_week' && styles.dateFilterTextActive]}>
                      This Week
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateFilterPill, dateRange === 'this_month' && styles.dateFilterPillActive]}
                    onPress={() => setDateRange('this_month')}
                  >
                    <Text style={[styles.dateFilterText, dateRange === 'this_month' && styles.dateFilterTextActive]}>
                      This Month
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateFilterPill, dateRange === 'custom' && styles.dateFilterPillActive]}
                    onPress={() => setDateRange('custom')}
                  >
                    <Text style={[styles.dateFilterText, dateRange === 'custom' && styles.dateFilterTextActive]}>
                      Custom Range
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.comparisonControlText}>Comparison: vs Previous 30 Days (01 Aug – 31 Aug 2026)</Text>
              </View>

              {/* ── 1. HERO FINANCIAL CARD ("Your net earnings") ────────────────────────────── */}
              {isLoading ? (
                <View style={[styles.heroCard, { backgroundColor: '#CBD5E1' }]}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 8 }}>Loading financial console...</Text>
                </View>
              ) : isFetchFailed ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Failed to load financial revenue data</Text>
                  <Text style={styles.errorSub}>The backend financial service did not respond. Check network connection.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                    <Text style={styles.retryBtnText}>Retry Sync</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View>
                      <Text style={styles.heroSubtitle}>YOUR NET EARNINGS (88% MERCHANT SHARE)</Text>
                      <Text style={styles.heroAmount}>{formatCurrency(backendSummary.netEarnings)}</Text>
                    </View>
                    <View style={styles.growthBadge}>
                      <Text style={styles.growthBadgeText}>{backendSummary.periodGrowthPct} vs prev period</Text>
                    </View>
                  </View>

                  <Text style={styles.heroPeriodText}>01 Sep – 30 Sep 2026 • Backend-Authoritative Math</Text>

                  {/* BALANCE STRIP */}
                  <View style={styles.balanceStrip}>
                    <View style={styles.balanceCol}>
                      <Text style={styles.balanceLabel}>Pending Payout</Text>
                      <Text style={styles.balanceValPending}>{formatCurrency(backendSummary.pendingPayout)}</Text>
                    </View>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceCol}>
                      <Text style={styles.balanceLabel}>Settled Payout</Text>
                      <Text style={styles.balanceValSettled}>{formatCurrency(backendSummary.settledPayout)}</Text>
                    </View>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceCol}>
                      <Text style={styles.balanceLabel}>Next Settlement Date</Text>
                      <Text style={styles.balanceValDate}>{backendSummary.nextSettlementDate}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ── 2. COMPACT 5-CARD METRIC STRIP ──────────────────────────────── */}
              {!isLoading && !isFetchFailed && (
                <View style={styles.metricStripRow}>
                  <View style={styles.metricCardItem}>
                    <Text style={styles.metricCardLabel}>GROSS SALES</Text>
                    <Text style={styles.metricCardVal}>{formatCurrency(backendSummary.grossSales)}</Text>
                    <Text style={styles.metricCardSub}>100% Customer Paid</Text>
                  </View>

                  <View style={styles.metricCardItem}>
                    <Text style={styles.metricCardLabel}>PLATFORM FEE</Text>
                    <Text style={[styles.metricCardVal, { color: COLOR_DANGER }]}>−{formatCurrency(backendSummary.platformFee)}</Text>
                    <Text style={styles.metricCardSub}>12% Commission</Text>
                  </View>

                  <View style={styles.metricCardItem}>
                    <Text style={styles.metricCardLabel}>PENDING PAYOUT</Text>
                    <Text style={[styles.metricCardVal, { color: COLOR_AMBER }]}>{formatCurrency(backendSummary.pendingPayout)}</Text>
                    <Text style={styles.metricCardSub}>Awaiting Settlement</Text>
                  </View>

                  <View style={styles.metricCardItem}>
                    <Text style={styles.metricCardLabel}>SETTLED PAYOUT</Text>
                    <Text style={[styles.metricCardVal, { color: COLOR_EMERALD }]}>{formatCurrency(backendSummary.settledPayout)}</Text>
                    <Text style={styles.metricCardSub}>Credited via IMPS</Text>
                  </View>

                  <View style={styles.metricCardItem}>
                    <Text style={styles.metricCardLabel}>TOTAL ORDERS</Text>
                    <Text style={styles.metricCardVal}>{backendSummary.totalOrdersCount}</Text>
                    <Text style={styles.metricCardSub}>Verified Orders</Text>
                  </View>
                </View>
              )}

              {/* ── 3. TWO-COLUMN ANALYSIS AREA ─────────────────────────────────── */}
              {!isLoading && !isFetchFailed && (
                <View style={styles.analysisTwoColGrid}>
                  
                  {/* Left Column: Revenue Breakdown Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={styles.cardTitle}>REVENUE BREAKDOWN & FEE SPLIT</Text>
                        <Text style={styles.cardSub}>Flat 12% GlowVAI fulfillment fee + 18% GST on fee</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsActionBtn}
                        onPress={() => setShowFeeModal(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailsActionText}>View Fee Details →</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Split Progress Bar */}
                    <View style={styles.splitTrack}>
                      <View style={[styles.splitFillVendor, { width: '88%' }]} />
                      <View style={[styles.splitFillFee, { width: '12%' }]} />
                    </View>

                    <View style={styles.splitLegendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLOR_EMERALD }]} />
                        <Text style={styles.legendText}>
                          Vendor Net Share (88%): <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{formatCurrency(backendSummary.netEarnings)}</Text>
                        </Text>
                      </View>

                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLOR_ROYAL_BLUE }]} />
                        <Text style={styles.legendText}>
                          Platform Fee (12%): <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{formatCurrency(backendSummary.platformFee)}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right Column: Payout Status Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={styles.cardTitle}>PAYOUT STATUS & SETTLEMENTS</Text>
                        <Text style={styles.cardSub}>RBI T+1 IMPS Payout Schedule</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsActionBtn}
                        onPress={() => router.push('/(vendor)/earnings')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailsActionText}>View UTRs →</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.payoutStatusGrid}>
                      <View style={styles.payoutStatusItem}>
                        <Text style={styles.payoutStatusLabel}>Pending Bank Settlement</Text>
                        <Text style={styles.payoutStatusValPending}>{formatCurrency(backendSummary.pendingPayout)}</Text>
                      </View>

                      <View style={styles.payoutStatusItem}>
                        <Text style={styles.payoutStatusLabel}>Settled to HDFC Bank</Text>
                        <Text style={styles.payoutStatusValSettled}>{formatCurrency(backendSummary.settledPayout)}</Text>
                      </View>
                    </View>

                    <Text style={styles.payoutNextDateText}>Next Payout Schedule: {backendSummary.nextSettlementDate}</Text>
                  </View>

                </View>
              )}

              {/* ── 4. CHART / TABLE WORKSPACE ──────────────────────────────────── */}
              {!isLoading && !isFetchFailed && (
                <View style={styles.card}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleGroup}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'chart' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('chart')}
                      >
                        <Text style={[styles.toggleBtnText, viewMode === 'chart' && styles.toggleBtnTextActive]}>
                          📊 Chart View
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('table')}
                      >
                        <Text style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}>
                          📋 Ledger Table
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {viewMode === 'chart' && (
                      <View style={styles.metricGroup}>
                        {(['net', 'gross', 'orders'] as const).map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[styles.metricChip, chartMetric === m && styles.metricChipActive]}
                            onPress={() => setChartMetric(m)}
                          >
                            <Text style={[styles.metricChipText, chartMetric === m && styles.metricChipTextActive]}>
                              {m === 'net' ? 'Net Earnings' : m === 'gross' ? 'Gross Sales' : 'Order Count'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* CHART VIEW CONTENT */}
                  {viewMode === 'chart' && (
                    <View style={styles.chartContainer}>
                      <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>
                          {chartMetric === 'net'
                            ? 'Net Earnings Velocity (88% Share)'
                            : chartMetric === 'gross'
                            ? 'Gross Sales Volume'
                            : 'Daily Order Count'}
                        </Text>
                        <TouchableOpacity onPress={() => setViewMode('table')}>
                          <Text style={styles.linkText}>View as Table →</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Bars */}
                      <View style={styles.barWrap}>
                        {WEEKLY_CHART_POINTS.map((pt) => {
                          const val = pt[chartMetric];
                          const fillPct = maxChartVal > 0 ? (val / maxChartVal) * 100 : 0;
                          return (
                            <View key={pt.day} style={styles.barCol}>
                              <Text style={styles.barValueText}>
                                {chartMetric === 'orders' ? val : `₹${(val / 1000).toFixed(1)}k`}
                              </Text>
                              <View style={styles.barTrack}>
                                <View
                                  style={[
                                    styles.barFill,
                                    { height: `${Math.max(fillPct, 8)}%` },
                                    chartMetric === 'net'
                                      ? { backgroundColor: COLOR_EMERALD }
                                      : chartMetric === 'gross'
                                      ? { backgroundColor: COLOR_ROYAL_BLUE }
                                      : { backgroundColor: COLOR_AMBER },
                                  ]}
                                />
                              </View>
                              <Text style={styles.barLabel}>{pt.day}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* TABLE VIEW CONTENT (LEDGER TABLE) */}
                  {viewMode === 'table' && (
                    <View style={styles.tableContainer}>
                      {/* Payout Filter Pills */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                        {(['ALL', 'SETTLED', 'PENDING', 'REFUNDED'] as const).map((st) => (
                          <TouchableOpacity
                            key={st}
                            style={[styles.payoutFilterPill, payoutFilter === st && styles.payoutFilterPillActive]}
                            onPress={() => setPayoutFilter(st)}
                          >
                            <Text
                              style={[
                                styles.payoutFilterText,
                                payoutFilter === st && styles.payoutFilterTextActive,
                              ]}
                            >
                              {st === 'ALL' ? 'All Transactions' : st}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {filteredLedger.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyTitle}>No financial transactions found</Text>
                          <Text style={styles.emptySub}>No sales or payouts match your current date range or state filter.</Text>
                          {forceEmptyState && (
                            <TouchableOpacity style={styles.resetBtn} onPress={() => setForceEmptyState(false)}>
                              <Text style={styles.resetBtnText}>Restore Data</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        filteredLedger.map((item) => (
                          <View key={item.id} style={styles.ledgerRow}>
                            <View style={styles.ledgerLeft}>
                              <View style={styles.orderBadgeRow}>
                                <Text style={styles.ledgerOrderId}>Order #{item.orderId}</Text>
                                <View
                                  style={[
                                    styles.statusPill,
                                    item.payoutStatus === 'SETTLED'
                                      ? styles.statusSettled
                                      : item.payoutStatus === 'PENDING'
                                      ? styles.statusPending
                                      : styles.statusRefunded,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,
                                      item.payoutStatus === 'SETTLED'
                                        ? styles.statusTextSettled
                                        : item.payoutStatus === 'PENDING'
                                        ? styles.statusTextPending
                                        : styles.statusTextRefunded,
                                    ]}
                                  >
                                    {item.payoutStatus}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.ledgerMeta}>
                                {item.customerName} • {item.date} {item.time}
                              </Text>
                              {item.hasRefundAdjustment && (
                                <Text style={styles.refundWarningText}>
                                  ⚠️ Refund adjustment applied (−{formatCurrency(item.refundAmount)})
                                </Text>
                              )}
                            </View>

                            <View style={styles.ledgerRight}>
                              <Text style={styles.ledgerNet}>{formatCurrency(item.netPayout)}</Text>
                              <Text style={styles.ledgerGrossSub}>
                                Gross: {formatCurrency(item.grossAmount)} | Fee: <Text style={{ color: COLOR_DANGER }}>−{formatCurrency(item.platformFee)}</Text>
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* ── FEE DETAILS MODAL BOTTOM SHEET / DRAWER ─────────────────────────── */}
      <Modal visible={showFeeModal} transparent animationType="fade" onRequestClose={() => setShowFeeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Financial Breakdown & Fee Details</Text>
              <TouchableOpacity onPress={() => setShowFeeModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Customer Order Sales (100%)</Text>
                <Text style={styles.breakdownVal}>{formatCurrency(backendSummary.grossSales)}</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>GlowVAI Platform Fee (12%)</Text>
                <Text style={[styles.breakdownVal, { color: COLOR_DANGER }]}>
                  −{formatCurrency(backendSummary.platformFee)}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>GST on Fee (18% on platform fee)</Text>
                <Text style={[styles.breakdownVal, { color: COLOR_SLATE }]}>
                  −{formatCurrency(backendSummary.gstOnFee)}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Customer Refunds & Adjustments</Text>
                <Text style={[styles.breakdownVal, { color: COLOR_DANGER }]}>
                  −{formatCurrency(backendSummary.refunds)}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Final Net Vendor Payout (88%)</Text>
                <Text style={styles.breakdownTotalVal}>{formatCurrency(backendSummary.netEarnings)}</Text>
              </View>

              <View style={styles.modalInfoBox}>
                <Text style={styles.modalInfoText}>
                  ℹ️ GlowVAI operates a transparent 88/12 payout structure. Settled funds are credited to your registered bank account every morning at 06:00 AM via RBI T+1 IMPS.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowFeeModal(false)}>
              <Text style={styles.modalPrimaryBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EXPORT FAILURE MODAL */}
      <Modal visible={showExportError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>⚠️ Report Generation Failed</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12 }}>
              Unable to generate financial report PDF due to central server network timeout. Please verify connection and retry.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowExportError(false)}>
              <Text style={styles.modalPrimaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab="earnings" />
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

  /* Main Console Area */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
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
  iconBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadii.pill,
  },
  iconBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  exportBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Edge Banners */
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

  /* Dev Simulation Toolbar */
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

  toolbarCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dateFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateFilterText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  comparisonControlText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  growthBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  growthBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroPeriodText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  balanceStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    alignItems: 'center',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  balanceValPending: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FDE68A',
    marginTop: 2,
  },
  balanceValSettled: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#86EFAC',
    marginTop: 2,
  },
  balanceValDate: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Metric Strip (5 Cards) */
  metricStripRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCardItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  metricCardLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metricCardVal: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metricCardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* 2-Col Analysis Area */
  analysisTwoColGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
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
  detailsActionBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  detailsActionText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  splitTrack: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  splitFillVendor: {
    backgroundColor: COLOR_EMERALD,
    height: '100%',
  },
  splitFillFee: {
    backgroundColor: COLOR_ROYAL_BLUE,
    height: '100%',
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  payoutStatusGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  payoutStatusItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
  },
  payoutStatusLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  payoutStatusValPending: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_AMBER,
    marginTop: 2,
  },
  payoutStatusValSettled: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_EMERALD,
    marginTop: 2,
  },
  payoutNextDateText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Chart / Table Toggle */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.pill,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  metricGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  metricChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  metricChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  chartContainer: {
    paddingTop: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  barWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: 20,
    height: 90,
    backgroundColor: Colors.border,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
  },

  /* Ledger Table */
  tableContainer: {
    paddingTop: 4,
  },
  filterPillsRow: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  payoutFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  payoutFilterText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  payoutFilterTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ledgerLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ledgerOrderId: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  statusSettled: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: Colors.warningLight,
  },
  statusRefunded: {
    backgroundColor: Colors.dangerLight,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusTextSettled: {
    color: COLOR_EMERALD,
  },
  statusTextPending: {
    color: COLOR_AMBER,
  },
  statusTextRefunded: {
    color: COLOR_DANGER,
  },
  ledgerMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refundWarningText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    marginTop: 2,
  },
  ledgerRight: {
    alignItems: 'flex-end',
  },
  ledgerNet: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ledgerGrossSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* Empty & Error Cards */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    marginTop: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
  },

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

  /* Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
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
  modalInfoBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    marginTop: Spacing.md,
  },
  modalInfoText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_ROYAL_BLUE,
    lineHeight: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: BorderRadii.input,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default withComingSoon(EarningsScreen, 'Earnings');
