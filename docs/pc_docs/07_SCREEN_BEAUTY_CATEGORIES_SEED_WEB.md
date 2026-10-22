# 💻 PC / Web Screen 07: Beauty Categories & Catalog Seed — Choose What You Sell (Step 4/4)

## 📍 File & Web Route Specification
- **Implementation File Paths**: 
  - Standalone Desktop Web App: [`web/index.html`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/web/index.html) (View ID: `#page-onboarding-d`)
  - Expo Web / Mobile React Native: [`mobile/app/(onboarding)/step-d.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/step-d.tsx)
- **Web URL**: `/onboarding/step-d` or `index.html#onboarding-d`
- **Target Viewports**: 1440×1024 Desktop Reference Grid, 1280px Laptops, 1024px Compact Breakpoint, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop merchant onboarding final step for choosing beauty specialties, seeding initial quick-start product catalog stock, and submitting the store application for compliance review:
- **Onboarding Header Shell**:
  - GlowVAI logo badge, merchant onboarding title, draft auto-save indicator (`✓ Draft saved at 10:35 PM`), support help trigger (`Need help? 💬`).
  - 4-step horizontal progress tracker bar (`1 Store ✓`, `2 Documents ✓`, `3 Bank ✓` all completed in Royal Blue/Emerald, `4 Catalog` active in Royal Blue).
- **Two-Column Desktop Grid Layout (1200px Max Content Width)**:
  - **Left Column (5/12 Width)**:
    - **Store Specialties Card**:
      - 6 Selectable Category Tiles: Skincare 🧴, Makeup 💄, Hair care 💇‍♀️, Fragrance ✨, Bath & body 🧼, Tools ✂️.
      - Each tile features icon, title, 1-line description, accessible focus state rings, and selected state with Royal Blue outline, filled checkmark badge (`✓`), and selected-count summary badge (`2 Selected`).
  - **Right Column (7/12 Width)**:
    - **Quick-Start Products Workspace**:
      - Category filter chips (`All SKUs`, `Skincare`, `Makeup`, etc.), search filter bar, and bulk toolbar actions (`Select all visible`, `Clear`).
      - Pre-seeded popular beauty SKUs (Minimalist 10% Niacinamide, Cetaphil Gentle Cleanser, Maybelline Fit Me Foundation, L’Oréal Paris Serum, Plum Body Mist, Real Techniques Sponge).
      - Product details row showing thumbnail icon, brand, name, size variant, suggested category, selling price vs MRP, and selection checkbox.
      - Inline **Stock Stepper** (`- [5] +`) that appears automatically upon SKU selection to set starting dark store inventory.
      - Helper banner: `💡 These are starter suggestions. Review availability and stock before submitting.`
- **Interactive Demo Catalog Edge State Switcher Bar**:
  - Quick toggles to preview edge cases: **Default State**, **Seeding Progress**, **No Search Results**, **API Failure**, **Offline Mode**, and **Duplicate SKU Alert**.
- **Pre-Submission Confirmation Dialog Modal**:
  - Pops up when clicking CTA, displaying summary of selected categories count, selected SKU count, total starting stock units, 24-hour audit SLA target, and "Confirm & Submit" vs "Review Catalog" buttons.
- **Persistent Bottom Action Bar**:
  - Left actions: `← Back to bank setup` + `💾 Save draft` button.
  - Right action: Primary CTA button (`Submit store for review →`) displaying live summary (`2 categories • 3 products (23 units) • Step 4 of 4`).
- **Explicit Review Routing**:
  - Upon submission, updates status to `'pending'` and routes merchant to the compliance review screen ([`mobile/app/(onboarding)/pending.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/pending.tsx)).

---

## 🎨 PC / Web Desktop Layout Grid & Visual System

| Layout Element | Design Token / Specification | Desktop Details |
| :--- | :--- | :--- |
| **Top Shell Header** | White card (`#FFFFFF`) with 1px border | Max-width `1200px`, 4-step horizontal progress tracker with Royal Blue active indicator |
| **Category Tiles Grid** | 1-Column Cards inside 5/12 Left Col | Interactive cards with icon, description, checkmark badge, and Royal Blue outline when selected |
| **Starter SKU List** | Clean Flex Rows inside 7/12 Right Col | Product icon, name, brand, size, selling price, MRP, selection checkbox, and `- [5] +` numeric stock stepper |
| **Bottom Action Bar** | Fixed Bottom Bar (`#FFFFFF`) | Back link + Save draft button on left, Royal Blue primary CTA (`Submit store for review →`) on right |

---

## ⚡ Web State Management & Submission Routing
- Saves selected categories and SKU stock counts to `onb_step_d` storage key.
- Updates `vendor_onboarding_status` to `'pending'`, `vendor_registered` to `'true'`, and issues `'TOKEN_VND_AUTH_VERIFIED'` session token.
- Seamlessly transitions to [`mobile/app/(onboarding)/pending.tsx`](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/mobile/app/%28onboarding%29/pending.tsx).
