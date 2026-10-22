# 💻 PC / Web Screen 26: Notifications & Merchant Alerts Center (Web)

## 📍 File & Web Route Specification
- **Mobile/Expo Route**: `mobile/app/(vendor)/notifications.tsx`
- **Web App View**: `web/index.html` (View: `#page-notifications`)
- **Web URL**: `/more/notifications` or `index.html#notifications`
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
The GlowVAI Vendor Notifications & Merchant Alerts Center provides a centralized, privacy-first operational hub for Indian beauty retailers to inspect urgent order offers, inventory low-stock alerts, weekly bank settlement credits, trade license compliance reminders, and system security updates without cognitive overload.

### Key Desktop Workflows:
1. **Header & Freshness Indicators**:
   - Breadcrumbs: `More / Notifications`
   - Title `"Notifications"` with `4 Unread` Royal Blue pill badge.
   - Quick action buttons for `"✓ Mark All Read"`, `"⚙️ Preferences"`, and data freshness timestamp (`Fresh as of Today 23:38`).
2. **Category Segmented Toolbar**:
   - Segmented tabs for `All`, `Orders`, `Inventory`, `Payouts`, `Compliance`, and `System`.
   - Active style: Royal blue highlight background (`#EFF6FF`), royal blue border & text.
3. **Interactive Dev Edge States Testing Toolbar**:
   - One-click testing toggles for `Loading Skeletons`, `No Notifications`, `Offline Mode`, `Push Permission Denied`, and `Expired Deep Link`.
4. **Desktop Two-Column List-Detail Grid Composition**:
   - **Left Column (Alert Feed List)**: Notification cards with category emoji icons (`🛍️`, `📦`, `💰`, `📜`, `ℹ️`), title, 1-line summary, relative timestamp (`12m ago`), unread blue dot indicator, and priority pills (`URGENT` red, `HIGH` amber, `INFO` blue).
   - **Right Column (520px Inspection Detail Drawer)**: Sticky drawer displaying category badge, full notification title, timestamp, source delivery channel (`PUSH`, `SMS`, `EMAIL`, `SYSTEM`), full message body, target reference code (`#GV-9912`, `SKU-CET-125`, `UTR-4021-8856-3321`), direct deep link CTA button (`Inspect Order Offer →`, `Restock Inventory →`, `View Settlement Receipt →`), and mandatory privacy banner.
5. **Notification Preferences Modal**:
   - Delivery channels toggle: Browser Push, SMS (+91 Mobile), Email Statements, WhatsApp Business Alerts.
   - Locked mandatory account security section (`🔒 Account security alerts like bank changes, 2FA OTPs, and device logins are mandatory and cannot be disabled`).
6. **Strict Privacy Enforcement**:
   - Customer phone numbers, street addresses, PAN, GSTIN, and full bank account numbers are strictly masked (`••••••4589`, `glow••••@hdfcbank`) in compliance with Indian IT Act rules.

---

## 🎨 Color Palette & Typography Tokens
- **Canvas Background**: Warm Off-White `#F8FAFC`
- **Section Cards**: White `#FFFFFF` with subtle shadows and `#E2E8F0` borders
- **Primary CTA & Active Tabs**: Royal Blue `#1D4ED8` / `#EFF6FF`
- **Verified / Healthy States**: Emerald Green `#16A34A` / `#F0FDF4`
- **Attention & SLA Risk States**: Amber Gold `#D97706` / `#FEF3C7`
- **Critical Incidents & Rejection**: Red `#DC2626` / `#FEF2F2`
- **Typography**: Inter font family, 8px spacing grid, 16px card radius, 10-12px control radius

---

## 🛡️ Edge States & Safety Rules
1. **Offline Mode**: Displays cached notifications with an amber warning banner indicating paused online sync.
2. **Push Permission Denied**: Shows red alert banner guiding the merchant to grant browser notification permissions.
3. **Expired Deep Link**: Displays warning modal (`⚠️ Target Workspace Link Expired`) if referenced order offers or documents are no longer active.
4. **Duplicate Event Deduplication**: Coalesces identical alert signals by reference ID within 60-second windows.
