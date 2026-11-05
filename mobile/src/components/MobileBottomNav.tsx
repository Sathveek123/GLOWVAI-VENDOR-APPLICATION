/**
 * Vendor app navigation: the five main tabs, rendered once by app/(vendor)/_layout.tsx.
 *
 *   Phone (< 1024px):  VendorTabBar, a bottom tab bar
 *   Desktop (>= 1024): VendorSidebar, a left sidebar with the same tabs
 *
 * Tabs switch with router.navigate inside an Expo Router <Tabs> navigator, so each tab
 * keeps its scroll position and state, and Back follows the visit history.
 *
 * Badges: any screen can put a count on a tab, for example the open-order count on Orders:
 *
 *   useNavBadge('orders', openOrders.length);   // inside a component, cleared on unmount
 *   setNavBadge('orders', 3);                   // anywhere (socket handlers, stores)
 *
 * Screens must NOT render a tab bar or sidebar themselves. The default export below is a
 * no-op kept only so screens that still render <MobileBottomNav /> compile without showing
 * a second bar; remove those usages.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { create } from 'zustand';
import { Colors, Spacing, BorderRadii } from '../theme/tokens';
import { FontFamily } from '../theme/typography';
import Wordmark, { BrandMark } from './Wordmark';

export type MobileTab = 'home' | 'orders' | 'catalog' | 'earnings' | 'profile';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  key: MobileTab;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  href: '/(vendor)/home' | '/(vendor)/orders' | '/(vendor)/catalog' | '/(vendor)/earnings' | '/(vendor)/profile';
}

export const TAB_ITEMS: readonly NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', href: '/(vendor)/home' },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', href: '/(vendor)/orders' },
  { key: 'catalog', label: 'Inventory', icon: 'cube-outline', activeIcon: 'cube', href: '/(vendor)/catalog' },
  { key: 'earnings', label: 'Earnings', icon: 'wallet-outline', activeIcon: 'wallet', href: '/(vendor)/earnings' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', href: '/(vendor)/profile' },
];

/** Route file names (inside app/(vendor)) of the five tab roots. */
export const TAB_ROUTE_NAMES: readonly string[] = TAB_ITEMS.map(t => t.key);

/** Which tab each secondary screen belongs to, so the active tab is right on every screen. */
const SECTION_OF: Record<string, MobileTab> = {
  home: 'home',
  analytics: 'home',
  notifications: 'home',
  orders: 'orders',
  'order-detail': 'orders',
  'pack-order': 'orders',
  'ready-pickup': 'orders',
  returns: 'orders',
  messages: 'orders',
  catalog: 'catalog',
  'add-sku': 'catalog',
  'recommended-skus': 'catalog',
  expiry: 'catalog',
  procurement: 'catalog',
  promotions: 'catalog',
  earnings: 'earnings',
  'payout-detail': 'earnings',
  'bank-edit': 'earnings',
  'tax-documents': 'earnings',
  profile: 'profile',
  security: 'profile',
  team: 'profile',
  'multi-store': 'profile',
  compliance: 'profile',
  support: 'profile',
  reviews: 'profile',
};

/** Screens that are a focused task with their own sticky footer: the bottom bar is hidden there. */
export const FULL_SCREEN_ROUTES: readonly string[] = ['order-detail', 'pack-order', 'ready-pickup', 'add-sku', 'bank-edit'];

/** "/orders", "/(vendor)/orders" or "/order-detail?x=1" -> "orders" / "order-detail" */
export function routeNameFromPath(pathname: string | null | undefined): string {
  const clean = (pathname || '').split('?')[0].replace(/\/\([^)]+\)/g, '');
  const parts = clean.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'home';
}

export function tabForPath(pathname: string | null | undefined): MobileTab | null {
  return SECTION_OF[routeNameFromPath(pathname)] ?? null;
}

export function isTabRootPath(pathname: string | null | undefined): boolean {
  return TAB_ROUTE_NAMES.includes(routeNameFromPath(pathname));
}

// ── Badges ────────────────────────────────────────────────────────────────────
interface BadgeState {
  badges: Partial<Record<MobileTab, number>>;
  set: (tab: MobileTab, count: number) => void;
}

const useBadgeStore = create<BadgeState>(set => ({
  badges: {},
  set: (tab, count) =>
    set(s => (s.badges[tab] === count ? s : { badges: { ...s.badges, [tab]: Math.max(0, Math.floor(count || 0)) } })),
}));

/** Sets the count shown on a tab. 0 hides the badge. */
export function setNavBadge(tab: MobileTab, count: number) {
  useBadgeStore.getState().set(tab, count);
}

/** Reads the count shown on a tab. */
export function useNavBadgeCount(tab: MobileTab): number {
  return useBadgeStore(s => s.badges[tab] ?? 0);
}

/** Feeds a tab badge from a component; the badge is cleared when the component unmounts. */
export function useNavBadge(tab: MobileTab, count: number | null | undefined) {
  useEffect(() => {
    setNavBadge(tab, count ?? 0);
  }, [tab, count]);
  useEffect(() => () => setNavBadge(tab, 0), [tab]);
}

const badgeText = (n: number) => (n > 99 ? '99+' : String(n));

// ── Phone: bottom tab bar ─────────────────────────────────────────────────────
export function VendorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const badges = useBadgeStore(s => s.badges);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Android lifts the bar above the keyboard; hide it while typing.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const route = routeNameFromPath(pathname);
  if (keyboardOpen || FULL_SCREEN_ROUTES.includes(route)) return null;
  const active = tabForPath(pathname);

  return (
    <View style={[tb.bar, { paddingBottom: Math.max(insets.bottom, Spacing.xs) }]} accessibilityRole="tablist">
      {TAB_ITEMS.map(tab => {
        const on = active === tab.key;
        const count = badges[tab.key] ?? 0;
        return (
          <Pressable
            key={tab.key}
            testID={`tab-${tab.key}`}
            onPress={() => {
              // Re-tapping the tab you are on from a deeper screen returns to the tab's root.
              if (!on || route !== tab.key) router.navigate(tab.href);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={count > 0 ? `${tab.label}, ${count} new` : tab.label}
            style={tb.item}
          >
            <View style={[tb.pill, on && tb.pillOn]}>
              <Ionicons name={on ? tab.activeIcon : tab.icon} size={22} color={on ? Colors.primary : Colors.textSecondary} />
              {count > 0 ? (
                <View style={tb.badge}>
                  <Text style={tb.badgeText}>{badgeText(count)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[tb.label, on && tb.labelOn]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: BorderRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: Colors.primaryLight },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    color: Colors.textSecondary,
  },
  labelOn: { fontFamily: FontFamily.semibold, color: Colors.primary },
  badge: {
    position: 'absolute',
    top: -2,
    left: 32,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 14, color: Colors.textOnPrimary },
});

// ── Desktop: left sidebar ─────────────────────────────────────────────────────
export const SIDEBAR_WIDTH = 240;

export function VendorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const badges = useBadgeStore(s => s.badges);
  const active = tabForPath(pathname);
  const route = routeNameFromPath(pathname);

  const item = (key: string, label: string, icon: IconName, activeIcon: IconName, on: boolean, onPress: () => void, count = 0) => (
    <Pressable
      key={key}
      testID={`sidebar-${key}`}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: on }}
      accessibilityLabel={count > 0 ? `${label}, ${count} new` : label}
      style={({ pressed, hovered }: any) => [sb.item, (hovered || pressed) && !on && sb.itemHover, on && sb.itemOn]}
    >
      <Ionicons name={on ? activeIcon : icon} size={20} color={on ? Colors.primary : Colors.textSecondary} />
      <Text style={[sb.label, on && sb.labelOn]} numberOfLines={1}>
        {label}
      </Text>
      {count > 0 ? (
        <View style={sb.count}>
          <Text style={sb.countText}>{badgeText(count)}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[sb.root, { paddingTop: insets.top + Spacing.lg }]} accessibilityLabel="Main navigation">
      <View style={sb.brand}>
        <BrandMark size={32} />
        <Wordmark size={18} suffix="Seller" style={{ marginLeft: Spacing.sm }} />
      </View>
      <View style={sb.list}>
        {TAB_ITEMS.map(tab =>
          item(tab.key, tab.label, tab.icon, tab.activeIcon, active === tab.key && route !== 'support', () => router.navigate(tab.href), badges[tab.key] ?? 0),
        )}
      </View>
      <View style={sb.footer}>
        {item('support', 'Help and support', 'help-circle-outline', 'help-circle', route === 'support', () => router.navigate('/(vendor)/support'))}
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  root: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  list: { gap: 2 },
  footer: { marginTop: 'auto', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.button,
    gap: Spacing.md,
  },
  itemHover: { backgroundColor: Colors.surface },
  itemOn: { backgroundColor: Colors.primaryLight },
  label: { flex: 1, fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  labelOn: { fontFamily: FontFamily.semibold, color: Colors.primary },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textOnPrimary },
});

/**
 * @deprecated The tab bar is rendered once by app/(vendor)/_layout.tsx. This no-op stays only so
 * screens that still render <MobileBottomNav currentTab="..." /> do not show a second bar.
 */
export default function MobileBottomNav(_props: { currentTab?: MobileTab }) {
  return null;
}
