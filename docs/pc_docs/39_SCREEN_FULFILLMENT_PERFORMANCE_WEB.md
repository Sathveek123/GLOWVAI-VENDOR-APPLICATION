# PC Screen 39 — Fulfillment & Rider Performance

> **PROPOSED EXTENSION** — Requires product-owner approval prior to production release.

## 1. Overview & Purpose

The **Fulfillment & Rider Performance Workspace** (`#page-fulfillment`) provides store managers with operational SLA telemetry across order prep stages: order acceptance, item picking, packing, tamper tag sealing, rider arrival, and OTP handover.

It enforces **Non-Punitive Operational SLA Standards**: All metrics are aggregated to eliminate bottlenecks and optimize shelf-to-bag workflow. Eligible sample sizes (`N=X`) are displayed alongside every average time and percentage.

---

## 2. Desktop Workspace Architecture

- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Navigation Location**: Analytics / Fulfillment Metrics
- **Palette**:
  - **Royal Blue (`#1D4ED8`)**: Order acceptance times, primary CTAs
  - **Emerald (`#16A34A`)**: 10-minute SLA compliance (≥95%), pick-and-pack efficiency
  - **Amber (`#D97706`)**: Rider arrival wait warnings, bottleneck indicators
  - **Red (`#DC2626`)**: Critical SLA breaches, stockout rejections

---

## 3. Top Header & Ethical Standard Notice

### Header Controls
- **Breadcrumbs**: `Analytics / Fulfillment Metrics`
- **Page Title**: `Fulfillment & Rider Performance`
- **Proposed Extension Pill**: `PROPOSED EXTENSION — Requires PO Approval` (Amber)
- **Time Scope**: `Today (Live Stream) / Last 7 Days / Last 30 Days`
- **Primary CTA**: `📥 Export SLA Report` → Exports operational SLA summary

### Ethical Operational Standard Notice
Blue banner (`#EFF6FF`, border `#BFDBFE`) clarifying that performance metrics are non-punitive, calculated strictly for workflow optimization, and qualified with sample size badges.

---

## 4. Key Performance Indicators (7 Metric Cards)

| Metric Card | Value | Target & Sample Context |
|:---|:---|:---|
| Avg Accept Time | `42 sec` | Target ≤ 60s (N=1,840 orders) |
| Pick & Pack Time | `3.4 min` | Target ≤ 4.0m (N=1,840 orders) |
| Rider Handover Wait | `1.8 min` | Target ≤ 2.0m (N=1,820 orders) |
| 10-Min SLA Compliance | `96.2%` | Target ≥ 95.0% (N=1,840 orders) — Emerald |
| Stockout Rejections | `0.8%` | Target ≤ 1.5% (15 incidents total) |
| Item Substitution % | `1.4%` | Target ≤ 2.0% (26 items substituted) |
| Damaged Packaging | `0.1%` | Target ≤ 0.3% (2 incidents reported) |

---

## 5. Order Dispatch Pipeline Stage Funnel

Visual 6-stage funnel detailing average elapsed duration per phase:
1. **Acceptance**: `42 sec` (100% orders)
2. **Item Picking**: `1.8 min` (Shelf to prep counter)
3. **Packing & Tag**: `1.6 min` (Tamper seal applied)
4. **Rider Arrival**: `2.4 min` (Bay 2 waiting area)
5. **OTP Handover**: `1.8 min` (Handshake verification)
6. **Departure**: `Total 8.2 min` (✓ 10-Min SLA Met)

---

## 6. UX State Tester Matrix

- **Default Normal** — Live operational telemetry stream
- **Peak Rush Bottleneck** — Highlights +1.2 min queueing delay during 18-order surge
- **Low Sample Alert** — Displays low sample warning for early morning metrics (N=4)
- **Loading** — Skeleton loader
- **Stale Data Warning** — 12-minute stale telemetry warning
- **Offline Mode** — Cached offline snapshot
- **Empty Data** — Empty response screen
