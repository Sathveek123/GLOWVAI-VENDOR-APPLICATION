/**
 * Orders queue: every order for this store, filtered by status, date and search.
 * Rows come only from the orders API. Empty and error states say what happened.
 * File: mobile/app/(vendor)/orders.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import type { Order } from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import ScreenShell from '../../src/components/ScreenShell';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';

const STATUS_TABS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: 'ALL', label: 'All', statuses: null },
  { key: 'NEW', label: 'New', statuses: ['PENDING'] },
  { key: 'ACTIVE', label: 'Active', statuses: ['ACCEPTED', 'PREPARING'] },
  { key: 'READY', label: 'Ready', statuses: ['PACKED', 'READY_FOR_PICKUP', 'DISPATCHED'] },
  { key: 'DELIVERED', label: 'Delivered', statuses: ['DELIVERED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
];

const DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 days' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

const SORTS = [
  { key: 'oldest', label: 'Oldest first' },
  { key: 'newest', label: 'Newest first' },
  { key: 'value', label: 'Highest value' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'New offer', color: Colors.warning, bg: Colors.warningLight },
  ACCEPTED: { label: 'Accepted', color: Colors.primary, bg: Colors.primaryLight },
  PREPARING: { label: 'Preparing', color: Colors.primary, bg: Colors.primaryLight },
  PACKED: { label: 'Packed', color: Colors.success, bg: Colors.successLight },
  READY_FOR_PICKUP: { label: 'Ready for pickup', color: Colors.success, bg: Colors.successLight },
  DISPATCHED: { label: 'Dispatched', color: Colors.success, bg: Colors.successLight },
  DELIVERED: { label: 'Delivered', color: Colors.success, bg: Colors.successLight },
  CANCELLED: { label: 'Cancelled', color: Colors.danger, bg: Colors.dangerLight },
};

const formatINR = (value: number | undefined | null) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

function formatAgo(timestamp: number) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function inDateRange(ts: number, range: string, now: number) {
  if (range === 'all') return true;
  const d = new Date(now);
  if (range === 'today') return ts >= new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (range === 'week') return ts >= now - 7 * 86400000;
  return ts >= new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** The action a vendor takes next, by status. */
function nextStep(status: string): { label: string; route: 'pack-order' | 'ready-pickup' | 'order-detail' } {
  if (status === 'PENDING') return { label: 'Review offer', route: 'order-detail' };
  if (status === 'ACCEPTED' || status === 'PREPARING') return { label: 'Pack order', route: 'pack-order' };
  if (status === 'PACKED' || status === 'READY_FOR_PICKUP') return { label: 'Hand over', route: 'ready-pickup' };
  return { label: 'View details', route: 'order-detail' };
}

/** Desktop only: text links to the other vendor screens. On phones the bottom bar does this job. */
function TopNavLinks({ current }: { current: 'home' | 'orders' }) {
  const router = useRouter();
  const links = [
    { key: 'home', label: 'Home', route: '/(vendor)/home' },
    { key: 'orders', label: 'Orders', route: '/(vendor)/orders' },
    { key: 'catalog', label: 'Catalog', route: '/(vendor)/catalog' },
    { key: 'earnings', label: 'Earnings', route: '/(vendor)/earnings' },
    { key: 'profile', label: 'Profile', route: '/(vendor)/profile' },
  ];
  return (
    <View style={tn.row}>
      {links.map(link => {
        const active = link.key === current;
        return (
          <Pressable
            key={link.key}
            onPress={() => { if (!active) router.replace(link.route as any); }}
            accessibilityRole="link"
            accessibilityLabel={link.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [tn.item, active && tn.itemActive, pressed && { opacity: 0.7 }]}
          >
            <Text style={[tn.label, active && tn.labelActive]}>{link.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const { orders, setOrders } = useVendorStore();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [sortKey, setSortKey] = useState('oldest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setErrorMessage('');
    try {
      const res = await ordersApi.getAll();
      setOrders(Array.isArray(res?.orders) ? res.orders : []);
      setHasLoaded(true);
      setLastUpdated(Date.now());
      setStatus('ready');
    } catch (err: any) {
      setErrorMessage(err?.message || 'We could not reach the server.');
      setStatus('error');
    }
  }, [setOrders]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Orders | GlowVAI Vendor Console';
    }
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const ordersPool = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  // Date range first, so the tab counts match what the list can show.
  const inRange = useMemo(() => {
    const now = Date.now();
    return ordersPool.filter(o => inDateRange(o.createdAt || 0, dateRange, now));
  }, [ordersPool, dateRange]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_TABS.forEach(tab => {
      counts[tab.key] = tab.statuses
        ? inRange.filter(o => tab.statuses!.includes(o.status)).length
        : inRange.length;
    });
    return counts;
  }, [inRange]);

  const filteredOrders = useMemo(() => {
    const tab = STATUS_TABS.find(t => t.key === activeTab);
    const q = searchQuery.trim().toLowerCase();
    const list = inRange.filter(order => {
      if (tab?.statuses && !tab.statuses.includes(order.status)) return false;
      if (!q) return true;
      return (
        order.orderId?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.shippingAddress?.fullAddress?.toLowerCase().includes(q) ||
        order.items?.some(i => i.productName?.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => {
      if (sortKey === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortKey === 'value') return (b.pricing?.grandTotal || 0) - (a.pricing?.grandTotal || 0);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [inRange, activeTab, searchQuery, sortKey]);

  const selectedOrder: Order | undefined = useMemo(
    () => filteredOrders.find(o => o.orderId === selectedId) ?? undefined,
    [filteredOrders, selectedId]
  );

  const isLoading = status === 'loading' && !hasLoaded;
  const hasFilters = activeTab !== 'ALL' || dateRange !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setActiveTab('ALL');
    setDateRange('all');
    setSearchQuery('');
  };

  const openOrder = (order: Order) => {
    const step = nextStep(order.status);
    if (step.route === 'order-detail') {
      router.push({ pathname: '/(vendor)/order-detail', params: { orderId: order.orderId } } as any);
    } else {
      router.push({ pathname: `/(vendor)/${step.route}` as any, params: { orderId: order.orderId } });
    }
  };

  const renderEmpty = () => {
    if (hasFilters) {
      return (
        <View style={s.emptyBox}>
          <Ionicons name="search-outline" size={28} color={Colors.textSubtle} />
          <Text style={s.emptyTitle}>No orders match these filters</Text>
          <Text style={s.emptySub}>Try a different status, date range or search term.</Text>
          <Pressable onPress={clearFilters} accessibilityRole="button" style={({ pressed }) => [s.emptyAction, pressed && { opacity: 0.85 }]}>
            <Text style={s.emptyActionText}>Clear filters</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={s.emptyBox}>
        <Ionicons name="file-tray-outline" size={28} color={Colors.textSubtle} />
        <Text style={s.emptyTitle}>No orders yet</Text>
        <Text style={s.emptySub}>Orders you receive appear here. Keep the store open to get them.</Text>
      </View>
    );
  };

  const renderOrderRow = (order: Order) => {
    const meta = STATUS_META[order.status] ?? { label: order.status, color: Colors.textSecondary, bg: Colors.surface };
    const step = nextStep(order.status);
    const itemCount = order.items?.length || 0;
    const isSelected = isExpanded && selectedId === order.orderId;
    const place = order.shippingAddress?.fullAddress;
    return (
      <Pressable
        key={order.orderId}
        onPress={() => (isExpanded ? setSelectedId(order.orderId) : openOrder(order))}
        accessibilityRole="button"
        accessibilityLabel={`Order ${order.orderId}, ${meta.label}, ${formatINR(order.pricing?.grandTotal)}`}
        style={({ pressed }) => [s.orderCard, isSelected && s.orderCardSelected, pressed && { opacity: 0.85 }]}
      >
        <View style={s.orderTop}>
          <Text style={s.orderId} numberOfLines={1}>#{order.orderId}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[s.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={s.orderMeta} numberOfLines={1}>
          {[order.customerName, place].filter(Boolean).join(' • ') || 'Customer details unavailable'}
        </Text>
        <Text style={s.orderItems} numberOfLines={1}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
          {itemCount ? `: ${order.items.map(i => i.productName).join(', ')}` : ''}
        </Text>

        <View style={s.orderBottom}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.orderValue}>{formatINR(order.pricing?.grandTotal)}</Text>
            <Text style={s.orderAgo}>{formatAgo(order.createdAt)}</Text>
          </View>
          {!isExpanded && (
            <View style={s.stepPill}>
              <Text style={s.stepPillText}>{step.label}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedOrder) {
      return (
        <View style={s.detailEmpty}>
          <Ionicons name="receipt-outline" size={28} color={Colors.textSubtle} />
          <Text style={s.emptyTitle}>Select an order</Text>
          <Text style={s.emptySub}>Its items and totals show here.</Text>
        </View>
      );
    }
    const meta = STATUS_META[selectedOrder.status] ?? { label: selectedOrder.status, color: Colors.textSecondary, bg: Colors.surface };
    const step = nextStep(selectedOrder.status);
    const pricing = selectedOrder.pricing;
    return (
      <View style={s.detailCard}>
        <View style={s.orderTop}>
          <Text style={s.detailTitle} numberOfLines={1}>#{selectedOrder.orderId}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[s.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        {!!selectedOrder.customerName && <Text style={s.detailCustomer}>{selectedOrder.customerName}</Text>}
        {!!selectedOrder.shippingAddress?.fullAddress && (
          <Text style={s.mutedText}>{selectedOrder.shippingAddress.fullAddress}</Text>
        )}

        <Text style={s.sectionLabel}>Items</Text>
        {(selectedOrder.items ?? []).map((item, idx) => (
          <View key={`${item.sku ?? item.productName}-${idx}`} style={[s.itemRow, idx > 0 && s.rowDivider]}>
            <Text style={s.itemName} numberOfLines={2}>{item.productName}</Text>
            <Text style={s.mutedText}>x{item.quantity}</Text>
            <Text style={s.itemPrice}>{formatINR(item.price * item.quantity)}</Text>
          </View>
        ))}

        <Text style={s.sectionLabel}>Totals</Text>
        <View style={s.totalRow}><Text style={s.mutedText}>Subtotal</Text><Text style={s.totalVal}>{formatINR(pricing?.subtotal)}</Text></View>
        {!!pricing?.discount && (
          <View style={s.totalRow}><Text style={s.mutedText}>Discount</Text><Text style={s.totalVal}>-{formatINR(pricing.discount)}</Text></View>
        )}
        <View style={s.totalRow}><Text style={s.mutedText}>Delivery fee</Text><Text style={s.totalVal}>{formatINR(pricing?.deliveryFee)}</Text></View>
        <View style={[s.totalRow, s.grandRow]}>
          <Text style={s.grandLabel}>Order total</Text>
          <Text style={s.grandVal}>{formatINR(pricing?.grandTotal)}</Text>
        </View>

        <Pressable
          onPress={() => openOrder(selectedOrder)}
          accessibilityRole="button"
          accessibilityLabel={`${step.label} for order ${selectedOrder.orderId}`}
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.primaryBtnText}>{step.label}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Orders',
          subtitle: lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live order queue',
          showBell: true,
          rightActions: (
            <View style={s.headerRight}>
              {isExpanded && <TopNavLinks current="orders" />}
              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          ),
        }}
        backgroundColor={Colors.surface}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.stack}>
          {/* Search */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={18} color={Colors.textSubtle} />
            <TextInput
              style={s.searchInput}
              placeholder="Search order ID, customer, address or item"
              placeholderTextColor={Colors.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search orders"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={s.clearHit}>
                <Ionicons name="close-circle" size={18} color={Colors.textSubtle} />
              </Pressable>
            )}
          </View>

          {/* Status tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} accessibilityRole="tablist">
            {STATUS_TABS.map(tab => {
              const selected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${tab.label}, ${tabCounts[tab.key] ?? 0} orders`}
                  style={({ pressed }) => [s.tab, selected && s.tabSelected, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[s.tabText, selected && s.tabTextSelected]}>{tab.label}</Text>
                  <View style={[s.tabCount, selected && s.tabCountSelected]}>
                    <Text style={[s.tabCountText, selected && s.tabCountTextSelected]}>{tabCounts[tab.key] ?? 0}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Date range and sort */}
          <View style={s.filterBlock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} accessibilityLabel="Date range">
              {DATE_RANGES.map(range => {
                const selected = dateRange === range.key;
                return (
                  <Pressable
                    key={range.key}
                    onPress={() => setDateRange(range.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [s.chip, selected && s.chipSelected, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{range.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} accessibilityLabel="Sort order">
              {SORTS.map(sort => {
                const selected = sortKey === sort.key;
                return (
                  <Pressable
                    key={sort.key}
                    onPress={() => setSortKey(sort.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [s.chip, selected && s.chipSelected, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{sort.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Error banner when a refresh fails after data was loaded */}
          {status === 'error' && hasLoaded && (
            <View style={s.bannerError} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={s.bannerErrorTitle}>Could not refresh orders</Text>
                <Text style={s.bannerErrorText}>{errorMessage} Showing the last loaded orders.</Text>
              </View>
              <Pressable onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="Retry refresh" style={s.bannerRetry}>
                <Text style={s.bannerRetryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Result list */}
          {isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={s.mutedText}>Loading orders</Text>
            </View>
          ) : status === 'error' && !hasLoaded ? (
            <View style={s.errorPanel}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
              <Text style={s.emptyTitle}>We could not load orders</Text>
              <Text style={s.emptySub}>{errorMessage} Check your connection and try again.</Text>
              <Pressable onPress={handleRefresh} accessibilityRole="button" style={({ pressed }) => [s.primaryBtn, s.retryBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.primaryBtnText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[s.layout, isExpanded && s.layoutWide]}>
              <View style={[s.listCol, isExpanded && s.listColWide]}>
                <Text style={s.countText}>
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                </Text>
                {filteredOrders.length === 0 ? renderEmpty() : filteredOrders.map(renderOrderRow)}
              </View>
              {isExpanded && (
                <View style={s.detailCol}>{renderDetailPanel()}</View>
              )}
            </View>
          )}
        </View>
      </ScreenShell>

      <MobileBottomNav currentTab="orders" />
    </View>
  );
}

const tn = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  item: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: BorderRadii.input },
  itemActive: { backgroundColor: Colors.primaryLight },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textSecondary },
  labelActive: { color: Colors.primary },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  stack: { gap: Spacing.md },

  // Search and filters
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    minHeight: 48, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background, borderRadius: BorderRadii.input,
    borderWidth: 1, borderColor: Colors.inputBorder,
  },
  searchInput: { flex: 1, minHeight: 44, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary },
  clearHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2, paddingRight: Spacing.lg },
  filterBlock: { gap: 2 },
  chip: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: BorderRadii.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  chipSelected: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary },

  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 44, paddingHorizontal: 14, borderRadius: BorderRadii.pill,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  tabSelected: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  tabText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  tabTextSelected: { color: '#FFFFFF' },
  tabCount: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  tabCountSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.textSecondary },
  tabCountTextSelected: { color: '#FFFFFF' },

  // Status lines and banners
  countText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSubtle, marginTop: 2 },
  bannerError: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card, padding: Spacing.md,
  },
  bannerErrorTitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#7F1D1D' },
  bannerErrorText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: '#7F1D1D' },
  bannerRetry: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  bannerRetryText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.danger },

  loadingBox: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 48 },
  errorPanel: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  retryBtn: { flex: 0, alignSelf: 'stretch', minWidth: 180 },

  // Layout
  layout: { gap: Spacing.lg },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  listCol: { gap: Spacing.sm },
  listColWide: { flex: 7, minWidth: 0 },
  detailCol: { flex: 5, minWidth: 0 },

  // Order rows
  orderCard: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 4,
  },
  orderCardSelected: { borderColor: Colors.primary, borderWidth: 1.5 },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  orderId: { flex: 1, fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadii.pill },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  orderMeta: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  orderItems: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  orderBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 },
  orderValue: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary },
  orderAgo: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSubtle },
  stepPill: { minHeight: 36, paddingHorizontal: 12, borderRadius: BorderRadii.input, backgroundColor: Colors.primary, justifyContent: 'center' },
  stepPillText: { fontFamily: FontFamily.semibold, fontSize: 13, color: '#FFFFFF' },

  // Empty states
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyTitle: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, textAlign: 'center', marginTop: 4 },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle, textAlign: 'center', maxWidth: 340 },
  emptyAction: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', marginTop: 4 },
  emptyActionText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.primary },

  // Detail panel (desktop)
  detailEmpty: {
    alignItems: 'center', gap: 6, padding: Spacing.xl,
    backgroundColor: Colors.background, borderRadius: BorderRadii.card, borderWidth: 1, borderColor: Colors.border,
  },
  detailCard: {
    backgroundColor: Colors.background, borderRadius: BorderRadii.card, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  detailTitle: { flex: 1, fontFamily: FontFamily.bold, fontSize: 18, color: Colors.textPrimary },
  detailCustomer: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  sectionLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSubtle, marginTop: Spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  itemName: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  itemPrice: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  mutedText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  totalVal: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  grandRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 6, paddingTop: 8 },
  grandLabel: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textPrimary },
  grandVal: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.textPrimary },
  primaryBtn: {
    minHeight: 48, borderRadius: BorderRadii.input, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: Spacing.md,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFFFFF' },
});
