/**
 * Approved Screen — You're live on Glowvai!
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui';
import AppHeader from '../../src/components/AppHeader';

export default function ApprovedScreen() {
  const router    = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
    }).start();
    AsyncStorage.setItem('vendor_registered', 'true');
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <AppHeader title="Application status" subtitle="Account Approved & Live" />
      <View style={s.body}>
        <Animated.View style={[s.successDot, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />
        </Animated.View>
        <Text style={s.heading}>You're live on Glowvai</Text>
        <Text style={s.sub}>Your shop is now visible to nearby customers. Start receiving orders!</Text>

        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statN}>0</Text><Text style={s.statL}>Orders</Text></View>
          <View style={s.stat}><Text style={s.statN}>₹0</Text><Text style={s.statL}>Earnings</Text></View>
          <View style={s.stat}><Text style={s.statN}>—</Text><Text style={s.statL}>Rating</Text></View>
        </View>
      </View>

      <View style={s.foot}>
        <PrimaryButton label="Go to Home" onPress={() => router.replace('/(vendor)/home')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 14 },
  successDot: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  check:   { color: '#fff', fontSize: 34, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  heading: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.ink, textAlign: 'center' },
  sub:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.sub, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  statsRow:{ flexDirection: 'row', gap: 10, marginTop: 10 },
  stat:    { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: 'center' },
  statN:   { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.ink },
  statL:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: Colors.sub, marginTop: 2 },
  foot:    { padding: Spacing.lg, paddingBottom: 32 },
});
