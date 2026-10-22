/**
 * SCREEN 09: Store Command Center
 * Desktop 1440x1024 Reference Layout with Left Navigation Rail & 1200px Content Console
 * File: mobile/app/(vendor)/home.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { vendorApi, ordersApi, earningsApi, inventoryApi } from '../../src/services/api';
import { getSocket, registerVendor, setVendorStatus, acceptOrderOffer, declineOrderOffer } from '../../src/services/socket';
import { soundService } from '../../src/services/sound';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import AppHeader from '../../src/components/AppHeader';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';
const STORE_ID  = process.env.EXPO_PUBLIC_STORE_ID  || 'DS-VIJ-01';

const PAUSE_REASONS = [
  'Store busy / Heavy order rush',
  'Restocking shelf inventory',
  'Staff shift change / Break',
  'Closing for the day / Maintenance',
];

export default function GlowVAIVendorHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const {
    vendor, setVendor, setOnlineStatus,
    orders, setOrders, updateOrder,
    earnings, setEarnings,
    inventory, setInventory, updateInventoryItem,
    setConnected,
  } = useVendorStore();

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(vendor?.isOnline ?? true);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState(PAUSE_REASONS[0]);

  // Demo Edge State Switcher State
  const [demoState, setDemoState] = useState<'normal' | 'first_day' | 'paused' | 'no_orders' | 'reconnecting' | 'offline' | 'stale_metrics' | 'api_error' | 'permission_denied'>('normal');

  // Store Details State
  const [storeDetails, setStoreDetails] = useState({
    shopName: 'Your store',
    locality: 'Benz Circle',
    city: 'Vijayawada',
    operatingHours: '09:00 AM – 10:00 PM',
  });

  // Modals State
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [incomingOrderModal, setIncomingOrderModal] = useState<any | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  const [isClaimingOrder, setIsClaimingOrder] = useState(false);
  const [isDeclineConfirmOpen, setIsDeclineConfirmOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connection & Offline State
  const [isConnectedState, setIsConnectedState] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Store Command Center | GlowVAI Vendor Workspace";
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
        setStoreDetails({
          shopName: parsed.storeName?.trim() || 'Your store',
          locality: parsed.locality?.trim() || 'Benz Circle',
          city: parsed.city?.trim() || 'Vijayawada',
          operatingHours: '09:00 AM – 10:00 PM',
        });
      }
    } catch (_) {}
  };

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const [vRes, oRes, eRes, iRes] = await Promise.all([
        vendorApi.getProfile(VENDOR_ID).catch(() => null),
        ordersApi.getAll({ storeId: STORE_ID }).catch(() => null),
        earningsApi.getSummary(VENDOR_ID).catch(() => null),
        inventoryApi.getAll(STORE_ID).catch(() => null),
      ]);

      if (vRes?.vendor) setVendor(vRes.vendor);
      if (oRes?.orders && Array.isArray(oRes.orders)) setOrders(oRes.orders);
      if (eRes?.earnings) setEarnings(eRes.earnings);
      if (iRes?.items && Array.isArray(iRes.items)) setInventory(iRes.items);
    } catch (e) {
      setIsConnectedState(false);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Returns a teardown that removes these listeners. The socket is a shared singleton,
  // so without this each visit to the screen would add another order-offer handler.
  const setupSockets = () => {
    try {
      const socket = getSocket();
      // Deferred to the next tick: updating state synchronously inside the socket callback
      // crashed the web renderer during connect.
      const onConnect = () => {
        // Deferred to the next tick: updating state synchronously inside the socket callback
        // stalled the web renderer during connect.
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
    setCountdownSeconds(45);
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

  const handleToggleDuty = () => {
    if (isOnline) {
      setIsPauseModalOpen(true);
    } else {
      setIsOnline(true);
      setOnlineStatus(true);
      setVendorStatus(VENDOR_ID, true);
    }
  };

  const confirmPauseDuty = () => {
    setIsOnline(false);
    setOnlineStatus(false);
    setVendorStatus(VENDOR_ID, false);
    vendorApi.setStatus(VENDOR_ID, false, selectedPauseReason).catch(() => {});
    setIsPauseModalOpen(false);
  };

  const handleAcceptIncomingOrder = async () => {
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
      Alert.alert('Order Accepted 🎉', `Order #${orderId} server lock acquired. Please start packing!`);
    }, 1200);
  };

  const handleDeclineIncomingOrder = () => {
    setIsDeclineConfirmOpen(true);
  };

  const confirmDeclineIncomingOrder = () => {
    if (!incomingOrderModal) return;
    if (timerRef.current) clearInterval(timerRef.current);
    soundService.stopRinging();
    declineOrderOffer(incomingOrderModal.orderId ?? '', VENDOR_ID);
    setIsDeclineConfirmOpen(false);
    setIncomingOrderModal(null);
  };

  const activeOrdersList = useMemo(() => {
    if (demoState === 'no_orders' || demoState === 'first_day') return [];
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(o => ['ACCEPTED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(o.status));
  }, [orders, demoState]);

  const orderCounts = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return {
      newOrders: list.filter(o => o.status === 'PENDING').length,
      active: list.filter(o => ['ACCEPTED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(o.status)).length,
      delivered: list.filter(o => o.status === 'DELIVERED').length,
    };
  }, [orders]);

  const lowStockItemsList = useMemo(() => {
    if (demoState === 'first_day') return [];
    const list = Array.isArray(inventory) ? inventory : [];
    const filtered = list.filter((it: any) => {
      const s = it?.stockOnHand ?? it?.stock ?? it?.availableStock ?? 0;
      return s > 0 && s <= 5;
    });

    return filtered;
  }, [inventory, demoState]);

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
              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Orders</Text>
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
                  <Text style={s.railAvatarText}>G</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Store account</Text>
                  <Text style={s.railProfileRole}>Store Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Area ─────────────────────────────────────────────────── */}
        <View style={s.mainConsole}>
          
          {/* Main Console Header */}
          <AppHeader
            title={storeDetails.shopName}
            subtitle={`📍 ${storeDetails.locality}, ${storeDetails.city} • Store Command Center`}
            showBell={true}
            rightActions={<CustomerAppRedirectButton storeName={storeDetails.shopName} />}
          />

          {/* Console Scrollable Body */}
          <ScrollView
            style={s.scrollBody}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Interactive Demo State Switcher */}
            {__DEV__ && (
            <View style={s.demoStateBar}>
              <Text style={s.demoStateLabel}>🧪 Test Command Center States:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.demoChipRow}>
                <TouchableOpacity
                  style={[s.demoChip, demoState === 'normal' && s.demoChipActive]}
                  onPress={() => setDemoState('normal')}
                >
                  <Text style={[s.demoChipText, demoState === 'normal' && s.demoChipTextActive]}>Normal Operational Console</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, demoState === 'first_day' && s.demoChipActive]}
                  onPress={() => setDemoState('first_day')}
                >
                  <Text style={[s.demoChipText, demoState === 'first_day' && s.demoChipTextActive]}>First-Day Empty Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, demoState === 'paused' && s.demoChipActive]}
                  onPress={() => { setDemoState('paused'); setIsOnline(false); }}
                >
                  <Text style={[s.demoChipText, demoState === 'paused' && s.demoChipTextActive]}>Store Paused</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, demoState === 'offline' && s.demoChipActive]}
                  onPress={() => setDemoState('offline')}
                >
                  <Text style={[s.demoChipText, demoState === 'offline' && s.demoChipTextActive]}>Offline Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, demoState === 'api_error' && s.demoChipActive]}
                  onPress={() => setDemoState('api_error')}
                >
                  <Text style={[s.demoChipText, demoState === 'api_error' && s.demoChipTextActive]}>API Error</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.demoChip}
                  onPress={() => triggerIncomingOrderAlert({ orderId: 'ORD-9930', items: [{ name: 'Cetaphil Cleanser' }], pricing: { grandTotal: 799 } })}
                >
                  <Text style={s.demoChipText}>⚡ Test 45s Order Offer Modal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            )}
            {/* Offline / Connection Warning Banner */}
            {demoState === 'offline' && (
              <View style={s.errorCard}>
                <Text style={s.errorCardText}>📡 Network connection offline. Orders and live inventory updates are paused until reconnected.</Text>
              </View>
            )}

            {/* API Error Warning Banner */}
            {demoState === 'api_error' && (
              <View style={s.errorCard}>
                <Text style={s.errorCardText}>⚠️ Failed to fetch latest store metrics. Click "Refresh" or check API gateway credentials.</Text>
              </View>
            )}

            {/* ── 1. DOMINANT OPERATIONAL CARD: Store Availability Control ─────────────── */}
            <View style={[
              s.dutyCard,
              (isOnline && demoState !== 'paused') ? s.dutyCardOnline : s.dutyCardOffline
            ]}>
              <View style={s.dutyCardHeader}>
                <View style={s.dutyStatusPillWrap}>
                  <View style={[s.dutyDot, { backgroundColor: (isOnline && demoState !== 'paused') ? Colors.success : Colors.danger }]} />
                  <Text style={[s.dutyStatusText, { color: (isOnline && demoState !== 'paused') ? Colors.success : Colors.danger }]}>
                    {(isOnline && demoState !== 'paused') ? '🟢 STORE OPEN & ACCEPTING ORDERS' : '🔴 STORE PAUSED'}
                  </Text>
                </View>

                {/* Thumb-friendly Switch */}
                <TouchableOpacity
                  style={[s.switchTrack, (isOnline && demoState !== 'paused') ? s.switchTrackOnline : s.switchTrackOffline]}
                  onPress={handleToggleDuty}
                  activeOpacity={0.85}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isOnline }}
                >
                  <View style={[s.switchThumb, (isOnline && demoState !== 'paused') ? s.switchThumbOnline : s.switchThumbOffline]} />
                </TouchableOpacity>
              </View>

              <Text style={s.dutyHelperLine}>
                {(isOnline && demoState !== 'paused')
                  ? 'Accepting 10-minute quick-commerce orders within your 3.5km store radius (Hours: 09:00 AM – 10:00 PM)'
                  : 'Store is paused. Incoming customer orders are temporarily disabled.'}
              </Text>
            </View>

            {/* ── 2. PERFORMANCE HERO ROW (4 Standard Metric Cards: New, Active, Delivered, Earnings) ── */}
            <View style={s.heroGridRow}>
              <View style={s.heroCard}>
                <Text style={s.heroCardLabel}>New Orders</Text>
                <Text style={s.heroCardVal}>{orderCounts.newOrders}</Text>
                <Text style={s.heroCardTrend}>Awaiting acceptance</Text>
              </View>

              <View style={s.heroCard}>
                <Text style={s.heroCardLabel}>Active Orders</Text>
                <Text style={s.heroCardVal}>{orderCounts.active}</Text>
                <Text style={s.heroCardTrend}>In picking & packing</Text>
              </View>

              <View style={s.heroCard}>
                <Text style={s.heroCardLabel}>Delivered</Text>
                <Text style={s.heroCardVal}>{orderCounts.delivered}</Text>
                <Text style={s.heroCardTrend}>Completed</Text>
              </View>

              <View style={s.heroCard}>
                <Text style={s.heroCardLabel}>Earnings</Text>
                <Text style={s.heroCardValHighlight}>
                  {earnings?.today ? `₹${Math.round(earnings.today.earnings).toLocaleString('en-IN')}` : '—'}
                </Text>
                <Text style={s.heroCardSub}>Weekly settlement IMPS</Text>
              </View>
            </View>

            {/* ── 3. QUALITY & FULFILLMENT PERFORMANCE CARDS ───────────────────────── */}
            <View style={s.heroGridRow}>
              <View style={s.qualityCard}>
                <View style={s.qualityHeaderRow}>
                  <Text style={s.qualityCardTitle}>Store Quality Score</Text>
                  <Text style={s.qualityRatingText}>—</Text>
                </View>
                <View style={s.miniProgressBarBg}>
                  <View style={[s.miniProgressBarFill, { width: '0%', backgroundColor: Colors.success }]} />
                </View>
                <Text style={s.qualityCardSub}>Not connected yet</Text>
              </View>

              <View style={s.qualityCard}>
                <View style={s.qualityHeaderRow}>
                  <Text style={s.qualityCardTitle}>Fulfillment SLA Performance</Text>
                  <Text style={s.qualityRatingText}>—</Text>
                </View>
                <View style={s.miniProgressBarBg}>
                  <View style={[s.miniProgressBarFill, { width: '0%', backgroundColor: Colors.primary }]} />
                </View>
                <Text style={s.qualityCardSub}>Not connected yet</Text>
              </View>
            </View>

            {/* ── 4. LOWER OPERATIONAL 2-COLUMN GRID ───────────────────────────────── */}
            <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>
              
              {/* Left Column (7/12): Active Orders Queue */}
              <View style={s.colLeft}>
                <View style={s.sectionCard}>
                  <View style={s.sectionHeaderRow}>
                    <Text style={s.sectionTitle}>Active Orders Queue ({activeOrdersList.length})</Text>
                    <TouchableOpacity onPress={() => router.push('/(vendor)/orders')}>
                      <Text style={s.sectionHeaderLink}>View All Orders →</Text>
                    </TouchableOpacity>
                  </View>

                  {activeOrdersList.length === 0 ? (
                    <View style={s.emptyQueueCard}>
                      <Ionicons name="bag-handle-outline" size={36} color="#94A3B8" />
                      <Text style={s.emptyQueueTitle}>No active orders right now</Text>
                      <Text style={s.emptyQueueSub}>
                        {isOnline ? 'Keep store open to receive incoming 10-minute quick-commerce orders.' : 'Store is paused.'}
                      </Text>
                    </View>
                  ) : (
                    activeOrdersList.map(ord => (
                      <View key={ord.orderId} style={s.orderQueueRow}>
                        <View style={s.orderQueueIconBox}>
                          <Ionicons name="bag-handle-outline" size={18} style={{ color: '#475569' }} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={s.orderQueueId}>#{ord.orderId} • {ord.items?.length || 2} items</Text>
                          <Text style={s.orderQueueSla}>⏱️ SLA Timer: Pack in 02:45 • Payout: ₹{(ord as any).total || (ord as any).pricing?.grandTotal || 918}</Text>
                        </View>

                        <TouchableOpacity
                          style={s.orderActionBtn}
                          onPress={() => updateOrder(ord.orderId, { status: 'PACKED' })}
                          activeOpacity={0.8}
                        >
                          <Text style={s.orderActionBtnText}>Pack Order →</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Right Column (5/12): Stock Attention & Activity Feed */}
              <View style={s.colRight}>
                
                {/* Stock Attention Card */}
                <View style={s.sectionCard}>
                  <View style={s.sectionHeaderRow}>
                    <Text style={s.sectionTitle}>Stock Attention</Text>
                    <TouchableOpacity onPress={() => setIsAdjustStockOpen(true)}>
                      <Text style={s.sectionHeaderLink}>Adjust Stock ⚡</Text>
                    </TouchableOpacity>
                  </View>

                  {lowStockItemsList.length === 0 ? (
                    <Text style={s.stockHealthyText}>✓ All catalog SKUs have healthy stock inventory levels.</Text>
                  ) : (
                    lowStockItemsList.map((it: any) => (
                      <View key={it.productId} style={s.stockWarningRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.stockItemName}>{it.name}</Text>
                          <Text style={s.stockItemSub}>{it.bin || 'Shelf A-01'} • <Text style={s.warningText}>{it.stockOnHand || 3} left</Text></Text>
                        </View>

                        <TouchableOpacity
                          style={s.quickRestockBtn}
                          onPress={() => updateInventoryItem(it.productId, { stock: (it.stockOnHand || 3) + 10 })}
                          activeOpacity={0.8}
                        >
                          <Text style={s.quickRestockBtnText}>+10 Restock</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                {/* Today's Updates Feed */}
                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Today’s Updates Feed</Text>
                  <View style={s.feedList}>
                    <Text style={s.feedText}>No store activity to show yet.</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* Pause Confirmation Modal */}
      <Modal visible={isPauseModalOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Pause Store Deliveries?</Text>
            <Text style={s.modalSub}>Select a reason for pausing incoming 10-minute delivery orders:</Text>

            {PAUSE_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[s.reasonOption, selectedPauseReason === reason && s.reasonOptionSelected]}
                onPress={() => setSelectedPauseReason(reason)}
              >
                <Text style={[s.reasonText, selectedPauseReason === reason && s.reasonTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={s.modalBtnRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setIsPauseModalOpen(false)}>
                <Text style={s.modalCancelBtnText}>Keep Store Open</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalConfirmPauseBtn} onPress={confirmPauseDuty}>
                <Text style={s.modalConfirmPauseBtnText}>Confirm Pause</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 45s Incoming Order Broadcast Offer Modal */}
      {/* ── 10. PC SCREEN 10: 620px Incoming Order Offer Modal ───────────────────── */}
      <Modal visible={!!incomingOrderModal} transparent animationType="fade">
        <View style={s.modalOverlayNavy}>
          <View style={s.incomingOrderSheet}>
            
            {/* Modal Top Header */}
            <View style={s.incomingSheetHeader}>
              <View style={s.incomingTitleRow}>
                <View style={s.newOfferBadge}>
                  <Text style={s.newOfferBadgeText}>⚡ New Order Offer</Text>
                </View>
                <Text style={s.orderIdText}>#{incomingOrderModal?.orderId ?? ''}</Text>
                <View style={s.liveConnTag}>
                  <View style={s.liveDotGreen} />
                  <Text style={s.liveConnText}>Live</Text>
                </View>
              </View>

              {/* Countdown Timer Display */}
              <View style={s.countdownBlock}>
                <Text style={[
                  s.countdownTimerText,
                  countdownSeconds <= 10 && s.countdownTimerRed
                ]}>
                  00:{countdownSeconds < 10 ? `0${countdownSeconds}` : countdownSeconds}
                </Text>
              </View>
            </View>

            {/* Horizontal Countdown Progress Bar */}
            <View style={s.progressBarTrack}>
              <View style={[
                s.progressBarFill,
                { width: `${(countdownSeconds / 45) * 100}%` },
                countdownSeconds <= 10 && s.progressBarFillRed
              ]} />
            </View>

            <Text style={s.broadcastNoteText}>
              Accept within 00:{countdownSeconds < 10 ? `0${countdownSeconds}` : countdownSeconds} • This offer is being sent to nearby stores in your delivery radius.
            </Text>

            {/* Primary Order Info Banner */}
            <View style={s.orderInfoHeroCard}>
              <View style={s.customerMetaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.customerMetaLabel}>CUSTOMER & LOCALITY</Text>
                  <Text style={s.customerNameText}>
                    {incomingOrderModal?.customerName ?? 'Customer'} • 📍 {incomingOrderModal?.shippingAddress?.fullAddress ?? ''}
                  </Text>
                  <Text style={s.customerSlaText}>⏱️ Target Prep SLA: 3 mins packing</Text>
                </View>

                <View style={s.payoutHighlightCard}>
                  <Text style={s.payoutHighlightLabel}>ORDER VALUE</Text>
                  <Text style={s.payoutHighlightVal}>
                    ₹{Number(incomingOrderModal?.pricing?.grandTotal ?? 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={s.payoutHighlightSub}>Payout confirmed by the server</Text>
                </View>
              </View>

              {/* Item Preview Table */}
              <Text style={s.itemTableTitle}>ORDER ITEMS ({incomingOrderModal?.items?.length ?? 0} ITEMS)</Text>
              <View style={s.itemPreviewTable}>
                {(incomingOrderModal?.items ?? []).map((it: any, idx: number) => (
                  <View key={`${it.sku ?? it.productName}-${idx}`} style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{it.productName}</Text>
                      <Text style={s.itemSub}>Qty: {it.quantity}</Text>
                    </View>
                    <Text style={s.itemPrice}>₹{Number(it.price ?? 0).toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Audio Notification Toast */}
            <View style={s.audioToastBox}>
              <Text style={s.audioToastText}>🔊 Audio alert ringing • Desktop notification active</Text>
            </View>

            {/* Action Footer */}
            <View style={s.incomingActionRow}>
              <TouchableOpacity
                style={s.declineGhostBtn}
                onPress={handleDeclineIncomingOrder}
                activeOpacity={0.7}
              >
                <Text style={s.declineGhostBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.acceptPrimaryBtn, isClaimingOrder && s.acceptPrimaryBtnDisabled]}
                onPress={handleAcceptIncomingOrder}
                disabled={isClaimingOrder}
                activeOpacity={0.85}
              >
                {isClaimingOrder ? (
                  <View style={s.claimingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={s.acceptPrimaryBtnText}>Claiming order server lock...</Text>
                  </View>
                ) : (
                  <Text style={s.acceptPrimaryBtnText}>⚡ Accept order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Decline Confirmation Modal */}
      <Modal visible={isDeclineConfirmOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Decline Incoming Order Offer?</Text>
            <Text style={s.modalSub}>
              Are you sure you want to decline Order #{incomingOrderModal?.orderId ?? ''}? Declining quick-commerce orders impacts your store's Acceptance SLA rating.
            </Text>

            <View style={s.modalBtnRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setIsDeclineConfirmOpen(false)}>
                <Text style={s.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalConfirmPauseBtn} onPress={confirmDeclineIncomingOrder}>
                <Text style={s.modalConfirmPauseBtnText}>Confirm Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab="home" />
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
  notifBellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBellIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  notifBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 6,
    right: 6,
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },

  /* Demo State Switcher */
  demoStateBar: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  demoStateLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  demoChipRow: {
    gap: 6,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  demoChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  demoChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Error Banner */
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorCardText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Operational Duty Card */
  dutyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dutyCardOnline: {
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successLight,
  },
  dutyCardOffline: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
  },
  dutyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dutyStatusPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dutyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyStatusText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dutyHelperLine: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },

  /* Switches */
  switchTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOnline: {
    backgroundColor: Colors.success,
  },
  switchTrackOffline: {
    backgroundColor: '#94A3B8',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOnline: {
    alignSelf: 'flex-end',
  },
  switchThumbOffline: {
    alignSelf: 'flex-start',
  },

  /* Hero Performance Row */
  heroGridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  heroCardLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroCardVal: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  heroCardValHighlight: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  heroCardTrend: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
    marginTop: 4,
  },
  heroCardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  /* Quality Cards */
  qualityCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  qualityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityCardTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  qualityRatingText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  miniProgressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  qualityCardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* Grid Columns */
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridRowExpanded: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 7,
  },
  colRight: {
    flex: 5,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionHeaderLink: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Active Orders Queue */
  emptyQueueCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyQueueIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 32,
    marginBottom: 6,
  },
  emptyQueueTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyQueueSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orderQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  orderQueueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderQueueIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  orderQueueId: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderQueueSla: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  orderActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.input,
  },
  orderActionBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Stock Attention */
  stockHealthyText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  stockWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  stockItemName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stockItemSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  warningText: {
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  quickRestockBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  quickRestockBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Activity Feed */
  feedList: {
    gap: 8,
    marginTop: Spacing.xs,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  feedDot: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  feedText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  reasonOption: {
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reasonTextSelected: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalConfirmPauseBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmPauseBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* PC SCREEN 10: 620px Incoming Order Offer Modal Styles */
  modalOverlayNavy: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Deep navy translucent backdrop
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  incomingOrderSheet: {
    width: '100%',
    maxWidth: 620, // 560-680px range desktop elevated modal sheet
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  incomingSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  incomingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  newOfferBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  newOfferBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderIdText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  liveConnTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  liveDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveConnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  countdownBlock: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  countdownTimerText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.warning, // Amber for countdown urgency
  },
  countdownTimerRed: {
    color: Colors.danger, // Red only in final critical countdown (<= 10s)
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  progressBarFillRed: {
    backgroundColor: Colors.danger,
  },
  broadcastNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },
  orderInfoHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  customerMetaLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  customerNameText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  customerSlaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  payoutHighlightCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    alignItems: 'flex-end',
  },
  payoutHighlightLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  payoutHighlightVal: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.success,
  },
  payoutHighlightSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemTableTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  itemPreviewTable: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    padding: 8,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemThumbIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  audioToastBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: BorderRadii.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  audioToastText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  declineGhostBtn: {
    width: 110,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  declineGhostBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptPrimaryBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptPrimaryBtnDisabled: {
    opacity: 0.7,
  },
  claimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  acceptPrimaryBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  incomingOrderCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  incomingHeader: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    marginBottom: Spacing.md,
  },
  incomingTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  incomingGrandTotal: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  incomingAddress: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  incomingActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: Colors.success,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
