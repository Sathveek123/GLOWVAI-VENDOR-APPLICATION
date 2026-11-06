/**
 * Seller sign-in and onboarding UI kit.
 * One frame (header, progress, content, sticky footer) and the form controls every
 * onboarding screen shares, so spacing, type sizes and states stay consistent.
 *
 * React Native only (no DOM APIs); web-only tweaks go through Platform checks.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../components/Wordmark';
import { Colors, BorderRadii, Shadows } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';

// ── Scale ─────────────────────────────────────────────────────────────────────
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const R = { input: BorderRadii.button, card: BorderRadii.sheet, pill: BorderRadii.pill } as const;
export const FORM_MAX = 720;
export const WIDE_MAX = 1040;

const C = {
  ...Colors,
  page: Colors.canvas,
  errorText: Colors.dangerText,
};

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export function useLayout() {
  const { width } = useWindowDimensions();
  return {
    width,
    isPhone: width < 600,
    isDesktop: width >= 1024,
    /** Two columns only when there is room for both at a comfortable width. */
    canSplit: width >= 1100,
  };
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `${title} · GlowVai Seller`;
    }
  }, [title]);
}

// ── Header ────────────────────────────────────────────────────────────────────
export function SellerHeader({
  onBack,
  right,
  maxWidth = FORM_MAX,
}: {
  onBack?: () => void;
  right?: React.ReactNode;
  maxWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  const { isPhone } = useLayout();
  return (
    <View style={[h.bar, { paddingTop: insets.top }]}>
      <View style={[h.inner, { maxWidth: maxWidth + (isPhone ? S.lg : S.xl) * 2, paddingHorizontal: isPhone ? S.sm : S.lg }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={4}
            style={({ pressed }) => [h.iconBtn, pressed && { backgroundColor: C.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: S.sm }} />
        )}
        <View style={h.brand}>
          <Wordmark size={20} suffix="Seller" />
        </View>
        <View style={h.right}>{right}</View>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  bar: { backgroundColor: C.background, borderBottomWidth: 1, borderBottomColor: C.border },
  inner: { width: '100%', alignSelf: 'center', height: 56, flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', marginLeft: S.xs, flexShrink: 1 },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
});

// ── Progress ──────────────────────────────────────────────────────────────────
export const STEP_NAMES = ['Store details', 'Business and tax', 'Bank account', 'Categories and review'];

export function StepProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}${STEP_NAMES[step - 1] ? `, ${STEP_NAMES[step - 1]}` : ''}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
      style={pg.wrap}
    >
      <Text style={pg.label}>
        Step {step} of {total}
      </Text>
      <View style={pg.bars}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[pg.bar, i < step && pg.barOn]} />
        ))}
      </View>
    </View>
  );
}

const pg = StyleSheet.create({
  wrap: { marginBottom: S.md },
  label: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: C.primary, marginBottom: S.sm },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  barOn: { backgroundColor: C.primary },
});

// ── Frame ─────────────────────────────────────────────────────────────────────
export function SellerFrame({
  step,
  title,
  description,
  children,
  footer,
  wide = false,
  onBack,
  headerRight,
  testID,
  maxWidth: maxWidthProp,
}: {
  maxWidth?: number;
  step?: number;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  testID?: string;
}) {
  const { isPhone, canSplit } = useLayout();
  const insets = useSafeAreaInsets();
  const maxWidth = maxWidthProp ?? (wide && canSplit ? WIDE_MAX : FORM_MAX);
  const pad = isPhone ? S.lg : S.xl;

  return (
    <SafeAreaView edges={['left', 'right']} style={f.root} testID={testID}>
      <SellerHeader onBack={onBack} right={headerRight} maxWidth={maxWidth} />
      <KeyboardAvoidingView style={f.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={f.flex}
          contentContainerStyle={[f.scroll, { paddingHorizontal: pad, paddingTop: isPhone ? S.xl : S.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[f.content, { maxWidth }]}>
            {step ? <StepProgress step={step} /> : null}
            {title ? (
              <Text accessibilityRole="header" style={[f.title, !isPhone && f.titleLarge]}>
                {title}
              </Text>
            ) : null}
            {description ? <Text style={f.description}>{description}</Text> : null}
            {children}
          </View>
        </ScrollView>
        {footer ? (
          <View style={[f.footer, { paddingHorizontal: pad, paddingBottom: Math.max(insets.bottom, S.md) }]}>
            <View style={[f.content, { maxWidth }]}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const f = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: S.xxl },
  content: { width: '100%', alignSelf: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.textPrimary },
  titleLarge: { fontSize: 28, lineHeight: 34 },
  description: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm, marginBottom: S.xl },
  footer: { backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.md },
});

// ── Section card ──────────────────────────────────────────────────────────────
export function Section({
  title,
  description,
  children,
  right,
  style,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isPhone } = useLayout();
  return (
    <View style={[sc.card, { padding: isPhone ? S.lg : S.xl }, style]}>
      {title ? (
        <View style={[sc.head, !!right && { alignItems: 'center', marginTop: -S.sm, marginBottom: S.sm }]}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={sc.title}>
              {title}
            </Text>
            {description ? <Text style={sc.desc}>{description}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const sc = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.card, borderWidth: 1, borderColor: C.border, marginBottom: S.lg, ...Shadows.card },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, marginBottom: S.lg },
  title: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 24, color: C.textPrimary },
  desc: { fontSize: 14, lineHeight: 20, color: C.textSecondary, marginTop: 2 },
});

/** Puts short fields side by side when there is room; stacks them on phones unless `keepOnPhone`. */
export function FieldRow({ children, keepOnPhone = false }: { children: React.ReactNode; keepOnPhone?: boolean }) {
  const { isPhone } = useLayout();
  const row = keepOnPhone || !isPhone;
  return (
    <View style={row ? { flexDirection: 'row', gap: S.md } : undefined}>
      {React.Children.map(children, child => (child ? <View style={row ? { flex: 1, minWidth: 0 } : undefined}>{child}</View> : null))}
    </View>
  );
}

// ── Text field ────────────────────────────────────────────────────────────────
export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helper?: string;
  optional?: boolean;
  prefix?: string;
  right?: React.ReactNode;
  success?: string;
  inputStyle?: StyleProp<any>;
  last?: boolean;
}

export const TextField = React.forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, optional, prefix, right, success, inputStyle, last, onFocus, onBlur, ...input },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const message = error || success || helper;
  return (
    <View style={[tf.wrap, last && { marginBottom: 0 }]}>
      <Text style={tf.label}>
        {label}
        {optional ? <Text style={tf.optional}> (optional)</Text> : null}
      </Text>
      <View style={[tf.box, focused && tf.boxFocus, !!error && tf.boxError, input.editable === false && tf.boxDisabled]}>
        {prefix ? (
          <View style={tf.prefix}>
            <Text style={tf.prefixText}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={C.textSubtle}
          accessibilityLabel={optional ? `${label}, optional` : label}
          accessibilityHint={message || undefined}
          {...input}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[tf.input, webNoOutline, inputStyle]}
        />
        {right}
      </View>
      {error ? (
        <View style={tf.msgRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={C.errorText} style={tf.msgIcon} />
          <Text style={[tf.msg, tf.msgInRow, { color: C.errorText }]}>{error}</Text>
        </View>
      ) : success ? (
        <View style={tf.msgRow}>
          <Ionicons name="checkmark-circle" size={15} color={C.successText} style={tf.msgIcon} />
          <Text style={[tf.msg, tf.msgInRow, { color: C.successText }]}>{success}</Text>
        </View>
      ) : helper ? (
        <Text style={tf.msg}>{helper}</Text>
      ) : null}
    </View>
  );
});

const tf = StyleSheet.create({
  wrap: { marginBottom: S.lg + 2 },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginBottom: 6 },
  optional: { fontFamily: FontFamily.regular, color: C.textSubtle },
  box: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: R.input,
    backgroundColor: C.background,
    overflow: 'hidden',
  },
  boxFocus: { borderColor: C.primary, borderWidth: 2, marginHorizontal: -1, marginVertical: -1 },
  boxError: { borderColor: C.errorText },
  boxDisabled: { backgroundColor: C.surface },
  prefix: { paddingLeft: 14, paddingRight: 10, alignSelf: 'stretch', justifyContent: 'center', borderRightWidth: 1, borderRightColor: C.border },
  prefixText: { fontFamily: FontFamily.semibold, fontSize: 16, color: C.textPrimary },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: C.textPrimary,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  msgIcon: { marginRight: 5, marginTop: 2 },
  msg: { flex: 1, fontSize: 13, lineHeight: 19, color: C.textSubtle, marginTop: 6 },
  msgInRow: { marginTop: 0 },
});

// ── Buttons ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  iconRight,
  style,
  accessibilityLabel,
  compact,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  compact?: boolean;
  testID?: string;
}) {
  const inactive = disabled || loading;
  const v = bv[variant];
  const textColor = disabled && variant === 'primary' ? C.disabledText : v.color;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        bt.base,
        compact && bt.compact,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && variant === 'primary' && bt.primaryDisabled,
        disabled && variant !== 'primary' && { opacity: 0.5 },
        pressed && !inactive && { backgroundColor: v.pressed },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={textColor} style={{ marginRight: S.sm }} /> : null}
      {!loading && icon ? <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 6 }} /> : null}
      <Text numberOfLines={1} style={[bt.text, compact && bt.textCompact, { color: textColor }]}>
        {label}
      </Text>
      {!loading && iconRight ? <Ionicons name={iconRight} size={18} color={textColor} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}

const bv: Record<ButtonVariant, { bg: string; border: string; color: string; pressed: string }> = {
  primary: { bg: C.primary, border: C.primary, color: C.textOnPrimary, pressed: C.primaryPressed },
  secondary: { bg: C.background, border: C.borderStrong, color: C.textPrimary, pressed: C.surface },
  ghost: { bg: 'transparent', border: 'transparent', color: C.primary, pressed: C.primaryLight },
  danger: { bg: C.background, border: C.dangerBorder, color: C.errorText, pressed: C.dangerLight },
};

const bt = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: R.input,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: 12 },
  // Disabled primary: #475569 on #E2E8F0 is 6.2:1, readable in a bright shop.
  primaryDisabled: { backgroundColor: C.disabledBg, borderColor: C.disabledBg },
  text: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22 },
  textCompact: { fontFamily: FontFamily.semibold, fontSize: 15 },
});

/** Inline text link with a 44px touch target. */
export function LinkButton({ label, onPress, accessibilityLabel, testID }: { label: string; onPress: () => void; accessibilityLabel?: string; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [lk.hit, pressed && { opacity: 0.6 }]}
    >
      <Text style={lk.text}>{label}</Text>
    </Pressable>
  );
}

const lk = StyleSheet.create({
  hit: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: S.sm, borderRadius: R.input },
  text: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.primary, textDecorationLine: 'underline' },
});

// ── Banner ────────────────────────────────────────────────────────────────────
type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, { bg: string; border: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { bg: C.primaryLight, border: C.primaryBorder, color: C.infoText, icon: 'information-circle' },
  success: { bg: C.successLight, border: C.successBorder, color: C.successText, icon: 'checkmark-circle' },
  warning: { bg: C.warningLight, border: C.warningBorder, color: C.warningText, icon: 'alert-circle' },
  error: { bg: C.dangerLight, border: C.dangerBorder, color: C.dangerText, icon: 'alert-circle' },
};

export function Banner({
  tone = 'info',
  title,
  message,
  children,
  style,
}: {
  tone?: Tone;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[bn.wrap, { backgroundColor: t.bg, borderColor: t.border }, style]}
    >
      <Ionicons name={t.icon} size={20} color={t.color} style={bn.icon} />
      <View style={{ flex: 1 }}>
        {title ? <Text style={[bn.title, { color: t.color }]}>{title}</Text> : null}
        {message ? <Text style={[bn.msg, { color: t.color }]}>{message}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const bn = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 1, borderRadius: R.input + 2, padding: S.md + 2, marginBottom: S.lg },
  icon: { marginRight: S.sm + 2, marginTop: 1 },
  title: { fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 21 },
  msg: { fontSize: 14, lineHeight: 20 },
});

// ── Checkbox ──────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={cb.row}
    >
      <View style={[cb.box, checked && cb.boxOn]}>{checked ? <Ionicons name="checkmark" size={16} color={C.textOnPrimary} /> : null}</View>
      <Text style={cb.label}>{label}</Text>
    </Pressable>
  );
}

const cb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44, paddingVertical: S.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
    marginTop: 1,
    backgroundColor: C.background,
  },
  boxOn: { backgroundColor: C.primary, borderColor: C.primary },
  label: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textPrimary },
});

// ── Footer ────────────────────────────────────────────────────────────────────
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function StepFooter({
  hint,
  onBack,
  backLabel = 'Back',
  onSaveDraft,
  saveState = 'idle',
  savedAt,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  primaryTestID,
}: {
  hint?: string;
  onBack?: () => void;
  backLabel?: string;
  onSaveDraft?: () => void;
  saveState?: SaveState;
  savedAt?: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryTestID?: string;
}) {
  const { isPhone } = useLayout();
  const status =
    saveState === 'saved' && savedAt
      ? `Draft saved at ${savedAt}`
      : saveState === 'error'
        ? 'Couldn’t save the draft on this device. Try again.'
        : '';
  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Draft saved' : 'Save draft';

  return (
    <View>
      {hint || status ? (
        <View style={ft.notes} accessibilityLiveRegion="polite">
          {hint ? (
            <View style={ft.noteRow}>
              <Ionicons name="information-circle-outline" size={16} color={C.textSecondary} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={ft.hint}>{hint}</Text>
            </View>
          ) : null}
          {status ? (
            <Text style={[ft.hint, saveState === 'error' ? { color: C.errorText } : { color: C.successText }]}>{status}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={ft.row}>
        {onBack && !isPhone ? <Button label={backLabel} icon="arrow-back" variant="secondary" onPress={onBack} /> : null}
        {!isPhone ? <View style={{ flex: 1 }} /> : null}
        {onSaveDraft ? (
          <Button
            label={saveLabel}
            icon={saveState === 'saved' ? 'checkmark' : undefined}
            variant={isPhone ? 'secondary' : 'ghost'}
            onPress={onSaveDraft}
            loading={saveState === 'saving'}
            compact={isPhone}
            style={isPhone ? { paddingHorizontal: 14 } : undefined}
          />
        ) : null}
        <Button
          testID={primaryTestID}
          label={primaryLabel}
          onPress={onPrimary}
          disabled={primaryDisabled}
          loading={primaryLoading}
          iconRight={primaryLoading ? undefined : 'arrow-forward'}
          style={isPhone ? { flexGrow: 3, flexShrink: 1, flexBasis: 0 } : { minWidth: 200 }}
        />
      </View>
    </View>
  );
}

const ft = StyleSheet.create({
  notes: { marginBottom: S.sm + 2, gap: 2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start' },
  hint: { flex: 1, fontSize: 13, lineHeight: 19, color: C.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm + 2 },
});

// ── Small pieces ──────────────────────────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={sg.wrap}>
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={`${label} ${o}`}
            style={[sg.item, on && sg.itemOn]}
          >
            <Text style={[sg.text, on && sg.textOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const sg = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.input, borderWidth: 1, borderColor: C.border, padding: 3 },
  item: { minWidth: 52, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  itemOn: { backgroundColor: C.background, borderWidth: 1, borderColor: C.primary },
  text: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.textSecondary },
  textOn: { color: C.primary },
});

export function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={sr.row}>
      <Text style={sr.label}>{label}</Text>
      <Text style={sr.value}>{value || '—'}</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 6, gap: S.sm },
  label: { width: 132, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  value: { flex: 1, minWidth: 160, fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: C.textPrimary },
});

export function CenteredLoader({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xxl, backgroundColor: C.page }}>
      <ActivityIndicator color={C.primary} />
      <Text style={{ marginTop: S.md, fontSize: 15, color: C.textSecondary }}>{label}</Text>
    </View>
  );
}

// ── Password field ────────────────────────────────────────────────────────────
/** A TextField that hides its value, with a 44px show/hide toggle. */
export const PasswordField = React.forwardRef<TextInput, Omit<TextFieldProps, 'secureTextEntry' | 'right'>>(function PasswordField(
  props,
  ref,
) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!shown}
      right={
        <Pressable
          onPress={() => setShown(v => !v)}
          accessibilityRole="button"
          accessibilityLabel={shown ? `Hide ${props.label.toLowerCase()}` : `Show ${props.label.toLowerCase()}`}
          style={({ pressed }) => [pw.toggle, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textSecondary} />
        </Pressable>
      }
    />
  );
});

const pw = StyleSheet.create({
  toggle: { width: 48, minHeight: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
});

// ── Select (bottom sheet list) ───────────────────────────────────────────────
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose',
  error,
  helper,
  testID,
  last,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  testID?: string;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  const close = () => {
    setOpen(false);
    setQuery('');
  };
  return (
    <View style={[tf.wrap, last && { marginBottom: 0 }]}>
      <Text style={tf.label}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not chosen'}`}
        accessibilityHint="Opens a list to choose from"
        style={({ pressed }) => [tf.box, sl.box, !!error && tf.boxError, pressed && { backgroundColor: C.surface }]}
      >
        <Text style={[sl.value, !value && { color: C.textSubtle }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
      </Pressable>
      {error ? (
        <View style={tf.msgRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={C.errorText} style={tf.msgIcon} />
          <Text style={[tf.msg, tf.msgInRow, { color: C.errorText }]}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={tf.msg}>{helper}</Text>
      ) : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={sl.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close list" />
          <View style={[sl.sheet, { paddingBottom: Math.max(insets.bottom, S.md) }]}>
            <View style={sl.sheetHead}>
              <Text accessibilityRole="header" style={sl.sheetTitle}>
                {label}
              </Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" style={h.iconBtn}>
                <Ionicons name="close" size={22} color={C.textPrimary} />
              </Pressable>
            </View>
            {options.length > 10 ? (
              <View style={{ paddingHorizontal: S.lg, paddingBottom: S.sm }}>
                <TextField
                  label="Search"
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search ${label.toLowerCase()}`}
                  autoCorrect={false}
                  last
                />
              </View>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
              {shown.map(o => {
                const on = o === value;
                return (
                  <Pressable
                    key={o}
                    onPress={() => {
                      onChange(o);
                      close();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, selected: on }}
                    style={({ pressed }) => [sl.option, on && { backgroundColor: C.primaryLight }, pressed && { backgroundColor: C.surface }]}
                  >
                    <Text style={[sl.optionText, on && sl.optionTextOn]}>{o}</Text>
                    {on ? <Ionicons name="checkmark" size={20} color={C.primary} /> : null}
                  </Pressable>
                );
              })}
              {!shown.length ? <Text style={[tf.msg, { paddingHorizontal: S.lg, paddingBottom: S.lg }]}>Nothing matches your search.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const sl = StyleSheet.create({
  box: { paddingHorizontal: 14, justifyContent: 'space-between' },
  value: { flex: 1, fontSize: 16, color: C.textPrimary, fontFamily: FontFamily.regular },
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '80%',
    backgroundColor: C.card,
    borderTopLeftRadius: R.card,
    borderTopRightRadius: R.card,
    ...Shadows.raised,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: S.lg, paddingRight: S.sm, paddingVertical: S.sm },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: C.textPrimary },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg },
  optionText: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
  optionTextOn: { color: C.primary, fontFamily: FontFamily.semibold },
});

// ── Auth frame ────────────────────────────────────────────────────────────────
/** One centred white card for the sign-in, create account, reset and verify screens. */
export function AuthFrame({
  title,
  lead,
  children,
  below,
  onBack,
  headerRight,
  testID,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
  below?: React.ReactNode;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  testID?: string;
}) {
  const { isPhone } = useLayout();
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={f.root} testID={testID}>
      <SellerHeader onBack={onBack} right={headerRight} maxWidth={440} />
      <KeyboardAvoidingView style={f.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[af.scroll, { paddingHorizontal: isPhone ? S.lg : S.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={af.col}>
            <Section style={{ marginBottom: 0 }}>
              <Text accessibilityRole="header" style={[f.title, !isPhone && f.titleLarge]}>
                {title}
              </Text>
              {lead ? <Text style={af.lead}>{lead}</Text> : <View style={{ height: S.xl }} />}
              {children}
            </Section>
            {below ? <View style={af.below}>{below}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const af = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: S.xxl },
  col: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  lead: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm, marginBottom: S.xl },
  below: { marginTop: S.lg, alignItems: 'center', gap: S.xs },
});

/** A short muted line followed by a link, under an auth card. */
export function AuthLinkRow({ text, link, onPress, testID }: { text?: string; link: string; onPress: () => void; testID?: string }) {
  return (
    <View style={af2.row}>
      {text ? <Text style={af2.text}>{text}</Text> : null}
      <LinkButton label={link} onPress={onPress} testID={testID} />
    </View>
  );
}

const af2 = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  text: { fontSize: 15, lineHeight: 22, color: C.textSecondary },
});

// ── Loading or failed gate ───────────────────────────────────────────────────
/** What a guarded screen shows while it checks the account, or when GlowVai can't be reached. */
export function GateFallback({
  gate,
  loadingLabel,
  onSignOut,
}: {
  gate: { status: 'loading' } | { status: 'error'; message: string; retry: () => void };
  loadingLabel: string;
  onSignOut?: () => void;
}) {
  if (gate.status === 'loading') return <CenteredLoader label={loadingLabel} />;
  return (
    <SellerFrame headerRight={onSignOut ? <Button label="Sign out" variant="ghost" compact onPress={onSignOut} /> : undefined}>
      <Section>
        <View style={gf.icon}>
          <Ionicons name="cloud-offline-outline" size={24} color={C.dangerText} />
        </View>
        <Text accessibilityRole="header" style={gf.title}>
          We couldn’t open your store account
        </Text>
        <Text style={gf.body} accessibilityRole="alert">
          {gate.message}
        </Text>
        <Button label="Try again" icon="refresh" onPress={gate.retry} style={{ marginTop: S.xl }} testID="gate-retry" />
      </Section>
    </SellerFrame>
  );
}

const gf = StyleSheet.create({
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center', marginBottom: S.lg },
  title: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: C.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: C.textSecondary, marginTop: S.sm },
});

export { C as SellerColors };
