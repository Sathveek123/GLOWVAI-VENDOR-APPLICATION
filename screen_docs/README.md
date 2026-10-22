# 📱 GLOW VAI Vendor App — Complete Screen Documentation Portal (`/screen_docs`)

Welcome to the dedicated screen documentation suite for the **GlowVAI Vendor Application & Admin Supervisor Platforms**.

Every screen in the application has been mapped, analyzed, and documented in detail across 24 dedicated README files.

---

## 🗂️ Complete Screen Documentation Map

### 🔐 Group A: Auth & Portal Splash Screens
| Module | Screen Name | File Path | Key Features |
| :-: | :--- | :--- | :--- |
| [**01**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/01_SCREEN_ROOT_SPLASH_INDEX.md) | **Root Splash & Router** | `mobile/app/index.tsx` | App launch branding, token check, route redirection |
| [**02**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/02_SCREEN_AUTH_LOGIN.md) | **Vendor Login** | `mobile/app/(auth)/login.tsx` | Indian mobile number input (`+91`), validation, SMS trigger |
| [**03**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/03_SCREEN_AUTH_OTP_VERIFICATION.md) | **OTP Verification** | `mobile/app/(auth)/otp.tsx` | 4-digit OTP input boxes, resend countdown, bypass test OTP (`4892`) |

---

### 📝 Group B: Multi-Step Vendor Onboarding Flow
| Module | Screen Name | File Path | Key Features |
| :-: | :--- | :--- | :--- |
| [**04**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/04_SCREEN_ONBOARDING_STEP_A_STORE_BASIC_INFO.md) | **Step A: Store Info & GPS** | `mobile/app/(onboarding)/step-a.tsx` | Store name, owner name, operating hours, GPS location detection |
| [**05**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/05_SCREEN_ONBOARDING_STEP_B_KYC_DOCUMENTS.md) | **Step B: KYC & Tax Docs** | `mobile/app/(onboarding)/step-b.tsx` | GSTIN, PAN, FSSAI numbers, document photo uploads |
| [**06**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/06_SCREEN_ONBOARDING_STEP_C_BANK_ACCOUNT.md) | **Step C: Bank Account** | `mobile/app/(onboarding)/step-c.tsx` | Bank account number, IFSC code, UPI VPA for payouts |
| [**07**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/07_SCREEN_ONBOARDING_STEP_D_CATEGORY_SELECTION.md) | **Step D: Categories** | `mobile/app/(onboarding)/step-d.tsx` | Category chips, initial SKU quick-seed, submit application |
| [**08**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/08_SCREEN_ONBOARDING_PENDING_APPROVAL.md) | **Pending & Approved** | `mobile/app/(onboarding)/pending.tsx` | Auto-polling audit status, approval success banner |

---

### 🛍️ Group C: Core Dark Store Vendor Screens
| Module | Screen Name | File Path | Key Features |
| :-: | :--- | :--- | :--- |
| [**10**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/10_SCREEN_VENDOR_HOME_DASHBOARD.md) | **Home Dashboard** | `mobile/app/(vendor)/home.tsx` | Duty switch (`ON DUTY`), metrics, `ORDER_OFFER` pop-up with sound/vibration |
| [**11**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/11_SCREEN_VENDOR_ORDERS_QUEUE.md) | **Orders Queue** | `mobile/app/(vendor)/orders.tsx` | Active, pending, packed, ready, completed order status tabs |
| [**12**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/12_SCREEN_VENDOR_ORDER_DETAIL_PICKING.md) | **Order Detail Picking** | `mobile/app/(vendor)/order-detail.tsx` | Itemized checklist, green bin badges (`BIN-A-01-02-01`), pickup action workflow |
| [**13**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/13_SCREEN_VENDOR_PACK_ORDER.md) | **Pack & Pickup Bay** | `mobile/app/(vendor)/pack-order.tsx` | Pickup bay selection (`Bay-01`), ready status transition |
| [**14**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/13_SCREEN_VENDOR_PACK_ORDER.md) | **Rider Handover** | `mobile/app/(vendor)/ready-pickup.tsx` | Delivery rider info, vehicle number, OTP verification handover |
| [**15**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/15_SCREEN_VENDOR_CATALOG_MATRIX.md) | **Catalog Matrix** | `mobile/app/(vendor)/catalog.tsx` | SKU search, category scrollbar, `[−]` and `[+]` live stock steppers |
| [**16**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/16_SCREEN_VENDOR_ADD_SKU.md) | **Add SKU Form** | `mobile/app/(vendor)/add-sku.tsx` | Product onboarding form, bin assignment, pricing & image URL |
| [**17**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/16_SCREEN_VENDOR_ADD_SKU.md) | **Recommended SKUs** | `mobile/app/(vendor)/recommended-skus.tsx` | AI skincare demand recommendations, 1-tap store import |
| [**18**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/18_SCREEN_VENDOR_EARNINGS_LEDGER.md) | **Earnings Ledger** | `mobile/app/(vendor)/earnings.tsx` | Revenue breakdown, 88% net vendor payout / 12% take-rate ledger |
| [**19**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/18_SCREEN_VENDOR_EARNINGS_LEDGER.md) | **Payout Invoice** | `mobile/app/(vendor)/payout-detail.tsx` | UTR transaction number, tax breakdown, settlement receipt |
| [**20**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/20_SCREEN_VENDOR_PROFILE_KYC.md) | **Store Profile & KYC** | `mobile/app/(vendor)/profile.tsx` | Shop details, rating (`4.96 ⭐`), KYC status badge, logout button |
| [**21**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/20_SCREEN_VENDOR_PROFILE_KYC.md) | **Bank Account Edit** | `mobile/app/(vendor)/bank-edit.tsx` | Update bank account & UPI details with OTP re-auth |
| [**22**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/22_SCREEN_VENDOR_NOTIFICATIONS.md) | **Notifications Log** | `mobile/app/(vendor)/notifications.tsx` | System push alerts, order log, mark read API |

---

### 🖥️ Group D: Admin & Command Consoles
| Module | Screen Name | File Path | Key Features |
| :-: | :--- | :--- | :--- |
| [**23**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/22_SCREEN_VENDOR_NOTIFICATIONS.md) | **Mobile Admin** | `mobile/app/admin.tsx` | Mobile supervisor multi-store monitor & order simulator |
| [**24**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/screen_docs/22_SCREEN_VENDOR_NOTIFICATIONS.md) | **Web Admin Portal** | `docs/index.html` | GitHub Pages portal, live stock matrix steppers, 1-tap simulator, JSON backup |
