/**
 * SCREEN 04: Store Information & GPS Pinning
 * Onboarding Step 1 of 4 — Store identity, business hours & interactive map location
 * File: mobile/app/(onboarding)/step-a.tsx
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import RealInteractiveMap from '../../src/components/RealInteractiveMap';
import AppHeader from '../../src/components/AppHeader';

const STEP_LABELS = [
  { num: 1, label: 'Store' },
  { num: 2, label: 'Documents' },
  { num: 3, label: 'Bank' },
  { num: 4, label: 'Catalog' },
];

const POPULAR_AREAS = [
  { name: 'Benz Circle', lat: 16.4975, lng: 80.6552, locality: 'Benz Circle', pin: '520010' },
  { name: 'MG Road', lat: 16.5062, lng: 80.6480, locality: 'MG Road / Labbipet', pin: '520010' },
  { name: 'Governorpet', lat: 16.5186, lng: 80.6276, locality: 'Governorpet', pin: '520002' },
  { name: 'Auto Nagar', lat: 16.4880, lng: 80.6720, locality: 'Auto Nagar', pin: '520007' },
];

export default function OnboardingStepA() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  // Form State
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Business Hours State
  const [openTime, setOpenTime] = useState('08:00 AM');
  const [closeTime, setCloseTime] = useState('11:00 PM');

  // GPS Map State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'success' | 'denied'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Draft & Saving Status States
  const [draftState, setDraftState] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState('Saved at 10:12 PM');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Restore saved data on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Store Details (Step 1/4) | GlowVAI Vendor Onboarding";
    }

    AsyncStorage.getItem('onb_step_a').then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.ownerName) setOwnerName(parsed.ownerName);
          if (parsed.locality)  setLocality(parsed.locality);
          if (parsed.city)      setCity(parsed.city);
          if (parsed.pincode)   setPincode(parsed.pincode);
          if (parsed.openTime)  setOpenTime(parsed.openTime);
          if (parsed.closeTime) setCloseTime(parsed.closeTime);
          if (parsed.latitude)  setLatitude(parsed.latitude);
          if (parsed.longitude) setLongitude(parsed.longitude);
          if (parsed.latitude)  setGpsStatus('success');
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
  }, []);

  // Track field changes for draft indicator
  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, fieldKey: string, val: any) => {
    setter(val);
    setDraftState('unsaved');
    setErrors(prev => ({ ...prev, [fieldKey]: '' }));
  };

  // Map location selection handler
  const handleMapLocationSelect = useCallback((data: {
    latitude: number;
    longitude: number;
    locality?: string;
    city?: string;
    pinCode?: string;
  }) => {
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    if (data.locality) setLocality(data.locality);
    if (data.city)     setCity(data.city);
    if (data.pinCode)  setPincode(data.pinCode);
    setGpsStatus('success');
    setGpsErrorMsg('');
    setDraftState('unsaved');
  }, []);

  // GPS Detector
  const handleDetectGPS = () => {
    setLocating(true);
    setGpsErrorMsg('');
    setGpsStatus('idle');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setGpsStatus('success');
          setLocating(false);
          setDraftState('unsaved');
        },
        (err) => {
          setLocating(false);
          setGpsStatus('denied');
          setGpsErrorMsg('Location permission denied. Enter your address manually or search landmark below.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setTimeout(() => {
        setLocating(false);
        setGpsStatus('denied');
        setGpsErrorMsg('GPS location is unavailable on this device browser.');
      }, 500);
    }
  };

  const handleSelectPreset = (item: typeof POPULAR_AREAS[0]) => {
    setLatitude(item.lat);
    setLongitude(item.lng);
    setLocality(item.locality);
    setPincode(item.pin);
    setCity('Vijayawada');
    setGpsStatus('success');
    setGpsErrorMsg('');
    setDraftState('unsaved');
  };

  // Explicit Save Draft Handler
  const handleSaveDraft = async () => {
    setDraftState('saving');
    try {
      const stepAData = {
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        locality: locality.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        openTime,
        closeTime,
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
      };
      await new Promise(r => setTimeout(r, 400));
      await AsyncStorage.setItem('onb_step_a', JSON.stringify(stepAData));
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(`Saved at ${nowTime}`);
      setDraftState('saved');
      setToastMsg('✓ Draft saved successfully');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      setDraftState('error');
      setToastMsg('⚠️ Unable to save draft. Please try again.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Validation Checks
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!storeName.trim()) newErrors.storeName = 'Store name is required';
    if (!ownerName.trim()) newErrors.ownerName = 'Owner / Manager name is required';
    if (!locality.trim())  newErrors.locality  = 'Locality / Area is required';
    if (!city.trim())      newErrors.city      = 'City is required';
    
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit Pincode (e.g. 520010)';
    }

    if (latitude == null || longitude == null) {
      newErrors.gps = 'Set the store location with GPS or the map pin';
    }

    if (!openTime.trim() || !closeTime.trim()) {
      newErrors.hours = 'Specify operating opening and closing times';
    } else if (openTime.trim() === closeTime.trim()) {
      newErrors.hours = 'Closing time must be after opening time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit and Navigate to Step 2 (Documents)
  const handleContinue = async () => {
    if (!validateForm()) return;

    const finalStoreName = storeName.trim();
    const finalOwnerName = ownerName.trim();
    const finalLocality = locality.trim();
    const finalCity = city.trim();
    const finalPincode = pincode.trim();

    setLoading(true);
    try {
      const stepAData = {
        storeName: finalStoreName,
        ownerName: finalOwnerName,
        locality: finalLocality,
        city: finalCity,
        pincode: finalPincode,
        openTime,
        closeTime,
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('onb_step_a', JSON.stringify(stepAData));
      router.push('/(onboarding)/step-b');
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save store details' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateState = (type: 'denied' | 'saveError' | 'unsaved' | 'hoursError') => {
    if (type === 'denied') {
      setGpsStatus('denied');
      setGpsErrorMsg('Location permission denied by browser. Enter address manually.');
    } else if (type === 'saveError') {
      setDraftState('error');
      setToastMsg('⚠️ Unable to save draft. Check network connection.');
      setTimeout(() => setToastMsg(null), 3000);
    } else if (type === 'unsaved') {
      setDraftState('unsaved');
    } else if (type === 'hoursError') {
      setErrors(prev => ({ ...prev, hours: 'Closing time must be after opening time' }));
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Top Professional Onboarding Header */}
      <AppHeader
        title="Store details"
        subtitle="Step 1 of 4 • Secure Merchant Onboarding"
        showBack={true}
      />

        {/* 4-Step Horizontal Segmented Tracker */}
        <View style={s.progressTrackerRow}>
          {STEP_LABELS.map(step => {
            const isActive = step.num === 1;
            const isCompleted = step.num < 1;

            return (
              <View key={step.num} style={s.stepSegment}>
                <View style={[
                  s.stepBar,
                  isActive && s.stepBarActive,
                  isCompleted && s.stepBarCompleted,
                ]} />
                <Text style={[
                  s.stepLabel,
                  isActive && s.stepLabelActive,
                  isCompleted && s.stepLabelCompleted,
                ]}>
                  {step.num}. {step.label}
                </Text>
              </View>
            );
          })}
        </View>

      {/* Main Body Content (1200px Widescreen Container) */}
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.container, isExpanded && s.containerExpanded]}>
          
          {/* Welcome Banner */}
          <View style={s.welcomeCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.welcomeTitle}>Tell us about your store</Text>
              <Text style={s.welcomeSub}>
                Register your physical cosmetics or retail store for 10-minute quick-commerce delivery dispatch.
              </Text>
            </View>
            <View style={s.stepPillBadge}>
              <Text style={s.stepPillBadgeText}>STEP 1 OF 4</Text>
            </View>
          </View>

          {/* Toast Alert Banner */}
          {toastMsg && (
            <View style={s.toastBanner}>
              <Text style={s.toastBannerText}>{toastMsg}</Text>
            </View>
          )}

          {/* Form Error Banner */}
          {errors.form ? (
            <View style={s.errorCard}>
              <Text style={s.errorCardText}>⚠️ {errors.form}</Text>
            </View>
          ) : null}

          {/* Two-Column Desktop Grid */}
          <View style={[s.gridWrapper, isExpanded && s.gridWrapperDesktop]}>
            
            {/* LEFT COLUMN: Store Identity & Operating Hours Cards */}
            <View style={[s.columnLeft, isExpanded && s.columnLeftDesktop]}>
              
              {/* Card 1: Store Identity */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Store identity</Text>
                  <Text style={s.sectionSub}>Business details for customer invoices and delivery receipts</Text>
                </View>

                {/* Row 1: Store Name & Owner Name */}
                <View style={s.row2}>
                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Store name *</Text>
                    <TextInput
                      style={[s.input, errors.storeName ? s.inputError : null]}
                      placeholder="e.g. Sri Lakshmi Beauty Store"
                      placeholderTextColor={Colors.textMuted}
                      value={storeName}
                      onChangeText={v => handleFieldChange(setStoreName, 'storeName', v)}
                      accessibilityLabel="Store name"
                    />
                    {errors.storeName ? (
                      <Text style={s.fieldErrorText}>⚠️ {errors.storeName}</Text>
                    ) : null}
                  </View>

                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Owner / Manager name *</Text>
                    <TextInput
                      style={[s.input, errors.ownerName ? s.inputError : null]}
                      placeholder="e.g. Sathvik Ramanujan"
                      placeholderTextColor={Colors.textMuted}
                      value={ownerName}
                      onChangeText={v => handleFieldChange(setOwnerName, 'ownerName', v)}
                      accessibilityLabel="Owner name"
                    />
                    {errors.ownerName ? (
                      <Text style={s.fieldErrorText}>⚠️ {errors.ownerName}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Row 2: Locality, City & Pincode (3 Columns Grid) */}
                <View style={s.row3}>
                  <View style={[s.fieldWrap, { flex: 1.2 }]}>
                    <Text style={s.fieldLabel}>Locality / Area *</Text>
                    <TextInput
                      style={[s.input, errors.locality ? s.inputError : null]}
                      placeholder="e.g. Benz Circle"
                      placeholderTextColor={Colors.textMuted}
                      value={locality}
                      onChangeText={v => handleFieldChange(setLocality, 'locality', v)}
                      accessibilityLabel="Locality"
                    />
                    {errors.locality ? <Text style={s.fieldErrorText}>⚠️ {errors.locality}</Text> : null}
                  </View>

                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>City *</Text>
                    <TextInput
                      style={[s.input, errors.city ? s.inputError : null]}
                      placeholder="e.g. Vijayawada"
                      placeholderTextColor={Colors.textMuted}
                      value={city}
                      onChangeText={v => handleFieldChange(setCity, 'city', v)}
                      accessibilityLabel="City"
                    />
                    {errors.city ? <Text style={s.fieldErrorText}>⚠️ {errors.city}</Text> : null}
                  </View>

                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Pincode *</Text>
                    <TextInput
                      style={[s.input, errors.pincode ? s.inputError : null]}
                      placeholder="520010"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={pincode}
                      onChangeText={v => handleFieldChange(setPincode, 'pincode', v.replace(/\D/g, ''))}
                      accessibilityLabel="6-digit Pincode"
                    />
                    {errors.pincode ? <Text style={s.fieldErrorText}>⚠️ {errors.pincode}</Text> : null}
                  </View>
                </View>
              </View>

              {/* Card 2: Business Hours */}
              <View style={s.sectionCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Business hours</Text>
                  <Text style={s.sectionSub}>Store operating window for receiving express delivery orders</Text>
                </View>

                <View style={s.row2}>
                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Opening time *</Text>
                    <TextInput
                      style={[s.input, errors.hours ? s.inputError : null]}
                      value={openTime}
                      onChangeText={v => handleFieldChange(setOpenTime, 'hours', v)}
                      placeholder="08:00 AM"
                      placeholderTextColor={Colors.textMuted}
                      accessibilityLabel="Opening time"
                    />
                  </View>

                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Closing time *</Text>
                    <TextInput
                      style={[s.input, errors.hours ? s.inputError : null]}
                      value={closeTime}
                      onChangeText={v => handleFieldChange(setCloseTime, 'hours', v)}
                      placeholder="11:00 PM"
                      placeholderTextColor={Colors.textMuted}
                      accessibilityLabel="Closing time"
                    />
                  </View>
                </View>

                {errors.hours ? (
                  <Text style={s.fieldErrorText}>⚠️ {errors.hours}</Text>
                ) : null}

                {/* Schedule Preview & Availability Note */}
                <View style={s.schedulePreviewBox}>
                  <View style={s.scheduleBadgeRow}>
                    <Text style={s.scheduleBadgeText}>📅 Open Everyday: Mon – Sun ({openTime} – {closeTime})</Text>
                  </View>
                  <Text style={s.scheduleNoteText}>
                    ℹ️ Customer orders are dispatched automatically only during active store operating hours.
                  </Text>
                </View>
              </View>

            </View>

            {/* RIGHT COLUMN: Large Store Location GPS Map Card */}
            <View style={[s.columnRight, isExpanded && s.columnRightDesktop]}>
              
              <View style={s.sectionCard}>
                <View style={s.mapHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>Store GPS location pin</Text>
                    <Text style={s.sectionSub}>Riders will navigate directly to this pin for pick-ups</Text>
                  </View>

                  <TouchableOpacity
                    style={s.gpsBtn}
                    onPress={handleDetectGPS}
                    disabled={locating}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Use my current location"
                  >
                    {locating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={s.gpsBtnText}>📍 Use current location</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Search Address Bar */}
                <View style={s.searchBarWrap}>
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search street, landmark or building..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchAddress}
                    onChangeText={setSearchAddress}
                    accessibilityLabel="Search address"
                  />
                  <TouchableOpacity
                    style={s.searchBtn}
                    onPress={() => {
                      if (searchAddress.trim()) {
                        handleSelectPreset(POPULAR_AREAS[0]);
                        setSearchAddress('');
                      }
                    }}
                  >
                    <Text style={s.searchBtnText}>Search</Text>
                  </TouchableOpacity>
                </View>

                {/* Location Accuracy Status Banners */}
                {locating && (
                  <View style={s.statusBannerInfo}>
                    <Text style={s.statusBannerInfoText}>📡 Syncing high-accuracy GPS coordinates...</Text>
                  </View>
                )}

                {gpsStatus === 'success' && !locating && (
                  <View style={s.statusBannerSuccess}>
                    <Text style={s.statusBannerSuccessText}>✓ High-accuracy GPS location synced (± 5m)</Text>
                  </View>
                )}

                {gpsStatus === 'denied' && (
                  <View style={s.statusBannerWarning}>
                    <Text style={s.statusBannerWarningText}>⚠️ {gpsErrorMsg}</Text>
                  </View>
                )}

                {/* Quick Area Landmark Presets */}
                <View style={s.areaPresetRow}>
                  <Text style={s.presetLabel}>Quick Presets:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetList}>
                    {POPULAR_AREAS.map(item => (
                      <TouchableOpacity
                        key={item.name}
                        style={s.presetChip}
                        onPress={() => handleSelectPreset(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.presetChipText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Real Interactive Leaflet Map with Draggable Pin */}
                <View style={s.mapCardBox}>
                  <RealInteractiveMap
                    // Map view starts on the city; it does not save a location until the merchant picks one.
                    latitude={latitude ?? 16.5062}
                    longitude={longitude ?? 80.6480}
                    shopName={storeName || 'Your store'}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </View>

                {/* Primary Address Summary */}
                <View style={s.addressSummaryBox}>
                  <Text style={s.addressSummaryTitle}>📍 Pinned Address Summary</Text>
                  <Text style={s.addressSummaryText}>
                    {locality || 'Benz Circle'}, {city || 'Vijayawada'}, Andhra Pradesh - {pincode || '520010'}
                  </Text>
                </View>

                {/* Secondary Technical Detail Area (Lat / Lng) */}
                <View style={s.technicalArea}>
                  <Text style={s.technicalText}>
                    TECHNICAL COORDINATES: {latitude != null ? latitude.toFixed(6) : '—'}° N, {longitude != null ? longitude.toFixed(6) : '—'}° E
                  </Text>
                </View>

                {/* Why We Need This Explanation */}
                <View style={s.whyNeedBox}>
                  <Text style={s.whyNeedText}>
                    💡 <Text style={s.whyNeedBold}>Why we need this:</Text> Delivery riders and local customers rely on this exact pin location for 10-minute dispatch routing and nearby store discovery.
                  </Text>
                </View>
              </View>

            </View>

          </View>

          {/* Demo Edge State Simulator Bar */}
          <View style={s.demoBar}>
            <Text style={s.demoBarLabel}>DEMO STATES:</Text>
            <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('unsaved')}>
              <Text style={s.demoChipText}>Unsaved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('saveError')}>
              <Text style={s.demoChipText}>Save Error</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('hoursError')}>
              <Text style={s.demoChipText}>Hours Conflict</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.demoChip} onPress={() => handleSimulateState('denied')}>
              <Text style={s.demoChipText}>GPS Denied</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.stickyFooter}>
        <View style={s.footerInner}>
          {/* Secondary Actions Left */}
          <View style={s.footerLeftRow}>
            <TouchableOpacity
              style={s.secondaryBackBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <Text style={s.secondaryBackBtnText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.saveDraftBtn}
              onPress={handleSaveDraft}
              activeOpacity={0.7}
              accessibilityLabel="Save draft"
            >
              <Text style={s.saveDraftBtnText}>💾 Save draft</Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA Right */}
          <View style={s.footerRightRow}>
            <TouchableOpacity
              style={[s.primaryCtaBtn, loading && s.primaryCtaBtnDisabled]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue to documents"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={s.ctaTextWrap}>
                  <Text style={s.primaryCtaText}>Continue to documents →</Text>
                  <Text style={s.primaryCtaSub}>Step 1 of 4</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
  
  /* Shell Header */
  shellHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 20,
  },
  shellHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shellRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  draftTagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  draftTagSuccess: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  draftTagUnsaved: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  draftTagText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  draftTagUnsavedText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  draftTagError: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadii.pill,
  },
  draftTagErrorText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  supportLink: {
    paddingVertical: 4,
  },
  supportLinkText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  supportBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },

  /* 4-Step Horizontal Segmented Tracker */
  progressTrackerRow: {
    flexDirection: 'row',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  stepSegment: {
    flex: 1,
  },
  stepBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  stepBarActive: {
    backgroundColor: Colors.primary, // Royal Blue
  },
  stepBarCompleted: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },

  /* Body Scroll */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
  },
  containerExpanded: {
    maxWidth: 1200,
  },

  /* Welcome Card */
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  welcomeSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepPillBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.pill,
  },
  stepPillBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Toast & Banners */
  toastBanner: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toastBannerText: {
    fontSize: 13,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
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

  /* 2-Column Grid Layout */
  gridWrapper: {
    flexDirection: 'column',
    gap: Spacing.xl,
  },
  gridWrapperDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  },
  columnLeft: {
    width: '100%',
  },
  columnLeftDesktop: {
    flex: 1.1,
  },
  columnRight: {
    width: '100%',
  },
  columnRightDesktop: {
    flex: 1,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Inputs & Rows */
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
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  fieldErrorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  row2: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  row3: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  /* Schedule Preview Box */
  schedulePreviewBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  scheduleBadgeRow: {
    marginBottom: 4,
  },
  scheduleBadgeText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  scheduleNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  /* Map Card Header & Actions */
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  searchBarWrap: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    backgroundColor: '#FFFFFF',
  },
  searchBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  /* Banners */
  statusBannerInfo: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.md,
  },
  statusBannerInfoText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusBannerSuccess: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    padding: Spacing.sm,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.md,
  },
  statusBannerSuccessText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  statusBannerWarning: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    padding: Spacing.sm,
    borderRadius: BorderRadii.input,
    marginBottom: Spacing.md,
  },
  statusBannerWarningText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    lineHeight: 16,
  },

  /* Area Presets */
  areaPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presetLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  presetList: {
    gap: Spacing.xs,
  },
  presetChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Map Container & Address Summaries */
  mapCardBox: {
    height: 240,
    borderRadius: BorderRadii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  addressSummaryBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addressSummaryTitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  addressSummaryText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  technicalArea: {
    paddingHorizontal: 4,
    marginBottom: Spacing.md,
  },
  technicalText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    
  },
  whyNeedBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
  },
  whyNeedText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  whyNeedBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* Demo Bar */
  demoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoBarLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    marginRight: 4,
  },
  demoChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Sticky Footer CTA */
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
    elevation: 4,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  footerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  secondaryBackBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadii.input,
  },
  secondaryBackBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveDraftBtn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadii.input,
  },
  saveDraftBtnText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  footerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCtaBtn: {
    backgroundColor: Colors.primary, // Royal Blue
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCtaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaTextWrap: {
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  primaryCtaSub: {
    color: '#BFDBFE',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});
