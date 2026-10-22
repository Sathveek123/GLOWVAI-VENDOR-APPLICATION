/**
 * SCREEN 13: Order Packing & Rider Handover
 * Desktop 1440x1024 Guided Stage-Tracked Packing & Rider Handover Workstation
 * File: mobile/app/(vendor)/pack-order.tsx
 */
import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

type Stage = 'accepted' | 'verified' | 'sealed' | 'rider_arrived' | 'handover_complete';

interface PackItem {
  id: string;
  name: string;
  brand: string;
  variant: string;
  quantity: number;
  shelfLocation: string;
  barcode: string;
  isVerified: boolean;
}

function PackOrderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const { orders, updateOrder } = useVendorStore();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeStage, setActiveStage] = useState<Stage>('verified');
  const [sealConfirmed, setSealConfirmed] = useState(false);
  const [sealNumber, setSealNumber] = useState('GVA-9912');
  const [isReadyForRider, setIsReadyForRider] = useState(false);
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);

  // Scan simulation states
  const [scanMode, setScanMode] = useState(false);

  // Rider details state
  const [riderInfo, setRiderInfo] = useState({
    name: 'Ravi Kumar',
    vehicle: 'TVS iQube • AP 39 BK 8821',
    status: '🟢 Rider Arrived at Store Bay-01',
    eta: 'Arrived at Bay-01',
    isArrived: true,
  });

  // Packing Checklist Items
  const [packItems, setPackItems] = useState<PackItem[]>([
    { id: 'p1', name: 'Minimalist 10% Niacinamide Serum', brand: 'Minimalist', variant: '30 ml', quantity: 1, shelfLocation: 'Shelf A-01-05', barcode: '89060877701', isVerified: true },
    { id: 'p2', name: 'Cetaphil Gentle Skin Cleanser', brand: 'Cetaphil', variant: '125 ml', quantity: 1, shelfLocation: 'Shelf B-02-01', barcode: '89060877702', isVerified: true },
    { id: 'p3', name: 'Maybelline Fit Me (Shade 120 Classic Ivory)', brand: 'Maybelline', variant: '30 ml', quantity: 1, shelfLocation: 'Shelf C-04-12', barcode: '89060877703', isVerified: true },
    { id: 'p4', name: 'Dot & Key Vitamin C Sunscreen SPF 50', brand: 'Dot & Key', variant: '50 g', quantity: 1, shelfLocation: 'Shelf B-01-08', barcode: '89060877704', isVerified: false },
    { id: 'p5', name: 'L’Oréal Paris Hyaluronic Serum', brand: 'L’Oréal Paris', variant: '30 ml', quantity: 1, shelfLocation: 'Shelf A-03-02', barcode: '89060877705', isVerified: false },
  ]);

  // Pulse animation for QR Code Box
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Packing & Handover #${orderId || 'GV-9912'} | GlowVAI Vendor`;
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

  const verifiedCount = packItems.filter(i => i.isVerified).length;
  const totalCount = packItems.length;
  const allVerified = verifiedCount === totalCount;

  const toggleItemVerify = (itemId: string) => {
    setErrorMessage('');
    setPackItems(prev =>
      prev.map(it => {
        if (it.id === itemId) return { ...it, isVerified: !it.isVerified };
        return it;
      })
    );
  };

  const handleSimulateScanError = (type: 'variant' | 'quantity' | 'duplicate') => {
    if (type === 'variant') {
      setErrorMessage('⚠️ Barcode Mismatch: Scanned barcode (Shade 115) does not match customer request (Shade 120). Check SKU label.');
    } else if (type === 'quantity') {
      setErrorMessage('⚠️ Quantity Warning: Verified 1 unit, but customer order requires 2 units of this SKU.');
    } else if (type === 'duplicate') {
      setErrorMessage('⚠️ Duplicate Scan: Item #p1 (Minimalist Niacinamide) was already verified.');
    }
  };

  const handleMarkReadyForRider = async () => {
    if (!allVerified) {
      setErrorMessage(`Please verify all remaining ${totalCount - verifiedCount} items before marking ready.`);
      return;
    }
    if (!sealConfirmed) {
      setErrorMessage('Please confirm tamper-evident seal checkbox before proceeding.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await ordersApi.pack(orderId || 'GV-9912', VENDOR_ID, 'Bay-01');
      const local = orders.find(o => o.orderId === (orderId || 'GV-9912'));
      if (local) {
        updateOrder(local.orderId, { ...local, status: 'PACKED' as const, packedAt: Date.now() });
      }

      await new Promise(r => setTimeout(r, 600));
      setIsReadyForRider(true);
      setActiveStage('sealed');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark order ready for rider.');
    } finally {
      setLoading(false);
    }
  };

  // Handover is completed only on the rider-handover screen, where the rider's PIN is checked.
  const handleConfirmHandover = () => {
    router.push({ pathname: '/(vendor)/ready-pickup' as any, params: { orderId: orderId || '' } });
  };

  // Completed Handover View
  if (isHandoverCompleted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.completedWrapper}>
          <View style={s.completedIconBox}>
            <Ionicons name="bicycle-outline" size={18} color="#475569" style={s.completedIconText} />
          </View>
          <Text style={s.completedTitle}>Handover Confirmed & Dispatched 🎉</Text>
          <Text style={s.completedSub}>
            Order #{orderId || 'GV-9912'} handed over to delivery partner {riderInfo.name} ({riderInfo.vehicle}).
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
      <View style={s.desktopLayout}>

        {/* ── Desktop Left Navigation Rail ───────────────────────────────────────── */}
        {isExpanded && (
          <View style={s.navRail}>
            <View style={s.railBrandGroup}>
              <View style={s.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={s.railBrandLogoIcon} />
              </View>
              <View>
                <Wordmark size={17} />
                <Text style={s.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={s.railNavGroup}>
              <TouchableOpacity style={s.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/earnings')} activeOpacity={0.8}>
                <Ionicons name="wallet-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={s.railFooter}>
              <TouchableOpacity style={s.storeSelectorPill} activeOpacity={0.8}>
                <Text style={s.storeSelectorText} numberOfLines={1}>📍 Benz Circle Store ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railHelpBtn} activeOpacity={0.8}>
                <Text style={s.railHelpText}>Help & Support 💬</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railProfileCard} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <View style={s.railAvatar}>
                  <Text style={s.railAvatarText}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Store account</Text>
                  <Text style={s.railProfileRole}>Store Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Header */}
          <View style={s.topHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>
              <View>
                <Text style={s.breadcrumbText}>Orders / Order #{orderId || 'GV-9912'}</Text>
                <Text style={s.pageTitle}>Packing & Rider Handover Workstation</Text>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <View style={s.connectionBadge}>
                <View style={s.liveDot} />
                <Text style={s.connectionText}>🟢 WebSocket Live</Text>
              </View>
              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* Console Scrollable Body */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.container1200}>

              {/* Error / Warning Banner */}
              {errorMessage !== '' && (
                <View style={s.errorBanner}>
                  <Text style={s.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* ── GUIDED STAGE TRACKER (5 Stages) ───────────────────────────── */}
              <View style={s.stageTrackerCard}>
                <View style={s.stageStepsRow}>
                  {/* Stage 1 */}
                  <View style={[s.stageStep, s.stageStepComplete]}>
                    <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />
                    <Text style={s.stageStepLabel}>1. Order accepted</Text>
                  </View>
                  <View style={[s.stageLine, s.stageLineComplete]} />

                  {/* Stage 2 */}
                  <View style={[s.stageStep, allVerified ? s.stageStepComplete : s.stageStepActive]}>
                    <Text style={s.stageStepIcon}>{allVerified ? '✓' : '2'}</Text>
                    <Text style={s.stageStepLabel}>2. Items verified</Text>
                  </View>
                  <View style={[s.stageLine, sealConfirmed && s.stageLineComplete]} />

                  {/* Stage 3 */}
                  <View style={[s.stageStep, sealConfirmed ? s.stageStepComplete : isReadyForRider ? s.stageStepActive : s.stageStepPending]}>
                    <Text style={s.stageStepIcon}>{sealConfirmed ? '✓' : '3'}</Text>
                    <Text style={s.stageStepLabel}>3. Packed & sealed</Text>
                  </View>
                  <View style={[s.stageLine, isReadyForRider && s.stageLineComplete]} />

                  {/* Stage 4 */}
                  <View style={[s.stageStep, isReadyForRider ? s.stageStepActive : s.stageStepPending]}>
                    <Text style={s.stageStepIcon}>4</Text>
                    <Text style={s.stageStepLabel}>4. Rider arrived</Text>
                  </View>
                  <View style={s.stageLine} />

                  {/* Stage 5 */}
                  <View style={[s.stageStep, s.stageStepPending]}>
                    <Text style={s.stageStepIcon}>5</Text>
                    <Text style={s.stageStepLabel}>5. Handover complete</Text>
                  </View>
                </View>

                {/* Progress Summary Meta */}
                <View style={s.stageProgressMetaRow}>
                  <Text style={s.stageProgressMetaText}>
                    Status: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{verifiedCount} of {totalCount} items verified</Text> • Customer: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>Priya S. (Benz Circle)</Text>
                  </Text>
                  <View style={s.slaPill}>
                    <Text style={s.slaPillText}>⏱️ Target SLA: 03:45 remaining</Text>
                  </View>
                </View>
              </View>

              {/* ── 2-COLUMN DESKTOP WORKSPACE ───────────────────────────────── */}
              <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>

                {/* LEFT COLUMN (7/12): Barcode Scanner & Picking Table */}
                <View style={s.colLeft}>
                  
                  {/* Barcode Scanner Action Card */}
                  <View style={s.scanCard}>
                    <View style={s.scanCardHeader}>
                      <Text style={s.scanTitle}>📷 Barcode Scanner Active (Hands-Free Ready)</Text>
                      <TouchableOpacity style={s.scanModeBtn} onPress={() => setScanMode(!scanMode)}>
                        <Text style={s.scanModeBtnText}>{scanMode ? '⚡ Auto-Scan Active' : 'Scan Item'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.scanSub}>
                      Scan SKU barcode using wireless scanner or camera, or tap checkboxes below for manual verification.
                    </Text>

                    {/* Simulation Errors */}
                    <View style={s.simRow}>
                      <Text style={s.simLabel}>Test Scan Errors:</Text>
                      <TouchableOpacity style={s.simBtn} onPress={() => handleSimulateScanError('variant')}>
                        <Text style={s.simBtnText}>Variant Mismatch</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.simBtn} onPress={() => handleSimulateScanError('quantity')}>
                        <Text style={s.simBtnText}>Qty Mismatch</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.simBtn} onPress={() => handleSimulateScanError('duplicate')}>
                        <Text style={s.simBtnText}>Duplicate Scan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Picking Verification Table */}
                  <View style={s.sectionCard}>
                    <View style={s.sectionHeaderRow}>
                      <Text style={s.sectionTitle}>PACKING VERIFICATION TABLE</Text>
                      <Text style={s.gloveHint}>Large accessible checkboxes for store staff</Text>
                    </View>

                    <View style={s.itemList}>
                      {packItems.map(item => (
                        <View key={item.id} style={[s.itemRow, item.isVerified && s.itemRowVerified]}>
                          <TouchableOpacity
                            style={s.checkboxArea}
                            onPress={() => toggleItemVerify(item.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[s.checkbox, item.isVerified && s.checkboxVerified]}>
                              {item.isVerified && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
                            </View>
                          </TouchableOpacity>

                          <View style={{ flex: 1 }}>
                            <View style={s.brandRow}>
                              <Text style={s.brandText}>{item.brand}</Text>
                              <View style={s.shelfTag}>
                                <Text style={s.shelfTagText}>📍 {item.shelfLocation}</Text>
                              </View>
                            </View>

                            <Text style={[s.itemNameText, item.isVerified && s.itemNameTextVerified]}>
                              {item.name}
                            </Text>
                            <Text style={s.itemVariantText}>{item.variant} • Barcode: {item.barcode}</Text>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={s.qtyBadge}>Qty: {item.quantity}</Text>
                            {item.isVerified ? (
                              <View style={s.verifiedTag}>
                                <Text style={s.verifiedTagText}>✓ Verified</Text>
                              </View>
                            ) : (
                              <View style={s.pendingTag}>
                                <Text style={s.pendingTagText}>Tap to verify</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Seal Confirmation Card */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionTitle}>SEAL CONFIRMATION</Text>

                    <TouchableOpacity
                      style={s.sealCheckRow}
                      onPress={() => { setSealConfirmed(!sealConfirmed); setErrorMessage(''); }}
                      activeOpacity={0.8}
                    >
                      <View style={[s.sealCheckbox, sealConfirmed && s.sealCheckboxChecked]}>
                        {sealConfirmed && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
                      </View>
                      <Text style={s.sealCheckText}>
                        I confirm this order is packed in tamper-evident sealed packaging.
                      </Text>
                    </TouchableOpacity>

                    <View style={s.sealInputsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.inputLabel}>TAMPER SEAL SERIAL NUMBER</Text>
                        <TextInput
                          style={s.sealTextInput}
                          value={sealNumber}
                          onChangeText={setSealNumber}
                          placeholder="e.g. GVA-9912"
                        />
                      </View>
                    </View>
                  </View>

                </View>

                {/* RIGHT COLUMN (5/12): Rider Handover Card or Preparation CTA */}
                <View style={s.colRight}>
                  
                  {isReadyForRider ? (
                    /* Rider Handover Card */
                    <View style={s.riderHandoverCard}>
                      <View style={s.riderHeaderRow}>
                        <View style={s.riderAvatarBox}>
                          <Ionicons name="bicycle-outline" size={18} color="#475569" style={s.riderAvatarText} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={s.riderNameText}>{riderInfo.name}</Text>
                          <Text style={s.riderVehicleText}>{riderInfo.vehicle}</Text>
                        </View>

                        <View style={s.arrivalBadge}>
                          <Text style={s.arrivalBadgeText}>{riderInfo.status}</Text>
                        </View>
                      </View>

                      <Text style={s.qrInstructionHeader}>SHOW THIS CODE ONLY TO ASSIGNED RIDER</Text>

                      {/* High-Contrast QR Code */}
                      <Animated.View style={[s.qrBox, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="camera-outline" size={18} style={{ color: '#475569' }} />
                        <Text style={s.qrBrandText}>GlowVAI Dispatch</Text>
                        <Text style={s.qrOrderText}>#{orderId || 'GV-9912'}</Text>
                      </Animated.View>

                      <Text style={s.otpFallbackText}>
                        The rider's 4-digit PIN is entered on the handover screen.
                      </Text>

                      <TouchableOpacity
                        style={[s.confirmHandoverBtn, loading && s.confirmHandoverBtnDisabled]}
                        onPress={handleConfirmHandover}
                        disabled={loading}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={s.confirmHandoverBtnText}>Confirm Handover →</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Pre-handover Preparation Action Card */
                    <View style={s.actionCard}>
                      <Text style={s.drawerSectionLabel}>HANDOVER REQUIREMENT AUDIT</Text>
                      
                      <View style={s.auditRow}>
                        <Text style={s.auditText}>1. Verify 5 of 5 SKU items</Text>
                        <Text style={allVerified ? s.auditPass : s.auditFail}>{allVerified ? '✓ PASS' : '❌ PENDING'}</Text>
                      </View>

                      <View style={s.auditRow}>
                        <Text style={s.auditText}>2. Confirm tamper-evident seal</Text>
                        <Text style={sealConfirmed ? s.auditPass : s.auditFail}>{sealConfirmed ? '✓ PASS' : '❌ PENDING'}</Text>
                      </View>

                      {(!allVerified || !sealConfirmed) && (
                        <Text style={s.disabledExplanationText}>
                          {!allVerified
                            ? `⚠️ Verify remaining ${totalCount - verifiedCount} item(s) to enable handover button.`
                            : '⚠️ Check tamper-evident seal box above.'}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={[
                          s.ctaBtn,
                          (!allVerified || !sealConfirmed || loading) && s.ctaBtnDisabled,
                        ]}
                        onPress={handleMarkReadyForRider}
                        disabled={!allVerified || !sealConfirmed || loading}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={s.ctaBtnText}>Mark Ready for Rider →</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
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
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Navigation Rail */
  navRail: {
    width: 240,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  railNavGroup: {
    gap: 6,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  railNavLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  railNavLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  railFooter: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: 8,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingVertical: 4,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  railProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 6,
  },
  railAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railProfileName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railProfileRole: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Main Console Area */
  mainConsole: {
    flex: 1,
  },
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  /* Scroll Body */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  container1200: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
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

  /* Stage Tracker Card */
  stageTrackerCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stageStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stageStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  stageStepActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  stageStepComplete: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stageStepPending: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  stageStepIcon: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stageStepLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stageLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  stageLineComplete: {
    backgroundColor: Colors.success,
  },
  stageProgressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stageProgressMetaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slaPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  slaPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },

  /* 2-Column Grid Layout */
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridRowExpanded: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 7,
  },
  colRight: {
    flex: 5,
  },

  /* Scan Card */
  scanCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scanTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  scanModeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  scanModeBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  simLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  simBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  simBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  gloveHint: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
  },
  itemRowVerified: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  checkboxArea: {
    padding: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxVerified: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkMarkText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  brandText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  shelfTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
  },
  shelfTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  itemNameText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemNameTextVerified: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  itemVariantText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  qtyBadge: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  verifiedTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  pendingTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pendingTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },

  /* Seal Card */
  sealCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sealCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealCheckboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sealCheckIcon: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sealCheckText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  sealInputsRow: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  sealTextInput: {
    height: 38,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },

  /* Right Column Cards */
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  auditText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  auditPass: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  auditFail: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  disabledExplanationText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ctaBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Rider Handover Card */
  riderHandoverCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  riderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  riderAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  riderNameText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  riderVehicleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  arrivalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
  },
  arrivalBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  qrInstructionHeader: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  qrBox: {
    width: 160,
    height: 160,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadii.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  qrIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 40,
  },
  qrBrandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },
  qrOrderText: {
    color: Colors.primaryBorder,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  otpBoxRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpDigitBox: {
    width: 48,
    height: 52,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  otpFallbackText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  confirmHandoverBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.success,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmHandoverBtnDisabled: {
    opacity: 0.7,
  },
  confirmHandoverBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Completed Dispatched View */
  completedWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    maxWidth: 480,
    alignSelf: 'center',
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
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  completedSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  dispatchedCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dispatchedRiderName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dispatchedStatusText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  returnCommandBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnCommandBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(PackOrderScreen, 'Packing & handover');
