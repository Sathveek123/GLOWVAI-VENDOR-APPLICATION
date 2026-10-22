/**
 * SCREEN 02: Vendor Mobile Login (+91)
 * File: mobile/app/(auth)/login.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Vendor Mobile Login | GlowVAI Partner Portal";
    }
  }, []);

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setPhone(clean);
    setSubmitError('');

    if (clean.length > 0 && !/^[6-9]/.test(clean)) {
      setValidationError('Mobile number must start with 6, 7, 8, or 9');
    } else if (clean.length > 0 && clean.length < 10) {
      setValidationError('Enter a valid 10-digit Indian mobile number');
    } else {
      setValidationError('');
    }
  };

  const isValid = phone.length === 10 && /^[6-9]/.test(phone);

  const handleSendOtp = async () => {
    if (!isValid) {
      setValidationError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    const targetPhone = phone;
    setLoading(true);
    setSubmitError('');
    try {
      await AsyncStorage.setItem('vendor_phone', `+91 ${targetPhone}`);
      await new Promise(r => setTimeout(r, 400));
      router.push('/(auth)/otp');
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to send verification code. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateError = (type: 'ratelimit' | 'network' | 'locked' | 'gateway') => {
    if (type === 'ratelimit') {
      setSubmitError('⏳ Too many OTP attempts. Please wait 60 seconds before trying again.');
    } else if (type === 'network') {
      setSubmitError('📡 Connection timeout. Retrying request via secondary gateway...');
    } else if (type === 'locked') {
      setSubmitError('🔒 Account temporarily locked due to security policy. Contact GlowVAI Support.');
    } else if (type === 'gateway') {
      setSubmitError('⚠️ SMS gateway service unavailable. Please retry in a few moments.');
    }
  };

  const formContent = (
    <View style={s.cardContainer}>
      {/* Compact Top Brand Lockup (Collapsed or Mobile) */}
      {!isExpanded && (
        <View style={s.brandLockup}>
          <View style={s.logoBadge}>
            <Text style={s.logoLetter}>G</Text>
          </View>
          <View style={s.brandTextWrap}>
            <Wordmark size={20} />
            <Text style={s.brandTag}>Merchant Portal</Text>
          </View>
        </View>
      )}

      {/* Friendly Professional Headlines */}
      <Text style={s.headline}>Welcome back, beauty partner.</Text>
      <Text style={s.supportingLine}>Sign in to manage your store, orders, inventory, and payouts.</Text>

      {/* Submit Error Banner if any */}
      {submitError !== '' && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>{submitError}</Text>
        </View>
      )}

      {/* Phone Number Input Group */}
      <View style={s.fieldGroup}>
        <View style={s.labelRow}>
          <Text style={s.label}>Mobile number</Text>
          <Text style={s.charCounter}>{`${phone.length}/10`}</Text>
        </View>
        
        <View style={[
          s.inputContainer,
          isFocused && s.inputContainerFocused,
          validationError !== '' && s.inputContainerError
        ]}>
          {/* Subtle Blue Pill +91 Prefix */}
          <View style={s.prefixPill}>
            <Text style={s.prefixText}>+91</Text>
          </View>
          
          <TextInput
            style={s.textInput}
            placeholder="98XXX XXXXX"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSendOtp}
            autoFocus={Platform.OS === 'web'}
            accessibilityLabel="Mobile number"
            accessibilityHint="Enter 10-digit Indian mobile number"
          />
        </View>

      {/* Inline Validation Error */}
        {validationError !== '' ? (
          <Text style={s.validationText}>{validationError}</Text>
        ) : null}
      </View>

      {/* Lightweight Trust Note */}
      <View style={s.trustNoteBox}>
        <Text style={s.trustNoteText}>We’ll send a secure one-time code to verify your number.</Text>
      </View>

      {/* Full-Width Primary CTA */}
      <TouchableOpacity
        style={[s.primaryBtn, (!isValid || loading) && s.primaryBtnDisabled]}
        onPress={handleSendOtp}
        disabled={!isValid || loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Send verification code"
        accessibilityState={{ disabled: !isValid || loading }}
      >
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={s.primaryBtnText}>Sending code…</Text>
          </View>
        ) : (
          <Text style={s.primaryBtnText}>Send verification code</Text>
        )}
      </TouchableOpacity>

      {/* Demo Error Simulation Bar - DEV ONLY */}
      {__DEV__ && (
        <View style={s.demoBar}>
          <Text style={s.demoBarLabel}>DEMO STATES:</Text>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateError('ratelimit')}>
            <Text style={s.demoChipText}>Rate Limit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateError('network')}>
            <Text style={s.demoChipText}>Timeout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateError('locked')}>
            <Text style={s.demoChipText}>Locked</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Secondary Link for New Partners */}
      <TouchableOpacity
        style={s.secondaryLink}
        onPress={() => router.push('/(onboarding)/step-a')}
        activeOpacity={0.7}
      >
        <Text style={s.secondaryLinkText}>
          New to GlowVAI? <Text style={s.linkHighlight}>Register your store</Text>
        </Text>
      </TouchableOpacity>

      {/* Terms of Service & Privacy Policy Below CTA */}
      <View style={s.legalFooter}>
        <Text style={s.legalText}>
          By continuing, you agree to GlowVAI’s{' '}
          <Text style={s.legalLink} onPress={() => setShowLegalModal('terms')}>Terms of Service</Text> and{' '}
          <Text style={s.legalLink} onPress={() => setShowLegalModal('privacy')}>Privacy Policy</Text>.
        </Text>
      </View>

      {/* Legal Document Modal */}
      {showLegalModal && (
        <View style={s.modalBackdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {showLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <ScrollView style={s.modalBody}>
              <Text style={s.modalParagraph}>
                {showLegalModal === 'terms'
                  ? 'GlowVAI Merchant Partner Terms govern store listings, 10-minute order fulfillments, statutory GST/TCS compliance, and weekly automated payouts. Stores agree to supply authentic beauty & cosmetics items with verified expiry dates.'
                  : 'GlowVAI Privacy Policy protects merchant phone numbers, banking credentials, and customer order details using 256-bit encryption. Order-scoped privacy automatically blocks phone numbers and UPI IDs in chat.'}
              </Text>
            </ScrollView>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowLegalModal(null)}>
              <Text style={s.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
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
              {/* Left Brand Visual Side Panel (Royal Blue to Indigo) */}
              <View style={s.desktopSidePanel}>
                <View style={s.sideLogoMark}>
                  <Text style={s.sideLogoLetter}>G</Text>
                </View>

                <Text style={s.sideTagline}>GlowVAI Merchant Portal</Text>
                <Text style={s.sideHeadline}>Merchant operations made simpler.</Text>
                <Text style={s.sideSub}>
                  The unified desktop command center for Indian beauty, skincare, and cosmetics retailers.
                </Text>

                {/* 3 Core Benefits */}
                <View style={s.benefitList}>
                  <View style={s.benefitRow}>
                    <View style={s.benefitIconBox}>
                      <Ionicons name="cube-outline" size={18} color="#C7D2FE" style={s.benefitIcon} />
                    </View>
                    <View style={s.benefitTextWrap}>
                      <Text style={s.benefitTitle}>Manage Live Orders</Text>
                      <Text style={s.benefitSub}>Real-time 10-minute dispatch pipeline & picking bin tags.</Text>
                    </View>
                  </View>

                  <View style={s.benefitRow}>
                    <View style={s.benefitIconBox}>
                      <Ionicons name="pricetags-outline" size={18} color="#C7D2FE" style={s.benefitIcon} />
                    </View>
                    <View style={s.benefitTextWrap}>
                      <Text style={s.benefitTitle}>Keep Inventory Accurate</Text>
                      <Text style={s.benefitSub}>Live shade matrix, stock steppers & AI demand SKUs.</Text>
                    </View>
                  </View>

                  <View style={s.benefitRow}>
                    <View style={s.benefitIconBox}>
                      <Ionicons name="wallet-outline" size={18} color="#C7D2FE" style={s.benefitIcon} />
                    </View>
                    <View style={s.benefitTextWrap}>
                      <Text style={s.benefitTitle}>Track Payouts Securely</Text>
                      <Text style={s.benefitSub}>Automated weekly bank settlements & UTR receipts.</Text>
                    </View>
                  </View>
                </View>

                {/* Subtle Shelf Illustration Badge */}
                <View style={s.shelfBadge}>
                  <Text style={s.shelfBadgeText}>Verified Beauty Retailer Network • Benz Circle, Vijayawada</Text>
                </View>
              </View>

              {/* Right Form Panel */}
              <View style={s.desktopFormPanel}>{formContent}</View>
            </View>
          ) : (
            <View style={s.mobileWrapper}>{formContent}</View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  desktopWrapper: {
    flexDirection: 'row',
    maxWidth: 960,
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
    flex: 1.1,
    backgroundColor: '#1E1B4B', // Rich Royal Indigo Background
    padding: Spacing.xxl,
    justifyContent: 'center',
    position: 'relative',
  },
  sideLogoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary, // Royal Blue #1D4ED8
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  sideLogoLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Fraunces_700Bold',
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
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 36,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  sideSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#C7D2FE',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  benefitList: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  benefitIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  benefitSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: '#A5B4FC',
    lineHeight: 18,
  },
  shelfBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shelfBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#E0E7FF',
  },
  desktopFormPanel: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    borderWidth: Platform.OS === 'web' ? 1 : 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Brand Lockup */
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Fraunces_700Bold',
    fontWeight: '700',
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  brandTag: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Header Typography */
  headline: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  supportingLine: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },

  /* Error Banner */
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
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },

  /* Field Styling */
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  charCounter: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  inputContainerFocused: {
    borderColor: Colors.primary, // Royal Blue Outline on Focus
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  inputContainerError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },

  /* Subtle Blue Pill (+91 Prefix) */
  prefixPill: {
    backgroundColor: Colors.primaryLight, // #EFF6FF
    borderWidth: 1,
    borderColor: Colors.primaryBorder,  // #BFDBFE
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary, // Royal Blue
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  validationText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.xs,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Trust Note */
  trustNoteBox: {
    marginBottom: Spacing.xl,
  },
  trustNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  /* Primary CTA */
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
    backgroundColor: '#94A3B8', // Clean disabled slate gray
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

  /* Demo Error Simulation Bar */
  demoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.md,
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

  /* Secondary Links & Legal */
  secondaryLink: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  secondaryLinkText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkHighlight: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  legalFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legalText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  /* Legal Modal */
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    zIndex: 100,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    maxWidth: 440,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalBody: {
    maxHeight: 180,
    marginBottom: Spacing.lg,
  },
  modalParagraph: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});
