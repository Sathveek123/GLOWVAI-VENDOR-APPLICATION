# Mobile screens 10: analytics and promotions

**Covers:** `analytics.tsx`, `promotions.tsx`
**Feature docs:** [Feature 10: analytics, promotions and pricing](../features/10-analytics-promotions-and-pricing.md)

Both are Coming soon in production. Development builds show the full screens with sample data.

## Analytics (`analytics.tsx`)

**Title:** "Analytics".

- **Orders today** and the 7-day trend ("vs previous 7 days").
- **Service targets** with the current value and target: prep under 3 minutes, out-of-stock cancels under 2%, offer timer SLA over 98%, rider handover speed over 95%.
- **Per-basket** average.
- **Links:** *View customer reviews →*.
- **Freshness:** "Updated 5 minutes ago" (sample).

## Promotions (`promotions.tsx`)

**Title:** "Promotions and campaign hub".

- **Campaign list:** name, status (active, scheduled, under review, paused), dates, and redemptions.
- **Products tagged** count per campaign.
- **Create campaign:** promotion type, discount, schedule duration, product scope.
- **Actions:** *Resume* for paused campaigns.

## Known gaps

- The analytics endpoint exists on the backend (`GET /api/analytics/:storeId`) but the screen uses sample numbers.
- Campaigns are not applied to orders.
