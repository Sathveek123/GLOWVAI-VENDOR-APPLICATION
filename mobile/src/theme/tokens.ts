/**
 * GlowVAI Vendor App — Production Blue & White Design Tokens
 * Single Source of Truth for Design System Colors, Typography & Spacing
 */

export const Colors = {
  // Brand Blue Tokens
  primary: '#1D4ED8',        // Royal Blue (Buttons, Active Tabs, Switches)
  primaryPressed: '#1E40AF', // Pressed State Blue
  primaryLight: '#EFF6FF',   // Soft Blue Highlight (Selected Chips, Light Backings)
  primaryBorder: '#BFDBFE',  // Light Blue Borders

  // Canvas & Surfaces
  background: '#FFFFFF',     // Pure White Screen Background
  surface: '#F8FAFC',        // Slate Tint for Page Sections & Input Fills
  card: '#FFFFFF',           // Crisp White Card Container
  border: '#E2E8F0',         // Clean Border

  // Typography Contrast (WCAG AA Compliant)
  textPrimary: '#0F172A',    // Deep Slate Text
  textSecondary: '#475569',  // Medium Slate Text
  textMuted: '#94A3B8',      // Muted Gray Labels

  // Status & Contextual Colors (Used strictly for functional status)
  success: '#16A34A',        // Green (Delivered, In Stock)
  successLight: '#F0FDF4',   // Green Tint
  successBorder: '#BBF7D0',

  warning: '#D97706',        // Amber (Low Stock, Countdown Timers)
  warningLight: '#FFFBEB',   // Amber Tint
  warningBorder: '#FDE68A',

  danger: '#DC2626',         // Red (Cancel, Out of Stock, Rejection)
  dangerLight: '#FEF2F2',    // Red Tint
  dangerBorder: '#FCA5A5',

  // Bin Coordinate Pill (Dark Store Warehouse Bins)
  binBg: '#EFF6FF',
  binText: '#1D4ED8',
  binBorder: '#BFDBFE',
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
  card: 12,
  pill: 999,
};

export const Typography = {
  fontFamily: 'PlusJakartaSans_400Regular',
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
  Typography,
};
