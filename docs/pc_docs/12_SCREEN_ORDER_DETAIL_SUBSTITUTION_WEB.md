# 💻 PC / Web Screen 12: Order Detail & Customer Substitution (Web & React Native)

## 📍 File & Web Route Specification
- **Mobile / Desktop Component**: `mobile/app/(vendor)/order-detail.tsx` (1440×1024 Desktop Picking Workstation with Navigation Rail & 2-Column Container)
- **Standalone Web Component**: `web/index.html` (`#page-order-detail`)
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Operational Workstation Design
Fulfillment picking checklist workstation for Order `#GV-9912` designed for dark store operators picking, checking, and resolving beauty product availability before packing.

- **Breadcrumbs & Header**: `Orders / Order #GV-9912`, status pill (`PREPARING`), customer-safe summary (`Priya S. • Benz Circle`), and SLA badge (`⏱️ Target SLA: 04:15 remaining`).
- **1200px Max-Width 2-Column Composition**:
  - **Left Column (7/12)**: Picking checklist table with shelf coordinates, accessible pick checkboxes, shelf search/filter, and inline out-of-stock substitution triggers.
  - **Right Column (5/12)**: Privacy guard customer card, financial summary breakdown (Subtotal, 12% Platform Commission, GST, Net Payout), support escalation, and dynamic sticky action button.

---

## 🎨 Layout & Key Component Sections

### 1. Picking Progress Header Card
- **Progress Title**: *"Picking Progress: 2 of 5 items picked (40%)"*
- **Visual Progress Bar**: Blue progress fill bar dynamically reflecting verified item checks (`(pickedCount / totalCount) * 100%`).
- **SLA Deadline Pill**: Amber indicator showing target packing SLA deadline.

### 2. Main Left Column: Items to Pick Table
- **Shelf Coordinates**: Each item clearly displays its dark store aisle location tag (e.g. `📍 Shelf A-01-05`, `📍 Shelf B-02-01`).
- **Pick Checkboxes**: Large 24px accessible touch/click target. Picked items transition to a green background (`#F0FDF4`) with checkmark (`✓`) and strikethrough text.
- **Shelf Search Filter**: Inline search box (`Filter shelf (e.g. A-01)...`) allowing instant filtering of items by shelf aisle coordinates.
- **Unavailable Action Trigger**: If an item is out of stock, operator taps `"Item unavailable"` button, opening the Substitution Drawer.

### 3. Customer Substitution & Approval System
- **Rules & Constraints**: **Strictly impossible to silently substitute an unapproved item!** Every substitution requires customer approval via the consumer app or removal from order.
- **Drawer Options**: Compatible alternatives listing variant differences, price differences (`No extra cost`, `+₹150`), and availability.
- **State Badges**:
  - **Pending Approval**: Amber banner (*"Suggested: Maybelline Fit Me (Shade 120) — Waiting for customer approval"*).
  - **Approved**: Green banner (*"✓ Customer Approved Substitution"*).
  - **Declined**: Red banner (*"✕ Customer Declined Substitution. Item removed"*).
  - **Removed**: Red banner (*"✕ Item marked unavailable and removed from order payout"*).

### 4. Main Right Column: Context & Financial Breakdown
- **Customer Privacy Card**: Displays `"Priya S. • 📍 Benz Circle Area"` (Phone numbers and exact door units are strictly hidden).
- **Financial Ledger Breakdown**:
  - Item Subtotal: **₹1,198.00**
  - Platform Commission (12%): **-₹143.76**
  - GST on Commission (18%): **-₹25.88**
  - **Vendor Net Payout**: **₹1,054.24** (*"88% net earnings auto-settled IMPS T+1 06:00 AM"*)
- **Dynamic Action Button**:
  - Displays `"Start packing order →"` when items unpicked.
  - Displays `"Continue packing →"` when picking in progress.
  - Switches to `"Resolve item issue →"` (Amber) when an item is unavailable and awaiting substitution response.

---

## ⚡ Complete Edge States & Handling Matrix

| Edge State Scenario | Detection / Signal | UI Reaction & Operational Behavior |
| :--- | :--- | :--- |
| **Unresolved Substitution** | Item marked unavailable & pending | Sticky CTA turns Amber (*"Resolve item issue →"*). Blocks packing handover until resolved or approved. |
| **Customer Declined Substitution** | Socket event `SUBSTITUTION_DECLINED` | Removes item from total payout and adjusts order line items without blocking remaining items. |
| **Stale Order Data** | Client out-of-sync with backend | Refreshes item checklist and updates picking progress dynamically. |
| **Cancelled Order** | Socket event `ORDER_CANCELLED` | Red error banner (*"Order #GV-9912 was cancelled by customer. Please return items to shelf."*). |
| **Offline Mode** | Disconnected socket | Red warning banner with retry action; preserves local picking checkbox state. |

---

## 🔒 Shared Desktop UX Rules Compliance
- **Server Authoritative**: Financial calculations (subtotal, commission, net payout) are derived from backend values.
- **Privacy Shield**: Customer phone numbers and exact door addresses are masked.
- **Clear State Distinction**: Explicit visual differentiation for Pending, Approved, Declined, and Removed substitutions.
