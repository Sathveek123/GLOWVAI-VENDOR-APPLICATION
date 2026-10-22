/**
 * SCREEN 01: Root Splash & Session Router
 * File: mobile/app/index.tsx
 * GlowVAI Vendor App — Production Redesign (Prompt 1)
 */
import Wordmark from '../src/components/Wordmark';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, StyleSheet, Platform,
  ActivityIndicator, TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/tokens';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const auraPulseAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Status & Edge States
  const [statusText, setStatusText] = useState('Securing your workspace…');
  const [progressPercent, setProgressPercent] = useState(0);
  const [edgeState, setEdgeState] = useState<'normal' | 'slow' | 'network_error' | 'expired' | 'maintenance'>('normal');
  const [viewportWidth, setViewportWidth] = useState(width);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      document.title = "GlowVAI Vendor — Your store, always in control.";
      if (!__DEV__) return;

      const handleResize = () => setViewportWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);

      // Desktop Keyboard Shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          router.replace('/(vendor)/home');
        } else if (e.key === '1') {
          setStatusText('Workspace verified ✓ Opening dashboard…');
          setTimeout(() => router.replace('/(vendor)/home'), 300);
        } else if (e.key === '2') {
          setStatusText('Checking onboarding audit…');
          setTimeout(() => router.replace('/(onboarding)/pending'), 300);
        } else if (e.key === '3') {
          setStatusText('Opening partner login…');
          setTimeout(() => router.replace('/(auth)/login'), 300);
        } else if (e.key === 'r' || e.key === 'R') {
          setEdgeState('normal');
          setStatusText('Retrying workspace connection…');
          evaluateSessionAndRoute();
        } else if (e.key === 'm' || e.key === 'M') {
          setEdgeState('maintenance');
          setStatusText('Scheduled system maintenance in progress');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    // Fade and scale entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: useNative,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: useNative,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();

    progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.round(value * 100));
    });

    // Pulse ambient aura halo
    Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulseAnim, {
          toValue: 1.18,
          duration: 1800,
          useNativeDriver: useNative,
        }),
        Animated.timing(auraPulseAnim, {
          toValue: 0.85,
          duration: 1800,
          useNativeDriver: useNative,
        }),
      ])
    ).start();

    // Slow connection backup message after 3.5s
    const slowTimer = setTimeout(() => {
      if (edgeState === 'normal') {
        setStatusText('Connecting to GlowVAI merchant service…');
      }
    }, 3500);

    evaluateSessionAndRoute();

    return () => {
      clearTimeout(slowTimer);
      progressAnim.removeAllListeners();
    };
  }, []);

  // Three-outcome Session Evaluator
  const evaluateSessionAndRoute = async () => {
    const startTime = Date.now();
    try {
      const token = await AsyncStorage.getItem('vendor_session_token');
      const status = await AsyncStorage.getItem('vendor_onboarding_status');
      const registered = await AsyncStorage.getItem('vendor_registered');

      const elapsed = Date.now() - startTime;
      if (elapsed < 700) {
        await new Promise((r) => setTimeout(r, 700 - elapsed));
      }

      if (!token) {
        setStatusText('Opening partner login…');
        router.replace('/(auth)/login');
      } else if (status === 'step-a') {
        setStatusText('Resuming onboarding step A…');
        router.replace('/(onboarding)/step-a');
      } else if (status === 'step-b') {
        setStatusText('Resuming onboarding step B…');
        router.replace('/(onboarding)/step-b');
      } else if (status === 'step-c') {
        setStatusText('Resuming onboarding step C…');
        router.replace('/(onboarding)/step-c');
      } else if (status === 'step-d') {
        setStatusText('Resuming onboarding step D…');
        router.replace('/(onboarding)/step-d');
      } else if (status === 'pending') {
        setStatusText('Opening application review status…');
        router.replace('/(onboarding)/pending');
      } else if (status === 'approved' || registered === 'true') {
        setStatusText('Workspace verified ✓ Opening dashboard…');
        router.replace('/(vendor)/home');
      } else {
        setStatusText('Opening partner login…');
        router.replace('/(auth)/login');
      }
    } catch (err) {
      setEdgeState('network_error');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={s.root}
      accessibilityRole={Platform.OS === 'web' ? ('status' as any) : 'header'}
      accessibilityLabel="GlowVAI Vendor Desktop Application Workspace Initializing"
    >
      {/* Top Desktop Resolution Indicator Tag */}
      {Platform.OS === 'web' && (
        <View style={s.desktopResolutionHeader}>
          <View style={s.resolutionTag}>
            <Text style={s.resolutionTagText}>{`${Math.round(viewportWidth)} × ${Math.round(height)} Desktop View`}</Text>
          </View>
        </View>
      )}

      <Animated.View
        style={[
          s.contentCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Centered Royal Blue Logo Mark (76x76, 22px radius) */}
        <View style={s.logoMark}>
          <Text style={s.logoLetter}>G</Text>
        </View>

        {/* Brand Title & Subtitle */}
        <Wordmark size={30} />
        <Text style={s.subtitle}>Your store, always in control.</Text>

        {/* Loading Indicator & Refined Horizontal Progress Bar */}
        <View style={s.statusArea}>
          {edgeState === 'network_error' ? (
            <View style={s.errorCard}>
              <Text style={s.errorTitle}>Unable to reach merchant service</Text>
              <Text style={s.errorSub}>Check your network connection and retry.</Text>
              <View style={s.errorActionRow}>
                <TouchableOpacity style={s.primaryRetryBtn} onPress={() => router.replace('/(vendor)/home')}>
                  <Text style={s.primaryRetryText}>Retry Connection</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryRetryBtn} onPress={() => router.replace('/(auth)/login')}>
                  <Text style={s.secondaryRetryText}>Sign In Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : edgeState === 'maintenance' ? (
            <View style={s.errorCard}>
              <Text style={s.maintenanceTitle}>System Maintenance in Progress</Text>
              <Text style={s.errorSub}>GlowVAI merchant infrastructure is upgrading. Estimated uptime: 15 mins.</Text>
              <TouchableOpacity style={s.primaryRetryBtn} onPress={() => setEdgeState('normal')}>
                <Text style={s.primaryRetryText}>Check Uptime Status</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.loadingBox}>
              {/* Refined Progress Bar */}
              <View style={s.progressBarTrack}>
                <Animated.View style={[s.progressBarFill, { width: progressWidth }]} />
              </View>

              <View style={s.statusMetaRow}>
                <Text style={s.discreetStatusText}>{statusText}</Text>
                <Text style={s.percentText}>{`${progressPercent}%`}</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Discreet Footer Security Badge */}
      <View style={s.footer}>
        <View style={s.securityBadge}>
          <View style={s.securityDot} />
          <Text style={s.footerText}>Secure Merchant Workspace</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white canvas
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopResolutionHeader: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
  },
  resolutionTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resolutionTagText: {
    color: '#38BDF8',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  contentCard: {
    alignItems: 'center',
    maxWidth: 460,
    width: '90%',
    paddingHorizontal: 36,
    paddingVertical: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  /* Ambient Aura Halo */
  auraHalo: {
    position: 'absolute',
    top: 24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.14)', // Subtle electric violet aura
  },

  /* Royal Blue Logo Mark */
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#1D4ED8', // Royal Blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 38,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    
  },

  /* Typography */
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A', // Ink Navy
    letterSpacing: -0.6,
    
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
    color: '#64748B', // Secondary Slate
    marginTop: 6,
    letterSpacing: -0.1,
    
  },

  /* Status & Loading Area */
  statusArea: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  loadingBox: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1D4ED8', // Royal Blue gradient fill
    borderRadius: 3,
  },
  statusMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  discreetStatusText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.1,
  },
  percentText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },

  /* Error State fallback */
  errorCard: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#DC2626',
  },
  maintenanceTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#D97706',
  },
  errorSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryRetryBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryRetryText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  secondaryRetryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryRetryText: {
    color: '#475569',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  lockIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A', // Emerald active dot
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
});
