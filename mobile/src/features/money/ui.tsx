/**
 * Calm, shared building blocks for the money, profile and support screens:
 * white cards on the grey canvas, grouped rows, one status pill, and one card for
 * loading, empty, error and "not available yet" states.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BorderRadii, Colors, Spacing } from '../../theme/tokens';
import { FontFamily, TypeScale } from '../../theme/typography';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[k.card, padded && k.cardPad, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={k.sectionLabel} accessibilityRole="header">
      {children}
    </Text>
  );
}

// ── Rows ──────────────────────────────────────────────────────────────────────
/** A label with its value. The value wraps under the label when it is long. */
export function InfoRow({
  label,
  value,
  mono,
  muted,
  last,
  right,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  last?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View style={[k.row, !last && k.rowDivider]} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={k.rowText}>
        <Text style={k.rowLabel}>{label}</Text>
        <Text style={[k.rowValue, mono && k.mono, muted && k.rowValueMuted]} selectable={mono}>
          {value}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** A tappable row that opens another screen. */
export function LinkRow({
  label,
  detail,
  icon,
  onPress,
  last,
  accessibilityHint,
}: {
  label: string;
  detail?: string;
  icon?: IconName;
  onPress: () => void;
  last?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [k.row, k.linkRow, !last && k.rowDivider, pressed && k.pressed]}
    >
      {icon ? (
        <View style={k.rowIcon}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
      ) : null}
      <View style={k.rowText}>
        <Text style={k.linkLabel}>{label}</Text>
        {detail ? <Text style={k.rowDetail}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE: Record<Tone, { bg: string; border: string; dot: string }> = {
  success: { bg: Colors.successLight, border: Colors.successBorder, dot: Colors.success },
  warning: { bg: Colors.warningLight, border: Colors.warningBorder, dot: Colors.warning },
  danger: { bg: Colors.dangerLight, border: Colors.dangerBorder, dot: Colors.danger },
  info: { bg: Colors.primaryLight, border: Colors.primaryBorder, dot: Colors.primary },
  neutral: { bg: Colors.surface, border: Colors.border, dot: Colors.textMuted },
};

/** Tinted pill with a coloured dot. The text stays dark so it passes contrast at 12px. */
export function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <View style={[k.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={[k.pillDot, { backgroundColor: t.dot }]} />
      <Text style={k.pillText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Buttons ───────────────────────────────────────────────────────────────────
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === 'primary';
  const fg = primary ? Colors.background : variant === 'danger' ? Colors.danger : Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        k.btn,
        primary ? k.btnPrimary : variant === 'danger' ? k.btnDanger : k.btnSecondary,
        (disabled || loading) && k.btnDisabled,
        pressed && k.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[k.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Segmented control (radio group) ──────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <View style={k.segment} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [k.segmentItem, selected && k.segmentItemOn, pressed && k.pressed]}
          >
            <Text style={[k.segmentText, selected && k.segmentTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── States ────────────────────────────────────────────────────────────────────
/** One honest card: what this is, why it is empty or failed, and at most one action. */
export function StateCard({
  icon,
  title,
  body,
  action,
  tone = 'info',
  children,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  tone?: 'info' | 'danger';
  children?: React.ReactNode;
}) {
  const danger = tone === 'danger';
  return (
    <Card style={k.state}>
      <View style={[k.stateIcon, danger && { backgroundColor: Colors.dangerLight }]}>
        <Ionicons name={icon} size={22} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <Text style={k.stateTitle} accessibilityRole={danger ? 'alert' : 'header'}>
        {title}
      </Text>
      {body ? <Text style={k.stateBody}>{body}</Text> : null}
      {children}
      {action ? <Button label={action.label} onPress={action.onPress} variant={danger ? 'primary' : 'secondary'} style={k.stateBtn} /> : null}
    </Card>
  );
}

export function ErrorCard({ message, onRetry, title = 'Could not load this' }: { message: string; onRetry: () => void; title?: string }) {
  return <StateCard icon="cloud-offline-outline" tone="danger" title={title} body={message} action={{ label: 'Retry', onPress: onRetry }} />;
}

export function LoadingCard({ label }: { label: string }) {
  return (
    <Card style={k.state}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={k.stateBody} accessibilityLiveRegion="polite">
        {label}
      </Text>
    </Card>
  );
}

/** A quiet inline note, for policy-free explanations. */
export function Note({ children, icon = 'information-circle-outline' }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <View style={k.note}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} style={{ marginTop: 1 }} />
      <Text style={k.noteText}>{children}</Text>
    </View>
  );
}

/** Page body padding and width, shared by every screen in this slice. */
export const page = StyleSheet.create({
  body: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
});

export const kit = StyleSheet.create({
  mono: { fontFamily: FontFamily.mono },
  muted: { ...TypeScale.caption, color: Colors.textMuted },
  body: { ...TypeScale.body, color: Colors.textSecondary },
  title: { ...TypeScale.title, color: Colors.textPrimary },
  amount: { ...TypeScale.bodyStrong, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
});

const shadow = Platform.select<ViewStyle>({
  web: { boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' } as any,
  default: { shadowColor: Colors.textPrimary, shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
});

const k = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...shadow,
  },
  cardPad: { padding: Spacing.lg },
  sectionLabel: { ...TypeScale.bodyStrong, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: -Spacing.xs, paddingHorizontal: Spacing.xs },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 52 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  linkRow: { minHeight: 56 },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { ...TypeScale.caption, color: Colors.textMuted },
  rowValue: { ...TypeScale.body, color: Colors.textPrimary, marginTop: 2 },
  rowValueMuted: { color: Colors.textSecondary },
  rowDetail: { ...TypeScale.caption, color: Colors.textMuted, marginTop: 2 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  mono: { fontFamily: FontFamily.mono, fontSize: 13 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { ...TypeScale.caption, fontFamily: FontFamily.medium, color: Colors.textPrimary },

  btn: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primaryBorder },
  btnDanger: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.dangerBorder },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...TypeScale.bodyStrong },
  pressed: { opacity: 0.8 },

  segment: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 3, gap: 3 },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  segmentItemOn: { backgroundColor: Colors.card, ...shadow },
  segmentText: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  segmentTextOn: { color: Colors.textPrimary, fontFamily: FontFamily.semibold },

  state: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  stateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  stateTitle: { ...TypeScale.subtitle, fontFamily: FontFamily.semibold, color: Colors.textPrimary, textAlign: 'center' },
  stateBody: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 440 },
  stateBtn: { marginTop: Spacing.sm, alignSelf: 'center', minWidth: 160 },

  note: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  noteText: { ...TypeScale.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
