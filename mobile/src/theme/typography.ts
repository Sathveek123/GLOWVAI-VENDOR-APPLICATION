/**
 * GlowVAI Vendor App — Typography system
 *
 * Three families, each with a clear job:
 *   • Fraunces            — brand wordmark and page titles (soft, editorial serif)
 *   • Plus Jakarta Sans   — all interface text (clean, highly legible at small sizes)
 *   • JetBrains Mono      — codes: order IDs, UTR numbers, bin locations, PINs
 *
 * Weights are limited to 400 / 500 / 600 / 700. Heavier weights were removed on
 * purpose: they flattened the hierarchy and made every screen look the same.
 *
 * The family names below must match the names passed to useFonts() in app/_layout.tsx.
 */

export const FontFamily = {
  // Brand display (Fraunces)
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_600SemiBold_Italic',

  // Interface (Plus Jakarta Sans)
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',

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

/** Brand wordmark: "Glow" in Fraunces italic, "VAI" in tracked Plus Jakarta Sans. */
export const Wordmark = {
  glow: { fontFamily: FontFamily.displayItalic },
  vai: { fontFamily: FontFamily.bold, letterSpacing: 1.2 },
} as const;
