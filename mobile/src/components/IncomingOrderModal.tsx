/**
 * SCREEN 10: Incoming Order Offer Modal
 * File: mobile/src/components/IncomingOrderModal.tsx
 * High-priority real-time express order offer experience for GlowVAI Vendor
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Easing,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, BorderRadii, Spacing } from '../theme/tokens';
import type { Order } from '../store/useVendorStore';
import { soundService } from '../services/sound';

interface IncomingOrderModalProps {
  order: Order | null;
  visible: boolean;
  onAccept: (order: Order) => Promise<void> | void;
  onDecline: (order: Order) => void;
  timeoutSeconds?: number;
  claimedByOther?: boolean;
}

export default function IncomingOrderModal({
  order,
  visible,
  onAccept,
  onDecline,
  timeoutSeconds = 45,
  claimedByOther = false,
}: IncomingOrderModalProps) {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [claimingState, setClaimingState] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse & Vibration Effect
  useEffect(() => {
    if (visible && order) {
      setCountdown(timeoutSeconds);
      setClaimingState(false);
      setErrorMessage('');

      if (!isMuted) {
        try {
          Vibration.vibrate([0, 400, 200, 400], Platform.OS === 'android');
        } catch (_) {}
      }

      const loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();

      return () => {
        loopAnim.stop();
        try {
          Vibration.cancel();
        } catch (_) {}
      };
    }
  }, [visible, order, isMuted, timeoutSeconds]);

  // 45-Second Countdown Timer
  useEffect(() => {
    if (!visible || !order || claimingState || claimedByOther) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(order);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, order, claimingState, claimedByOther, onDecline]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      soundService.stopRinging();
      Vibration.cancel();
    } else {
      soundService.startRinging();
    }
  };

  const handleClaimOrder = async () => {
    if (!order || claimingState) return;

    setClaimingState(true);
    setErrorMessage('');
    Vibration.cancel();

    try {
      await onAccept(order);
    } catch (err: any) {
      setClaimingState(false);
      setErrorMessage(err.message || 'Connection timeout while claiming order. Please retry.');
    }
  };

  if (!visible || !order) return null;

  // Color dynamics: Royal Blue -> Amber (under 20s) -> Red (under 10s)
  const timerColor = countdown <= 10 ? Colors.danger : countdown <= 20 ? Colors.warning : Colors.primary;
  const progressPercent = Math.max(0, Math.min(100, (countdown / timeoutSeconds) * 100));

  // Net payout calculation (88% net vendor split)
  const grandTotal = order.pricing?.grandTotal || 1198;
  const netPayout = (grandTotal * 0.88).toFixed(2);
  const totalItemsCount = order.items?.length || 3;
  const areaLocality = (order.shippingAddress as any)?.locality || order.shippingAddress?.fullAddress || 'Benz Circle, Vijayawada';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onDecline(order)}
    >
      {/* Deep Navy / Blue-Tinted Overlay */}
      <View style={s.overlayBackdrop}>
        
        {/* Claimed by another vendor state */}
        {claimedByOther ? (
          <View style={s.claimedModalBox}>
            <Text style={s.claimedTitle}>Order No Longer Available</Text>
            <Text style={s.claimedSub}>
              This order is no longer available (claimed by a nearby store millisecond earlier). Your command center is ready for the next order.
            </Text>
            <TouchableOpacity
              style={s.dismissClaimedBtn}
              onPress={() => onDecline(order)}
              activeOpacity={0.8}
            >
              <Text style={s.dismissClaimedBtnText}>Return to Command Center</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Main Order Offer Sheet */
          <Animated.View style={[s.orderSheetCard, { transform: [{ scale: pulseAnim }] }]}>
            
            {/* Header: Title, Mute Toggle & Countdown Timer */}
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.headerTag}>New order offer</Text>
                <Text style={s.headerTitle}>Express Order #{order.orderId || 'GV-9912'}</Text>
              </View>

              {/* Mute Audio Toggle */}
              <TouchableOpacity
                style={s.muteBtn}
                onPress={toggleMute}
                activeOpacity={0.7}
                accessibilityLabel={isMuted ? 'Unmute alert sound' : 'Mute alert sound'}
              >
                <Text style={s.muteIcon}>{isMuted ? '🔇' : '🔔'}</Text>
              </TouchableOpacity>

              {/* Countdown Timer Badge */}
              <View style={[s.timerBadge, { backgroundColor: timerColor }]}>
                <Text style={s.timerText}>00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              </View>
            </View>

            {/* Horizontal Countdown Progress Bar */}
            <View style={s.progressTrackBg}>
              <View
                style={[
                  s.progressTrackFill,
                  { width: `${progressPercent}%`, backgroundColor: timerColor }
                ]}
              />
            </View>

            <View style={s.timerLabelRow}>
              <Text style={s.timerLabelText}>Accept within 00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              <Text style={s.dispatchNoticeText}>This offer is being sent to nearby stores.</Text>
            </View>

            {/* Error Message Banner if any */}
            {errorMessage !== '' && (
              <View style={s.errorBanner}>
                <Text style={s.errorBannerText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Core Information Block */}
            <ScrollView style={s.sheetScrollBody} showsVerticalScrollIndicator={false}>
              
              {/* Customer & SLA Info Row */}
              <View style={s.customerCard}>
                <View style={s.customerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.customerNameText}>
                      Customer: {order.customerName || 'Priya S.'}
                    </Text>
                    <Text style={s.customerLocalityText}>
                      📍 {areaLocality}
                    </Text>
                  </View>

                  <View style={s.slaBadge}>
                    <Text style={s.slaBadgeText}>⚡ 10-min SLA</Text>
                  </View>
                </View>

                <View style={s.packTargetRow}>
                  <Text style={s.packTargetText}>⏱️ 3-min pack target</Text>
                  <Text style={s.itemCountText}>{totalItemsCount} items in order</Text>
                </View>
              </View>

              {/* Vendor Net Payout Card */}
              <View style={s.payoutCard}>
                <View>
                  <Text style={s.payoutLabel}>VENDOR NET PAYOUT</Text>
                  <Text style={s.payoutSub}>Direct settlement (88% net split)</Text>
                </View>
                <Text style={s.payoutAmountText}>₹{netPayout}</Text>
              </View>

              {/* Compact Item Preview */}
              <View style={s.itemsSection}>
                <Text style={s.itemsSectionTitle}>ORDER ITEMS ({totalItemsCount})</Text>
                
                {order.items && order.items.length > 0 ? (
                  order.items.slice(0, 3).map((item, idx) => (
                    <View key={idx} style={s.itemRow}>
                      <Text style={s.itemNameText} numberOfLines={1}>
                        • {item.productName || (item as any).name}
                      </Text>
                      <Text style={s.itemQtyText}>x{item.quantity || 1}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={s.itemRow}>
                      <Text style={s.itemNameText} numberOfLines={1}>
                        • Minimalist 10% Niacinamide Serum 30ml
                      </Text>
                      <Text style={s.itemQtyText}>x1</Text>
                    </View>
                    <View style={s.itemRow}>
                      <Text style={s.itemNameText} numberOfLines={1}>
                        • Cetaphil Gentle Skin Cleanser 125ml
                      </Text>
                      <Text style={s.itemQtyText}>x1</Text>
                    </View>
                  </>
                )}

                {totalItemsCount > 2 && (
                  <Text style={s.moreItemsText}>+ {totalItemsCount - 2} more items in order</Text>
                )}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={s.sheetFooterRow}>
              {/* Secondary Ghost Button: Decline */}
              <TouchableOpacity
                style={s.declineGhostBtn}
                onPress={() => onDecline(order)}
                disabled={claimingState}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Decline offer"
              >
                <Text style={s.declineGhostBtnText}>Decline</Text>
              </TouchableOpacity>

              {/* Primary Action Button: Accept Order */}
              <TouchableOpacity
                style={[s.acceptPrimaryBtn, claimingState && s.acceptPrimaryBtnClaiming]}
                onPress={handleClaimOrder}
                disabled={claimingState}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Accept order"
              >
                {claimingState ? (
                  <View style={s.claimingStateWrap}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={s.claimingStateText}>Claiming order...</Text>
                  </View>
                ) : (
                  <Text style={s.acceptPrimaryBtnText}>⚡ Accept order</Text>
                )}
              </TouchableOpacity>
            </View>

          </Animated.View>
        )}

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Plain light translucent scrim
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  orderSheetCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: Colors.card, // White elevated sheet
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    maxHeight: '90%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerTag: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  muteBtn: {
    padding: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 4,
  },
  muteIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    
  },

  /* Progress Bar */
  progressTrackBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressTrackFill: {
    height: 6,
    borderRadius: 3,
  },
  timerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  timerLabelText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dispatchNoticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Error Banner */
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Body Content */
  sheetScrollBody: {
    marginBottom: Spacing.md,
  },

  /* Customer Card */
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  customerNameText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerLocalityText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slaBadge: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  slaBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  packTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  packTargetText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemCountText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Vendor Net Payout Card */
  payoutCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  payoutLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  payoutSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  payoutAmountText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },

  /* Items Section */
  itemsSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemNameText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemQtyText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  moreItemsText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },

  /* Sheet Footer Row */
  sheetFooterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  declineGhostBtn: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineGhostBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptPrimaryBtn: {
    flex: 2,
    height: 52,
    backgroundColor: Colors.primary, // Royal Blue
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptPrimaryBtnClaiming: {
    backgroundColor: Colors.primaryPressed,
  },
  acceptPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  claimingStateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  claimingStateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Claimed By Other Modal Box */
  claimedModalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  claimedTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  claimedSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  dismissClaimedBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissClaimedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
});
