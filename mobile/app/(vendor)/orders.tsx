/**
 * Orders and history (PRD screen 11).
 * Tabs: Offers, Preparing, Packed, Completed, Cancelled. Opens on the most urgent tab that
 * has orders. Search by order reference. History tabs add a date filter.
 * Orders come from the shared list kept current by src/features/orders/sync.ts.
 * No customer details on this screen.
 * File: mobile/app/(vendor)/orders.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BorderRadii, Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import type { Order } from '../../src/store/useVendorStore';
import ScreenShell from '../../src/components/ScreenShell';
import {
  ORDER_TABS,
  OrderBucket,
  OrderCard,
  SyncNotice,
  bucketOf,
  refreshOrdersNow,
  useOrdersDemand,
  useOrdersSync,
} from '../../src/features/orders';
import { Card, StateView } from '../../src/features/orders/ui';

type TabKey = Exclude<OrderBucket, 'other'>;
const DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 days' },
  { key: 'all', label: 'All' },
] as const;
type DateKey = (typeof DATE_RANGES)[number]['key'];

const EMPTY_COPY: Record<TabKey, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = {
  offers: { title: 'No new offers', sub: 'Offers appear here while your store is online and this app is open.', icon: 'notifications-outline' },
  preparing: { title: 'Nothing to pack', sub: 'Orders you accept appear here until they are packed.', icon: 'basket-outline' },
  packed: { title: 'No packed orders waiting', sub: "Packed orders wait here until GlowVai's delivery partner picks them up.", icon: 'cube-outline' },
  completed: { title: 'No completed orders yet', sub: 'Orders that are out for delivery or delivered appear here.', icon: 'checkmark-done-outline' },
  cancelled: { title: 'No cancelled orders', sub: 'Orders cancelled by the customer or GlowVai appear here.', icon: 'close-circle-outline' },
};

const ACTION_BY_TAB: Partial<Record<TabKey, string>> = {
  offers: 'Review',
  preparing: 'Pack',
  packed: 'View',
};

function inRange(ts: number, range: DateKey, now: number) {
  if (range === 'all') return true;
  if (!ts) return false;
  if (range === 'week') return ts >= now - 7 * 86_400_000;
  const d = new Date(now);
  return ts >= new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  useOrdersDemand();
  const feed = useOrdersSync();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrdersNow();
    setRefreshing(false);
  };

  const requestedTab = ORDER_TABS.some(t => t.key === params.tab) ? (params.tab as TabKey) : null;
  const [tab, setTab] = useState<TabKey | null>(requestedTab);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateKey>('week');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Orders | GlowVai Vendor';
    }
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (requestedTab) setTab(requestedTab);
  }, [requestedTab]);

  const byTab = useMemo(() => {
    const groups: Record<TabKey, Order[]> = { offers: [], preparing: [], packed: [], completed: [], cancelled: [] };
    for (const o of feed.orders) {
      const b = bucketOf(o);
      if (b !== 'other') groups[b].push(o);
    }
    // Work tabs: oldest first. History: newest first.
    (['offers', 'preparing', 'packed'] as TabKey[]).forEach(k => groups[k].sort((a, b) => a.placedAt - b.placedAt));
    (['completed', 'cancelled'] as TabKey[]).forEach(k => groups[k].sort((a, b) => (b.updatedAt || b.placedAt) - (a.updatedAt || a.placedAt)));
    return groups;
  }, [feed.orders]);

  // Default to the most urgent tab that has orders, once the list has loaded.
  useEffect(() => {
    if (tab || !feed.hasLoaded) return;
    const urgent = (['offers', 'preparing', 'packed'] as TabKey[]).find(k => byTab[k].length > 0);
    setTab(urgent ?? 'offers');
  }, [tab, feed.hasLoaded, byTab]);

  const activeTab: TabKey = tab ?? 'offers';
  const isHistory = activeTab === 'completed' || activeTab === 'cancelled';
  const q = query.trim().toLowerCase().replace(/^#/, '');

  const rows = useMemo(() => {
    let list = byTab[activeTab];
    if (isHistory) list = list.filter(o => inRange(o.placedAt, range, now));
    if (q) list = list.filter(o => o.reference.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q));
    return list;
  }, [byTab, activeTab, isHistory, range, now, q]);

  const openOrder = (o: Order) => {
    router.push({ pathname: '/(vendor)/order-detail', params: { orderId: o.orderId } } as any);
  };

  const renderBody = () => {
    if (!feed.hasLoaded && feed.state === 'error') {
      return <StateView kind="error" title="We could not load your orders" message={feed.error || undefined} actionLabel="Retry" onAction={feed.retry} />;
    }
    if (!feed.hasLoaded) {
      return <StateView kind="loading" title="Loading orders" />;
    }
    if (rows.length === 0) {
      if (q || (isHistory && range !== 'all' && byTab[activeTab].length > 0)) {
        return (
          <Card>
            <StateView
              kind="empty"
              icon="search-outline"
              title={q ? `No order matches "${query.trim()}"` : 'No orders in this period'}
              message={q ? 'Check the order reference and try again.' : 'Try a longer date range.'}
              actionLabel={q ? 'Clear search' : 'Show all'}
              onAction={() => (q ? setQuery('') : setRange('all'))}
            />
          </Card>
        );
      }
      const copy = EMPTY_COPY[activeTab];
      return (
        <Card>
          <StateView kind="empty" icon={copy.icon} title={copy.title} message={copy.sub} />
        </Card>
      );
    }
    return (
      <View style={s.list}>
        {rows.map(o => (
          <OrderCard key={o.orderId} order={o} now={now} actionLabel={ACTION_BY_TAB[activeTab]} onPress={() => openOrder(o)} />
        ))}
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Orders',
          showBell: true,
        }}
        backgroundColor={Colors.surface}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        contentContainerStyle={s.scroll}
      >
        <View style={s.stack}>
          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.tabsScroll}
            contentContainerStyle={s.tabs}
            accessibilityRole="tablist"
          >
            {ORDER_TABS.map(t => {
              const selected = t.key === activeTab;
              const count = byTab[t.key].length;
              const showCount = feed.hasLoaded && (t.key === 'offers' || t.key === 'preparing' || t.key === 'packed');
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={showCount ? `${t.label}, ${count}` : t.label}
                  style={[s.tab, selected && s.tabOn]}
                >
                  <Text style={[s.tabText, selected && s.tabTextOn]}>{t.label}</Text>
                  {showCount && count > 0 && (
                    <View style={[s.count, selected && s.countOn]}>
                      <Text style={[s.countText, selected && s.countTextOn]}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Search by reference, and a date range on history tabs only */}
          <View style={s.searchRow}>
            <View style={s.search}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search order reference"
                placeholderTextColor={Colors.textSubtle}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Search by order reference"
                style={s.searchInput}
              />
              {!!query && (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={s.clear}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>
          {isHistory && (
            <View style={s.segment} accessibilityRole="radiogroup" accessibilityLabel="Date range">
              {DATE_RANGES.map(r => {
                const selected = r.key === range;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => setRange(r.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[s.segmentItem, selected && s.segmentItemOn]}
                  >
                    <Text style={[s.segmentText, selected && s.segmentTextOn]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <SyncNotice />

          {renderBody()}
        </View>
      </ScreenShell>

    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  stack: { gap: Spacing.md },
  list: { gap: Spacing.sm },

  // Tabs scroll edge to edge on phones.
  tabsScroll: { marginHorizontal: -Spacing.lg },
  tabs: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textSecondary },
  tabTextOn: { color: Colors.background },
  count: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  countOn: { backgroundColor: Colors.background },
  countText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.primary },
  countTextOn: { color: Colors.primary },

  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingLeft: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.card,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  segment: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentItemOn: { backgroundColor: Colors.card },
  segmentText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  segmentTextOn: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
});
