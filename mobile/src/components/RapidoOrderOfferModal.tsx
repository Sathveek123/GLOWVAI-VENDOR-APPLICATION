/**
 * Rapido-Style Real-Time Order Offer Modal / Card
 * ═══════════════════════════════════════════════════════════════════════════
 * Features:
 *  - 45s animated countdown ring / bar
 *  - Prominent vendor payout (₹480) & customer delivery distance (1.2 km)
 *  - High-speed 1-tap "ACCEPT ORDER" button
 *  - Instant "CLAIMED BY OTHER VENDOR" race-loss transition
 * ═══════════════════════════════════════════════════════════════════════════
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Vibration, Platform,
} from 'react-native';

interface RapidoOrderOfferProps {
  order: any | null;
  visible: boolean;
  onAccept: (order: any) => void;
  onDecline: (order: any) => void;
  isClaimedByOther?: boolean;
}

export default function RapidoOrderOfferModal({
  order,
  visible,
  onAccept,
  onDecline,
  isClaimedByOther = false,
}: RapidoOrderOfferProps) {
  const [timeLeft, setTimeLeft] = useState(45);
  const [accepting, setAccepting] = useState(false);
  const progressAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible && order) {
      setTimeLeft(45);
      setAccepting(false);
      progressAnim.setValue(1);

      // Trigger vendor alert vibration
      try {
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 400, 200, 400]);
        }
      } catch (_) {}

      // Animate progress bar down over 45s
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 45000,
        useNativeDriver: false,
      }).start();

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onDecline(order);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible, order]);

  if (!visible || !order) return null;

  const payout = order.estimatedPayout || (order.pricing?.grandTotal ? Math.round(order.pricing.grandTotal * 0.8) : 480);
  const distance = order.deliveryDistanceKm || '1.2';
  const itemsCount = order.items?.length || 2;

  const handlePressAccept = () => {
    setAccepting(true);
    onAccept(order);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.card, isClaimedByOther && s.cardClaimed]}>
          {/* Top Progress Bar */}
          {!isClaimedByOther && (
            <View style={s.progressBarBg}>
              <Animated.View
                style={[
                  s.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}

          {/* Header Tag */}
          <View style={s.tagRow}>
            <View style={[s.tagBadge, isClaimedByOther ? s.tagClaimed : s.tagNormal]}>
              <Text style={[s.tagText, isClaimedByOther ? { color: '#dc2626' } : { color: '#000' }]}>
                {isClaimedByOther ? '🚫 ORDER ALREADY CLAIMED' : '⚡ FLASH DISPATCH OFFER'}
              </Text>
            </View>

            {!isClaimedByOther && (
              <View style={s.timerBadge}>
                <Text style={s.timerText}>{timeLeft}s</Text>
              </View>
            )}
          </View>

          {isClaimedByOther ? (
            /* Race Condition Loss Screen */
            <View style={s.claimedBox}>
              <Ionicons name="flash-outline" size={36} style={{ color: '#475569' }} />
              <Text style={s.claimedTitle}>Too Slow! Order Claimed</Text>
              <Text style={s.claimedSub}>
                Another nearby store accepted this order milliseconds earlier. Staying online for the next request...
              </Text>
            </View>
          ) : (
            /* Active Offer Content */
            <>
              {/* Big Payout Hero */}
              <View style={s.payoutHero}>
                <View>
                  <Text style={s.payoutLabel}>YOU WILL EARN</Text>
                  <Text style={s.payoutAmount}>₹{payout}</Text>
                </View>
                <View style={s.distanceBadge}>
                  <Text style={s.distanceText}>📍 {distance} km away</Text>
                  <Text style={s.distanceSub}>Delivery Fleet Ready</Text>
                </View>
              </View>

              {/* Order Details Preview */}
              <View style={s.detailsCard}>
                <View style={s.customerRow}>
                  <Text style={s.customerName}>{order.customerName || 'Ananya Sharma'}</Text>
                  <Text style={s.orderIdText}>#{order.orderId || 'ORD-8921'}</Text>
                </View>

                <Text style={s.addressText} numberOfLines={1}>
                  📍 {order.shippingAddress?.fullAddress || 'Near Benz Circle, Vijayawada'}
                </Text>

                <View style={s.itemsPreview}>
                  <Text style={s.itemsCountText}>📦 {itemsCount} items to pack:</Text>
                  <Text style={s.itemsListText} numberOfLines={2}>
                    {order.items?.map((i: any) => `${i.productName || i.name} (${i.quantity || 1}x)`).join(' • ') ||
                      'Minimalist Vitamin C Serum • CeraVe Face Wash'}
                  </Text>
                </View>
              </View>

              {/* Accept & Decline Buttons (Rapido Style) */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={s.declineButton}
                  onPress={() => onDecline(order)}
                  disabled={accepting}
                >
                  <Text style={s.declineText}>✕ Pass</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.acceptButton, accepting && s.acceptButtonLoading]}
                  onPress={handlePressAccept}
                  disabled={accepting}
                  activeOpacity={0.85}
                >
                  <Text style={s.acceptText}>
                    {accepting ? '⚡ CLAIMING LOCK…' : '⚡ ACCEPT ORDER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  card: {
    width: '95%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F9D342',
  },
  cardClaimed: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagNormal: {
    backgroundColor: '#F9D342',
  },
  tagClaimed: {
    backgroundColor: '#FEE2E2',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  timerBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  payoutHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  payoutLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  payoutAmount: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#4ADE80',
    marginTop: 2,
  },
  distanceBadge: {
    alignItems: 'flex-end',
  },
  distanceText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  distanceSub: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    marginTop: 2,
  },

  detailsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  orderIdText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  addressText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
  },
  itemsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  itemsCountText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  itemsListText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    lineHeight: 16,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    width: 80,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonLoading: {
    backgroundColor: '#F59E0B',
  },
  acceptText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  claimedBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  claimedTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 6,
  },
  claimedSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
