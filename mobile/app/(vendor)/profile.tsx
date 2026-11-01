/**
 * Account and store profile. Everything shown comes from the signed-in account (GET /api/vendor/me).
 * Fields the account does not have yet read "Not added yet" instead of placeholder details.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { vendorApi } from '../../src/services/api';
import { clearSession, getSession } from '../../src/services/session';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type LoadState = 'loading' | 'ready' | 'error';

/** The fields the backend accepts on PATCH /api/vendor/:vendorId, as the form edits them. */
interface Draft {
  name: string;
  shopName: string;
  email: string;
  address: string;
  locality: string;
  city: string;
  pinCode: string;
  openTime: string;
  closeTime: string;
}

interface Account extends Partial<Draft> {
  vendorId?: string;
  storeId?: string;
  phone?: string;
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  verificationStatus?: string;
  kycRejectionReason?: string | null;
  bankName?: string;
  accountNumber?: string;
  isOnline?: boolean;
}

function toDraft(a: Account): Draft {
  return {
    name: a.name || '',
    shopName: a.shopName || '',
    email: a.email || '',
    address: a.address || '',
    locality: a.locality || '',
    city: a.city || '',
    pinCode: a.pinCode || '',
    openTime: a.openTime || '',
    closeTime: a.closeTime || '',
  };
}

/** Shows only the last four digits of a phone number or account number. */
function maskDigits(value?: string | null, prefix = '••••••'): string | null {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `${prefix}${digits.slice(-4)}`;
}

const NOT_ADDED = 'Not added yet';

export default function ProfileScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await vendorApi.me();
      setAccount(res?.vendor || {});
      setState('ready');
    } catch (_) {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = () => {
    if (!account) return;
    setDraft(toDraft(account));
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };

  const update = (key: keyof Draft, value: string) => {
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!draft || !account) return;
    const name = draft.name.trim();
    const shopName = draft.shopName.trim();
    const email = draft.email.trim();
    if (!name || !shopName) {
      setSaveError('Owner name and store name are required.');
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setSaveError('Enter a valid email address.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const session = await getSession();
      const vendorId = account.vendorId || session.vendorId;
      if (!vendorId) throw new Error('No vendor id');
      const payload: Draft = {
        ...draft,
        name,
        shopName,
        email,
        address: draft.address.trim(),
        locality: draft.locality.trim(),
        city: draft.city.trim(),
        pinCode: draft.pinCode.trim(),
        openTime: draft.openTime.trim(),
        closeTime: draft.closeTime.trim(),
      };
      const res = await vendorApi.updateProfile(vendorId, payload);
      setAccount({ ...account, ...(res?.vendor || payload) });
      setEditing(false);
      setDraft(null);
    } catch (_) {
      setSaveError('Your changes were not saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await clearSession();
    router.replace('/(auth)/login');
  };

  const shown = (value?: string | null) => (value && value.trim() ? value : NOT_ADDED);
  const kyc = account?.kycStatus || account?.verificationStatus;
  const kycTone = KYC_TONE[kyc as keyof typeof KYC_TONE] || KYC_TONE.NONE;
  const initial = (account?.shopName || account?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <ScreenShell
      header={{ title: 'Account', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
      keyboardAvoiding={editing}
    >
      {state === 'error' ? (
        <View style={s.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.errorTitle}>We could not load your account</Text>
            <Text style={s.errorBody}>Check your connection and try again.</Text>
          </View>
          <Pressable onPress={load} accessibilityRole="button" style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.7 }]}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {state === 'loading' ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.loadingText}>Loading your account</Text>
        </View>
      ) : (
        <>
          {/* Identity */}
          <View style={s.identity}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.storeName} numberOfLines={2}>{shown(account?.shopName)}</Text>
              <Text style={s.ownerName} numberOfLines={1}>{shown(account?.name)}</Text>
              <View style={[s.pill, { backgroundColor: kycTone.bg, borderColor: kycTone.border }]}>
                <Text style={[s.pillText, { color: kycTone.text }]}>{kycTone.label}</Text>
              </View>
            </View>
          </View>

          {editing && draft ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Edit details</Text>
              <Field label="Owner name" value={draft.name} onChangeText={v => update('name', v)} autoCapitalize="words" />
              <Field label="Store name" value={draft.shopName} onChangeText={v => update('shopName', v)} autoCapitalize="words" />
              <Field label="Email" value={draft.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Address" value={draft.address} onChangeText={v => update('address', v)} autoCapitalize="sentences" />
              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="Locality" value={draft.locality} onChangeText={v => update('locality', v)} autoCapitalize="words" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="City" value={draft.city} onChangeText={v => update('city', v)} autoCapitalize="words" />
                </View>
              </View>
              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="PIN code" value={draft.pinCode} onChangeText={v => update('pinCode', v)} keyboardType="number-pad" maxLength={6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Opens" value={draft.openTime} onChangeText={v => update('openTime', v)} placeholder="09:00 AM" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Closes" value={draft.closeTime} onChangeText={v => update('closeTime', v)} placeholder="10:00 PM" />
                </View>
              </View>

              {saveError ? (
                <Text style={s.formError} accessibilityRole="alert">{saveError}</Text>
              ) : null}

              <View style={s.formActions}>
                <Pressable
                  onPress={cancelEditing}
                  disabled={saving}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={s.secondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={saving}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.primaryBtn, (pressed || saving) && { opacity: 0.85 }]}
                >
                  {saving ? <ActivityIndicator color={Colors.background} /> : <Text style={s.primaryText}>Save changes</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={startEditing}
              accessibilityRole="button"
              accessibilityLabel="Edit store details"
              style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={s.editText}>Edit details</Text>
            </Pressable>
          )}

          <Text style={s.sectionLabel}>Store details</Text>
          <View style={s.card}>
            <Row label="Owner name" value={shown(account?.name)} />
            <Row label="Store name" value={shown(account?.shopName)} />
            <Row label="Phone" value={maskDigits(account?.phone) || NOT_ADDED} />
            <Row label="Email" value={shown(account?.email)} />
            <Row label="Address" value={shown(account?.address)} />
            <Row label="Locality" value={shown(account?.locality)} />
            <Row label="City" value={shown(account?.city)} />
            <Row label="PIN code" value={shown(account?.pinCode)} last />
          </View>

          <Text style={s.sectionLabel}>Opening hours</Text>
          <View style={s.card}>
            <Row label="Opens" value={shown(account?.openTime)} />
            <Row label="Closes" value={shown(account?.closeTime)} last />
          </View>

          <Text style={s.sectionLabel}>Payouts</Text>
          <View style={s.card}>
            <Row label="Bank" value={shown(account?.bankName)} />
            <Row label="Account" value={maskDigits(account?.accountNumber, '•••• ') || NOT_ADDED} />
            <LinkRow label="Manage bank account" onPress={() => router.push('/(vendor)/bank-edit')} last />
          </View>

          <Text style={s.sectionLabel}>Verification</Text>
          <View style={s.card}>
            <Row label="Status" value={kycTone.label} />
            {account?.kycRejectionReason ? (
              <Row label="Reason" value={account.kycRejectionReason} />
            ) : null}
            <LinkRow label="Tax and documents" onPress={() => router.push('/(vendor)/tax-documents')} last />
          </View>

          <Text style={s.sectionLabel}>Security</Text>
          <View style={s.card}>
            <LinkRow label="Security and sign-in" onPress={() => router.push('/(vendor)/security')} last />
          </View>

          <Text style={s.sectionLabel}>Help</Text>
          <View style={s.card}>
            <LinkRow label="Help and support" onPress={() => router.push('/(vendor)/support')} last />
          </View>

          <Text style={s.sectionLabel}>Session</Text>
          <View style={s.card}>
            <View style={s.signOutBox}>
              {!confirmingSignOut ? (
                <Pressable
                  onPress={() => setConfirmingSignOut(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.dangerOutline, pressed && { opacity: 0.8 }]}
                >
                  <Text style={s.dangerOutlineText}>Sign out</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={s.signOutBody}>Sign out of GlowVAI on this device now?</Text>
                  <View style={s.confirmRow}>
                    <Pressable
                      onPress={() => setConfirmingSignOut(false)}
                      disabled={signingOut}
                      accessibilityRole="button"
                      style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={s.secondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={signOut}
                      disabled={signingOut}
                      accessibilityRole="button"
                      style={({ pressed }) => [s.dangerSolid, (pressed || signingOut) && { opacity: 0.8 }]}
                    >
                      {signingOut ? <ActivityIndicator color={Colors.background} /> : <Text style={s.dangerSolidText}>Sign out</Text>}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </>
      )}
    </ScreenShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const KYC_TONE = {
  APPROVED: { label: 'Approved', bg: Colors.successLight, border: Colors.successBorder, text: '#15803D' },
  PENDING: { label: 'Under review', bg: Colors.warningLight, border: Colors.warningBorder, text: '#B45309' },
  REJECTED: { label: 'Rejected', bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
  NONE: { label: 'Not submitted', bg: Colors.surface, border: Colors.border, text: Colors.textSecondary },
};

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const missing = value === NOT_ADDED;
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, missing && { color: Colors.textSubtle }]} selectable>{value}</Text>
    </View>
  );
}

function LinkRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.linkRow, last && { borderBottomWidth: 0 }, pressed && { backgroundColor: Colors.surface }]}
    >
      <Text style={s.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  maxLength?: number;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || NOT_ADDED}
        placeholderTextColor={Colors.textSubtle}
        accessibilityLabel={label}
        autoCorrect={false}
        style={s.fieldInput}
        {...rest}
      />
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  errorTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  errorBody: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },
  retryBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  retryText: { ...TypeScale.bodyStrong, color: Colors.primary },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  loadingText: { ...TypeScale.body, color: Colors.textSecondary },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...TypeScale.title, color: Colors.primary },
  storeName: { ...TypeScale.title, color: Colors.textPrimary },
  ownerName: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 2 },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadii.pill, borderWidth: 1, alignSelf: 'flex-start', marginTop: Spacing.sm },
  pillText: { ...TypeScale.label },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.background,
    marginBottom: Spacing.lg,
  },
  editText: { ...TypeScale.bodyStrong, color: Colors.primary },

  sectionLabel: { ...TypeScale.label, color: Colors.textSecondary, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: { ...TypeScale.title, color: Colors.textPrimary, paddingTop: Spacing.lg, marginBottom: Spacing.md },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { ...TypeScale.body, color: Colors.textSecondary, flexShrink: 0 },
  rowValue: { ...TypeScale.bodyStrong, color: Colors.textPrimary, textAlign: 'right', flexShrink: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: { ...TypeScale.bodyStrong, color: Colors.primary },

  field: { marginBottom: Spacing.md },
  fieldLabel: { ...TypeScale.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  fieldInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.md,
    ...TypeScale.body,
    color: Colors.textPrimary,
  },
  twoCol: { flexDirection: 'row', gap: Spacing.sm },
  formError: { ...TypeScale.body, color: Colors.danger, marginBottom: Spacing.md },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, paddingBottom: Spacing.lg },
  primaryBtn: {
    minHeight: 44,
    minWidth: 140,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryText: { ...TypeScale.bodyStrong, color: Colors.background },
  secondaryBtn: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  secondaryText: { ...TypeScale.bodyStrong, color: Colors.textPrimary },

  signOutBox: { paddingVertical: Spacing.lg },
  signOutBody: { ...TypeScale.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  dangerOutline: {
    minHeight: 44,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
  },
  dangerOutlineText: { ...TypeScale.bodyStrong, color: Colors.danger },
  confirmRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  dangerSolid: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  dangerSolidText: { ...TypeScale.bodyStrong, color: Colors.background },
});
