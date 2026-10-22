/**
 * SCREEN 06: Bank Account & UPI Setup (Step 3/4)
 * Desktop 1440x1024 Reference Layout with 2-Column Responsive Widescreen Grid (1200px max-width)
 * File: mobile/app/(onboarding)/step-c.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import AppHeader from '../../src/components/AppHeader';

const STEP_LABELS = ['Store', 'Documents', 'Bank', 'Catalog'];

const POPULAR_BANKS = [
  { name: 'HDFC Bank', code: 'HDFC', logo: '🏦' },
  { name: 'ICICI Bank', code: 'ICIC', logo: '🏦' },
  { name: 'State Bank of India', code: 'SBIN', logo: '🏛️' },
  { name: 'Axis Bank', code: 'UTIB', logo: '🏦' },
  { name: 'Kotak Mahindra', code: 'KOKO', logo: '🏦' },
];

export default function OnboardingStepC() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Selected Bank & Form State
  const [selectedBank, setSelectedBank] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [confirmAccNumber, setConfirmAccNumber] = useState('');
  const [showAccNumber, setShowAccNumber] = useState(false);
  const [ifsc, setIfsc] = useState('');
  const [ifscStatus, setIfscStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [branchInfo, setBranchInfo] = useState('');
  const [lookupTime, setLookupTime] = useState('');

  // UPI State
  const [upiVpa, setUpiVpa] = useState('');
  const [upiStatus, setUpiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [upiStatusMsg, setUpiStatusMsg] = useState('');

  // Draft Auto-Save & Tooltips State
  const [lastSavedTime, setLastSavedTime] = useState('10:30 PM');
  const [showPayoutInfoModal, setShowPayoutInfoModal] = useState(false);
  const [demoState, setDemoState] = useState<'normal' | 'api_timeout' | 'offline' | 'upi_failed' | 'duplicate_acc' | 'session_expired'>('normal');

  // Modals & Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Restore saved state on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Set Up Payouts (Step 3/4) | GlowVAI Vendor Onboarding";
    }

    AsyncStorage.getItem('onb_step_c').then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.selectedBank) setSelectedBank(parsed.selectedBank);
          if (parsed.beneficiaryName) setBeneficiaryName(parsed.beneficiaryName);
          if (parsed.ifsc) {
            setIfsc(parsed.ifsc);
            setIfscStatus('success');
          }
          if (parsed.upiVpa) {
            setUpiVpa(parsed.upiVpa);
            setUpiStatus('success');
          }
        } catch (e) {
          // Ignore invalid parse
        }
      }
    });
  }, []);

  // Bank Selection Handler
  const handleSelectBank = (bankName: string, bankCode: string) => {
    setSelectedBank(bankName);
    const mockIfsc = `${bankCode}0001234`;
    setIfsc(mockIfsc);
    resolveIfsc(mockIfsc, bankName);
  };

  // IFSC Resolution Handler
  const resolveIfsc = (val: string, targetBank?: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfsc(clean);
    setErrors(prev => ({ ...prev, ifsc: '' }));

    if (clean.length < 11) {
      setIfscStatus('idle');
      setBranchInfo('');
      return;
    }

    setIfscStatus('loading');

    setTimeout(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLookupTime(timeStr);

      if (clean.startsWith('HDFC')) {
        setBranchInfo('HDFC Bank, Benz Circle Branch, Vijayawada');
        setIfscStatus('success');
      } else if (clean.startsWith('ICIC')) {
        setBranchInfo('ICICI Bank, MG Road Branch, Vijayawada');
        setIfscStatus('success');
      } else if (clean.startsWith('SBIN')) {
        setBranchInfo('State Bank of India, Governorpet Branch, Vijayawada');
        setIfscStatus('success');
      } else if (clean.startsWith('UTIB')) {
        setBranchInfo('Axis Bank, Auto Nagar Branch, Vijayawada');
        setIfscStatus('success');
      } else if (clean.startsWith('KOKO')) {
        setBranchInfo('Kotak Mahindra Bank, Eluru Road Branch, Vijayawada');
        setIfscStatus('success');
      } else if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
        setBranchInfo(`${targetBank || selectedBank}, Main Branch, Vijayawada`);
        setIfscStatus('success');
      } else {
        setIfscStatus('error');
        setBranchInfo('');
        setErrors(prev => ({ ...prev, ifsc: 'Invalid IFSC code format. Example: HDFC0001234' }));
      }
    }, 500);
  };

  // UPI VPA Verification Handler
  const handleVerifyUpi = () => {
    if (!upiVpa.trim() || !upiVpa.includes('@')) {
      setUpiStatus('error');
      setUpiStatusMsg('Enter a valid UPI handle (e.g. glowstore@hdfcbank)');
      return;
    }

    setUpiStatus('loading');
    setUpiStatusMsg('');

    setTimeout(() => {
      if (upiVpa.toLowerCase().includes('duplicate') || demoState === 'upi_failed') {
        setUpiStatus('error');
        setUpiStatusMsg('This UPI handle verification failed or is registered to another merchant account.');
      } else {
        setUpiStatus('success');
        setUpiStatusMsg(`✓ Verified VPA (${beneficiaryName || 'Sri Lakshmi Cosmetics'})`);
      }
    }, 600);
  };

  // Confirm Account Input Change Handler
  const handleConfirmAccountChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setConfirmAccNumber(clean);
    setErrors(prev => ({ ...prev, confirmAcc: '' }));
  };

  // Mask Account Number Display
  const getMaskedAccountDisplay = (rawNum: string) => {
    if (!rawNum) return '';
    if (showAccNumber) return rawNum;
    if (rawNum.length <= 4) return rawNum;
    const last4 = rawNum.slice(-4);
    const maskedPrefix = '•••• '.repeat(Math.max(1, Math.floor((rawNum.length - 4) / 4)));
    return `${maskedPrefix}${last4}`;
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    const draftData = { selectedBank, beneficiaryName, ifsc, upiVpa, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem('onb_step_c', JSON.stringify(draftData));
  };

  // Validation Checks
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (demoState === 'api_timeout') {
      newErrors.form = 'Settlement banking gateway timeout. Please retry in a few moments.';
      setErrors(newErrors);
      return false;
    }
    if (demoState === 'offline') {
      newErrors.form = 'Network connection offline. Unable to verify bank details with NPCI gateway.';
      setErrors(newErrors);
      return false;
    }
    if (demoState === 'duplicate_acc') {
      newErrors.accNumber = 'This bank account number is already linked to another registered merchant.';
      setErrors(newErrors);
      return false;
    }
    if (demoState === 'session_expired') {
      newErrors.form = 'Session expired due to inactivity. Please re-authenticate your mobile session.';
      setErrors(newErrors);
      return false;
    }

    if (!beneficiaryName.trim()) {
      newErrors.beneficiaryName = 'Beneficiary name as per bank record is required';
    }

    if (!accNumber.trim() || accNumber.length < 9) {
      newErrors.accNumber = 'Enter a valid bank account number (9 to 18 digits)';
    }

    if (accNumber !== confirmAccNumber) {
      newErrors.confirmAcc = 'Account numbers do not match. Please re-type carefully.';
    }

    if (!ifsc || ifsc.length !== 11 || ifscStatus === 'error') {
      newErrors.ifsc = 'Valid 11-character IFSC code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit and Save Step 3 Data
  const handleContinue = async () => {
    if (!validateForm()) return;

    const finalName = beneficiaryName.trim();
    const finalAcc = accNumber.trim();
    const finalIfsc = ifsc.toUpperCase();
    const finalUpi = upiVpa.trim();

    setLoading(true);
    try {
      const maskedAccStorage = finalAcc.length > 4 ? `XXXXXX${finalAcc.slice(-4)}` : 'XXXXXX4589';

      const stepCData = {
        selectedBank,
        beneficiaryName: finalName,
        maskedAccountNumber: maskedAccStorage,
        ifsc: finalIfsc,
        branchInfo,
        upiVpa: finalUpi,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('onb_step_c', JSON.stringify(stepCData));
      router.push('/(onboarding)/step-d');
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save payout account details' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = beneficiaryName.trim() !== '' && accNumber.length >= 9 && accNumber === confirmAccNumber && ifscStatus === 'success';

  return (
    <SafeAreaView style={s.root}>
      {/* Widescreen Onboarding Header Shell */}
      <AppHeader
        title="Bank account"
        subtitle="Step 3 of 4 • Payout Verification"
        showBack={true}
      />

          {/* Center 4-Step Horizontal Tracker Bar */}
          <View style={s.headerProgressWrap}>
            <View style={s.progressTrackRow}>
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === 3;
                const isCompleted = stepNum < 3;

                return (
                  <React.Fragment key={label}>
                    <View style={s.trackerStepItem}>
                      <View style={[
                        s.trackerCircle,
                        isCompleted && s.trackerCircleCompleted,
                        isActive && s.trackerCircleActive,
                      ]}>
                        <Text style={[
                          s.trackerCircleText,
                          (isCompleted || isActive) && s.trackerCircleTextActive,
                        ]}>
                          {isCompleted ? '✓' : stepNum}
                        </Text>
                      </View>
                      <Text style={[
                        s.trackerStepLabel,
                        isActive && s.trackerStepLabelActive,
                        isCompleted && s.trackerStepLabelCompleted,
                      ]}>
                        {label}
                      </Text>
                    </View>
                    {idx < STEP_LABELS.length - 1 && (
                      <View style={[s.trackerLine, isCompleted && s.trackerLineCompleted]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Right Draft Status & Help Link */}
          <View style={s.headerMetaRight}>
            {lastSavedTime ? (
              <View style={s.draftBadge}>
                <Text style={s.draftBadgeText}>✓ Draft saved at {lastSavedTime}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={s.supportLink} activeOpacity={0.7}>
              <Text style={s.supportLinkText}>Need help?</Text>
            </TouchableOpacity>
          </View>

      {/* Main Body Layout */}
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.maxContainer, isExpanded && s.maxContainerExpanded]}>
          
          {/* Reassurance Banner */}
          <View style={s.reassuranceCard}>
            <Text style={s.reassuranceText}>
              🏦 Set up payouts: Sales are settled directly into your verified bank account via NPCI IMPS.
            </Text>
          </View>

          {/* Interactive Demo Overrides Bar */}
          {__DEV__ && (
          <View style={s.demoStateBar}>
            <Text style={s.demoStateLabel}>🧪 Test Settlement Edge States:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.demoChipRow}>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'normal' && s.demoChipActive]}
                onPress={() => { setDemoState('normal'); setErrors({}); }}
              >
                <Text style={[s.demoChipText, demoState === 'normal' && s.demoChipTextActive]}>Default Verified</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'api_timeout' && s.demoChipActive]}
                onPress={() => { setDemoState('api_timeout'); setErrors({ form: 'Gateway Timeout' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'api_timeout' && s.demoChipTextActive]}>API Timeout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'offline' && s.demoChipActive]}
                onPress={() => { setDemoState('offline'); setErrors({ form: 'Offline Mode' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'offline' && s.demoChipTextActive]}>Offline Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'duplicate_acc' && s.demoChipActive]}
                onPress={() => { setDemoState('duplicate_acc'); setErrors({ accNumber: 'Duplicate Account' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'duplicate_acc' && s.demoChipTextActive]}>Duplicate Bank Acc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'upi_failed' && s.demoChipActive]}
                onPress={() => setDemoState('upi_failed')}
              >
                <Text style={[s.demoChipText, demoState === 'upi_failed' && s.demoChipTextActive]}>UPI Fail</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          )}

          {/* Form Error Banner */}
          {errors.form ? (
            <View style={s.errorCard}>
              <Text style={s.errorCardText}>⚠️ {errors.form}</Text>
            </View>
          ) : null}

          {/* 2-Column Responsive Widescreen Grid */}
          <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>
            
            {/* Left Column (7/12): Bank Form & Popular Selector */}
            <View style={s.colLeft}>
              
              {/* Card 1: Bank Account Details */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Bank account details</Text>
                  <Text style={s.sectionSub}>Select your bank and enter account details for automated transfers</Text>
                </View>

                {/* Popular Banks Chip Bar */}
                <View style={s.bankSelectorRow}>
                  <Text style={s.bankSelectorLabel}>Popular Banks:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bankChipList}>
                    {POPULAR_BANKS.map(b => {
                      const isSelected = selectedBank === b.name;
                      return (
                        <TouchableOpacity
                          key={b.name}
                          style={[s.bankChip, isSelected && s.bankChipSelected]}
                          onPress={() => handleSelectBank(b.name, b.code)}
                          activeOpacity={0.75}
                        >
                          <Text style={s.bankChipIcon}>{b.logo}</Text>
                          <Text style={[s.bankChipText, isSelected && s.bankChipTextSelected]}>
                            {b.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Beneficiary Name */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Beneficiary name *</Text>
                  <TextInput
                    style={[s.input, errors.beneficiaryName ? s.inputError : null]}
                    placeholder="Name as per Bank Passbook / PAN"
                    placeholderTextColor={Colors.textMuted}
                    value={beneficiaryName}
                    onChangeText={v => { setBeneficiaryName(v); setErrors(prev => ({ ...prev, beneficiaryName: '' })); }}
                    accessibilityLabel="Beneficiary name"
                  />
                  {errors.beneficiaryName ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.beneficiaryName}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>Must match registered business or owner name on tax records</Text>
                  )}
                </View>

                {/* Account Number (Masked) */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Account number *</Text>
                  <View style={s.inputWrapper}>
                    <TextInput
                      style={[s.input, errors.accNumber ? s.inputError : null]}
                      placeholder="Enter bank account number"
                      placeholderTextColor={Colors.textMuted}
                      value={accNumber}
                      onChangeText={v => { setAccNumber(v.replace(/\D/g, '')); setErrors(prev => ({ ...prev, accNumber: '' })); }}
                      keyboardType="number-pad"
                      secureTextEntry={!showAccNumber}
                      accessibilityLabel="Account number"
                    />
                    <TouchableOpacity
                      style={s.toggleEyeBtn}
                      onPress={() => setShowAccNumber(!showAccNumber)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.toggleEyeText}>{showAccNumber ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>

                  {errors.accNumber ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.accNumber}</Text>
                  ) : accNumber !== '' ? (
                    <Text style={s.maskedPreviewText}>🔒 Masked: {getMaskedAccountDisplay(accNumber)}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>Account numbers are masked by default for privacy</Text>
                  )}
                </View>

                {/* Confirm Account Number */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Confirm account number *</Text>
                  <View style={s.inputWrapper}>
                    <TextInput
                      style={[
                        s.input,
                        accNumber !== '' && confirmAccNumber === accNumber && s.inputValid,
                        errors.confirmAcc ? s.inputError : null
                      ]}
                      placeholder="Re-enter account number to confirm"
                      placeholderTextColor={Colors.textMuted}
                      value={confirmAccNumber}
                      onChangeText={handleConfirmAccountChange}
                      keyboardType="number-pad"
                      secureTextEntry={!showAccNumber}
                      accessibilityLabel="Confirm account number"
                    />
                    {accNumber !== '' && confirmAccNumber === accNumber && (
                      <View style={s.validBadge}>
                        <Text style={s.validBadgeText}>✓ Matches</Text>
                      </View>
                    )}
                  </View>

                  {errors.confirmAcc ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.confirmAcc}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>🔒 Please type manually to prevent typo transfers. Paste is disabled for safety.</Text>
                  )}
                </View>

                {/* IFSC Code & Compact Branch Resolution */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>IFSC code (11 Characters) *</Text>
                  <View style={s.inputWrapper}>
                    <TextInput
                      style={[
                        s.input,
                        ifscStatus === 'success' && s.inputValid,
                        errors.ifsc ? s.inputError : null
                      ]}
                      placeholder="e.g. HDFC0001234"
                      placeholderTextColor={Colors.textMuted}
                      value={ifsc}
                      onChangeText={v => resolveIfsc(v)}
                      autoCapitalize="characters"
                      maxLength={11}
                      accessibilityLabel="IFSC Code"
                    />
                    {ifscStatus === 'loading' && (
                      <View style={s.validBadgeLoading}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                      </View>
                    )}
                  </View>

                  {errors.ifsc ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.ifsc}</Text>
                  ) : ifscStatus === 'success' ? (
                    <View style={s.branchSuccessBox}>
                      <View style={s.branchSuccessHeader}>
                        <Text style={s.branchSuccessText}>✓ Verified Branch: {branchInfo}</Text>
                        <TouchableOpacity onPress={() => resolveIfsc(ifsc)} activeOpacity={0.7}>
                          <Text style={s.branchEditLink}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={s.lookupTimeText}>NPCI Branch Lookup verified at {lookupTime}</Text>
                    </View>
                  ) : (
                    <Text style={s.fieldExampleText}>11-character bank branch code (e.g. HDFC0001234)</Text>
                  )}
                </View>
              </View>

              {/* Card 2: UPI Settlement Handle (Optional) */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>UPI settlement handle (Optional)</Text>
                  <Text style={s.sectionSub}>Enable instant express settlements via UPI VPA handle</Text>
                </View>

                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>UPI VPA / Handle</Text>
                  <View style={s.upiRow}>
                    <TextInput
                      style={[
                        s.input,
                        { flex: 1 },
                        upiStatus === 'success' && s.inputValid,
                        upiStatus === 'error' && s.inputError
                      ]}
                      placeholder="e.g. srilakshmi@hdfcbank"
                      placeholderTextColor={Colors.textMuted}
                      value={upiVpa}
                      onChangeText={v => { setUpiVpa(v); setUpiStatus('idle'); setUpiStatusMsg(''); }}
                      autoCapitalize="none"
                      accessibilityLabel="UPI Handle VPA"
                    />

                    <TouchableOpacity
                      style={[s.verifyUpiBtn, upiStatus === 'loading' && s.verifyUpiBtnDisabled]}
                      onPress={handleVerifyUpi}
                      disabled={upiStatus === 'loading'}
                      activeOpacity={0.8}
                    >
                      {upiStatus === 'loading' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={s.verifyUpiBtnText}>Verify handle</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {upiStatusMsg !== '' && (
                    <Text style={[
                      s.fieldExampleText,
                      upiStatus === 'success' && s.upiSuccessText,
                      upiStatus === 'error' && s.upiErrorText
                    ]}>
                      {upiStatusMsg}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Right Column (5/12): Payout Schedule & Security */}
            <View style={s.colRight}>
              
              {/* Card 1: Payout Schedule Info Card */}
              <View style={s.payoutInfoCard}>
                <View style={s.payoutInfoRow}>
                  <Ionicons name="flash-outline" size={18} style={{ color: '#475569' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.payoutInfoTitle}>Daily settlement target: 06:00 AM, T+1</Text>
                    <Text style={s.payoutInfoSub}>
                      Delivered customer orders are calculated overnight and credited directly to your bank account via NPCI IMPS every morning.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.howPayoutsWorkBtn}
                  onPress={() => setShowPayoutInfoModal(!showPayoutInfoModal)}
                  activeOpacity={0.7}
                >
                  <Text style={s.howPayoutsWorkText}>
                    {showPayoutInfoModal ? 'Hide settlement timing details ▲' : 'How settlements & refunds work ▼'}
                  </Text>
                </TouchableOpacity>

                {showPayoutInfoModal && (
                  <View style={s.payoutDetailsDrawer}>
                    <Text style={s.drawerText}>• T+1 automated daily settlement cycle</Text>
                    <Text style={s.drawerText}>• Zero manual withdrawal fee or transfer charges</Text>
                    <Text style={s.drawerText}>• Returns & refunds adjusted before morning payout</Text>
                  </View>
                )}
              </View>

              {/* Card 2: Security & Protection Card */}
              <View style={s.payoutInfoCard}>
                <View style={s.payoutInfoRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} style={{ color: '#475569' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.payoutInfoTitle}>Your payout details are protected</Text>
                    <Text style={s.payoutInfoSub}>
                      Bank credentials are encrypted with 256-bit encryption. Account numbers are never shared publicly or exposed in API payloads.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={s.securityPolicyLink} activeOpacity={0.7}>
                  <Text style={s.securityPolicyText}>View Payout Security Policy ↗</Text>
                </TouchableOpacity>
              </View>

              {/* Card 3: Real-Time Pre-Submission Checklist */}
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Review before submitting</Text>
                <View style={s.checklistList}>
                  <View style={s.checkItem}>
                    <Text style={isFormValid ? s.checkItemIconValid : s.checkItemIcon}>
                      {beneficiaryName ? '✓' : '○'}
                    </Text>
                    <Text style={s.checkItemText}>Beneficiary name entered</Text>
                  </View>
                  <View style={s.checkItem}>
                    <Text style={isFormValid ? s.checkItemIconValid : s.checkItemIcon}>
                      {accNumber && accNumber === confirmAccNumber ? '✓' : '○'}
                    </Text>
                    <Text style={s.checkItemText}>Account numbers typed & matched</Text>
                  </View>
                  <View style={s.checkItem}>
                    <Text style={ifscStatus === 'success' ? s.checkItemIconValid : s.checkItemIcon}>
                      {ifscStatus === 'success' ? '✓' : '○'}
                    </Text>
                    <Text style={s.checkItemText}>IFSC branch resolved</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={s.stickyFooter}>
        <View style={s.footerContainer}>
          <View style={s.footerLeftRow}>
            <TouchableOpacity
              style={s.footerBackBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={s.footerBackText}>← Back to documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.saveDraftBtn}
              onPress={handleSaveDraft}
              activeOpacity={0.7}
            >
              <Text style={s.saveDraftText}>💾 Save draft</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.ctaBtn, (loading || !isFormValid) && s.ctaBtnDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue to catalog setup"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={s.ctaTextWrap}>
                <Text style={s.ctaMainText}>Continue to catalog setup →</Text>
                <Text style={s.ctaSubText}>
                  {isFormValid ? 'Step 3 of 4 • Bank account verified' : 'Step 3 of 4 • Fill required bank fields'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  
  /* Desktop Header Shell */
  desktopHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  brandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* 4-Step Horizontal Progress Tracker */
  headerProgressWrap: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  progressTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackerStepItem: {
    alignItems: 'center',
    gap: 4,
  },
  trackerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  trackerCircleCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  trackerCircleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  trackerCircleTextActive: {
    color: '#FFFFFF',
  },
  trackerStepLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  trackerStepLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  trackerStepLabelCompleted: {
    color: Colors.primary,
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
    marginTop: -14,
  },
  trackerLineCompleted: {
    backgroundColor: Colors.primary,
  },

  headerMetaRight: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  draftBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  draftBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  supportLink: {
    paddingVertical: 4,
  },
  supportLinkText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  maxContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  maxContainerExpanded: {
    maxWidth: 1200,
  },

  /* Reassurance Card */
  reassuranceCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reassuranceText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Demo State Switcher Bar */
  demoStateBar: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.card,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  demoStateLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  demoChipRow: {
    gap: 6,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  demoChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  demoChipTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Error Banner */
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorCardText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Grid Columns */
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridRowExpanded: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 7,
  },
  colRight: {
    flex: 5,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Popular Bank Selector */
  bankSelectorRow: {
    marginBottom: Spacing.lg,
  },
  bankSelectorLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  bankChipList: {
    gap: Spacing.xs,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.pill,
  },
  bankChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  bankChipIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  bankChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bankChipTextSelected: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Field Inputs */
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  inputValid: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  toggleEyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  toggleEyeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  validBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  validBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  validBadgeLoading: {
    position: 'absolute',
    right: 14,
  },
  branchSuccessBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginTop: 6,
  },
  branchSuccessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchSuccessText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  branchEditLink: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  lookupTimeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  fieldExampleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  maskedPreviewText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },

  /* UPI Row & Action */
  upiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  verifyUpiBtn: {
    height: 48,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyUpiBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  verifyUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  upiSuccessText: {
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  upiErrorText: {
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Payout Information Cards */
  payoutInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  payoutInfoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  payoutInfoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  payoutInfoTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payoutInfoSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  howPayoutsWorkBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  howPayoutsWorkText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  securityPolicyLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  securityPolicyText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  payoutDetailsDrawer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  drawerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* Pre-submission Checklist */
  checklistList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkItemIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  checkItemIconValid: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  checkItemText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Persistent Bottom Action Bar */
  stickyFooter: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  footerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  footerBackText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveDraftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primaryLight,
  },
  saveDraftText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  ctaBtn: {
    height: 52,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary, // Royal Blue
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaTextWrap: {
    alignItems: 'center',
  },
  ctaMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  ctaSubText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});
