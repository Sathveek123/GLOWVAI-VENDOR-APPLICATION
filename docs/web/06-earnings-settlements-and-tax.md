# Web pages 06: earnings, settlements, tax and bank

**Covers:** `page-earnings`, `page-settlements`, `page-tax-docs`, `page-bank`
**Feature docs:** [Feature 07: earnings, payouts and tax](../features/07-earnings-payouts-and-tax.md)
**Mobile equivalents:** [mobile screens 07](../mobile/07-finance-and-tax.md)

## Earnings (`page-earnings`)

**Title:** "Earnings". Period: this month.

- *Mask* toggle for amounts.
- *Export CSV / PDF*, *View fee details →*, *View UTRs →*.
- **Filters:** all orders, settled, pending, refunded.
- **Table:** date and time, order ID, customer name, gross sales, platform fee (12%), refund or adjustment, net payout (88%), status.
- *Switch chart view* for the trend.

## Settlements and UTR (`page-settlements`)

**Title:** "Bank settlements and UTR".

- Filter by settlement cycle; *Download receipts*.
- **Table:** cycle, covered date range, destination bank, order count, status, UTR reference, net settled amount.
- Actions: *Inspect breakdown →*, *Contact support*.

## Tax documents (`page-tax-docs`)

**Title:** "Tax documents".

- *Export GSTR-1*, *Refresh*.
- **Sections:** invoices, GST summary, TCS and TDS. A legal info panel.
- **Table:** invoice or document number, type, period, taxable value, GST or tax, total, status (available, filed, processing, expired, not available).
- An explanatory note for each document.

## Payout account (`page-bank`)

**Title:** "Payout account".

- Current bank (masked account) and UPI payout handle.
- *Change bank details →* and *Edit UPI handle*.
- *Send test ping (₹1)*: a development action. Remove before release.
- **Activity log:** timestamp, activity type, masked destination, verification mode, status. A "Lock account immediately" action for unrecognised updates.

## Known gaps

- All figures are sample data.
- Export and download buttons are front-end only.
- The test ping and the bank change flow are not connected to the backend.
