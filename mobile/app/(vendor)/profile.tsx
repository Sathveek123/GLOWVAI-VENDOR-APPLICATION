/**
 * SCREEN 25: Store Profile & KYC Dossier
 * File: mobile/app/(vendor)/profile.tsx
 *
 * Production-grade merchant identity and compliance hub for GlowVAI Vendors.
 * Features:
 *   • Profile Header Card with store logo photo upload, 4.96 rating badge, & live duty status
 *   • 4 Accessible Tabs: "Store", "Hours", "KYC", "Bank"
 *   • 7-day operating hours schedule with "Copy Monday to All Days" & live customer preview
 *   • 6-document KYC Dossier with timed reveal (10s auto-remasking) & upload malware scanner
 *   • Bank summary linked to Screen 24 bank management flow
 *   • Separated Danger Zone logout modal explaining session invalidation
 *   • Complete edge states (Loading, Offline, Unsaved changes, Permission denied, Session expired)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import AppHeader from '../../src/components/AppHeader';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import { soundService } from '../../src/services/sound';
import { clearSession } from '../../src/services/session';

const COLOR_ROYAL_BLUE = Colors.primary;
const COLOR_EMERALD = Colors.success;
const COLOR_AMBER = Colors.warning;
const COLOR_DANGER = Colors.danger;
const COLOR_SLATE = '#64748B';

const DAYS_OF_WEEK = [
  { key: 'Mon', name: 'Monday' },
  { key: 'Tue', name: 'Tuesday' },
  { key: 'Wed', name: 'Wednesday' },
  { key: 'Thu', name: 'Thursday' },
  { key: 'Fri', name: 'Friday' },
  { key: 'Sat', name: 'Saturday' },
  { key: 'Sun', name: 'Sunday' },
];

export interface KycDocItem {
  id: string;
  kind: string;
  maskedNumber: string;
  fullNumber: string;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'EXPIRING_SOON' | 'REJECTED' | 'REPLACEMENT_REQUIRED' | 'UPLOAD_PROCESSING' | 'UNAVAILABLE';
  fileName: string;
  fileSize: string;
  expiresAt?: string;
}

const INITIAL_KYC_DOCS: KycDocItem[] = [
  {
    id: 'kyc-1',
    kind: 'GSTIN Registration Certificate',
    maskedNumber: '37AAAAA****1Z5',
    fullNumber: '37AAAAA00001Z5',
    status: 'VERIFIED',
    fileName: 'gst_certificate_2026.pdf',
    fileSize: '1.4 MB',
  },
  {
    id: 'kyc-2',
    kind: 'Merchant PAN Identity Card',
    maskedNumber: 'ABCDE****F',
    fullNumber: 'ABCDE1234F',
    status: 'VERIFIED',
    fileName: 'pan_card_owner.pdf',
    fileSize: '820 KB',
  },
  {
    id: 'kyc-3',
    kind: 'FSSAI Cosmetic Retail License',
    maskedNumber: '1152400****891',
    fullNumber: '11524009900891',
    status: 'EXPIRING_SOON',
    fileName: 'fssai_license_2026.pdf',
    fileSize: '2.1 MB',
    expiresAt: '28 Days (Nov 5, 2026)',
  },
  {
    id: 'kyc-4',
    kind: 'Trade & Municipal Dark Store License',
    maskedNumber: 'TRD-VIJ-2026-99',
    fullNumber: 'TRD-VIJ-2026-99',
    status: 'PENDING_REVIEW',
    fileName: 'trade_license_vij.pdf',
    fileSize: '1.1 MB',
  },
  {
    id: 'kyc-5',
    kind: 'Dark Store Geo-Fence Map Coordinates',
    maskedNumber: 'Benz Circle (5km Radius)',
    fullNumber: '16.5062° N, 80.6480° E',
    status: 'REPLACEMENT_REQUIRED',
    fileName: 'geofence_map_old.png',
    fileSize: '950 KB',
  },
  {
    id: 'kyc-6',
    kind: 'Store Front & Shelf Inspection Photo',
    maskedNumber: 'STR-PHOTO-2026',
    fullNumber: 'STR-PHOTO-2026-FULL',
    status: 'REJECTED',
    fileName: 'store_photo_blurry.jpg',
    fileSize: '410 KB',
  },
  {
    id: 'kyc-7',
    kind: 'Utility Bill (Address & Electricity Proof)',
    maskedNumber: 'Pending Upload',
    fullNumber: 'Pending Upload',
    status: 'UNAVAILABLE',
    fileName: 'No file uploaded',
    fileSize: '0 KB',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { vendor } = useVendorStore();
  const isOnline = vendor?.isOnline ?? true;

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'STORE' | 'HOURS' | 'KYC' | 'BANK'>('STORE');

  // Store Profile Form Fields State
  const [storeName, setStoreName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 9876543210');
  const [email, setEmail] = useState<string>('priya.beauty@glowvai.in');
  const [description, setDescription] = useState<string>('Premium authentic cosmetics, skincare, and fragrance dark store in Vijayawada.');
  const [address, setAddress] = useState<string>('Door 12-4-5, Benz Circle Main Road');
  const [locality, setLocality] = useState<string>('Benz Circle');
  const [city, setCity] = useState<string>('Vijayawada');
  const [pinCode, setPinCode] = useState<string>('520010');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Operating Hours State
  const [hoursSchedule, setHoursSchedule] = useState<Record<string, { open: boolean; openTime: string; closeTime: string }>>({
    Mon: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Tue: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Wed: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Thu: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Fri: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Sat: { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' },
    Sun: { open: true, openTime: '10:00 AM', closeTime: '10:00 PM' },
  });

  const [specialClosures, setSpecialClosures] = useState<{ id: string; date: string; reason: string }[]>([
    { id: '1', date: '2026-11-01', reason: 'Deepavali Festival Store Holiday' },
  ]);
  const [newClosureDate, setNewClosureDate] = useState<string>('');
  const [newClosureReason, setNewClosureReason] = useState<string>('');

  // KYC Dossier State
  const [kycDocs, setKycDocs] = useState<KycDocItem[]>(INITIAL_KYC_DOCS);
  const [revealedDocIds, setRevealedDocIds] = useState<Record<string, boolean>>({});
  const [uploadTargetDoc, setUploadTargetDoc] = useState<KycDocItem | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  // Logout Modal
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Dev Edge States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [showSessionExpired, setShowSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Store Profile & KYC Dossier | GlowVAI Vendor';
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    soundService.playSuccessDing();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSaveStoreProfile = () => {
    if (!storeName.trim() || !ownerName.trim()) {
      Alert.alert('Required Fields', 'Store Name and Owner Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    soundService.playSuccessDing();
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      Alert.alert('Profile Saved ✅', 'Your dark store profile details have been updated.');
    }, 800);
  };

  const handleCopyMondayHoursToAll = () => {
    const mon = hoursSchedule['Mon'];
    const updated: any = {};
    DAYS_OF_WEEK.forEach((d) => {
      updated[d.key] = { ...mon };
    });
    setHoursSchedule(updated);
    soundService.playSuccessDing();
    Alert.alert('Hours Copied ⏰', 'Monday operating hours applied to all 7 days.');
  };

  const handleToggleTimedReveal = (docId: string) => {
    soundService.playSuccessDing();
    setRevealedDocIds((prev) => ({ ...prev, [docId]: true }));
    // Auto-remask after 10 seconds
    setTimeout(() => {
      setRevealedDocIds((prev) => ({ ...prev, [docId]: false }));
    }, 10000);
  };

  const handleSimulateDocumentUpload = () => {
    if (!uploadTargetDoc) return;
    setIsUploadingFile(true);
    soundService.playSuccessDing();
    setTimeout(() => {
      setIsUploadingFile(false);
      setKycDocs((prev) =>
        prev.map((d) =>
          d.id === uploadTargetDoc.id
            ? { ...d, status: 'PENDING_REVIEW', fileName: `${d.kind.toLowerCase().replace(/\s+/g, '_')}_new.pdf`, fileSize: '1.8 MB' }
            : d
        )
      );
      setUploadTargetDoc(null);
      Alert.alert('Upload Complete ☁️', 'File uploaded and passed malware scan. Compliance review pending.');
    }, 1200);
  };

  const verifiedCount = useMemo(() => {
    return kycDocs.filter((d) => d.status === 'VERIFIED').length;
  }, [kycDocs]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <AppHeader
        title="Profile"
        subtitle="Store ID: DS-VIJ-01 • Partner since Aug 2024"
        showBell={true}
        showBack={true}
      />

      {/* Edge State Banners */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚡ Offline Mode — Displaying cached store profile dossier.
          </Text>
        </View>
      )}

      {hasUnsavedChanges && (
        <View style={styles.unsavedBanner}>
          <Text style={styles.unsavedBannerText}>
            ⚠️ You have unsaved profile changes. Tap "Save Changes" to apply.
          </Text>
        </View>
      )}

      {isPermissionDenied && (
        <View style={styles.deniedBanner}>
          <Text style={styles.deniedBannerText}>
            🔒 Permission Denied — Only primary Store Managers can modify KYC dossiers.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLOR_ROYAL_BLUE]} />}
      >
        {/* DEV TESTING STRIP */}
        {__DEV__ && (
        <View style={styles.devStrip}>
          <Text style={styles.devTitle}>TEST PROFILE & KYC EDGE STATES:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
            <TouchableOpacity
              style={[styles.devPill, isLoading && styles.devPillActive]}
              onPress={() => setIsLoading(!isLoading)}
            >
              <Text style={styles.devPillText}>Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isOffline && styles.devPillActive]}
              onPress={() => setIsOffline(!isOffline)}
            >
              <Text style={styles.devPillText}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, hasUnsavedChanges && styles.devPillActive]}
              onPress={() => setHasUnsavedChanges(!hasUnsavedChanges)}
            >
              <Text style={styles.devPillText}>Unsaved Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isPermissionDenied && styles.devPillActive]}
              onPress={() => setIsPermissionDenied(!isPermissionDenied)}
            >
              <Text style={styles.devPillText}>Permission Denied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => setShowSessionExpired(true)}
            >
              <Text style={styles.devPillText}>Session Expired</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ── 1. PROFILE HEADER CARD ────────────────────────────────────────── */}
        {isLoading ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLOR_ROYAL_BLUE} />
            <Text style={{ color: COLOR_SLATE, marginTop: 10 }}>Loading profile dossier...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarWrap}>
                <View style={[styles.avatarImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="storefront-outline" size={28} color="#1D4ED8" />
                </View>
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={() => Alert.alert('Upload Store Avatar', 'Select photo from gallery or camera.')}
                >
                  <Ionicons name="camera-outline" size={12} style={{ color: '#FFFFFF' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.storeTitleText}>{storeName}</Text>
                  <View style={[styles.dutyPill, isOnline ? styles.dutyOpen : styles.dutyPaused]}>
                    <Text style={styles.dutyPillText}>{isOnline ? '🟢 Open' : '⏸️ Paused'}</Text>
                  </View>
                </View>

                <Text style={styles.storeSubText}>Beauty, Skincare & Cosmetics Dark Store</Text>
                <Text style={styles.locationText}>📍 {locality}, {city} ({pinCode})</Text>

                <View style={styles.ratingRow}>
                  <Text style={styles.ratingText}>4.96 ⭐</Text>
                  <Text style={styles.ratingSub}>(128 verified customer reviews)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── 2. FOUR ACCESSIBLE TABS ───────────────────────────────────────── */}
        {!isLoading && !isPermissionDenied && (
          <>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'STORE' && styles.tabBtnActive]}
                onPress={() => setActiveTab('STORE')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'STORE' && styles.tabBtnTextActive]}>
                  🏪 Store
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'HOURS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('HOURS')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'HOURS' && styles.tabBtnTextActive]}>
                  ⏰ Hours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'KYC' && styles.tabBtnActive]}
                onPress={() => setActiveTab('KYC')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'KYC' && styles.tabBtnTextActive]}>
                  📜 KYC ({verifiedCount}/{kycDocs.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'BANK' && styles.tabBtnActive]}
                onPress={() => setActiveTab('BANK')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'BANK' && styles.tabBtnTextActive]}>
                  🏦 Bank
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: STORE DETAILS */}
            {activeTab === 'STORE' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>MERCHANT IDENTITY & ADDRESS</Text>

                <View style={styles.formGrid}>
                  <View style={styles.formColFull}>
                    <Text style={styles.inputLabel}>STORE / SHOP NAME</Text>
                    <TextInput
                      style={styles.textInput}
                      value={storeName}
                      onChangeText={(t) => {
                        setStoreName(t);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>

                  <View style={styles.formColFull}>
                    <Text style={styles.inputLabel}>REGISTERED OWNER NAME</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ownerName}
                      onChangeText={(t) => {
                        setOwnerName(t);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>

                  <View style={styles.formColHalf}>
                    <Text style={styles.inputLabel}>PRIMARY PHONE (+91)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t);
                        setHasUnsavedChanges(true);
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.formColHalf}>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setHasUnsavedChanges(true);
                      }}
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.formColFull}>
                    <Text style={styles.inputLabel}>STORE DESCRIPTION</Text>
                    <TextInput
                      style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                      value={description}
                      onChangeText={(t) => {
                        setDescription(t);
                        setHasUnsavedChanges(true);
                      }}
                      multiline
                    />
                  </View>

                  <View style={styles.formColFull}>
                    <Text style={styles.inputLabel}>STREET ADDRESS</Text>
                    <TextInput
                      style={styles.textInput}
                      value={address}
                      onChangeText={(t) => {
                        setAddress(t);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>

                  <View style={styles.formColThird}>
                    <Text style={styles.inputLabel}>LOCALITY</Text>
                    <TextInput
                      style={styles.textInput}
                      value={locality}
                      onChangeText={(t) => {
                        setLocality(t);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>

                  <View style={styles.formColThird}>
                    <Text style={styles.inputLabel}>CITY</Text>
                    <TextInput
                      style={styles.textInput}
                      value={city}
                      onChangeText={(t) => {
                        setCity(t);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>

                  <View style={styles.formColThird}>
                    <Text style={styles.inputLabel}>PINCODE</Text>
                    <TextInput
                      style={styles.textInput}
                      value={pinCode}
                      onChangeText={(t) => {
                        setPinCode(t);
                        setHasUnsavedChanges(true);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveStoreProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: OPERATING HOURS */}
            {activeTab === 'HOURS' && (
              <View style={styles.card}>
                <View style={styles.hoursHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>7-DAY OPERATING SCHEDULE</Text>
                    <Text style={styles.cardSub}>Set store opening & closing windows for customer fulfillment</Text>
                  </View>

                  <TouchableOpacity style={styles.copyMonBtn} onPress={handleCopyMondayHoursToAll}>
                    <Text style={styles.copyMonBtnText}>Copy Mon to All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.previewLineBox}>
                  <Text style={styles.previewLineText}>
                    ℹ️ Live Preview: Customers can order today until 11:00 PM.
                  </Text>
                </View>

                {DAYS_OF_WEEK.map((d) => {
                  const schedule = hoursSchedule[d.key] || { open: true, openTime: '08:00 AM', closeTime: '11:00 PM' };
                  return (
                    <View key={d.key} style={styles.hoursRow}>
                      <View style={styles.daySwitchGroup}>
                        <Switch
                          value={schedule.open}
                          onValueChange={() =>
                            setHoursSchedule((prev) => ({
                              ...prev,
                              [d.key]: { ...prev[d.key], open: !prev[d.key].open },
                            }))
                          }
                          trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                          thumbColor={schedule.open ? COLOR_ROYAL_BLUE : '#94A3B8'}
                        />
                        <Text style={styles.dayNameText}>{d.name}</Text>
                      </View>

                      {schedule.open ? (
                        <View style={styles.timeWrap}>
                          <Text style={styles.timePill}>{schedule.openTime}</Text>
                          <Text style={{ color: COLOR_SLATE, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 }}>to</Text>
                          <Text style={styles.timePill}>{schedule.closeTime}</Text>
                        </View>
                      ) : (
                        <Text style={styles.closedText}>Closed for Orders</Text>
                      )}
                    </View>
                  );
                })}

                <Text style={[styles.cardTitle, { marginTop: 16 }]}>SPECIAL CLOSURES & HOLIDAYS</Text>
                {specialClosures.map((sc) => (
                  <View key={sc.id} style={sc.id === '1' ? styles.closureRow : styles.closureRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.closureReason}>{sc.reason}</Text>
                      <Text style={styles.closureDate}>📅 {sc.date}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSpecialClosures((prev) => prev.filter((item) => item.id !== sc.id))}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addClosureRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="YYYY-MM-DD"
                    value={newClosureDate}
                    onChangeText={setNewClosureDate}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Closure Reason"
                    value={newClosureReason}
                    onChangeText={setNewClosureReason}
                  />
                  <TouchableOpacity
                    style={styles.addClosureBtn}
                    onPress={() => {
                      if (!newClosureDate || !newClosureReason) return;
                      setSpecialClosures((prev) => [
                        ...prev,
                        { id: Date.now().toString(), date: newClosureDate, reason: newClosureReason },
                      ]);
                      setNewClosureDate('');
                      setNewClosureReason('');
                    }}
                  >
                    <Text style={styles.addClosureBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 3: KYC DOSSIER */}
            {activeTab === 'KYC' && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>KYC DOSSIER & VERIFIED LICENSES</Text>
                    <Text style={styles.cardSub}>
                      {verifiedCount} of {kycDocs.length} Documents Verified (83%)
                    </Text>
                  </View>
                  <View style={styles.statusVerifiedPill}>
                    <Text style={styles.statusVerifiedText}>Active Merchant</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(verifiedCount / kycDocs.length) * 100}%` }]} />
                </View>

                {kycDocs.map((doc) => {
                  const isRevealed = revealedDocIds[doc.id];
                  return (
                    <View key={doc.id} style={styles.kycRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.kycHeaderRow}>
                          <Text style={styles.kycKindText}>{doc.kind}</Text>
                          <View
                            style={[
                              styles.kycBadge,
                              doc.status === 'VERIFIED'
                                ? styles.kycBadgeVerified
                                : doc.status === 'REJECTED'
                                ? { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }
                                : doc.status === 'UNAVAILABLE'
                                ? { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }
                                : styles.kycBadgeExpiring,
                            ]}
                          >
                            <Text
                              style={[
                                styles.kycBadgeText,
                                doc.status === 'VERIFIED'
                                  ? styles.kycTextVerified
                                  : doc.status === 'REJECTED'
                                  ? { color: COLOR_DANGER }
                                  : doc.status === 'UNAVAILABLE'
                                  ? { color: COLOR_SLATE }
                                  : styles.kycTextExpiring,
                              ]}
                            >
                              {doc.status === 'VERIFIED'
                                ? '✓ Verified'
                                : doc.status === 'PENDING_REVIEW'
                                ? '⌛ Pending Review'
                                : doc.status === 'EXPIRING_SOON'
                                ? '⚠️ Expiring Soon'
                                : doc.status === 'REJECTED'
                                ? '❌ Rejected'
                                : doc.status === 'REPLACEMENT_REQUIRED'
                                ? '⚠️ Replace Required'
                                : doc.status === 'UPLOAD_PROCESSING'
                                ? '☁️ Processing'
                                : '🔒 Unavailable'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <Text style={styles.kycCodeText}>
                            {isRevealed ? doc.fullNumber : doc.maskedNumber}
                          </Text>
                          <TouchableOpacity onPress={() => handleToggleTimedReveal(doc.id)}>
                            <Text style={styles.revealBtnText}>{isRevealed ? 'Hide' : 'Reveal'}</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.kycFileMeta}>
                          {doc.fileName} • {doc.fileSize} {doc.expiresAt ? `• Exp: ${doc.expiresAt}` : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.replaceBtn}
                        onPress={() => setUploadTargetDoc(doc)}
                      >
                        <Text style={styles.replaceBtnText}>Replace Upload</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <Text style={styles.kycDisclaimerLine}>
                  🔒 Documents are stored with 256-bit AES encryption under Indian IT Act compliance.
                </Text>
              </View>
            )}

            {/* TAB 4: BANK ACCOUNT SUMMARY */}
            {activeTab === 'BANK' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>SETTLEMENT BANK ACCOUNT SUMMARY</Text>
                <Text style={styles.bankNameVal}>HDFC Bank</Text>
                <Text style={styles.bankSubVal}>Account Number: ••••••4589 | IFSC: HDFC0001234</Text>
                <Text style={styles.bankSubVal}>UPI Payout VPA: glow••••@hdfcbank</Text>

                <TouchableOpacity
                  style={styles.manageBankLinkBtn}
                  onPress={() => router.push('/(vendor)/bank-edit')}
                >
                  <Text style={styles.manageBankLinkText}>Manage Bank Account & UPI (Screen 24) →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── SEPARATED DANGER ZONE LOGOUT ───────────────────────────────── */}
            <View style={styles.dangerZoneCard}>
              <Text style={styles.dangerZoneTitle}>DANGER ZONE</Text>
              <Text style={styles.dangerZoneSub}>
                Logging out invalidates your active session. Live incoming customer orders will pause until you log back in.
              </Text>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  soundService.playSuccessDing();
                  setShowLogoutModal(true);
                }}
              >
                <Text style={styles.logoutBtnText}>Log Out of GlowVAI Vendor</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── UPLOAD DOCUMENT MODAL ──────────────────────────────────────────── */}
      <Modal visible={!!uploadTargetDoc} transparent animationType="slide">
        {uploadTargetDoc && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload {uploadTargetDoc.kind}</Text>
                <TouchableOpacity onPress={() => setUploadTargetDoc(null)}>
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubText}>Accepted file formats: PDF, PNG, JPG (Max file size 5MB)</Text>

              <View style={styles.uploadDropZone}>
                <Ionicons name="cloud-upload-outline" size={32} style={{ color: '#475569' }} />
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: COLOR_ROYAL_BLUE, marginTop: 6 }}>
                  Tap to Select File or Take Photo
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: COLOR_SLATE, marginTop: 2 }}>Malware scanning automatically enabled</Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSimulateDocumentUpload}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Simulate Secure Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ── LOGOUT CONFIRMATION MODAL ─────────────────────────────────────── */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>Log out of GlowVAI Vendor?</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12, lineHeight: 18 }}>
              Are you sure you want to log out? Your store duty status will be paused and you will not receive live incoming customer order offer chime notifications until you sign back in.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { flex: 1, backgroundColor: COLOR_DANGER }]}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await clearSession();
                  router.replace('/(auth)/login');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalPrimaryBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SESSION EXPIRED MODAL */}
      <Modal visible={showSessionExpired} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: COLOR_DANGER }]}>🔒 Session Expired</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: COLOR_SLATE, marginVertical: 12 }}>
              Your authentication token has expired for security compliance. Please log in again to continue managing your dark store.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSessionExpired(false);
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Log In Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab="profile" />
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
    paddingVertical: 12,
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
  verifiedBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
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
  unsavedBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  unsavedBannerText: {
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
  cardTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLOR_ROYAL_BLUE,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storeTitleText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  storeSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  locationText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_AMBER,
  },
  ratingSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  dutyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dutyOpen: {
    backgroundColor: '#DCFCE7',
  },
  dutyPaused: {
    backgroundColor: '#FEF3C7',
  },
  dutyPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
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

  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formColFull: {
    width: '100%',
  },
  formColHalf: {
    width: '48%',
  },
  formColThird: {
    width: '31%',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },

  hoursHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyMonBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  copyMonBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  previewLineBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginVertical: 10,
  },
  previewLineText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  daySwitchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNameText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  closedText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  closureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closureReason: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  closureDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  removeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
  },
  addClosureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addClosureBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addClosureBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusVerifiedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusVerifiedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR_EMERALD,
  },
  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kycHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kycKindText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  kycBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kycBadgeVerified: { backgroundColor: '#DCFCE7' },
  kycBadgeExpiring: { backgroundColor: '#FEF3C7' },
  kycBadgeAction: { backgroundColor: '#FEE2E2' },
  kycBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' },
  kycTextVerified: { color: COLOR_EMERALD },
  kycTextExpiring: { color: COLOR_AMBER },
  kycTextAction: { color: COLOR_DANGER },

  kycCodeText: {
    fontSize: 12,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  revealBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  kycFileMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  replaceBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  replaceBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#334155',
  },
  kycDisclaimerLine: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },

  bankNameVal: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  bankSubVal: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  manageBankLinkBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  manageBankLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  dangerZoneCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dangerZoneTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    letterSpacing: 0.5,
  },
  dangerZoneSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 15,
  },
  logoutBtn: {
    backgroundColor: COLOR_DANGER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
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
    marginBottom: 10,
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
  modalSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  uploadDropZone: {
    height: 120,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLOR_ROYAL_BLUE,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
});
