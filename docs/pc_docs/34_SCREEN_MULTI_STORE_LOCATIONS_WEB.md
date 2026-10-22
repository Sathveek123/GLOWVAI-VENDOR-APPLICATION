# PC Screen 34 — Multi-Store & Location Management

## 1. Overview & Purpose
The **Multi-Store & Location Management Workspace** (`/multi-store`) enables beauty retail chains, quick commerce dark store networks, and multi-location boutique vendors (`Sri Lakshmi Beauty Brands Pvt Ltd`) to monitor, configure, and expand their retail footprint while maintaining strict store-level permissions, inventory boundaries, order separation, and payout visibility.

---

## 2. Global Application Header Bar & Location Context Guard

### Global Application Header Bar
- **Organization Name**: `Sri Lakshmi Beauty Brands Pvt Ltd` (Brand Admin Master Account)
- **Current User Role**: `👑 Brand Admin` (Full network visibility) vs `🏬 Store Manager View` (Scoped to assigned store context only)
- **Global Connection Status**: `🌐 Network Sync: Connected` (Socket.IO telemetry active)
- **Active Store Selector Dropdown**: `📍 Benz Circle Dark Store (DS-VIJ-01)`
  - *Active Location Boundary Guard*: Clearly communicates the active store context throughout the application so actions (catalog pricing, stock updates, order dispatch) cannot accidentally affect another location.

---

## 3. Top Header & 5 Summary Metric Cards

### Top Header Bar
- **Breadcrumbs**: `Store / Locations`
- **Page Title**: `Locations & Network Hub`
- **Health Badge**: `4/5 Locations Active`
- **Primary CTA**: `+ Add Location` (Triggers 7-step onboarding wizard).

### 5 Summary Metric Cards
1. **Total Network Sales**: `₹1,42,850.00` (Emerald `#16A34A`). Aggregated real-time receipts across all live stores.
2. **Active Locations**: `4 Active / 1 Setup` (Royal Blue `#1D4ED8`). Count of live vs. pending store locations.
3. **Avg Fulfillment SLA**: `98.4%` (Emerald `#16A34A`). Average order preparation SLA compliance (&lt;3 mins prep).
4. **Cross-Store Low-Stock**: `10 SKUs` (Amber `#D97706`). Cumulative restock alerts across all location shelves.
5. **Assigned Fleet**: `18 Riders` (Slate `#0F172A`). Quick commerce courier fleet assigned across stores.

---

## 4. Multi-Store Cards Grid & Filter Status Strip

### Filter Status Chips
- `All Locations`, `Active`, `Paused`, `Pending Approval`, `Needs Attention`, `Closed`.

### Location Card Data Schema

| Element | Description | Styling / Component |
| :--- | :--- | :--- |
| **Store Code & Type** | Code & format | Royal Blue text (`DS-VIJ-01`), Type badge (`Dark Store`, `Boutique`, `Regional Hub`) |
| **Store Name & Context**| Location name & context indicator | Font 15px bold (`Benz Circle Dark Store`), `ACTIVE CONTEXT` badge |
| **Locality & Hours** | City, locality, operating hours | Font 11px slate text (`Benz Circle, Vijayawada • 06:00 AM – 11:30 PM`) |
| **Manager & Rating** | Manager contact & rating | Font 11px text (`Sathvik V. • Rating: 4.96★ • Sync: 2 mins ago`) |
| **4 Performance Grid** | Active Orders, Low Stock, SLA Health, Today Sales | 4-column light container (`#F8FAFC`) |
| **Actions Footer** | Context switch, settings, duty toggle | `Switch Active View`, `Manage Settings`, `Pause` / `Resume` |

---

## 5. 7-Step "Add Location" Onboarding Flow

1. **Step 1: Store Identity**: Store Name, Store Code (`DS-VIJ-04`), Location Type (`Dark Store`, `Boutique Counter`, `Regional Hub`).
2. **Step 2: Address & GPS Pinning**: Locality, Street Address, GPS Geofence coordinates.
3. **Step 3: Operating Hours & Auto-Rules**: Daily open/close schedules, auto-pause rules during extreme load.
4. **Step 4: Service Area & Delivery Radius**: Geofenced delivery radius in km (default `5.0 km`).
5. **Step 5: KYC & Documents**: Trade License, CDSCO cosmetics storage permit (showing what data can be copied vs what requires independent verification).
6. **Step 6: Bank & Payout Policy**:
   - `Unified Organization Settlement` (All receipts settle directly to central HDFC Bank account).
   - `Independent Store Bank Account` (Requires separate branch bank verification & GSTIN).
7. **Step 7: Final Review & Onboard**: Confirmation & initial catalog seed from primary hub.

---

## 6. Location Detail Modal Drawer & Seed Catalog Helper

### 7 Inspector Tabs
- `Overview`: General profile, manager contact, geofence radius.
- `Orders`: Live active order queue & fulfillment metrics.
- `Catalog`: Shared Brand Master vs. Store-Specific custom master indicator.
- `Hours`: Detailed daily operating hours & auto-pause rules.
- `Team`: Staff roster & localized permissions.
- `KYC`: License numbers & audit verification status.
- `Payout`: Bank account details, GSTIN, and settlement mode.

### Safe Bulk Actions & Seed Catalog Helper
- **Catalog Seeding**: `⚡ Seed / Refresh Catalog from Benz Circle` allows instant cloning of 450+ master beauty SKUs & wholesale prices to a new location with conflict warnings.

---

## 7. Operational Edge Cases & Policy Protection
- **Active Order Closure Protection**: Prevents turning off store duty if active prep orders exist (`🚨 Cannot close location with 14 active pending orders. Complete or dispatch queue first.`).
- **Role-Based Visibility Scoping**: Store managers only see their assigned store context; cross-store access is strictly blocked without Brand Admin authorization.
- **Stale Data Warning**: Banner alerts vendor if location telemetry lost connection for &gt;10 minutes.
