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
  Platform,
  StyleSheet,
  useWindowDimensions,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import Wordmark from '../../components/Wordmark';
import { Colors } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import { formatBytes, type AttachedFile } from './draft';

// ── Scale ─────────────────────────────────────────────────────────────────────
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const R = { input: 10, card: 14, pill: 999 } as const;
export const FORM_MAX = 720;
export const WIDE_MAX = 1040;

const C = {
  ...Colors,
  page: '#F6F8FB',
  errorText: '#B91C1C',
  successText: '#15803D',
  warningText: '#B45309',
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
      document.title = `${title} · glowvai Sellers`;
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
          <Wordmark lowercase size={22} />
          <View style={h.divider} />
          <Text style={h.portal}>Sellers</Text>
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
  divider: { width: 1, height: 18, backgroundColor: C.border, marginHorizontal: S.sm + 2 },
  portal: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
});

// ── Progress ──────────────────────────────────────────────────────────────────
export const STEP_NAMES = ['Store details', 'Tax and documents', 'Bank account', 'Categories and review'];

export function StepProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}`}
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
  card: { backgroundColor: C.background, borderRadius: R.card, borderWidth: 1, borderColor: C.border, marginBottom: S.lg },
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
  const textColor = disabled && variant === 'primary' ? C.textSubtle : v.color;
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
  primary: { bg: C.primary, border: C.primary, color: '#FFFFFF', pressed: C.primaryPressed },
  secondary: { bg: C.background, border: '#CBD5E1', color: C.textPrimary, pressed: C.surface },
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
  primaryDisabled: { backgroundColor: '#E2E8F0', borderColor: '#E2E8F0' },
  text: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22 },
  textCompact: { fontFamily: FontFamily.semibold, fontSize: 15 },
});

/** Inline text link with a 44px touch target. */
export function LinkButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [lk.hit, pressed && { opacity: 0.6 }]}
    >
      <Text style={lk.text}>{label}</Text>
    </Pressable>
  );
}

const lk = StyleSheet.create({
  hit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  text: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.primary, textDecorationLine: 'underline' },
});

// ── Banner ────────────────────────────────────────────────────────────────────
type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, { bg: string; border: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { bg: C.primaryLight, border: C.primaryBorder, color: '#1E3A8A', icon: 'information-circle' },
  success: { bg: C.successLight, border: C.successBorder, color: '#14532D', icon: 'checkmark-circle' },
  warning: { bg: C.warningLight, border: C.warningBorder, color: '#78350F', icon: 'alert-circle' },
  error: { bg: C.dangerLight, border: C.dangerBorder, color: '#7F1D1D', icon: 'alert-circle' },
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
      <View style={[cb.box, checked && cb.boxOn]}>{checked ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}</View>
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

// ── File attach ───────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PDF = 'application/pdf';
const IMAGES = ['image/jpeg', 'image/png'];

function guessMime(name: string, mime?: string | null): string {
  if (mime) return mime === 'image/jpg' ? 'image/jpeg' : mime;
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return PDF;
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return '';
}

export function FileField({
  label,
  helper,
  value,
  onChange,
  allowPdf = true,
  error,
  testID,
}: {
  label: string;
  helper?: string;
  value: AttachedFile | null;
  onChange: (file: AttachedFile | null) => void;
  allowPdf?: boolean;
  error?: string;
  testID?: string;
}) {
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState('');
  const allowed = allowPdf ? [PDF, ...IMAGES] : IMAGES;
  const typesText = allowPdf ? 'PDF, JPG or PNG' : 'JPG or PNG';

  const pick = async () => {
    setPickError('');
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: allowed, copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      const mimeType = guessMime(a.name, a.mimeType);
      const size = a.size ?? (a as any).file?.size ?? 0;
      if (!allowed.includes(mimeType)) {
        setPickError(`This file type isn’t accepted. Use ${typesText}.`);
        return;
      }
      if (!size) {
        setPickError('This file is empty. Choose another file.');
        return;
      }
      if (size > MAX_FILE_BYTES) {
        setPickError(`This file is ${formatBytes(size)}. The limit is 5 MB.`);
        return;
      }
      // Web pickers return blob:/data: URIs that cannot be stored; keep only the details.
      const uri = /^(blob|data):/.test(a.uri) ? '' : a.uri;
      onChange({ name: a.name, size, mimeType, uri });
    } catch (_) {
      setPickError('The file picker didn’t open. Try again.');
    } finally {
      setPicking(false);
    }
  };

  const shownError = pickError || error;

  return (
    <View style={fl.wrap} testID={testID}>
      <Text style={tf.label}>{label}</Text>
      {helper ? <Text style={fl.helper}>{helper}</Text> : null}
      {value ? (
        <View style={fl.file}>
          <View style={fl.fileIcon}>
            <Ionicons name={value.mimeType === PDF ? 'document-text-outline' : 'image-outline'} size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={`${label}: ${value.name} attached`}>
            <Text style={fl.fileName} numberOfLines={1} ellipsizeMode="middle">
              {value.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Ionicons name="checkmark-circle" size={14} color={C.successText} style={{ marginRight: 4 }} />
              <Text style={fl.fileMeta}>
                {value.mimeType === PDF ? 'PDF' : value.mimeType === 'image/png' ? 'PNG' : 'JPG'} · {formatBytes(value.size)}
              </Text>
            </View>
          </View>
          <View style={fl.fileActions}>
            <Button label="Replace" variant="ghost" compact onPress={pick} accessibilityLabel={`Replace ${label}`} />
            <Button label="Remove" variant="ghost" compact onPress={() => onChange(null)} accessibilityLabel={`Remove ${label}`} />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          disabled={picking}
          accessibilityRole="button"
          accessibilityLabel={`Choose a file for ${label}`}
          accessibilityHint={`${typesText}, up to 5 MB`}
          style={({ pressed }) => [fl.drop, !!shownError && { borderColor: C.errorText }, pressed && { backgroundColor: C.primaryLight }]}
        >
          {picking ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={C.primary} />
          )}
          <View style={{ marginLeft: S.md, flex: 1 }}>
            <Text style={fl.dropTitle}>{picking ? 'Opening your files…' : 'Choose file'}</Text>
            <Text style={fl.dropSub}>{typesText}, up to 5 MB</Text>
          </View>
        </Pressable>
      )}
      {shownError ? (
        <View style={tf.msgRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={C.errorText} style={tf.msgIcon} />
          <Text style={[tf.msg, tf.msgInRow, { color: C.errorText }]}>{shownError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const fl = StyleSheet.create({
  wrap: { marginBottom: S.lg + 2 },
  helper: { fontSize: 13, lineHeight: 19, color: C.textSubtle, marginTop: -2, marginBottom: S.sm },
  drop: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.inputBorder,
    borderRadius: R.input,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: C.background,
  },
  dropTitle: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.primary },
  dropSub: { fontSize: 13, color: C.textSubtle, marginTop: 1 },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: C.successBorder,
    backgroundColor: '#FBFEFC',
    borderRadius: R.input,
    paddingLeft: S.md,
    paddingVertical: S.xs,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  fileName: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.textPrimary },
  fileMeta: { fontSize: 13, color: C.textSecondary },
  fileActions: { flexDirection: 'row', marginLeft: 'auto' },
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
  item: { minWidth: 52, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
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

export { C as SellerColors };
