# 💻 PC / Web Screen 22: Weekly Bank Settlement & UTR Receipts (Web)

## 📍 File & Web Route Specification
- **Mobile/Expo Route**: `mobile/app/(vendor)/payout-detail.tsx`
- **Web App View**: `web/index.html` (View: `#page-settlements`)
- **Web URL**: `/earnings/settlements` or `index.html#settlements`
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
The GlowVAI Vendor Bank Settlement & UTR Receipts workspace allows store owners and finance administrators to track weekly bank payouts, reconcile UTR (Unique Transaction Reference) codes against bank statements, and inspect itemized tax deductions.

### Key Desktop Workflows:
1. **Prominent "Next Expected Payout" Hero Banner**: Displays incoming T+1 IMPS settlement amount (`₹12,450.00`), expected deposit timestamp (`Tomorrow, 06:00 AM`), and destination bank account (`HDFC Bank ••••4589`).
2. **Chronological Settlement Reconciliation Table**: Lists past payout cycles (`SET-W40`, `SET-W39`, `SET-W38`) with order counts, gross sales, fees, net payout, and UTR chips.
3. **1-Tap UTR Clipboard Copy**: Monospace UTR code chips (`UTR-4021-8856-3321`) feature 1-tap clipboard copy with instant feedback.
4. **Itemized Deduction Audit Drawer**: Side drawer or modal expanding full financial breakdown:
   - Gross Customer Payments: `₹42,500.00`
   - GlowVAI Platform Commission (12%): `-₹5,100.00`
   - GST on Commission (18%): `-₹918.00`
   - Statutory TCS under CGST Sec 52 (1%): `-₹425.00`
   - Statutory TDS under IT Sec 194O (1%): `-₹425.00`
   - Approved Customer Refunds: `-₹62.00`
   - **Net Bank Settlement Deposited**: `₹35,570.00`
5. **Printable PDF Receipts**: Direct `@media print` support for clean A4 bank settlement receipts.

---

## 🎨 Color Palette & Typography Tokens
- **Canvas Background**: Warm Off-White `#F8FAFC`
- **Primary Hero Card**: Deep Royal Blue `#1D4ED8` with white text
- **Paid / Healthy Pill**: Emerald Green `#16A34A` / `#DCFCE7`
- **Processing Pill**: Amber Gold `#D97706` / `#FEF3C7`
- **Failed / Support Alert**: Red `#DC2626` / `#FEF2F2`
- **Typography**: Inter / system font stack with 8px grid alignment and 16px card border radii.

---

## ⚡ Keyboard Navigation & Accessibility
- `Tab` / `Shift+Tab`: Focuses through settlement cycle filters, table rows, and UTR copy chips.
- `Enter` / `Space`: Expands detailed itemized deduction breakdown drawer.
- `Ctrl + P`: Triggers clean printable PDF receipt template.
