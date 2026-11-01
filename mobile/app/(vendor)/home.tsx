/**
 * Store Command Center: the vendor home screen.
 * Live store status, order counts, the active queue, low stock and recent updates.
 * Every number comes from the store or the API. Where there is no data yet, the screen says so.
 * File: mobile/app/(vendor)/home.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import useVendorStore from '../../src/store/useVendorStore';
import { useVendorSession, getSession } from '../../src/services/session';
import { vendorApi, ordersApi, earningsApi, inventoryApi, notificationsApi } from '../../src/services/api';
import { getSocket, registerVendor, setVendorStatus, acceptOrderOffer, declineOrderOffer } from '../../src/services/socket';
import { soundService } from '../../src/services/sound';
import ScreenShell from '../../src/components/ScreenShell';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';

const PAUSE_REASONS = [
  'Store busy / Heavy order rush',
  'Restocking shelf inventory',
  'Staff shift change / Break',
  'Closing for the day / Maintenance',
];

const ACTIVE_STATUSES = ['ACCEPTED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'];
const OFFER_SECONDS = 45;
const LOW_STOCK_LEVEL = 5;

const formatINR = (value: number | undefined | null) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

function formatTime(timestamp: number) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

export default function GlowVAIVendorHomeScreen() {
  // The signed-in vendor (the backend also takes it from the session token).
  const vendorSession = useVendorSession();
  const VENDOR_ID = vendorSession.vendorId || '';
  const STORE_ID = vendorSession.storeId || '';
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const {
    vendor, setVendor, setOnlineStatus,
    orders, setOrders, updateOrder,
    earnings, setEarnings,
    inventory, setInventory,
    notifications, setNotifications,
    setConnected,
  } = useVendorStore();

  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(vendor?.isOnline ?? true);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState(PAUSE_REASONS[0]);

  // Store name and area come from onboarding. Nothing is assumed until it is saved.
  const [storeDetails, setStoreDetails] = useState({ shopName: '', area: '' });

  // Incoming order offer
  const [incomingOrderModal, setIncomingOrderModal] = useState<any | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(OFFER_SECONDS);
  const [isClaimingOrder, setIsClaimingOrder] = useState(false);
  const [isDeclineConfirmOpen, setIsDeclineConfirmOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live socket connection
  const [isConnectedState, setIsConnectedState] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Store Command Center | GlowVAI Vendor Workspace';
    }

    loadStoreDetails();
    loadDashboardData();
    const teardownSockets = setupSockets();

    return () => {
      teardownSockets();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadStoreDetails = async () => {
    try {
      const stepA = await AsyncStorage.getItem('onb_step_a');
      if (stepA) {
        const parsed = JSON.parse(stepA);
        const area = [parsed.locality?.trim(), parsed.city?.trim()].filter(Boolean).join(', ');
        setStoreDetails({ shopName: parsed.storeName?.trim() || '', area });
      }
    } catch (_) {}
  };

  const loadDashboardData = async () => {
    setLoadError('');
    try {
      const [vRes, oRes, eRes, iRes, nRes] = await Promise.all([
        vendorApi.me().catch(() => null),
        // The order queue is the one call this screen cannot show without.
        ordersApi.getAll(),
        getSession().then(sess => (sess.vendorId ? earningsApi.getSummary(sess.vendorId) : null)).catch(() => null),
        inventoryApi.getAll().catch(() => null),
        VENDOR_ID ? notificationsApi.getAll(VENDOR_ID).catch(() => null) : Promise.resolve(null),
      ]);

      if (vRes?.vendor) {
        setVendor(vRes.vendor);
        setIsOnline(!!vRes.vendor.isOnline);
      }
      if (Array.isArray(oRes?.orders)) setOrders(oRes.orders);
      if (eRes?.earnings) setEarnings(eRes.earnings);
      if (Array.isArray(iRes?.items)) setInventory(iRes.items);
      if (Array.isArray(nRes?.notifications)) setNotifications(nRes.notifications);
      setHasLoaded(true);
    } catch (err: any) {
      setLoadError(err?.message || 'We could not reach the server.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Returns a teardown that removes these listeners. The socket is a shared singleton,
  // so without this each visit to the screen would add another order-offer handler.
  const setupSockets = () => {
    try {
      const socket = getSocket();
      // Deferred to the next tick: updating state synchronously inside the socket callback
      // crashed the web renderer during connect.
      const onConnect = () => {
        setTimeout(() => {
          setIsConnectedState(true);
          setConnected(true);
          registerVendor(VENDOR_ID, STORE_ID);
        }, 0);
      };
      const onDisconnect = () => setIsConnectedState(false);
      const onIncoming = (payload: { order: any }) => {
        if (payload?.order) triggerIncomingOrderAlert(payload.order);
      };
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('order:incoming', onIncoming);
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('order:incoming', onIncoming);
      };
    } catch (_) {
      return () => {};
    }
  };

  const triggerIncomingOrderAlert = (order: any) => {
    soundService.startRinging();
    setIncomingOrderModal(order);
    setCountdownSeconds(OFFER_SECONDS);
    setIsClaimingOrder(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          soundService.stopRinging();
          setIncomingOrderModal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleDuty = (next: boolean) => {
    if (!next) {
      setIsPauseModalOpen(true);
      return;
    }
    setIsOnline(true);
    setOnlineStatus(true);
    setVendorStatus(VENDOR_ID, true);
  };

  const confirmPauseDuty = () => {
    setIsOnline(false);
    setOnlineStatus(false);
    setVendorStatus(VENDOR_ID, false);
    vendorApi.setStatus(VENDOR_ID, false, selectedPauseReason).catch(() => {});
    setIsPauseModalOpen(false);
  };

  const handleAcceptIncomingOrder = () => {
    if (!incomingOrderModal?.orderId || isClaimingOrder) return;
    setIsClaimingOrder(true);

    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundService.stopRinging();

      const orderId: string = incomingOrderModal.orderId;
      acceptOrderOffer(orderId, VENDOR_ID);
      updateOrder(orderId, { status: 'ACCEPTED', vendorId: VENDOR_ID });
      setIsClaimingOrder(false);
      setIncomingOrderModal(null);
    }, 1200);
  };

  const confirmDeclineIncomingOrder = () => {
    if (!incomingOrderModal) return;
    if (timerRef.current) clearInterval(timerRef.current);
    soundService.stopRinging();
    declineOrderOffer(incomingOrderModal.orderId ?? '', VENDOR_ID);
    setIsDeclineConfirmOpen(false);
    setIncomingOrderModal(null);
  };

  const orderList = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  const activeOrdersList = useMemo(
    () => orderList.filter(o => ACTIVE_STATUSES.includes(o.status)),
    [orderList]
  );

  const orderCounts = useMemo(() => ({
    newOrders: orderList.filter(o => o.status === 'PENDING').length,
    active: activeOrdersList.length,
    delivered: orderList.filter(o => o.status === 'DELIVERED').length,
  }), [orderList, activeOrdersList]);

  const lowStockItemsList = useMemo(() => {
    const list = Array.isArray(inventory) ? inventory : [];
    return list
      .map(it => ({ ...it, left: it.stockOnHand ?? it.stock ?? it.availableStock ?? 0 }))
      .filter(it => it.left <= LOW_STOCK_LEVEL)
      .sort((a, b) => a.left - b.left);
  }, [inventory]);

  const recentUpdates = useMemo(
    () => (Array.isArray(notifications) ? notifications : []).slice(0, 3),
    [notifications]
  );

  const storeTitle = storeDetails.shopName || vendor?.shopName || 'Your store';
  const storeSubtitle = storeDetails.area || vendor?.locality || 'Store command center';
  const earningsToday = earnings?.today?.earnings;

  // ── Loading, error and empty states ────────────────────────────────────────
  const isLoading = !hasLoaded && !loadError;
  const showFullError = !hasLoaded && !!loadError;

  const renderFullError = () => (
    <View style={s.errorPanel}>
      <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
      <Text style={s.errorPanelTitle}>We could not load your store</Text>
      <Text style={s.errorPanelSub}>{loadError} Check your connection and try again.</Text>
      <Pressable
        onPress={handleRefresh}
        disabled={refreshing}
        accessibilityRole="button"
        accessibilityLabel="Retry loading the store"
        style={({ pressed }) => [s.primaryBtn, s.retryBtn, pressed && { opacity: 0.85 }]}
      >
        {refreshing
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={s.primaryBtnText}>Try again</Text>}
      </Pressable>
    </View>
  );

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: storeTitle,
          subtitle: storeSubtitle,
          showBell: true,
          rightActions: (
            <View style={s.headerRight}>
              {isExpanded && <TopNavLinks current="home" />}
              <CustomerAppRedirectButton storeName={storeTitle} />
            </View>
          ),
        }}
        backgroundColor={Colors.surface}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        contentContainerStyle={s.scrollContent}
      >
        {showFullError ? renderFullError() : (
          <View style={s.stack}>
            {/* Banners: a failed refresh keeps the last good data on screen */}
            {!!loadError && hasLoaded && (
              <View style={s.bannerError} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={s.bannerErrorTitle}>Showing the last loaded data</Text>
                  <Text style={s.bannerErrorText}>{loadError}</Text>
                </View>
                <Pressable onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="Retry" style={s.bannerRetry}>
                  <Text style={s.bannerRetryText}>Retry</Text>
                </Pressable>
              </View>
            )}
            {!isConnectedState && hasLoaded && (
              <View style={s.bannerWarn}>
                <Ionicons name="wifi-outline" size={18} color={Colors.warning} />
                <Text style={s.bannerWarnText}>Live order alerts are offline. Pull down to refresh.</Text>
              </View>
            )}

            {/* Store availability */}
            <View style={[s.card, isOnline && hasLoaded ? s.dutyOpen : s.dutyPaused]}>
              <View style={s.dutyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.dutyTitle}>
                    {!hasLoaded ? 'Loading store status' : isOnline ? 'Store is open' : 'Store is paused'}
                  </Text>
                  <Text style={s.dutySub}>
                    {!hasLoaded
                      ? 'Your availability appears once the store loads.'
                      : isOnline
                      ? 'You are receiving new orders.'
                      : 'New orders are not sent to this store until you turn it back on.'}
                  </Text>
                </View>
                <Switch
                  value={isOnline}
                  onValueChange={handleToggleDuty}
                  disabled={!hasLoaded}
                  trackColor={{ false: Colors.border, true: Colors.successBorder }}
                  thumbColor={isOnline ? Colors.success : Colors.textMuted}
                  ios_backgroundColor={Colors.border}
                  accessibilityLabel={isOnline ? 'Store open. Turn off to pause orders' : 'Store paused. Turn on to receive orders'}
                />
              </View>
            </View>

            {/* Key counts */}
            <View style={[s.metricGrid, isExpanded && s.metricGridWide]}>
              <MetricTile
                label="New orders"
                value={isLoading ? '—' : String(orderCounts.newOrders)}
                hint={orderCounts.newOrders ? 'Waiting for you to accept' : 'None waiting'}
                wide={isExpanded}
                onPress={() => router.push('/(vendor)/orders')}
              />
              <MetricTile
                label="Active"
                value={isLoading ? '—' : String(orderCounts.active)}
                hint="Being picked or packed"
                wide={isExpanded}
                onPress={() => router.push('/(vendor)/orders')}
              />
              <MetricTile
                label="Delivered"
                value={isLoading ? '—' : String(orderCounts.delivered)}
                hint="All time"
                wide={isExpanded}
                onPress={() => router.push('/(vendor)/orders')}
              />
              <MetricTile
                label="Earnings today"
                value={typeof earningsToday === 'number' ? formatINR(Math.round(earningsToday)) : '—'}
                hint={typeof earningsToday === 'number' ? 'Before settlement' : 'Shows when sales come in'}
                highlight
                wide={isExpanded}
                onPress={() => router.push('/(vendor)/earnings')}
              />
            </View>

            {/* Queue, stock and updates */}
            <View style={[s.columns, isExpanded && s.columnsWide]}>
              <View style={[s.column, isExpanded && s.colLeft]}>
                <View style={s.card}>
                  <View style={s.sectionHead}>
                    <Text style={s.sectionTitle}>Active orders ({activeOrdersList.length})</Text>
                    <Pressable onPress={() => router.push('/(vendor)/orders')} accessibilityRole="link" accessibilityLabel="View all orders" style={s.linkHit}>
                      <Text style={s.linkText}>View all</Text>
                    </Pressable>
                  </View>

                  {isLoading ? (
                    <View style={s.inlineLoader}>
                      <ActivityIndicator color={Colors.primary} />
                      <Text style={s.mutedText}>Loading orders</Text>
                    </View>
                  ) : activeOrdersList.length === 0 ? (
                    <EmptyBlock
                      icon="bag-handle-outline"
                      title="No active orders"
                      sub={isOnline ? 'Orders you accept show up here while they are being packed.' : 'The store is paused, so no new orders are coming in.'}
                    />
                  ) : (
                    activeOrdersList.map((ord, idx) => {
                      const ready = ord.status === 'PACKED' || ord.status === 'READY_FOR_PICKUP';
                      const itemCount = ord.items?.length || 0;
                      return (
                        <Pressable
                          key={ord.orderId}
                          onPress={() => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: ord.orderId } } as any)}
                          accessibilityRole="button"
                          accessibilityLabel={`Order ${ord.orderId}, ${itemCount} items`}
                          style={({ pressed }) => [s.queueRow, idx > 0 && s.rowDivider, pressed && { opacity: 0.8 }]}
                        >
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.queueId} numberOfLines={1}>#{ord.orderId}</Text>
                            <Text style={s.queueMeta} numberOfLines={1}>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatINR(ord.pricing?.grandTotal)}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => router.push({ pathname: (ready ? '/(vendor)/ready-pickup' : '/(vendor)/pack-order') as any, params: { orderId: ord.orderId } })}
                            accessibilityRole="button"
                            accessibilityLabel={ready ? `Hand over order ${ord.orderId}` : `Pack order ${ord.orderId}`}
                            style={({ pressed }) => [s.queueAction, pressed && { opacity: 0.85 }]}
                          >
                            <Text style={s.queueActionText}>{ready ? 'Hand over' : 'Pack'}</Text>
                          </Pressable>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>

              <View style={[s.column, isExpanded && s.colRight]}>
                <View style={s.card}>
                  <View style={s.sectionHead}>
                    <Text style={s.sectionTitle}>Low stock</Text>
                    <Pressable onPress={() => router.push('/(vendor)/catalog')} accessibilityRole="link" accessibilityLabel="Open catalog to restock" style={s.linkHit}>
                      <Text style={s.linkText}>Catalog</Text>
                    </Pressable>
                  </View>

                  {isLoading ? (
                    <View style={s.inlineLoader}>
                      <ActivityIndicator color={Colors.primary} />
                    </View>
                  ) : lowStockItemsList.length === 0 ? (
                    <EmptyBlock
                      icon="checkmark-circle-outline"
                      title={inventory?.length ? 'Stock levels look healthy' : 'No products listed yet'}
                      sub={inventory?.length ? `Nothing is at ${LOW_STOCK_LEVEL} units or fewer.` : 'Add a product to start tracking stock.'}
                      action={!inventory?.length ? { label: 'Add a product', onPress: () => router.push('/(vendor)/add-sku') } : undefined}
                    />
                  ) : (
                    lowStockItemsList.map((it, idx) => (
                      <View key={it.productId} style={[s.stockRow, idx > 0 && s.rowDivider]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.queueId} numberOfLines={1}>{it.name}</Text>
                          <Text style={s.queueMeta} numberOfLines={1}>
                            {it.bin ? `${it.bin} • ` : ''}
                            <Text style={it.left === 0 ? s.dangerText : s.warningText}>
                              {it.left === 0 ? 'Out of stock' : `${it.left} left`}
                            </Text>
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => router.push('/(vendor)/catalog')}
                          accessibilityRole="button"
                          accessibilityLabel={`Restock ${it.name}`}
                          style={({ pressed }) => [s.queueAction, pressed && { opacity: 0.85 }]}
                        >
                          <Text style={s.queueActionText}>Restock</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>

                <View style={s.card}>
                  <View style={s.sectionHead}>
                    <Text style={s.sectionTitle}>Recent updates</Text>
                    <Pressable onPress={() => router.push('/(vendor)/notifications')} accessibilityRole="link" accessibilityLabel="View all updates" style={s.linkHit}>
                      <Text style={s.linkText}>View all</Text>
                    </Pressable>
                  </View>
                  {recentUpdates.length === 0 ? (
                    <EmptyBlock icon="notifications-outline" title="No updates yet" sub="Order and payout alerts will appear here." />
                  ) : (
                    recentUpdates.map((n, idx) => (
                      <View key={n.id} style={[s.updateRow, idx > 0 && s.rowDivider]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.queueId} numberOfLines={1}>{n.title}</Text>
                          <Text style={s.queueMeta} numberOfLines={2}>{n.body}</Text>
                        </View>
                        <Text style={s.timeText}>{formatTime(n.createdAt)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScreenShell>

      <MobileBottomNav currentTab="home" />

      {/* Pause confirmation */}
      <Modal visible={isPauseModalOpen} transparent animationType="fade" onRequestClose={() => setIsPauseModalOpen(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Pause new orders?</Text>
            <Text style={s.sheetSub}>Choose a reason. Customers will not see this store until you turn it back on.</Text>
            {PAUSE_REASONS.map(reason => {
              const selected = selectedPauseReason === reason;
              return (
                <Pressable
                  key={reason}
                  onPress={() => setSelectedPauseReason(reason)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [s.reasonRow, selected && s.reasonRowSelected, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? Colors.primary : Colors.textSubtle}
                  />
                  <Text style={[s.reasonText, selected && s.reasonTextSelected]}>{reason}</Text>
                </Pressable>
              );
            })}
            <View style={s.sheetActions}>
              <Pressable onPress={() => setIsPauseModalOpen(false)} accessibilityRole="button" style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.secondaryBtnText}>Keep store open</Text>
              </Pressable>
              <Pressable onPress={confirmPauseDuty} accessibilityRole="button" style={({ pressed }) => [s.dangerBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.dangerBtnText}>Pause store</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incoming order offer */}
      <Modal visible={!!incomingOrderModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.sheet, isExpanded && s.sheetWide]}>
            <View style={s.offerHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.offerLabel}>New order offer</Text>
                <Text style={s.offerId} numberOfLines={1}>#{incomingOrderModal?.orderId ?? ''}</Text>
              </View>
              <View style={[s.offerTimer, countdownSeconds <= 10 && s.offerTimerUrgent]}>
                <Text style={[s.offerTimerText, countdownSeconds <= 10 && s.offerTimerTextUrgent]}>
                  {`00:${String(countdownSeconds).padStart(2, '0')}`}
                </Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  { width: `${(countdownSeconds / OFFER_SECONDS) * 100}%` },
                  countdownSeconds <= 10 && s.progressFillUrgent,
                ]}
              />
            </View>

            <View style={s.offerBody}>
              <Text style={s.offerSectionLabel}>Customer</Text>
              <Text style={s.offerCustomer}>{incomingOrderModal?.customerName || 'Customer details unavailable'}</Text>
              {!!incomingOrderModal?.shippingAddress?.fullAddress && (
                <Text style={s.mutedText} numberOfLines={2}>{incomingOrderModal.shippingAddress.fullAddress}</Text>
              )}

              <View style={s.offerTotalRow}>
                <Text style={s.offerSectionLabel}>Order value</Text>
                <Text style={s.offerTotal}>{formatINR(incomingOrderModal?.pricing?.grandTotal)}</Text>
              </View>

              <Text style={s.offerSectionLabel}>Items ({incomingOrderModal?.items?.length ?? 0})</Text>
              {(incomingOrderModal?.items ?? []).map((it: any, idx: number) => (
                <View key={`${it.sku ?? it.productName}-${idx}`} style={[s.offerItemRow, idx > 0 && s.rowDivider]}>
                  <Text style={s.offerItemName} numberOfLines={2}>{it.productName}</Text>
                  <Text style={s.mutedText}>x{it.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={s.sheetActions}>
              <Pressable
                onPress={() => setIsDeclineConfirmOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Decline order"
                style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.secondaryBtnText}>Decline</Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptIncomingOrder}
                disabled={isClaimingOrder}
                accessibilityRole="button"
                accessibilityLabel="Accept order"
                accessibilityState={{ busy: isClaimingOrder }}
                style={({ pressed }) => [s.primaryBtn, isClaimingOrder && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
              >
                {isClaimingOrder
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={s.primaryBtnText}>Accept order</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Decline confirmation */}
      <Modal visible={isDeclineConfirmOpen} transparent animationType="fade" onRequestClose={() => setIsDeclineConfirmOpen(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Decline this order?</Text>
            <Text style={s.sheetSub}>Order #{incomingOrderModal?.orderId ?? ''} will be offered to another store.</Text>
            <View style={s.sheetActions}>
              <Pressable onPress={() => setIsDeclineConfirmOpen(false)} accessibilityRole="button" style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.secondaryBtnText}>Go back</Text>
              </Pressable>
              <Pressable onPress={confirmDeclineIncomingOrder} accessibilityRole="button" style={({ pressed }) => [s.dangerBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.dangerBtnText}>Decline order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

function MetricTile({
  label, value, hint, onPress, highlight = false, wide = false,
}: { label: string; value: string; hint: string; onPress: () => void; highlight?: boolean; wide?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. ${hint}`}
      style={({ pressed }) => [s.metric, wide && s.metricWide, pressed && { opacity: 0.85 }]}
    >
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricValue, highlight && s.metricValueHighlight]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={s.metricHint} numberOfLines={2}>{hint}</Text>
    </Pressable>
  );
}

function EmptyBlock({
  icon, title, sub, action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={s.emptyBlock}>
      <Ionicons name={icon} size={28} color={Colors.textSubtle} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
      {action && (
        <Pressable onPress={action.onPress} accessibilityRole="button" style={({ pressed }) => [s.emptyAction, pressed && { opacity: 0.85 }]}>
          <Text style={s.emptyActionText}>{action.label}</Text>
        </Pressable>
      )}
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
  stack: { gap: Spacing.lg },

  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },

  // Errors and banners
  errorPanel: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  errorPanelTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: Colors.textPrimary, textAlign: 'center' },
  errorPanelSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' },
  bannerError: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card, padding: Spacing.md,
  },
  bannerErrorTitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#7F1D1D' },
  bannerErrorText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: '#7F1D1D' },
  bannerRetry: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  bannerRetryText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.danger },
  bannerWarn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.card, padding: Spacing.md,
  },
  bannerWarnText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: '#78350F' },

  // Duty card
  dutyOpen: { backgroundColor: Colors.successLight, borderColor: Colors.successBorder },
  dutyPaused: { backgroundColor: Colors.background, borderColor: Colors.border },
  dutyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dutyTitle: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 24, color: Colors.textPrimary },
  dutySub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, marginTop: 2 },

  // Metrics
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricGridWide: { flexWrap: 'nowrap' },
  metricWide: { flexBasis: 0, minWidth: 0 },
  metric: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 96,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  metricLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSubtle },
  metricValue: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: Colors.textPrimary, marginTop: 4 },
  metricValueHighlight: { color: Colors.primary },
  metricHint: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textSubtle, marginTop: 2 },

  // Two-column body
  columns: { gap: Spacing.lg },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: Spacing.lg },
  colLeft: { flex: 7, minWidth: 0 },
  colRight: { flex: 5, minWidth: 0 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  linkHit: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },

  queueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, paddingVertical: 10 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, paddingVertical: 10 },
  updateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  queueId: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  queueMeta: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textSecondary, marginTop: 2 },
  queueAction: {
    minHeight: 44, minWidth: 44, paddingHorizontal: 14, borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  queueActionText: { fontFamily: FontFamily.semibold, fontSize: 13, color: '#FFFFFF' },
  warningText: { color: Colors.warning, fontFamily: FontFamily.semibold },
  dangerText: { color: Colors.danger, fontFamily: FontFamily.semibold },
  timeText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSubtle, marginTop: 2 },
  mutedText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
  inlineLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },

  emptyBlock: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 6 },
  emptyTitle: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, marginTop: 4, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle, textAlign: 'center', maxWidth: 320 },
  emptyAction: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', marginTop: 4 },
  emptyActionText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.primary },

  // Buttons
  primaryBtn: {
    flex: 1, minHeight: 48, borderRadius: BorderRadii.input, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFFFFF' },
  retryBtn: { flex: 0, alignSelf: 'stretch', minWidth: 180 },
  secondaryBtn: {
    flex: 1, minHeight: 48, borderRadius: BorderRadii.input, borderWidth: 1, borderColor: '#CBD5E1',
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  secondaryBtnText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  dangerBtn: {
    flex: 1, minHeight: 48, borderRadius: BorderRadii.input, borderWidth: 1, borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  dangerBtnText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.danger },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: Colors.background, borderRadius: 14, padding: Spacing.xl, gap: Spacing.md },
  sheetWide: { maxWidth: 560 },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary },
  sheetSub: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 48,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadii.input, borderWidth: 1, borderColor: Colors.border,
  },
  reasonRowSelected: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  reasonText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textPrimary },
  reasonTextSelected: { fontFamily: FontFamily.semibold, color: Colors.primary },

  // Offer
  offerHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  offerLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.primary },
  offerId: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary },
  offerTimer: { backgroundColor: Colors.textPrimary, borderRadius: BorderRadii.input, paddingHorizontal: 12, paddingVertical: 6 },
  offerTimerUrgent: { backgroundColor: Colors.danger },
  offerTimerText: { fontFamily: FontFamily.bold, fontSize: 18, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  offerTimerTextUrgent: { color: '#FFFFFF' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  progressFillUrgent: { backgroundColor: Colors.danger },
  offerBody: { gap: 4 },
  offerSectionLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSubtle, marginTop: Spacing.sm },
  offerCustomer: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  offerTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offerTotal: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textPrimary },
  offerItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: 8 },
  offerItemName: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
});
