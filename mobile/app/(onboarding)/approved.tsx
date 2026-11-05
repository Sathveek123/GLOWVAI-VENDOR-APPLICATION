/**
 * Shown once the store's KYC is APPROVED. Confirms the status with the backend,
 * then opens the seller dashboard with the vendor the session belongs to.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vendorApi, ApiError } from '../../src/services/api';
import { clearSession, getSession } from '../../src/services/session';
import { cacheStatus, getCachedStatus, normalizeStatus } from '../../src/features/onboarding/status';
import { clearResumeStep } from '../../src/features/onboarding/draft';
import useVendorStore from '../../src/store/useVendorStore';
import {
  SellerFrame,
  Section,
  Button,
  Banner,
  CenteredLoader,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

const NEXT_STEPS: { title: string; text: string }[] = [
  { title: 'Add your products', text: 'Add each product with its price, stock and photos from the Inventory tab.' },
  { title: 'Go online', text: 'Switch your store online from the dashboard when you’re ready to take orders. Orders reach you only while you are online.' },
];

export default function ApprovedScreen() {
  const router = useRouter();
  const { setVendor } = useVendorStore();
  useDocumentTitle('Store approved');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [offline, setOffline] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session.token) {
        router.replace('/(auth)/login');
        return;
      }
      if (!session.vendorId) {
        router.replace('/(onboarding)/pending');
        return;
      }
      try {
        const res: any = await vendorApi.me();
        const v = res?.vendor;
        const status = normalizeStatus(v);
        await cacheStatus(status);
        if (status !== 'APPROVED') {
          router.replace('/(onboarding)/pending');
          return;
        }
        setProfile(v);
        await clearResumeStep();
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 401) {
          await clearSession();
          router.replace('/(auth)/login');
          return;
        }
        // Offline: trust the status this device last confirmed, otherwise go back to status.
        const known = await getCachedStatus();
        if (known !== 'APPROVED') {
          router.replace('/(onboarding)/pending');
          return;
        }
        setOffline(true);
      }
      setLoading(false);
    })();
  }, []);

  const openDashboard = async () => {
    setOpening(true);
    const session = await getSession();
    if (!session.token) {
      router.replace('/(auth)/login');
      return;
    }
    const storeId = session.storeId || profile?.storeId;
    if (!session.vendorId || !storeId) {
      // Don't sign the seller out: the store record is incomplete on our side.
      setOpening(false);
      setOpenError('Your store isn’t fully set up on our side yet, so the dashboard can’t open. Try again in a few minutes, or contact seller support.');
      return;
    }
    setVendor({
      vendorId: session.vendorId,
      storeId,
      name: profile?.name || profile?.ownerName || '',
      shopName: profile?.shopName,
      phone: profile?.phone || (await AsyncStorage.getItem('vendor_phone')) || '',
      email: profile?.email,
      isOnline: !!profile?.isOnline,
    });
    router.replace('/(vendor)/home');
  };

  if (loading) return <CenteredLoader label="Checking your application" />;

  return (
    <SellerFrame testID="approved">
      {offline ? <Banner tone="warning" message="You’re offline. Some details may be out of date until you reconnect." /> : null}
      {openError ? <Banner tone="error" message={openError} /> : null}
      <Section>
        <View style={st.icon}>
          <Ionicons name="checkmark" size={30} color={C.textOnPrimary} />
        </View>
        <Text accessibilityRole="header" style={st.title}>
          Your store is approved
        </Text>
        <Text style={st.body}>
          {profile?.shopName ? `${profile.shopName} can now sell on GlowVai.` : 'Your store can now sell on GlowVai.'} Here{'’'}s what to do next.
        </Text>
        <View style={{ marginTop: S.lg }}>
          {NEXT_STEPS.map((s, i) => (
            <View key={s.title} style={st.step}>
              <View style={st.stepNum}>
                <Text style={st.stepNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.stepTitle}>{s.title}</Text>
                <Text style={st.stepText}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: S.md }}>
          <Button label="Go to dashboard" iconRight="arrow-forward" onPress={openDashboard} loading={opening} style={{ flex: 1 }} />
        </View>
      </Section>
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.successText, alignItems: 'center', justifyContent: 'center', marginBottom: S.lg },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: S.md, borderTopWidth: 1, borderTopColor: C.border },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FontFamily.bold, fontSize: 14, color: C.primary },
  stepTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  stepText: { fontSize: 14, lineHeight: 20, color: C.textSecondary, marginTop: 2 },
});
