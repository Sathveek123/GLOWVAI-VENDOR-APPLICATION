/**
 * Store sign-in: Firebase email + password (project glowvai-38bde).
 * After sign-in the splash router (app/index.tsx) decides the next screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AuthFrame,
  AuthLinkRow,
  Banner,
  Button,
  LinkButton,
  PasswordField,
  TextField,
  useDocumentTitle,
  useLayout,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { authErrorMessage, PHONE_SIGN_IN_NOTE, signIn } from '../../src/features/onboarding/auth';
import { validateEmail } from '../../src/features/onboarding/validation';
import { authReady } from '../../src/services/session';
import { clearVendorMe } from '../../src/services/vendorApi/account';

export default function LoginScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Sign in');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  // Already signed in (for example after Back): let the router decide.
  useEffect(() => {
    let active = true;
    authReady().then(user => {
      if (active && user) router.replace('/');
    });
    return () => {
      active = false;
    };
  }, []);

  const errors = {
    email: validateEmail(email),
    password: password ? '' : 'Enter your password',
  };

  const submit = async () => {
    setShowAll(true);
    if (errors.email || errors.password || busy) return;
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      clearVendorMe();
      router.replace('/');
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      title="Sign in to your store"
      lead="Use the email and password of your GlowVai Seller account."
      testID="login"
      below={
        <AuthLinkRow text="New to GlowVai?" link="Create a store account" onPress={() => router.push('/(auth)/register')} testID="login-register" />
      }
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
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        autoFocus={Platform.OS === 'web' && !isPhone}
        maxLength={120}
        testID="login-email"
      />
      <PasswordField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={v => {
          setPassword(v);
          setError('');
        }}
        error={showAll ? errors.password : ''}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        maxLength={128}
        last
        testID="login-password"
      />
      <View style={st.forgot}>
        <LinkButton label="Forgot password?" onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: email ? { email } : {} })} testID="login-forgot" />
      </View>

      <Button label="Sign in" onPress={submit} loading={busy} testID="login-submit" />

      <View style={st.note}>
        <Ionicons name="phone-portrait-outline" size={18} color={C.textSecondary} style={st.noteIcon} />
        <Text style={st.noteText}>{PHONE_SIGN_IN_NOTE}</Text>
      </View>
    </AuthFrame>
  );
}

const st = StyleSheet.create({
  forgot: { alignItems: 'flex-end', marginTop: S.xs, marginBottom: S.md, marginRight: -S.sm },
  note: { flexDirection: 'row', alignItems: 'flex-start', marginTop: S.xl, paddingTop: S.lg, borderTopWidth: 1, borderTopColor: C.border },
  noteIcon: { marginRight: S.sm, marginTop: 1 },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20, color: C.textSecondary },
});
