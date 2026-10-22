/**
 * SCREEN 08: Onboarding Audit & Approval Status
 * Desktop 1440x1024 Reference Layout with 2-Column Responsive Widescreen Grid (1200px max-width)
 * File: mobile/app/(onboarding)/pending.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import AppHeader from '../../src/components/AppHeader';
import useVendorStore from '../../src/store/useVendorStore';

type StatusType = 'under_review' | 'action_needed' | 'rejected' | 'approved' | 'maintenance';

interface TimelineStep {
  id: string;
  title: string;
  subtitle: string;
  status: 'verified' | 'in_progress' | 'needs_attention' | 'not_started' | 'rejected';
  timestamp?: string;
}

export default function PendingVerification() {
  const router = useRouter();
  const { setVendor } = useVendorStore();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [status, setStatus] = useState<StatusType>('under_review');
  const [lastCheckedTime, setLastCheckedTime] = useState('10:42 PM');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showSubmittedDetails, setShowSubmittedDetails] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Timeline Steps Configuration
  const [timeline, setTimeline] = useState<TimelineStep[]>([
    {
      id: 'step_1',
      title: 'GSTIN & PAN documents',
      subtitle: 'Waiting for the tax documents to be submitted',
      status: 'not_started',
      timestamp: '',
    },
    {
      id: 'step_2',
      title: 'Bank account verification',
      subtitle: 'Waiting for the payout account to be submitted',
      status: 'not_started',
      timestamp: '',
    },
    {
      id: 'step_3',
      title: 'Store location and geo-fence',
      subtitle: 'Checking 3.5km store quick-commerce delivery zone',
      status: 'in_progress',
      timestamp: 'In progress now',
    },
    {
      id: 'step_4',
      title: 'Final approval',
      subtitle: 'Merchant activation & catalog indexing',
      status: 'not_started',
      timestamp: 'Upcoming',
    },
  ]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Store Audit & Approval Status | GlowVAI Vendor";
    }

    loadSubmittedData();
    checkStatus();
  }, []);

  const loadSubmittedData = async () => {
    try {
      const stepA = await AsyncStorage.getItem('onb_step_a');
      const stepB = await AsyncStorage.getItem('onb_step_b');
      const stepC = await AsyncStorage.getItem('onb_step_c');
      const stepD = await AsyncStorage.getItem('onb_step_d');

      setSubmittedData({
        stepA: stepA ? JSON.parse(stepA) : null,
        stepB: stepB ? JSON.parse(stepB) : null,
        stepC: stepC ? JSON.parse(stepC) : null,
        stepD: stepD ? JSON.parse(stepD) : null,
      });
    } catch (e) {
      // Ignore
    }
  };

  const checkStatus = async () => {
    setIsRefreshing(true);
    setIsOffline(false);
    try {
      const now = new Date();
      setLastCheckedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const storedStatus = await AsyncStorage.getItem('vendor_onboarding_status');
      if (storedStatus === 'approved') {
        setStatus('approved');
      } else if (storedStatus === 'action_needed') {
        setStatus('action_needed');
      } else if (storedStatus === 'rejected') {
        setStatus('rejected');
      } else {
        setStatus('under_review');
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const autoRouteApproved = async () => {
    await AsyncStorage.setItem('vendor_registered', 'true');
    await AsyncStorage.setItem('vendor_session_token', 'TOKEN_VND_AUTH_ACTIVE');
    setVendor({
      vendorId: 'VND-001',
      name: submittedData?.stepA?.storeName || 'Your store',
      storeId: 'DS-VIJ-01',
      phone: '9876543210',
      email: 'vendor@glowvai.com',
      isOnline: true,
    });
    router.replace('/(vendor)/home');
  };

  const handleOpenSupportWhatsApp = () => {
    const text = encodeURIComponent("Hello GlowVAI Support, I have a query about my store application.");
    Linking.openURL(`https://wa.me/9118001234567?text=${text}`).catch(() => {
      Linking.openURL('tel:18001234567');
    });
  };

  const handleOpenSupportPhone = () => {
    Linking.openURL('tel:18001234567');
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Top Navigation Bar */}
      <AppHeader
        title="Application status"
        subtitle="Merchant Compliance Audit Workspace"
        rightActions={
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={s.logoutText}>Sign out</Text>
          </TouchableOpacity>
        }
      />

      {/* Main Body Layout */}
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.maxContainer, isExpanded && s.maxContainerExpanded]}>
          
          {/* Offline Banner if disconnected */}
          {isOffline && (
            <View style={s.offlineBanner}>
              <Text style={s.offlineBannerText}>📡 Network connection offline. Status will update automatically when reconnected.</Text>
            </View>
          )}

          {/* Interactive Demo Audit State Switcher */}
          {__DEV__ && (
            <View style={s.demoStateBar}>
              <Text style={s.demoStateLabel}>Test Audit Edge States:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.demoChipRow}>
                <TouchableOpacity
                  style={[s.demoChip, status === 'under_review' && s.demoChipActive]}
                  onPress={() => setStatus('under_review')}
                >
                  <Text style={[s.demoChipText, status === 'under_review' && s.demoChipTextActive]}>Under Review (Default)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, status === 'action_needed' && s.demoChipActive]}
                  onPress={() => setStatus('action_needed')}
                >
                  <Text style={[s.demoChipText, status === 'action_needed' && s.demoChipTextActive]}>Action Needed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, status === 'rejected' && s.demoChipActive]}
                  onPress={() => setStatus('rejected')}
                >
                  <Text style={[s.demoChipText, status === 'rejected' && s.demoChipTextActive]}>Rejected State</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, status === 'approved' && s.demoChipActive]}
                  onPress={() => setStatus('approved')}
                >
                  <Text style={[s.demoChipText, status === 'approved' && s.demoChipTextActive]}>Approved Launch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.demoChip, status === 'maintenance' && s.demoChipActive]}
                  onPress={() => setStatus('maintenance')}
                >
                  <Text style={[s.demoChipText, status === 'maintenance' && s.demoChipTextActive]}>Maintenance Mode</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* STATUS VARIANT: UNDER REVIEW */}
          {status === 'under_review' && (
            <>
              {/* Application Summary Hero Header Card */}
              <View style={s.heroCard}>
                <View style={s.heroBadgeWrap}>
                  <View style={s.heroBadgeIconBox}>
                    <Text style={s.heroBadgeIcon}>⏳</Text>
                  </View>
                  <View style={s.reviewPill}>
                    <Text style={s.reviewPillText}>Compliance Check In Progress</Text>
                  </View>
                </View>

                <Text style={s.headline}>Your store is under review</Text>
                <Text style={s.supportingCopy}>
                  We’re checking your business tax documents, bank payout details, and store geo-fence. We’ll activate your command center as soon as verification completes.
                </Text>

                {/* Reference Meta Box */}
                <View style={s.refInfoCard}>
                  <View style={s.refInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.refLabel}>APPLICATION REF ID</Text>
                      <Text style={s.refValue}>Assigned after submission</Text>
                    </View>

                    <View style={s.refDivider} />

                    <View style={{ flex: 1 }}>
                      <Text style={s.refLabel}>SUBMITTED ON</Text>
                      <Text style={s.refSubValue}>Not submitted yet</Text>
                    </View>

                    <View style={s.refDivider} />

                    <View style={{ flex: 1 }}>
                      <Text style={s.refLabel}>LAST UPDATED</Text>
                      <Text style={s.refSubValue}>Updated at {lastCheckedTime}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2-Column Responsive Widescreen Desktop Grid */}
              <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>
                
                {/* Primary Column (7/12): Vertical Audit Timeline */}
                <View style={s.colLeft}>
                  <View style={s.sectionCard}>
                    <View style={s.sectionHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.sectionTitle}>Audit verification timeline</Text>
                        <Text style={s.sectionSub}>Live status of required merchant compliance checks</Text>
                      </View>
                      <TouchableOpacity
                        onPress={checkStatus}
                        disabled={isRefreshing}
                        style={s.refreshBtn}
                        activeOpacity={0.7}
                      >
                        {isRefreshing ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <Text style={s.refreshBtnText}>↻ Refresh status</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={s.timelineContainer}>
                      {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        return (
                          <View key={step.id} style={s.timelineRow}>
                            <View style={s.timelineColumnLeft}>
                              {renderStepIndicator(step.status)}
                              {!isLast && <View style={s.timelineConnectorLine} />}
                            </View>

                            <View style={s.timelineColumnRight}>
                              <View style={s.stepHeaderRow}>
                                <Text style={[
                                  s.stepTitle,
                                  step.status === 'in_progress' && s.stepTitleActive,
                                  step.status === 'not_started' && s.stepTitleMuted
                                ]}>
                                  {step.title}
                                </Text>
                                {step.timestamp && (
                                  <Text style={s.stepTimestamp}>{step.timestamp}</Text>
                                )}
                              </View>
                              <Text style={s.stepSub}>{step.subtitle}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Secondary Column (5/12): Next Steps & Read-Only Application Details */}
                <View style={s.colRight}>
                  
                  {/* "What happens next?" Card */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionTitle}>What happens next?</Text>
                    <View style={s.nextBulletList}>
                      <View style={s.nextBulletRow}>
                        <Text style={s.nextBulletIcon}>1️⃣</Text>
                        <Text style={s.nextBulletText}>
                          Compliance officers verify tax dossiers, PAN, and storefront photos in background.
                        </Text>
                      </View>
                      <View style={s.nextBulletRow}>
                        <Text style={s.nextBulletIcon}>2️⃣</Text>
                        <Text style={s.nextBulletText}>
                          GlowVAI may request clarification via phone/WhatsApp if document details require update.
                        </Text>
                      </View>
                      <View style={s.nextBulletRow}>
                        <Text style={s.nextBulletIcon}>3️⃣</Text>
                        <Text style={s.nextBulletText}>
                          Approved stores immediately unlock the Desktop Command Center for live orders.
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Submitted Application Copy Card (Read-Only) */}
                  <View style={s.sectionCard}>
                    <Text style={s.sectionTitle}>Application details</Text>
                    <Text style={s.sectionSub}>Review your submitted store information, tax proofs, and bank setup</Text>
                    
                    <TouchableOpacity
                      style={s.viewCopyBtn}
                      onPress={() => setShowSubmittedDetails(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.viewCopyBtnText}>📄 Inspect Submitted Data (Read-Only) →</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Support Routing Card */}
                  <View style={s.supportCard}>
                    <Text style={s.supportCardTitle}>Need help with your audit?</Text>
                    <Text style={s.supportCardSub}>Our merchant operations team is online 24/7</Text>
                    
                    <View style={s.supportRow}>
                      <TouchableOpacity
                        style={s.supportChip}
                        onPress={handleOpenSupportWhatsApp}
                        activeOpacity={0.8}
                      >
                        <Text style={s.supportChipText}>💬 WhatsApp Support</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.supportChip}
                        onPress={handleOpenSupportPhone}
                        activeOpacity={0.8}
                      >
                        <Text style={s.supportChipText}>📞 Call 1800-123-4567</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* STATUS VARIANT: ACTION NEEDED */}
          {status === 'action_needed' && (
            <View style={s.rejectedCard}>
              <View style={s.rejectedBadgeRow}>
                <Ionicons name="warning-outline" size={18} style={{ color: '#475569' }} />
                <Text style={s.rejectedBadgeTitle}>Action required on application</Text>
              </View>

              <Text style={s.rejectedBodyText}>
                Our compliance team noticed a mismatch with your submitted GSTIN certificate or storefront photo. Please update your document file and resubmit for audit.
              </Text>

              <TouchableOpacity
                style={s.resubmitBtn}
                onPress={() => router.push('/(onboarding)/step-b')}
                activeOpacity={0.85}
              >
                <Text style={s.resubmitBtnText}>Update Documents & Resubmit →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STATUS VARIANT: REJECTED */}
          {status === 'rejected' && (
            <View style={s.rejectedCard}>
              <View style={s.rejectedBadgeRow}>
                <Ionicons name="close-circle-outline" size={18} style={{ color: '#475569' }} />
                <Text style={s.rejectedBadgeTitle}>Application rejected</Text>
              </View>

              <Text style={s.rejectedBodyText}>
                The compliance audit could not be approved due to invalid business license records or unverified storefront address.
              </Text>

              <TouchableOpacity
                style={s.resubmitBtn}
                onPress={() => router.push('/(onboarding)/step-a')}
                activeOpacity={0.85}
              >
                <Text style={s.resubmitBtnText}>Edit Application & Re-apply →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STATUS VARIANT: APPROVED */}
          {status === 'approved' && (
            <View style={s.approvedCard}>
              <View style={s.approvedIconBox}>
                <Ionicons name="sparkles-outline" size={18} style={{ color: '#475569' }} />
              </View>
              <Text style={s.approvedTitle}>Congratulations! Your store is approved.</Text>
              <Text style={s.approvedSub}>
                Your GlowVAI Vendor store is active. You are ready to manage inventory and receive 10-minute quick-commerce orders.
              </Text>

              <TouchableOpacity
                style={s.launchBtn}
                onPress={autoRouteApproved}
                activeOpacity={0.85}
              >
                <Text style={s.launchBtnText}>Launch Command Center 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STATUS VARIANT: MAINTENANCE */}
          {status === 'maintenance' && (
            <View style={s.rejectedCard}>
              <View style={s.rejectedBadgeRow}>
                <Ionicons name="construct-outline" size={18} style={{ color: '#475569' }} />
                <Text style={s.rejectedBadgeTitle}>Audit Gateway Maintenance</Text>
              </View>
              <Text style={s.rejectedBodyText}>
                Compliance verification systems are undergoing scheduled maintenance. Your submission data is safe. Normal auditing resumes at 06:00 AM.
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Submitted Details Modal Drawer (Read-Only) */}
      <Modal
        visible={showSubmittedDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSubmittedDetails(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Submitted Application Copy (Read-Only)</Text>
              <TouchableOpacity onPress={() => setShowSubmittedDetails(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <View style={s.modalSection}>
                <Text style={s.modalSectionTitle}>Store Identity (Step 1)</Text>
                <Text style={s.modalItem}>Store Name: {submittedData?.stepA?.storeName || 'Your store'}</Text>
                <Text style={s.modalItem}>Owner Name: {submittedData?.stepA?.ownerName || 'Benz Circle Store Owner'}</Text>
                <Text style={s.modalItem}>Location: {submittedData?.stepA?.locality || 'Benz Circle'}, {submittedData?.stepA?.city || 'Vijayawada'}</Text>
                <Text style={s.modalItem}>Pincode: {submittedData?.stepA?.pincode || '520010'}</Text>
              </View>

              <View style={s.modalSection}>
                <Text style={s.modalSectionTitle}>Business Compliance (Step 2)</Text>
                <Text style={s.modalItem}>GSTIN: {submittedData?.stepB?.maskedGstin || '37AAACG****1Z8'}</Text>
                <Text style={s.modalItem}>PAN: {submittedData?.stepB?.maskedPan || 'AAACG****F'}</Text>
                <Text style={s.modalItem}>Cosmetics License: {submittedData?.stepB?.cosmeticLicense || 'DL-2026-COSM-9912'}</Text>
              </View>

              <View style={s.modalSection}>
                <Text style={s.modalSectionTitle}>Payout Bank Account (Step 3)</Text>
                <Text style={s.modalItem}>Bank: {submittedData?.stepC?.selectedBank || 'HDFC Bank'}</Text>
                <Text style={s.modalItem}>Account: {submittedData?.stepC?.maskedAccountNumber || 'XXXXXX4589'}</Text>
                <Text style={s.modalItem}>IFSC: {submittedData?.stepC?.ifsc || 'HDFC0001234'}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={s.modalDoneBtn}
              onPress={() => setShowSubmittedDetails(false)}
            >
              <Text style={s.modalDoneBtnText}>Close Read-Only Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Timeline Step Indicator Rendering (5 Explicit States)
function renderStepIndicator(status: TimelineStep['status']) {
  if (status === 'verified') {
    return (
      <View style={s.indicatorVerified}>
        <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />
      </View>
    );
  }
  if (status === 'in_progress') {
    return (
      <View style={s.indicatorActive}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }
  if (status === 'needs_attention') {
    return (
      <View style={s.indicatorAmber}>
        <Text style={s.indicatorText}>!</Text>
      </View>
    );
  }
  if (status === 'rejected') {
    return (
      <View style={s.indicatorRed}>
        <Ionicons name="close" size={18} style={{ color: '#475569' }} />
      </View>
    );
  }
  return <View style={s.indicatorPending} />;
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  topbar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  topbarInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  brandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topbarMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supportHeaderBtn: {
    paddingVertical: 4,
  },
  supportHeaderBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  maxContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  maxContainerExpanded: {
    maxWidth: 1200,
  },

  /* Offline Banner */
  offlineBanner: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.lg,
  },
  offlineBannerText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Demo State Switcher Bar */
  demoStateBar: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  demoStateLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  demoChipRow: {
    gap: 6,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  demoChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  demoChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Hero Card Experience */
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heroBadgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  reviewPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  reviewPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  headline: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.4,
  },
  supportingCopy: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  /* Reference Info Card */
  refInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  refInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  refSubValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  refDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  /* Grid Columns */
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

  /* Section Card */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  refreshBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Timeline */
  timelineContainer: {
    gap: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timelineColumnLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineColumnRight: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepTitleActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  stepTitleMuted: {
    color: Colors.textMuted,
  },
  stepTimestamp: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  stepSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  /* Indicators */
  indicatorVerified: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorVerifiedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  indicatorActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorAmber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorPending: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Next Bullet List */
  nextBulletList: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  nextBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  nextBulletIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  nextBulletText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  /* View Copy Btn */
  viewCopyBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
  },
  viewCopyBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Support Card */
  supportCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  supportCardTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  supportCardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  supportRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  supportChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  supportChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  /* Rejected / Approved Cards */
  rejectedCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  rejectedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  rejectedBadgeIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  rejectedBadgeTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.danger,
  },
  rejectedBodyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  resubmitBtn: {
    height: 48,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  approvedCard: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  approvedIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  approvedIconText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 28,
  },
  approvedTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 6,
    textAlign: 'center',
  },
  approvedSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 480,
  },
  launchBtn: {
    height: 52,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.success,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '80%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modalBody: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  modalSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  modalItem: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modalDoneBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
});
