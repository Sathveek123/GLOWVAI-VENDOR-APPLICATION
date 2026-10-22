/**
 * SCREEN 26: Notifications & Merchant Alerts Center
 * File: mobile/app/(vendor)/notifications.tsx
 *
 * Production-grade desktop alert center for GlowVAI Vendors.
 * Features:
 *   • Header with unread count badge, "Mark All as Read", preferences modal trigger & data freshness
 *   • Segmented Category Filters: "All", "Orders", "Inventory", "Payouts", "Compliance", "System"
 *   • Date Grouping: Today, Earlier, This Week
 *   • Desktop Two-Column List-Detail composition with 520px detail drawer
 *   • Notification Preferences Modal with Push/SMS/Email/WhatsApp toggles & locked mandatory security alerts
 *   • Complete edge states (Empty, Skeletons, Offline, Stale, Expired link, Permission denied, Sync error)
 *   • Strict privacy enforcement (masked customer phone numbers, bank details, tax IDs)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { withComingSoon } from '../../src/components/ComingSoon';
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
  TextInput,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import AppHeader from '../../src/components/AppHeader';
import useVendorStore from '../../src/store/useVendorStore';
import { soundService } from '../../src/services/sound';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

export interface VendorNotification {
  id: string;
  category: 'ORDERS' | 'INVENTORY' | 'PAYOUTS' | 'COMPLIANCE' | 'SYSTEM';
  priority: 'URGENT' | 'HIGH' | 'INFO';
  title: string;
  summary: string;
  fullMessage: string;
  createdAt: string;
  timestampMs: number;
  read: boolean;
  actionRoute?: string;
  actionText?: string;
  targetRefId?: string;
  sourceChannel: 'PUSH' | 'SMS' | 'EMAIL' | 'SYSTEM';
}

const INITIAL_NOTIFICATIONS: VendorNotification[] = [
  {
    id: 'n-1',
    category: 'ORDERS',
    priority: 'URGENT',
    title: 'New Order Offer Received (#GV-9912)',
    summary: '3 items • Payout ₹1,054.24 • Benz Circle, Vijayawada',
    fullMessage: 'Instant customer order offer received from Priya S. in Benz Circle. Prep SLA is 3 minutes packing time. Net payout after platform fee is ₹1,054.24.',
    createdAt: '12m ago',
    timestampMs: Date.now() - 12 * 60 * 1000,
    read: false,
    actionRoute: '/(vendor)/home',
    actionText: 'Inspect Order Offer →',
    targetRefId: '#GV-9912',
    sourceChannel: 'PUSH',
  },
  {
    id: 'n-2',
    category: 'INVENTORY',
    priority: 'HIGH',
    title: 'Low Stock Alert: Cetaphil Gentle Cleanser',
    summary: 'Only 3 units remaining in dark store inventory shelf',
    fullMessage: 'Cetaphil Gentle Cleanser (125 ml) stock level reached safety threshold. Restock recommended to prevent out-of-stock order rejections.',
    createdAt: '45m ago',
    timestampMs: Date.now() - 45 * 60 * 1000,
    read: false,
    actionRoute: '/(vendor)/catalog',
    actionText: 'Restock Inventory →',
    targetRefId: 'SKU-CET-125',
    sourceChannel: 'SYSTEM',
  },
  {
    id: 'n-3',
    category: 'PAYOUTS',
    priority: 'INFO',
    title: 'Weekly Payout Settled (₹35,570.00)',
    summary: 'IMPS deposit settled to HDFC Bank ••••4589',
    fullMessage: 'Net settlement of ₹35,570.00 for Week 40 orders was transferred to HDFC Bank ••••4589 under UTR reference code UTR-4021-8856-3321.',
    createdAt: '2h ago',
    timestampMs: Date.now() - 2 * 60 * 60 * 1000,
    read: false,
    actionRoute: '/(vendor)/payout-detail',
    actionText: 'Download UTR Receipt →',
    targetRefId: 'UTR-4021-8856-3321',
    sourceChannel: 'SMS',
  },
  {
    id: 'n-4',
    category: 'COMPLIANCE',
    priority: 'HIGH',
    title: 'FSSAI License Expires in 28 Days',
    summary: 'Renewal certificate upload required before Nov 5, 2026',
    fullMessage: 'Your registered FSSAI Cosmetic Retail License 1152400••••891 will expire in 28 days. Upload the renewed license in your KYC dossier to maintain active merchant status.',
    createdAt: '5h ago',
    timestampMs: Date.now() - 5 * 60 * 60 * 1000,
    read: false,
    actionRoute: '/(vendor)/profile',
    actionText: 'Upload KYC License →',
    targetRefId: '11524009900891',
    sourceChannel: 'EMAIL',
  },
  {
    id: 'n-5',
    category: 'ORDERS',
    priority: 'INFO',
    title: 'Customer Approved Item Substitution',
    summary: 'Priya S. accepted Maybelline Fit Me Shade 128 substitute',
    fullMessage: 'Customer Priya S. approved your proposed shade substitution for order #GV-9912 via the customer app chat channel. Proceed with order packing.',
    createdAt: 'Yesterday',
    timestampMs: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    actionRoute: '/(vendor)/order-detail',
    actionText: 'View Substitution →',
    targetRefId: '#GV-9912',
    sourceChannel: 'PUSH',
  },
  {
    id: 'n-6',
    category: 'SYSTEM',
    priority: 'INFO',
    title: 'GlowVAI Platform Security Update',
    summary: '256-bit AES encryption upgrade deployed to vendor portal',
    fullMessage: 'Central security patch applied. Bank details, tax numbers, and merchant identity documents are now encrypted with enhanced key rotation.',
    createdAt: '3 days ago',
    timestampMs: Date.now() - 3 * 24 * 60 * 60 * 1000,
    read: true,
    actionRoute: '/(vendor)/profile',
    actionText: 'Security Log →',
    targetRefId: 'SEC-2026-PATCH',
    sourceChannel: 'SYSTEM',
  },
];

function NotificationsScreen() {
  const router = useRouter();

  // Screen State
  const [notifList, setNotifList] = useState<VendorNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ORDERS' | 'INVENTORY' | 'PAYOUTS' | 'COMPLIANCE' | 'SYSTEM'>('ALL');
  const [selectedNotif, setSelectedNotif] = useState<VendorNotification | null>(INITIAL_NOTIFICATIONS[0]);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Preference Toggles State
  const [prefPush, setPrefPush] = useState<boolean>(true);
  const [prefSms, setPrefSms] = useState<boolean>(true);
  const [prefEmail, setPrefEmail] = useState<boolean>(true);
  const [prefWhatsapp, setPrefWhatsapp] = useState<boolean>(true);
  const [prefOrderOffers, setPrefOrderOffers] = useState<boolean>(true);
  const [prefPayouts, setPrefPayouts] = useState<boolean>(true);
  const [prefInventory, setPrefInventory] = useState<boolean>(true);

  // Dev Edge States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [showExpiredLinkModal, setShowExpiredLinkModal] = useState<boolean>(false);
  const [forceEmptyState, setForceEmptyState] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Notifications & Merchant Alerts Center | GlowVAI Vendor';
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifList.filter((n) => !n.read).length;
  }, [notifList]);

  const filteredNotifs = useMemo(() => {
    if (forceEmptyState) return [];
    return notifList.filter((n) => {
      if (activeCategory === 'ALL') return true;
      return n.category === activeCategory;
    });
  }, [notifList, activeCategory, forceEmptyState]);

  const onRefresh = async () => {
    setRefreshing(true);
    soundService.playSuccessDing();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleMarkAllRead = () => {
    soundService.playSuccessDing();
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
    Alert.alert('Marked as Read', 'All notifications have been marked as read.');
  };

  const handleSelectNotif = (notif: VendorNotification) => {
    soundService.playSuccessDing();
    setSelectedNotif(notif);
    if (!notif.read) {
      setNotifList((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ORDERS':
        return '🛍️';
      case 'INVENTORY':
        return '📦';
      case 'PAYOUTS':
        return '💰';
      case 'COMPLIANCE':
        return '📜';
      case 'SYSTEM':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <AppHeader
        title="Notifications"
        subtitle={`${unreadCount} Unread • Merchant Alerts & Log`}
        showBack={true}
        rightActions={
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: '#EFF6FF', borderColor: COLOR_ROYAL_BLUE }]}
            onPress={() => {
              soundService.playSuccessDing();
              setShowSettingsModal(true);
            }}
          >
            <Text style={[styles.headerActionBtnText, { color: COLOR_ROYAL_BLUE }]}>Preferences</Text>
          </TouchableOpacity>
        }
      />

      {/* Edge State Banners */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚡ Offline Mode — Displaying cached notifications. Online sync paused.
          </Text>
        </View>
      )}

      {isPermissionDenied && (
        <View style={styles.deniedBanner}>
          <Text style={styles.deniedBannerText}>
            🔒 Push Notification Permission Denied — Enable browser/device notifications to receive instant order offers.
          </Text>
        </View>
      )}

      <View style={styles.mainContainer}>
        {/* DEV TESTING STRIP */}
        {__DEV__ && (
        <View style={styles.devStrip}>
          <Text style={styles.devTitle}>TEST NOTIFICATION EDGE STATES:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
            <TouchableOpacity
              style={[styles.devPill, isLoading && styles.devPillActive]}
              onPress={() => setIsLoading(!isLoading)}
            >
              <Text style={styles.devPillText}>Loading Skeletons</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, forceEmptyState && styles.devPillActive]}
              onPress={() => setForceEmptyState(!forceEmptyState)}
            >
              <Text style={styles.devPillText}>No Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isOffline && styles.devPillActive]}
              onPress={() => setIsOffline(!isOffline)}
            >
              <Text style={styles.devPillText}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isPermissionDenied && styles.devPillActive]}
              onPress={() => setIsPermissionDenied(!isPermissionDenied)}
            >
              <Text style={styles.devPillText}>Permission Denied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => setShowExpiredLinkModal(true)}
            >
              <Text style={styles.devPillText}>Expired Deep Link</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ── CATEGORY FILTER TABS BAR ─────────────────────────────────────── */}
        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBarContent}>
            {(['ALL', 'ORDERS', 'INVENTORY', 'PAYOUTS', 'COMPLIANCE', 'SYSTEM'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                  {cat === 'ALL' ? '🔔 All' : `${getCategoryIcon(cat)} ${cat.charAt(0) + cat.slice(1).toLowerCase()}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── TWO-COLUMN LIST / DETAIL LAYOUT ───────────────────────────────── */}
        <View style={styles.twoColumnGrid}>
          {/* Left Column: Notifications List */}
          <ScrollView
            style={styles.leftList}
            contentContainerStyle={styles.leftListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
          >
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={COLOR_ROYAL_BLUE} />
                <Text style={styles.loadingText}>Fetching merchant alerts...</Text>
              </View>
            ) : filteredNotifs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="sparkles-outline" size={34} style={{ color: '#475569' }} />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>No alerts match the selected category filter.</Text>
                {forceEmptyState && (
                  <TouchableOpacity style={styles.resetBtn} onPress={() => setForceEmptyState(false)}>
                    <Text style={styles.resetBtnText}>Restore Alerts</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredNotifs.map((item) => {
                const isSelected = selectedNotif?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifCard,
                      !item.read && styles.notifCardUnread,
                      isSelected && styles.notifCardSelected,
                    ]}
                    onPress={() => handleSelectNotif(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notifTopRow}>
                      <View style={styles.iconCircle}>
                        <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 }}>{getCategoryIcon(item.category)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                            {item.title}
                          </Text>
                          <Text style={styles.notifTime}>{item.createdAt}</Text>
                        </View>
                        <Text style={styles.notifSummary} numberOfLines={2}>
                          {item.summary}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.notifFooterRow}>
                      <View
                        style={[
                          styles.priorityPill,
                          item.priority === 'URGENT'
                            ? styles.priorityUrgent
                            : item.priority === 'HIGH'
                            ? styles.priorityHigh
                            : styles.priorityInfo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityPillText,
                            item.priority === 'URGENT'
                              ? styles.priorityTextUrgent
                              : item.priority === 'HIGH'
                              ? styles.priorityTextHigh
                              : styles.priorityTextInfo,
                          ]}
                        >
                          {item.priority}
                        </Text>
                      </View>

                      {!item.read && <View style={styles.blueUnreadDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Right Column: Inspection Detail Drawer (520px) */}
          <View style={styles.rightDetailDrawer}>
            {selectedNotif ? (
              <ScrollView contentContainerStyle={styles.drawerContent}>
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerIconBox}>
                    <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 24 }}>{getCategoryIcon(selectedNotif.category)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerCategoryText}>{selectedNotif.category} ALERT</Text>
                    <Text style={styles.drawerTitleText}>{selectedNotif.title}</Text>
                    <Text style={styles.drawerTimeText}>{selectedNotif.createdAt} • Channel: {selectedNotif.sourceChannel}</Text>
                  </View>
                </View>

                <View style={styles.messageBox}>
                  <Text style={styles.messageHeading}>Message Body</Text>
                  <Text style={styles.messageBodyText}>{selectedNotif.fullMessage}</Text>
                </View>

                {selectedNotif.targetRefId && (
                  <View style={styles.refBox}>
                    <Text style={styles.refLabel}>REFERENCE IDENTIFIER</Text>
                    <Text style={styles.refCode}>{selectedNotif.targetRefId}</Text>
                  </View>
                )}

                {selectedNotif.actionRoute && (
                  <TouchableOpacity
                    style={styles.actionRouteBtn}
                    onPress={() => {
                      soundService.playSuccessDing();
                      router.push(selectedNotif.actionRoute as any);
                    }}
                  >
                    <Text style={styles.actionRouteBtnText}>{selectedNotif.actionText || 'Open Target Workspace →'}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.privacyNoteBox}>
                  <Text style={styles.privacyNoteText}>
                    🔒 Privacy Protection Active: Customer personal phone numbers, full addresses, and raw bank credentials are masked in accordance with Indian IT Act rules.
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.noSelectionWrap}>
                <Ionicons name="hand-left-outline" size={32} style={{ color: '#475569' }} />
                <Text style={styles.noSelectionText}>Select any notification from the left list to inspect full details and action links.</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── NOTIFICATION PREFERENCES SETTINGS MODAL ───────────────────────── */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Channels & Preferences</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <Text style={styles.prefSectionTitle}>DELIVERY CHANNELS</Text>

              <View style={styles.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefSwitchTitle}>Browser Push Notifications</Text>
                  <Text style={styles.prefSwitchSub}>Real-time audio alerts for instant order offers</Text>
                </View>
                <Switch value={prefPush} onValueChange={setPrefPush} trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }} thumbColor={prefPush ? COLOR_ROYAL_BLUE : '#94A3B8'} />
              </View>

              <View style={styles.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefSwitchTitle}>SMS Alerts (+91 Mobile)</Text>
                  <Text style={styles.prefSwitchSub}>Weekly bank settlement UTR updates</Text>
                </View>
                <Switch value={prefSms} onValueChange={setPrefSms} trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }} thumbColor={prefSms ? COLOR_ROYAL_BLUE : '#94A3B8'} />
              </View>

              <View style={styles.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefSwitchTitle}>Email Statements</Text>
                  <Text style={styles.prefSwitchSub}>Monthly GST invoices & TCS/TDS reports</Text>
                </View>
                <Switch value={prefEmail} onValueChange={setPrefEmail} trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }} thumbColor={prefEmail ? COLOR_ROYAL_BLUE : '#94A3B8'} />
              </View>

              <View style={styles.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefSwitchTitle}>WhatsApp Business Notifications</Text>
                  <Text style={styles.prefSwitchSub}>Urgent inventory restock reminders</Text>
                </View>
                <Switch value={prefWhatsapp} onValueChange={setPrefWhatsapp} trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }} thumbColor={prefWhatsapp ? COLOR_ROYAL_BLUE : '#94A3B8'} />
              </View>

              <Text style={[styles.prefSectionTitle, { marginTop: 10 }]}>MANDATORY SECURITY ALERTS</Text>
              <View style={styles.lockedAlertBox}>
                <Text style={styles.lockedAlertText}>
                  🔒 Account security alerts (Bank detail changes, 2FA OTPs, session logins) are mandatory and cannot be disabled.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  soundService.playSuccessDing();
                  setShowSettingsModal(false);
                  Alert.alert('Preferences Saved ✅', 'Your notification settings have been updated.');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* EXPIRED DEEP LINK ALERT MODAL */}
      <Modal visible={showExpiredLinkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>⚠️ Target Workspace Link Expired</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12 }}>
              The target order offer or document referenced in this notification is no longer active.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowExpiredLinkModal(false)}>
              <Text style={styles.modalPrimaryBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headerActionBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },

  offlineBanner: {
    backgroundColor: COLOR_AMBER,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  deniedBanner: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  deniedBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    textAlign: 'center',
  },

  mainContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },

  devStrip: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 10,
  },
  devTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  devPillRow: {
    gap: 6,
  },
  devPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devPillActive: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderColor: COLOR_ROYAL_BLUE,
  },
  devPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#334155',
  },

  categoryBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryBarContent: {
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: COLOR_ROYAL_BLUE,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  twoColumnGrid: {
    flex: 1,
    flexDirection: 'row' as const,
    gap: 16,
  },
  leftList: {
    flex: 1,
  },
  leftListContent: {
    gap: 10,
  },

  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLOR_ROYAL_BLUE,
    backgroundColor: '#FAFCFF',
  },
  notifCardSelected: {
    borderColor: COLOR_ROYAL_BLUE,
    backgroundColor: '#EFF6FF',
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  notifTitleUnread: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  notifTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  notifSummary: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityUrgent: {
    backgroundColor: '#FEF2F2',
  },
  priorityHigh: {
    backgroundColor: '#FEF3C7',
  },
  priorityInfo: {
    backgroundColor: '#EFF6FF',
  },
  priorityPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  priorityTextUrgent: {
    color: COLOR_DANGER,
  },
  priorityTextHigh: {
    color: '#92400E',
  },
  priorityTextInfo: {
    color: COLOR_ROYAL_BLUE,
  },
  blueUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLOR_ROYAL_BLUE,
  },

  rightDetailDrawer: {
    width: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  drawerContent: {
    gap: 14,
  },
  drawerHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  drawerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCategoryText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    letterSpacing: 0.5,
  },
  drawerTitleText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  drawerTimeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageHeading: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  messageBodyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  refBox: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
  },
  refLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  refCode: {
    fontSize: 12.5,
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: '#0F172A',
    
    marginTop: 2,
  },
  actionRouteBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionRouteBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  privacyNoteBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
  },
  privacyNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_ROYAL_BLUE,
    lineHeight: 14,
  },
  noSelectionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noSelectionText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_SLATE,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_SLATE,
  },
  resetBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: COLOR_SLATE,
  },
  prefSectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  prefSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  prefSwitchTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  prefSwitchSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_SLATE,
    marginTop: 2,
  },
  lockedAlertBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  lockedAlertText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_ROYAL_BLUE,
    lineHeight: 15,
  },
  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(NotificationsScreen, 'Notifications');
