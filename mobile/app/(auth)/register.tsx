/**
 * Create a store account: Firebase email + password. Firebase sends the verification email;
 * the vendor confirms it on the next screen before filling in the store application.
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AuthFrame,
  AuthLinkRow,
  Banner,
  Button,
  PasswordField,
  TextField,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { authErrorMessage, createAccount, PHONE_SIGN_IN_NOTE } from '../../src/features/onboarding/auth';
import { PASSWORD_MIN, validateEmail, validateNewPassword } from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

const CHECKLIST = [
  'Your store address, and the pincodes you deliver to',
  'PAN, and your GSTIN if your business is GST-registered',
  'Bank account holder name, IFSC and the last 4 digits of the account number',
];

export default function RegisterScreen() {
  const router = useRouter();
  useDocumentTitle('Create account');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const errors = {
    email: validateEmail(email),
    password: validateNewPassword(password),
    confirm: !confirm ? 'Type the password again' : confirm !== password ? 'The passwords don’t match' : '',
  };

  const submit = async () => {
    setShowAll(true);
    if (errors.email || errors.password || errors.confirm || busy) return;
    setBusy(true);
    setError('');
    try {
      await createAccount(email, password);
      router.replace('/(auth)/verify-email?sent=1');
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  return (
    <AuthFrame
      title="Create your store account"
      lead="You’ll sign in with this email and password. We’ll email you a link to confirm the address."
      onBack={goBack}
      testID="register"
      below={<AuthLinkRow text="Already have an account?" link="Sign in" onPress={() => router.replace('/(auth)/login')} />}
    >
      {error ? <Banner tone="error" message={error} /> : null}

      <TextField
        label="Email"
        placeholder="name@example.com"
        value={email}
        onChangeText={v => {
          setEmail(v.replace(/\s/g, ''));
          setError('');
        }}
        error={showAll ? errors.email : ''}
        helper="Use an email you check often. Store updates go here."
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        maxLength={120}
        testID="register-email"
      />
      <PasswordField
        ref={passwordRef}
        label="Password"
        placeholder="Choose a password"
        value={password}
        onChangeText={v => {
          setPassword(v);
          setError('');
        }}
        error={showAll || password.length >= PASSWORD_MIN ? errors.password : ''}
        helper={`At least ${PASSWORD_MIN} characters. Don’t reuse a password from another site.`}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        maxLength={128}
        testID="register-password"
      />
      <PasswordField
        ref={confirmRef}
        label="Confirm password"
        placeholder="Type it again"
        value={confirm}
        onChangeText={v => {
          setConfirm(v);
          setError('');
        }}
        error={showAll ? errors.confirm : ''}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        maxLength={128}
        testID="register-confirm"
      />

      <Button label="Create account" onPress={submit} loading={busy} testID="register-submit" />

      <View style={st.checklist}>
        <Text style={st.checkTitle}>After this, keep these handy</Text>
        {CHECKLIST.map(item => (
          <View key={item} style={st.checkRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={C.primary} style={st.checkIcon} />
            <Text style={st.checkText}>{item}</Text>
          </View>
        ))}
        <Text style={st.phoneNote}>{PHONE_SIGN_IN_NOTE}</Text>
      </View>
    </AuthFrame>
  );
}

const st = StyleSheet.create({
  checklist: { marginTop: S.xl, paddingTop: S.lg, borderTopWidth: 1, borderTopColor: C.border },
  checkTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary, marginBottom: S.sm },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.sm },
  checkIcon: { marginRight: S.sm, marginTop: 2 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 21, color: C.textSecondary },
  phoneNote: { fontSize: 13, lineHeight: 19, color: C.textMuted, marginTop: S.sm },
});
