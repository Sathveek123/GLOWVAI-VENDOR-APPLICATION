/**
 * Small building blocks shared by the catalogue and stock screens:
 * product photo, chips, cards, empty states, status pills, search box, toast and sheet.
 * Colours come from theme tokens only.
 * File: mobile/src/features/catalog/ui.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing as S } from '../../theme/tokens';
import { FontFamily, TypeScale } from '../../theme/typography';
import { Button } from '../onboarding/kit';

export const CARD_RADIUS = 14;
/** Scrim behind sheets: the token text colour at 45% opacity. */
const SCRIM = 'rgba(15, 23, 42, 0.45)';

export const cardStyle: ViewStyle = {
  backgroundColor: Colors.card,
  borderRadius: CARD_RADIUS,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: Colors.border,
  shadowColor: Colors.textPrimary,
  shadowOpacity: 0.04,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

// ── Product photo ────────────────────────────────────────────────────────────
export function ProductThumb({ uri, brand, size = 56, label }: { uri?: string | null; brand?: string; size?: number; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const initial = (brand || label || '?').trim().charAt(0).toUpperCase();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Photo of ${label}`}
      style={[ui.thumb, { width: size, height: size, borderRadius: Math.round(size / 5) }]}
    >
      {uri && !failed ? (
        <Image source={{ uri }} style={ui.thumbImg} resizeMode="contain" onError={() => setFailed(true)} />
      ) : (
        <Text style={[ui.thumbInitial, { fontSize: Math.round(size / 2.6) }]}>{initial}</Text>
      )}
    </View>
  );
}

// ── Chips ────────────────────────────────────────────────────────────────────
export function Chip({ label, active, onPress, count }: { label: string; active: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      style={({ pressed }) => [ui.chip, active && ui.chipOn, pressed && { opacity: 0.85 }]}
    >
      <Text style={[ui.chipText, active && ui.chipTextOn]}>{label}</Text>
      {count !== undefined ? <Text style={[ui.chipCount, active && ui.chipTextOn]}>{count}</Text> : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.chipRow}>
      {children}
    </ScrollView>
  );
}

// ── Search ───────────────────────────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <View style={ui.search}>
      <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={ui.searchInput}
        accessibilityLabel={label}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Clear search" style={ui.searchClear}>
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const PILL: Record<PillTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: Colors.surface, border: Colors.border, text: Colors.textSecondary },
  success: { bg: Colors.successLight, border: Colors.successBorder, text: Colors.textPrimary },
  warning: { bg: Colors.warningLight, border: Colors.warningBorder, text: Colors.warning },
  danger: { bg: Colors.dangerLight, border: Colors.dangerBorder, text: Colors.danger },
  info: { bg: Colors.primaryLight, border: Colors.primaryBorder, text: Colors.primary },
};

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: PillTone; icon?: keyof typeof Ionicons.glyphMap }) {
  const t = PILL[tone];
  return (
    <View style={[ui.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon ? <Ionicons name={icon} size={12} color={tone === 'success' ? Colors.success : t.text} /> : null}
      <Text style={[ui.pillText, { color: t.text }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ── Empty and error states ───────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  message,
  action,
  secondary,
  tone = 'info',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void; loading?: boolean };
  secondary?: { label: string; onPress: () => void };
  tone?: 'info' | 'danger';
}) {
  return (
    <View style={[cardStyle, ui.empty]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      <View style={[ui.emptyIcon, tone === 'danger' && { backgroundColor: Colors.dangerLight }]}>
        <Ionicons name={icon} size={24} color={tone === 'danger' ? Colors.danger : Colors.primary} />
      </View>
      <Text accessibilityRole="header" style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyMessage}>{message}</Text>
      {action || secondary ? (
        <View style={ui.emptyActions}>
          {action ? <Button label={action.label} onPress={action.onPress} loading={action.loading} compact style={ui.emptyBtn} /> : null}
          {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} compact style={ui.emptyBtn} /> : null}
        </View>
      ) : null}
    </View>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: S.sm }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[cardStyle, ui.skeleton]}>
          <View style={ui.skelThumb} />
          <View style={{ flex: 1, gap: S.sm }}>
            <View style={[ui.skelLine, { width: '40%' }]} />
            <View style={[ui.skelLine, { width: '80%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function useToast(ms = 4000) {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast, ms]);
  return { toast, showToast: setToast };
}

export function Toast({ text, bottom = 24 }: { text: string | null; bottom?: number }) {
  const insets = useSafeAreaInsets();
  if (!text) return null;
  return (
    <View pointerEvents="none" style={[ui.toastWrap, { bottom: bottom + insets.bottom }]}>
      <View style={ui.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <Text style={ui.toastText}>{text}</Text>
      </View>
    </View>
  );
}

// ── Bottom sheet ─────────────────────────────────────────────────────────────
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ui.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, S.lg) }]} accessibilityViewIsModal>
          <View style={ui.sheetHead}>
            <Text accessibilityRole="header" style={ui.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={ui.sheetClose}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={ui.sheetBody} contentContainerStyle={{ paddingBottom: S.lg }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={ui.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SectionTitle({ title, hint, style }: { title: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 2 }, style]}>
      <Text accessibilityRole="header" style={ui.sectionTitle}>{title}</Text>
      {hint ? <Text style={ui.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

const ui = StyleSheet.create({
  thumb: {
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%', backgroundColor: Colors.card },
  thumbInitial: { fontFamily: FontFamily.semibold, color: Colors.primary },

  chipRow: { gap: S.sm, alignItems: 'center', paddingVertical: 2 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  chipCount: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textMuted },
  chipTextOn: { color: Colors.background },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    minHeight: 48,
    paddingLeft: S.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },
  searchClear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  pillText: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },

  empty: { padding: S.xl, alignItems: 'center' },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  emptyTitle: { ...TypeScale.title, color: Colors.textPrimary, textAlign: 'center' },
  emptyMessage: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center', marginTop: S.xs, maxWidth: 440 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: S.sm, marginTop: S.lg },
  emptyBtn: { minWidth: 160 },

  skeleton: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md },
  skelThumb: { width: 56, height: 56, borderRadius: 11, backgroundColor: Colors.surface },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: Colors.surface },

  toastWrap: { position: 'absolute', left: S.lg, right: S.lg, alignItems: 'center' },
  toast: {
    maxWidth: 560,
    width: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  toastText: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: Colors.background },

  scrim: { flex: 1, backgroundColor: SCRIM, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: S.sm,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', paddingLeft: S.lg, paddingRight: S.xs, minHeight: 52 },
  sheetTitle: { ...TypeScale.title, color: Colors.textPrimary, flex: 1 },
  sheetClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: S.lg },
  sheetFooter: { paddingHorizontal: S.lg, paddingTop: S.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },

  sectionTitle: { ...TypeScale.bodyStrong, fontSize: 15, color: Colors.textPrimary },
  sectionHint: { ...TypeScale.caption, color: Colors.textMuted },
});
