# 💻 PC / Web Screen 06: Bank Account & UPI Setup — Set Up Payouts (Step 3/4)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-onboarding-c`)
  - Expo Web / Mobile React Native: [`mobile/app/(onboarding)/step-c.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/step-c.tsx)
- **Web URL**: `/onboarding/step-c` or `index.html#onboarding-c`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop merchant onboarding Step 3 for configuring payout settlement bank accounts and optional instant UPI payout handles:
- **Onboarding Header Shell**:
  - GlowVAI logo badge, merchant onboarding title, draft auto-save indicator (`✓ Draft saved at 10:30 PM`), support help trigger (`Need help? 💬`).
  - 4-step horizontal progress tracker bar (`1 Store` & `2 Documents` completed with checkmarks, `3 Bank` active in Royal Blue, `4 Catalog` upcoming).
- **Two-Column Desktop Grid Layout (1200px Max Content Width)**:
  - **Left Column (7/12 Width)**:
    - **Bank Account Details Card**:
      - Searchable popular bank chip bar showing HDFC Bank, ICICI Bank, State Bank of India, Axis Bank, and Kotak Mahindra Bank.
      - Fields: Beneficiary name, Account number, Confirm account number (with friendly paste restriction helper: `🔒 Please type manually to prevent typo transfers. Paste is disabled for safety.`), and IFSC code.
      - Masked account number display (`•••• •••• 4589`) with toggleable Show/Hide privacy button.
      - Compact IFSC Branch Resolution Panel: Displays resolved branch (`HDFC Bank, Benz Circle Branch, Vijayawada`), green verified badge (`✓ Verified Branch`), lookup timestamp (`10:30 PM`), and edit action link.
      - Inline validation states for invalid IFSC, branch lookup loading, branch not found, account number mismatch (`⚠️ Account numbers do not match`), name mismatch, and verification pending.
    - **UPI Settlement Handle Card (Optional)**:
      - VPA input (`glowstore@hdfcbank`), "Verify handle" button with loading spinner, and verified status badge (`✓ Verified VPA (Sri Lakshmi Cosmetics)`).
  - **Right Column (5/12 Width)**:
    - **Payout Schedule Info Card**:
      - Calm reassurance explaining "Daily settlement target: 06:00 AM, T+1".
      - Plain-language details on order processing, refunds, bank checks, and IMPS payout timing.
    - **Payout Security Card**:
      - "Your payout details are protected" with masked account summary and security policy drawer link.
    - **Review Before Submitting Card**:
      - Pre-submission checklist card showing valid beneficiary name, matching account numbers, and resolved IFSC code.
- **Interactive Demo Settlement Edge State Switcher Bar**:
  - Quick toggles to preview settlement edge cases: **Default Verified**, **API Gateway Timeout**, **Offline Mode**, **Duplicate Bank Account**, **UPI Verification Failure**, and **Session Expired**.
- **Persistent Bottom Action Bar**:
  - Left actions: `← Back to documents` + `💾 Save draft` button.
  - Right action: Primary CTA button (`Continue to catalog setup →`) displaying `Step 3 of 4` with explanatory disabled state when bank details are incomplete.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Top Shell Header** | White card (`#FFFFFF`) with 1px border | Max-width `1200px`, 4-step horizontal progress tracker with Royal Blue active indicator |
| **Popular Banks** | Horizontal Scrollable Pill Chips | Light blue highlight when selected (`#EFF6FF`), 1px `#BFDBFE` border |
| **Confirm Account Field** | 48px height with paste block | Friendly helper text: `🔒 Please type manually to prevent typo transfers. Paste is disabled for safety.` |
| **IFSC Input & Branch Box** | 11-char auto-uppercase | Renders green success box with resolved branch location & lookup timestamp |
| **Bottom Action Bar** | Fixed Bottom Bar (`#FFFFFF`) | Back link + Save draft button on left, Royal Blue primary CTA (`Continue to catalog setup →`) on right |

---

## ⚡ Web Security Rules & Payout Policy
- `autocomplete="off"` on sensitive account and confirm account fields.
- Masked storage format (`XXXXXX4589`) in `onb_step_c` local storage key.
- Instant automated daily payout at 06:00 AM T+1 into verified NPCI IMPS bank account.
