/**
 * Profile (PRD screen 25): store information, documents and verification status, hours,
 * store location and service area, people with access, payouts, and sign-in & security.
 * The former Team, Locations and Security screens are folded in here.
 *
 * Data: GET /api/vendor/me. Edits: PATCH /api/vendor/:id, limited to contact email and
 * opening hours. Name and address changes need verification, so they go through support.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import ScreenShell from '../../src/components/ScreenShell';
import { friendlyError, maskTail } from '../../src/features/money/format';
import { readBankAccount, type BankAccount } from '../../src/features/money/records';
import { Button, Card, ErrorCard, InfoRow, LinkRow, LoadingCard, Note, Pill, SectionLabel, page } from '../../src/features/money/ui';
import { toAccount, type Account } from '../../src/features/profile/account';
import { SupportContactActions } from '../../src/features/support/contact';
import { vendorApi } from '../../src/services/api';
import { clearSession, getSession } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; account: Account; bank: BankAccount | null };

const NOT_ADDED = 'Not added';
const TIME_RE = /^([01]?\d|2[0-3])(:[0-5]\d)?\s?(am|pm)?$/i;

export default function ProfileScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ email: '', openTime: '', closeTime: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await vendorApi.me();
      setLoad({ state: 'ready', account: toAccount(res?.vendor ?? {}), bank: readBankAccount(res?.vendor) });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = (a: Account) => {
    setDraft({ email: a.email || '', openTime: a.openTime || '', closeTime: a.closeTime || '' });
    setSaveError(null);
    setEditing(true);
  };

  const save = async () => {
    if (load.state !== 'ready') return;
    const email = draft.email.trim();
    const openTime = draft.openTime.trim();
    const closeTime = draft.closeTime.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setSaveError('Enter a valid email address, or leave it empty.');
      return;
    }
    if ((openTime && !TIME_RE.test(openTime)) || (closeTime && !TIME_RE.test(closeTime))) {
      setSaveError('Enter times like 9:00 AM or 21:30.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const vendorId = load.account.vendorId || (await getSession()).vendorId;
      if (!vendorId) throw new Error('missing vendor');
      const res = await vendorApi.updateProfile(vendorId, { email, openTime, closeTime });
      const next = res?.vendor ? toAccount(res.vendor) : { ...load.account, email, openTime, closeTime };
      setLoad({ ...load, account: next });
      setEditing(false);
    } catch (err) {
      setSaveError(`Your changes were not saved. ${friendlyError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await clearSession();
    router.replace('/(auth)/login');
  };

  const a = load.state === 'ready' ? load.account : null;
  const bank = load.state === 'ready' ? load.bank : null;
  const v = a?.verification;
  const phone = maskTail(a?.phone);
  const addressText = a ? [a.address, a.locality, a.city, a.pinCode].filter(Boolean).join(', ') : '';
  const initial = (a?.storeName || a?.ownerName || 'G').trim().charAt(0).toUpperCase();

  return (
    <View style={s.screen}>
      <ScreenShell header={{ title: 'Profile' }} backgroundColor={Colors.surface} contentContainerStyle={s.content} keyboardAvoiding={editing}>
        <View style={page.body}>
          {load.state === 'loading' ? <LoadingCard label="Loading your profile" /> : null}
          {load.state === 'error' ? <ErrorCard title="Could not load your profile" message={load.message} onRetry={fetchData} /> : null}

          {a && v ? (
            <>
              {/* Identity */}
              <Card style={s.identity}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Text style={s.storeName} numberOfLines={2}>
                    {a.storeName || 'Store name not added'}
                  </Text>
                  {a.ownerName ? <Text style={s.owner}>{a.ownerName}</Text> : null}
                  <Pill label={v.label} tone={v.tone} />
                </View>
              </Card>

              {v.banner ? (
                <Card style={[s.banner, v.tone === 'danger' ? s.bannerDanger : s.bannerWarn]}>
                  <Text style={s.bannerText} accessibilityRole="alert">
                    {v.banner}
                  </Text>
                  {v.reason ? <Text style={s.bannerReason}>Reason: {v.reason}</Text> : null}
                  {v.label === 'Suspended' ? (
                    <SupportContactActions subject="Store suspended" />
                  ) : (
                    <Text style={s.link} accessibilityRole="link" onPress={() => router.push('/(onboarding)/pending')}>
                      View application status
                    </Text>
                  )}
                </Card>
              ) : null}

              {/* Store */}
              <SectionLabel>Store</SectionLabel>
              <Card padded={false}>
                {a.storeType ? <InfoRow label="Store type" value={a.storeType} /> : null}
                {a.categories.length ? <InfoRow label="Categories" value={a.categories.join(', ')} /> : null}
                <InfoRow label="Contact email" value={a.email || NOT_ADDED} muted={!a.email} last />
              </Card>

              {/* Hours */}
              <SectionLabel>Opening hours</SectionLabel>
              {editing ? (
                <Card style={{ gap: Spacing.md }}>
                  <Field label="Contact email" value={draft.email} onChange={(t) => setDraft({ ...draft, email: t })} keyboardType="email-address" placeholder="name@example.com" />
                  <View style={s.twoCol}>
                    <Field label="Opens at" value={draft.openTime} onChange={(t) => setDraft({ ...draft, openTime: t })} placeholder="9:00 AM" />
                    <Field label="Closes at" value={draft.closeTime} onChange={(t) => setDraft({ ...draft, closeTime: t })} placeholder="9:00 PM" />
                  </View>
                  {saveError ? (
                    <Text style={s.formError} accessibilityRole="alert">
                      {saveError}
                    </Text>
                  ) : null}
                  <View style={s.twoCol}>
                    <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} disabled={saving} style={{ flex: 1 }} />
                    <Button label="Save" onPress={save} loading={saving} style={{ flex: 1 }} />
                  </View>
                </Card>
              ) : (
                <Card padded={false}>
                  <InfoRow label="Opens at" value={a.openTime || NOT_ADDED} muted={!a.openTime} />
                  <InfoRow label="Closes at" value={a.closeTime || NOT_ADDED} muted={!a.closeTime} />
                  <LinkRow label="Edit hours and contact email" icon="create-outline" onPress={() => startEditing(a)} last />
                </Card>
              )}

              {/* Location */}
              <SectionLabel>Store location</SectionLabel>
              <Card padded={false}>
                <InfoRow label="Registered address" value={addressText || NOT_ADDED} muted={!addressText} />
                <InfoRow
                  label="Taking orders"
                  value={a.isOnline === null ? 'Not available' : a.isOnline ? 'Online, accepting orders' : 'Offline'}
                  muted={a.isOnline === null}
                />
                <InfoRow
                  label="Service area"
                  value={a.serviceRadiusKm !== null ? `Within ${a.serviceRadiusKm} km of your store` : 'Not shown in the app yet'}
                  muted={a.serviceRadiusKm === null}
                  last
                />
              </Card>
              <Note icon="lock-closed-outline">Contact support to change your registered address. Address changes need to be verified first.</Note>

              {/* Documents */}
              <SectionLabel>Documents and verification</SectionLabel>
              <Card padded={false}>
                <InfoRow label="Verification status" value={v.label} />
                {a.documents.map((d) => (
                  <InfoRow key={d.label} label={d.label} value={d.value} muted={!d.provided} />
                ))}
                <LinkRow label="Store activity" icon="time-outline" detail="Important changes on your store" onPress={() => router.push('/(vendor)/compliance')} last />
              </Card>

              {/* Payouts */}
              <SectionLabel>Payouts</SectionLabel>
              <Card padded={false}>
                <LinkRow
                  label="Bank account"
                  icon="card-outline"
                  detail={bank ? [bank.bankName, bank.accountMasked].filter(Boolean).join(' ') : 'No account on file'}
                  onPress={() => router.push('/(vendor)/bank-edit')}
                />
                <LinkRow label="Settlements" icon="swap-horizontal-outline" onPress={() => router.push('/(vendor)/payout-detail')} />
                <LinkRow label="Tax documents" icon="document-text-outline" onPress={() => router.push('/(vendor)/tax-documents')} last />
              </Card>

              {/* People */}
              <SectionLabel>People with access</SectionLabel>
              <Card padded={false}>
                <View style={s.person}>
                  <View style={s.personAvatar}>
                    <Ionicons name="person-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.personName}>{a.ownerName || 'Store owner'}</Text>
                    <Text style={s.personMeta}>{phone ? `Owner · ${phone}` : 'Owner'}</Text>
                  </View>
                </View>
              </Card>
              <Note>Only you can sign in to this store. Adding staff is not available yet.</Note>

              {/* Security */}
              <SectionLabel>Sign-in & security</SectionLabel>
              <Card padded={false}>
                <InfoRow label="Phone number used to sign in" value={phone || NOT_ADDED} mono={!!phone} />
                <View style={s.signOut}>
                  {confirmSignOut ? (
                    <>
                      <Text style={s.owner}>Sign out of GlowVai on this device?</Text>
                      <View style={s.twoCol}>
                        <Button label="Cancel" variant="secondary" onPress={() => setConfirmSignOut(false)} style={{ flex: 1 }} />
                        <Button label="Sign out" variant="danger" onPress={signOut} loading={signingOut} style={{ flex: 1 }} />
                      </View>
                    </>
                  ) : (
                    <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={() => setConfirmSignOut(true)} />
                  )}
                </View>
              </Card>
            </>
          ) : null}

          {/* Help is reachable even when the profile fails to load. */}
          <SectionLabel>Help</SectionLabel>
          <Card padded={false}>
            <LinkRow label="Help and support" icon="help-buoy-outline" onPress={() => router.push('/(vendor)/support')} />
            <LinkRow label="Notifications" icon="notifications-outline" onPress={() => router.push('/(vendor)/notifications')} />
            <LinkRow label="Store summary" icon="stats-chart-outline" detail="Today's orders and top items" onPress={() => router.push('/(vendor)/analytics')} last />
          </Card>
        </View>
      </ScreenShell>
      <MobileBottomNav currentTab="profile" />
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSubtle}
        accessibilityLabel={label}
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType={keyboardType}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: 96 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...TypeScale.headline, color: Colors.primary },
  storeName: { ...TypeScale.title, color: Colors.textPrimary },
  owner: { ...TypeScale.body, color: Colors.textSecondary },
  banner: { gap: Spacing.sm, borderWidth: 1 },
  bannerWarn: { backgroundColor: Colors.warningLight, borderColor: Colors.warningBorder },
  bannerDanger: { backgroundColor: Colors.dangerLight, borderColor: Colors.dangerBorder },
  bannerText: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  bannerReason: { ...TypeScale.body, color: Colors.textPrimary },
  link: { ...TypeScale.bodyStrong, color: Colors.primary, paddingVertical: Spacing.sm },
  twoCol: { flexDirection: 'row', gap: Spacing.md },
  fieldLabel: { ...TypeScale.caption, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  input: {
    ...TypeScale.body,
    color: Colors.textPrimary,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
  },
  formError: { ...TypeScale.body, color: Colors.danger },
  person: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  personAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  personName: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  personMeta: { ...TypeScale.caption, color: Colors.textMuted, marginTop: 2 },
  signOut: { padding: Spacing.lg, gap: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
