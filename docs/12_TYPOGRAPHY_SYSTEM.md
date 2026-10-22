# GlowVAI Typography System

**Audience:** designers and front-end developers.
**Source of truth:** `mobile/src/theme/typography.ts` (mobile) and the `.wordmark` rules plus the Google Fonts link in `web/index.html` and `docs/index.html` (web and admin).

## 1. Families and their jobs

| Family | Role | Mobile name | Web |
|---|---|---|---|
| **Fraunces** (600 SemiBold, 700 Bold, 600 Italic) | Brand wordmark, page titles, logo letter | `Fraunces_600SemiBold`, `Fraunces_700Bold`, `Fraunces_600SemiBold_Italic` | `Fraunces` |
| **Plus Jakarta Sans** (400 to 700) | All interface text: body, labels, buttons, numbers in metric cards | `PlusJakartaSans_400Regular` … `_700Bold` | `Plus Jakarta Sans` |
| **JetBrains Mono** (500, 700) | Codes: order IDs, UTR numbers, bin locations, PINs, SKU codes | `JetBrainsMono_500Medium`, `_700Bold` | `JetBrains Mono` |

Why these three: Fraunces gives the brand a warm, editorial character suited to beauty retail without looking decorative. Plus Jakarta Sans is open and legible at small sizes on busy store screens. JetBrains Mono keeps codes unambiguous (0 vs O, 1 vs l).

## 2. Weights

Use **400, 500, 600, 700 only.** The previous UI used 800 in roughly 565 places, which made every label compete with every heading. Hierarchy now comes from size and family, not from weight alone.

- 400: body copy
- 500: subtitles, supporting text
- 600: labels, buttons, emphasis in running text
- 700: titles, metric values

## 3. Size scale (mobile, in `TypeScale`)

| Token | Size / line height | Use |
|---|---|---|
| caption | 12 / 16 | footnotes, helper text |
| label | 12 / 16, +0.2 tracking | field labels, chips |
| body | 14 / 21 | paragraphs, list rows |
| bodyStrong | 14 / 21, 600 | emphasised rows |
| subtitle | 16 / 24, 500 | section intros |
| title | 18 / 24 | card titles |
| headline | 22 / 28 | screen headings |
| display | 28 / 34, Fraunces | page titles, hero text |
| metric | 24 / 30 | KPI values |
| code | 13 / 18, mono | IDs and codes |

**Floor: 12px.** Nothing in the app renders smaller. Previously 440 declarations were 11px, 199 were 10px and some were 8px.

## 4. The wordmark

"Glow" is set in Fraunces italic. "VAI" is set in Plus Jakarta Sans bold, tracked at +1.2 and coloured in the brand blue. The brand is always written **GlowVAI**, never `GLOWVAI` or `GlowVai`, except in code identifiers.

- Mobile: `<Wordmark size={…} />` from `src/components/Wordmark.tsx`. Used on the splash screen, login, and all navigation rails.
- Web: `<span class="wordmark"><em>Glow</em><b>VAI</b></span>`. Used in the sidebar, login heading, and settings heading.

## 5. Rules for new screens

1. Never set a `fontWeight` above 700.
2. Never set a `fontSize` below 12.
3. Use `FontFamily` tokens, not raw strings. Codes always use the mono family.
4. Titles use Fraunces (`display` or `displayBold`). Everything else uses Plus Jakarta Sans.
5. Use the `Wordmark` component for the brand. Do not type the brand name as plain text in a header.
6. Use vector icons (Ionicons on mobile, Font Awesome on web) rather than emoji for interface icons. Emoji are acceptable inside user-generated or message text.

## 6. Implementation notes

- Fonts are loaded per face from sub-paths (for example '@expo-google-fonts/fraunces/600SemiBold'), so only the nine faces in use ship. Font payload in the web export: about 1.4 MB (down from about 4.8 MB).
- Icons are imported per set ('@expo/vector-icons/Ionicons', '@expo/vector-icons/Feather'). Importing the package root pulled in every icon font (about 3.5 MB).
- On Android a weight is selected by family name, not by fontWeight, so each weight is its own family name. Keep the mapping in 'familyForWeight' when adding styles.
- Brand blue is #1D4ED8 everywhere. The legacy #0050ff palette was removed from the theme, the admin screen, and the shared components.
- The admin map HTML inside the mobile app still uses the generic monospace fallback, because it runs in a WebView without the app fonts.
