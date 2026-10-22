# 📱 Screen Documentation: Vendor Home Dashboard & Duty Toggle

## 📍 File & Component Location
- **File Path**: `mobile/app/(vendor)/home.tsx`
- **Route URL**: `/(vendor)/home`
- **Access Level**: Authenticated Vendor

---

## 🎯 Screen Purpose & Behavior
The Home Dashboard is the primary operational workspace for dark store pickers. It features an online duty toggle switch, real-time metrics cards, an active order picking list, and an incoming order popup offer modal with sound alerts and a 45-second countdown timer.

---

## 🎨 Layout & Visual Components

```
┌──────────────────────────────────────────────────────────────┐
│  🟢 ON DUTY          Sri Lakshmi Dark Store Hub              │
│  Store ID: DS-VIJ-01  •  Vijayawada                          │
├──────────────────────────────────────────────────────────────┤
│  [ ⚡ 3 Pending ]  [ 📦 428 Picked ]  [ 💰 ₹18,420 Revenue ] │
├──────────────────────────────────────────────────────────────┤
│  🚨 INCOMING ORDER OFFER MODAL (Pop-up on ORDER_OFFER)       │
│  Order #ORD-9912  •  2 Items  •  Payout: ₹480                │
│  Timer: [██████████████░░░░] 28s remaining                   │
│  [ ❌ DECLINE ]                   [ ⚡ ACCEPT ORDER ]        │
└──────────────────────────────────────────────────────────────┘
```

### 1. Header Bar & Duty Switch
- Store Name & ID (`DS-VIJ-01`).
- **Duty Switch**: `🟢 ON DUTY` / `🔴 PAUSED`. Toggling emits `vendor:setStatus` via Socket.IO and calls `PATCH /api/vendor/:id/status`.

### 2. Operational Metrics Cards
- **Pending Orders**: Orders waiting to be picked.
- **Picked Today**: Count of items dispatched.
- **On-Hand Revenue**: Cumulative revenue for today's session.

### 3. Incoming Order Offer Modal (`ORDER_OFFER`)
- Listens for WebSocket `ORDER_OFFER` event.
- Plays loud sound alert and triggers device vibration.
- Displays customer locality, item count, estimated payout, and a 45-second animated countdown timer bar.
- **Accept Button**: Emits `ACCEPT_ORDER` to trigger SETNX distributed lock.
- **Decline Button**: Emits `DECLINE_ORDER`.
- **Dismissal Listener**: Listens for `ORDER_CLAIMED_BY_OTHER` to dismiss the modal automatically if another nearby store accepts first.
