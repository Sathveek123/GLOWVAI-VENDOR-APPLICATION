# 📱 Mobile Screen 24: Bank Account & UPI Management

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/bank-edit.tsx`
- **Route URL**: `/(vendor)/bank-edit`
- **Access Level**: Authenticated Merchant (High Security Flow)

---

## 🎯 Purpose & Business Logic
High-security payout destination and bank account management console. Allows store owners to view masked account details, switch default payout channel between Bank Transfer and UPI, and execute a guided 3-step secure change flow with 24-hour security cooling hold policy enforcement.

---

## 🎨 Visual Design & UI System
- **Header**: Title `"Payout Account"`, security indicator badge `🔒 Encrypted`.
- **Primary Verified Cards**:
  - **Verified Bank Card**: `HDFC Bank`, Beneficiary `Priya Beauty Retail Pvt Ltd`, masked account `••••••4589`, IFSC `HDFC0001234`, Branch `Benz Circle, Vijayawada`, and green status pill `✓ Verified`.
  - **Masked UPI Card**: `glow••••@hdfcbank`, VPA status `✓ Verified`, `Set UPI as Default` toggle action.
- **Guided 3-Step Change Wizard Modal**:
  - **Step 1 (Verify Identity)**: 6-digit SMS OTP input (`+91 98765*****`), resend timer countdown (30s), test OTP chip (`4892`), and 3-attempt security lockout.
  - **Step 2 (Enter New Details)**: Beneficiary name, bank name, account number, **paste-blocked confirm field** (`🔒 Copy/paste is disabled on confirm field`), real-time IFSC branch lookup, and UPI VPA lookup.
  - **Step 3 (Review & Submit)**: Side-by-side comparison of Current vs Proposed account, mandatory confirmation checkbox, and 24-hour security cooling hold notice.

---

## ⚡ Key Features & Data Flow
- **Paste Protection**: Blocks clipboard pasting on the confirm account number field to eliminate typos.
- **IFSC Branch Resolver**: Resolves branch details upon typing 11 IFSC characters.
- **Security Cooling Hold**: Activates amber cooling banner `"⌛ 24-Hour Security Cooling Period Active — Daily payouts paused until Tomorrow 06:00 AM."`

---

## ♿ Edge & Lifecycle States
- **Security Lockout**: Locks OTP step for 15 minutes after 3 invalid code entries.
- **Account Mismatch**: Displays red alert `"Account number and confirm account number do not match."`
- **Unrecognized Update Alert**: Emergency shortcut `🚨 Unrecognized update? Lock Account Immediately`.
