/**
 * SCREEN 19: Ratings & Customer Reviews
 * Desktop 1440x1024 Store Quality Analytics & Merchant Reply Workstation
 * File: mobile/app/(vendor)/reviews.tsx
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

export interface CustomerReviewItem {
  reviewId: string;
  customerFirstName: string; // Privacy safe: "Priya S."
  stars: number;
  date: string;
  productName: string;
  orderId: string;
  reviewText: string;
  categoryTag: 'Product quality' | 'Packaging' | 'Order accuracy' | 'Delivery readiness';
  verifiedPurchase: boolean;
  vendorReply?: {
    text: string;
    postedAt: string;
    status: 'Published' | 'Pending Moderation' | 'Rejected';
    moderationReason?: string;
  };
  draftReply?: string;
}

const INITIAL_REVIEWS: CustomerReviewItem[] = [
  {
    reviewId: 'REV-101',
    customerFirstName: 'Priya S.',
    stars: 5,
    date: '05 Oct 2026',
    productName: 'Minimalist 10% Niacinamide Serum 30ml',
    orderId: 'GV-9908',
    reviewText: 'Original authentic batch with fresh packaging! Quick 10-minute delivery to Benz Circle.',
    categoryTag: 'Product quality',
    verifiedPurchase: true,
  },
  {
    reviewId: 'REV-102',
    customerFirstName: 'Kavitha M.',
    stars: 4,
    date: '04 Oct 2026',
    productName: 'Maybelline Fit Me Foundation (120 Ivory)',
    orderId: 'GV-9912',
    reviewText: 'Good shade match and intact seal. Outer box had slight transit crease but product is perfect.',
    categoryTag: 'Packaging',
    verifiedPurchase: true,
    vendorReply: {
      text: 'Thank you Kavitha! We are reinforcing our bubble-wrap packaging for foundation glass bottles.',
      postedAt: '04 Oct 2026',
      status: 'Published',
    },
  },
  {
    reviewId: 'REV-103',
    customerFirstName: 'Ananya R.',
    stars: 5,
    date: '02 Oct 2026',
    productName: 'Dot & Key Watermelon Sunscreen SPF 50',
    orderId: 'GV-9901',
    reviewText: 'Super fast packing! Shelf bin tag showed fresh stock. Love purchasing from Sri Lakshmi store.',
    categoryTag: 'Delivery readiness',
    verifiedPurchase: true,
  },
  {
    reviewId: 'REV-104',
    customerFirstName: 'Sujatha K.',
    stars: 3,
    date: '30 Sep 2026',
    productName: 'Cetaphil Gentle Skin Cleanser 125ml',
    orderId: 'GV-9884',
    reviewText: 'Delivered correct item but cap lock clip was slightly loose. No leak though.',
    categoryTag: 'Order accuracy',
    verifiedPurchase: true,
  },
  {
    reviewId: 'REV-105',
    customerFirstName: 'Divya P.',
    stars: 5,
    date: '28 Sep 2026',
    productName: 'Plum BodyLovin’ Vanilla EDP 50ml',
    orderId: 'GV-9870',
    reviewText: 'Genuine fragrance lot with long expiry date! Will order again.',
    categoryTag: 'Product quality',
    verifiedPurchase: true,
  },
];

const WEEKLY_TREND_DATA = [
  { period: 'Week 1 (Sep 1-7)', avg: 4.72, reviews: 10, direction: '▲ +0.05' },
  { period: 'Week 2 (Sep 8-14)', avg: 4.78, reviews: 12, direction: '▲ +0.06' },
  { period: 'Week 3 (Sep 15-21)', avg: 4.81, reviews: 14, direction: '▲ +0.03' },
  { period: 'Week 4 (Sep 22-28)', avg: 4.84, reviews: 12, direction: '▲ +0.03' },
  { period: 'Current (Oct 1-8)', avg: 4.88, reviews: 18, direction: '▲ +0.04' },
];

function ReviewsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [reviews, setReviews] = useState<CustomerReviewItem[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [viewTrendTable, setViewTrendTable] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'Overall' | 'Product quality' | 'Packaging' | 'Order accuracy'>('Overall');

  // Reply Drawer / Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CustomerReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyValidationError, setReplyValidationError] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; undoAction?: () => void } | null>(null);

  // System Edge States
  const [failedFetch, setFailedFetch] = useState(false);
  const [moderationPendingDemo, setModerationPendingDemo] = useState(false);
  const [rejectedReplyDemo, setRejectedReplyDemo] = useState(false);
  const [permissionDeniedDemo, setPermissionDeniedDemo] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Ratings & Customer Reviews | GlowVAI Vendor Console';
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Dynamic Rating Calculations
  const totalVerifiedCount = reviews.length;
  const overallAvgRating = useMemo(() => {
    if (totalVerifiedCount === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + r.stars, 0);
    return (sum / totalVerifiedCount).toFixed(2);
  }, [reviews, totalVerifiedCount]);

  const unrepliedCount = useMemo(() => {
    return reviews.filter(r => !r.vendorReply).length;
  }, [reviews]);

  // Breakdown metrics
  const categoryBreakdown = useMemo(() => {
    const calc = (cat: CustomerReviewItem['categoryTag']) => {
      const catReviews = reviews.filter(r => r.categoryTag === cat);
      if (catReviews.length === 0) return { avg: '5.0', percent: 100, count: 0 };
      const sum = catReviews.reduce((acc, r) => acc + r.stars, 0);
      const avg = (sum / catReviews.length).toFixed(1);
      const percent = Math.round((parseFloat(avg) / 5) * 100);
      return { avg, percent, count: catReviews.length };
    };

    return {
      productQuality: calc('Product quality'),
      packaging: calc('Packaging'),
      orderAccuracy: calc('Order accuracy'),
      deliveryReadiness: calc('Delivery readiness'),
    };
  }, [reviews]);

  // Filtered Reviews List
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (selectedFilter === 'Unreplied') return !r.vendorReply;
      if (selectedFilter === '5 star') return r.stars === 5;
      if (selectedFilter === '4 star') return r.stars === 4;
      if (selectedFilter === '3 star and below') return r.stars <= 3;
      if (
        selectedFilter === 'Product quality' ||
        selectedFilter === 'Packaging' ||
        selectedFilter === 'Order accuracy'
      ) {
        return r.categoryTag === selectedFilter;
      }
      return true;
    });
  }, [reviews, selectedFilter]);

  // Contact / Link Guard Regex (prohibits phone numbers, emails, URLs, UPI IDs)
  const contactGuardRegex = /(\+?\d{10,12}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\bupi\b|http|www\.)/i;

  const validateReply = (text: string) => {
    if (!text.trim()) {
      setReplyValidationError('Please enter a reply message.');
      return false;
    }
    if (contactGuardRegex.test(text)) {
      setReplyValidationError('🚫 Policy Violation: Replies must NOT contain phone numbers, emails, external links, or UPI handles.');
      return false;
    }
    setReplyValidationError('');
    return true;
  };

  const handleOpenReplyDrawer = (r: CustomerReviewItem) => {
    setSelectedReview(r);
    setReplyText(r.draftReply || (r.vendorReply ? r.vendorReply.text : ''));
    setReplyValidationError('');
    setReplyModalOpen(true);
  };

  const handleSaveDraft = () => {
    if (!selectedReview) return;
    setReviews(prev =>
      prev.map(r => (r.reviewId === selectedReview.reviewId ? { ...r, draftReply: replyText } : r))
    );
    setReplyModalOpen(false);
    setToastMessage({ text: '💾 Reply draft saved locally' });
  };

  const handlePostReply = () => {
    if (permissionDeniedDemo) {
      setReplyValidationError('🔒 Permissions Error: Your merchant role (Store Operator) does not have reply privileges. Contact store manager.');
      return;
    }

    if (!selectedReview || !validateReply(replyText)) return;

    setSubmittingReply(true);

    const reviewId = selectedReview.reviewId;
    const isPending = moderationPendingDemo;
    const isRejected = rejectedReplyDemo;

    setTimeout(() => {
      setReviews(prev =>
        prev.map(r => {
          if (r.reviewId === reviewId) {
            return {
              ...r,
              draftReply: undefined,
              vendorReply: {
                text: replyText,
                postedAt: 'Just now',
                status: isRejected ? 'Rejected' : isPending ? 'Pending Moderation' : 'Published',
                moderationReason: isRejected ? 'Reply contained prohibited external URL link or contact info.' : undefined,
              },
            };
          }
          return r;
        })
      );

      setSubmittingReply(false);
      setReplyModalOpen(false);

      if (isRejected) {
        setToastMessage({ text: '❌ Reply rejected by moderation engine: Contained contact details.' });
      } else if (isPending) {
        setToastMessage({ text: '⏳ Reply posted! Pending GlowVAI moderation review (Est. 15 mins).' });
      } else {
        setToastMessage({ text: '✓ Public reply posted successfully!' });
      }
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

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/returns')} activeOpacity={0.8}>
                <Text style={s.railNavIcon}>↩️</Text>
                <Text style={s.railNavLabel}>Returns</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
                <Text style={s.railNavIcon}>⭐</Text>
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Reviews</Text>
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
              <TouchableOpacity onPress={() => router.replace('/(vendor)/home')} style={s.backBtn} activeOpacity={0.8}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>

              <View>
                <View style={s.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.replace('/(vendor)/home')}>
                    <Text style={s.breadcrumbLink}>Home</Text>
                  </TouchableOpacity>
                  <Text style={s.breadcrumbSep}>/</Text>
                  <Text style={s.breadcrumbCurrent}>Ratings & reviews</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Ratings & reviews</Text>
                  <View style={s.verifiedPill}>
                    <Text style={s.verifiedPillText}>✓ 100% Verified Customer Orders</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              {/* Date Range Selector */}
              <TouchableOpacity style={s.dateRangeDropdown} activeOpacity={0.8}>
                <Text style={s.dateRangeDropdownText}>📅 {dateRange} ▾</Text>
              </TouchableOpacity>

              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* System Edge State Simulation Strip */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST REVIEWS EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, loading && s.simChipActive]}
                onPress={() => setLoading(!loading)}
              >
                <Text style={[s.simChipText, loading && s.simChipTextActive]}>Skeleton Loaders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, failedFetch && s.simChipActive]}
                onPress={() => setFailedFetch(!failedFetch)}
              >
                <Text style={[s.simChipText, failedFetch && s.simChipTextActive]}>Failed Fetch Error</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, moderationPendingDemo && s.simChipActive]}
                onPress={() => setModerationPendingDemo(!moderationPendingDemo)}
              >
                <Text style={[s.simChipText, moderationPendingDemo && s.simChipTextActive]}>Pending Moderation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, rejectedReplyDemo && s.simChipActive]}
                onPress={() => setRejectedReplyDemo(!rejectedReplyDemo)}
              >
                <Text style={[s.simChipText, rejectedReplyDemo && s.simChipTextActive]}>Rejected Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, permissionDeniedDemo && s.simChipActive]}
                onPress={() => setPermissionDeniedDemo(!permissionDeniedDemo)}
              >
                <Text style={[s.simChipText, permissionDeniedDemo && s.simChipTextActive]}>Permission Denied</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {failedFetch && (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>⚠️ Failed to fetch customer reviews from GlowVAI central API. Check network connection.</Text>
              <TouchableOpacity onPress={() => setFailedFetch(false)}>
                <Text style={s.errorBannerLink}>Retry Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {/* ── 1. DYNAMIC WIDE RATING SUMMARY CARD ───────────────────────── */}
              {loading ? (
                <View style={s.summaryCardSkeleton}>
                  <View style={s.skeletonCircle} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={s.skeletonLineShort} />
                    <View style={s.skeletonLineLong} />
                  </View>
                </View>
              ) : (
                <View style={s.summaryCard}>
                  <View style={s.scoreBox}>
                    <Text style={s.scoreValText}>{overallAvgRating}</Text>
                    <Text style={s.starsRow}>★ ★ ★ ★ ★</Text>
                    <Text style={s.countSubText}>based on {totalVerifiedCount} verified customer ratings</Text>
                    <View style={s.periodCompareTag}>
                      <Text style={s.periodCompareText}>▲ +0.12 vs previous 30d</Text>
                    </View>
                  </View>

                  <View style={s.breakdownCol}>
                    <Text style={s.breakdownHeaderTitle}>STORE QUALITY BENCHMARK BREAKDOWN</Text>

                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Product Quality</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${categoryBreakdown.productQuality.percent}%` }]} />
                      </View>
                      <Text style={s.barScore}>{categoryBreakdown.productQuality.avg}</Text>
                      <Text style={s.barCount}>({categoryBreakdown.productQuality.count} reviews)</Text>
                    </View>

                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Packaging</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${categoryBreakdown.packaging.percent}%` }]} />
                      </View>
                      <Text style={s.barScore}>{categoryBreakdown.packaging.avg}</Text>
                      <Text style={s.barCount}>({categoryBreakdown.packaging.count} reviews)</Text>
                    </View>

                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Order Accuracy</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${categoryBreakdown.orderAccuracy.percent}%` }]} />
                      </View>
                      <Text style={s.barScore}>{categoryBreakdown.orderAccuracy.avg}</Text>
                      <Text style={s.barCount}>({categoryBreakdown.orderAccuracy.count} reviews)</Text>
                    </View>

                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Delivery Readiness</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${categoryBreakdown.deliveryReadiness.percent}%` }]} />
                      </View>
                      <Text style={s.barScore}>{categoryBreakdown.deliveryReadiness.avg}</Text>
                      <Text style={s.barCount}>({categoryBreakdown.deliveryReadiness.count} reviews)</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ── 2. TREND SECTION WITH CHART / TABLE TOGGLE ───────────────── */}
              <View style={s.trendCard}>
                <View style={s.trendHeaderRow}>
                  <View>
                    <View style={s.trendTitleRow}>
                      <Text style={s.trendTitle}>RATING MOVEMENT TREND ({dateRange.toUpperCase()})</Text>
                      <Text style={s.metricBadge}>Metric: {selectedMetric}</Text>
                    </View>
                    <Text style={s.trendSub}>▲ +0.12 rating improvement over 30 days based on dark store fulfillment</Text>
                  </View>

                  <View style={s.trendControlsRight}>
                    {/* Metric Selectors */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.metricChipGroup}>
                      {(['Overall', 'Product quality', 'Packaging', 'Order accuracy'] as const).map(m => (
                        <TouchableOpacity
                          key={m}
                          style={[s.metricChip, selectedMetric === m && s.metricChipActive]}
                          onPress={() => setSelectedMetric(m)}
                        >
                          <Text style={[s.metricChipText, selectedMetric === m && s.metricChipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Chart / Table View Switcher */}
                    <TouchableOpacity
                      style={s.viewTableToggleBtn}
                      onPress={() => setViewTrendTable(!viewTrendTable)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.viewTableToggleBtnText}>
                        {viewTrendTable ? '📊 View Chart' : '📋 View as Table'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {viewTrendTable ? (
                  <View style={s.trendTable}>
                    <View style={s.tableHeaderRow}>
                      <Text style={s.tableHeaderCell}>Period</Text>
                      <Text style={s.tableHeaderCell}>Average Rating</Text>
                      <Text style={s.tableHeaderCell}>Verified Reviews</Text>
                      <Text style={s.tableHeaderCell}>Period Movement</Text>
                    </View>
                    {WEEKLY_TREND_DATA.map((row, idx) => (
                      <View key={idx} style={s.tableDataRow}>
                        <Text style={s.tableCell}>{row.period}</Text>
                        <Text style={s.tableCellBold}>{row.avg}</Text>
                        <Text style={s.tableCell}>{row.reviews} orders</Text>
                        <Text style={s.tableCellTrend}>{row.direction}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={s.compactTrendChartBox}>
                    {WEEKLY_TREND_DATA.map((w, idx) => (
                      <View key={idx} style={s.chartCol}>
                        <Text style={s.chartValText}>{w.avg}</Text>
                        <View style={s.chartBarTrack}>
                          <View style={[s.chartBarFill, { height: `${(w.avg / 5) * 100}%` }]} />
                        </View>
                        <Text style={s.chartLabelText}>{w.period}</Text>
                        <Text style={s.chartTrendText}>{w.direction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* ── 3. REVIEWS FILTER TOOLBAR WITH CLEAR COUNTS ────────────────── */}
              <View style={s.filterBarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
                  {[
                    { label: 'All', count: totalVerifiedCount },
                    { label: 'Unreplied', count: unrepliedCount },
                    { label: '5 star', count: reviews.filter(r => r.stars === 5).length },
                    { label: '4 star', count: reviews.filter(r => r.stars === 4).length },
                    { label: '3 star and below', count: reviews.filter(r => r.stars <= 3).length },
                    { label: 'Product quality', count: categoryBreakdown.productQuality.count },
                    { label: 'Packaging', count: categoryBreakdown.packaging.count },
                    { label: 'Order accuracy', count: categoryBreakdown.orderAccuracy.count },
                  ].map(f => {
                    const active = selectedFilter === f.label;
                    return (
                      <TouchableOpacity
                        key={f.label}
                        style={[s.filterPill, active && s.filterPillActive]}
                        onPress={() => setSelectedFilter(f.label)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.filterPillText, active && s.filterPillTextActive]}>
                          {f.label} ({f.count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── 4. DESKTOP REVIEW CARDS LIST / MATRIX ──────────────────────── */}
              {filteredReviews.length === 0 ? (
                <View style={s.emptyStateBox}>
                  <Text style={s.emptyIcon}>⭐</Text>
                  <Text style={s.emptyTitle}>
                    {selectedFilter === 'Unreplied'
                      ? '🎉 All customer reviews have been answered!'
                      : 'No customer reviews found'}
                  </Text>
                  <Text style={s.emptySub}>
                    {selectedFilter === 'Unreplied'
                      ? 'Great job maintaining store responsiveness!'
                      : 'Try selecting another rating or category filter.'}
                  </Text>
                </View>
              ) : (
                <View style={s.reviewsList}>
                  {filteredReviews.map(r => (
                    <View key={r.reviewId} style={s.reviewCard}>
                      {/* Card Header Row */}
                      <View style={s.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <View style={s.customerMetaRow}>
                            <Text style={s.customerNameText}>{r.customerFirstName}</Text>
                            <Text style={s.orderIdTag}>Order #{r.orderId}</Text>
                            {r.verifiedPurchase && (
                              <View style={s.verifiedMarkerChip}>
                                <Text style={s.verifiedMarkerChipText}>✓ Verified Customer Purchase</Text>
                              </View>
                            )}
                          </View>

                          <Text style={s.orderedItemText}>Product: {r.productName}</Text>
                        </View>

                        <View style={s.starsDateCol}>
                          <Text style={s.starsText}>{'★'.repeat(r.stars)}</Text>
                          <Text style={s.dateText}>{r.date}</Text>
                        </View>
                      </View>

                      {/* Review Quote Text */}
                      <Text style={s.reviewQuoteText}>"{r.reviewText}"</Text>

                      {/* Category Tag */}
                      <View style={s.categoryTagBox}>
                        <Text style={s.categoryTagText}>Quality Dimension: {r.categoryTag}</Text>
                      </View>

                      {/* Vendor Reply Thread / Action Footer */}
                      {r.vendorReply ? (
                        <View style={[
                          s.vendorReplyCard,
                          r.vendorReply.status === 'Pending Moderation' && { backgroundColor: Colors.warningLight, borderColor: Colors.warningBorder },
                          r.vendorReply.status === 'Rejected' && { backgroundColor: Colors.dangerLight, borderColor: Colors.dangerBorder },
                        ]}>
                          <View style={s.replyHeaderRow}>
                            <Text style={s.replyTitleText}>STORE OWNER PUBLIC REPLY ({r.vendorReply.postedAt}):</Text>

                            <View style={s.moderationStatusPill}>
                              <Text style={[
                                s.moderationStatusText,
                                r.vendorReply.status === 'Pending Moderation' && { color: Colors.warning },
                                r.vendorReply.status === 'Rejected' && { color: Colors.danger },
                              ]}>
                                {r.vendorReply.status === 'Pending Moderation' ? '⏳ Pending Moderation' : r.vendorReply.status === 'Rejected' ? '❌ Rejected' : '🟢 Live Public Reply'}
                              </Text>
                            </View>
                          </View>

                          <Text style={s.replyBodyText}>{r.vendorReply.text}</Text>

                          {r.vendorReply.moderationReason && (
                            <Text style={s.moderationReasonText}>
                              Moderation Note: {r.vendorReply.moderationReason}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <View style={s.cardFooterRow}>
                          {r.draftReply ? (
                            <Text style={s.draftSavedHintText}>💾 Draft saved locally</Text>
                          ) : (
                            <Text style={s.replyPolicyHintText}>Constructive merchant replies build customer trust & repeat orders</Text>
                          )}

                          <TouchableOpacity
                            style={s.replyActionBtn}
                            onPress={() => handleOpenReplyDrawer(r)}
                            activeOpacity={0.8}
                          >
                            <Text style={s.replyActionBtnText}>💬 Reply to Customer →</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* ── MERCHANT REPLY DRAWER / MODAL COMPOSER ──────────────────────────── */}
      {selectedReview && (
        <Modal
          visible={replyModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setReplyModalOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitleText}>Merchant Reply Composer: {selectedReview.customerFirstName}</Text>
                  <Text style={s.modalSubText}>Order #{selectedReview.orderId} • Product: {selectedReview.productName}</Text>
                </View>

                <TouchableOpacity onPress={() => setReplyModalOpen(false)} style={s.closeModalBtn}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Original Review Context Quote */}
                <View style={s.quoteCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={s.quoteStarsText}>{'★'.repeat(selectedReview.stars)}</Text>
                    <Text style={s.quoteTagText}>{selectedReview.categoryTag}</Text>
                  </View>
                  <Text style={s.quoteBodyText}>"{selectedReview.reviewText}"</Text>
                </View>

                {/* Reply Input Field */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Your Public Store Reply Message *</Text>
                  <TextInput
                    style={s.replyInput}
                    placeholder="Write a professional, constructive reply to customer feedback…"
                    placeholderTextColor={Colors.textMuted}
                    value={replyText}
                    onChangeText={text => {
                      setReplyText(text);
                      if (replyValidationError) validateReply(text);
                    }}
                    maxLength={500}
                    multiline
                    numberOfLines={4}
                  />

                  <View style={s.charCountRow}>
                    <Text style={s.charCountText}>{replyText.length} / 500 characters guidance</Text>
                  </View>

                  {replyValidationError !== '' && (
                    <Text style={s.errorText}>{replyValidationError}</Text>
                  )}
                </View>

                {/* Prohibited Content Reminder Banner */}
                <View style={s.reminderCard}>
                  <Text style={s.reminderText}>
                    🛡️ Policy Guidance: Replies are visible publicly on your store page. Do NOT include phone numbers, email addresses, external URLs, UPI handles, or personal customer information.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={s.modalActionsRow}>
                <TouchableOpacity style={s.saveDraftBtn} onPress={handleSaveDraft}>
                  <Text style={s.saveDraftBtnText}>Save Draft</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.postReplyPrimaryBtn}
                  onPress={handlePostReply}
                  disabled={submittingReply}
                >
                  {submittingReply ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={s.postReplyPrimaryBtnText}>Post Reply →</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Toast */}
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
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
  pageTitle: {
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
  dateRangeDropdown: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadii.pill,
  },
  dateRangeDropdownText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  /* Edge State Simulation Strip */
  simStripCard: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
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

  errorBanner: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  errorBannerLink: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    textDecorationLine: 'underline',
  },

  /* Scroll Content */
  scrollBody: {
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

  /* Dynamic Wide Summary Card */
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xl,
  },
  summaryCardSkeleton: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xl,
  },
  skeletonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.border,
  },
  skeletonLineShort: {
    width: '40%',
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  skeletonLineLong: {
    width: '80%',
    height: 18,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },

  scoreBox: {
    alignItems: 'center',
    minWidth: 160,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingRight: Spacing.lg,
  },
  scoreValText: {
    fontSize: 42,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  starsRow: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Colors.primary,
    marginVertical: 2,
  },
  countSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  periodCompareTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    marginTop: 6,
  },
  periodCompareText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  breakdownCol: {
    flex: 1,
    gap: 8,
  },
  breakdownHeaderTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 110,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  barScore: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 24,
  },
  barCount: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    width: 70,
  },

  /* Trend Card */
  trendCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  trendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trendTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metricBadge: {
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  trendSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
    marginTop: 2,
  },
  trendControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricChipGroup: {
    gap: 4,
  },
  metricChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  metricChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  viewTableToggleBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  viewTableToggleBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  compactTrendChartBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 140,
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartValText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  chartBarTrack: {
    width: 20,
    height: 70,
    backgroundColor: Colors.border,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  chartLabelText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  chartTrendText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  trendTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCell: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tableCellTrend: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  /* Filter Toolbar */
  filterBarContainer: {
    marginBottom: Spacing.xl,
  },
  filterScroll: {
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.card,
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

  /* Reviews List */
  reviewsList: {
    gap: Spacing.md,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  customerNameText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderIdTag: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  verifiedMarkerChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  verifiedMarkerChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  orderedItemText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  starsDateCol: {
    alignItems: 'flex-end',
  },
  starsText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Colors.primary,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reviewQuoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginVertical: Spacing.xs,
  },
  categoryTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  categoryTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  vendorReplyCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyTitleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  moderationStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
  },
  moderationStatusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  replyBodyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  moderationReasonText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    marginTop: 4,
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyPolicyHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  draftSavedHintText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  replyActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  replyActionBtnText: {
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
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
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

  /* Modal Overlay / Drawer */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalTitleText: {
    fontSize: 17,
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
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modalScroll: {
    flex: 1,
  },

  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  quoteStarsText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.primary,
  },
  quoteTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  quoteBodyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textPrimary,
  },

  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  replyInput: {
    height: 120,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    marginTop: 6,
  },

  reminderCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: Spacing.lg,
  },
  reminderText: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveDraftBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  postReplyPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postReplyPrimaryBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(ReviewsScreen, 'Reviews');
