/**
 * Onboarding step 1 of 4: store details (name, owner, address, map pin, opening hours).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { clearSession } from '../../src/services/session';
import RealInteractiveMap from '../../src/components/RealInteractiveMap';
import {
  SellerFrame,
  Section,
  FieldRow,
  TextField,
  Button,
  Banner,
  Segmented,
  StepFooter,
  CenteredLoader,
  useLayout,
  useDocumentTitle,
  SellerColors as C,
  S,
  type SaveState,
} from '../../src/features/onboarding/kit';
import { useRequireSession } from '../../src/features/onboarding/guard';
import { DRAFT_KEYS, loadDraft, saveDraft, setResumeStep, formatSavedTime, type StoreDraft } from '../../src/features/onboarding/draft';
import {
  digitsOnly,
  maskTime,
  parseTime,
  validateEmailOptional,
  validatePincode,
  validateRequired,
} from '../../src/features/onboarding/validation';
import { FontFamily } from '../../src/theme/typography';

type Meridiem = 'AM' | 'PM';
const MERIDIEMS = ['AM', 'PM'] as const;

function splitTime(t?: string): [string, Meridiem] {
  const m = /^(\d{1,2}:\d{2})\s*(AM|PM)$/i.exec(t || '');
  return m ? [m[1].padStart(5, '0'), m[2].toUpperCase() as Meridiem] : ['', 'AM'];
}

// The map picker is a web iframe; on the phone apps it shows a fallback, so the pin is optional there.
const MAP_AVAILABLE = Platform.OS === 'web';

export default function StepA() {
  const router = useRouter();
  const { isPhone } = useLayout();
  const { ready } = useRequireSession();
  useDocumentTitle('Store details');

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [openHm, setOpenHm] = useState('09:00');
  const [openMer, setOpenMer] = useState<Meridiem>('AM');
  const [closeHm, setCloseHm] = useState('09:00');
  const [closeMer, setCloseMer] = useState<Meridiem>('PM');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadDraft<StoreDraft>(DRAFT_KEYS.a).then(d => {
      if (!d) return;
      setStoreName(d.storeName || '');
      setOwnerName(d.ownerName || '');
      setEmail(d.email || '');
      setAddress(d.address || '');
      setLocality(d.locality || '');
      setCity(d.city || '');
      setPincode(d.pincode || '');
      if (d.openTime) {
        const [hm, mer] = splitTime(d.openTime);
        if (hm) { setOpenHm(hm); setOpenMer(mer); }
      }
      if (d.closeTime) {
        const [hm, mer] = splitTime(d.closeTime);
        if (hm) { setCloseHm(hm); setCloseMer(mer); }
      }
      if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
        setLatitude(d.latitude);
        setLongitude(d.longitude);
      }
      setRestored(true);
    });
  }, []);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (saveState !== 'idle') setSaveState('idle');
  };
  const touch = (k: string) => () => setTouched(t => ({ ...t, [k]: true }));

  const openMin = parseTime(openHm, openMer);
  const closeMin = parseTime(closeHm, closeMer);
  const errors: Record<string, string> = {
    storeName: validateRequired(storeName, 'your store name'),
    ownerName: validateRequired(ownerName, 'the owner’s full name', 3),
    email: validateEmailOptional(email),
    address: validateRequired(address, 'the shop address', 5),
    locality: validateRequired(locality, 'the area or locality'),
    city: validateRequired(city, 'the city'),
    pincode: validatePincode(pincode),
    openTime: openMin === null ? 'Enter a time like 09:00' : '',
    closeTime:
      closeMin === null ? 'Enter a time like 09:00' : openMin !== null && closeMin === openMin ? 'Closing time must differ from opening time' : '',
    location: MAP_AVAILABLE && (latitude == null || longitude == null) ? 'Pin your store on the map' : '',
  };
  const order: [string, string][] = [
    ['storeName', 'store name'],
    ['ownerName', 'owner name'],
    ['email', 'a valid email'],
    ['address', 'shop address'],
    ['locality', 'area'],
    ['city', 'city'],
    ['pincode', 'pincode'],
    ['openTime', 'opening time'],
    ['closeTime', 'closing time'],
    ['location', 'map pin'],
  ];
  const missing = order.filter(([k]) => errors[k]).map(([, label]) => label);
  const valid = missing.length === 0;
  const err = (k: string) => (touched[k] || showAll ? errors[k] : '');
  const hint = valid
    ? ''
    : `To continue, add: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}`;

  const data = (): StoreDraft => ({
    storeName: storeName.trim(),
    ownerName: ownerName.trim(),
    email: email.trim(),
    address: address.trim(),
    locality: locality.trim(),
    city: city.trim(),
    pincode,
    openTime: `${openHm} ${openMer}`,
    closeTime: `${closeHm} ${closeMer}`,
    latitude,
    longitude,
  });

  const onSaveDraft = async () => {
    setSaveState('saving');
    try {
      await saveDraft(DRAFT_KEYS.a, data());
      await setResumeStep('step-a');
      setSavedAt(formatSavedTime());
      setSaveState('saved');
    } catch (_) {
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
    } catch (_) {
      setFormError('We couldn’t save your details on this device. Check storage permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onMapSelect = useCallback(
    (loc: { latitude: number; longitude: number; locality?: string; city?: string; pinCode?: string }) => {
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      setLocError('');
      // Only fill fields the seller hasn't typed yet.
      if (loc.locality) setLocality(v => v || loc.locality!);
      if (loc.city) setCity(v => v || loc.city!);
      if (loc.pinCode && /^\d{6}$/.test(loc.pinCode)) setPincode(v => v || loc.pinCode!);
      setSaveState('idle');
    },
    [],
  );

  const useMyLocation = () => {
    setLocError('');
    const geo = typeof navigator !== 'undefined' ? (navigator as any).geolocation : undefined;
    if (!geo) {
      setLocError('Location isn’t available here. Drag the pin or search on the map instead.');
      return;
    }
    setLocating(true);
    geo.getCurrentPosition(
      (pos: any) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        setSaveState('idle');
      },
      () => {
        setLocating(false);
        setLocError('We couldn’t get your location. Allow location access, or drag the pin on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const signOut = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  if (!ready) return <CenteredLoader label="Loading your details" />;

  const pinned = latitude != null && longitude != null;

  return (
    <SellerFrame
      step={1}
      title="Store details"
      description="Tell us about your shop. Customers see the store name; delivery partners use the address and pin."
      headerRight={<Button label="Sign out" variant="ghost" compact onPress={signOut} />}
      footer={
        <StepFooter
          hint={hint}
          onSaveDraft={onSaveDraft}
          saveState={saveState}
          savedAt={savedAt}
          primaryLabel="Continue"
          onPrimary={onContinue}
          primaryDisabled={!valid}
          primaryLoading={busy}
          primaryTestID="step-continue"
        />
      }
      testID="step-a"
    >
      {restored ? <Banner tone="info" message="We restored the draft saved on this device." /> : null}
      {formError ? <Banner tone="error" message={formError} /> : null}

      <Section title="Store">
        <TextField
          label="Store name"
          placeholder="e.g. City Beauty Store"
          value={storeName}
          onChangeText={edit(setStoreName)}
          onBlur={touch('storeName')}
          error={err('storeName')}
          helper="As shown on your shop name board"
          autoCapitalize="words"
          maxLength={80}
          testID="store-name"
        />
        <TextField
          label="Owner's full name"
          placeholder="As on the owner's PAN card"
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
          label="Email"
          optional
          placeholder="name@example.com"
          value={email}
          onChangeText={edit(setEmail)}
          onBlur={touch('email')}
          error={err('email')}
          helper="For order and payout updates"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={120}
          last
        />
      </Section>

      <Section title="Address" description="Where delivery partners pick up orders.">
        <TextField
          label="Shop address"
          placeholder="Shop no., building, street"
          value={address}
          onChangeText={edit(setAddress)}
          onBlur={touch('address')}
          error={err('address')}
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          maxLength={200}
          testID="address"
        />
        <TextField
          label="Area or locality"
          placeholder="e.g. Benz Circle"
          value={locality}
          onChangeText={edit(setLocality)}
          onBlur={touch('locality')}
          error={err('locality')}
          maxLength={100}
          testID="locality"
        />
        <FieldRow keepOnPhone>
          <TextField
            label="City"
            placeholder="e.g. Vijayawada"
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
            placeholder="520010"
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

        <Text style={st.label}>Store location on the map{MAP_AVAILABLE ? '' : ' (optional)'}</Text>
        <Text style={st.helper}>
          {MAP_AVAILABLE ? 'Search inside the map, tap the map or drag the pin to your shop entrance.' : 'You can set the pin from the web portal.'}
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: S.md }}>
          <Button
            label={locating ? 'Finding you…' : 'Use my current location'}
            icon="locate-outline"
            variant="secondary"
            compact
            loading={locating}
            onPress={useMyLocation}
          />
        </View>
        {MAP_AVAILABLE ? (
          <View style={[st.map, !!err('location') && { borderColor: C.errorText }]}>
            <RealInteractiveMap
              height={isPhone ? 340 : 380}
              latitude={latitude ?? 16.5062}
              longitude={longitude ?? 80.648}
              shopName={storeName || 'Your store'}
              onLocationSelect={onMapSelect}
            />
          </View>
        ) : null}
        {locError ? <Banner tone="warning" message={locError} style={{ marginTop: S.md, marginBottom: 0 }} /> : null}
        {pinned ? (
          <Text style={[st.helper, { color: C.successText, marginTop: S.sm }]}>
            Pin set at {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </Text>
        ) : err('location') ? (
          <Text style={[st.helper, { color: C.errorText, marginTop: S.sm }]}>{err('location')}</Text>
        ) : null}
      </Section>

      <Section title="Opening hours" description="Orders reach you only while your store is open.">
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
  last?: boolean;
  label: string;
  hm: string;
  mer: Meridiem;
  onHm: (v: string) => void;
  onMer: (v: Meridiem) => void;
  onBlur: () => void;
  error?: string;
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
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginBottom: 2 },
  helper: { fontSize: 13, lineHeight: 19, color: C.textSubtle, marginBottom: S.md },
  map: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
});
