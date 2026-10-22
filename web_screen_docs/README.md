# 💻 GLOW VAI Vendor Web Application — Complete Screen Documentation Portal (`/web_screen_docs`)

Welcome to the complete screen documentation portal for the **GlowVAI Vendor Web Application** (`web/`).

The Web Application features a 1-to-1 matching desktop web screen for every mobile application screen, utilizing a high-efficiency desktop layout with left sidebar navigation, multi-column metric cards, responsive data tables, keyboard shortcuts, and Socket.IO real-time event push handlers.

---

## 📊 Complete Screen Breakdown & Count Summary

| Platform Application | Directory Path | Screen Count | Responsive Support |
| :--- | :--- | :-: | :--- |
| **GlowVAI Vendor Mobile App** | [`mobile/app`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app) | **23 Screens** | iOS, Android, Mobile Web (Expo SDK 51) |
| **GlowVAI Vendor Web App** | [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) | **23 Screens** | Desktop Web (1024px+), Tablet (768px), Mobile View |
| **TOTAL COMBINED PLATFORM** | `glowvai-vendor-app/` | **46 Total Screens** | Full Cross-Platform Parity |

---

## 🗺️ Web vs Mobile 1-to-1 Screen Map Table

| # | Screen Module Scope | Mobile Screen (`mobile/app`) | Web Screen (`web/index.html`) | Desktop Web Layout Features |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Root Splash & Router** | `mobile/app/index.tsx` | `web/src/pages/splash` | Centered brand aura, automated session router |
| **02** | **Vendor Phone Login** | `mobile/app/(auth)/login.tsx` | `web/src/pages/login` | Centered card (max 420px), +91 prefix box |
| **03** | **SMS OTP Verification** | `mobile/app/(auth)/otp.tsx` | `web/src/pages/otp` | 4 large input boxes, resend countdown timer |
| **04** | **Step A: Store Info & GPS** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/step-a` | Sectioned form card, map pin GPS detect button |
| **05** | **Step B: KYC & Tax Upload** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/step-b` | GSTIN/PAN live format validator, 3 upload boxes |
| **06** | **Step C: Bank Account** | `mobile/app/(onboarding)/step-c.tsx` | `web/src/pages/onboarding/step-c` | Bank account confirm fields, IFSC auto-lookup |
| **07** | **Step D: Categories & Seed** | `mobile/app/(onboarding)/step-d.tsx` | `web/src/pages/onboarding/step-d` | Multi-select chips grid, SKU quick-seed list |
| **08** | **Audit Pending Status** | `mobile/app/(onboarding)/pending.tsx` | `web/src/pages/onboarding/pending` | Yellow status pill, 10s auto-polling listener |
| **09** | **Approval Success** | `mobile/app/(onboarding)/approved.tsx` | `web/src/pages/onboarding/approved` | Emerald success banner, dashboard redirect |
| **10** | **Vendor Command Center** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard` | Left sidebar, 4-stat cards, live duty switch |
| **11** | **Orders Queue & Stream** | `mobile/app/(vendor)/orders.tsx` | `web/src/pages/orders` | Filterable status tabs, responsive data table |
| **12** | **Order Detail Picking** | `mobile/app/(vendor)/order-detail.tsx` | `web/src/pages/orders/detail` | 2-column checklist, green bin badges (`BIN-A-01-02-01`) |
| **13** | **Packing & Bay Assignment** | `mobile/app/(vendor)/pack-order.tsx` | `web/src/pages/orders/pack` | 3 pickup bay cards (`Bay-01`, `Bay-02`, `Bay-03`) |
| **14** | **Rider Handover & OTP** | `mobile/app/(vendor)/ready-pickup.tsx` | `web/src/pages/orders/dispatch` | Rider card, vehicle ETA, OTP verification dialog |
| **15** | **Catalog Matrix & Steppers** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog` | 4-column product grid, `[−] qty [+]` live steppers |
| **16** | **Add SKU Form** | `mobile/app/(vendor)/add-sku.tsx` | `web/src/pages/catalog/add-sku` | Sectioned modal form, image preview, MRP check |
| **17** | **AI Demand SKUs** | `mobile/app/(vendor)/recommended-skus.tsx` | `web/src/pages/catalog/recommended` | Regional skincare demand cards, 1-tap store import |
| **18** | **Earnings Ledger** | `mobile/app/(vendor)/earnings.tsx` | `web/src/pages/earnings` | Weekly sales bar chart, 88/12 take-rate split |
| **19** | **Payout Settlement Invoice** | `mobile/app/(vendor)/payout-detail.tsx` | `web/src/pages/earnings/invoice` | UTR transaction receipt, GST tax invoice |
| **20** | **Store Profile & KYC** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/profile` | Dark store dossier, rating (`4.96 ⭐`), logout |
| **21** | **Bank Account & UPI Edit** | `mobile/app/(vendor)/bank-edit.tsx` | `web/src/pages/profile/bank` | Bank details editor with OTP re-authentication |
| **22** | **Notifications Center** | `mobile/app/(vendor)/notifications.tsx` | `web/src/pages/notifications` | Grouped alerts log, mark all read action |
| **23** | **Multi-Store Admin Console** | `mobile/app/admin.tsx` | `web/src/pages/admin` | Multi-vendor dossier grid, order simulator, JSON export |

---

## ⚡ How Device Detection & Auto-Redirection Works

The web platform (`web/index.html`) includes a client-side viewport listener:
```javascript
function updateResolutionTag() {
  const w = window.innerWidth;
  if (w >= 1024) {
    // Renders full desktop web command center with left sidebar
  } else if (w >= 768) {
    // Renders 2-column tablet layout
  } else {
    // Adapts to mobile screen layout automatically
  }
}
```
- When a user accesses the portal on a desktop or laptop browser, it automatically presents the **Web Desktop Command Center**.
- When accessed on a smartphone or mobile browser, it adapts cleanly to the mobile view layout.
