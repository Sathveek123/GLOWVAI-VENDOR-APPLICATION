/**
 * Seller sign-in: mobile number. New and returning sellers both start here;
 * after the code is verified, new sellers continue to store registration.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  SellerHeader,
  Section,
  TextField,
  Button,
  Banner,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { normalizeIndianMobile, formatMobile, validateMobile } from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

const CHECKLIST = [
  'GSTIN and PAN of your business',
  'Bank account number and IFSC',
  'A photo of your shop front with the name board',
  'ID proof of the owner (Aadhaar, PAN card, passport or driving licence)',
];

export default function LoginScreen() {
  const router = useRouter();
  const { isPhone, isDesktop } = useLayout();
  useDocumentTitle('Sign in');

  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const error = validateMobile(phone);
  const valid = !error;

  const onChange = (v: string) => {
    setPhone(normalizeIndianMobile(v));
    setSubmitError('');
  };

  const handleSend = async () => {
    setTouched(true);
    if (!valid || loading) return;
    setLoading(true);
    setSubmitError('');
    try {
      await AsyncStorage.setItem('vendor_phone', `+91 ${phone}`);
      router.push('/(auth)/otp');
    } catch (_) {
      setSubmitError('We couldn’t continue. Check that your browser allows site storage, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <Section style={{ marginBottom: 0 }}>
      <Text accessibilityRole="header" style={[st.title, !isPhone && { fontSize: 26, lineHeight: 32 }]}>
        Sign in or register your store
      </Text>
      <Text style={st.lead}>Enter your mobile number. We{'’'}ll send a one-time code to verify it.</Text>

      {submitError ? <Banner tone="error" message={submitError} /> : null}

      <TextField
        label="Mobile number"
        prefix="+91"
        placeholder="98765 43210"
        value={formatMobile(phone)}
        onChangeText={onChange}
        onBlur={() => phone && setTouched(true)}
        onSubmitEditing={handleSend}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={16}
        autoFocus={Platform.OS === 'web' && !isPhone}
        returnKeyType="go"
        error={touched ? error : ''}
        helper={!touched && phone && error ? error : 'Indian mobile numbers only'}
        testID="login-phone"
      />

      <Button
        testID="login-submit"
        label={loading ? 'Please wait' : 'Get verification code'}
        onPress={handleSend}
        disabled={!valid}
        loading={loading}
      />

      <View style={st.newRow}>
        <Ionicons name="storefront-outline" size={18} color={C.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={st.newText}>
          <Text style={{ fontFamily: FontFamily.semibold, color: C.textPrimary }}>New to glowvai? </Text>
          Use this form to register. After you verify your number, we{'’'}ll take you through 4 short steps to set up your store.
        </Text>
      </View>
    </Section>
  );

  const checklist = (
    <View>
      <Text accessibilityRole="header" style={st.checkTitle}>
        Registering? Keep these handy
      </Text>
      {CHECKLIST.map(item => (
        <View key={item} style={st.checkRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={C.primary} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={st.checkText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={st.root}>
      <SellerHeader maxWidth={isDesktop ? 960 : 440} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[st.scroll, { paddingHorizontal: isPhone ? S.lg : S.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          {isDesktop ? (
            <View style={st.desktop}>
              <View style={st.intro}>
                <Text style={st.eyebrow}>glowvai Sellers</Text>
                <Text accessibilityRole="header" style={st.introTitle}>
                  Sell your beauty products on glowvai
                </Text>
                <Text style={st.introText}>
                  Manage your store, orders, stock and payouts from one place.
                </Text>
                <View style={{ marginTop: S.xl }}>{checklist}</View>
              </View>
              <View style={{ width: 440 }}>{form}</View>
            </View>
          ) : (
            <View style={st.single}>
              {form}
              <View style={{ marginTop: S.xl, paddingHorizontal: S.xs }}>{checklist}</View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: S.xxl },
  single: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  desktop: { width: '100%', maxWidth: 960, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 64 },
  intro: { flex: 1 },
  eyebrow: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.primary, marginBottom: S.sm },
  introTitle: { fontFamily: FontFamily.bold, fontSize: 34, lineHeight: 42, letterSpacing: -0.6, color: C.textPrimary },
  introText: { fontSize: 17, lineHeight: 26, color: C.textSecondary, marginTop: S.md },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  lead: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm, marginBottom: S.xl },
  newRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: S.xl, paddingTop: S.lg, borderTopWidth: 1, borderTopColor: C.border },
  newText: { flex: 1, fontSize: 14, lineHeight: 21, color: C.textSecondary },
  checkTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: C.textPrimary, marginBottom: S.md },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.sm + 2 },
  checkText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textSecondary },
});
