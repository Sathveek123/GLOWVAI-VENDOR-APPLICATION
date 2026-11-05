/**
 * Onboarding step 3 of 4: bank account for payouts.
 * The full account number stays in memory only; drafts keep the last four digits.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  SellerFrame,
  Section,
  TextField,
  Banner,
  StepFooter,
  CenteredLoader,
  useDocumentTitle,
  SellerColors as C,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { goBackOr, useRequireSession } from '../../src/features/onboarding/guard';
import { DRAFT_KEYS, loadDraft, saveDraft, setResumeStep, formatSavedTime, type BankDraft } from '../../src/features/onboarding/draft';
import {
  digitsOnly,
  upperAlnum,
  validateAccountNumber,
  validateIfsc,
  validateRequired,
  validateUpiOptional,
} from '../../src/features/onboarding/validation';

type Lookup =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'found'; bank: string; branch: string }
  | { state: 'notfound' }
  | { state: 'unavailable' };

export default function StepC() {
  const router = useRouter();
  const { ready } = useRequireSession();
  useDocumentTitle('Bank account');

  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showAccount, setShowAccount] = useState(false);
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [upi, setUpi] = useState('');
  const [savedLast4, setSavedLast4] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const lookupSeq = useRef(0);

  useEffect(() => {
    loadDraft<BankDraft>(DRAFT_KEYS.c).then(d => {
      if (!d) return;
      setHolder(d.beneficiaryName || '');
      setUpi(d.upiVpa || '');
      setBankName(d.bankName || '');
      setSavedLast4((d.maskedAccountNumber || '').slice(-4));
      if (d.ifsc) runLookup(d.ifsc, d.bankName, d.branch);
      setRestored(true);
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
      setBankName(j.BANK || '');
    } catch (_) {
      if (seq !== lookupSeq.current) return;
      // The directory is unreachable: keep what the seller had, and let them type the bank name.
      if (knownBank) setLookup({ state: 'found', bank: knownBank, branch: knownBranch || '' });
      else setLookup({ state: 'unavailable' });
    }
  };

  const dirty = () => saveState !== 'idle' && setSaveState('idle');
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const ifscFormatError = validateIfsc(ifsc);
  const errors: Record<string, string> = {
    holder: validateRequired(holder, 'the account holder’s name', 3),
    account: validateAccountNumber(account),
    confirm: !confirm ? 'Re-enter the account number' : confirm !== account ? 'The account numbers don’t match' : '',
    ifsc:
      ifscFormatError ||
      (lookup.state === 'notfound' ? 'We couldn’t find this IFSC. Check it on your cheque book or passbook.' : '') ||
      (lookup.state === 'checking' ? 'Checking IFSC…' : ''),
    bankName: lookup.state === 'unavailable' && !bankName.trim() ? 'Enter your bank’s name' : '',
    upi: validateUpiOptional(upi),
  };
  const labels: [string, string][] = [
    ['holder', 'account holder name'],
    ['account', 'account number'],
    ['confirm', 'matching account number'],
    ['ifsc', 'a valid IFSC'],
    ['bankName', 'bank name'],
    ['upi', 'a valid UPI ID'],
  ];
  const missing = labels.filter(([k]) => errors[k]).map(([, l]) => l);
  const valid = missing.length === 0;
  const err = (k: string) => {
    if (k === 'ifsc' && lookup.state === 'checking') return '';
    if (k === 'confirm' && confirm && account.startsWith(confirm) && !touched.confirm && !showAll) return '';
    return touched[k] || showAll || (k === 'ifsc' && lookup.state === 'notfound') ? errors[k] : '';
  };
  const hint = valid ? '' : `To continue, add: ${missing.join(', ')}`;

  const data = (): BankDraft => ({
    beneficiaryName: holder.trim(),
    ifsc,
    bankName: bankName.trim(),
    branch: lookup.state === 'found' ? lookup.branch : '',
    upiVpa: upi.trim(),
    maskedAccountNumber: account.length >= 4 ? `XXXXXX${account.slice(-4)}` : savedLast4 ? `XXXXXX${savedLast4}` : '',
  });

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.c, data());
      await setResumeStep('step-c');
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
      await saveDraft(DRAFT_KEYS.c, data());
      await setResumeStep('step-d');
      router.push('/(onboarding)/step-d');
    } catch (_) {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => goBackOr(router, '/(onboarding)/step-b');

  if (!ready) return <CenteredLoader label="Loading your details" />;

  return (
    <SellerFrame
      step={3}
      title="Bank account"
      description="Payouts for your orders go to this account. Use a current or savings account in your business or owner's name."
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
      {restored ? (
        <Banner
          tone="info"
          message={`We restored your draft. For your safety, account numbers aren’t saved in drafts${savedLast4 ? ` (yours ends in ${savedLast4})` : ''}, so please enter it again.`}
        />
      ) : null}
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
          onBlur={touch('holder')}
          error={err('holder')}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={100}
          testID="holder"
        />
        <TextField
          label="Account number"
          placeholder="9 to 18 digits"
          value={account}
          onChangeText={v => {
            setAccount(digitsOnly(v, 18));
            dirty();
          }}
          onBlur={touch('account')}
          error={err('account')}
          keyboardType="number-pad"
          inputMode="numeric"
          secureTextEntry={!showAccount}
          autoComplete="off"
          autoCorrect={false}
          maxLength={18}
          testID="account"
          right={
            <Pressable
              onPress={() => setShowAccount(s => !s)}
              accessibilityRole="button"
              accessibilityLabel={showAccount ? 'Hide account number' : 'Show account number'}
              style={{ width: 48, height: 46, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={showAccount ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textSecondary} />
            </Pressable>
          }
        />
        <TextField
          label="Re-enter account number"
          placeholder="Type it again to confirm"
          value={confirm}
          onChangeText={v => {
            setConfirm(digitsOnly(v, 18));
            dirty();
          }}
          onBlur={touch('confirm')}
          error={err('confirm')}
          success={confirm && !errors.confirm && !errors.account ? 'Account numbers match' : undefined}
          keyboardType="number-pad"
          inputMode="numeric"
          secureTextEntry={!showAccount}
          contextMenuHidden
          autoComplete="off"
          autoCorrect={false}
          maxLength={18}
          testID="account-confirm"
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
          success={lookup.state === 'found' ? [lookup.bank, lookup.branch].filter(Boolean).join(' · ') : undefined}
          helper={lookup.state === 'checking' ? 'Checking IFSC…' : '11 characters, printed on your cheque book or passbook'}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          testID="ifsc"
        />
        {lookup.state === 'unavailable' ? (
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
            helper="We couldn’t look up this IFSC right now, so please type the bank name."
            maxLength={80}
          />
        ) : null}
        <TextField
          label="UPI ID"
          optional
          placeholder="yourstore@okhdfcbank"
          value={upi}
          onChangeText={v => {
            setUpi(v.replace(/\s/g, '').slice(0, 100));
            dirty();
          }}
          onBlur={touch('upi')}
          error={err('upi')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          last
        />
      </Section>
    </SellerFrame>
  );
}
