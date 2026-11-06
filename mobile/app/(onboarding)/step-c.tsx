/**
 * Onboarding step 3 of 4: payout bank account.
 *
 * Only the last 4 digits of the account number are collected: the full number is never typed
 * into the app, stored on the device or sent to GlowVai's servers (docs/VENDOR_API.md).
 * The IFSC is looked up in Razorpay's public IFSC directory to show the bank and branch.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  TextField,
  Banner,
  StepFooter,
  GateFallback,
  useDocumentTitle,
  SellerColors as C,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, useOnboardingGate } from '../../src/features/onboarding/guard';
import { DRAFT_KEYS, loadDraft, saveDraft, setResumeStep, formatSavedTime, type BankDraft } from '../../src/features/onboarding/draft';
import { bankErrors, hasErrors } from '../../src/features/onboarding/application';
import { digitsOnly, upperAlnum, validateIfsc } from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

type Lookup =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'found'; bank: string; branch: string }
  | { state: 'notfound' }
  | { state: 'unavailable' };

const LABELS: [string, string][] = [
  ['holderName', 'account holder name'],
  ['ifsc', 'a valid IFSC'],
  ['bankName', 'bank name'],
  ['accLast4', 'last 4 digits'],
  ['upiVpa', 'a valid UPI ID'],
];

export default function StepC() {
  const router = useRouter();
  const gate = useOnboardingGate();
  useDocumentTitle('Bank account');

  const [holder, setHolder] = useState('');
  const [last4, setLast4] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [upi, setUpi] = useState('');
  const [ifscOnFile, setIfscOnFile] = useState('');

  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const lookupSeq = useRef(0);

  useEffect(() => {
    loadDraft<BankDraft & { beneficiaryName?: string; maskedAccountNumber?: string }>(DRAFT_KEYS.c).then(d => {
      if (d) {
        setHolder(d.holderName || d.beneficiaryName || '');
        setLast4((d.accLast4 || d.maskedAccountNumber || '').replace(/\D/g, '').slice(-4));
        setUpi(d.upiVpa || '');
        setBankName(d.bankName || '');
        setIfscOnFile(d.ifscOnFile || '');
        if (d.ifsc) runLookup(d.ifsc, d.bankName, d.branch);
        setRestored(!!(d.holderName || d.beneficiaryName || d.ifsc));
      }
      setLoaded(true);
    });
  }, []);

  /** Looks the IFSC up in Razorpay's public IFSC directory (ifsc.razorpay.com). */
  const runLookup = async (code: string, knownBank?: string, knownBranch?: string) => {
    setIfsc(code);
    if (validateIfsc(code)) {
      setLookup({ state: 'idle' });
      return;
    }
    const seq = ++lookupSeq.current;
    setLookup({ state: 'checking' });
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (seq !== lookupSeq.current) return;
      if (res.status === 404) {
        setLookup({ state: 'notfound' });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      const branch = [j.BRANCH, j.CITY].filter(Boolean).join(', ');
      setLookup({ state: 'found', bank: j.BANK || '', branch });
      if (j.BANK) setBankName(j.BANK);
    } catch {
      if (seq !== lookupSeq.current) return;
      // The directory is unreachable: keep what the vendor had and let them type the bank name.
      if (knownBank) setLookup({ state: 'found', bank: knownBank, branch: knownBranch || '' });
      else setLookup({ state: 'unavailable' });
    }
  };

  const dirty = () => saveState !== 'idle' && setSaveState('idle');
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const data = (): BankDraft => ({
    holderName: holder.trim(),
    bankName: bankName.trim(),
    ifsc,
    branch: lookup.state === 'found' ? lookup.branch : '',
    accLast4: last4,
    upiVpa: upi.trim(),
    ifscOnFile,
  });

  // The bank name comes from the IFSC lookup; the vendor types it only when the lookup can't help.
  const showBankName = lookup.state === 'unavailable' || lookup.state === 'notfound' || (lookup.state === 'found' && !lookup.bank);
  const base = bankErrors(data());
  const errors: Record<string, string> = {
    ...base,
    ifsc:
      base.ifsc ||
      (lookup.state === 'notfound' ? 'We couldn’t find this IFSC. Check it on your cheque book or passbook.' : '') ||
      (lookup.state === 'checking' ? 'Checking IFSC…' : ''),
    bankName: showBankName ? base.bankName : '',
  };
  const missing = LABELS.filter(([k]) => errors[k]).map(([, l]) => l);
  const valid = !hasErrors(errors);
  const err = (k: string) => {
    if (k === 'ifsc' && lookup.state === 'checking') return '';
    return touched[k] || showAll || (k === 'ifsc' && lookup.state === 'notfound') ? errors[k] : '';
  };
  const hint = valid ? '' : lookup.state === 'checking' ? 'Checking your IFSC…' : `To continue, add: ${missing.join(', ')}`;

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.c, data());
      await setResumeStep('step-c');
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
      await saveDraft(DRAFT_KEYS.c, data());
      await setResumeStep('step-d');
      router.push('/(onboarding)/step-d');
    } catch {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-b');

  if (gate.status !== 'ready' || !loaded) {
    return <GateFallback gate={gate.status === 'ready' ? { status: 'loading' } : gate} loadingLabel="Loading your details" />;
  }

  return (
    <SellerFrame
      step={3}
      title="Bank account"
      description="Payouts for your orders go to this account. Use an account in your business or owner’s name."
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
      testID="step-c"
    >
      {restored ? <Banner tone="info" message="We restored the draft saved on this device." /> : null}
      {formError ? <Banner tone="error" message={formError} /> : null}

      <Section title="Account details">
        <TextField
          label="Account holder name"
          placeholder="As in your bank records"
          value={holder}
          onChangeText={v => {
            setHolder(v.slice(0, 100));
            dirty();
          }}
          onBlur={touch('holderName')}
          error={err('holderName')}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={100}
          testID="holder"
        />
        <TextField
          label="IFSC"
          placeholder="HDFC0001234"
          value={ifsc}
          onChangeText={v => {
            runLookup(upperAlnum(v, 11));
            dirty();
          }}
          onBlur={touch('ifsc')}
          error={err('ifsc')}
          success={lookup.state === 'found' && (lookup.bank || lookup.branch) ? [lookup.bank, lookup.branch].filter(Boolean).join(' · ') : undefined}
          helper={
            lookup.state === 'checking'
              ? 'Checking IFSC…'
              : ifscOnFile && !ifsc
                ? `We show only part of the IFSC on file (${ifscOnFile}). Please enter it again.`
                : '11 characters, printed on your cheque book or passbook'
          }
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          testID="ifsc"
        />
        {showBankName ? (
          <TextField
            label="Bank name"
            placeholder="e.g. State Bank of India"
            value={bankName}
            onChangeText={v => {
              setBankName(v.slice(0, 80));
              dirty();
            }}
            onBlur={touch('bankName')}
            error={err('bankName')}
            helper={lookup.state === 'unavailable' ? 'We couldn’t look up this IFSC right now, so please type the bank name.' : undefined}
            maxLength={80}
            testID="bank-name"
          />
        ) : null}

        <View style={st.why}>
          <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={st.whyTitle}>Why only the last 4 digits?</Text>
            <Text style={st.whyText}>
              For your safety, GlowVai never asks for your full account number in the app, and never stores it. The last 4 digits
              let our team match your account when they confirm your bank details with you before payouts start.
            </Text>
          </View>
        </View>

        <View style={st.last4Wrap}>
        <TextField
          label="Last 4 digits of the account number"
          placeholder="1234"
          value={last4}
          onChangeText={v => {
            setLast4(digitsOnly(v, 4));
            dirty();
          }}
          onBlur={touch('accLast4')}
          error={err('accLast4')}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect={false}
          maxLength={4}
          inputStyle={st.last4}
          testID="acc-last4"
        />
        </View>
        <TextField
          label="UPI ID"
          optional
          placeholder="yourstore@okhdfcbank"
          value={upi}
          onChangeText={v => {
            setUpi(v.replace(/\s/g, '').slice(0, 100));
            dirty();
          }}
          onBlur={touch('upiVpa')}
          error={err('upiVpa')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          last
          testID="upi"
        />
      </Section>
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  why: {
    flexDirection: 'row',
    gap: S.md,
    padding: S.md + 2,
    marginBottom: S.lg,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    borderWidth: 1,
    borderColor: C.primaryBorder,
  },
  whyTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.infoText },
  whyText: { fontSize: 14, lineHeight: 20, color: C.infoText, marginTop: 2 },
  last4Wrap: { maxWidth: 320 },
  last4: { letterSpacing: 4, fontVariant: ['tabular-nums'] },
});
