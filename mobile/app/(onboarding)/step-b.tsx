/**
 * Onboarding step 2 of 4: business and tax details. PAN (required), GSTIN (only if
 * GST-registered) and an optional registration or licence number.
 *
 * Documents are not uploaded from the app (no file storage yet): GlowVai's team contacts the
 * vendor to verify them. The app never pretends a file was uploaded.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  TextField,
  Banner,
  StepFooter,
  GateFallback,
  useDocumentTitle,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, useOnboardingGate } from '../../src/features/onboarding/guard';
import { DRAFT_KEYS, loadDraft, saveDraft, setResumeStep, formatSavedTime, type TaxDraft } from '../../src/features/onboarding/draft';
import { taxErrors, hasErrors } from '../../src/features/onboarding/application';
import { upperAlnum, GSTIN_RE, GSTIN_EXAMPLE } from '../../src/features/onboarding/validation';

const LABELS: [string, string][] = [
  ['pan', 'PAN'],
  ['gstin', 'a valid GSTIN'],
  ['businessRegistrationNumber', 'a valid registration number'],
];

export default function StepB() {
  const router = useRouter();
  const gate = useOnboardingGate();
  useDocumentTitle('Business and tax');

  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [panFromGstin, setPanFromGstin] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [panOnFile, setPanOnFile] = useState('');

  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadDraft<TaxDraft>(DRAFT_KEYS.b).then(d => {
      if (d) {
        setGstin(d.gstin || '');
        setPan(d.pan || '');
        setRegNo(d.businessRegistrationNumber || '');
        setPanOnFile(d.panLast4OnFile || '');
        setRestored(!!(d.gstin || d.pan || d.businessRegistrationNumber));
      }
      setLoaded(true);
    });
  }, []);

  const dirty = () => saveState !== 'idle' && setSaveState('idle');
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const onGstin = (v: string) => {
    const g = upperAlnum(v, 15);
    setGstin(g);
    // Characters 3 to 12 of a GSTIN are the business PAN; fill it when PAN is empty.
    if (GSTIN_RE.test(g) && (!pan || panFromGstin)) {
      setPan(g.slice(2, 12));
      setPanFromGstin(true);
    }
    dirty();
  };

  const data = (): TaxDraft => ({ gstin, pan, businessRegistrationNumber: regNo.trim(), panLast4OnFile: panOnFile });
  const errors = taxErrors(data());
  const missing = LABELS.filter(([k]) => errors[k]).map(([, l]) => l);
  const valid = !hasErrors(errors);
  const err = (k: string) => (touched[k] || showAll ? errors[k] : '');
  const hint = valid ? '' : `To continue, add: ${missing.join(', ')}`;

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.b, data());
      await setResumeStep('step-b');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch {
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
    } catch {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-a');

  if (gate.status !== 'ready' || !loaded) {
    return <GateFallback gate={gate.status === 'ready' ? { status: 'loading' } : gate} loadingLabel="Loading your details" />;
  }

  return (
    <SellerFrame
      step={2}
      title="Business and tax"
      description="Our team uses these to check that your business is registered."
      onBack={onBack}
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

      <Section title="Tax details" description="PAN is always needed. Add your GSTIN only if your business is GST-registered.">
        <TextField
          label="PAN (business or owner)"
          placeholder="ABCDE1234F"
          value={pan}
          onChangeText={v => {
            setPan(upperAlnum(v, 10));
            setPanFromGstin(false);
            dirty();
          }}
          onBlur={touch('pan')}
          error={err('pan')}
          helper={
            panFromGstin
              ? 'Filled in from your GSTIN'
              : panOnFile && !pan
                ? `For your safety we keep only the end of your PAN (…${panOnFile}). Please enter it again.`
                : '10 characters: 5 letters, 4 digits, 1 letter. We keep only the last 4 characters.'
          }
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          testID="pan"
        />
        <TextField
          label="GSTIN"
          optional
          placeholder={GSTIN_EXAMPLE}
          value={gstin}
          onChangeText={onGstin}
          onBlur={touch('gstin')}
          error={err('gstin')}
          success={gstin && !errors.gstin ? 'Format looks right' : undefined}
          helper="15 characters, as on your GST certificate. Leave empty if you are not GST-registered."
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={15}
          testID="gstin"
        />
        <TextField
          label="Shop registration or licence number"
          optional
          placeholder="Trade licence or Shop & Establishment number"
          value={regNo}
          onChangeText={v => {
            setRegNo(v.slice(0, 40));
            dirty();
          }}
          onBlur={touch('businessRegistrationNumber')}
          error={err('businessRegistrationNumber')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={40}
          last
          testID="registration-number"
        />
      </Section>

      <Section title="Documents">
        <Banner
          tone="info"
          title="Our team will contact you to verify documents"
          message="You can’t upload documents in the app yet. After you submit, our team will contact you on your store contact mobile or account email to tell you which documents to share, such as your PAN card, GST certificate and a photo of your shop front."
          style={{ marginBottom: 0 }}
        />
      </Section>
    </SellerFrame>
  );
}
