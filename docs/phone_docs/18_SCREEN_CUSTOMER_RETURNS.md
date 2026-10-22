# 📱 Mobile Screen 18: Customer Returns & Photo Inspection

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/returns.tsx`
- **Route URL**: `/(vendor)/returns`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Customer return requests and return inspection queue. Enables vendors to review customer return claims (e.g. damaged bottle, broken seal, wrong shade received), inspect unboxing photo proof evidence, and execute full refund approvals or structured policy rejections.

---

## 🎨 Visual Design & UI System
- **Summary Strip**: 4 status counters (Open Requests `3`, Awaiting Review `2`, Escalated `1`, Resolved `12`).
- **Filter Chips**: Damaged Item, Leaking Seal, Wrong Shade, Expired Item, Customer Mind Change.
- **Return Request Cards**: Displays Order ID (`#GV-9908`), Privacy-safe customer name (`Kavita M.`), item details (`Maybelline Foundation Shade 120`), claim reason, customer comment, unboxing photo proof thumbnails, and primary decision CTAs.

---

## ⚡ Key Features & Data Flow
- **Photo Evidence Viewer**: Interactive modal with zoom and rotate controls to inspect customer unboxing evidence photos.
- **Structured Evidence Checklist**: Pre-decision checklist verifying tamper seal state, original packaging, and serial lot matches.
- **Decision Engine**:
  - `Approve Full Refund`: Invokes `returnsApi.approveRefund(returnId)`
  - `Reject Claim`: Opens policy rejection reason picker and escalates to Ops Tower.

---

## ♿ Edge & Lifecycle States
- **Policy Violation**: Rejects return if item is opened or past 7-day return policy window.
- **Escalated Claim**: Displays red banner `"Escalated to GlowVAI Ops Tower Support for audit."`
