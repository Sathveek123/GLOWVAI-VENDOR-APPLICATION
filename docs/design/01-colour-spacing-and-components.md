# Design 01: colour, spacing and components

**Audience:** designers and front-end developers.
**Source of truth:** `mobile/src/theme/tokens.ts` (colours, spacing, radius), `mobile/src/theme/typography.ts` (type), and the `:root` tokens in `web/index.html`.

## Colour

Brand blue is `#1D4ED8` everywhere. The old `#0050ff` is removed from the theme, the admin screen, and shared components.

| Token | Value | Use |
|---|---|---|
| `primary` | `#1D4ED8` | Buttons, active tabs, switches |
| `primaryPressed` | `#1E40AF` | Pressed state |
| `primaryLight` | `#EFF6FF` | Selected chips and soft backgrounds |
| `primaryBorder` | `#BFDBFE` | Light blue borders |
| `background` | `#FFFFFF` | Screen background |
| `surface` | `#F8FAFC` | Page sections and input fills |
| `border` | `#E2E8F0` | Dividers and card borders |
| `textPrimary` | `#0F172A` | Headings and body |
| `textSecondary` | `#475569` | Supporting text |
| `textMuted` | `#94A3B8` | Labels and hints |
| `success` | `#16A34A` | Delivered, in stock |
| `warning` | `#D97706` | Low stock, countdowns |
| `danger` | `#DC2626` | Cancelled, out of stock, rejected |

Each status colour has a light tint and a border token (for example `successLight`, `successBorder`).

**Rule:** do not use a colour not in the token list. Add a token first.

## Typography

Summarised here. Full rules are in [12_TYPOGRAPHY_SYSTEM.md](../12_TYPOGRAPHY_SYSTEM.md).

- Fraunces for titles and the wordmark. Plus Jakarta Sans for interface text. JetBrains Mono for codes.
- Weights 400, 500, 600, 700 only.
- Minimum size 12 px.

## Components

Mobile primitives live in `mobile/src/components/`:

| Component | Purpose |
|---|---|
| `Wordmark` | Brand wordmark ("Glow" italic and "VAI") |
| `AppHeader` | Screen header with the notification bell |
| `ScreenShell` | Common screen wrapper with safe-area padding |
| `MobileBottomNav` | Bottom navigation |
| `IncomingOrderModal` | Incoming order alert with countdown |
| `ComingSoon` | `withComingSoon()` placeholder for production builds |
| `ui.tsx` | Shared buttons, cards and inputs |
| `CustomerAppRedirectButton` | Storefront link, shown only when `EXPO_PUBLIC_CUSTOMER_APP_URL` is set |
| `RealInteractiveMap` | Map for the GPS pin |
| `OwlLoader` | Loading indicator |

The web command centre uses the same colours through CSS variables, plus `.wordmark`, `.toast`, and the sidebar and page classes.

## Icons

- Mobile: Ionicons and Feather. Import per set.
- Web: Font Awesome. Emoji are used inside sample data only, not as interface icons.

## Layout

- Phone width: 360–430 px, 16 px side gutter, no horizontal scroll.
- Web: the sidebar is 260 px. Below 900 px it becomes a top bar, and grids collapse to one column.

## Known gaps

- The admin map inside the mobile app uses a generic monospace font because it runs in a WebView.
- Some web pages still use inline styles. New work should use the classes.
