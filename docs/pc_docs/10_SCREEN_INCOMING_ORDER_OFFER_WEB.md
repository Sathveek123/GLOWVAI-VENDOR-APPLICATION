# 💻 PC / Web Screen 10: Incoming Order Offer Modal (Web & React Native)

## 📍 File & Web Route Specification
- **Mobile / Desktop Component**: `mobile/app/(vendor)/home.tsx` (620px Elevated Modal Overlay Sheet)
- **Standalone Web Component**: `web/index.html` (`#modal-incoming-order`)
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Operational System
High-priority real-time modal overlay displayed over the Store Command Center for quick-commerce beauty order dispatch. Designed for high-speed operational decision-making by store staff, providing immediate visual, audio, and desktop notifications when a nearby order is broadcast.

- **Translucent Backdrop**: Deep navy overlay (`rgba(15, 23, 42, 0.75)`) preserving sufficient background context of active command center metrics.
- **Elevated Order Sheet**: Centered white elevated card (width: 620px, 560–680px desktop range) with strong depth shadow.
- **Color System Hierarchy**:
  - **Royal Blue (`#1D4ED8`)**: Primary "Accept order" action.
  - **Slate (`#64748B`)**: Secondary "Decline" ghost action.
  - **Amber (`#D97706` / `#FEF3C7`)**: Urgency countdown state (>10s remaining).
  - **Red (`#DC2626`)**: Critical countdown state (≤10s remaining).

---

## 🎨 Layout & Anatomy Breakdown

### 1. Modal Top Header & Real-time Countdown
- **Badge & Meta**: `⚡ New Order Offer` badge, Order ID `#GV-9912`, and `🟢 Live` WebSocket status indicator.
- **Urgency Progress Bar**: Thick horizontal animated progress fill bar calculated dynamically (`(seconds / 45) * 100%`). Switches to critical red styling when countdown drops to 10 seconds or below.
- **Broadcast Notice**: Quiet note: *"Accept within 00:38 • This offer is being sent to nearby stores in your delivery radius."*

### 2. Privacy-Safe Order Summary Box
- **Customer Identity**: *"Priya S. • 📍 Benz Circle, Vijayawada"* (Customer phone numbers & exact addresses are strictly masked for privacy).
- **Target SLA**: *"⏱️ Target Prep SLA: 3 mins packing"*.
- **Vendor Net Payout**: Prominent callout card showing **₹1,054.24** (*"88% net after platform fee"*).
- **Item Preview Table**:
  - Product icon / thumbnail
  - Full title (e.g., *"Minimalist 10% Niacinamide Serum"*)
  - SKU variants & quantity (*"30 ml • Shade 128 • Qty: 1"*)
  - Line price (*"₹549.00"*)

### 3. Audio & Notification System
- **Sound Alert**: Triggers continuous web audio chime (`soundService.startRinging()`).
- **Visual Fallback Toast**: Visible notification banner: *"🔊 Audio alert ringing • Desktop notification active"* when browser audio is muted or desktop sound is disabled.

### 4. Strong Footer Actions & Distributed Server Lock
- **Decline (Secondary Ghost Button)**: Opens a confirmation modal stating *"Decline Incoming Order Offer? Declining quick-commerce orders impacts your store's Acceptance SLA rating."*
- **Accept (Primary Royal Blue Button)**: Large 48px height button *"⚡ Accept order (₹1,054.24)"*.
- **Claim Lock State**: While server lock is acquired, displays *"Claiming order server lock..."* with an active spinner, disabling duplicate click events to prevent race conditions.

---

## ⚡ Complete Edge States & Handling Matrix

| Edge State Scenario | Detection / Signal | UI Reaction & Operational Behavior |
| :--- | :--- | :--- |
| **Expired Offer** | Countdown timer hits `0` | Sound stops automatically. Displays *"Offer Expired"* banner and safely returns to command center. |
| **Claimed by Another Vendor** | Socket receives `ORDER_CLAIMED_OTHER` | Modal changes to *"This order is no longer available"* with action *"Return to Command Center"*. |
| **Accept API Failure** | Server HTTP 500 / Network timeout | Shows inline retry banner: *"Lock acquisition failed. Re-attempting connection..."* |
| **Decline API Failure** | Server rejection | Preserves modal state with fallback message to avoid dropping offer context. |
| **Socket Disconnection** | `socket.on('disconnect')` | Connection badge turns red (*"📡 Reconnecting"*); offer timer pauses cleanly. |
| **Duplicate Event** | Same `orderId` received twice | Idempotency guard ignores duplicate offer payload. |
| **Sound Permission Denial** | Browser block on autoplay | Audio fallback toast remains active with visual blinking border. |
| **Stale Order Data** | Client clock drift | Timer re-syncs with server UTC timestamp from socket payload. |

---

## 🔒 Shared Desktop UX Rules Compliance
- **Server Authoritative**: Vendor payout (₹1,054.24) and order allocation are verified by backend distributed locks (Redis SETNX).
- **Privacy First**: Customer phone numbers and exact door addresses are masked.
- **Multi-modal Feedback**: Simultaneous visual progress bar, sound chime, and desktop notification fallback.
