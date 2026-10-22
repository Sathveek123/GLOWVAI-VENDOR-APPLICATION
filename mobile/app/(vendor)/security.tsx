import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

export type ActivityEventStatus = 'Trusted' | 'Attention' | 'Suspicious' | 'Blocked';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  icon: string;
  deviceDesc: string;
  affectedArea: string;
  status: ActivityEventStatus;
  ipMasked: string;
  detail: string;
  canChallenge?: boolean;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  browserOS: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const INITIAL_EVENTS: SecurityEvent[] = [
  {
    id: 'SEC-9901',
    timestamp: 'Today, 08:30 AM',
    eventType: 'Successful Owner Login',
    icon: '🔑',
    deviceDesc: 'Chrome 129 on Windows 11',
    affectedArea: 'Account Shell',
    status: 'Trusted',
    ipMasked: '182.73.•••.14 (Vijayawada)',
    detail: 'Authenticated via 6-digit SMS OTP to registered owner mobile (+91 98••••8812).',
  },
  {
    id: 'SEC-9844',
    timestamp: 'Today, 08:29 AM',
    eventType: 'SMS OTP Verification',
    icon: '📱',
    deviceDesc: 'Mobile SMS Gateway',
    affectedArea: 'Authentication Gateway',
    status: 'Trusted',
    ipMasked: '182.73.•••.14 (Vijayawada)',
    detail: 'OTP dispatched and verified within 18 seconds.',
  },
  {
    id: 'SEC-9712',
    timestamp: 'Yesterday, 04:15 PM',
    eventType: 'New Staff Invitation Dispatched',
    icon: '👤',
    deviceDesc: 'Chrome 129 on Windows 11',
    affectedArea: 'Team Access (/team)',
    status: 'Trusted',
    ipMasked: '182.73.•••.14 (Vijayawada)',
    detail: 'Invited Ramesh Kumar as Store Manager with Order & Inventory permissions.',
  },
  {
    id: 'SEC-9602',
    timestamp: 'Oct 05, 02:10 PM',
    eventType: 'Payout Bank Change Requested',
    icon: '💳',
    deviceDesc: 'Firefox 128 on macOS',
    affectedArea: 'Payout Bank Account (/bank)',
    status: 'Attention',
    ipMasked: '49.207.•••.88 (Guntur)',
    detail: 'Requested bank account change to ICICI Bank (••••9921). 48-hour cooling period initiated.',
    canChallenge: true,
  },
  {
    id: 'SEC-9450',
    timestamp: 'Oct 03, 11:45 PM',
    eventType: 'Unrecognized Login Attempt',
    icon: '🚨',
    deviceDesc: 'Safari on iPhone 15 Pro',
    affectedArea: 'Account Shell',
    status: 'Suspicious',
    ipMasked: '103.112.•••.99 (Mumbai)',
    detail: 'Failed login attempt from unrecognized location. 2FA challenge stopped unauthorized access.',
    canChallenge: true,
  },
  {
    id: 'SEC-9310',
    timestamp: 'Oct 01, 09:15 AM',
    eventType: 'Remote Session Signed Out',
    icon: '🚪',
    deviceDesc: 'Chrome 128 on Windows 10',
    affectedArea: 'Session Manager',
    status: 'Trusted',
    ipMasked: '182.73.•••.14 (Vijayawada)',
    detail: 'Owner initiated remote sign-out for desktop session in secondary branch store.',
  },
];

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'SESS-01',
    deviceName: 'Primary Desktop PC',
    browserOS: 'Chrome 129 on Windows 11',
    location: 'Vijayawada, AP (182.73.•••.14)',
    lastActive: 'Active Now (Current Session)',
    isCurrent: true,
  },
  {
    id: 'SESS-02',
    deviceName: 'Store Counter Tablet',
    browserOS: 'GlowVAI Vendor App (Android 14)',
    location: 'Vijayawada Store Branch',
    lastActive: '14 minutes ago',
    isCurrent: false,
  },
];

function SecurityScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'trusted' | 'attention' | 'suspicious'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isSignOutAllModalOpen, setIsSignOutAllModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedChallengeEvent, setSelectedChallengeEvent] = useState<SecurityEvent | null>(null);
  
  // Notification Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.deviceDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'trusted') return e.status === 'Trusted';
    if (activeTab === 'attention') return e.status === 'Attention';
    if (activeTab === 'suspicious') return e.status === 'Suspicious' || e.status === 'Blocked';
    return true;
  });

  const handleSignOutOtherDevices = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    setIsSignOutAllModalOpen(false);
    showToast('🔒 All other active sessions signed out successfully');
  };

  const handleRecognizeEvent = (eventId: string) => {
    setEvents(
      events.map((e) => (e.id === eventId ? { ...e, status: 'Trusted' as ActivityEventStatus, canChallenge: false } : e))
    );
    setSelectedChallengeEvent(null);
    showToast('✅ Activity confirmed as recognized by owner');
  };

  const handleReportUnrecognizedEvent = (event: SecurityEvent) => {
    setEvents(
      events.map((e) => (e.id === event.id ? { ...e, status: 'Blocked' as ActivityEventStatus, canChallenge: false } : e))
    );
    setSelectedChallengeEvent(null);
    showToast('🚨 Security incident reported! Sensitive actions temporarily locked & Risk Desk notified.');
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification Banner */}
      {notification && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{notification}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Breadcrumbs */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbLink}>Account</Text>
              <Text style={styles.breadcrumbSep}> / </Text>
              <Text style={styles.breadcrumbCurrent}>Security</Text>
            </View>
            <Text style={styles.pageTitle}>Security & Account Activity</Text>
            <Text style={styles.subCaption}>
              Review important account activity, verify active sessions, and protect your store.
            </Text>
          </View>
          <View style={styles.headerRightControls}>
            <View style={styles.statusPillVerified}>
              <Ionicons name="radio-button-on" size={18} style={{ color: '#475569' }} />
              <Text style={styles.verifiedText}>Security Health: Excellent</Text>
            </View>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsSessionsModalOpen(true)}>
              <Text style={styles.secondaryBtnText}>💻 Active Sessions ({sessions.length})</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Summary 4-Card Grid */}
        <View style={styles.summaryGrid}>
          {/* Card 1: Verified Mobile */}
          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="phone-portrait-outline" size={18} style={{ color: '#475569' }} />
              <View style={styles.miniBadgeGreen}>
                <Text style={styles.miniBadgeGreenText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Registered Mobile</Text>
            <Text style={styles.cardValue}>+91 98••••8812</Text>
            <Text style={styles.cardSubText}>Used for OTP login & security alerts</Text>
          </View>

          {/* Card 2: Active Sessions */}
          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="laptop-outline" size={18} style={{ color: '#475569' }} />
              <View style={styles.miniBadgeBlue}>
                <Text style={styles.miniBadgeBlueText}>{sessions.length} Active</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Connected Devices</Text>
            <Text style={styles.cardValue}>Windows 11 PC</Text>
            <Text style={styles.cardSubText}>Vijayawada • Current session</Text>
          </View>

          {/* Card 3: Payout Protection */}
          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="lock-closed-outline" size={18} style={{ color: '#475569' }} />
              <View style={styles.miniBadgeGreen}>
                <Text style={styles.miniBadgeGreenText}>Protected</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Payout Bank Protection</Text>
            <Text style={styles.cardValue}>HDFC Bank ••••4589</Text>
            <Text style={styles.cardSubText}>No cooling period active</Text>
          </View>

          {/* Card 4: Team Access */}
          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="shield-checkmark-outline" size={18} style={{ color: '#475569' }} />
              <View style={styles.miniBadgeGreen}>
                <Text style={styles.miniBadgeGreenText}>RBAC Active</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Team RBAC Scope</Text>
            <Text style={styles.cardValue}>4 Staff Members</Text>
            <Text style={styles.cardSubText}>Owner-only actions locked</Text>
          </View>
        </View>

        {/* Protect Your Account Action Hub */}
        <View style={styles.actionHubCard}>
          <Text style={styles.actionHubTitle}>🛡️ Account Protection & Quick Actions</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsSessionsModalOpen(true)}>
              <Text style={styles.actionBtnText}>📱 Review Active Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnAlert} onPress={() => setIsSignOutAllModalOpen(true)}>
              <Text style={styles.actionBtnAlertText}>🚪 Sign Out Other Devices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                showToast('🔒 Redirecting to secure mobile verification flow...');
              }}
            >
              <Text style={styles.actionBtnText}>📲 Update Mobile Number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(vendor)/bank' as any)}
            >
              <Text style={styles.actionBtnText}>💳 Payout Bank Settings →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Table & Timeline */}
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent Security & Account Activity</Text>
          <Text style={styles.lastAuditText}>Last security audit: Today, 08:30 AM</Text>
        </View>

        <View style={styles.tableCard}>
          {/* Table Search & Filter Bar */}
          <View style={styles.filterBarRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#475569" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search security activity, devices, IP addresses..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterTabsRow}>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
                  All Events ({events.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'trusted' && styles.filterTabActive]}
                onPress={() => setActiveTab('trusted')}
              >
                <Text style={[styles.filterTabText, activeTab === 'trusted' && styles.filterTabTextActive]}>
                  Trusted
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'attention' && styles.filterTabActive]}
                onPress={() => setActiveTab('attention')}
              >
                <Text style={[styles.filterTabText, activeTab === 'attention' && styles.filterTabTextActive]}>
                  Attention
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'suspicious' && styles.filterTabActive]}
                onPress={() => setActiveTab('suspicious')}
              >
                <Text style={[styles.filterTabText, activeTab === 'suspicious' && styles.filterTabTextActive]}>
                  Suspicious
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Timeline List */}
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={18} color="#475569" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No activity events match filter</Text>
            </View>
          ) : (
            filteredEvents.map((item) => (
              <View key={item.id} style={styles.eventRowItem}>
                <View style={styles.eventLeftCol}>
                  <Text style={styles.eventIcon}>{item.icon}</Text>
                  <View style={styles.eventTitleBox}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventTitle}>{item.eventType}</Text>
                      <View style={getStatusStyle(item.status)}>
                        <Text style={getStatusTextStyle(item.status)}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.eventSubText}>
                      {item.deviceDesc} • Location: {item.ipMasked}
                    </Text>
                    <Text style={styles.eventDetailText}>{item.detail}</Text>
                  </View>
                </View>

                <View style={styles.eventRightCol}>
                  <Text style={styles.eventTimeText}>{item.timestamp}</Text>
                  <Text style={styles.areaBadge}>{item.affectedArea}</Text>

                  {item.canChallenge && (
                    <TouchableOpacity
                      style={styles.reviewChallengeBtn}
                      onPress={() => setSelectedChallengeEvent(item)}
                    >
                      <Text style={styles.reviewChallengeText}>Review Event</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Active Sessions Modal Drawer */}
      <Modal visible={isSessionsModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Store Sessions ({sessions.length})</Text>
              <TouchableOpacity onPress={() => setIsSessionsModalOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {sessions.map((sess) => (
                <View key={sess.id} style={styles.sessionCard}>
                  <View style={styles.sessionCardHeader}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionDeviceName}>{sess.deviceName}</Text>
                      {sess.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionBrowserText}>{sess.browserOS}</Text>
                    <Text style={styles.sessionMetaText}>
                      📍 {sess.location} • {sess.lastActive}
                    </Text>
                  </View>

                  {!sess.isCurrent && (
                    <TouchableOpacity
                      style={styles.signOutSingleBtn}
                      onPress={() => {
                        setSessions(sessions.filter((s) => s.id !== sess.id));
                        showToast(`Signed out ${sess.deviceName}`);
                      }}
                    >
                      <Text style={styles.signOutSingleText}>Sign Out Session</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsSessionsModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out All Devices Confirmation Modal */}
      <Modal visible={isSignOutAllModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.smallModal]}>
            <Ionicons name="exit-outline" size={18} style={{ color: '#475569' }} />
            <Text style={styles.alertModalTitle}>Sign Out Other Active Devices?</Text>
            <Text style={styles.alertModalText}>
              Are you sure you want to sign out all other connected devices? Active sessions on secondary desktops and mobile terminals will be invalidated immediately.
            </Text>
            <View style={styles.alertModalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsSignOutAllModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtnDanger}
                onPress={handleSignOutOtherDevices}
              >
                <Text style={styles.modalConfirmTextDanger}>Sign Out All Other Devices</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suspicious Activity Challenge Workflow Modal */}
      <Modal visible={selectedChallengeEvent !== null} transparent animationType="fade">
        {selectedChallengeEvent && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.mediumModal]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Security Activity Verification</Text>
                <TouchableOpacity onPress={() => setSelectedChallengeEvent(null)}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.challengeBox}>
                  <Text style={styles.challengeIcon}>{selectedChallengeEvent.icon}</Text>
                  <Text style={styles.challengeType}>{selectedChallengeEvent.eventType}</Text>
                  <Text style={styles.challengeMeta}>
                    {selectedChallengeEvent.timestamp} • {selectedChallengeEvent.deviceDesc}
                  </Text>
                  <Text style={styles.challengeDetail}>{selectedChallengeEvent.detail}</Text>
                </View>

                <Text style={styles.challengeQuestion}>Do you recognize this activity?</Text>

                <View style={styles.challengeOptionsRow}>
                  <TouchableOpacity
                    style={styles.recognizeBtn}
                    onPress={() => handleRecognizeEvent(selectedChallengeEvent.id)}
                  >
                    <Text style={styles.recognizeBtnText}>✅ I Recognize This</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.unrecognizeBtn}
                    onPress={() => handleReportUnrecognizedEvent(selectedChallengeEvent)}
                  >
                    <Text style={styles.unrecognizeBtnText}>🚨 I Don't Recognize This</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// Status Pill Helpers
function getStatusStyle(status: ActivityEventStatus) {
  switch (status) {
    case 'Trusted':
      return [styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }];
    case 'Attention':
      return [styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }];
    case 'Suspicious':
      return [styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }];
    case 'Blocked':
      return [styles.statusBadge, { backgroundColor: '#475569', borderColor: '#334155' }];
  }
}

function getStatusTextStyle(status: ActivityEventStatus) {
  switch (status) {
    case 'Trusted':
      return [styles.statusText, { color: '#15803D' }];
    case 'Attention':
      return [styles.statusText, { color: '#B45309' }];
    case 'Suspicious':
      return [styles.statusText, { color: '#B91C1C' }];
    case 'Blocked':
      return [styles.statusText, { color: '#FFFFFF' }];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastContainer: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    marginBottom: 20,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },
  breadcrumbSep: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subCaption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPillVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedDot: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    width: Platform.OS === 'web' ? '23.5%' : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 240,
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 24,
  },
  miniBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniBadgeGreenText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  miniBadgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniBadgeBlueText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  actionHubCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 28,
  },
  actionHubTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  actionBtnAlert: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  actionBtnAlertText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  lastAuditText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  filterBarRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    flex: 1,
    maxWidth: 400,
  },
  searchIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#1D4ED8',
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#64748B',
  },
  eventRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventLeftCol: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  eventIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
    marginTop: 2,
  },
  eventTitleBox: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  eventSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  eventDetailText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  eventRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  eventTimeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#94A3B8',
  },
  areaBadge: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewChallengeBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  reviewChallengeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B45309',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  smallModal: {
    maxWidth: 440,
    padding: 24,
    alignItems: 'center',
  },
  mediumModal: {
    maxWidth: 500,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#64748B',
  },
  modalBody: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  sessionCardHeader: {
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sessionDeviceName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  sessionBrowserText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
  },
  sessionMetaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  signOutSingleBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signOutSingleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  alertModalIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 36,
    marginBottom: 8,
  },
  alertModalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertModalText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  alertModalFooter: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalConfirmBtnDanger: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalConfirmTextDanger: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  challengeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 32,
    marginBottom: 6,
  },
  challengeType: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  challengeMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  challengeDetail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  challengeQuestion: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 14,
  },
  challengeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  recognizeBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recognizeBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  unrecognizeBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  unrecognizeBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
});

export default withComingSoon(SecurityScreen, 'Security');
