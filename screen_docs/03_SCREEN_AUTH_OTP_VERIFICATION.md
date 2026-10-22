# 📱 Screen Documentation: OTP Verification Screen

## 📍 File & Component Location
- **File Path**: `mobile/app/(auth)/otp.tsx`
- **Route URL**: `/(auth)/otp`
- **Access Level**: Public (Requires phone param)

---

## 🎯 Screen Purpose & Behavior
Verifies the 4-digit SMS OTP sent to the vendor's phone number. Features auto-fill, countdown timer (30s), and bypass test credentials for development (`OTP: 4892`).

---

## 🎨 UI Components & Layout
- **Subheader**: Displzays sent phone number (`+91 XXXXX X3210`) with an edit link.
- **4-Digit Input Boxes**: Four styled numeric boxes with focused indigo border highlight (`#6366F1`).
- **Resend OTP Timer**: 30-second countdown widget. Button becomes active once timer hits 0.
- **Submit Button**: *"Verify & Continue"*.

---

## ⚡ Logic & API Integration
1. **Validation**: Auto-verifies when 4 digits are typed or user clicks Submit.
2. **Session Commit**: On success, saves `vendorId` and `sessionToken` into `AsyncStorage` and calls `useVendorStore.getState().setVendorId('VND-001')`.
3. **Navigation**: Redirects to `/(vendor)/home`.

