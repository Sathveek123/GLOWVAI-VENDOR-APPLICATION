# Development 01: local setup

## Requirements

- Node.js 20 or newer, and npm
- Expo Go on a phone, or an Android or iOS simulator
- Android Studio, for Android builds
- Git

## Clone and install

```bash
git clone https://github.com/Sathveek123/GLOWVAI-VENDOR-APPLICATION.git
cd GLOWVAI-VENDOR-APPLICATION
git checkout frontend-preview
```

Install each package on its own:

```bash
cd mobile  && npm install
cd ../backend && npm install
cd ../web
```

`web/` has no build step, so it has no install step beyond `npx serve` (fetched on first run).

## Run each part

| Part | Command | Address |
|---|---|---|
| Backend | `cd backend && npm start` | `http://localhost:4000`, health at `/api/health` |
| Backend (auto-restart) | `cd backend && npm run dev` | same |
| Mobile | `cd mobile && npx expo start` | Expo dev server; press `w` for web |
| Web command centre | `cd web && npm run start` | `http://localhost:8082` |

The front-end preview does not need the backend. Screens that need live data show sample content in development.

## Phone testing

1. Put the phone and computer on the same Wi-Fi network.
2. Set `EXPO_PUBLIC_VENDOR_API_URL` to the computer's LAN address (for example `http://192.168.1.20:4000`).
3. Start Expo and scan the QR code with Expo Go.

## Before you commit

- Run `npx tsc --noEmit` in `mobile/`. It must pass with no errors.
- Check `git status` for `.env` files, keystores, and service account JSON. They must not appear.
