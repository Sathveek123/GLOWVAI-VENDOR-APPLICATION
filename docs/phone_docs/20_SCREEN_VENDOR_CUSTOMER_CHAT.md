# 📱 Mobile Screen 20: Vendor-Customer Order Chat

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/messages.tsx`
- **Route URL**: `/(vendor)/messages`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Privacy-first operational order chat thread for communicating with customers regarding active orders (e.g., shade substitutions, packing status, or bag seal confirmation). Features dynamic contact detail blocking, quick reply chips, structured substitution cards, and chat lifecycle expiration.

---

## 🎨 Visual Design & UI System
- **Compact Header**: Back navigation, Order ID (`#GV-9912`), privacy-safe customer name (`Priya S. • Benz Circle`), status badge `PACKING`, and Support Escalation action (`Escalate`).
- **Privacy Banner**: `🔒 Order-scoped privacy is active. Phone numbers, email addresses, links, and UPI handles are blocked automatically.`
- **Message Bubbles**: Left-aligned dark slate customer bubbles (`#F8FAFC`), right-aligned Royal Blue vendor bubbles (`#1D4ED8`) with timestamps (`01:34 PM`) and delivery ticks (`✓✓`).
- **Structured Substitution Proposal Card**: Embedded directly in the vendor bubble displaying original SKU, suggested replacement SKU, price diff (`₹0 diff`), and status (`⌛ Awaiting Customer Approval`).
- **Composer & Guard Warning**: Text composer with 300-char guidance, send control, and warning banner when prohibited text is typed: `🛑 For everyone's safety, direct contact details cannot be shared here.`

---

## ⚡ Key Features & Data Flow
- **Regex Contact Detail Guard**: Inspects composer in real time to block phone numbers (`/\d{10}/`), emails, links, and UPI handles without deleting text.
- **Quick Reply Chips**: Tappable shortcuts (`"Your replacement is ready for approval"`, `"Your order is being packed"`, `"Your order is sealed and ready for pickup"`).
- **Edge State Testing**: Supports interactive test toggles for Customer Typing, Customer Offline, Chat Expired, and Order Cancelled.

---

## ♿ Edge & Lifecycle States
- **Chat Expired (Order Completed)**: Displays `🔒 Chat closed — Order #GV-9912 delivered. Thread archived.` and disables input.
- **Customer Offline**: Displays `Priya S. is offline. Messages delivered via push notification.`
