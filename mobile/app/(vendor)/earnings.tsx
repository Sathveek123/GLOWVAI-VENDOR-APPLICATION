/**
 * Earnings: net earnings, the order ledger and shortcuts to settlements and tax documents.
 * File: mobile/app/(vendor)/earnings.tsx
 *
 * Data comes from GET /api/earnings/:vendorId (summary) and /history (ledger).
 * Sample numbers exist only for __DEV__ review and are always labelled "Sample data".
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import useVendorStore, { type EarningsSummary } from '../../src/store/useVendorStore';
import { earningsApi } from '../../src/services/api';
import { getSession } from '../../src/services/session';
import { Colors } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type PayoutStatus = 'SETTLED' | 'PENDING' | 'REFUNDED';
type MetricKey = 'net' | 'gross' | 'orders';
type FilterKey = 'ALL' | PayoutStatus;
type LoadStatus = 'loading' | 'ready' | 'error' | 'no-session';

/** One ledger line. Expected from GET /api/earnings/:vendorId/history as { entries: LedgerRow[] }. */
export interface LedgerRow {
  id: string;
  orderId: string;
  date: string;
  grossAmount: number;
  platformFee: number;
  refundAmount: number;
  netPayout: number;
  payoutStatus: PayoutStatus;
}

const METRIC_FIELD: Record<MetricKey, 'earnings' | 'revenue' | 'orders'> = {
  net: 'earnings',
  gross: 'revenue',
  orders: 'orders',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SETTLED', label: 'Settled' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REFUNDED', label: 'Refunded' },
];

const STATUS_STYLE: Record<PayoutStatus, { bg: string; fg: string; label: string }> = {
  SETTLED: { bg: Colors.successLight, fg: Colors.success, label: 'Settled' },
  PENDING: { bg: Colors.warningLight, fg: '#B45309', label: 'Pending' },
  REFUNDED: { bg: Colors.dangerLight, fg: Colors.danger, label: 'Refunded' },
};

// Sample figures for __DEV__ review only. Never rendered in production builds.
const SAMPLE_SUMMARY: EarningsSummary = {
  today: { orders: 3, revenue: 4850, earnings: 4268 },
  weekly: [
    { date: 'Mon 01 Oct', orders: 4, revenue: 4772, earnings: 4200 },
    { date: 'Tue 02 Oct', orders: 6, revenue: 7727, earnings: 6800 },
    { date: 'Wed 03 Oct', orders: 8, revenue: 10113, earnings: 8900 },
    { date: 'Thu 04 Oct', orders: 5, revenue: 5795, earnings: 5100 },
    { date: 'Fri 05 Oct', orders: 11, revenue: 12727, earnings: 11200 },
    { date: 'Sat 06 Oct', orders: 9, revenue: 10738, earnings: 9450 },
    { date: 'Sun 07 Oct', orders: 3, revenue: 4250, earnings: 3740 },
  ],
  total: { orders: 46, revenue: 56122, earnings: 49390, pendingPayout: 12050 },
};

const SAMPLE_LEDGER: LedgerRow[] = [
  { id: 's-1', orderId: 'SAMPLE-01', date: '07 Oct 2026, 01:30 PM', grossAmount: 1450, platformFee: 174, refundAmount: 0, netPayout: 1276, payoutStatus: 'PENDING' },
  { id: 's-2', orderId: 'SAMPLE-02', date: '06 Oct 2026, 05:45 PM', grossAmount: 1850, platformFee: 222, refundAmount: 350, netPayout: 1278, payoutStatus: 'REFUNDED' },
  { id: 's-3', orderId: 'SAMPLE-03', date: '06 Oct 2026, 02:10 PM', grossAmount: 3200, platformFee: 384, refundAmount: 0, netPayout: 2816, payoutStatus: 'SETTLED' },
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const compactInr = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);

function EarningsScreen() {
  const router = useRouter();
  const { setEarnings } = useVendorStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<MetricKey>('net');
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [useSample, setUseSample] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Earnings | GlowVAI Vendor';
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const session = await getSession();
      if (!session.vendorId) {
        setStatus('no-session');
        return;
      }
      const [sRes, hRes] = await Promise.all([
        earningsApi.getSummary(session.vendorId),
        earningsApi.getHistory(session.vendorId),
      ]);
      const next: EarningsSummary | null = sRes?.earnings ?? null;
      setSummary(next);
      if (next) setEarnings(next);
      setLedger(Array.isArray(hRes?.entries) ? hRes.entries : []);
      setStatus('ready');
    } catch (_) {
      setStatus('error');
    }
  }, [setEarnings]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // Sample data replaces live data only in __DEV__ builds, and the screen says so.
  const showingSample = __DEV__ && useSample;
  const viewStatus: LoadStatus = showingSample ? 'ready' : status;
  const viewSummary = showingSample ? SAMPLE_SUMMARY : summary;
  const viewLedger = showingSample ? SAMPLE_LEDGER : ledger;

  const weekly = viewSummary?.weekly ?? [];
  const field = METRIC_FIELD[metric];
  const maxVal = Math.max(1, ...weekly.map((d) => d[field]));
  const filteredLedger = viewLedger.filter((r) => filter === 'ALL' || r.payoutStatus === filter);

  const money = (n: number) => (hideAmounts ? '₹••••' : inr(n));

  const renderSummary = () => {
    if (viewStatus === 'loading') {
      return (
        <View style={[s.card, s.centerBox]}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.mutedText}>Loading earnings</Text>
        </View>
      );
    }
    if (viewStatus === 'error') {
      return (
        <View style={s.card}>
          <Text style={s.cardTitle}>We could not load earnings</Text>
          <Text style={s.mutedText}>Check your connection and try again.</Text>
          <Pressable onPress={() => load()} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
            <Text style={s.primaryBtnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    if (viewStatus === 'no-session') {
      return (
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in to see your earnings</Text>
          <Text style={s.mutedText}>Your vendor session was not found on this device.</Text>
          <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
            <Text style={s.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>
      );
    }
    if (!viewSummary) {
      return (
        <View style={[s.card, s.centerBox]}>
          <View style={s.emptyIcon}>
            <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>No earnings yet</Text>
          <Text style={[s.mutedText, s.textCenter]}>Earnings appear here once your orders are completed.</Text>
        </View>
      );
    }
    return (
      <View style={[s.card, s.heroCard]}>
        <Text style={s.eyebrow}>Net earnings</Text>
        <Text style={s.heroAmount} accessibilityLabel={hideAmounts ? 'Amount hidden' : `Net earnings ${inr(viewSummary.total.earnings)}`}>
          {money(viewSummary.total.earnings)}
        </Text>
        <View style={s.heroRow}>
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>Today</Text>
            <Text style={s.heroStatValue}>{money(viewSummary.today.earnings)}</Text>
          </View>
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>Pending payout</Text>
            <Text style={s.heroStatValue}>{money(viewSummary.total.pendingPayout)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const tiles = viewSummary
    ? [
        { label: 'Gross sales', value: money(viewSummary.total.revenue), hint: 'Customer paid' },
        { label: 'Orders', value: String(viewSummary.total.orders), hint: 'Total orders' },
        { label: 'Orders today', value: String(viewSummary.today.orders), hint: 'So far today' },
        { label: 'Pending payout', value: money(viewSummary.total.pendingPayout), hint: 'Awaiting settlement' },
      ]
    : [];

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Earnings', subtitle: 'Net earnings and order ledger', showBack: true }}
        contentContainerStyle={s.shellContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={s.page}>
          {__DEV__ && (
            <Pressable
              onPress={() => setUseSample((v) => !v)}
              style={({ pressed }) => [s.devToggle, pressed && s.pressed]}
              accessibilityRole="switch"
              accessibilityState={{ checked: useSample }}
            >
              <Ionicons
                name={useSample ? 'checkbox-outline' : 'square-outline'}
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={s.devToggleText}>Show sample data (development builds only)</Text>
            </Pressable>
          )}

          {showingSample && (
            <View style={s.sampleBanner}>
              <Ionicons name="flask-outline" size={15} color="#B45309" />
              <Text style={s.sampleBannerText}>Sample data. These figures are not from your store.</Text>
            </View>
          )}

          <View style={s.topRow}>
            <Text style={s.sectionNote}>Amounts are in Indian rupees (₹)</Text>
            <Pressable
              onPress={() => setHideAmounts((v) => !v)}
              style={({ pressed }) => [s.hideBtn, pressed && s.pressed]}
              accessibilityRole="switch"
              accessibilityState={{ checked: hideAmounts }}
              accessibilityLabel="Hide amounts"
            >
              <Ionicons name={hideAmounts ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.primary} />
              <Text style={s.hideBtnText}>{hideAmounts ? 'Show amounts' : 'Hide amounts'}</Text>
            </Pressable>
          </View>

          {renderSummary()}

          {viewStatus === 'ready' && viewSummary && (
            <View style={[s.tileGrid, { gap: 12 }]}>
              {tiles.map((t) => (
                <View key={t.label} style={[s.tile, { flexBasis: isWide ? '23%' : '47%' }]}>
                  <Text style={s.tileLabel}>{t.label}</Text>
                  <Text style={s.tileValue}>{t.value}</Text>
                  <Text style={s.tileHint}>{t.hint}</Text>
                </View>
              ))}
            </View>
          )}

          {viewStatus === 'ready' && viewSummary && (
            <View style={s.card}>
              <View style={s.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Last 7 days</Text>
                  <Text style={s.mutedText}>Daily trend for the selected measure</Text>
                </View>
              </View>

              <View style={s.segment} accessibilityRole="tablist">
                {(['net', 'gross', 'orders'] as const).map((m) => {
                  const active = metric === m;
                  const label = m === 'net' ? 'Net' : m === 'gross' ? 'Gross' : 'Orders';
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMetric(m)}
                      style={[s.segmentItem, active && s.segmentItemActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[s.segmentText, active && s.segmentTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.chart}>
                {weekly.map((d) => {
                  const value = d[field];
                  const pct = Math.max((value / maxVal) * 100, 3);
                  const shown = metric === 'orders' ? String(value) : compactInr(value);
                  return (
                    <View
                      key={d.date}
                      style={s.barCol}
                      accessible
                      accessibilityLabel={`${d.date}: ${metric === 'orders' ? value : inr(value)}`}
                    >
                      <Text style={s.barValue} numberOfLines={1}>{hideAmounts && metric !== 'orders' ? '••' : shown}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { height: `${pct}%` }]} />
                      </View>
                      <Text style={s.barDay}>{d.date.split(' ')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {viewStatus === 'ready' && viewSummary && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Order ledger</Text>
              <Text style={[s.mutedText, { marginBottom: 12 }]}>Each completed order and how it was paid out</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      style={[s.chip, active && s.chipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {filteredLedger.length === 0 ? (
                <View style={[s.centerBox, { paddingVertical: 24 }]}>
                  <Text style={s.cardTitle}>No transactions here</Text>
                  <Text style={[s.mutedText, s.textCenter]}>
                    {viewLedger.length === 0
                      ? 'Order payouts will be listed here as they are completed.'
                      : 'No transactions match this filter.'}
                  </Text>
                </View>
              ) : (
                filteredLedger.map((r) => {
                  const st = STATUS_STYLE[r.payoutStatus];
                  return (
                    <View key={r.id} style={s.ledgerRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={s.ledgerTop}>
                          <Text style={s.orderId}>Order {r.orderId}</Text>
                          <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                            <Text style={[s.statusPillText, { color: st.fg }]}>{st.label}</Text>
                          </View>
                        </View>
                        <Text style={s.mutedText}>{r.date}</Text>
                        {r.refundAmount > 0 && (
                          <Text style={s.refundText}>Refund adjustment −{money(r.refundAmount)}</Text>
                        )}
                      </View>
                      <View style={s.ledgerRight}>
                        <Text style={s.ledgerNet}>{money(r.netPayout)}</Text>
                        <Text style={s.mutedSmall}>Gross {money(r.grossAmount)}</Text>
                        <Text style={s.mutedSmall}>Fee −{money(r.platformFee)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          <View style={s.card}>
            <Text style={s.cardTitle}>Payouts and records</Text>
            {[
              { label: 'Settlements and UTR numbers', icon: 'swap-horizontal-outline', route: '/(vendor)/payout-detail' },
              { label: 'Payout account', icon: 'card-outline', route: '/(vendor)/bank-edit' },
              { label: 'Tax documents', icon: 'document-text-outline', route: '/(vendor)/tax-documents' },
              { label: 'Sales analytics', icon: 'bar-chart-outline', route: '/(vendor)/analytics' },
            ].map((link, i, arr) => (
              <Pressable
                key={link.route}
                onPress={() => router.push(link.route as any)}
                style={({ pressed }) => [s.linkRow, i === arr.length - 1 && { borderBottomWidth: 0 }, pressed && s.pressed]}
                accessibilityRole="link"
                accessibilityLabel={link.label}
              >
                <Ionicons name={link.icon as any} size={18} color={Colors.primary} />
                <Text style={s.linkText}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
              </Pressable>
            ))}
          </View>

          <View style={s.noteBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={s.noteText}>
              The platform fee and the GST on it are deducted from each order before payout. Settlement dates and UTR references are listed under Settlements and UTR numbers.
            </Text>
          </View>
        </View>
      </ScreenShell>
      <MobileBottomNav currentTab="earnings" />
    </View>
  );
}

export default EarningsScreen;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  shellContent: { paddingBottom: 32 },
  page: { padding: 16, gap: 12, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.85 },

  devToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44,
    paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.card,
  },
  devToggleText: { ...TypeScale.label, color: Colors.textSecondary },

  sampleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderRadius: 10, backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
  },
  sampleBannerText: { ...TypeScale.label, color: '#92400E', flex: 1 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  sectionNote: { ...TypeScale.caption, color: Colors.textSubtle, flexShrink: 1 },
  hideBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight,
  },
  hideBtnText: { ...TypeScale.label, color: Colors.primary },

  card: {
    backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  mutedText: { ...TypeScale.caption, color: Colors.textSubtle, fontSize: 13, lineHeight: 18 },
  mutedSmall: { ...TypeScale.caption, color: Colors.textSubtle, textAlign: 'right' },
  textCenter: { textAlign: 'center' },
  centerBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  primaryBtn: {
    marginTop: 8, minHeight: 44, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },

  heroCard: { backgroundColor: Colors.primary, borderColor: Colors.primary, padding: 20, gap: 6 },
  eyebrow: { fontFamily: FontFamily.semibold, fontSize: 13, color: '#DBEAFE' },
  heroAmount: { fontFamily: FontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, color: '#FFFFFF' },
  heroRow: { flexDirection: 'row', gap: 24, marginTop: 12, flexWrap: 'wrap' },
  heroStat: { minWidth: 120 },
  heroStatLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: '#DBEAFE' },
  heroStatValue: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#FFFFFF', marginTop: 2 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    flexGrow: 1, minWidth: 140, backgroundColor: Colors.background, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  tileLabel: { ...TypeScale.label, color: Colors.textSubtle },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary, marginTop: 4 },
  tileHint: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 2 },

  segment: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 3,
    borderWidth: 1, borderColor: Colors.border, marginTop: 4,
  },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  segmentText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSubtle },
  segmentTextActive: { color: Colors.primary },

  chart: { flexDirection: 'row', height: 180, gap: 6, marginTop: 12, alignItems: 'stretch' },
  barCol: { flex: 1, alignItems: 'center', minWidth: 0 },
  barValue: { ...TypeScale.caption, fontSize: 11, color: Colors.textSecondary, marginBottom: 4, height: 16 },
  barTrack: { flex: 1, width: '100%', maxWidth: 36, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: Colors.primary },
  barDay: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 6 },

  filterRow: { gap: 8, paddingBottom: 4 },
  chip: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1,
    borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  ledgerRow: {
    flexDirection: 'row', gap: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ledgerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  orderId: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  refundText: { ...TypeScale.caption, color: Colors.danger, marginTop: 2 },
  ledgerRight: { alignItems: 'flex-end', gap: 2 },
  ledgerNet: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textPrimary },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  linkText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },

  noteBox: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { flex: 1, ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
});
