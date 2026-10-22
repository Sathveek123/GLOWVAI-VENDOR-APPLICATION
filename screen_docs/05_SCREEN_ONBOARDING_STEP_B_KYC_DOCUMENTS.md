# 📱 Screen Documentation: Onboarding Step B — KYC & Tax Documents

## 📍 File & Component Location
- **File Path**: `mobile/app/(onboarding)/step-b.tsx`
- **Route URL**: `/(onboarding)/step-b`

---

## 🎯 Screen Purpose & Behavior
Collects tax registration numbers and business license uploads required for regulatory compliance under Indian GST and FSSAI rules.

---

## 🎨 Form Fields & Upload Badges
1. **GSTIN Number Input**: 15-character GST field (e.g. `37AAACG1234F1Z8`) with format validation.
2. **PAN Card Number Input**: 10-character PAN field (e.g. `AAACG1234F`).
3. **Trade License / FSSAI Number** (Optional for grocery items).
4. **Document Photo Upload Cards**:
   - GST Certificate Upload Button
   - Store Front Photo Upload Button
   - Owner ID Proof Upload Button

---

## ⚡ Navigation
Clicking *"Next: Bank & Payout Details (Step C)"* advances to `/(onboarding)/step-c`.
