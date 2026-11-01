/**
 * Vendor-customer order chat.
 * Phone: conversation list, then a full-width thread with back.
 * Desktop (1024px and up): rail, conversation list, thread and order context side by side.
 * Sample chats exist only in development builds and are labelled as sample data.
 * File: mobile/app/(vendor)/messages.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily } from '../../src/theme/typography';
import Wordmark from '../../src/components/Wordmark';
import AppHeader from '../../src/components/AppHeader';

export interface OrderConversationSummary {
  orderId: string;
  customerFirstName: string;
  locality: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  orderStatus: 'Packing' | 'Handover Ready' | 'Delivered' | 'Cancelled';
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'vendor' | 'system';
  text: string;
  timestamp: string;
  status?: 'sending' | 'delivered';
  substitution?: {
    originalProduct: string;
    suggestedProduct: string;
    priceDiff: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

// No messages API exists in src/services/api.ts yet, so composing stays off outside development builds.
const MESSAGING_LIVE = false;

const SAMPLE_CONVERSATIONS: OrderConversationSummary[] = [
  {
    orderId: 'GV-9912',
    customerFirstName: 'Priya S.',
    locality: 'Benz Circle',
    lastMessage: 'Shade 115 works for me! Please update the order.',
    lastMessageTime: '01:36 PM',
    unreadCount: 1,
    orderStatus: 'Packing',
  },
  {
    orderId: 'GV-9908',
    customerFirstName: 'Kavitha M.',
    locality: 'Moghalrajpuram',
    lastMessage: 'Is transit seal double checked?',
    lastMessageTime: '01:15 PM',
    unreadCount: 0,
    orderStatus: 'Handover Ready',
  },
  {
    orderId: 'GV-9901',
    customerFirstName: 'Ananya R.',
    locality: 'Governorpet',
    lastMessage: 'Thank you for fast packing!',
    lastMessageTime: '12:40 PM',
    unreadCount: 0,
    orderStatus: 'Delivered',
  },
];

const SAMPLE_MESSAGES: Record<string, ChatMessage[]> = {
  'GV-9912': [
    {
      id: 'm1',
      sender: 'system',
      text: 'Order #GV-9912 created at 01:30 PM. Order-scoped privacy is active.',
      timestamp: '01:30 PM',
    },
    {
      id: 'm2',
      sender: 'customer',
      text: 'Hi! Can you please check if the Maybelline foundation shade 120 is available?',
      timestamp: '01:32 PM',
    },
    {
      id: 'm3',
      sender: 'vendor',
      text: 'Hello Priya! Shade 120 is out of stock. We have suggested Shade 115 as a replacement.',
      timestamp: '01:34 PM',
      status: 'delivered',
      substitution: {
        originalProduct: 'Maybelline Fit Me (Shade 120)',
        suggestedProduct: 'Maybelline Fit Me (Shade 115)',
        priceDiff: 'Same price',
        approvalStatus: 'APPROVED',
      },
    },
    {
      id: 'm4',
      sender: 'customer',
      text: 'Shade 115 works for me! Please update the order.',
      timestamp: '01:36 PM',
    },
  ],
};

const QUICK_REPLIES = [
  'Your replacement is ready for approval',
  'Your order is being packed',
  'Your order is sealed and ready for pickup',
  'Please confirm the shade substitution in your app',
];

const RAIL_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { label: 'Home', icon: 'home-outline', route: '/(vendor)/home' },
  { label: 'Orders', icon: 'clipboard-outline', route: '/(vendor)/orders' },
  { label: 'Catalog', icon: 'cube-outline', route: '/(vendor)/catalog' },
  { label: 'Returns', icon: 'return-up-back-outline', route: '/(vendor)/returns' },
  { label: 'Reviews', icon: 'star-outline', route: '/(vendor)/reviews' },
  { label: 'Messages', icon: 'chatbubble-outline', route: '/(vendor)/messages' },
  { label: 'Settings', icon: 'settings-outline', route: '/(vendor)/profile' },
];

// Contact guard: phone numbers, emails, URLs and UPI handles are blocked in order chats.
const contactGuardRegex = /(\+?\d{10,12}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\bupi\b|http|www\.)/i;

function statusTagColors(status: OrderConversationSummary['orderStatus']) {
  switch (status) {
    case 'Packing':
      return { bg: Colors.primaryLight, fg: Colors.primary };
    case 'Handover Ready':
      return { bg: Colors.warningLight, fg: Colors.warning };
    case 'Delivered':
      return { bg: Colors.successLight, fg: Colors.success };
    default:
      return { bg: Colors.dangerLight, fg: Colors.danger };
  }
}

function MessagesScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Production has no live conversations yet, so the list stays empty and the honest empty state shows.
  const conversations = useMemo<OrderConversationSummary[]>(
    () => (__DEV__ ? SAMPLE_CONVERSATIONS : []),
    []
  );
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>(
    () => (__DEV__ ? SAMPLE_MESSAGES : {})
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchConv, setSearchConv] = useState('');
  const [inputText, setInputText] = useState('');
  const [blockedContentMsg, setBlockedContentMsg] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Order Chats | GlowVAI Vendor';
    }
  }, []);

  // On desktop the first conversation is open by default; on phone the list shows first.
  const activeId = selectedOrderId ?? (isExpanded ? conversations[0]?.orderId ?? null : null);
  const activeConversation = conversations.find(c => c.orderId === activeId) || null;
  const activeMessages = activeId ? localMessages[activeId] || [] : [];
  const isClosed = activeConversation?.orderStatus === 'Delivered' || activeConversation?.orderStatus === 'Cancelled';
  const canCompose = __DEV__ && !MESSAGING_LIVE && !!activeConversation && !isClosed;
  const phoneThread = !isExpanded && selectedOrderId !== null && activeConversation !== null;

  const filteredConversations = useMemo(() => {
    const q = searchConv.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      c => c.orderId.toLowerCase().includes(q) || c.customerFirstName.toLowerCase().includes(q)
    );
  }, [conversations, searchConv]);

  const validateComposerContent = (text: string) => {
    if (contactGuardRegex.test(text)) {
      setBlockedContentMsg('For everyone’s safety, direct contact details (phone, email, URLs, or UPI handles) cannot be shared here.');
      return false;
    }
    setBlockedContentMsg('');
    return true;
  };

  const updateActiveMessages = (orderId: string, update: (prev: ChatMessage[]) => ChatMessage[]) => {
    setLocalMessages(prev => ({ ...prev, [orderId]: update(prev[orderId] || []) }));
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !activeId || !canCompose) return;
    if (!validateComposerContent(text)) return;

    const id = `m-${Date.now()}`;
    const orderId = activeId;
    updateActiveMessages(orderId, prev => [
      ...prev,
      {
        id,
        sender: 'vendor',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sending',
      },
    ]);
    setInputText('');

    // Local-only in development: marks the message delivered after a short delay.
    setTimeout(() => {
      updateActiveMessages(orderId, prev =>
        prev.map(m => (m.id === id ? { ...m, status: 'delivered' } : m))
      );
    }, 400);
  };

  const handleSelectQuickReply = (reply: string) => {
    setInputText(reply);
    validateComposerContent(reply);
  };

  const openConversation = (orderId: string) => {
    setSelectedOrderId(orderId);
    setBlockedContentMsg('');
    setInputText('');
  };

  // ── Conversation list ───────────────────────────────────────────────────────
  const conversationList = (
    <View style={[s.convListCol, isExpanded ? s.convListColDesktop : s.convListColPhone]}>
      <View style={s.convHeaderBox}>
        <View style={s.convHeaderTop}>
          <Text style={s.convHeaderTitle}>Order chats</Text>
          {__DEV__ && conversations.length > 0 && (
            <View style={s.sampleChip}>
              <Text style={s.sampleChipText}>Sample data</Text>
            </View>
          )}
        </View>
        <Text style={s.convHeaderSub}>Chats are scoped to each order</Text>
        {conversations.length > 0 && (
          <TextInput
            style={s.convSearchInput}
            placeholder="Search order # or customer"
            placeholderTextColor={Colors.textSubtle}
            value={searchConv}
            onChangeText={setSearchConv}
            accessibilityLabel="Search order chats"
          />
        )}
      </View>

      <ScrollView style={s.flex1} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIconBox}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>No order chats yet</Text>
            <Text style={s.emptyBody}>
              Customer chats appear here once an order is accepted. Each chat stays limited to its order.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(vendor)/orders' as any)} activeOpacity={0.8}>
              <Text style={s.emptyBtnText}>View orders</Text>
            </TouchableOpacity>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={s.noMatchWrap}>
            <Text style={s.noMatchText}>No chats match “{searchConv.trim()}”.</Text>
          </View>
        ) : (
          filteredConversations.map(c => {
            const isSelected = c.orderId === activeId;
            const tag = statusTagColors(c.orderStatus);
            return (
              <TouchableOpacity
                key={c.orderId}
                style={[s.convItemCard, isSelected && s.convItemCardSelected]}
                onPress={() => openConversation(c.orderId)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Open chat for order ${c.orderId}`}
              >
                <View style={s.convItemTopRow}>
                  <Text style={[s.convOrderIdText, isSelected && { color: Colors.primary }]}>#{c.orderId}</Text>
                  <Text style={s.convTimeText}>{c.lastMessageTime}</Text>
                </View>
                <View style={s.convMetaRow}>
                  <Text style={s.convCustomerName} numberOfLines={1}>
                    {c.customerFirstName} • {c.locality}
                  </Text>
                  <View style={[s.convStatusTag, { backgroundColor: tag.bg }]}>
                    <Text style={[s.convStatusTagText, { color: tag.fg }]}>{c.orderStatus}</Text>
                  </View>
                </View>
                <Text style={s.convPreviewText} numberOfLines={1}>{c.lastMessage}</Text>
                {c.unreadCount > 0 && (
                  <View style={s.unreadBadgeChip}>
                    <Text style={s.unreadBadgeChipText}>{c.unreadCount} new</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  // ── Thread ──────────────────────────────────────────────────────────────────
  const threadCol = (
    <View style={s.chatThreadCol}>
      {isExpanded && activeConversation && (
        <View style={s.chatHeaderBar}>
          <View style={s.flex1}>
            <View style={s.titleRow}>
              <Text style={s.chatTitleText}>Order #{activeConversation.orderId}</Text>
              <View style={s.statusTag}>
                <Text style={s.statusTagText}>{activeConversation.orderStatus}</Text>
              </View>
            </View>
            <Text style={s.chatSubText}>{activeConversation.customerFirstName} • {activeConversation.locality}</Text>
          </View>
          <TouchableOpacity
            style={s.supportBtn}
            onPress={() => router.push('/(vendor)/support' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get support help"
          >
            <Text style={s.supportBtnText}>Get support help</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeConversation ? (
        <>
          <View style={s.privacyBanner}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
            <Text style={s.privacyBannerText}>
              Order-scoped privacy is on. Phone numbers, emails, links and UPI handles are blocked.
            </Text>
          </View>

          {isClosed && (
            <View style={activeConversation.orderStatus === 'Cancelled' ? s.cancelledBanner : s.archivedBanner}>
              <Text style={activeConversation.orderStatus === 'Cancelled' ? s.cancelledBannerText : s.archivedBannerText}>
                {activeConversation.orderStatus === 'Cancelled'
                  ? `Chat disabled. Order #${activeConversation.orderId} was cancelled.`
                  : `Chat archived. Order #${activeConversation.orderId} was delivered. Read-only.`}
              </Text>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={s.messageAreaScroll}
            contentContainerStyle={s.messageAreaContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {activeMessages.length === 0 ? (
              <Text style={s.threadEmptyText}>No messages in this chat yet.</Text>
            ) : (
              activeMessages.map(msg => {
                if (msg.sender === 'system') {
                  return (
                    <View key={msg.id} style={s.systemMessageBubble}>
                      <Text style={s.systemMessageText}>{msg.text}</Text>
                    </View>
                  );
                }

                const isVendor = msg.sender === 'vendor';
                return (
                  <View key={msg.id} style={[s.messageRow, isVendor ? s.messageRowVendor : s.messageRowCustomer]}>
                    <View style={[s.messageBubble, isVendor ? s.messageBubbleVendor : s.messageBubbleCustomer]}>
                      <Text style={[s.messageText, isVendor ? s.messageTextVendor : s.messageTextCustomer]}>{msg.text}</Text>

                      {msg.substitution && (
                        <View style={s.substitutionCard}>
                          <View style={s.subHeaderRow}>
                            <Text style={s.subCardTitle}>SUBSTITUTION</Text>
                            <View style={[s.subApprovalBadge, msg.substitution.approvalStatus !== 'APPROVED' && { backgroundColor: Colors.warningLight }]}>
                              <Text style={[s.subApprovalBadgeText, msg.substitution.approvalStatus !== 'APPROVED' && { color: Colors.warning }]}>
                                {msg.substitution.approvalStatus === 'APPROVED' ? 'Customer approved' : 'Awaiting approval'}
                              </Text>
                            </View>
                          </View>
                          <Text style={s.subOriginalText}>{msg.substitution.originalProduct}</Text>
                          <Text style={s.subSuggestedText}>{msg.substitution.suggestedProduct}</Text>
                          <Text style={s.subPriceText}>{msg.substitution.priceDiff}</Text>
                        </View>
                      )}

                      <View style={s.metaRow}>
                        <Text style={[s.timestampText, isVendor && s.timestampTextVendor]}>{msg.timestamp}</Text>
                        {isVendor && msg.status && (
                          <Ionicons
                            name={msg.status === 'sending' ? 'time-outline' : 'checkmark-done-outline'}
                            size={14}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {canCompose && (
            <View style={s.quickRepliesBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRepliesScroll}>
                {QUICK_REPLIES.map(reply => (
                  <TouchableOpacity
                    key={reply}
                    style={s.quickReplyChip}
                    onPress={() => handleSelectQuickReply(reply)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.quickReplyChipText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={s.composerCard}>
            {blockedContentMsg !== '' && (
              <View style={s.blockedContentBanner}>
                <Text style={s.blockedContentBannerText}>{blockedContentMsg}</Text>
              </View>
            )}

            {canCompose ? (
              <>
                <View style={s.inputRow}>
                  <TextInput
                    style={[s.composerInput, blockedContentMsg !== '' && s.composerInputError]}
                    placeholder="Write an order message"
                    placeholderTextColor={Colors.textSubtle}
                    value={inputText}
                    onChangeText={text => {
                      setInputText(text);
                      validateComposerContent(text);
                    }}
                    maxLength={300}
                    multiline
                    accessibilityLabel="Order message"
                  />
                  <TouchableOpacity
                    style={[s.sendBtn, (!inputText.trim() || blockedContentMsg !== '') && s.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || blockedContentMsg !== ''}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                  >
                    <Text style={s.sendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.characterGuidanceRow}>
                  <Text style={s.characterGuidanceText}>{inputText.length} / 300</Text>
                  <Text style={s.characterGuidanceText}>Order-scoped</Text>
                </View>
              </>
            ) : (
              <View style={s.notConnectedBox}>
                <Text style={s.notConnectedTitle}>
                  {isClosed ? 'This chat is closed' : 'Messaging is not connected yet'}
                </Text>
                <Text style={s.notConnectedBody}>
                  {isClosed
                    ? 'Messages can no longer be sent for this order.'
                    : 'Customer messages and replies will appear here once the order chat service is live.'}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={s.noSelectionWrap}>
          <Ionicons name="chatbubble-outline" size={28} color={Colors.textSubtle} />
          <Text style={s.noSelectionText}>
            {conversations.length === 0
              ? 'Order chats will show here once customers message about an order.'
              : 'Select an order chat to read the conversation.'}
          </Text>
        </View>
      )}
    </View>
  );

  // ── Order context (desktop) ───────────────────────────────────────────────
  const lastSubstitution = [...activeMessages].reverse().find(m => m.substitution)?.substitution;
  const contextCol = activeConversation ? (
    <View style={s.orderContextCol}>
      <View style={s.contextCard}>
        <Text style={s.contextLabel}>ORDER</Text>
        <Text style={s.contextTitle}>#{activeConversation.orderId}</Text>
        <Text style={s.contextBody}>{activeConversation.customerFirstName} • {activeConversation.locality}</Text>
        <View style={[s.statusPill, { backgroundColor: statusTagColors(activeConversation.orderStatus).bg }]}>
          <Text style={[s.statusPillText, { color: statusTagColors(activeConversation.orderStatus).fg }]}>
            {activeConversation.orderStatus}
          </Text>
        </View>
      </View>

      {lastSubstitution && (
        <View style={s.contextCard}>
          <Text style={s.contextLabel}>ACTIVE SUBSTITUTION</Text>
          <Text style={s.subOriginalText}>{lastSubstitution.originalProduct}</Text>
          <Text style={s.subSuggestedText}>{lastSubstitution.suggestedProduct}</Text>
          <Text style={s.contextBody}>
            {lastSubstitution.approvalStatus === 'APPROVED' ? 'Customer approved' : 'Awaiting customer approval'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={s.primaryBtn}
        onPress={() => router.push({ pathname: '/(vendor)/order-detail', params: { orderId: activeConversation.orderId } } as any)}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={s.primaryBtnText}>Open order details</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <SafeAreaView style={s.root}>
      {!isExpanded && (
        <AppHeader
          title={phoneThread && activeConversation ? `Order #${activeConversation.orderId}` : 'Order chats'}
          subtitle={phoneThread && activeConversation ? `${activeConversation.customerFirstName} • ${activeConversation.locality}` : undefined}
          showBack
          onBack={phoneThread ? () => setSelectedOrderId(null) : undefined}
        />
      )}

      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.desktopLayout}>
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

                {RAIL_ITEMS.map(item => {
                  const active = item.route === '/(vendor)/messages';
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[s.railNavItem, active && s.railNavItemActive]}
                      onPress={() => router.push(item.route as any)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Ionicons name={item.icon} size={18} color={active ? Colors.primary : Colors.textSecondary} />
                      <Text style={[s.railNavLabel, active && s.railNavLabelActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={s.railHelpBtn}
                onPress={() => router.push('/(vendor)/support' as any)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={s.railHelpText}>Help and support</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.threeColBody}>
            {(isExpanded || !phoneThread) && conversationList}
            {(isExpanded || phoneThread) && threadCol}
            {isExpanded && contextCol}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex1: {
    flex: 1,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  threeColBody: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Desktop rail */
  navRail: {
    width: 240,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandSub: {
    fontSize: 12,
    color: Colors.textSubtle,
    fontFamily: FontFamily.semibold,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    borderRadius: BorderRadii.input,
    marginBottom: 4,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  railNavLabelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  railHelpBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  railHelpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semibold,
  },

  /* Shared bits */
  sampleChip: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  sampleChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.warning,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  noMatchWrap: {
    padding: Spacing.lg,
  },
  noMatchText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  primaryBtn: {
    minHeight: 44,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },

  /* Conversation list */
  convListCol: {
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  convListColDesktop: {
    width: 300,
  },
  convListColPhone: {
    flex: 1,
    borderRightWidth: 0,
  },
  convHeaderBox: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  convHeaderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  convHeaderSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  convSearchInput: {
    minHeight: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  convItemCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convItemCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  convItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convOrderIdText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  convTimeText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
  },
  convMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  convCustomerName: {
    flexShrink: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semibold,
  },
  convStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  convStatusTagText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  convPreviewText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
  },
  unreadBadgeChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    marginTop: 6,
  },
  unreadBadgeChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },

  /* Thread */
  chatThreadCol: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  chatHeaderBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chatTitleText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  statusTag: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  statusTagText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },
  chatSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  supportBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.input,
  },
  supportBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  archivedBanner: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  archivedBannerText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelledBanner: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  cancelledBannerText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.danger,
    textAlign: 'center',
  },
  messageAreaScroll: {
    flex: 1,
  },
  messageAreaContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  threadEmptyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  systemMessageBubble: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginBottom: Spacing.md,
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  messageRow: {
    marginBottom: Spacing.md,
  },
  messageRowVendor: {
    alignItems: 'flex-end',
  },
  messageRowCustomer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
  },
  messageBubbleVendor: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  messageBubbleCustomer: {
    backgroundColor: '#334155',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  messageTextVendor: {
    color: '#FFFFFF',
  },
  messageTextCustomer: {
    color: '#FFFFFF',
  },
  substitutionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  subCardTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSubtle,
    letterSpacing: 0.5,
  },
  subApprovalBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  subApprovalBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.success,
  },
  subOriginalText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
    textDecorationLine: 'line-through',
  },
  subSuggestedText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  subPriceText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.success,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timestampTextVendor: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  quickRepliesBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  quickRepliesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  quickReplyChip: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.pill,
  },
  quickReplyChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },

  /* Composer */
  composerCard: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  blockedContentBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  blockedContentBannerText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.danger,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  composerInputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  sendBtn: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textSubtle,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  characterGuidanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  characterGuidanceText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSubtle,
  },
  notConnectedBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
  },
  notConnectedTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  notConnectedBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noSelectionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  noSelectionText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  /* Order context (desktop) */
  orderContextCol: {
    width: 320,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  contextCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  contextLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: Colors.textSubtle,
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  contextBody: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});

export default MessagesScreen;
