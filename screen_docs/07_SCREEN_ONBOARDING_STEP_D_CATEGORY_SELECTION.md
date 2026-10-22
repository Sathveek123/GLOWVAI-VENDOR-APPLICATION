# 📱 Screen Documentation: Onboarding Step D — Category Selection & Initial Stock Setup

## 📍 File & Component Location
- **File Path**: `mobile/app/(onboarding)/step-d.tsx`
- **Route URL**: `/(onboarding)/step-d`

---

## 🎯 Screen Purpose & Behavior
Allows dark store operators to select product categories they stock (Serums, Sunscreens, Cleansers, Haircare, Groceries) and seed their initial inventory catalog.

---

## 🎨 Layout & Category Grid
- **Multi-Select Category Chips**: Serums, Face Wash, Sunscreen, Moisturizer, Groceries, Personal Care.
- **Initial Inventory Quick-Seed**: Pre-populates popular regional SKUs (Minimalist 10% Niacinamide, CeraVe Hydrating Cleanser, Re'equil SPF 50, Aashirvaad Atta).
- **Submit Application Button**: *"🚀 Submit Dark Store Application"*.

---

## ⚡ Submission Handler
Calls `POST /api/onboarding/submit` on the backend, registers the store, and navigates to `/(onboarding)/pending` or `/(onboarding)/approved`.
