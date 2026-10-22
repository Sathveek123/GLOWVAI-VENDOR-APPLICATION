# 📱 Mobile Screen 06: Step 3 - Payout Account & UPI Setup

## 📍 File & Route Specification
- **File Path**: `mobile/app/(onboarding)/step-c.tsx`
- **Route URL**: `/(onboarding)/step-c`
- **Access Level**: Authenticated Onboarding Merchant (Step 3 of 4)

---

## 🎯 Purpose & Business Logic
Configures the merchant's primary bank account number, 11-character IFSC code, beneficiary name, and optional UPI VPA handle (`glowvai@okhdfcbank`) for Weekly bank settlement IMPS (with daily ledger tracking).

---

## 🎨 Visual Design & UI System
- **Stepper Progress Bar**: `Step 3 of 4 (75%)`.
- **Bank Form Card**: White elevated card (`#FFFFFF`) with paste-blocked confirm account number input.
- **IFSC Lookup Widget**: Real-time IFSC code resolver displaying bank name and branch (`HDFC Bank • Benz Circle Branch, Vijayawada`).
- **Security Callout**: Soft blue container explaining platform commission model (derived from store configuration `COMMISSION_RATE = 0.12`: 88% vendor payout share / 12% platform commission) and penny-drop verification.

---

## ⚡ Key Features & Data Flow
- **IFSC Resolver**: Automatically resolves bank & branch details upon typing 11 characters.
- **Account Number Match Validation**: Ensures primary account and confirm account fields match.
- **Paste-Blocked Confirm Input**: Prevents clipboard paste on confirm field to eliminate typo errors.

---

## ♿ Edge & Lifecycle States
- **Account Mismatch**: Renders red warning text `"Account numbers do not match."`
- **Invalid IFSC**: Displays `"Invalid IFSC code. Please enter 11 characters (e.g. HDFC0001234)."`
