/**
 * GlowVAI Master Control Tower & Admin Operations Console
 * ═══════════════════════════════════════════════════════════════════════════
 * Enterprise Operations & Fulfillment Control:
 *   • Multi-Dark-Store Overview (Vijayawada Instant Delivery Network)
 *   • Live Order Velocity & Dispatch Monitor
 *   • Instant Payout Settlement Batch Processing (T+1 RBI Protocol)
 *   • Vendor KYC Verification & Dark Store Status Toggles
 *   • Real-Time Support Tickets & Control Tower Hotline
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { soundService } from '../src/services/sound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_COLOR = '#1D4ED8';
const GREEN_COLOR = '#16A34A';
const RED_COLOR   = '#DC2626';

interface DarkStoreHub {
  id: string;
  code: string;
  name: string;
  locality: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  activeOrders: number;
  dailyGross: number;
  ridersAvailable: number;
  manager: string;
  phone: string;
}

const INITIAL_HUBS: DarkStoreHub[] = [
  {
    id: '1',
    code: 'DS-VIJ-01',
    name: 'Benz Circle Super-Hub #1',
    locality: 'MG Road, Benz Circle, Vijayawada',
    status: 'ONLINE',
    activeOrders: 14,
    dailyGross: 48920,
    ridersAvailable: 8,
    manager: 'Dark Store Merchant',
    phone: '8977855998',
  },
  {
    id: '2',
    code: 'DS-VIJ-02',
    name: 'Singh Nagar Micro-Hub',
    locality: 'Street 4, Singh Nagar, Vijayawada',
    status: 'ONLINE',
    activeOrders: 6,
    dailyGross: 22450,
    ridersAvailable: 4,
    manager: 'Kavitha R.',
    phone: '9876543210',
  },
  {
    id: '3',
    code: 'DS-VIJ-03',
    name: 'Payikapuram Fulfillment Center',
    locality: 'Sri Krishna Enclave, Payikapuram',
    status: 'BUSY',
    activeOrders: 18,
    dailyGross: 61300,
    ridersAvailable: 2,
    manager: 'Suresh Varma',
    phone: '9848022338',
  },
];

interface SupportTicket {
  id: string;
  storeCode: string;
  title: string;
  category: string;
  priority: 'CRITICAL' | 'URGENT' | 'NORMAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  time: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-8921',
    storeCode: 'DS-VIJ-01',
    title: 'Rider delayed for Order #ORD-849201 due to traffic',
    category: 'Rider Dispatch',
    priority: 'URGENT',
    status: 'OPEN',
    time: '4 mins ago',
  },
  {
    id: 'TCK-8919',
    storeCode: 'DS-VIJ-03',
    title: 'Shelf inventory discrepancy for Vitamin C Serum',
    category: 'Inventory',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    time: '28 mins ago',
  },
];

function AdminConsole() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'hubs' | 'settlements' | 'tickets' | 'compliance'>('hubs');
  const [hubs, setHubs] = useState<DarkStoreHub[]>(INITIAL_HUBS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');

  const totalNetworkGross = useMemo(() => {
    return hubs.reduce((acc, h) => acc + h.dailyGross, 0);
  }, [hubs]);

  const totalActiveOrders = useMemo(() => {
    return hubs.reduce((acc, h) => acc + h.activeOrders, 0);
  }, [hubs]);

  const toggleHubStatus = (id: string) => {
    soundService.playSuccessDing();
    setHubs(prev => prev.map(h => {
      if (h.id === id) {
        const nextStatus = h.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        return { ...h, status: nextStatus };
      }
      return h;
    }));
  };

  const handleApprovePayout = (batchId: string) => {
    soundService.playSuccessDing();
    Alert.alert('Payout Approved ⚡', `Batch ${batchId} approved and initiated via IMPS.`);
  };

  const handleResolveTicket = (ticketId: string) => {
    soundService.playSuccessDing();
    setTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, status: 'RESOLVED' } : t)));
    Alert.alert('Ticket Resolved ✅', `Ticket ${ticketId} has been resolved.`);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <View style={s.headerBar}>
        <TouchableOpacity
          style={s.backBtn}
          activeOpacity={0.75}
          onPress={() => router.push('/(vendor)/home')}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={s.headerTitle}>GlowVAI Master Control Tower</Text>
          <Text style={s.headerSubTitle}>Vijayawada Dark Store Central Operations</Text>
        </View>

        <View style={s.livePulseBadge}>
          <View style={s.livePulseDot} />
          <Text style={s.livePulseText}>LIVE OPS</Text>
        </View>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 3-Metric Network Overview ────────────────────────────────────────── */}
        <View style={s.metricsRow}>
          <View style={s.metricCard}>
            <Text style={s.metricLabel}>NETWORK GROSS</Text>
            <Text style={s.metricValue}>₹{totalNetworkGross.toLocaleString('en-IN')}</Text>
            <Text style={s.metricSub}>3 Active Hubs</Text>
          </View>

          <View style={s.metricCard}>
            <Text style={s.metricLabel}>ACTIVE QUEUE</Text>
            <Text style={[s.metricValue, { color: BRAND_COLOR }]}>{totalActiveOrders} pkgs</Text>
            <Text style={s.metricSub}>SLA Avg: 12.4m</Text>
          </View>

          <View style={s.metricCard}>
            <Text style={s.metricLabel}>RIDERS ON-DUTY</Text>
            <Text style={[s.metricValue, { color: GREEN_COLOR }]}>14 Online</Text>
            <Text style={s.metricSub}>100% Coverage</Text>
          </View>
        </View>

        {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
        <View style={s.navTabsRow}>
          {[
            { id: 'hubs', label: 'Dark Stores', icon: 'business' },
            { id: 'settlements', label: 'Payouts (T+1)', icon: 'wallet' },
            { id: 'tickets', label: 'Support Desk', icon: 'headset' },
            { id: 'compliance', label: 'KYC & Safety', icon: 'shield-checkmark' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tabBtn, isActive && s.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => {
                  soundService.playSuccessDing();
                  setActiveTab(tab.id as any);
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text style={[s.tabBtnText, isActive && s.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DARK STORE HUBS                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'hubs' && (
          <View>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>MICRO-FULFILLMENT HUBS ({hubs.length})</Text>
            </View>

            {hubs.map((hub) => (
              <View key={hub.id} style={s.hubCard}>
                <View style={s.hubCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.hubCodeBadge}>{hub.code}</Text>
                      <Text style={s.hubName} numberOfLines={1}>{hub.name}</Text>
                    </View>
                    <Text style={s.hubLocality}>{hub.locality}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      s.hubStatusPill,
                      hub.status === 'ONLINE' ? s.hubStatusOnline : s.hubStatusOffline,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleHubStatus(hub.id)}
                  >
                    <View
                      style={[
                        s.statusDot,
                        { backgroundColor: hub.status === 'ONLINE' ? GREEN_COLOR : RED_COLOR },
                      ]}
                    />
                    <Text
                      style={[
                        s.hubStatusText,
                        { color: hub.status === 'ONLINE' ? GREEN_COLOR : RED_COLOR },
                      ]}
                    >
                      {hub.status}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={s.hubStatsStrip}>
                  <View style={s.hubStatCol}>
                    <Text style={s.hubStatLabel}>Live Orders</Text>
                    <Text style={s.hubStatValue}>{hub.activeOrders} pkgs</Text>
                  </View>
                  <View style={s.hubStatDivider} />
                  <View style={s.hubStatCol}>
                    <Text style={s.hubStatLabel}>Today's Gross</Text>
                    <Text style={s.hubStatValue}>₹{hub.dailyGross.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={s.hubStatDivider} />
                  <View style={s.hubStatCol}>
                    <Text style={s.hubStatLabel}>Riders Ready</Text>
                    <Text style={s.hubStatValue}>{hub.ridersAvailable} active</Text>
                  </View>
                </View>

                <View style={s.hubFooterRow}>
                  <Text style={s.hubManagerText}>👤 Manager: {hub.manager} ({hub.phone})</Text>
                  <TouchableOpacity
                    style={s.hubActionBtn}
                    onPress={() => router.push('/(vendor)/home')}
                  >
                    <Text style={s.hubActionBtnText}>Inspect Hub ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SETTLEMENTS & PAYOUTS                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'settlements' && (
          <View>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>DAILY SETTLEMENT BATCHES (T+1 RBI)</Text>
            </View>

            {[
              {
                batchId: 'BAT-2026-1016',
                store: 'DS-VIJ-01 (Benz Circle)',
                amount: 43050,
                orders: 28,
                status: 'PENDING_APPROVAL',
                bank: 'HDFC Bank ••••4321',
              },
              {
                batchId: 'BAT-2026-1015',
                store: 'DS-VIJ-03 (Payikapuram)',
                amount: 53944,
                orders: 34,
                status: 'SCHEDULED',
                bank: 'ICICI Bank ••••8819',
              },
              {
                batchId: 'BAT-2026-1014',
                store: 'DS-VIJ-02 (Singh Nagar)',
                amount: 19756,
                orders: 12,
                status: 'SETTLED',
                bank: 'SBI ••••0042',
              },
            ].map((b) => (
              <View key={b.batchId} style={s.settlementCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={s.batchIdText}>{b.batchId}</Text>
                    <Text style={s.batchStoreText}>{b.store}</Text>
                  </View>
                  <Text style={s.batchAmountText}>₹{b.amount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={s.batchDetailsRow}>
                  <Text style={s.batchDetailSub}>{b.orders} orders • {b.bank}</Text>
                  {b.status === 'PENDING_APPROVAL' ? (
                    <TouchableOpacity
                      style={s.approveBtn}
                      activeOpacity={0.8}
                      onPress={() => handleApprovePayout(b.batchId)}
                    >
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                      <Text style={s.approveBtnText}>Authorize IMPS</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={s.settledTag}>
                      <Text style={s.settledTagText}>✓ {b.status}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: SUPPORT TICKETS & OPS TOWER                                   */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tickets' && (
          <View>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>ACTIVE DISPATCH & VENDOR ESCALATIONS</Text>
            </View>

            {tickets.map((t) => (
              <View key={t.id} style={s.ticketCard}>
                <View style={s.ticketHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.ticketIdText}>{t.id}</Text>
                    <View style={s.ticketStorePill}>
                      <Text style={s.ticketStorePillText}>{t.storeCode}</Text>
                    </View>
                  </View>
                  <Text style={[s.ticketPriorityText, { color: t.priority === 'CRITICAL' ? RED_COLOR : '#d97706' }]}>
                    {t.priority}
                  </Text>
                </View>

                <Text style={s.ticketTitleText}>{t.title}</Text>

                <View style={s.ticketFooterRow}>
                  <Text style={s.ticketTimeText}>{t.category} • {t.time}</Text>
                  {t.status !== 'RESOLVED' ? (
                    <TouchableOpacity
                      style={s.resolveBtn}
                      onPress={() => handleResolveTicket(t.id)}
                    >
                      <Text style={s.resolveBtnText}>Resolve Escalation</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.resolvedText}>✓ Resolved</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: COMPLIANCE & SAFETY                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'compliance' && (
          <View>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>REGULATORY & FSSAI COMPLIANCE</Text>
            </View>

            {[
              { title: 'GSTIN Registration Verification', desc: 'Active 37AAACG1234F1Z5 • 100% Tax Compliant', status: 'VERIFIED' },
              { title: 'FSSAI Food Safety & Skincare License', desc: 'Central License #10123999000142 • Valid till 2029', status: 'VERIFIED' },
              { title: 'Dark Store Cold-Chain Temperature Audit', desc: 'Monitored at 18.2°C (Optimal for serums & actives)', status: 'PASSED' },
              { title: 'Rider Background Verifications', desc: '14/14 Riders police-verified & Aadhaar authenticated', status: '100% PASS' },
            ].map((c, i) => (
              <View key={i} style={s.complianceCard}>
                <View style={s.complianceIconBox}>
                  <Ionicons name="shield-checkmark" size={20} color={GREEN_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.complianceTitle}>{c.title}</Text>
                  <Text style={s.complianceDesc}>{c.desc}</Text>
                </View>
                <View style={s.compliancePill}>
                  <Text style={s.compliancePillText}>{c.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLOR,
  },
  livePulseText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: BRAND_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // 3-Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },
  metricSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Nav Tabs
  navTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: BRAND_COLOR,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },

  // Section Header
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.6,
  },

  // Hub Card
  hubCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hubCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hubCodeBadge: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: BRAND_COLOR,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  hubLocality: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  hubStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hubStatusOnline: {
    backgroundColor: '#F0FDF4',
  },
  hubStatusOffline: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hubStatusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  hubStatsStrip: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  hubStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  hubStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  hubStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  hubStatValue: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 1,
  },
  hubFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  hubManagerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  hubActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hubActionBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: BRAND_COLOR,
  },

  // Settlement Card
  settlementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  batchIdText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
  },
  batchStoreText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  batchAmountText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: BRAND_COLOR,
  },
  batchDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  batchDetailSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GREEN_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  approveBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#ffffff',
  },
  settledTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  settledTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: GREEN_COLOR,
  },

  // Ticket Card
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketIdText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
  },
  ticketStorePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketStorePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  ticketPriorityText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  ticketTitleText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 17,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  ticketTimeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  resolveBtn: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resolveBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#ffffff',
  },
  resolvedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: GREEN_COLOR,
  },

  // Compliance Card
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  complianceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0f172a',
  },
  complianceDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  compliancePill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compliancePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: GREEN_COLOR,
  },
});

// Admin console is developer-only until role-based sign-in exists (audit C12).
export default function AdminConsoleScreen() {
  return __DEV__ ? <AdminConsole /> : null;
}
