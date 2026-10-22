# 💻 PC / Web Screen 02: Vendor Mobile Login (+91)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-login`)
  - Expo Web / Mobile React Native: [`mobile/app/(auth)/login.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28auth%29/login.tsx)
- **Web URL**: `/login` or `index.html#login`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop merchant authentication screen for Indian beauty, skincare, and cosmetics retailers accessing their store operations workspace. Uses a responsive 1440×1024 split layout:
- **Left Panel (5/12 width, ~520px)**: Refined Royal Indigo (`#1E1B4B`) brand and benefit panel highlighting live orders, inventory accuracy, and secure payouts.
- **Right Panel (7/12 width)**: Centered white login card (`460px` max-width) with clear +91 country code input, formatting guidance, real-time validation, and disabled/loading CTA states.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Canvas & Layout** | Split 2-Column Desktop Grid | 960px container width inside 1440×1024 canvas; warm off-white `#F8FAFC` background |
| **Left Brand Panel** | `#1E1B4B` (Royal Indigo) | Royal Blue lettermark badge (`G`), tagline, headline "Merchant operations made simpler", 3 icon benefit items |
| **Right Login Card** | `#FFFFFF`, Max-width `460px` | 1px border (`#E2E8F0`), 16px radius, subtle shadow (`rgba(15,23,42,0.05)`) |
| **Input Container** | 52px height, 1.5px border | White card, focus outline (`#1D4ED8`), error outline (`#DC2626`), `+91` blue pill prefix (`#EFF6FF`) |
| **Primary CTA** | Royal Blue (`#1D4ED8`) | Full-width 52px height button, disabled state (`#94A3B8`), active hover (`#1E40AF`) |
| **Trust Note & Legal** | 12px Slate Gray (`#64748B`) | Lock icon note + interactive modal triggers for Terms of Service and Privacy Policy |
| **Responsive Collapse** | `< 1024px` breakpoint | Left brand panel collapses into compact top brand lockup inside centered card |

---

## ⚡ Form Validation & Simulated Error States

### 1. Client-Side Validation Rules
- **Regex Rule**: `/^[6-9]\d{9}$/` (Must start with 6, 7, 8, or 9 and be exactly 10 digits long).
- **Inline Messaging**: 
  - Starts with invalid digit: `⚠️ Mobile number must start with 6, 7, 8, or 9`
  - Incomplete number: `⚠️ Enter a valid 10-digit Indian mobile number`
- **CTA State**: "Send verification code" remains disabled until `isValid === true`.

### 2. Desktop Error States (Simulated Demo Bar)
- **Rate Limit**: `⏳ Too many OTP attempts. Please wait 60 seconds before trying again.`
- **Network Timeout**: `📡 Connection timeout. Retrying request via secondary gateway...`
- **Account Locked**: `🔒 Account temporarily locked due to security policy. Contact GlowVAI Support.`
- **SMS Gateway Failure**: `⚠️ SMS gateway service unavailable. Please retry in a few moments.`

---

## ⌨️ Accessibility & Desktop Keyboard Behaviors
- **Auto-Focus**: Mobile number input automatically receives focus on page load.
- **Enter-to-Submit**: Pressing `Enter` in valid mobile input triggers OTP dispatch (`handleSendOtp`).
- **Screen Reader Support**: Accessibility labels (`accessibilityLabel="Mobile number"`, `accessibilityHint="Enter 10-digit Indian mobile number"`).
- **Modal Popups**: Terms of Service and Privacy Policy overlay using backdrop dark shadow (`rgba(15, 23, 42, 0.4)`).

