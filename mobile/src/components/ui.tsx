/**
 * GlowVAI Vendor App — Shared UI Components
 * StatusPill, StatCard, ListItem, SectionHeader, Toggle, TimerBox, ProgressBar
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  View, Text, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

// ── Status Pill ───────────────────────────────────────────────────────────────
type PillVariant = 'green' | 'amber' | 'red' | 'neutral';

const PILL_STYLES: Record<PillVariant, { bg: string; color: string }> = {
  green:   { bg: Colors.greenBg,       color: Colors.green },
  amber:   { bg: Colors.amberBg,       color: Colors.amber },
  red:     { bg: Colors.redBg,         color: Colors.red },
  neutral: { bg: Colors.pillNeutral,   color: Colors.pillNeutralText },
};

export function StatusPill({
  label,
  variant = 'neutral',
  style,
}: {
  label: string;
  variant?: PillVariant;
  style?: ViewStyle;
}) {
  const { bg, color } = PILL_STYLES[variant];
  return (
    <View style={[pill.wrap, { backgroundColor: bg }, style]}>
      <Text style={[pill.text, { color }]}>{label}</Text>
    </View>
  );
}

export function orderStatusPill(status: string): { label: string; variant: PillVariant } {
  switch (status) {
    case 'PENDING':    return { label: 'New',        variant: 'amber' };
    case 'ACCEPTED':   return { label: 'Accepted',   variant: 'amber' };
    case 'PACKED':     return { label: 'Packed',     variant: 'amber' };
    case 'DISPATCHED': return { label: 'Dispatched', variant: 'amber' };
    case 'DELIVERED':  return { label: 'Delivered',  variant: 'green' };
    case 'CANCELLED':  return { label: 'Cancelled',  variant: 'red' };
    default:           return { label: status,       variant: 'neutral' };
  }
}

const pill = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  text: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({
  value, label, style,
}: { value: string; label: string; style?: ViewStyle }) {
  return (
    <View style={[sc.wrap, style]}>
      <Text style={sc.num}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: 14,
  },
  num:  { ...Typography.stat, color: Colors.ink },
  lbl:  { ...Typography.small, marginTop: 2 },
});

// ── Section Header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, style }: { title: string; style?: TextStyle }) {
  return (
    <Text style={[sh.text, style]}>{title.toUpperCase()}</Text>
  );
}

const sh = StyleSheet.create({
  text: {
    ...Typography.section,
    marginVertical: Spacing.md,
  },
});

// ── List Item ─────────────────────────────────────────────────────────────────
export function ListItem({
  title, subtitle, right, onPress, noBorder,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  noBorder?: boolean;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[li.wrap, noBorder && { borderBottomWidth: 0 }]}
    >
      <View style={li.left}>
        <Text style={li.t1}>{title}</Text>
        {subtitle ? <Text style={li.t2}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={li.right}>{right}</View> : null}
    </Wrapper>
  );
}

const li = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  left:  { flex: 1 },
  t1:    { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: Colors.ink },
  t2:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: Colors.sub, marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
});

// ── Online Toggle ─────────────────────────────────────────────────────────────
export function OnlineToggle({
  isOnline, onToggle,
}: { isOnline: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={ot.wrap}>
      <View>
        <Text style={ot.title}>{isOnline ? "You're Online" : "You're Offline"}</Text>
        <Text style={ot.sub}>
          {isOnline ? 'Receiving order alerts' : 'Not receiving orders'}
        </Text>
      </View>
      <Switch
        value={isOnline}
        onValueChange={onToggle}
        trackColor={{ false: '#dddddd', true: '#86EFAC' }}
        thumbColor={isOnline ? Colors.green : '#94A3B8'}
        ios_backgroundColor="#dddddd"
      />
    </View>
  );
}

const ot = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    marginBottom: 16,
  },
  title: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.ink },
  sub:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: Colors.sub, marginTop: 2 },
});

// ── Timer Box ─────────────────────────────────────────────────────────────────
export function TimerBox({ seconds, label }: { seconds?: number; label?: string }) {
  const mins = seconds !== undefined
    ? `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : label || '';

  const urgent = seconds !== undefined && seconds <= 15;

  return (
    <View style={[tb.wrap, urgent && { backgroundColor: Colors.red }]}>
      <Text style={tb.num}>{mins}</Text>
      <Text style={tb.sub}>Time to respond</Text>
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.card,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  num:  { ...Typography.timer, color: '#fff' },
  sub:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#cccccc', marginTop: 4 },
});

// ── Progress Bar (4-step onboarding) ──────────────────────────────────────────
export function ProgressSteps({ total = 4, current }: { total?: number; current: number }) {
  return (
    <View style={ps.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[ps.step, i < current && ps.stepDone]}
        />
      ))}
    </View>
  );
}

const ps = StyleSheet.create({
  wrap:     { flexDirection: 'row', gap: 5, marginBottom: 20 },
  step:     { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.line },
  stepDone: { backgroundColor: Colors.brand },
});

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, outlined, style }: {
  children: React.ReactNode;
  outlined?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[
      cd.base,
      outlined ? cd.outlined : cd.filled,
      style,
    ]}>
      {children}
    </View>
  );
}

const cd = StyleSheet.create({
  base:     { borderRadius: Radius.card, padding: 16, marginBottom: 12 },
  filled:   { backgroundColor: Colors.card },
  outlined: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.line },
});

// ── Primary Button ────────────────────────────────────────────────────────────
export function PrimaryButton({
  label, onPress, loading, disabled, style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[btn.primary, (disabled || loading) && btn.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={btn.primaryText}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ── Secondary Button ──────────────────────────────────────────────────────────
export function SecondaryButton({
  label, onPress, style,
}: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[btn.secondary, style]}>
      <Text style={btn.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Danger Button ─────────────────────────────────────────────────────────────
export function DangerButton({
  label, onPress, style,
}: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[btn.danger, style]}>
      <Text style={btn.dangerText}>{label}</Text>
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  primary: {
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  disabled:    { opacity: 0.5 },
  secondary: {
    backgroundColor: Colors.bg,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  secondaryText: { color: Colors.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  danger: {
    backgroundColor: Colors.bg,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0d0cd',
  },
  dangerText: { color: Colors.red, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
});

// ── Form Field ────────────────────────────────────────────────────────────────
export function FormField({ children, label, hint, style }: {
  children: React.ReactNode;
  label?: string;
  hint?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[ff.wrap, style]}>
      {label ? <Text style={ff.label}>{label}</Text> : null}
      {children}
      {hint  ? <Text style={ff.hint}>{hint}</Text>   : null}
    </View>
  );
}

const ff = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { ...Typography.label, marginBottom: 6 },
  hint:  { ...Typography.small, marginTop: 5 },
});

// ── Upload Placeholder ────────────────────────────────────────────────────────
export function UploadBox({ label }: { label: string }) {
  return (
    <TouchableOpacity style={ub.wrap} activeOpacity={0.8}>
      <Ionicons name="folder-outline" size={18} style={{ color: "#475569" }} />
      <Text style={ub.label}>{label}</Text>
      <Text style={ub.tap}>Tap to upload</Text>
    </TouchableOpacity>
  );
}

const ub = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  icon:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 20, marginBottom: 4 },
  label: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12.5, color: Colors.sub, textAlign: 'center' },
  tap:   { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600', color: Colors.ink, marginTop: 4 },
});

// ── Logo Dot ──────────────────────────────────────────────────────────────────
export function LogoDot({
  letter = 'G',
  size = 64,
  bgColor = Colors.ink,
}: { letter?: string; size?: number; bgColor?: string }) {
  const fs = size * 0.4;
  return (
    <View style={[ld.wrap, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: bgColor }]}>
      <Text style={[ld.text, { fontFamily: 'PlusJakartaSans_400Regular', fontSize: fs }]}>{letter}</Text>
    </View>
  );
}

const ld = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
});

// ── Shelf Tag (Beauty Product Location Tag) ──────────────────────────────────
export function ShelfTag({ tag }: { tag?: string }) {
  if (!tag) return null;
  return (
    <View style={st.wrap}>
      <Text style={st.text}>📍 {tag}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '600',
    color: '#1D4ED8',
  },
});

// ── Countdown Bar ─────────────────────────────────────────────────────────────
export function CountdownBar({ progress, isUrgent }: { progress: number; isUrgent?: boolean }) {
  return (
    <View style={cb.bg}>
      <View
        style={[
          cb.fill,
          {
            width: `${Math.max(0, Math.min(100, progress * 100))}%`,
            backgroundColor: isUrgent ? '#D97706' : '#1D4ED8',
          },
        ]}
      />
    </View>
  );
}

const cb = StyleSheet.create({
  bg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
