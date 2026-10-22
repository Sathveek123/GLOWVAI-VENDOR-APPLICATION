# Development 03: testing and QA

## What exists today

- **Type check:** `cd mobile && npx tsc --noEmit`. The only automated check that runs on every change.
- **Lint:** `cd mobile && npm run lint` (ESLint configuration in the mobile package).
- **Backend tests:** the `test` script runs Jest, but the repository contains no test files yet.
- **Manual review:** screen-by-screen checks against the screen docs in `docs/mobile/` and `docs/web/`.

## Development test strips

Most screens have a strip of buttons that force a state (for example "Rider delayed", "Sync failure", "Stale data"). These are for reviewing states, not for users.

- Mobile strips render only when `__DEV__` is true. Coming-soon screens show the placeholder in production.
- Web strips are part of the static prototype and are always visible. Remove or gate them before release. The list is in [Known gaps](#known-gaps).

## Checklist for each screen change

1. Type check passes.
2. The screen works with the backend stopped (it shows an error state, not invented data).
3. Loading, empty, error and offline states are shown correctly.
4. Text is at least 12 px and uses only the three font families (see [typography](../design/01-colour-spacing-and-components.md) and [12_TYPOGRAPHY_SYSTEM.md](../12_TYPOGRAPHY_SYSTEM.md)).
5. The screen works at phone width (360–430 px) with no horizontal scroll.
6. Font scale 130% does not clip text (use the developer header preview, [mobile screens 11](../mobile/11-admin-and-dev-screens.md)).
7. No secrets, test PINs or sample personal data appear in production builds.

## Devices

| Platform | Status |
|---|---|
| iOS simulator | Used for layout checks |
| Android device | Not yet tested on hardware. Required before release. |
| Web (`expo export --platform web`) | Used for layout checks |
| PC browser (command centre) | Used for layout checks at desktop and phone widths |

## Known gaps

- No automated UI tests.
- No backend tests.
- The home-screen stall has no reproduction script. See [Feature 12](../features/12-realtime-and-offline-behaviour.md#known-issue-home-stall).
- Developer strips still visible on the web team page (see [web pages 08](../web/08-team-support-and-compliance.md)).
