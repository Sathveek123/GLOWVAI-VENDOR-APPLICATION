# 📱 Mobile Screen 10: Incoming Order Offer Modal

## 📍 File & Route Specification
- **File Path**: `mobile/src/components/IncomingOrderModal.tsx`
- **Route URL**: Modal Overlay inside `/(vendor)/home`
- **Access Level**: Authenticated Merchant (Active Duty)

---

## 🎯 Purpose & Business Logic
High-priority operational modal overlay that triggers when a customer places an order nearby. Displays 45-second circular countdown timer, audio chime alert, order summary (items, total payout, locality), and atomic accept lock (`SETNX` redis lock) to prevent double fulfillment.

---

## 🎨 Visual Design & UI System
- **Modal Overlay**: Plain light translucent scrim backdrop (`rgba(15, 23, 42, 0.4)`).
- **Circular Countdown Ring**: Animated SVG timer ring counting down from 45s to 0s in Royal Blue (`#1D4ED8`) turning Amber (`#D97706`) below 10s.
- **Order Card**: Displays Order ID (`#GV-9912`), Privacy-safe Customer Area (`Benz Circle`), item count (`3 items`), net payout (`₹1,276`), and full item checklist.
- **Action CTAs**: Primary Royal Blue `"Accept Order"` button (`#1D4ED8`) and `"Decline Order"` button.

---

## ⚡ Key Features & Data Flow
- **Audio Chime**: Triggers repeating order bell chime via `soundService.playIncomingChime()`.
- **Atomic Accept Lock**: Invokes `ordersApi.acceptOrder(orderId)` with optimistic UI locking.
- **Auto-Expiration**: Dismisses modal and re-routes order if timer expires (45s).

---

## ♿ Edge & Lifecycle States
- **Order Already Claimed**: Displays alert `"Order was assigned to another nearby store."`
- **Timer Expired**: Plays timeout tone and returns to home dashboard.
