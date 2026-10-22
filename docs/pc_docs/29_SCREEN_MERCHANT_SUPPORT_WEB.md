# PC Screen 29 — Merchant Support Center & Ticketing

## 1. Overview & Purpose
The **Merchant Support Center & Ticketing Workspace** (`/support`) provides a unified 24/7 help desk hub for store owners and operations staff. It balances rapid self-service discovery (categorized topic guides & context-aware quick actions) with a robust two-column ticketing workspace for tracking complex operational, financial, compliance, and technical issues.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout Structure
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Styling**: Pure White (`#FFFFFF`) with 16px card radius, subtle borders (`#E2E8F0`), and light drop shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left rail with **Help** / **Support** active.

### Top Header & Live Availability Status
- **Breadcrumbs**: `Help / Merchant support`
- **Page Title**: `Merchant support`
- **Sub-caption**: `24/7 assistance for store owners & staff with orders, payouts, catalog sync, and technical issues.`
- **Live Support Indicator**: `🟢 Support Desk Online (~12m avg response)`
- **Primary CTA**: `+ Contact support` (Royal Blue `#1D4ED8`).

---

## 3. Global Search & Self-Service Topics Grid

### Global Search Input
- **Placeholder**: `"Search help topics, error codes, order IDs, or settlement UTRs..."`
- Instant search filter updates topic cards and filters ticket history in real time.

### Categorized Help Topic Cards (6 Core Modules)
1. **Orders & Deliveries** (`📦`): Incoming offers, rider dispatch delays, customer cancellations & returns (Open ticket indicator badge).
2. **Payments & Settlements** (`💳`): Daily bank payouts, UTR receipt reconciliation, TCS/TDS withholdings.
3. **Catalog & Stock** (`💄`): Shade variants, barcode scanner sync, quick stock adjustments.
4. **Compliance & KYC** (`📄`): GST invoices, FSSAI/Cosmetic license updates, tax credit statements.
5. **Account Security** (`🔒`): Staff permissions, payout bank changes, 2FA setup & resets.
6. **Technical Issues** (`💻`): Thermal Bluetooth printer drivers, browser cache, offline sync bugs.

---

## 4. "Need Help Now?" Contextual Quick Action Row
High-priority operational shortcuts with prefilled context:
- `📦 Report Order Issue`: Prefills active order reference (`Order #GV-9912`).
- `💳 Payout Not Received`: Prefills settlement cycle (`Payout #SET-4912`).
- `📄 Document Upload Problem`: Prefills document reference (`Doc Ref #LIC-9982`).
- `💄 Catalog Sync Issue`: Prefills catalog batch tag (`Catalog Batch #9921`).
- `🔒 Account Security Concern`: Triggers urgent security escalation modal (`Security Audit #SEC-01`).

---

## 5. Two-Column Ticketing Workspace (Master-Detail)

### Left Column: Ticket Master List (360px Width)
- **Filter Tabs**: `All`, `Open`, `Action Req`, `Resolved`.
- **Card Elements**:
  - Ticket ID (`#TICK-8821`), Category Tag, Subject line (2-line clamp).
  - Status Badge:
    - `Open` (Soft Blue `#EFF6FF`)
    - `Waiting for you` (Amber `#FEF3C7`)
    - `In review` (Indigo `#E0E7FF`)
    - `Escalated` (Red `#FEE2E2`)
    - `Resolved` (Emerald `#DCFCE7`)
  - Last Update Timestamp (`10 mins ago`, `Yesterday 06:30 PM`).

### Right Column: Selected Ticket Inspector & Timeline Feed
- **Header**: Ticket ID, Subject, Category Tag, Reference Tag (`📌 Reference: Order #GV-9912`), Priority Badge (`🔥 URGENT`), Action toolbar (`Mark Resolved`, `Escalate`).
- **Auto Diagnostics Metadata Card**:
  - Automatically attaches non-sensitive telemetry: `Store: Sri Lakshmi Beauty (DS-VIJ-01)` • `App: Web v2.4.1` • `Network: Active` • `SLA Target: 30m`.
- **Timeline Chat Feed**:
  - Chronological message bubbles distinguishing Vendor messages (Royal Blue `#1D4ED8`) from Support Desk replies (Light Gray `#F1F5F9`) and System Events (`⚙️ Ticket assigned to GlowVAI Merchant Desk`).
- **Safe Reply Composer**:
  - Persistent **Privacy Guard Banner**: `🔒 Privacy Guard: Never enter OTPs, bank passwords, UPI PINs, or confidential customer info.`
  - Inline input box with `Send` CTA.
  - Intercepts input containing sensitive credentials (`OTP`, `password`, `PIN`, `CVV`).
- **Resolved Ticket Reopen Policy**:
  - Displays resolved banner with one-click `Reopen Ticket` action (valid for 7 days post-resolution).

---

## 6. Structured Ticket Composer Modal
- **Category Selector**: `Orders`, `Payments`, `Catalog`, `Compliance`, `Security`, `Technical`.
- **Priority Selector**: `Normal`, `High`, `Urgent Escalation`.
- **Fields**: Subject/Headline, Optional Reference ID, Detailed Description, File/Screenshot attachment.
- **Privacy & Telemetry Preview**: Explains what automated diagnostic context is attached before submission.

---

## 7. Color Palette Tokens & Typography
- **Canvas Background**: Warm Off-White `#F8FAFC`
- **Card Surfaces**: `#FFFFFF`
- **Primary Actions**: Royal Blue `#1D4ED8`
- **Resolved / Online**: Emerald `#16A34A` / `#DCFCE7`
- **Waiting / Action Required**: Amber `#D97706` / `#FEF3C7`
- **Escalated / Security Alerts**: Red `#DC2626` / `#FEE2E2`
- **Typography**: Inter font stack, 8px grid spacing, 16px card radius.
