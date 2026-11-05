/**
 * The vendor app shell.
 *
 * Guard: every (vendor) route needs a signed-in vendor whose application is APPROVED.
 *   no session                -> sign in
 *   nothing submitted yet     -> the onboarding step to resume
 *   not approved / suspended  -> application status screen
 *   can't reach the server    -> the last confirmed status on this device decides; with
 *                                none, the splash screen shows its offline card
 *
 * Navigation: an Expo Router <Tabs> navigator, so the five tabs (Home, Orders, Inventory,
 * Earnings, Profile) stay mounted and keep their state, and Back follows visit history.
 * Phones get the bottom tab bar; at >= 1024px a left sidebar with the same tabs.
 * Detail screens (order detail, packing, forms) are routes in the same navigator and are
 * unmounted when you leave them, so they always open fresh.
 *
 * Screens draw only their own content (ScreenShell + AppHeader), never a tab bar or rail.
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { getSession } from '../../src/services/session';
import useVendorStore from '../../src/store/useVendorStore';
import { getResumeStep } from '../../src/features/onboarding/draft';
import { checkVendorStatus, getCachedStatus, STATUS_ROUTE, LOGIN_ROUTE } from '../../src/features/onboarding/status';
import { VendorTabBar, VendorSidebar, TAB_ROUTE_NAMES } from '../../src/components/MobileBottomNav';
import { Colors, Breakpoints } from '../../src/theme/tokens';
import { IncomingOfferHost } from '../../src/features/orders';

type Gate = 'checking' | 'open';

function useApprovedVendorGate(): Gate {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('checking');

  useEffect(() => {
    let active = true;
    const go = (route: string) => active && router.replace(route as any);

    (async () => {
      const session = await getSession();
      if (!active) return;
      if (!session.token) return go(LOGIN_ROUTE);
      if (!session.vendorId) {
        const resume = await getResumeStep();
        return go(`/(onboarding)/${resume || 'step-a'}`);
      }

      const cached = await getCachedStatus();
      // A store this device already knows is approved opens straight away; the server check runs alongside.
      if (cached === 'APPROVED' && active) setGate('open');

      const check = await checkVendorStatus();
      if (!active) return;
      if (check.kind === 'signed_out') return go(LOGIN_ROUTE);
      if (check.kind === 'not_found') return go(STATUS_ROUTE);
      if (check.kind === 'ok') {
        if (check.status !== 'APPROVED') return go(STATUS_ROUTE);
        const v = check.vendor || {};
        const store = useVendorStore.getState();
        if (!store.vendor) {
          store.setVendor({
            vendorId: session.vendorId,
            storeId: session.storeId || v.storeId || '',
            name: v.name || v.ownerName || '',
            shopName: v.shopName || v.storeName,
            phone: v.phone || v.contactNumber || '',
            email: v.email,
            city: v.city,
            isOnline: !!v.isOnline,
          });
        }
        return setGate('open');
      }
      // Offline or server error: trust the last confirmed status, otherwise let the splash handle it.
      if (cached === 'APPROVED') return;
      if (cached) return go(STATUS_ROUTE);
      go('/');
    })();

    return () => {
      active = false;
    };
  }, []);

  return gate;
}

export default function VendorLayout() {
  const gate = useApprovedVendorGate();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;

  if (gate !== 'open') {
    return (
      <View style={s.loading} accessibilityLabel="Checking your store">
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {isDesktop ? <VendorSidebar /> : null}
      <View style={s.main}>
        <Tabs
          initialRouteName="home"
          backBehavior="history"
          tabBar={() => (isDesktop ? null : <VendorTabBar />)}
          screenOptions={({ route }) => ({
            headerShown: false,
            // Tabs keep their state; every other screen opens fresh each time.
            unmountOnBlur: !TAB_ROUTE_NAMES.includes(route.name),
          })}
          sceneContainerStyle={{ backgroundColor: Colors.canvas }}
        >
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
          <Tabs.Screen name="catalog" options={{ title: 'Inventory' }} />
          <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
      {/* New order offers appear over every tab and screen. */}
      <IncomingOfferHost />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.canvas },
  main: { flex: 1, minWidth: 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.canvas },
});
