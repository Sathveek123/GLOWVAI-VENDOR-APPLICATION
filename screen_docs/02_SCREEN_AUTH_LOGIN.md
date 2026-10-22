# 📱 Screen Documentation: Vendor Login Screen

## 📍 File & Component Location
- **File Path**: `mobile/app/(auth)/login.tsx`
- **Route URL**: `/(auth)/login`
- **Access Level**: Public

---

## 🎯 Screen Purpose & Behavior
The Vendor Login Screen allows dark store operators and retail partners to enter their registered 10-digit Indian mobile number. Upon submission, it validates the format (`+91 [6-9]XXXXXXXXX`) and navigates to the OTP Verification screen.

---

## 🎨 UI Components & Layout
- **Header**: GlowVAI logo badge and title *"Partner Login"*.
- **Mobile Number Input Field**:
  - Country Code Prefix: `+91` (Fixed green container token).
  - Phone Input: Text input with numeric keypad (`keyboardType="phone-pad"`), accepting 10 digits.
- **Action Button**: *"Get OTP via SMS / WhatsApp"* with hover/active press animations.
- **Secondary Link**: *"New Dark Store Partner? Apply for Onboarding"* (redirects to `/(onboarding)/step-a`).

---

## ⚡ User Interactions & Validations
1. **Input Formatting**: Automatically strips non-numeric characters and limits input length to 10 digits.
2. **Submit Handler**:
   - Validates that phone length equals 10 and starts with `6`, `7`, `8`, or `9`.
   - Triggers `router.push({ pathname: '/(auth)/otp', params: { phone } })`.
