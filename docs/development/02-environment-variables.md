# Development 02: environment variables

Two `.env` files, one per package. Each package has a `.env.example` to copy. Never commit a `.env` file (`.gitignore` excludes them).

## Mobile (`mobile/.env`)

Expo exposes only variables prefixed `EXPO_PUBLIC_` to the app. Anything else is not available at runtime, and anything with this prefix is public: do not put secrets in it.

| Variable | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_VENDOR_API_URL` | Backend base URL. Production builds refuse to start when it is missing, local or not `https://` (`src/config/env.ts`). | `http://192.168.1.20:4000` on a phone, `http://localhost:4000` on web |
| `EXPO_PUBLIC_CUSTOMER_APP_URL` | Optional. Shows the customer storefront button when set. | `https://…` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web key of glowvai-38bde (identifies the project; restrict it in the console) | in `.env.example` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `glowvai-38bde.firebaseapp.com` | |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Must be `glowvai-38bde`, the shared project. Any other value fails the config check. | |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `glowvai-38bde.firebasestorage.app` | |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | in `.env.example` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | in `.env.example` |

There is no vendor or store id variable: ids come only from the signed-in session. (`EXPO_PUBLIC_VENDOR_ID`, `EXPO_PUBLIC_STORE_ID`, `EXPO_PUBLIC_ENABLE_SOCKET`, `EXPO_PUBLIC_ORDER_POLL_INTERVAL_MS` and `EXPO_PUBLIC_FIREBASE_DATABASE_URL` were removed; delete them from old `.env` files.)

## Backend (`backend/.env`)

`backend/.env.example` lists every variable with placeholders. The main ones:

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on. Default `4000`. |
| `NODE_ENV` | `development` or `production`. Production refuses to start without the secrets below and Firebase credentials. |
| `VENDOR_TOKEN_SECRET` | HMAC secret for vendor session tokens (32+ characters in production). |
| `ADMIN_API_KEY` | Key for `/api/admin/*`, sent as the `x-admin-key` header. Development default: `dev-admin-key`. |
| `VENDOR_DEV_OTP` | Test OTP accepted outside production. Default `4892`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (raw or base64). Leave unset, with no key file, to run in mock mode. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Local alternative: path to the key file. The file must stay out of git. |
| `FIREBASE_STORAGE_BUCKET` | Bucket for product photos. Default `glowvai-v2.firebasestorage.app` (legacy project, see the README). |
| `ALLOWED_ORIGINS` | Extra CORS origins. glowvai.in, www.glowvai.in and localhost:3100 are always allowed. |

Secrets (`VENDOR_TOKEN_SECRET`, `ADMIN_API_KEY`, the service account) stay on the server. They must never appear in `mobile/.env`. Deployment: `docs/deploy/render.md`.

## Checking your setup

- Backend: `curl http://localhost:4000/api/health` should return a success response.
- Mobile: if the API URL is wrong, the splash screen shows "Unable to reach merchant service".

## Known gaps

- The legacy backend still defaults to the old Firebase project glowvai-v2; the vendor app targets glowvai-38bde. See the README and [CONNECTIONS.md](../CONNECTIONS.md).
- The old glowvai-v2 web key is still in git history (it was in the deleted `docs/index.html` and `backend/src/views/admin.html`). Lock down that project's Realtime Database rules if it is not used.
