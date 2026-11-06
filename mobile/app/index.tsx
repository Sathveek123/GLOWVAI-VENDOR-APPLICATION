/**
 * Screen 01: splash and session router.
 *
 * Shows the GlowVai brand while it decides where to go (src/features/onboarding/status.ts):
 *   not signed in                      -> sign in
 *   email not verified                 -> verify email
 *   no application yet                 -> onboarding (the saved step, else step A)
 *   submitted / in review / rejected /
 *   documents requested / suspended    -> application status
 *   approved                           -> vendor home
 * When GlowVai can't be reached it shows friendly copy and "Try again", never a blank screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Wordmark, { BrandMark } from '../src/components/Wordmark';
import { resolveStartRoute } from '../src/features/onboarding/status';
import { signOutVendor } from '../src/services/session';
import { Colors, Spacing, BorderRadii, Shadows } from '../src/theme/tokens';
import { FontFamily } from '../src/theme/typography';

type Phase = { kind: 'checking' } | { kind: 'slow' } | { kind: 'failed'; message: string; code: string };

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  const mounted = useRef(true);

  const check = useCallback(
    async (force = false) => {
      setPhase({ kind: 'checking' });
      const slow = setTimeout(() => mounted.current && setPhase(p => (p.kind === 'checking' ? { kind: 'slow' } : p)), 4000);
      try {
        const result = await resolveStartRoute(force);
        if (!mounted.current) return;
        if ('route' in result) router.replace(result.route as never);
        else setPhase({ kind: 'failed', message: result.error, code: result.code });
      } catch {
        if (mounted.current) {
          setPhase({ kind: 'failed', message: 'Something went wrong while opening your account. Try again in a moment.', code: 'UNKNOWN' });
        }
      } finally {
        clearTimeout(slow);
      }
    },
    [router],
  );

  useEffect(() => {
    mounted.current = true;
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.title = 'GlowVai Seller';
    check();
    return () => {
      mounted.current = false;
    };
  }, []);

  const switchAccount = async () => {
    await signOutVendor();
    router.replace('/(auth)/login');
  };

  const notVendor = phase.kind === 'failed' && phase.code === 'NOT_A_VENDOR_ACCOUNT';

  return (
    <View style={s.root} testID="splash">
      <View style={s.brand}>
        <BrandMark size={64} />
        <Wordmark size={30} style={s.wordmark} />
        <Text style={s.tagline}>Seller app</Text>
      </View>

      <View style={s.statusArea}>
        {phase.kind === 'failed' ? (
          <View style={s.card} accessibilityRole="alert">
            <Text style={s.cardTitle}>
              {phase.code === 'NETWORK' ? 'Connection problem' : notVendor ? 'This is not a store account' : 'We couldn’t open your account'}
            </Text>
            <Text style={s.cardBody}>{phase.message}</Text>
            {notVendor ? null : (
              <Pressable
                onPress={() => check(true)}
                accessibilityRole="button"
                testID="splash-retry"
                style={({ pressed }) => [s.primary, pressed && { backgroundColor: Colors.primaryPressed }]}
              >
                <Text style={s.primaryText}>Try again</Text>
              </Pressable>
            )}
            <Pressable
              onPress={switchAccount}
              accessibilityRole="button"
              style={({ pressed }) => [notVendor ? s.primary : s.secondary, pressed && { opacity: 0.85 }]}
            >
              <Text style={notVendor ? s.primaryText : s.secondaryText}>Sign in with another account</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.loading} accessibilityRole="progressbar" accessibilityLabel="Opening GlowVai Seller">
            <ActivityIndicator color={Colors.primary} />
            <Text style={s.loadingText} accessibilityLiveRegion="polite">
              {phase.kind === 'slow' ? 'Still connecting. This can take a moment on a slow network.' : 'Opening your store'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  brand: { alignItems: 'center' },
  wordmark: { marginTop: Spacing.lg },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  statusArea: { marginTop: Spacing.xxl, width: '100%', maxWidth: 400, alignItems: 'center', minHeight: 72 },
  loading: { alignItems: 'center', gap: Spacing.sm },
  loadingText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.sheet,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary },
  cardBody: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary, marginTop: Spacing.xs },
  primary: {
    marginTop: Spacing.lg,
    minHeight: 48,
    borderRadius: BorderRadii.button,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: FontFamily.semibold, fontSize: 16, color: Colors.textOnPrimary },
  secondary: {
    marginTop: Spacing.sm,
    minHeight: 48,
    borderRadius: BorderRadii.button,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: FontFamily.semibold, fontSize: 16, color: Colors.textPrimary },
});
