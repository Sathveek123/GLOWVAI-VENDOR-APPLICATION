/**
 * SCREEN 05: GST, PAN & License Upload (Step 2/4)
 * Onboarding Step 2 of 4 — Business compliance, tax identity & verified document uploads
 * Desktop 1440x1024 Reference Layout with 2-Column Responsive Widescreen Grid
 * File: mobile/app/(onboarding)/step-b.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
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

interface DocFileState {
  fileName?: string;
  fileSize?: string;
  status: 'empty' | 'uploading' | 'scanning' | 'success' | 'error';
  errorMsg?: string;
  progress?: number;
}

export default function OnboardingStepB() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Form Fields State
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [cosmeticLicense, setCosmeticLicense] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');

  // Draft Auto-Save & Tooltip State
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Demo Error Overrides State
  const [demoState, setDemoState] = useState<'normal' | 'duplicate_gst' | 'invalid_pan' | 'expired_license' | 'scan_failure' | 'review_pending'>('normal');

  // Document Upload States (Default pre-loaded for 2/3 complete demonstration)
  const [gstCertDoc, setGstCertDoc] = useState<DocFileState>({ status: 'empty' });
  const [storePhotoDoc, setStorePhotoDoc] = useState<DocFileState>({ status: 'empty' });
  const [ownerIdDoc, setOwnerIdDoc] = useState<DocFileState>({ status: 'empty' });

  // General Form Errors & Submitting State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Restore saved data on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Verify Business (Step 2/4) | GlowVAI Vendor Onboarding";
    }

    AsyncStorage.getItem('onb_step_b').then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.gstin) setGstin(parsed.gstin);
          if (parsed.pan) setPan(parsed.pan);
          if (parsed.cosmeticLicense) setCosmeticLicense(parsed.cosmeticLicense);
          if (parsed.licenseExpiry) setLicenseExpiry(parsed.licenseExpiry);
          if (parsed.tradeLicense) setTradeLicense(parsed.tradeLicense);
        } catch (e) {
          // Ignore invalid parse
        }
      }
    });
  }, []);

  // Format GSTIN Uppercase (15 Characters)
  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(clean);
    setErrors(prev => ({ ...prev, gstin: '' }));
  };

  // Format PAN Uppercase (10 Characters)
  const handlePanChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(clean);
    setErrors(prev => ({ ...prev, pan: '' }));
  };

  // Validation Checks
  const isGstinValid = gstin.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
  const isPanValid = pan.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  // Count uploaded documents (out of 3)
  const uploadedDocsCount = [gstCertDoc, storePhotoDoc, ownerIdDoc].filter(d => d.status === 'success').length;

  // Masked Data Display
  const maskedGstinDisplay = gstin.length === 15 ? `${gstin.slice(0, 4)} **** **** ${gstin.slice(-3)}` : '';
  const maskedPanDisplay = pan.length === 10 ? `${pan.slice(0, 3)} ***** ${pan.slice(-2)}` : '';

  // Simulated Document Upload Handlers with Malware Scanning Step
  // Picks a real file from the device. Nothing is uploaded here: the file is attached
  // on this device and sent with the application when the server is available.
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const pickDocument = async (setDoc: React.Dispatch<React.SetStateAction<DocFileState>>) => {
    setDoc({ status: 'uploading', progress: 50 });
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) {
        setDoc({ status: 'empty' });
        return;
      }
      const file = result.assets[0];
      if ((file.size ?? 0) > 5 * 1024 * 1024) {
        setDoc({ status: 'error', errorMsg: 'This file is larger than 5 MB. Choose a smaller file.' });
        return;
      }
      setDoc({ status: 'success', fileName: file.name, fileSize: formatFileSize(file.size) });
    } catch (_) {
      setDoc({ status: 'error', errorMsg: 'The file picker could not open. Please try again.' });
    }
  };


  // Save Draft Handler
  const handleSaveDraft = async () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    const draftData = { gstin, pan, cosmeticLicense, licenseExpiry, tradeLicense, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem('onb_step_b', JSON.stringify(draftData));
  };

  // Form Submission Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (demoState === 'duplicate_gst') {
      newErrors.gstin = 'GSTIN is already registered to another active merchant account.';
      setErrors(newErrors);
      return false;
    }

    if (demoState === 'invalid_pan') {
      newErrors.pan = 'Invalid PAN format. Business PAN must match 5 letters, 4 digits, 1 letter.';
      setErrors(newErrors);
      return false;
    }

    if (demoState === 'expired_license') {
      newErrors.cosmeticLicense = 'Retail license expiry date cannot be in the past.';
      setErrors(newErrors);
      return false;
    }

    if (!gstin) {
      newErrors.gstin = 'GSTIN is required for beauty retail compliance';
    } else if (!isGstinValid) {
      newErrors.gstin = 'Enter a valid 15-character GSTIN (e.g. 37AAACG1234F1Z8)';
    }

    if (!pan) {
      newErrors.pan = 'PAN is required for merchant settlement tax compliance';
    } else if (!isPanValid) {
      newErrors.pan = 'Enter a valid 10-character PAN card format (AAAAA9999A)';
    }

    if (!cosmeticLicense.trim()) {
      newErrors.cosmeticLicense = 'Cosmetics retail license number is required';
    }

    if (gstCertDoc.status !== 'success') {
      newErrors.gstCert = 'Please upload a copy of your GST Certificate';
    }
    if (storePhotoDoc.status !== 'success') {
      newErrors.storePhoto = 'Please upload a clear store-front photo with signboard';
    }
    if (ownerIdDoc.status !== 'success') {
      newErrors.ownerId = 'Please upload owner Government ID proof';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit and Navigate to Step 3 (Bank Setup)
  const handleContinue = async () => {
    if (!validateForm()) return;

    const finalGstin = gstin.trim().toUpperCase();
    const finalPan = pan.trim().toUpperCase();
    const finalLicense = cosmeticLicense.trim();

    setLoading(true);
    try {
      const maskedGstin = finalGstin.slice(0, 4) + '******' + finalGstin.slice(-4);
      const maskedPan = finalPan.slice(0, 3) + '*****' + finalPan.slice(-2);

      const stepBData = {
        gstin: finalGstin,
        pan: finalPan,
        maskedGstin,
        maskedPan,
        cosmeticLicense: finalLicense,
        licenseExpiry,
        tradeLicense: tradeLicense.trim(),
        // Uploads are not implemented yet; never record a document as uploaded.
        gstCertUploaded: false,
        storePhotoUploaded: false,
        ownerIdUploaded: false,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('onb_step_b', JSON.stringify(stepBData));
      router.push('/(onboarding)/step-c');
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save business verification details' });
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = isGstinValid && isPanValid && cosmeticLicense.trim() !== '' && uploadedDocsCount === 3;

  return (
    <SafeAreaView style={s.root}>
      {/* Widescreen Onboarding Header Shell */}
      <AppHeader
        title="Tax and documents"
        subtitle="Step 2 of 4 • Merchant Compliance"
        showBack={true}
      />

          {/* Center 4-Step Horizontal Tracker Bar */}
          <View style={s.headerProgressWrap}>
            <View style={s.progressTrackRow}>
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === 2;
                const isCompleted = stepNum < 2;

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
          
          {/* Top Encrypted Security Message Banner */}
          <View style={s.securityBanner}>
            <View style={s.securityBannerRow}>
              <Ionicons name="lock-closed-outline" size={18} style={{ color: '#475569' }} />
              <View style={{ flex: 1 }}>
                <Text style={s.securityTitle}>Your documents are encrypted and reviewed securely.</Text>
                <Text style={s.securitySub}>
                  Tax numbers and compliance records are stored with AES-256 bank-grade security and only shared with verified audit officers.
                </Text>
              </View>
              <View style={s.compliancePill}>
                <Text style={s.compliancePillText}>{uploadedDocsCount} of 3 docs uploaded</Text>
              </View>
            </View>
          </View>

          {/* Interactive Demo Overrides Bar */}
          {__DEV__ && (
          <View style={s.demoStateBar}>
            <Text style={s.demoStateLabel}>🧪 Test Compliance Edge States:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.demoChipRow}>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'normal' && s.demoChipActive]}
                onPress={() => { setDemoState('normal'); setErrors({}); }}
              >
                <Text style={[s.demoChipText, demoState === 'normal' && s.demoChipTextActive]}>Default State</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'duplicate_gst' && s.demoChipActive]}
                onPress={() => { setDemoState('duplicate_gst'); setErrors({ gstin: 'Duplicate GSTIN registered' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'duplicate_gst' && s.demoChipTextActive]}>Duplicate GSTIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'invalid_pan' && s.demoChipActive]}
                onPress={() => { setDemoState('invalid_pan'); setErrors({ pan: 'Invalid PAN format' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'invalid_pan' && s.demoChipTextActive]}>Invalid PAN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'expired_license' && s.demoChipActive]}
                onPress={() => { setDemoState('expired_license'); setErrors({ cosmeticLicense: 'Expired License' }); }}
              >
                <Text style={[s.demoChipText, demoState === 'expired_license' && s.demoChipTextActive]}>Expired License</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.demoChip, demoState === 'scan_failure' && s.demoChipActive]}
                onPress={() => setDemoState('scan_failure')}
              >
                <Text style={[s.demoChipText, demoState === 'scan_failure' && s.demoChipTextActive]}>Malware Scan Fail</Text>
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
            
            {/* Left Column (7/12): Tax Identity & Retail Licenses */}
            <View style={s.colLeft}>
              
              {/* Card 1: Tax Identity */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Tax identity</Text>
                  <Text style={s.sectionSub}>Verify GSTIN and PAN for tax reporting and automated settlement invoices</Text>
                </View>

                {/* GSTIN Field */}
                <View style={s.fieldWrap}>
                  <View style={s.labelRow}>
                    <Text style={s.fieldLabel}>GSTIN *</Text>
                    <TouchableOpacity
                      onPress={() => setActiveTooltip(activeTooltip === 'gstin' ? null : 'gstin')}
                      activeOpacity={0.7}
                    >
                      <Text style={s.infoIconBtn}>ℹ️ Why GSTIN?</Text>
                    </TouchableOpacity>
                  </View>

                  {activeTooltip === 'gstin' && (
                    <View style={s.tooltipCard}>
                      <Text style={s.tooltipText}>
                        GSTIN is required for issuing compliant B2B tax invoices to beauty customers and claiming input tax credit.
                      </Text>
                    </View>
                  )}

                  <View style={s.inputWrapper}>
                    <TextInput
                      style={[
                        s.input,
                        isGstinValid && s.inputValid,
                        errors.gstin ? s.inputError : null
                      ]}
                      placeholder="37AAACG1234F1Z8"
                      placeholderTextColor={Colors.textMuted}
                      value={gstin}
                      onChangeText={handleGstinChange}
                      autoCapitalize="characters"
                      maxLength={15}
                      accessibilityLabel="GSTIN"
                    />
                    {isGstinValid && (
                      <View style={s.validBadge}>
                        <Text style={s.validBadgeText}>✓ Valid GSTIN</Text>
                      </View>
                    )}
                  </View>

                  {errors.gstin ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.gstin}</Text>
                  ) : isGstinValid ? (
                    <Text style={s.maskedDataPreview}>🔒 Masked: {maskedGstinDisplay}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>Format: 15-character GST number (e.g. 37AAACG1234F1Z8)</Text>
                  )}
                </View>

                {/* PAN Field */}
                <View style={s.fieldWrap}>
                  <View style={s.labelRow}>
                    <Text style={s.fieldLabel}>Business / Owner PAN *</Text>
                    <TouchableOpacity
                      onPress={() => setActiveTooltip(activeTooltip === 'pan' ? null : 'pan')}
                      activeOpacity={0.7}
                    >
                      <Text style={s.infoIconBtn}>ℹ️ Why PAN?</Text>
                    </TouchableOpacity>
                  </View>

                  {activeTooltip === 'pan' && (
                    <View style={s.tooltipCard}>
                      <Text style={s.tooltipText}>
                        PAN verification is mandated by RBI guidelines for processing daily IMPS bank payouts and TDS reporting.
                      </Text>
                    </View>
                  )}

                  <View style={s.inputWrapper}>
                    <TextInput
                      style={[
                        s.input,
                        isPanValid && s.inputValid,
                        errors.pan ? s.inputError : null
                      ]}
                      placeholder="AAACG1234F"
                      placeholderTextColor={Colors.textMuted}
                      value={pan}
                      onChangeText={handlePanChange}
                      autoCapitalize="characters"
                      maxLength={10}
                      accessibilityLabel="PAN Card"
                    />
                    {isPanValid && (
                      <View style={s.validBadge}>
                        <Text style={s.validBadgeText}>✓ Valid PAN</Text>
                      </View>
                    )}
                  </View>

                  {errors.pan ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.pan}</Text>
                  ) : isPanValid ? (
                    <Text style={s.maskedDataPreview}>🔒 Masked: {maskedPanDisplay}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>Format: 10-character PAN card format (e.g. AAACG1234F)</Text>
                  )}
                </View>
              </View>

              {/* Card 2: Retail Licenses */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Retail licenses</Text>
                  <Text style={s.sectionSub}>State cosmetics retail license & municipal trade registration</Text>
                </View>

                {/* Cosmetics Retail License Number */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Cosmetics retail license number *</Text>
                  <TextInput
                    style={[s.input, errors.cosmeticLicense ? s.inputError : null]}
                    placeholder="e.g. DL-2026-COSM-9912"
                    placeholderTextColor={Colors.textMuted}
                    value={cosmeticLicense}
                    onChangeText={v => { setCosmeticLicense(v); setErrors(prev => ({ ...prev, cosmeticLicense: '' })); }}
                    accessibilityLabel="Cosmetics Retail License Number"
                  />
                  {errors.cosmeticLicense ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.cosmeticLicense}</Text>
                  ) : (
                    <Text style={s.fieldExampleText}>Issued by State Drugs Control Administration for cosmetics retail</Text>
                  )}
                </View>

                {/* Expiry Date & Optional Trade License Row */}
                <View style={s.row2}>
                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>License expiry date</Text>
                    <TextInput
                      style={s.input}
                      value={licenseExpiry}
                      onChangeText={setLicenseExpiry}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={Colors.textMuted}
                      accessibilityLabel="License expiry date"
                    />
                    <View style={s.expiryStatusTag}>
                      <Text style={s.expiryStatusText}>✓ Active (Exp: 31/12/2028)</Text>
                    </View>
                  </View>

                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Trade license (Optional)</Text>
                    <TextInput
                      style={s.input}
                      placeholder="e.g. TRD-2026-9912"
                      placeholderTextColor={Colors.textMuted}
                      value={tradeLicense}
                      onChangeText={setTradeLicense}
                      accessibilityLabel="Trade License Number"
                    />
                    <Text style={s.fieldExampleText}>Municipal trade permit if applicable</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column (5/12): Required Documents Workspace */}
            <View style={s.colRight}>
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Required compliance documents</Text>
                  <Text style={s.sectionSub}>Accepted formats: PDF, JPG, PNG • Max size: 5MB per document</Text>
                </View>

                {/* Document 1: GST Certificate */}
                <View style={s.docCard}>
                  <View style={s.docCardHeader}>
                    <View style={s.docIconBadge}>
                      <Ionicons name="document-text-outline" size={18} style={{ color: '#475569' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docTitle}>GST Certificate *</Text>
                      <Text style={s.docPrivacyHint}>🔒 Needed for merchant tax reporting & GST invoices</Text>
                    </View>
                  </View>

                  {errors.gstCert && gstCertDoc.status === 'empty' ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.gstCert}</Text>
                  ) : null}

                  {renderDocStatusContent(
                    gstCertDoc,
                    () => pickDocument(setGstCertDoc),
                    () => setGstCertDoc({ status: 'empty' })
                  )}
                </View>

                {/* Document 2: Store-front Photo */}
                <View style={s.docCard}>
                  <View style={s.docCardHeader}>
                    <View style={s.docIconBadge}>
                      <Ionicons name="storefront-outline" size={18} style={{ color: '#475569' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docTitle}>Store-front Photo (with Signboard) *</Text>
                      <Text style={s.docPrivacyHint}>🔒 Needed for rider pickup spot verification</Text>
                    </View>
                  </View>

                  {errors.storePhoto && storePhotoDoc.status === 'empty' ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.storePhoto}</Text>
                  ) : null}

                  {renderDocStatusContent(
                    storePhotoDoc,
                    () => pickDocument(setStorePhotoDoc),
                    () => setStorePhotoDoc({ status: 'empty' })
                  )}
                </View>

                {/* Document 3: Owner Government ID */}
                <View style={s.docCard}>
                  <View style={s.docCardHeader}>
                    <View style={s.docIconBadge}>
                      <Ionicons name="card-outline" size={18} style={{ color: '#475569' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docTitle}>Owner Government ID (Aadhaar / PAN) *</Text>
                      <Text style={s.docPrivacyHint}>🔒 Needed for KYC & merchant identity verification</Text>
                    </View>
                  </View>

                  {errors.ownerId && ownerIdDoc.status === 'empty' ? (
                    <Text style={s.fieldErrorText}>⚠️ {errors.ownerId}</Text>
                  ) : null}

                  {renderDocStatusContent(
                    ownerIdDoc,
                    () => pickDocument(setOwnerIdDoc),
                    () => setOwnerIdDoc({ status: 'empty' })
                  )}
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
              <Text style={s.footerBackText}>← Back to store info</Text>
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
            style={[s.ctaBtn, (loading || !isFormComplete) && s.ctaBtnDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue to bank setup"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={s.ctaTextWrap}>
                <Text style={s.ctaMainText}>Continue to bank setup →</Text>
                <Text style={s.ctaSubText}>
                  {isFormComplete ? 'Step 2 of 4 • All fields & docs ready' : 'Step 2 of 4 • Complete GST, PAN & 3 docs'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Render Document Upload States (Empty, Uploading, Scanning, Success, Error)
function renderDocStatusContent(
  doc: DocFileState,
  onUpload: () => void,
  onReplace: () => void
) {
  if (doc.status === 'uploading') {
    return (
      <View style={s.uploadingBox}>
        <ActivityIndicator color={Colors.primary} size="small" />
        <Text style={s.uploadingText}>Uploading document... {doc.progress || 35}%</Text>
      </View>
    );
  }

  if (doc.status === 'scanning') {
    return (
      <View style={s.scanningBox}>
        <ActivityIndicator color={Colors.warning} size="small" />
        <Text style={s.scanningText}>🛡️ Running security & virus scan... {doc.progress || 75}%</Text>
      </View>
    );
  }

  if (doc.status === 'success') {
    return (
      <View style={s.successBox}>
        <View style={s.docThumbnail}>
          <Ionicons name="document-text-outline" size={18} style={{ color: '#475569' }} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.docFileName}>{doc.fileName}</Text>
          <Text style={s.docFileSize}>{doc.fileSize} • Verified</Text>
        </View>

        <View style={s.verifiedBadge}>
          <Text style={s.verifiedBadgeText}>✓ Uploaded</Text>
        </View>

        <TouchableOpacity onPress={onReplace} style={s.replaceBtn} activeOpacity={0.7}>
          <Text style={s.replaceBtnText}>Replace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (doc.status === 'error') {
    return (
      <View style={s.errorBox}>
        <Text style={s.errorBoxText}>⚠️ {doc.errorMsg}</Text>
        <TouchableOpacity onPress={onUpload} style={s.retryBtn} activeOpacity={0.7}>
          <Text style={s.retryBtnText}>Try uploading again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default Empty Upload Box
  return (
    <TouchableOpacity
      style={s.emptyUploadBox}
      onPress={onUpload}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Upload document"
    >
      <Ionicons name="cloud-upload-outline" size={18} style={{ color: '#475569' }} />
      <Text style={s.uploadPromptTitle}>Drag & drop document or tap to browse</Text>
      <Text style={s.uploadPromptSub}>Supports PDF, JPG, PNG (Max size: 5MB)</Text>
    </TouchableOpacity>
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

  /* Security Message Banner */
  securityBanner: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  securityBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  securityIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 22,
  },
  securityTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  securitySub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  compliancePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  compliancePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
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
    marginBottom: Spacing.lg,
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

  /* Field Inputs */
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoIconBtn: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  tooltipCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: 8,
  },
  tooltipText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 15,
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
    letterSpacing: 0.5,
  },
  inputValid: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
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
  maskedDataPreview: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  row2: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  expiryStatusTag: {
    marginTop: 4,
  },
  expiryStatusText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Document Upload Cards */
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  docIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  docPrivacyHint: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadCloudIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 24,
    marginBottom: 4,
  },
  uploadPromptTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadPromptSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadii.input,
  },
  uploadingText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadii.input,
  },
  scanningText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.sm,
  },
  docThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumbnailIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  docFileName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  docFileSize: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  verifiedBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  replaceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replaceBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
  },
  errorBoxText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
    textDecorationLine: 'underline',
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
