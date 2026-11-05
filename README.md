# GlowVai Vendor App

The app local beauty and skincare shops use to sell through GlowVai: register the store, list stock, go online, receive order offers, pack orders and hand them to a delivery partner. It is one of four GlowVai products (shop, admin panel, delivery partner app, vendor app) that share one Firebase project. The first market is a Vijayawada pilot.

What the app must do is defined by the **GlowVai Vendor PRD (v1.0)**. This README says what is actually built and connected today.

> **Status: front end built, not yet connected to live data.** The screens exist and follow the GlowVai design. The data layer still points at a legacy backend that is not deployed, and the server pieces the PRD needs (SMS sign-in, order offers, atomic accept, QR pickup) do not exist yet. A production build cannot sign a vendor in. Do not give it to real shops yet.

## What is in this repo

| Path | What it is | State |
|---|---|---|
| `mobile/` | The vendor app: Expo SDK 51, Expo Router 3.5, React Native 0.74, TypeScript, Zustand | Main product. Android and web; iOS config exists but is untested. |
| `mobile/src/config/` | `env.ts` (build config and the production config check) and `firebase.ts` (lazy Firebase client for glowvai-38bde) | New; not yet used by the screens |
| `web/` | PC "command centre" prototype, a single static HTML page | Prototype, not connected. The PRD puts the desktop app after the mobile MVP. |
| `backend/` | Express + Socket.IO server | **Legacy.** Points at the old Firebase project glowvai-v2 and is not deployed. See below. |
| `render.yaml` | Render blueprint for the legacy backend | Never deployed |
| `docs/` | Feature, screen, development and design docs; [CONNECTIONS.md](docs/CONNECTIONS.md) is the Firestore data contract | Some older specs are marked superseded |
| `screen_docs/`, `web_screen_docs/` | Per-screen specs from before the redesign | Reference only |

## Brand

- **Type:** Inter for all text (weights 400 to 700, nothing under 12px); JetBrains Mono only for codes such as order IDs, pickup codes, UTRs and bin locations. See [docs/12_TYPOGRAPHY_SYSTEM.md](docs/12_TYPOGRAPHY_SYSTEM.md).
- **Colour:** GlowVai blue `#0057FB` for the one primary action on a screen; white cards on a `#F4F6FA` canvas; muted text `#64748B`. Status colours are only for status.
- **Tokens:** `mobile/src/theme/tokens.ts` and `mobile/src/theme/typography.ts`. Use them; do not add new hex values.
- The same type and blue as the GlowVai shop and admin panel.

## Firebase: one shared project

The vendor app uses the shared GlowVai project **`glowvai-38bde`**, the same project as the shop and the admin panel. Its web config is in `mobile/.env.example` (these values identify the project; they are not secrets, and access is controlled by security rules).

- `mobile/src/config/firebase.ts` reads only `EXPO_PUBLIC_FIREBASE_*`, has no hardcoded fallbacks, and throws a clear error if the config is missing or names another project. Realtime Database is not used.
- The data contract the app will use (vendor applications, vendor profile, per-vendor stock, a vendor-safe order view, read-only products) is in [docs/CONNECTIONS.md](docs/CONNECTIONS.md).
- The legacy backend and the old docs refer to **glowvai-v2**. That project is not part of the platform: nothing the vendor app writes there reaches the shop or the admin panel.

## What is connected and what is not

| Area | Today | Needed |
|---|---|---|
| Sign-in by SMS code | Screens exist. No SMS is sent; the legacy backend only accepts a fixed development code. | An SMS provider and a server function that checks the code and returns a Firebase custom token |
| Store registration | Four onboarding steps collect the details on the device | Write `vendorApplications/VAPP-{uid}` in the shop's shape, upload documents to Storage (see CONNECTIONS.md) |
| Approval | Not connected | Admin panel server action that creates `vendors/{uid}` and sets the vendor claim |
| Online / offline | Toggle in the app, not saved anywhere real | Write `isOnline` and a `lastSeenAt` heartbeat to `vendors/{uid}` |
| Inventory | Screens exist; legacy backend only | `vendors/{uid}/vendorInventory/{productId}` against the published catalogue |
| Order offers (45 s), atomic accept, stock reservation | **Not built.** The legacy backend sends each order to one fixed vendor and has no server-owned expiry. | Server functions (place order and offer, accept offer, expire offers) |
| Packing and QR pickup | Packing checklist in the app; no pickup verification | Server-issued, signed, single-use QR token, verified by the rider app |
| Earnings | No real figures; commission and payout rules are not stated in the app | Server-written ledger using each vendor's agreement |
| Push notifications | None | FCM from the server for new offers |

Rules the app follows regardless: it never shows sample data or fake success; it never shows a customer's phone number, address or location (a first name after acceptance at most); a vendor never marks an order delivered; rejecting an order always needs a reason.

### The legacy backend (`backend/`)

`backend/src/server.js` is an Express + Socket.IO server with a mock mode. It defaults to **glowvai-v2**, is **not deployed** anywhere, and has known security gaps (public order-creation and return routes, a payment check that always succeeds, delivery and handover checks that can be skipped). It is kept only so the current screens can be exercised locally. The plan is to replace it with Firestore security rules plus a few Cloud Functions (see the roadmap). Do not deploy it or point it at glowvai-38bde as it is.

## Run it

Requirements: Node.js 20+, npm. For a phone: Expo Go or a development build. For Android builds: Android Studio.

```bash
cd mobile
npm install
cp .env.example .env        # glowvai-38bde config is already filled in
npx expo start              # press "w" for web, or scan the QR code
```

Optional, to exercise the screens against the legacy backend in mock mode (no Firebase credentials needed):

```bash
cd backend
npm install
npm start                   # http://localhost:4000, check /health
```

On a phone, set `EXPO_PUBLIC_VENDOR_API_URL` in `mobile/.env` to your computer's LAN address, for example `http://192.168.1.20:4000`.

The PC prototype needs no build: open `web/index.html` or run `npm run start` in `web/`.

## Environment variables (`mobile/.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_VENDOR_API_URL` | Vendor API base URL. Development: localhost or a LAN address. |
| `EXPO_PUBLIC_CUSTOMER_APP_URL` | Optional link to the GlowVai shop |
| `EXPO_PUBLIC_FIREBASE_*` | glowvai-38bde web config (six keys) |

Everything prefixed `EXPO_PUBLIC_` is compiled into the app, so never put a secret there. There is no vendor or store id variable: ids come only from the signed-in session. Full table: [docs/development/02-environment-variables.md](docs/development/02-environment-variables.md).

**Production config check.** `mobile/src/config/env.ts` exports `getConfigStatus()`. In a production build (`__DEV__` false) it fails when `EXPO_PUBLIC_VENDOR_API_URL` is missing, points at localhost or a private network address, or is not `https://`, and when the Firebase config is missing or is not glowvai-38bde. The root layout should call it once and, when `ok` is false, show `CONFIG_ERROR_COPY` instead of the app, so a misconfigured build fails loudly rather than silently calling localhost. In development it only logs a warning.

## Build

```bash
cd mobile
npx tsc --noEmit                           # type check, must pass
npx expo export --platform web             # web bundle in dist/
npx expo run:android --variant release     # Android release build (needs Android Studio)
```

The release build reads `mobile/.env` at build time, so set the real public API URL first; with a localhost URL the build will show the configuration error screen.

### Release signing: not ready for the Play Store

`mobile/android/app/build.gradle` signs **release builds with the debug keystore**. A build signed this way must not be uploaded to the Play Store: the debug key is a throwaway development key that anyone with the project can use. Before the first store upload, create a real upload keystore or set up EAS credentials (there is no `eas.json` yet), keep the keystore and its passwords out of git (`.gitignore` already excludes `*.keystore`, `*.jks`, `*.p12`, `*.p8`, `*.pem`, `credentials.json`, `google-services.json`), and point the release `signingConfig` at it.

## Roadmap

Aligned with PRD section 13.1 (Phase 1, all P0). The order matters: the PRD asks to prove one real order end to end before building more screens.

| P0 item | State | Next step |
|---|---|---|
| Vendor login and authentication | Screens only | SMS provider + OTP server function + `signInWithCustomToken` |
| Business registration and approval | Screens only | Write `vendorApplications/VAPP-{uid}`; admin approval creates `vendors/{uid}` |
| Store location and operating details | Collected in onboarding | Save with the application; changes after approval go through admin review |
| Inventory onboarding and stock updates | Screens only | `vendorInventory` subcollection, catalogue pick, CSV import |
| Online/offline toggle | Screen only | `isOnline` + `lastSeenAt` heartbeat on `vendors/{uid}` |
| Incoming order offers | Not built | Server places offers with a 45-second server-owned expiry; FCM push |
| Atomic order acceptance | Not built | `acceptOffer` transaction; losers get `ORDER_ALREADY_ASSIGNED` |
| Stock reservation | Legacy backend only | Reserve inside the accept transaction |
| Order details and packing checklist | Screens built | Read the vendor-safe `vendorOrders` projection |
| Mark as packed | Screen built | Server function; only after the checklist is complete |
| Delivery partner assignment integration | Not built | Shared order states with the delivery partner app |
| QR pickup verification | Not built | Signed single-use token, verified by the rider app |
| Vendor, customer and delivery permissions | Not built | Firestore and Storage rules in glowvai-38bde, App Check |
| Order history | Screen built | From `vendorOrders` |
| Basic earnings ledger | Screen built, no data | Server-written ledger entries per the vendor's agreement |
| Admin vendor and order management | In the GlowVai admin panel | Approval action and order oversight there |

Also before launch: upgrade from Expo SDK 51 (many dependency advisories are fixed only in later SDKs), set up release signing, and test on real Android phones.

## Documentation

- [docs/README.md](docs/README.md): index of feature, screen, development and design docs
- [docs/CONNECTIONS.md](docs/CONNECTIONS.md): the Firestore data contract
- [docs/12_TYPOGRAPHY_SYSTEM.md](docs/12_TYPOGRAPHY_SYSTEM.md): type system
- Docs 00, 01, 02, 04, 07 and 09 in `docs/` describe an older design that was never built and are marked superseded.

## License

Copyright © 2026 GlowVai. All rights reserved. Confidential and proprietary.
