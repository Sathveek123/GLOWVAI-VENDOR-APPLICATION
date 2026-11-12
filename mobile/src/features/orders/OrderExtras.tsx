/**
 * Read-only order details for the store: the customer's substitution preference (the pack screen
 * must show it) and the stages the order has reached. Neither can be changed from the app.
 * File: mobile/src/features/orders/OrderExtras.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';
import { FontFamily, TypeScale } from '../../theme/typography';
import { SUBSTITUTION_LABEL, type SubstitutionPreference, type TimelineEvent, type TimelineStage } from '../../services/vendorApi/orders';
import { formatDayTime } from './model';
import { Card } from './ui';

export interface SubstitutionView {
  label: string;
  /** What the store should do, in plain words. */
  guidance: string;
  tone: 'info' | 'warning' | 'neutral';
}

/** Display mapping for the substitution preference. Null (unknown or missing) shows no guidance. */
export function substitutionView(pref: SubstitutionPreference | null | undefined): SubstitutionView | null {
  if (!pref) return null;
  switch (pref) {
    case 'ALLOW_SUBSTITUTE':
      return {
        label: SUBSTITUTION_LABEL.ALLOW_SUBSTITUTE,
        guidance: 'If an item is out of stock, GlowVai may send a similar item instead.',
        tone: 'info',
      };
    case 'NO_SUBSTITUTE':
      return {
        label: SUBSTITUTION_LABEL.NO_SUBSTITUTE,
        guidance: 'Do not swap any item. If something is missing, contact GlowVai support before packing.',
        tone: 'warning',
      };
    case 'CALL_ME':
      return {
        label: SUBSTITUTION_LABEL.CALL_ME,
        guidance: 'Do not change anything without calling the customer through GlowVai support first.',
        tone: 'warning',
      };
    default:
      return null;
  }
}

const STAGE_LABEL: Record<TimelineStage, string> = {
  ACCEPTED: 'Accepted by your store',
  PACKED: 'Packed',
  HANDED_TO_RIDER: 'Handed to the delivery partner',
};

/** The order's reached stages, oldest first. Pure: only labels and times, no customer details. */
export function timelineRows(events: TimelineEvent[] | undefined): { key: string; label: string; time: string }[] {
  const order: TimelineStage[] = ['ACCEPTED', 'PACKED', 'HANDED_TO_RIDER'];
  return order
    .map(stage => events?.find(e => e.stage === stage))
    .filter((e): e is TimelineEvent => !!e)
    .map(e => ({ key: e.stage, label: STAGE_LABEL[e.stage], time: e.at ? formatDayTime(e.at) : 'Time not recorded' }));
}

export function SubstitutionCard({ preference }: { preference: SubstitutionPreference | null | undefined }) {
  const view = substitutionView(preference);
  return (
    <Card style={s.card}>
      <View style={s.head}>
        <Ionicons name="swap-horizontal-outline" size={18} color={Colors.primary} />
        <Text style={s.title}>Substitution preference</Text>
      </View>
      {view ? (
        <>
          <Text style={s.value}>{view.label}</Text>
          <Text style={s.body}>{view.guidance}</Text>
        </>
      ) : (
        <Text style={s.body}>The customer has not chosen a substitution preference. Contact GlowVai support before making any change.</Text>
      )}
      <View style={s.lock}>
        <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
        <Text style={s.lockText}>Set by the customer. Vendors cannot change this.</Text>
      </View>
    </Card>
  );
}

export function OrderTimeline({ events }: { events: TimelineEvent[] | undefined }) {
  const rows = timelineRows(events);
  return (
    <Card style={s.card}>
      <Text style={s.title}>Order progress</Text>
      {rows.length === 0 ? (
        <Text style={s.body}>No progress recorded yet.</Text>
      ) : (
        rows.map((r, i) => (
          <View key={r.key} style={s.stage} accessible accessibilityLabel={`${r.label}, ${r.time}`}>
            <View style={s.dotCol}>
              <View style={s.dot} />
              {i < rows.length - 1 ? <View style={s.line} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: Spacing.sm }}>
              <Text style={s.stageLabel}>{r.label}</Text>
              <Text style={s.body}>{r.time}</Text>
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: Spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  value: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  body: { ...TypeScale.caption, color: Colors.textSecondary, lineHeight: 18 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  lockText: { ...TypeScale.caption, color: Colors.textMuted },
  stage: { flexDirection: 'row', gap: Spacing.md, minHeight: 44 },
  dotCol: { width: 14, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: Colors.primaryBorder, marginTop: 2 },
  stageLabel: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
});
