# PC Screen 32 — Promotions & Campaign Management

## 1. Overview & Purpose
The **Promotions & Campaign Management Workspace** (`/promotions`) enables store owners and managers to create, schedule, monitor, and pause customer-facing product discounts, expiry clearance sales, and promotional offers. It features a step-by-step creation wizard with live customer app card previews, policy enforcement safeguards, and authoritative pricing controls.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout & Palette
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`) with 16px card radius, subtle borders (`#E2E8F0`), and light drop shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left rail with **Catalog** / **Promotions** active.

### Top Header & Filter Strip
- **Breadcrumbs**: `Catalog / Promotions`
- **Page Title**: `Promotions & Campaign Hub`
- **Store Identifier**: `🏷️ Sri Lakshmi Beauty Store`
- **Primary CTA**: `+ Create promotion` (Royal Blue `#1D4ED8`).

---

## 3. 5-Card Summary Filter Strip

1. **Active Campaigns**: `3 Active` (Emerald `#15803D`). Live on customer app.
2. **Scheduled**: `1 Scheduled` (Amber `#B45309`). Starts at a future timestamp.
3. **Drafts & Pending**: `1 Pending` (Slate `#475569`). Awaiting approval or configuration.
4. **Ending Soon**: `1 Ending` (Amber `#B45309`). Expires in &lt;5 days.
5. **Discounted SKUs**: `18 SKUs` (Royal Blue `#1D4ED8`). Total tagged inventory items.

---

## 4. Campaign Directory Table Schema

| Column | Description | Styling / Component |
| :--- | :--- | :--- |
| **Campaign & Type** | Title, Offer Type, Campaign ID | Font 14px bold, Royal Blue type badge |
| **Discount Value** | Discount %, flat amount, or BOGO | Emerald bold font (`20% OFF`, `₹150 OFF`) |
| **Scope & Funding** | Number of tagged SKUs & funding split | Merchant Funded (100%) vs Platform Co-funded |
| **Schedule Duration**| Start date & end date | Font 12px bold with sub-caption |
| **Redemptions** | Total times offer was applied | Customer order redemption counter |
| **Status Pill** | Live state badge | `Active`, `Scheduled`, `Draft`, `Paused`, `Expired`, `Rejected` |
| **Actions** | Quick toggle controls | `Pause` (Amber), `Resume` (Emerald), `Edit` |

---

## 5. Campaign Creation Wizard (3-Step Flow)

### Step 1: Campaign Basics
- Inputs: Campaign Name, Campaign Objective, Promotion Type (`Percentage Discount`, `Flat Discount`, `Bundle Offer`, `Expiry Clearance`).

### Step 2: Pricing & Conditions
- Inputs: Discount Value (`%` or `₹`), Minimum Order Value (₹), Per-Customer Redemption Limit.

### Step 3: Live Customer Preview & Submit
- **Live Customer App Card**: Shows product image, title, original price (`₹549`), discounted price (`₹439`), discount badge (`-20% OFF`), expiry date, and campaign label.
- **Authoritative Pricing Audit Notice**: Explains that customer catalog prices update immediately upon activation while existing active prep orders retain agreed pricing.

---

## 6. Policy Validation & Operational Safeguards
- **Margin Floor Check**: Prevents setting discounts that breach minimum gross margin rules (&lt;10% margin).
- **Overlapping Campaign Warning**: Alerts merchant if selected SKUs are already part of an active flash sale.
- **Active Order Preservation**: Pausing or editing a campaign does not alter the price of orders already accepted by the store.
- **Audit Trail**: Records author, approval timestamp, pause/resume history, and funding source.
