# 📱 Mobile Screen 07: Step 4 - Catalog Categories & Seed Selection

## 📍 File & Route Specification
- **File Path**: `mobile/app/(onboarding)/step-d.tsx`
- **Route URL**: `/(onboarding)/step-d`
- **Access Level**: Authenticated Onboarding Merchant (Step 4 of 4)

---

## 🎯 Purpose & Business Logic
Final onboarding step allowing merchants to select store cosmetics categories (Skincare, Makeup, Hair care, Fragrance, Bath & Body) and seed their initial store inventory catalog from fast-moving SKU templates.

---

## 🎨 Visual Design & UI System
- **Stepper Progress Bar**: `Step 4 of 4 (100%)`.
- **Category Chips**: Multi-select filter chips with active Royal Blue states (`#1D4ED8`).
- **Seed SKU Cards**: Product cards with thumbnail, brand, shade/variant, MRP, selling price, and toggle check.

---

## ⚡ Key Features & Data Flow
- **Bulk Seed Import**: 1-tap select all top SKUs to seed store catalog.
- **Submit Onboarding Dossier**: Sends complete onboarding payload to backend `onboardingApi.submitDossier()`.
- **Navigation**: Redirects to `/(onboarding)/pending` upon successful submission.

---

## ♿ Edge & Lifecycle States
- **No Categories Selected**: Prompts vendor `"Please select at least 1 product category."`
- **Submission Error**: Retains selected SKUs and offers `"Retry Submission"` action.
