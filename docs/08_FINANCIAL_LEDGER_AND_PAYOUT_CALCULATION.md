# 💰 Financial Ledger & Vendor Payout Engine

## 📊 Overview
The GlowVAI platform implements an automated financial ledger that splits every completed transaction into vendor earnings, tax obligations, and platform service fees.

---

## 📐 1. Revenue Split Formula

The default commercial contract operates on an **88% / 12% revenue split**:

```
Gross Item Revenue = Sum(Item Selling Price × Quantity)
Platform Take-Rate (12%) = Gross Item Revenue × 0.12
Vendor Net Payout (88%) = Gross Item Revenue - Platform Take-Rate
```

### Example Breakdown:

| Line Item | Formula / Amount | Value (INR) |
| :--- | :--- | :--- |
| **Minimalist Niacinamide Serum (x2)** | ₹599 × 2 | ₹1,198.00 |
| **Delivery Charge (Paid by Customer)** | Fixed / Distance | ₹29.00 |
| **Gross Total Customer Payment** | ₹1,198 + ₹29 | **₹1,227.00** |
| **GlowVAI Take-Rate (12%)** | ₹1,198 × 12% | **-₹143.76** |
| **Vendor Net Earnings (88%)** | ₹1,198 × 88% | **₹1,054.24** |

---

## 🏛️ 2. GST & Tax Compliance

- **Cosmetics & Skincare**: Subject to **18% GST**.
- **Essential Groceries (Atta/Rice/Pulses)**: Subject to **5% GST**.
- The server records `gstPercent` per item and computes tax breakdowns for invoice generation.

---

## 🏦 3. Bank Account & UPI Settlement Model

Each vendor dossier stores verified payout details:
```json
"bankDetails": {
  "bankName": "HDFC Bank",
  "holderName": "Mukesh Kumar",
  "accNumber": "50100482914589",
  "ifsc": "HDFC0001824",
  "upiId": "mukesh.kumar@okhdfcbank"
}
```

- **Settlement Cycles**:
  - Daily Instant Payout via UPI (`T+0` for high-tier stores).
  - Weekly Batch Direct Deposit (`T+2` every Tuesday for standard dark stores).
- **Payout Status**: Tracked in `mockStore.earnings.total.pendingPayout`.
