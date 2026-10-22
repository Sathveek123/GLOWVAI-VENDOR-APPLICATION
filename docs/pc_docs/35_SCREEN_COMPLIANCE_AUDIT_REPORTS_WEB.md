# PC Screen 35 — Compliance & Operational Audit Reports

## 1. Overview & Purpose

The **Compliance & Operational Audit Reports Workspace** (`#page-compliance`) provides merchants and authorized support users with immutable traceability across all critical operational domains. It covers orders, inventory, batch/expiry handling, returns, payouts, KYC documents, team access, and security events — all stored with cryptographic integrity and masked to the appropriate access scope.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout & Palette
- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Active Nav**: Reports / Audit
- **Color Semantics**:
  - **Royal Blue (`#1D4ED8`)**: Primary CTAs (`Export Audit Log`, category filter, event inspect buttons)
  - **Emerald (`#16A34A`)**: Verified / compliant / success states
  - **Amber (`#D97706`)**: Pending review / action needed states
  - **Red (`#DC2626`)**: Critical security findings, expired links, destructive escalations

---

## 3. Top Header & Filter Bar

### Breadcrumbs & Title
- **Breadcrumbs**: `Reports / Audit`
- **Page Title**: `Audit reports` (H2)
- **Access Scope Pill**: `🔒 Merchant-visible activity only` (Royal Blue) — switches to `🔓 Internal Support Telemetry View` (Red) when toggled
- **Data Freshness Pill**: `⚡ Telemetry fresh as of 2 mins ago` (Emerald)
- **Scope Toggle Button**: `Switch to Support View / Switch to Merchant View`
- **Primary CTA**: `📥 Export Audit Log` → opens Export Configuration Modal

### Filter Toolbar (White card)
| Filter | Options |
|:---|:---|
| Date Range | Today / Last 7 Days (Default) / Last 30 Days / Q3 2026 / Custom |
| Location | Benz Circle Dark Store (Default) / Auto Nagar Depot / Guntur Ring Road Hub / All Network Locations |
| Report Category | All Categories (8) / Order Fulfillment / Inventory Adjustments / Batch/Expiry / Returns & Refunds / Bank/Payout / KYC/Documents / Team Access / Security Events |
| Report Generation Status Pill | Dynamic — shows `Ready / Idle`, `Generating 45%`, `Critical Finding`, `Stale Data`, `Offline`, `Expired Link` |

### UX State Switcher (Design Testing Tool)
A dashed `F1F5F9` bar with 7 state triggers:
- **Default Normal** — clean idle workspace
- **Generating (45%)** — blue progress banner with animated fill bar
- **Suspicious Finding** — red critical banner pointing to AUD-2026-9908 security event
- **Stale Data Warning** — amber "42 min ago" telemetry warning
- **Offline Mode** — grey disconnected / cached snapshot notice
- **Expired Link** — red expired download link with regenerate CTA
- **No Filtered Results** — empty state in audit trail table

---

## 4. Section 1: 8 Compliance Report Category Cards (JS-Rendered Grid)

Each category card shows: icon, title, subtitle, status badge, a 3-stat mini-dashboard, last-run timestamp, and per-category `📥 Export` CTA. Clicking a card filters the audit trail below to that category.

| # | ID | Icon | Title | Default Status |
|:--|:--|:--|:--|:--|
| 1 | `fulfillment` | 📦 | Order Fulfillment | Verified |
| 2 | `inventory` | 🗂️ | Inventory Adjustments | Pending Review |
| 3 | `batch` | 🧪 | Batch & Expiry Handling | Verified |
| 4 | `returns` | 🔄 | Returns & Refunds | Verified |
| 5 | `payouts` | 🏦 | Bank & Payout Activity | Verified |
| 6 | `kyc` | 📋 | KYC & Document Activity | Action Needed (Amber) |
| 7 | `team` | 👥 | Team Access & Permissions | Verified |
| 8 | `security` | 🛡️ | Security Events | **Critical Review (Red)** |

---

## 5. Section 2: Detailed Audit Trail Table

### Table Columns
| Column | Description |
|:---|:---|
| Timestamp | Date + time (IST), split into two lines |
| Actor & Role | e.g. `Arjun (Store Manager)`, `System (Automated)` |
| Action | Description of event (Royal Blue) |
| Object / Ref ID | `ORD-28847`, `SKU-LORE-SERUM-001`, `BATCH-FACE-2026-NOV` etc. (Monospace) |
| Previous → New State | Before / After state transition with arrow |
| Source / Context | `Mobile App / Session #44B`, `Web Dashboard / IP 192.168.1.•••` |
| Result Pill | `Success` (Emerald) / `Review` (Amber) / `🚨 Critical` (Red) |
| Inspect Button | Opens Audit Event Inspection Drawer modal |

### "Find an Event" Search
Full-text search across all fields in the audit event stream.

### 8 Seed Events
| Event ID | Category | Action |
|:---|:---|:---|
| AUD-2026-9901 | fulfillment | Order Accepted & Packing Started (ORD-28847) |
| AUD-2026-9902 | inventory | Manual Stock Adjustment (SKU-LORE-SERUM-001) |
| AUD-2026-9903 | batch | Near-Expiry Batch Pull (BATCH-FACE-2026-NOV) |
| AUD-2026-9904 | returns | Customer Return Approved (RTN-1101) |
| AUD-2026-9905 | payouts | Weekly Settlement Disbursed (₹82,500 → HDFC ••••4589) |
| AUD-2026-9906 | kyc | Document Expiry Warning Triggered (VMC TL) |
| AUD-2026-9907 | team | Staff Role Changed (STAFF-RAJESH-003) |
| AUD-2026-9908 | security | Failed Login Attempt Detected (IP 182.73.•••.14) |

---

## 6. Audit Event Inspection Drawer Modal

Triggered by "Inspect" button in the audit trail. Shows full event metadata in a 650px modal:

### Drawer Contents
- **Timestamp, Actor, Object Ref, Source** — 2×2 info grid
- **State Transition**: `Previous State → New State` with colour-coded pills
- **Event Result**: `success` / `review` / `critical` coloured label
- **Linked Support Ticket** (if present): `SUPP-7721`, `SUPP-7798`
- **SHA-256 Cryptographic Audit Hash** (dark slate card with cyan monospace text):
  ```
  sha256:a3f9b21c44e07d8c91f3bcde19ee4f0d82749c3a1bd5e6f2c8701234f89e5ab1
  ```
  Labeled as immutable and backend-authoritative.
- **Privacy Masking Note** (amber banner if applicable):
  - `🔒 Privacy Masking Applied: IP Address partially masked`, `Full account number masked to ••••4589`

### Drawer Actions
- **Escalate to GlowVAI Support** — creates a support ticket and closes the drawer
- **Close Inspection** — dismisses modal

---

## 7. Export Configuration Modal (Secure Expiring Link)

### Configuration Options
| Field | Default |
|:---|:---|
| Export Date Scope | Oct 01 – Oct 09 (date pickers) |
| File Format | PDF Report (Signed) / CSV Raw Data / JSON Ledger |
| Privacy Masking Toggle | ✅ Enabled by default — masks bank numbers, OTPs, phone numbers, tokens |

### Secure Expiring Download Link Section (Blue card)
- **Policy**: All export downloads use a 24-hour expiring token to prevent unauthorized dissemination
- **Generate Button** → triggers a 1.4s fake async token generation
- **Generated Output** (monospace, dark-on-white):
  ```
  https://downloads.glowvai.in/audit/expiring?token=SEC_EXP86400_xxxxxxxx_VIJ01
  ```
- Token uses `Date.now().toString(36).toUpperCase()` randomized suffix
- Button turns Emerald `#16A34A` with `✓ Link Generated (Valid for 24 Hours)` on success

### `Generate & Download Now`
- Triggers a 2-second async simulation
- Report status pill updates to `⏳ Generating... 45%` (Blue) → reverts to `Ready / Idle` (Emerald)
- Final `alert` confirms download: `Audit_Report_Oct01_Oct09_2026.pdf`

---

## 8. Privacy & Security Safeguards

| Field Type | Masking Policy |
|:---|:---|
| Bank Account Numbers | Always masked to last 4 digits: `HDFC ••••4589` |
| Customer IP Addresses | Partially masked: `182.73.•••.14` or `192.168.1.•••` |
| OTPs / Auth Tokens | Never exposed in audit exports (omitted entirely) |
| Customer Phone Numbers | Masked in privacy-compliant export |
| Cryptographic Hashes | Always shown in full (immutable) |

---

## 9. Access Scope Pill Behavior

| Mode | Pill Style | Label |
|:---|:---|:---|
| Merchant View (default) | Royal Blue `#EFF6FF` bg | `🔒 Merchant-visible activity only` |
| Support Telemetry View | Red `#FEE2E2` bg | `🔓 Internal Support Telemetry View` |

> **Note**: Support Telemetry Mode must only be activated when the authenticated user holds an internal GlowVAI support role. A confirmation alert is shown on toggle.

---

## 10. JS Functions Reference

| Function | Description |
|:---|:---|
| `renderWebAuditWorkspace()` | Triggers `renderWebAuditCards()` + `renderWebAuditTable()` |
| `renderWebAuditCards()` | Renders 8 category cards; filters by `web-audit-category-filter` value |
| `renderWebAuditTable()` | Renders audit trail events; filters by category + full-text search |
| `setWebAuditCategoryView(catId)` | Sets the dropdown and re-renders workspace |
| `openWebAuditEventModal(eventId)` | Populates and opens event inspection drawer |
| `closeWebAuditEventModal()` | Closes event drawer |
| `escalateToSupportFromDrawer()` | Creates a support ticket and closes drawer |
| `openWebAuditExportModal()` | Opens export configuration modal |
| `closeWebAuditExportModal()` | Closes export modal |
| `generateWebExpiringDownloadLink()` | Simulates 24h token generation (1.4s async) |
| `triggerWebAuditGenerationProcess()` | Simulates report generation (2s async); updates status pill |
| `toggleWebSupportScopeMode()` | Toggles between Merchant and Support scope labels |
| `setWebAuditState(state)` | Controls UX banner + pill for 7 design states |

---

## 11. Data Constraints & Backend Policy

- **Audit events are append-only** — no edit or delete is permitted even at admin level
- **All timestamps are backend-authoritative** (IST, UTC-normalized for export)
- **Cryptographic hashes are computed and stored at event write time** — not recomputable from the UI
- **Payout settlement values are backend-authoritative** — UI renders masked values only
- **Export files carry a platform-signed header** (PDF: GlowVAI digital signature; CSV: hash checksum row)
