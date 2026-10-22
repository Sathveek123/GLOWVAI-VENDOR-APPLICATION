# 📱 Mobile Screen 09: Store Command Center

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/home.tsx`
- **Route URL**: `/(vendor)/home`
- **Access Level**: Authenticated Active Merchant

---

## 🎯 Purpose & Business Logic
The operational home dashboard for store owners managing live order fulfillment. Features the primary **Store Duty Switch** (`Store Open / Store Paused`), 4 standardized real-time performance metric cards (**New Orders**, **Active Orders**, **Delivered**, **Earnings**), and live incoming order offer listener.

---

## 🎨 Visual Design & UI System
- **Duty Header Bar**: Store name (`Sri Lakshmi Beauty Store`), locality, connection status dot, and prominent Store Duty Switch.
- **4 Metric Cards**: Elevated white cards featuring **New**, **Active**, **Delivered**, and **Earnings** with Royal Blue (`#1D4ED8`) primary accents. Emerald green (`#16A34A`) is strictly reserved for live operational status badges (`🟢 STORE OPEN`).
- **Quick Action Bar**: Shortcuts for Catalog, Expiry Batch Lot Tracker, Payouts, and Support.
- **Live Order Feed**: Real-time order list with stage pills (`PREPARING`, `PACKED`, `READY_FOR_PICKUP`).

---

## ⚡ Key Features & Data Flow
- **Store Duty Switch**: Invokes `setOnlineStatus(boolean)` to start/pause order dispatch.
- **Socket / Firebase Listener**: Subscribes to incoming order broadcasts.
- **Order Offer Trigger**: Spawns Screen 10 (`IncomingOrderModal`) when a new order arrives.

---

## ♿ Edge & Lifecycle States
- **Store Paused**: Displays notification banner `"Store duty is paused. Customers cannot place new orders."`
- **Offline Disconnect**: Shows amber warning banner `"Reconnecting to GlowVAI merchant service..."`
