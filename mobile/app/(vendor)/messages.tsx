/**
 * SCREEN 20: Vendor-Customer Order Chat
 * Desktop 1440x1024 3-Column Operational Conversation Workstation
 * File: mobile/app/(vendor)/messages.tsx
 */
import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

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
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
  substitution?: {
    originalProduct: string;
    suggestedProduct: string;
    priceDiff: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

const CONVERSATIONS_LIST: OrderConversationSummary[] = [
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

const INITIAL_MESSAGES: ChatMessage[] = [
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
    text: 'Hello Priya! Shade 120 Classic Ivory is out of stock. We have suggested Shade 115 Light Ivory as a replacement.',
    timestamp: '01:34 PM',
    status: 'delivered',
    substitution: {
      originalProduct: 'Maybelline Fit Me (Shade 120 Classic Ivory)',
      suggestedProduct: 'Maybelline Fit Me (Shade 115 Light Ivory)',
      priceDiff: 'Same Price (₹0 diff)',
      approvalStatus: 'APPROVED',
    },
  },
  {
    id: 'm4',
    sender: 'customer',
    text: 'Shade 115 works for me! Please update the order.',
    timestamp: '01:36 PM',
  },
];

const QUICK_REPLIES = [
  'Your replacement is ready for approval',
  'Your order is being packed',
  'Your order is sealed and ready for pickup',
  'Please confirm the shade substitution in your app',
];

function MessagesScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const [conversations] = useState<OrderConversationSummary[]>(CONVERSATIONS_LIST);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('GV-9912');
  const [searchConv, setSearchConv] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Contact Guard Validation Error State
  const [blockedContentMsg, setBlockedContentMsg] = useState('');

  // System Edge States
  const [customerOffline, setCustomerOffline] = useState(false);
  const [chatExpired, setChatExpired] = useState(false);
  const [orderCancelled, setOrderCancelled] = useState(false);
  const [supportEscalated, setSupportEscalated] = useState(false);
  const [failedMessageDemo, setFailedMessageDemo] = useState(false);
  const [permissionDeniedDemo, setPermissionDeniedDemo] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Vendor-Customer Order Chat | GlowVAI Console';
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.orderId === selectedOrderId) || conversations[0];
  }, [conversations, selectedOrderId]);

  // Contact / Link Guard Regex (prohibits phone numbers, emails, URLs, UPI handles)
  const contactGuardRegex = /(\+?\d{10,12}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\bupi\b|http|www\.)/i;

  const validateComposerContent = (text: string) => {
    if (contactGuardRegex.test(text)) {
      setBlockedContentMsg('For everyone’s safety, direct contact details (phone, email, URLs, or UPI handles) cannot be shared here.');
      return false;
    }
    setBlockedContentMsg('');
    return true;
  };

  const handleSendMessage = (textToSend?: string) => {
    if (permissionDeniedDemo) {
      setBlockedContentMsg('🔒 Permission Error: Store Operator role does not have messaging privileges.');
      return;
    }

    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!validateComposerContent(text)) return;

    if (chatExpired) {
      setToastMessage({ text: '🔒 Chat closed: Order #' + selectedOrderId + ' is archived.' });
      return;
    }
    if (orderCancelled) {
      setToastMessage({ text: '⛔ Chat disabled: Order #' + selectedOrderId + ' was cancelled.' });
      return;
    }

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'vendor',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    // Simulate Network Send
    setTimeout(() => {
      if (failedMessageDemo) {
        setMessages(prev =>
          prev.map(m => (m.id === newMsg.id ? { ...m, status: 'failed' } : m))
        );
      } else {
        setMessages(prev =>
          prev.map(m => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m))
        );
      }
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 400);
  };

  const handleRetryMessage = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'delivered' } : m))
    );
    setToastMessage({ text: '✓ Message re-sent successfully' });
  };

  const handleSelectQuickReply = (reply: string) => {
    setInputText(reply);
    validateComposerContent(reply);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Left Navigation Rail ─────────────────────────────────────────────── */}
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

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/returns')} activeOpacity={0.8}>
                <Text style={s.railNavIcon}>↩️</Text>
                <Text style={s.railNavLabel}>Returns</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/reviews')} activeOpacity={0.8}>
                <Text style={s.railNavIcon}>⭐</Text>
                <Text style={s.railNavLabel}>Reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} activeOpacity={0.8}>
                <Ionicons name="chatbubble-outline" size={18} style={{ color: '#475569' }} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Messages</Text>
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
            </View>
          </View>
        )}

        {/* ── Main Content Console (3-Column Layout) ────────────────────────── */}
        <View style={s.mainConsole}>

          {/* System Edge State Simulator */}
          {__DEV__ && (
          <View style={s.simStripCard}>
            <Text style={s.simTitle}>TEST CHAT EDGE STATES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.simScrollContainer}>
              <TouchableOpacity
                style={[s.simChip, isTyping && s.simChipActive]}
                onPress={() => setIsTyping(!isTyping)}
              >
                <Text style={[s.simChipText, isTyping && s.simChipTextActive]}>{isTyping ? 'Stop Typing' : 'Customer Typing'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, customerOffline && s.simChipActive]}
                onPress={() => setCustomerOffline(!customerOffline)}
              >
                <Text style={[s.simChipText, customerOffline && s.simChipTextActive]}>Customer Offline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, chatExpired && s.simChipActive]}
                onPress={() => setChatExpired(!chatExpired)}
              >
                <Text style={[s.simChipText, chatExpired && s.simChipTextActive]}>Chat Expired</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, orderCancelled && s.simChipActive]}
                onPress={() => setOrderCancelled(!orderCancelled)}
              >
                <Text style={[s.simChipText, orderCancelled && s.simChipTextActive]}>Order Cancelled</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, failedMessageDemo && s.simChipActive]}
                onPress={() => setFailedMessageDemo(!failedMessageDemo)}
              >
                <Text style={[s.simChipText, failedMessageDemo && s.simChipTextActive]}>Simulate Send Failure</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.simChip, permissionDeniedDemo && s.simChipActive]}
                onPress={() => setPermissionDeniedDemo(!permissionDeniedDemo)}
              >
                <Text style={[s.simChipText, permissionDeniedDemo && s.simChipTextActive]}>Permission Denied</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.simChip}
                onPress={() => handleSendMessage('Test blocked phone: 9876543210')}
              >
                <Text style={s.simChipText}>Test Block Contact</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* 3-Column Body Composition */}
          <View style={s.threeColBody}>

            {/* ── LEFT COLUMN: Active Order Conversations (~320px) ─────────────── */}
            <View style={s.convListCol}>
              <View style={s.convHeaderBox}>
                <Text style={s.convHeaderTitle}>Active Order Chats</Text>
                <Text style={s.convHeaderSub}>Order-Scoped Operational Messages</Text>
                <TextInput
                  style={s.convSearchInput}
                  placeholder="Filter order # or customer..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchConv}
                  onChangeText={setSearchConv}
                />
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {conversations.map(c => {
                  const isSelected = c.orderId === selectedOrderId;
                  return (
                    <TouchableOpacity
                      key={c.orderId}
                      style={[s.convItemCard, isSelected && s.convItemCardSelected]}
                      onPress={() => setSelectedOrderId(c.orderId)}
                      activeOpacity={0.8}
                    >
                      <View style={s.convItemTopRow}>
                        <Text style={[s.convOrderIdText, isSelected && { color: Colors.primary }]}>#{c.orderId}</Text>
                        <Text style={s.convTimeText}>{c.lastMessageTime}</Text>
                      </View>

                      <View style={s.convMetaRow}>
                        <Text style={s.convCustomerName}>{c.customerFirstName} • {c.locality}</Text>
                        <View style={[
                          s.convStatusTag,
                          c.orderStatus === 'Packing' && { backgroundColor: Colors.primaryLight },
                          c.orderStatus === 'Handover Ready' && { backgroundColor: Colors.warningLight },
                          c.orderStatus === 'Delivered' && { backgroundColor: '#DCFCE7' },
                        ]}>
                          <Text style={[
                            s.convStatusTagText,
                            c.orderStatus === 'Packing' && { color: Colors.primary },
                            c.orderStatus === 'Handover Ready' && { color: Colors.warning },
                            c.orderStatus === 'Delivered' && { color: Colors.success },
                          ]}>
                            {c.orderStatus}
                          </Text>
                        </View>
                      </View>

                      <Text style={s.convPreviewText} numberOfLines={1}>"{c.lastMessage}"</Text>

                      {c.unreadCount > 0 && (
                        <View style={s.unreadBadgeChip}>
                          <Text style={s.unreadBadgeChipText}>{c.unreadCount} NEW</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── CENTER COLUMN: Active Chat Thread Workspace (~580px) ──────────── */}
            <View style={s.chatThreadCol}>

              {/* Top Chat Bar */}
              <View style={s.chatHeaderBar}>
                <View style={{ flex: 1 }}>
                  <View style={s.titleRow}>
                    <Text style={s.chatTitleText}>Order #{activeConversation.orderId}</Text>
                    <View style={s.statusTag}>
                      <Text style={s.statusTagText}>{activeConversation.orderStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={s.chatSubText}>Customer: {activeConversation.customerFirstName} • {activeConversation.locality} (Privacy Safe)</Text>
                </View>

                <TouchableOpacity
                  style={s.supportEscalateBtn}
                  onPress={() => setSupportEscalated(!supportEscalated)}
                >
                  <Text style={s.supportEscalateBtnText}>{supportEscalated ? '🛡️ Support Escalated' : 'Escalate to Support'}</Text>
                </TouchableOpacity>
              </View>

              {/* Visible Privacy Banner */}
              <View style={s.privacyBanner}>
                <Ionicons name="lock-closed-outline" size={18} style={{ color: '#475569' }} />
                <Text style={s.privacyBannerText}>
                  Order-scoped privacy is active. Phone numbers, emails, links, and UPI handles are blocked automatically.
                </Text>
              </View>

              {/* System Banners */}
              {customerOffline && (
                <View style={s.offlineBanner}>
                  <Text style={s.offlineBannerText}>📶 Customer is offline. Messages queued via GlowVAI App Push Notification.</Text>
                </View>
              )}

              {chatExpired && (
                <View style={s.expiredBanner}>
                  <Text style={s.expiredBannerText}>🔒 Chat archived — Order #{activeConversation.orderId} delivered. Chat read-only.</Text>
                </View>
              )}

              {orderCancelled && (
                <View style={s.cancelledBanner}>
                  <Text style={s.cancelledBannerText}>⛔ Chat disabled — Order #{activeConversation.orderId} was cancelled by customer.</Text>
                </View>
              )}

              {supportEscalated && (
                <View style={s.escalatedBanner}>
                  <Text style={s.escalatedBannerText}>🛡️ GlowVAI Support Audit has joined this order thread.</Text>
                </View>
              )}

              {/* Scrollable Message Area */}
              <ScrollView
                ref={scrollViewRef}
                style={s.messageAreaScroll}
                contentContainerStyle={s.messageAreaContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={s.unreadDivider}>
                  <View style={s.unreadDividerLine} />
                  <Text style={s.unreadDividerText}>── ORDER CONVERSATION THREAD ──</Text>
                  <View style={s.unreadDividerLine} />
                </View>

                {messages.map(msg => {
                  if (msg.sender === 'system') {
                    return (
                      <View key={msg.id} style={s.systemMessageBubble}>
                        <Text style={s.systemMessageText}>{msg.text}</Text>
                      </View>
                    );
                  }

                  const isVendor = msg.sender === 'vendor';

                  return (
                    <View
                      key={msg.id}
                      style={[
                        s.messageRow,
                        isVendor ? s.messageRowVendor : s.messageRowCustomer,
                      ]}
                    >
                      <View
                        style={[
                          s.messageBubble,
                          isVendor ? s.messageBubbleVendor : s.messageBubbleCustomer,
                        ]}
                      >
                        <Text
                          style={[
                            s.messageText,
                            isVendor ? s.messageTextVendor : s.messageTextCustomer,
                          ]}
                        >
                          {msg.text}
                        </Text>

                        {/* Structured Substitution Card */}
                        {msg.substitution && (
                          <View style={s.substitutionCard}>
                            <View style={s.subHeaderRow}>
                              <Text style={s.subCardTitle}>SUBSTITUTION PROPOSAL</Text>
                              <View style={[
                                s.subApprovalBadge,
                                msg.substitution.approvalStatus === 'APPROVED' && { backgroundColor: '#DCFCE7' },
                              ]}>
                                <Text style={[
                                  s.subApprovalBadgeText,
                                  msg.substitution.approvalStatus === 'APPROVED' && { color: Colors.success },
                                ]}>
                                  {msg.substitution.approvalStatus === 'APPROVED' ? '✓ Customer Approved' : '⌛ Pending Approval'}
                                </Text>
                              </View>
                            </View>

                            <Text style={s.subOriginalText}>Original: {msg.substitution.originalProduct}</Text>
                            <Text style={s.subSuggestedText}>Suggested: {msg.substitution.suggestedProduct}</Text>
                            <Text style={s.subPriceText}>Price Diff: {msg.substitution.priceDiff}</Text>
                          </View>
                        )}

                        <View style={s.metaRow}>
                          <Text style={[s.timestampText, isVendor && s.timestampTextVendor]}>
                            {msg.timestamp}
                          </Text>
                          {isVendor && msg.status && (
                            <Text style={s.statusCheckText}>
                              {msg.status === 'sending' ? '⏳' : msg.status === 'failed' ? '❌' : '✓✓'}
                            </Text>
                          )}
                        </View>

                        {msg.status === 'failed' && (
                          <TouchableOpacity
                            style={s.retryBtn}
                            onPress={() => handleRetryMessage(msg.id)}
                          >
                            <Text style={s.retryBtnText}>Tap to Retry Send</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}

                {isTyping && (
                  <View style={s.typingIndicatorRow}>
                    <View style={s.typingBubble}>
                      <Text style={s.typingText}>{activeConversation.customerFirstName} is typing…</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Quick Replies Strip */}
              <View style={s.quickRepliesBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRepliesScroll}>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={s.quickReplyChip}
                      onPress={() => handleSelectQuickReply(reply)}
                    >
                      <Text style={s.quickReplyChipText}>⚡ {reply}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Composer */}
              <View style={s.composerCard}>
                {blockedContentMsg !== '' && (
                  <View style={s.blockedContentBanner}>
                    <Text style={s.blockedContentBannerText}>🛑 {blockedContentMsg}</Text>
                  </View>
                )}

                <View style={s.inputRow}>
                  <TextInput
                    style={[s.composerInput, blockedContentMsg !== '' && s.composerInputError]}
                    placeholder={chatExpired || orderCancelled ? 'Chat closed for this order' : 'Write an order message…'}
                    placeholderTextColor={Colors.textMuted}
                    value={inputText}
                    onChangeText={text => {
                      setInputText(text);
                      validateComposerContent(text);
                    }}
                    editable={!chatExpired && !orderCancelled}
                    maxLength={300}
                    multiline
                  />

                  <TouchableOpacity
                    style={[
                      s.sendBtn,
                      (!inputText.trim() || blockedContentMsg !== '' || chatExpired || orderCancelled) && s.sendBtnDisabled,
                    ]}
                    onPress={() => handleSendMessage()}
                    disabled={!inputText.trim() || blockedContentMsg !== '' || chatExpired || orderCancelled}
                    activeOpacity={0.8}
                  >
                    <Text style={s.sendBtnText}>Send →</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.characterGuidanceRow}>
                  <Text style={s.characterGuidanceText}>{inputText.length} / 300 characters</Text>
                  <Text style={s.privacyHintText}>Order-scoped & encrypted</Text>
                </View>
              </View>

            </View>

            {/* ── RIGHT COLUMN: Order Context Panel (~340px) ────────────────────── */}
            {isExpanded && (
              <View style={s.orderContextCol}>
                <View style={s.contextHeaderCard}>
                  <Text style={s.contextHeaderTitle}>ORDER CONTEXT (#GV-9912)</Text>
                  <Text style={s.contextCustomerName}>Priya S. • Benz Circle Area</Text>
                  <Text style={s.contextTotalAmount}>Total Order: ₹1,224 (2 items)</Text>
                </View>

                {/* Preparation Stage */}
                <View style={s.stageCard}>
                  <Text style={s.stageCardTitle}>PREPARATION STAGE</Text>
                  <View style={s.stagePillActive}>
                    <Text style={s.stagePillActiveText}>📦 2 of 2 Items Verified in Pouch</Text>
                  </View>
                  <Text style={s.stageHint}>Rider assignment: SLA ETA 8 mins</Text>
                </View>

                {/* Structured Substitution Summary */}
                <View style={s.substitutionContextCard}>
                  <Text style={s.subContextTitle}>ACTIVE SUBSTITUTION</Text>
                  <Text style={s.subContextOriginal}>Original: Maybelline Fit Me (120 Ivory)</Text>
                  <Text style={s.subContextNew}>Suggested: Maybelline Fit Me (115 Ivory)</Text>

                  <View style={s.subStatusBadgeRow}>
                    <Text style={s.subStatusBadgeText}>✓ Customer Approved (01:36 PM)</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={s.contextActionsGroup}>
                  <TouchableOpacity
                    style={s.openOrderDetailsBtn}
                    onPress={() => router.push('/(vendor)/order-detail')}
                    activeOpacity={0.8}
                  >
                    <Text style={s.openOrderDetailsBtnText}>Open Order Details Workspace →</Text>
                  </TouchableOpacity>

                  <CustomerAppRedirectButton storeName="Your store" />
                </View>
              </View>
            )}

          </View>
        </View>

      </View>

      {/* Floating Toast */}
      {toastMessage && (
        <View style={s.toastBanner}>
          <Text style={s.toastText}>{toastMessage.text}</Text>
        </View>
      )}
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

  /* Left Rail */
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
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railNavGroup: {
    gap: 4,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  railNavLabel: {
    fontSize: 13,
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
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  railHelpText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Main Console Area */
  mainConsole: {
    flex: 1,
    backgroundColor: Colors.surface,
    flexDirection: 'column',
  },

  /* Edge State Simulator */
  simStripCard: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  simTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  simScrollContainer: {
    gap: Spacing.xs,
  },
  simChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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

  /* 3-Column Body Composition */
  threeColBody: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Left Column: Conversation List */
  convListCol: {
    width: 300,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  convHeaderBox: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convHeaderTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  convHeaderSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  convSearchInput: {
    height: 34,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.pill,
    paddingHorizontal: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
  },

  convItemCard: {
    padding: Spacing.md,
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
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  convTimeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  convMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convCustomerName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  convStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
  },
  convStatusTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  convPreviewText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  unreadBadgeChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    marginTop: 4,
  },
  unreadBadgeChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Center Column: Chat Thread */
  chatThreadCol: {
    flex: 1,
    backgroundColor: Colors.surface,
    flexDirection: 'column',
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chatTitleText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  chatSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  supportEscalateBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  supportEscalateBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },
  privacyBannerIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  privacyBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#3730A3',
    flex: 1,
  },

  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  expiredBanner: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expiredBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cancelledBanner: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },
  cancelledBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    textAlign: 'center',
  },
  escalatedBanner: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },
  escalatedBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#3730A3',
    textAlign: 'center',
  },

  messageAreaScroll: {
    flex: 1,
  },
  messageAreaContent: {
    padding: Spacing.lg,
  },
  unreadDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  unreadDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  unreadDividerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
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
  },
  systemMessageText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
    backgroundColor: Colors.primary, // Royal Blue #1D4ED8
    borderBottomRightRadius: 2,
  },
  messageBubbleCustomer: {
    backgroundColor: '#334155', // Slate dark
    borderBottomLeftRadius: 2,
  },

  messageText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextVendor: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },
  messageTextCustomer: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
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
    marginBottom: 4,
  },
  subCardTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  subApprovalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  subApprovalBadgePending: {
    backgroundColor: Colors.warningLight,
  },
  subApprovalBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  subOriginalText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  subSuggestedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  subPriceText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampTextVendor: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusCheckText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },

  retryBtn: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  retryBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFD1D1',
    textDecorationLine: 'underline',
  },

  typingIndicatorRow: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  typingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textMuted,
  },

  /* Quick Replies Bar */
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  quickReplyChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
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
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  blockedContentBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    lineHeight: 15,
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
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  composerInputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  characterGuidanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  characterGuidanceText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  privacyHintText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Right Column: Order Context Panel (~320px) */
  orderContextCol: {
    width: 320,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  contextHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextHeaderTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  contextCustomerName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  contextTotalAmount: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },

  stageCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stageCardTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stagePillActive: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.input,
  },
  stagePillActiveText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  stageHint: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  substitutionContextCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subContextTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  subContextOriginal: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  subContextNew: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  subStatusBadgeRow: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  subStatusBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },

  contextActionsGroup: {
    gap: Spacing.sm,
  },
  openOrderDetailsBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
  },
  openOrderDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});

export default withComingSoon(MessagesScreen, 'Customer messages');
