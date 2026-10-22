# Mobile screens 01: entry and sign-in

**Covers:** `mobile/app/index.tsx`, `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/otp.tsx`
**Feature docs:** [Feature 01: authentication and session](../features/01-authentication-and-session.md)

| Screen | Route | Production | Development |
|---|---|---|---|
| Splash and router | `/` | Live | Live, with a test-state strip |
| Login | `/(auth)/login` | Live | Live, with a demo-state strip |
| OTP | `/(auth)/otp` | Live | Live, with a test-state strip |

## Splash and router (`index.tsx`)

**Purpose:** show the brand, check the session, and send the user to the right screen.

- Wordmark (`<Wordmark size={30} />`) and the tagline "Your store, always in control."
- Routing rules are described in [Feature 01](../features/01-authentication-and-session.md#flow).
- **States:** "Unable to reach merchant service" with *Retry connection*, "System maintenance in progress" with *Check uptime status*, and *Sign in again*.
- Keyboard shortcuts for web are development-only (`__DEV__`).

## Login (`(auth)/login.tsx`)

**Purpose:** collect the mobile number and send a one-time code.

- Field: mobile number, placeholder `98XXX XXXXX`.
- Button: *Send verification code*. It is disabled until the number is valid and while the request runs ("Sending code…").
- Copy: "We'll send a secure one-time code to verify your number."
- Links: Terms of service, privacy policy, "Register your store" (starts onboarding).
- **States:** timeout, rate limit, locked. Shown in the demo strip in development only.
- Footer marketing copy (Track payouts securely, manage live orders, keep inventory accurate) is brand copy, not live data.

## OTP (`(auth)/otp.tsx`)

**Purpose:** verify the code and sign in.

- Four code boxes. Heading "Verify your mobile number". Action *Verify and continue*.
- Actions: *Resend code*, *Edit number* / *Change mobile number*.
- Verification is fail-closed. Only `4892` in a development build is accepted (see [Feature 01](../features/01-authentication-and-session.md)). Every other path shows "Incorrect" or "Expired".
- **States:** verifying, verified, incorrect, expired, lockout, and a test-state strip (development only).
- Notes on the screen: "Never share this code with anyone."

## Known gaps

- No server verifies codes yet.
- The test code appears only in code paths gated behind `__DEV__`. Confirm this in each release build.
