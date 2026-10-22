# GlowVAI Vendor App

Vendor-side software for GlowVAI dark stores. Store staff use the mobile app to take and fulfil orders, and managers use the PC web command centre to watch the floor, stock, and payouts. A Node.js backend and an admin console support both.

> **Status: front-end preview.** The mobile and PC web screens are built and reviewed. The backend is not yet connected to login, real orders, or live data, so screens that need live data show sample content (development builds) or a "Coming soon" view (production builds). See [Known limitations](#known-limitations).

## Key features

**Mobile app (iOS, Android, and web)**
- Vendor sign-in with a phone number and one-time code (front-end only for now)
- Store onboarding in four steps: basic info with GPS location, documents, bank details, and categories and SKUs
- Live order feed with an incoming-order alert, order detail with a picking list, and handover to a rider using a pickup PIN
- Inventory, payouts, and profile screens, plus a support section

**PC web command centre**
- Sidebar navigation across operations pages, with a top bar on small screens
- Order board, stock views, payouts, and team pages
- Toast notifications in place of browser alerts, and keyboard navigation

**Backend (Node.js, Express, Socket.IO)**
- REST API and realtime order events
- Firebase Admin integration for persistence, with a mock mode when no service key is set

**Design system**
- Three typefaces with defined jobs (Fraunces for titles and the wordmark, Plus Jakarta Sans for interface text, JetBrains Mono for codes), a 12px minimum size, and weights limited to 400–700. See [docs/12_TYPOGRAPHY_SYSTEM.md](docs/12_TYPOGRAPHY_SYSTEM.md).
- Brand blue `#1D4ED8` throughout

## Architecture

```
          +-------------------+        +-------------------+
          |  mobile/          |        |  web/             |
          |  Expo Router app  |        |  PC command centre|
          |  iOS, Android,web |        |  (HTML/JS)        |
          +---------+---------+        +---------+---------+
                    |  REST + Socket.IO          |
                    +------------+---------------+
                                 |
                       +---------v---------+        +-------------------+
                       |  backend/         |<------>|  Firebase          |
                       |  Express, Socket.IO|       |  (Realtime DB)     |
                       +-------------------+        +-------------------+
```

The mobile app keeps state in a Zustand store (`mobile/src/store/useVendorStore.ts`). The realtime connection is a single Socket.IO client (`mobile/src/services/socket.ts`), and REST calls go through one fetch-based client (`mobile/src/services/api.ts`).

## Repository layout

| Path | What it is |
|---|---|
| `mobile/` | Expo app for iOS, Android, and web (Expo Router, TypeScript) |
| `mobile/app/` | Routes: `(auth)`, `(onboarding)`, `(vendor)`, plus splash and admin |
| `mobile/src/` | Components, services, store, and the typography theme |
| `web/` | PC web command centre (single-page HTML/JS in `index.html`) |
| `backend/` | Node.js REST and Socket.IO server (`src/server.js`) |
| `docs/` | Architecture, API, typography, and the audit reports |
| `docs/index.html` | Admin console (standalone page) |
| `screen_docs/`, `web_screen_docs/` | Per-screen specifications for mobile and web |
| `admin/` | An unused React component kept for reference; not built |

## Requirements

- Node.js 20 or newer, and npm
- For the mobile app: Expo Go on a phone, or an Android or iOS simulator
- For Android builds: Android Studio

## Quick start

### 1. Mobile app

```bash
cd mobile
npm install
cp .env.example .env      # then fill in the values
npx expo start            # press "w" for web, or scan the QR code with Expo Go
```

### 2. PC web command centre

No build step is needed.

```bash
cd web
npm run start             # serves on http://localhost:8082
```

You can also open `web/index.html` directly in a browser.

### 3. Backend (optional for the front-end preview)

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
npm start                 # serves on http://localhost:4000
```

Check it is running: `http://localhost:4000/health`.

## Environment variables

Mobile (`mobile/.env`, see `mobile/.env.example`):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_VENDOR_API_URL` | Backend base URL. Use your computer's LAN IP when testing on a phone. |
| `EXPO_PUBLIC_VENDOR_ID`, `EXPO_PUBLIC_STORE_ID` | Vendor and store identifiers for the session |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web configuration (project identifiers, not secrets) |
| `EXPO_PUBLIC_CUSTOMER_APP_URL` | Optional. Shows the customer storefront link when set. |

Backend (`backend/.env`, see `backend/.env.example`): `PORT`, `NODE_ENV`, `JWT_SECRET`, `VENDOR_API_KEY`, and Firebase project settings. These are secrets. Keep them out of version control.

## Engineering standards

- **No secrets in git.** `.env` files, keystores, `local.properties`, and service-account JSON files are excluded by `.gitignore`. Check before every push.
- **Demo content is development-only.** Sample orders, test OTPs, and developer test strips are gated behind `__DEV__` and do not ship in production builds.
- **Honest states.** Screens show Loading, Empty, and Error states, and do not present unverified data as confirmed.
- **Type-safe.** `npx tsc --noEmit` passes with no errors in `mobile/`.

## Security notes

- The Firebase web API key in `docs/index.html` and `backend/src/views/admin.html` identifies the project; it is not a secret. Restrict it in the Firebase console to your domains.
- Authentication is not yet server-side. The login and OTP screens do not verify codes with a server. Do not use the app with real merchant accounts until this is built.
- Handover PIN checks and financial calculations currently run on the device. They must move to the server before launch.

## Building

- Mobile web export: `cd mobile && npx expo export --platform web`
- Android: `cd mobile && npx expo run:android`
- Type check: `cd mobile && npx tsc --noEmit`

## Tech stack

| Area | Technology |
|---|---|
| Mobile client | React Native 0.74, Expo SDK 51, Expo Router 3.5 |
| Mobile state | Zustand 4.5 |
| Realtime | Socket.IO client 4.7 |
| Web build | react-native-web 0.19 |
| Fonts and icons | Fraunces, Plus Jakarta Sans, JetBrains Mono; Ionicons and Feather |
| Backend | Node.js, Express 4, Socket.IO 4, Firebase Admin 12 |
| Web command centre | HTML, CSS, and JavaScript (no framework) |

## Known limitations

- **Authentication:** no OTP send or verify endpoint exists. Login is a front-end stub.
- **Live data:** most vendor screens are not connected to the backend. Those screens show a "Coming soon" view in production builds, and sample content in development builds.
- **Onboarding:** step B needs document uploads to the server, which are not built. Documents are picked on the device only.
- **Home screen:** on a live backend, the home screen can stall after the realtime connection is made. Not yet root-caused. Test on a device.
- **Android:** not yet tested on hardware. Font weights and icons may differ from the simulator.
- **PC web app:** most data is sample data. Some developer test strips remain visible in the prototype.

## Documentation

- [docs/12_TYPOGRAPHY_SYSTEM.md](docs/12_TYPOGRAPHY_SYSTEM.md): fonts, sizes, weights, and the wordmark
- [docs/11_UI_FRONTEND_FULL_AUDIT.md](docs/11_UI_FRONTEND_FULL_AUDIT.md): full front-end audit and what was fixed
- [docs/10_PRODUCT_UX_AND_ARCHITECTURE_AUDIT.md](docs/10_PRODUCT_UX_AND_ARCHITECTURE_AUDIT.md): product and architecture audit
- [docs/00_MASTER_OVERVIEW_AND_ARCHITECTURE.md](docs/00_MASTER_OVERVIEW_AND_ARCHITECTURE.md) through [docs/09_TESTING_SIMULATION_AND_TROUBLESHOOTING_GUIDE.md](docs/09_TESTING_SIMULATION_AND_TROUBLESHOOTING_GUIDE.md): system design, API reference, realtime, inventory, financials, and testing

## Branches

- `frontend-preview`: the current front-end work (this branch).

## License

Copyright © 2026 GlowVAI Team. All rights reserved. Confidential and proprietary.
