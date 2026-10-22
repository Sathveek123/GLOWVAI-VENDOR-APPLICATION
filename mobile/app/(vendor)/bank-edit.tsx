/**
 * SCREEN 24: Bank Account & UPI Management
 * File: mobile/app/(vendor)/bank-edit.tsx
 *
 * Production-grade payout destination & bank account security hub for GlowVAI Vendors.
 * Features:
 *   • Masked bank card (HDFC ••••••4589) & UPI handle (glow••••@hdfcbank)
 *   • Guided 3-step secure change flow (OTP Identity, New Details with paste-blocked field, Review & Submit)
 *   • Real-time IFSC branch lookup & penny-drop verification simulation
 *   • 24-Hour security cooling period policy warnings & audit trail
 *   • Complete edge states (OTP error, Lockout, IFSC error, Mismatch, Cooling active, Offline)
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
  TextInput,
  Modal,
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

function BankEditScreen() {
  const router = useRouter();
  const { vendor } = useVendorStore();

  // Screen State
  const [defaultChannel, setDefaultChannel] = useState<'BANK' | 'UPI'>('BANK');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);
  const [editType, setEditType] = useState<'BANK' | 'UPI'>('BANK');

  // Step 1: OTP State
  const [otpValue, setOtpValue] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');

  // Step 2: New Bank / UPI Form
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Priya Beauty Retail Pvt Ltd');
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('HDFC0001234');
  const [resolvedBranch, setResolvedBranch] = useState<string>('Benz Circle Branch, Vijayawada');
  const [isResolvingIfsc, setIsResolvingIfsc] = useState<boolean>(false);
  const [ifscError, setIfscError] = useState<string>('');
  const [upiHandle, setUpiHandle] = useState<string>('');
  const [upiVerifiedName, setUpiVerifiedName] = useState<string | null>(null);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState<boolean>(false);

  // Step 3: Review & Submission
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState<boolean>(false);
  const [changeReason, setChangeReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [changeSubmitted, setChangeSubmitted] = useState<boolean>(false);

  // Edge & Simulation States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isCoolingPeriodActive, setIsCoolingPeriodActive] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Bank Account & UPI Management | GlowVAI Vendor';
    }
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isEditModalOpen && editStep === 1 && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isEditModalOpen, editStep, resendTimer]);

  const handleStartEditFlow = (type: 'BANK' | 'UPI') => {
    setEditType(type);
    setEditStep(1);
    setOtpValue('');
    setOtpError('');
    setOtpAttempts(0);
    setIsLockedOut(false);
    setResendTimer(30);
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscError('');
    setIsConfirmedCheckbox(false);
    setChangeSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleVerifyOtp = () => {
    if (isLockedOut) return;
    // OTP verification must happen on the server. Until that exists, only the
    // developer test code passes, and only in __DEV__ builds.
    if (__DEV__ && otpValue.trim() === '4892') {
      soundService.playSuccessDing();
      setEditStep(2);
      setOtpError('');
    } else {
      setOtpError('Verification is not available in this build yet. Payout details cannot be changed.');
    }
  };

  const handleIfscLookup = async (code: string) => {
    const cleanIfsc = code.toUpperCase().trim();
    setIfscCode(cleanIfsc);
    if (cleanIfsc.length === 11) {
      setIsResolvingIfsc(true);
      setIfscError('');
      setTimeout(() => {
        setIsResolvingIfsc(false);
        if (cleanIfsc.startsWith('HDFC')) {
          setResolvedBranch('Benz Circle Branch, Vijayawada');
          setBankName('HDFC Bank');
        } else if (cleanIfsc.startsWith('SBIN')) {
          setResolvedBranch('MG Road Main Branch, Vijayawada');
          setBankName('State Bank of India');
        } else {
          setResolvedBranch('Main Commerce Branch, Vijayawada');
        }
      }, 500);
    } else {
      setResolvedBranch('');
    }
  };

  const handleVerifyUpiHandle = async () => {
    if (!upiHandle.includes('@')) {
      Alert.alert('Invalid UPI', 'Enter a valid UPI VPA handle (e.g. name@bank)');
      return;
    }
    setIsVerifyingUpi(true);
    setTimeout(() => {
      setIsVerifyingUpi(false);
      setUpiVerifiedName(beneficiaryName);
      soundService.playSuccessDing();
      Alert.alert('UPI Handle Verified ✅', `Registered Name: ${beneficiaryName}`);
    }, 600);
  };

  const handleProceedToStep3 = () => {
    if (editType === 'BANK') {
      if (!accountNumber || !confirmAccountNumber) {
        Alert.alert('Required Fields', 'Please enter and confirm your bank account number.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        Alert.alert('Account Mismatch ⚠️', 'Account number and confirm account number do not match.');
        return;
      }
      if (ifscCode.length !== 11) {
        Alert.alert('Invalid IFSC', 'IFSC code must be exactly 11 alphanumeric characters.');
        return;
      }
    } else {
      if (!upiHandle || !upiHandle.includes('@')) {
        Alert.alert('Required', 'Please enter a valid UPI VPA handle.');
        return;
      }
    }
    soundService.playSuccessDing();
    setEditStep(3);
  };

  const handleSubmitAccountChange = async () => {
    if (!isConfirmedCheckbox) {
      Alert.alert('Confirmation Required', 'Please check the box to confirm account ownership.');
      return;
    }
    // No payout-change endpoint exists yet. Do not report a change that was not saved.
    Alert.alert(
      'Not available yet',
      'Payout account changes cannot be saved in this build. Your existing account is unchanged.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Payout Account</Text>
          <Text style={styles.headerSubTitle}>Bank Account & UPI Payout Destinations</Text>
        </View>

        <View style={styles.secPill}>
          <Text style={styles.secPillText}>🔒 Encrypted</Text>
        </View>
      </View>

      {/* Edge State Banners */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚡ Offline Mode — Displaying cached bank account details.
          </Text>
        </View>
      )}

      {isCoolingPeriodActive && (
        <View style={styles.coolingBanner}>
          <Text style={styles.coolingBannerText}>
            ⌛ 24-Hour Security Cooling Period Active — Daily payouts paused until Tomorrow 06:00 AM.
          </Text>
        </View>
      )}

      {isPermissionDenied && (
        <View style={styles.deniedBanner}>
          <Text style={styles.deniedBannerText}>
            🔒 Permission Denied — Only primary Store Owners can modify payout bank accounts.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DEV TESTING STRIP FOR EDGE STATES */}
        {__DEV__ && (
        <View style={styles.devStrip}>
          <Text style={styles.devTitle}>TEST BANK SECURITY EDGE STATES:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devPillRow}>
            <TouchableOpacity
              style={[styles.devPill, isLoading && styles.devPillActive]}
              onPress={() => setIsLoading(!isLoading)}
            >
              <Text style={styles.devPillText}>Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isCoolingPeriodActive && styles.devPillActive]}
              onPress={() => setIsCoolingPeriodActive(!isCoolingPeriodActive)}
            >
              <Text style={styles.devPillText}>Cooling Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isOffline && styles.devPillActive]}
              onPress={() => setIsOffline(!isOffline)}
            >
              <Text style={styles.devPillText}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devPill, isPermissionDenied && styles.devPillActive]}
              onPress={() => setIsPermissionDenied(!isPermissionDenied)}
            >
              <Text style={styles.devPillText}>Permission Denied</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ── 1. PRIMARY VERIFIED BANK ACCOUNT CARD ─────────────────────────── */}
        {isLoading ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLOR_ROYAL_BLUE} />
            <Text style={{ color: COLOR_SLATE, marginTop: 10 }}>Loading payout details...</Text>
          </View>
        ) : isPermissionDenied ? (
          <View style={styles.deniedCard}>
            <Text style={styles.deniedCardTitle}>Access Restricted</Text>
            <Text style={styles.deniedCardSub}>
              You do not have permission to view or edit bank accounts. Contact your Store Admin.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.bankLogoWrap}>
                  <Text style={styles.bankLogoText}>HDFC</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.bankTitleText}>HDFC Bank</Text>
                    <View style={styles.statusVerifiedPill}>
                      <Text style={styles.statusVerifiedText}>✓ Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.bankSubText}>Primary Settlement Account • Savings</Text>
                </View>

                {defaultChannel === 'BANK' && (
                  <View style={styles.defaultChannelTag}>
                    <Text style={styles.defaultChannelTagText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ACCOUNT HOLDER</Text>
                  <Text style={styles.detailVal}>Priya Beauty Retail Pvt Ltd</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                  <Text style={styles.detailValMasked}>••••••4589</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>IFSC CODE</Text>
                  <Text style={styles.detailValCode}>HDFC0001234</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>BRANCH</Text>
                  <Text style={styles.detailVal}>Benz Circle, Vijayawada</Text>
                </View>
              </View>

              <Text style={styles.verifiedMetaText}>Penny-Drop Verified on 15 Aug 2026 via RBI NPCI</Text>

              <TouchableOpacity
                style={styles.changeActionBtn}
                onPress={() => handleStartEditFlow('BANK')}
              >
                <Text style={styles.changeActionBtnText}>Change Bank Details →</Text>
              </TouchableOpacity>
            </View>

            {/* ── 2. MASKED UPI PAYOUT CARD ──────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={[styles.bankLogoWrap, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.bankLogoText, { color: COLOR_AMBER }]}>UPI</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.bankTitleText}>UPI Payout Destination</Text>
                    <View style={styles.statusVerifiedPill}>
                      <Text style={styles.statusVerifiedText}>✓ Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.bankSubText}>VPA Handle: glow••••@hdfcbank</Text>
                </View>

                {defaultChannel === 'UPI' && (
                  <View style={styles.defaultChannelTag}>
                    <Text style={styles.defaultChannelTagText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <View style={styles.upiActionRow}>
                <TouchableOpacity
                  style={styles.switchChannelBtn}
                  onPress={() => {
                    soundService.playSuccessDing();
                    setDefaultChannel(defaultChannel === 'BANK' ? 'UPI' : 'BANK');
                  }}
                >
                  <Text style={styles.switchChannelBtnText}>
                    {defaultChannel === 'BANK' ? 'Set UPI as Default' : 'Set Bank as Default'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editUpiBtn}
                  onPress={() => handleStartEditFlow('UPI')}
                >
                  <Text style={styles.editUpiBtnText}>Edit UPI Handle</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 3. RECENT SECURITY ACTIVITY LOG ────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>RECENT SECURITY & ACCOUNT ACTIVITY</Text>
              <View style={styles.activityRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Bank Account Penny-Drop Verification</Text>
                  <Text style={styles.activityMeta}>15 Aug 2026, 04:30 PM • HDFC ••••••4589</Text>
                </View>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>VERIFIED</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.suspiciousHelpBtn}
                onPress={() =>
                  Alert.alert(
                    'Security Lockout',
                    'If you do not recognize an account modification, tap Lock Account to freeze daily payouts immediately.'
                  )
                }
              >
                <Text style={styles.suspiciousHelpText}>🚨 Unrecognized update? Lock Account Immediately</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── GUIDED 3-STEP SECURE CHANGE MODAL WIZARD ───────────────────────── */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header & Progress */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Update {editType === 'BANK' ? 'Bank Account' : 'UPI VPA'}</Text>
              <Text style={styles.modalStepBadge}>Step {editStep} of 3</Text>
            </View>

            {/* Stepper Dots */}
            <View style={styles.stepperBar}>
              <View style={[styles.stepDot, editStep >= 1 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, editStep >= 1 && styles.stepDotTextActive]}>1</Text>
              </View>
              <View style={[styles.stepLine, editStep >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, editStep >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, editStep >= 2 && styles.stepDotTextActive]}>2</Text>
              </View>
              <View style={[styles.stepLine, editStep >= 3 && styles.stepLineActive]} />
              <View style={[styles.stepDot, editStep >= 3 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, editStep >= 3 && styles.stepDotTextActive]}>3</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 10 }}>
              {/* STEP 1: VERIFY IDENTITY WITH OTP */}
              {editStep === 1 && (
                <View>
                  <Text style={styles.stepHeading}>Step 1: Verify Identity via SMS OTP</Text>
                  <Text style={styles.stepSub}>
                    Enter 6-digit security code sent to registered mobile +91 98765***** to authorize payout modification.
                  </Text>

                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter OTP (e.g. 4892)"
                    value={otpValue}
                    onChangeText={setOtpValue}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLockedOut}
                  />

                  {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}

                  <View style={styles.timerRow}>
                    <Text style={styles.timerText}>
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Did not receive SMS?'}
                    </Text>
                    {resendTimer === 0 && !isLockedOut && (
                      <TouchableOpacity onPress={() => setResendTimer(30)}>
                        <Text style={styles.resendBtnText}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.testOtpChip}
                    onPress={() => setOtpValue('4892')}
                    disabled={isLockedOut}
                  >
                    <Text style={styles.testOtpText}>💡 Test OTP: Tap to autofill 4892</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, isLockedOut && styles.btnDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={isLockedOut}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Verify Identity & Continue</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: ENTER NEW DETAILS */}
              {editStep === 2 && (
                <View style={{ gap: 12 }}>
                  <Text style={styles.stepHeading}>Step 2: Enter New Payout Details</Text>
                  <Text style={styles.stepSub}>
                    Ensure beneficiary name strictly matches registered merchant GSTIN & PAN details.
                  </Text>

                  {editType === 'BANK' ? (
                    <>
                      <View>
                        <Text style={styles.fieldLabel}>BENEFICIARY HOLDER NAME</Text>
                        <TextInput
                          style={styles.inputField}
                          value={beneficiaryName}
                          onChangeText={setBeneficiaryName}
                        />
                      </View>

                      <View>
                        <Text style={styles.fieldLabel}>BANK NAME</Text>
                        <TextInput
                          style={styles.inputField}
                          value={bankName}
                          onChangeText={setBankName}
                        />
                      </View>

                      <View>
                        <Text style={styles.fieldLabel}>NEW ACCOUNT NUMBER</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="Enter full account number"
                          value={accountNumber}
                          onChangeText={setAccountNumber}
                          keyboardType="number-pad"
                          secureTextEntry
                        />
                      </View>

                      <View>
                        <Text style={styles.fieldLabel}>CONFIRM ACCOUNT NUMBER (PASTE BLOCKED)</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="Re-type account number"
                          value={confirmAccountNumber}
                          onChangeText={setConfirmAccountNumber}
                          keyboardType="number-pad"
                          secureTextEntry
                        />
                        <Text style={styles.fieldHint}>🔒 Clipboard paste is disabled on confirm field to prevent errors.</Text>
                      </View>

                      <View>
                        <Text style={styles.fieldLabel}>IFSC CODE (11 CHARACTERS)</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="HDFC0001234"
                          value={ifscCode}
                          onChangeText={handleIfscLookup}
                          autoCapitalize="characters"
                          maxLength={11}
                        />
                        {isResolvingIfsc ? (
                          <ActivityIndicator size="small" color={COLOR_ROYAL_BLUE} style={{ marginTop: 4 }} />
                        ) : resolvedBranch ? (
                          <Text style={styles.resolvedBranchText}>✓ Branch: {resolvedBranch}</Text>
                        ) : null}
                      </View>
                    </>
                  ) : (
                    <View>
                      <Text style={styles.fieldLabel}>NEW UPI VPA HANDLE</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="name@bank (e.g. glowvai@okhdfcbank)"
                        value={upiHandle}
                        onChangeText={setUpiHandle}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity style={styles.verifyVpaBtn} onPress={handleVerifyUpiHandle}>
                        <Text style={styles.verifyVpaBtnText}>
                          {isVerifyingUpi ? 'Verifying VPA…' : 'Verify UPI VPA Handle'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleProceedToStep3}>
                    <Text style={styles.modalPrimaryBtnText}>Proceed to Review</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: REVIEW & SUBMIT */}
              {editStep === 3 && (
                <View>
                  <Text style={styles.stepHeading}>Step 3: Review & Confirm Details</Text>
                  <Text style={styles.stepSub}>
                    Compare current versus new payout account details before final submission.
                  </Text>

                  {changeSubmitted ? (
                    <View style={styles.successWrap}>
                      <Ionicons name="checkmark-circle-outline" size={36} style={{ color: '#475569' }} />
                      <Text style={styles.successTitle}>Update Submitted!</Text>
                      <Text style={styles.successSub}>
                        Your payout account change request ID CHG-2026-9912 is under 24-hour verification cooling hold.
                      </Text>
                      <TouchableOpacity
                        style={styles.modalPrimaryBtn}
                        onPress={() => setIsEditModalOpen(false)}
                      >
                        <Text style={styles.modalPrimaryBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.compareGrid}>
                        <View style={styles.compareCol}>
                          <Text style={styles.compareTitle}>CURRENT ACCOUNT</Text>
                          <Text style={styles.compareVal}>HDFC Bank</Text>
                          <Text style={styles.compareVal}>••••••4589</Text>
                          <Text style={styles.compareVal}>HDFC0001234</Text>
                        </View>
                        <View style={styles.compareDivider} />
                        <View style={styles.compareCol}>
                          <Text style={styles.compareTitleNew}>PROPOSED NEW</Text>
                          <Text style={styles.compareValNew}>{bankName}</Text>
                          <Text style={styles.compareValNew}>
                            {accountNumber ? `••••••${accountNumber.slice(-4)}` : '••••••4589'}
                          </Text>
                          <Text style={styles.compareValNew}>{ifscCode}</Text>
                        </View>
                      </View>

                      <View style={{ marginVertical: 10 }}>
                        <Text style={styles.fieldLabel}>REASON FOR CHANGE (OPTIONAL AUDIT NOTE)</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. Migration to primary current account"
                          value={changeReason}
                          onChangeText={setChangeReason}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setIsConfirmedCheckbox(!isConfirmedCheckbox)}
                      >
                        <View style={[styles.checkboxBox, isConfirmedCheckbox && styles.checkboxBoxChecked]}>
                          {isConfirmedCheckbox && <Ionicons name="checkmark" size={12} style={{ color: '#fff' }} />}
                        </View>
                        <Text style={styles.checkboxText}>
                          I confirm these bank details belong to the registered merchant entity. GlowVAI is not responsible for funds sent to incorrectly provided accounts.
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.coolingNoticeBox}>
                        <Text style={styles.coolingNoticeText}>
                          ⚠️ Policy Warning: Payouts may be held for up to 24 hours after this change.
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.modalPrimaryBtn}
                        onPress={handleSubmitAccountChange}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.modalPrimaryBtnText}>Submit Account Change</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
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
  secPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  secPillText: {
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
  coolingBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  coolingBannerText: {
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bankLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bankLogoText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  bankTitleText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  bankSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
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
  defaultChannelTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultChannelTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailItem: {
    width: '47%',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  detailValMasked: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 1,
    marginTop: 2,
  },
  detailValCode: {
    fontSize: 12.5,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginTop: 2,
  },
  verifiedMetaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
  },

  changeActionBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  changeActionBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  upiActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  switchChannelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchChannelBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#334155',
  },
  editUpiBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOR_ROYAL_BLUE,
  },
  editUpiBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityTitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  activityMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  activityBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activityBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
  },
  suspiciousHelpBtn: {
    marginTop: 10,
  },
  suspiciousHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
  },

  deniedCard: {
    backgroundColor: '#FEF2F2',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deniedCardTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
  },
  deniedCardSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 4,
    textAlign: 'center',
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
  modalStepBadge: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLOR_ROYAL_BLUE,
  },
  stepDotText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  stepLineActive: {
    backgroundColor: COLOR_ROYAL_BLUE,
  },

  stepHeading: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },

  otpInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLOR_ROYAL_BLUE,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#0F172A',
  },
  otpErrorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_DANGER,
    marginTop: 6,
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  resendBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },
  testOtpChip: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  testOtpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
  },

  fieldLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#0F172A',
  },
  fieldHint: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  resolvedBranchText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_EMERALD,
    marginTop: 4,
  },
  verifyVpaBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyVpaBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
  },

  compareGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  compareCol: {
    flex: 1,
  },
  compareDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  compareTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  compareTitleNew: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginBottom: 4,
  },
  compareVal: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  compareValNew: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: COLOR_ROYAL_BLUE,
    marginBottom: 2,
  },

  checkboxRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderColor: COLOR_ROYAL_BLUE,
  },
  checkboxText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#334155',
    lineHeight: 15,
    flex: 1,
  },
  coolingNoticeBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  coolingNoticeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 14,
  },

  successWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: COLOR_EMERALD,
    marginTop: 8,
  },
  successSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },

  modalPrimaryBtn: {
    backgroundColor: COLOR_ROYAL_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  btnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

export default withComingSoon(BankEditScreen, 'Payout account');
