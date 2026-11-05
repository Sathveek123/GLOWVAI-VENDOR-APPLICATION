/**
 * Seller sign-in: one-time code. Verifies through POST /api/auth/vendor/login,
 * stores the session, then routes new sellers to registration and others to status.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, ApiError } from '../../src/services/api';
import { saveSession } from '../../src/services/session';
import { resetSocket } from '../../src/services/socket';
import {
  SellerFrame,
  Section,
  Button,
  Banner,
  LinkButton,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { goBackOr, isNetworkError } from '../../src/features/onboarding/guard';
import { claimDrafts, getResumeStep } from '../../src/features/onboarding/draft';
import { formatMobile } from '../../src/features/onboarding/validation';
import { cacheStatus, normalizeStatus } from '../../src/features/onboarding/status';
import {
  CODE_LENGTH,
  CODE_SENDING_AVAILABLE,
  CODE_UNAVAILABLE_MESSAGE,
  DEV_TEST_CODE,
} from '../../src/features/onboarding/otp';
import { FontFamily } from '../../src/theme/typography';

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 60;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function OtpScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Verify your number');

  const inputRef = useRef<TextInput>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('vendor_phone').then(p => {
      const digits = (p || '').replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) {
        router.replace('/(auth)/login');
        return;
      }
      setPhone(digits);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLockedFor(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (lockedFor === 0 && attempts >= MAX_ATTEMPTS) {
      setAttempts(0);
      setError('');
    }
  }, [lockedFor]);

  const locked = lockedFor > 0;
  const complete = code.length === CODE_LENGTH;

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || loading || locked || verified) return;
    setLoading(true);
    setError('');
    try {
      const session = await authApi.login({ phone: `+91${phone}`, otp: value });
      await saveSession({
        token: session.token,
        vendorId: session.vendorId,
        storeId: session.storeId,
        kycStatus: session.kycStatus,
      });
      await claimDrafts(phone);
      await AsyncStorage.setItem('vendor_registered', session.registered ? 'true' : 'false');
      const status = session.kycStatus ? normalizeStatus({ kycStatus: session.kycStatus }) : 'UNKNOWN';
      if (session.registered) await cacheStatus(status);
      resetSocket();
      // Only mark verified once the session is safely stored; a failure above leaves the form usable.
      setVerified(true);
      if (!session.registered) {
        const resume = await getResumeStep();
        router.replace(`/(onboarding)/${resume || 'step-a'}` as any);
      } else if (status === 'APPROVED') {
        router.replace('/(onboarding)/approved');
      } else {
        router.replace('/(onboarding)/pending');
      }
    } catch (e: any) {
      setCode('');
      if (e instanceof ApiError && e.code === 'INVALID_OTP') {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLockedFor(LOCK_SECONDS);
          setError('Too many incorrect codes. Wait a minute, then try again or request a new code.');
        } else {
          const left = MAX_ATTEMPTS - next;
          setError(`That code is incorrect. ${left} ${left === 1 ? 'try' : 'tries'} left.`);
        }
      } else if (e instanceof ApiError && e.code === 'OTP_PROVIDER_REQUIRED') {
        setError(`${CODE_UNAVAILABLE_MESSAGE}. SMS verification is being connected; please try again later.`);
      } else if (e instanceof ApiError && e.code === 'INVALID_PHONE') {
        setError('This mobile number isn’t valid. Edit the number and try again.');
      } else if (isNetworkError(e)) {
        setError('Can’t reach GlowVai. Check your internet connection and try again.');
      } else {
        setError('We couldn’t verify the code. Try again in a moment.');
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError('');
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  // Development builds only: fill in the development backend's test code.
  const useTestCode = () => {
    if (DEV_TEST_CODE) onChange(DEV_TEST_CODE);
  };

  const editNumber = () => goBackOr(router, '/(auth)/login');
  const boxSize = isPhone ? 60 : 64;

  return (
    <SellerFrame onBack={editNumber} maxWidth={440} testID="otp-screen">
      <View>
        <Section>
          <Text accessibilityRole="header" style={st.title}>
            Enter the {CODE_LENGTH}-digit code
          </Text>
          <View style={st.sentRow}>
            <Text style={st.sent}>
              {CODE_SENDING_AVAILABLE ? 'Sent by SMS to ' : 'For '}
              <Text style={st.phone}>+91 {formatMobile(phone)}</Text>
            </Text>
            <LinkButton label="Edit number" onPress={editNumber} accessibilityLabel="Edit mobile number" testID="otp-edit-number" />
          </View>

          {!CODE_SENDING_AVAILABLE && !verified ? (
            DEV_TEST_CODE ? (
              <Banner tone="info" title="Development build" message="No SMS is sent. The development server accepts the test code.">
                <View style={{ flexDirection: 'row', marginTop: S.sm }}>
                  <Button label="Use test code" variant="secondary" compact onPress={useTestCode} testID="otp-dev-code" />
                </View>
              </Banner>
            ) : (
              <Banner
                tone="info"
                title={CODE_UNAVAILABLE_MESSAGE}
                message="We haven’t sent an SMS to this number. SMS verification is being connected; please check back soon."
              />
            )
          ) : null}
          {error ? <Banner tone="error" message={error} /> : null}
          {verified ? <Banner tone="success" message="Number verified. Opening your account…" /> : null}

          <View style={st.boxes}>
            {/* The digit boxes are decoration; screen readers reach the real input below. */}
            <Pressable
              onPress={() => inputRef.current?.focus()}
              style={st.boxRow}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const active = focused && !locked && i === Math.min(code.length, CODE_LENGTH - 1);
              return (
                <View
                  key={i}
                  style={[
                    st.box,
                    { width: boxSize, height: boxSize },
                    !!code[i] && st.boxFilled,
                    active && st.boxActive,
                    !!error && st.boxError,
                    locked && st.boxLocked,
                  ]}
                >
                  <Text style={st.digit}>{code[i] || ''}</Text>
                </View>
              );
              })}
            </Pressable>
            <TextInput
              ref={inputRef}
              testID="otp-input"
              value={code}
              onChangeText={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="number-pad"
              inputMode="numeric"
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              maxLength={CODE_LENGTH + 8}
              autoFocus
              editable={!locked && !loading && !verified}
              caretHidden
              accessibilityLabel={`Verification code, ${CODE_LENGTH} digits`}
              accessibilityHint="You can paste the code"
              style={[st.hiddenInput, Platform.OS === 'web' && ({ outlineStyle: 'none', caretColor: 'transparent' } as any)]}
            />
          </View>

          <Button
            testID="otp-verify"
            label={locked ? `Try again in ${mmss(lockedFor)}` : 'Verify and continue'}
            onPress={() => verify(code)}
            disabled={!complete || locked || verified}
            loading={loading}
          />

          <View style={st.resendRow}>
            {/* No provider is connected, so there is nothing to resend; never claim a code was sent. */}
            <Text style={st.resendWait}>Didn{'’'}t get a code? {CODE_UNAVAILABLE_MESSAGE}.</Text>
          </View>
        </Section>
      </View>
    </SellerFrame>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  sentRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: S.sm, marginTop: S.xs, marginBottom: S.lg },
  sent: { fontSize: 15, lineHeight: 22, color: C.textSecondary },
  phone: { fontFamily: FontFamily.semibold, color: C.textPrimary },
  boxes: { marginBottom: S.xl, position: 'relative' },
  boxRow: { flexDirection: 'row', justifyContent: 'center', gap: S.md },
  box: {
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  boxFilled: { borderColor: C.textSecondary },
  boxActive: { borderColor: C.primary, borderWidth: 2 },
  boxError: { borderColor: C.errorText },
  boxLocked: { backgroundColor: C.surface },
  digit: { fontFamily: FontFamily.monoBold, fontSize: 26, color: C.textPrimary },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.011,
    color: 'transparent',
    fontSize: 16,
    textAlign: 'center',
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: S.md, columnGap: S.xs },
  resendWait: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
});
