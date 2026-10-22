# 📱 Mobile App Architecture & Expo Router Navigation

## 🚀 Overview
The **GlowVAI Vendor Mobile Application** (`mobile/`) is a cross-platform React Native app powered by **Expo SDK 51**, **Expo Router** (file-based navigation), and **React Native Reanimated**.

It provides store operators and pickers with an intuitive, dark-mode glassmorphic interface tailored for fast-paced quick-commerce order picking.

---

## 🗺️ 1. File-Based Routing Map (Expo Router)

```
mobile/app/
├── _layout.tsx           # Master Root Layout & Socket Provider
├── index.tsx             # Login / Authentication Splash Screen
├── add-product.tsx       # Add New SKU Modal Screen
├── notifications.tsx     # System Alerts & Order Notification List
├── (tabs)/               # Tab Bar Navigation Group
│   ├── _layout.tsx       # Tab Bar Configuration & Icon Badges
│   ├── index.tsx         # Vendor Home Dashboard (Live Orders & Duty Toggle)
│   ├── orders.tsx        # Active & Historical Orders Queue
│   ├── inventory.tsx     # Catalog Management & Live Stock Steppers
│   ├── earnings.tsx      # Daily Payout Ledger & Revenue Analytics
│   └── profile.tsx       # Dark Store Information & KYC Status
├── order/
│   └── [id].tsx          # Itemized Order Picking & Step-by-Step Workflow
└── product/
    └── [id].tsx          # Product Detail & Stock Editing Workspace
```

---

## 🎨 2. Design System & Glassmorphism UI Tokens

The user interface uses a curated dark mode palette designed for high contrast and quick visual processing under dark store shelf lighting:

```ts
export const Theme = {
  colors: {
    background: '#0B0F19', // Deep Obsidian Night
    card: '#161C2E',       // Glass Slate
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#6366F1',    // Vibrant Indigo / Beauty Violet
    primaryGlow: 'rgba(99, 102, 241, 0.35)',
    accent: '#10B981',     // Quick-Commerce Emerald Green
    warning: '#F59E0B',    // Amber Warning / High-Priority Order
    danger: '#EF4444',     // Crimson Alert / Stock Out
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    binBadge: '#064E3B',   // Dark Green Aisle Bin Container
    binText: '#34D399',    // High-Visibility Bin Label
  }
};
```

---

## 📲 3. Detailed Screen Breakdown & Workflows

### A. Dashboard (`app/(tabs)/index.tsx`)
- **Duty Toggle**: High-visibility Online/Offline switch updating vendor availability across Redis dispatch and Firebase RTDB.
- **Metrics Summary**: Real-time counters for Pending Orders, Picked Today, On-Hand Revenue, and Active Pickers.
- **Incoming Order Popup Modal**: Full-screen modal triggered by `ORDER_OFFER` events, featuring a 45-second animated countdown progress bar, item list, distance, and payout estimate.

---

### B. Order Picking Workspace (`app/order/[id].tsx`)
- **Item Checklist**: Pickers verify items by checking off checkboxes.
- **Bin Coordinates**: Displays aisle location (`BIN-A-01-02-01`) next to each item name.
- **Lifecycle Action Buttons**:
  - `Accept Order` → `Start Picking & Pack` → `Mark Ready for Driver` → `Handover to Rider`.

---

### C. Catalog & Stock Matrix (`app/(tabs)/inventory.tsx`)
- **Category Filter Tabs**: Filter items by Serums, Face Wash, Sunscreen, Groceries, etc.
- **Live Stock Adjustment Steppers**: Quick `[−]` and `[+]` buttons to adjust physical stock directly with instantaneous server sync.
- **Low Stock Badges**: Visual indicators when stock is below `lowStockThreshold`.

---

### D. Financial Ledger (`app/(tabs)/earnings.tsx`)
- **Earnings Breakdown**: Displays Today's Payout, Weekly Earnings, and Pending Payouts.
- **Take-Rate Ledger**: Visual bar showing gross revenue minus 12% platform commission.
