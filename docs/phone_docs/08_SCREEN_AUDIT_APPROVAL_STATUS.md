# 📱 Mobile Screen 08: Onboarding Audit & Approval Status

## 📍 File & Route Specification
- **File Path**: `mobile/app/(onboarding)/pending.tsx`
- **Route URL**: `/(onboarding)/pending`
- **Access Level**: Authenticated Merchant (Pending Audit Approval)

---

## 🎯 Purpose & Business Logic
Displays real-time compliance review and verification status for newly submitted vendor accounts. Features 10-second automatic polling listener to detect backend approval signals and auto-redirect approved vendors to the Store Command Center.

---

## 🎨 Visual Design & UI System
- **Status Cards**:
  - `UNDER_REVIEW`: Pure white elevated card with blue spinning loader and compliance audit checklist (GSTIN check, Bank penny-drop, Location verification).
  - `APPROVED`: Clean white card with Royal Blue (`#1D4ED8`) verification badge and `"Enter Command Center"` CTA. No confetti or emerald green banners.
- **Fast-Track Simulation Pill**: `Dev Demo: Fast-Track Approval in 3s` button visible exclusively when `__DEV__` is true (absent in production).

---

## ⚡ Key Features & Data Flow
- **Realtime Polling**: Polls `onboardingApi.getAuditStatus()` every 10 seconds.
- **Auto-Navigation**: Redirects to `/(vendor)/home` immediately upon approval.

---

## ♿ Edge & Lifecycle States
- **Audit Rejected**: Displays rejection reasons (e.g. `"GSTIN mismatch on Trade Certificate"`) with an `"Update Dossier"` re-submission action.
- **Network Failure**: Suspends polling gracefully and resumes when online.
