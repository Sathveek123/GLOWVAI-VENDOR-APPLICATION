/**
 * Team access. Lists the store owner from the live account. Staff invitations are not
 * connected yet, so the invite action is shown as unavailable rather than working halfway.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { vendorApi } from '../../src/services/api';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type LoadState = 'loading' | 'ready' | 'error';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Invited' | 'Suspended';
}

// Development-only sample staff, so the list layout can be reviewed. Never shown in production.
const SAMPLE_STAFF: TeamMember[] = __DEV__
  ? [
      { id: 'SAMPLE-1', name: 'Sample store manager', role: 'Store manager', status: 'Active' },
      { id: 'SAMPLE-2', name: 'Sample packer', role: 'Packer', status: 'Invited' },
    ]
  : [];

export default function TeamScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [owner, setOwner] = useState<{ name: string; email?: string } | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await vendorApi.me();
      const v = res?.vendor || {};
      setOwner({ name: v.name || v.shopName || 'Store owner', email: v.email || undefined });
      setState('ready');
    } catch (_) {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenShell
      header={{ title: 'Team', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
    >
      {state === 'error' ? (
        <View style={s.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.errorTitle}>We could not load your team</Text>
            <Text style={s.errorBody}>Check your connection and try again.</Text>
          </View>
          <Pressable onPress={load} accessibilityRole="button" style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.7 }]}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={s.sectionLabel}>Members</Text>
      <View style={s.card}>
        {state === 'loading' ? (
          <View style={s.loading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={s.loadingText}>Loading your account</Text>
          </View>
        ) : owner ? (
          <MemberRow
            name={owner.name}
            detail={owner.email || 'Account owner'}
            role="Owner"
            status="Active"
          />
        ) : null}

        {__DEV__
          ? SAMPLE_STAFF.map(m => <MemberRow key={m.id} name={m.name} detail={m.role} role={m.role} status={m.status} sample />)
          : null}

        {state === 'ready' && !__DEV__ ? (
          <Text style={s.note}>No staff accounts yet.</Text>
        ) : null}
      </View>

      <Text style={s.sectionLabel}>Invite staff</Text>
      <View style={s.notice}>
        <View style={s.noticeIcon}>
          <Ionicons name="people-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Staff invitations are not available yet</Text>
          <Text style={s.noticeBody}>
            Store managers, packers and inventory staff can be invited once team management is connected. No invitations are sent from this screen today.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(vendor)/security')}
        accessibilityRole="button"
        accessibilityLabel="Open security settings"
        style={({ pressed }) => [s.linkCard, pressed && { backgroundColor: Colors.surface }]}
      >
        <Text style={s.linkText}>Security and sign-in</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
      </Pressable>
    </ScreenShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<TeamMember['status'], { bg: string; border: string; text: string }> = {
  Active: { bg: Colors.successLight, border: Colors.successBorder, text: '#15803D' },
  Invited: { bg: Colors.warningLight, border: Colors.warningBorder, text: '#B45309' },
  Suspended: { bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
};

function MemberRow({
  name,
  detail,
  role,
  status,
  sample,
}: {
  name: string;
  detail: string;
  role: string;
  status: TeamMember['status'];
  sample?: boolean;
}) {
  const tone = STATUS_TONE[status];
  return (
    <View style={s.member}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.nameRow}>
          <Text style={s.memberName} numberOfLines={1}>{name}</Text>
          {sample ? (
            <View style={s.sampleChip}>
              <Text style={s.sampleChipText}>Sample data</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.memberDetail} numberOfLines={1}>{detail}</Text>
        <Text style={s.memberRole}>{role}</Text>
      </View>
      <View style={[s.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <Text style={[s.pillText, { color: tone.text }]}>{status}</Text>
      </View>
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

  sectionLabel: { ...TypeScale.label, color: Colors.textSecondary, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  loadingText: { ...TypeScale.body, color: Colors.textSecondary },
  note: { ...TypeScale.body, color: Colors.textSecondary, paddingVertical: Spacing.md },

  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...TypeScale.bodyStrong, color: Colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  memberName: { ...TypeScale.bodyStrong, color: Colors.textPrimary, flexShrink: 1 },
  memberDetail: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 1 },
  memberRole: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 1 },
  sampleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  sampleChipText: { ...TypeScale.label, color: '#B45309' },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadii.pill, borderWidth: 1, alignSelf: 'flex-start' },
  pillText: { ...TypeScale.label },

  notice: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noticeIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  noticeBody: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 2 },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: { ...TypeScale.bodyStrong, color: Colors.primary },
});
