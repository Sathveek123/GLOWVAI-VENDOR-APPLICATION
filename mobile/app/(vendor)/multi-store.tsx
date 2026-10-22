import { withComingSoon } from '../../src/components/ComingSoon';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

export type LocationStatus = 'Active' | 'Paused' | 'Pending Approval' | 'Needs Attention' | 'Closed';
export type KYCStatus = 'Verified' | 'Pending Review' | 'Action Required' | 'Not Submitted';
export type PayoutPolicyMode = 'Unified Org Settlement' | 'Independent Store Bank Account';

export interface LocationStore {
  id: string;
  code: string;
  name: string;
  locality: string;
  city: string;
  type: 'Dark Store' | 'Boutique Counter' | 'Regional Hub';
  manager: string;
  phone: string;
  address: string;
  status: LocationStatus;
  operatingHours: string;
  activeOrders: number;
  lowStockCount: number;
  rating: number;
  kycStatus: KYCStatus;
  lastSyncTime: string;
  radiusKm: number;
  slaHealthPct: number;
  todaySales: number;
  gstin: string;
  payoutMode: PayoutPolicyMode;
  isCatalogShared: boolean;
  isStaffShared: boolean;
}

function MultiStoreScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'Brand Admin' | 'Store Manager'>('Brand Admin');
  const [activeContextStoreId, setActiveContextStoreId] = useState<string>('LOC-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LocationStatus>('all');

  // Modals & Drawers State
  const [selectedStore, setSelectedStore] = useState<LocationStore | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'Overview' | 'Orders' | 'Catalog' | 'Hours' | 'Team' | 'KYC' | 'Payout'>('Overview');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Add Location Wizard State (7 Steps)
  const [isAddLocationWizardOpen, setIsAddLocationWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreType, setNewStoreType] = useState<'Dark Store' | 'Boutique Counter' | 'Regional Hub'>('Dark Store');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreLocality, setNewStoreLocality] = useState('Benz Circle, Vijayawada');
  const [newStoreRadius, setNewStoreRadius] = useState('5.0');
  const [newStoreHours, setNewStoreHours] = useState('06:00 AM – 11:30 PM');
  const [newStoreManager, setNewStoreManager] = useState('');
  const [newPayoutMode, setNewPayoutMode] = useState<PayoutPolicyMode>('Unified Org Settlement');
  const [copyCatalogFromId, setCopyCatalogFromId] = useState<string>('LOC-01');

  // Active Order Closure Guard Modal
  const [closureGuardStore, setClosureGuardStore] = useState<LocationStore | null>(null);

  const [stores, setStores] = useState<LocationStore[]>([
    {
      id: 'LOC-01',
      code: 'DS-VIJ-01',
      name: 'Benz Circle Dark Store',
      locality: 'Benz Circle',
      city: 'Vijayawada',
      type: 'Dark Store',
      manager: 'Sathvik V.',
      phone: '+91 98765 43210',
      address: 'Plot 42, Benz Circle Rd, Vijayawada - 520010',
      status: 'Active',
      operatingHours: '06:00 AM – 11:30 PM',
      activeOrders: 14,
      lowStockCount: 3,
      rating: 4.96,
      kycStatus: 'Verified',
      lastSyncTime: '2 mins ago',
      radiusKm: 4.5,
      slaHealthPct: 98.4,
      todaySales: 54200,
      gstin: '37AAAAA0000A1Z5',
      payoutMode: 'Unified Org Settlement',
      isCatalogShared: true,
      isStaffShared: false,
    },
    {
      id: 'LOC-02',
      code: 'BT-VIJ-02',
      name: 'MG Road Beauty Boutique',
      locality: 'MG Road',
      city: 'Vijayawada',
      type: 'Boutique Counter',
      manager: 'Ananya R.',
      phone: '+91 98765 88123',
      address: 'Level 2, PVP Square, MG Road, Vijayawada - 520002',
      status: 'Active',
      operatingHours: '09:00 AM – 09:30 PM',
      activeOrders: 6,
      lowStockCount: 1,
      rating: 4.98,
      kycStatus: 'Verified',
      lastSyncTime: ' Just now',
      radiusKm: 2.0,
      slaHealthPct: 99.1,
      todaySales: 32150,
      gstin: '37AAAAA0000A1Z5',
      payoutMode: 'Unified Org Settlement',
      isCatalogShared: true,
      isStaffShared: true,
    },
    {
      id: 'LOC-03',
      code: 'RH-GNT-01',
      name: 'Guntur Regional Hub',
      locality: 'Logistics Park',
      city: 'Guntur',
      type: 'Regional Hub',
      manager: 'Kiran K.',
      phone: '+91 98765 99441',
      address: 'NH-16 Logistics Park, Guntur - 522001',
      status: 'Active',
      operatingHours: '05:00 AM – 11:00 PM',
      activeOrders: 9,
      lowStockCount: 2,
      rating: 4.92,
      kycStatus: 'Verified',
      lastSyncTime: '5 mins ago',
      radiusKm: 8.0,
      slaHealthPct: 96.8,
      todaySales: 41500,
      gstin: '37BBBBB1111B2Z8',
      payoutMode: 'Independent Store Bank Account',
      isCatalogShared: false,
      isStaffShared: false,
    },
    {
      id: 'LOC-04',
      code: 'DS-VIJ-03',
      name: 'Vijayawada North Center',
      locality: 'Satyanarayanapuram',
      city: 'Vijayawada',
      type: 'Dark Store',
      manager: 'Ramesh K. (Pending)',
      phone: '+91 98765 00000',
      address: 'Eluru Road, Satyanarayanapuram, Vijayawada - 520011',
      status: 'Needs Attention',
      operatingHours: '06:00 AM – 11:00 PM',
      activeOrders: 0,
      lowStockCount: 4,
      rating: 4.85,
      kycStatus: 'Pending Review',
      lastSyncTime: '12 mins ago',
      radiusKm: 5.0,
      slaHealthPct: 100,
      todaySales: 15000,
      gstin: '37AAAAA0000A1Z5',
      payoutMode: 'Unified Org Settlement',
      isCatalogShared: true,
      isStaffShared: false,
    },
    {
      id: 'LOC-05',
      code: 'DS-GNT-02',
      name: 'Guntur East Dark Store',
      locality: 'Broadipet',
      city: 'Guntur',
      type: 'Dark Store',
      manager: 'Unassigned',
      phone: '+91 90000 00000',
      address: 'Broadipet 4th Line, Guntur - 522002',
      status: 'Pending Approval',
      operatingHours: '06:00 AM – 11:00 PM',
      activeOrders: 0,
      lowStockCount: 0,
      rating: 0.0,
      kycStatus: 'Action Required',
      lastSyncTime: 'Not synced',
      radiusKm: 4.0,
      slaHealthPct: 100,
      todaySales: 0,
      gstin: '37BBBBB1111B2Z8',
      payoutMode: 'Independent Store Bank Account',
      isCatalogShared: true,
      isStaffShared: false,
    },
  ]);

  const activeContextStore = stores.find((s) => s.id === activeContextStoreId) || stores[0];

  const totalSales = stores.reduce((sum, s) => sum + s.todaySales, 0);
  const activeCount = stores.filter((s) => s.status === 'Active').length;

  const filteredStores = stores.filter((s) => {
    // If Store Manager, enforce strict backend RBAC scoping
    if (userRole === 'Store Manager' && s.id !== activeContextStoreId) return false;

    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.manager.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const handleSwitchActiveContext = (store: LocationStore) => {
    setActiveContextStoreId(store.id);
    Alert.alert('Active Store Context Switched', `Global workspace context updated to ${store.name} (${store.code}). All catalog, order, and dispatch actions are now bound to this location ✓`);
  };

  const handleToggleDutyWithClosureProtection = (store: LocationStore) => {
    if (store.status === 'Active' && store.activeOrders > 0) {
      setClosureGuardStore(store);
      return;
    }

    setStores((prev) =>
      prev.map((s) => (s.id === store.id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s))
    );
  };

  const handleFinishAddLocation = () => {
    if (!newStoreName.trim() || !newStoreCode.trim()) {
      Alert.alert('Validation Error', 'Please enter store name and unique store code.');
      return;
    }

    const created: LocationStore = {
      id: `LOC-0${stores.length + 1}`,
      code: newStoreCode.toUpperCase().trim(),
      name: newStoreName.trim(),
      locality: newStoreLocality,
      city: 'Vijayawada',
      type: newStoreType,
      manager: newStoreManager.trim() || 'Unassigned',
      phone: '+91 90000 00000',
      address: newStoreAddress.trim() || 'Vijayawada Central Location',
      status: 'Active',
      operatingHours: newStoreHours,
      activeOrders: 0,
      lowStockCount: 0,
      rating: 5.0,
      kycStatus: 'Verified',
      lastSyncTime: 'Just now',
      radiusKm: parseFloat(newStoreRadius) || 5.0,
      slaHealthPct: 100,
      todaySales: 0,
      gstin: '37AAAAA0000A1Z5',
      payoutMode: newPayoutMode,
      isCatalogShared: true,
      isStaffShared: false,
    };

    setStores([created, ...stores]);
    setIsAddLocationWizardOpen(false);
    setWizardStep(1);
    setNewStoreName('');
    setNewStoreCode('');
    Alert.alert('Location Added', `New store ${created.name} (${created.code}) successfully onboarded to organization network!`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Global Application Header Bar with Active Location Context */}
      <View style={styles.globalHeaderBar}>
        <View style={styles.orgBrandGroup}>
          <Text style={styles.orgName}>Sri Lakshmi Beauty Brands Pvt Ltd</Text>
          <View style={styles.userRolePill}>
            <Text style={styles.userRolePillText}>Role: {userRole}</Text>
          </View>
          <View style={styles.syncStatusPill}>
            <Text style={styles.syncStatusText}>🌐 Network Sync: Connected</Text>
          </View>
        </View>

        {/* Global Store selector dropdown */}
        <View style={styles.globalStoreSelector}>
          <Text style={styles.selectorLabel}>Active Store Context:</Text>
          <TouchableOpacity style={styles.selectorBox} onPress={() => Alert.alert('Active Context', `Currently active: ${activeContextStore.name} (${activeContextStore.code})`)}>
            <Text style={styles.selectorStoreName}>📍 {activeContextStore.name} ({activeContextStore.code})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Page Top Title & Controls */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.breadcrumb}>Store / Locations</Text>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Locations & Network Hub</Text>
            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>
                {activeCount}/{stores.length} Locations Active
              </Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            Manage retail dark stores, boutique counters, and regional fulfillment hubs. Actions bound to active context.
          </Text>
        </View>

        <View style={styles.headerActionGroup}>
          {/* Role Scoping Switcher */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, userRole === 'Brand Admin' && styles.roleBtnActive]}
              onPress={() => setUserRole('Brand Admin')}
            >
              <Text style={[styles.roleBtnText, userRole === 'Brand Admin' && styles.roleBtnTextActive]}>
                👑 Brand Admin
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, userRole === 'Store Manager' && styles.roleBtnActive]}
              onPress={() => setUserRole('Store Manager')}
            >
              <Text style={[styles.roleBtnText, userRole === 'Store Manager' && styles.roleBtnTextActive]}>
                🏬 Store Manager View
              </Text>
            </TouchableOpacity>
          </View>

          {userRole === 'Brand Admin' && (
            <TouchableOpacity
              style={styles.addStoreBtn}
              onPress={() => setIsAddLocationWizardOpen(true)}
            >
              <Text style={styles.addStoreBtnText}>+ Add Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5 Network Summary Metric Strip */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up-outline" size={18} style={{ color: '#475569' }} />
          <Text style={[styles.cardVal, { color: '#16A34A' }]}>₹{totalSales.toLocaleString('en-IN')}</Text>
          <Text style={styles.cardLab}>Total Network Sales</Text>
          <Text style={styles.cardSub}>Across {stores.length} locations</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="business-outline" size={18} style={{ color: '#475569' }} />
          <Text style={[styles.cardVal, { color: '#1D4ED8' }]}>{activeCount} Active</Text>
          <Text style={styles.cardLab}>Active Locations</Text>
          <Text style={styles.cardSub}>{stores.length - activeCount} paused / setup</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>⏱️</Text>
          <Text style={styles.cardVal}>98.4%</Text>
          <Text style={styles.cardLab}>Avg Fulfillment SLA</Text>
          <Text style={styles.cardSub}>Target &lt;3 mins prep</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="warning-outline" size={18} style={{ color: '#475569' }} />
          <Text style={[styles.cardVal, { color: '#D97706' }]}>10 SKUs</Text>
          <Text style={styles.cardLab}>Cross-Store Low-Stock</Text>
          <Text style={styles.cardSub}>Shelf replenishment alerts</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="bicycle-outline" size={18} color="#475569" style={styles.cardIcon} />
          <Text style={styles.cardVal}>18 Riders</Text>
          <Text style={styles.cardLab}>Active Assigned Fleet</Text>
          <Text style={styles.cardSub}>Quick commerce couriers</Text>
        </View>
      </View>

      {/* Filter & Search Controls */}
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#475569" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search store name, ID, locality, or manager..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsScroll}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>All Locations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'Active' && styles.filterChipActive]}
            onPress={() => setStatusFilter('Active')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'Active' && styles.filterChipTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'Paused' && styles.filterChipActive]}
            onPress={() => setStatusFilter('Paused')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'Paused' && styles.filterChipTextActive]}>Paused</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'Pending Approval' && styles.filterChipActive]}
            onPress={() => setStatusFilter('Pending Approval')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'Pending Approval' && styles.filterChipTextActive]}>Pending Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'Needs Attention' && styles.filterChipActive]}
            onPress={() => setStatusFilter('Needs Attention')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'Needs Attention' && styles.filterChipTextActive]}>Needs Attention</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Store Location Cards Grid */}
      <View style={styles.storeGrid}>
        {filteredStores.map((item) => {
          const isActiveContext = item.id === activeContextStoreId;
          const isOpen = item.status === 'Active';
          return (
            <View
              key={item.id}
              style={[
                styles.storeCard,
                isActiveContext && styles.storeCardActiveContext,
              ]}
            >
              {/* Card Top Row */}
              <View style={styles.storeCardTop}>
                <View>
                  <View style={styles.codeRow}>
                    <Text style={styles.storeCode}>{item.code}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type}</Text>
                    </View>
                    {isActiveContext && (
                      <View style={styles.activeContextBadge}>
                        <Text style={styles.activeContextText}>ACTIVE CONTEXT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.storeName}>{item.name}</Text>
                </View>

                <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusPaused]}>
                  <Text style={[styles.statusText, isOpen ? styles.statusOpenText : styles.statusPausedText]}>
                    {isOpen ? '🟢 Active' : `🟡 ${item.status}`}
                  </Text>
                </View>
              </View>

              {/* Locality & Hours Info */}
              <Text style={styles.infoText}>📍 {item.locality}, {item.city} • ⏰ {item.operatingHours}</Text>
              <Text style={styles.infoText}>👤 Manager: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' }}>{item.manager}</Text> • 🔑 KYC: <Text style={{ color: item.kycStatus === 'Verified' ? '#16A34A' : '#D97706', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{item.kycStatus}</Text></Text>

              {/* 4 Performance Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.miniMetricBox}>
                  <Text style={styles.miniMetricVal}>{item.activeOrders}</Text>
                  <Text style={styles.miniMetricLab}>Active Orders</Text>
                </View>
                <View style={styles.miniMetricBox}>
                  <Text style={[styles.miniMetricVal, { color: '#D97706' }]}>{item.lowStockCount}</Text>
                  <Text style={styles.miniMetricLab}>Low-Stock</Text>
                </View>
                <View style={styles.miniMetricBox}>
                  <Text style={[styles.miniMetricVal, { color: '#16A34A' }]}>{item.rating}★</Text>
                  <Text style={styles.miniMetricLab}>Rating</Text>
                </View>
                <View style={styles.miniMetricBox}>
                  <Text style={styles.miniMetricVal}>₹{(item.todaySales / 1000).toFixed(1)}k</Text>
                  <Text style={styles.miniMetricLab}>Today</Text>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {!isActiveContext ? (
                  <TouchableOpacity
                    style={styles.switchBtn}
                    onPress={() => handleSwitchActiveContext(item)}
                  >
                    <Text style={styles.switchBtnText}>Switch Active View</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.currentContextBtn}>
                    <Text style={styles.currentContextBtnText}>Active Location ✓</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.configBtn}
                  onPress={() => {
                    setSelectedStore(item);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <Text style={styles.configBtnText}>Manage Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pauseBtn, isOpen ? styles.pauseBtnActive : styles.resumeBtnActive]}
                  onPress={() => handleToggleDutyWithClosureProtection(item)}
                >
                  <Text style={isOpen ? styles.pauseBtnTextActive : styles.resumeBtnTextActive}>
                    {isOpen ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Active Order Closure Protection Modal */}
      {closureGuardStore && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 440 }]}>
              <Ionicons name="alert-circle-outline" size={28} style={{ color: '#475569' }} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
                Active Order Closure Protection
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 16 }}>
                Cannot pause duty for <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{closureGuardStore.name}</Text> because it has <Text style={{ color: '#D97706', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>{closureGuardStore.activeOrders} active prep orders</Text> in progress. Pack and dispatch or re-route existing customer orders before turning off store duty.
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setClosureGuardStore(null)}
                >
                  <Text style={styles.modalCancelBtnText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => {
                    setClosureGuardStore(null);
                    router.push('/(vendor)/orders' as any);
                  }}
                >
                  <Text style={styles.modalSubmitBtnText}>View Active Orders Queue →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Multi-Tab Location Detail Modal */}
      {selectedStore && (
        <Modal visible={isDetailModalOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 600 }]}>
              {/* Modal Top Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedStore.name} ({selectedStore.code})</Text>
                  <Text style={styles.modalSub}>{selectedStore.locality}, {selectedStore.city} • Payout: {selectedStore.payoutMode}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                  <Ionicons name="close" size={14} style={{ color: '#64748B' }} />
                </TouchableOpacity>
              </View>

              {/* 7 Tabs Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalTabsBar}>
                {(['Overview', 'Orders', 'Catalog', 'Hours', 'Team', 'KYC', 'Payout'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.modalTab, detailActiveTab === tab && styles.modalTabActive]}
                    onPress={() => setDetailActiveTab(tab)}
                  >
                    <Text style={[styles.modalTabText, detailActiveTab === tab && styles.modalTabTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tab Content Body */}
              <ScrollView style={{ maxHeight: 360, marginVertical: 12 }}>
                {detailActiveTab === 'Overview' && (
                  <View style={{ gap: 8 }}>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Store Code / ID</Text><Text style={styles.detailVal}>{selectedStore.code}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Location Type</Text><Text style={styles.detailVal}>{selectedStore.type}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Assigned Manager</Text><Text style={styles.detailVal}>{selectedStore.manager} ({selectedStore.phone})</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Street Address</Text><Text style={styles.detailVal}>{selectedStore.address}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Delivery Radius Geofence</Text><Text style={styles.detailVal}>{selectedStore.radiusKm} km radius</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>KYC Verification</Text><Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#16A34A' }}>{selectedStore.kycStatus} ✓</Text></View>
                  </View>
                )}

                {detailActiveTab === 'Catalog' && (
                  <View style={{ gap: 10 }}>
                    <View style={styles.infoCallout}>
                      <Text style={{ fontSize: 12, color: '#1D4ED8', fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' }}>
                        {selectedStore.isCatalogShared ? 'ℹ️ Catalog Scope: Shared Brand Master Catalog' : '🔒 Catalog Scope: Store-Specific Custom Master'}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#475569' }}>450+ Cosmetics & Skincare SKUs active in this location shelf.</Text>
                    <TouchableOpacity style={styles.seedBtn} onPress={() => Alert.alert('Catalog Seeded', '450+ Master SKUs copied from Benz Circle Dark Store ✓')}>
                      <Text style={styles.seedBtnText}>⚡ Seed / Refresh Catalog from Benz Circle</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {detailActiveTab === 'Payout' && (
                  <View style={{ gap: 8 }}>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Settlement Mode</Text><Text style={styles.detailVal}>{selectedStore.payoutMode}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Registered GSTIN</Text><Text style={styles.detailVal}>{selectedStore.gstin}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLab}>Bank Account</Text><Text style={styles.detailVal}>HDFC Bank ••••4589 (IMPS Direct)</Text></View>
                  </View>
                )}

                {(detailActiveTab === 'Orders' || detailActiveTab === 'Hours' || detailActiveTab === 'Team' || detailActiveTab === 'KYC') && (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748B', fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' }}>Showing {detailActiveTab} settings for {selectedStore.name}.</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsDetailModalOpen(false)}>
                  <Text style={styles.modalCancelBtnText}>Close Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 7-Step Add Location Wizard Modal */}
      <Modal visible={isAddLocationWizardOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540 }]}>
            {/* Wizard Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Location (Step {wizardStep} of 7)</Text>
                <Text style={styles.modalSub}>
                  {wizardStep === 1 && 'Step 1: Store Identity & Type'}
                  {wizardStep === 2 && 'Step 2: Address & GPS Pinning'}
                  {wizardStep === 3 && 'Step 3: Operating Hours & Auto-Rules'}
                  {wizardStep === 4 && 'Step 4: Service Area & Delivery Radius'}
                  {wizardStep === 5 && 'Step 5: KYC & License Verification'}
                  {wizardStep === 6 && 'Step 6: Bank & Payout Policy'}
                  {wizardStep === 7 && 'Step 7: Final Review & Onboard'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddLocationWizardOpen(false)}>
                <Ionicons name="close" size={14} style={{ color: '#64748B' }} />
              </TouchableOpacity>
            </View>

            {/* Step 1 Form */}
            {wizardStep === 1 && (
              <View style={{ gap: 12 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Store Location Name *</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. Vijayawada East Dark Store" value={newStoreName} onChangeText={setNewStoreName} />
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Unique Store Code *</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. DS-VIJ-04" value={newStoreCode} onChangeText={setNewStoreCode} />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Location Type</Text>
                    <TextInput style={styles.formInput} value={newStoreType} onChangeText={(v: any) => setNewStoreType(v)} />
                  </View>
                </View>
              </View>
            )}

            {/* Step 2 Form */}
            {wizardStep === 2 && (
              <View style={{ gap: 12 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Locality & City *</Text>
                  <TextInput style={styles.formInput} value={newStoreLocality} onChangeText={setNewStoreLocality} />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Street Address & Geofence Pin *</Text>
                  <TextInput style={styles.formInput} placeholder="Full address with landmark" value={newStoreAddress} onChangeText={setNewStoreAddress} />
                </View>
              </View>
            )}

            {/* Step 6 Form: Bank Policy */}
            {wizardStep === 6 && (
              <View style={{ gap: 12 }}>
                <Text style={styles.formLabel}>Payout & Settlement Policy Mode</Text>
                <TouchableOpacity
                  style={[styles.policyBox, newPayoutMode === 'Unified Org Settlement' && styles.policyBoxActive]}
                  onPress={() => setNewPayoutMode('Unified Org Settlement')}
                >
                  <Text style={styles.policyTitle}>💳 Unified Organization Settlement (Recommended)</Text>
                  <Text style={styles.policySub}>All location receipts settle directly to main Sri Lakshmi Beauty HDFC Bank account.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.policyBox, newPayoutMode === 'Independent Store Bank Account' && styles.policyBoxActive]}
                  onPress={() => setNewPayoutMode('Independent Store Bank Account')}
                >
                  <Text style={styles.policyTitle}>🏦 Independent Store Bank Account</Text>
                  <Text style={styles.policySub}>Requires separate bank branch verification & GSTIN registration.</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3, 4, 5, 7 Placeholders */}
            {(wizardStep === 3 || wizardStep === 4 || wizardStep === 5 || wizardStep === 7) && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' }}>Step {wizardStep} Configuration Complete</Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 4 }}>Default parameters configured based on organization master policy.</Text>
              </View>
            )}

            {/* Wizard Navigation Footer */}
            <View style={styles.modalFooter}>
              {wizardStep > 1 && (
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setWizardStep(wizardStep - 1)}>
                  <Text style={styles.modalCancelBtnText}>← Back</Text>
                </TouchableOpacity>
              )}

              {wizardStep < 7 ? (
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setWizardStep(wizardStep + 1)}>
                  <Text style={styles.modalSubmitBtnText}>Next Step →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleFinishAddLocation}>
                  <Text style={styles.modalSubmitBtnText}>Complete & Onboard Location</Text>
                </TouchableOpacity>
              )}
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
  globalHeaderBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgBrandGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orgName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },
  userRolePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  userRolePillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  syncStatusPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  syncStatusText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#15803D' },
  globalStoreSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectorLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B' },
  selectorBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  selectorStoreName: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  breadcrumb: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  healthBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  healthBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  headerSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  headerActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleToggleContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 2 },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  roleBtnActive: { backgroundColor: '#FFFFFF' },
  roleBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B' },
  roleBtnTextActive: { color: '#0F172A', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  addStoreBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  addStoreBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, minWidth: 200, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14 },
  cardIcon: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 18, marginBottom: 4 },
  cardVal: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  cardLab: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A', marginTop: 2 },
  cardSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },

  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 280, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchIcon: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  searchInput: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#0F172A' },
  filterTabsScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', marginRight: 6 },
  filterChipActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  filterChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#1D4ED8', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },

  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  storeCard: { width: '48.5%', minWidth: 320, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 16 },
  storeCardActiveContext: { borderColor: '#1D4ED8', borderWidth: 2, backgroundColor: '#FAFCFF' },
  storeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  storeCode: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  typeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569' },
  activeContextBadge: { backgroundColor: '#1D4ED8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activeContextText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  storeName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusOpen: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  statusOpenText: { color: '#15803D', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  statusPaused: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  statusPausedText: { color: '#B45309', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  statusText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  infoText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginBottom: 4 },

  metricsGrid: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  miniMetricBox: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 6, alignItems: 'center' },
  miniMetricVal: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },
  miniMetricLab: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 6, marginTop: 6 },
  switchBtn: { flex: 1, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  switchBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#1D4ED8' },
  currentContextBtn: { flex: 1, backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  currentContextBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#15803D' },
  configBtn: { flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  configBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569' },
  pauseBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  pauseBtnActive: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  pauseBtnTextActive: { color: '#B45309', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  resumeBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  resumeBtnTextActive: { color: '#15803D', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },

  // Modal Styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#0F172A' },
  modalSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  modalTabsBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6 },
  modalTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 6 },
  modalTabActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  modalTabText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#64748B' },
  modalTabTextActive: { color: '#1D4ED8', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  detailLab: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B' },
  detailVal: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },
  infoCallout: { backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8, marginBottom: 8 },
  seedBtn: { backgroundColor: '#1D4ED8', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  seedBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },

  formGroup: { marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 10 },
  formLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#475569', marginBottom: 4 },
  formInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#0F172A' },
  policyBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 8 },
  policyBoxActive: { backgroundColor: '#EFF6FF', borderColor: '#1D4ED8' },
  policyTitle: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: '#0F172A' },
  policySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalCancelBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalCancelBtnText: { color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  modalSubmitBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
});

export default withComingSoon(MultiStoreScreen, 'Locations');
