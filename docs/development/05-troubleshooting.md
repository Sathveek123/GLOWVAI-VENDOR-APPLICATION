# Development 05: troubleshooting

## "Unable to reach merchant service" on the splash screen

- The backend is not running. Start it with `cd backend && npm start`.
- `EXPO_PUBLIC_VENDOR_API_URL` points at the wrong address. On a phone, use the computer's LAN IP.
- The phone and computer are on different networks.

## Mobile app shows sample data and no live orders

This is expected in development when no backend is running. Check the backend health endpoint (`/api/health`) and the value of `EXPO_PUBLIC_VENDOR_API_URL`.

## Home screen stops responding after the realtime connection

Known issue. See [Feature 12](../features/12-realtime-and-offline-behaviour.md#known-issue-home-stall). Note what you were doing and whether `order:incoming` events were arriving, then report it with the device model.

## Fonts look wrong on Android

Android selects font weights by family name. Each weight is its own family (for example `PlusJakartaSans_700Bold`). If a style uses a weight that is not mapped, Android falls back to the system font. Use `familyForWeight()` in `mobile/src/theme/typography.ts`. See [typography](../12_TYPOGRAPHY_SYSTEM.md).

## Icons are missing

Icons are imported per set (`@expo/vector-icons/Ionicons`, `/Feather`). Importing the package root loads every icon font and is avoided on purpose.

## Type check fails after a merge

Run `cd mobile && npx tsc --noEmit` and fix the first error. Duplicate style keys and duplicate props are the most common causes after a bulk edit.

## Web page shows the wrong screen

Each web screen is a section with an id (`page-*`). Duplicate ids make the browser show the first match. Search `web/index.html` for the id to confirm there is only one.

## Web layout breaks on a phone

The web sidebar becomes a top bar below 900 px. A device bar with a dropdown can overflow. It uses flex-wrap; check the viewport bar first.

## Port already in use

- Backend: change `PORT` in `backend/.env`.
- Web: `npx serve . -p 8083` (or any free port) in `web/`.
- Expo: press `a` or `w` in the Expo menu, or stop the old dev server.

## Still stuck

Record the exact command, the error text, the platform, and the commit hash (`git rev-parse --short HEAD`). Include them when reporting.
