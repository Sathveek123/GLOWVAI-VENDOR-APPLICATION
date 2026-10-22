/**
 * GlowVAI Vendor App — Design System Theme
 * Colors, typography, spacing, shadows — mirroring the Figma screen flow
 */

export const Colors = {
  // Core palette
  ink:        '#0a0a0a',
  inkLight:   '#1c1c1c',
  sub:        '#6b6b6b',
  line:       '#e7e7e7',
  card:       '#f7f7f7',
  bg:         '#ffffff',
  pageBg:     '#f1f1f1',

  // Status colors (Exact user specified green #16A34A and red #DC2626)
  green:      '#16A34A', // Active duty green
  greenBg:    '#F0FDF4',
  red:        '#DC2626', // Offline duty red
  redBg:      '#FEF2F2',
  amber:      '#b5820a',
  amberBg:    '#fbeecb',

  danger:       '#DC2626',
  dangerLight:  '#FEF2F2',
  dangerBorder: '#FCA5A5',
  successTint:  '#DCFCE7',

  // Vibrant Brand Royal Blue Palette (#1D4ED8)
  primary:      '#1D4ED8',
  primaryDark:  '#1E40AF',
  primaryLight: '#EFF6FF',
  primaryBorder:'#BFDBFE',

  // Brand Primary
  brand:        '#1D4ED8',
  brandText:    '#ffffff',

  // Dark Carbon
  carbon:       '#0f172a',
  carbonLight:  '#1e293b',

  // Neutral pills
  pillNeutral:    '#f1f5f9',
  pillNeutralText:'#334155',
} as const;

export const Typography = {
  h1:        { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const, letterSpacing: -0.5 },
  h2:        { fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const, letterSpacing: -0.2 },
  h3:        { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' as const },
  section:   { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: Colors.sub },
  body:      { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' as const },
  bodyBold:  { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' as const },
  small:     { fontSize: 12.5, fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' as const, color: Colors.sub },
  label:     { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '600' as const, color: Colors.sub },
  big:       { fontSize: 34, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const, letterSpacing: -0.8 },
  stat:      { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const },
  timer:     { fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const },

  // Syne Semi-Bold & Bold Brand Wordmarks
  syneSemiBold: {
    
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  syneBold: {
    
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  syneExtraBold: {
    
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:  14,
  lg:  20,
  xl:  28,
  xxl: 36,
} as const;

export const Radius = {
  sm:   8,
  md:  10,
  lg:  12,
  xl:  14,
  pill:20,
  card:14,
  full:999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
