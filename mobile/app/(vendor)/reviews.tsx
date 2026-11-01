/**
 * SCREEN 19: Ratings & Customer Reviews
 * Desktop 1440x1024 Store Quality Analytics & Merchant Reply Workstation
 * File: mobile/app/(vendor)/reviews.tsx
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

// Sample data for dev builds only. Production starts empty until a reviews API exists.
const SAMPLE_REVIEWS: CustomerReviewItem[] = [
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

const SAMPLE_TREND_DATA = [
  { period: 'Week 1 (Sep 1-7)', avg: 4.72, reviews: 10, direction: '▲ +0.05' },
  { period: 'Week 2 (Sep 8-14)', avg: 4.78, reviews: 12, direction: '▲ +0.06' },
  { period: 'Week 3 (Sep 15-21)', avg: 4.81, reviews: 14, direction: '▲ +0.03' },
  { period: 'Week 4 (Sep 22-28)', avg: 4.84, reviews: 12, direction: '▲ +0.03' },
  { period: 'Current (Oct 1-8)', avg: 4.88, reviews: 18, direction: '▲ +0.04' },
];

const INITIAL_REVIEWS: CustomerReviewItem[] = __DEV__ ? SAMPLE_REVIEWS : [];
const TREND_DATA = __DEV__ ? SAMPLE_TREND_DATA : [];

function ReviewsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const isCompact = width < 768;
  const gutter = isCompact ? Spacing.lg : Spacing.xl;

  const [reviews, setReviews] = useState<CustomerReviewItem[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [viewTrendTable, setViewTrendTable] = useState(false);

  // Reply Drawer / Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CustomerReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyValidationError, setReplyValidationError] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Toast
  const [toastText, setToastText] = useState<string | null>(null);

  // Dev-only edge states (test strip)
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
    if (toastText) {
      const timer = setTimeout(() => setToastText(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastText]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(vendor)/home');
    }
  };

  // Rating calculations, derived only from the reviews shown
  const totalVerifiedCount = reviews.length;
  const hasReviews = totalVerifiedCount > 0;
  const overallAvgRating = useMemo(() => {
    if (totalVerifiedCount === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.stars, 0);
    return (sum / totalVerifiedCount).toFixed(2);
  }, [reviews, totalVerifiedCount]);
  const starCount = overallAvgRating ? Math.round(parseFloat(overallAvgRating)) : 0;

  const unrepliedCount = useMemo(() => {
    return reviews.filter(r => !r.vendorReply).length;
  }, [reviews]);

  // Breakdown metrics
  const categoryBreakdown = useMemo(() => {
    type Breakdown = { avg: string | null; percent: number; count: number };
    const calc = (cat: CustomerReviewItem['categoryTag']): Breakdown => {
      const catReviews = reviews.filter(r => r.categoryTag === cat);
      if (catReviews.length === 0) return { avg: null, percent: 0, count: 0 };
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
      setReplyValidationError('Policy violation: replies must NOT contain phone numbers, emails, external links, or UPI handles.');
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
    setToastText('Draft saved on this screen only.');
  };

  const handlePostReply = () => {
    if (permissionDeniedDemo) {
      setReplyValidationError('Permissions error: your merchant role (Store Operator) does not have reply privileges. Contact store manager.');
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
        setToastText('Reply rejected by moderation: it contained contact details.');
      } else if (isPending) {
        setToastText('Reply submitted. It is pending GlowVAI moderation review.');
      } else {
        setToastText('Sample reply saved on this screen only. Nothing was sent to customers.');
      }
    }, 500);
  };

  const edgeChips = [
    { label: 'Skeleton Loaders', active: loading, toggle: () => setLoading(v => !v) },
    { label: 'Failed Fetch Error', active: failedFetch, toggle: () => setFailedFetch(v => !v) },
    { label: 'Pending Moderation', active: moderationPendingDemo, toggle: () => setModerationPendingDemo(v => !v) },
    { label: 'Rejected Reply', active: rejectedReplyDemo, toggle: () => setRejectedReplyDemo(v => !v) },
    { label: 'Permission Denied', active: permissionDeniedDemo, toggle: () => setPermissionDeniedDemo(v => !v) },
  ];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Left Navigation Rail ─────────────────────────────────────────────── */}
        {isExpanded && (
          <View style={s.navRail}>
            <View style={s.railBrandGroup}>
              <View style={s.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color={Colors.background} style={s.railBrandLogoIcon} />
              </View>
              <View>
                <Wordmark size={17} />
                <Text style={s.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={s.railNavGroup}>
              <TouchableOpacity style={s.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/returns')} activeOpacity={0.8}>
                <Ionicons name="arrow-undo-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Returns</Text>
              </TouchableOpacity>

              <View style={[s.railNavItem, s.railNavItemActive]}>
                <Ionicons name="star-outline" size={18} color={Colors.primary} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Reviews</Text>
              </View>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/messages')} activeOpacity={0.8}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Messages</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/earnings')} activeOpacity={0.8}>
                <Ionicons name="wallet-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.railNavLabel}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={s.railFooter}>
              <TouchableOpacity style={s.railHelpBtn} onPress={() => router.push('/(vendor)/support')} activeOpacity={0.8}>
                <Ionicons name="help-circle-outline" size={16} color={Colors.textMuted} />
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
              <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.8} accessibilityLabel="Go back">
                <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>

              <View style={s.headerTitleBlock}>
                <View style={s.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.replace('/(vendor)/home')} style={s.breadcrumbHit} activeOpacity={0.8}>
                    <Text style={s.breadcrumbLink}>Home</Text>
                  </TouchableOpacity>
                  <Text style={s.breadcrumbSep}>/</Text>
                  <Text style={s.breadcrumbCurrent}>Ratings & reviews</Text>
                </View>

                <View style={s.titleRow}>
                  <Text style={s.pageTitle}>Ratings & reviews</Text>
                  <View style={s.verifiedPill}>
                    <Text style={s.verifiedPillText}>Verified orders only</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* Dev-only edge state strip (sample data and simulated states) */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <View style={s.simTitleRow}>
              <Text style={s.simTitle}>TEST REVIEWS EDGE STATES:</Text>
              <View style={s.sampleChip}>
                <Text style={s.sampleChipText}>Sample data (dev only)</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              {edgeChips.map(chip => (
                <TouchableOpacity
                  key={chip.label}
                  style={[s.simChip, chip.active && s.simChipActive]}
                  onPress={chip.toggle}
                  activeOpacity={0.8}
                >
                  <Text style={[s.simChipText, chip.active && s.simChipTextActive]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          )}

          {__DEV__ && failedFetch && (
            <View style={s.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.danger} />
              <Text style={s.errorBannerText}>Sample error state: customer reviews could not be loaded.</Text>
              <TouchableOpacity onPress={() => setFailedFetch(false)} style={s.errorBannerDismiss} activeOpacity={0.8}>
                <Text style={s.errorBannerLink}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scroll Content Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={[s.scrollContent, { padding: gutter }]} showsVerticalScrollIndicator={false}>
            <View style={s.maxContentContainer}>

              {loading ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={s.loadingText}>Loading customer reviews…</Text>
                </View>
              ) : (
                <>
                  {/* ── 1. RATING SUMMARY CARD ─────────────────────────────────── */}
                  <View style={[s.summaryCard, isCompact && s.cardCompact, isCompact && s.stackCompact]}>
                    <View style={[s.scoreBox, isCompact && s.scoreBoxCompact]}>
                      {overallAvgRating ? (
                        <>
                          <Text style={s.scoreValText}>{overallAvgRating}</Text>
                          <Text style={s.starsRow}>{'★'.repeat(starCount)}{'☆'.repeat(5 - starCount)}</Text>
                          <Text style={s.countSubText}>
                            based on {totalVerifiedCount} verified customer {totalVerifiedCount === 1 ? 'rating' : 'ratings'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={s.scoreEmptyText}>No ratings yet</Text>
                          <Text style={s.countSubText}>Ratings appear after customers review delivered orders.</Text>
                        </>
                      )}
                    </View>

                    <View style={s.breakdownCol}>
                      <Text style={s.breakdownHeaderTitle}>QUALITY BREAKDOWN</Text>

                      {[
                        { label: 'Product Quality', data: categoryBreakdown.productQuality },
                        { label: 'Packaging', data: categoryBreakdown.packaging },
                        { label: 'Order Accuracy', data: categoryBreakdown.orderAccuracy },
                        { label: 'Delivery Readiness', data: categoryBreakdown.deliveryReadiness },
                      ].map(b => (
                        <View key={b.label} style={s.barRow}>
                          <Text style={s.barLabel} numberOfLines={1}>{b.label}</Text>
                          <View style={s.barBg}>
                            <View style={[s.barFill, { width: `${b.data.percent}%` }]} />
                          </View>
                          <Text style={s.barScore}>{b.data.avg ?? '—'}</Text>
                          <Text style={s.barCount}>({b.data.count} {b.data.count === 1 ? 'review' : 'reviews'})</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {hasReviews && (
                    <>
                      {/* ── 2. TREND SECTION WITH CHART / TABLE TOGGLE ───────────── */}
                      <View style={[s.trendCard, isCompact && s.cardCompact]}>
                        <View style={[s.trendHeaderRow, isCompact && s.stackCompact]}>
                          <Text style={s.trendTitle}>RATING MOVEMENT TREND</Text>
                          {TREND_DATA.length > 0 && (
                            <TouchableOpacity
                              style={s.viewTableToggleBtn}
                              onPress={() => setViewTrendTable(!viewTrendTable)}
                              activeOpacity={0.8}
                            >
                              <Text style={s.viewTableToggleBtnText}>
                                {viewTrendTable ? 'View chart' : 'View as table'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {TREND_DATA.length === 0 ? (
                          <Text style={s.trendEmptyText}>The rating trend appears here once verified reviews come in.</Text>
                        ) : viewTrendTable ? (
                          <View style={s.trendTable}>
                            <View style={s.tableHeaderRow}>
                              <Text style={s.tableHeaderCell}>Period</Text>
                              <Text style={s.tableHeaderCell}>Average Rating</Text>
                              <Text style={s.tableHeaderCell}>Verified Reviews</Text>
                              <Text style={s.tableHeaderCell}>Period Movement</Text>
                            </View>
                            {TREND_DATA.map((row, idx) => (
                              <View key={idx} style={s.tableDataRow}>
                                <Text style={s.tableCell}>{row.period}</Text>
                                <Text style={s.tableCellBold}>{row.avg}</Text>
                                <Text style={s.tableCell}>{row.reviews} reviews</Text>
                                <Text style={s.tableCellTrend}>{row.direction}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={s.compactTrendChartBox}>
                            {TREND_DATA.map((w, idx) => (
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

                      {/* ── 3. REVIEWS FILTER TOOLBAR WITH CLEAR COUNTS ──────────── */}
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
                    </>
                  )}

                  {/* ── 4. REVIEW CARDS LIST / EMPTY STATES ──────────────────────── */}
                  {!hasReviews ? (
                    <View style={s.emptyStateBox}>
                      <Ionicons name="star-outline" size={40} color={Colors.textMuted} />
                      <Text style={s.emptyTitle}>No reviews yet</Text>
                      <Text style={s.emptySub}>
                        Customer reviews appear here after delivered orders. Only verified customers can review.
                      </Text>
                      <TouchableOpacity
                        style={s.emptyActionBtn}
                        onPress={() => router.push('/(vendor)/orders')}
                        activeOpacity={0.8}
                      >
                        <Text style={s.emptyActionBtnText}>View orders</Text>
                      </TouchableOpacity>
                    </View>
                  ) : filteredReviews.length === 0 ? (
                    <View style={s.emptyStateBox}>
                      <Ionicons
                        name={selectedFilter === 'Unreplied' ? 'checkmark-done-outline' : 'funnel-outline'}
                        size={40}
                        color={Colors.textMuted}
                      />
                      <Text style={s.emptyTitle}>
                        {selectedFilter === 'Unreplied'
                          ? 'All customer reviews have been answered'
                          : 'No customer reviews found'}
                      </Text>
                      <Text style={s.emptySub}>
                        {selectedFilter === 'Unreplied'
                          ? 'Keep responding promptly to maintain store trust.'
                          : 'Try selecting another rating or category filter.'}
                      </Text>
                    </View>
                  ) : (
                    <View style={s.reviewsList}>
                      {filteredReviews.map(r => (
                        <View key={r.reviewId} style={[s.reviewCard, isCompact && s.cardCompact]}>
                          {/* Card Header Row */}
                          <View style={s.cardHeaderRow}>
                            <View style={s.cardHeaderMain}>
                              <View style={s.customerMetaRow}>
                                <Text style={s.customerNameText}>{r.customerFirstName}</Text>
                                <Text style={s.orderIdTag}>Order #{r.orderId}</Text>
                                {r.verifiedPurchase && (
                                  <View style={s.verifiedMarkerChip}>
                                    <Text style={s.verifiedMarkerChipText}>Verified customer purchase</Text>
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
                                    {r.vendorReply.status === 'Pending Moderation' ? 'Pending moderation' : r.vendorReply.status === 'Rejected' ? 'Rejected' : 'Live public reply'}
                                  </Text>
                                </View>
                              </View>

                              <Text style={s.replyBodyText}>{r.vendorReply.text}</Text>

                              {r.vendorReply.moderationReason && (
                                <Text style={s.moderationReasonText}>
                                  Moderation note: {r.vendorReply.moderationReason}
                                </Text>
                              )}
                            </View>
                          ) : (
                            <View style={s.cardFooterRow}>
                              {r.draftReply ? (
                                <Text style={s.draftSavedHintText}>Draft saved on this screen</Text>
                              ) : (
                                <Text style={s.replyPolicyHintText}>Constructive replies build customer trust and repeat orders.</Text>
                              )}

                              <TouchableOpacity
                                style={s.replyActionBtn}
                                onPress={() => handleOpenReplyDrawer(r)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="chatbubble-outline" size={14} color={Colors.background} />
                                <Text style={s.replyActionBtnText}>Reply to customer</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
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
                  <Text style={s.modalTitleText}>Reply to {selectedReview.customerFirstName}</Text>
                  <Text style={s.modalSubText}>Order #{selectedReview.orderId} • Product: {selectedReview.productName}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setReplyModalOpen(false)}
                  style={s.closeModalBtn}
                  accessibilityLabel="Close reply composer"
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Original Review Context Quote */}
                <View style={s.quoteCard}>
                  <View style={s.quoteHeaderRow}>
                    <Text style={s.quoteStarsText}>{'★'.repeat(selectedReview.stars)}</Text>
                    <Text style={s.quoteTagText}>{selectedReview.categoryTag}</Text>
                  </View>
                  <Text style={s.quoteBodyText}>"{selectedReview.reviewText}"</Text>
                </View>

                {/* Reply Input Field */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Your public store reply *</Text>
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
                    <Text style={s.charCountText}>{replyText.length} / 500 characters</Text>
                  </View>

                  {replyValidationError !== '' && (
                    <Text style={s.errorText}>{replyValidationError}</Text>
                  )}
                </View>

                {/* Prohibited Content Reminder Banner */}
                <View style={s.reminderCard}>
                  <Text style={s.reminderText}>
                    Policy guidance: replies are visible publicly on your store page. Do NOT include phone numbers, email addresses, external URLs, UPI handles, or personal customer information.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={s.modalActionsRow}>
                <TouchableOpacity style={s.saveDraftBtn} onPress={handleSaveDraft}>
                  <Text style={s.saveDraftBtnText}>Save draft</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.postReplyPrimaryBtn}
                  onPress={handlePostReply}
                  disabled={submittingReply}
                >
                  {submittingReply ? (
                    <ActivityIndicator color={Colors.background} size="small" />
                  ) : (
                    <Text style={s.postReplyPrimaryBtnText}>Post reply</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Toast */}
      {toastText !== null && (
        <View style={s.toastBanner}>
          <Text style={s.toastText}>{toastText}</Text>
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
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
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
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
  railHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 1,
    minWidth: 0,
  },
  headerTitleBlock: {
    flexShrink: 1,
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
    gap: 6,
  },
  breadcrumbHit: {
    minHeight: 44,
    justifyContent: 'center',
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
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedPill: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
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
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  /* Dev-only Edge State Strip */
  simStripCard: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  simTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  simTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  sampleChip: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  sampleChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  simScrollContainer: {
    gap: Spacing.xs,
  },
  simChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  errorBannerDismiss: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
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
  cardCompact: {
    padding: Spacing.lg,
  },
  stackCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacing.md,
  },

  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* Rating Summary Card */
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
  scoreBox: {
    alignItems: 'center',
    minWidth: 160,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingRight: Spacing.lg,
  },
  scoreBoxCompact: {
    minWidth: 0,
    width: '100%',
    borderRightWidth: 0,
    paddingRight: 0,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreValText: {
    fontSize: 42,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scoreEmptyText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
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
    lineHeight: 16,
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
    width: 28,
  },
  barCount: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    width: 80,
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
  trendTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  trendEmptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewTableToggleBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
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
    minHeight: 160,
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
    textAlign: 'center',
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
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
    color: Colors.background,
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
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyPolicyHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSubtle,
    flexShrink: 1,
  },
  draftSavedHintText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    flexShrink: 1,
  },
  replyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    borderRadius: BorderRadii.pill,
  },
  replyActionBtnText: {
    color: Colors.background,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Empty States */
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    borderRadius: BorderRadii.input,
  },
  emptyActionBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Toast Banner */
  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: 8,
  },
  toastText: {
    color: Colors.background,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    marginRight: -10,
  },
  modalScroll: {
    flexShrink: 1,
  },

  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    color: Colors.background,
  },
});

export default ReviewsScreen;
