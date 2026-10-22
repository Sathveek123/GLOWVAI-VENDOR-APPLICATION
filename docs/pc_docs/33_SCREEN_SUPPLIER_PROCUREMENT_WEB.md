# PC Screen 33 — Supplier Procurement & Purchase Orders

## 1. Overview & Purpose
The **Supplier Procurement & Purchase Orders Workspace** (`/procurement`) empowers beauty store owners and dark store managers to maintain seamless stock availability. It combines automated replenishment recommendations (derived from sales velocity and safety thresholds), wholesale supplier management, multi-line purchase order generation, batch intake tracking, and an over-delivery safeguard workflow.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout & Palette
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`) with 14px–16px radii, subtle borders (`#E2E8F0`), and restrained shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left rail with **Catalog** / **Procurement** active.
- **Color Semantics**:
  - **Royal Blue (`#1D4ED8`)**: Primary actions, PO headers, active selections.
  - **Emerald (`#16A34A`)**: Confirmed stock delivery, fully received status, positive suggested reorder quantities.
  - **Amber (`#D97706`)**: Low-stock alerts, partially received orders, pending supplier dispatches.
  - **Red (`#DC2626`)**: Overdue deliveries, cancelled orders, rejected batch intakes.

---

## 3. Top Header & Summary Filter Strip

### Top Header Bar
- **Breadcrumbs**: `Catalog / Procurement`
- **Page Title**: `Supplier Procurement`
- **Supplier Count Badge**: `🏭 4 Active Suppliers`
- **Primary CTA**: `+ Create Purchase Order` (Royal Blue button opening PO modal).

### 4 Summary Metric Cards
1. **Low-Stock Reorders**: `3` (Amber `#D97706`). SKUs dropped below safety threshold needing replenishment.
2. **Open Purchase Orders**: `2` (Royal Blue `#1D4ED8`). Dispatched purchase orders awaiting supplier delivery.
3. **Partially Received**: `1` (Amber `#D97706`). Deliveries partially accepted at store intake.
4. **Overdue Deliveries**: `1` (Red `#DC2626`). Dispatches exceeding expected delivery date SLA.

---

## 4. Two-Column Procurement Overview Panel

### Panel 1: Recommended Replenishment (Left Grid)
- **Engine**: Consumes backend inventory safety thresholds, recent 7-day sales velocity, current shelf stock, and open PO quantities.
- **Line Items**:
  - Product title, SKU, shade/variant, supplier name.
  - Current stock count vs. minimum threshold.
  - Suggested reorder unit quantity & backend-authoritative total cost.
- **Action**: `+ Add to PO` button pre-populates purchase order draft with supplier & quantity.

### Panel 2: Purchase Order Detail Inspector (Right Drawer)
- **Header**: Active PO Number (`PO-2026-8801`), status badge, supplier name, expected delivery date, total PO value.
- **Line Items List**: Ordered quantity vs. received quantity, agreed unit cost, batch/lot number (`LOT-MAY-2026-09`), expiry date (`2028-09-30`).
- **Audit History**: Step-by-step audit log (creation, dispatch, supplier confirmation, batch intake).
- **Action**: `Record Stock Intake` button opens batch intake modal.

---

## 5. Purchase Orders Directory Table

| Column | Description | Styling |
| :--- | :--- | :--- |
| **PO Number** | Unique PO reference identifier | Font 12px bold Royal Blue (`PO-2026-8801`) |
| **Supplier** | Verified wholesale supplier & created date | Font 12px bold with date sub-caption |
| **Expected Delivery** | Agreed delivery timestamp | Font 12px slate text |
| **Units** | Received units vs. Total ordered units | Font 12px bold (`30/45 u`) |
| **Total Cost** | Backend-authoritative PO value | Font 12px bold Emerald (`₹15,750`) |
| **Status Badge** | Delivery execution status | `Draft`, `Sent`, `Confirmed`, `Partially received`, `Received`, `Overdue`, `Cancelled` |

---

## 6. Stock Delivery Intake & Batch Registration Flow

### Batch Registration Requirements
- **Lot / Batch Number**: Mandatory input for cosmetic product intake (`LOT-MAY-2026-09`).
- **Expiry Date**: Verified to ensure shelf life &gt;6 months before acceptance.
- **Quantity Confirmation**: Physical unit count input per line item.

### Safeguard: Over-Delivery Restriction
- **Quantity Cap**: Received quantity cannot exceed ordered quantity without explicit store owner override/exception workflow.
- **Discrepancy Logging**: Shortages or damages automatically generate supplier credit note flags and update ledger entries.

---

## 7. Operational Edge Cases & Policy Enforcement
- **Supplier Unavailable**: Dispatches disabled with alert banner if supplier portal is offline.
- **Price Mismatch Guard**: Prevents PO submission if wholesale cost deviates &gt;5% from registered wholesale master rate.
- **Audit Trail Integrity**: Immutable logging for PO creation, modification, dispatch, stock intake, and cancellations.
