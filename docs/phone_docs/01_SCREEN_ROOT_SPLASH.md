# 📱 Mobile Screen 01: Root Splash & Session Router

## 📍 File & Route Specification
- **File Path**: `mobile/app/index.tsx`
- **Route URL**: `/` (Root Index Entry)
- **Access Level**: Public / Unauthenticated Session Evaluator

---

## 🎯 Purpose & Business Logic
The initial entry point of the GlowVAI Vendor Mobile Application. It renders the brand identity aura and evaluates active session tokens from `AsyncStorage`. Automatically routes vendors to:
1. `/(vendor)/home` if a valid session token & verified vendor profile exist.
2. `/(auth)/login` if no session is stored or token has expired.
3. `/(onboarding)/pending` if onboarding verification audit is in progress.

---

## 🎨 Visual Design & UI System
- **Canvas**: Pure White (`#FFFFFF`) canvas with centered vertical layout and responsive safe area padding.
- **Brand Identity**: Royal Blue (`#1D4ED8`) logo mark with 22px border radius on clean `#FFFFFF` card background. No heavy gradients or glowing radial auras.
- **Typography**: Inter / system bold headers (`#0F172A`) and secondary labels (`#64748B`).
- **Progress Bar**: Horizontal progress indicator in Royal Blue (`#1D4ED8`) over slate track (`#F1F5F9`).

---

## ⚡ Key Features & Data Flow
- `AsyncStorage.getItem('vendor_session_token')`
- `AsyncStorage.getItem('vendor_onboarding_status')`
- Evaluates active session state and routes to target flow within 700ms.

---

## ♿ Edge & Lifecycle States
- **Offline / Network Error**: Clear banner with option to retry or return to login screen.
- **Maintenance / Lockout**: Displays scheduled system maintenance banner.
- **Rejected Onboarding / Pending Audit**: Directly routes to status review page `/(onboarding)/pending`.
- **GPS Denied**: Gracefully handles location permission states upon session initialization.
