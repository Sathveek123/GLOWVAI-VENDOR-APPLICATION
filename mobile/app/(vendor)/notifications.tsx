/**
 * SCREEN 26: Notifications & Merchant Alerts Center
 * File: mobile/app/(vendor)/notifications.tsx
 *
 * Live alerts from GET /api/notifications/:vendorId. Marking an alert read calls
 * PATCH /api/notifications/:id/read. Phone: one column, an alert opens inline with a back control.
 * Desktop (width >= 1024): list on the left, detail drawer on the right.
 * Sample alerts exist only in __DEV__ and are labelled "Sample data".
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Platform,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import AppHeader from '../../src/components/AppHeader';
import { useVendorSession } from '../../src/services/session';
import { notificationsApi } from '../../src/services/api';

type Category = 'ORDERS' | 'INVENTORY' | 'PAYOUTS' | 'COMPLIANCE' | 'SYSTEM';
const CATEGORIES: Category[] = ['ORDERS', 'INVENTORY', 'PAYOUTS', 'COMPLIANCE', 'SYSTEM'];

/** Every screen an alert may open. Each one is a file in app/(vendor)/. */
const VENDOR_ROUTES = [
  '/(vendor)/add-sku',
  '/(vendor)/analytics',
  '/(vendor)/bank-edit',
  '/(vendor)/catalog',
  '/(vendor)/compliance',
  '/(vendor)/earnings',
  '/(vendor)/expiry',
  '/(vendor)/home',
  '/(vendor)/messages',
  '/(vendor)/multi-store',
  '/(vendor)/notifications',
  '/(vendor)/order-detail',
  '/(vendor)/orders',
  '/(vendor)/pack-order',
  '/(vendor)/payout-detail',
  '/(vendor)/procurement',
  '/(vendor)/profile',
  '/(vendor)/promotions',
  '/(vendor)/ready-pickup',
  '/(vendor)/recommended-skus',
  '/(vendor)/returns',
  '/(vendor)/reviews',
  '/(vendor)/security',
  '/(vendor)/support',
  '/(vendor)/tax-documents',
  '/(vendor)/team',
] as const;
type VendorRoute = typeof VENDOR_ROUTES[number];

function isVendorRoute(value: unknown): value is VendorRoute {
  return typeof value === 'string' && (VENDOR_ROUTES as readonly string[]).includes(value);
}

export interface VendorNotification {
  id: string;
  category: Category;
  title: string;
  body: string;
  /** Epoch milliseconds. 0 when the backend sent no usable time. */
  createdAt: number;
  read: boolean;
  orderId?: string;
  action?: { route: VendorRoute; params?: Record<string, string>; label: string };
}

const CATEGORY_META: Record<Category, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  ORDERS: { label: 'Orders', icon: 'bag-handle-outline' },
  INVENTORY: { label: 'Inventory', icon: 'cube-outline' },
  PAYOUTS: { label: 'Payouts', icon: 'wallet-outline' },
  COMPLIANCE: { label: 'Compliance', icon: 'document-text-outline' },
  SYSTEM: { label: 'System', icon: 'information-circle-outline' },
};

/** The backend stores a `type` per alert. The category is derived from it. */
const CATEGORY_BY_TYPE: Record<string, Category> = {
  NEW_ORDER: 'ORDERS',
  ORDER_CANCELLED: 'ORDERS',
  PAYOUT: 'PAYOUTS',
  LOW_STOCK: 'INVENTORY',
  INVENTORY: 'INVENTORY',
  COMPLIANCE: 'COMPLIANCE',
  KYC: 'COMPLIANCE',
};

// Dev-only sample alerts. They are never shown in a production build.
const SAMPLE_NOTIFICATIONS: VendorNotification[] = __DEV__
  ? [
      {
        id: 'sample-1',
        category: 'ORDERS',
        title: 'Sample: new order offer',
        body: 'Sample alert text. Live order offers appear here when the backend sends them.',
        createdAt: Date.now() - 12 * 60 * 1000,
        read: false,
        orderId: 'SAMPLE-0001',
      },
      {
        id: 'sample-2',
        category: 'INVENTORY',
        title: 'Sample: low stock warning',
        body: 'Sample alert text. Stock warnings appear here when an item runs low.',
        createdAt: Date.now() - 45 * 60 * 1000,
        read: false,
      },
      {
        id: 'sample-3',
        category: 'PAYOUTS',
        title: 'Sample: payout settled',
        body: 'Sample alert text. Payout updates appear here when a settlement is made.',
        createdAt: Date.now() - 2 * 60 * 60 * 1000,
        read: true,
      },
      {
        id: 'sample-4',
        category: 'SYSTEM',
        title: 'Sample: platform update',
        body: 'Sample alert text. Platform notices appear here.',
        createdAt: Date.now() - 24 * 60 * 60 * 1000,
        read: true,
      },
    ]
  : [];

/** Accepts a plain array, or an object with a list field. Anything else is an empty list. */
function extractList(res: any): any[] {
  if (Array.isArray(res)) return res;
  for (const key of ['notifications', 'items', 'data']) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  return [];
}

/** Accepts epoch ms, numeric strings, ISO strings and Firestore-style { seconds }. */
function toMs(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim() !== '') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === 'object' && typeof (value as any).seconds === 'number') {
    return (value as any).seconds * 1000;
  }
  return 0;
}

/** Maps one raw backend record to the screen's shape. Returns null when it has no id. */
function normalize(raw: any): VendorNotification | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.notificationId;
  if (id === undefined || id === null || id === '') return null;

  const type = typeof raw.type === 'string' ? raw.type : '';
  const category: Category = (CATEGORIES as string[]).includes(raw.category)
    ? raw.category
    : CATEGORY_BY_TYPE[type] ?? 'SYSTEM';
  const orderId = typeof raw.orderId === 'string' && raw.orderId ? raw.orderId : undefined;

  // A route the backend sends is used only if it is a real vendor screen. Otherwise no action is shown.
  // With no route from the backend, the action comes from the category.
  let action: VendorNotification['action'];
  if (raw.actionRoute !== undefined && raw.actionRoute !== null) {
    if (isVendorRoute(raw.actionRoute)) {
      action = { route: raw.actionRoute, label: typeof raw.actionText === 'string' && raw.actionText ? raw.actionText : 'Open' };
    }
  } else if (category === 'ORDERS' && orderId) {
    action = { route: '/(vendor)/order-detail', params: { orderId }, label: 'Open order' };
  } else if (category === 'PAYOUTS') {
    action = { route: '/(vendor)/payout-detail', label: 'View payout' };
  } else if (category === 'INVENTORY') {
    action = { route: '/(vendor)/catalog', label: 'Open catalog' };
  } else if (category === 'COMPLIANCE') {
    action = { route: '/(vendor)/compliance', label: 'Open compliance' };
  }

  return {
    id: String(id),
    category,
    title: String(raw.title || 'Alert'),
    body: String(raw.body ?? raw.summary ?? raw.message ?? ''),
    createdAt: toMs(raw.createdAt ?? raw.timestampMs),
    read: raw.read === true,
    orderId,
    action,
  };
}

/** "5m ago", "3h ago", "2d ago", then a date. Computed from the timestamp each render. */
function formatRelative(ms: number, now: number): string {
  if (!ms) return 'Time unknown';
  const minutes = Math.floor(Math.max(0, now - ms) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAbsolute(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function NotificationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // The signed-in vendor. Same pattern as home.tsx and orders.tsx.
  const vendorSession = useVendorSession();
  const vendorId = vendorSession.vendorId || '';

  // Live data
  const [items, setItems] = useState<VendorNotification[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadError, setLoadError] = useState('');
  const [usingSample, setUsingSample] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Screen state
  const [activeCategory, setActiveCategory] = useState<'ALL' | Category>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExpiredLinkModal, setShowExpiredLinkModal] = useState(false);

  // Dev-only edge-state toggles. Each one changes what is on screen.
  const [devLoading, setDevLoading] = useState(false);
  const [devEmpty, setDevEmpty] = useState(false);
  const [devOffline, setDevOffline] = useState(false);
  const [devPermissionDenied, setDevPermissionDenied] = useState(false);

  // Dev-only preference switches. They are never saved.
  const [prefPush, setPrefPush] = useState(true);
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefWhatsapp, setPrefWhatsapp] = useState(true);

  const itemsRef = useRef<VendorNotification[]>([]);
  const requestRef = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Notifications & Merchant Alerts Center | GlowVAI Vendor';
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch once the session has loaded, and again if the vendor changes.
  useEffect(() => {
    if (!vendorSession.loaded) return;
    if (!vendorId) {
      setItems([]);
      setUsingSample(false);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    loadNotifications(vendorId);
  }, [vendorSession.loaded, vendorId]);

  const loadNotifications = async (id: string) => {
    const reqId = ++requestRef.current;
    setLoadError('');
    try {
      const res = await notificationsApi.getAll(id);
      if (reqId !== requestRef.current) return;
      const list = extractList(res)
        .map(normalize)
        .filter((n): n is VendorNotification => n !== null)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (list.length === 0 && __DEV__) {
        setItems(__DEV__ ? SAMPLE_NOTIFICATIONS : []);
        setUsingSample(true);
      } else {
        setItems(list);
        setUsingSample(false);
      }
      setStatus('ready');
    } catch (err: any) {
      if (reqId !== requestRef.current) return;
      setLoadError(err?.message || 'We could not reach the server.');
      if (__DEV__ && itemsRef.current.length === 0) {
        setItems(__DEV__ ? SAMPLE_NOTIFICATIONS : []);
        setUsingSample(true);
      }
      setStatus('error');
    }
  };

  const onRefresh = async () => {
    if (!vendorId) return;
    setRefreshing(true);
    await loadNotifications(vendorId);
    setRefreshing(false);
  };

  const retry = async () => {
    if (!vendorId) return;
    setStatus('loading');
    await loadNotifications(vendorId);
  };

  const now = Date.now();
  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visibleItems = useMemo(
    () => items.filter((n) => activeCategory === 'ALL' || n.category === activeCategory),
    [items, activeCategory]
  );
  const listItems = devEmpty ? [] : visibleItems;
  const selectedNotif = items.find((n) => n.id === selectedId) || null;

  const noVendor = vendorSession.loaded && !vendorId;
  const showSpinner = !noVendor && (devLoading || ((status === 'idle' || status === 'loading') && items.length === 0));
  const showErrorPanel = !noVendor && !devLoading && status === 'error' && items.length === 0;
  const showStaleBanner = !noVendor && status === 'error' && items.length > 0 && !usingSample;

  const subtitle = noVendor
    ? 'Sign in to see your alerts'
    : showSpinner
    ? 'Loading alerts'
    : showErrorPanel
    ? 'Alerts unavailable'
    : `${unreadCount} unread • Merchant alerts`;

  const showToast = (message: string) => setToast(message);

  /** Marks one alert read. The change shows at once and is undone if the server call fails. */
  const markOneRead = async (item: VendorNotification) => {
    if (item.read) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (usingSample) return;
    try {
      await notificationsApi.markRead(item.id);
    } catch (_) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: false } : n)));
      showToast('Could not mark this alert as read. Try again.');
    }
  };

  const handleSelect = (item: VendorNotification) => {
    setSelectedId(item.id);
    markOneRead(item);
  };

  /** Marks every unread alert read on the server. Alerts that fail are put back as unread. */
  const handleMarkAllRead = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    if (usingSample) return;
    const failedIds = (
      await Promise.all(
        unreadIds.map((id) => notificationsApi.markRead(id).then(() => null, () => id))
      )
    ).filter((id): id is string => id !== null);
    if (failedIds.length > 0) {
      setItems((prev) => prev.map((n) => (failedIds.includes(n.id) ? { ...n, read: false } : n)));
      showToast(`${failedIds.length} ${failedIds.length === 1 ? 'alert' : 'alerts'} could not be marked as read.`);
    }
  };

  const openAction = (action: NonNullable<VendorNotification['action']>) => {
    if (action.params) {
      router.push({ pathname: action.route, params: action.params } as any);
    } else {
      router.push(action.route as any);
    }
  };

  const closeSettings = () => setShowSettingsModal(false);

  // ── Pieces ─────────────────────────────────────────────────────────────────

  const renderDetail = (notif: VendorNotification, showBack: boolean) => {
    const meta = CATEGORY_META[notif.category];
    return (
      <ScrollView style={s.detailScroll} contentContainerStyle={s.drawerContent}>
        {showBack && (
          <Pressable
            onPress={() => setSelectedId(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to alerts"
            style={({ pressed }) => [s.backRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={s.backRowText}>Back to alerts</Text>
          </Pressable>
        )}

        <View style={s.drawerHeader}>
          <View style={s.drawerIconBox}>
            <Ionicons name={meta.icon} size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.drawerCategoryText}>{meta.label.toUpperCase()} ALERT</Text>
            <Text style={s.drawerTitleText}>{notif.title}</Text>
            <Text style={s.drawerTimeText}>
              {formatRelative(notif.createdAt, now)}
              {notif.createdAt ? ` • ${formatAbsolute(notif.createdAt)}` : ''}
            </Text>
          </View>
        </View>

        <View style={s.messageBox}>
          <Text style={s.messageHeading}>Message</Text>
          <Text style={s.messageBodyText}>{notif.body || 'No details were included with this alert.'}</Text>
        </View>

        {!!notif.orderId && (
          <View style={s.refBox}>
            <Text style={s.refLabel}>ORDER REFERENCE</Text>
            <Text style={s.refCode}>{notif.orderId}</Text>
          </View>
        )}

        {notif.action && (
          <Pressable
            onPress={() => openAction(notif.action!)}
            accessibilityRole="button"
            accessibilityLabel={notif.action.label}
            style={({ pressed }) => [s.actionRouteBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.actionRouteBtnText}>{notif.action.label}</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  };

  const renderListBody = () => {
    if (noVendor) {
      return (
        <View style={s.stateWrap}>
          <Ionicons name="lock-closed-outline" size={32} color={Colors.textSubtle} />
          <Text style={s.stateTitle}>Sign in to see your alerts</Text>
          <Text style={s.stateSub}>We could not find your vendor session on this device. Sign in again to load your alerts.</Text>
        </View>
      );
    }

    if (showSpinner) {
      return (
        <View style={s.stateWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.stateSub}>Fetching merchant alerts...</Text>
        </View>
      );
    }

    if (showErrorPanel) {
      return (
        <View style={s.stateWrap}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
          <Text style={s.stateTitle}>We could not load your alerts</Text>
          <Text style={s.stateSub}>{loadError || 'Check your connection and try again.'}</Text>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading alerts"
            style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (listItems.length === 0) {
      const filtered = activeCategory !== 'ALL' && items.length > 0 && !devEmpty;
      return (
        <View style={s.stateWrap}>
          <Ionicons name="notifications-outline" size={32} color={Colors.textSubtle} />
          <Text style={s.stateTitle}>{filtered ? `No ${CATEGORY_META[activeCategory as Category].label.toLowerCase()} alerts` : 'No alerts yet'}</Text>
          <Text style={s.stateSub}>
            {filtered
              ? 'Nothing in this category yet.'
              : 'New order offers, stock warnings and payout updates will show up here.'}
          </Text>
        </View>
      );
    }

    return listItems.map((item) => {
      const meta = CATEGORY_META[item.category];
      const isSelected = selectedId === item.id;
      return (
        <Pressable
          key={item.id}
          onPress={() => handleSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}`}
          accessibilityState={{ selected: isSelected }}
          style={({ pressed }) => [
            s.notifCard,
            !item.read && s.notifCardUnread,
            isSelected && s.notifCardSelected,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={s.iconCircle}>
            <Ionicons name={meta.icon} size={18} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={s.notifTopLine}>
              <Text style={[s.notifTitle, !item.read && s.notifTitleUnread]} numberOfLines={2}>
                {item.title}
              </Text>
              {!item.read && <View style={s.unreadDot} />}
            </View>
            {!!item.body && (
              <Text style={s.notifSummary} numberOfLines={2}>
                {item.body}
              </Text>
            )}
            <Text style={s.notifMeta}>
              {meta.label} • {formatRelative(item.createdAt, now)}
            </Text>
          </View>
        </Pressable>
      );
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safeArea}>
      <AppHeader
        title="Notifications"
        subtitle={subtitle}
        showBack={true}
        rightActions={
          <Pressable
            style={({ pressed }) => [s.headerActionBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setShowSettingsModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Notification preferences"
          >
            <Text style={s.headerActionBtnText}>Preferences</Text>
          </Pressable>
        }
      />

      <View style={s.mainContainer}>
        {/* DEV TESTING STRIP: each toggle changes what is on screen */}
        {__DEV__ && (
          <View style={s.devStrip}>
            <Text style={s.devTitle}>DEV ONLY: NOTIFICATION EDGE STATES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.devPillRow}>
              <Pressable style={[s.devPill, devLoading && s.devPillActive]} onPress={() => setDevLoading(!devLoading)}>
                <Text style={[s.devPillText, devLoading && s.devPillTextActive]}>Loading</Text>
              </Pressable>
              <Pressable style={[s.devPill, devEmpty && s.devPillActive]} onPress={() => setDevEmpty(!devEmpty)}>
                <Text style={[s.devPillText, devEmpty && s.devPillTextActive]}>No alerts</Text>
              </Pressable>
              <Pressable style={[s.devPill, devOffline && s.devPillActive]} onPress={() => setDevOffline(!devOffline)}>
                <Text style={[s.devPillText, devOffline && s.devPillTextActive]}>Offline banner</Text>
              </Pressable>
              <Pressable style={[s.devPill, devPermissionDenied && s.devPillActive]} onPress={() => setDevPermissionDenied(!devPermissionDenied)}>
                <Text style={[s.devPillText, devPermissionDenied && s.devPillTextActive]}>Permission banner</Text>
              </Pressable>
              <Pressable style={s.devPill} onPress={() => setShowExpiredLinkModal(true)}>
                <Text style={s.devPillText}>Expired link</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {__DEV__ && devOffline && (
          <View style={s.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.warning} />
            <Text style={s.offlineBannerText}>Offline (dev preview). Showing the last loaded alerts.</Text>
          </View>
        )}

        {__DEV__ && devPermissionDenied && (
          <View style={s.deniedBanner}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.danger} />
            <Text style={s.deniedBannerText}>Push permission denied (dev preview). Enable device notifications to get order offers.</Text>
          </View>
        )}

        {/* Category filter and mark-all */}
        <View style={s.toolbarRow}>
          <View style={s.categoryBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryBarContent}>
              {(['ALL', ...CATEGORIES] as const).map((cat) => {
                const active = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [s.categoryTab, active && s.categoryTabActive, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[s.categoryTabText, active && s.categoryTabTextActive]}>
                      {cat === 'ALL' ? 'All' : CATEGORY_META[cat].label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          {unreadCount > 0 && !showSpinner && !noVendor && (
            <Pressable
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all alerts as read"
              style={({ pressed }) => [s.markAllBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={s.markAllBtnText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {showStaleBanner && (
          <View style={s.bannerError} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={s.bannerErrorTitle}>Showing the last loaded alerts</Text>
              <Text style={s.bannerErrorText}>{loadError}</Text>
            </View>
            <Pressable onPress={retry} accessibilityRole="button" accessibilityLabel="Retry" style={s.bannerRetry}>
              <Text style={s.bannerRetryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {usingSample && __DEV__ && (
          <View style={s.sampleBanner}>
            <Ionicons name="flask-outline" size={16} color="#92400E" />
            <Text style={s.sampleBannerText}>
              {loadError ? `Could not load alerts (${loadError}). ` : ''}Sample data. These are not your alerts.
            </Text>
          </View>
        )}

        {/* List and detail: two columns on desktop, one column on phone */}
        <View style={[s.bodyRow, isExpanded && s.bodyRowWide]}>
          {!isExpanded && selectedNotif ? (
            <View style={s.detailFull}>{renderDetail(selectedNotif, true)}</View>
          ) : (
            <ScrollView
              style={s.leftList}
              contentContainerStyle={s.leftListContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
            >
              {renderListBody()}
            </ScrollView>
          )}

          {isExpanded && (
            <View style={s.rightDetailDrawer}>
              {selectedNotif ? (
                renderDetail(selectedNotif, false)
              ) : (
                <View style={s.noSelectionWrap}>
                  <Ionicons name="hand-left-outline" size={32} color={Colors.textSubtle} />
                  <Text style={s.noSelectionText}>Select an alert on the left to see its details.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {toast && (
        <View style={s.toast} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      {/* PREFERENCES: production shows that they are not available. Switches are dev-only and not saved. */}
      <Modal visible={showSettingsModal} transparent animationType="slide" onRequestClose={closeSettings}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Notification preferences</Text>
              <Pressable onPress={closeSettings} accessibilityRole="button" accessibilityLabel="Close preferences" style={s.modalClose}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {__DEV__ ? (
              <View style={{ gap: 6 }}>
                <Text style={s.devNote}>Dev preview only. These switches are not saved.</Text>
                {[
                  { key: 'push', title: 'Browser push', sub: 'Instant order offers', value: prefPush, set: setPrefPush },
                  { key: 'sms', title: 'SMS', sub: 'Payout and account updates', value: prefSms, set: setPrefSms },
                  { key: 'email', title: 'Email', sub: 'Statements and invoices', value: prefEmail, set: setPrefEmail },
                  { key: 'wa', title: 'WhatsApp', sub: 'Restock reminders', value: prefWhatsapp, set: setPrefWhatsapp },
                ].map((p) => (
                  <View key={p.key} style={s.prefSwitchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.prefSwitchTitle}>{p.title}</Text>
                      <Text style={s.prefSwitchSub}>{p.sub}</Text>
                    </View>
                    <Switch
                      value={p.value}
                      onValueChange={p.set}
                      trackColor={{ false: '#CBD5E1', true: '#C7DAFE' }}
                      thumbColor={p.value ? Colors.primary : '#64748B'}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.unavailableBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={s.unavailableText}>Preferences are not available yet.</Text>
              </View>
            )}

            <Pressable onPress={closeSettings} accessibilityRole="button" style={({ pressed }) => [s.modalPrimaryBtn, pressed && { opacity: 0.85 }]}>
              <Text style={s.modalPrimaryBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EXPIRED DEEP LINK: dev only */}
      {__DEV__ && (
        <Modal visible={showExpiredLinkModal} transparent animationType="fade" onRequestClose={() => setShowExpiredLinkModal(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { padding: 20 }]}>
              <View style={s.expiredTitleRow}>
                <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                <Text style={[s.modalTitle, { color: Colors.danger }]}>Target link expired</Text>
              </View>
              <Text style={s.expiredBody}>The item this alert refers to is no longer active. (Dev preview.)</Text>
              <Pressable onPress={() => setShowExpiredLinkModal(false)} accessibilityRole="button" style={({ pressed }) => [s.modalPrimaryBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.modalPrimaryBtnText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  headerActionBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
  },
  headerActionBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },

  // Banners (dev toggles and real errors)
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.input,
    padding: 10,
  },
  offlineBannerText: { flex: 1, fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.warning },
  deniedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: 10,
  },
  deniedBannerText: { flex: 1, fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.danger },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
  },
  bannerErrorTitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#7F1D1D' },
  bannerErrorText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: '#7F1D1D' },
  bannerRetry: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  bannerRetryText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.danger },
  sampleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadii.input,
    padding: 10,
  },
  sampleBannerText: { flex: 1, fontSize: 12, fontFamily: FontFamily.semibold, color: '#92400E' },

  mainContainer: {
    flex: 1,
    padding: Spacing.lg,
    gap: 12,
  },

  // Dev strip
  devStrip: {
    backgroundColor: Colors.border,
    padding: 8,
    borderRadius: 10,
  },
  devTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSubtle,
    marginBottom: 4,
  },
  devPillRow: { gap: 6 },
  devPill: {
    minHeight: 32,
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  devPillText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#334155' },
  devPillTextActive: { color: '#FFFFFF' },
  devNote: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSubtle, marginBottom: 6 },

  // Category filter
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBar: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBarContent: { gap: 6, alignItems: 'center' },
  categoryTab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  categoryTabText: { fontSize: 13, fontFamily: FontFamily.semibold, color: Colors.textSubtle },
  categoryTabTextActive: { color: Colors.primary, fontFamily: FontFamily.bold },
  markAllBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  markAllBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.primary },

  // Body layout
  bodyRow: { flex: 1 },
  bodyRowWide: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  leftList: { flex: 1 },
  leftListContent: { gap: 10, paddingBottom: 24, flexGrow: 1 },
  detailFull: { flex: 1 },
  detailScroll: { flex: 1 },

  // List cards
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: '#FAFCFF',
  },
  notifCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTitle: { flex: 1, fontSize: 14, fontFamily: FontFamily.semibold, lineHeight: 20, color: Colors.textPrimary },
  notifTitleUnread: { fontFamily: FontFamily.bold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifSummary: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle, marginTop: 2 },
  notifMeta: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textSubtle, marginTop: 6 },

  // Detail drawer (desktop) and detail view (phone)
  rightDetailDrawer: {
    width: 420,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  drawerContent: { gap: 14, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  backRowText: { fontSize: 15, fontFamily: FontFamily.semibold, color: Colors.primary },
  drawerHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  drawerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCategoryText: { fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.primary, letterSpacing: 0.5 },
  drawerTitleText: { fontSize: 16, fontFamily: FontFamily.bold, lineHeight: 22, color: Colors.textPrimary, marginTop: 2 },
  drawerTimeText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: Colors.textSubtle, marginTop: 2 },
  messageBox: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageHeading: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSubtle,
    marginBottom: 4,
  },
  messageBodyText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  refBox: { backgroundColor: Colors.border, padding: 10, borderRadius: 8 },
  refLabel: { fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.textSubtle },
  refCode: { fontSize: 13, fontFamily: FontFamily.mono, color: Colors.textPrimary, marginTop: 2 },
  actionRouteBtn: {
    minHeight: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionRouteBtnText: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#FFFFFF' },
  noSelectionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  noSelectionText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle, textAlign: 'center' },

  // States (loading, error, empty, sign-in)
  stateWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16, gap: 8 },
  stateTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.textPrimary, textAlign: 'center' },
  stateSub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle, textAlign: 'center', maxWidth: 360 },
  primaryBtn: {
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 16,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },

  // Toast
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadii.card,
    padding: 14,
  },
  toastText: { flex: 1, fontSize: 14, fontFamily: FontFamily.semibold, color: '#FFFFFF' },

  // Preferences and expired-link modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.textPrimary },
  modalClose: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  modalPrimaryBtn: {
    minHeight: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalPrimaryBtnText: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#FFFFFF' },
  unavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.input,
    padding: 12,
  },
  unavailableText: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.primary },
  prefSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 4,
  },
  prefSwitchTitle: { fontSize: 14, fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  prefSwitchSub: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSubtle, marginTop: 2 },
  expiredTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expiredBody: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSubtle },
});

export default NotificationsScreen;
