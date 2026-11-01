# Development 02: environment variables

Two `.env` files, one per package. Each package has a `.env.example` to copy. Never commit a `.env` file (`.gitignore` excludes them).

## Mobile (`mobile/.env`)

Expo exposes only variables prefixed `EXPO_PUBLIC_` to the app. Anything else is not available at runtime, and anything with this prefix is public: do not put secrets in it.

| Variable | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_VENDOR_API_URL` | Backend base URL | `http://192.168.1.20:4000` on a phone, `http://localhost:4000` on web |
| `EXPO_PUBLIC_VENDOR_ID` | Vendor identifier used by the session and socket | `VND-…` |
| `EXPO_PUBLIC_STORE_ID` | Store identifier | `DS-VIJ-01` |
| `EXPO_PUBLIC_ENABLE_SOCKET` | Turn the realtime connection on or off | `true` |
| `EXPO_PUBLIC_ORDER_POLL_INTERVAL_MS` | How often orders are polled as a fallback to the socket | `15000` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web key (identifies the project; restrict it in the console) | |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | |
| `EXPO_PUBLIC_CUSTOMER_APP_URL` | Optional. Shows the customer storefront button when set. Not in `.env.example`; add it when needed. | `https://…` |

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
| `FIREBASE_STORAGE_BUCKET` | Bucket for product photos. Default `glowvai-v2.firebasestorage.app`. |
| `ALLOWED_ORIGINS` | Extra CORS origins. glowvai.in, www.glowvai.in and localhost:3100 are always allowed. |

Secrets (`VENDOR_TOKEN_SECRET`, `ADMIN_API_KEY`, the service account) stay on the server. They must never appear in `mobile/.env`. Deployment: `docs/deploy/render.md`.

## Checking your setup

- Backend: `curl http://localhost:4000/api/health` should return a success response.
- Mobile: if the API URL is wrong, the splash screen shows "Unable to reach merchant service".

## Known gaps

- `EXPO_PUBLIC_CUSTOMER_APP_URL` is read in code but missing from `mobile/.env.example`.
- The Firebase web key appears in `docs/index.html` and `backend/src/views/admin.html`. Restrict it to your domains in the Firebase console.
