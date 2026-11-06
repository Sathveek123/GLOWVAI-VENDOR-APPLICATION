/**
 * Verification and compliance: the store's approval state from GET /api/vendor/me, any note or
 * document request from GlowVai's team, and the tax details on file.
 *
 * Documents are not uploaded from the app (no file storage yet); GlowVai's team collects them
 * directly, and the screen says so instead of showing upload slots.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Button, Card, ErrorCard, InfoRow, LoadingCard, Note, Pill, SectionLabel, page } from '../../src/features/money/ui';
import { changeRequestRoute, stateView } from '../../src/features/profile/account';
import { useVendorMe } from '../../src/services/vendorApi/account';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

const fmtDate = (ms?: number | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function VerificationScreen() {
  const router = useRouter();
  const { me, loading, error, refresh } = useVendorMe();
  const app = me?.vendor.application ?? null;
  const v = me ? stateView(me.vendor.state) : null;
  const docs = me?.vendor.requestedDocuments ?? [];
  const reason = (me?.vendor.reason || '').trim();

  return (
    <ScreenShell header={{ title: 'Verification', showBack: true }} backgroundColor={Colors.canvas}>
      <View style={page.body}>
        {!me && loading ? <LoadingCard label="Loading your verification status" /> : null}
        {!me && error ? <ErrorCard title="Could not load your verification status" message={error} onRetry={refresh} /> : null}

        {me && v ? (
          <>
            <Card style={{ gap: Spacing.sm }}>
              <Text style={s.label}>Store status</Text>
              <Pill label={v.label} tone={v.tone} />
              {v.banner ? <Text style={s.body}>{v.banner}</Text> : null}
              {reason ? (
                <View style={s.reason}>
                  <Text style={s.reasonLabel}>Note from GlowVai’s team</Text>
                  <Text style={s.reasonText}>{reason}</Text>
                </View>
              ) : null}
            </Card>

            <SectionLabel>Documents</SectionLabel>
            <Card style={{ gap: Spacing.sm }}>
              {docs.length ? (
                <>
                  <Text style={s.title}>Our team asked for</Text>
                  {docs.map(d => (
                    <Text key={d} style={s.body}>
                      {'• '}
                      {d}
                    </Text>
                  ))}
                </>
              ) : null}
              <Text style={s.body}>
                Documents can’t be uploaded in the app yet. Our team will contact you to verify documents such as your PAN card,
                GST certificate and a photo of your shop front.
              </Text>
            </Card>

            <SectionLabel>Details on file</SectionLabel>
            <Card padded={false}>
              <InfoRow label="PAN" value={app?.panLast4 ? `Ending in ${app.panLast4}` : 'Not added'} mono={!!app?.panLast4} muted={!app?.panLast4} />
              <InfoRow label="GSTIN" value={app?.gstNumber || 'Not GST-registered'} mono={!!app?.gstNumber} muted={!app?.gstNumber} />
              <InfoRow label="Registration number" value={app?.businessRegistrationNumber || 'Not added'} muted={!app?.businessRegistrationNumber} />
              <InfoRow label="Application submitted" value={fmtDate(app?.submittedAt) || 'Not available'} muted={!app?.submittedAt} last />
            </Card>

            <Button
              label="Request a change"
              variant="secondary"
              icon="create-outline"
              onPress={() => router.push(changeRequestRoute('Change my tax or registration details') as never)}
            />
            <Note>A history of changes to your store is not shown in the app yet.</Note>
          </>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  label: { ...TypeScale.caption, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  title: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  body: { ...TypeScale.body, color: Colors.textSecondary },
  reason: { marginTop: Spacing.sm, padding: Spacing.md, borderRadius: 10, backgroundColor: Colors.surface, gap: 2 },
  reasonLabel: { ...TypeScale.caption, fontFamily: FontFamily.semibold, color: Colors.textSecondary },
  reasonText: { ...TypeScale.body, color: Colors.textPrimary },
});
