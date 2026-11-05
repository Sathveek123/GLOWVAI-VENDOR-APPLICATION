/**
 * Help & support (PRD screen 20): report an issue (with an order reference and photos) and
 * follow your support cases. GlowVai support is reached through a ticket, never through
 * customer chat.
 *
 * The backend has no support-case endpoint yet. The screen says so before anything can be
 * typed, shows the report form read-only, and offers the configured support contact instead.
 * Open with ?orderId=GV-123 to prefill the order reference (order detail links here).
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { formatDateIST, friendlyError } from '../../src/features/money/format';
import { Button, Card, ErrorCard, LinkRow, LoadingCard, Note, Pill, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import { CASE_STATUS, ISSUE_TYPES, SUPPORT_CASES_CONNECTED, fetchCases, type SupportCase } from '../../src/features/support/cases';
import { SupportContactActions } from '../../src/features/support/contact';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type IssueKey = (typeof ISSUE_TYPES)[number]['key'];
type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'not-connected' } | { state: 'ready'; items: SupportCase[] };

export default function SupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const initialOrder = typeof params.orderId === 'string' ? params.orderId : '';

  const [issue, setIssue] = useState<IssueKey>('order');
  const [orderRef, setOrderRef] = useState(initialOrder);
  const [details, setDetails] = useState('');
  const [cases, setCases] = useState<Load>({ state: 'loading' });

  const loadCases = useCallback(async () => {
    setCases({ state: 'loading' });
    try {
      const res = await fetchCases();
      setCases(res.connected ? { state: 'ready', items: res.items } : { state: 'not-connected' });
    } catch (err) {
      setCases({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const editable = SUPPORT_CASES_CONNECTED;
  const subject = orderRef ? `Issue with order ${orderRef}` : 'Store support request';

  return (
    <ScreenShell header={{ title: 'Help & support', showBack: true }} backgroundColor={Colors.surface} keyboardAvoiding={editable}>
      <View style={page.body}>
        <SectionLabel>Report an issue</SectionLabel>
        <Card style={{ gap: Spacing.lg }}>
          {!editable ? (
            <View style={s.notice} accessibilityRole="alert">
              <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <Text style={s.noticeTitle}>Sending reports from the app is not available yet</Text>
                <Text style={s.noticeBody}>
                  Nothing typed here can be sent, so the form is locked. Contact GlowVai support directly and mention your order reference.
                </Text>
              </View>
            </View>
          ) : null}
          {!editable ? <SupportContactActions subject={subject} /> : null}

          <View style={{ gap: Spacing.sm }}>
            <Text style={s.fieldLabel}>What is it about?</Text>
            <View style={s.chips} accessibilityRole="radiogroup" accessibilityLabel="Issue type">
              {ISSUE_TYPES.map((t) => {
                const on = t.key === issue;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setIssue(t.key)}
                    disabled={!editable}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: !editable }}
                    style={[s.chip, on && s.chipOn, !editable && s.locked]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field label="Order reference (optional)" value={orderRef} onChange={setOrderRef} editable={editable} placeholder="For example GV-10234" mono />
          <Field label="What happened?" value={details} onChange={setDetails} editable={editable} placeholder="Describe the problem in a few lines" multiline />

          <View style={{ gap: Spacing.sm }}>
            <Text style={s.fieldLabel}>Photos (optional)</Text>
            <Pressable
              disabled={!editable}
              accessibilityRole="button"
              accessibilityState={{ disabled: !editable }}
              accessibilityLabel="Add photos"
              style={[s.photoBox, !editable && s.locked]}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.textSecondary} />
              <Text style={kit.body}>Add photos of the damaged item, packaging or label</Text>
            </Pressable>
          </View>

          <Button label="Send report" onPress={() => undefined} disabled={!editable} accessibilityHint={editable ? undefined : 'Not available yet'} />
          <Note icon="shield-checkmark-outline">Never share OTPs, pickup PINs, passwords or customer phone numbers in a report.</Note>
        </Card>

        <SectionLabel>Your cases</SectionLabel>
        {cases.state === 'loading' ? <LoadingCard label="Loading your cases" /> : null}
        {cases.state === 'error' ? <ErrorCard title="Could not load your cases" message={cases.message} onRetry={loadCases} /> : null}
        {cases.state === 'not-connected' ? (
          <StateCard
            icon="chatbox-ellipses-outline"
            title="Cases are not shown in the app yet"
            body="Once reporting is connected, each issue you raise will be listed here with its status and GlowVai's replies."
          />
        ) : null}
        {cases.state === 'ready' && cases.items.length === 0 ? (
          <StateCard
            icon="chatbox-ellipses-outline"
            title="No cases yet"
            body="If something goes wrong with an order or a payout, report it above and GlowVai support will reply here."
          />
        ) : null}
        {cases.state === 'ready' && cases.items.length > 0 ? (
          <Card padded={false}>
            {cases.items.map((c, i) => {
              const meta = CASE_STATUS[c.status];
              const line = [c.orderId ? `Order ${c.orderId}` : null, c.updatedMs ? `Updated ${formatDateIST(c.updatedMs, { weekday: false })}` : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <View key={c.id} style={[s.caseRow, i < cases.items.length - 1 && s.divider]}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={s.caseSubject}>{c.subject}</Text>
                    <Text style={s.caseId}>{c.id}</Text>
                    {line ? <Text style={kit.muted}>{line}</Text> : null}
                  </View>
                  <Pill label={meta.label} tone={meta.tone} />
                </View>
              );
            })}
          </Card>
        ) : null}

        <SectionLabel>Quick answers</SectionLabel>
        <Card padded={false}>
          <LinkRow label="Payouts and settlements" icon="swap-horizontal-outline" onPress={() => router.push('/(vendor)/payout-detail')} />
          <LinkRow label="Bank account" icon="card-outline" onPress={() => router.push('/(vendor)/bank-edit')} />
          <LinkRow label="Store profile and verification" icon="storefront-outline" onPress={() => router.push('/(vendor)/profile')} last />
        </Card>
      </View>
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  placeholder,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  editable: boolean;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSubtle}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        autoCorrect={!mono}
        autoCapitalize={mono ? 'characters' : 'sentences'}
        multiline={multiline}
        style={[s.input, multiline && s.inputMulti, mono && s.mono, !editable && s.inputLocked]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 10,
    padding: Spacing.md,
  },
  noticeTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  noticeBody: { ...TypeScale.body, color: Colors.textPrimary },
  fieldLabel: { ...TypeScale.caption, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...TypeScale.body, color: Colors.textSecondary },
  chipTextOn: { color: Colors.primary, fontFamily: FontFamily.semibold },
  locked: { opacity: 0.6 },
  input: {
    ...TypeScale.body,
    color: Colors.textPrimary,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
  inputLocked: { backgroundColor: Colors.surface, borderColor: Colors.border },
  mono: { fontFamily: FontFamily.mono, fontSize: 13 },
  photoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    padding: Spacing.md,
  },
  caseRow: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, alignItems: 'flex-start' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  caseSubject: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  caseId: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textMuted },
});
