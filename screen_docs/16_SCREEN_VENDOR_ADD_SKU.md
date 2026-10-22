# 📱 Screen Documentation: Add SKU & AI Recommended Inventory Screens

## 📍 File & Component Location
- **Add SKU Form**: `mobile/app/(vendor)/add-sku.tsx` (`/(vendor)/add-sku`)
- **Recommended SKUs Screen**: `mobile/app/(vendor)/recommended-skus.tsx` (`/(vendor)/recommended-skus`)

---

## 🎯 Purpose & Behavior

### Add SKU Screen (`add-sku.tsx`)
- Form to onboard new cosmetics or grocery items into the store inventory.
- Fields: Product Title, Category, SKU Code, MRP, Selling Price, Initial Stock Quantity, Warehouse Bin (`BIN-A-01-02-01`), GST %, and Image URL.
- On submit: Calls `POST /api/inventory` and syncs with Firebase RTDB.

### Recommended SKUs Screen (`recommended-skus.tsx`)
- Displays AI-recommended fast-moving beauty & skincare SKUs based on regional Vijayawada demand data.
- 1-Tap **"Add to My Dark Store"** button pre-populates item catalog.
