# PC Screen 36 — Customer Insights & Demand Segments

> **PROPOSED EXTENSION** — Requires product-owner approval prior to production release.

## 1. Overview & Purpose

The **Customer Insights & Demand Segments Workspace** (`#page-customer-insights`) provides merchants with privacy-safe, aggregated analytics regarding buyer behavior, repeat order cycles, basket composition, and demand spikes across beauty categories. 

Under India's **Digital Personal Data Protection (DPDP) Act 2023**, all individual consumer identities (full names, phone numbers, exact street addresses, and emails) are strictly withheld. Insights are compiled into anonymized cohorts with a minimum group threshold of 10 orders to eliminate re-identification risks.

---

## 2. Desktop Workspace Architecture

- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Navigation Location**: Insights / Customer Demand Segments
- **Palette**:
  - **Royal Blue (`#1D4ED8`)**: Primary actions, cohort highlight tags, active metrics
  - **Emerald (`#16A34A`)**: High LTV indicators, growth trends, satisfaction ratings
  - **Amber (`#D97706`)**: At-risk customer warnings, low sample alerts
  - **Red (`#DC2626`)**: Critical privacy flags, permission errors

---

## 3. Top Header & Privacy Shield Banner

### Breadcrumbs & Header Controls
- **Breadcrumbs**: `Insights / Customer Demand Segments`
- **Page Title**: `Customer Insights & Demand Segments`
- **Proposed Extension Pill**: `PROPOSED EXTENSION — Requires PO Approval` (Amber)
- **Store Selector**: `Vijayawada Main Hub (Active) / Guntur Central / All Stores`
- **Time Scope**: `Last 30 Days (Default) / Last 7 Days / Last 90 Days`
- **Primary Action**: `📥 Export Report` → Exports aggregated PDF report

### DPDP Privacy Shield Banner
A blue alert banner (`#EFF6FF`, border `#BFDBFE`) confirming:
- Full withholding of personal contact details
- Enforced minimum cohort aggregation threshold (N ≥ 10)
- `✓ PII Shield Active` badge in Emerald

---

## 4. Metric Strip (6 Cards)

| Metric | Value | Baseline / Context |
|:---|:---|:---|
| Repeat Order Rate | `38.4%` | ↑ 4.2% vs prev 30d (N=1,420 orders) |
| New vs Returning | `61% / 39%` | 866 New / 554 Returning buyers |
| Average Order Value (AOV) | `₹1,480` | ↑ ₹120 on skincare routine baskets |
| Repurchase Interval | `22 Days` | Fastest cycle: Serums & Sunscreens |
| Top Category Demand | `Skincare` | 44% total revenue share |
| Store Satisfaction | `4.85 ★` | Based on 340 ratings |

---

## 5. Aggregated Customer Segments Grid (6 Cards)

1. **High-Frequency Reparters** (240 buyers, 17% share): 4.2x LTV, 14-day repurchase, Top: Serums & Sun Care.
2. **Skincare Routine Seekers** (580 buyers, 41% share): 2.8x LTV, 22-day repurchase, Top: Cleansers & Toners.
3. **Weekend Festive Shoppers** (410 buyers, 29% share): 1.9x LTV, 30-day repurchase, Peak Sat 6–10 PM.
4. **Promo & Flash Sale Buyers** (315 buyers, 22% share): 1.2x LTV, 40-day repurchase, 78% discount usage.
5. **At-Risk / Lapsing Reparters** (95 buyers, 7% share): 2.5x LTV, 45-day repurchase, re-engagement opportunity.
6. **Organic Clean Beauty Seekers** (180 buyers, 13% share): 3.1x LTV, 25-day repurchase, Paraben-free preference.

---

## 6. Actionable Alignment Recommendations

3 evidence-backed inventory and promotion alignment cards:
- **Inventory Action**: Stock up on Sunscreen SPF 50 before weekend demand spike (+38%).
- **Promo Opportunity**: Bundle Vitamin C Serum + Hyaluronic Acid (+₹240 AOV lift).
- **Retain At-Risk**: Trigger automated win-back notifications for 95 lapsing buyers.

---

## 7. UX State Tester Matrix

- **Default Normal** — Complete active segment grid
- **Low Sample (<10)** — Suppresses insights with DPDP sample threshold warning
- **Privacy Suppressed** — Displays PII protection badge
- **Loading** — Shows skeleton loading state
- **Stale Data Warning** — Displays 4-hour old snapshot warning
- **Offline Mode** — Cached offline snapshot
- **Permission Denied** — Manager role requirement notice
- **Empty Range** — Empty filter response
