# 📱 Mobile Screen 22: Weekly Bank Settlement & UTR Receipts

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/payout-detail.tsx`
- **Route URL**: `/(vendor)/payout-detail`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Bank settlement reconciliation console for tracking T+1 IMPS payout cycles, UTR reference numbers, and bank transfer statuses (Paid, Processing, Failed, On Hold). Provides 1-tap UTR copy chips and itemized tax invoice sheets.

---

## 🎨 Visual Design & UI System
- **Header**: Title `"Settlements & UTR"`, context `Bank Reconciliation • GlowVAI Financial Tower`, and `📥 Receipts` PDF export button.
- **Next Payout Hero Card**: Royal Blue card displaying expected amount (`₹12,850`), `PROCESSING ⌛` status pill, scheduled timing (`Tomorrow 06:00 AM`), masked destination (`HDFC Bank ••••4589`), and timing adjustment helper note.
- **Settlement List Rows**: Displays cycle name (`Week 40`), date range, order count, payout amount, status badge, and **Monospace UTR Chip** (`UTR-4021-8856-3321`) with 1-tap copy action.
- **Itemized Tax Invoice Modal**: Tapping `Inspect →` opens detailed invoice sheet (Gross Sales, 12% Fee, 18% GST on Fee, 1% TCS, 1% TDS, Refunds, Net Payout Credited).

---

## ⚡ Key Features & Data Flow
- **1-Tap UTR Copy**: Copies UTR reference number to clipboard and triggers `Copied to clipboard!` toast feedback.
- **Actionable Failed Transfer**: Displays failure reason (e.g. `IFSC branch code mismatch`) with `Contact Ops Support →` ticket creation flow.
- **A4 PDF Export**: Generates printable settlement receipt for accounting audit.

---

## ♿ Edge & Lifecycle States
- **Missing UTR**: Displays amber notice `"⚠️ UTR Pending Generation"`.
- **Permission Denied**: Renders banner `"🔒 Permission Denied — Only Store Owners can view UTR details."`
