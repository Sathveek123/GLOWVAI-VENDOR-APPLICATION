# 💻 PC / Web Screen 04: Store Information & GPS Pinning (Step 1/4)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-onboarding-a`)
  - Expo Web / Mobile React Native: [`mobile/app/(onboarding)/step-a.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/step-a.tsx)
- **Web URL**: `/onboarding/step-a` or `index.html#onboarding-a`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop onboarding Step 1 for registering physical beauty store identity, operating hours, and precise dark store GPS coordinates for 10-minute quick-commerce delivery. Features:
- **Professional Onboarding Shell Header**: GlowVAI logo mark, "Secure Merchant Onboarding" label, draft save status indicator (`✓ Saved at 10:12 PM`), and 24/7 support link (`Need help? Contact Support`).
- **Four-Step Horizontal Progress Tracker**: 4-step progress tracker (`1 Store`, `2 Documents`, `3 Bank`, `4 Catalog`) with `1 Store` highlighted in Royal Blue (`#1D4ED8`).
- **Two-Column Content Grid (1200px Max-Width Container)**:
  - *Left Column*: "Store identity" card (Store name & Owner name together; Locality, City, and Pincode grouped in 3 columns) + "Business hours" card with opening/closing time controls, weekly schedule preview badge, and dispatch availability note.
  - *Right Column*: "Store location" map card with search address input, "Use my current location" GPS button, location accuracy badge, Leaflet map canvas with draggable pin, address summary, secondary technical Lat/Lng area, permission-denied fallback alert, and "Why we need this" explanation.
- **Sticky Bottom Action Bar**: "Back" secondary button, "Save draft" link button, and primary CTA "Continue to documents →" with step counter ("Step 1 of 4").

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Shell Header** | Fixed Top Bar (`#FFFFFF`) | GlowVAI lettermark (`G`), secure onboarding badge, draft status pill (`✓ Saved at 10:12 PM`), support link |
| **Progress Tracker** | 4 Horizontal Step Bars | `1 Store` active in Royal Blue (`#1D4ED8`), remaining steps in slate gray |
| **Form Container** | 1200px Widescreen Container | 2-column grid layout on viewports `>= 1024px` |
| **Left Column Cards** | Store Identity + Business Hours | Store/Owner name row, Locality/City/Pincode 3-column row, operating hours inputs & schedule preview |
| **Right Column Card** | Store Location GPS Map Card | Interactive Leaflet map canvas, draggable pin, address search bar, lat/lng technical area, why-we-need-this box |
| **Sticky Action Bar** | Persistent Bottom Bar (`#FFFFFF`) | Left: `← Back` + `💾 Save draft`; Right: `Continue to documents →` (Step 1 of 4) |

---

## ⚡ Web State & Form Validation Rules
- **Form Validation**:
  - Missing Store Name / Owner Name: Displays inline red warning banner (`⚠️ Store name is required`).
  - Pincode: Validates 6-digit numeric constraint (`/^\d{6}$/`).
  - Business Hours: Validates conflicting open/close times (`Closing time must be after opening time`).
- **Draft Persistence**: Auto-saves form progress into local storage key `onb_step_a` and provides manual `Save draft` action.


