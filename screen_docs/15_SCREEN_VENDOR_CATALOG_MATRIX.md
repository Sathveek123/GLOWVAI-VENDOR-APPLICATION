# 📱 Screen Documentation: Real-Time Catalog Matrix & Live Stock Steppers

## 📍 File & Component Location
- **File Path**: `mobile/app/(vendor)/catalog.tsx`
- **Route URL**: `/(vendor)/catalog`

---

## 🎯 Screen Purpose & Behavior
Allows store operators to search SKUs, filter by beauty/grocery categories, edit selling prices, toggle availability, and adjust stock levels using direct `[−]` and `[+]` live stock steppers with instant server sync.

---

## 🎨 Controls & Visual Tokens
1. **Search Bar**: Instant client-side text filter by product name, brand, or SKU.
2. **Category Filter Scrollbar**: All, Serums, Face Wash, Sunscreen, Groceries.
3. **Product Item Card**:
   - Product Image thumbnail.
   - Product Name, Brand, SKU, Bin coordinate (`BIN-A-01-02-01`).
   - MRP & Selling Price.
   - **Live Stock Steppers**:
     - `[−]` Button: Decrements stock on hand by 1 (`PATCH /api/inventory/:id/stock`).
     - `[+]` Button: Increments stock on hand by 1.
   - Availability Switch: `In Stock` / `Out of Stock`.
   - Low Stock Alert Badge (highlighted in amber when stock < 5).
