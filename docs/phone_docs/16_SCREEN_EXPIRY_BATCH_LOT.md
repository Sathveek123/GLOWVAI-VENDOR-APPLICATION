# 📱 Mobile Screen 16: Expiry & Batch Lot Tracker (FEFO Operations)

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/expiry.tsx`
- **Route URL**: `/(vendor)/expiry`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
FEFO — First Expiry, First Out — cosmetics batch management hub. Helps store owners track cosmetics expiration dates, identify near-expiry batches (within 30/60/90 days), prevent expired skincare items from being dispatched, and execute clearance markdown actions.

---

## 🎨 Visual Design & UI System
- **Alert Banner**: High-priority calm attention banner `"6 batches need attention within 30 days — Review expiring stock"`.
- **FEFO Sort Indicator**: Clear visual tag `⬇️ Sorted by earliest expiry (FEFO Rule)`.
- **Expiry Risk Filter Chips**: `All Batches`, `Critical (<30 Days)`, `Near Expiry (30-60 Days)`, `Healthy (>90 Days)`.
- **Batch Cards**: Product thumbnail, batch lot code (`LOT-2026-MAY-01`), warehouse bin location (`Shelf B-02-04`), remaining shelf life pill (`18 Days Left`), unit quantity, clearance discount trigger (`Apply 25% Clearance Markdown`), and quarantine trigger.

---

## ⚡ Key Features & Data Flow
- **FEFO Sorting Engine**: Sorts inventory items chronologically by earliest expiration date (`expiryDate`).
- **Clearance Markdown**: 1-tap discount application invoking `inventoryApi.applyClearance(sku, discountPct)`.
- **Quarantine Action**: Removes critical expired stock from active customer discovery.

---

## ♿ Edge & Lifecycle States
- **Expired Stock Warning**: Displays red critical badge `"EXPIRED — DO NOT SELL"` on items past expiry date.
- **No Expiring Stock**: Displays green healthy state `"All cosmetics batches have >90 days shelf life."`
