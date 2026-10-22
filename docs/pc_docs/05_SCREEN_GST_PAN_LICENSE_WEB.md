# 💻 PC / Web Screen 05: GST, PAN & License Upload — Business Verification (Step 2/4)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-onboarding-b`)
  - Expo Web / Mobile React Native: [`mobile/app/(onboarding)/step-b.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/step-b.tsx)
- **Web URL**: `/onboarding/step-b` or `index.html#onboarding-b`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop merchant onboarding Step 2 for verifying business tax identity, retail license compliance, and uploading mandatory compliance documents:
- **Onboarding Header Shell**:
  - GlowVAI logo, merchant workspace title, auto-save status indicator (`✓ Saved at 10:25 PM`).
  - 4-step horizontal progress tracker bar (`1 Store` completed in Royal Blue, `2 Documents` active in Royal Blue).
  - Support help trigger (`Need help? 💬`).
- **Encrypted Security Header Banner**:
  - Top security notification (`🔒 Your documents are encrypted and reviewed securely`).
  - Compliance document progress badge (`1 of 3 docs uploaded` / `3 of 3 docs uploaded`).
- **Two-Column Desktop Grid Layout**:
  - **Left Column (7/12 Width)**:
    - **Tax Identity Card**:
      - 15-character GSTIN input with auto-uppercase formatting, regex validation (`/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`), green verified pill (`✓ Valid GSTIN`), info tooltip trigger (`ℹ️ Why GSTIN?`), masked data display (`37AAACG****1Z8`).
      - 10-character PAN card input with auto-uppercase formatting, regex validation (`/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`), green verified pill (`✓ Valid PAN`), info tooltip trigger (`ℹ️ Why PAN?`), masked data display (`AAACG****F`).
    - **Retail Licenses Card**:
      - Cosmetics Retail License number input (`DL-2026-COSM-9912`).
      - License expiry date picker with active indicator (`✓ Active (Exp: 31/12/2028)`).
      - Trade license input clearly labeled `Trade license (Optional)`.
      - Beauty-specific compliance language (no generic FSSAI terminology).
  - **Right Column (5/12 Width)**:
    - **Required Compliance Documents Workspace**:
      - 3 Drag-and-Drop Upload Cards: (1) GST Certificate, (2) Store-front photo with signboard, (3) Owner Govt ID.
      - Supports desktop drag-and-drop & file picker.
      - Displays allowed formats (PDF, JPG, PNG <= 5MB), upload progress bar with virus scan step (`🛡️ Running security & virus scan...`), document thumbnail preview, uploaded success badge (`✓ Uploaded`), Replace & Remove actions, file size exceeded error box, and upload retry button.
- **Interactive Demo State Switcher Bar**:
  - Quick toggles to preview compliance edge cases: Duplicate GSTIN alert, Invalid PAN format, Expired license warning, Malware scan failure, and Backend review pending.
- **Persistent Bottom Action Bar**:
  - Left actions: `← Back to store info` + `💾 Save draft` button.
  - Right action: Primary CTA button (`Continue to bank setup →`) showing `Step 2 of 4` with explanatory disabled state when required fields or documents are incomplete.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Top Shell Header** | White card (`#FFFFFF`) with 1px border | Max-width `1200px`, 4-step horizontal progress tracker with Royal Blue active indicator |
| **Encrypted Banner** | Soft blue light background (`#EFF6FF`) | Displays security message, lock icon, and `1 of 3 docs uploaded` counter badge |
| **GSTIN & PAN Inputs** | 48px height with uppercase mask | Auto-converts input to uppercase; displays green verified pill upon regex match |
| **Document Cards** | 3 Drag-and-Drop Cards | Icon, title, file size limit (5MB), upload progress bar, scan step, thumbnail preview |
| **Bottom Action Bar** | Fixed Bottom Bar (`#FFFFFF`) | Back link + Save draft button on left, Royal Blue primary CTA (`Continue to bank setup →`) on right |

---

## ⚡ Web Drag-and-Drop & Security Rules
- **Allowed File Types**: PDF, JPG, PNG.
- **Max File Size Limit**: 5MB per document. Displays inline red error box if file size exceeds 5MB.
- **Malware & Virus Scan**: Simulates automated security metadata scan before confirming upload.
- **Masked Data Storage**: Automatically masks sensitive GSTIN/PAN characters (`37AAACG****1Z8`) when saving session data to `onb_step_b`.
