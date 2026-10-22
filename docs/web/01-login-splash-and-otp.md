# Web pages 01: splash, login and OTP

**Covers:** `page-splash`, `page-login`, `page-otp` in `web/index.html`
**Feature docs:** [Feature 01: authentication and session](../features/01-authentication-and-session.md)

The web command centre is a single page. Each screen is a section with an id (`page-*`), shown by `switchPage()`. The splash page is the start page.

## Splash (`page-splash`)

- Brand wordmark and a route list for reviewers: active session to dashboard, onboarding audit, sign-in screen.
- Demo states: slow connection and network error.
- The route list is for the prototype. It must be removed or gated before any real use.

## Login (`page-login`)

- Heading "Welcome back, beauty partner" and the tagline "Merchant operations made simpler."
- Mobile number field and *Send verification code*.
- States: rate limit, timeout, locked. Shown as demo states.
- No server call. The button moves to the OTP page.

## OTP (`page-otp`)

- "Verify your mobile number" and *Verify and continue*.
- Sending state: "Sending code…" with a spinner.
- No server check yet.

## Known gaps

- Login and OTP are prototype flows only.
- The splash route list exposes internal navigation. Remove it before release.
