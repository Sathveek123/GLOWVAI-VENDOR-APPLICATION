/**
 * Onboarding step 2 of 4: tax details (GSTIN, PAN, optional shop licence) and documents.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  TextField,
  Banner,
  FileField,
  StepFooter,
  CenteredLoader,
  useLayout,
  useDocumentTitle,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, useRequireSession } from '../../src/features/onboarding/guard';
import {
  businessTypeLabel,
  businessTypeNeedsGst,
  DRAFT_KEYS,
  loadDraft,
  saveDraft,
  setResumeStep,
  formatSavedTime,
  type AttachedFile,
  type StoreDraft,
  type TaxDraft,
} from '../../src/features/onboarding/draft';
import { upperAlnum, validateGstin, validatePan, GSTIN_RE, GSTIN_EXAMPLE } from '../../src/features/onboarding/validation';

export default function StepB() {
  const router = useRouter();
  const { canSplit } = useLayout();
  const { ready } = useRequireSession();
  useDocumentTitle('Tax and documents');

  const [businessType, setBusinessType] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [panFromGstin, setPanFromGstin] = useState(false);
  const [tradeLicense, setTradeLicense] = useState('');
  const [gstCert, setGstCert] = useState<AttachedFile | null>(null);
  const [storePhoto, setStorePhoto] = useState<AttachedFile | null>(null);
  const [ownerId, setOwnerId] = useState<AttachedFile | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadDraft<StoreDraft>(DRAFT_KEYS.a).then(a => setBusinessType(a?.businessType || ''));
    loadDraft<TaxDraft>(DRAFT_KEYS.b).then(d => {
      if (!d) return;
      setGstin(d.gstin || '');
      setPan(d.pan || '');
      setTradeLicense(d.tradeLicense || '');
      setGstCert(d.gstCert || null);
      setStorePhoto(d.storePhoto || null);
      setOwnerId(d.ownerId || null);
      setRestored(true);
    });
  }, []);

  const dirty = () => saveState !== 'idle' && setSaveState('idle');
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const onGstin = (v: string) => {
    const g = upperAlnum(v, 15);
    setGstin(g);
    // A GSTIN contains the business PAN (characters 3 to 12); fill it when PAN is empty.
    if (GSTIN_RE.test(g) && (!pan || panFromGstin)) {
      setPan(g.slice(2, 12));
      setPanFromGstin(true);
    }
    dirty();
  };

  // GSTIN is required only for business types that need GST registration; otherwise PAN is enough.
  const gstRequired = businessTypeNeedsGst(businessType);
  const hasGstin = gstRequired || !!gstin;
  const errors: Record<string, string> = {
    gstin: validateGstin(gstin, gstRequired),
    pan: validatePan(pan, gstin),
    gstCert: !hasGstin || gstCert ? '' : 'Choose your GST registration certificate',
    storePhoto: storePhoto ? '' : 'Attach a photo of your shop front',
    ownerId: ownerId ? '' : 'Attach the owner’s ID proof',
  };
  const labels: [string, string][] = [
    ['gstin', 'GSTIN'],
    ['pan', 'PAN'],
    ['gstCert', 'GST certificate'],
    ['storePhoto', 'shop photo'],
    ['ownerId', 'ID proof'],
  ];
  const missing = labels.filter(([k]) => errors[k]).map(([, l]) => l);
  const valid = missing.length === 0;
  const err = (k: string) => (touched[k] || showAll ? errors[k] : '');
  const hint = valid ? '' : `To continue, add: ${missing.join(', ')}`;

  const data = (): TaxDraft => ({ gstin, pan, tradeLicense: tradeLicense.trim(), gstCert: hasGstin ? gstCert : null, storePhoto, ownerId });

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.b, data());
      await setResumeStep('step-b');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch (_) {
      setSaveState('error');
    }
  };

  const onContinue = async () => {
    setShowAll(true);
    if (!valid) return;
    setBusy(true);
    setFormError('');
    try {
      await saveDraft(DRAFT_KEYS.b, data());
      await setResumeStep('step-c');
      router.push('/(onboarding)/step-c');
    } catch (_) {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-a');

  if (!ready) return <CenteredLoader label="Loading your details" />;

  const tax = (
    <Section
      title="Tax details"
      description={
        gstRequired
          ? `As a ${businessTypeLabel(businessType).toLowerCase()}, you need a GST registration. Enter the details exactly as on your GST certificate.`
          : 'GSTIN is optional if your business isn’t GST-registered. PAN is always needed.'
      }
    >
      <TextField
        label="GSTIN"
        optional={!gstRequired}
        placeholder={GSTIN_EXAMPLE}
        value={gstin}
        onChangeText={onGstin}
        onBlur={touch('gstin')}
        error={err('gstin')}
        success={gstin && !errors.gstin ? 'Format looks right' : undefined}
        helper={gstRequired ? '15 characters, as on your GST certificate' : 'Leave empty if you are not GST-registered'}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={15}
        testID="gstin"
      />
      <TextField
        label={hasGstin ? 'Business PAN' : 'PAN (business or owner)'}
        placeholder="AAAAA0000A"
        value={pan}
        onChangeText={v => {
          setPan(upperAlnum(v, 10));
          setPanFromGstin(false);
          dirty();
        }}
        onBlur={touch('pan')}
        error={err('pan')}
        helper={panFromGstin ? 'Filled from your GSTIN' : '10 characters. Filled in from your GSTIN when you enter it.'}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={10}
        testID="pan"
      />
      <TextField
        label="Shop licence number"
        optional
        placeholder="Licence or registration number"
        value={tradeLicense}
        onChangeText={v => {
          setTradeLicense(v.slice(0, 40));
          dirty();
        }}
        helper="Trade licence or Shop & Establishment registration, if you have one"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={40}
        last
      />
    </Section>
  );

  const docs = (
    <Section title="Documents" description="Each file: PDF, JPG or PNG, up to 5 MB.">
      <Banner
        tone="info"
        title="Document upload isn’t available yet"
        message="Choose your files so they are ready. For now only the file names are sent with your application; nothing is uploaded."
      />
      {hasGstin ? (
        <FileField
          label="GST registration certificate"
          value={gstCert}
          onChange={f => {
            setGstCert(f);
            setTouched(t => ({ ...t, gstCert: true }));
            dirty();
          }}
          error={err('gstCert')}
          testID="doc-gst"
        />
      ) : null}
      <FileField
        label="Shop front photo"
        helper="Show the shop name board clearly. JPG or PNG."
        allowPdf={false}
        value={storePhoto}
        onChange={f => {
          setStorePhoto(f);
          setTouched(t => ({ ...t, storePhoto: true }));
          dirty();
        }}
        error={err('storePhoto')}
        testID="doc-photo"
      />
      <FileField
        label="Owner's ID proof"
        helper="Aadhaar, PAN card, passport or driving licence"
        value={ownerId}
        onChange={f => {
          setOwnerId(f);
          setTouched(t => ({ ...t, ownerId: true }));
          dirty();
        }}
        error={err('ownerId')}
        testID="doc-id"
      />
    </Section>
  );

  return (
    <SellerFrame
      step={2}
      title="Tax and documents"
      description="Our team uses these to verify that your business is registered."
      onBack={onBack}
      wide
      footer={
        <StepFooter
          hint={hint}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          saveState={saveState}
          savedAt={savedAt}
          primaryLabel="Continue"
          onPrimary={onContinue}
          primaryLoading={busy}
          primaryTestID="step-continue"
        />
      }
      testID="step-b"
    >
      {restored ? <Banner tone="info" message="We restored the draft saved on this device." /> : null}
      {formError ? <Banner tone="error" message={formError} /> : null}
      {canSplit ? (
        <View style={{ flexDirection: 'row', gap: S.lg, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>{tax}</View>
          <View style={{ flex: 1 }}>{docs}</View>
        </View>
      ) : (
        <>
          {tax}
          {docs}
        </>
      )}
    </SellerFrame>
  );
}
