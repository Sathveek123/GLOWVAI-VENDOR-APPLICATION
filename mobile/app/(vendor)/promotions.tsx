/**
 * Promotions. Campaign data and creation are not connected to the backend yet, so production
 * shows an honest empty state. Sample campaigns exist only in development builds and are labelled.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

export type CampaignStatus = 'Active' | 'Scheduled' | 'Paused' | 'Ended' | 'Rejected';
export type CampaignType = 'Percentage discount' | 'Flat discount' | 'Bundle offer' | 'Expiry clearance';

export interface CampaignItem {
  id: string;
  name: string;
  type: CampaignType;
  offer: string;
  dates: string;
  status: CampaignStatus;
  redemptions: number;
}

type FilterKey = 'all' | 'active' | 'scheduled' | 'ended';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'ended', label: 'Ended' },
];

// Live campaigns will come from the promotions service. Sample rows are for development review only.
const CAMPAIGNS: CampaignItem[] = __DEV__
  ? [
      {
        id: 'SAMPLE-CAMP-1',
        name: 'Sample: festive skincare sale',
        type: 'Percentage discount',
        offer: '20% off',
        dates: 'Sample dates',
        status: 'Active',
        redemptions: 42,
      },
      {
        id: 'SAMPLE-CAMP-2',
        name: 'Sample: expiry clearance',
        type: 'Expiry clearance',
        offer: '35% off',
        dates: 'Sample dates',
        status: 'Scheduled',
        redemptions: 0,
      },
      {
        id: 'SAMPLE-CAMP-3',
        name: 'Sample: weekend bundle',
        type: 'Bundle offer',
        offer: 'Buy 1, get 1 at 50%',
        dates: 'Sample dates',
        status: 'Ended',
        redemptions: 89,
      },
    ]
  : [];

function matchesFilter(c: CampaignItem, key: FilterKey) {
  if (key === 'all') return true;
  if (key === 'active') return c.status === 'Active';
  if (key === 'scheduled') return c.status === 'Scheduled';
  return c.status === 'Ended';
}

export default function PromotionsScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = {
    active: CAMPAIGNS.filter(c => c.status === 'Active').length,
    scheduled: CAMPAIGNS.filter(c => c.status === 'Scheduled').length,
    ended: CAMPAIGNS.filter(c => c.status === 'Ended').length,
  };
  const rows = CAMPAIGNS.filter(c => matchesFilter(c, filter));
  const filterLabel = FILTERS.find(f => f.key === filter)?.label.toLowerCase() ?? '';

  return (
    <ScreenShell
      header={{ title: 'Promotions', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
    >
      <Text style={s.intro}>Discounts and campaigns for your products.</Text>

      <View style={s.notice}>
        <View style={s.noticeIcon}>
          <Ionicons name="pricetags-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Promotions are not available yet</Text>
          <Text style={s.noticeBody}>
            No campaigns are running from this app. Campaigns you create will be listed here once promotions go live.
          </Text>
        </View>
      </View>

      <View style={s.tiles}>
        <SummaryTile label="Active" value={counts.active} onPress={() => setFilter('active')} selected={filter === 'active'} />
        <SummaryTile label="Scheduled" value={counts.scheduled} onPress={() => setFilter('scheduled')} selected={filter === 'scheduled'} />
        <SummaryTile label="Ended" value={counts.ended} onPress={() => setFilter('ended')} selected={filter === 'ended'} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
        accessibilityRole="tablist"
      >
        {FILTERS.map(f => {
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.8 }]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.card}>
        {rows.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="pricetags-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>
              {CAMPAIGNS.length === 0 ? 'No promotions yet' : `No ${filterLabel} promotions`}
            </Text>
            <Text style={s.emptyBody}>
              {CAMPAIGNS.length === 0
                ? 'Your discounts and campaigns will be listed here.'
                : 'Choose another filter to see other promotions.'}
            </Text>
          </View>
        ) : (
          rows.map((c, i) => (
            <View key={c.id} style={[s.row, i === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={s.nameRow}>
                  <Text style={s.campName} numberOfLines={1}>{c.name}</Text>
                  {c.id.startsWith('SAMPLE') ? (
                    <View style={s.sampleChip}>
                      <Text style={s.sampleChipText}>Sample data</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.campMeta} numberOfLines={1}>{c.type} · {c.offer}</Text>
                <Text style={s.campMeta} numberOfLines={1}>{c.dates} · {c.redemptions} redemptions</Text>
              </View>
              <StatusPill status={c.status} />
            </View>
          ))
        )}
      </View>

      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        style={s.createBtn}
      >
        <Ionicons name="add" size={18} color={Colors.textSubtle} />
        <Text style={s.createText}>Create promotion</Text>
      </Pressable>
      <Text style={s.createHelp}>Creating promotions will be available once promotions go live.</Text>
    </ScreenShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<CampaignStatus, { bg: string; border: string; text: string }> = {
  Active: { bg: Colors.successLight, border: Colors.successBorder, text: '#15803D' },
  Scheduled: { bg: Colors.primaryLight, border: Colors.primaryBorder, text: Colors.primary },
  Paused: { bg: Colors.warningLight, border: Colors.warningBorder, text: '#B45309' },
  Ended: { bg: Colors.surface, border: Colors.border, text: Colors.textSecondary },
  Rejected: { bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
};

function StatusPill({ status }: { status: CampaignStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <View style={[s.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[s.pillText, { color: tone.text }]}>{status}</Text>
    </View>
  );
}

function SummaryTile({
  label,
  value,
  onPress,
  selected,
}: {
  label: string;
  value: number;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [s.tile, selected && s.tileOn, pressed && { opacity: 0.8 }]}
    >
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...TypeScale.body, color: Colors.textSecondary, marginBottom: Spacing.lg },

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

  tiles: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tile: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  tileOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tileValue: { ...TypeScale.metric, color: Colors.textPrimary },
  tileLabel: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },

  chipRow: { gap: Spacing.sm, paddingRight: Spacing.lg, marginBottom: Spacing.md },
  chip: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { ...TypeScale.bodyStrong, color: Colors.textSecondary },
  chipTextOn: { color: Colors.primary },

  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  campName: { ...TypeScale.bodyStrong, color: Colors.textPrimary, flexShrink: 1 },
  campMeta: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 2 },
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

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { ...TypeScale.title, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, maxWidth: 360 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    marginTop: Spacing.xl,
    borderRadius: BorderRadii.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  createText: { ...TypeScale.bodyStrong, color: Colors.textSubtle },
  createHelp: { ...TypeScale.caption, color: Colors.textSubtle, textAlign: 'center', marginTop: Spacing.sm },
});
