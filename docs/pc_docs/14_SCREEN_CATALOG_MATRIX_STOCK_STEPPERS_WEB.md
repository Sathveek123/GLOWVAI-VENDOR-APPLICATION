# 💻 PC / Web Screen 14: Catalog Matrix & Live Stock Steppers

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/catalog.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-catalog`)
- **Documentation**: `docs/pc_docs/14_SCREEN_CATALOG_MATRIX_STOCK_STEPPERS_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (Breakpoints at 1280px, 1024px)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary, Emerald `#16A34A` Live/Healthy, Amber `#D97706` Low-Stock, Red `#DC2626` Out-of-Stock.

---

## 🎯 Purpose & Desktop Interaction System
High-density beauty inventory workstation for an Indian beauty retailer managing Skincare, Makeup, Hair care, and Fragrance products. Built for fast keyboard and click editing with prominent inline stock steppers (`−` / `+`), real-time sync feedback, bulk CSV operations, and clear zero-stock customer visibility feedback.

---

## 🎨 Key Features & UI Components

1. **Header & Sync Status**:
   - Title: "Catalog & Stock Matrix"
   - Live Sync Badge: `🟢 Live Sync • 8 SKUs`
   - Secondary Subtitle: `Real-time beauty inventory control • Store ID: DS-VIJ-01`
   - Actions: `⚡ CSV Bulk` modal launcher, `+ Add SKU` primary button, and Customer App Preview launcher.

2. **Interactive Metric Strip (5 Clickable Cards)**:
   - **Total SKUs**: 8 (All filter)
   - **Low Stock (<5)**: 3 (Amber border `#FDE68A`)
   - **Out of Stock**: 1 (Red border `#FCA5A5`)
   - **Inactive**: 1 (Muted slate)
   - **Expiring Soon**: 2 (Clicking navigates to Expiry & Batch tracker)

3. **Toolbar & Filter System**:
   - Search input: "Search product name, brand, SKU code, or shelf location…"
   - Category Pills: `All`, `Skincare`, `Makeup`, `Hair care`, `Fragrance`, `Bath & Body`, `Tools & Brushes`.
   - Responsive filter reset option for empty states.

4. **Dense Product Table & Live Stock Stepper**:
   - High information density product cards showing brand, full title, variant, shelf bin (`📍 Shelf A-01-05`), MRP, Selling Price, and 88% Net Payout calculator.
   - Prominent `−` / `+` stock stepper control with instant numeric feedback and loading indicator.
   - Zero Stock Notice: Prominent banner warning that products with 0 stock are hidden from customer search.
   - Live/Off Status Toggle Pill for manual customer visibility control.

5. **Right Side Inspection Drawer**:
   - Desktop 1024px+ side panel displaying expanded batch dates, shelf bin location, full pricing split, and direct edit link (`/add-sku?sku=...`).

6. **System Edge States**:
   - Offline Mode Banner with local queue notice.
   - Sync Conflict resolution bar.
   - Optimistic rollback on API failure with toast notifications and undo support.
