/**
 * Profile (PRD screen 25): the store as GlowVai verified it, read from GET /api/vendor/me.
 *
 * Read-only. Store, address, tax and bank details were checked by GlowVai's team, so a change
 * goes through a support ticket ("Request a change"), never a silent edit.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Button, Card, ErrorCard, InfoRow, LinkRow, LoadingCard, Note, Pill, SectionLabel, page } from '../../src/features/money/ui';
import {
  addressText,
  bankSummary,
  categoriesText,
  changeRequestRoute,
  formatContact,
  hoursText,
  stateView,
} from '../../src/features/profile/account';
import { useVendorMe } from '../../src/services/vendorApi/account';
import { signOutVendor } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

const NOT_ADDED = 'Not added';

export default function ProfileScreen() {
  const router = useRouter();
  const { me, loading, error, refresh } = useVendorMe();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await signOutVendor();
    router.replace('/(auth)/login');
  };

  const app = me?.vendor.application ?? null;
  const v = me ? stateView(me.vendor.state) : null;
  const initial = (app?.storeName || app?.ownerName || 'G').trim().charAt(0).toUpperCase();
  const pins = app?.servicePincodes ?? [];

  return (
    <ScreenShell header={{ title: 'Profile' }} backgroundColor={Colors.canvas} contentContainerStyle={s.content}>
      <View style={page.body}>
        {!me && loading ? <LoadingCard label="Loading your profile" /> : null}
        {!me && error ? <ErrorCard title="Could not load your profile" message={error} onRetry={refresh} /> : null}

        {me && v ? (
          <>
            {error ? <Note icon="cloud-offline-outline">{`${error} Showing the details we loaded earlier.`}</Note> : null}

            <Card style={s.identity}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text style={s.storeName} numberOfLines={2}>
                  {app?.storeName || 'Store name not added'}
                </Text>
                {app?.ownerName ? <Text style={s.owner}>{app.ownerName}</Text> : null}
                <Pill label={v.label} tone={v.tone} />
              </View>
            </Card>

            {v.banner ? (
              <Card style={[s.banner, v.tone === 'danger' ? s.bannerDanger : s.bannerWarn]}>
                <Text style={s.bannerText} accessibilityRole="alert">
                  {v.banner}
                </Text>
                <Button label="Contact support" variant="secondary" icon="help-buoy-outline" onPress={() => router.push('/(vendor)/support')} />
              </Card>
            ) : null}

            <SectionLabel>Store</SectionLabel>
            <Card padded={false}>
              <InfoRow label="Contact mobile" value={formatContact(app?.contactNumber) || NOT_ADDED} muted={!app?.contactNumber} />
              <InfoRow label="Account email" value={me.account.email || app?.email || NOT_ADDED} />
              <InfoRow label="Categories" value={categoriesText(app?.categories) || NOT_ADDED} muted={!app?.categories?.length} />
              <InfoRow label="Opening hours" value={hoursText(app?.operatingHours) || NOT_ADDED} muted={!app?.operatingHours} last />
            </Card>

            <SectionLabel>Location and delivery area</SectionLabel>
            <Card padded={false}>
              <InfoRow label="Registered address" value={addressText(app) || NOT_ADDED} muted={!app} />
              <InfoRow
                label="Delivers to"
                value={pins.length ? `${pins.length} pincode${pins.length === 1 ? '' : 's'}: ${pins.join(', ')}` : NOT_ADDED}
                muted={!pins.length}
                last
              />
            </Card>

            <SectionLabel>Business and tax</SectionLabel>
            <Card padded={false}>
              <InfoRow label="PAN" value={app?.panLast4 ? `Ending in ${app.panLast4}` : NOT_ADDED} mono={!!app?.panLast4} muted={!app?.panLast4} />
              <InfoRow label="GSTIN" value={app?.gstNumber || 'Not GST-registered'} mono={!!app?.gstNumber} muted={!app?.gstNumber} />
              <InfoRow label="Registration number" value={app?.businessRegistrationNumber || NOT_ADDED} muted={!app?.businessRegistrationNumber} />
              <LinkRow label="Verification" icon="shield-checkmark-outline" detail={v.label} onPress={() => router.push('/(vendor)/compliance')} last />
            </Card>

            <Card style={{ gap: Spacing.md }}>
              <Text style={s.body}>
                Your store details were checked by GlowVai’s team, so changes are made by our team. Send a request and we will
                contact you.
              </Text>
              <Button
                label="Request a change"
                variant="secondary"
                icon="create-outline"
                onPress={() => router.push(changeRequestRoute('Change my store details') as never)}
              />
            </Card>

            <SectionLabel>Payouts</SectionLabel>
            <Card padded={false}>
              <LinkRow label="Bank account" icon="card-outline" detail={bankSummary(app) || 'No account on file'} onPress={() => router.push('/(vendor)/bank-edit')} />
              <LinkRow label="Settlements" icon="swap-horizontal-outline" onPress={() => router.push('/(vendor)/payout-detail')} />
              <LinkRow label="Tax documents" icon="document-text-outline" onPress={() => router.push('/(vendor)/tax-documents')} last />
            </Card>
          </>
        ) : null}

        <SectionLabel>Account</SectionLabel>
        <Card padded={false}>
          <LinkRow label="Sign-in and security" icon="lock-closed-outline" detail="Change your password" onPress={() => router.push('/(vendor)/security')} />
          <LinkRow label="Help and support" icon="help-buoy-outline" onPress={() => router.push('/(vendor)/support')} />
          <LinkRow label="Notifications" icon="notifications-outline" onPress={() => router.push('/(vendor)/notifications')} last />
        </Card>

        <Card style={{ gap: Spacing.md }}>
          {confirmSignOut ? (
            <>
              <Text style={s.body}>Sign out of GlowVai Seller on this device?</Text>
              <View style={s.twoCol}>
                <Button label="Cancel" variant="secondary" onPress={() => setConfirmSignOut(false)} style={{ flex: 1 }} />
                <Button label="Sign out" variant="danger" onPress={signOut} loading={signingOut} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={() => setConfirmSignOut(true)} />
          )}
        </Card>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  content: { paddingBottom: Spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...TypeScale.headline, color: Colors.primary },
  storeName: { ...TypeScale.title, color: Colors.textPrimary },
  owner: { ...TypeScale.body, color: Colors.textSecondary },
  body: { ...TypeScale.body, color: Colors.textSecondary },
  banner: { gap: Spacing.md, borderWidth: 1 },
  bannerWarn: { backgroundColor: Colors.warningLight, borderColor: Colors.warningBorder },
  bannerDanger: { backgroundColor: Colors.dangerLight, borderColor: Colors.dangerBorder },
  bannerText: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  twoCol: { flexDirection: 'row', gap: Spacing.md },
});
