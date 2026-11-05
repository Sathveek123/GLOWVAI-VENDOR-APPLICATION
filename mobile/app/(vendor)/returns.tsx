/**
 * Returns and issue requests (PRD screen 18).
 * The vendor sees return requests for their orders, inspects the returned unit and records
 * what they find. Quarantine (not for sale) is the default outcome; return to stock can only
 * be requested when every check passes. GlowVai decides every refund, so there are no refund
 * buttons here, and closed requests only show GlowVai's decision.
 * Uses the shared app header; the desktop layout comes from the app shell.
 * File: mobile/app/(vendor)/returns.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { Banner, Button, Segmented, TextField, useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import {
  DEFAULT_INSPECTION,
  canRequestRestock,
  isOverdue,
  loadVendorReturns,
  type Disposition,
  type Inspection,
  type ReturnClaim,
  type ReturnStage,
} from '../../src/features/catalog/returns';
import { formatRupees } from '../../src/features/catalog/stock';
import { Chip, ChipRow, EmptyState, Pill, ProductThumb, Sheet, SkeletonRows, cardStyle } from '../../src/features/catalog/ui';

const STAGES: { key: ReturnStage; label: string }[] = [
  { key: 'needs_inspection', label: 'Needs inspection' },
  { key: 'with_glowvai', label: 'With GlowVai' },
  { key: 'closed', label: 'Closed' },
];

const DISPOSITIONS: { key: Disposition; title: string; body: string }[] = [
  { key: 'quarantine', title: 'Keep aside (quarantine)', body: 'Not for sale. Stored separately until GlowVai decides.' },
  { key: 'request_restock', title: 'Ask to return to stock', body: 'Only when the seal is intact, it is genuine, in date and complete.' },
  { key: 'write_off', title: 'Write off', body: 'Damaged, leaking, expired or not genuine. Never sold again.' },
];

export default function ReturnsScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Returns');

  const [state, setState] = useState<'loading' | 'not_connected' | 'ready'>('loading');
  const [claims, setClaims] = useState<ReturnClaim[]>([]);
  const [stage, setStage] = useState<ReturnStage>('needs_inspection');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadVendorReturns().then(res => {
      if (!alive) return;
      if (res.connected) {
        setClaims(res.claims);
        setState('ready');
      } else {
        setState('not_connected');
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<ReturnStage, number> = { needs_inspection: 0, with_glowvai: 0, closed: 0 };
    for (const r of claims) c[r.stage] += 1;
    return c;
  }, [claims]);
  const overdue = claims.filter(r => isOverdue(r)).length;
  const visible = claims.filter(r => r.stage === stage);
  const open = claims.find(r => r.claimId === openId) || null;
  const pad = isPhone ? S.lg : S.xl;

  return (
    <View style={s.screen}>
      <ScreenShell header={{ title: 'Returns', showBack: true }} backgroundColor={Colors.surface} testID="returns-screen">
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {state === 'loading' ? (
            <SkeletonRows count={2} />
          ) : state === 'not_connected' ? (
            <EmptyState
              icon="return-up-back-outline"
              title="Returns are not connected yet"
              message="When a customer reports a problem with one of your orders, the request will appear here for you to inspect. GlowVai decides every refund. Until this is connected, GlowVai support will contact you about any return."
              secondary={{ label: 'Contact GlowVai support', onPress: () => router.push('/(vendor)/support') }}
            />
          ) : (
            <>
              {overdue > 0 ? (
                <Banner
                  tone="error"
                  title={`${overdue} ${overdue === 1 ? 'inspection is' : 'inspections are'} overdue`}
                  message="Inspect the returned units and send your findings to GlowVai today."
                  style={{ marginBottom: 0 }}
                />
              ) : null}
              <ChipRow>
                {STAGES.map(t => (
                  <Chip key={t.key} label={t.label} count={counts[t.key]} active={stage === t.key} onPress={() => setStage(t.key)} />
                ))}
              </ChipRow>
              {visible.length === 0 ? (
                <EmptyState
                  icon="checkmark-done-outline"
                  title={stage === 'needs_inspection' ? 'Nothing to inspect' : stage === 'with_glowvai' ? 'Nothing waiting on GlowVai' : 'No closed returns'}
                  message={stage === 'needs_inspection' ? 'New return requests for your orders will appear here.' : 'Requests move here as they progress.'}
                />
              ) : (
                <View style={[cardStyle, { overflow: 'hidden' }]}>
                  {visible.map((r, i) => (
                    <ClaimRow key={r.claimId} claim={r} first={i === 0} onPress={() => setOpenId(r.claimId)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScreenShell>

      <ClaimSheet claim={open} onClose={() => setOpenId(null)} />
    </View>
  );
}

function ClaimRow({ claim, first, onPress }: { claim: ReturnClaim; first: boolean; onPress: () => void }) {
  const late = isOverdue(claim);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${claim.orderRef}, ${claim.productName}, ${claim.reason}${late ? ', overdue' : ''}`}
      style={({ pressed }) => [s.row, !first && s.rowDivider, pressed && { backgroundColor: Colors.surface }]}
    >
      <ProductThumb uri={claim.photo} brand={claim.brand} label={claim.productName} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={s.code}>{claim.orderRef}</Text>
        <Text style={s.name} numberOfLines={2}>{claim.productName}</Text>
        <View style={s.pills}>
          <Pill label={claim.reason} tone="neutral" />
          {late ? <Pill label="Overdue" tone="danger" icon="alert-circle" /> : null}
        </View>
      </View>
      {typeof claim.amount === 'number' ? <Text style={s.amount}>{formatRupees(claim.amount)}</Text> : null}
    </Pressable>
  );
}

function ClaimSheet({ claim, onClose }: { claim: ReturnClaim | null; onClose: () => void }) {
  const [form, setForm] = useState<Inspection>(DEFAULT_INSPECTION);
  useEffect(() => {
    setForm(claim?.inspection || DEFAULT_INSPECTION);
  }, [claim?.claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!claim) return <Sheet visible={false} title="" onClose={onClose}>{null}</Sheet>;

  const editable = claim.stage === 'needs_inspection';
  const restockOk = canRequestRestock(claim, form);
  const set = <K extends keyof Inspection>(k: K, v: Inspection[K]) =>
    setForm(prev => {
      const next = { ...prev, [k]: v };
      // A failed check moves a "return to stock" request back to quarantine.
      if (next.disposition === 'request_restock' && !canRequestRestock(claim, next)) next.disposition = 'quarantine';
      return next;
    });

  return (
    <Sheet
      visible
      title={`Return for ${claim.orderRef}`}
      onClose={onClose}
      footer={
        editable ? (
          <View style={{ gap: S.xs }}>
            <Button label="Send to GlowVai" onPress={() => undefined} disabled accessibilityLabel="Send to GlowVai, not available yet" />
            <Text style={s.hint}>Not available yet: findings cannot be sent from the app.</Text>
          </View>
        ) : null
      }
    >
      <View style={s.claimHead}>
        <ProductThumb uri={claim.photo} brand={claim.brand} label={claim.productName} size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={s.name}>{claim.productName}</Text>
          <Pill label={claim.reason} tone="neutral" />
        </View>
      </View>

      {claim.customerNote ? (
        <View style={s.block}>
          <Text style={s.label}>What the customer said</Text>
          <Text style={s.body2}>{claim.customerNote}</Text>
        </View>
      ) : null}

      {claim.evidencePhotos.length ? (
        <View style={s.photos}>
          {claim.evidencePhotos.map((uri, i) => (
            <Image key={uri} source={{ uri }} style={s.photo} accessibilityLabel={`Customer photo ${i + 1}`} />
          ))}
        </View>
      ) : null}

      {claim.stage === 'closed' || claim.stage === 'with_glowvai' ? (
        <Banner
          tone="info"
          title={claim.stage === 'closed' ? 'GlowVai decision' : 'With GlowVai'}
          message={claim.decision || 'GlowVai is reviewing your findings. You will be told the outcome here.'}
        />
      ) : null}

      {editable ? (
        <>
          <Text style={[s.label, { marginTop: S.md }]}>Your inspection</Text>
          <Check label="Seal">
            <Segmented label="Seal" options={['Intact', 'Broken', 'Unsure'] as const} value={form.seal} onChange={v => set('seal', v)} />
          </Check>
          <Check label="Genuine product">
            <Segmented label="Genuine product" options={['Yes', 'No', 'Unsure'] as const} value={form.authentic} onChange={v => set('authentic', v)} />
          </Check>
          <Check label="Expiry">
            <Segmented label="Expiry" options={['Valid', 'Expired'] as const} value={form.expiry} onChange={v => set('expiry', v)} />
          </Check>
          <Check label="Packaging">
            <Segmented label="Packaging" options={['Complete', 'Missing'] as const} value={form.packaging} onChange={v => set('packaging', v)} />
          </Check>

          <Text style={[s.label, { marginTop: S.md }]}>Where does this unit go?</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Where does this unit go" style={{ gap: S.xs }}>
            {DISPOSITIONS.map(d => {
              const disabled = d.key === 'request_restock' && !restockOk;
              const on = form.disposition === d.key;
              return (
                <Pressable
                  key={d.key}
                  disabled={disabled}
                  onPress={() => set('disposition', d.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled }}
                  style={[s.option, on && s.optionOn, disabled && { opacity: 0.5 }]}
                >
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? Colors.primary : Colors.inputBorder} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.optionTitle}>{d.title}</Text>
                    <Text style={s.hint}>{d.body}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: S.md }}>
            <TextField label="Note for GlowVai" optional value={form.note} onChangeText={t => set('note', t)} multiline maxLength={500} last />
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

function Check({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.check}>
      <Text style={s.checkLabel}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingTop: S.lg, paddingBottom: S.xxl * 2, gap: S.md },

  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 72 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  code: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textSecondary },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  amount: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },

  claimHead: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md },
  block: { marginBottom: S.md },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, marginBottom: 6 },
  body2: { ...TypeScale.body, color: Colors.textSecondary },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.md },
  photo: { width: 88, height: 88, borderRadius: 10, backgroundColor: Colors.surface },

  check: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: S.sm, paddingVertical: 6 },
  checkLabel: { ...TypeScale.body, color: Colors.textPrimary },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
    minHeight: 44,
    padding: S.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionTitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary },
  hint: { ...TypeScale.caption, color: Colors.textSecondary },
});
