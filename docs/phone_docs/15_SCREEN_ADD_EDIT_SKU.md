# 📱 Mobile Screen 15: Add / Edit SKU with Shades & Variants

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/add-sku.tsx`
- **Route URL**: `/(vendor)/add-sku`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Structured merchant form for adding new products or editing existing catalog items. Tailored specifically for beauty retail with category-adaptive fields (shade swatches for makeup, volume selectors for skincare/fragrance), batch lot numbers, FEFO expiry dates, and pricing formulas.

---

## 🎨 Visual Design & UI System
- **Form Sections**:
  1. **Basic Information**: Product name, brand name, category selector, short description.
  2. **Shades & Variants**: Dynamic shade swatches (#120 Classic Ivory, #115 Light Ivory), size/volume pills (30ml, 50ml, 100ml).
  3. **Stock & Pricing**: MRP (`₹1,450`), Selling Price (`₹1,250`), Initial Stock (`24 units`), Shelf Location (`Shelf A-01-05`), GST Tax Slab (`18%`).
  4. **Expiry & Batch**: Manufacturing batch lot number (`LOT-2026-MAY-01`), Expiration Date picker (`2027-10-31`).
- **Sticky Save Bar**: Sticky bottom save container with `"Save Product SKU"` CTA and save-draft indicator.

---

## ⚡ Key Features & Data Flow
- **Category Adaptive Fields**: Displays makeup shade swatches when "Makeup" category is picked; displays volume selectors when "Skincare" or "Fragrance" is picked.
- **Price Calculation**: Validates that Selling Price does not exceed MRP.
- **Save Handler**: Dispatches `inventoryApi.createSku()` or `inventoryApi.updateSku()`.

---

## ♿ Edge & Lifecycle States
- **Invalid Price (Selling Price > MRP)**: Renders error text `"Selling Price cannot exceed MRP."`
- **Missing Required Fields**: Highlights missing inputs in red (`#DC2626`).
