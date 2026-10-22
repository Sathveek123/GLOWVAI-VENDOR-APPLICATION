/**
 * SCREEN 03: SMS OTP Verification
 * File: mobile/app/(auth)/otp.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import AppHeader from '../../src/components/AppHeader';

const OTP_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const DEV_TEST_OTP = '4892';

export default function OTPScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  
  // Validation, Lockout & Feedback States
  const [statusState, setStatusState] = useState<'idle' | 'success' | 'expired' | 'rateLimit' | 'networkError'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Verify Mobile Number | GlowVAI Partner Portal";
    }

    AsyncStorage.getItem('vendor_phone').then(p => {
      if (p) setPhone(p);
    });

    const resendInterval = setInterval(() => {
      setResendTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(resendInterval);
  }, []);

  // Lockout Countdown Timer Effect
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const lockoutInterval = setInterval(() => {
      setLockoutTimer(prev => {
        if (prev <= 1) {
          setFailedAttempts(0); // Reset attempts after lockout period
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(lockoutInterval);
  }, [lockoutTimer]);

  const maskPhoneNumber = (rawPhone: string) => {
    if (!rawPhone) return '+91 98XXX XX210';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last3 = digits.slice(-3);
      const first2 = digits.slice(-10, -8);
      return `+91 ${first2}XXX XX${last3}`;
    }
    return rawPhone;
  };

  const handleDigitChange = (val: string, idx: number) => {
    setErrorMsg('');
    setResendSuccessMsg('');
    setStatusState('idle');

    // Handle full pasted code (e.g. 4892)
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length === OTP_LENGTH) {
      const splitArr = cleanDigits.split('');
      setOtp(splitArr);
      inputs.current[OTP_LENGTH - 1]?.focus();
      setFocusedIdx(OTP_LENGTH - 1);
      return;
    }

    const cleanVal = cleanDigits.slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = cleanVal;
    setOtp(newOtp);

    if (cleanVal && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
      setFocusedIdx(idx + 1);
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[idx] && idx > 0) {
        inputs.current[idx - 1]?.focus();
        setFocusedIdx(idx - 1);
      }
    }
  };

  const isLockedOut = lockoutTimer > 0;
  const isCodeComplete = otp.every(d => d !== '');

  const handleVerify = async () => {
    if (!isCodeComplete) return;
    setLoading(true);
    setErrorMsg('');
    setResendSuccessMsg('');

    try {
      const fullCode = otp.join('');
      await new Promise(r => setTimeout(r, 600));

      // Verification must happen on the server. No OTP endpoint exists yet, so the
      // only accepted code is the developer test code, and only in __DEV__ builds.
      if (!(__DEV__ && fullCode === DEV_TEST_OTP)) {
        setErrorMsg('Code verification is not available in this build yet. Please try again later.');
        return;
      }

      setStatusState('success');
      await AsyncStorage.setItem('vendor_session_token', 'DEV_SESSION_ONLY');
      await AsyncStorage.setItem('vendor_id', 'VND-001');

      const isRegistered = await AsyncStorage.getItem('vendor_registered');
      setTimeout(() => {
        if (isRegistered === 'true') {
          router.replace('/(vendor)/home');
        } else {
          router.replace('/(onboarding)/step-a');
        }
      }, 500);
    } catch (err: any) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutTimer(60); // 60 seconds temporary lockout
        setErrorMsg('Too many failed attempts. Temporary lockout active for 60s. Need help? Contact Support.');
      } else {
        setErrorMsg(err.message || 'Incorrect verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0 || isLockedOut) return;

    setResendTimer(30);
    setOtp(Array(OTP_LENGTH).fill(''));
    setErrorMsg('');
    setResendSuccessMsg(`✓ A new verification code has been sent to ${maskPhoneNumber(phone)}`);
    inputs.current[0]?.focus();
    setFocusedIdx(0);
  };

  const handleSimulateState = (type: 'incorrect' | 'expired' | 'lockout' | 'rateLimit' | 'network' | 'success') => {
    setErrorMsg('');
    setResendSuccessMsg('');
    setStatusState('idle');

    if (type === 'incorrect') {
      setErrorMsg('Incorrect verification code. Please check SMS and try again.');
    } else if (type === 'expired') {
      setStatusState('expired');
      setErrorMsg('Verification code has expired. Please request a new code.');
    } else if (type === 'lockout') {
      setFailedAttempts(MAX_ATTEMPTS);
      setLockoutTimer(60);
      setErrorMsg('Too many failed attempts. Temporary lockout active for 60s. Contact Support.');
    } else if (type === 'rateLimit') {
      setStatusState('rateLimit');
      setErrorMsg('⏳ Resend rate limit reached. Please wait 60 seconds.');
    } else if (type === 'network') {
      setStatusState('networkError');
      setErrorMsg('📡 Network timeout. Unable to connect to verification gateway.');
    } else if (type === 'success') {
      setStatusState('success');
      setOtp(['4', '8', '9', '2']);
      setResendSuccessMsg('✓ Verification successful! Redirecting...');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  };

  const cardContent = (
    <View style={[s.cardContainer, isExpanded && s.cardContainerDesktop]}>
      {/* Top Header Row with Back Link */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={s.backLinkRow}
        accessibilityLabel="Change mobile number"
        activeOpacity={0.7}
      >
        <Text style={s.backIcon}>←</Text>
        <Text style={s.backLinkLabel}>Change mobile number</Text>
      </TouchableOpacity>

      {/* Title & Masked Phone Destination */}
      <Text style={s.title}>Verify your mobile number</Text>
      
      <View style={s.destinationRow}>
        <Text style={s.destinationText}>
          We sent a code to{' '}
          <Text style={s.phoneNumberBold}>{maskPhoneNumber(phone)}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Edit number"
        >
          <Text style={s.editLinkText}>Edit number</Text>
        </TouchableOpacity>
      </View>

      {/* Resend / Success Banner */}
      {resendSuccessMsg !== '' && (
        <View style={s.successBanner} accessibilityLiveRegion="polite">
          <Text style={s.successBannerText}>{resendSuccessMsg}</Text>
        </View>
      )}

      {/* Error / Lockout / Expired Banner */}
      {errorMsg !== '' && (
        <View
          style={[
            s.errorBanner,
            isLockedOut && s.lockoutBanner,
            statusState === 'expired' && s.expiredBanner,
          ]}
          accessibilityLiveRegion="assertive"
        >
          <Text style={[
            s.errorBannerText,
            isLockedOut && s.lockoutBannerText,
          ]}>
            {errorMsg}
          </Text>
        </View>
      )}

      {/* 4 Large Numeric OTP Input Cells */}
      <View style={s.otpContainer}>
        {Array(OTP_LENGTH).fill(null).map((_, i) => {
          const isFocused = focusedIdx === i;
          const isFilled = otp[i] !== '';
          const hasError = errorMsg !== '' && !resendSuccessMsg;

          return (
            <TextInput
              key={i}
              ref={r => { if (r) inputs.current[i] = r; }}
              style={[
                s.otpCell,
                isFilled && s.otpCellFilled,
                isFocused && s.otpCellFocused,
                hasError && s.otpCellError,
                isLockedOut && s.otpCellDisabled,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[i]}
              editable={!isLockedOut && !loading}
              onFocus={() => setFocusedIdx(i)}
              onChangeText={val => handleDigitChange(val, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              autoFocus={i === 0}
              accessibilityLabel={`Digit ${i + 1} of 4`}
              accessibilityHint="Enter 1 digit of verification code"
              accessibilityState={{ disabled: isLockedOut || loading }}
            />
          );
        })}
      </View>

      {/* Resend Timer & Action */}
      <View style={s.resendContainer} accessibilityLiveRegion="polite">
        {isLockedOut ? (
          <Text style={s.lockoutText}>
            Try again in <Text style={s.timerBold}>{formatTimer(lockoutTimer)}</Text>
          </Text>
        ) : resendTimer > 0 ? (
          <Text style={s.resendTimerText}>
            Resend code in <Text style={s.timerBold}>{formatTimer(resendTimer)}</Text>
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Resend code"
          >
            <Text style={s.resendActionText}>Resend code</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Action CTA */}
      <TouchableOpacity
        style={[
          s.primaryBtn,
          (!isCodeComplete || loading || isLockedOut) && s.primaryBtnDisabled
        ]}
        onPress={handleVerify}
        disabled={!isCodeComplete || loading || isLockedOut}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Verify and continue"
        accessibilityState={{ disabled: !isCodeComplete || loading || isLockedOut }}
      >
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={s.primaryBtnText}>Verifying code…</Text>
          </View>
        ) : (
          <Text style={s.primaryBtnText}>Verify and continue</Text>
        )}
      </TouchableOpacity>

      {/* Demo Error State Simulator Bar - DEV ONLY */}
      {__DEV__ && (
        <View style={s.demoBar}>
          <Text style={s.demoBarLabel}>TEST STATES:</Text>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('incorrect')}>
            <Text style={s.demoChipText}>Incorrect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('expired')}>
            <Text style={s.demoChipText}>Expired</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('lockout')}>
            <Text style={s.demoChipText}>Lockout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('rateLimit')}>
            <Text style={s.demoChipText}>Rate Limit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('network')}>
            <Text style={s.demoChipText}>Timeout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('success')}>
            <Text style={s.demoChipText}>Verified</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quiet Security Note */}
      <View style={s.securityNoteBox}>
        <Text style={s.securityNoteText}>Never share this code with anyone.</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <AppHeader showBack={true} />
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isExpanded ? (
            <View style={s.desktopWrapper}>
              {/* Desktop Left Calmer Reassurance Brand Panel (Royal Indigo) */}
              <View style={s.desktopSidePanel}>
                <View style={s.sideLogoMark}>
                  <Text style={s.sideLogoLetter}>G</Text>
                </View>

                <Text style={s.sideTagline}>AUTHENTICATION SECURITY</Text>
                <Text style={s.sideHeadline}>Secure access for your store.</Text>
                <Text style={s.sideSub}>
                  GlowVAI protects your store credentials with end-to-end encrypted OTP validation and order-scoped data privacy.
                </Text>

                <View style={s.reassuranceList}>
                  <View style={s.reassuranceRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.reassuranceText}>Direct encrypted SMS verification</Text>
                  </View>
                  <View style={s.reassuranceRow}>
                    <Ionicons name="flash-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.reassuranceText}>Single-click session restoration</Text>
                  </View>
                  <View style={s.reassuranceRow}>
                    <Ionicons name="headset-outline" size={18} style={{ color: '#475569' }} />
                    <Text style={s.reassuranceText}>24/7 Merchant partner support line</Text>
                  </View>
                </View>

                <View style={s.privacyBadge}>
                  <Text style={s.privacyBadgeText}>🔒 Encrypted Transfer • Verified Partner Portal</Text>
                </View>
              </View>

              {/* Desktop Right Verification Form Panel */}
              <View style={s.desktopFormPanel}>{cardContent}</View>
            </View>
          ) : (
            <View style={s.mobileWrapper}>{cardContent}</View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  mobileWrapper: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  desktopWrapper: {
    flexDirection: 'row',
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  desktopSidePanel: {
    flex: 1,
    backgroundColor: '#1E1B4B', // Calmer Royal Indigo Background
    padding: Spacing.xxl,
    justifyContent: 'center',
  },
  sideLogoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sideLogoLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  sideTagline: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sideHeadline: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 34,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  sideSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: '#C7D2FE',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  reassuranceList: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reassuranceIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  reassuranceText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#E0E7FF',
  },
  privacyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#C7D2FE',
  },
  desktopFormPanel: {
    flex: 1.2,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContainerDesktop: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
    maxWidth: '100%',
  },

  /* Top Header Back Link */
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  backIcon: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  backLinkLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },

  /* Titles & Destination */
  title: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  destinationText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: Colors.textSecondary,
  },
  phoneNumberBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editLinkText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  /* Banners */
  successBanner: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  successBannerText: {
    fontSize: 13,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    lineHeight: 18,
  },
  lockoutBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
  },
  lockoutBannerText: {
    color: Colors.warning,
  },
  expiredBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
  },

  /* OTP Cells */
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpCell: {
    width: 62,
    height: 62,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  otpCellFocused: {
    borderColor: Colors.primary, // Royal Blue outline
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  otpCellFilled: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    color: Colors.primary,
  },
  otpCellError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  otpCellDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    color: Colors.textMuted,
  },

  /* Resend Container */
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resendTimerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  timerBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resendActionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  lockoutText: {
    fontSize: 14,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Primary Button */
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  /* Demo Error State Simulator Bar */
  demoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoBarLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginRight: 4,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Security Note */
  securityNoteBox: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  securityNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },
});
