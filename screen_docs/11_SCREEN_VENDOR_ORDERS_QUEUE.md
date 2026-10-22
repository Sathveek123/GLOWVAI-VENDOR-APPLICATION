# 📱 Screen Documentation: Vendor Orders Queue & Status Tabs

## 📍 File & Component Location
- **File Path**: `mobile/app/(vendor)/orders.tsx`
- **Route URL**: `/(vendor)/orders`

---

## 🎯 Screen Purpose & Behavior
Displays all active, pending, packed, dispatched, and historical orders in a filterable tab view.

---

## 🎨 Tab Filters & Cards
1. **Status Filter Tabs**:
   - `Pending`: New incoming offers awaiting picking.
   - `Active / Packing`: Orders currently being picked inside dark store bins.
   - `Ready`: Orders packed and waiting for delivery rider.
   - `Completed`: Successfully delivered orders.
   - `Cancelled / Rejected`: Orders cancelled or timed out.
2. **Order Cards**:
   - Order ID (`#GV-9912`), Customer Name, Delivery Locality.
   - Item summary and total quantity.
   - Grand Total & Vendor Payout split.
   - Action Button: *"Start Picking"* or *"Handover to Rider"*.
