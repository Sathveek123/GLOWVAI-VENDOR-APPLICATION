/**
 * Account security. Shows only what the app enforces today: phone sign-in with a one-time
 * code, and sign-out on this device. Features that are not built yet say so plainly.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { vendorApi } from '../../src/services/api';
import { clearSession } from '../../src/services/session';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type LoadState = 'loading' | 'ready' | 'error';

/** Shows only the last four digits of a phone number. */
function maskPhone(phone?: string | null): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `••••••${digits.slice(-4)}`;
}

export default function SecurityScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [phone, setPhone] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [res, stored] = await Promise.all([
        vendorApi.me(),
        AsyncStorage.getItem('vendor_phone').catch(() => null),
      ]);
      setPhone(res?.vendor?.phone || stored || null);
      setState('ready');
    } catch (_) {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = async () => {
    setSigningOut(true);
    await clearSession();
    router.replace('/(auth)/login');
  };

  const maskedPhone = maskPhone(phone);
  const phoneValue =
    state === 'loading' ? 'Loading…' : state === 'error' ? 'Not available' : maskedPhone || 'Not on file';

  return (
    <ScreenShell
      header={{ title: 'Security', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
    >
      {state === 'error' ? (
        <View style={s.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.errorTitle}>We could not load your account details</Text>
            <Text style={s.errorBody}>Check your connection and try again.</Text>
          </View>
          <Pressable onPress={load} accessibilityRole="button" style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.7 }]}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={s.sectionLabel}>Sign-in</Text>
      <View style={s.card}>
        <InfoRow icon="key-outline" label="Sign-in method" value="Phone number and one-time code" />
        <InfoRow icon="call-outline" label="Phone number" value={phoneValue} />
        <InfoRow
          icon="shield-outline"
          label="Two-step verification"
          helper="An extra check at sign-in is not available yet."
          right={<StatePill label="Not set up" />}
          last
        />
      </View>

      <Text style={s.sectionLabel}>Devices</Text>
      <View style={s.card}>
        <InfoRow
          icon="phone-portrait-outline"
          label="This device"
          helper="You are signed in here now."
          right={<StatePill label="Current" tone="ok" />}
          last
        />
        <Text style={s.note}>A list of other signed-in devices is not available yet.</Text>
      </View>

      <Text style={s.sectionLabel}>Activity</Text>
      <View style={s.card}>
        <Text style={s.note}>
          Sign-in and account change history is not available yet. It will appear here once it is connected.
        </Text>
      </View>

      <Text style={s.sectionLabel}>Account</Text>
      <View style={s.card}>
        <Pressable
          onPress={() => router.push('/(vendor)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open account and store details"
          style={({ pressed }) => [s.linkRow, pressed && { backgroundColor: Colors.surface }]}
        >
          <Text style={s.linkText}>Account and store details</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
        </Pressable>

        <View style={s.signOutBox}>
          <Text style={s.signOutTitle}>Sign out on this device</Text>
          {!confirmingSignOut ? (
            <>
              <Text style={s.signOutBody}>You will need your phone and a new one-time code to sign in again.</Text>
              <Pressable
                onPress={() => setConfirmingSignOut(true)}
                accessibilityRole="button"
                style={({ pressed }) => [s.dangerOutline, pressed && { opacity: 0.8 }]}
              >
                <Text style={s.dangerOutlineText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.signOutBody}>Sign out of GlowVAI on this device now?</Text>
              <View style={s.confirmRow}>
                <Pressable
                  onPress={() => setConfirmingSignOut(false)}
                  disabled={signingOut}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={signOut}
                  disabled={signingOut}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.dangerSolid, (pressed || signingOut) && { opacity: 0.8 }]}
                >
                  {signingOut ? (
                    <ActivityIndicator color={Colors.background} />
                  ) : (
                    <Text style={s.dangerSolidText}>Sign out</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </ScreenShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  helper,
  right,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  helper?: string;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.infoLabel}>{label}</Text>
        {value ? <Text style={s.infoValue}>{value}</Text> : null}
        {helper ? <Text style={s.infoHelper}>{helper}</Text> : null}
      </View>
      {right ? <View style={s.infoRight}>{right}</View> : null}
    </View>
  );
}

function StatePill({ label, tone = 'neutral' }: { label: string; tone?: 'ok' | 'neutral' }) {
  const ok = tone === 'ok';
  return (
    <View style={[s.pill, ok ? s.pillOk : s.pillNeutral]}>
      <Text style={[s.pillText, { color: ok ? '#15803D' : Colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  errorTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  errorBody: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },
  retryBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  retryText: { ...TypeScale.bodyStrong, color: Colors.primary },

  sectionLabel: { ...TypeScale.label, color: Colors.textSecondary, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  note: { ...TypeScale.body, color: Colors.textSecondary, paddingVertical: Spacing.md },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  infoValue: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 1 },
  infoHelper: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 2 },
  infoRight: { alignItems: 'flex-end', marginLeft: Spacing.sm },

  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadii.pill, borderWidth: 1 },
  pillOk: { backgroundColor: Colors.successLight, borderColor: Colors.successBorder },
  pillNeutral: { backgroundColor: Colors.surface, borderColor: Colors.border },
  pillText: { ...TypeScale.label },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: { ...TypeScale.bodyStrong, color: Colors.primary },

  signOutBox: { paddingVertical: Spacing.lg },
  signOutTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary, marginBottom: Spacing.xs },
  signOutBody: { ...TypeScale.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  dangerOutline: {
    minHeight: 44,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
  },
  dangerOutlineText: { ...TypeScale.bodyStrong, color: Colors.danger },
  confirmRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  cancelBtn: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  cancelText: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  dangerSolid: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  dangerSolidText: { ...TypeScale.bodyStrong, color: Colors.background },
});
