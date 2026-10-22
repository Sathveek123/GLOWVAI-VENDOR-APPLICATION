# Feature 07: Earnings, payouts and tax

**Status:** screens are built. Figures are sample values until the backend finance service is connected. Earnings and payout detail are Coming-soon placeholders on mobile in production.
**Screens:** [Mobile: finance and tax](../mobile/07-finance-and-tax.md), [Web: earnings, settlements and tax](../web/06-earnings-settlements-and-tax.md)

## What it does

The vendor sees what they earned per order, when it was paid, the bank reference (UTR) for each settlement, and the GST and TDS/TCS documents for their accountant.

## Money model

From the screen copy and the finance docs (`docs/08_FINANCIAL_LEDGER_AND_PAYOUT_CALCULATION.md`):

| Line | Rule shown in the app |
|---|---|
| Gross sales | Order value at selling price |
| Platform fee | 12% of gross |
| Net payout | 88% of gross, less refunds and adjustments |
| GST on commission | 18% of the platform fee |
| TDS | 1% under section 194O |
| TCS | 1% under section 52 |

These rates appear as labels in the screens. The backend should calculate them. The app must not calculate them on the device in production.

## Screens

- **Earnings** (`earnings.tsx`): net earnings card, orders table with status (settled, pending, refunded), monthly filter, mask toggle for amounts, and links to fee details and UTRs.
- **Payout detail** (`payout-detail.tsx`): one settlement cycle with its UTR, covered dates, orders, and deductions. The copy-to-clipboard action is available on web only; on mobile it shows an alert.
- **Bank account** (`bank-edit.tsx`): current UPI payout destination (masked), change request with OTP verification, and a "not available yet" message on submit. Changes are not saved to a server.
- **Tax documents** (`tax-documents.tsx`): GST summary by quarter, invoices and documents with status (available, filed, processing, expired), and the GSTR-1 export on web.

## Rules

- Amounts are shown in INR with a mask option for screen sharing.
- Bank details are masked by default.
- The bank-change flow starts with an identity check ("Verify Identity & Continue"). The rule for how long a new account waits before payouts is not defined in the app.

## Known gaps

- The finance service is not connected, so every figure is sample data.
- The bank-change flow does not write to a server.
- Download and export buttons are front-end only.
- The TDS/TCS and GST numbers are display copy. An accountant should confirm them before any payout runs.
