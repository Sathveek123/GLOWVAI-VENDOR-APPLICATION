# PC Screen 37 — Pricing & Margin Control

> **PROPOSED EXTENSION** — Requires product-owner approval prior to production release.

## 1. Overview & Purpose

The **Pricing & Margin Control Workspace** (`#page-pricing-margin`) provides merchants and category managers with granular control over retail selling prices, gross margins, GST slabs, and discount rule validation. 

It strictly enforces pricing policy rules:
1. **Government MRP Ceiling**: Selling price must never exceed Govt. Max Retail Price (MRP).
2. **Margin Floor Guardrail**: Alerts when selling price drops below target gross margin.
3. **Backend Cost Authority**: Preliminary margin estimates are explicitly marked until reconciled with backend cost ledgers.

---

## 2. Desktop Workspace Architecture

- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Navigation Location**: Catalog / Pricing & Margin Control
- **Palette**:
  - **Royal Blue (`#1D4ED8`)**: Primary action buttons, active price fields
  - **Emerald (`#16A34A`)**: Healthy margin ratio (≥28%), compliant policy badges
  - **Amber (`#D97706`)**: Moderate margin (15%–27%), pending approval alerts
  - **Red (`#DC2626`)**: Critical MRP violations, negative margins, floor breaches

---

## 3. Top Header & Policy Enforcement Banner

### Controls & Actions
- **Breadcrumbs**: `Catalog / Pricing & Margin Control`
- **Page Title**: `Pricing & Margin Control Workspace`
- **Proposed Extension Pill**: `PROPOSED EXTENSION — Requires PO Approval` (Amber)
- **Category Filter**: `All Categories / Skincare / Cosmetics & Makeup / Hair Care`
- **Primary CTA**: `+ Create Pricing Rule` → Opens Bulk Price Rule Modal

### Policy Enforcement Alert Banner
Red banner (`#FEF2F2`, border `#FCA5A5`) highlighting:
- Strict prohibition of prices exceeding MRP
- Indication that gross margins are estimates pending backend cost verification
- `2 Policy Violations Found` indicator pill

---

## 4. Summary Metrics Row (4 Cards)

| Metric | Value | Status / Trend |
|:---|:---|:---|
| Needs Margin Review | `14 SKUs` | Below 20% target margin floor (Red) |
| Healthy Margin Ratio | `82% SKUs` | Gross margin ≥ 28% (Emerald) |
| Avg Catalog Margin | `34.2%` | Backend authoritative estimation |
| Active Promo Discounts | `8 SKUs` | Overlap detection passed (Royal Blue) |

---

## 5. Catalog Pricing & Margin Ledger Table

| Product & Brand | Category | MRP (₹) | Cost Basis | Selling Price | GST Slab | Gross Margin | Policy Status | Action |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Minimalist Niacinamide 10% Serum | Skincare | ₹699 | ₹420 | ₹599 | 18% | **29.8%** | ✓ Healthy | Edit |
| Lakme Absolute Matte Lipstick | Makeup | ₹850 | ₹680 | ₹850 | 18% | **20.0%** | ✓ Review Needed | Edit |
| Dot & Key Watermelon Sunscreen | Skincare | ₹595 | ₹310 | ₹495 | 18% | **37.3%** | ✓ Healthy | Edit |
| Plum Green Tea Toner | Skincare | ₹390 | ₹200 | ₹325 | 18% | **38.4%** | ✓ Healthy | Edit |
| Cetaphil Gentle Skin Cleanser | Skincare | ₹333 | ₹290 | ₹310 | 18% | **6.4%** | ⚠️ Below Target Floor | Edit |
| Lotus Herbals YouthRx Night Cream | Skincare | ₹745 | ₹760 | ₹750 | 18% | **-1.3%** | ⚠️ Above MRP Violation | Edit |

---

## 6. Modals & Guided Controls

- **Bulk Pricing Rule Creator Modal** (`#modal-create-price-rule`): Configure category-wide percentage discounts, margin floors, or flat-off rules with instant policy guardrail validation.

---

## 7. UX State Tester Matrix

- **Default Normal** — Complete catalog ledger
- **Policy Violation Alert** — Displays red banner for Lotus Herbals MRP violation
- **Pending Approval** — Shows amber indicator for rules awaiting PO sign-off
- **Loading** — Skeleton loader
- **Stale Data Warning** — Indicates 3-day old cost basis
- **Offline Mode** — Cached price list
- **Empty Filter** — Empty state screen
