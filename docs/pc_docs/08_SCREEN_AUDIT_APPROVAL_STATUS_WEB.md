# 💻 PC / Web Screen 08: Onboarding Audit & Approval Status (Web)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-pending`)
  - Expo Web / Mobile React Native: [`mobile/app/(onboarding)/pending.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/pending.tsx)
- **Web URL**: `/onboarding/pending` or `index.html#pending`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop merchant onboarding compliance review screen for a vendor who has submitted registration and is waiting for audit verification:
- **Navigation Topbar Header**:
  - GlowVAI logo badge, merchant audit workspace label, 24/7 Merchant Support link (`Merchant Support 💬`), and Sign Out action.
- **Application Summary Hero Header Card**:
  - Title: `Your store is under review`
  - Supporting copy: `We’re checking your business tax documents, bank payout details, and store geo-fence.`
  - Reference meta box displaying Application Ref ID (`REF-GV-2026-99128`), Submission date (`October 8, 2026, 10:35 PM`), and Last updated timestamp (`Updated at 10:42 PM`).
  - Restrained amber status visual (`⏳ Compliance Check In Progress`).
- **Two-Column Desktop Grid Layout (1200px Max Content Width)**:
  - **Primary Column (7/12 Width)**:
    - **Vertical Audit Timeline Card**:
      - 4 Key verification stages:
        1. `GSTIN & PAN documents` — Verified (`✓ Verified on Oct 8, 10:35 PM`)
        2. `Bank account verification` — Verified (`✓ Penny drop test successful • HDFC Bank Benz Circle`)
        3. `Store location and geo-fence` — In progress (`🔍 Checking 3.5km dark store quick-commerce delivery zone`)
        4. `Final approval` — Upcoming (`🔒 Unlocks Merchant Command Center`)
      - Supports 5 explicit states with text, icons, and color badges: Verified (`✓`), In progress (`⏳`), Needs attention (`⚠️`), Rejected (`❌`), Not started (`🔒`).
      - "↻ Refresh status" action button with live timestamp feedback.
  - **Secondary Column (5/12 Width)**:
    - **"What happens next?" Card**: 3 numbered steps explaining background audit, clarification call/WhatsApp routing, and instant command center unlock upon approval.
    - **Submitted Application Copy Card**: Action button to open a read-only modal drawer inspecting submitted store identity, tax identity, documents, and bank setup.
    - **Support Routing**: Direct buttons for WhatsApp Support & Call 1800-123-4567.
- **Interactive Demo Audit Edge State Switcher Bar**:
  - Quick toggles to preview compliance audit edge cases: **Under Review (Default)**, **Action Needed**, **Application Rejected**, **Approved Launch**, and **Maintenance Mode**.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Top Shell Header** | White card (`#FFFFFF`) with 1px border | Max-width `1200px`, brand logo, support link, and sign out button |
| **Hero Status Card** | White card (`#FFFFFF`) with 1px border | Restrained amber badge (`⏳ Compliance Check In Progress`), Ref ID box |
| **Vertical Timeline** | 4-Stage Connector Line Grid | Verification checkmarks, spinners, amber/red badges, and timestamps |
| **Read-Only Modal** | Max-width `580px` drawer | Displays exact submitted store details, masked tax numbers, and bank account copy |

---

## ⚡ Web State Management & Routing
- Checks `vendor_onboarding_status` in local storage key.
- When approved, updates status to `'approved'` and routes vendor directly into the Merchant Command Center ([`mobile/app/(vendor)/home.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28vendor%29/home.tsx)).
