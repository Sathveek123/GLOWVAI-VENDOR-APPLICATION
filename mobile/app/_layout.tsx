import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text as RNText, View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { FontFamily } from '../src/theme/typography';
import { Colors } from '../src/theme/tokens';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { getConfigStatus, CONFIG_ERROR_COPY, type ConfigStatus } from '../src/config/env';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Checked once at start-up. A misconfigured production build shows a plain error screen
// instead of running against a missing or local server (see src/config/env.ts).
const CONFIG = getConfigStatus();

// Any text without an explicit family uses the interface family.
const TextDefaults = RNText as unknown as { defaultProps?: object };
TextDefaults.defaultProps = {
  ...(TextDefaults.defaultProps ?? {}),
  style: { fontFamily: FontFamily.regular },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  // Render once fonts are ready, once loading has failed, or after 3 seconds at most
  // (the system font is the fallback), so the app never stays on a blank screen.
  const [timedOut, setTimedOut] = useState(false);
  const ready = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Safety net: never keep the splash up longer than 3 seconds.
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  if (!CONFIG.ok) return <ConfigErrorScreen status={CONFIG} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.card} translucent={false} />
      <ErrorBoundary screen="GlowVai Seller">
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(vendor)" />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

/** Plain, dependency-free screen for a build that is missing its server settings. */
function ConfigErrorScreen({ status }: { status: ConfigStatus }) {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.card} translucent={false} />
      <ScrollView style={cfg.root} contentContainerStyle={cfg.content}>
        <View style={cfg.card} accessibilityRole="alert">
          <RNText style={cfg.title}>{CONFIG_ERROR_COPY.title}</RNText>
          <RNText style={cfg.message}>{CONFIG_ERROR_COPY.message}</RNText>
          {status.issues.length ? (
            <View style={cfg.details}>
              <RNText style={cfg.detailsLabel}>{CONFIG_ERROR_COPY.detailsLabel}</RNText>
              {status.issues.map(issue => (
                <RNText key={issue.key + issue.message} style={cfg.detail}>
                  {issue.key} {issue.message}
                </RNText>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const cfg = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas },
  content: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  title: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary },
  message: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22, color: Colors.textSecondary, marginTop: 8 },
  details: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  detailsLabel: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  detail: { fontFamily: FontFamily.mono, fontSize: 12, lineHeight: 18, color: Colors.textSecondary },
});
