# 💻 PC / Web Screen 14: Catalog Matrix & Live Steppers (Web)

## 📍 File & Web Route Specification
- **File Path**: `web/index.html` (View: `#page-catalog`)
- **Web URL**: `/catalog` or `index.html#catalog`
- **Target Viewports**: 1024px, 1280px, 1440px, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop inventory catalog grid. Allows store managers to view all beauty SKUs, perform inline stock adjustments (`-` / `+`), filter by category, search by SKU code, and export inventory CSV reports.

---

## 🎨 PC / Web Desktop Layout Grid
- **Toolbar Bar**: Search input, category dropdown, stock status filter (In Stock, Low Stock, Out of Stock), "+ Add SKU" button, Export CSV button.
- **DataTable Inventory Grid**: Thumbnail, Product Name, Category, SKU Code, MRP, Selling Price, Stock Stepper, Shelf Tag (`📍 A-01-05`), Active Status Switch.
- **Instant Hide Logic**: When stock hits 0, row tag updates to Out of Stock and hides SKU from customer search immediately.

---

## ⚡ Web Shortcuts & CSV Export
- `Ctrl + F` focuses search bar.
- Export CSV button generates local `.csv` file download of entire store catalog.
