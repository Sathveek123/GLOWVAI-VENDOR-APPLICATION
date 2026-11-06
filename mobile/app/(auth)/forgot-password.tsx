/**
 * Password reset: Firebase sendPasswordResetEmail. The success message appears only after
 * Firebase accepted the request.
 */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AuthFrame,
  AuthLinkRow,
  Banner,
  Button,
  TextField,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { authErrorMessage, sendReset } from '../../src/features/onboarding/auth';
import { validateEmail } from '../../src/features/onboarding/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  useDocumentTitle('Reset password');

  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const emailError = validateEmail(email);

  const submit = async () => {
    setShowAll(true);
    if (emailError || busy) return;
    setBusy(true);
    setError('');
    try {
      await sendReset(email);
      setSentTo(email.trim().toLowerCase());
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toLogin = () => router.replace('/(auth)/login');

  return (
    <AuthFrame
      title="Reset your password"
      lead="Enter the email of your store account. We’ll email you a link to choose a new password."
      onBack={() => (router.canGoBack() ? router.back() : toLogin())}
      testID="forgot-password"
      below={<AuthLinkRow text="Remembered it?" link="Back to sign in" onPress={toLogin} />}
    >
      {error ? <Banner tone="error" message={error} /> : null}
      {sentTo ? (
        <Banner
          tone="success"
          title="Check your email"
          message={`If a store account uses ${sentTo}, a reset link is on its way. Open it to choose a new password, then sign in. Check your spam folder too.`}
        />
      ) : null}

      <TextField
        label="Email"
        placeholder="name@example.com"
        value={email}
        onChangeText={v => {
          setEmail(v.replace(/\s/g, ''));
          setError('');
          setSentTo('');
        }}
        error={showAll ? emailError : ''}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="send"
        onSubmitEditing={submit}
        maxLength={120}
        testID="forgot-email"
      />
      <Button label={sentTo ? 'Send the link again' : 'Send reset link'} variant={sentTo ? 'secondary' : 'primary'} onPress={submit} loading={busy} testID="forgot-submit" />
    </AuthFrame>
  );
}
