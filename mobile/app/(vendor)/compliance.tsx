import Ionicons from '@expo/vector-icons/Ionicons';
import { withComingSoon } from '../../src/components/ComingSoon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

export type AuditCategory =
  | 'Order Fulfillment'
  | 'Inventory Adjustments'
  | 'Batch & Expiry'
  | 'Returns & Refunds'
  | 'Bank & Payout'
  | 'KYC & Documents'
  | 'Team Access'
  | 'Security Events';

export type AuditResultStatus = 'Success' | 'Pending Review' | 'Flagged Finding' | 'Blocked';

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  category: AuditCategory;
  actorName: string;
  actorRole: 'Store Owner' | 'Store Manager' | 'Inventory Lead' | 'Support Agent' | 'System Telemetry';
  actionType: string;
  objectRefId: string;
  previousState: string;
  newState: string;
  deviceContext: string;
  resultStatus: AuditResultStatus;
  immutableHash: string;
  linkedSupportTicket?: string;
}

export interface ReportCategoryCard {
  id: string;
  category: AuditCategory;
  title: string;
  description: string;
  dateCoverage: string;
  lastGeneratedDate: string;
  availableFormats: Array<'PDF' | 'CSV'>;
}

function ComplianceScreen() {
  const router = useRouter();
  const [accessScope] = useState<'Merchant-visible activity only' | 'Internal Support Telemetry View'>('Merchant-visible activity only');
  const [dataFreshness] = useState('Fresh as of 2 mins ago');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | AuditCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventRecord | null>(null);

  // Export Modal State
  const [isExportConfigOpen, setIsExportConfigOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [exportDateRange, setExportDateRange] = useState('Last 30 Days');
  const [privacyMaskingActive, setPrivacyMaskingActive] = useState(true);
  const [expiringDownloadUrl, setExpiringDownloadUrl] = useState<string | null>(null);

  const [reportCards] = useState<ReportCategoryCard[]>([
    { id: 'RC-01', category: 'Order Fulfillment', title: 'Order Fulfillment & Prep SLA Trail', description: 'Step-by-step order acceptance, packing timestamps, and rider handover audit logs.', dateCoverage: 'Oct 01 – Oct 09, 2026', lastGeneratedDate: 'Today, 08:00 AM', availableFormats: ['PDF', 'CSV'] },
    { id: 'RC-02', category: 'Inventory Adjustments', title: 'Inventory Adjustments & Stock Ledger', description: 'Manual stock overrides, wastage records, and automated quick commerce stock intake.', dateCoverage: 'Q3 2026 (Jul–Sep)', lastGeneratedDate: 'Oct 01, 2026', availableFormats: ['CSV', 'PDF'] },
    { id: 'RC-03', category: 'Batch & Expiry', title: 'Cosmetic Batch & Expiry Compliance Log', description: 'Lot number registration, shelf-life verification, and expiry clearance audits.', dateCoverage: 'Last 90 Days', lastGeneratedDate: 'Oct 05, 2026', availableFormats: ['PDF'] },
    { id: 'RC-04', category: 'Returns & Refunds', title: 'Customer Return & Inspection Audit Trail', description: 'Unboxing video verification, refund authorization, and store restocking logs.', dateCoverage: 'Last 30 Days', lastGeneratedDate: 'Yesterday, 06:15 PM', availableFormats: ['PDF', 'CSV'] },
    { id: 'RC-05', category: 'Bank & Payout', title: 'Bank Account & Settlement Changes Audit', description: 'Payout bank updates, 48-hour cooling period logs, and weekly UTR settlements.', dateCoverage: 'Year 2026 YTD', lastGeneratedDate: 'Oct 02, 2026', availableFormats: ['PDF'] },
    { id: 'RC-06', category: 'KYC & Documents', title: 'KYC, Tax & License Activity Ledger', description: 'VMC Trade license uploads, GSTIN certificates, and CDSCO permit verification trail.', dateCoverage: 'Permanent Record', lastGeneratedDate: 'Sep 28, 2026', availableFormats: ['PDF'] },
    { id: 'RC-07', category: 'Team Access', title: 'Team Access & RBAC Permission Changes', description: 'Staff invitations, role reassignments, and localized store context permission edits.', dateCoverage: 'Last 60 Days', lastGeneratedDate: 'Oct 04, 2026', availableFormats: ['CSV'] },
    { id: 'RC-08', category: 'Security Events', title: 'Security Activity & 2FA Challenge Log', description: 'Authentication attempts, IP geofence alerts, remote sign-outs, and Risk Desk flags.', dateCoverage: 'Last 30 Days', lastGeneratedDate: 'Today, 08:30 AM', availableFormats: ['PDF', 'CSV'] },
  ]);

  const [auditEvents] = useState<AuditEventRecord[]>([
    {
      id: 'EVT-8801',
      timestamp: 'Today, 08:30:14 AM',
      category: 'Security Events',
      actorName: 'Sathvik V.',
      actorRole: 'Store Owner',
      actionType: 'OWNER_LOGIN_OTP_VERIFIED',
      objectRefId: 'SESS-2026-8812',
      previousState: 'Unauthenticated Session',
      newState: 'Authenticated (Benz Circle Context)',
      deviceContext: 'Chrome 129 on Windows 11 • 182.73.•••.14 (Vijayawada)',
      resultStatus: 'Success',
      immutableHash: '8f9a4b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a',
    },
    {
      id: 'EVT-8790',
      timestamp: 'Today, 08:12:00 AM',
      category: 'Order Fulfillment',
      actorName: 'Ramesh K.',
      actorRole: 'Inventory Lead',
      actionType: 'ORDER_PACKED_SEALED',
      objectRefId: '#GV-9912',
      previousState: 'Accepted (Pending Packing)',
      newState: 'Packed & Tamper-Sealed',
      deviceContext: 'GlowVAI Vendor App v1.4 • Counter Tablet',
      resultStatus: 'Success',
      immutableHash: '7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    },
    {
      id: 'EVT-8742',
      timestamp: 'Yesterday, 04:15:30 PM',
      category: 'Bank & Payout',
      actorName: 'Sathvik V.',
      actorRole: 'Store Owner',
      actionType: 'PAYOUT_BANK_UPDATE_REQUESTED',
      objectRefId: 'BANK-ICICI-9921',
      previousState: 'HDFC Bank (••••4589)',
      newState: 'ICICI Bank (••••9921) [Cooling Period Active]',
      deviceContext: 'Firefox 128 on macOS • 49.207.•••.88 (Guntur)',
      resultStatus: 'Pending Review',
      immutableHash: '6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
    },
    {
      id: 'EVT-8650',
      timestamp: 'Oct 07, 02:40:11 PM',
      category: 'Inventory Adjustments',
      actorName: 'System Telemetry',
      actorRole: 'System Telemetry',
      actionType: 'STOCK_RESTOCK_DISPATCH_REC',
      objectRefId: 'SKU-MAY-FOUND-128',
      previousState: 'Shelf Stock: 3 units',
      newState: 'Suggested PO: +30 units (PO-2026-8801)',
      deviceContext: 'GlowVAI Replenishment Engine',
      resultStatus: 'Success',
      immutableHash: '5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d',
    },
    {
      id: 'EVT-8520',
      timestamp: 'Oct 05, 11:18:00 AM',
      category: 'Security Events',
      actorName: 'Unknown Actor',
      actorRole: 'System Telemetry',
      actionType: 'UNRECOGNIZED_LOCATION_LOGIN_BLOCKED',
      objectRefId: 'AUTH-CHALLENGE-992',
      previousState: 'IP Challenge Issued',
      newState: 'Access Blocked by Risk Desk',
      deviceContext: 'Safari on iPhone 15 Pro • 103.112.•••.99 (Mumbai)',
      resultStatus: 'Flagged Finding',
      immutableHash: '4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e',
      linkedSupportTicket: 'TKT-2026-9901',
    },
  ]);

  const filteredEvents = auditEvents.filter((evt) => {
    const matchesSearch =
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.objectRefId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.actorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategoryFilter !== 'all' && evt.category !== activeCategoryFilter) return false;
    return true;
  });

  const handleGenerateExpiringLink = () => {
    const mockUrl = `https://downloads.glowvai.com/reports/audit_dossier_${Date.now()}.${exportFormat.toLowerCase()}?token=SEC_EXP86400`;
    setExpiringDownloadUrl(mockUrl);
    Alert.alert('Secure Link Generated', `Expiring 24-Hour Download Link created ✓\n${mockUrl}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header & Access Scope Scoping */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.breadcrumb}>Reports / Audit</Text>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Compliance & Operational Audit Hub</Text>
            <View style={styles.scopePill}>
              <Text style={styles.scopePillText}>🔒 Scope: {accessScope}</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            Immutable traceability across orders, inventory, documents, payouts, team access, and security events. Data: {dataFreshness}.
          </Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={() => setIsExportConfigOpen(true)}>
          <Text style={styles.exportBtnText}>📥 Export Configured Audit</Text>
        </TouchableOpacity>
      </View>

      {/* 8 Report Category Cards Horizontal Grid */}
      <Text style={styles.sectionHeader}>1. Standard Operational Audit Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
        {reportCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.categoryCard}
            onPress={() => {
              setActiveCategoryFilter(card.category);
              Alert.alert('Category Filter Applied', `Filtered table view to ${card.title}`);
            }}
          >
            <Text style={styles.cardCatTag}>{card.category}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
            <Text style={styles.cardMeta}>Coverage: {card.dateCoverage}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFormat}>Formats: {card.availableFormats.join(', ')}</Text>
              <Text style={styles.cardActionText}>View Trail →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Audit Event Search & Filter Toolbar */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>2. Immutable Audit Trail Ledger</Text>
        <Text style={styles.ledgerNotice}>🔒 Records signed with cryptographic hash validation</Text>
      </View>

      <View style={styles.tableContainerCard}>
        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={12} style={{ color: '#94A3B8' }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Find event by Order ID, SKU, Settlement UTR, Staff, or Doc Ref..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.filterChip, activeCategoryFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveCategoryFilter('all')}
            >
              <Text style={[styles.filterChipText, activeCategoryFilter === 'all' && styles.filterChipTextActive]}>All Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeCategoryFilter === 'Order Fulfillment' && styles.filterChipActive]}
              onPress={() => setActiveCategoryFilter('Order Fulfillment')}
            >
              <Text style={[styles.filterChipText, activeCategoryFilter === 'Order Fulfillment' && styles.filterChipTextActive]}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeCategoryFilter === 'Inventory Adjustments' && styles.filterChipActive]}
              onPress={() => setActiveCategoryFilter('Inventory Adjustments')}
            >
              <Text style={[styles.filterChipText, activeCategoryFilter === 'Inventory Adjustments' && styles.filterChipTextActive]}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeCategoryFilter === 'Bank & Payout' && styles.filterChipActive]}
              onPress={() => setActiveCategoryFilter('Bank & Payout')}
            >
              <Text style={[styles.filterChipText, activeCategoryFilter === 'Bank & Payout' && styles.filterChipTextActive]}>Bank/Payout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeCategoryFilter === 'Security Events' && styles.filterChipActive]}
              onPress={() => setActiveCategoryFilter('Security Events')}
            >
              <Text style={[styles.filterChipText, activeCategoryFilter === 'Security Events' && styles.filterChipTextActive]}>Security</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Audit Log Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.4 }]}>TIMESTAMP</Text>
          <Text style={[styles.th, { flex: 1.6 }]}>ACTOR & ROLE</Text>
          <Text style={[styles.th, { flex: 2.0 }]}>ACTION & REF ID</Text>
          <Text style={[styles.th, { flex: 2.2 }]}>PREVIOUS → NEW STATE</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>RESULT</Text>
          <Text style={[styles.th, { flex: 1.0, textAlign: 'right' }]}>DETAILS</Text>
        </View>

        {/* Audit Rows */}
        {filteredEvents.map((evt) => {
          const isSuccess = evt.resultStatus === 'Success';
          const isFlagged = evt.resultStatus === 'Flagged Finding';
          return (
            <View key={evt.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.4, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 }]}>{evt.timestamp}</Text>
              <View style={{ flex: 1.6 }}>
                <Text style={styles.actorName}>{evt.actorName}</Text>
                <Text style={styles.actorRole}>{evt.actorRole}</Text>
              </View>
              <View style={{ flex: 2.0 }}>
                <Text style={styles.actionType}>{evt.actionType}</Text>
                <Text style={styles.refId}>Ref: {evt.objectRefId}</Text>
              </View>
              <View style={{ flex: 2.2 }}>
                <Text style={styles.stateTransition} numberOfLines={2}>
                  {evt.previousState} <Text style={{ color: '#1D4ED8' }}>→</Text> {evt.newState}
                </Text>
              </View>
              <View style={{ flex: 1.2 }}>
                <View
                  style={[
                    styles.resultPill,
                    isSuccess ? styles.resultSuccess : isFlagged ? styles.resultFlagged : styles.resultPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultPillText,
                      isSuccess ? styles.resultSuccessText : isFlagged ? styles.resultFlaggedText : styles.resultPendingText,
                    ]}
                  >
                    {evt.resultStatus}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1.0, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => setSelectedEvent(evt)}
                >
                  <Text style={styles.detailBtnText}>Inspect →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Expandable Event Drawer Modal */}
      {selectedEvent && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 520 }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Audit Record {selectedEvent.id}</Text>
                  <Text style={styles.modalSub}>{selectedEvent.category} • {selectedEvent.timestamp}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                  <Ionicons name="close" size={14} style={{ color: '#64748B' }} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Actor Name & Role</Text><Text style={styles.drawerVal}>{selectedEvent.actorName} ({selectedEvent.actorRole})</Text></View>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Action Type</Text><Text style={styles.drawerVal}>{selectedEvent.actionType}</Text></View>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Object Reference ID</Text><Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#1D4ED8' }}>{selectedEvent.objectRefId}</Text></View>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Previous State</Text><Text style={styles.drawerVal}>{selectedEvent.previousState}</Text></View>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>New Target State</Text><Text style={styles.drawerVal}>{selectedEvent.newState}</Text></View>
                <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Device / Source Context</Text><Text style={styles.drawerVal}>{selectedEvent.deviceContext}</Text></View>
                {selectedEvent.linkedSupportTicket && (
                  <View style={styles.drawerDetailRow}><Text style={styles.drawerLab}>Linked Support Case</Text><Text style={{ color: '#D97706', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{selectedEvent.linkedSupportTicket}</Text></View>
                )}

                <View style={styles.hashBox}>
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8', marginBottom: 2 }}>🔒 Cryptographic Audit Hash (SHA-256):</Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: '#475569', }}>{selectedEvent.immutableHash}</Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.modalCancelBtnText}>Close Event Inspection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Export Configuration Modal with Expiring Link */}
      <Modal visible={isExportConfigOpen} transparent animationType="fade" onRequestClose={() => setIsExportConfigOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Configure Secure Audit Export</Text>
                <Text style={styles.modalSub}>Role-based, privacy-safe export with expiring download URL</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExportConfigOpen(false)}>
                <Ionicons name="close" size={14} style={{ color: '#64748B' }} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginVertical: 12 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date Coverage Range</Text>
                <TextInput style={styles.formInput} value={exportDateRange} onChangeText={setExportDateRange} />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Export Format</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.formatOption, exportFormat === 'PDF' && styles.formatOptionActive]}
                      onPress={() => setExportFormat('PDF')}
                    >
                      <Text style={[styles.formatText, exportFormat === 'PDF' && styles.formatTextActive]}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formatOption, exportFormat === 'CSV' && styles.formatOptionActive]}
                      onPress={() => setExportFormat('CSV')}
                    >
                      <Text style={[styles.formatText, exportFormat === 'CSV' && styles.formatTextActive]}>CSV</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Privacy Masking</Text>
                  <TouchableOpacity
                    style={[styles.formatOption, privacyMaskingActive && styles.formatOptionActive]}
                    onPress={() => setPrivacyMaskingActive(!privacyMaskingActive)}
                  >
                    <Text style={[styles.formatText, privacyMaskingActive && styles.formatTextActive]}>
                      {privacyMaskingActive ? '🔒 Mask Sensitive' : '⚠️ Unmasked'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {expiringDownloadUrl && (
                <View style={styles.expiringUrlBox}>
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#16A34A', marginBottom: 2 }}>✅ Secure 24-Hour Link Active:</Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#1E40AF' }} numberOfLines={1}>{expiringDownloadUrl}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsExportConfigOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleGenerateExpiringLink}>
                <Text style={styles.modalSubmitBtnText}>Generate Expiring Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 24, maxWidth: 1280, alignSelf: 'center', width: '100%' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    marginBottom: 20,
  },
  breadcrumb: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  scopePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  scopePillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  headerSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  exportBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },

  sectionHeader: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  ledgerNotice: { fontSize: 12, color: '#16A34A', fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },

  cardsScroll: { flexDirection: 'row', marginBottom: 24 },
  categoryCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, width: 260, marginRight: 14 },
  cardCatTag: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  cardDesc: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', lineHeight: 15, marginBottom: 8 },
  cardMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 },
  cardFormat: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569' },
  cardActionText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },

  tableContainerCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 16 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12, marginBottom: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 340, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInput: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#0F172A' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', marginRight: 6 },
  filterChipActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  filterChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#1D4ED8', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },

  tableHeader: { flexDirection: 'row', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 6, marginBottom: 6 },
  th: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  td: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#475569' },
  actorName: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },
  actorRole: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B' },
  actionType: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  refId: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B' },
  stateTransition: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#475569' },
  resultPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  resultSuccess: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  resultSuccessText: { color: '#15803D', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  resultFlagged: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  resultFlaggedText: { color: '#B45309', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  resultPending: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  resultPendingText: { color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  resultPillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  detailBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  detailBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  modalSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  drawerDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  drawerLab: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B' },
  drawerVal: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A', maxWidth: 280, textAlign: 'right' },
  hashBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, marginTop: 8 },
  formGroup: { marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 10 },
  formLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569', marginBottom: 4 },
  formInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#0F172A' },
  formatOption: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  formatOptionActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  formatText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B' },
  formatTextActive: { color: '#1D4ED8', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  expiringUrlBox: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 8, padding: 10, marginTop: 8 },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalCancelBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalCancelBtnText: { color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  modalSubmitBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
});

export default withComingSoon(ComplianceScreen, 'Compliance & audit');
