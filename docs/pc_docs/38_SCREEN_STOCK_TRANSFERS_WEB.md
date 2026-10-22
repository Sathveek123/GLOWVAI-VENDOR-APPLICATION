# PC Screen 38 — Inter-Store Stock Transfers

> **PROPOSED EXTENSION** — Requires product-owner approval prior to production release.

## 1. Overview & Purpose

The **Inter-Store Stock Transfers Workspace** (`#page-stock-transfers`) enables multi-store cosmetics and beauty dark store operators to rebalance inventory across network locations. 

It enforces:
1. **FEFO (First-Expired, First-Out) Priority Picking**: Near-expiry batches are automatically prioritized for transfer to high-velocity locations.
2. **Server-Authoritative Stock Movements**: No stock counts are updated client-side until destination store managers confirm receipt and inspect tamper seals.
3. **Discrepancy Exception Management**: Missing or damaged items during transit trigger immediate audit logs and support tickets.

---

## 2. Desktop Workspace Architecture

- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Navigation Location**: Inventory / Inter-Store Stock Transfers
- **Palette**:
  - **Royal Blue (`#1D4ED8`)**: In Transit status, transfer IDs, primary CTAs
  - **Emerald (`#16A34A`)**: Completed transfers, verified receipts
  - **Amber (`#D97706`)**: Awaiting approval, FEFO expiry warnings
  - **Red (`#DC2626`)**: Discrepancies, damaged goods, missing stock

---

## 3. Top Header & Status Summary Row

### Header Controls
- **Breadcrumbs**: `Inventory / Inter-Store Stock Transfers`
- **Page Title**: `Inter-Store Stock Transfers`
- **Proposed Extension Pill**: `PROPOSED EXTENSION — Requires PO Approval` (Amber)
- **Status Filter**: `All Statuses / In Transit / Pending Approval / Completed / Discrepancy`
- **Primary CTA**: `+ Create Transfer Request` → Opens Stock Transfer Modal

### Status Summary Pills (6 Cards)
- **Draft**: `2`
- **Awaiting Approval**: `3`
- **In Transit**: `4`
- **Partial Receipt**: `1`
- **Completed**: `28`
- **Discrepancy / Exception**: `1`

---

## 4. Transfer Manifest Table

| Transfer ID | Origin Store | Destination | Qty / SKUs | Dispatch Date | Status | Carrier / Driver | Action |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `TRF-2026-8801` | Vijayawada Main Hub | Guntur Central | 3 SKUs (150 Units) | Oct 08, 2026 | **In Transit** | Dunzo Logistics | Inspect |
| `TRF-2026-8802` | Guntur Central | Vizag Beach Road | 1 SKU (50 Units) | Oct 09, 2026 | **Awaiting Approval** | Pending Driver | Inspect |
| `TRF-2026-8803` | Vijayawada Main Hub | Vizag Beach Road | 5 SKUs (300 Units) | Oct 05, 2026 | **Completed** | Shadowfax Express | Inspect |
| `TRF-2026-8804` | Vizag Beach Road | Vijayawada Main Hub | 2 SKUs (80 Units) | Oct 07, 2026 | 🚨 **Discrepancy** | Internal Van | Inspect |

---

## 5. Guided Modals & Stepper Workflows

- **Create Transfer Request Modal** (`#modal-create-transfer`): Select origin, destination, SKU, quantity, with automated FEFO batch expiration pick notes.
- **Transfer Inspection Drawer**: Shows live route tracking, driver assignment, batch details, and tamper seal verification.

---

## 6. UX State Tester Matrix

- **Default Normal** — Complete transfer manifest list
- **In Transit Live** — Displays live route tracking banner for TRF-2026-8801
- **FEFO Batch Expiry** — Shows FEFO priority picking warning for near-expiry batch
- **Discrepancy Exception** — Highlights missing unit incident for TRF-2026-8804
- **Loading** — Server ledger sync loader
- **Stale Data Warning** — 18-minute stale telemetry warning
- **Offline Mode** — Cached offline transfer log
- **Empty Search** — Empty search query result
