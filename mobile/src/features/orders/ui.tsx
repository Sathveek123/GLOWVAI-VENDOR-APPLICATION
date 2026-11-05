/**
 * Small building blocks for the order flow screens: cards, buttons, status pill,
 * banners and full-screen loading / error / not-found states.
 * File: mobile/src/features/orders/ui.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BorderRadii, Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import type { StatusTone } from './model';
import { statusMeta } from './model';

type IconName = keyof typeof Ionicons.glyphMap;

export const TONE_COLORS: Record<StatusTone, { fg: string; bg: string; border: string }> = {
  action: { fg: Colors.primary, bg: Colors.primaryLight, border: Colors.primaryBorder },
  progress: { fg: Colors.warning, bg: Colors.warningLight, border: Colors.warningBorder },
  success: { fg: Colors.success, bg: Colors.successLight, border: Colors.successBorder },
  neutral: { fg: Colors.textSecondary, bg: Colors.surface, border: Colors.border },
  danger: { fg: Colors.danger, bg: Colors.dangerLight, border: Colors.dangerBorder },
};

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status);
  const tone = TONE_COLORS[meta.tone];
  return (
    <View style={[ui.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Ionicons name={meta.icon} size={14} color={tone.fg} />
      <Text style={[ui.pillText, { color: tone.fg }]} numberOfLines={1}>{meta.label}</Text>
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  tall?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, disabled, busy, tall, icon, accessibilityLabel, style }: ButtonProps) {
  const off = !!disabled || !!busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={({ pressed }) => [
        ui.btn,
        ui.primaryBtn,
        tall && ui.btnTall,
        disabled && !busy && ui.primaryBtnDisabled,
        pressed && !off && { backgroundColor: Colors.primaryPressed },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={Colors.background} />
      ) : (
        <View style={ui.btnInner}>
          {icon && <Ionicons name={icon} size={20} color={disabled ? Colors.textMuted : Colors.background} />}
          <Text style={[ui.primaryBtnText, tall && ui.btnTextTall, disabled && ui.primaryBtnTextDisabled]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, busy, tall, icon, accessibilityLabel, style, danger }: ButtonProps & { danger?: boolean }) {
  const off = !!disabled || !!busy;
  const color = danger ? Colors.danger : Colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={({ pressed }) => [
        ui.btn,
        ui.secondaryBtn,
        danger && { borderColor: Colors.dangerBorder },
        tall && ui.btnTall,
        off && { opacity: 0.55 },
        pressed && !off && { backgroundColor: Colors.surface },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={ui.btnInner}>
          {icon && <Ionicons name={icon} size={20} color={color} />}
          <Text style={[ui.secondaryBtnText, tall && ui.btnTextTall, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Banner({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: 'danger' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const map = {
    danger: { fg: Colors.danger, bg: Colors.dangerLight, border: Colors.dangerBorder, icon: 'alert-circle-outline' as IconName },
    warning: { fg: Colors.warning, bg: Colors.warningLight, border: Colors.warningBorder, icon: 'warning-outline' as IconName },
    info: { fg: Colors.primary, bg: Colors.primaryLight, border: Colors.primaryBorder, icon: 'information-circle-outline' as IconName },
    success: { fg: Colors.success, bg: Colors.successLight, border: Colors.successBorder, icon: 'checkmark-circle-outline' as IconName },
  }[tone];
  return (
    <View
      style={[ui.banner, { backgroundColor: map.bg, borderColor: map.border }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      <Ionicons name={map.icon} size={20} color={map.fg} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {!!title && <Text style={ui.bannerTitle}>{title}</Text>}
        <Text style={ui.bannerText}>{message}</Text>
      </View>
      {!!actionLabel && !!onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} style={ui.bannerAction}>
          <Text style={[ui.bannerActionText, { color: map.fg }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Centered full-area state: loading, error with Retry, not found, or empty. */
export function StateView({
  kind,
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  kind: 'loading' | 'error' | 'empty';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  return (
    <View style={ui.state} accessibilityLiveRegion="polite">
      {kind === 'loading' ? (
        <ActivityIndicator color={Colors.primary} size="large" />
      ) : (
        <View style={[ui.stateIcon, kind === 'error' && { backgroundColor: Colors.dangerLight }]}>
          <Ionicons
            name={icon || (kind === 'error' ? 'cloud-offline-outline' : 'file-tray-outline')}
            size={26}
            color={kind === 'error' ? Colors.danger : Colors.textMuted}
          />
        </View>
      )}
      <Text style={ui.stateTitle}>{title}</Text>
      {!!message && <Text style={ui.stateMessage}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <PrimaryButton label={actionLabel} onPress={onAction} style={ui.stateBtn} />
      )}
    </View>
  );
}

export const ui = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  muted: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textMuted },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  code: { fontFamily: FontFamily.mono, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  divider: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: Colors.border },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  pillText: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 16 },

  btn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  btnTall: { minHeight: 56 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: { fontFamily: FontFamily.semibold, fontSize: 16, color: Colors.background },
  primaryBtnTextDisabled: { color: Colors.textMuted },
  btnTextTall: { fontSize: 17 },
  secondaryBtn: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.inputBorder },
  secondaryBtnText: { fontFamily: FontFamily.semibold, fontSize: 16 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  bannerTitle: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  bannerText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  bannerAction: { minHeight: 44, minWidth: 44, paddingHorizontal: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
  bannerActionText: { fontFamily: FontFamily.semibold, fontSize: 14 },

  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm, minHeight: 320 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stateTitle: { fontFamily: FontFamily.semibold, fontSize: 17, lineHeight: 24, color: Colors.textPrimary, textAlign: 'center' },
  stateMessage: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center', maxWidth: 340 },
  stateBtn: { marginTop: Spacing.md, alignSelf: 'stretch', maxWidth: 320, width: '100%' },
});
