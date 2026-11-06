/**
 * Onboarding step 1 of 4: store details. Store and owner name, contact mobile, address with
 * state and pincode, the pincodes the store delivers to, and opening hours (stored 24-hour).
 * Saved on this device as a draft; nothing is sent until step 4.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import RealInteractiveMap from '../../src/components/RealInteractiveMap';
import {
  SellerFrame,
  Section,
  FieldRow,
  TextField,
  SelectField,
  Button,
  Banner,
  Segmented,
  StepFooter,
  GateFallback,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { useOnboardingGate } from '../../src/features/onboarding/guard';
import { signOutVendor } from '../../src/services/session';
import {
  DRAFT_KEYS,
  loadDraft,
  saveDraft,
  seedDraftsFromApplication,
  setResumeStep,
  formatSavedTime,
  type StoreDraft,
} from '../../src/features/onboarding/draft';
import { storeErrors, hasErrors } from '../../src/features/onboarding/application';
import {
  digitsOnly,
  formatMobile,
  from24h,
  maskTime,
  normalizeIndianMobile,
  to24h,
  validatePincode,
  INDIAN_STATES,
  MAX_SERVICE_PINCODES,
  type Meridiem,
} from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

const MERIDIEMS = ['AM', 'PM'] as const;
// The map picker is a web page in an iframe; the phone apps have no map yet, so the pin is optional.
const MAP_AVAILABLE = Platform.OS === 'web';

const LABELS: [string, string][] = [
  ['storeName', 'store name'],
  ['ownerName', 'owner name'],
  ['contactNumber', 'contact mobile'],
  ['address', 'shop address'],
  ['city', 'city'],
  ['state', 'state'],
  ['pincode', 'pincode'],
  ['servicePincodes', 'delivery pincodes'],
  ['openTime', 'opening time'],
  ['closeTime', 'closing time'],
];

export default function StepA() {
  const router = useRouter();
  const { isPhone } = useLayout();
  const gate = useOnboardingGate();
  useDocumentTitle('Store details');

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [extraPins, setExtraPins] = useState<string[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [pinInputError, setPinInputError] = useState('');
  const [openHm, setOpenHm] = useState('09:00');
  const [openMer, setOpenMer] = useState<Meridiem>('AM');
  const [closeHm, setCloseHm] = useState('09:00');
  const [closeMer, setCloseMer] = useState<Meridiem>('PM');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState<'' | 'draft' | 'server'>('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const ready = gate.status === 'ready';
  const application = ready ? gate.me.vendor.application : null;

  useEffect(() => {
    if (!ready || loaded) return;
    (async () => {
      let d = await loadDraft<StoreDraft>(DRAFT_KEYS.a);
      let from: '' | 'draft' | 'server' = d ? (d.seededFromServer ? 'server' : 'draft') : '';
      if (!d && application) {
        // Resubmitting: start from what is already on the server.
        await seedDraftsFromApplication(application);
        d = await loadDraft<StoreDraft>(DRAFT_KEYS.a);
        from = d ? 'server' : '';
      }
      if (d) {
        setStoreName(d.storeName || '');
        setOwnerName(d.ownerName || '');
        setContact(normalizeIndianMobile(d.contactNumber || ''));
        setAddress(d.address || '');
        setLocality(d.locality || '');
        setCity(d.city || '');
        setStateName(d.state || '');
        setPincode(d.pincode || '');
        setExtraPins((d.servicePincodes || []).filter(p => p !== d!.pincode));
        const [ohm, omer] = from24h(d.openTime);
        if (ohm) {
          setOpenHm(ohm);
          setOpenMer(omer);
        }
        const [chm, cmer] = from24h(d.closeTime);
        if (chm) {
          setCloseHm(chm);
          setCloseMer(cmer);
        }
        if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
          setLatitude(d.latitude);
          setLongitude(d.longitude);
        }
      }
      setRestored(from);
      setLoaded(true);
    })();
  }, [ready]);

  const dirty = () => saveState !== 'idle' && setSaveState('idle');
  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    dirty();
  };
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const storePinValid = !validatePincode(pincode);
  const servicePincodes = storePinValid ? [pincode, ...extraPins.filter(p => p !== pincode)] : extraPins;

  const data = (): StoreDraft => ({
    storeName: storeName.trim(),
    ownerName: ownerName.trim(),
    contactNumber: contact,
    address: address.trim(),
    locality: locality.trim(),
    city: city.trim(),
    state: stateName,
    pincode,
    servicePincodes,
    openTime: to24h(openHm, openMer),
    closeTime: to24h(closeHm, closeMer),
    latitude,
    longitude,
  });

  const errors = storeErrors(data());
  const missing = LABELS.filter(([k]) => errors[k]).map(([, label]) => label);
  const valid = !hasErrors(errors);
  const err = (k: string) => (touched[k] || showAll ? errors[k] : '');
  const hint = valid
    ? ''
    : `To continue, add: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}`;

  const addPin = () => {
    const p = digitsOnly(pinInput, 6);
    const e = validatePincode(p);
    if (e) return setPinInputError(e);
    if (servicePincodes.includes(p)) return setPinInputError('This pincode is already in your list');
    if (servicePincodes.length >= MAX_SERVICE_PINCODES) return setPinInputError(`You can add up to ${MAX_SERVICE_PINCODES} pincodes`);
    setExtraPins(list => [...list, p]);
    setPinInput('');
    setPinInputError('');
    dirty();
  };

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.a, data());
      await setResumeStep('step-a');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const onContinue = async () => {
    setShowAll(true);
    if (!valid) return;
    setBusy(true);
    setFormError('');
    try {
      await saveDraft(DRAFT_KEYS.a, data());
      await setResumeStep('step-b');
      router.push('/(onboarding)/step-b');
    } catch {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onMapSelect = useCallback(
    (loc: { latitude: number; longitude: number; locality?: string; city?: string; pinCode?: string }) => {
      setLatitude(Number(loc.latitude.toFixed(6)));
      setLongitude(Number(loc.longitude.toFixed(6)));
      // Only fill fields the vendor hasn't typed yet.
      if (loc.locality) setLocality(v => v || loc.locality!);
      if (loc.city) setCity(v => v || loc.city!);
      if (loc.pinCode && /^[1-9]\d{5}$/.test(loc.pinCode)) setPincode(v => v || loc.pinCode!);
      setSaveState('idle');
    },
    [],
  );

  const signOut = async () => {
    await signOutVendor();
    router.replace('/(auth)/login');
  };

  if (gate.status !== 'ready' || !loaded) {
    return <GateFallback gate={gate.status === 'ready' ? { status: 'loading' } : gate} loadingLabel="Loading your details" onSignOut={signOut} />;
  }

  const pinned = latitude != null && longitude != null;
  const accountEmail = gate.user.email || gate.me.account.email;

  return (
    <SellerFrame
      step={1}
      title="Store details"
      description="Tell us about your shop. Customers see the store name; our delivery partners use the address."
      headerRight={<Button label="Sign out" variant="ghost" compact onPress={signOut} />}
      footer={
        <StepFooter
          hint={hint}
          onSaveDraft={onSaveDraft}
          saveState={saveState}
          savedAt={savedAt}
          primaryLabel="Continue"
          onPrimary={onContinue}
          primaryLoading={busy}
          primaryTestID="step-continue"
        />
      }
      testID="step-a"
    >
      {restored === 'draft' ? <Banner tone="info" message="We restored the draft saved on this device." /> : null}
      {restored === 'server' ? (
        <Banner tone="info" message="We filled in the details you submitted before. Check them, change what is needed, then continue." />
      ) : null}
      {formError ? <Banner tone="error" message={formError} /> : null}

      <Section title="Store">
        <TextField
          label="Store name"
          placeholder="As on your shop name board"
          value={storeName}
          onChangeText={edit(setStoreName)}
          onBlur={touch('storeName')}
          error={err('storeName')}
          autoCapitalize="words"
          maxLength={80}
          testID="store-name"
        />
        <TextField
          label="Owner’s full name"
          placeholder="As on the owner’s PAN card"
          value={ownerName}
          onChangeText={edit(setOwnerName)}
          onBlur={touch('ownerName')}
          error={err('ownerName')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={80}
          testID="owner-name"
        />
        <TextField
          label="Store contact mobile"
          prefix="+91"
          placeholder="98765 43210"
          value={formatMobile(contact)}
          onChangeText={v => edit(setContact)(normalizeIndianMobile(v))}
          onBlur={touch('contactNumber')}
          error={err('contactNumber')}
          helper="GlowVai’s team calls this number about your store and orders. Customers never see it."
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={11}
          testID="contact-number"
        />
        <View style={st.emailRow}>
          <Ionicons name="mail-outline" size={18} color={C.textSecondary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.emailLabel}>Account email</Text>
            <Text style={st.emailValue} numberOfLines={1}>
              {accountEmail}
            </Text>
          </View>
        </View>
      </Section>

      <Section title="Address" description="Where our delivery partners pick up orders.">
        <TextField
          label="Shop address"
          placeholder="Shop no., building, street"
          value={address}
          onChangeText={edit(setAddress)}
          onBlur={touch('address')}
          error={err('address')}
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          maxLength={160}
          testID="address"
        />
        <TextField
          label="Area or locality"
          optional
          placeholder="Area, landmark"
          value={locality}
          onChangeText={edit(setLocality)}
          maxLength={60}
          testID="locality"
        />
        <FieldRow keepOnPhone>
          <TextField
            label="City"
            placeholder="City or town"
            value={city}
            onChangeText={edit(setCity)}
            onBlur={touch('city')}
            error={err('city')}
            autoComplete="postal-address-locality"
            textContentType="addressCity"
            maxLength={60}
            testID="city"
          />
          <TextField
            label="Pincode"
            placeholder="6 digits"
            value={pincode}
            onChangeText={edit((v: string) => setPincode(digitsOnly(v, 6)))}
            onBlur={touch('pincode')}
            error={err('pincode')}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="postal-code"
            textContentType="postalCode"
            maxLength={6}
            testID="pincode"
          />
        </FieldRow>
        <SelectField
          label="State"
          value={stateName}
          options={INDIAN_STATES}
          onChange={v => {
            edit(setStateName)(v);
            touch('state')();
          }}
          placeholder="Choose your state"
          error={err('state')}
          testID="state"
          last={!MAP_AVAILABLE}
        />

        {MAP_AVAILABLE ? (
          <View>
            <Text style={st.label}>
              Map pin <Text style={st.optional}>(optional)</Text>
            </Text>
            <Text style={st.helper}>A pin helps delivery partners find your entrance.</Text>
            {mapOpen ? (
              <View style={st.map}>
                <RealInteractiveMap
                  height={isPhone ? 320 : 380}
                  latitude={latitude ?? 20.5937}
                  longitude={longitude ?? 78.9629}
                  shopName={storeName || 'Your store'}
                  onLocationSelect={onMapSelect}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row' }}>
                <Button label={pinned ? 'Move the pin' : 'Add a map pin'} icon="location-outline" variant="secondary" compact onPress={() => setMapOpen(true)} />
              </View>
            )}
            <Text style={[st.helper, { marginTop: S.sm, marginBottom: 0 }, pinned && { color: C.successText }]}>
              {pinned ? 'Pin added. Search, tap or drag on the map to move it.' : mapOpen ? 'Search, tap the map or drag the pin to your shop.' : 'No pin added yet.'}
            </Text>
          </View>
        ) : null}
      </Section>

      <Section
        title="Where you deliver"
        description="Orders from these pincodes can reach your store. Your store’s own pincode is always included."
      >
        <View style={st.chips} accessibilityRole="list" accessibilityLabel="Delivery pincodes">
          {servicePincodes.length ? (
            servicePincodes.map(p => {
              const own = storePinValid && p === pincode;
              return (
                <View key={p} style={[st.chip, own && st.chipOwn]} accessibilityLabel={own ? `${p}, your store` : p}>
                  <Text style={[st.chipText, own && { color: C.primary }]}>{p}</Text>
                  {own ? (
                    <Text style={st.chipTag}>Your store</Text>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setExtraPins(list => list.filter(x => x !== p));
                        dirty();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${p}`}
                      hitSlop={8}
                      style={({ pressed }) => [st.chipRemove, pressed && { opacity: 0.6 }]}
                    >
                      <Ionicons name="close" size={16} color={C.textSecondary} />
                    </Pressable>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={[st.helper, { marginBottom: 0 }]}>Enter your store’s pincode above. It is added here automatically.</Text>
          )}
        </View>
        <View style={st.addRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <TextField
              label={servicePincodes.length ? 'Add another pincode' : 'Add a pincode'}
              placeholder="6 digits"
              value={pinInput}
              onChangeText={v => {
                setPinInput(digitsOnly(v, 6));
                setPinInputError('');
              }}
              onSubmitEditing={addPin}
              error={pinInputError || err('servicePincodes')}
              helper={`${servicePincodes.length} of ${MAX_SERVICE_PINCODES} added`}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              returnKeyType="done"
              last
              testID="service-pincode"
            />
          </View>
          <Button
            label="Add"
            icon="add"
            variant="secondary"
            onPress={addPin}
            disabled={servicePincodes.length >= MAX_SERVICE_PINCODES}
            style={st.addBtn}
            testID="service-pincode-add"
          />
        </View>
      </Section>

      <Section title="Opening hours" description="Orders reach you only while your store is open. Choose AM or PM for each time.">
        <FieldRow>
          <TimeField
            label="Opens at"
            hm={openHm}
            mer={openMer}
            onHm={edit(setOpenHm)}
            onMer={edit(setOpenMer)}
            onBlur={touch('openTime')}
            error={err('openTime')}
            last={!isPhone}
          />
          <TimeField
            label="Closes at"
            hm={closeHm}
            mer={closeMer}
            onHm={edit(setCloseHm)}
            onMer={edit(setCloseMer)}
            onBlur={touch('closeTime')}
            error={err('closeTime')}
            last
          />
        </FieldRow>
      </Section>
    </SellerFrame>
  );
}

function TimeField({
  label,
  hm,
  mer,
  onHm,
  onMer,
  onBlur,
  error,
  last,
}: {
  label: string;
  hm: string;
  mer: Meridiem;
  onHm: (v: string) => void;
  onMer: (v: Meridiem) => void;
  onBlur: () => void;
  error?: string;
  last?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: S.sm }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextField
          label={label}
          placeholder="09:00"
          value={hm}
          onChangeText={v => onHm(maskTime(v))}
          onBlur={onBlur}
          error={error}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={5}
          last={last}
        />
      </View>
      <View style={{ marginTop: 26 }}>
        <Segmented options={MERIDIEMS} value={mer} onChange={onMer} label={label} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  emailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingTop: S.md, borderTopWidth: 1, borderTopColor: C.border },
  emailLabel: { fontSize: 13, lineHeight: 18, color: C.textSecondary },
  emailValue: { fontFamily: FontFamily.medium, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginBottom: 2 },
  optional: { fontFamily: FontFamily.regular, color: C.textSubtle },
  helper: { fontSize: 13, lineHeight: 19, color: C.textSubtle, marginBottom: S.md },
  map: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingLeft: S.md,
    paddingRight: S.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.card,
  },
  chipOwn: { borderColor: C.primaryBorder, backgroundColor: C.primaryLight, paddingRight: S.md },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.textPrimary, fontVariant: ['tabular-nums'] },
  chipTag: { fontSize: 12, color: C.infoText },
  chipRemove: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  addBtn: { marginTop: 26, minWidth: 88 },
});
