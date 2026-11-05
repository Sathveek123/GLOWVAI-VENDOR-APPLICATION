/**
 * GlowVAI Vendor App — Production Blue & White Design Tokens
 * Single Source of Truth for Design System Colors, Typography & Spacing
 */

export const Colors = {
  // Brand Blue Tokens
  primary: '#0057FB',        // Royal Blue (Buttons, Active Tabs, Switches)
  primaryPressed: '#0046CC', // Pressed State Blue
  primaryLight: '#EEF4FF',   // Soft Blue Highlight (Selected Chips, Light Backings)
  primaryBorder: '#C7DAFE',  // Light Blue Borders

  // Canvas & Surfaces
  background: '#FFFFFF',     // Pure White Screen Background
  surface: '#F4F6FA',        // Slate Tint for Page Sections & Input Fills
  card: '#FFFFFF',           // Crisp White Card Container
  canvas: '#F4F6FA',         // Page canvas behind white cards (same value as surface)
  border: '#E2E8F0',         // Clean Border
  borderStrong: '#CBD5E1',   // Secondary button outline, dividers that must stay visible

  // Typography Contrast (WCAG AA Compliant)
  textPrimary: '#0F172A',    // Deep Slate Text
  textSecondary: '#475569',  // Medium Slate Text
  textMuted: '#64748B',      // Muted grey labels (4.7:1 on white, passes AA)
  textSubtle: '#64748B',     // Helper text and placeholders (4.7:1 on white)
  inputBorder: '#8291A7',    // Input outline (3.2:1 on white, meets non-text contrast)
  textOnPrimary: '#FFFFFF',  // Text and icons on primary blue (5.6:1)

  // Disabled controls: readable text on a quiet grey (6.2:1)
  disabledBg: '#E2E8F0',
  disabledText: '#475569',

  // Status & Contextual Colors (Used strictly for functional status)
  success: '#16A34A',        // Green (Delivered, In Stock)
  successLight: '#F0FDF4',   // Green Tint
  successBorder: '#BBF7D0',
  successText: '#067647',    // Green text on white or green tint (AA)

  warning: '#B45309',        // Amber (Low Stock, Countdown Timers)
  warningLight: '#FFFBEB',   // Amber Tint
  warningBorder: '#FDE68A',
  warningText: '#92400E',    // Amber text on amber tint (AA)

  danger: '#DC2626',         // Red (Cancel, Out of Stock, Rejection)
  dangerLight: '#FEF2F2',    // Red Tint
  dangerBorder: '#FCA5A5',
  dangerText: '#B42318',     // Red text on white or red tint (AA)

  infoText: '#1E3A8A',       // Blue text on primary tint (AA)

  // Scrim behind sheets and dialogs
  overlay: 'rgba(15, 23, 42, 0.45)',

  // Bin Coordinate Pill (Dark Store Warehouse Bins)
  binBg: '#EEF4FF',
  binText: '#0057FB',
  binBorder: '#C7DAFE',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadii = {
  input: 8,
  button: 10,
  card: 12,
  sheet: 16,
  pill: 999,
};

/** Very soft card shadow used on white cards over the canvas. */
export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

/** Layout breakpoints shared by the shell and screens. */
export const Breakpoints = {
  /** Below this width the layout is a phone layout. */
  tablet: 600,
  /** At or above this width the vendor shell shows the left sidebar instead of bottom tabs. */
  desktop: 1024,
} as const;

export const Typography = {
  fontFamily: 'Inter_400Regular',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export default {
  Colors,
  Spacing,
  BorderRadii,
  Shadows,
  Breakpoints,
  Typography,
};
