# 📱 Screen Documentation: Financial Earnings & Payout Ledger Screens

## 📍 File & Component Location
- **Earnings Screen**: `mobile/app/(vendor)/earnings.tsx` (`/(vendor)/earnings`)
- **Payout Detail Screen**: `mobile/app/(vendor)/payout-detail.tsx` (`/(vendor)/payout-detail`)

---

## 🎯 Purpose & Behavior

### Earnings Screen (`earnings.tsx`)
- Financial dashboard displaying today's earnings, weekly revenue graph, and pending payout balance.
- Shows automatic split calculation: **88% Vendor Net Payout / 12% Platform Take-Rate**.
- Displays historical daily payouts list.

### Payout Detail Screen (`payout-detail.tsx`)
- Itemized settlement invoice for a specific payout cycle.
- Displays Bank/UPI transaction UTR number, gross sales, platform commission deducted, GST breakdown, and net amount credited.
