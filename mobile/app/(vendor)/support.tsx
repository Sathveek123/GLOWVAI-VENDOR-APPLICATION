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

// Types
export type TicketStatus = 'Open' | 'Waiting for you' | 'In review' | 'Escalated' | 'Resolved';
export type TicketPriority = 'Urgent' | 'High' | 'Normal';
export type TicketCategory = 'Orders' | 'Payments' | 'Catalog' | 'Compliance' | 'Security' | 'Technical';

export interface SupportTicket {
  id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  createdTime: string;
  lastUpdate: string;
  status: TicketStatus;
  priority: TicketPriority;
  referenceId?: string;
  messages: Array<{
    id: string;
    sender: 'Vendor' | 'Support Desk' | 'System';
    senderName: string;
    text: string;
    timestamp: string;
    attachments?: Array<{ name: string; size: string; type: string }>;
  }>;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-8821',
    category: 'Orders',
    subject: 'Rider dispatch delay for incoming order #GV-9912',
    description: 'Rider was assigned 15 mins ago but location has not updated on map. Customer is requesting ETA.',
    createdTime: 'Today, 11:20 AM',
    lastUpdate: '10 mins ago',
    status: 'Waiting for you',
    priority: 'High',
    referenceId: 'Order #GV-9912',
    messages: [
      {
        id: 'm1',
        sender: 'Vendor',
        senderName: 'Sri Lakshmi Staff',
        text: 'Rider picked up order #GV-9912 but tracking is stuck at store location.',
        timestamp: '11:20 AM',
      },
      {
        id: 'm2',
        sender: 'Support Desk',
        senderName: 'Ananya (GlowVAI Logistics Support)',
        text: 'We checked with the rider partner. GPS signal dropped temporarily. They are 2 mins away from customer location. Please advise if customer wants direct call.',
        timestamp: '11:28 AM',
      },
    ],
  },
  {
    id: 'TICK-8790',
    category: 'Payments',
    subject: 'Weekly settlement UTR reconciliation request for Sept 28',
    description: 'Bank account shows credit of ₹42,850 but ledger breakdown shows ₹43,120. Need breakdown of ₹270 adjustment.',
    createdTime: 'Oct 06, 04:15 PM',
    lastUpdate: 'Yesterday, 06:30 PM',
    status: 'In review',
    priority: 'Normal',
    referenceId: 'Payout #SET-4912 (••••4589)',
    messages: [
      {
        id: 'm1',
        sender: 'Vendor',
        senderName: 'Store Owner',
        text: 'Need itemized GST & TCS statement for batch payout #SET-4912.',
        timestamp: 'Oct 06, 04:15 PM',
      },
      {
        id: 'm2',
        sender: 'Support Desk',
        senderName: 'Rajesh (Finance Operations)',
        text: 'Your request has been forwarded to the merchant finance team. TCS line item adjustment of ₹270 was applied under 194O compliance.',
        timestamp: 'Yesterday, 06:30 PM',
      },
    ],
  },
  {
    id: 'TICK-8640',
    category: 'Technical',
    subject: 'Thermal bluetooth slip printer disconnecting on web app',
    description: 'TSC Alpha 3R thermal printer drops connection during batch packing slips printing.',
    createdTime: 'Oct 02, 10:00 AM',
    lastUpdate: 'Oct 04, 02:10 PM',
    status: 'Resolved',
    priority: 'Normal',
    referenceId: 'Device: Windows 11 / Chrome 129',
    messages: [
      {
        id: 'm1',
        sender: 'Vendor',
        senderName: 'Store Manager',
        text: 'Printer drops connection after printing 3 consecutive order slips.',
        timestamp: 'Oct 02, 10:00 AM',
      },
      {
        id: 'm2',
        sender: 'Support Desk',
        senderName: 'GlowVAI Tech Desk',
        text: 'Please update your Web Bluetooth bridge service to v2.1. Dynamic buffer size fix has been deployed.',
        timestamp: 'Oct 04, 02:10 PM',
      },
      {
        id: 'm3',
        sender: 'Vendor',
        senderName: 'Store Manager',
        text: 'Updated bridge app and printed 10 test slips without disconnect. Issue resolved.',
        timestamp: 'Oct 04, 02:45 PM',
      },
    ],
  },
];

const HELP_TOPICS = [
  {
    id: 'orders',
    title: 'Orders & Deliveries',
    icon: '📦',
    category: 'Orders' as TicketCategory,
    desc: 'Incoming offers, rider dispatch delays, customer cancellations & returns.',
    popular: 'How to handle order item substitution',
    openCount: 1,
  },
  {
    id: 'payments',
    title: 'Payments & Settlements',
    icon: '💳',
    category: 'Payments' as TicketCategory,
    desc: 'Daily bank payouts, UTR receipt reconciliation, TCS/TDS withholdings.',
    popular: 'Understanding weekly payout calculation',
    openCount: 1,
  },
  {
    id: 'catalog',
    title: 'Catalog & Stock',
    icon: '💄',
    category: 'Catalog' as TicketCategory,
    desc: 'Shade variant addition, barcode scanner sync, stock count adjustments.',
    popular: 'Bulk CSV inventory stock upload guide',
    openCount: 0,
  },
  {
    id: 'compliance',
    title: 'Compliance & KYC',
    icon: '📄',
    category: 'Compliance' as TicketCategory,
    desc: 'GST invoices, FSSAI/Cosmetic license update, tax credit statements.',
    popular: 'Uploading renewed cosmetic license',
    openCount: 0,
  },
  {
    id: 'security',
    title: 'Account Security',
    icon: '🔒',
    category: 'Security' as TicketCategory,
    desc: 'Staff permissions, bank account change request, 2FA setup & resets.',
    popular: 'Adding staff without sharing owner login',
    openCount: 0,
  },
  {
    id: 'technical',
    title: 'Technical Issues',
    icon: '💻',
    category: 'Technical' as TicketCategory,
    desc: 'Thermal printer Bluetooth setup, browser cache, offline sync bugs.',
    popular: 'Connecting Bluetooth thermal label printer',
    openCount: 1,
  },
];

function MerchantSupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TICK-8821');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'action' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Ticket Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<TicketCategory>('Orders');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Normal');
  const [newRefId, setNewRefId] = useState('');
  
  // Message input state in drawer
  const [replyMessage, setReplyMessage] = useState('');
  
  // Notification banner state
  const [notification, setNotification] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === 'open') return t.status === 'Open' || t.status === 'In review';
    if (activeTab === 'action') return t.status === 'Waiting for you';
    if (activeTab === 'resolved') return t.status === 'Resolved';
    return true;
  });

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('⚠️ Please enter a subject and issue description');
      return;
    }

    const created: SupportTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newCategory,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      createdTime: 'Just now',
      lastUpdate: 'Just now',
      status: 'Open',
      priority: newPriority,
      referenceId: newRefId.trim() || undefined,
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'Vendor',
          senderName: 'Sri Lakshmi Store Staff',
          text: newDescription.trim(),
          timestamp: 'Just now',
        },
        {
          id: `sys-${Date.now()}`,
          sender: 'System',
          senderName: 'GlowVAI Support Bot',
          text: 'Ticket received. Assigned to GlowVAI Merchant Desk. System diagnostic details (Store ID: DS-VIJ-01, Web v2.4.1) attached.',
          timestamp: 'Just now',
        },
      ],
    };

    setTickets([created, ...tickets]);
    setSelectedTicketId(created.id);
    setIsComposerOpen(false);
    setNewSubject('');
    setNewDescription('');
    setNewRefId('');
    showToast(`✅ Ticket ${created.id} submitted successfully`);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    // Check privacy guard for sensitive keywords
    const lower = replyMessage.toLowerCase();
    if (lower.includes('otp') || lower.includes('password') || lower.includes('cvv') || lower.includes('upi pin')) {
      showToast('🔒 Privacy Guard Blocked: Do not type passwords, OTPs, or PINs in support messages.');
      return;
    }

    const updatedTickets = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'In review' as TicketStatus,
          lastUpdate: 'Just now',
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'Vendor' as const,
              senderName: 'Sri Lakshmi Store Staff',
              text: replyMessage.trim(),
              timestamp: 'Just now',
            },
          ],
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setReplyMessage('');
    showToast('💬 Message sent to GlowVAI Support Desk');
  };

  const handleQuickIssue = (topicCategory: TicketCategory, defaultSubject: string, defaultRef: string) => {
    setNewCategory(topicCategory);
    setNewSubject(defaultSubject);
    setNewRefId(defaultRef);
    setIsComposerOpen(true);
  };

  const handleResolveTicket = () => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, status: 'Resolved' as TicketStatus, lastUpdate: 'Just now' } : t
    );
    setTickets(updated);
    showToast(`✅ Ticket ${selectedTicket.id} marked as resolved`);
  };

  const handleEscalateTicket = () => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, status: 'Escalated' as TicketStatus, priority: 'Urgent' as TicketPriority, lastUpdate: 'Just now' } : t
    );
    setTickets(updated);
    showToast(`🚨 Ticket ${selectedTicket.id} escalated to Senior Merchant Relations Manager`);
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
              <Text style={styles.breadcrumbLink}>Help</Text>
              <Text style={styles.breadcrumbSep}> / </Text>
              <Text style={styles.breadcrumbCurrent}>Merchant support</Text>
            </View>
            <Text style={styles.pageTitle}>Merchant support</Text>
            <Text style={styles.subCaption}>
              Get 24/7 assistance with orders, bank payouts, inventory sync, or compliance.
            </Text>
          </View>
          <View style={styles.headerRightControls}>
            <View style={styles.statusPillOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Support Desk Online (~12m response)</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsComposerOpen(true)}>
              <Text style={styles.primaryBtnText}>+ Contact support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Help Search Bar */}
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={18} color="#475569" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics, error codes, order IDs, or settlement UTRs..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={18} style={{ color: '#475569' }} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Self-Service Help Topics Grid */}
        <Text style={styles.sectionHeaderTitle}>Explore help topics by category</Text>
        <View style={styles.topicGrid}>
          {HELP_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicCard}
              onPress={() => {
                setSearchQuery(topic.category);
              }}
            >
              <View style={styles.topicCardTop}>
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                {topic.openCount > 0 && (
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>{topic.openCount} Open Ticket</Text>
                  </View>
                )}
              </View>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicDesc}>{topic.desc}</Text>
              <Text style={styles.topicPopular}>🔗 {topic.popular}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Need Help Now Contextual Action Bar */}
        <View style={styles.quickActionCard}>
          <Text style={styles.quickActionTitle}>⚡ Need immediate help? Quick report shortcuts:</Text>
          <View style={styles.quickActionButtonsRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickIssue('Orders', 'Delayed rider dispatch for active packing order', 'Order #GV-9912')}
            >
              <Text style={styles.quickBtnText}>📦 Report Order Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickIssue('Payments', 'Payout discrepancy for latest settlement cycle', 'Payout #SET-4912')}
            >
              <Text style={styles.quickBtnText}>💳 Payout Not Received</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickIssue('Compliance', 'FSSAI/Cosmetic license verification retry', 'Doc Ref #LIC-9982')}
            >
              <Text style={styles.quickBtnText}>📄 License Upload Problem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickIssue('Catalog', 'Bulk inventory CSV upload error code 402', 'Catalog Batch #9921')}
            >
              <Text style={styles.quickBtnText}>💄 Catalog Sync Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtnAlert}
              onPress={() => handleQuickIssue('Security', 'Unrecognized login notification attempt', 'Security Audit #SEC-01')}
            >
              <Text style={styles.quickBtnAlertText}>🔒 Security Concern</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Two-Column Ticketing Workspace */}
        <Text style={styles.sectionHeaderTitle}>Your support tickets & communication history</Text>
        <View style={styles.workspaceGrid}>
          {/* Left Column: Ticket List */}
          <View style={styles.leftColumn}>
            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>All ({tickets.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'open' && styles.filterTabActive]}
                onPress={() => setActiveTab('open')}
              >
                <Text style={[styles.filterTabText, activeTab === 'open' && styles.filterTabTextActive]}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'action' && styles.filterTabActive]}
                onPress={() => setActiveTab('action')}
              >
                <Text style={[styles.filterTabText, activeTab === 'action' && styles.filterTabTextActive]}>Action Req</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'resolved' && styles.filterTabActive]}
                onPress={() => setActiveTab('resolved')}
              >
                <Text style={[styles.filterTabText, activeTab === 'resolved' && styles.filterTabTextActive]}>Resolved</Text>
              </TouchableOpacity>
            </View>

            {/* Ticket List Cards */}
            {filteredTickets.length === 0 ? (
              <View style={styles.emptyTicketsBox}>
                <Ionicons name="ticket-outline" size={18} style={{ color: '#475569' }} />
                <Text style={styles.emptyTitle}>No matching tickets found</Text>
                <Text style={styles.emptySubtitle}>Try changing your filter criteria or search query.</Text>
              </View>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.ticketCardItem, isSelected && styles.ticketCardItemSelected]}
                    onPress={() => setSelectedTicketId(t.id)}
                  >
                    <View style={styles.ticketCardHeader}>
                      <Text style={styles.ticketIdText}>{t.id}</Text>
                      <View style={getStatusBadgeStyle(t.status)}>
                        <Text style={getStatusTextStyle(t.status)}>{t.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.ticketSubjectText} numberOfLines={2}>
                      {t.subject}
                    </Text>
                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.categoryBadge}>{t.category}</Text>
                      <Text style={styles.timestampText}>{t.lastUpdate}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Right Column: Selected Ticket Timeline & Chat Inspector */}
          <View style={styles.rightColumn}>
            {selectedTicket ? (
              <View style={styles.ticketDetailContainer}>
                {/* Ticket Header Inspector */}
                <View style={styles.detailHeaderBox}>
                  <View style={styles.detailTitleRow}>
                    <View style={styles.flex1}>
                      <View style={styles.flexRowItems}>
                        <Text style={styles.detailTicketId}>{selectedTicket.id}</Text>
                        <View style={getStatusBadgeStyle(selectedTicket.status)}>
                          <Text style={getStatusTextStyle(selectedTicket.status)}>{selectedTicket.status}</Text>
                        </View>
                        {selectedTicket.priority === 'Urgent' && (
                          <View style={styles.urgentPriorityPill}>
                            <Text style={styles.urgentPriorityText}>🔥 URGENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.detailSubject}>{selectedTicket.subject}</Text>
                      {selectedTicket.referenceId && (
                        <Text style={styles.referenceTag}>📌 Reference: {selectedTicket.referenceId}</Text>
                      )}
                    </View>

                    {/* Action Bar */}
                    <View style={styles.detailActionsRow}>
                      {selectedTicket.status !== 'Resolved' && (
                        <TouchableOpacity style={styles.resolveBtn} onPress={handleResolveTicket}>
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      )}
                      {selectedTicket.status !== 'Escalated' && selectedTicket.status !== 'Resolved' && (
                        <TouchableOpacity style={styles.escalateBtn} onPress={handleEscalateTicket}>
                          <Text style={styles.escalateBtnText}>Escalate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* System Auto Diagnostic Info Box */}
                  <View style={styles.systemMetadataBox}>
                    <Text style={styles.systemMetadataTitle}>🤖 Auto-Attached Store Diagnostics:</Text>
                    <Text style={styles.systemMetadataText}>
                      Store: Sri Lakshmi Beauty (DS-VIJ-01) • App Version: Web v2.4.1 • Network: 5G Active • SLA Response Target: 30 Mins
                    </Text>
                  </View>
                </View>

                {/* Timeline Messages Feed */}
                <ScrollView style={styles.messagesTimelineScroll} nestedScrollEnabled>
                  {selectedTicket.messages.map((m) => {
                    const isVendor = m.sender === 'Vendor';
                    const isSystem = m.sender === 'System';

                    if (isSystem) {
                      return (
                        <View key={m.id} style={styles.systemEventCard}>
                          <Text style={styles.systemEventText}>⚙️ {m.text}</Text>
                          <Text style={styles.systemEventTime}>{m.timestamp}</Text>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={m.id}
                        style={[
                          styles.msgBubbleContainer,
                          isVendor ? styles.msgVendorAlign : styles.msgSupportAlign,
                        ]}
                      >
                        <View style={[styles.msgBubble, isVendor ? styles.msgVendorBubble : styles.msgSupportBubble]}>
                          <Text style={styles.msgSenderName}>{m.senderName}</Text>
                          <Text style={styles.msgText}>{m.text}</Text>
                          <Text style={styles.msgTime}>{m.timestamp}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Safe Reply Composer Input */}
                {selectedTicket.status === 'Resolved' ? (
                  <View style={styles.resolvedNoticeBox}>
                    <Text style={styles.resolvedNoticeText}>
                      ✅ This ticket was marked as resolved. Need further help? You can send a message below to reopen it within 7 days.
                    </Text>
                    <TouchableOpacity
                      style={styles.reopenInlineBtn}
                      onPress={() => {
                        const updated = tickets.map((t) =>
                          t.id === selectedTicket.id ? { ...t, status: 'Open' as TicketStatus } : t
                        );
                        setTickets(updated);
                        showToast('🔓 Ticket reopened');
                      }}
                    >
                      <Text style={styles.reopenInlineText}>Reopen Ticket</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.composerContainer}>
                    {/* Privacy Guard Warning */}
                    <View style={styles.privacyGuardBanner}>
                      <Text style={styles.privacyGuardText}>
                        🔒 Privacy Guard: Never enter OTPs, bank passwords, UPI PINs, or confidential customer details.
                      </Text>
                    </View>

                    <View style={styles.replyInputRow}>
                      <TextInput
                        style={styles.replyTextInput}
                        placeholder="Type your reply to GlowVAI support team..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={replyMessage}
                        onChangeText={setReplyMessage}
                      />
                      <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply}>
                        <Text style={styles.sendBtnText}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyDetailBox}>
                <Text style={styles.emptyDetailText}>Select a ticket from the left column to view its history</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Structured New Ticket Composer Modal */}
      <Modal visible={isComposerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact GlowVAI Merchant Support</Text>
              <TouchableOpacity onPress={() => setIsComposerOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Picker */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPillsRow}>
                {(['Orders', 'Payments', 'Catalog', 'Compliance', 'Security', 'Technical'] as TicketCategory[]).map(
                  (cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, newCategory === cat && styles.catPillActive]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.catPillText, newCategory === cat && styles.catPillTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Priority Selector */}
              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.categoryPillsRow}>
                {(['Normal', 'High', 'Urgent'] as TicketPriority[]).map((prio) => (
                  <TouchableOpacity
                    key={prio}
                    style={[styles.catPill, newPriority === prio && styles.catPillActivePrio]}
                    onPress={() => setNewPriority(prio)}
                  >
                    <Text style={[styles.catPillText, newPriority === prio && styles.catPillTextActivePrio]}>
                      {prio}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject Input */}
              <Text style={styles.inputLabel}>Subject / Headline *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Settlement UTR credit delay or scanner driver error..."
                placeholderTextColor="#94A3B8"
                value={newSubject}
                onChangeText={setNewSubject}
              />

              {/* Reference ID Tag */}
              <Text style={styles.inputLabel}>Order / Settlement Reference (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Order #GV-9912 or Payout #SET-4912"
                placeholderTextColor="#94A3B8"
                value={newRefId}
                onChangeText={setNewRefId}
              />

              {/* Issue Description */}
              <Text style={styles.inputLabel}>Detailed Description & Context *</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe what happened, error codes displayed, or steps leading to the issue..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              {/* Auto Metadata Preview */}
              <View style={styles.privacyPreviewBox}>
                <Text style={styles.privacyPreviewTitle}>ℹ️ Auto-shared Support Diagnostic Context</Text>
                <Text style={styles.privacyPreviewDesc}>
                  To speed up resolution, the following non-sensitive information will be automatically attached: Store ID (DS-VIJ-01), App Build (Web v2.4.1), Store Operating Status (Open), and Last Active Timestamp.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsComposerOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateTicket}>
                <Text style={styles.modalSubmitText}>Submit Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helpers for Status Pill Styling
function getStatusBadgeStyle(status: TicketStatus) {
  switch (status) {
    case 'Open':
      return [styles.statusBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }];
    case 'Waiting for you':
      return [styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }];
    case 'In review':
      return [styles.statusBadge, { backgroundColor: '#E0E7FF', borderColor: '#C7D2FE' }];
    case 'Escalated':
      return [styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }];
    case 'Resolved':
      return [styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }];
  }
}

function getStatusTextStyle(status: TicketStatus) {
  switch (status) {
    case 'Open':
      return [styles.statusText, { color: '#1D4ED8' }];
    case 'Waiting for you':
      return [styles.statusText, { color: '#B45309' }];
    case 'In review':
      return [styles.statusText, { color: '#4338CA' }];
    case 'Escalated':
      return [styles.statusText, { color: '#B91C1C' }];
    case 'Resolved':
      return [styles.statusText, { color: '#15803D' }];
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  statusPillOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: 'rgba(15, 23, 42, 0.04)',
    shadowRadius: 6,
  },
  searchIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearch: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    width: Platform.OS === 'web' ? '31%' : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 280,
  },
  topicCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 26,
  },
  openBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  openBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B45309',
  },
  topicTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  topicDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  topicPopular: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  quickActionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 32,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 12,
  },
  quickActionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  quickBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  quickBtnAlert: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  quickBtnAlertText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
  workspaceGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    minHeight: 520,
  },
  leftColumn: {
    width: Platform.OS === 'web' ? '38%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
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
  ticketCardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  ticketCardItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
    borderWidth: 1.5,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketIdText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  ticketSubjectText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timestampText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  rightColumn: {
    width: Platform.OS === 'web' ? '60%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  ticketDetailContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailHeaderBox: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  detailTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  flex1: {
    flex: 1,
  },
  flexRowItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailTicketId: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSubject: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  referenceTag: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  urgentPriorityPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentPriorityText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resolveBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  resolveBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
  },
  escalateBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  escalateBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B91C1C',
  },
  systemMetadataBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  systemMetadataTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  systemMetadataText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  messagesTimelineScroll: {
    flex: 1,
    padding: 20,
    maxHeight: 320,
  },
  systemEventCard: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 8,
    maxWidth: '90%',
  },
  systemEventText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  systemEventTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  msgBubbleContainer: {
    marginBottom: 14,
    flexDirection: 'row',
  },
  msgVendorAlign: {
    justifyContent: 'flex-end',
  },
  msgSupportAlign: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 12,
  },
  msgVendorBubble: {
    backgroundColor: '#1D4ED8',
    borderBottomRightRadius: 2,
  },
  msgSupportBubble: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  msgSenderName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginBottom: 4,
    color: '#93C5FD',
  },
  msgText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  msgTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'right',
    marginTop: 6,
  },
  composerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  privacyGuardBanner: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  privacyGuardText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
  },
  replyInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
    minHeight: 44,
  },
  sendBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    fontSize: 14,
  },
  resolvedNoticeBox: {
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    alignItems: 'center',
  },
  resolvedNoticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 10,
  },
  reopenInlineBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reopenInlineText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyTicketsBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emptyDetailBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyDetailText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
    maxWidth: 620,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  catPillActive: {
    backgroundColor: '#1D4ED8',
  },
  catPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  catPillActivePrio: {
    backgroundColor: '#DC2626',
  },
  catPillTextActivePrio: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
  },
  modalTextArea: {
    minHeight: 80,
  },
  privacyPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  privacyPreviewTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  privacyPreviewDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
  },
  modalSubmitText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(MerchantSupportScreen, 'Support');
