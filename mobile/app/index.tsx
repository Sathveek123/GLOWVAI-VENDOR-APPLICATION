/**
 * Screen 01: splash and session router.
 *
 * Shows the GlowVai brand while it decides where to go:
 *   no session                     -> sign in
 *   signed in, nothing submitted   -> the onboarding step to resume
 *   application not approved       -> application status
 *   approved                       -> dashboard
 * When the server can't be reached and nothing is cached, it shows a calm offline card;
 * "Try again" re-runs the same session check.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Wordmark, { BrandMark } from '../src/components/Wordmark';
import { resolveStartRoute } from '../src/features/onboarding/status';
import { Colors, Spacing, BorderRadii, Shadows } from '../src/theme/tokens';
import { FontFamily } from '../src/theme/typography';

type Phase = 'checking' | 'slow' | 'offline' | 'error';

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('checking');
  const mounted = useRef(true);

  const check = useCallback(async () => {
    setPhase('checking');
    const slow = setTimeout(() => mounted.current && setPhase(p => (p === 'checking' ? 'slow' : p)), 4000);
    try {
      const result = await resolveStartRoute();
      if (!mounted.current) return;
      if ('route' in result) router.replace(result.route as any);
      else setPhase('offline');
    } catch (_) {
      if (mounted.current) setPhase('error');
    } finally {
      clearTimeout(slow);
    }
  }, [router]);

  useEffect(() => {
    mounted.current = true;
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.title = 'GlowVai Seller';
    check();
    return () => {
      mounted.current = false;
    };
  }, []);

  const failed = phase === 'offline' || phase === 'error';

  return (
    <View style={s.root} testID="splash">
      <View style={s.brand}>
        <BrandMark size={64} />
        <Wordmark size={30} style={s.wordmark} />
        <Text style={s.tagline}>Seller app</Text>
      </View>

      <View style={s.statusArea}>
        {failed ? (
          <View style={s.card} accessibilityRole="alert">
            <Text style={s.cardTitle}>{phase === 'offline' ? 'You’re offline' : 'We couldn’t open your account'}</Text>
            <Text style={s.cardBody}>
              {phase === 'offline'
                ? 'We couldn’t reach GlowVai. Check your internet connection, then try again.'
                : 'Something went wrong while checking your sign-in. Try again in a moment.'}
            </Text>
            <Pressable
              onPress={check}
              accessibilityRole="button"
              testID="splash-retry"
              style={({ pressed }) => [s.primary, pressed && { backgroundColor: Colors.primaryPressed }]}
            >
              <Text style={s.primaryText}>Try again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
              style={({ pressed }) => [s.secondary, pressed && { backgroundColor: Colors.surface }]}
            >
              <Text style={s.secondaryText}>Sign in again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.loading} accessibilityRole="progressbar" accessibilityLabel="Opening GlowVai Seller">
            <ActivityIndicator color={Colors.primary} />
            <Text style={s.loadingText} accessibilityLiveRegion="polite">
              {phase === 'slow' ? 'Still connecting. This can take a moment on a slow network.' : 'Opening your store'}
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
