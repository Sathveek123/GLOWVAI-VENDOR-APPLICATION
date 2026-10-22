# GlowVAI Vendor: Full UI & Front-End Audit

**Audience:** product owner and front-end team
**Scope:** every file in the workspace that renders UI: the Expo mobile app (`mobile/`, 41 route files and 14 shared components/services), the standalone web app (`web/index.html`), the admin console (`docs/index.html` and `backend/src/views/admin.html`), the orphaned admin component (`admin/`), and all markdown docs (`docs/`, `docs/phone_docs/`, `docs/pc_docs/`, `screen_docs/`, `web_screen_docs/`).
**Method:** read every markdown file; read the theme, layouts, shared components, auth flow, home, orders, order-detail, earnings, bank-edit, ready-pickup, pack-order, onboarding steps, store, API client, and socket client in full; ran repo-wide scans for every screen; type-checked and web-bundled the mobile app. Per-screen numbers in the matrix at the end come from those scans.

---

## 1. Verdict

**Not launch-ready.** The UI is a polished prototype. Most screens render hardcoded or simulated data, several security controls exist only as visual states, and the onboarding flow fabricates business and payout details. The visual language is also split across three design systems, and the web app's text is corrupted by an encoding error.

| Dimension | Score (/10) | Basis |
|---|---:|---|
| Functional completeness (real data flow) | 2 | 35 of 41 route files make zero API or socket calls |
| Security & trust controls in UI | 1.5 | OTP accepts any code; bank-change OTP accepts any 6 digits; logout does not clear session |
| Data integrity (onboarding, payouts, handover) | 1.5 | Fabricated GSTIN/PAN/payee; handover without OTP check; application never submitted to backend |
| Visual system consistency | 3 | Three palettes, 1,928 hardcoded hex literals, mixed emoji/icon usage |
| Typography & readability | 3 | 440 declarations at 11px, 199 at 10px, 33 at 9px, minimum 8px |
| Accessibility | 2.5 | 29 of 41 route files have no accessibility or testID attributes; web nav unreachable by keyboard |
| Responsiveness (mobile app) | 5.5 | Breakpoint at 1024px works in code; fixed widths and absolute bottom nav are risky |
| Responsiveness (web app) | 2 | Zero `@media` rules; fixed 260px sidebar |
| Code hygiene & dead code | 4 | 8 orphaned modules, copy-pasted nav rail in 13 screens, committed build output |
| Documentation accuracy | 2.5 | Screen counts, theme, routes, and state persistence described in docs do not match code |

**Strengths to keep:** the mobile app type-checks cleanly (`tsc --noEmit` exit 0); the Expo web target bundles without warnings (741 modules); the catalog stock stepper is the best-built flow (optimistic update with rollback, `catalog.tsx:303-333`); the shared `ScreenShell` and `AppHeader` give most screens a consistent frame; the OTP digit cells have accessibility labels and auto-advance (the verification logic behind them is not sound; see C1).

---

## 2. Critical findings (fix before any pilot)

Each finding names the file and line so it can be verified directly.

### C1. Authentication is client-side only
- `mobile/app/(auth)/otp.tsx:139` treats any 4-digit code except `0000` as valid. A real wrong code never fails, so the 3-attempt lockout (`otp.tsx:159-161`) is unreachable from real input.
- `otp.tsx:144` writes `vendor_session_token = 'TOKEN_VND_AUTH_VALIDATED'`. The same hardcoded string pattern appears in `(onboarding)/pending.tsx:134` and `(onboarding)/step-d.tsx:211`.
- `mobile/app/index.tsx:131-163` decides the destination from the token's presence and the `vendor_onboarding_status` flag. No server validation exists. `authApi` is not defined anywhere.
- `mobile/app/(auth)/login.tsx:63-65` stores the phone and navigates after a 400 ms timer. No SMS is sent.
- Resend (`otp.tsx:176-179`) shows "A new verification code has been sent" without calling anything.

### C2. Logout does not log out
- `mobile/app/(vendor)/profile.tsx:832-838` only navigates to `/(auth)/login`. It never removes `vendor_session_token` or `vendor_id`, so a valid-looking token survives logout.
- The splash router then keys on `vendor_onboarding_status` (`index.tsx:132-163`). The only value ever written is `'pending'` (`step-d.tsx:209`); nothing writes `'approved'`. A vendor who has finished onboarding is therefore sent to login on relaunch, while the stale token still exists. Session state and routing disagree in both directions.
- The confirmation text claims "Your store duty status will be paused." Nothing pauses the store.

### C3. Login sends to a hardcoded phone number
- `login.tsx:58`: when the number is incomplete, the handler substitutes `8977855998` and continues. The "Send verification code" button (`login.tsx:157-163`) has no `disabled` state, so it is always tappable.

### C4. Bank-account change can be made without real verification
- `mobile/app/(vendor)/bank-edit.tsx:114`: `if (otpValue.trim() === '4892' || otpValue.trim().length === 6)`. Any 6-digit string passes the "identity" step.
- `bank-edit.tsx:191-205`: the final submit makes no API call. It sets a timer and then shows the 24-hour cooling banner. The payout destination is never changed on the server.
- The "TEST BANK SECURITY EDGE STATES" strip (around `bank-edit.tsx:252-268`, including a "Cooling Active" toggle) has no `__DEV__` gate and ships to production.

### C5. Rider handover does not check the pickup code
- `mobile/app/(vendor)/ready-pickup.tsx:81`: `const pickupCode = order?.otp || '4892';`. When the order is not in the local store, the code shown is the test code.
- `ready-pickup.tsx:146-170`: `handleConfirmHandover` calls `ordersApi.dispatch(orderId, { riderName, riderPhone })`. The entered PIN is never compared to the order's OTP. The only check is a demo edge state (`invalid_code`).
- `mobile/app/(vendor)/pack-order.tsx:112`: `const pickupCode = '4892';` is shown as the pickup PIN for every order (`pack-order.tsx:516-524`).

### C6. Onboarding fabricates business, tax, and payout details
- `mobile/app/(onboarding)/step-a.tsx:219-230`: blank fields are replaced with defaults and saved. The owner becomes `Rajesh Kumar` (line 221) and the store becomes "Sri Lakshmi Beauty Store".
- `step-b.tsx:208-211`: an invalid GSTIN is replaced with `37AAACG1234F1Z5` and an invalid PAN with `ABCDE1234F`. Those are saved as the merchant's tax identifiers.
- `step-c.tsx:237-240`: a blank payee name becomes `Rajesh Kumar` and a blank UPI ID becomes `vendor@upi`. This is a payout-routing risk if submitted.
- Each step defines a validator (`validateForm` in `step-a.tsx:197-216`, and equivalents in steps B and C) that is never called (`validate*()` call count is 0 in every step). The audit doc (`10_PRODUCT_UX_AND_ARCHITECTURE_AUDIT.md`, lines 49-51) describes this bypass as a feature: "Removed all form validation block conditions."

### C7. The onboarding application is never submitted
- `mobile/app/(onboarding)/step-d.tsx:186-215`: the final "Submit store for review" writes `onb_step_d`, `vendor_onboarding_status = 'pending'`, and a fake session token to local storage. It does not call `onboardingApi.submit` (defined in `src/services/api.ts:163`, unused).
- `pending.tsx:116-117` reads the approval status from local storage. The "10-second polling" described in the docs does not exist; there is no `setInterval` in `pending.tsx`.

### C8. Most screens show fake business data
- Only 6 of 41 route files import the API module, and 35 have no API or socket reference at all (the matrix below lists them).
- `home.tsx:419-437`: the hero metrics are hardcoded (3 new, 5 active, 24 delivered, ₹16,236). The API data is fetched at `home.tsx:111-130` and never rendered into them.
- `home.tsx:442-465` and `:548-563`: the quality scores (4.9, 98.2%) and the "Today's Updates" feed are hardcoded text, including "₹16,236 credited to HDFC Bank."
- `home.tsx:214-224`: when the store has no orders, the active queue shows two invented orders (`ORD-9921`, `ORD-9922`), which vendors can act on.
- `orders.tsx:103-195`: when the list is empty, five invented customer orders appear with invented OTPs (`4821`, `1092`, `8821`, `9920`).
- `order-detail.tsx:47` reads `orderId` but never loads the order. `order-detail.tsx:59-118` is a fixed five-item basket shown for every order.
- `earnings.tsx:49-115` (`MOCK_LEDGER_DATA`) and `:165-179` (`backendSummary`, with fixed values such as ₹1,42,850 net and 12% fee) are static. The "Export statement" action (`:194-200`) shows an alert claiming a CSV and GST PDF were emailed to the merchant. Nothing is exported. The existing `earningsApi.getSummary` is never called.
- `mobile/app/admin.tsx`: the dark-store list, daily gross, rider verification ("14/14 riders police-verified & Aadhaar authenticated," line 427), and "Authorize IMPS" payout buttons (line 358) are hardcoded.

### C9. The incoming-order modal shows the wrong order
- `home.tsx:606-729`: the 45-second offer modal shows fixed content: "Priya S.", three fixed items, `#GV-9912` in the header, and a fixed ₹1,054.24 payout on the Accept button (`:659`, `:723`). The `incomingOrderModal` payload is used only for the order ID on accept.
- `home.tsx:184-199`: accept uses `incomingOrderModal.orderId || 'GV-9912'`, so a missing ID silently accepts the wrong order.

### C10. Order alerts are silent on phones
- `mobile/src/services/sound.ts:15-18` uses `window.AudioContext` and `:67-69` uses `navigator.vibrate`. Neither exists in the React Native runtime on Android or iOS. The primary product feature, the 45-second order chime, therefore plays nothing on a phone. No `expo-av`, `expo-haptics`, or equivalent is installed.

### C11. Test and demo UI ships to production
- `home.tsx:326-367`: "Test Command Center States," including a "⚡ Test 45s Order Offer Modal" button, is not gated by `__DEV__`. The "Store Paused" chip (`:344`) calls `setIsOnline(false)`, which changes real duty status.
- Only 3 of 41 route files use `__DEV__` gates at all (`login.tsx`, `otp.tsx`, `pending.tsx`). Test/demo references number 41 in `home.tsx`, 12 in `returns.tsx`, and 9 in `reviews.tsx`, plus the ungated strip in `bank-edit.tsx` (above).
- `mobile/app/dev/header.tsx` is a developer preview screen with no gate, reachable as a route at `/dev/header`.
- `mobile/app/index.tsx:181-187` shows a "1440 × 900 Desktop View" resolution tag to end users on web.

### C12. Admin surfaces are reachable without authorization
- `mobile/app/admin.tsx` has no role or credential check. Any vendor build contains it, and it exposes payout authorization and supervisor data.
- `docs/index.html` (and the near-identical `backend/src/views/admin.html`, which differs by 22 lines) writes directly from the browser to Firebase Realtime Database with the public web config, with at least four write calls: `inventory/…update()/set()` (lines 1036, 1181, 1249) and `vendors/…set()` (line 1226). Whether this is safe depends entirely on database rules that were not available for this review. Treat it as an open risk until the rules are checked.

### C13. The "Active" orders tab is always empty
- `orders.tsx:37` defines the tab key `'ACTIVE'`. The filter (`orders.tsx:214-222`) only maps `'ACCEPTED'` and `'PACKED'`, and falls back to `order.status === activeTab`. No order status is ever `'ACTIVE'`, so the tab shows nothing and its count (`tabCounts['ACTIVE']`, line 410) is always 0.

### C14. Socket listeners stack on every screen visit
- `home.tsx:132-145` attaches `connect`, `disconnect`, and `order:incoming` listeners on each mount and never removes them. The socket is a singleton (`socket.ts:17-54`), so each return to home adds another handler. One incoming order can then start several countdowns and sounds.

---

## 3. High-priority findings

### H1. Design system is fragmented
- `mobile/src/theme/tokens.ts` (blue `#1D4ED8`, white canvas) is the palette used by 37 screens. `mobile/src/theme/index.ts` (blue `#0050ff`, black `#0a0a0a`, green `#00A300`, red `#D10000`) is still used by `src/components/ui.tsx` (`PrimaryButton`, used by `approved.tsx`) and `src/components/RealInteractiveMap.tsx:3`. `admin.tsx:18-20` hardcodes the second palette.
- 1,928 hex literals appear across `app/` and `src/`. The most common are `#FFFFFF` (366), `#0F172A` (213), `#64748B` (173), `#E2E8F0` (108), `#F1F5F9` (97), and `#1D4ED8` (83). Many screens (`support.tsx` 140, `multi-store.tsx` 123, `promotions.tsx` 113) carry more literals than the token set has entries.
- The docs describe three other directions: dark glassmorphism `#0B0F19` (`docs/05`), light `#F8FAFC` with `#2457D6` (`docs/10`), and light `#1D4ED8` with a `#1E1B4B` side panel (`phone_docs` and `pc_docs`). `tokens.ts` matches the `phone_docs` and `pc_docs` palette.
- **Recommendation:** make `tokens.ts` the single source. Delete `theme/index.ts`. Move the 1,928 literals to tokens in a codemod, and replace the `|| '#hex'` fallbacks in `AppHeader.tsx` and `MobileBottomNav.tsx`, which mask a broken import contract.

### H2. Text is too small for store-floor use
- Scanned font declarations: 440 at 11px, 199 at 10px, 33 at 9px, 9.5px at 20 times, and 8px once. Per screen, sub-12px declarations reach 42 in `messages.tsx`, 41 in `add-sku.tsx`, 34 in `profile.tsx`, `returns.tsx`, `reviews.tsx`, and `recommended-skus.tsx`, and 32 in `bank-edit.tsx` (matrix, section 9).
- The web app has 265 declarations at 10px and 34 at 9px.
- Target sizes should be 14px minimum for body and 16px for primary data. The brief says pickers work under "high order rush" conditions, so this is a functional issue, not only a style one.

### H3. Emoji are used as icons
- 705 emoji occurrences appear across 37 route files (grep count). They render differently on each OS, cannot be tinted to the palette, and are read aloud by screen readers as descriptions such as "shopping bags" or "sparkles."
- Among route files, only `admin.tsx` imports `@expo/vector-icons`. `CustomerAppRedirectButton.tsx` imports it and is used on 13 screens.
- **Recommendation:** adopt one icon set (Ionicons is already installed) and keep emoji only in user-generated text.

### H4. Accessibility is largely missing
- 29 of 41 route files contain no `accessibilityLabel`, `accessibilityRole`, or `testID`.
- 102 `TextInput`s exist; `accessibilityLabel` appears 45 times across the entire codebase. `accessibilityRole` appears 19 times.
- The web app has 4 `aria-label`s, 3 `role` attributes, and 0 `tabindex`. Its 18 navigation items are `<li onclick="…">` elements (`web/index.html:493` and following), so keyboard and screen-reader users cannot reach the nav.
- The web app has 2 images without `alt` text.
- Touch targets are a risk on compact controls: the code has about 150 style declarations of 20 to 39px in width or height, including the web app's 28px buttons. Measure these on device against the 44px minimum.

### H5. Modals break the Android back button
- 45 `<Modal>` elements exist; 14 set `onRequestClose`. On Android, the other 31 cannot be dismissed with the hardware back button.
- The legal sheet on login (`login.tsx:210-229`) is an absolutely positioned `View` inside the card, not a real modal. It does not cover the screen and cannot be dismissed with back.

### H6. Navigation is inconsistent and loses history
- `MobileBottomNav.tsx:37-39` uses `router.replace` for every tab. Back does not return to the previous tab, and on Android the back key exits the app from any tab.
- `handleNavigation` takes an unused `targetKey` parameter (line 38).
- The desktop rail (`navRail`, about 80 lines) is copy-pasted into 13 screens (`home`, `orders`, `order-detail`, `earnings`, `catalog`, and others). A change to the nav requires 13 edits. The rail's "Settings" item opens profile, and "Store selector" is a non-functional pill.
- The bottom nav is `position: absolute`. Screens such as `home.tsx` add only a 40px spacer (`:568`) plus 28px padding, which may not clear the nav bar on tall phones. Verify on device.

### H7. Responsive behavior
- **Web app:** `web/index.html` contains zero `@media` rules. Its sidebar is `width: 260px` (line 81). On a 390px phone, content gets roughly 130px. The docs (`web_screen_docs/README.md`) claim tablet and mobile layouts that do not exist.
- **Mobile app:** the 1024px breakpoint (`width >= 1024`) is consistent, but 62 fixed widths of 400px or more (for example `maxWidth: 1200`, `440`, `580`, `720`) and fixed `height` values for input cells make tablet and foldable layouts unverified.
- `SafeAreaView` is imported from `react-native` in 31 files, while `react-native-safe-area-context` is used for the header and shell. The `react-native` version is deprecated on Android.

### H8. Web app text is corrupted by double-encoding
- `web/index.html` declares `<meta charset="UTF-8">`, but its bytes are double-encoded. For example, the sparkle emoji is stored as `303 242 305 223 302 250` (`âœ¨`), and the page title reads `GlowVAI Vendor Web App â€” Desktop Command Center` (line 6).
- About 518 lines contain such sequences, including apostrophes (`Weâ€™ll`), bullets (`â€¢`), and lock emoji (`ðŸ”’`). These appear in both static HTML and JavaScript strings (`web/index.html:6723`, `:6772`, `:6790`).
- **Fix:** re-encode the file from its intended text (for example, by decoding as Windows-1252 and re-encoding as UTF-8, then re-checking). Keep the file in UTF-8 without BOM and add a lint check.

### H9. The web app is a simulation
- `web/index.html` makes 0 `fetch` calls and has 0 `localStorage` uses, so its data is entirely in the page. The socket connects to `http://localhost:4000` (line 6634), which breaks outside a developer's machine.
- It uses 135 `alert()` calls for feedback (for example, `alert('Item scanned successfully!')` on a "Scan Item" button at line 1223).
- It loads Socket.IO and Font Awesome from CDNs with no subresource integrity hashes (lines 14, 17).
- The docs describe `onb_step_a` and similar localStorage keys (`pc_docs/04`, `05`, `06`), which the file does not write.

### H10. Store state is not persisted and some state is duplicated
- `useVendorStore.ts` (Zustand) has no `persist` middleware. `docs/06` says vendor identity and drafts persist to AsyncStorage; they do not.
- The duty status is held twice: as local `isOnline` state in `home.tsx:56` and as `vendor.isOnline` in the store. They can drift.
- The store's default vendor is an invented merchant: name "Dark Store Merchant," shop "GlowVAI Dark Store Hub #1," phone `8977855998` (`useVendorStore.ts:166-183`). The same phone appears in `admin.tsx:51` and `login.tsx:58`.

### H11. Money math is computed on the client
- `order-detail.tsx:204-206` computes the 12% fee and net payout locally with `toFixed(2)`, ignoring GST and discounts. `docs/08` and the screen specs say the backend is the authority; the code does not follow that.
- The same offer shows three different totals. The incoming-offer items sum to ₹1,417 (`home.tsx:670-691`), its payout is 88% of ₹1,198 (`home.tsx:659`, `:723`), and the order-detail basket for the same screen sums to ₹2,302 (`order-detail.tsx:59-118`).

### H12. Miscellaneous functional gaps
- **Pause reason** is selected (`home.tsx:57-58`, `:583-589`) but never sent or stored (`confirmPauseDuty`, `:177-182`).
- **Customer app button** opens `http://localhost:8081` (`CustomerAppRedirectButton.tsx:29-35`). It is broken for any user other than a developer.
- **UTR "Copied" toast** (`payout-detail.tsx:159-165`) appears on native, where nothing is copied. Clipboard writing happens only when `Platform.OS === 'web'`, and no clipboard package is installed.
- **Quick restock** (`home.tsx:537`) writes `stock`, while the inventory model uses `stockOnHand`, so the restock may not change the displayed value.
- **Stock field contract:** the backend mock returns `stock` (`backend/src/server.js:111-219`), which the catalog reads. The documented schema and the Firestore path use `stockOnHand` (47 references in the backend). Against real records the catalog may show zero stock everywhere. The adapters that should map this (`features/catalog/adapter.ts`) are never imported.
- **Messages** are local only. `messages.tsx:175-182` appends to local state and makes no API call.
- **Contact-detail guard** (`messages.tsx:164`, `reviews.tsx:205`) is a client regex only. Its UPI rule also blocks the word "upi" in ordinary text. The server must enforce this; that is not verifiable here.
- **Legal copy** on the login sheet (`login.tsx:219-221`) is placeholder text that asserts "256-bit encryption" and specific terms. It must be replaced by counsel-approved copy before launch.
- **Remote images** are hotlinked from Unsplash (`profile.tsx:344`, `returns.tsx:652`, and in the web app at `web/index.html:3935`, `:4179`). That creates third-party availability and privacy exposure.

### H13. Dependencies are missing for documented features, and some installed ones are unused
- Missing for features the UI claims: `expo-secure-store` (session tokens, per `docs/10` P0), `expo-location` (store GPS: `step-a.tsx:128` uses `navigator.geolocation`, which does not exist on native, so the GPS button fails on phones), an audio/haptics package (C10), a clipboard package (H12), and a document/image picker (every "upload" is simulated).
- Installed but not imported anywhere in `app/` or `src/`: `axios` (the app uses `fetch`), `@react-native-picker/picker`, and `@react-navigation/native`. `firebase` is imported only by the dead `src/config/firebase.ts`.
- The `lint` script references ESLint, but no ESLint configuration or package exists in `mobile/`.

### H14. Mobile app works on web, but web is not the same product
- `npx expo export --platform web` completes with 741 modules and no warnings. The web build therefore compiles, but the desktop experience depends on the 1024px breakpoint and the same native components, not on the separate `web/index.html`. The repo ships two different web products.

---

## 4. Medium-priority findings

- **M1. OTP screen repeats controls.** The header back arrow and the in-card "← Change mobile number" link both go back, and "Edit number" does the same (`otp.tsx:219-243`). Pick one.
- **M2. Resend and lockout are cosmetic.** `handleResend` (`otp.tsx:170-179`) resets the timer and shows success without any request. The lockout countdown (`:64-77`) calls `setFailedAttempts(0)` inside a state updater, which is a side effect and not safe under React's double-invocation.
- **M3. OTP lengths differ across screens.** The OTP screen uses 4 digits (`otp.tsx:24`). `bank-edit.tsx:114` accepts 6. The phone docs specify 4 for login and 6 for bank change, but the bank screen's own hint says "e.g. 4892" (4 digits).
- **M4. Lockout duration differs from the spec.** `docs/phone_docs/03` says "locks for 15 minutes after 3 invalid attempts." The code uses 60 seconds (`otp.tsx:160`).
- **M5. Splash keyboard shortcuts on web.** `index.tsx:40-60` binds global keys: Enter goes to home, `1`/`2`/`3` jump to flows, `M` toggles maintenance. These are unlabelled and bypass the session check.
- **M6. Splash slow-timer uses a stale value.** `index.tsx:112-117` reads `edgeState` from the first render's closure.
- **M7. Dead styles.** `login.tsx` defines `primaryBtnDisabled`, `index.tsx` defines `auraHalo` and `lockIcon`, and many screens define unused style keys. Lint for unused styles.
- **M8. Mixed component APIs.** `ScreenShell` supports `scroll` and `keyboardAvoiding`, but many screens instead wrap `ScrollView` and `KeyboardAvoidingView` by hand (three files use `KeyboardAvoidingView`, the rest use `ScrollView` alone).
- **M9. Large screen files.** 28 route files exceed 1,000 lines, and the largest (`add-sku.tsx`, 1,965 lines) mixes layout, state, validation, and demo data. Split into hooks, sections, and fixtures.
- **M10. Lists.** 38 files use `ScrollView` and only 5 use `FlatList`. Long lists (orders, catalog, reviews, notifications) render all rows at once.

---

## 5. Documentation vs. code (what the docs claim that is not true)

| Doc claim | Reality in code |
|---|---|
| "75 mobile screens" and "75 web screens" (`screen_docs/75_SCREENS_MASTER_INDEX.md`) | 41 route files in `mobile/app/` (37 screens plus 4 layouts); 40 `page-*` sections in `web/index.html`. Many index rows map to `profile.tsx` |
| Route structure `(tabs)/`, `order/[id].tsx`, `product/[id].tsx`, `add-product.tsx` (`docs/00`, `docs/05`) | Structure is `(auth)/`, `(onboarding)/`, `(vendor)/`, `admin.tsx`, `dev/header.tsx` |
| Dark glassmorphism theme `#0B0F19` (`docs/05`) | Light blue-and-white (`tokens.ts`) |
| Zustand store persisted to AsyncStorage; axios with 10 s timeout (`docs/06`) | No `persist` middleware; `fetch` with no timeout |
| Socket event `ORDER_OFFER` (`docs/02`, `docs/06`) | App listens for `order:incoming` (`home.tsx:141`) |
| Metro on port 8081 (`docs/09`) vs. 8082 (`docs/10`, and `web/package.json` serves on 8082) | Port conflict in docs |
| 10-second approval polling (`phone_docs/08`, `web_screen_docs/README`) | No polling exists (`pending.tsx` has no `setInterval`) |
| Encrypted session storage (`expo-secure-store`) and server re-validation on launch (`docs/10` P0) | Not implemented; `expo-secure-store` is not installed (C1, H13) |
| Test OTP chips gated by `__DEV__` (`phone_docs/02`, `03`, `08`) | Gated in `login`, `otp`, `pending`; ungated in `bank-edit`, `home`, `ready-pickup`, `pack-order` |
| Store detail data loaded from the backend (`pc_docs/21`, `phone_docs/21`) | Hardcoded (`earnings.tsx`) |
| "Store-scoped chat with server-side blocking" (`phone_docs/20`) | Client regex only; messages are local |
| "Audit trail, SHA-256 hash, support telemetry view" (`pc_docs/35`) | Simulated in `web/index.html` with `alert()` |
| "PROPOSED EXTENSION — Requires product-owner approval" (`pc_docs/36-40`) | Those screens are listed as implemented in the 75-screen index |
| Phone docs "Dev Mode: Tap to autofill" only in `__DEV__` | Test strip in `bank-edit.tsx` and test states in `home.tsx` are not gated |

**Duplicates and drift:** `docs/index.html` and `backend/src/views/admin.html` differ by 22 lines. `docs/phone_docs.zip` duplicates `docs/phone_docs/`. `pc_docs` has two files each for screens 13, 14, 15, and 18. `screen_docs` has three index files (`25_`, `35_`, `75_`) with different counts. The docs are not a reliable source of truth in their current state.

---

## 6. Per-screen status

Count columns are from the scans in section 8. "API" means the file imports the API or socket module. "Static" means the screen shows hardcoded business data for at least part of its content (confirmed by reading or by the fixed-data patterns above).

| Route | Purpose | API | Static data | Main issues |
|---|---|:-:|:-:|---|
| `index.tsx` | Splash & router | No | No | Routes on token presence and an onboarding flag that never becomes `'approved'` (C1, C2); web-only keyboard shortcuts (M5); resolution tag shown to users |
| `(auth)/login.tsx` | Phone entry | No | No | Hardcoded phone fallback (C3); always-enabled CTA; placeholder legal copy |
| `(auth)/otp.tsx` | OTP | No | No | Any non-`0000` code passes (C1); resend is cosmetic (M2); duplicate back controls (M1) |
| `(onboarding)/step-a.tsx` | Store info & GPS | No | Yes | Validator never called; fake owner name (C6); GPS unusable on native (H13) |
| `(onboarding)/step-b.tsx` | GSTIN, PAN, license | No | Yes | Fabricated GSTIN and PAN (C6) |
| `(onboarding)/step-c.tsx` | Bank & UPI | No | Yes | Fabricated payee and UPI (C6) |
| `(onboarding)/step-d.tsx` | Categories & seed | No | Yes | Submit never reaches backend (C7); fake token |
| `(onboarding)/pending.tsx` | Audit status | No | Yes | No polling; status read from local storage (C7); test status chips gated |
| `(onboarding)/approved.tsx` | Approved | No | No | Uses old palette `ui.tsx` (H1) |
| `(vendor)/home.tsx` | Command centre | 2 | Yes | Hardcoded metrics, modal, fallbacks (C8, C9); ungated test bar (C11); listener leak (C14) |
| `(vendor)/orders.tsx` | Orders queue | 1 | Yes | Fake pool (C8); Active tab empty (C13); nav rail copy |
| `(vendor)/order-detail.tsx` | Picking | No | Yes | Order not loaded; fixed basket (C8); client fee math (H11) |
| `(vendor)/pack-order.tsx` | Pack & bay | 1 | Yes | Constant PIN `4892` (C5); test strip |
| `(vendor)/ready-pickup.tsx` | Rider handover | 1 | Yes | No OTP check (C5); fallback `4892`; dispatch without code |
| `(vendor)/catalog.tsx` | Stock matrix | 1 | No | Best-built flow (optimistic + rollback); stock field contract (H12) |
| `(vendor)/add-sku.tsx` | Add/edit SKU | 1 | Partial | 41 sub-12px declarations; 14 emoji lines; 1,965 lines in one file |
| `(vendor)/earnings.tsx` | Ledger | No | Yes | Mock ledger and summary (C8); fake export (C8) |
| `(vendor)/payout-detail.tsx` | Settlements & UTR | 1 | Yes | Copy toast without copy (H12) |
| `(vendor)/bank-edit.tsx` | Bank & UPI change | No | Yes | Any 6-digit OTP passes (C4); no submit API; ungated test strip (C4) |
| `(vendor)/profile.tsx` | Store & KYC | No | Yes | Logout does not clear session (C2); Unsplash image; static KYC |
| `(vendor)/notifications.tsx` | Alerts | No | Yes | Static alert list |
| `(vendor)/messages.tsx` | Order chat | No | Yes | Local-only messages (H12); client-only contact guard |
| `(vendor)/returns.tsx` | Returns | No | Yes | Static claims; 12 test/demo references |
| `(vendor)/reviews.tsx` | Reviews | No | Yes | Static ratings; client-only guard; 9 test/demo references |
| `(vendor)/recommended-skus.tsx` | AI suggestions | No | Yes | Static recommendations and confidence values |
| `(vendor)/expiry.tsx` | FEFO | No | Yes | Static batches; 24 emoji lines |
| `(vendor)/analytics.tsx` | Analytics | No | Yes | Static charts |
| `(vendor)/compliance.tsx` | Compliance | No | Yes | Static reports |
| `(vendor)/multi-store.tsx` | Multi-store | No | Yes | Static store list; 123 hex literals |
| `(vendor)/procurement.tsx` | Purchase orders | No | Yes | Static POs |
| `(vendor)/promotions.tsx` | Promotions | No | Yes | Static campaigns; 113 hex literals |
| `(vendor)/security.tsx` | Sessions & log | No | Yes | Static session list; 25 emoji lines |
| `(vendor)/support.tsx` | Support tickets | No | Yes | Static tickets; 140 hex literals |
| `(vendor)/tax-documents.tsx` | GST & TCS/TDS | No | Yes | Static documents |
| `(vendor)/team.tsx` | Staff roles | No | Yes | Static roster; role management UI not wired |
| `admin.tsx` | Control tower | No | Yes | No role gate (C12); "Authorize IMPS" buttons; fake compliance claims |
| `dev/header.tsx` | Dev preview | No | No | Ships to production (C11) |

**Count:** 35 of 41 route files have no API or socket reference. Only the catalog and the order/handover screens are partially wired.

---

## 7. Recommended order of work

**Before any pilot (P0):**
1. Replace client-only auth with a server session: real OTP send and verify endpoints, token issued by the server, validated on launch, cleared on logout (C1, C2, C3, C4).
2. Remove every fallback that invents data: store, owner, GSTIN, PAN, payee, UPI, pickup PIN, default phone, default orders, default stock (C3, C5, C6, C8).
3. Re-enable validators and block continue on invalid input (C6).
4. Submit onboarding to `onboardingApi.submit` and read approval from the server (C7).
5. Enforce pickup-OTP verification on the server for handover; remove the constant PIN (C5).
6. Replace the incoming-order modal's constant content with the offer payload; fix accept's ID fallback (C9).
7. Use a native audio and haptics library for the order chime (C10).
8. Gate or remove all test UI (`bank-edit`, `home`, `dev/header`, splash tag) behind `__DEV__` or a build flag (C11).
9. Add role gating to `admin.tsx`; verify Firebase RTDB rules; move admin writes behind the backend (C12).
10. Fix the Active orders tab key (C13) and load the real order in `order-detail` (C8).
11. Remove listeners on unmount in `home.tsx` (C14).

**Before a wider release (P1):**
- Pick one design system (recommend `tokens.ts`), delete `theme/index.ts`, and remove hardcoded hex (H1).
- Raise minimum text size to 14px and body to 16px; adopt one icon set (H2, H3).
- Accessibility pass: labels on all inputs and controls, roles on tappable items, focus styles, `hitSlop` on compact controls, and an accessible web nav with `tabindex` and keyboard handlers (H4).
- Add `onRequestClose` to every modal; replace the login legal sheet with a real modal (H5).
- Replace `router.replace` in the bottom nav with stack-preserving navigation; extract one shared desktop nav component (H6).
- Add responsive breakpoints to `web/index.html` or retire it in favour of the Expo web build (H7, H14).
- Fix the double-encoded text in `web/index.html` (H8).
- Add missing dependencies (`expo-secure-store`, `expo-location`, audio/haptics, clipboard, pickers) and remove unused ones (H13).

**Hygiene (P2):**
- Delete orphaned code: `src/screens/VendorDashboard.tsx`, `src/components/OwlLoader.tsx`, `src/components/RapidoOrderOfferModal.tsx`, `src/components/ProductImageThumbnail.tsx`, `src/data/masterCatalog.ts`, `src/config/firebase.ts`, `src/features/*/adapter.ts`, and `admin/src/components/AdminVendorOperations.tsx`.
- Stop committing build output: `mobile/dist/`, `mobile/android/app/src/main/assets/index.android.bundle`, Android build and Gradle caches. Confirm `.env` files are ignored by git.
- Reconcile the docs with the code, and delete or archive stale index files.
- Replace Unsplash hotlinks with bundled assets.

---

## 8. What was verified, and what was not

**Verified by running:**
- `mobile/`: `tsc --noEmit` exits 0 with no errors (`tsconfig.json` extends `expo/tsconfig.base`).
- `mobile/`: `npx expo export --platform web` exits 0; bundle of 741 modules, no warnings.

**Verified by reading and scanning (no runtime):**
- Every markdown file in `docs/`, `docs/phone_docs/`, `docs/pc_docs/`, `screen_docs/`, and `web_screen_docs/` was read.
- Every mobile route file was scanned for styling, accessibility, dev gating, API usage, and test UI. Shared components, theme, store, API client, socket client, and the critical screens were read in full.
- `web/index.html` was analysed structurally (page sections, CDN resources, inline handlers, encoding, media queries, socket target) and its script section sampled. Its ~2,700-line script was not read line by line.
- `docs/index.html` and `backend/src/views/admin.html` were compared and scanned for data writes and endpoints.

**Not verified:**
- No screen was rendered on a device, emulator, or browser. Visual findings (sizes, overlaps, contrast) are from code, not screenshots.
- Native behaviour (sound, vibration, GPS, back button) is inferred from the APIs used, not observed.
- Firebase Realtime Database rules, backend auth, and whether the backend enforces the contact guard, OTP, and pickup code were not checked. The backend was read only where the UI contract depends on it.
- Contrast ratios were not measured.

---

## 9. Per-file metrics (generated from source)

Columns: total lines; literal hex colors; lines containing emoji glyphs; `fontSize` declarations below 12px; accessibility or testID attributes; references to the API or socket modules; test/demo references; `__DEV__` gates.

| Screen (route file) | Lines | Hex colors | Lines w/ emoji icons | Font <12px decls | a11y/testID attrs | API/socket refs | Test/demo refs | __DEV__ gates |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `app/(auth)/_layout.tsx` | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `app/(auth)/login.tsx` | 754 | 23 | 5 | 5 | 4 | 0 | 7 | 1 |
| `app/(auth)/otp.tsx` | 806 | 15 | 4 | 3 | 13 | 0 | 10 | 1 |
| `app/(onboarding)/_layout.tsx` | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `app/(onboarding)/approved.tsx` | 64 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `app/(onboarding)/pending.tsx` | 1216 | 14 | 7 | 5 | 0 | 0 | 6 | 1 |
| `app/(onboarding)/step-a.tsx` | 1334 | 16 | 6 | 10 | 14 | 0 | 8 | 0 |
| `app/(onboarding)/step-b.tsx` | 1394 | 23 | 13 | 19 | 9 | 0 | 29 | 0 |
| `app/(onboarding)/step-c.tsx` | 1350 | 18 | 11 | 11 | 7 | 0 | 27 | 0 |
| `app/(onboarding)/step-d.tsx` | 1411 | 25 | 12 | 12 | 5 | 0 | 22 | 0 |
| `app/(vendor)/_layout.tsx` | 35 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `app/(vendor)/add-sku.tsx` | 1965 | 33 | 14 | 41 | 0 | 1 | 8 | 0 |
| `app/(vendor)/analytics.tsx` | 1054 | 92 | 7 | 14 | 0 | 0 | 0 | 0 |
| `app/(vendor)/bank-edit.tsx` | 1318 | 81 | 6 | 32 | 0 | 0 | 6 | 0 |
| `app/(vendor)/catalog.tsx` | 1664 | 18 | 18 | 19 | 0 | 1 | 0 | 0 |
| `app/(vendor)/compliance.tsx` | 533 | 86 | 6 | 27 | 0 | 0 | 0 | 0 |
| `app/(vendor)/earnings.tsx` | 1758 | 24 | 8 | 31 | 0 | 0 | 6 | 0 |
| `app/(vendor)/expiry.tsx` | 1860 | 30 | 24 | 29 | 0 | 0 | 5 | 0 |
| `app/(vendor)/home.tsx` | 1752 | 21 | 18 | 20 | 2 | 2 | 41 | 0 |
| `app/(vendor)/messages.tsx` | 1493 | 24 | 15 | 42 | 0 | 0 | 10 | 0 |
| `app/(vendor)/multi-store.tsx` | 892 | 123 | 15 | 28 | 0 | 0 | 0 | 0 |
| `app/(vendor)/notifications.tsx` | 1036 | 75 | 11 | 19 | 0 | 0 | 3 | 0 |
| `app/(vendor)/order-detail.tsx` | 1302 | 16 | 11 | 25 | 0 | 0 | 0 | 0 |
| `app/(vendor)/orders.tsx` | 1413 | 12 | 16 | 22 | 2 | 1 | 1 | 0 |
| `app/(vendor)/pack-order.tsx` | 1405 | 25 | 14 | 29 | 0 | 1 | 7 | 0 |
| `app/(vendor)/payout-detail.tsx` | 1363 | 20 | 16 | 25 | 1 | 0 | 6 | 0 |
| `app/(vendor)/procurement.tsx` | 1177 | 96 | 6 | 12 | 0 | 0 | 0 | 0 |
| `app/(vendor)/profile.tsx` | 1491 | 87 | 11 | 34 | 0 | 0 | 6 | 0 |
| `app/(vendor)/promotions.tsx` | 1183 | 113 | 6 | 13 | 0 | 0 | 0 | 0 |
| `app/(vendor)/ready-pickup.tsx` | 764 | 20 | 11 | 7 | 3 | 1 | 3 | 0 |
| `app/(vendor)/recommended-skus.tsx` | 1553 | 38 | 21 | 34 | 0 | 0 | 3 | 0 |
| `app/(vendor)/returns.tsx` | 1781 | 25 | 18 | 34 | 0 | 0 | 12 | 0 |
| `app/(vendor)/reviews.tsx` | 1778 | 13 | 16 | 34 | 0 | 0 | 9 | 0 |
| `app/(vendor)/security.tsx` | 1154 | 100 | 25 | 11 | 0 | 0 | 0 | 0 |
| `app/(vendor)/support.tsx` | 1516 | 140 | 22 | 12 | 0 | 0 | 0 | 0 |
| `app/(vendor)/tax-documents.tsx` | 1131 | 76 | 10 | 22 | 0 | 0 | 4 | 0 |
| `app/(vendor)/team.tsx` | 1270 | 86 | 14 | 18 | 0 | 0 | 3 | 0 |
| `app/_layout.tsx` | 59 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `app/admin.tsx` | 863 | 59 | 1 | 24 | 0 | 0 | 0 | 0 |
| `app/dev/header.tsx` | 257 | 15 | 1 | 1 | 3 | 0 | 13 | 0 |
| `app/index.tsx` | 478 | 28 | 0 | 1 | 2 | 0 | 0 | 0 |

Generated from the workspace on the audit date. Re-run the same scans after fixes to confirm the counts move.

---

## 10. Implementation status (fixes applied after this audit)

Checks after the changes: `tsc --noEmit` exits 0 with zero errors; `expo export --platform web` exits 0 (742 modules).

### Fixed in the client
| Finding | Change |
|---|---|
| C1 OTP accepts any code | Verification fails closed. Only `4892` passes, and only in `__DEV__`. Real builds show "not available in this build yet" (`otp.tsx`). The server endpoint is still missing. |
| C2 Logout keeps session | Shared `clearSession()` in `src/services/session.ts` removes all session keys; logout calls it (`profile.tsx`). |
| C2 approved vendors sent to login | Splash routes to home when `vendor_registered === 'true'` (`index.tsx`). Web keyboard shortcuts are dev-only. |
| C3 Hardcoded login phone | Removed. The send button is disabled until the number is valid (`login.tsx`). |
| C4 Bank OTP bypass; fake submit | OTP accepts only `4892` in `__DEV__`. Submit shows "not available yet" and makes no change. Test strip wrapped in `__DEV__` (`bank-edit.tsx`). |
| C5 Handover without PIN | Expected PIN comes only from the order. Rider's PIN must match before dispatch; the PIN is no longer displayed to the vendor (`ready-pickup.tsx`). `dispatch` sends `otp` (`api.ts`). |
| C5 Pack screen constant PIN; dispatch without PIN | Pack screen no longer shows or dispatches; "Confirm" routes to the PIN-checked handover screen (`pack-order.tsx`). |
| C6 Fabricated onboarding data | Fallback values removed in steps A–C; step A's default owner, GPS, and coordinates cleared; step B's default GSTIN/PAN/license/trade licence removed; step C's default bank, IFSC, beneficiary, and UPI verification cleared. Each step runs its validator before continuing. Step B no longer records documents as uploaded. |
| C6/C7 Submission never reached server | Step D calls `onboardingApi.submit` with stored steps A–C and the seed selection. Categories and SKUs are no longer pre-selected; terms are unticked by default. |
| C8 Fake orders, metrics, basket, feed | Orders fallback removed (`orders.tsx`); home hero counts come from store orders; invented quality numbers and activity feed replaced with placeholders; order-detail picking list comes from the store order. |
| C9 Incoming-offer modal shows wrong order | Customer, address, items, order value, and order ID come from the offer payload. Accept no longer falls back to `GV-9912`. |
| C11 Test UI in production | Home test-state bar, bank-edit test strip, `/dev/header`, and `admin.tsx` are `__DEV__`-only. |
| C12 Admin reachable | `admin.tsx` renders only in `__DEV__` until role-based sign-in exists. |
| C13 Active tab empty | Tab key changed to `ACCEPTED`, which the filter and counts already handle (`orders.tsx`). |
| C14 Listener leak | Socket handlers are removed on unmount (`home.tsx`). |
| C10 Silent alerts (partial) | Native phones now vibrate on incoming offers, using React Native's built-in `Vibration` (`sound.ts`). Audio still needs a package (see below). |
| H12 Misc | Pause reason sent to the API; customer-app button hidden unless `EXPO_PUBLIC_CUSTOMER_APP_URL` is set and no longer points at localhost; UTR "copied" message only shows after a real copy; socket no longer uses fixed Vijayawada coordinates. |

### Still open (needs a decision or server work)
1. **Real authentication (C1):** no OTP send/verify endpoints exist. Choose a provider (for example Firebase Phone Auth or an SMS gateway), then implement the endpoints and a server-issued, expiring session that replaces the local token.
2. **Onboarding auto-approval (C7):** `POST /api/onboarding/submit` marks the vendor approved on the server (`backend/src/server.js`, around line 1984). Approval should come from compliance review, not from submission.
3. **Full bank account number (C6/C7):** it is deliberately not stored on the device, so the submission carries only the masked number. A secure per-step or server-side channel is needed for the full number.
4. **Handover verification (C5):** the backend `dispatch` route must compare `otp` with the order's stored code and reject mismatches. The client now sends it.
5. **Audio alert (C10):** install `expo-av` (or an equivalent) and play the chime on native. `stopRinging()` is still a no-op.
6. **Admin and database (C12):** add role-based sign-in to the mobile admin screens; check Firebase RTDB rules; route admin writes through the backend.
7. **Financial math and idempotency (docs/10 P0 items 3–4):** the 88/12 split and GST must be server-calculated, and state transitions need idempotency keys. Not started.
8. **Document uploads (docs/10 P0 item 5):** no upload pipeline exists. Presigned URLs and an upload component are needed.
9. **Static screens (C8):** earnings (`MOCK_LEDGER_DATA`), messages, notifications, compliance, multi-store, procurement, promotions, team, tax documents, support, security, and other feature screens still render hardcoded data. They need API integration or an explicit "coming soon" state before any pilot.
10. **Remaining ungated demo bars (C11):** `step-b.tsx`, `step-c.tsx`, `step-d.tsx`, `earnings.tsx`, `notifications.tsx`, `payout-detail.tsx`, `profile.tsx`, `tax-documents.tsx`, `team.tsx`, and smaller strips in `add-sku`, `expiry`, `messages`, `recommended-skus`, `returns`, `reviews`, and `ready-pickup`. The `ready-pickup` strip also shows the text "Verify 4-digit PIN 4892".
11. **Residual fake strings:** names such as "Priya S.", "Sathvik V.", and order "GV-9912" remain in the static screens listed in item 9.
12. **Theme and typography (H1–H3):** the design-system consolidation, the 11px minimum, and the emoji-to-icon change were not started.
13. **Web app (H8, H9):** the double-encoded text and the simulated behaviour in `web/index.html` were not changed.
14. **Dead code and dependencies (H12, H13):** orphaned modules were not deleted; unused packages were not removed.
