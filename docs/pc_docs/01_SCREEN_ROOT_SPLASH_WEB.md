# 💻 PC / Web Screen 01: Root Splash & Session Router

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-splash`)
  - Expo Web / Mobile React Native: [`mobile/app/index.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/index.tsx)
- **Web URL**: `/` or `index.html#splash`
- **Target Viewports**: 1440×1024 Desktop Reference, 1280px Laptops, 1024px Tablets, 1920px Widescreen

---

## 🎯 Purpose & Desktop Design Strategy
PC Screen 01 serves as the focused initial session-evaluation loading state for the GlowVAI Vendor desktop command platform for Indian beauty retailers. Rather than showing a raw developer loader or a premature dashboard preview, it presents a polished, enterprise-grade loading experience with subtle motion, continuous status updates, and robust session routing.

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFC` (Warm Off-White) | Clean, distraction-free backdrop with generous whitespace |
| **Hero Card Container** | Max-width `480px` (`460px` in RN Web) | Centered 24px rounded card (`#FFFFFF`) with 1px `#E2E8F0` border and soft shadow |
| **Brand Lettermark** | `76×76px`, `22px` radius | Royal Blue (`#1D4ED8`) with 'G' in Inter 800 |
| **Ambient Aura Halo** | `140×140px` glowing circle | Subtle Electric Violet (`rgba(99, 102, 241, 0.14)`) pulsing ambient aura |
| **Typography** | Inter (`'Inter', sans-serif`) | Title: 28px bold (`#0F172A`), Subtitle: 14.5px medium (`#64748B`) |
| **Progress Bar** | 6px height track (`#F1F5F9`) | Animated fill with Royal Blue to Indigo gradient (`#1D4ED8` ➔ `#6366F1`) |
| **Footer Security Badge** | Pill container (`#FFFFFF`) | `🔒` Lock icon + Emerald active status dot + `Secure Merchant Workspace` |
| **Resolution Indicator Tag**| Top-Right Floating Pill (`#0F172A`) | Live viewport metric tag (e.g. `1440 × 1024 Desktop View`) |

---

## ⚡ Session Router Outcomes & Edge States

### 1. Three Routing Outcomes
- **Outcome A (Verified Session)**: Restores active merchant session (`vendor_registered = true`) ➔ Routes to Store Command Center (`/(vendor)/home` or `#page-dashboard`). Status message: `Workspace verified ✓ Opening Store Command Center…`
- **Outcome B (Pending Audit)**: Onboarding audit in progress ➔ Routes to Store Audit (`/(onboarding)/pending` or `#page-onboarding-pending`). Status message: `Checking onboarding audit status…`
- **Outcome C (Unauthenticated)**: No active session ➔ Routes to Partner Login (`/(auth)/login` or `#page-login`). Status message: `Opening partner login…`

### 2. Edge & Fallback States
- **Slow Connection (> 3.5s)**: Status updates to `Connecting to GlowVAI merchant service…`
- **Network Failure / Offline**: Renders red attention card `⚠️ Unable to reach merchant service` with "Retry Connection" and "Sign In Again" actions.
- **Expired Session**: Renders `🔒 Merchant session expired. Please sign in again.`
- **System Maintenance State**: Renders `🛠️ System Maintenance in Progress` banner.

---

## ⌨️ Desktop Keyboard & Interactive Controls

| Keyboard Shortcut | Simulated Outcome | Description |
| :--- | :--- | :--- |
| `Enter` | Fast-forward to Dashboard | Bypasses loading duration for instant demo testing |
| `1` | Outcome A (Verified Session) | Triggers routing to Store Command Center |
| `2` | Outcome B (Pending Audit) | Triggers routing to Onboarding Audit Status |
| `3` | Outcome C (Unauthenticated) | Triggers routing to Partner Mobile Login |
| `R` / `r` | Retry Connection | Retries network handshake and session evaluation |
| `M` / `m` | Maintenance Mode | Toggles scheduled maintenance fallback state |

---

## 🔒 Security & Privacy Guidelines
- No tokens, secret keys, or raw `AsyncStorage`/`localStorage` strings are shown in the UI.
- All session verification is handled asynchronously with encrypted transport badges.
