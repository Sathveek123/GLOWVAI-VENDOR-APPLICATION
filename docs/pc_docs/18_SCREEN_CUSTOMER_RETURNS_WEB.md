# 💻 PC / Web Screen 18: Customer Return Requests & Inspection (Web)

## 📍 File & Web Route Specification
- **File Path**: `web/index.html` (View: `#page-profile`)
- **Web URL**: `/returns` or `index.html#profile`
- **Target Viewports**: 1024px, 1280px, 1440px, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop return request inspection panel. Lets merchants examine customer unboxing photos, verify return claims, and recommend refund approvals or escalations.

---

## 🎨 PC / Web Desktop Layout Grid
- **Split Workspace**:
  - *Left 7/12 Column*: Return requests table (Order ID `#GV-9908`, masked customer name, return reason, requested amount).
  - *Right 5/12 Column*: High-resolution photo preview box for customer unboxing image inspection + decision buttons (*"Recommend Refund"*, *"Escalate Dispute"*).

---

## ⚡ Web State & API Integration
- API Call: `supportApi.processReturn(returnId, decision)`.
