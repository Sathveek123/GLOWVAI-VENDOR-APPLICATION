/**
 * Payout account: view the bank account and UPI ID that settlements go to, and request a change.
 * File: mobile/app/(vendor)/bank-edit.tsx
 *
 * Changes use a three-step sheet: identity code, new details, review. Nothing is saved yet:
 * code verification and the change endpoint are not connected, so the final step says so.
 * Account details come from the finance adapter and appear only in __DEV__ builds, labelled.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import { fetchBankAccountDetails, type PayoutAccountDetails } from '../../src/features/finance/adapter';
import { Colors } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

// Flip to true only when the SMS code check exists on the server.
const VERIFICATION_CONNECTED = false;

type ChangeType = 'BANK' | 'UPI';
type LoadStatus = 'loading' | 'ready' | 'error';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const STATUS_STYLE: Record<PayoutAccountDetails['status'], { bg: string; fg: string }> = {
  Verified: { bg: Colors.successLight, fg: Colors.success },
  'Pending verification': { bg: Colors.warningLight, fg: '#B45309' },
  'Change in progress': { bg: Colors.warningLight, fg: '#B45309' },
  Failed: { bg: Colors.dangerLight, fg: Colors.danger },
};

function BankEditScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [account, setAccount] = useState<PayoutAccountDetails | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Change sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [changeType, setChangeType] = useState<ChangeType>('BANK');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState('');
  const [holder, setHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [confirmNo, setConfirmNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upi, setUpi] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Payout account | GlowVAI Vendor';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    // Live account lookup is not connected yet. Only __DEV__ builds read adapter sample data.
    (async () => {
      try {
        const details = __DEV__ ? await fetchBankAccountDetails() : null;
        if (!cancelled) {
          setAccount(details);
          setStatus('ready');
        }
      } catch (_) {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const showingSample = __DEV__ && !!account;

  const openSheet = (type: ChangeType) => {
    setChangeType(type);
    setStep(1);
    setOtp('');
    setHolder('');
    setBankName('');
    setAccountNo('');
    setConfirmNo('');
    setIfsc('');
    setUpi('');
    setErrors({});
    setReason('');
    setAgreed(false);
    setSubmitMsg('');
    setSheetOpen(true);
  };

  const goToDetails = () => {
    if (__DEV__) setStep(2);
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (changeType === 'BANK') {
      if (holder.trim().length < 3) e.holder = 'Enter the account holder name as it appears on the bank account.';
      if (bankName.trim().length < 2) e.bankName = 'Enter the bank name.';
      if (!ACCOUNT_RE.test(accountNo)) e.accountNo = 'Enter 9 to 18 digits.';
      if (confirmNo !== accountNo) e.confirmNo = 'The account numbers do not match.';
      if (!IFSC_RE.test(ifsc.toUpperCase())) e.ifsc = 'IFSC is 11 characters: 4 letters, a 0, then 6 letters or digits.';
    } else if (!UPI_RE.test(upi.trim())) {
      e.upi = 'Enter a UPI ID in the form name@bank.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToReview = () => {
    if (validateDetails()) setStep(3);
  };

  const submitChange = () => {
    if (!agreed) {
      setErrors({ agreed: 'Tick the box to confirm the account belongs to your business.' });
      return;
    }
    setErrors({});
    setSubmitMsg('Payout changes cannot be saved in this build yet. Your current account is unchanged.');
  };

  const maskedNew = accountNo.length >= 4 ? `••••${accountNo.slice(-4)}` : '';

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Payout account', subtitle: 'Where your settlements are paid', showBack: true }}
        contentContainerStyle={s.shellContent}
      >
        <View style={[s.page, { padding: isWide ? 24 : 16 }]}>
          {showingSample && (
            <View style={s.sampleBanner}>
              <Ionicons name="flask-outline" size={15} color="#B45309" />
              <Text style={s.sampleBannerText}>Sample data. These account details are not from your store.</Text>
            </View>
          )}

          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Bank account</Text>
              {account && (
                <View style={[s.statusPill, { backgroundColor: STATUS_STYLE[account.status].bg }]}>
                  <Text style={[s.statusPillText, { color: STATUS_STYLE[account.status].fg }]}>{account.status}</Text>
                </View>
              )}
            </View>

            {status === 'loading' && (
              <View style={s.centerBox}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={s.mutedText}>Loading account details</Text>
              </View>
            )}

            {status === 'error' && (
              <>
                <Text style={s.mutedText}>We could not load your payout account. Check your connection and try again.</Text>
                <Pressable onPress={() => setAttempt((n) => n + 1)} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
                  <Text style={s.primaryBtnText}>Try again</Text>
                </Pressable>
              </>
            )}

            {status === 'ready' && !account && (
              <View style={s.emptyBox}>
                <View style={s.emptyIcon}>
                  <Ionicons name="card-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={s.cardTitle}>Account details are not available yet</Text>
                <Text style={[s.mutedText, s.textCenter]}>
                  Your payout account will show here once account lookup is connected. Nothing on this screen has changed your account.
                </Text>
              </View>
            )}

            {status === 'ready' && account && (
              <>
                <View style={s.detailGrid}>
                  <Detail label="Account holder" value={account.holderName} />
                  <Detail label="Bank" value={account.bankName} />
                  <Detail label="Account number" value={`••••${account.accountLast4}`} mono />
                  <Detail label="IFSC" value={account.ifsc} mono />
                  <Detail label="Branch" value={account.branch} wide />
                  <Detail label="UPI ID" value={account.upiIdMasked} mono wide />
                </View>
                <Text style={s.mutedText}>Last changed {account.lastChangedAt}</Text>
                <View style={s.actionRow}>
                  <Pressable onPress={() => openSheet('BANK')} style={({ pressed }) => [s.primaryBtn, s.actionBtn, pressed && s.pressed]} accessibilityRole="button">
                    <Text style={s.primaryBtnText}>Change bank account</Text>
                  </Pressable>
                  <Pressable onPress={() => openSheet('UPI')} style={({ pressed }) => [s.secondaryBtn, s.actionBtn, pressed && s.pressed]} accessibilityRole="button">
                    <Text style={s.secondaryBtnText}>Change UPI ID</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>How payout changes work</Text>
            <View style={s.bullet}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
              <Text style={s.bulletText}>Every change needs a one-time code sent to your registered mobile number.</Text>
            </View>
            <View style={s.bullet}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={s.bulletText}>Payouts can be held for up to 24 hours after a change, so the new account can be checked.</Text>
            </View>
            <View style={s.bullet}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
              <Text style={s.bulletText}>The account holder name must match your registered business name.</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Did not make this change?</Text>
            <Text style={s.mutedText}>Contact support straight away so the account can be reviewed.</Text>
            <Pressable onPress={() => router.push('/(vendor)/support')} style={({ pressed }) => [s.secondaryBtn, pressed && s.pressed]} accessibilityRole="button">
              <Text style={s.secondaryBtnText}>Contact support</Text>
            </Pressable>
          </View>
        </View>
      </ScreenShell>

      <MobileBottomNav currentTab="earnings" />

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setSheetOpen(false)} accessibilityLabel="Close" />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetTitle}>{changeType === 'BANK' ? 'Change bank account' : 'Change UPI ID'}</Text>
              <Text style={s.mutedText}>Step {step} of 3</Text>
            </View>
            <Pressable onPress={() => setSheetOpen(false)} style={s.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={s.steps} accessible accessibilityLabel={`Step ${step} of 3`}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[s.stepBar, n <= step && s.stepBarOn]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <>
                <Text style={s.stepTitle}>Confirm it is you</Text>
                {!VERIFICATION_CONNECTED && (
                  <View style={s.notice}>
                    <Ionicons name="information-circle-outline" size={18} color="#92400E" />
                    <Text style={s.noticeText}>
                      Code verification is not connected in this build yet, so payout details cannot be changed.
                    </Text>
                  </View>
                )}
                <Field label="6-digit code">
                  <TextInput
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="6-digit code"
                    placeholderTextColor={Colors.textSubtle}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    accessibilityLabel="6-digit code"
                    style={[s.input, s.codeInput]}
                  />
                </Field>
                <Pressable
                  onPress={() => {
                    if (VERIFICATION_CONNECTED) setStep(2);
                  }}
                  disabled={!VERIFICATION_CONNECTED || otp.length !== 6}
                  style={({ pressed }) => [s.primaryBtn, (!VERIFICATION_CONNECTED || otp.length !== 6) && s.disabledBtn, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !VERIFICATION_CONNECTED || otp.length !== 6 }}
                >
                  <Text style={s.primaryBtnText}>Verify code</Text>
                </Pressable>
                {__DEV__ && (
                  <Pressable onPress={goToDetails} style={({ pressed }) => [s.devSkip, pressed && s.pressed]} accessibilityRole="button">
                    <Text style={s.devSkipText}>Skip verification (development builds only)</Text>
                  </Pressable>
                )}
              </>
            )}

            {step === 2 && changeType === 'BANK' && (
              <>
                <Text style={s.stepTitle}>Enter the new bank details</Text>
                <Field label="Account holder name" error={errors.holder}>
                  <TextInput value={holder} onChangeText={setHolder} style={s.input} autoCapitalize="words" accessibilityLabel="Account holder name" />
                </Field>
                <Field label="Bank name" error={errors.bankName}>
                  <TextInput value={bankName} onChangeText={setBankName} style={s.input} accessibilityLabel="Bank name" />
                </Field>
                <Field label="Account number" error={errors.accountNo}>
                  <TextInput
                    value={accountNo}
                    onChangeText={(t) => setAccountNo(t.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={18}
                    style={s.input}
                    accessibilityLabel="Account number"
                  />
                </Field>
                <Field label="Re-enter account number" error={errors.confirmNo} helper="Enter the same number again to confirm it.">
                  <TextInput
                    value={confirmNo}
                    onChangeText={(t) => setConfirmNo(t.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={18}
                    style={s.input}
                    accessibilityLabel="Re-enter account number"
                  />
                </Field>
                <Field label="IFSC code" error={errors.ifsc} helper="11 characters: 4 letters, a 0, then 6 letters or digits">
                  <TextInput
                    value={ifsc}
                    onChangeText={(t) => setIfsc(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                    autoCapitalize="characters"
                    maxLength={11}
                    style={[s.input, s.mono]}
                    accessibilityLabel="IFSC code"
                  />
                </Field>
                <PrimaryAction label="Review change" onPress={goToReview} />
              </>
            )}

            {step === 2 && changeType === 'UPI' && (
              <>
                <Text style={s.stepTitle}>Enter the new UPI ID</Text>
                <Field label="UPI ID" error={errors.upi} helper="For example yourname@bank">
                  <TextInput
                    value={upi}
                    onChangeText={setUpi}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[s.input, s.mono]}
                    accessibilityLabel="UPI ID"
                  />
                </Field>
                <PrimaryAction label="Review change" onPress={goToReview} />
              </>
            )}

            {step === 3 && (
              <>
                <Text style={s.stepTitle}>Review the change</Text>
                <View style={s.compare}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.compareHead}>Current</Text>
                    <Text style={s.compareText}>{account ? account.bankName : 'Not available'}</Text>
                    <Text style={s.compareText}>{account ? `••••${account.accountLast4}` : '—'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.compareHead, { color: Colors.primary }]}>New</Text>
                    {changeType === 'BANK' ? (
                      <>
                        <Text style={s.compareTextStrong}>{bankName.trim()}</Text>
                        <Text style={s.compareTextStrong}>{maskedNew}</Text>
                        <Text style={[s.compareTextStrong, s.mono]}>{ifsc}</Text>
                      </>
                    ) : (
                      <Text style={[s.compareTextStrong, s.mono]}>{upi.trim()}</Text>
                    )}
                  </View>
                </View>

                <Field label="Reason for change (optional)">
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="For example, moving to a new current account"
                    placeholderTextColor={Colors.textSubtle}
                    style={s.input}
                    accessibilityLabel="Reason for change, optional"
                  />
                </Field>

                <Pressable
                  onPress={() => setAgreed((v) => !v)}
                  style={s.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                >
                  <View style={[s.checkBox, agreed && s.checkBoxOn]}>
                    {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={s.checkText}>
                    I confirm this account belongs to my registered business.
                  </Text>
                </Pressable>
                {errors.agreed ? <Text style={s.errorText}>{errors.agreed}</Text> : null}

                {submitMsg ? (
                  <View style={s.notice}>
                    <Ionicons name="information-circle-outline" size={18} color="#92400E" />
                    <Text style={s.noticeText}>{submitMsg}</Text>
                  </View>
                ) : null}

                <PrimaryAction label="Submit change" onPress={submitChange} />
                <Pressable onPress={() => setStep(2)} style={({ pressed }) => [s.textBtn, pressed && s.pressed]} accessibilityRole="button">
                  <Text style={s.textBtnText}>Edit details</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Detail({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <View style={[s.detailItem, wide && s.detailWide]}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, mono && s.mono]} selectable>{value}</Text>
    </View>
  );
}

function Field({ label, error, helper, children }: { label: string; error?: string; helper?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.errorText}>{error}</Text> : helper ? <Text style={s.helperText}>{helper}</Text> : null}
    </View>
  );
}

function PrimaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} accessibilityRole="button">
      <Text style={s.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export default BankEditScreen;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  shellContent: { paddingBottom: 32 },
  page: { gap: 12, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.85 },
  mono: { fontFamily: FontFamily.mono },
  textCenter: { textAlign: 'center' },

  sampleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderRadius: 10, backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
  },
  sampleBannerText: { ...TypeScale.label, color: '#92400E', flex: 1 },

  card: {
    backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary, flexShrink: 1 },
  mutedText: { ...TypeScale.caption, color: Colors.textSubtle, fontSize: 13, lineHeight: 18 },
  centerBox: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  detailItem: { flexBasis: '46%', flexGrow: 1 },
  detailWide: { flexBasis: '100%' },
  detailLabel: { ...TypeScale.label, color: Colors.textSubtle },
  detailValue: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, marginTop: 2 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionBtn: { flexGrow: 1, flexBasis: 160, marginTop: 0 },

  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { flex: 1, ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },

  primaryBtn: {
    marginTop: 4, minHeight: 48, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },
  disabledBtn: { backgroundColor: Colors.inputBorder },
  secondaryBtn: {
    marginTop: 4, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, backgroundColor: Colors.background,
  },
  secondaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.textPrimary },
  textBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textBtnText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
  devSkip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  devSkipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSubtle, textDecorationLine: 'underline' },

  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 28, maxHeight: '88%', gap: 12,
    width: '100%', maxWidth: 640, alignSelf: 'center',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginRight: -10 },
  steps: { flexDirection: 'row', gap: 6 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  stepBarOn: { backgroundColor: Colors.primary },
  stepTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textPrimary },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10,
    backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
  },
  noticeText: { flex: 1, ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: '#92400E' },

  fieldLabel: { ...TypeScale.label, color: Colors.textPrimary },
  helperText: { ...TypeScale.caption, color: Colors.textSubtle },
  errorText: { ...TypeScale.caption, fontSize: 13, color: Colors.danger },
  input: {
    minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: 14, fontFamily: FontFamily.regular, fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  codeInput: { fontFamily: FontFamily.bold, fontSize: 20, letterSpacing: 6, textAlign: 'center' },

  compare: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  compareHead: { ...TypeScale.label, color: Colors.textSubtle, marginBottom: 4 },
  compareText: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  compareTextStrong: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 44 },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.inputBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkBoxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkText: { flex: 1, ...TypeScale.caption, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
});
