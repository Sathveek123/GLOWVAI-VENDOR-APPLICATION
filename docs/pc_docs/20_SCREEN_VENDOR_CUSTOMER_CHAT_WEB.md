# 💻 PC / Web Screen 20: Vendor–Customer Order Chat Workspace

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/messages.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-messages`)
- **Documentation**: `docs/pc_docs/20_SCREEN_VENDOR_CUSTOMER_CHAT_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (3-Column Layout: Conversation List, Chat Thread, Order Context)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Panels, Customer Slate Bubbles `#334155`, Royal Blue `#1D4ED8` Vendor Bubbles, Emerald `#16A34A` Status Confirmations, Amber `#D97706` System Warnings.

---

## 🎯 Purpose & Order-Scoped Privacy Architecture
The GlowVAI Vendor desktop Order Chat workspace is a privacy-first, order-scoped operational conversation interface built specifically for active quick-commerce order execution (substitutions, packing status updates, and seal confirmation). It prohibits general social messaging, historical data leakage across unrelated orders, or contact detail exposure.

---

## 🎨 Key Features & 3-Column UI Composition

1. **Header & Navigation**:
   - Breadcrumbs: `Orders / Order Chat #GV-9912`
   - Page Title: "Vendor–Customer Order Chat" with `🔒 Order-Scoped Privacy Active` badge.
   - Escalate Action: `Escalate to Support 🛡️` button.
   - Navigation Rail: Standard desktop rail with `💬 Messages` active item.

2. **Left Column (~300px) — Active Order Conversations List**:
   - Order search filter input.
   - Conversation cards displaying: Order ID (`#GV-9912`), Customer Name & Locality (`Priya S. • Benz Circle`), Last Message Preview (`"Shade 115 works for me!"`), Timestamp (`01:36 PM`), Unread Badge Chip (`1 NEW`), and Order Status Tag (`Packing`, `Handover Ready`, `Delivered`).
   - Strictly order-scoped: Selecting a conversation loads only messages bound to that order ID.

3. **Center Column (Flex 1) — Active Chat Thread Workspace**:
   - **Header & Privacy Banner**: Order ID, Customer name, Order status pill, and visible privacy banner:
     *"Order-scoped privacy is active. Phone numbers, emails, links, and UPI handles are blocked automatically."*
   - **Message Stream**:
     - *Customer Messages*: Left-aligned slate bubbles (`#334155`), customer first name, timestamp.
     - *Vendor Messages*: Right-aligned royal blue bubbles (`#1D4ED8`), white text, timestamp, delivery indicator (`✓✓`).
     - *System Messages*: Center pills (`Order #GV-9912 created at 01:30 PM`).
     - *Unread Divider Line*: Clear visual boundary for unread messages.
     - *Typing Indicator*: `Priya S. is typing…`.
     - *Structured Substitution Card*: Embedded card showing original item (`Maybelline 120 Ivory`), suggested replacement (`Maybelline 115 Light Ivory`), price diff (`₹0`), and customer approval state (`✓ Customer Approved`).
   - **Structured Quick Replies Bar**:
     1. *"Your replacement is ready for approval"*
     2. *"Your order is being packed"*
     3. *"Your order is sealed and ready for pickup"*
     4. *"Please confirm the shade substitution in your app"*
   - **Message Composer Area**:
     - Text input field with character counter (`78 / 300 characters`).
     - Send Button (Royal Blue CTA).
     - Prohibited Content Safety Guard Regex: Detects phone numbers, emails, external URLs, or UPI handles. Displays polite warning banner: *"For everyone’s safety, direct contact details (phone, email, URLs, or UPI handles) cannot be shared here."* Text is preserved so the merchant can edit.

4. **Right Column (~320px) — Order Context Panel**:
   - **Order Summary**: Order ID `#GV-9912`, Customer `Priya S. • Benz Circle Area`, Total Amount `₹1,224` (2 items).
   - **Preparation Stage**: Stage status `📦 2 of 2 Items Verified in Pouch`, Rider ETA pickup timer.
   - **Active Substitution Summary**: Original vs. Suggested variant, Customer approval status (`✓ Customer Approved`).
   - **Action**: `Open Order Details Workspace →` button navigating directly to Order Detail.

5. **Comprehensive Edge States**:
   - Typing indicator state.
   - Message status states (`sending`, `delivered`, `failed` with tap-to-retry button).
   - Customer offline banner (`📶 Customer is offline. Messages queued via Push Notification`).
   - Chat expired banner (`🔒 Chat archived — Order delivered`).
   - Order cancelled banner (`⛔ Chat disabled — Order cancelled by customer`).
   - Support escalation banner (`🛡️ Support audit joined chat`).
   - Blocked content safety guard state.
   - Permission denied notice (`🔒 Permission Error: Store Operator role does not have messaging privileges`).
