# 📱💻 GLOW VAI Vendor App — 25 Production Beauty & Cosmetics Screens Index (`/screen_docs`)

Welcome to the official 25-screen master documentation index for the **GlowVAI Vendor Application & Web Desktop Command Center**.

All 25 screens are tailored for beauty, skincare, and cosmetics dark store merchants, eliminating dark-store warehouse leftovers and consolidating flows into 25 high-impact production screens.

---

## 📊 25 Production Screen Summary

| Functional Cluster Domain | Screen Range | Mobile Screen Count | PC/Web Desktop Screen Count | Combined Total |
| :--- | :---: | :-: | :-: | :-: |
| **1. Onboarding, Auth & Identity** | Screens 01 – 08 | **8 Screens** | **8 Screens** | **16 Screens** |
| **2. Store Ops & Order Processing** | Screens 09 – 13 | **5 Screens** | **5 Screens** | **10 Screens** |
| **3. Catalog & Stock Management** | Screens 14 – 17 | **4 Screens** | **4 Screens** | **8 Screens** |
| **4. Customer Support & Returns** | Screens 18 – 20 | **3 Screens** | **3 Screens** | **6 Screens** |
| **5. Finance, Tax & Profile Settings** | Screens 21 – 25 | **5 Screens** | **5 Screens** | **10 Screens** |
| **TOTAL PLATFORM SYSTEM** | **Screens 01 – 25** | **25 Mobile Screens** | **25 PC/Web Screens** | **50 Total Views** |

---

## 🗺️ Complete 25 Screen Itemized Map Table

### Group 1: Onboarding, Auth & Identity (Screens 01 to 08)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Root Splash & Router** | `mobile/app/index.tsx` | `web/src/pages/splash` | Brand logo aura, session token evaluator, auto-redirection |
| **02** | **Vendor Mobile Login (+91)** | `mobile/app/(auth)/login.tsx` | `web/src/pages/login` | Indian mobile number input (`+91`), format check, SMS trigger |
| **03** | **SMS OTP Verification** | `mobile/app/(auth)/otp.tsx` | `web/src/pages/otp` | 4-digit numeric boxes, resend timer, test OTP bypass (`4892`) |
| **04** | **Step 1: Store Info & GPS** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/step-a` | Store name, owner name, operating hours & GPS map pin |
| **05** | **Step 2: GSTIN, PAN & License** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/step-b` | GSTIN, PAN & trade license document photo upload cards |
| **06** | **Step 3: Bank Account & UPI** | `mobile/app/(onboarding)/step-c.tsx` | `web/src/pages/onboarding/step-c` | Bank account number, IFSC code & VPA for payouts |
| **07** | **Step 4: Categories & Seed** | `mobile/app/(onboarding)/step-d.tsx` | `web/src/pages/onboarding/step-d` | Skincare/Beauty category chips & initial catalog seed list |
| **08** | **Audit & Approval Status** | `mobile/app/(onboarding)/pending.tsx` | `web/src/pages/onboarding/pending` | 10s auto-polling audit listener & approval success banner |

---

### Group 2: Store Operations & Order Processing (Screens 09 to 13)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **09** | **Store Command Center ("Store Open / Paused")** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard` | Duty switch ("Store Open / Paused") & 4 metric cards |
| **10** | **Incoming Order Offer Modal** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard/offer` | 45s countdown timer, audio chime & SETNX accept lock |
| **11** | **Orders List & History** | `mobile/app/(vendor)/orders.tsx` | `web/src/pages/orders` | Filterable status tabs (Pending, Active, Delivered, Cancelled) |
| **12** | **Order Detail & Substitution** | `mobile/app/(vendor)/order-detail.tsx` | `web/src/pages/orders/detail` | Item checklist, optional shelf location & item substitution |
| **13** | **Order Packing & Rider Handover** | `mobile/app/(vendor)/pack-order.tsx` | `web/src/pages/orders/pack-handover` | Rider ETA, vehicle info & 4-digit delivery OTP verification |

---

### Group 3: Skincare & Cosmetics Catalog Management (Screens 14 to 17)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **14** | **Catalog Matrix & Live Steppers** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog` | SKU search, category chips, `[−] qty [+]` steppers & low stock filter |
| **15** | **Add / Edit SKU (Shades & Variants)** | `mobile/app/(vendor)/add-sku.tsx` | `web/src/pages/catalog/add-sku` | Add/edit product SKU with shades, sizes & variants |
| **16** | **Expiry & Batch Lot Tracker** | `mobile/app/(vendor)/catalog/expiry` | `web/src/pages/catalog/expiry` | Track cosmetics expiration dates & manufacturing batch codes |
| **17** | **AI Skincare Demand SKUs** | `mobile/app/(vendor)/recommended-skus.tsx` | `web/src/pages/catalog/recommended` | Fast-moving skincare demand recommendations & 1-tap import |

---

### Group 4: Customer Support, Returns & Rating (Screens 18 to 20)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **18** | **Customer Return Requests** | `mobile/app/(vendor)/returns.tsx` | `web/src/pages/returns` | Return requests queue, photo inspection & refund approval |
| **19** | **Ratings & Customer Reviews** | `mobile/app/(vendor)/reviews.tsx` | `web/src/pages/reviews` | 4.96 ⭐ store rating breakdown & customer comments |
| **20** | **Vendor-Customer Support Chat** | `mobile/app/(vendor)/messages.tsx` | `web/src/pages/support/chat` | Direct messaging with customer for order resolution |

---

### Group 5: Financial Ledger, Tax & Profile Settings (Screens 21 to 25)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **21** | **Financial Revenue Ledger (88/12)** | `mobile/app/(vendor)/earnings.tsx` | `web/src/pages/earnings` | Daily & weekly revenue dashboard with 88/12 split |
| **22** | **Weekly Bank Settlement (UTR)** | `mobile/app/(vendor)/payout-detail.tsx` | `web/src/pages/earnings/utr` | Bank transaction UTR receipts & settlement logs |
| **23** | **GST Invoices & TCS/TDS Statements** | `mobile/app/(vendor)/tax-documents.tsx` | `web/src/pages/finance/gst-tcs` | 18% & 5% GST tax invoices and TCS/TDS statements |
| **24** | **Bank Account & UPI Management** | `mobile/app/(vendor)/bank-edit.tsx` | `web/src/pages/finance/bank-details` | Edit bank account & UPI VPA with OTP re-auth |
| **25** | **Store Profile & KYC License** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/profile` | Store profile details, operating hours & KYC license dossier |
