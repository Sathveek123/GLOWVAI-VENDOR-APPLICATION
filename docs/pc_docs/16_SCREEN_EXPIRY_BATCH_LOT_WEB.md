# 💻 PC / Web Screen 16: Expiry & Batch Lot Tracker (FEFO Operations)

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/expiry.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-expiry`)
- **Documentation**: `docs/pc_docs/16_SCREEN_EXPIRY_BATCH_LOT_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, split desktop layout)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary, Emerald `#16A34A` Healthy, Amber `#D97706` Near-Expiry, Red `#DC2626` Critical Expiry.

---

## 🎯 Purpose & FEFO Inventory System
High-density retail compliance and inventory-control workspace built for Indian beauty retailers using First Expiry, First Out (FEFO) inventory rules. Helps store operators prevent expired skincare and cosmetics from reaching customers while enabling fast, auditable clearance actions.

---

## 🎨 Key Features & UI Components

1. **Header & Navigation**:
   - Breadcrumbs: `Catalog / Expiry & batches`
   - Page title: "Expiry & Batch Lot Tracker"
   - FEFO status badge: `🟢 Live Sync • FEFO Active`
   - Primary action: `+ Register New Batch` modal launcher.

2. **Calm Attention Banner**:
   - Spans full content width with amber styling: `"6 batches need attention within 45 days"` and direct CTA `Review Expiring Stock →`.

3. **Clickable Metrics Strip (4 Filter Cards)**:
   - **Critical (<15 days)**: 2 (Red border `#FCA5A5`)
   - **Near Expiry (<45 days)**: 4 (Amber border `#FDE68A`)
   - **Good / Healthy**: 18 (Emerald border `#BBF7D0`)
   - **Cleared Lots**: 1 (Muted slate)

4. **FEFO Rule Sorting & Toolbar**:
   - Search bar: "Search product name, lot code, or shelf location bin…"
   - Segmented Tabs: `Needs Action`, `All Batches`, `Cleared`.
   - Explicit FEFO helper label: `⬇️ Sorted by earliest expiry (FEFO Rule)`.

5. **Dense Desktop Batch Table & Actions**:
   - Columns: Product Thumbnail, Product Name, Brand, Lot Code (`LOT-MIN-991`), Shelf Location Bin (`📍 Shelf A-01-05`), Expiry Date & Days Left, Remaining vs Received Stock, Received Date, Status Pill, FEFO Actions.
   - Row Actions: `Apply 25% Discount` (clearance tag), `Move to Priority Shelf` (front staging), `Mark Cleared`.
   - Compliance security: Manager permission check on clearance & discount actions.

6. **Right Side Lot Inspection Drawer**:
   - Displays manufacturing date, expiry date, shelf bin, supplier/distributor info, initial vs current stock, and audit timestamps.

7. **"Register New Batch" Modal**:
   - Product selector, lot number, manufacturing date, expiry date, received quantity, current stock, shelf location, supplier name.
   - Validation: Expired-on-entry prevention, Mfg date must precede Expiry date, duplicate lot code detection, missing quantity validation.

8. **System Edge States**:
   - Offline mode FEFO queueing, permission denied prompt, sync failure notice, empty state for zero expiring stock, toast notification with undo action.
