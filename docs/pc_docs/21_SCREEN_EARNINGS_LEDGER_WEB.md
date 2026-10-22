# 💻 PC / Web Screen 21: Financial Revenue Ledger Workspace

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/earnings.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-earnings`)
- **Documentation**: `docs/pc_docs/21_SCREEN_EARNINGS_LEDGER_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, 2-column analysis layout)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Financial Hero Card, Emerald `#16A34A` Settled / Net Vendor Share, Amber `#D97706` Pending Payouts, Red `#DC2626` Fees / Negative Adjustments.

---

## 🎯 Purpose & Merchant Financial Console System
An authoritative merchant financial revenue ledger for beauty retailers operating on GlowVAI. Answers "How much did I earn, and why?" immediately without manual calculations or complex accounting jargon. Enforces backend-authoritative math (88% Net Merchant Payout / 12% GlowVAI Platform Fee), RBI T+1 IMPS settlement tracking, GST tax statement exports, and financial privacy masking.

---

## 🎨 Key Features & UI Components

1. **Header & Navigation Bar**:
   - Breadcrumbs: `Finance / Earnings`
   - Page Title: "Earnings" with `🟢 Backend-Authoritative Finance` badge.
   - Controls: Date-range selector (`This Week`, `This Month`, `Custom Range`), Comparison control (`vs. Prev Period`), Privacy Masking button (`🙈 Mask / 👁️ Show`), Export button (`📥 Export CSV / PDF`).
   - Desktop Navigation Rail with `💳 Earnings` item active.

2. **Wide Financial Hero Card ("Your net earnings")**:
   - Hero net earnings figure: `₹1,42,850.00` (88% Merchant Share).
   - Period comparison badge: `▲ +14.2% vs prev period`.
   - Date range label: `01 Sep – 30 Sep 2026 • Backend-Authoritative Math`.
   - Balance Strip: Pending Payout (`₹12,450.00` - Amber), Settled Payout (`₹1,30,400.00` - Emerald), Next Settlement Date (`Tomorrow, Oct 8 at 06:00 AM`).

3. **Compact 5-Metric Strip**:
   - **Gross Sales**: `₹1,62,330.00` (100% Customer Paid)
   - **Platform Fee**: `−₹19,480.00` (12% Commission - Red)
   - **Pending Payout**: `₹12,450.00` (Awaiting Settlement - Amber)
   - **Settled Payout**: `₹1,30,400.00` (Credited via IMPS - Emerald)
   - **Total Orders**: `184 orders` (Verified Orders)

4. **Two-Column Financial Analysis Area**:
   - **Left Column ("Revenue Breakdown & Fee Split")**:
     - Labeled split progress bar: Vendor Net Share (88%) vs GlowVAI Platform Fee (12%).
     - Currency split: Vendor Share `₹1,42,850` (88%) | Platform Fee `₹19,480` (12%).
     - Action: `View Fee Details →` button opening a drawer modal displaying Gross Sales, 12% Platform Fee, 18% GST on fee (`−₹3,506`), Customer Refunds (`−₹1,494`), and Final Net Vendor Payout in plain language.
   - **Right Column ("Payout Status & Settlements")**:
     - Pending bank settlement (`₹12,450.00`) vs Settled to HDFC Bank (`₹1,30,400.00`).
     - Schedule: `Next Payout Schedule: Tomorrow, Oct 8 (06:00 AM)`.
     - Action: `View UTRs →` button.

5. **Chart / Table Workspace**:
   - View Switcher: `📊 Chart View` vs `📋 Ledger Table`.
   - Metric Selectors: `Net Earnings`, `Gross Sales`, `Order Count`.
   - Ledger Table Columns: Date & Time, Order ID, Customer Name, Gross Sales, Platform Fee (12%), Refund/Adjustment, Net Payout (88%), and Payout Status.
   - Negative entries (Platform Fee, Refunds) formatted with a minus sign and red text (`−₹174.00`).

6. **Comprehensive System Edge States**:
   - Loading Skeletons for financial cards.
   - Offline Mode Banner (`⚡ Offline Mode — Displaying cached financial ledger data`).
   - Stale Finance Sync Banner (`⚠️ Finance sync delayed — figures cached 15 mins ago`).
   - Failed Fetch Error Card with retry sync action.
   - Tax Report Export Modal & Failure Notice.
   - Sensitive Financial Privacy Masking (`🙈 Mask` masks currency values with `••••••` for screen sharing / public background view).
