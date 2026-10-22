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

export type POStatus = 'Draft' | 'Sent' | 'Confirmed' | 'Partially Received' | 'Received' | 'Cancelled' | 'Overdue';

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  createdDate: string;
  expectedDelivery: string;
  totalUnits: number;
  receivedUnits: number;
  totalCost: number;
  status: POStatus;
  lastUpdate: string;
  items: Array<{
    id: string;
    productName: string;
    variant: string;
    orderedQty: number;
    receivedQty: number;
    unitCost: number;
    batchNumber?: string;
    expiryDate?: string;
  }>;
}

export interface ReplenishmentRecommendation {
  id: string;
  productName: string;
  sku: string;
  variant: string;
  supplier: string;
  currentStock: number;
  threshold: number;
  suggestedQty: number;
  expectedUnitCost: number;
}

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'PO-9912',
    supplierName: 'L\'Oréal Beauty India Pvt Ltd',
    createdDate: 'Oct 04, 2026',
    expectedDelivery: 'Oct 12, 2026',
    totalUnits: 120,
    receivedUnits: 72,
    totalCost: 42500,
    status: 'Partially Received',
    lastUpdate: '2 hours ago',
    items: [
      { id: 'i1', productName: 'Maybelline Fit Me Foundation', variant: 'Shade 128 (30ml)', orderedQty: 60, receivedQty: 36, unitCost: 350, batchNumber: 'LOT-MAY-88', expiryDate: '2028-09' },
      { id: 'i2', productName: 'L\'Oréal Paris Hyaluronic Serum', variant: '30ml bottle', orderedQty: 60, receivedQty: 36, unitCost: 358, batchNumber: 'LOT-LOR-12', expiryDate: '2028-11' },
    ],
  },
  {
    id: 'PO-9880',
    supplierName: 'Minimalist Skincare Distributors',
    createdDate: 'Oct 06, 2026',
    expectedDelivery: 'Oct 10, 2026',
    totalUnits: 80,
    receivedUnits: 0,
    totalCost: 28400,
    status: 'Confirmed',
    lastUpdate: 'Yesterday, 04:20 PM',
    items: [
      { id: 'i3', productName: 'Minimalist 10% Niacinamide Serum', variant: '30ml', orderedQty: 50, receivedQty: 0, unitCost: 355 },
      { id: 'i4', productName: 'Minimalist Salicylic Acid Cleanser', variant: '100ml', orderedQty: 30, receivedQty: 0, unitCost: 355 },
    ],
  },
  {
    id: 'PO-9750',
    supplierName: 'Cetaphil India Official Vendor',
    createdDate: 'Sep 28, 2026',
    expectedDelivery: 'Oct 03, 2026',
    totalUnits: 50,
    receivedUnits: 0,
    totalCost: 18500,
    status: 'Overdue',
    lastUpdate: 'Oct 03, 2026',
    items: [
      { id: 'i5', productName: 'Cetaphil Gentle Skin Cleanser', variant: '125ml', orderedQty: 50, receivedQty: 0, unitCost: 370 },
    ],
  },
  {
    id: 'PO-9640',
    supplierName: 'Nykaa Merchant Wholesale Hub',
    createdDate: 'Sep 20, 2026',
    expectedDelivery: 'Sep 25, 2026',
    totalUnits: 200,
    receivedUnits: 200,
    totalCost: 64000,
    status: 'Received',
    lastUpdate: 'Sep 25, 2026',
    items: [
      { id: 'i6', productName: 'Lakmé Absolute Matte Lipstick', variant: 'Red Velvet', orderedQty: 200, receivedQty: 200, unitCost: 320, batchNumber: 'LOT-LAK-99', expiryDate: '2028-06' },
    ],
  },
];

const REPLENISHMENT_RECOMMENDATIONS: ReplenishmentRecommendation[] = [
  {
    id: 'REC-01',
    productName: 'Maybelline Fit Me Foundation',
    sku: 'MAY-FOUND-128',
    variant: 'Shade 128 (30ml)',
    supplier: 'L\'Oréal Beauty India Pvt Ltd',
    currentStock: 3,
    threshold: 15,
    suggestedQty: 30,
    expectedUnitCost: 350,
  },
  {
    id: 'REC-02',
    productName: 'Minimalist 10% Niacinamide Serum',
    sku: 'MIN-NIAC-30',
    variant: '30ml bottle',
    supplier: 'Minimalist Skincare Distributors',
    currentStock: 2,
    threshold: 20,
    suggestedQty: 40,
    expectedUnitCost: 355,
  },
  {
    id: 'REC-03',
    productName: 'Cetaphil Gentle Skin Cleanser',
    sku: 'CET-CLEAN-125',
    variant: '125ml bottle',
    supplier: 'Cetaphil India Official Vendor',
    currentStock: 4,
    threshold: 12,
    suggestedQty: 25,
    expectedUnitCost: 370,
  },
];

function ProcurementScreen() {
  const router = useRouter();
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [recs, setRecs] = useState<ReplenishmentRecommendation[]>(REPLENISHMENT_RECOMMENDATIONS);
  const [selectedPoId, setSelectedPoId] = useState<string | null>('PO-9912');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'partial' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New PO Modal State
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState('L\'Oréal Beauty India Pvt Ltd');
  const [poDeliveryDate, setPoDeliveryDate] = useState('2026-10-20');
  const [poQty, setPoQty] = useState('50');

  // Receiving Stock Drawer State
  const [isReceiveDrawerOpen, setIsReceiveDrawerOpen] = useState(false);
  const [batchNum, setBatchNum] = useState('');
  const [expDate, setExpDate] = useState('');

  // Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const selectedPo = pos.find((p) => p.id === selectedPoId) || pos[0];

  const filteredPos = pos.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'open') return p.status === 'Confirmed' || p.status === 'Sent';
    if (activeTab === 'partial') return p.status === 'Partially Received';
    if (activeTab === 'overdue') return p.status === 'Overdue';
    return true;
  });

  const handleCreatePo = () => {
    const newPo: PurchaseOrder = {
      id: `PO-${Math.floor(9000 + Math.random() * 1000)}`,
      supplierName: poSupplier,
      createdDate: 'Today, Oct 09',
      expectedDelivery: poDeliveryDate,
      totalUnits: parseInt(poQty, 10) || 50,
      receivedUnits: 0,
      totalCost: (parseInt(poQty, 10) || 50) * 350,
      status: 'Sent',
      lastUpdate: 'Just now',
      items: [
        {
          id: `item-${Date.now()}`,
          productName: 'Maybelline Fit Me Foundation',
          variant: 'Shade 128 (30ml)',
          orderedQty: parseInt(poQty, 10) || 50,
          receivedQty: 0,
          unitCost: 350,
        },
      ],
    };

    setPos([newPo, ...pos]);
    setSelectedPoId(newPo.id);
    setIsPoModalOpen(false);
    showToast(`✅ Purchase Order ${newPo.id} dispatched to ${poSupplier}`);
  };

  const handleReceiveStockIntake = () => {
    if (!selectedPo) return;
    if (!batchNum.trim()) {
      showToast('⚠️ Please enter batch/lot number before stock intake');
      return;
    }

    const updatedPos = pos.map((p) => {
      if (p.id === selectedPo.id) {
        return {
          ...p,
          status: 'Received' as POStatus,
          receivedUnits: p.totalUnits,
          lastUpdate: 'Just now',
          items: p.items.map((i) => ({
            ...i,
            receivedQty: i.orderedQty,
            batchNumber: batchNum.trim(),
            expiryDate: expDate.trim() || '2028-12',
          })),
        };
      }
      return p;
    });

    setPos(updatedPos);
    setIsReceiveDrawerOpen(false);
    setBatchNum('');
    setExpDate('');
    showToast(`📦 Stock Intake Received & Batch ${batchNum} Registered for ${selectedPo.id}`);
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
        {/* Top Header & Breadcrumbs */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbLink}>Catalog</Text>
              <Text style={styles.breadcrumbSep}> / </Text>
              <Text style={styles.breadcrumbCurrent}>Procurement</Text>
            </View>
            <Text style={styles.pageTitle}>Supplier Procurement & Purchase Orders</Text>
            <Text style={styles.subCaption}>
              Manage beauty suppliers, inventory replenishment needs, purchase orders, and batch intake.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsPoModalOpen(true)}>
            <Text style={styles.primaryBtnText}>+ Create purchase order</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Metric Strip */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="warning-outline" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValAmber}>{recs.length}</Text>
            </View>
            <Text style={styles.cardLabel}>Low-Stock Reorders</Text>
            <Text style={styles.cardSub}>Suggested inventory intake</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="documents-outline" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValBlue}>2</Text>
            </View>
            <Text style={styles.cardLabel}>Open Purchase Orders</Text>
            <Text style={styles.cardSub}>Awaiting supplier dispatch</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Ionicons name="car-outline" size={18} style={{ color: '#475569' }} />
              <Text style={styles.cardValAmber}>1</Text>
            </View>
            <Text style={styles.cardLabel}>Partially Received</Text>
            <Text style={styles.cardSub}>Partial shipment in store</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.cardIconRow}>
              <Text style={styles.cardIcon}>⏰</Text>
              <Text style={styles.cardValRed}>1</Text>
            </View>
            <Text style={styles.cardLabel}>Overdue Deliveries</Text>
            <Text style={styles.cardSub}>Supplier dispatch delayed</Text>
          </View>
        </View>

        {/* Two-Column Overview: Recommended Replenishment & Incoming Deliveries */}
        <View style={styles.overviewGrid}>
          {/* Left Panel: Recommended Replenishment */}
          <View style={styles.leftPanel}>
            <Text style={styles.panelTitle}>⚡ Recommended Replenishment (Backend SLA Thresholds)</Text>
            <Text style={styles.panelSub}>Based on recent sales velocity and safety stock floors</Text>

            <View style={styles.recList}>
              {recs.map((item) => (
                <View key={item.id} style={styles.recItem}>
                  <View style={styles.recInfoBox}>
                    <Text style={styles.recProdName}>{item.productName}</Text>
                    <Text style={styles.recVariant}>{item.variant} • Supplier: {item.supplier}</Text>
                    <Text style={styles.recStockText}>
                      Current Stock: <Text style={styles.textAmber}>{item.currentStock} units</Text> (Threshold: {item.threshold})
                    </Text>
                  </View>

                  <View style={styles.recActionBox}>
                    <Text style={styles.recQtyText}>Suggested: +{item.suggestedQty} units</Text>
                    <Text style={styles.recCostText}>Cost: ₹{(item.suggestedQty * item.expectedUnitCost).toLocaleString('en-IN')}</Text>
                    <TouchableOpacity
                      style={styles.addPoBtn}
                      onPress={() => {
                        setPoQty(item.suggestedQty.toString());
                        setPoSupplier(item.supplier);
                        setIsPoModalOpen(true);
                      }}
                    >
                      <Text style={styles.addPoBtnText}>+ Add to PO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Right Panel: Selected Purchase Order Detail & Intake Drawer */}
          <View style={styles.rightPanel}>
            {selectedPo ? (
              <View style={styles.poDetailContainer}>
                <View style={styles.poDetailHeader}>
                  <View style={styles.poTitleRow}>
                    <Text style={styles.poDetailId}>{selectedPo.id}</Text>
                    <View style={getStatusBadgeStyle(selectedPo.status)}>
                      <Text style={getStatusTextStyle(selectedPo.status)}>{selectedPo.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.poSupplierName}>{selectedPo.supplierName}</Text>
                  <Text style={styles.poDatesText}>
                    Created: {selectedPo.createdDate} • Expected: {selectedPo.expectedDelivery}
                  </Text>
                </View>

                {/* Items & Batch Intake List */}
                <ScrollView style={styles.poItemsScroll}>
                  <Text style={styles.itemsSectionTitle}>Line Items & Inventory Intake Status</Text>
                  {selectedPo.items.map((it) => (
                    <View key={it.id} style={styles.poLineItemCard}>
                      <View style={styles.lineItemTop}>
                        <Text style={styles.lineProdTitle}>{it.productName}</Text>
                        <Text style={styles.lineCostText}>₹{it.unitCost} / unit</Text>
                      </View>
                      <Text style={styles.lineVariantText}>{it.variant}</Text>

                      <View style={styles.lineQtyRow}>
                        <Text style={styles.lineQtyBadge}>
                          Ordered: {it.orderedQty} units | Received: {it.receivedQty} units
                        </Text>
                        {it.batchNumber && (
                          <Text style={styles.batchTag}>
                            Batch: {it.batchNumber} (Exp: {it.expiryDate})
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Intake Action Footer */}
                {selectedPo.status !== 'Received' && (
                  <View style={styles.poDetailFooter}>
                    <TouchableOpacity
                      style={styles.receiveStockBtn}
                      onPress={() => setIsReceiveDrawerOpen(true)}
                    >
                      <Text style={styles.receiveStockBtnText}>📦 Receive Stock Intake & Register Batches</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyDetailBox}>
                <Text style={styles.emptyDetailText}>Select a purchase order to view line items & batch details</Text>
              </View>
            )}
          </View>
        </View>

        {/* Purchase Orders Master Table */}
        <Text style={styles.sectionHeaderTitle}>Purchase Orders Directory</Text>
        <View style={styles.tableCard}>
          <View style={styles.filterBarRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#475569" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search PO number or supplier name..."
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
                  All POs ({pos.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'open' && styles.filterTabActive]}
                onPress={() => setActiveTab('open')}
              >
                <Text style={[styles.filterTabText, activeTab === 'open' && styles.filterTabTextActive]}>
                  Open
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'partial' && styles.filterTabActive]}
                onPress={() => setActiveTab('partial')}
              >
                <Text style={[styles.filterTabText, activeTab === 'partial' && styles.filterTabTextActive]}>
                  Partial
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'overdue' && styles.filterTabActive]}
                onPress={() => setActiveTab('overdue')}
              >
                <Text style={[styles.filterTabText, activeTab === 'overdue' && styles.filterTabTextActive]}>
                  Overdue
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thCell, { flex: 1 }]}>PO Number</Text>
            <Text style={[styles.thCell, { flex: 2 }]}>Supplier</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Expected Delivery</Text>
            <Text style={[styles.thCell, { flex: 1 }]}>Total Units</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Total Cost</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Status</Text>
          </View>

          {/* Table Rows */}
          {filteredPos.map((item) => {
            const isSelected = item.id === selectedPoId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tableDataRow, isSelected && styles.tableDataRowSelected]}
                onPress={() => setSelectedPoId(item.id)}
              >
                <Text style={[styles.tdCell, { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }]}>{item.id}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }]}>{item.supplierName}</Text>
                <Text style={[styles.tdCell, { flex: 1.2 }]}>{item.expectedDelivery}</Text>
                <Text style={[styles.tdCell, { flex: 1 }]}>{item.receivedUnits} / {item.totalUnits} units</Text>
                <Text style={[styles.tdCell, { flex: 1.2, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }]}>
                  ₹{item.totalCost.toLocaleString('en-IN')}
                </Text>
                <View style={[{ flex: 1.2 }]}>
                  <View style={getStatusBadgeStyle(item.status)}>
                    <Text style={getStatusTextStyle(item.status)}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Create PO Modal */}
      <Modal visible={isPoModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Purchase Order</Text>
              <TouchableOpacity onPress={() => setIsPoModalOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Beauty Supplier *</Text>
              <TextInput
                style={styles.modalInput}
                value={poSupplier}
                onChangeText={setPoSupplier}
                placeholder="e.g. L'Oréal Beauty India"
              />

              <Text style={styles.inputLabel}>Expected Delivery Date *</Text>
              <TextInput
                style={styles.modalInput}
                value={poDeliveryDate}
                onChangeText={setPoDeliveryDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.inputLabel}>Total Units Quantity *</Text>
              <TextInput
                style={styles.modalInput}
                value={poQty}
                onChangeText={setPoQty}
                keyboardType="numeric"
                placeholder="50"
              />

              <View style={styles.auditNoticeBox}>
                <Text style={styles.auditNoticeTitle}>ℹ️ Authoritative Wholesale Cost Audit</Text>
                <Text style={styles.auditNoticeText}>
                  Dispatched POs update backend inventory expected intake logs. Unit costs are locked to wholesale pricing contracts.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsPoModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreatePo}>
                <Text style={styles.modalSubmitText}>Dispatch PO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Intake & Batch Registration Drawer Modal */}
      <Modal visible={isReceiveDrawerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Intake & Batch Registration</Text>
              <TouchableOpacity onPress={() => setIsReceiveDrawerOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Batch / Lot Number *</Text>
              <TextInput
                style={styles.modalInput}
                value={batchNum}
                onChangeText={setBatchNum}
                placeholder="e.g. LOT-MAY-2026-99"
              />

              <Text style={styles.inputLabel}>Expiry Date (YYYY-MM)</Text>
              <TextInput
                style={styles.modalInput}
                value={expDate}
                onChangeText={setExpDate}
                placeholder="2028-12"
              />

              <View style={styles.auditNoticeBox}>
                <Text style={styles.auditNoticeTitle}>🔒 Over-Delivery Safeguard</Text>
                <Text style={styles.auditNoticeText}>
                  Received quantities cannot exceed ordered quantities without explicit exception workflow approval.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsReceiveDrawerOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleReceiveStockIntake}>
                <Text style={styles.modalSubmitText}>Confirm Stock Intake</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Status Pill Helpers
function getStatusBadgeStyle(status: POStatus) {
  switch (status) {
    case 'Received':
    case 'Confirmed':
      return [styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }];
    case 'Partially Received':
    case 'Sent':
      return [styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }];
    case 'Overdue':
      return [styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }];
    case 'Draft':
    case 'Cancelled':
      return [styles.statusBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }];
  }
}

function getStatusTextStyle(status: POStatus) {
  switch (status) {
    case 'Received':
    case 'Confirmed':
      return [styles.statusText, { color: '#15803D' }];
    case 'Partially Received':
    case 'Sent':
      return [styles.statusText, { color: '#B45309' }];
    case 'Overdue':
      return [styles.statusText, { color: '#B91C1C' }];
    case 'Draft':
    case 'Cancelled':
      return [styles.statusText, { color: '#475569' }];
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
    width: Platform.OS === 'web' ? '23.5%' : '48%',
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  cardValAmber: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#D97706',
  },
  cardValBlue: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardValRed: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#DC2626',
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
  overviewGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    marginBottom: 28,
  },
  leftPanel: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  panelSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  recList: {
    gap: 12,
  },
  recItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recInfoBox: {
    flex: 1,
  },
  recProdName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  recVariant: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recStockText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  textAmber: {
    color: '#D97706',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  recActionBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  recQtyText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#16A34A',
  },
  recCostText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  addPoBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  addPoBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  poDetailContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  poDetailHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  poTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  poDetailId: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  poSupplierName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  poDatesText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  poItemsScroll: {
    padding: 16,
    maxHeight: 280,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  poLineItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  lineItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineProdTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  lineCostText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  lineVariantText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  lineQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  lineQtyBadge: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#16A34A',
  },
  batchTag: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  poDetailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiveStockBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  receiveStockBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyDetailBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyDetailText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#94A3B8',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
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
  tableDataRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  tdCell: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
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
    maxWidth: 500,
    overflow: 'hidden',
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
  auditNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  auditNoticeTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  auditNoticeText: {
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
});

export default withComingSoon(ProcurementScreen, 'Procurement');
