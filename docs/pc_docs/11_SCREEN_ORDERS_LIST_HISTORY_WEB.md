# 💻 PC / Web Screen 11: Orders List & History Filter (Web & React Native)

## 📍 File & Web Route Specification
- **Mobile / Desktop Component**: `mobile/app/(vendor)/orders.tsx` (1440×1024 Desktop Queue Workspace with Navigation Rail & Quick Preview Drawer)
- **Standalone Web Component**: `web/index.html` (`#page-orders`)
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Operations Workstation Design
High-performance desktop orders queue designed for a busy Indian beauty retailer dark store managing real-time 10-minute quick commerce order picking, packing, and dispatch alongside historical order records.

- **Persistent Navigation Rail**: Left sidebar (`navRail`) with **Orders** highlighted as active (`#1D4ED8` background, bold label, white icon).
- **1200px Main Operations Console**: Two-column layout featuring a main data queue table on the left and a quick inspection drawer on the right.
- **Color System Tokens**:
  - **Royal Blue (`#1D4ED8`)**: Active navigation, primary filters, and action buttons (`Review offer ⚡`, `Continue packing →`).
  - **Emerald (`#16A34A`)**: Ready for pickup status & handover button.
  - **Amber (`#D97706` / `#FEF3C7`)**: SLA warning timers & pending new order offers.
  - **Red (`#DC2626` / `#FEF2F2`)**: Cancelled orders and offline socket banners.

---

## 🎨 Layout & Key Component Sections

### 1. Compact Header & Operations Bar
- **Page Title**: *"Orders queue & history"* with store location context (*"Benz Circle Store, Vijayawada"*).
- **Socket Connectivity Pill**: Real-time status indicator (`🟢 WebSocket Connected` / `📡 Reconnecting`).
- **Export & Action Bar**: *"📥 Export CSV"* button for exporting historical order ledgers, notification bell with unread badge, and customer app preview action.

### 2. Desktop Toolbar & Filter Bar
- **Search Field**: Full-width text input with placeholder *"Search order ID, customer name, or SKU..."* with instant clearing affordance (`✕`).
- **Date Range Picker**: Segmented filter dropdown (`Today`, `Yesterday`, `Last 7 Days`, `This Month`).
- **Sort Dropdown Selector**: Sort orders by `SLA Urgency`, `Newest First`, or `Highest Payout`.
- **Manual Refresh Button**: `🔄 Refresh` button with spin feedback.

### 3. Accessible Segmented Status Tabs
Horizontal pill bar with live count badges for each operational state:
1. `📋 All Orders` (Total count)
2. `⚡ New Offers` (PENDING - Amber badge)
3. `📦 In Packing` (ACCEPTED / PREPARING - Blue badge)
4. `🛵 Ready Pickup` (PACKED / DISPATCHED - Emerald badge)
5. `✓ Completed` (DELIVERED - Muted badge)
6. `✕ Cancelled` (CANCELLED - Red badge)

### 4. High-Density Desktop Data Queue
Table / Card rows featuring:
- **Order ID**: e.g., `#GV-9921`
- **Privacy Guard Customer Info**: `Priya S. • 📍 Benz Circle` (Customer phone numbers & exact unit numbers are masked for security).
- **Item Count & Preview**: Total SKU count badge + inline product title snippet (*"Minimalist Serum, Cetaphil Cleanser"*).
- **SLA & Status Indicator**: `⏱️ SLA: 04:15 remaining` amber timer badge or `🛵 Ready Pickup` pill.
- **Net Payout**: Prominent callout of vendor net payout after platform fees (e.g., **₹1,054.24**).
- **Contextual Next Action Column**:
  - `New Offers` -> `Review offer ⚡`
  - `In Packing` -> `Continue packing →`
  - `Ready Pickup` -> `View pickup →`
  - `Completed/Cancelled` -> `Inspect details`

### 5. Right-Side Desktop Quick Inspection Drawer
Clicking any order row slides open (or expands) a right-side 360px inspection drawer containing:
- Order creation timestamp and SLA countdown.
- Customer privacy card with area locality map preview.
- Detailed ordered items table with SKU names, quantity, line prices, and dark store warehouse bin coordinates (e.g. `Shelf A-01-05`).
- Payment breakdown: Subtotal, 12% Platform Fee deduction, and Net Vendor Payout (88%).
- Direct quick CTA button to open fulfillment workspace.

---

## ⚡ Complete Edge States & Handling Matrix

| Edge State Scenario | Detection / Signal | UI Reaction & Operational Behavior |
| :--- | :--- | :--- |
| **No Orders Available** | `orders.length === 0` | Displays empty queue graphic with clear instructions (*"Incoming 10-minute delivery orders will appear here automatically."*). |
| **Search Filter Empty** | `filteredOrders.length === 0` | Displays *"No orders matching 'XYZ'"* with a prominent `"Clear Search Filters"` button. |
| **Socket Disconnection** | `socket.on('disconnect')` | Amber warning banner: *"📡 Socket connection offline. Re-establishing live order feed..."* |
| **Cancelled Orders** | Order `status === 'CANCELLED'` | Red tint card with customer cancellation reason (*"Customer requested cancellation before dispatch"*). |
| **CSV Export Flow** | Export action clicked | Triggers background generator and alerts *"Exported X order ledger records to GlowVAI_Orders_Today.csv"*. |

---

## 🔒 Shared Desktop UX Rules Compliance
- **Authenticated Navigation Rail**: Persistent left rail with Orders active.
- **Privacy Guard**: Strict masking of customer phone numbers and full street addresses.
- **Accessible Indicators**: Statuses are distinguished using colors, text labels, count badges, and dedicated icons.
