# 📱 Mobile Screen 02: Vendor Mobile Login (+91)

## 📍 File & Route Specification
- **File Path**: `mobile/app/(auth)/login.tsx`
- **Route URL**: `/(auth)/login`
- **Access Level**: Public / Unauthenticated Merchant Entry

---

## 🎯 Purpose & Business Logic
Merchant authentication entry screen enforcing Indian 10-digit mobile number format (`+91`). Accepts valid Indian phone numbers, validates non-empty inputs, triggers SMS OTP dispatch, and maintains test phone bypass logic for developer builds.

---

## 🎨 Visual Design & UI System
- **Canvas**: Pure White (`#FFFFFF`) with crisp elevated white cards (`#FFFFFF`).
- **Brand Hero Banner**: Royal Blue (`#1D4ED8`) header strip featuring GlowVAI Vendor branding.
- **Input Fields**: Structured phone input with static `+91` prefix chip, Inter/system font, and focused blue border (`#1D4ED8`).
- **CTA Button**: Full-width Royal Blue primary button (`#1D4ED8`) with active states.

---

## ⚡ Key Features & Data Flow
- **Input Validation**: Strictly restricts input to numeric characters and 10 digits.
- **Test Number Autofill**: Includes a 1-tap dev chip `Demo: Use +91 98765 43210` visible exclusively when `__DEV__` is true (absent in production builds).
- **Terms & Compliance Link**: Links to merchant privacy policy and terms of service.
- **API Hook**: Triggers `authApi.sendOtp(phone)` on submit and navigates to `/(auth)/otp?phone=...`.

---

## ♿ Edge & Lifecycle States
- **Invalid Phone Format**: Displays error text `"Please enter a valid 10-digit Indian mobile number."`
- **Network Failure**: Renders inline warning banner with retry action.
- **Rate Limit Exceeded**: Disables button for 60 seconds with countdown timer.
