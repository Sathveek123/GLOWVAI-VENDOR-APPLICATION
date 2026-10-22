# Web pages 09: insights, growth and operations

**Covers:** `page-analytics`, `page-promotions`, `page-customer-insights`, `page-pricing-margin`, `page-fulfillment`
**Feature docs:** [Feature 10: analytics, promotions and pricing](../features/10-analytics-promotions-and-pricing.md), [Feature 06](../features/06-recommendations-and-procurement.md)
**Mobile equivalents:** [mobile screens 10](../mobile/10-analytics-and-promotions.md)

Each page has a state strip at the top (default, loading, stale data, offline, empty). The strips are part of the design review and must be gated before release.

## Business insights (`page-analytics`)

**Title:** "Business insights".

- Range: last 7 days or last 30 days.
- Cards: gross sales, net earnings, orders.
- Links: *Manage catalogue and stock →*, *Review staff roster →*, *View customer reviews →*.
- *Export performance report*: a dialog to choose the file format, then *Download report*.

## Promotions (`page-promotions`)

**Title:** "Promotions and campaign hub".

- Filter: all, active, scheduled.
- *Create promotion campaign*: campaign name, promotion type, discount value, minimum order value.
- *Activate campaign*.

## Customer insights (`page-customer-insights`)

**Title:** "Customer insights and demand segments".

- Demand segments, with low-sample and privacy-suppressed states.
- Actions: *Create PO for sunscreens*, *Create bundle promo*, *Trigger re-engagement*.
- States: loading, permission denied, empty range.

## Pricing and margin (`page-pricing-margin`)

**Title:** "Pricing and margin control workspace".

- Bulk pricing rules: category scope, adjustment type, value. *Apply pricing rule*.
- Policy violation alert and pending approval states.
- Empty filter state.

## Fulfilment and rider performance (`page-fulfillment`)

**Title:** "Fulfilment and rider performance".

- Peak rush bottleneck and low-sample alerts.
- Empty data state.

## Known gaps

- Every number on these pages is sample data.
- Promotions, pricing rules and re-engagement are front-end only.
- The customer-insights privacy rule (minimum sample size) is shown in the UI but not enforced by a backend.
