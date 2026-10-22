# 📱💻 GLOW VAI Vendor App — Streamlined 35 Production Screens Index (`/screen_docs`)

Welcome to the streamlined master documentation index for the **GlowVAI Vendor Application & Web Desktop Command Center**.

After removing 40 non-essential warehouse-chain/procurement/superadmin screens, the application is streamlined to **35 production-ready vendor screens** for Mobile and PC/Web.

---

## 📊 35 Streamlined Screen Summary

| Functional Cluster Domain | Screen Range | Mobile Screen Count | PC/Web Desktop Screen Count | Combined Total |
| :--- | :---: | :-: | :-: | :-: |
| **1. Onboarding, Auth & Identity** | Screens 1 – 10 | **10 Screens** | **10 Screens** | **20 Screens** |
| **2. Dark Store Dispatch & Orders** | Screens 11 – 20 | **10 Screens** | **10 Screens** | **20 Screens** |
| **3. Catalog & Stock Management** | Screens 21 – 25 | **5 Screens** | **5 Screens** | **10 Screens** |
| **4. Customer Support & Returns** | Screens 26 – 29 | **4 Screens** | **4 Screens** | **8 Screens** |
| **5. Finance, Tax & Profile Settings** | Screens 30 – 35 | **6 Screens** | **6 Screens** | **12 Screens** |
| **TOTAL PLATFORM SYSTEM** | **Screens 1 – 35** | **35 Mobile Screens** | **35 PC/Web Screens** | **70 Total Views** |

---

## 🗺️ Complete 35 Streamlined Screen Itemized Table

### Cluster 1: Onboarding, Auth & Identity (Screens 1 to 10)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Root Splash & Router** | `mobile/app/index.tsx` | `web/src/pages/splash` | Animated brand hero aura, session token evaluator, auto-redirection |
| **02** | **Vendor Mobile Login** | `mobile/app/(auth)/login.tsx` | `web/src/pages/login` | Indian mobile number input (`+91`), format validation, SMS trigger |
| **03** | **SMS OTP Verification** | `mobile/app/(auth)/otp.tsx` | `web/src/pages/otp` | 4-digit numeric boxes, resend timer, test OTP bypass (`4892`) |
| **04** | **Onboarding 1: Basic Store Info** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/step-a` | Store name, owner name, shop type selection, operating hours |
| **05** | **Onboarding 2: Store GPS Pinning** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/gps` | GPS Lat/Lng detection for Redis GEO dispatch targeting |
| **06** | **Onboarding 3: GSTIN & PAN Check** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/gst` | GSTIN & PAN format verification and tax registration status |
| **07** | **Onboarding 4: License Upload** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/license` | Trade license upload cards |
| **08** | **Onboarding 5: Bank & UPI Setup** | `mobile/app/(onboarding)/step-c.tsx` | `web/src/pages/onboarding/bank` | Bank account number, IFSC code, and VPA for payout settlements |
| **09** | **Onboarding 6: Stock Seeding** | `mobile/app/(onboarding)/step-d.tsx` | `web/src/pages/onboarding/seed` | Category multi-select chips and initial regional SKU seed list |
| **10** | **Audit & Approval Status** | `mobile/app/(onboarding)/pending.tsx` | `web/src/pages/onboarding/status` | 10s polling audit listener & application approval success banner |

---

### Cluster 2: Dark Store Dispatch & Orders (Screens 11 to 20)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **11** | **Operational Home & Duty Switch** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard` | Live duty toggle (`ON DUTY` / `PAUSED`) & stat cards |
| **12** | **Incoming Order Offer Modal** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard/offer` | 45s countdown timer, audio chime, vibrate & SETNX accept lock |
| **13** | **Pending Orders Queue** | `mobile/app/(vendor)/orders.tsx` | `web/src/pages/orders/pending` | Filterable status tabs (Pending, Active, Packed, Ready, Dispatched) |
| **14** | **Order Picking Workspace** | `mobile/app/(vendor)/order-detail.tsx` | `web/src/pages/orders/picking` | Itemized checklist with warehouse bin coordinates |
| **15** | **Bin Navigation (`BIN-A-01-02-01`)** | `mobile/app/(vendor)/order-detail.tsx` | `web/src/pages/orders/bins` | Monospace blue bin badges for sub-60s picking execution |
| **16** | **Packing & Pickup Bay Selection** | `mobile/app/(vendor)/pack-order.tsx` | `web/src/pages/orders/pack` | Select physical pickup bay (`Bay-01`, `Bay-02`, `Bay-03`) |
| **17** | **Item Substitution Workspace** | `mobile/app/(vendor)/order-detail.tsx` | `web/src/pages/orders/substitute` | Propose alternative SKUs to customer for missing items |
| **18** | **Ready for Pickup Workspace** | `mobile/app/(vendor)/ready-pickup.tsx` | `web/src/pages/orders/ready` | Delivery rider details (name, phone, vehicle number, ETA) |
| **19** | **Rider Handover & OTP Verification** | `mobile/app/(vendor)/ready-pickup.tsx` | `web/src/pages/orders/handover` | 4-digit customer delivery OTP verification dialog |
| **20** | **Completed Orders Archive** | `mobile/app/(vendor)/orders.tsx` | `web/src/pages/orders/history` | Delivered order history & proof of delivery records |

---

### Cluster 3: Catalog & Stock Management (Screens 21 to 25)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **21** | **Master SKU Catalog Matrix** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog` | SKU search bar, category filter chips & product grid |
| **22** | **Live Stock Stepper (`[−] qty [+]`)** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/steppers` | Quick stock adjustment buttons with instant server sync |
| **23** | **Add New Product SKU Form** | `mobile/app/(vendor)/add-sku.tsx` | `web/src/pages/catalog/add-sku` | Add SKU title, category, MRP, selling price, stock & bin |
| **24** | **Low Stock Threshold Alerts** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/low-stock` | Amber alert highlights when stock falls below 5 units |
| **25** | **AI Skincare Demand Recommendations** | `mobile/app/(vendor)/recommended-skus.tsx` | `web/src/pages/catalog/recommended` | Fast-moving skincare demand recommendations & 1-tap import |

---

### Cluster 4: Customer Support & Returns (Screens 26 to 29)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **26** | **Customer Return Requests Queue** | `mobile/app/(vendor)/profile` | `web/src/pages/returns/queue` | List of customer return requests |
| **27** | **Return Quality Inspection** | `mobile/app/(vendor)/profile` | `web/src/pages/returns/inspect` | Inspect returned items with photo upload |
| **28** | **Ratings & Customer Reviews** | `mobile/app/(vendor)/profile` | `web/src/pages/reviews` | 4.96 ⭐ store rating breakdown & customer comments |
| **29** | **Vendor-Customer Support Chat** | `mobile/app/(vendor)/profile` | `web/src/pages/support/chat` | Direct messaging with customer for order issues |

---

### Cluster 5: Finance, Tax & Profile Settings (Screens 30 to 35)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **30** | **Financial Revenue Ledger** | `mobile/app/(vendor)/earnings` | `web/src/pages/earnings/ledger` | Daily & weekly revenue dashboard |
| **31** | **88% Vendor / 12% Take-Rate Split** | `mobile/app/(vendor)/earnings` | `web/src/pages/earnings/commission` | Platform commission calculation |
| **32** | **Weekly Bank Settlement (UTR)** | `mobile/app/(vendor)/payout-detail` | `web/src/pages/earnings/utr-history` | UTR transaction receipts & settlement logs |
| **33** | **Bank Account & UPI Management** | `mobile/app/(vendor)/bank-edit` | `web/src/pages/finance/bank-details` | Edit bank account & UPI VPA with OTP re-auth |
| **34** | **Push Notifications Log** | `mobile/app/(vendor)/notifications` | `web/src/pages/notifications` | System push alerts & order log |
| **35** | **Store Profile & KYC Dossier** | `mobile/app/(vendor)/profile` | `web/src/pages/profile` | Store profile details, operating hours & KYC badge |
