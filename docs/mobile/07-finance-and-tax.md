# Mobile screens 07: earnings, payouts, bank and tax

**Covers:** `earnings.tsx`, `payout-detail.tsx`, `bank-edit.tsx`, `tax-documents.tsx`
**Feature docs:** [Feature 07: earnings, payouts and tax](../features/07-earnings-payouts-and-tax.md)

All four are Coming soon in production. Development builds show the full screens with sample data.

| Screen | Route | Purpose |
|---|---|---|
| Earnings | `/(vendor)/earnings` | Net earnings, orders and their payout status |
| Payout detail | `/(vendor)/payout-detail` | One settlement cycle, its UTR and deductions |
| Bank account | `/(vendor)/bank-edit` | UPI payout destination and change request |
| Tax documents | `/(vendor)/tax-documents` | GST summary and downloadable invoices |

## Earnings (`earnings.tsx`)

**Title:** "Earnings". Subtitle: backend-authoritative finance for the store.

- **Net earnings card:** "Your net earnings (88% merchant share)". Mask toggle.
- **Verified orders** count and the monthly view.
- **Orders table:** status (settled, pending, refunded), gross, fee, net.
- **Links:** *View as table*, *View fee details*, *View UTRs*.
- **State:** "The backend financial service did not respond. Check network connection."

## Payout detail (`payout-detail.tsx`)

**Title:** "Settlements and UTR receipts".

- **UTR reference number** with copy. Copy to clipboard works on web. On mobile the action shows an alert instead.
- **Deductions:** TDS (1%, section 194O) and TCS (1%, section 52).
- **States:** stale data, skeleton loaders, "The bank gateway service is currently unresponsive. Tap retry."
- Development strip: "Test settlement edge states".

## Bank account (`bank-edit.tsx`)

**Title:** "UPI payout destination".

- Current destination: bank name, IFSC, masked account, UPI handle (masked, for example `glow••••@hdfcbank`). Marked as default and verified.
- **Change flow:** identity verification, then review, then "Update submitted". Submit shows "Not available yet" in production, because the backend is not built.

## Tax documents (`tax-documents.tsx`)

**Title:** "Tax documents". Period shown for GSTR-1 and GSTR-3B reconciliation.

- **Totals:** taxable value, total GST, SGST and CGST split, cumulative.
- **Statutory note:** TCS and TDS compliance.
- **Restore documents** action, and an offline state.
- **States:** permission denied, offline.

## Known gaps

- All figures are sample data until `earningsApi` and the finance service are connected.
- Bank changes do not reach a server.
- The finance numbers must be checked by the finance owner before payouts go live.
