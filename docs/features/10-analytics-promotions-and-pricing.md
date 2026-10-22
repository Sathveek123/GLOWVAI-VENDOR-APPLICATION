# Feature 10: Analytics, promotions and pricing

**Status:** screens are built with sample data. The mobile analytics and promotions screens are Coming-soon placeholders in production. The analytics dashboard endpoint exists on the backend.
**Screens:** [Mobile: analytics and promotions](../mobile/10-analytics-and-promotions.md), [Web: insights, growth and operations](../web/09-insights-growth-and-operations.md)

## Analytics

- **Mobile** (`analytics.tsx`): orders today and last 7 days, and the service targets: prep under 3 minutes, out-of-stock cancels under 2%, offer timer SLA above 98%, rider handover speed above 95%.
- **Web** (`page-analytics`): gross sales, net earnings, and order counts for 7 or 30 days, with an export report dialog (format choice, then download).
- Backend: `GET /api/analytics/:storeId`. Until it is connected, the values are sample numbers.

## Promotions

- Campaign list with status (active, scheduled, under review, paused).
- Create a campaign: name, promotion type, discount value, minimum order value, scope (which products), and the schedule.
- Activation is a front-end action. The server does not apply the discount yet.

## Customer insights

- Demand segments. Segments with a low sample (under 10) are flagged, and small segments show a privacy-suppressed state.
- Actions: create a purchase order, create a bundle promotion, trigger re-engagement. These are front-end actions only.

## Pricing and margin

- Bulk pricing rules by category, with an adjustment type and value.
- The screen has a "Policy Violation Alert" state and a "Pending Approval" state. Both are display states; the rule that triggers them is not built.

## Known gaps

- Every number on these screens is sample data except where the analytics endpoint is connected.
- Discounts are not applied to orders.
