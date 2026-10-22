# 📱 Mobile Screen 11: Orders Queue & History

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/orders.tsx`
- **Route URL**: `/(vendor)/orders`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
High-density order queue for managing live fulfillment pipeline and historical orders. Supports 4 standard order status tabs (**Pending**, **Active**, **Delivered**, **Cancelled**), SLA countdown timer badges, search by Order ID or customer locality, and quick action buttons.

---

## 🎨 Visual Design & UI System
- **Filter Tabs Bar**: High-contrast pills (**Pending**, **Active**, **Delivered**, **Cancelled**) with strong active selection state in Royal Blue (`#1D4ED8`).
- **Order Queue Cards**: White elevated cards (`#FFFFFF`) with 16px radii. Displays Order ID (`#GV-9912`), Privacy-safe customer name (`Priya S. • Benz Circle`), item count, relative time (`12 mins ago`), SLA countdown pill (`4m left`), payout amount, and primary action button.

---

## ⚡ Key Features & Data Flow
- **Privacy Masking**: Masks full phone numbers and complete delivery addresses (`Priya S. • Benz Circle (Privacy Safe)`).
- **SLA Countdown Timer**: Visual amber SLA alert when order prep time exceeds 10 minutes.
- **Search & Filter**: Real-time filter by order ID, stage, or date.

---

## ♿ Edge & Lifecycle States
- **Empty Order Queue**: Displays custom empty state `"No active orders in this stage."` with a `"Refresh Queue"` action.
- **Offline Mode**: Displays cached order queue and disables stage transition CTAs.
