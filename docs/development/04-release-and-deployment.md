# Development 04: release and deployment

## Branches

- `frontend-preview`: current front-end work. Pushed to `origin`.
- The repository's default branch is not yet set to `frontend-preview`. Do this in GitHub settings when the team agrees.

## Before any release

Work through this list in order. Do not skip items.

1. **Secrets:** no `.env`, keystore, `local.properties`, or service account file is tracked. Check `git ls-files | grep -iE "\.env|keystore|service-account"`.
2. **Test PINs and test codes:** `4892` must not be reachable in a production build. Check the OTP screen, the handover screen, and the web handover page. The web packing page currently displays `4892` and must be fixed.
3. **Developer strips:** the web team page still shows its test strip. Gate or remove it.
4. **Splash route list:** the web splash page lists internal navigation. Remove it.
5. **Coming-soon screens:** confirm the list in [mobile screens](../mobile/01-entry-and-auth.md) matches what the team expects to show.
6. **Admin console role check:** not implemented. The admin console must not ship to users until it is.
7. **Backend enforcement:** handover PIN check, onboarding approval, financial calculations, and team permissions must run on the server.
8. **Type check and device test** (see [testing](03-testing-and-qa.md)).

## Mobile builds

```bash
cd mobile
npx expo export --platform web      # web bundle
npx expo run:android                # Android build, needs Android Studio
```

Keystores stay on the build machine. They must not be committed.

## Web command centre

The command centre is static HTML. It can be published with GitHub Pages when the team is ready. Before publishing:

- Confirm no internal navigation or test strips are visible (see the list above).
- Confirm the Firebase web key is restricted to the publishing domain.
- Confirm the page shows only sample data, or that it is connected to a live backend with real authentication.

Publishing makes the page public on the internet.

## Standalone admin console

`docs/index.html` is a standalone admin page. It writes directly to Firebase Realtime Database. Writes must be restricted by security rules before it is shared.

## Known gaps

- Mobile release builds have not been tested on Android hardware.
- No CI pipeline exists in `.github/` yet.
- No version numbers or changelog are kept for the mobile app.
