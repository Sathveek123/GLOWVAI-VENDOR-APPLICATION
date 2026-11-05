/**
 * Application status (screen 08a). Reads the vendor from GET /api/vendor/me and shows one
 * of: Submitted, Under review, More information required, Rejected (reason and next steps),
 * Suspended, or Approved (handed to approved.tsx).
 *
 * - No session: sign in. Signed in with nothing submitted: back to the onboarding step.
 * - 401: the session is no longer valid, so sign in again.
 * - 404: the vendor stays signed in; a clear "we couldn't find your application" message.
 * - Offline: the last status confirmed on this device, with "Try again".
 * While the application is waiting for review the status refreshes every 30 seconds.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import {
  checkVendorStatus,
  getCachedStatus,
  requestedItems,
  statusReason,
  type ApplicationStatus,
} from '../../src/features/onboarding/status';
import { SELLER_SUPPORT, hasSellerSupport } from '../../src/features/onboarding/support';
import { formatMobile } from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

type View_ = ApplicationStatus | 'NOT_FOUND' | 'loading';
type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'info' | 'warning' | 'danger' | 'neutral';

const REFRESH_MS = 30_000;

const COPY: Record<Exclude<View_, 'loading' | 'APPROVED'>, { chip: string; tone: Tone; icon: IconName; title: string; body: string }> = {
  SUBMITTED: {
    chip: 'Submitted',
    tone: 'info',
    icon: 'paper-plane-outline',
    title: 'Application submitted',
    body: 'We have your application. Our team will start checking your business, bank and store details soon. You don’t need to do anything right now.',
  },
  UNDER_REVIEW: {
    chip: 'Under review',
    tone: 'info',
    icon: 'time-outline',
    title: 'Your store is under review',
    body: 'Our team is checking your business, bank and store details. This page updates on its own while you wait.',
  },
  INFO_REQUIRED: {
    chip: 'More information needed',
    tone: 'warning',
    icon: 'document-text-outline',
    title: 'We need a few more details',
    body: 'Our team needs more information before they can approve your store. Update the items below and submit again.',
  },
  REJECTED: {
    chip: 'Not approved',
    tone: 'danger',
    icon: 'close-circle-outline',
    title: 'Your application wasn’t approved',
    body: 'Our team couldn’t approve your store with the details you sent. Read the reason below, fix the details and submit again.',
  },
  SUSPENDED: {
    chip: 'Suspended',
    tone: 'danger',
    icon: 'pause-circle-outline',
    title: 'Your store is suspended',
    body: 'Your store can’t take orders right now. Contact GlowVai seller support to find out what is needed to restore it.',
  },
  NOT_FOUND: {
    chip: 'Not found',
    tone: 'neutral',
    icon: 'search-outline',
    title: 'We couldn’t find your application',
    body: 'You are still signed in, but our server has no application for this account. If you submitted in the last few minutes, check again shortly. Otherwise, review your details and submit them again.',
  },
  UNKNOWN: {
    chip: 'Status unavailable',
    tone: 'neutral',
    icon: 'help-circle-outline',
    title: 'We couldn’t read your application status',
    body: 'Your application is saved, but its status isn’t one this app recognises yet. Check again later, or contact seller support.',
  },
};

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: C.primaryLight, fg: C.infoText },
  warning: { bg: C.warningLight, fg: C.warningText },
  danger: { bg: C.dangerLight, fg: C.dangerText },
  neutral: { bg: C.surface, fg: C.textSecondary },
};

interface VendorInfo {
  shopName?: string;
  phone?: string;
  kycSubmittedAt?: number | string;
  [key: string]: any;
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

  const [view, setView] = useState<View_>('loading');
  const [vendor, setVendor] = useState<VendorInfo>({});
  const [checking, setChecking] = useState(false);
  const [offline, setOffline] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');
  const active = useRef(true);

  const signOut = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  const localDetails = async (): Promise<VendorInfo> => {
    const [raw, submittedAt] = await Promise.all([AsyncStorage.getItem('onb_step_a'), AsyncStorage.getItem('vendor_submitted_at')]);
    let shopName: string | undefined;
    try {
      shopName = raw ? JSON.parse(raw).storeName : undefined;
    } catch (_) {}
    return { shopName, kycSubmittedAt: submittedAt ? Date.parse(submittedAt) : undefined };
  };

  const check = useCallback(async () => {
    const session = await getSession();
    if (!active.current) return;
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
    const result = await checkVendorStatus();
    if (!active.current) return;
    setChecking(false);

    if (result.kind === 'signed_out') {
      router.replace('/(auth)/login');
      return;
    }
    if (result.kind === 'ok') {
      setOffline(false);
      setCheckedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      if (result.status === 'APPROVED') {
        router.replace('/(onboarding)/approved');
        return;
      }
      setVendor(result.vendor || {});
      setView(result.status);
      return;
    }
    if (result.kind === 'not_found') {
      setOffline(false);
      setVendor(await localDetails());
      setView('NOT_FOUND');
      return;
    }
    // Offline or server error: show the last status this device knew about.
    setOffline(true);
    const [cached, local] = await Promise.all([getCachedStatus(), localDetails()]);
    if (!active.current) return;
    setVendor(prev => ({ ...local, ...prev }));
    setView(prev => (prev !== 'loading' ? prev : cached && cached !== 'APPROVED' ? cached : 'SUBMITTED'));
  }, []);

  useEffect(() => {
    active.current = true;
    check();
    return () => {
      active.current = false;
    };
  }, [check]);

  // Waiting for a decision: refresh quietly so the seller sees changes without tapping.
  const waiting = view === 'SUBMITTED' || view === 'UNDER_REVIEW';
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(check, REFRESH_MS);
    return () => clearInterval(t);
  }, [waiting, check]);

  const editApplication = async () => {
    // With no application on the server, forget the cached status so the form steps open.
    if (view === 'NOT_FOUND') await AsyncStorage.removeItem('vendor_kyc_status').catch(() => {});
    await setResumeStep('step-a');
    router.replace('/(onboarding)/step-a');
  };

  if (view === 'loading' || view === 'APPROVED') return <CenteredLoader label="Checking your application" />;

  const copy = COPY[view];
  const tone = TONE_COLORS[copy.tone];
  const reason = statusReason(vendor);
  const items = requestedItems(vendor);
  const showReason = view === 'REJECTED' || view === 'INFO_REQUIRED' || view === 'SUSPENDED';

  return (
    <SellerFrame headerRight={<Button label="Sign out" variant="ghost" compact onPress={signOut} />} testID="pending">
      {offline ? (
        <Banner tone="warning" title="You’re offline" message="We can’t reach GlowVai right now. This is the last status saved on this device.">
          <View style={{ flexDirection: 'row', marginTop: S.sm }}>
            <Button label="Try again" variant="secondary" compact onPress={check} loading={checking} />
          </View>
        </Banner>
      ) : null}

      <Section>
        <View style={[st.chip, { backgroundColor: tone.bg }]} testID={`status-${view}`}>
          <Ionicons name={copy.icon} size={16} color={tone.fg} />
          <Text style={[st.chipText, { color: tone.fg }]}>{copy.chip}</Text>
        </View>
        <Text accessibilityRole="header" style={st.title}>
          {copy.title}
        </Text>
        <Text style={st.body}>{copy.body}</Text>

        {showReason ? (
          <View style={[st.reason, { backgroundColor: tone.bg }]}>
            <Text style={[st.reasonLabel, { color: tone.fg }]}>{view === 'INFO_REQUIRED' ? 'What we need' : 'Reason'}</Text>
            {items.length ? (
              items.map(item => (
                <View key={item} style={st.itemRow}>
                  <Text style={[st.reasonText, { color: tone.fg }]}>{'•'}</Text>
                  <Text style={[st.reasonText, { color: tone.fg, flex: 1 }]}>{item}</Text>
                </View>
              ))
            ) : null}
            <Text style={[st.reasonText, { color: tone.fg }]}>
              {reason || (items.length ? '' : 'Our team didn’t add a note. Contact seller support to find out more.')}
            </Text>
          </View>
        ) : null}

        {view !== 'NOT_FOUND' && view !== 'SUSPENDED' ? <Timeline view={view} /> : null}

        {vendor.shopName || vendor.phone || vendor.kycSubmittedAt ? (
          <View style={st.summary}>
            <SummaryRow label="Store" value={vendor.shopName} />
            {vendor.phone ? <SummaryRow label="Mobile" value={`+91 ${formatMobile(String(vendor.phone).replace(/\D/g, '').slice(-10))}`} /> : null}
            <SummaryRow label="Submitted" value={fmtDate(vendor.kycSubmittedAt)} />
          </View>
        ) : null}

        <View style={st.actions}>
          {view === 'INFO_REQUIRED' ? (
            <Button label="Update your details" iconRight="arrow-forward" onPress={editApplication} testID="status-primary" />
          ) : view === 'REJECTED' ? (
            <Button label="Fix and resubmit" iconRight="arrow-forward" onPress={editApplication} testID="status-primary" />
          ) : view === 'NOT_FOUND' ? (
            <>
              <Button label="Check again" icon="refresh" variant="secondary" onPress={check} loading={checking} />
              <Button label="Review and submit again" variant="ghost" onPress={editApplication} />
            </>
          ) : view === 'SUSPENDED' ? null : (
            <Button label="Check status" icon="refresh" variant="secondary" onPress={check} loading={checking} />
          )}
        </View>
        {checkedAt && !offline ? <Text style={st.checked}>Last checked at {checkedAt}</Text> : null}
      </Section>

      {waiting ? (
        <Section title="While you wait">
          <Tip icon="document-text-outline" text="Keep your GST certificate (if you have one), PAN and ID proof nearby in case our team asks for a clearer copy." />
          <Tip icon="pricetags-outline" text="Make a list of the products you want to sell. You can add them once your store is approved." />
        </Section>
      ) : null}

      <SupportCard emphasise={view === 'SUSPENDED'} />
    </SellerFrame>
  );
}

function Timeline({ view }: { view: View_ }) {
  const decided = view === 'REJECTED' || view === 'INFO_REQUIRED';
  const steps: { label: string; state: 'done' | 'current' | 'todo' | 'flag' }[] = [
    { label: 'Submitted', state: 'done' },
    { label: 'Under review', state: view === 'SUBMITTED' ? 'todo' : view === 'UNDER_REVIEW' ? 'current' : 'done' },
    {
      label: view === 'INFO_REQUIRED' ? 'More information needed' : view === 'REJECTED' ? 'Not approved' : 'Decision',
      state: decided ? 'flag' : 'todo',
    },
  ];
  return (
    <View style={st.timeline} accessibilityLabel={`Progress: ${steps.map(s => `${s.label} ${s.state === 'done' ? 'done' : s.state === 'current' ? 'in progress' : s.state === 'flag' ? 'needs action' : 'not started'}`).join(', ')}`}>
      {steps.map((step, i) => {
        const color =
          step.state === 'done' ? C.primary : step.state === 'current' ? C.primary : step.state === 'flag' ? C.warningText : C.inputBorder;
        const icon: IconName =
          step.state === 'done' ? 'checkmark-circle' : step.state === 'current' ? 'ellipse' : step.state === 'flag' ? 'alert-circle' : 'ellipse-outline';
        return (
          <View key={step.label} style={st.tlRow}>
            <View style={st.tlRail}>
              <Ionicons name={icon} size={20} color={color} />
              {i < steps.length - 1 ? <View style={[st.tlLine, step.state === 'done' && { backgroundColor: C.primary }]} /> : null}
            </View>
            <Text style={[st.tlLabel, step.state === 'todo' && { color: C.textMuted }]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Tip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={st.tip}>
      <Ionicons name={icon} size={20} color={C.primary} style={st.tipIcon} />
      <Text style={st.tipText}>{text}</Text>
    </View>
  );
}

function SupportCard({ emphasise }: { emphasise?: boolean }) {
  const { email, phone } = SELLER_SUPPORT;
  return (
    <Section title="Need help?" description="GlowVai seller support can answer questions about your application.">
      {hasSellerSupport() ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
          {phone ? (
            <Button
              label="Call support"
              icon="call-outline"
              variant={emphasise ? 'primary' : 'secondary'}
              compact
              onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {})}
            />
          ) : null}
          {email ? (
            <Button
              label="Email support"
              icon="mail-outline"
              variant={emphasise && !phone ? 'primary' : 'secondary'}
              compact
              onPress={() => Linking.openURL(`mailto:${email}`).catch(() => {})}
            />
          ) : null}
        </View>
      ) : (
        <Text style={st.tipText}>Seller support contact details aren’t set up in this version of the app yet.</Text>
      )}
    </Section>
  );
}

const st = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: S.md },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm },
  reason: { marginTop: S.lg, padding: S.md + 2, borderRadius: 12, gap: 4 },
  reasonLabel: { fontFamily: FontFamily.semibold, fontSize: 13 },
  reasonText: { fontSize: 15, lineHeight: 22 },
  itemRow: { flexDirection: 'row', gap: S.sm },
  timeline: { marginTop: S.lg },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  tlRail: { width: 20, alignItems: 'center', marginRight: S.md },
  tlLine: { width: 2, flex: 1, minHeight: 14, backgroundColor: C.border, marginVertical: 2 },
  tlLabel: { fontFamily: FontFamily.medium, fontSize: 15, lineHeight: 20, color: C.textPrimary },
  summary: { marginTop: S.lg, paddingTop: S.md, borderTopWidth: 1, borderTopColor: C.border },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.lg },
  checked: { fontSize: 13, color: C.textMuted, marginTop: S.sm },
  tip: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md },
  tipIcon: { marginRight: S.md, marginTop: 1 },
  tipText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textSecondary },
});
