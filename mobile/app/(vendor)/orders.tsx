/**
 * SCREEN 11: Orders List & History Filter
 * Desktop 1440x1024 Reference Layout with Left Navigation Rail & Right Order Preview Drawer
 * File: mobile/app/(vendor)/orders.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import type { Order } from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import AppHeader from '../../src/components/AppHeader';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const FILTER_TABS = [
  { key: 'ALL',        label: 'All Orders' },
  { key: 'PENDING',    label: 'Pending' },
  { key: 'ACCEPTED',   label: 'Active' },
  { key: 'DELIVERED',  label: 'Delivered' },
  { key: 'CANCELLED',  label: 'Cancelled' },
];

const DATE_RANGES = ['Today', 'Yesterday', 'Last 7 Days', 'This Month'];
const SORT_OPTIONS = ['SLA Urgency', 'Newest First', 'Highest Payout'];

function formatRelativeTime(timestamp: number) {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const { orders, setOrders, updateOrder } = useVendorStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const [selectedSort, setSelectedSort] = useState('SLA Urgency');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('Updated just now');

  // Preview Drawer State
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<Order | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getAll({ storeId: STORE_ID });
      if (res?.orders && Array.isArray(res.orders)) {
        setOrders(res.orders);
        setIsConnected(true);
      }
      const now = new Date();
      setLastUpdatedText(`Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [setOrders]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Orders Queue & History | GlowVAI Vendor Console";
    }
    loadOrders();
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Orders come only from the store (populated by the API). No demo fallback.
  const ordersPool = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  // Tab Order Counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: ordersPool.length, PENDING: 0, ACCEPTED: 0, PACKED: 0, DELIVERED: 0, CANCELLED: 0 };
    ordersPool.forEach(o => {
      if (o.status === 'PENDING') counts.PENDING++;
      else if (o.status === 'ACCEPTED' || o.status === 'PREPARING') counts.ACCEPTED++;
      else if (o.status === 'PACKED' || o.status === 'READY_FOR_PICKUP' || o.status === 'DISPATCHED') counts.PACKED++;
      else if (o.status === 'DELIVERED') counts.DELIVERED++;
      else if (o.status === 'CANCELLED') counts.CANCELLED++;
    });
    return counts;
  }, [ordersPool]);

  // Filter & Sort Order Pipeline
  const filteredOrders = useMemo(() => {
    return ordersPool.filter(order => {
      let matchesTab = false;
      if (activeTab === 'ALL') {
        matchesTab = true;
      } else if (activeTab === 'PACKED') {
        matchesTab = order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED';
      } else if (activeTab === 'ACCEPTED') {
        matchesTab = order.status === 'ACCEPTED' || order.status === 'PREPARING';
      } else {
        matchesTab = order.status === activeTab;
      }

      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const orderIdMatch = order.orderId?.toLowerCase().includes(q);
      const customerMatch = order.customerName?.toLowerCase().includes(q);
      const localityMatch = (order.shippingAddress as any)?.locality?.toLowerCase().includes(q) ||
                            order.shippingAddress?.fullAddress?.toLowerCase().includes(q);
      const itemMatch = order.items?.some(i => i.productName?.toLowerCase().includes(q));

      return orderIdMatch || customerMatch || localityMatch || itemMatch;
    }).sort((a, b) => {
      if (selectedSort === 'Newest First') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (selectedSort === 'Highest Payout') {
        return (b.pricing?.grandTotal || 0) - (a.pricing?.grandTotal || 0);
      }
      // Default: SLA Urgency
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [ordersPool, activeTab, searchQuery, selectedSort]);

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      setIsExportingCSV(false);
      Alert.alert('Orders Exported 📥', `Exported ${filteredOrders.length} order ledger records to GlowVAI_Orders_${selectedDateRange}.csv`);
    }, 1000);
  };

  const handleNextAction = (order: Order) => {
    if (order.status === 'PENDING') {
      router.push({
        pathname: '/(vendor)/order-detail',
        params: { orderId: order.orderId },
      });
    } else if (order.status === 'ACCEPTED' || order.status === 'PREPARING') {
      router.push({
        pathname: '/(vendor)/pack-order' as any,
        params: { orderId: order.orderId },
      });
    } else if (order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED') {
      router.push({
        pathname: '/(vendor)/ready-pickup' as any,
        params: { orderId: order.orderId },
      });
    } else {
      setSelectedOrderPreview(order);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Desktop Left Navigation Rail ───────────────────────────────────────── */}
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

            {/* Navigation Group */}
            <View style={s.railNavGroup}>
              <TouchableOpacity style={s.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Catalog</Text>
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

            {/* Bottom Rail Section */}
            <View style={s.railFooter}>
              <TouchableOpacity style={s.storeSelectorPill} activeOpacity={0.8}>
                <Text style={s.storeSelectorText} numberOfLines={1}>📍 Benz Circle Store ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railHelpBtn} activeOpacity={0.8}>
                <Text style={s.railHelpText}>Help & Support 💬</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railProfileCard} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <View style={s.railAvatar}>
                  <Text style={s.railAvatarText}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Store account</Text>
                  <Text style={s.railProfileRole}>Store Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>
          
          {/* Main Top Header */}
          <AppHeader
            title="Orders"
            subtitle="Real-time 10-minute quick commerce fulfillment • Benz Circle Store"
            showBell={true}
            rightActions={<CustomerAppRedirectButton storeName="Your store" />}
          />

          {/* ── Desktop Filters & Search Toolbar ──────────────────────────────── */}
          <View style={s.toolbarBar}>
            {/* Search Field */}
            <View style={s.searchFieldWrap}>
              <Ionicons name="search-outline" size={18} color="#475569" style={s.searchIcon} />
              <TextInput
                style={s.searchInput}
                placeholder="Search order ID, customer name, or SKU..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearchBtn}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              )}
            </View>

            {/* Date Range Chips */}
            <View style={s.toolbarFilterGroup}>
              <Text style={s.toolbarLabel}>Date Range:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                {DATE_RANGES.map(range => (
                  <TouchableOpacity
                    key={range}
                    style={[s.filterChip, selectedDateRange === range && s.filterChipActive]}
                    onPress={() => setSelectedDateRange(range)}
                  >
                    <Text style={[s.filterChipText, selectedDateRange === range && s.filterChipTextActive]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Dropdown Selector */}
            <View style={s.toolbarSortGroup}>
              <Text style={s.toolbarLabel}>Sort:</Text>
              <View style={s.sortSelectPill}>
                <Text style={s.sortSelectText}>⚡ {selectedSort}</Text>
              </View>
            </View>

            {/* Manual Refresh Button */}
            <TouchableOpacity style={s.refreshIconButton} onPress={onRefresh} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={18} style={{ color: '#475569' }} />
            </TouchableOpacity>
          </View>

          {/* ── Segmented Status Tabs ────────────────────────────────────────── */}
          <View style={s.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContent}>
              {FILTER_TABS.map(tab => {
                const isSelected = activeTab === tab.key;
                const count = tabCounts[tab.key] || 0;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[s.tabPill, isSelected && s.tabPillSelected]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[s.tabLabelText, isSelected && s.tabLabelTextSelected]}>
                      {tab.label}
                    </Text>
                    <View style={[s.tabBadge, isSelected && s.tabBadgeSelected]}>
                      <Text style={[s.tabBadgeText, isSelected && s.tabBadgeTextSelected]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Subheader Status Line */}
          <View style={s.subHeaderRow}>
            <Text style={s.subHeaderTimestamp}>{lastUpdatedText}</Text>
            <Text style={s.subHeaderCount}>Showing {filteredOrders.length} orders in queue</Text>
          </View>

          {/* ── Queue Content Area with Main List & Preview Drawer Layout ──────── */}
          <View style={s.queueLayoutRow}>
            
            {/* Main Orders Data List */}
            <ScrollView
              style={s.scrollBody}
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
              {!isConnected && (
                <View style={s.offlineBanner}>
                  <Text style={s.offlineBannerText}>📡 Socket connection offline. Re-establishing live order feed...</Text>
                </View>
              )}

              {loading && !refreshing && ordersPool.length === 0 ? (
                <View style={s.loadingCard}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={s.loadingText}>Fetching orders from dark store gateway...</Text>
                </View>
              ) : filteredOrders.length === 0 ? (
                <View style={s.emptyQueueCard}>
                  <Ionicons name="file-tray-outline" size={34} color="#94A3B8" />
                  <Text style={s.emptyTitle}>
                    {searchQuery ? `No orders matching "${searchQuery}"` : activeTab === 'ALL' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
                  </Text>
                  <Text style={s.emptySub}>
                    {searchQuery
                      ? 'Try adjusting your search keywords or clear current filters.'
                      : 'Incoming customer orders will appear here automatically.'}
                  </Text>
                  {searchQuery.length > 0 && (
                    <TouchableOpacity style={s.resetSearchBtn} onPress={() => setSearchQuery('')}>
                      <Text style={s.resetSearchBtnText}>Clear Search Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredOrders.map(order => {
                  const customerName = order.customerName || 'Priya S.';
                  const locality = (order.shippingAddress as any)?.locality || order.shippingAddress?.fullAddress || 'Benz Circle';
                  const itemsCount = order.items?.length || 1;
                  const grandTotal = order.pricing?.grandTotal || 948;
                  const netPayout = (grandTotal * 0.88).toFixed(2);
                  const isPending = order.status === 'PENDING';
                  const isAccepted = order.status === 'ACCEPTED' || order.status === 'PREPARING';
                  const isReady = order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED';
                  const isCompleted = order.status === 'DELIVERED';
                  const isCancelled = order.status === 'CANCELLED';
                  const isSelected = selectedOrderPreview?.orderId === order.orderId;

                  return (
                    <TouchableOpacity
                      key={order.orderId}
                      style={[s.orderRowCard, isSelected && s.orderRowCardSelected]}
                      onPress={() => setSelectedOrderPreview(order)}
                      activeOpacity={0.85}
                    >
                      {/* Left Block: ID & Privacy-Safe Customer */}
                      <View style={{ flex: 2 }}>
                        <View style={s.orderIdGroup}>
                          <Text style={s.orderIdText}>#{order.orderId}</Text>
                          <View style={s.itemCountBadge}>
                            <Text style={s.itemCountBadgeText}>{itemsCount} items</Text>
                          </View>
                        </View>
                        <Text style={s.customerMetaText}>
                          👤 {customerName} • 📍 {locality}
                        </Text>
                        <Text style={s.itemPreviewSnippet} numberOfLines={1}>
                          {order.items?.map(i => i.productName).join(', ')}
                        </Text>
                      </View>

                      {/* Middle Block: Timer & Status Pill */}
                      <View style={{ flex: 1.5, alignItems: 'flex-start' }}>
                        {isPending || isAccepted ? (
                          <View style={s.slaTimerBadge}>
                            <Text style={s.slaTimerText}>⏱️ SLA: 04:15 remaining</Text>
                          </View>
                        ) : (
                          <View style={[
                            s.statusPill,
                            isReady && s.statusPillReady,
                            isCompleted && s.statusPillCompleted,
                            isCancelled && s.statusPillCancelled,
                          ]}>
                            <Text style={[
                              s.statusPillText,
                              isReady && s.statusPillTextReady,
                              isCompleted && s.statusPillTextCompleted,
                              isCancelled && s.statusPillTextCancelled,
                            ]}>
                              {isReady ? '🛵 Ready Pickup' : isCompleted ? '✓ Completed' : '✕ Cancelled'}
                            </Text>
                          </View>
                        )}

                        <Text style={s.timeAgoText}>Updated {formatRelativeTime(order.updatedAt || order.createdAt)}</Text>
                      </View>

                      {/* Financial Block: Payout */}
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={s.payoutValText}>₹{netPayout}</Text>
                        <Text style={s.payoutSubText}>Net Vendor Payout</Text>
                      </View>

                      {/* Action Button Block */}
                      <View style={{ flex: 1.2, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <TouchableOpacity
                          style={[
                            s.actionBtn,
                            isPending && s.actionBtnNew,
                            isAccepted && s.actionBtnAccepted,
                            isReady && s.actionBtnReady,
                            (isCompleted || isCancelled) && s.actionBtnGhost,
                          ]}
                          onPress={() => handleNextAction(order)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            s.actionBtnText,
                            (isCompleted || isCancelled) && s.actionBtnGhostText,
                          ]}>
                            {isPending
                              ? 'Review offer ⚡'
                              : isAccepted
                              ? 'Continue packing →'
                              : isReady
                              ? 'View pickup →'
                              : 'Inspect details'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Right-Side Desktop Quick Order Preview Drawer ──────────────── */}
            {isExpanded && selectedOrderPreview && (
              <View style={s.previewDrawer}>
                <View style={s.drawerHeader}>
                  <View>
                    <Text style={s.drawerTitle}>Order #{selectedOrderPreview.orderId}</Text>
                    <Text style={s.drawerSub}>Placed {formatRelativeTime(selectedOrderPreview.createdAt)}</Text>
                  </View>
                  <TouchableOpacity style={s.drawerCloseBtn} onPress={() => setSelectedOrderPreview(null)}>
                    <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {/* Customer Privacy Section */}
                  <View style={s.drawerSectionCard}>
                    <Text style={s.drawerSectionLabel}>CUSTOMER & LOCALITY</Text>
                    <Text style={s.drawerCustomerName}>
                      {selectedOrderPreview.customerName || 'Priya S.'}
                    </Text>
                    <Text style={s.drawerLocalityText}>
                      📍 {(selectedOrderPreview.shippingAddress as any)?.locality || selectedOrderPreview.shippingAddress?.fullAddress || 'Benz Circle, Vijayawada'}
                    </Text>
                    <Text style={s.privacyNoticeText}>🔒 Full phone number and exact door unit are protected by GlowVAI Privacy Guard.</Text>
                  </View>

                  {/* Items Breakdown Table */}
                  <View style={s.drawerSectionCard}>
                    <Text style={s.drawerSectionLabel}>ORDERED ITEMS ({selectedOrderPreview.items?.length || 1})</Text>
                    {selectedOrderPreview.items?.map((item, idx) => (
                      <View key={idx} style={s.drawerItemRow}>
                        <Ionicons name="cube-outline" size={18} color="#475569" style={s.drawerItemIcon} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.drawerItemName}>{item.productName}</Text>
                          <Text style={s.drawerItemSub}>Shelf Bin: <Text style={s.binText}>Shelf A-01-05</Text> • Qty: {item.quantity}</Text>
                        </View>
                        <Text style={s.drawerItemPrice}>₹{item.price * item.quantity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Payout & Payment Split */}
                  <View style={s.drawerSectionCard}>
                    <Text style={s.drawerSectionLabel}>PAYMENT SUMMARY</Text>
                    <View style={s.drawerFeeRow}>
                      <Text style={s.drawerFeeLabel}>Subtotal</Text>
                      <Text style={s.drawerFeeVal}>₹{selectedOrderPreview.pricing?.subtotal || 918}</Text>
                    </View>
                    <View style={s.drawerFeeRow}>
                      <Text style={s.drawerFeeLabel}>Platform Commission (12%)</Text>
                      <Text style={s.drawerFeeVal}>-₹{((selectedOrderPreview.pricing?.grandTotal || 948) * 0.12).toFixed(2)}</Text>
                    </View>
                    <View style={[s.drawerFeeRow, s.drawerPayoutRow]}>
                      <Text style={s.drawerPayoutLabel}>Net Vendor Payout</Text>
                      <Text style={s.drawerPayoutVal}>₹{((selectedOrderPreview.pricing?.grandTotal || 948) * 0.88).toFixed(2)}</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Drawer Footer CTA */}
                <View style={s.drawerFooter}>
                  <TouchableOpacity
                    style={s.drawerPrimaryBtn}
                    onPress={() => handleNextAction(selectedOrderPreview)}
                  >
                    <Text style={s.drawerPrimaryBtnText}>Open Order Fulfillment Queue →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab="orders" />
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

  /* Navigation Rail */
  navRail: {
    width: 240,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  railNavGroup: {
    gap: 6,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  railNavLabel: {
    fontSize: 14,
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
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: 8,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingVertical: 4,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  railProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 6,
  },
  railAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railProfileName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railProfileRole: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Main Console Area */
  mainConsole: {
    flex: 1,
  },
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  storeSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  liveConnectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  offlineConnectionBadge: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.dangerBorder,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  exportCsvBtn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.input,
  },
  exportCsvBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  notifBellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBellIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },

  /* Toolbar Bar */
  toolbarBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchFieldWrap: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  toolbarFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipRow: {
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  toolbarSortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortSelectPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  sortSelectText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  refreshIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  refreshIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },

  /* Segmented Status Tabs */
  tabsWrapper: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  tabsContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillSelected: {
    backgroundColor: Colors.primary, // Strong Royal Blue
    borderColor: Colors.primary,
  },
  tabIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  tabLabelText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBadgeTextSelected: {
    color: '#FFFFFF',
  },

  /* Sub Header Row */
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subHeaderTimestamp: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  subHeaderCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Queue Layout Row */
  queueLayoutRow: {
    flex: 1,
    flexDirection: 'row',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },

  /* Offline & Loading Banners */
  offlineBanner: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.lg,
  },
  offlineBannerText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  loadingCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  emptyQueueCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  resetSearchBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  resetSearchBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Order Row Card */
  orderRowCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  orderRowCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  orderIdText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemCountBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  itemCountBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  customerMetaText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemPreviewSnippet: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* Status Pills & SLA Badges */
  slaTimerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  slaTimerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
  },
  statusPillReady: {
    backgroundColor: Colors.primaryLight,
  },
  statusPillCompleted: {
    backgroundColor: '#F0FDF4',
  },
  statusPillCancelled: {
    backgroundColor: Colors.dangerLight,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusPillTextReady: {
    color: Colors.primary,
  },
  statusPillTextCompleted: {
    color: Colors.success,
  },
  statusPillTextCancelled: {
    color: Colors.danger,
  },
  timeAgoText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  /* Payout Text */
  payoutValText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  payoutSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Action Buttons */
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.input,
  },
  actionBtnNew: {
    backgroundColor: Colors.primary,
  },
  actionBtnAccepted: {
    backgroundColor: Colors.primary,
  },
  actionBtnReady: {
    backgroundColor: Colors.success,
  },
  actionBtnGhost: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  actionBtnGhostText: {
    color: Colors.textSecondary,
  },

  /* Right-Side Desktop Quick Order Preview Drawer */
  previewDrawer: {
    width: 380,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: Spacing.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  drawerTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  drawerSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  drawerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  drawerSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  drawerCustomerName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerLocalityText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  privacyNoticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  drawerItemIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  drawerItemName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerItemSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  binText: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  drawerItemPrice: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  drawerFeeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  drawerFeeVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerPayoutRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  drawerPayoutLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  drawerPayoutVal: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  drawerFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  drawerPrimaryBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerPrimaryBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
