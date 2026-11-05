/**
 * Compatibility layer for older imports of `src/theme`.
 *
 * The single source of truth is `./tokens` (colours, spacing, radii, shadows) and
 * `./typography` (Inter type scale). Every value here is derived from those files so
 * there is only one palette. New code should import from `./tokens` and `./typography`.
 */
import { Colors as T, Spacing as TS, BorderRadii, Shadows as TShadows } from './tokens';
import { FontFamily } from './typography';

export const Colors = {
  ink: T.textPrimary,
  inkLight: T.textPrimary,
  sub: T.textSecondary,
  line: T.border,
  card: T.card,
  bg: T.background,
  pageBg: T.canvas,

  green: T.successText,
  greenBg: T.successLight,
  red: T.dangerText,
  redBg: T.dangerLight,
  amber: T.warningText,
  amberBg: T.warningLight,

  danger: T.danger,
  dangerLight: T.dangerLight,
  dangerBorder: T.dangerBorder,
  successTint: T.successLight,

  primary: T.primary,
  primaryDark: T.primaryPressed,
  primaryLight: T.primaryLight,
  primaryBorder: T.primaryBorder,

  brand: T.primary,
  brandText: T.textOnPrimary,

  carbon: T.textPrimary,
  carbonLight: T.textSecondary,

  pillNeutral: T.surface,
  pillNeutralText: T.textSecondary,
} as const;

export const Typography = {
  h1: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontFamily: FontFamily.semibold },
  section: { fontSize: 12, fontFamily: FontFamily.semibold, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: T.textMuted },
  body: { fontSize: 14, fontFamily: FontFamily.regular },
  bodyBold: { fontSize: 14, fontFamily: FontFamily.semibold },
  small: { fontSize: 13, fontFamily: FontFamily.regular, color: T.textMuted },
  label: { fontSize: 12, fontFamily: FontFamily.semibold, color: T.textMuted },
  big: { fontSize: 32, fontFamily: FontFamily.bold, letterSpacing: -0.8 },
  stat: { fontSize: 20, fontFamily: FontFamily.bold },
  timer: { fontSize: 28, fontFamily: FontFamily.bold },
} as const;

export const Spacing = TS;

export const Radius = {
  sm: BorderRadii.input,
  md: BorderRadii.button,
  lg: BorderRadii.card,
  xl: BorderRadii.sheet,
  pill: BorderRadii.pill,
  card: BorderRadii.card,
  full: BorderRadii.pill,
} as const;

export const Shadows = {
  card: TShadows.card,
  sheet: TShadows.raised,
} as const;
