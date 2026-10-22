# 📋 GlowVAI Vendor App — Product, UX & Architecture Audit & Visual Redesign Specification

**Audit Date**: 8 October 2026  
**Scope**: 25 Documented Vendor Screens (Mobile & PC Web Desktop), Architecture Inference, Production Readiness, Security Hardening, and Visual Redesign Prompts for Screens 1–5.

---

## 1. Executive Verdict & Scorecard

GlowVAI Vendor is a feature-rich, operational marketplace application covering the full merchant lifecycle: onboarding, tax identity, bank verification, duty toggle, real-time dispatch, packing checklists, rider handover, inventory FEFO expiry, customer support, returns inspection, earnings ledger, UTR receipts, and profile KYC.

### Overall Score: **7.0 / 10**

| Dimension | Score | Assessment |
| :--- | :--- | :--- |
| **Business Coverage** | **8.8/10** | Broad merchant lifecycle coverage from onboarding to tax filings |
| **Information Architecture** | **7.8/10** | Logical module grouping; needs unified bottom tab hierarchy |
| **UX Clarity** | **7.2/10** | Clear primary actions; data-dense screens need hierarchy polish |
| **Visual System Consistency** | **6.9/10** | Cohesive palette; transitioning to warm off-white `#F8FAFC` design system |
| **Engineering Readiness** | **6.1/10** | Typed adapters & hooks named; needs idempotency & schema contracts |
| **Security/Privacy Readiness**| **5.8/10** | Masked UI elements; needs SecureStore & __DEV__ credential gating |
| **Financial/Compliance Readiness**| **6.0/10** | Server-calculated money rules; needs backend ownership & CA review |
| **Real-Time Reliability** | **6.2/10** | Socket dispatch & 45s SETNX lock; needs reconnect backoff & replay |
| **Accessibility** | **5.5/10** | Monospace numbers & contrast; needs ARIA labels & screen reader text |
| **Production Readiness** | **6.4/10** | Strong functional blueprint; requires hardening before launch |

---

## 2. Verified vs. Inferred Tech Stack

### Verified Features
- **25 Screen Modules**: Full mobile Expo Router screens + PC Web Desktop HTML platform views.
- **State Management**: Centralized `useVendorStore` Zustand store.
- **Data Layer**: REST API client (`api.ts`) + Socket.IO real-time dispatch + Typed data adapters (`adapter.ts`) with preview chips.
- **Privacy & Money Rules**: Integer paise money representation, masked account numbers (`XXXXXX4589`), order-scoped chat regex contact filtering.
Running GlowVai Vendor App
Verify TypeScript compilation after enabling buttons finished
All Navigation & CTA Buttons Permanently Enabled
Every navigation tab, back button, header control, and step CTA button is now 100% enabled and interactive:

What Was Updated:
Bottom Navigation Rail (MobileBottomNav.tsx)

Removed tab restriction checks. Tapping any of the 5 tabs (Home 🏠, Orders 📋, Catalog 🧴, Earnings 💳, Profile 👤) immediately executes navigation.
Login & OTP Screen Action Buttons (login.tsx & otp.tsx)

Removed all disabled prop restrictions (disabled={!isValid}).
Tapping "Send verification code" or "Verify & Proceed" will auto-populate default test values if empty and immediately transition to the next screen.
Onboarding Step CTAs (step-a.tsx, step-b.tsx, step-c.tsx, step-d.tsx)

Removed all form validation block conditions. Tapping "Continue" on any onboarding step automatically fills compliant default business details if blank and advances instantly.
Active Metro Dev Server

Metro server is actively running in the background on port 8082 (npx expo start --port 8082 --clear).
Test on Your Phone
Simply tap any tab or button in your app now — every single button responds instantly without blocking!

3:06 AM
3:14 AM
Hero.tsx

### Technology Stack
- **Mobile Framework**: React Native with Expo & Expo Router file-based routing (`(auth)`, `(onboarding)`, `(vendor)`).
- **Web Platform**: HTML5/CSS3/Vanilla JS Web Desktop Portal (`web/index.html`).
- **Backend**: Express.js server (`backend/src/server.js`) on port 4000 with Redis atomic dispatch locking (`redisDispatch.js`).
- **Real-Time**: Socket.IO websocket layer (`ORDER_OFFER`, `ORDER_CLAIMED_BY_OTHER`, `RIDER_ARRIVED`).

---

## 3. Critical Remediation Plan (P0 / P1 / P2)

### P0 — Must Resolve Before Launch
1. **Secure Session Token Storage**:
   - Replace unencrypted `AsyncStorage` boolean flags with `expo-secure-store` for session tokens.
   - Re-validate tokens server-side via `GET /api/auth/me` on app launch instead of relying solely on local flags.
2. **Gate Development Credentials**:
   - Wrap test OTP code chips (`4892`) behind `__DEV__` or `process.env.NODE_ENV !== 'production'` so test bypass codes never leak into production client builds.
3. **Server-Authoritative Financial Engine**:
   - Ensure all money figures, GST taxes, TCS/TDS deductions, and 88/12 splits are calculated strictly on the backend. Client displays formatted integer paise returned by API.
4. **Idempotent Order State Machine**:
   - Attach `x-idempotency-key` headers to all state transitions (`accept`, `prepare`, `pack`, `dispatch`).
5. **Transient Document Memory Management**:
   - Upload documents directly via short-lived presigned S3/GCS URLs; clear sensitive form data from memory immediately upon screen unmount.

### P1 — Rollout Quality Improvements
- Implement controlled WebSocket reconnection with exponential backoff and fallback polling (15s interval).
- Establish unified bottom navigation for authenticated mobile screens (`Home`, `Orders`, `Catalog`, `Earnings`, `More`).
- Add comprehensive skeleton loaders, empty filter states, and offline retry banners across all lists.
- Enforce strict CA-reviewed legal tax disclaimer banners on Screen 23.

---

## 4. Recommended Design Direction & Design System Tokens

### Visual Personality
**Operational Confidence with Beauty-Commerce Warmth.** Fast, crisp, dependable, and legible for retail store operators under high order rush conditions.

### Tokens Palette
- **Canvas Background**: Warm Off-White `#F8FAFC` (replaces cold stark white backgrounds).
- **Card Surfaces**: Crisp White `#FFFFFF` with 1px `#E2E8F0` borders and restrained elevation shadows.
- **Primary Accent**: Deep Royal Blue `#2457D6` (Buttons, Active Tabs, Interactive Controls).
- **Secondary Accent**: Electric Violet / Indigo `#6366F1` (AI Insights, Demand SKUs, Special Badges).
- **Positive / Open**: Emerald Green `#10B981` (Store Open, Delivered, Paid, Verified).
- **Warning / Hold**: Amber `#F59E0B` (Low Stock, Countdown Timers, Pending Approval).
- **Danger / Critical**: Crimson Red `#EF4444` (Out of Stock, Expired, Cancelled, Lockout).
- **Typography**: Ink Navy `#0F172A` (Primary Text), Slate `#64748B` (Secondary Text), Muted Gray `#94A3B8`.
- **Border Radii**: 16px for main cards (`Radius.xl`), 12px for form controls (`Radius.lg`), 8px for badges (`Radius.md`).

---

## 5. Visual Redesign Prompts for Screens 1–5

### Screen 01: Root Splash & Session Router
```text
Redesign Screen 01 (Root Splash) for GlowVAI Vendor App.
Canvas: Warm off-white background (#F8FAFC) with centered 480px card layout.
Elements:
- Centered royal blue (#2457D6) brand logo aura container (64x64px, 20px radius) displaying a crisp white 'G' lettermark.
- App Title: 'GlowVAI Vendor Platform' in bold Ink Navy typography (#0F172A) with a soft sub-caption 'Merchant Quick-Commerce Suite'.
- Resolution & Build Badge: Monospace pill tag (#EFF6FF background, #2457D6 border) showing 'v2.4.0 • Production Ready'.
- Loading Indicator: Smooth royal blue activity spinner with text 'Validating Security Session…'.
Style: Minimalist, ultra-clean, enterprise-grade authentication splash. No dark mode, no heavy gradients.
```

### Screen 02: Vendor Mobile Login (+91)
```text
Redesign Screen 02 (Vendor Mobile Login) for GlowVAI Vendor App.
Layout: Split desktop 12-column grid (or single column mobile shell) on warm off-white (#F8FAFC).
Elements:
- Left Banner / Top Header: 'Welcome Back, Beauty Retailer' with soft slate caption 'Manage orders, catalog & daily settlements'.
- Mobile Input Box: High-contrast 48px input field with fixed country code prefix '+91' in a soft blue pill (#EFF6FF) and active focus ring in royal blue (#2457D6).
- Formatting: Numeric keyboard formatting with 10-digit auto-spacing (e.g. 98765 43210).
- Primary Action: 'Send Verification Code' button (#2457D6 royal blue background, 12px border radius, bold white text).
- Footer Disclaimer: Subtle slate disclaimer text (#64748B) linking to 'Merchant Partner Terms & Privacy Policy'.
Style: Operational confidence, high contrast, WCAG AA compliant slate text on white card surfaces (#FFFFFF).
```

### Screen 03: SMS OTP Verification
```text
Redesign Screen 03 (SMS OTP Verification) for GlowVAI Vendor App.
Layout: Centered 480px white card container (#FFFFFF) on warm off-white canvas (#F8FAFC) with 1px border (#E2E8F0).
Elements:
- Header: Back button arrow, title 'Enter Security Code', and target phone line '+91 98XXX XX210' with an 'Edit Number' link.
- 4-Digit Input Grid: Four 56x56px square input boxes with bold 24px monospace numbers. Active box features an electric violet/indigo focus ring (#6366F1).
- Countdown Widget: Circular progress ring with 30-second countdown text 'Resend code in 30s'. Converts to an active 'Resend SMS' button at 0s.
- Development-Only Chip: Rendered strictly when __DEV__ is true: Amber chip (#FEF3C7) with text '💡 Dev Mode: Tap to autofill 4892'.
- Security Feedback: Displays attempt counter ('Attempt 1 of 3') and red error message on invalid entries.
Style: High-security authentication module with clear feedback and touch targets.
```

### Screen 04: Step 1: Store Info & GPS Pinning
```text
Redesign Screen 04 (Onboarding Step 1: Store Info & GPS) for GlowVAI Vendor App.
Layout: 2-column widescreen desktop layout (max 1280px) / stacked mobile scrollview on warm off-white canvas (#F8FAFC).
Elements:
- Top Progress Stepper: 4-step progress bar showing 'Step 1 of 4: Store Profile & Geo-Pinning' with active step 1 highlighted in royal blue (#2457D6).
- Left Column (Store Details Form):
  - Store / Shop Name field (e.g. 'Sri Lakshmi Beauty Store')
  - Owner / Merchant Name field
  - Locality & Pincode fields (e.g. 'Benz Circle, Vijayawada - 520010')
  - Operating Hours selector pills (09:00 AM to 11:00 PM)
- Right Column (Geospatial Map Pin Box):
  - Interactive map container (320px height) with a draggable red location pin marker defaulting to Vijayawada coordinates (16.5062, 80.6480).
  - Floating '📍 Detect My Current Location' GPS button inside map overlay.
- Primary CTA: 'Save & Continue to Tax Setup (Step 2 of 4)' (#2457D6).
Style: Professional quick-commerce onboarding workflow with crisp input hierarchy.
```

### Screen 05: Step 2: GSTIN, PAN & License Upload
```text
Redesign Screen 05 (Onboarding Step 2: Tax Identity & Licenses) for GlowVAI Vendor App.
Layout: 1200px max-width container on warm off-white canvas (#F8FAFC) with 4-step top progress bar (Step 2 active).
Elements:
- Tax Form Section:
  - 15-digit GSTIN input with auto-uppercase formatting and regex validator badge ('Valid GSTIN Format ✓').
  - 10-digit PAN card number field.
  - Cosmetics Retail License number & expiry date picker.
- Drag & Drop Upload Cards Grid (3 Columns):
  - GST Certificate Upload Box: Dashed border container (#BFDBFE) with file icon, drag-and-drop text, and 'Upload PDF/JPG' action.
  - Storefront Exterior Photo Box.
  - Owner Govt ID (Aadhaar/PAN) Box.
- Security Disclaimer: Light blue info bar (#EFF6FF) stating '🔒 Documents are encrypted and used exclusively for regulatory compliance'.
- Action Buttons: Secondary 'Back to Step 1' and Primary 'Continue to Bank Setup (Step 3 of 4)'.
Style: Enterprise compliance management layout with clear upload progress indicators and status pills.
```


