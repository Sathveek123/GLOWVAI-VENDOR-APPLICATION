/**
 * Help & support: help areas, the store's support requests and a request composer.
 * No support API exists yet, so production shows an honest empty state.
 * File: mobile/app/(vendor)/support.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import AppHeader from '../../src/components/AppHeader';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import Wordmark from '../../src/components/Wordmark';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type TicketStatus = 'Open' | 'Waiting for you' | 'In review' | 'Resolved';
export type TicketCategory = 'Orders' | 'Payments' | 'Catalog' | 'Compliance' | 'Security' | 'Technical';
type FilterKey = 'all' | 'open' | 'action' | 'resolved';

export interface SupportTicket {
  id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  lastUpdate: string;
  status: TicketStatus;
  messages: Array<{
    id: string;
    sender: 'Vendor' | 'Support';
    senderName: string;
    text: string;
    timestamp: string;
  }>;
}

const CATEGORIES: TicketCategory[] = ['Orders', 'Payments', 'Catalog', 'Compliance', 'Security', 'Technical'];
const SENSITIVE_TERMS = ['otp', 'password', 'cvv', 'upi pin'];

// Sample data: development builds only. Production starts with an empty list.
const SAMPLE_TICKETS: SupportTicket[] = [
  {
    id: 'SAMPLE-1001',
    category: 'Orders',
    subject: 'Sample: pickup status not updating',
    description: 'Sample request text. The order status did not change after packing.',
    lastUpdate: 'Sample time',
    status: 'Waiting for you',
    messages: [
      { id: 'sample-1001-a', sender: 'Vendor', senderName: 'You (sample)', text: 'Sample message from the store side.', timestamp: 'Sample time' },
      { id: 'sample-1001-b', sender: 'Support', senderName: 'Support team (sample)', text: 'Sample reply from the support side.', timestamp: 'Sample time' },
    ],
  },
  {
    id: 'SAMPLE-1002',
    category: 'Compliance',
    subject: 'Sample: document upload question',
    description: 'Sample request text about a document upload.',
    lastUpdate: 'Sample time',
    status: 'Resolved',
    messages: [
      { id: 'sample-1002-a', sender: 'Vendor', senderName: 'You (sample)', text: 'Sample message from the store side.', timestamp: 'Sample time' },
    ],
  },
];

// Help areas link to screens that exist in this app. No articles or policies are stated here.
const HELP_AREAS: { key: string; title: string; desc: string; icon: IconName; route: string }[] = [
  { key: 'orders', title: 'Orders', desc: 'Incoming and active orders.', icon: 'clipboard-outline', route: '/(vendor)/orders' },
  { key: 'payments', title: 'Payments', desc: 'Payouts and earnings.', icon: 'wallet-outline', route: '/(vendor)/earnings' },
  { key: 'catalog', title: 'Catalog', desc: 'Products and stock levels.', icon: 'cube-outline', route: '/(vendor)/catalog' },
  { key: 'compliance', title: 'Compliance', desc: 'Licences and compliance documents.', icon: 'document-text-outline', route: '/(vendor)/compliance' },
  { key: 'security', title: 'Account security', desc: 'Sign-in and account protection.', icon: 'shield-checkmark-outline', route: '/(vendor)/security' },
];

const STATUS_STYLE: Record<TicketStatus, { bg: string; border: string; text: string }> = {
  Open: { bg: Colors.primaryLight, border: Colors.primaryBorder, text: Colors.primary },
  'Waiting for you': { bg: Colors.warningLight, border: Colors.warningBorder, text: '#92400E' },
  'In review': { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA' },
  Resolved: { bg: Colors.successLight, border: Colors.successBorder, text: '#15803D' },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const st = STATUS_STYLE[status];
  return (
    <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
      <Text style={[s.statusText, { color: st.text }]}>{status}</Text>
    </View>
  );
}

function SampleChip() {
  return (
    <View style={s.sampleChip}>
      <Ionicons name="flask-outline" size={12} color="#92400E" />
      <Text style={s.sampleChipText}>Sample data</Text>
    </View>
  );
}

function RailItem({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.railNavItem} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      <Text style={s.railNavLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MerchantSupportScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [tickets, setTickets] = useState<SupportTicket[]>(__DEV__ ? SAMPLE_TICKETS : []);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // New request composer
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<TicketCategory>('Orders');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formNotice, setFormNotice] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Help & support | GlowVAI Console';
    }
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;
  const query = searchQuery.trim().toLowerCase();

  const visibleAreas = HELP_AREAS.filter(
    (a) => !query || a.title.toLowerCase().includes(query) || a.desc.toLowerCase().includes(query)
  );

  const visibleTickets = tickets.filter((t) => {
    const matchesSearch =
      !query ||
      t.subject.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    if (!matchesSearch) return false;
    if (activeTab === 'open') return t.status === 'Open' || t.status === 'In review';
    if (activeTab === 'action') return t.status === 'Waiting for you';
    if (activeTab === 'resolved') return t.status === 'Resolved';
    return true;
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(vendor)/home');
    }
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setFormNotice(null);
  };

  const handleSubmitRequest = () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      setFormNotice('Add a subject and a description to continue.');
      return;
    }
    if (!__DEV__) {
      // No support API yet. Keep the draft and say so; never show a fake ticket ID.
      setFormNotice('Support requests are not connected yet, so this was not sent. Your draft is still here.');
      return;
    }
    const stamp = Date.now();
    const created: SupportTicket = {
      id: `SAMPLE-${stamp}`,
      category: newCategory,
      subject: `Sample: ${newSubject.trim()}`,
      description: newDescription.trim(),
      lastUpdate: 'Sample time',
      status: 'Open',
      messages: [
        { id: `sample-${stamp}`, sender: 'Vendor', senderName: 'You (sample)', text: newDescription.trim(), timestamp: 'Sample time' },
      ],
    };
    setTickets((prev) => [created, ...prev]);
    setSelectedTicketId(created.id);
    setNewSubject('');
    setNewDescription('');
    closeComposer();
    setNotice('Sample request added on this device only. It was not sent to support.');
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    if (!__DEV__) {
      setNotice('Replies are not connected yet. Nothing was sent.');
      return;
    }
    const lower = replyText.toLowerCase();
    if (SENSITIVE_TERMS.some((term) => lower.includes(term))) {
      setNotice('Do not type passwords, OTPs or PINs in support messages.');
      return;
    }
    const text = replyText.trim();
    const ticketId = selectedTicket.id;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'In review',
              lastUpdate: 'Sample time',
              messages: [
                ...t.messages,
                { id: `reply-${Date.now()}`, sender: 'Vendor', senderName: 'You (sample)', text, timestamp: 'Sample time' },
              ],
            }
          : t
      )
    );
    setReplyText('');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>
        {/* Desktop left navigation rail */}
        {isExpanded && (
          <View style={s.navRail}>
            <View>
              <View style={s.railBrandGroup}>
                <View style={s.railBrandLogo}>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Wordmark size={17} />
                  <Text style={s.railBrandSub}>Vendor Console</Text>
                </View>
              </View>
              <View style={s.railNavGroup}>
                <RailItem icon="home-outline" label="Home" onPress={() => router.push('/(vendor)/home')} />
                <RailItem icon="clipboard-outline" label="Orders" onPress={() => router.push('/(vendor)/orders')} />
                <RailItem icon="cube-outline" label="Catalog" onPress={() => router.push('/(vendor)/catalog')} />
                <RailItem icon="wallet-outline" label="Earnings" onPress={() => router.push('/(vendor)/earnings')} />
                <RailItem icon="settings-outline" label="Settings" onPress={() => router.push('/(vendor)/profile')} />
              </View>
            </View>
            <View style={s.railFooter}>
              <View style={s.railHelpActive}>
                <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
                <Text style={s.railHelpActiveText}>Help & support</Text>
              </View>
              <TouchableOpacity style={s.railProfileCard} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <View style={s.railAvatar}>
                  <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Account</Text>
                  <Text style={s.railProfileRole}>Profile and settings</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={s.mainConsole}>
          <AppHeader
            title="Help & support"
            subtitle="Ask about orders, payouts, catalog, compliance or account security."
            showBack={!isExpanded}
            onBack={handleBack}
            rightActions={
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => setIsComposerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="New support request"
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={s.primaryBtnText}>New request</Text>
              </TouchableOpacity>
            }
          />

          <ScrollView contentContainerStyle={[s.scrollContent, isExpanded && s.scrollContentDesktop]}>
            <View style={s.contentInner}>
              {notice ? (
                <View style={s.noticeBar}>
                  <Text style={s.noticeText}>{notice}</Text>
                  <TouchableOpacity onPress={() => setNotice(null)} hitSlop={8} accessibilityLabel="Dismiss message">
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Search */}
              <View style={s.searchCard}>
                <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search help areas and requests"
                  placeholderTextColor={Colors.textSubtle}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Help areas */}
              <Text style={s.sectionTitle}>Help areas</Text>
              {visibleAreas.length === 0 ? (
                <Text style={s.mutedText}>No help areas match your search.</Text>
              ) : (
                <View style={s.areaGrid}>
                  {visibleAreas.map((area) => (
                    <TouchableOpacity
                      key={area.key}
                      style={[s.areaCard, isExpanded && s.areaCardDesktop]}
                      onPress={() => router.push(area.route as any)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${area.title}`}
                    >
                      <View style={s.areaIcon}>
                        <Ionicons name={area.icon} size={20} color={Colors.primary} />
                      </View>
                      <Text style={s.areaTitle}>{area.title}</Text>
                      <Text style={s.areaDesc}>{area.desc}</Text>
                      <View style={s.areaLinkRow}>
                        <Text style={s.areaLinkText}>Open</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Requests */}
              <View style={s.requestsHeaderRow}>
                <Text style={s.sectionTitle}>Your requests</Text>
                {__DEV__ ? <SampleChip /> : null}
              </View>

              {tickets.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="chatbubbles-outline" size={28} color={Colors.textSubtle} />
                  <Text style={s.emptyTitle}>No support requests yet</Text>
                  <Text style={s.emptyBody}>
                    Support requests are not connected in this version of the app, so none can be sent or tracked here.
                  </Text>
                  <TouchableOpacity
                    style={s.emptyAction}
                    onPress={() => router.push('/(vendor)/orders')}
                    accessibilityRole="button"
                  >
                    <Text style={s.emptyActionText}>View orders</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={s.filterRow}>
                    {(
                      [
                        ['all', 'All'],
                        ['open', 'Open'],
                        ['action', 'Action needed'],
                        ['resolved', 'Resolved'],
                      ] as [FilterKey, string][]
                    ).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[s.filterTab, activeTab === key && s.filterTabActive]}
                        onPress={() => setActiveTab(key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activeTab === key }}
                      >
                        <Text style={[s.filterTabText, activeTab === key && s.filterTabTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[s.workspace, isExpanded && s.workspaceDesktop]}>
                    <View style={[s.listColumn, isExpanded && s.listColumnDesktop]}>
                      {visibleTickets.length === 0 ? (
                        <Text style={s.mutedText}>No requests match this filter.</Text>
                      ) : (
                        visibleTickets.map((t) => {
                          const isSelected = t.id === selectedTicketId;
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[s.ticketCard, isSelected && s.ticketCardSelected]}
                              onPress={() => setSelectedTicketId(t.id)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                            >
                              <View style={s.ticketCardHeader}>
                                <Text style={s.ticketId}>{t.id}</Text>
                                <StatusBadge status={t.status} />
                              </View>
                              <Text style={s.ticketSubject} numberOfLines={2}>{t.subject}</Text>
                              <View style={s.ticketMetaRow}>
                                <Text style={s.categoryBadge}>{t.category}</Text>
                                <Text style={s.metaText}>{t.lastUpdate}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>

                    {selectedTicket ? (
                      <View style={[s.detailCard, isExpanded && s.detailCardDesktop]}>
                        <View style={s.detailHeader}>
                          <View style={s.detailMetaRow}>
                            <Text style={s.ticketId}>{selectedTicket.id}</Text>
                            <StatusBadge status={selectedTicket.status} />
                          </View>
                          <Text style={s.detailSubject}>{selectedTicket.subject}</Text>
                          <Text style={s.detailDesc}>{selectedTicket.description}</Text>
                          <Text style={s.metaText}>{selectedTicket.category} · {selectedTicket.lastUpdate}</Text>
                        </View>

                        <ScrollView style={s.messagesScroll} nestedScrollEnabled>
                          {selectedTicket.messages.map((m) => {
                            const isVendor = m.sender === 'Vendor';
                            return (
                              <View key={m.id} style={[s.bubbleRow, isVendor && s.bubbleRowEnd]}>
                                <View style={[s.bubble, isVendor ? s.bubbleVendor : s.bubbleSupport]}>
                                  <Text style={[s.bubbleName, isVendor && s.bubbleNameVendor]}>{m.senderName}</Text>
                                  <Text style={[s.bubbleText, isVendor && s.bubbleTextVendor]}>{m.text}</Text>
                                  <Text style={[s.bubbleTime, isVendor && s.bubbleTimeVendor]}>{m.timestamp}</Text>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>

                        {selectedTicket.status === 'Resolved' ? (
                          <View style={s.resolvedBox}>
                            <Text style={s.resolvedText}>This request is marked resolved.</Text>
                          </View>
                        ) : (
                          <View style={s.composer}>
                            <View style={s.privacyBanner}>
                              <Text style={s.privacyText}>
                                Never send OTPs, passwords, UPI PINs or customer details.
                              </Text>
                            </View>
                            <View style={s.replyRow}>
                              <TextInput
                                style={s.replyInput}
                                placeholder="Write a reply"
                                placeholderTextColor={Colors.textSubtle}
                                multiline
                                value={replyText}
                                onChangeText={setReplyText}
                              />
                              <TouchableOpacity
                                style={[s.sendBtn, !replyText.trim() && s.btnDisabled]}
                                onPress={handleSendReply}
                                disabled={!replyText.trim()}
                                accessibilityRole="button"
                                accessibilityLabel="Send reply"
                              >
                                <Text style={s.sendBtnText}>Send</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      <MobileBottomNav currentTab="profile" />

      {/* New request composer */}
      <Modal visible={isComposerOpen} transparent animationType="fade" onRequestClose={closeComposer}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New support request</Text>
              <TouchableOpacity onPress={closeComposer} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody}>
              {!__DEV__ ? (
                <View style={s.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
                  <Text style={s.infoText}>Support requests are not connected in this version of the app yet.</Text>
                </View>
              ) : null}

              <Text style={s.fieldLabel}>Category</Text>
              <View style={s.pillRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.pill, newCategory === cat && s.pillActive]}
                    onPress={() => setNewCategory(cat)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: newCategory === cat }}
                  >
                    <Text style={[s.pillText, newCategory === cat && s.pillTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Subject</Text>
              <TextInput
                style={s.input}
                placeholder="Short summary of the issue"
                placeholderTextColor={Colors.textSubtle}
                value={newSubject}
                onChangeText={setNewSubject}
              />

              <Text style={s.fieldLabel}>Details</Text>
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="What happened, and what you expected"
                placeholderTextColor={Colors.textSubtle}
                multiline
                numberOfLines={4}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              {formNotice ? <Text style={s.formNotice}>{formNotice}</Text> : null}
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity style={s.secondaryBtn} onPress={closeComposer} accessibilityRole="button">
                <Text style={s.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.primaryBtn} onPress={handleSubmitRequest} accessibilityRole="button">
                <Text style={s.primaryBtnText}>Submit request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Navigation rail (desktop) */
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
  railBrandSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  railNavGroup: {
    gap: 6,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: BorderRadii.input,
  },
  railNavLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  railFooter: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  railHelpActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primaryLight,
  },
  railHelpActiveText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  railProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 6,
    minHeight: 44,
  },
  railAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railProfileName: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  railProfileRole: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* Main content */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 96,
  },
  scrollContentDesktop: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  contentInner: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: TypeScale.body.fontSize,
    color: Colors.textPrimary,
  },
  searchCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  mutedText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSubtle,
    marginBottom: Spacing.lg,
  },

  /* Help areas */
  areaGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  areaCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaCardDesktop: {
    width: '32%',
    minWidth: 220,
    flexGrow: 1,
  },
  areaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  areaTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  areaDesc: {
    ...TypeScale.body,
    color: Colors.textSubtle,
    marginBottom: Spacing.sm,
  },
  areaLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  areaLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },

  /* Requests */
  requestsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 0,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sampleChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#92400E',
  },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  emptyBody: {
    ...TypeScale.body,
    color: Colors.textSubtle,
    textAlign: 'center',
    maxWidth: 420,
  },
  emptyAction: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  emptyActionText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  filterTab: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: BorderRadii.input,
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  workspace: {
    gap: Spacing.lg,
  },
  workspaceDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listColumn: {
    gap: Spacing.sm,
  },
  listColumnDesktop: {
    width: 360,
  },
  ticketCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  ticketCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.primaryLight,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  ticketSubject: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: '#1E293B',
    marginBottom: 8,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailCardDesktop: {
    flex: 1,
  },
  detailHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailSubject: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  detailDesc: {
    ...TypeScale.body,
    color: Colors.textSecondary,
  },
  messagesScroll: {
    maxHeight: 320,
    padding: Spacing.lg,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
  },
  bubbleRowEnd: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadii.card,
  },
  bubbleVendor: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleSupport: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  bubbleName: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  bubbleNameVendor: {
    color: '#C7DAFE',
  },
  bubbleText: {
    ...TypeScale.body,
    color: Colors.textPrimary,
  },
  bubbleTextVendor: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSubtle,
    textAlign: 'right',
    marginTop: 6,
  },
  bubbleTimeVendor: {
    color: '#E2E8F0',
  },
  resolvedBox: {
    padding: Spacing.lg,
    backgroundColor: Colors.successLight,
    borderTopWidth: 1,
    borderTopColor: Colors.successBorder,
  },
  resolvedText: {
    ...TypeScale.body,
    color: '#166534',
    textAlign: 'center',
  },
  composer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: Spacing.sm,
  },
  privacyBanner: {
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#92400E',
  },
  replyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadii.input,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  /* Buttons */
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    borderRadius: BorderRadii.input,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  secondaryBtn: {
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },

  /* Composer modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: Spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: BorderRadii.input,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  formNotice: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});

export default MerchantSupportScreen;
