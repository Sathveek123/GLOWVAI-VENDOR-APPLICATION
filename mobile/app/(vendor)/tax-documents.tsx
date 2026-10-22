/**
 * SCREEN 23: GST Invoices & TCS/TDS Statements
 * File: mobile/app/(vendor)/tax-documents.tsx
 *
 * Production-grade tax documents center for GlowVAI Vendors.
 * Features:
 *   • Header with Financial Year selector & legal tax disclaimer banner
 *   • Full Disclaimer Modal clarifying informational business records
 *   • 3 Tabs: "Invoices", "GST Summary", "TCS & TDS"
 *   • Itemized slabs (18% Cosmetics, 5% Essential Skincare) & GSTR-1 table view
 *   • Monospace document references, Section 52 TCS & 194O TDS credit logs
 *   • Complete edge states (Loading, Empty, Generating, Expired link, Offline, Partial data)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { withComingSoon } from '../../src/components/ComingSoon';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import { soundService } from '../../src/services/sound';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

export interface TaxDoc {
  id: string;
  docNumber: string;
  period: string;
  docType: 'SERVICE_FEE_INVOICE' | 'TCS_CREDIT' | 'TDS_CREDIT' | 'GST_SUMMARY';
  taxableValue: number;
  taxAmount: number;
  totalAmount: number;
  status: 'AVAILABLE' | 'FILED' | 'PROCESSING' | 'EXPIRED' | 'NOT_AVAILABLE';
  quarter?: string;
  referenceNumber: string;
  fileFormat: 'PDF' | 'CSV';
  explanatoryNote?: string;
}

const MOCK_TAX_DOCUMENTS: TaxDoc[] = [
  {
    id: 'doc-1',
    docNumber: 'INV-2026-10-0012',
    period: 'October 2026',
    docType: 'SERVICE_FEE_INVOICE',
    taxableValue: 6602,
    taxAmount: 1188, // 18% GST on fee
    totalAmount: 7790,
    status: 'AVAILABLE',
    referenceNumber: 'REF-INV-20261001',
    fileFormat: 'PDF',
    explanatoryNote: '✓ Verified by GlowVAI Tax Engine',
  },
  {
    id: 'doc-2',
    docNumber: 'INV-2026-09-0098',
    period: 'September 2026',
    docType: 'SERVICE_FEE_INVOICE',
    taxableValue: 5880,
    taxAmount: 1058,
    totalAmount: 6938,
    status: 'AVAILABLE',
    referenceNumber: 'REF-INV-20260902',
    fileFormat: 'PDF',
    explanatoryNote: '✓ Downloadable PDF & CSV format',
  },
  {
    id: 'doc-3',
    docNumber: 'TCS-2026-Q2-8912',
    period: 'Q2 FY 2026–27 (Jul–Sep)',
    docType: 'TCS_CREDIT',
    taxableValue: 166500,
    taxAmount: 1665, // 1% TCS under Sec 52
    totalAmount: 1665,
    status: 'FILED',
    quarter: 'Q2 FY 2026-27',
    referenceNumber: 'FORM-27EQ-2026Q2',
    fileFormat: 'PDF',
    explanatoryNote: '✓ Deposited with Govt under Sec 52 CGST Act',
  },
  {
    id: 'doc-4',
    docNumber: 'TDS-2026-Q2-4410',
    period: 'Q2 FY 2026–27 (Jul–Sep)',
    docType: 'TDS_CREDIT',
    taxableValue: 166500,
    taxAmount: 1665, // 1% TDS under Sec 194O
    totalAmount: 1665,
    status: 'FILED',
    quarter: 'Q2 FY 2026-27',
    referenceNumber: 'FORM-26Q-2026Q2',
    fileFormat: 'PDF',
    explanatoryNote: '✓ Form 26Q return filed with Income Tax Dept',
  },
  {
    id: 'doc-5',
    docNumber: 'TCS-2026-Q3-9011',
    period: 'Q3 FY 2026–27 (Oct–Dec)',
    docType: 'TCS_CREDIT',
    taxableValue: 84000,
    taxAmount: 840,
    totalAmount: 840,
    status: 'PROCESSING',
    quarter: 'Q3 FY 2026-27',
    referenceNumber: 'FORM-27EQ-2026Q3 (Draft)',
    fileFormat: 'PDF',
    explanatoryNote: '⌛ Compiling monthly electronic order ledgers',
  },
  {
    id: 'doc-6',
    docNumber: 'TDS-2026-Q4-0000',
    period: 'Q4 FY 2026–27 (Jan–Mar)',
    docType: 'TDS_CREDIT',
    taxableValue: 0,
    taxAmount: 0,
    totalAmount: 0,
    status: 'NOT_AVAILABLE',
    quarter: 'Q4 FY 2026-27',
    referenceNumber: 'Pending Quarter Close',
    fileFormat: 'PDF',
    explanatoryNote: '🔒 Statement available after March 31, 2027',
  },
  {
    id: 'doc-7',
    docNumber: 'INV-2026-08-0044',
    period: 'August 2026',
    docType: 'SERVICE_FEE_INVOICE',
    taxableValue: 4800,
    taxAmount: 864,
    totalAmount: 5664,
    status: 'EXPIRED',
    referenceNumber: 'REF-INV-20260804',
    fileFormat: 'PDF',
    explanatoryNote: '⚠️ Download link expired (15-day policy)',
  },
];

function TaxDocumentsScreen() {
  const router = useRouter();
  const { vendor } = useVendorStore();

  // Screen State
  const [financialYear, setFinancialYear] = useState<'FY2026_27' | 'FY2025_26'>('FY2026_27');
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'GST_SUMMARY' | 'TCS_TDS'>('INVOICES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'FILED' | 'PROCESSING' | 'EXPIRED' | 'NOT_AVAILABLE'>('ALL');
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edge & Simulation States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showDownloadError, setShowDownloadError] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [forcePartialYear, setForcePartialYear] = useState<boolean>(true);
  const [forceEmptyState, setForceEmptyState] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Tax Documents & GST Invoices | GlowVAI Vendor';
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    soundService.playSuccessDing();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDownloadDoc = (doc: TaxDoc) => {
    if (doc.status === 'EXPIRED') {
      Alert.alert(
        'Download Link Expired ⚠️',
        'This document download link has expired. A fresh download link has been requested and sent to your registered email.'
      );
      return;
    }
    soundService.playSuccessDing();
    Alert.alert('Download Started 📄', `Downloading ${doc.docNumber}.${doc.fileFormat.toLowerCase()} for ${doc.period}.`);
  };

  const filteredDocs = useMemo(() => {
    if (forceEmptyState) return [];
    return MOCK_TAX_DOCUMENTS.filter((doc) => {
      // Tab filter
      if (activeTab === 'INVOICES' && doc.docType !== 'SERVICE_FEE_INVOICE') return false;
      if (activeTab === 'TCS_TDS' && doc.docType !== 'TCS_CREDIT' && doc.docType !== 'TDS_CREDIT') return false;

      // Status filter
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.docNumber.toLowerCase().includes(q) ||
          doc.period.toLowerCase().includes(q) ||
          doc.referenceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTab, statusFilter, searchQuery, forceEmptyState]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Tax Documents</Text>
          <Text style={styles.headerSubTitle}>GSTIN: 37AAAAA****1Z5 • GlowVAI Compliance Center</Text>
        </View>

        {/* Financial Year Selector */}
        <TouchableOpacity
          style={styles.fySelectorBtn}
          onPress={() => {
            soundService.playSuccessDing();
            setFinancialYear(financialYear === 'FY2026_27' ? 'FY2025_26' : 'FY2026_27');
          }}
        >
          <Text style={styles.fySelectorText}>{financialYear === 'FY2026_27' ? 'FY 2026–27 ▼' : 'FY 2025–26 ▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Edge State Banners */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚡ Offline Mode — Displaying cached tax document metadata.
          </Text>
        </View>
      )}

      {forcePartialYear && (
        <View style={styles.partialBanner}>
          <Text style={styles.partialBannerText}>
            ⚠️ Data for FY 2026–27 is complete up to Q2 (Sep 2026). Q3 statement will finalize on Jan 15, 2027.
          </Text>
        </View>
      )}

      {isPermissionDenied && (
        <View style={styles.deniedBanner}>
          <Text style={styles.deniedBannerText}>
            🔒 Permission Denied — Access to GST tax documents requires Store Owner or Finance Admin privileges.
          </Text>
        </View>
      )}

      {/* Legal Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ℹ️ Documents are generated by GlowVAI and your sales records. Please consult your tax advisor for filing.
        </Text>
        <TouchableOpacity
          style={styles.disclaimerIconBtn}
          onPress={() => {
            soundService.playSuccessDing();
            setShowDisclaimerModal(true);
          }}
        >
          <Text style={styles.disclaimerIconText}>ℹ️ Info</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
      >
        {/* DEV TESTING STRIP */}
        {__DEV__ && (
        <View style={styles.devStrip}>
          <Text style={styles.devTitle}>TEST TAX DOCUMENT EDGE STATES:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
            <TouchableOpacity
              style={[styles.devPill, isLoading && styles.devPillActive]}
              onPress={() => setIsLoading(!isLoading)}
            >
              <Text style={styles.devPillText}>Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isGenerating && styles.devPillActive]}
              onPress={() => setIsGenerating(!isGenerating)}
            >
              <Text style={styles.devPillText}>Generating</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isOffline && styles.devPillActive]}
              onPress={() => setIsOffline(!isOffline)}
            >
              <Text style={styles.devPillText}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, forceEmptyState && styles.devPillActive]}
              onPress={() => setForceEmptyState(!forceEmptyState)}
            >
              <Text style={styles.devPillText}>No Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isPermissionDenied && styles.devPillActive]}
              onPress={() => setIsPermissionDenied(!isPermissionDenied)}
            >
              <Text style={styles.devPillText}>Permission Denied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => setShowDownloadError(true)}
            >
              <Text style={styles.devPillText}>Download Error</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ── THREE ACCESSIBLE TABS ────────────────────────────────────────── */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'INVOICES' && styles.tabBtnActive]}
            onPress={() => setActiveTab('INVOICES')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'INVOICES' && styles.tabBtnTextActive]}>
              📄 Invoices
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'GST_SUMMARY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('GST_SUMMARY')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'GST_SUMMARY' && styles.tabBtnTextActive]}>
              📊 GST Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'TCS_TDS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('TCS_TDS')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'TCS_TDS' && styles.tabBtnTextActive]}>
              🏛️ TCS & TDS
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH & STATUS FILTERS (Only for Invoices and TCS/TDS tabs) */}
        {activeTab !== 'GST_SUMMARY' && (
          <View style={styles.filterWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search document number or period..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPillsRow}>
              {(['ALL', 'AVAILABLE', 'FILED', 'PROCESSING', 'EXPIRED', 'NOT_AVAILABLE'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusFilterPill, statusFilter === st && styles.statusFilterPillActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.statusFilterText, statusFilter === st && styles.statusFilterTextActive]}>
                    {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── TAB 1 & TAB 3: INVOICES & TCS/TDS LIST ───────────────────────── */}
        {activeTab !== 'GST_SUMMARY' && (
          <View style={styles.card}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={COLOR_ROYAL_BLUE} />
                <Text style={styles.loadingText}>Fetching tax documents...</Text>
              </View>
            ) : isGenerating ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={COLOR_AMBER} />
                <Text style={styles.loadingText}>Generating monthly GST statement PDF...</Text>
              </View>
            ) : filteredDocs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No tax documents found</Text>
                <Text style={styles.emptySub}>
                  No documents match your query for {financialYear === 'FY2026_27' ? 'FY 2026–27' : 'FY 2025–26'}.
                </Text>
                {forceEmptyState && (
                  <TouchableOpacity style={styles.resetBtn} onPress={() => setForceEmptyState(false)}>
                    <Text style={styles.resetBtnText}>Restore Documents</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredDocs.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docLeft}>
                    <View style={styles.docHeaderRow}>
                      <Text style={styles.docKindText}>
                        {doc.docType === 'SERVICE_FEE_INVOICE'
                          ? 'GlowVAI Service Fee Invoice'
                          : doc.docType === 'TCS_CREDIT'
                          ? 'Section 52 TCS Credit Statement'
                          : 'Section 194O TDS Credit Statement'}
                      </Text>
                      <View
                        style={[
                          styles.statusTag,
                          doc.status === 'AVAILABLE' || doc.status === 'FILED'
                            ? styles.statusAvailable
                            : doc.status === 'PROCESSING'
                            ? styles.statusProcessing
                            : styles.statusExpired,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusTagText,
                            doc.status === 'AVAILABLE' || doc.status === 'FILED'
                              ? styles.statusTextAvailable
                              : doc.status === 'PROCESSING'
                              ? styles.statusTextProcessing
                              : styles.statusTextExpired,
                          ]}
                        >
                          {doc.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.docNumText}>{doc.docNumber}</Text>
                    <Text style={styles.docPeriodText}>Period: {doc.period} • Ref: {doc.referenceNumber}</Text>
                    {doc.explanatoryNote && (
                      <Text style={{ fontSize: 12, color: COLOR_SLATE, marginTop: 3, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' }}>
                        {doc.explanatoryNote}
                      </Text>
                    )}
                  </View>

                  <View style={styles.docRight}>
                    <Text style={styles.docAmountText}>
                      {doc.totalAmount > 0 ? `₹${doc.totalAmount.toLocaleString('en-IN')}` : '₹0.00'}
                    </Text>
                    <Text style={styles.taxableSub}>
                      {doc.taxableValue > 0 ? `Taxable: ₹${doc.taxableValue.toLocaleString('en-IN')}` : 'Quarter Unclosed'}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.downloadBtn,
                        doc.status === 'EXPIRED' && styles.downloadBtnExpired,
                        doc.status === 'NOT_AVAILABLE' && { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                      ]}
                      onPress={() => handleDownloadDoc(doc)}
                      disabled={doc.status === 'NOT_AVAILABLE'}
                    >
                      <Text
                        style={[
                          styles.downloadBtnText,
                          doc.status === 'NOT_AVAILABLE' && { color: '#94A3B8' },
                        ]}
                      >
                        {doc.status === 'NOT_AVAILABLE'
                          ? '🔒 Not Available'
                          : doc.status === 'EXPIRED'
                          ? '⚠️ Refresh Link'
                          : `📥 Download ${doc.fileFormat}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 2: GST SUMMARY & SLAB BREAKDOWN TABLE ────────────────────── */}
        {activeTab === 'GST_SUMMARY' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>GST TAX PERIOD SLAB OVERVIEW</Text>
                <Text style={styles.cardSub}>Q2 FY 2026–27 (Jul 1 – Sep 30, 2026) • For GSTR-1 & 3B Reconciliation</Text>
              </View>
              <TouchableOpacity
                style={styles.exportGstrBtn}
                onPress={() =>
                  Alert.alert('GSTR-1 Data Exported 📄', 'GSTR-1 JSON and Excel summary downloaded for tax filing.')
                }
              >
                <Text style={styles.exportGstrBtnText}>📥 Export GSTR-1</Text>
              </TouchableOpacity>
            </View>

            {/* GST Summary Table */}
            <View style={styles.tableBox}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCol, { flex: 1.8 }]}>GST Rate Slab</Text>
                <Text style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}>Taxable Value</Text>
                <Text style={[styles.tableCol, { flex: 1.2, textAlign: 'right' }]}>CGST</Text>
                <Text style={[styles.tableCol, { flex: 1.2, textAlign: 'right' }]}>SGST</Text>
                <Text style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}>Total GST</Text>
              </View>

              {/* Row 1: 18% GST Slab */}
              <View style={styles.tableDataRow}>
                <View style={{ flex: 1.8 }}>
                  <Text style={styles.slabTitle}>18% GST Slab</Text>
                  <Text style={styles.slabSub}>Cosmetics, Perfumes & Makeup</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>₹1,24,500</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>₹11,205</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>₹11,205</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: 'right' }]}>₹22,410</Text>
              </View>

              {/* Row 2: 5% GST Slab */}
              <View style={styles.tableDataRow}>
                <View style={{ flex: 1.8 }}>
                  <Text style={styles.slabTitle}>5% GST Slab</Text>
                  <Text style={styles.slabSub}>Essential Skincare & Soaps</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>₹42,000</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>₹1,050</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>₹1,050</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: 'right' }]}>₹2,100</Text>
              </View>

              {/* Total Row */}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.totalColTitle, { flex: 1.8 }]}>Total Cumulative</Text>
                <Text style={[styles.totalColVal, { flex: 1.5, textAlign: 'right' }]}>₹1,66,500</Text>
                <Text style={[styles.totalColVal, { flex: 1.2, textAlign: 'right' }]}>₹12,255</Text>
                <Text style={[styles.totalColVal, { flex: 1.2, textAlign: 'right' }]}>₹12,255</Text>
                <Text style={[styles.totalColGrand, { flex: 1.5, textAlign: 'right' }]}>₹24,510</Text>
              </View>
            </View>

            <View style={styles.gstrHelperBox}>
              <Text style={styles.gstrHelperText}>
                ℹ️ TCS (1%) under Section 52 of CGST Act was deposited against your registered GSTIN 37AAAAA****1Z5. You can claim credit in your electronic cash ledger via GSTR-8.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── LEGAL DISCLAIMER FULL MODAL ──────────────────────────────────────── */}
      <Modal visible={showDisclaimerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Legal Tax Disclaimer & Terms</Text>
              <TouchableOpacity onPress={() => setShowDisclaimerModal(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.legalBodyParagraph}>
                1. <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>Informational Business Records Only:</Text> All tax invoices, TCS credit statements, and GST rate slab summaries generated by GlowVAI are compiled from raw electronic order logs and operational platform transactions.
              </Text>

              <Text style={styles.legalBodyParagraph}>
                2. <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>No Tax Advice Guaranteed:</Text> GlowVAI does not provide personalized tax filing, chartered accountancy advice, or legal opinion. Merchants are strictly required to verify figures with their independent CA or tax practitioner prior to submitting GSTR-1, GSTR-3B, or Income Tax returns.
              </Text>

              <Text style={styles.legalBodyParagraph}>
                3. <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>Statutory TCS & TDS Compliance:</Text> TCS under Section 52 of CGST Act and TDS under Section 194O are remitted directly to the Central Government of India under GlowVAI's registered e-commerce operator credentials.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowDisclaimerModal(false)}>
              <Text style={styles.modalPrimaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DOWNLOAD FAILURE ALERT MODAL */}
      <Modal visible={showDownloadError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>⚠️ Document Download Failed</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12 }}>
              Unable to download PDF statement. Connection timed out while communicating with the document server.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowDownloadError(false)}>
              <Text style={styles.modalPrimaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fySelectorBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  fySelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  offlineBanner: {
    backgroundColor: COLOR_AMBER,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  partialBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  partialBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  deniedBanner: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  deniedBannerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    textAlign: 'center',
  },

  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    flex: 1,
    lineHeight: 15,
  },
  disclaimerIconBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  disclaimerIconText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  devStrip: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 10,
  },
  devTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  devPillRow: {
    gap: 6,
  },
  devPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devPillActive: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderColor: COLOR_ROYAL_BLUE,
  },
  devPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#334155',
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  filterWrap: {
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillsRow: {
    gap: 6,
  },
  statusFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusFilterText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docLeft: {
    flex: 1,
    paddingRight: 10,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docKindText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusAvailable: { backgroundColor: '#DCFCE7' },
  statusProcessing: { backgroundColor: '#FEF3C7' },
  statusExpired: { backgroundColor: '#FEE2E2' },
  statusTagText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  statusTextAvailable: { color: COLOR_EMERALD },
  statusTextProcessing: { color: COLOR_AMBER },
  statusTextExpired: { color: COLOR_DANGER },

  docNumText: {
    fontSize: 12,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginTop: 2,
  },
  docPeriodText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  docRight: {
    alignItems: 'flex-end',
  },
  docAmountText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  taxableSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  downloadBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  downloadBtnExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: COLOR_DANGER,
  },
  downloadBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
  },

  // GST Summary Table
  exportGstrBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exportGstrBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  tableBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCol: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  slabTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  slabSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  tableCell: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tableTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
  },
  totalColTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  totalColVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  totalColGrand: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
  },
  gstrHelperBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  gstrHelperText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_ROYAL_BLUE,
    lineHeight: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  legalBodyParagraph: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },

  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default withComingSoon(TaxDocumentsScreen, 'Tax documents');
