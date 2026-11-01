/**
 * Compliance and audit trail for the store.
 * The audit service is not connected yet, so production shows an honest empty state.
 * Sample records exist only in development builds and are labelled as sample data.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

export type AuditCategory =
  | 'Order Fulfillment'
  | 'Inventory Adjustments'
  | 'Batch & Expiry'
  | 'Returns & Refunds'
  | 'Bank & Payout'
  | 'KYC & Documents'
  | 'Team Access'
  | 'Security Events';

export type AuditResultStatus = 'Success' | 'Pending Review' | 'Flagged Finding' | 'Blocked';

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  category: AuditCategory;
  actorName: string;
  actionType: string;
  objectRefId: string;
  previousState: string;
  newState: string;
  source: string;
  resultStatus: AuditResultStatus;
  linkedSupportTicket?: string;
}

const CATEGORIES: { category: AuditCategory; description: string }[] = [
  { category: 'Order Fulfillment', description: 'Acceptance, packing and handover timestamps.' },
  { category: 'Inventory Adjustments', description: 'Manual stock changes, wastage and stock intake.' },
  { category: 'Batch & Expiry', description: 'Lot registration and expiry clearance.' },
  { category: 'Returns & Refunds', description: 'Return inspections and refund approvals.' },
  { category: 'Bank & Payout', description: 'Bank account changes and settlements.' },
  { category: 'KYC & Documents', description: 'Licence and tax document uploads.' },
  { category: 'Team Access', description: 'Staff invitations and role changes.' },
  { category: 'Security Events', description: 'Sign-ins and blocked access attempts.' },
];

// Live records will come from the audit service. Sample records are for development review only.
const EVENTS: AuditEventRecord[] = __DEV__
  ? [
      {
        id: 'EVT-SAMPLE-01',
        timestamp: 'Sample, today 08:12 AM',
        category: 'Order Fulfillment',
        actorName: 'Sample staff member',
        actionType: 'ORDER_PACKED',
        objectRefId: 'SAMPLE-ORDER-01',
        previousState: 'Accepted',
        newState: 'Packed',
        source: 'Vendor app, counter device',
        resultStatus: 'Success',
      },
      {
        id: 'EVT-SAMPLE-02',
        timestamp: 'Sample, yesterday 04:15 PM',
        category: 'Bank & Payout',
        actorName: 'Sample owner',
        actionType: 'PAYOUT_BANK_UPDATE_REQUESTED',
        objectRefId: 'SAMPLE-BANK-01',
        previousState: 'Bank account A',
        newState: 'Bank account B (cooling period)',
        source: 'Web portal',
        resultStatus: 'Pending Review',
      },
      {
        id: 'EVT-SAMPLE-03',
        timestamp: 'Sample, Oct 05 11:18 AM',
        category: 'Security Events',
        actorName: 'Unknown actor',
        actionType: 'SIGN_IN_BLOCKED',
        objectRefId: 'SAMPLE-AUTH-01',
        previousState: 'Challenge issued',
        newState: 'Access blocked',
        source: 'Unrecognised location',
        resultStatus: 'Flagged Finding',
        linkedSupportTicket: 'SAMPLE-TKT-01',
      },
    ]
  : [];

export default function ComplianceScreen() {
  const [category, setCategory] = useState<'all' | AuditCategory>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const term = query.trim().toLowerCase();
  const rows = EVENTS.filter(evt => {
    if (category !== 'all' && evt.category !== category) return false;
    if (!term) return true;
    return [evt.id, evt.objectRefId, evt.actionType, evt.actorName].some(v => v.toLowerCase().includes(term));
  });
  const hasRecords = EVENTS.length > 0;
  const filtersOn = category !== 'all' || term.length > 0;
  const selectedCategory = CATEGORIES.find(c => c.category === category);

  const clearFilters = () => {
    setCategory('all');
    setQuery('');
  };

  return (
    <ScreenShell
      header={{ title: 'Compliance', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
    >
      <Text style={s.intro}>
        Activity for your store in one audit trail: orders, inventory, payouts, team changes and sign-ins.
      </Text>

      <View style={s.notice}>
        <View style={s.noticeIcon}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Audit service not connected yet</Text>
          <Text style={s.noticeBody}>
            {__DEV__
              ? 'Sample rows below are for layout review only. Live activity will appear here once the audit service is connected.'
              : 'Activity from your store will appear here once the audit service is connected. Report exports are not available yet.'}
          </Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
        accessibilityRole="tablist"
      >
        {[{ key: 'all' as const, label: 'All categories' }, ...CATEGORIES.map(c => ({ key: c.category, label: c.category }))].map(opt => {
          const on = category === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setCategory(opt.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.8 }]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selectedCategory ? <Text style={s.categoryHelp}>{selectedCategory.description}</Text> : null}

      <View style={s.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textSubtle} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by ID, reference, action or name"
          placeholderTextColor={Colors.textSubtle}
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search audit records"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            style={s.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Activity</Text>
          {__DEV__ ? (
            <View style={s.sampleChip}>
              <Text style={s.sampleChipText}>Sample data</Text>
            </View>
          ) : null}
        </View>

        {!hasRecords ? (
          <EmptyState
            icon="document-text-outline"
            title="No audit records yet"
            body="Orders, stock changes, payouts, team changes and sign-ins will be listed here as they happen."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No records match"
            body="Try another category or search term."
            action={filtersOn ? { label: 'Clear filters', onPress: clearFilters } : undefined}
          />
        ) : (
          rows.map((evt, i) => {
            const open = expandedId === evt.id;
            return (
              <Pressable
                key={evt.id}
                onPress={() => setExpandedId(open ? null : evt.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${evt.actionType}, ${evt.resultStatus}, ${evt.timestamp}`}
                style={({ pressed }) => [s.row, i === 0 && { borderTopWidth: 0 }, pressed && { backgroundColor: Colors.surface }]}
              >
                <View style={s.rowMain}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.action} numberOfLines={1}>{evt.actionType}</Text>
                    <Text style={s.meta} numberOfLines={1}>{evt.timestamp} · {evt.actorName}</Text>
                  </View>
                  <ResultPill status={evt.resultStatus} />
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.textSubtle}
                    style={{ marginLeft: Spacing.sm }}
                  />
                </View>

                {open ? (
                  <View style={s.details}>
                    <DetailRow label="Category" value={evt.category} />
                    <DetailRow label="Reference" value={evt.objectRefId} mono />
                    <DetailRow label="Previous state" value={evt.previousState} />
                    <DetailRow label="New state" value={evt.newState} />
                    <DetailRow label="Source" value={evt.source} />
                    {evt.linkedSupportTicket ? (
                      <DetailRow label="Support case" value={evt.linkedSupportTicket} mono />
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </View>
    </ScreenShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const RESULT_TONE: Record<AuditResultStatus, { bg: string; border: string; text: string }> = {
  Success: { bg: Colors.successLight, border: Colors.successBorder, text: '#15803D' },
  'Pending Review': { bg: Colors.surface, border: Colors.border, text: Colors.textSecondary },
  'Flagged Finding': { bg: Colors.warningLight, border: Colors.warningBorder, text: '#B45309' },
  Blocked: { bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
};

function ResultPill({ status }: { status: AuditResultStatus }) {
  const tone = RESULT_TONE[status];
  return (
    <View style={[s.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[s.pillText, { color: tone.text }]}>{status}</Text>
    </View>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, mono && { fontFamily: FontFamily.mono }]}>{value}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [s.emptyAction, pressed && { opacity: 0.8 }]}
        >
          <Text style={s.emptyActionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
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
    marginBottom: Spacing.xl,
  },
  noticeIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  noticeBody: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 2 },

  sectionLabel: { ...TypeScale.label, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: Spacing.sm },
  chipRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
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
  categoryHelp: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: Spacing.sm, marginBottom: Spacing.md },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadii.input,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchInput: { flex: 1, ...TypeScale.body, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -Spacing.md },

  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: { ...TypeScale.title, color: Colors.textPrimary },
  sampleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  sampleChipText: { ...TypeScale.label, color: '#B45309' },

  row: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  action: { fontFamily: FontFamily.mono, fontSize: 13, lineHeight: 18, color: Colors.primary },
  meta: { ...TypeScale.caption, color: Colors.textSubtle, marginTop: 2 },
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: { ...TypeScale.label },

  details: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  detailLabel: { ...TypeScale.caption, color: Colors.textSubtle, flexShrink: 0 },
  detailValue: { ...TypeScale.caption, color: Colors.textPrimary, textAlign: 'right', flexShrink: 1 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { ...TypeScale.title, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, maxWidth: 360 },
  emptyAction: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  emptyActionText: { ...TypeScale.bodyStrong, color: Colors.primary },
});
