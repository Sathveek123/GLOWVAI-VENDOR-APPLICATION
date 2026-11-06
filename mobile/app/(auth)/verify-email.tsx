/**
 * Verify email. Firebase sends the link (on account creation, or "Resend" here);
 * "I've verified" reloads the user and refreshes the ID token so the server sees it.
 * Resend has a 60 second cooldown.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AuthFrame,
  AuthLinkRow,
  Banner,
  Button,
  CenteredLoader,
  useDocumentTitle,
  SellerColors as C,
  S,
} from '../../src/features/onboarding/kit';
import { authErrorMessage, refreshVerification, resendVerification } from '../../src/features/onboarding/auth';
import { authReady, signOutVendor } from '../../src/services/session';
import { clearVendorMe } from '../../src/services/vendorApi/account';
import { FontFamily } from '../../src/theme/typography';

const COOLDOWN_S = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sent?: string }>();
  useDocumentTitle('Verify email');

  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(params.sent === '1' ? COOLDOWN_S : 0);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    authReady().then(user => {
      if (!active) return;
      if (!user) return router.replace('/(auth)/login');
      if (user.emailVerified) return router.replace('/');
      setEmail(user.email ?? '');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const confirm = useCallback(async () => {
    setChecking(true);
    setNotice(null);
    try {
      const verified = await refreshVerification();
      if (verified) {
        clearVendorMe();
        router.replace('/');
        return;
      }
      setNotice({
        tone: 'warning',
        text: 'We can’t see the confirmation yet. Open the link in the email we sent, then tap the button again. Check your spam folder too.',
      });
    } catch (e) {
      setNotice({ tone: 'error', text: authErrorMessage(e) });
    } finally {
      setChecking(false);
    }
  }, [router]);

  const resend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setNotice(null);
    try {
      await resendVerification();
      setNotice({ tone: 'success', text: `We sent a new link to ${email}. Links from older emails stop working.` });
      setCooldown(COOLDOWN_S);
    } catch (e) {
      setNotice({ tone: 'error', text: authErrorMessage(e) });
    } finally {
      setSending(false);
    }
  };

  const useAnother = async () => {
    await signOutVendor();
    router.replace('/(auth)/login');
  };

  if (email === null) return <CenteredLoader label="Checking your account" />;

  return (
    <AuthFrame
      title="Confirm your email"
      lead="Before you set up your store, confirm that this email belongs to you."
      testID="verify-email"
      below={<AuthLinkRow text="Wrong email?" link="Use a different account" onPress={useAnother} testID="verify-switch" />}
    >
      <View style={st.mailCard}>
        <View style={st.mailIcon}>
          <Ionicons name="mail-unread-outline" size={22} color={C.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.mailLabel}>{params.sent === '1' ? 'We sent a link to' : 'Your account email'}</Text>
          <Text style={st.mailValue} numberOfLines={2}>
            {email}
          </Text>
        </View>
      </View>
      <Text style={st.steps}>Open the email from GlowVai and tap the link inside. Then come back here and continue.</Text>

      {notice ? <Banner tone={notice.tone} message={notice.text} /> : null}

      <Button label="I’ve verified my email" onPress={confirm} loading={checking} testID="verify-confirm" />
      <Button
        label={cooldown > 0 ? `Resend email in ${cooldown} s` : 'Resend email'}
        variant="secondary"
        onPress={resend}
        loading={sending}
        disabled={cooldown > 0}
        style={{ marginTop: S.sm }}
        testID="verify-resend"
      />
    </AuthFrame>
  );
}

const st = StyleSheet.create({
  mailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    borderWidth: 1,
    borderColor: C.primaryBorder,
  },
  mailIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  mailLabel: { fontSize: 13, lineHeight: 18, color: C.infoText },
  mailValue: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22, color: C.textPrimary },
  steps: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.lg, marginBottom: S.lg },
});
