/**
 * Onboarding step 4 of 4: what the store sells, a review of every step, and submit.
 * Submits to POST /api/onboarding/submit with the phone-verified session.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingApi, ApiError } from '../../src/services/api';
import { saveSession } from '../../src/services/session';
import { resetSocket } from '../../src/services/socket';
import {
  SellerFrame,
  Section,
  Banner,
  Button,
  Checkbox,
  SummaryRow,
  StepFooter,
  CenteredLoader,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, isNetworkError, useRequireSession } from '../../src/features/onboarding/guard';
import { cacheStatus } from '../../src/features/onboarding/status';
import { format24hForDisplay, to24h, from24h } from '../../src/features/onboarding/validation';
import {
  businessTypeLabel,
  businessTypeNeedsGst,
  DRAFT_KEYS,
  loadDraft,
  saveDraft,
  setResumeStep,
  formatSavedTime,
  type BankDraft,
  type CatalogDraft,
  type StoreDraft,
  type TaxDraft,
} from '../../src/features/onboarding/draft';
import { FontFamily } from '../../src/theme/typography';

// The GlowVai shop's categories. Keep in sync with the shop's category list.
const CATEGORIES: { id: string; name: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'serums', name: 'Serums', desc: 'Vitamin C, niacinamide, hyaluronic acid and more', icon: 'water-outline' },
  { id: 'moisturizers', name: 'Moisturizers', desc: 'Creams, gels and lotions for face', icon: 'flask-outline' },
  { id: 'suncare', name: 'Suncare', desc: 'Sunscreens and after-sun care', icon: 'sunny-outline' },
  { id: 'cleansers', name: 'Cleansers', desc: 'Face washes, cleansing oils and micellar water', icon: 'sparkles-outline' },
  { id: 'treatments', name: 'Treatments', desc: 'Acne, pigmentation and targeted care', icon: 'medkit-outline' },
];

type Drafts = { a: Partial<StoreDraft> | null; b: Partial<TaxDraft> | null; c: Partial<BankDraft> | null };

export default function StepD() {
  const router = useRouter();
  const { isPhone } = useLayout();
  const { ready } = useRequireSession();
  useDocumentTitle('Categories and review');

  const [cats, setCats] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<Drafts>({ a: null, b: null, c: null });
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; signIn?: boolean } | null>(null);

  // Reload on focus so edits made from "Edit" links show up here.
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
        setDrafts({ a, b, c });
        if (!loaded && d?.selectedCats) setCats(d.selectedCats.filter(id => CATEGORIES.some(cat => cat.id === id)));
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [loaded]),
  );

  const toggle = (id: string) => {
    setCats(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));
    setSaveState('idle');
  };

  const a = drafts.a;
  const b = drafts.b;
  const c = drafts.c;
  const gstRequired = businessTypeNeedsGst(a?.businessType);
  const needsGstCert = gstRequired || !!b?.gstin;
  const incomplete: { step: string; label: string }[] = [];
  if (
    !a?.storeName ||
    !a?.ownerName ||
    !a?.businessType ||
    !a?.address ||
    !a?.city ||
    !a?.pincode ||
    !from24h(a?.openTime)[0] ||
    !from24h(a?.closeTime)[0]
  ) {
    incomplete.push({ step: 'step-a', label: 'Store details' });
  }
  if (!b?.pan || (gstRequired && !b?.gstin) || (needsGstCert && !b?.gstCert) || !b?.storePhoto || !b?.ownerId) {
    incomplete.push({ step: 'step-b', label: 'Tax and documents' });
  }
  if (!c?.ifsc || !c?.maskedAccountNumber || !c?.beneficiaryName) incomplete.push({ step: 'step-c', label: 'Bank account' });

  const missing = [
    ...(cats.length ? [] : ['at least one category']),
    ...incomplete.map(i => i.label.toLowerCase()),
    ...(confirmed ? [] : ['the confirmation tick']),
  ];
  const valid = missing.length === 0;
  const hint = valid ? '' : `To submit, add: ${missing.join(', ')}`;

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.d, { selectedCats: cats, confirmed: false });
      await setResumeStep('step-d');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch (_) {
      setSaveState('error');
    }
  };

  const submit = async () => {
    if (!valid || submitting || !a || !b || !c) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await saveDraft(DRAFT_KEYS.d, { selectedCats: cats, confirmed: false });
      const docs = [b.gstCert, b.storePhoto, b.ownerId].filter(Boolean);
      // Older drafts kept "09:00 AM"; the shop stores 24-hour "HH:MM".
      const hours = (t?: string) => {
        const [hm, mer] = from24h(t);
        return hm ? to24h(hm, mer) : '';
      };
      const result: any = await onboardingApi.submit({
        ownerName: a.ownerName,
        shopName: a.storeName,
        businessType: a.businessType,
        email: a.email,
        address: a.address,
        locality: a.locality,
        city: a.city,
        pincode: a.pincode,
        openTime: hours(a.openTime),
        closeTime: hours(a.closeTime),
        latitude: a.latitude,
        longitude: a.longitude,
        gstin: b.gstin || null,
        pan: b.pan,
        tradeLicense: b.tradeLicense,
        beneficiaryName: c.beneficiaryName,
        bankName: c.bankName,
        maskedAccountNumber: c.maskedAccountNumber,
        ifsc: c.ifsc,
        upiVpa: c.upiVpa,
        categories: cats,
        // Names only: there is no document upload endpoint yet, so the files stay on this device.
        documentsAttached: docs.map(d => ({ name: d!.name, type: d!.mimeType, size: d!.size })),
      });
      if (result?.token) {
        await saveSession({
          token: result.token,
          vendorId: result.vendorId,
          storeId: result.storeId,
          kycStatus: result.kycStatus || 'PENDING',
        });
        resetSocket();
      }
      await AsyncStorage.setItem('vendor_submitted_at', new Date().toISOString());
      await cacheStatus('SUBMITTED');
      router.replace('/(onboarding)/pending');
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        setSubmitError({ message: 'Your sign-in has expired. Verify your number again; your details stay saved on this device.', signIn: true });
      } else if (e instanceof ApiError && e.code === 'ALREADY_APPROVED') {
        router.replace('/(onboarding)/approved');
      } else if (isNetworkError(e)) {
        setSubmitError({ message: 'Can’t reach GlowVai. Check your internet connection and try again. Your details are still here.' });
      } else if (e instanceof ApiError && e.status === 400) {
        setSubmitError({ message: 'Some details are missing or not accepted. Check each step, then submit again. Your details are still here.' });
      } else {
        setSubmitError({ message: 'We couldn’t submit your application right now. Try again in a moment. Your details are still here.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-c');
  const edit = (step: string) => router.navigate(`/(onboarding)/${step}` as any);

  if (!ready || !loaded) return <CenteredLoader label="Loading your details" />;

  const docsCount = [b?.gstCert, b?.storePhoto, b?.ownerId].filter(Boolean).length;
  const editBtn = (step: string, label: string) => (
    <Button label="Edit" variant="ghost" compact onPress={() => edit(step)} accessibilityLabel={`Edit ${label}`} />
  );

  return (
    <SellerFrame
      step={4}
      title="Categories and review"
      description="Choose what you sell, check your details, then submit your store for review."
      onBack={onBack}
      footer={
        <StepFooter
          hint={hint}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          saveState={saveState}
          savedAt={savedAt}
          primaryLabel="Submit for review"
          onPrimary={submit}
          primaryLoading={submitting}
          primaryTestID="step-submit"
        />
      }
      testID="step-d"
    >
      {submitError ? (
        <Banner tone="error" message={submitError.message}>
          {submitError.signIn ? (
            <View style={{ flexDirection: 'row', marginTop: S.sm }}>
              <Button label="Verify number" variant="secondary" compact onPress={() => router.replace('/(auth)/login')} />
            </View>
          ) : null}
        </Banner>
      ) : null}

      <Section title="What do you sell?" description="Pick all that apply.">
        <View style={[st.grid, !isPhone && { flexDirection: 'row', flexWrap: 'wrap' }]} accessibilityRole="list">
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
                <View style={[st.catIcon, on && { backgroundColor: C.background }]}>
                  <Ionicons name={cat.icon} size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.catName}>{cat.name}</Text>
                  <Text style={st.catDesc}>{cat.desc}</Text>
                </View>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? C.primary : C.inputBorder} />
              </Pressable>
            );
          })}
        </View>
        <Text style={st.note}>You add your products after your store is approved.</Text>
      </Section>

      {incomplete.length ? (
        <Banner tone="warning" title="Some steps are incomplete">
          {incomplete.map(i => (
            <View key={i.step} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: C.warningText }}>{i.label}</Text>
              <Button label="Complete" variant="ghost" compact onPress={() => edit(i.step)} accessibilityLabel={`Complete ${i.label}`} />
            </View>
          ))}
        </Banner>
      ) : null}

      <Section title="Store details" right={editBtn('step-a', 'store details')}>
        <SummaryRow label="Store name" value={a?.storeName} />
        <SummaryRow label="Owner" value={a?.ownerName} />
        <SummaryRow label="Business type" value={businessTypeLabel(a?.businessType)} />
        <SummaryRow label="Address" value={[a?.address, a?.locality, a?.city, a?.pincode].filter(Boolean).join(', ')} />
        <SummaryRow
          label="Hours"
          value={a?.openTime && a?.closeTime ? `${format24hForDisplay(a.openTime)} to ${format24hForDisplay(a.closeTime)}` : ''}
        />
        {a?.email ? <SummaryRow label="Email" value={a.email} /> : null}
      </Section>

      <Section title="Tax and documents" right={editBtn('step-b', 'tax and documents')}>
        <SummaryRow label="GSTIN" value={b?.gstin || (gstRequired ? '' : 'Not GST-registered')} />
        <SummaryRow label="PAN" value={b?.pan} />
        {b?.tradeLicense ? <SummaryRow label="Shop licence" value={b.tradeLicense} /> : null}
        <SummaryRow label="Documents" value={`${docsCount} of ${needsGstCert ? 3 : 2} chosen (upload not available yet)`} />
      </Section>

      <Section title="Bank account" right={editBtn('step-c', 'bank account')}>
        <SummaryRow label="Account holder" value={c?.beneficiaryName} />
        <SummaryRow label="Account number" value={c?.maskedAccountNumber ? `Ending in ${c.maskedAccountNumber.slice(-4)}` : ''} />
        <SummaryRow label="IFSC" value={c?.ifsc ? [c.ifsc, c.bankName].filter(Boolean).join(' · ') : ''} />
        {c?.upiVpa ? <SummaryRow label="UPI ID" value={c.upiVpa} /> : null}
      </Section>

      <Section>
        <Checkbox
          checked={confirmed}
          onChange={setConfirmed}
          label="I confirm these details are correct and that I am authorised to register this business."
        />
      </Section>
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  grid: { gap: S.sm + 2 },
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
  catHalf: { flexBasis: '45%' as any, flexGrow: 1 },
  catOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  catIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  catDesc: { fontSize: 13, lineHeight: 18, color: C.textSecondary },
  note: { fontSize: 13, lineHeight: 19, color: C.textSecondary, marginTop: S.md },
});
