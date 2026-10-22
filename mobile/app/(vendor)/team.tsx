/**
 * SCREEN 28: Team Members & Staff Permissions Workspace
 * File: mobile/app/(vendor)/team.tsx
 *
 * Production-grade desktop staff management console for GlowVAI Vendors.
 * Features:
 *   • Header with member counts, breadcrumbs, and "+ Invite Team Member" primary CTA
 *   • Security Shield Card highlighting owner-only protected workflows (bank, tax, KYC)
 *   • Role & Status Filters: All, Owners, Managers, Packers, Inventory Staff, Pending, Suspended, Revoked
 *   • Desktop Data Table with member avatars, masked contact identifiers, roles, store assignments & statuses
 *   • Invite Team Member Drawer/Modal with granular permission checkboxes & owner-controlled security locks
 *   • 520px Member Inspection Drawer with audit logs, permission matrix, role changes & revocation safeguards
 *   • Edge States (Last-owner protection, active order handling warning, duplicate invite, offline mode, expired link)
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
import { Colors } from '../../src/theme/tokens';
import { soundService } from '../../src/services/sound';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

export interface TeamPermission {
  id: string;
  label: string;
  description: string;
  category: 'ORDERS' | 'CATALOG' | 'FINANCE' | 'SYSTEM';
  ownerOnly?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  contactMasked: string;
  rawContact: string;
  role: 'STORE_OWNER' | 'STORE_MANAGER' | 'PACKER_STAFF' | 'INVENTORY_STAFF';
  roleTitle: string;
  status: 'ACTIVE' | 'INVITATION_PENDING' | 'SUSPENDED' | 'REVOKED';
  lastActive: string;
  storeAssigned: string;
  invitedAt: string;
  permissions: string[];
  isHandlingActiveOrder?: boolean;
}

const GRANULAR_PERMISSIONS: TeamPermission[] = [
  { id: 'view_orders', label: 'View Incoming Orders', description: 'See real-time order feed & SLA timers', category: 'ORDERS' },
  { id: 'accept_orders', label: 'Accept & Claim Orders', description: 'Claim 45-second quick-commerce offers', category: 'ORDERS' },
  { id: 'pack_orders', label: 'Pack & Rider Handover', description: 'Confirm items, substitute & generate QR seals', category: 'ORDERS' },
  { id: 'edit_catalog', label: 'Edit Catalog & Variants', description: 'Add cosmetics SKUs & shade swatches', category: 'CATALOG' },
  { id: 'adjust_stock', label: 'Adjust Live Inventory', description: 'Update stock levels & shelf bin locations', category: 'CATALOG' },
  { id: 'review_returns', label: 'Process Returns & Refunds', description: 'Inspect returned items & approve refunds', category: 'CATALOG' },
  { id: 'view_earnings', label: 'View Revenue Ledger', description: 'See daily sales & platform fee breakdowns', category: 'FINANCE' },
  { id: 'access_tax', label: 'Access Tax & GST Documents', description: 'Download GST invoices & TCS/TDS reports', category: 'FINANCE', ownerOnly: true },
  { id: 'manage_team', label: 'Manage Staff & Roles', description: 'Invite staff members & edit permissions', category: 'SYSTEM', ownerOnly: true },
  { id: 'bank_edit', label: 'Edit Bank Account & UPI', description: 'Change payout bank details (Locked to Owner)', category: 'FINANCE', ownerOnly: true },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Sri Lakshmi Store Owner',
    contactMasked: '+91 98765 •••••',
    rawContact: '9876543210',
    role: 'STORE_OWNER',
    roleTitle: 'Primary Owner',
    status: 'ACTIVE',
    lastActive: 'Active now',
    storeAssigned: 'Dark Store #1 (Benz Circle)',
    invitedAt: 'Aug 14, 2024',
    permissions: GRANULAR_PERMISSIONS.map((p) => p.id),
  },
  {
    id: 'tm-2',
    name: 'Ramesh Kumar',
    contactMasked: '+91 94401 •••••',
    rawContact: '9440123456',
    role: 'STORE_MANAGER',
    roleTitle: 'Store Manager',
    status: 'ACTIVE',
    lastActive: '12m ago',
    storeAssigned: 'Dark Store #1 (Benz Circle)',
    invitedAt: 'Jan 10, 2025',
    permissions: ['view_orders', 'accept_orders', 'pack_orders', 'edit_catalog', 'adjust_stock', 'review_returns', 'view_earnings'],
  },
  {
    id: 'tm-3',
    name: 'Priya S.',
    contactMasked: '+91 91234 •••••',
    rawContact: '9123456789',
    role: 'PACKER_STAFF',
    roleTitle: 'Packing Specialist',
    status: 'ACTIVE',
    lastActive: '2m ago',
    storeAssigned: 'Dark Store #1 (Benz Circle)',
    invitedAt: 'Feb 01, 2026',
    permissions: ['view_orders', 'accept_orders', 'pack_orders'],
    isHandlingActiveOrder: true,
  },
  {
    id: 'tm-4',
    name: 'Anil Verma',
    contactMasked: 'anil••••@gmail.com',
    rawContact: 'anil.verma@gmail.com',
    role: 'INVENTORY_STAFF',
    roleTitle: 'Inventory Clerk',
    status: 'INVITATION_PENDING',
    lastActive: 'Invitation Sent',
    storeAssigned: 'Dark Store #1 (Benz Circle)',
    invitedAt: 'Yesterday 18:30',
    permissions: ['edit_catalog', 'adjust_stock'],
  },
  {
    id: 'tm-5',
    name: 'Kalyan V.',
    contactMasked: '+91 88976 •••••',
    rawContact: '8897654321',
    role: 'PACKER_STAFF',
    roleTitle: 'Packing Specialist',
    status: 'SUSPENDED',
    lastActive: '3 days ago',
    storeAssigned: 'Dark Store #1 (Benz Circle)',
    invitedAt: 'Dec 15, 2025',
    permissions: ['view_orders', 'pack_orders'],
  },
];

function TeamAccessScreen() {
  const router = useRouter();

  // Screen State
  const [teamList, setTeamList] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OWNERS' | 'MANAGERS' | 'PACKERS' | 'INVENTORY' | 'PENDING' | 'SUSPENDED' | 'REVOKED'>('ALL');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(INITIAL_TEAM_MEMBERS[1]);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Invite Form State
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteContact, setInviteContact] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'STORE_MANAGER' | 'PACKER_STAFF' | 'INVENTORY_STAFF'>('PACKER_STAFF');
  const [invitePermissions, setInvitePermissions] = useState<string[]>(['view_orders', 'pack_orders']);

  // Dev Edge States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showLastOwnerAlert, setShowLastOwnerAlert] = useState<boolean>(false);
  const [showActivePackingAlert, setShowActivePackingAlert] = useState<boolean>(false);
  const [showRevokeConfirmModal, setShowRevokeConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Team Access & Staff Permissions | GlowVAI Vendor';
    }
  }, []);

  const activeCount = useMemo(() => teamList.filter((m) => m.status === 'ACTIVE').length, [teamList]);
  const pendingCount = useMemo(() => teamList.filter((m) => m.status === 'INVITATION_PENDING').length, [teamList]);

  const filteredMembers = useMemo(() => {
    return teamList.filter((m) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'OWNERS') return m.role === 'STORE_OWNER';
      if (activeFilter === 'MANAGERS') return m.role === 'STORE_MANAGER';
      if (activeFilter === 'PACKERS') return m.role === 'PACKER_STAFF';
      if (activeFilter === 'INVENTORY') return m.role === 'INVENTORY_STAFF';
      if (activeFilter === 'PENDING') return m.status === 'INVITATION_PENDING';
      if (activeFilter === 'SUSPENDED') return m.status === 'SUSPENDED';
      if (activeFilter === 'REVOKED') return m.status === 'REVOKED';
      return true;
    });
  }, [teamList, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    soundService.playSuccessDing();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleTogglePermission = (permId: string) => {
    const permDef = GRANULAR_PERMISSIONS.find((p) => p.id === permId);
    if (permDef?.ownerOnly) {
      Alert.alert('🔒 Owner-Controlled Only', `${permDef.label} is locked to primary store owners and cannot be delegated to staff.`);
      return;
    }
    setInvitePermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSendInvitation = () => {
    if (!inviteName.trim() || !inviteContact.trim()) {
      Alert.alert('Missing Details', 'Please enter staff name and mobile or email identifier.');
      return;
    }

    const duplicate = teamList.some(
      (m) => m.rawContact.toLowerCase() === inviteContact.trim().toLowerCase()
    );
    if (duplicate) {
      Alert.alert('⚠️ Duplicate Member', 'A team member with this mobile number or email already exists.');
      return;
    }

    soundService.playSuccessDing();
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteName.trim(),
      contactMasked: inviteContact.includes('@')
        ? `${inviteContact.slice(0, 3)}••••@gmail.com`
        : `+91 ${inviteContact.slice(0, 5)} •••••`,
      rawContact: inviteContact.trim(),
      role: inviteRole,
      roleTitle: inviteRole === 'STORE_MANAGER' ? 'Store Manager' : inviteRole === 'PACKER_STAFF' ? 'Packing Specialist' : 'Inventory Clerk',
      status: 'INVITATION_PENDING',
      lastActive: 'Invitation Sent',
      storeAssigned: 'Dark Store #1 (Benz Circle)',
      invitedAt: 'Just now',
      permissions: invitePermissions,
    };

    setTeamList((prev) => [newMember, ...prev]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteContact('');
    Alert.alert('Invitation Sent ✅', `An invitation link has been dispatched to ${newMember.name}.`);
  };

  const handleSuspendMember = (member: TeamMember) => {
    if (member.role === 'STORE_OWNER') {
      setShowLastOwnerAlert(true);
      return;
    }
    if (member.isHandlingActiveOrder) {
      setShowActivePackingAlert(true);
      return;
    }

    soundService.playSuccessDing();
    setTeamList((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, status: m.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }
          : m
      )
    );
    setSelectedMember((prev) =>
      prev?.id === member.id
        ? { ...prev, status: prev.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }
        : prev
    );
  };

  const handleRevokeMember = (member: TeamMember) => {
    if (member.role === 'STORE_OWNER') {
      setShowLastOwnerAlert(true);
      return;
    }
    setSelectedMember(member);
    setShowRevokeConfirmModal(true);
  };

  const confirmRevokeMember = () => {
    if (!selectedMember) return;
    soundService.playSuccessDing();
    setTeamList((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, status: 'REVOKED' } : m))
    );
    setSelectedMember((prev) => (prev ? { ...prev, status: 'REVOKED' } : null));
    setShowRevokeConfirmModal(false);
    Alert.alert('Access Revoked 🚫', `${selectedMember.name}'s active sessions have been invalidated immediately.`);
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Active', bg: '#DCFCE7', text: COLOR_EMERALD };
      case 'INVITATION_PENDING':
        return { label: 'Invitation Pending', bg: '#FEF3C7', text: '#92400E' };
      case 'SUSPENDED':
        return { label: 'Suspended', bg: '#EFF6FF', text: COLOR_ROYAL_BLUE };
      case 'REVOKED':
        return { label: 'Revoked', bg: '#FEF2F2', text: COLOR_DANGER };
      default:
        return { label: status, bg: '#F1F5F9', text: COLOR_SLATE };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerTitle}>Team Access & Permissions</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCount} Active • {pendingCount} Pending</Text>
            </View>
          </View>
          <Text style={styles.headerSubTitle}>
            Account / Team Access • Invite staff to manage orders & inventory without sharing your owner login
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryInviteBtn}
          onPress={() => {
            soundService.playSuccessDing();
            setShowInviteModal(true);
          }}
        >
          <Text style={styles.primaryInviteBtnText}>+ Invite Team Member</Text>
        </TouchableOpacity>
      </View>

      {/* Edge State Banners */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚡ Offline Mode — Displaying cached staff roster. Invitation link dispatch paused.
          </Text>
        </View>
      )}

      <View style={styles.mainContainer}>
        {/* ── OWNER SECURITY SHIELD BANNER ───────────────────────────────────── */}
        <View style={styles.securityShieldCard}>
          <View style={styles.securityShieldHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} style={{ color: '#475569' }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityShieldTitle}>Owner Account Security Guarantee</Text>
              <Text style={styles.securityShieldSub}>
                Sensitive owner workflows (Payout bank accounts, GST tax filings, KYC documents, and security settings) remain strictly locked to your primary owner login and cannot be accessed by staff members.
              </Text>
            </View>
          </View>
        </View>

        {/* ── DEV TESTING STRIP ────────────────────────────────────────────── */}
        {__DEV__ && (
        <View style={styles.devStrip}>
          <Text style={styles.devTitle}>TEST TEAM ACCESS EDGE STATES:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
            <TouchableOpacity
              style={[styles.devPill, isLoading && styles.devPillActive]}
              onPress={() => setIsLoading(!isLoading)}
            >
              <Text style={styles.devPillText}>Loading Skeletons</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isOffline && styles.devPillActive]}
              onPress={() => setIsOffline(!isOffline)}
            >
              <Text style={styles.devPillText}>Offline Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => setShowLastOwnerAlert(true)}
            >
              <Text style={styles.devPillText}>Last Owner Protection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => setShowActivePackingAlert(true)}
            >
              <Text style={styles.devPillText}>Active Order Handling Warning</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ── ROLE / STATUS FILTER TABS BAR ─────────────────────────────────── */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
            {(['ALL', 'OWNERS', 'MANAGERS', 'PACKERS', 'INVENTORY', 'PENDING', 'SUSPENDED', 'REVOKED'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── DESKTOP TWO-COLUMN LAYOUT: ROSTER TABLE + DETAIL DRAWER ───────────── */}
        <View style={styles.twoColumnGrid}>
          {/* Left Column: Team Members Table */}
          <ScrollView
            style={styles.leftTableWrap}
            contentContainerStyle={styles.leftTableContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
          >
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={COLOR_ROYAL_BLUE} />
                <Text style={styles.loadingText}>Loading staff roster & permission matrix...</Text>
              </View>
            ) : filteredMembers.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={34} style={{ color: '#475569' }} />
                <Text style={styles.emptyTitle}>No team members found</Text>
                <Text style={styles.emptySub}>No staff match the selected role or status filter.</Text>
              </View>
            ) : (
              filteredMembers.map((item) => {
                const isSelected = selectedMember?.id === item.id;
                const statusPill = getStatusPill(item.status);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.memberCard,
                      isSelected && styles.memberCardSelected,
                      item.status === 'REVOKED' && styles.memberCardRevoked,
                    ]}
                    onPress={() => {
                      soundService.playSuccessDing();
                      setSelectedMember(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberAvatarCircle}>
                      <Text style={styles.memberAvatarText}>
                        {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <View style={[styles.statusPill, { backgroundColor: statusPill.bg }]}>
                          <Text style={[styles.statusPillText, { color: statusPill.text }]}>{statusPill.label}</Text>
                        </View>
                      </View>

                      <Text style={styles.memberRoleSub}>
                        {item.roleTitle} • {item.contactMasked}
                      </Text>
                      <Text style={styles.memberMetaSub}>
                        📍 {item.storeAssigned} • Last active: {item.lastActive}
                      </Text>

                      {item.isHandlingActiveOrder && (
                        <View style={styles.activeOrderTag}>
                          <Text style={styles.activeOrderTagText}>⚡ Currently Packing Order #GV-9912</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Right Column: 480px Member Inspection Drawer */}
          <View style={styles.rightDetailDrawer}>
            {selectedMember ? (
              <ScrollView contentContainerStyle={styles.drawerContent}>
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerAvatarLarge}>
                    <Text style={styles.drawerAvatarLargeText}>
                      {selectedMember.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerNameText}>{selectedMember.name}</Text>
                    <Text style={styles.drawerRoleText}>{selectedMember.roleTitle} • {selectedMember.contactMasked}</Text>
                    <Text style={styles.drawerTimeText}>Invited: {selectedMember.invitedAt} • Status: {selectedMember.status}</Text>
                  </View>
                </View>

                {/* Assigned Store */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxLabel}>ASSIGNED STORE LOCATION</Text>
                  <Text style={styles.infoBoxVal}>📍 {selectedMember.storeAssigned}</Text>
                </View>

                {/* Active Permissions List */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxLabel}>ASSIGNED PERMISSIONS ({selectedMember.permissions.length})</Text>
                  <View style={styles.permPillWrap}>
                    {selectedMember.permissions.map((pId) => {
                      const def = GRANULAR_PERMISSIONS.find((p) => p.id === pId);
                      return (
                        <View key={pId} style={[styles.permPill, def?.ownerOnly && styles.permPillOwner]}>
                          <Text style={[styles.permPillText, def?.ownerOnly && styles.permPillTextOwner]}>
                            {def?.ownerOnly ? '🔒 ' : '✓ '}{def?.label || pId}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Recent Activity Audit Trail */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxLabel}>RECENT STAFF AUDIT TRAIL</Text>
                  <View style={styles.auditLogFeed}>
                    <Text style={styles.auditLogLine}>• 10:14 AM — Packed Order #GV-9912 (3 items)</Text>
                    <Text style={styles.auditLogLine}>• 09:30 AM — Adjusted stock for Cetaphil Cleanser (+10)</Text>
                    <Text style={styles.auditLogLine}>• Yesterday — Accepted 12 quick-commerce order offers</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.drawerActionRow}>
                  {selectedMember.status === 'ACTIVE' && (
                    <TouchableOpacity
                      style={styles.suspendBtn}
                      onPress={() => handleSuspendMember(selectedMember)}
                    >
                      <Text style={styles.suspendBtnText}>⏸ Suspend Access</Text>
                    </TouchableOpacity>
                  )}

                  {selectedMember.status === 'SUSPENDED' && (
                    <TouchableOpacity
                      style={[styles.suspendBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                      onPress={() => handleSuspendMember(selectedMember)}
                    >
                      <Text style={[styles.suspendBtnText, { color: COLOR_EMERALD }]}>▶ Reinstate Access</Text>
                    </TouchableOpacity>
                  )}

                  {selectedMember.status !== 'REVOKED' && selectedMember.role !== 'STORE_OWNER' && (
                    <TouchableOpacity
                      style={styles.revokeBtn}
                      onPress={() => handleRevokeMember(selectedMember)}
                    >
                      <Text style={styles.revokeBtnText}>🚫 Revoke Access</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.privacyNoteBox}>
                  <Text style={styles.privacyNoteText}>
                    🔒 Privacy & Session Safety: Staff members log in using single-use OTP sent to their verified mobile number. Revoking access terminates all active sessions immediately.
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.noSelectionWrap}>
                <Ionicons name="hand-left-outline" size={32} style={{ color: '#475569' }} />
                <Text style={styles.noSelectionText}>Select any team member from the left table to inspect role permissions and audit logs.</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── INVITE TEAM MEMBER MODAL ─────────────────────────────────────── */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite New Staff Member</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Kumar"
                  value={inviteName}
                  onChangeText={setInviteName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>MOBILE NUMBER OR EMAIL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210 or ramesh@gmail.com"
                  value={inviteContact}
                  onChangeText={setInviteContact}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>ASSIGNED ROLE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['PACKER_STAFF', 'INVENTORY_STAFF', 'STORE_MANAGER'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleOptionCard, inviteRole === role && styles.roleOptionCardActive]}
                      onPress={() => {
                        setInviteRole(role);
                        if (role === 'PACKER_STAFF') setInvitePermissions(['view_orders', 'accept_orders', 'pack_orders']);
                        if (role === 'INVENTORY_STAFF') setInvitePermissions(['edit_catalog', 'adjust_stock']);
                        if (role === 'STORE_MANAGER') setInvitePermissions(['view_orders', 'accept_orders', 'pack_orders', 'edit_catalog', 'adjust_stock', 'review_returns', 'view_earnings']);
                      }}
                    >
                      <Text style={[styles.roleOptionText, inviteRole === role && styles.roleOptionTextActive]}>
                        {role === 'PACKER_STAFF' ? '📦 Packer' : role === 'INVENTORY_STAFF' ? '🏷️ Inventory' : '👨‍💼 Manager'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.fieldLabel}>GRANULAR PERMISSION SELECTION</Text>
              {GRANULAR_PERMISSIONS.map((perm) => {
                const isChecked = invitePermissions.includes(perm.id);
                return (
                  <TouchableOpacity
                    key={perm.id}
                    style={[styles.permCheckRow, perm.ownerOnly && styles.permCheckRowLocked]}
                    onPress={() => handleTogglePermission(perm.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.permCheckTitle}>{perm.label}</Text>
                        {perm.ownerOnly && <Text style={styles.ownerOnlyBadge}>🔒 Owner Controlled</Text>}
                      </View>
                      <Text style={styles.permCheckSub}>{perm.description}</Text>
                    </View>
                    <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 }}>{perm.ownerOnly ? '🔒' : isChecked ? '☑️' : '⏹️'}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSendInvitation}>
                <Text style={styles.modalPrimaryBtnText}>Send SMS / Email Invite →</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* LAST OWNER PROTECTION ALERT MODAL */}
      <Modal visible={showLastOwnerAlert} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>⚠️ Last Owner Protection Active</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12, lineHeight: 18 }}>
              You cannot suspend or revoke the primary Store Owner account. At least one active owner must exist to maintain store operational authority.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowLastOwnerAlert(false)}>
              <Text style={styles.modalPrimaryBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ACTIVE PACKING WARNING MODAL */}
      <Modal visible={showActivePackingAlert} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_AMBER }]}>⚠️ Staff Currently Packing Order</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12, lineHeight: 18 }}>
              Priya S. is currently packing active customer Order #GV-9912. Suspending access now will interrupt rider seal confirmation. Wait until order packing is complete.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowActivePackingAlert(false)}>
              <Text style={styles.modalPrimaryBtnText}>Understand & Wait</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REVOKE ACCESS CONFIRMATION MODAL */}
      <Modal visible={showRevokeConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>🚫 Confirm Revoking Staff Access</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12, lineHeight: 18 }}>
              Are you sure you want to permanently revoke staff access for {selectedMember?.name}? This will invalidate all active sessions and delete staff API keys immediately.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                onPress={() => setShowRevokeConfirmModal(false)}
              >
                <Text style={[styles.modalPrimaryBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { flex: 1, backgroundColor: COLOR_DANGER }]}
                onPress={confirmRevokeMember}
              >
                <Text style={styles.modalPrimaryBtnText}>Confirm Revoke</Text>
              </TouchableOpacity>
            </View>
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
  countBadge: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryInviteBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryInviteBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
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

  mainContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },

  securityShieldCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  securityShieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  securityShieldTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  securityShieldSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    lineHeight: 16,
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

  filterBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBarContent: {
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: COLOR_ROYAL_BLUE,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  twoColumnGrid: {
    flex: 1,
    flexDirection: (Platform.OS === 'web' ? 'row' : 'column') as any,
    gap: 16,
  },
  leftTableWrap: {
    flex: 1,
  },
  leftTableContent: {
    gap: 10,
  },

  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  memberCardSelected: {
    borderColor: COLOR_ROYAL_BLUE,
    backgroundColor: '#FAFCFF',
  },
  memberCardRevoked: {
    opacity: 0.6,
    backgroundColor: '#FFF5F5',
  },
  memberAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  memberAvatarText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  memberName: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  memberRoleSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  memberMetaSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  activeOrderTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  activeOrderTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
  },

  rightDetailDrawer: {
    width: (Platform.OS === 'web' ? 440 : '100%') as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  drawerContent: {
    gap: 14,
  },
  drawerHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  drawerAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLOR_ROYAL_BLUE,
  },
  drawerAvatarLargeText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_ROYAL_BLUE,
  },
  drawerNameText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  drawerRoleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginTop: 2,
  },
  drawerTimeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  infoBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  infoBoxLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  infoBoxVal: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },

  permPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  permPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  permPillOwner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  permPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  permPillTextOwner: {
    color: '#92400E',
  },

  auditLogFeed: {
    gap: 4,
    marginTop: 2,
  },
  auditLogLine: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#334155',
  },

  drawerActionRow: {
    gap: 8,
  },
  suspendBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suspendBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  revokeBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  revokeBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
  },

  privacyNoteBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
  },
  privacyNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_ROYAL_BLUE,
    lineHeight: 14,
  },

  noSelectionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  noSelectionText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_SLATE,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: COLOR_SLATE,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: COLOR_SLATE,
  },

  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
  },

  roleOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleOptionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLOR_ROYAL_BLUE,
  },
  roleOptionText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  roleOptionTextActive: {
    color: COLOR_ROYAL_BLUE,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  permCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permCheckRowLocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  permCheckTitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  permCheckSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ownerOnlyBadge: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },

  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(TeamAccessScreen, 'Team access');
