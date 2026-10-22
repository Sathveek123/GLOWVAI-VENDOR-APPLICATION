# 💻 PC / Web Screen 03: SMS OTP Verification

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-otp`)
  - Expo Web / Mobile React Native: [`mobile/app/(auth)/otp.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28auth%29/otp.tsx)
- **Web URL**: `/otp` or `index.html#otp`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop verification screen continuing directly from the login flow to confirm Indian merchant mobile numbers via 4-digit SMS one-time passcode. Features:
- **Calm Reassurance Left Panel (5/12 width)**: Royal Indigo (`#1E1B4B`) panel with title "Secure access for your store", privacy statement, and direct encrypted SMS verification badges.
- **Focused White Verification Card (7/12 width)**: Centered `460px` white card with border, subtle shadow, back link with arrow ("Change mobile number"), title "Verify your mobile number", and masked destination string ("We sent a code to +91 98XXX XX210").
- **4 Large Numeric OTP Inputs**: Monospace 64px tall input cells in a single desktop row with auto-advance, backspace handling, and paste support (`Ctrl + V`).
- **Resend Countdown & Security Note**: "Resend code in 00:30" timer countdown, quiet security note ("🔒 Never share this code with anyone."), and screen-reader accessibility announcements (`accessibilityLiveRegion="polite"`).

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Container Card** | Centered `#FFFFFF`, Max-width `460px` | 16px radius, 1px `#E2E8F0` border, soft shadow (`rgba(15,23,42,0.04)`) |
| **4-Digit OTP Grid** | `64px` height Monospace Cells | 1.5px border, Royal Blue focus ring (`#1D4ED8`), filled background (`#EFF6FF`), error outline (`#DC2626`) |
| **Back & Edit Links** | Royal Blue (`#1D4ED8`) | "← Change mobile number" top arrow link + "Edit number" action link |
| **Resend Countdown** | 30-Second Timer (`00:30`) | Text countdown switches to active Royal Blue "Resend code" button after 30s |
| **Lockout Banner** | Amber/Red Alert Banner | Displays remaining lockout timer (60s countdown) when 3 consecutive invalid codes are entered |
| **Accessibility** | Live Region Announcements | `accessibilityLiveRegion="polite"` for status and timer updates |

---

## ⚡ Keyboard Navigation & Web Security Rules
- **Keyboard Auto-Advancement**: Typing a digit populates the focused cell and immediately moves focus to the next cell.
- **Backspace Step-Back**: Pressing `Backspace` in an empty cell clears the previous digit and moves focus backward.
- **Clipboard Paste**: Pasting a full 4-digit string (`Ctrl + V`) populates all 4 cells at once.
- **Clean Security**: No test OTP chips or developer shortcuts are shown in the primary user interface.


