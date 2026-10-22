# 📱 Mobile Screen 13: Order Packing & Rider Handover

## 📍 File & Route Specification
- **File Paths**: `mobile/app/(vendor)/pack-order.tsx` & `mobile/app/(vendor)/ready-pickup.tsx`
- **Route URLs**: `/(vendor)/pack-order` & `/(vendor)/ready-pickup`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Guided packing verification and delivery rider handover flow. Vendors verify packed cosmetics items at the store, confirm packaging readiness, verify delivery rider arrival, and validate 4-digit rider handover OTP.

---

## 🎨 Visual Design & UI System
- **Progress Header**: Order ID (`#GV-9912`), stage badge `PACKING`, item verification counter (`3 of 3 verified`).
- **Packing Checklist**: Item verification rows with thumbnail, shade/size, item check status, and store shelf location reference (`Shelf A-01`).
- **Rider Card**: Assigned rider details (`Ramesh K. • AP 39 BL 4821`), rider ETA (`2 mins away`), call rider action, and 4-digit rider OTP input box.

---

## ⚡ Key Features & Data Flow
- **Barcode & Bag Seal Verification**: Simulates camera scanner and bag seal code entry.
- **4-Digit OTP Validation**: Validates 4-digit delivery rider handover OTP prior to dispatching package.
- **State Transition**: Moves order from `PACKED` to `DISPATCHED`.

---

## ♿ Edge & Lifecycle States
- **Wrong Item / Mismatch Alert**: Displays red banner `"Quantity mismatch on Maybelline Foundation."`
- **Incorrect Pickup OTP**: Displays `"Invalid pickup OTP code. Verify with delivery rider."`
