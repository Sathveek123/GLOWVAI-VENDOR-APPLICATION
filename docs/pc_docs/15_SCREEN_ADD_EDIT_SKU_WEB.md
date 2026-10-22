# 💻 PC / Web Screen 15: Add / Edit SKU (Shades & Variants)

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/add-sku.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-add-sku`)
- **Documentation**: `docs/pc_docs/15_SCREEN_ADD_EDIT_SKU_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, 2-column layout)

---

## 🎯 Purpose & Desktop Interaction System
Polished merchant product-management workspace for creating or editing beauty catalog items with shade swatches, size choices, GST tax slab selection, 88% net payout breakdown, dark store shelf bin location, photo dropzone, and live customer app preview.

---

## 🎨 Key Features & UI Components
1. **Breadcrumbs & Dynamic Header**: `Catalog / Add product SKU`, page title, draft saved status pill (`💾 Draft saved 2 mins ago`), back action.
2. **Left Column (760px Form)**:
   - Basic Info (Name, Brand, Category, Short Description).
   - Category-Adaptive Variants (Makeup Shade swatches `#F5D6BA Classic Ivory`, `#B91C1C Ruby Red` or Volume/Size pills `30ml`, `50ml`).
   - Pricing & Tax (MRP, Selling Price, GST slab 5%/18%/28%, flat 12% GlowVAI fee -> 88% Net Payout estimate, backend tax disclaimer).
   - Inventory & Storage (SKU code, initial stock, low-stock threshold, shelf bin location `Shelf A-01-05`, batch lot expiry date).
3. **Right Column (440px Media & Live Preview)**:
   - Photo Dropzone (up to 3 images, primary photo tag, thumbnail reorder/remove, upload progress, image scan retry).
   - Live Customer App Preview (thumbnail, brand badge, product title, variant pill, selling price vs MRP, stock chip `In Stock (20 units)`).
4. **Sticky Bottom Action Bar**: Cancel, Save Draft, Primary CTA `Save Product SKU →`.
5. **System Edge States**: Offline mode queue, Duplicate SKU warning, API timeout alert, Restored draft notice, Image scan error, Success modal preview.
