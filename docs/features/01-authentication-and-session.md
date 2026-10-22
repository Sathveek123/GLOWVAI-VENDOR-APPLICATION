# Feature 01: Authentication and session

**Status:** front-end only. No server verifies phone numbers or codes yet.
**Screens:** [Mobile: entry and auth](../mobile/01-entry-and-auth.md), [Web: login, splash and OTP](../web/01-login-splash-and-otp.md)

## What it does

A vendor signs in with a mobile number and a one-time code, then the app decides where to send them: sign-in, onboarding, pending review, or the home screen.

## Flow

1. **Splash and routing** (`mobile/app/index.tsx`). The app reads the saved session and routes:
   - no session → `/(auth)/login`
   - `vendor_onboarding_status` = `step-a` … `step-d` → the matching onboarding step
   - `pending` → `/(onboarding)/pending`
   - `approved`, or `vendor_registered` = `true` → `/(vendor)/home`
2. **Phone number** (`login.tsx`). Enter a 10-digit mobile number. The send button stays disabled until the number is valid and while a request is in flight.
3. **Code entry** (`otp.tsx`). Four digits. Verification is fail-closed: the only accepted code is the test code `4892`, and only in a development build (`__DEV__`). Every other code is rejected. Accepted sessions use the placeholder token `DEV_SESSION_ONLY`.
4. **Session saved.** Keys written to AsyncStorage are listed in `mobile/src/services/session.ts` (`SESSION_KEYS`).
5. **Logout** calls `clearSession()`, which removes all five keys, then returns to login.

## Session keys

| Key | Holds |
|---|---|
| `vendor_session_token` | Session token (placeholder until the server issues real tokens) |
| `vendor_id` | Vendor identifier |
| `vendor_registered` | `'true'` once onboarding is complete |
| `vendor_onboarding_status` | Current onboarding step or review state |
| `vendor_phone` | Mobile number used to sign in |

## States the screens handle

- Login: Rate limit, timeout, locked account (the states are shown as preview copy in development builds).
- OTP: Incorrect, expired, lockout, and resend.
- Splash: Maintenance and "unable to reach merchant service", with a retry button.

## Known gaps

- No OTP send or verify endpoint exists. Do not use real merchant accounts yet.
- The web prototype's login is a demo flow.
- Staff sign-in and role-based access are not built. See [Feature 11](11-team-security-and-compliance.md).

## Related

- [Development: environment variables](../development/02-environment-variables.md) for the Firebase and API settings.
- [Feature 12: realtime and offline](12-realtime-and-offline-behaviour.md) for what happens after sign-in.
