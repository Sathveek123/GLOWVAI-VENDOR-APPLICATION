# 💻 PC / Web Screen 18: Customer Returns & Inspection Workspace

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/returns.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-returns`)
- **Documentation**: `docs/pc_docs/18_SCREEN_CUSTOMER_RETURNS_INSPECTION_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, Split-Layout Inspection Modal)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary CTA, Amber `#D97706` Pending Inspection/SLA Risk, Emerald `#16A34A` Resolved States, Red `#DC2626` Rejection / Escalation.

---

## 🎯 Purpose & Merchant Inspection System
The GlowVAI Vendor desktop Customer Returns and Inspection workspace provides beauty retailers with an evidence-grounded, privacy-safe, policy-aligned interface for evaluating customer return and refund requests. It balances operational speed with empathy, policy clarity, and fraud protection.

---

## 🎨 Key Features & UI Components

1. **Header & Summary Metrics Strip**:
   - Breadcrumbs: `Orders / Customer Returns & Inspection`
   - Page Title: "Customer Returns & Inspection" with `🛡️ Privacy-Safe Customer Identity` pill.
   - Clickable 4-card summary strip:
     1. **Open Claims**: Total pending claim count.
     2. **Awaiting Review**: Pending merchant review.
     3. **Escalated**: Sent to GlowVAI platform audit.
     4. **Resolved**: Refund issued or claim closed.

2. **Toolbar & Filter Bar**:
   - Search input for Order ID (`#GV-9908`), Return ID (`#RET-9908-1`), Customer Name, or Product SKU.
   - Filter chips: `All`, `Damaged`, `Incorrect Item`, `Leaking Seal`, `Expired Item`, `Customer Changed Mind`.

3. **Desktop Returns Table Matrix**:
   - Columns: Order ID, Privacy-Safe Customer Name & Area (e.g. `Priya S. • Benz Circle`), Product Item & Brand, Claim Reason, Refund Amount Requested, Request Age & SLA Countdown (`⏱️ 1h SLA Urgent`), Status Pill, and Action (`Open Inspection →`).
   - Privacy Rule: Customer phone number and full street address are **NEVER** displayed.
   - SLA Risk: Highlighted with text warnings and urgency icons (`⏱️ SLA Risk Warning: Policy response required within 2h`).

4. **Split-Layout Inspection Workspace**:
   - **Left Column (Unboxing Photo Viewer)**:
     - High-resolution unboxing image display with zoom (`1.5x`) and 90° rotation controls.
     - Photo counter (`Photo 1 of 2`) and thumbnail gallery switcher.
     - Customer written claim statement and reason badge.
   - **Right Column (Policy Guidance & Checklist)**:
     - GlowVAI Beauty Return Policy guidance summary card.
     - Structured evidence checklist:
       1. *Seal Condition* (Broken / Intact)
       2. *Product Authenticity* (Verified SKU)
       3. *Expiry Status* (Valid Expiry / Expired)
       4. *Damage Type* (Leaking / Transit Damage / None)
       5. *Packaging Included* (Yes / No)
     - Internal Notes Field clearly labeled `🔒 Visible to GlowVAI support only`.

5. **Sticky Decision Action Footer**:
   - Primary Recommended CTA: `Recommend Full Refund (₹549) →` (Royal Blue `#1D4ED8`).
   - Danger Action: `Reject / Escalate Claim` (Red `#DC2626`).

6. **Confirmation Summary Modal**:
   - Summary view before final submission showing Decision Type, Refund Amount, Reason, Evidence Reviewed, and GlowVAI Support Final Decision status.

7. **System Edge States**:
   - Missing photos state (`📷 No unboxing photo uploaded`), unreadable evidence flag, duplicate claim warning, offline mode banner (`📶 Offline Mode — Return inspection decisions queued locally`), SLA urgent timer, and permission boundary checks.
