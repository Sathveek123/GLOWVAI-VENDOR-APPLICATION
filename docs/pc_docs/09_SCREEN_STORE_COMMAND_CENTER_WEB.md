# 💻 PC / Web Screen 09: Store Command Center (Authenticated Console)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-home`)
  - Expo Web / Mobile React Native: [`mobile/app/(vendor)/home.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28vendor%29/home.tsx)
- **Web URL**: `/vendor/home` or `index.html#home`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Authenticated GlowVAI Vendor desktop command center console for beauty store merchants managing live availability, incoming order offers, catalog inventory risk, and daily performance metrics:
- **Left Desktop Navigation Rail (Fixed 240px Sidebar)**:
  - GlowVAI brand logo badge + vendor console title.
  - Grouped navigation rail: `Home` (Active), `Orders`, `Catalog`, `Earnings`, `Settings`.
  - Lower rail section: Multi-location store selector (`📍 Benz Circle Store ▼`), Help & Support link (`Help & Support 💬`), and Account Menu profile avatar.
- **Main Widescreen Header Console**:
  - Page title: **"Store command center"**
  - Store identity subtitle: `Sri Lakshmi Beauty Store • 📍 Benz Circle, Vijayawada (09:00 AM – 10:00 PM)`
  - Live connection status badge: `🟢 WebSocket Connected` with fallback to `📡 Reconnecting`.
  - Notification bell icon with unread badge count.
  - Customer-App Storefront Preview action button ([`CustomerAppRedirectButton`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/src/components/CustomerAppRedirectButton.tsx)).
- **Dominant Operational Duty Card (Store Availability Control)**:
  - Prominent "Store open" / "Store paused" toggle card with status badge (`🟢 ONLINE & ACCEPTING ORDERS` / `🔴 STORE PAUSED`).
  - Switch toggle control.
  - Operating hours ("09:00 AM – 10:00 PM").
  - Delivery radius note: "Accepting 10-minute quick-commerce orders within your 3.5km dark store radius".
  - Confirmation modal before pausing ("Pause Store Deliveries?").
- **Hero Performance Row (4 Data Cards)**:
  - Today's Gross Sales: `₹18,450` (+12.4% vs yesterday)
  - Orders Completed: `24 Orders` (0 cancellations)
  - Net Payout: `₹16,236` (Target: 06:00 AM T+1 IMPS)
  - Active Duty Time: `9 hrs 15 mins` (Peak load active)
- **Quality & Fulfillment Performance Cards**:
  - Store Quality Score: `4.9 ★` (99.1% item accuracy)
  - Fulfillment SLA Performance: `98.2%` (Avg packing speed: 2m 14s)
- **Lower Operational 2-Column Grid**:
  - **Left Column (7/12 Width)**: Active Orders Queue featuring order ID, item count, 10-minute packing SLA timer (`⏱️ SLA Timer: Pack in 02:45`), payout total, and next action CTA (`Pack Order →`).
  - **Right Column (5/12 Width)**:
    - **Stock Attention Card**: Low-stock items list with shelf bin locations (`Shelf A-01-05`), out-of-stock count, and quick restock CTA (`+10 Restock`).
    - **Today's Activity Feed**: Real-time log of automated settlements, duty status changes, and stock updates.
- **Interactive Demo State Switcher Bar**:
  - Quick toggles to preview operational console edge cases: **Normal Console**, **First-Day Empty Dashboard**, **Store Paused**, **Offline Mode**, **API Error**, and **⚡ Test 45s Order Offer Modal**.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Navigation Rail** | Fixed 240px Left Sidebar (`#FFFFFF`) | Grouped nav items with active blue indicator (`#EFF6FF`), store selector, profile avatar |
| **Top Console Header** | White card (`#FFFFFF`) with 1px border | Page title, live WebSocket connection badge (`🟢`), notification bell, customer preview CTA |
| **Duty Card** | Emerald light background (`#F0FDF4`) when open | Status text, switch toggle, operating hours, delivery radius note, pause modal |
| **Performance Hero Grid** | 4-Column Card Grid (`#FFFFFF`) | Gross sales, completed orders, net payout, and duty time metrics |
| **Active Orders Queue** | 7/12 Left Column Card Grid | Active order ID, item count, SLA countdown timer (`⏱️ 02:45`), and `Pack Order →` button |

---

## ⚡ Web WebSocket & Real-Time Sync Rules
- Automatically registers vendor connection (`registerVendor`) on socket connect.
- Triggers audio alarm (`soundService.startRinging()`) and 45-second countdown broadcast modal upon receiving `order:incoming` socket event.
