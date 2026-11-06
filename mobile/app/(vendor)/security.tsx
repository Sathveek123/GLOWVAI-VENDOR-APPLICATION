/**
 * Sign-in and security: the account email, change password (Firebase reauthenticate +
 * updatePassword), a reset link for a forgotten password, and sign out.
 * Every success message appears only after Firebase confirmed the change.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Button, Card, InfoRow, Pill, SectionLabel, page } from '../../src/features/money/ui';
import { Banner, PasswordField } from '../../src/features/onboarding/kit';
import { authErrorCode, authErrorMessage, changePassword, sendReset } from '../../src/features/onboarding/auth';
import { PASSWORD_MIN, validateNewPassword } from '../../src/features/onboarding/validation';
import { signOutVendor, useAuthUser } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type Notice = { tone: 'error' | 'success'; text: string } | null;

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuthUser();
  const email = user?.email ?? '';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [currentError, setCurrentError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetNotice, setResetNotice] = useState<Notice>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const errors = {
    current: current ? '' : 'Enter your current password',
    next: validateNewPassword(next) || (next && next === current ? 'Choose a password different from your current one' : ''),
    confirm: !confirm ? 'Type the new password again' : confirm !== next ? 'The passwords don’t match' : '',
  };

  const save = async () => {
    setShowAll(true);
    setNotice(null);
    setCurrentError('');
    if (errors.current || errors.next || errors.confirm || saving) return;
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setShowAll(false);
      setNotice({ tone: 'success', text: 'Your password was changed. Use the new password next time you sign in.' });
    } catch (e) {
      const code = authErrorCode(e);
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        setCurrentError('Your current password is not right.');
      } else {
        setNotice({ tone: 'error', text: `Your password was not changed. ${authErrorMessage(e)}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const sendResetLink = async () => {
    if (!email) return;
    setResetBusy(true);
    setResetNotice(null);
    try {
      await sendReset(email);
      setResetNotice({ tone: 'success', text: `We sent a reset link to ${email}.` });
    } catch (e) {
      setResetNotice({ tone: 'error', text: authErrorMessage(e) });
    } finally {
      setResetBusy(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await signOutVendor();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenShell header={{ title: 'Sign-in and security', showBack: true }} backgroundColor={Colors.canvas} keyboardAvoiding>
      <View style={page.body}>
        <SectionLabel>Your account</SectionLabel>
        <Card padded={false}>
          <InfoRow
            label="Email used to sign in"
            value={email || 'Not available'}
            muted={!email}
            right={user ? <Pill label={user.emailVerified ? 'Verified' : 'Not verified'} tone={user.emailVerified ? 'success' : 'warning'} /> : undefined}
            last
          />
        </Card>

        <SectionLabel>Change password</SectionLabel>
        <Card>
          {notice ? <Banner tone={notice.tone} message={notice.text} /> : null}
          <PasswordField
            label="Current password"
            value={current}
            onChangeText={v => {
              setCurrent(v);
              setCurrentError('');
            }}
            error={currentError || (showAll ? errors.current : '')}
            autoComplete="current-password"
            textContentType="password"
            maxLength={128}
            testID="security-current"
          />
          <PasswordField
            label="New password"
            value={next}
            onChangeText={setNext}
            error={showAll ? errors.next : ''}
            helper={`At least ${PASSWORD_MIN} characters.`}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={128}
            testID="security-new"
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            error={showAll ? errors.confirm : ''}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={128}
            testID="security-confirm"
          />
          <Button label="Change password" onPress={save} loading={saving} />
        </Card>

        <Card style={{ gap: Spacing.md }}>
          <Text style={s.title}>Forgot your current password?</Text>
          <Text style={s.body}>We can email you a link to choose a new one.</Text>
          {resetNotice ? <Banner tone={resetNotice.tone} message={resetNotice.text} style={{ marginBottom: 0 }} /> : null}
          <Button label="Email me a reset link" variant="secondary" icon="mail-outline" onPress={sendResetLink} loading={resetBusy} disabled={!email} />
        </Card>

        <Card style={{ gap: Spacing.md }}>
          {confirmSignOut ? (
            <>
              <Text style={s.body}>Sign out of GlowVai Seller on this device?</Text>
              <View style={s.twoCol}>
                <Button label="Cancel" variant="secondary" onPress={() => setConfirmSignOut(false)} style={{ flex: 1 }} />
                <Button label="Sign out" variant="danger" onPress={signOut} loading={signingOut} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={() => setConfirmSignOut(true)} />
          )}
        </Card>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  title: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  body: { ...TypeScale.body, color: Colors.textSecondary },
  twoCol: { flexDirection: 'row', gap: Spacing.md },
});
