/**
 * GlowVai Vendor App — Typography system
 *
 * Same type as the GlowVai shop and admin panel:
 *   • Inter               — all interface text and titles
 *   • JetBrains Mono      — codes: order IDs, UTR numbers, bin locations, PINs
 *
 * Weights are limited to 400 / 500 / 600 / 700. Heavier weights were removed on
 * purpose: they flattened the hierarchy and made every screen look the same.
 *
 * The family names below must match the names passed to useFonts() in app/_layout.tsx.
 */

export const FontFamily = {
  // Titles (Inter)
  display: 'Inter_700Bold',
  displayBold: 'Inter_700Bold',
  displayItalic: 'Inter_600SemiBold',

  // Interface (Inter)
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',

  // Codes and numbers (JetBrains Mono)
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

/** Maps a CSS-style weight to the matching interface family. */
export function familyForWeight(weight: '400' | '500' | '600' | '700' | '800' | '900' = '400') {
  switch (weight) {
    case '500':
      return FontFamily.medium;
    case '600':
      return FontFamily.semibold;
    case '700':
    case '800':
    case '900':
      return FontFamily.bold;
    default:
      return FontFamily.regular;
  }
}

/** Type scale. Every size is at least 12px for legibility under store lighting. */
export const TypeScale = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: FontFamily.regular },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2, fontFamily: FontFamily.semibold },
  body: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.regular },
  bodyStrong: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.semibold },
  subtitle: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.medium },
  title: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2, fontFamily: FontFamily.bold },
  headline: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3, fontFamily: FontFamily.bold },
  display: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontFamily: FontFamily.display },
  metric: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4, fontFamily: FontFamily.bold },
  code: { fontSize: 13, lineHeight: 18, fontFamily: FontFamily.mono },
} as const;

/** Brand wordmark: "Glow" and "Vai" in Inter Bold (one lockup everywhere: "GlowVai"). */
export const Wordmark = {
  glow: { fontFamily: FontFamily.bold },
  vai: { fontFamily: FontFamily.bold },
} as const;
