# GlowVai Typography System

**Audience:** designers and front-end developers.
**Source of truth:** `mobile/src/theme/typography.ts` (families, weights, type scale) and `mobile/src/theme/tokens.ts` (colours). Fonts are loaded in `mobile/app/_layout.tsx`.

The vendor app uses the same type as the GlowVai shop and admin panel, so the three products read as one brand.

## 1. Families and their jobs

| Family | Role | Mobile family names |
|---|---|---|
| **Inter** (400, 500, 600, 700) | Everything: titles, body, labels, buttons, metric values, the wordmark | `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` |
| **JetBrains Mono** (500, 700) | Codes only: order IDs, pickup and verification codes, UTR numbers, bin locations, SKU codes | `JetBrainsMono_500Medium`, `JetBrainsMono_700Bold` |

Why: Inter is neutral, very legible at small sizes and matches the rest of GlowVai. JetBrains Mono keeps codes unambiguous (0 vs O, 1 vs l) when a shop owner reads them aloud to a rider or support.

Fraunces and Plus Jakarta Sans were used before the redesign and are no longer part of the system. Do not use them in new work.

## 2. Weights

Use **400, 500, 600 and 700 only.** Hierarchy comes from size and colour first, weight second.

- 400: body copy
- 500: subtitles, supporting text
- 600: labels, buttons, emphasis in running text
- 700: screen titles, card titles, metric values

## 3. Size scale (`TypeScale`)

| Token | Size / line height | Family | Use |
|---|---|---|---|
| caption | 12 / 16 | Inter 400 | footnotes, helper text |
| label | 12 / 16, +0.2 tracking | Inter 600 | field labels, chips |
| body | 14 / 21 | Inter 400 | paragraphs, list rows |
| bodyStrong | 14 / 21 | Inter 600 | emphasised rows |
| subtitle | 16 / 24 | Inter 500 | section intros |
| title | 18 / 24, -0.2 tracking | Inter 700 | card titles |
| headline | 22 / 28, -0.3 tracking | Inter 700 | screen headings |
| display | 28 / 34, -0.5 tracking | Inter 700 | hero text (sign-in, approval) |
| metric | 24 / 30, -0.4 tracking | Inter 700 | KPI values |
| code | 13 / 18 | JetBrains Mono 500 | IDs and codes |

**Floor: 12px.** Nothing in the app renders smaller.

## 4. Colour with type

| Token | Value | Use |
|---|---|---|
| `Colors.textPrimary` | `#0F172A` | headings and body |
| `Colors.textMuted` | `#64748B` | secondary text (4.7:1 on white, passes AA) |
| `Colors.primary` | `#0057FB` | links, the one primary action per screen, the "vai" in the wordmark |

Text sits on white cards over the `#F4F6FA` canvas. Status colours are only for status labels, never for decoration.

## 5. The wordmark

The brand is written **GlowVai** in running text. On screen, use `<Wordmark />` from `mobile/src/components/Wordmark.tsx` rather than typing the name in a header. It renders "Glow" and "Vai" in Inter, with the second part in the brand blue; `lowercase` gives the website's "glowvai" lockup used on sign-in and onboarding.

## 6. Rules for new screens

1. Never set a `fontWeight` above 700, and never pass `'800'` or `'900'` to `familyForWeight`.
2. Never set a `fontSize` below 12.
3. Use `FontFamily` and `TypeScale` tokens, not raw family strings. Codes always use the mono family.
4. Use theme colour tokens, never new hex values.
5. Use vector icons (Ionicons or Feather), not emoji, for interface icons and controls.

## 7. Implementation notes

- Fonts are loaded per face from sub-paths (for example `@expo-google-fonts/inter/600SemiBold`), so only the six faces in use ship.
- Icons are imported per set (`@expo/vector-icons/Ionicons`, `@expo/vector-icons/Feather`). Importing the package root pulls in every icon font.
- On Android a weight is selected by family name, not by `fontWeight`, so each weight is its own family. Keep the mapping in `familyForWeight` when adding styles.
- `app/_layout.tsx` sets Inter 400 as the default family for any `Text` without an explicit one.
- The PC web command centre (`web/index.html`) still loads the pre-redesign fonts (Fraunces, Plus Jakarta Sans). It should move to Inter and JetBrains Mono when that page is redesigned.
- `@expo-google-fonts/fraunces` and `@expo-google-fonts/plus-jakarta-sans` are still listed in `mobile/package.json` but no longer imported; they can be removed.
