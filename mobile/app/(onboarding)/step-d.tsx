/**
 * Onboarding step 4 of 4: what the store sells, a review of every step, and submit.
 * Submits POST /api/vendor/application (accountApi.submitApplication), then opens the
 * application status screen. Drafts are deleted only after the server accepted the application.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  Banner,
  Button,
  Checkbox,
  SummaryRow,
  StepFooter,
  GateFallback,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, useOnboardingGate } from '../../src/features/onboarding/guard';
import {
  CATEGORIES,
  bankErrors,
  categoryErrors,
  hasErrors,
  storeErrors,
  streetLine,
  taxErrors,
  toApplicationInput,
} from '../../src/features/onboarding/application';
import {
  DRAFT_KEYS,
  clearAllDrafts,
  loadDraft,
  saveDraft,
  setResumeStep,
  formatSavedTime,
  type BankDraft,
  type CatalogDraft,
  type StoreDraft,
  type TaxDraft,
} from '../../src/features/onboarding/draft';
import { format24hForDisplay, formatMobile } from '../../src/features/onboarding/validation';
import { LOGIN_ROUTE, STATUS_ROUTE, VERIFY_ROUTE } from '../../src/features/onboarding/status';
import { accountApi, updateVendorMe } from '../../src/services/vendorApi/account';
import { VendorApiError, friendlyError } from '../../src/services/vendorApi/http';
import { FontFamily } from '../../src/theme/typography';

type Drafts = { a: Partial<StoreDraft>; b: Partial<TaxDraft>; c: Partial<BankDraft> };

export default function StepD() {
  const router = useRouter();
  const { isPhone } = useLayout();
  const gate = useOnboardingGate();
  useDocumentTitle('Categories and review');

  const [cats, setCats] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<Drafts>({ a: {}, b: {}, c: {} });
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reload on focus so changes made from the "Edit" links show up here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        loadDraft<StoreDraft>(DRAFT_KEYS.a),
        loadDraft<TaxDraft>(DRAFT_KEYS.b),
        loadDraft<BankDraft>(DRAFT_KEYS.c),
        loadDraft<CatalogDraft>(DRAFT_KEYS.d),
      ]).then(([a, b, c, d]) => {
        if (!active) return;
        setDrafts({ a: a ?? {}, b: b ?? {}, c: c ?? {} });
        setLoaded(prev => {
          if (!prev && d?.categories) setCats(d.categories.filter(id => CATEGORIES.some(cat => cat.id === id)));
          return true;
        });
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const toggle = (id: string) => {
    setCats(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));
    setSaveState('idle');
  };

  const { a, b, c } = drafts;
  const incomplete: { step: string; label: string }[] = [];
  if (hasErrors(storeErrors(a))) incomplete.push({ step: 'step-a', label: 'Store details' });
  if (hasErrors(taxErrors(b))) incomplete.push({ step: 'step-b', label: 'Business and tax' });
  if (hasErrors(bankErrors(c))) incomplete.push({ step: 'step-c', label: 'Bank account' });
  const catError = categoryErrors({ categories: cats }).categories;

  const missing = [
    ...(catError ? ['at least one category'] : []),
    ...incomplete.map(i => i.label.toLowerCase()),
    ...(confirmed ? [] : ['the confirmation tick']),
  ];
  const valid = missing.length === 0;
  const hint = valid ? '' : `To submit, add: ${missing.join(', ')}`;

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.d, { categories: cats });
      await setResumeStep('step-d');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const submit = async () => {
    setShowAll(true);
    if (!valid || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await saveDraft(DRAFT_KEYS.d, { categories: cats });
      const res = await accountApi.submitApplication(toApplicationInput(a, b, c, { categories: cats }));
      updateVendorMe(res.vendor);
      await clearAllDrafts();
      router.replace(STATUS_ROUTE);
    } catch (e) {
      const code = e instanceof VendorApiError ? e.code : 'NETWORK';
      if (code === 'APPLICATION_LOCKED') return router.replace(STATUS_ROUTE);
      if (code === 'EMAIL_NOT_VERIFIED') return router.replace(VERIFY_ROUTE);
      if (code === 'UNAUTHENTICATED') return router.replace(LOGIN_ROUTE);
      setSubmitError(`${friendlyError(e)} Your details are still saved on this device.`);
    } finally {
      setSubmitting(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-c');
  const edit = (step: string) => router.navigate(`/(onboarding)/${step}` as never);

  if (gate.status !== 'ready' || !loaded) {
    return <GateFallback gate={gate.status === 'ready' ? { status: 'loading' } : gate} loadingLabel="Loading your details" />;
  }

  const resubmitting = gate.me.vendor.state !== 'NO_APPLICATION';
  const editBtn = (step: string, label: string) => (
    <Button label="Edit" variant="ghost" compact onPress={() => edit(step)} accessibilityLabel={`Edit ${label}`} />
  );
  const pins = a.servicePincodes ?? [];

  return (
    <SellerFrame
      step={4}
      title="Categories and review"
      description="Choose what you sell, check your details, then send your store for review."
      onBack={onBack}
      footer={
        <StepFooter
          hint={hint}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          saveState={saveState}
          savedAt={savedAt}
          primaryLabel={resubmitting ? 'Resubmit for review' : 'Submit for review'}
          onPrimary={submit}
          primaryLoading={submitting}
          primaryTestID="step-submit"
        />
      }
      testID="step-d"
    >
      {submitError ? <Banner tone="error" title="Your application was not sent" message={submitError} /> : null}

      <Section title="What do you sell?" description="Pick all that apply. You add your products after your store is approved.">
        <View style={[st.grid, !isPhone && st.gridWide]} accessibilityRole="list">
          {CATEGORIES.map(cat => {
            const on = cats.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggle(cat.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${cat.name}: ${cat.desc}`}
                testID={`cat-${cat.id}`}
                style={({ pressed }) => [st.cat, !isPhone && st.catHalf, on && st.catOn, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.catName}>{cat.name}</Text>
                  <Text style={st.catDesc}>{cat.desc}</Text>
                </View>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? C.primary : C.inputBorder} />
              </Pressable>
            );
          })}
        </View>
        {showAll && catError ? <Text style={st.error}>{catError}</Text> : null}
      </Section>

      {incomplete.length ? (
        <Banner tone="warning" title="Some steps need attention">
          {incomplete.map(i => (
            <View key={i.step} style={st.incompleteRow}>
              <Text style={st.incompleteText}>{i.label}</Text>
              <Button label="Fix" variant="ghost" compact onPress={() => edit(i.step)} accessibilityLabel={`Fix ${i.label}`} />
            </View>
          ))}
        </Banner>
      ) : null}

      <Section title="Store details" right={editBtn('step-a', 'store details')}>
        <SummaryRow label="Store name" value={a.storeName} />
        <SummaryRow label="Owner" value={a.ownerName} />
        <SummaryRow label="Contact mobile" value={a.contactNumber ? `+91 ${formatMobile(a.contactNumber)}` : ''} />
        <SummaryRow label="Account email" value={gate.user.email || gate.me.account.email} />
        <SummaryRow label="Address" value={[streetLine(a), a.city, a.state, a.pincode].filter(Boolean).join(', ')} />
        <SummaryRow label="Delivers to" value={pins.length ? `${pins.length} pincode${pins.length === 1 ? '' : 's'}: ${pins.join(', ')}` : ''} />
        <SummaryRow
          label="Hours"
          value={a.openTime && a.closeTime ? `${format24hForDisplay(a.openTime)} to ${format24hForDisplay(a.closeTime)}` : ''}
        />
      </Section>

      <Section title="Business and tax" right={editBtn('step-b', 'business and tax')}>
        <SummaryRow label="PAN" value={b.pan ? `Ending in ${b.pan.slice(-4)}` : ''} />
        <SummaryRow label="GSTIN" value={b.gstin || 'Not GST-registered'} />
        {b.businessRegistrationNumber ? <SummaryRow label="Registration no." value={b.businessRegistrationNumber} /> : null}
        <SummaryRow label="Documents" value="Our team will contact you to verify them" />
      </Section>

      <Section title="Bank account" right={editBtn('step-c', 'bank account')}>
        <SummaryRow label="Account holder" value={c.holderName} />
        <SummaryRow label="Bank" value={[c.bankName, c.ifsc].filter(Boolean).join(' · ')} />
        <SummaryRow label="Account number" value={c.accLast4 ? `Ending in ${c.accLast4}` : ''} />
        {c.upiVpa ? <SummaryRow label="UPI ID" value={c.upiVpa} /> : null}
      </Section>

      <Section>
        <Checkbox
          checked={confirmed}
          onChange={setConfirmed}
          label="I confirm these details are correct and that I am allowed to register this business on GlowVai."
        />
        {showAll && !confirmed ? <Text style={st.error}>Tick the box to confirm your details</Text> : null}
      </Section>
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  grid: { gap: S.sm + 2 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 64,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.background,
  },
  catHalf: { flexBasis: '45%' as never, flexGrow: 1 },
  catOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  catName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  catDesc: { fontSize: 13, lineHeight: 18, color: C.textSecondary },
  error: { fontSize: 13, lineHeight: 19, color: C.errorText, marginTop: S.sm },
  incompleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  incompleteText: { fontSize: 14, color: C.warningText },
});
