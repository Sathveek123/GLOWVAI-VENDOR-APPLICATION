# 💻 PC / Web Screen 15: Add / Edit Product SKU & Variant Specs

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/add-sku.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-add-sku`)
- **Documentation**: `docs/pc_docs/15_SCREEN_ADD_EDIT_SKU_VARIANTS_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, 2-column layout)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary, Emerald `#16A34A` Verified, Amber `#D97706` Warning, Red `#DC2626` Validation Errors.

---

## 🎯 Purpose & Desktop Form Architecture
Dedicated desktop product-management workstation built for Indian beauty retailers to create or edit catalog SKUs with shade swatches, volume sizes, pricing breakdowns, GST tax slabs, dark store bin locations, photo dropzone, and a real-time live customer app preview.

---

## 🎨 Layout Grid & Key Sections

1. **Header & Navigation**:
   - Breadcrumbs: `Catalog / Add product SKU` (or `Catalog / Edit product SKU`)
   - Dynamic page title ("Add Product SKU & Variant Specs")
   - Draft saved pill: `💾 Draft saved 2 mins ago`
   - Back button: `‹ Back to Catalog`

2. **Left Column (760px Form Sections)**:
   - **Basic Information Card**: Product Name, Brand Name, Category (Skincare, Makeup, Hair care, Fragrance, Bath & Body, Tools), Short Description.
   - **Shade & Size Variants Card (Adaptive)**:
     - Makeup/Lipstick/Foundation: Interactive shade swatch grid (`#F5D6BA 120 Classic Ivory`, `#E4B896 220 Natural Beige`, `#B91C1C Ruby Red`), custom shade form, duplicate/remove variant buttons, active variant edit indicator.
     - Skincare/Hair care: Size / volume options (`30 ml`, `50 ml`, `100 ml`, `200 ml`, `250 ml`, `500 ml`).
   - **Pricing & Taxation Card**:
     - Selling Price (₹) & Fixed MRP (₹) inputs with validation (`Selling Price <= MRP`).
     - GST Tax Slab Selection (`5%`, `18%`, `28%`).
     - Estimated Net Bank Payout Breakdown (Flat 12% GlowVAI fee -> 88% Net Payout: `₹483.12`).
     - Backend-authoritative tax calculation disclaimer.
   - **Inventory & Dark Store Storage Card**:
     - Product SKU Code input (auto-generated or custom editable with duplicate SKU validation).
     - Initial stock quantity & Low-stock alert threshold (default 5).
     - Dark Store Shelf Bin Location (e.g. `Shelf A-01-05`).
     - Batch Lot Expiry Date reference (`2027-04-30`).

3. **Right Column (440px Media & Live Preview)**:
   - **Product Photos Dropzone Card**: Drag-and-drop upload zone, up to 3 high-res photos, primary photo badge, set primary/remove controls, upload progress bar, image scan failure retry button.
   - **Live Customer App Preview Card**: Real-time buyer view showing thumbnail, brand badge, product title, selected variant pill, selling price vs MRP, stock availability pill (`In Stock (20 units)` / `Out of Stock`), and live status chip.

4. **Sticky Bottom Action Bar**:
   - Left side: `Cancel` and `Save Draft` buttons.
   - Right side: Primary CTA `Save Product SKU →` (or `Updating SKU...`), changing to `Saving...` during API submission.

5. **Edge & System States**:
   - Interactive simulation strip for testing: Offline mode queuing, Duplicate SKU warning, API Failure timeout alert, Restored draft notice, Image scan failure.
   - Success modal overlay with summary preview and actions: `View in Catalog` and `+ Add Another SKU`.
