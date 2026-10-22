/**
 * SCREEN 13 (Part B): Rider Handover & Pickup Verification
 * File: mobile/app/(vendor)/ready-pickup.tsx
 * High-contrast QR code, 4-digit pickup OTP, live rider ETA & handover confirmation
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

type EdgeState = 'normal' | 'delayed' | 'reassigned' | 'invalid_code' | 'qr_failure' | 'duplicate' | 'network_loss' | 'already_dispatched';

export default function ReadyPickupScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, updateOrder } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [activeEdgeState, setActiveEdgeState] = useState<EdgeState>('normal');
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);

  // Rider details dynamically updated based on state
  const [riderInfo, setRiderInfo] = useState({
    name: 'Ravi Kumar',
    phone: '9876543210',
    vehicle: 'TVS iQube • AP 39 BK 8821',
    status: '🟢 Rider Arrived at Store Bay-01',
    eta: 'Arrived',
  });

  // Pulse animation for QR Code Box
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Rider Handover #${orderId || 'GV-9912'} | GlowVAI Vendor`;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [orderId]);

  const order = orders.find(o => o.orderId === (orderId || 'GV-9912'));
  // The expected PIN comes only from the order record. Never fall back to a constant.
  const pickupCode = order?.otp || '';

  // Toggle edge states for demo/testing
  const handleSelectEdgeState = (state: EdgeState) => {
    setActiveEdgeState(state);
    setErrorMessage('');

    switch (state) {
      case 'delayed':
        setRiderInfo({
          name: 'Ravi Kumar',
          phone: '9876543210',
          vehicle: 'TVS iQube • AP 39 BK 8821',
          status: '⏱️ Delayed in traffic',
          eta: 'Est. 6 mins away (Delayed)',
        });
        setErrorMessage('⏱️ Rider Attention: Ravi Kumar is delayed by heavy rain/traffic. Updated ETA: 6 mins.');
        break;

      case 'reassigned':
        setRiderInfo({
          name: 'S. Vikram',
          phone: '9812345678',
          vehicle: 'Ather 450X • AP 39 CS 4410',
          status: '🔄 Reassigned Rider Assigned',
          eta: 'Arriving in 3 mins',
        });
        setErrorMessage('🔄 Rider Reassigned: S. Vikram has taken over delivery from Ravi Kumar.');
        break;

      case 'invalid_code':
        setErrorMessage('❌ Invalid Code: Entered pickup code does not match order record. Verify 4-digit PIN 4892.');
        break;

      case 'qr_failure':
        setErrorMessage('⚠️ QR Scan Failure: Camera barcode scan failed due to glare. Please read out fallback 4-digit code: 4892.');
        break;

      case 'duplicate':
        setErrorMessage('⛔ Duplicate Handover Attempt: Order #GV-9912 was already marked as handed over at 01:42 PM.');
        break;

      case 'network_loss':
        setErrorMessage('📶 Network Loss: Connection lost. Verification queued offline. Will sync once reconnected.');
        break;

      case 'already_dispatched':
        setErrorMessage('📦 Already Dispatched: Order #GV-9912 was already handed over to rider at 01:38 PM.');
        setIsHandoverCompleted(true);
        break;

      default:
        setRiderInfo({
          name: 'Ravi Kumar',
          phone: '9876543210',
          vehicle: 'TVS iQube • AP 39 BK 8821',
          status: '🟢 Rider Arrived at Store Bay-01',
          eta: 'Arrived',
        });
        setErrorMessage('');
        break;
    }
  };

  // Confirm Handover Handler
  const handleConfirmHandover = async () => {
    if (activeEdgeState === 'network_loss') {
      setErrorMessage('📶 Network Loss: Retrying connection to verify OTP...');
      return;
    }
    if (activeEdgeState === 'invalid_code') {
      setErrorMessage('❌ Cannot complete handover: Invalid verification code.');
      return;
    }
    if (!pickupCode) {
      setErrorMessage('Pickup PIN is unavailable for this order. Do not hand over the parcel.');
      return;
    }
    if (enteredPin !== pickupCode) {
      setErrorMessage('Pickup PIN does not match this order. Ask the rider to check the code again.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await ordersApi.dispatch(orderId || 'GV-9912', {
        riderName: riderInfo.name,
        riderPhone: riderInfo.phone,
        otp: enteredPin,
      });

      if (order) {
        updateOrder(order.orderId, {
          ...order,
          status: 'DISPATCHED' as const,
          dispatchedAt: Date.now(),
        });
      }

      await new Promise(r => setTimeout(r, 600));
      setIsHandoverCompleted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Handover verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Completed Handover View
  if (isHandoverCompleted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.completedWrapper}>
          <View style={s.completedIconBox}>
            <Ionicons name="bicycle-outline" size={18} color="#475569" style={s.completedIconText} />
          </View>
          <Text style={s.completedTitle}>Handover Confirmed & Dispatched</Text>
          <Text style={s.completedSub}>
            Order #{orderId || 'GV-9912'} has been handed over to delivery partner {riderInfo.name}.
          </Text>

          <View style={s.dispatchedCard}>
            <Text style={s.dispatchedRiderName}>{riderInfo.name} • {riderInfo.vehicle}</Text>
            <Text style={s.dispatchedStatusText}>✓ 10-min quick commerce delivery dispatch active</Text>
          </View>

          <TouchableOpacity
            style={s.returnCommandBtn}
            onPress={() => router.replace('/(vendor)/home')}
            activeOpacity={0.8}
          >
            <Text style={s.returnCommandBtnText}>Return to Command Center →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Top Header */}
      <View style={s.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityLabel="Go back to order detail"
          activeOpacity={0.7}
        >
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Rider Handover #{orderId || 'GV-9912'}</Text>
          <Text style={s.headerSub}>Customer: Priya S. • Benz Circle (Privacy Safe)</Text>
        </View>

        <View style={s.readyPill}>
          <Text style={s.readyPillText}>READY FOR PICKUP</Text>
        </View>
      </View>

      {/* Main Body Scroll */}
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.contentWrapper, isExpanded && s.contentWrapperExpanded]}>
          
          {/* Edge State Simulation Toolbar */}
          {__DEV__ && (
          <View style={s.simCard}>
            <Text style={s.simTitle}>TEST RIDER HANDOVER EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'normal' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('normal')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'normal' && s.simChipTextActive]}>Arrived</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'delayed' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('delayed')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'delayed' && s.simChipTextActive]}>Rider Delayed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'reassigned' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('reassigned')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'reassigned' && s.simChipTextActive]}>Reassigned</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'invalid_code' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('invalid_code')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'invalid_code' && s.simChipTextActive]}>Invalid Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'qr_failure' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('qr_failure')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'qr_failure' && s.simChipTextActive]}>QR Fail</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'duplicate' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('duplicate')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'duplicate' && s.simChipTextActive]}>Duplicate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'network_loss' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('network_loss')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'network_loss' && s.simChipTextActive]}>Network Loss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, activeEdgeState === 'already_dispatched' && s.simChipActive]}
                onPress={() => handleSelectEdgeState('already_dispatched')}
              >
                <Text style={[s.simChipText, activeEdgeState === 'already_dispatched' && s.simChipTextActive]}>Dispatched</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Error Banner */}
          {errorMessage !== '' && (
            <View style={[
              s.errorBanner,
              activeEdgeState === 'delayed' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
              activeEdgeState === 'reassigned' && { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
            ]}>
              <Text style={[
                s.errorBannerText,
                activeEdgeState === 'delayed' && { color: '#B45309' },
                activeEdgeState === 'reassigned' && { color: '#1D4ED8' },
              ]}>{errorMessage}</Text>
            </View>
          )}

          {/* Assigned Rider Info Card */}
          <View style={s.riderCard}>
            <View style={s.riderHeaderRow}>
              <View style={s.riderAvatarBox}>
                <Ionicons name="bicycle-outline" size={18} color="#475569" style={s.riderAvatarText} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.riderNameText}>{riderInfo.name}</Text>
                <Text style={s.riderVehicleText}>{riderInfo.vehicle}</Text>
              </View>

              {/* Rider Arrival Status Tag */}
              <View style={[
                s.arrivalBadge,
                activeEdgeState === 'delayed' && { backgroundColor: '#FEF3C7' },
                activeEdgeState === 'reassigned' && { backgroundColor: '#EFF6FF' },
              ]}>
                <Text style={[
                  s.arrivalBadgeText,
                  activeEdgeState === 'delayed' && { color: '#B45309' },
                  activeEdgeState === 'reassigned' && { color: '#1D4ED8' },
                ]}>{riderInfo.status}</Text>
              </View>
            </View>

            <View style={s.riderEtaRow}>
              <Text style={s.riderEtaText}>📍 Store Bay: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>Bay-01</Text></Text>
              <Text style={s.riderEtaTimeText}>Live ETA: {riderInfo.eta}</Text>
            </View>
          </View>

          {/* High-Contrast QR Code & 4-Digit Pickup Code */}
          <View style={s.qrSectionCard}>
            <Text style={s.qrNoticeHeader}>SHOW THIS CODE ONLY TO ASSIGNED RIDER</Text>

            {/* High Contrast QR Code Box */}
            <Animated.View style={[s.qrBox, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="qr-code-outline" size={36} color="#FFFFFF" />
              <Text style={s.qrBrandText}>GlowVAI Dispatch</Text>
              <Text style={s.qrOrderText}>#{orderId || 'GV-9912'}</Text>
            </Animated.View>

            {/* Rider enters the 4-digit pickup PIN. The expected PIN is never shown here. */}
            <Text style={s.otpFallbackText}>
              {pickupCode
                ? "Ask the rider for their 4-digit pickup PIN and enter it below."
                : "Pickup PIN unavailable for this order. Handover is blocked."}
            </Text>
            <TextInput
              style={s.pinInput}
              value={enteredPin}
              onChangeText={(v) => setEnteredPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              editable={!!pickupCode && !loading}
              placeholder="0000"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Rider pickup PIN"
              accessibilityHint="Enter the 4-digit pickup PIN from the rider"
            />
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.stickyFooter}>
        <View style={s.footerContainer}>
          <TouchableOpacity
            style={[s.ctaBtn, loading && s.ctaBtnDisabled]}
            onPress={handleConfirmHandover}
            disabled={loading || !pickupCode || enteredPin.length !== 4}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Confirm handover"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.ctaBtnText}>Confirm handover →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  readyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  readyPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
  },
  contentWrapperExpanded: {
    maxWidth: 680,
  },
  /* Simulation Toolbar */
  simCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  simTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  simScrollContainer: {
    gap: Spacing.xs,
  },
  simChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  simChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  simChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Rider Card */
  riderCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  riderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  riderAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  riderNameText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  riderVehicleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrivalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  arrivalBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  riderEtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  riderEtaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  riderEtaTimeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  /* High Contrast QR Code Section */
  qrSectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrNoticeHeader: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  qrBox: {
    width: 180,
    height: 180,
    backgroundColor: '#0F172A', // High contrast dark slate/navy
    borderRadius: BorderRadii.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  qrIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 48,
    marginBottom: 4,
  },
  qrBrandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
  },
  qrOrderText: {
    color: Colors.primaryBorder,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  otpBoxRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  otpDigitBox: {
    width: 52,
    height: 56,
    borderRadius: BorderRadii.card,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitText: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  pinInput: {
    alignSelf: "center",
    width: 180,
    height: 56,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    textAlign: "center",
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: "700",
    letterSpacing: 8,
    color: Colors.textPrimary,
    backgroundColor: "#FFFFFF",
  },
  otpFallbackText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* Completed State */
  completedWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  completedIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  completedIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 36,
  },
  completedTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  completedSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  dispatchedCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  dispatchedRiderName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dispatchedStatusText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  returnCommandBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnCommandBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Sticky Footer CTA */
  stickyFooter: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
  },
  footerContainer: {
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  ctaBtn: {
    height: 52,
    backgroundColor: Colors.primary, // Royal Blue
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
});
