# 📱 Mobile Screen 12: Order Detail & Item Substitution

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/order-detail.tsx`
- **Route URL**: `/(vendor)/order-detail`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Order item picking checklist and customer substitution proposal screen. Store staff pick items by shelf location (`Shelf A-01-05`), mark items as picked, or suggest alternative shade/variant replacements when an item is out of stock.

---

## 🎨 Visual Design & UI System
- **Customer Summary Card**: Privacy-safe customer summary (`Priya S. • Benz Circle`), delivery ETA, order age.
- **Item Checklist Rows**: Each row displays product thumbnail, brand & product name, selected shade/volume (`Shade 120 Classic Ivory`), quantity, price, shelf location chip (`Shelf A-01-05`), and large accessible checkbox.
- **Substitution Proposal Card**: Highlights original SKU vs proposed replacement SKU, price difference (`₹0 diff`), and approval state (`Awaiting Customer Approval`).

---

## ⚡ Key Features & Data Flow
- **Interactive Checklist**: Toggling item picked status updates store progress (`3 of 4 items picked`).
- **Substitution Engine**: Opens product picker modal to select matching shade/size alternative.
- **Chat Trigger**: Direct shortcut to open Screen 20 order chat thread.

---

## ♿ Edge & Lifecycle States
- **Customer Rejected Substitution**: Displays warning card `"Customer rejected replacement proposal"` with option to cancel item or update pick list.
- **All Items Picked**: Unlocks `"Proceed to Packing (Screen 13)"` CTA.
