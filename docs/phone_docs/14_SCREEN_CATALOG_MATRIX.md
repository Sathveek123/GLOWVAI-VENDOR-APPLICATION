# 📱 Mobile Screen 14: Catalog Matrix & Live Stock Steppers

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/catalog.tsx`
- **Route URL**: `/(vendor)/catalog`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Cosmetics store inventory catalog management console. Provides search by product or SKU, category filter chips (Skincare, Makeup, Hair care, Fragrance), stock metrics summary (Total SKUs, Low Stock, Out of Stock, Inactive), live `[−] qty [+]` steppers, active/inactive duty toggles, and shortcut to add new SKUs.

---

## 🎨 Visual Design & UI System
- **Metrics Strip**: 4 tappable summary cards (Total SKUs `148`, Low Stock `6`, Out of Stock `2`, Inactive `4`) with color badges.
- **Category Filter Chips**: Horizontal scroll chips with active Royal Blue state (`#1D4ED8`).
- **Product Cards**: Product thumbnail, brand, shade/variant, MRP, selling price, shelf location tag (`Shelf A-01`), live `[−] stock [+]` stepper, and active status toggle switch.

---

## ⚡ Key Features & Data Flow
- **Live Inventory Stepper**: Optimistically updates local stock and invokes `inventoryApi.updateStock(sku, newStock)`.
- **Low Stock Highlights**: Highlights items with stock <= 5 in soft amber (`#FEF3C7`).
- **Add SKU CTA**: Navigation shortcut to Screen 15 (`/(vendor)/add-sku`).

---

## ♿ Edge & Lifecycle States
- **No Search Results**: Displays empty state `"No cosmetics match your search filter."` with a `"Clear Search"` button.
- **Offline Inventory Edit**: Queues inventory stock edits locally and syncs upon reconnection.
