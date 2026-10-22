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

export type CampaignStatus = 'Active' | 'Scheduled' | 'Draft' | 'Pending Review' | 'Paused' | 'Expired' | 'Rejected';
export type CampaignType = 'Percentage Discount' | 'Flat Discount' | 'Bundle Offer' | 'Expiry Clearance' | 'Low-Stock Sale';

export interface CampaignItem {
  id: string;
  name: string;
  type: CampaignType;
  skuCount: number;
  discountText: string;
  startDate: string;
  endDate: string;
  funding: string;
  redemptions: number;
  status: CampaignStatus;
  auditCreatedBy: string;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'CAMP-8801',
    name: 'Diwali Festive Skincare Glow Sale',
    type: 'Percentage Discount',
    skuCount: 6,
    discountText: '20% OFF',
    startDate: 'Oct 08, 2026',
    endDate: 'Oct 25, 2026',
    funding: 'Merchant Funded (100%)',
    redemptions: 142,
    status: 'Active',
    auditCreatedBy: 'Store Owner (Sri Lakshmi)',
  },
  {
    id: 'CAMP-8790',
    name: 'Foundation Batch Expiry Clearance',
    type: 'Expiry Clearance',
    skuCount: 4,
    discountText: '35% OFF',
    startDate: 'Oct 10, 2026',
    endDate: 'Nov 15, 2026',
    funding: 'Merchant Funded (100%)',
    redemptions: 48,
    status: 'Scheduled',
    auditCreatedBy: 'Ramesh K. (Manager)',
  },
  {
    id: 'CAMP-8720',
    name: 'GlowVAI Platform Beauty Co-Pay Offer',
    type: 'Flat Discount',
    skuCount: 12,
    discountText: '₹150 OFF (Min ₹999)',
    startDate: 'Oct 01, 2026',
    endDate: 'Oct 31, 2026',
    funding: 'Platform Co-Funded (50/50)',
    redemptions: 310,
    status: 'Active',
    auditCreatedBy: 'GlowVAI Growth Desk',
  },
  {
    id: 'CAMP-8650',
    name: 'Weekend Lipstick Bundle BOGO',
    type: 'Bundle Offer',
    skuCount: 2,
    discountText: 'Buy 1 Get 1 (50%)',
    startDate: 'Sep 25, 2026',
    endDate: 'Sep 28, 2026',
    funding: 'Merchant Funded (100%)',
    redemptions: 89,
    status: 'Expired',
    auditCreatedBy: 'Store Owner (Sri Lakshmi)',
  },
  {
    id: 'CAMP-8510',
    name: 'Over-Discounted Serum Flash Sale',
    type: 'Percentage Discount',
    skuCount: 1,
    discountText: '60% OFF',
    startDate: 'Oct 02, 2026',
    endDate: 'Oct 05, 2026',
    funding: 'Merchant Funded (100%)',
    redemptions: 0,
    status: 'Rejected',
    auditCreatedBy: 'Ramesh K. (Manager)',
  },
];

function PromotionsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'draft' | 'ending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [cName, setCName] = useState('');
  const [cType, setCType] = useState<CampaignType>('Percentage Discount');
  const [cDiscountVal, setCDiscountVal] = useState('20');
  const [cMinOrderVal, setCMinOrderVal] = useState('499');
  const [cMaxPerCustomer, setCMaxPerCustomer] = useState('1');

  // Confirmation Modal
  const [selectedPauseId, setSelectedPauseId] = useState<string | null>(null);

  // Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'active') return c.status === 'Active';
    if (activeTab === 'scheduled') return c.status === 'Scheduled';
    if (activeTab === 'draft') return c.status === 'Draft' || c.status === 'Pending Review';
    if (activeTab === 'ending') return c.status === 'Active' && c.endDate.includes('Oct 25');
    return true;
  });

  const handleCreateSubmit = () => {
    if (!cName.trim()) {
      showToast('⚠️ Please enter a campaign name');
      return;
    }

    const newCamp: CampaignItem = {
      id: `CAMP-${Math.floor(8000 + Math.random() * 1000)}`,
      name: cName.trim(),
      type: cType,
      skuCount: 4,
      discountText: cType === 'Percentage Discount' ? `${cDiscountVal}% OFF` : `₹${cDiscountVal} OFF`,
      startDate: 'Today, Oct 09',
      endDate: 'Oct 31, 2026',
      funding: 'Merchant Funded (100%)',
      redemptions: 0,
      status: 'Active',
      auditCreatedBy: 'Store Owner (Sri Lakshmi)',
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsWizardOpen(false);
    setWizardStep(1);
    setCName('');
    showToast(`✅ Campaign ${newCamp.id} created and activated!`);
  };

  const handleTogglePause = (id: string) => {
    setCampaigns(
      campaigns.map((c) => {
        if (c.id === id) {
          const nextStatus: CampaignStatus = c.status === 'Active' ? 'Paused' : 'Active';
          showToast(nextStatus === 'Paused' ? `⏸️ Campaign ${c.id} paused` : `▶️ Campaign ${c.id} resumed`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
    setSelectedPauseId(null);
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {notification && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{notification}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header & Breadcrumbs */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbLink}>Catalog</Text>
              <Text style={styles.breadcrumbSep}> / </Text>
              <Text style={styles.breadcrumbCurrent}>Promotions</Text>
            </View>
            <Text style={styles.pageTitle}>Promotions & Campaign Hub</Text>
            <Text style={styles.subCaption}>
              Create product discounts, expiry clearance offers, and customer flash sales for Sri Lakshmi Beauty Store.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsWizardOpen(true)}>
            <Text style={styles.primaryBtnText}>+ Create promotion</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Summary Metric Filter Cards */}
        <View style={styles.summaryGrid}>
          <TouchableOpacity
            style={[styles.summaryCard, activeTab === 'active' && styles.summaryCardActive]}
            onPress={() => setActiveTab('active')}
          >
            <View style={styles.cardTopRow}>
              <Ionicons name="radio-button-on" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValGreen}>3</Text>
            </View>
            <Text style={styles.cardLabel}>Active Campaigns</Text>
            <Text style={styles.cardSub}>Live on customer app</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, activeTab === 'scheduled' && styles.summaryCardActive]}
            onPress={() => setActiveTab('scheduled')}
          >
            <View style={styles.cardTopRow}>
              <Ionicons name="calendar-outline" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValAmber}>1</Text>
            </View>
            <Text style={styles.cardLabel}>Scheduled</Text>
            <Text style={styles.cardSub}>Starts upcoming date</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, activeTab === 'draft' && styles.summaryCardActive]}
            onPress={() => setActiveTab('draft')}
          >
            <View style={styles.cardTopRow}>
              <Ionicons name="create-outline" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValSlate}>1</Text>
            </View>
            <Text style={styles.cardLabel}>Drafts & Pending</Text>
            <Text style={styles.cardSub}>Review in progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, activeTab === 'ending' && styles.summaryCardActive]}
            onPress={() => setActiveTab('ending')}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.cardIcon}>⏱️</Text>
              <Text style={styles.cardValAmber}>1</Text>
            </View>
            <Text style={styles.cardLabel}>Ending Soon</Text>
            <Text style={styles.cardSub}>Expires in &lt;5 days</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => setActiveTab('all')}>
            <View style={styles.cardTopRow}>
              <Ionicons name="pricetags-outline" size={18} color="#475569" style={styles.cardIcon} />
              <Text style={styles.cardValBlue}>18</Text>
            </View>
            <Text style={styles.cardLabel}>Discounted SKUs</Text>
            <Text style={styles.cardSub}>Total products tagged</Text>
          </TouchableOpacity>
        </View>

        {/* Campaign Directory Table */}
        <View style={styles.tableCard}>
          {/* Table Header Filter Row */}
          <View style={styles.filterBarRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#475569" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search campaign name, offer type, or campaign ID..."
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
                  All ({campaigns.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'active' && styles.filterTabActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text style={[styles.filterTabText, activeTab === 'active' && styles.filterTabTextActive]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'scheduled' && styles.filterTabActive]}
                onPress={() => setActiveTab('scheduled')}
              >
                <Text style={[styles.filterTabText, activeTab === 'scheduled' && styles.filterTabTextActive]}>
                  Scheduled
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Columns Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thCell, { flex: 2 }]}>Campaign & Type</Text>
            <Text style={[styles.thCell, { flex: 1 }]}>Discount Value</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Products & Scope</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Schedule Duration</Text>
            <Text style={[styles.thCell, { flex: 0.8 }]}>Redemptions</Text>
            <Text style={[styles.thCell, { flex: 1 }]}>Status</Text>
            <Text style={[styles.thCell, { flex: 1, textAlign: 'right' }]}>Actions</Text>
          </View>

          {/* Table Data Rows */}
          {filteredCampaigns.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="pricetags-outline" size={18} color="#475569" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No promotions match criteria</Text>
            </View>
          ) : (
            filteredCampaigns.map((item) => (
              <View key={item.id} style={styles.tableDataRow}>
                {/* Campaign & Type */}
                <View style={[styles.tdCellBox, { flex: 2 }]}>
                  <Text style={styles.campTitle}>{item.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                    <Text style={styles.campIdText}>• {item.id}</Text>
                  </View>
                </View>

                {/* Discount Value */}
                <View style={[styles.tdCellBox, { flex: 1 }]}>
                  <Text style={styles.discountValText}>{item.discountText}</Text>
                </View>

                {/* Products & Scope */}
                <View style={[styles.tdCellBox, { flex: 1.2 }]}>
                  <Text style={styles.productsText}>{item.skuCount} Products Tagged</Text>
                  <Text style={styles.fundingText}>{item.funding}</Text>
                </View>

                {/* Schedule */}
                <View style={[styles.tdCellBox, { flex: 1.2 }]}>
                  <Text style={styles.scheduleText}>{item.startDate}</Text>
                  <Text style={styles.scheduleSubText}>to {item.endDate}</Text>
                </View>

                {/* Redemptions */}
                <View style={[styles.tdCellBox, { flex: 0.8 }]}>
                  <Text style={styles.redemptionsText}>{item.redemptions} Used</Text>
                </View>

                {/* Status Pill */}
                <View style={[styles.tdCellBox, { flex: 1 }]}>
                  <View style={getStatusBadgeStyle(item.status)}>
                    <Text style={getStatusTextStyle(item.status)}>{item.status}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.tdCellBox, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                  {item.status === 'Active' && (
                    <TouchableOpacity
                      style={styles.pauseBtn}
                      onPress={() => setSelectedPauseId(item.id)}
                    >
                      <Text style={styles.pauseBtnText}>Pause</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'Paused' && (
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => handleTogglePause(item.id)}
                    >
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Creation Wizard Drawer / Modal */}
      <Modal visible={isWizardOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalWizardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Promotion & Discount</Text>
              <TouchableOpacity onPress={() => setIsWizardOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            {/* Wizard Stepper Header */}
            <View style={styles.wizardStepperRow}>
              <View style={[styles.stepItem, wizardStep >= 1 && styles.stepItemActive]}>
                <Text style={[styles.stepNumber, wizardStep >= 1 && styles.stepNumberActive]}>1</Text>
                <Text style={styles.stepTitle}>Basics</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepItem, wizardStep >= 2 && styles.stepItemActive]}>
                <Text style={[styles.stepNumber, wizardStep >= 2 && styles.stepNumberActive]}>2</Text>
                <Text style={styles.stepTitle}>Pricing</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepItem, wizardStep >= 3 && styles.stepItemActive]}>
                <Text style={[styles.stepNumber, wizardStep >= 3 && styles.stepNumberActive]}>3</Text>
                <Text style={styles.stepTitle}>Preview</Text>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              {wizardStep === 1 && (
                <View>
                  <Text style={styles.inputLabel}>Campaign Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Diwali Skincare Flash Discount"
                    placeholderTextColor="#94A3B8"
                    value={cName}
                    onChangeText={setCName}
                  />

                  <Text style={styles.inputLabel}>Promotion Type</Text>
                  <View style={styles.typePillsGrid}>
                    {(
                      [
                        'Percentage Discount',
                        'Flat Discount',
                        'Bundle Offer',
                        'Expiry Clearance',
                      ] as CampaignType[]
                    ).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typePill, cType === t && styles.typePillActive]}
                        onPress={() => setCType(t)}
                      >
                        <Text style={[styles.typePillText, cType === t && styles.typePillTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {wizardStep === 2 && (
                <View>
                  <Text style={styles.inputLabel}>Discount Value ({cType === 'Percentage Discount' ? '%' : '₹'}) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 20"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={cDiscountVal}
                    onChangeText={setCDiscountVal}
                  />

                  <Text style={styles.inputLabel}>Minimum Order Value (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 499"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={cMinOrderVal}
                    onChangeText={setCMinOrderVal}
                  />

                  <Text style={styles.inputLabel}>Per-Customer Redemption Limit</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={cMaxPerCustomer}
                    onChangeText={setCMaxPerCustomer}
                  />
                </View>
              )}

              {wizardStep === 3 && (
                <View>
                  <Text style={styles.inputLabel}>Live Customer-Facing App Preview</Text>
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewTag}>- {cDiscountVal}% OFF</Text>
                      <Text style={styles.previewExpiry}>Expires Oct 31</Text>
                    </View>
                    <Text style={styles.previewProdTitle}>Minimalist 10% Niacinamide Serum</Text>
                    <View style={styles.previewPriceRow}>
                      <Text style={styles.previewDiscountPrice}>₹439.00</Text>
                      <Text style={styles.previewStrikePrice}>₹549.00</Text>
                    </View>
                    <Text style={styles.previewCampLabel}>Campaign: {cName || 'Diwali Flash Sale'}</Text>
                  </View>

                  <View style={styles.auditNoticeBox}>
                    <Text style={styles.auditNoticeTitle}>ℹ️ Authoritative Pricing Audit</Text>
                    <Text style={styles.auditNoticeText}>
                      Activating this campaign will update customer-facing catalog prices immediately across Vijayawada. Active orders currently in prep will retain agreed pricing.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {wizardStep > 1 && (
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setWizardStep(wizardStep - 1)}>
                  <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
              )}

              {wizardStep < 3 ? (
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setWizardStep(wizardStep + 1)}>
                  <Text style={styles.modalSubmitText}>Next Step →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateSubmit}>
                  <Text style={styles.modalSubmitText}>Activate Campaign</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Pause Modal */}
      <Modal visible={selectedPauseId !== null} transparent animationType="fade">
        {selectedPauseId && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.smallModal]}>
              <Text style={styles.alertIcon}>⏸️</Text>
              <Text style={styles.alertTitle}>Pause Promotion Campaign?</Text>
              <Text style={styles.alertText}>
                Pausing will remove the discount badge from customer search results immediately. Orders already placed will not be affected.
              </Text>
              <View style={styles.alertFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedPauseId(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtnDanger}
                  onPress={() => handleTogglePause(selectedPauseId)}
                >
                  <Text style={styles.modalConfirmTextDanger}>Confirm Pause</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// Status Pill Helpers
function getStatusBadgeStyle(status: CampaignStatus) {
  switch (status) {
    case 'Active':
      return [styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }];
    case 'Scheduled':
      return [styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }];
    case 'Draft':
    case 'Paused':
      return [styles.statusBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }];
    case 'Pending Review':
      return [styles.statusBadge, { backgroundColor: '#E0E7FF', borderColor: '#C7D2FE' }];
    case 'Expired':
      return [styles.statusBadge, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }];
    case 'Rejected':
      return [styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }];
  }
}

function getStatusTextStyle(status: CampaignStatus) {
  switch (status) {
    case 'Active':
      return [styles.statusText, { color: '#15803D' }];
    case 'Scheduled':
      return [styles.statusText, { color: '#B45309' }];
    case 'Draft':
    case 'Paused':
      return [styles.statusText, { color: '#475569' }];
    case 'Pending Review':
      return [styles.statusText, { color: '#4338CA' }];
    case 'Expired':
      return [styles.statusText, { color: '#94A3B8' }];
    case 'Rejected':
      return [styles.statusText, { color: '#B91C1C' }];
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: Platform.OS === 'web' ? '18.5%' : '48%',
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  summaryCardActive: {
    borderColor: '#1D4ED8',
    borderWidth: 1.5,
    backgroundColor: '#EFF6FF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  cardValGreen: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#16A34A',
  },
  cardValAmber: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#D97706',
  },
  cardValSlate: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#64748B',
  },
  cardValBlue: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSub: {
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
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  thCell: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdCellBox: {
    justifyContent: 'center',
  },
  campTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  campIdText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  discountValText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#16A34A',
  },
  productsText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  fundingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  scheduleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  scheduleSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  redemptionsText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  pauseBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pauseBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#B45309',
  },
  resumeBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  resumeBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#15803D',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalWizardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  smallModal: {
    maxWidth: 420,
    padding: 24,
    alignItems: 'center',
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
  wizardStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.5,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  stepNumberActive: {
    backgroundColor: '#1D4ED8',
  },
  stepTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  stepLine: {
    width: 30,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
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
    marginTop: 10,
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
  typePillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  typePillActive: {
    backgroundColor: '#1D4ED8',
  },
  typePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewTag: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewExpiry: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  previewProdTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  previewDiscountPrice: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#16A34A',
  },
  previewStrikePrice: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  previewCampLabel: {
    fontSize: 12,
    color: '#1D4ED8',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  auditNoticeBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 16,
  },
  auditNoticeTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  auditNoticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
  },
  modalSubmitText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 32,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 6,
  },
  alertText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  alertFooter: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalConfirmBtnDanger: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmTextDanger: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default withComingSoon(PromotionsScreen, 'Promotions');
