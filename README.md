# GlowVAI Vendor App

Vendor-side software for GlowVAI dark stores: a mobile app (Expo, iOS and Android, and web), a PC web command centre, a Node.js backend, and an admin console.

> **Current status: front-end preview.** The mobile and PC web screens are built and reviewed, but the backend is not yet connected to login, real orders, or live data. Screens that need live data show sample content or a "Coming soon" view in production builds. See [Known limitations](#known-limitations).

## Repository layout

| Path | What it is |
|---|---|
| `mobile/` | Expo app for iOS, Android, and web (Expo Router, TypeScript) |
| `web/` | PC web command centre (single-page HTML/JS, `index.html`) |
| `backend/` | Node.js API and Socket.IO server (Express) |
| `docs/` | Architecture, API, screen specifications, and the audit reports |
| `docs/index.html` | Admin console (standalone page) |
| `admin/` | An unused React component kept for reference; not built |

## Requirements

- Node.js 20 or newer, and npm
- For the mobile app: Expo Go on a phone, or an Android or iOS simulator
- For Android builds: Android Studio

## Quick start

### 1. Mobile app (front end)

```bash
cd mobile
npm install
npx expo start            # press "w" for web, or scan the QR code with Expo Go
```

Copy `mobile/.env.example` to `mobile/.env` and fill in the values before running. Never commit `.env`.

### 2. PC web command centre

No build step is needed. Open `web/index.html` in a browser, or serve the folder:

```bash
cd web
npm run start             # serves on http://localhost:8082
```

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

Backend (`backend/.env`, see `backend/.env.example`): `PORT`, `NODE_ENV`, `JWT_SECRET`, `VENDOR_API_KEY`, Firebase project settings. These are secrets. Keep them out of version control.

## Security notes

- `.env` files, keystores, `local.properties`, and service-account JSON files are excluded by `.gitignore`. Check before every push.
- The Firebase web API key in `docs/index.html` and `backend/src/views/admin.html` identifies the project; it is not a secret. Restrict it in the Firebase console to your domains.
- Authentication is not yet server-side. The login and OTP screens do not verify codes with a server. Do not use the app with real merchant accounts until this is built.

## Building

- Mobile web export: `cd mobile && npx expo export --platform web`
- Android: `cd mobile && npx expo run:android`
- Type check: `cd mobile && npx tsc --noEmit`

## Known limitations

- **Authentication:** no OTP send or verify endpoint exists. Login is a front-end stub.
- **Live data:** most vendor screens are not connected to the backend. Those screens show a "Coming soon" view in production builds, and sample content in development builds.
- **Onboarding:** step B needs document uploads to the server, which are not built. Documents are picked on the device only.
- **Home screen:** on a live backend, the home screen can stall after the realtime connection is made. Not yet root-caused. Test on a device.
- **Android:** not yet tested on hardware. Font weights and icons may differ from the simulator.
- **PC web app:** most data is sample data. Some developer test strips remain visible in the prototype.

## Documentation

- `docs/12_TYPOGRAPHY_SYSTEM.md`: fonts, sizes, weights, and the wordmark
- `docs/11_UI_FRONTEND_FULL_AUDIT.md`: full front-end audit and what was fixed
- `docs/10_PRODUCT_UX_AND_ARCHITECTURE_AUDIT.md`: product and architecture audit
- `docs/00_MASTER_OVERVIEW_AND_ARCHITECTURE.md` and `docs/01`–`09`: system design and API reference

## Branches

- `frontend-preview`: the current front-end work (this branch).
