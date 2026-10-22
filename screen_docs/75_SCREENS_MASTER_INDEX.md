# 📱💻 GLOW VAI Vendor App — Complete 75 Screen Master Index (`/screen_docs`)

Welcome to the 100% complete master documentation index for the **GlowVAI Vendor Application & Web Desktop Command Center**.

Every single one of the **75 Mobile Screens** and matching **75 PC/Web Screens** is itemized, categorized into 8 functional clusters, and mapped with exact file paths, URLs, design components, and user action triggers.

---

## 📊 75 Screen Master Count Summary

| Functional Cluster Domain | Screen Range | Mobile Screen Count | PC/Web Desktop Screen Count | Combined Total |
| :--- | :---: | :-: | :-: | :-: |
| **1. Onboarding, Auth & Identity** | Screens 1 – 10 | **10 Screens** | **10 Screens** | **20 Screens** |
| **2. Dark Store Dispatch & Orders** | Screens 11 – 20 | **10 Screens** | **10 Screens** | **20 Screens** |
| **3. Inventory, Catalog & Stock** | Screens 21 – 30 | **10 Screens** | **10 Screens** | **20 Screens** |
| **4. Warehouse & Staff Operations** | Screens 31 – 40 | **10 Screens** | **10 Screens** | **20 Screens** |
| **5. Supplier Procurement & POs** | Screens 41 – 50 | **10 Screens** | **10 Screens** | **20 Screens** |
| **6. Customer Returns & Support** | Screens 51 – 60 | **10 Screens** | **10 Screens** | **20 Screens** |
| **7. Finance, Tax & Bank Payouts** | Screens 61 – 70 | **10 Screens** | **10 Screens** | **20 Screens** |
| **8. Marketing, Admin & Platform** | Screens 71 – 75 | **5 Screens** | **5 Screens** | **10 Screens** |
| **TOTAL PLATFORM SYSTEM** | **Screens 1 – 75** | **75 Mobile Screens** | **75 PC/Web Screens** | **150 Total Views** |

---

## 🗺️ Complete 75 Screen Itemized Table

### Cluster 1: Onboarding, Auth & Identity (Screens 1 to 10)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Root Splash & Router** | `mobile/app/index.tsx` | `web/src/pages/splash` | Animated brand hero aura, session token evaluator, auto-redirection |
| **02** | **Vendor Phone Login** | `mobile/app/(auth)/login.tsx` | `web/src/pages/login` | Indian mobile number input (`+91`), format validation, SMS trigger |
| **03** | **SMS OTP Verification** | `mobile/app/(auth)/otp.tsx` | `web/src/pages/otp` | 4-digit numeric boxes, resend timer, test OTP bypass (`4892`) |
| **04** | **Onboarding 1: Basic Store Info** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/step-a` | Store name, owner name, shop type selection, operating hours |
| **05** | **Onboarding 2: Store GPS Pinning** | `mobile/app/(onboarding)/step-a.tsx` | `web/src/pages/onboarding/gps` | GPS Lat/Lng detection for Redis GEO dispatch targeting |
| **06** | **Onboarding 3: GSTIN & PAN Check** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/gst` | GSTIN & PAN format verification and tax registration status |
| **07** | **Onboarding 4: License Upload** | `mobile/app/(onboarding)/step-b.tsx` | `web/src/pages/onboarding/license` | Trade license & FSSAI food safety document upload cards |
| **08** | **Onboarding 5: Bank & UPI Setup** | `mobile/app/(onboarding)/step-c.tsx` | `web/src/pages/onboarding/bank` | Bank account number, IFSC code, and VPA for payout settlements |
| **09** | **Onboarding 6: Stock Seeding** | `mobile/app/(onboarding)/step-d.tsx` | `web/src/pages/onboarding/seed` | Category multi-select chips and initial regional SKU seed list |
| **10** | **Audit & Approval Status** | `mobile/app/(onboarding)/pending.tsx` | `web/src/pages/onboarding/status` | 10s polling audit listener & application approval success banner |

---

### Cluster 2: Dark Store Dispatch & Orders (Screens 11 to 20)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **11** | **Operational Home & Duty Switch** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/dashboard` | Live duty toggle (`ON DUTY` / `PAUSED`) & 4 metric cards |
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

### Cluster 3: Inventory, Catalog & Stock (Screens 21 to 30)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **21** | **Master SKU Catalog Matrix** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog` | SKU search bar, category filter chips & product grid |
| **22** | **Live Stock Stepper (`[−] qty [+]`)** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/steppers` | Quick stock adjustment buttons with instant server sync |
| **23** | **Add New Product SKU Form** | `mobile/app/(vendor)/add-sku.tsx` | `web/src/pages/catalog/add-sku` | Add SKU title, category, MRP, selling price, stock & bin |
| **24** | **Bulk Stock CSV/JSON Importer** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/bulk-upload` | Import catalog SKUs from CSV text or raw JSON arrays |
| **25** | **Low Stock Threshold Alerts** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/low-stock` | Amber alert highlights when stock falls below 5 units |
| **26** | **Expiry Date Tracker** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/expiry` | Tracks cosmetic shelf life & expiration dates |
| **27** | **Barcode & QR Code Scanner** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/barcode` | Handheld camera & laser barcode scanner integration |
| **28** | **Aisle & Bin Mapping Tool** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/bin-mapping` | Assign shelf, aisle, rack and bin coordinates |
| **29** | **AI Skincare Demand Recommendations** | `mobile/app/(vendor)/recommended-skus.tsx` | `web/src/pages/catalog/recommended` | Fast-moving skincare demand recommendations & 1-tap import |
| **30** | **Stock Audit & Waste Log** | `mobile/app/(vendor)/catalog.tsx` | `web/src/pages/catalog/audit-log` | Manual deductions, damaged items & inventory audit history |

---

### Cluster 4: Warehouse Operations & Staff Management (Screens 31 to 40)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **31** | **Picker Staff Roster** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/staff/roster` | Dark store picker staff list, phone numbers & active duty |
| **32** | **Shift Scheduler & Clock-In** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/staff/shifts` | Shift assignment & staff attendance tracking |
| **33** | **Picker Speed Leaderboard** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/staff/leaderboard` | Sub-60s item picking speed rankings & metrics |
| **34** | **Cold Storage Temperature Monitor** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/cold-storage` | Serum & climate storage temperature sensors |
| **35** | **Packaging Materials Tracker** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/packaging` | Polybags, tamper-evident seals & box inventory |
| **36** | **Scanner & Thermal Printer Status** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/devices` | Bluetooth thermal receipt printer & scanner status |
| **37** | **Hygiene & Safety Audit Checklist** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/hygiene` | Daily store sanitization & safety audit checklist |
| **38** | **Emergency Duty Pause Modal** | `mobile/app/(vendor)/home.tsx` | `web/src/pages/operations/pause-modal` | Select pause reason (heavy rush, shift break, restock) |
| **39** | **Store Operating Hours Setup** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/hours` | Opening Time (`06:00 AM`) & Closing Time (`11:30 PM`) |
| **40** | **Multi-Store Hub Switcher** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/operations/hub-switcher` | Switch context between DS-VIJ-01, DS-VIJ-02, DS-GNT-01 |

---

### Cluster 5: Supplier Procurement & POs (Screens 41 to 50)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **41** | **Purchase Orders (PO) Dashboard** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/pos` | Active POs sent to skincare & beauty distributors |
| **42** | **Create PO to Brand Distributor** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/create-po` | Re-order Minimalist, CeraVe & Re'equil inventory |
| **43** | **Goods Received Note (GRN) Inspection** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/grn` | Inward shipment quantity & quality verification |
| **44** | **Damaged Goods Return to Vendor (RTV)** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/rtv` | Return damaged or expired stock to distributor |
| **45** | **Supplier Contact Directory** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/suppliers` | Distributor contact numbers, email & lead times |
| **46** | **PO In-Transit Shipment Tracker** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/shipments` | Track incoming wholesale supply trucks |
| **47** | **Inward Stock Batch Tracking** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/batches` | Lot numbers & manufacturing batch codes |
| **48** | **Supplier Payment Invoices** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/invoices` | Distributor payment bills & payment status |
| **49** | **Minimum Order Quantity (MOQ) Rules** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/moq` | Minimum wholesale quantity rules per brand |
| **50** | **Vendor Sourcing Price Comparison** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/procurement/price-compare` | Compare distributor wholesale rates |

---

### Cluster 6: Customer Returns & Support (Screens 51 to 60)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **51** | **Customer Return Requests Queue** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/returns/queue` | List of customer return requests |
| **52** | **Return Quality Inspection** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/returns/inspect` | Inspect returned items with photo upload |
| **53** | **Instant Refund Approval** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/returns/refund` | Approve refund calculation for customer |
| **54** | **Ratings & Customer Reviews** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/reviews` | 4.96 ⭐ store rating breakdown & customer comments |
| **55** | **Vendor-Customer Support Chat** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/support/chat` | Direct messaging with customer for order issues |
| **56** | **Rider Handover Dispute Resolution** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/support/rider-disputes` | Resolve rider handover disputes |
| **57** | **Missing Item Audit Ticket System** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/support/tickets` | Log missing item investigation tickets |
| **58** | **Store Service Quality Scoreboard** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/quality/scorecard` | 98% quality metric benchmarks |
| **59** | **Fraud & Suspicious Order Shield** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/security/fraud-shield` | Flag fake delivery addresses or unpaid orders |
| **60** | **Delivery Delay Compensation Log** | `mobile/app/(vendor)/profile.tsx` | `web/src/pages/support/delays` | Late delivery logs & rider SLA penalties |

---

### Cluster 7: Finance, Tax & Bank Payouts (Screens 61 to 70)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **61** | **Financial Revenue Ledger** | `mobile/app/(vendor)/earnings` | `web/src/pages/earnings/ledger` | Daily & weekly revenue dashboard |
| **62** | **88% Vendor / 12% Take-Rate Split** | `mobile/app/(vendor)/earnings` | `web/src/pages/earnings/commission` | Platform commission calculation |
| **63** | **Weekly Bank Settlement (UTR)** | `mobile/app/(vendor)/payout-detail` | `web/src/pages/earnings/utr-history` | UTR transaction receipts & settlement logs |
| **64** | **GST Tax Invoices (18% & 5%)** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/gst-invoices` | B2B tax invoice generator |
| **65** | **TCS & TDS Tax Deduction Statement** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/tcs-tds` | E-commerce operator tax compliance statements |
| **66** | **COD Cash Reconciliation Drawer** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/cod-drawer` | Cash-on-delivery collection drawer log |
| **67** | **Bank Account & UPI Management** | `mobile/app/(vendor)/bank-edit` | `web/src/pages/finance/bank-details` | Edit bank account & UPI ID with OTP re-auth |
| **68** | **Instant Payout Withdrawal Request** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/instant-payout` | T+0 instant UPI payout withdrawal form |
| **69** | **Daily Store Expense Tracker** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/expenses` | Store electricity, rent & packaging expenses |
| **70** | **Financial Year End Audit Exporter** | `mobile/app/(vendor)/earnings` | `web/src/pages/finance/year-end-report` | Export complete financial ledger for CA audit |

---

### Cluster 8: Marketing, Admin & Platform Settings (Screens 71 to 75)
| # | Screen Title | Mobile Route Path | PC/Web Route Path | Core Functional Features |
| :-: | :--- | :--- | :--- | :--- |
| **71** | **Promotional Coupons Creator** | `mobile/app/(vendor)/profile` | `web/src/pages/marketing/coupons` | Create vendor discounts & promo codes |
| **72** | **Dark Store Banner Placement** | `mobile/app/(vendor)/profile` | `web/src/pages/marketing/banners` | Featured skincare brand banners |
| **73** | **Push Notification Alert Log** | `mobile/app/(vendor)/notifications` | `web/src/pages/notifications/log` | FCM push & socket broadcast history |
| **74** | **Store Profile & KYC Dossier** | `mobile/app/(vendor)/profile` | `web/src/pages/settings/dossier` | 8 km operating radius & license dossier |
| **75** | **Multi-Store Superadmin Console** | `mobile/app/admin.tsx` | `web/src/pages/admin/console` | Multi-store fleet command & 1-click JSON export |
