/**
 * Application status (screen 08). Reads the store state from GET /api/vendor/me and shows
 * Submitted, Under review, More information needed (with the requested documents), Not approved
 * (with the reason) or Suspended, each with the next action. Approved stores go to the vendor
 * home; a vendor with no application goes to the form.
 *
 * "Edit and resubmit" is offered while the server accepts a resubmission (SUBMITTED,
 * DOCUMENTS_REQUESTED, REJECTED), never while UNDER_REVIEW.
 * While waiting, the status refreshes every 60 seconds when the app is open.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Linking, AppState } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  Banner,
  Button,
  SummaryRow,
  CenteredLoader,
  GateFallback,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { getResumeStep, seedDraftsFromApplication, setResumeStep } from '../../src/features/onboarding/draft';
import { HOME_ROUTE, LOGIN_ROUTE, VERIFY_ROUTE, isApproved } from '../../src/features/onboarding/status';
import { SELLER_SUPPORT, hasSellerSupport } from '../../src/features/onboarding/support';
import { useVendorMe, type VendorState } from '../../src/services/vendorApi/account';
import { authReady, signOutVendor } from '../../src/services/session';
import { FontFamily } from '../../src/theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'info' | 'warning' | 'danger';
type ShownState = Exclude<VendorState, 'NO_APPLICATION' | 'APPROVED_ACTIVE' | 'APPROVED_PAUSED'>;

const REFRESH_MS = 60_000;

const COPY: Record<ShownState, { chip: string; tone: Tone; icon: IconName; title: string; body: string }> = {
  SUBMITTED: {
    chip: 'Submitted',
    tone: 'info',
    icon: 'paper-plane-outline',
    title: 'Application submitted',
    body: 'We have your application. Our team will review your store and contact you to verify your documents. Until the review starts, you can still edit your details.',
  },
  UNDER_REVIEW: {
    chip: 'Under review',
    tone: 'info',
    icon: 'time-outline',
    title: 'Your store is under review',
    body: 'Our team is checking your store, tax and bank details. Your application can’t be changed during the review. This page updates on its own.',
  },
  DOCUMENTS_REQUESTED: {
    chip: 'More information needed',
    tone: 'warning',
    icon: 'document-text-outline',
    title: 'We need a few more details',
    body: 'Our team needs more before they can approve your store. Documents can’t be uploaded in the app yet: our team will contact you to collect them. If any details in your application need fixing, edit and resubmit it.',
  },
  REJECTED: {
    chip: 'Not approved',
    tone: 'danger',
    icon: 'close-circle-outline',
    title: 'Your application wasn’t approved',
    body: 'Our team couldn’t approve your store with the details you sent. Read the reason below, fix your details and submit again.',
  },
  SUSPENDED: {
    chip: 'Suspended',
    tone: 'danger',
    icon: 'pause-circle-outline',
    title: 'Your store is suspended',
    body: 'Your store can’t take orders or change its stock right now. Contact GlowVai seller support to find out what is needed to restore it.',
  },
};

const TONE_COLORS: Record<Tone, { bg: string; fg: string; border: string }> = {
  info: { bg: C.primaryLight, fg: C.infoText, border: C.primaryBorder },
  warning: { bg: C.warningLight, fg: C.warningText, border: C.warningBorder },
  danger: { bg: C.dangerLight, fg: C.dangerText, border: C.dangerBorder },
};

const fmtDate = (ms?: number | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function PendingScreen() {
  const router = useRouter();
  useDocumentTitle('Application status');
  const { me, loading, error, refresh } = useVendorMe();
  const [authChecked, setAuthChecked] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');
  const [opening, setOpening] = useState(false);
  const routed = useRef(false);

  // Signed out or unverified accounts don't belong here.
  useEffect(() => {
    let active = true;
    authReady().then(user => {
      if (!active) return;
      if (!user) return router.replace(LOGIN_ROUTE);
      if (!user.emailVerified) return router.replace(VERIFY_ROUTE);
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const state = me?.vendor.state;

  // States that belong somewhere else.
  useEffect(() => {
    if (!authChecked || !state || routed.current) return;
    if (isApproved(state)) {
      routed.current = true;
      router.replace(HOME_ROUTE);
    } else if (state === 'NO_APPLICATION') {
      routed.current = true;
      getResumeStep().then(step => router.replace(`/(onboarding)/${step || 'step-a'}` as never));
    }
  }, [authChecked, state]);

  useEffect(() => {
    if (me && !loading && !error) setCheckedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  }, [me, loading, error]);

  // Waiting for a decision: refresh quietly while the app is in the foreground.
  const waiting = state === 'SUBMITTED' || state === 'UNDER_REVIEW' || state === 'DOCUMENTS_REQUESTED';
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [waiting]);

  const signOut = async () => {
    await signOutVendor();
    router.replace(LOGIN_ROUTE);
  };

  const editAndResubmit = async () => {
    if (!me?.vendor.application) return;
    setOpening(true);
    await seedDraftsFromApplication(me.vendor.application);
    await setResumeStep('step-a');
    router.replace('/(onboarding)/step-a');
  };

  if (!authChecked) return <CenteredLoader label="Checking your application" />;
  if (!me) {
    return (
      <GateFallback
        gate={error ? { status: 'error', message: error, retry: refresh } : { status: 'loading' }}
        loadingLabel="Checking your application"
        onSignOut={signOut}
      />
    );
  }
  if (!state || isApproved(state) || state === 'NO_APPLICATION') return <CenteredLoader label="Opening your store" />;

  const shown = state as ShownState;
  const copy = COPY[shown];
  const tone = TONE_COLORS[copy.tone];
  const reason = (me.vendor.reason || '').trim();
  const docs = me.vendor.requestedDocuments ?? [];
  const app = me.vendor.application;
  const canEdit = shown === 'SUBMITTED' || shown === 'DOCUMENTS_REQUESTED' || shown === 'REJECTED';
  const editIsPrimary = shown === 'DOCUMENTS_REQUESTED' || shown === 'REJECTED';

  return (
    <SellerFrame headerRight={<Button label="Sign out" variant="ghost" compact onPress={signOut} />} testID="pending">
      {error ? (
        <Banner tone="warning" title="Couldn’t check for updates" message={`${error} This is the last status we received.`}>
          <View style={{ flexDirection: 'row', marginTop: S.sm }}>
            <Button label="Try again" variant="secondary" compact onPress={refresh} loading={loading} />
          </View>
        </Banner>
      ) : null}

      <Section>
        <View style={[st.chip, { backgroundColor: tone.bg, borderColor: tone.border }]} testID={`status-${shown}`}>
          <Ionicons name={copy.icon} size={16} color={tone.fg} />
          <Text style={[st.chipText, { color: tone.fg }]}>{copy.chip}</Text>
        </View>
        <Text accessibilityRole="header" style={st.title}>
          {copy.title}
        </Text>
        <Text style={st.body}>{copy.body}</Text>

        {reason || docs.length || shown === 'REJECTED' ? (
          <View style={[st.reason, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            {docs.length ? (
              <>
                <Text style={[st.reasonLabel, { color: tone.fg }]}>Documents our team asked for</Text>
                {docs.map(item => (
                  <View key={item} style={st.itemRow}>
                    <Ionicons name="document-outline" size={16} color={tone.fg} style={{ marginTop: 3 }} />
                    <Text style={[st.reasonText, { color: tone.fg, flex: 1 }]}>{item}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {reason || shown === 'REJECTED' ? (
              <>
                <Text style={[st.reasonLabel, { color: tone.fg }, docs.length ? { marginTop: S.sm } : null]}>
                  {shown === 'REJECTED' ? 'Reason' : 'Note from our team'}
                </Text>
                <Text style={[st.reasonText, { color: tone.fg }]}>
                  {reason || 'Our team didn’t add a reason. Contact seller support to find out more.'}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {shown !== 'SUSPENDED' ? <Timeline state={shown} /> : null}

        {app ? (
          <View style={st.summary}>
            <SummaryRow label="Store" value={app.storeName} />
            <SummaryRow label="Submitted" value={fmtDate(app.submittedAt)} />
            {app.updatedAt && app.updatedAt !== app.submittedAt ? <SummaryRow label="Last changed" value={fmtDate(app.updatedAt)} /> : null}
          </View>
        ) : null}

        <View style={st.actions}>
          {canEdit ? (
            <Button
              label="Edit and resubmit"
              icon="create-outline"
              variant={editIsPrimary ? 'primary' : 'secondary'}
              onPress={editAndResubmit}
              loading={opening}
              testID="status-edit"
            />
          ) : null}
          {shown !== 'SUSPENDED' ? (
            <Button label="Check for updates" icon="refresh" variant="secondary" onPress={refresh} loading={loading} testID="status-refresh" />
          ) : null}
        </View>
        {checkedAt && !error ? <Text style={st.checked}>Last checked at {checkedAt}</Text> : null}
      </Section>

      <SupportCard emphasise={shown === 'SUSPENDED'} />
    </SellerFrame>
  );
}

function Timeline({ state }: { state: ShownState }) {
  const decided = state === 'REJECTED' || state === 'DOCUMENTS_REQUESTED';
  const steps: { label: string; status: 'done' | 'current' | 'todo' | 'flag' }[] = [
    { label: 'Submitted', status: 'done' },
    { label: 'Under review', status: state === 'SUBMITTED' ? 'todo' : state === 'UNDER_REVIEW' ? 'current' : 'done' },
    {
      label: state === 'DOCUMENTS_REQUESTED' ? 'More information needed' : state === 'REJECTED' ? 'Not approved' : 'Decision',
      status: decided ? 'flag' : 'todo',
    },
  ];
  const words = { done: 'done', current: 'in progress', flag: 'needs action', todo: 'not started' };
  return (
    <View style={st.timeline} accessible accessibilityLabel={`Progress: ${steps.map(s => `${s.label} ${words[s.status]}`).join(', ')}`}>
      {steps.map((step, i) => {
        const color = step.status === 'flag' ? C.warningText : step.status === 'todo' ? C.inputBorder : C.primary;
        const icon: IconName =
          step.status === 'done' ? 'checkmark-circle' : step.status === 'current' ? 'ellipse' : step.status === 'flag' ? 'alert-circle' : 'ellipse-outline';
        return (
          <View key={step.label} style={st.tlRow}>
            <View style={st.tlRail}>
              <Ionicons name={icon} size={20} color={color} />
              {i < steps.length - 1 ? <View style={[st.tlLine, step.status === 'done' && { backgroundColor: C.primary }]} /> : null}
            </View>
            <Text style={[st.tlLabel, step.status === 'todo' && { color: C.textMuted }]}>{step.label}</Text>
          </View>
        );
      })}
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
              onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {})}
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
        <Text style={st.supportText}>Seller support contact details aren’t available in this version of the app yet.</Text>
      )}
    </Section>
  );
}

const st = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: S.md,
  },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm },
  reason: { marginTop: S.lg, padding: S.md + 2, borderRadius: 12, borderWidth: 1, gap: 4 },
  reasonLabel: { fontFamily: FontFamily.semibold, fontSize: 13 },
  reasonText: { fontSize: 15, lineHeight: 22 },
  itemRow: { flexDirection: 'row', gap: S.sm },
  timeline: { marginTop: S.lg },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  tlRail: { width: 20, alignItems: 'center', marginRight: S.md },
  tlLine: { width: 2, flex: 1, minHeight: 14, backgroundColor: C.border, marginVertical: 2 },
  tlLabel: { fontFamily: FontFamily.medium, fontSize: 15, lineHeight: 20, color: C.textPrimary },
  summary: { marginTop: S.lg, paddingTop: S.md, borderTopWidth: 1, borderTopColor: C.border },
  actions: { gap: S.sm, marginTop: S.lg },
  checked: { fontSize: 13, color: C.textMuted, marginTop: S.sm },
  supportText: { fontSize: 15, lineHeight: 22, color: C.textSecondary },
});
