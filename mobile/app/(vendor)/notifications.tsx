/**
 * Notifications: alerts from GET /api/notifications/:vendorId.
 * Tapping an alert marks it read (PATCH /api/notifications/:id/read) and opens its screen.
 *
 * Mark-read uses the Firestore document id. The backend currently lets a stored `id` field
 * overwrite the document id in its response; the client prefers `docId` when the backend
 * sends it (see the backend note in this slice's report).
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { formatDateIST, formatTimeIST, friendlyError, toMs } from '../../src/features/money/format';
import { Card, ErrorCard, LoadingCard, StateCard, kit, page } from '../../src/features/money/ui';
import { notificationsApi } from '../../src/services/api';
import { useVendorSession } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Category = 'ORDERS' | 'STOCK' | 'PAYOUTS' | 'ACCOUNT' | 'OTHER';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<Category, { label: string; icon: IconName }> = {
  ORDERS: { label: 'Orders', icon: 'bag-handle-outline' },
  STOCK: { label: 'Stock', icon: 'cube-outline' },
  PAYOUTS: { label: 'Payouts', icon: 'wallet-outline' },
  ACCOUNT: { label: 'Account', icon: 'person-circle-outline' },
  OTHER: { label: 'Other', icon: 'information-circle-outline' },
};
const FILTERS: ('ALL' | Category)[] = ['ALL', 'ORDERS', 'STOCK', 'PAYOUTS', 'ACCOUNT'];

const CATEGORY_BY_TYPE: Record<string, Category> = {
  NEW_ORDER: 'ORDERS',
  ORDER_OFFER: 'ORDERS',
  OFFER_EXPIRED: 'ORDERS',
  ORDER_CANCELLED: 'ORDERS',
  LOW_STOCK: 'STOCK',
  NEAR_EXPIRY: 'STOCK',
  INVENTORY: 'STOCK',
  PAYOUT: 'PAYOUTS',
  SETTLEMENT: 'PAYOUTS',
  SETTLEMENT_FAILED: 'PAYOUTS',
  KYC: 'ACCOUNT',
  APPROVAL: 'ACCOUNT',
  COMPLIANCE: 'ACCOUNT',
  SUSPENSION: 'ACCOUNT',
  SUPPORT_UPDATE: 'ACCOUNT',
};

/** Screens an alert may open. A route from the server is used only if it is in this list. */
const VENDOR_ROUTES = [
  '/(vendor)/home',
  '/(vendor)/orders',
  '/(vendor)/order-detail',
  '/(vendor)/catalog',
  '/(vendor)/expiry',
  '/(vendor)/earnings',
  '/(vendor)/payout-detail',
  '/(vendor)/bank-edit',
  '/(vendor)/tax-documents',
  '/(vendor)/profile',
  '/(vendor)/compliance',
  '/(vendor)/support',
  '/(vendor)/returns',
  '/(vendor)/reviews',
] as const;
type VendorRoute = (typeof VENDOR_ROUTES)[number];

interface Alert {
  /** The id used for mark-read: the Firestore document id when the backend sends it. */
  id: string;
  category: Category;
  title: string;
  body: string;
  createdAt: number | null;
  read: boolean;
  action?: { route: VendorRoute; params?: Record<string, string>; label: string };
}

/** Strips emoji and pictographs so titles read calmly. */
function plain(text: string): string {
  return text.replace(/(?:[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿]|️)/g, '').replace(/\s+/g, ' ').trim();
}

function normalize(raw: any): Alert | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.docId ?? raw.firestoreId ?? raw.id ?? raw.notificationId;
  if (id === undefined || id === null || id === '') return null;
  const type = typeof raw.type === 'string' ? raw.type.toUpperCase() : '';
  const category = CATEGORY_BY_TYPE[type] ?? 'OTHER';
  const orderId = typeof raw.orderId === 'string' && raw.orderId ? raw.orderId : undefined;

  let action: Alert['action'];
  if (typeof raw.actionRoute === 'string') {
    if ((VENDOR_ROUTES as readonly string[]).includes(raw.actionRoute)) {
      action = { route: raw.actionRoute as VendorRoute, label: typeof raw.actionText === 'string' ? raw.actionText : 'Open' };
    }
  } else if (category === 'ORDERS' && orderId) {
    action = { route: '/(vendor)/order-detail', params: { orderId }, label: 'Open order' };
  } else if (category === 'PAYOUTS') {
    action = { route: '/(vendor)/payout-detail', label: 'View settlements' };
  } else if (category === 'STOCK') {
    action = { route: type === 'NEAR_EXPIRY' ? '/(vendor)/expiry' : '/(vendor)/catalog', label: 'Open catalogue' };
  } else if (category === 'ACCOUNT') {
    action = { route: type === 'SUPPORT_UPDATE' ? '/(vendor)/support' : '/(vendor)/profile', label: 'Open' };
  }

  // A new-order alert shows only the order reference: no customer name or amount.
  const body = type === 'NEW_ORDER' && orderId ? `Order ${orderId} is waiting for your response.` : String(raw.body ?? raw.message ?? '');

  return {
    id: String(id),
    category,
    title: plain(String(raw.title || CATEGORY_META[category].label)) || CATEGORY_META[category].label,
    body: plain(body),
    createdAt: toMs(raw.createdAt ?? raw.timestampMs),
    read: raw.read === true,
    action,
  };
}

function relative(ms: number | null, now: number): string {
  if (!ms) return '';
  const minutes = Math.floor(Math.max(0, now - ms) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${formatDateIST(ms, { weekday: false, withYear: false })}, ${formatTimeIST(ms)}`;
}

type Status = 'loading' | 'ready' | 'error';

export default function NotificationsScreen() {
  const router = useRouter();
  const session = useVendorSession();
  const vendorId = session.vendorId || '';

  const [items, setItems] = useState<Alert[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | Category>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async (id: string) => {
    const req = ++requestRef.current;
    try {
      const res = await notificationsApi.getAll(id);
      if (req !== requestRef.current) return;
      const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.notifications) ? res.notifications : [];
      setItems(
        list
          .map(normalize)
          .filter((n): n is Alert => n !== null)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      );
      setStatus('ready');
    } catch (err) {
      if (req !== requestRef.current) return;
      setError(friendlyError(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!session.loaded || !vendorId) return;
    setStatus('loading');
    load(vendorId);
  }, [session.loaded, vendorId, load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const onRefresh = async () => {
    if (!vendorId) return;
    setRefreshing(true);
    await load(vendorId);
    setRefreshing(false);
  };

  /** Marks one alert read at once, and puts it back if the server call fails. */
  const markRead = async (alert: Alert) => {
    if (alert.read) return;
    setItems((prev) => prev.map((n) => (n.id === alert.id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(alert.id);
    } catch (_) {
      setItems((prev) => prev.map((n) => (n.id === alert.id ? { ...n, read: false } : n)));
      setNotice('This alert could not be marked as read. Try again in a moment.');
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const failed = (await Promise.all(unread.map((n) => notificationsApi.markRead(n.id).then(() => null, () => n.id)))).filter(
      (x): x is string => x !== null
    );
    if (failed.length) {
      setItems((prev) => prev.map((n) => (failed.includes(n.id) ? { ...n, read: false } : n)));
      setNotice(failed.length === 1 ? '1 alert could not be marked as read.' : `${failed.length} alerts could not be marked as read.`);
    }
  };

  const open = (alert: Alert) => {
    markRead(alert);
    if (alert.action) {
      router.push((alert.action.params ? { pathname: alert.action.route, params: alert.action.params } : alert.action.route) as any);
    } else {
      setExpanded((cur) => (cur === alert.id ? null : alert.id));
    }
  };

  const now = Date.now();
  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = items.filter((n) => filter === 'ALL' || n.category === filter);
  const noSession = session.loaded && !vendorId;

  return (
    <ScreenShell
      header={{
        title: 'Notifications',
        subtitle: status === 'ready' && unreadCount > 0 ? `${unreadCount} unread` : undefined,
        showBack: true,
        rightActions:
          unreadCount > 0 ? (
            <Pressable onPress={markAllRead} accessibilityRole="button" style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}>
              <Text style={s.headerBtnText}>Mark all read</Text>
            </Pressable>
          ) : undefined,
      }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={page.body}>
        {noSession ? (
          <StateCard
            icon="log-in-outline"
            title="Sign in to see your notifications"
            body="Your store account is not signed in on this device."
            action={{ label: 'Sign in', onPress: () => router.replace('/(auth)/login') }}
          />
        ) : null}

        {!noSession && status === 'loading' ? <LoadingCard label="Loading notifications" /> : null}
        {!noSession && status === 'error' && items.length === 0 ? (
          <ErrorCard title="Could not load notifications" message={error} onRetry={() => { setStatus('loading'); load(vendorId); }} />
        ) : null}

        {!noSession && status !== 'loading' && (status === 'ready' || items.length > 0) ? (
          <>
            {status === 'error' ? <Text style={s.stale}>Showing earlier alerts. {error}</Text> : null}
            {notice ? (
              <Text style={s.stale} accessibilityLiveRegion="polite">
                {notice}
              </Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} accessibilityRole="radiogroup" accessibilityLabel="Filter notifications">
              {FILTERS.map((f) => {
                const on = filter === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>{f === 'ALL' ? 'All' : CATEGORY_META[f].label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {visible.length === 0 ? (
              <StateCard
                icon="notifications-outline"
                title={filter === 'ALL' ? "You're all caught up" : `No ${CATEGORY_META[filter].label.toLowerCase()} alerts`}
                body="New orders, stock warnings, payout updates and account notices will appear here."
              />
            ) : (
              <Card padded={false}>
                {visible.map((n, i) => {
                  const meta = CATEGORY_META[n.category];
                  const isOpen = expanded === n.id;
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body}. ${relative(n.createdAt, now)}`}
                      accessibilityHint={n.action ? n.action.label : undefined}
                      style={({ pressed }) => [s.row, i < visible.length - 1 && s.divider, !n.read && s.rowUnread, pressed && { opacity: 0.85 }]}
                    >
                      <View style={s.icon}>
                        <Ionicons name={meta.icon} size={18} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text style={[s.title, !n.read && s.titleUnread]} numberOfLines={isOpen ? undefined : 1}>
                          {n.title}
                        </Text>
                        {n.body ? (
                          <Text style={kit.body} numberOfLines={isOpen ? undefined : 2}>
                            {n.body}
                          </Text>
                        ) : null}
                        <Text style={kit.muted}>{[meta.label, relative(n.createdAt, now)].filter(Boolean).join(' · ')}</Text>
                      </View>
                      {!n.read ? <View style={s.dot} /> : n.action ? <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} /> : null}
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  headerBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  headerBtnText: { ...TypeScale.bodyStrong, color: Colors.primary },
  stale: { ...TypeScale.caption, color: Colors.textSecondary, paddingHorizontal: Spacing.xs },
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { ...TypeScale.body, color: Colors.textSecondary },
  chipTextOn: { color: Colors.primary, fontFamily: FontFamily.semibold },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg, minHeight: 64 },
  rowUnread: { backgroundColor: Colors.primaryLight },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  titleUnread: { fontFamily: FontFamily.semibold },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
});
