/**
 * The vendor app shell.
 *
 * Guard: every (vendor) route needs a signed-in vendor (Firebase Auth) whose store GlowVai
 * has approved (GET /api/vendor/me: APPROVED_ACTIVE or APPROVED_PAUSED).
 *   not signed in              -> sign in
 *   any other state            -> the application status screen (it handles no application,
 *                                 review, rejection and suspension)
 *   can't reach GlowVai        -> the last loaded account decides; with none, a Retry card
 *
 * The shell also runs the order polling and presence heartbeat (src/features/orders/sync.ts)
 * from the account state, stops them on sign-out, and shows new offers over every screen.
 *
 * Navigation: an Expo Router <Tabs> navigator, so the five tabs (Home, Orders, Inventory,
 * Earnings, Profile) stay mounted and keep their state. Phones get the bottom tab bar;
 * at >= 1024px a left sidebar with the same tabs.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../src/config/firebase';
import { clearVendorMe, useVendorMe, type VendorState } from '../../src/services/vendorApi/account';
import { VendorTabBar, VendorSidebar, TAB_ROUTE_NAMES } from '../../src/components/MobileBottomNav';
import { Colors, Breakpoints, Spacing } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import { IncomingOfferHost, configureSync, stopSync } from '../../src/features/orders';
import { PrimaryButton } from '../../src/features/orders/ui';

const LOGIN_ROUTE = '/(auth)/login';
const STATUS_ROUTE = '/(onboarding)/pending';

const APPROVED: VendorState[] = ['APPROVED_ACTIVE', 'APPROVED_PAUSED'];

type AuthState = { kind: 'unknown' } | { kind: 'none' } | { kind: 'user'; uid: string };

function useFirebaseUser(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ kind: 'unknown' });
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(getFirebaseAuth(), user => {
        setAuth(user ? { kind: 'user', uid: user.uid } : { kind: 'none' });
      });
    } catch {
      // Firebase is not configured in this build: nobody can be signed in.
      setAuth({ kind: 'none' });
    }
    return () => unsub?.();
  }, []);
  return auth;
}

type Gate = 'checking' | 'open' | 'unreachable';

function useApprovedVendorGate() {
  const router = useRouter();
  const auth = useFirebaseUser();
  const { me, error, errorCode, refresh } = useVendorMe();
  const [gate, setGate] = useState<Gate>('checking');
  /** The uid whose /me load has finished (successfully or not), and how many times. */
  const [checked, setChecked] = useState<{ uid: string; n: number } | null>(null);
  const redirected = useRef<string | null>(null);
  const meRef = useRef(me);
  meRef.current = me;

  const go = (route: string) => {
    if (redirected.current === route) return;
    redirected.current = route;
    router.replace(route as any);
  };

  const check = (uid: string) => {
    const cached = meRef.current;
    const load = cached && cached.account.uid === uid ? Promise.resolve() : refresh();
    return load.then(() => setChecked(c => ({ uid, n: (c?.n ?? 0) + 1 })));
  };

  // Load the account once Firebase has restored the session (and again for a different user).
  const uid = auth.kind === 'user' ? auth.uid : null;
  useEffect(() => {
    if (uid) void check(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (auth.kind === 'unknown') return;
    if (auth.kind === 'none') {
      stopSync();
      clearVendorMe();
      go(LOGIN_ROUTE);
      return;
    }
    const mine = me && me.account.uid === auth.uid ? me : null;
    if (mine) {
      const state = mine.vendor.state;
      if (APPROVED.includes(state)) {
        redirected.current = null;
        setGate('open');
      } else {
        go(STATUS_ROUTE);
      }
      return;
    }
    if (!checked || checked.uid !== auth.uid) return; // still loading
    if (errorCode === 'UNAUTHENTICATED' || errorCode === 'NOT_A_VENDOR_ACCOUNT') {
      go(LOGIN_ROUTE);
      return;
    }
    setGate('unreachable');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, me, errorCode, checked]);

  // Polling and heartbeat follow the account.
  useEffect(() => {
    const mine = auth.kind === 'user' && me && me.account.uid === auth.uid ? me : null;
    const v = mine?.vendor;
    const allowed = !!v && APPROVED.includes(v.state);
    configureSync({
      signedIn: auth.kind === 'user',
      allowed,
      canOperate: allowed && !!v?.canOperate,
      online: allowed && !!v?.canOperate && !!v?.isOnline,
    });
  }, [auth, me]);

  const retry = () => {
    if (!uid) return;
    setGate('checking');
    void refresh().then(() => setChecked(c => ({ uid, n: (c?.n ?? 0) + 1 })));
  };

  return { gate, error, retry };
}

export default function VendorLayout() {
  const { gate, error, retry } = useApprovedVendorGate();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;

  if (gate === 'unreachable') {
    return (
      <View style={s.center}>
        <View style={s.card}>
          <Text style={s.title}>Can't open your store</Text>
          <Text style={s.body}>{error || 'We could not reach GlowVai. Check your internet and try again.'}</Text>
          <PrimaryButton label="Retry" onPress={retry} style={{ alignSelf: 'stretch' }} />
        </View>
      </View>
    );
  }

  if (gate !== 'open') {
    return (
      <View style={s.center} accessibilityLabel="Checking your store">
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.canvas, padding: Spacing.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' },
});
