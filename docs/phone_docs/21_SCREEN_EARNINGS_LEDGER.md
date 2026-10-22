# 📱 Mobile Screen 21: Financial Revenue Ledger

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/earnings.tsx`
- **Route URL**: `/(vendor)/earnings`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Precision financial revenue ledger for store owners tracking sales, platform fee deductions (12%), pending payouts, and settled earnings without manual calculation. Enforces backend-authoritative financial math (88% vendor / 12% GlowVAI platform fee + 18% GST).

---

## 🎨 Visual Design & UI System
- **Header & Privacy Mask**: Includes header title, store context, Report export action, and **Privacy Mask Toggle (`🙈`/`👁️`)** to mask sensitive figures with `••••••` when viewing in public.
- **Royal-Blue Hero Card**: Displays backend net earnings (`₹48,420`), growth vs prev period (`+14.2%`), and backend-authoritative tag.
- **Balance Strip**: Displays **Pending Payout** (`₹12,850`), **Settled Payout** (`₹35,570`), and **Next Settlement** (`Tomorrow 06:00 AM`).
- **Platform Fee Split Bar**: Visual progress bar showing **88% Vendor Share** (`₹48,420`) and **12% GlowVAI Fee** (`₹6,602`).
- **Fee Details Bottom Sheet Modal**: Itemized breakdown showing Gross Sales (`₹55,022`), Platform Fee 12% (`-₹6,602`), GST on Fee 18% (`-₹1,188`), Refunds (`-₹480`), and Net Payout (`₹48,420`).
- **Chart vs. Table Toggle**: Switch between interactive weekly velocity chart and itemized daily order ledger table.

---

## ⚡ Key Features & Data Flow
- **Backend Authoritative Math**: Consumes `earningsApi.getSummary()` without local formula modifications.
- **Tax Statement Export**: Triggers GST tax statement PDF export sent to vendor email.
- **Ledger Itemization**: Displays order ID, status, gross sales, platform fee, and refund adjustments (`-₹350 ⚠️`).

---

## ♿ Edge & Lifecycle States
- **Loading Skeleton**: Renders animated loading skeleton.
- **Fetch Error**: Displays error card with `"Retry Sync"` action.
- **Offline Mode**: Renders amber status banner `"⚡ Offline Mode — Displaying cached financial data."`
- **Stale Data Warning**: Displays `"⚠️ Finance sync delayed — figures cached at 01:15 PM. Tap to re-sync."`
