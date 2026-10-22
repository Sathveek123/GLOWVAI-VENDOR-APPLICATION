# 📱 Mobile Screen 03: SMS OTP Verification

## 📍 File & Route Specification
- **File Path**: `mobile/app/(auth)/otp.tsx`
- **Route URL**: `/(auth)/otp`
- **Access Level**: Public / Pending Verification

---

## 🎯 Purpose & Business Logic
Verifies 4-digit SMS passcode sent to the vendor's registered Indian mobile number (`+91 98765*****`). Supports 30-second resend countdown timer, 3-attempt lockout security handling, and developer test OTP autofill (`4892`). In production builds (`NODE_ENV === 'production'`), test shortcuts are absent and the backend API strictly rejects hardcoded test OTPs.

---

## 🎨 Visual Design & UI System
- **Canvas**: Pure White (`#FFFFFF`) canvas with responsive safe area layout.
- **OTP Input Box**: Monospace center-aligned numeric input box with 4-digit spacing, Royal Blue border highlight (`#1D4ED8`).
- **Timer & Action Pills**: Soft countdown timer and Royal Blue resend link (`#1D4ED8`).
- **Demo Autofill Pill**: Test OTP autofill pill `Test OTP: Tap to autofill 4892` rendered exclusively when `__DEV__` is true (absent in production).

---

## ⚡ Key Features & Data Flow
- **Auto-Verification**: Automatically validates when 4 digits are entered.
- **Resend Countdown**: 30-second ticker disabling resend action until expiration.
- **Security Lockout**: Locks input for 15 minutes after 3 consecutive invalid attempts.
- **Navigation Flow**:
  - Existing registered vendor -> `/(vendor)/home`
  - New vendor onboarding -> `/(onboarding)/step-a`

---

## ♿ Edge & Lifecycle States
- **Invalid OTP**: Renders red error text `"Incorrect OTP code. Attempts remaining: 2"`.
- **Expired Code**: Displays `"OTP expired. Please tap Resend SMS."`
- **Security Lockout**: Renders red error banner `"Too many invalid attempts. Locked for 15 minutes."`
