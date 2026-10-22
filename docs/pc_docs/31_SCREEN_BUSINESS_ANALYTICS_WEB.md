# PC Screen 31 — Business Analytics & Performance Insights

## 1. Overview & Purpose
The **Business Analytics & Performance Insights Workspace** (`/analytics`) equips beauty retailers with decision-support analytics covering sales performance, net earnings, order SLA health, customer satisfaction ratings, and actionable inventory insights. Designed to be accessible and decision-oriented rather than overwhelming, it translates raw transaction telemetry into clear operational choices.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout & Palette
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`) with 16px card radius, subtle borders (`#E2E8F0`), and light drop shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left navigation rail with **Analytics** / **Overview** active.

### Top Header & Range Controls
- **Breadcrumbs**: `Analytics / Overview`
- **Page Title**: `Business insights`
- **Data Freshness Badge**: `Updated 5 minutes ago` (Green pulse dot)
- **Sub-caption**: `Actionable performance metrics, order fulfillment health, and store revenue trends.`
- **Time Range Controls**: `Today`, `Last 7 Days`, `Last 30 Days`.
- **Primary CTA**: `📥 Export Report` (Triggers PDF/CSV report download modal).

---

## 3. Legal & Financial Disclaimer Banner
- Persistent calm notification card: `"Financial values represent backend-verified settled ledger records. Figures are provided for operational decision support and should not be used as official tax filings without consulting your tax advisor."`

---

## 4. 6 Key Metrics Summary Cards Row

| Metric Label | Value | Trend Indicator | Explanatory Sub-Caption |
| :--- | :--- | :--- | :--- |
| **Gross Sales** | `₹1,62,850.00` | `↑ +14.2%` (Emerald) | vs prev 7 days |
| **Net Earnings** | `₹1,43,308.00` | `↑ +13.8%` (Emerald) | 88% net after platform split |
| **Total Orders** | `168 Orders` | `↑ +8.5%` (Emerald) | 165 completed orders |
| **Avg Order Value (AOV)** | `₹969.34` | `↑ +5.2%` (Emerald) | Per customer basket |
| **Fulfillment Rate** | `98.6%` | `↑ +0.4%` (Emerald) | Prep SLA &lt;3m |
| **Store Rating** | `4.96 ★` | `• Stable` (Slate) | 284 verified customer reviews |

---

## 5. Two-Column Analysis Workspace

### Left Column: Sales & Order Trend Visualizer
- **Interactive Metric Switcher**: Toggle between `Gross Sales (₹)`, `Net Earnings (₹)`, `Order Count`, and `AOV (₹)`.
- **Dual View Modes**:
  - **Chart View**: Interactive daily bar chart scaling heights dynamically based on peak period values.
  - **Table View**: Accessible HTML data table showing itemized daily metrics.

### Right Column: Operations Health & SLA Panel
- **Order Acceptance Rate**: `99.2%` (Target &gt;98.0%, 45s timer SLA)
- **Average Prep Time**: `2.4 mins` (Target &lt;3.0 mins, packing speed)
- **Ready-on-Time SLA Rate**: `97.8%` (Target &gt;95.0%, rider handover speed)
- **Cancellation Rate**: `0.8%` (Target &lt;2.0%, out-of-stock cancels)

---

## 6. Actionable AI Business Insights
1. **Inventory SLA Risk** (`⚠️`): *"Low-stock SKUs affecting 8% of order baskets."* (Shade 128 foundation and Niacinamide serum out-of-stock) -> **Action**: `[Manage Catalog & Stock →]`
2. **Peak Demand Opportunity** (`💡`): *"Peak order demand is between 6 PM and 9 PM."* (42% of daily revenue) -> **Action**: `[Review Staff Roster →]`
3. **Customer Feedback** (`⭐`): *"Packaging quality rating maintained at 4.92★."* (Tamper-evident security seals praised) -> **Action**: `[View Customer Reviews →]`

---

## 7. Export Report Modal
- Options for **Detailed PDF Summary** or **Raw CSV Data Export**.
- Includes itemized revenue, net payout breakdowns, fulfillment SLA stats, and review totals.
