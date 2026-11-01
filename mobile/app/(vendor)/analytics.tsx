/**
 * Analytics: daily sales, net earnings and orders for this store.
 * File: mobile/app/(vendor)/analytics.tsx
 *
 * Data comes from GET /api/analytics/:storeId as { daily: DailyPoint[] }. Totals and average
 * order value are derived here. Sample numbers exist only for __DEV__ review and are labelled.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { analyticsApi } from '../../src/services/api';
import { getSession } from '../../src/services/session';
import { Colors } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

export interface DailyPoint {
  date: string;
  gross: number; // rupees
  net: number; // rupees
  orders: number;
}

type MetricKey = 'gross' | 'net' | 'orders' | 'aov';
type ViewMode = 'chart' | 'table';
type LoadStatus = 'loading' | 'ready' | 'error' | 'no-session';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'gross', label: 'Gross' },
  { key: 'net', label: 'Net' },
  { key: 'orders', label: 'Orders' },
  { key: 'aov', label: 'Avg order' },
];

// Sample figures for __DEV__ review only. Never rendered in production builds.
const SAMPLE_DAILY: DailyPoint[] = [
  { date: 'Mon 01 Oct', gross: 18450, net: 16236, orders: 19 },
  { date: 'Tue 02 Oct', gross: 21200, net: 18656, orders: 22 },
  { date: 'Wed 03 Oct', gross: 19800, net: 17424, orders: 20 },
  { date: 'Thu 04 Oct', gross: 24500, net: 21560, orders: 25 },
  { date: 'Fri 05 Oct', gross: 28900, net: 25432, orders: 30 },
  { date: 'Sat 06 Oct', gross: 32000, net: 28160, orders: 34 },
  { date: 'Sun 07 Oct', gross: 18000, net: 15840, orders: 18 },
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const compactInr = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);

function metricValue(p: DailyPoint, m: MetricKey): number {
  if (m === 'aov') return p.orders > 0 ? p.gross / p.orders : 0;
  return p[m];
}

function AnalyticsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<MetricKey>('gross');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [useSample, setUseSample] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Analytics | GlowVAI Vendor';
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const session = await getSession();
      if (!session.storeId) {
        setStatus('no-session');
        return;
      }
      const res = await analyticsApi.getDashboard(session.storeId);
      setDaily(Array.isArray(res?.daily) ? res.daily : []);
      setStatus('ready');
    } catch (_) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const showingSample = __DEV__ && useSample;
  const viewStatus: LoadStatus = showingSample ? 'ready' : status;
  const viewDaily = showingSample ? SAMPLE_DAILY : daily;

  const totals = useMemo(() => {
    const gross = viewDaily.reduce((a, p) => a + p.gross, 0);
    const net = viewDaily.reduce((a, p) => a + p.net, 0);
    const orders = viewDaily.reduce((a, p) => a + p.orders, 0);
    return { gross, net, orders, aov: orders > 0 ? gross / orders : 0 };
  }, [viewDaily]);

  const maxVal = Math.max(1, ...viewDaily.map((p) => metricValue(p, metric)));
  const isEmpty = viewStatus === 'ready' && viewDaily.length === 0;

  const fmt = (m: MetricKey, v: number) => (m === 'orders' ? String(Math.round(v)) : m === 'aov' ? inr(v) : compactInr(v));

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Analytics', subtitle: 'Daily sales and orders', showBack: true }}
        contentContainerStyle={s.shellContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={[s.page, { padding: isWide ? 24 : 16 }]}>
          {__DEV__ && (
            <Pressable
              onPress={() => setUseSample((v) => !v)}
              style={({ pressed }) => [s.devToggle, pressed && s.pressed]}
              accessibilityRole="switch"
              accessibilityState={{ checked: useSample }}
            >
              <Ionicons name={useSample ? 'checkbox-outline' : 'square-outline'} size={18} color={Colors.textSecondary} />
              <Text style={s.devToggleText}>Show sample data (development builds only)</Text>
            </Pressable>
          )}

          {showingSample && (
            <View style={s.sampleBanner}>
              <Ionicons name="flask-outline" size={15} color="#B45309" />
              <Text style={s.sampleBannerText}>Sample data. These figures are not from your store.</Text>
            </View>
          )}

          {viewStatus === 'loading' && (
            <View style={[s.card, s.centerBox]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={s.mutedText}>Loading analytics</Text>
            </View>
          )}

          {viewStatus === 'error' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>We could not load analytics</Text>
              <Text style={s.mutedText}>Check your connection and try again.</Text>
              <Pressable onPress={() => load()} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
                <Text style={s.primaryBtnText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {viewStatus === 'no-session' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Sign in to see analytics</Text>
              <Text style={s.mutedText}>Your store session was not found on this device.</Text>
              <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
                <Text style={s.primaryBtnText}>Sign in</Text>
              </Pressable>
            </View>
          )}

          {isEmpty && (
            <View style={[s.card, s.centerBox]}>
              <View style={s.emptyIcon}>
                <Ionicons name="bar-chart-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>No sales data yet</Text>
              <Text style={[s.mutedText, s.textCenter]}>Daily sales and orders will show here once your store has completed orders.</Text>
            </View>
          )}

          {viewStatus === 'ready' && viewDaily.length > 0 && (
            <>
              <View style={[s.tileGrid]}>
                {[
                  { label: 'Gross sales', value: inr(totals.gross) },
                  { label: 'Net earnings', value: inr(totals.net) },
                  { label: 'Orders', value: String(totals.orders) },
                  { label: 'Avg order value', value: inr(totals.aov) },
                ].map((t) => (
                  <View key={t.label} style={[s.tile, { flexBasis: isWide ? '23%' : '47%' }]}>
                    <Text style={s.tileLabel}>{t.label}</Text>
                    <Text style={s.tileValue}>{t.value}</Text>
                    <Text style={s.tileHint}>{viewDaily.length} days</Text>
                  </View>
                ))}
              </View>

              <View style={s.card}>
                <View style={s.chartHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>Daily trend</Text>
                    <Text style={s.mutedText}>{viewDaily[0].date} to {viewDaily[viewDaily.length - 1].date}</Text>
                  </View>
                  <View style={s.viewToggle} accessibilityRole="tablist">
                    {(['chart', 'table'] as const).map((v) => {
                      const active = viewMode === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setViewMode(v)}
                          style={[s.viewToggleItem, active && s.viewToggleItemActive]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[s.viewToggleText, active && s.viewToggleTextActive]}>
                            {v === 'chart' ? 'Chart' : 'Table'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {viewMode === 'chart' ? (
                  <>
                    <View style={s.metricRow}>
                      {METRICS.map((m) => {
                        const active = metric === m.key;
                        return (
                          <Pressable
                            key={m.key}
                            onPress={() => setMetric(m.key)}
                            style={[s.chip, active && s.chipActive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                          >
                            <Text style={[s.chipText, active && s.chipTextActive]}>{m.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={s.chart}>
                      {viewDaily.map((p) => {
                        const v = metricValue(p, metric);
                        const pct = Math.max((v / maxVal) * 100, 3);
                        return (
                          <View key={p.date} style={s.barCol} accessible accessibilityLabel={`${p.date}: ${fmt(metric, v)}`}>
                            <Text style={s.barValue} numberOfLines={1}>{fmt(metric, v)}</Text>
                            <View style={s.barTrack}>
                              <View style={[s.barFill, { height: `${pct}%` }]} />
                            </View>
                            <Text style={s.barDay}>{p.date.split(' ')[0]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={s.table}>
                      <View style={[s.tr, s.trHead]}>
                        {['Day', 'Gross', 'Net', 'Orders', 'Avg'].map((h, i) => (
                          <Text key={h} style={[s.th, i === 0 ? s.colDay : s.colNum]}>{h}</Text>
                        ))}
                      </View>
                      {viewDaily.map((p) => (
                        <View key={p.date} style={s.tr}>
                          <Text style={[s.td, s.tdStrong, s.colDay]}>{p.date}</Text>
                          <Text style={[s.td, s.colNum]}>{inr(p.gross)}</Text>
                          <Text style={[s.td, s.colNum]}>{inr(p.net)}</Text>
                          <Text style={[s.td, s.colNum]}>{p.orders}</Text>
                          <Text style={[s.td, s.colNum]}>{inr(metricValue(p, 'aov'))}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </>
          )}

          <View style={s.card}>
            <Text style={s.cardTitle}>Related</Text>
            {[
              { label: 'Earnings and payouts', icon: 'wallet-outline', route: '/(vendor)/earnings' },
              { label: 'Manage catalog and stock', icon: 'cube-outline', route: '/(vendor)/catalog' },
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
        </View>
      </ScreenShell>

      <MobileBottomNav currentTab="home" />
    </View>
  );
}

export default AnalyticsScreen;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  shellContent: { paddingBottom: 32 },
  page: { gap: 12, maxWidth: 1200, width: '100%', alignSelf: 'center' },
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

  card: {
    backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 8,
  },
  centerBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  mutedText: { ...TypeScale.caption, color: Colors.textSubtle, fontSize: 13, lineHeight: 18 },
  textCenter: { textAlign: 'center' },
  primaryBtn: {
    marginTop: 8, minHeight: 44, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexGrow: 1, minWidth: 140, backgroundColor: Colors.background, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  tileLabel: { ...TypeScale.label, color: Colors.textSubtle },
  tileValue: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary, marginTop: 4 },
  tileHint: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 2 },

  chartHead: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  viewToggle: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  viewToggleItem: { minHeight: 38, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  viewToggleItemActive: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  viewToggleText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSubtle },
  viewToggleTextActive: { color: Colors.primary },

  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1,
    borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  chart: { flexDirection: 'row', height: 200, gap: 6, marginTop: 8, alignItems: 'stretch' },
  barCol: { flex: 1, alignItems: 'center', minWidth: 0 },
  barValue: { ...TypeScale.caption, fontSize: 11, color: Colors.textSecondary, marginBottom: 4, height: 16 },
  barTrack: { flex: 1, width: '100%', maxWidth: 40, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: Colors.primary },
  barDay: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 6 },

  table: { minWidth: 520, marginTop: 8 },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderBottomWidth: 1, borderBottomColor: Colors.border },
  trHead: { backgroundColor: Colors.surface },
  th: { ...TypeScale.label, color: Colors.textSubtle, paddingHorizontal: 8 },
  td: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 8 },
  tdStrong: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  colDay: { width: 120 },
  colNum: { width: 100, textAlign: 'right' },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  linkText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
});
