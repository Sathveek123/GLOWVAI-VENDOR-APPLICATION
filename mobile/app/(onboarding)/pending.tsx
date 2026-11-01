/**
 * Application status after onboarding is submitted.
 * Reads the real KYC status from GET /api/vendor/me:
 *   PENDING  -> under review
 *   REJECTED -> reason and how to fix it
 *   APPROVED -> approved screen
 * Without a session the seller is sent to sign in; with a phone-only session
 * (nothing submitted yet) they go back to registration.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vendorApi, ApiError } from '../../src/services/api';
import { clearSession, getSession } from '../../src/services/session';
import {
  SellerFrame,
  Section,
  Banner,
  Button,
  SummaryRow,
  CenteredLoader,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { getResumeStep, setResumeStep } from '../../src/features/onboarding/draft';
import { isNetworkError } from '../../src/features/onboarding/guard';
import { formatMobile } from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

type Status = 'loading' | 'PENDING' | 'REJECTED';

interface VendorInfo {
  shopName?: string;
  name?: string;
  phone?: string;
  city?: string;
  kycSubmittedAt?: number;
  kycRejectionReason?: string | null;
}

const fmtDate = (ms?: number | string | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function PendingScreen() {
  const router = useRouter();
  useDocumentTitle('Application status');

  const [status, setStatus] = useState<Status>('loading');
  const [vendor, setVendor] = useState<VendorInfo>({});
  const [checking, setChecking] = useState(false);
  const [offline, setOffline] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');

  const signOut = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  const check = useCallback(async () => {
    const session = await getSession();
    if (!session.token) {
      router.replace('/(auth)/login');
      return;
    }
    if (!session.vendorId) {
      // Signed in, but nothing has been submitted yet.
      const resume = await getResumeStep();
      router.replace(`/(onboarding)/${resume || 'step-a'}` as any);
      return;
    }
    setChecking(true);
    try {
      const res: any = await vendorApi.me();
      const v = res?.vendor || {};
      setOffline(false);
      setVendor(v);
      setCheckedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      const kyc = v.kycStatus || 'PENDING';
      await AsyncStorage.multiSet([
        ['vendor_kyc_status', kyc],
        ['vendor_onboarding_status', kyc === 'APPROVED' ? 'approved' : kyc === 'REJECTED' ? 'rejected' : 'pending'],
      ]);
      if (kyc === 'APPROVED') {
        router.replace('/(onboarding)/approved');
        return;
      }
      setStatus(kyc === 'REJECTED' ? 'REJECTED' : 'PENDING');
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
        // The session is no longer valid (expired, or the store record is gone).
        await clearSession();
        router.replace('/(auth)/login');
        return;
      }
      setOffline(isNetworkError(e) || !(e instanceof ApiError));
      // Show the last status this device knew about.
      const known = await AsyncStorage.getItem('vendor_onboarding_status');
      const raw = await AsyncStorage.getItem('onb_step_a');
      const submittedAt = await AsyncStorage.getItem('vendor_submitted_at');
      let shopName: string | undefined;
      try {
        shopName = raw ? JSON.parse(raw).storeName : undefined;
      } catch (_) {}
      setVendor(prev => ({ shopName, kycSubmittedAt: submittedAt ? Date.parse(submittedAt) : undefined, ...prev }));
      setStatus(known === 'rejected' ? 'REJECTED' : 'PENDING');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const fixAndResubmit = async () => {
    await setResumeStep('step-a');
    router.replace('/(onboarding)/step-a');
  };

  if (status === 'loading') return <CenteredLoader label="Checking your application" />;

  const rejected = status === 'REJECTED';

  return (
    <SellerFrame headerRight={<Button label="Sign out" variant="ghost" compact onPress={signOut} />} testID="pending">
      {offline ? (
        <Banner tone="warning" title="You're offline" message="Can't reach glowvai right now. This is the last status saved on this device.">
          <View style={{ flexDirection: 'row', marginTop: S.sm }}>
            <Button label="Try again" variant="secondary" compact onPress={check} loading={checking} />
          </View>
        </Banner>
      ) : null}

      <Section>
        <View style={[st.badge, rejected ? st.badgeRejected : st.badgePending]}>
          <Ionicons name={rejected ? 'alert-circle' : 'time-outline'} size={16} color={rejected ? '#7F1D1D' : '#78350F'} />
          <Text style={[st.badgeText, { color: rejected ? '#7F1D1D' : '#78350F' }]}>
            {rejected ? 'Changes needed' : 'Under review'}
          </Text>
        </View>
        <Text accessibilityRole="header" style={st.title}>
          {rejected ? 'Your application needs changes' : 'Your store is under review'}
        </Text>
        <Text style={st.body}>
          {rejected
            ? 'Our team couldn’t approve your store with the details you sent. Fix the issue below and submit again.'
            : 'Our team is checking your business, bank and store details. This page shows the latest status whenever you open it.'}
        </Text>

        {rejected ? (
          <View style={st.reason}>
            <Text style={st.reasonLabel}>Reason</Text>
            <Text style={st.reasonText}>{vendor.kycRejectionReason || 'No reason was added to your application.'}</Text>
          </View>
        ) : null}

        <View style={st.summary}>
          <SummaryRow label="Store" value={vendor.shopName} />
          {vendor.phone ? <SummaryRow label="Mobile" value={`+91 ${formatMobile(String(vendor.phone).replace(/\D/g, '').slice(-10))}`} /> : null}
          <SummaryRow label="Submitted" value={fmtDate(vendor.kycSubmittedAt)} />
        </View>

        <View style={st.actions}>
          {rejected ? (
            <Button label="Update details and resubmit" iconRight="arrow-forward" onPress={fixAndResubmit} />
          ) : (
            <Button label="Check status" icon="refresh" variant="secondary" onPress={check} loading={checking} />
          )}
        </View>
        {checkedAt && !offline ? <Text style={st.checked}>Last checked at {checkedAt}</Text> : null}
      </Section>

      {!rejected ? (
        <Section title="While you wait">
          <View style={st.tip}>
            <Ionicons name="document-text-outline" size={20} color={C.primary} style={st.tipIcon} />
            <Text style={st.tipText}>Keep your GST certificate and ID proof nearby in case our team asks for a clearer copy.</Text>
          </View>
          <View style={st.tip}>
            <Ionicons name="pricetags-outline" size={20} color={C.primary} style={st.tipIcon} />
            <Text style={st.tipText}>Make a list of the products you want to sell. You can add them once your store is approved.</Text>
          </View>
        </Section>
      ) : null}
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: S.md },
  badgePending: { backgroundColor: C.warningLight },
  badgeRejected: { backgroundColor: C.dangerLight },
  badgeText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm },
  reason: { marginTop: S.lg, padding: S.md + 2, borderRadius: 10, backgroundColor: C.dangerLight, borderWidth: 1, borderColor: C.dangerBorder },
  reasonLabel: { fontFamily: FontFamily.semibold, fontSize: 13, color: '#7F1D1D', marginBottom: 2 },
  reasonText: { fontSize: 15, lineHeight: 22, color: '#7F1D1D' },
  summary: { marginTop: S.lg, paddingTop: S.md, borderTopWidth: 1, borderTopColor: C.border },
  actions: { flexDirection: 'row', marginTop: S.lg },
  checked: { fontSize: 13, color: C.textSubtle, marginTop: S.sm },
  tip: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md },
  tipIcon: { marginRight: S.md, marginTop: 1 },
  tipText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textSecondary },
});
