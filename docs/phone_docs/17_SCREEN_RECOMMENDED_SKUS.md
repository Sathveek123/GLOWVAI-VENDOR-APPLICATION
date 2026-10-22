# 📱 Mobile Screen 17: AI Recommended SKUs

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/recommended-skus.tsx`
- **Route URL**: `/(vendor)/recommended-skus`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Explainable AI cosmetics inventory demand recommendation engine for store owners deciding what SKUs to stock. Analyzes local neighborhood beauty order trends (Benz Circle, Vijayawada), category gaps, and estimated profit margins without guaranteeing demand or profit.

---

## 🎨 Visual Design & UI System
- **Header**: Title `"Recommended for your store"`, store locality badge `Benz Circle, Vijayawada`, date range `Based on recent 30-day demand`.
- **Explainability Card**: `"Why these products?"` card listing 3 concise demand signals (local order search volume, category gap, 32% avg profit margin).
- **Recommendation Cards**: Accentuated with violet-indigo AI badge (`#6366F1`), confidence level (`High Confidence 88%`), demand velocity, estimated margin, and `"1-Tap Add to Store Catalog"` CTA.

---

## ⚡ Key Features & Data Flow
- **1-Tap Import**: Invokes `inventoryApi.addRecommendedSku(sku)` to instantly seed item into store catalog.
- **Reversible Action**: Allows vendors to undo recommendation addition within 5 seconds.
- **Explainability Modal**: Tapping `"How recommendations work"` opens a transparent plain-language modal explaining data sources (search queries, local category velocity).

---

## ♿ Edge & Lifecycle States
- **Already Stocked**: Displays grey tag `"In Catalog (Stock: 18)"` and disables duplicate import.
- **Uncertainty Warning**: Shows amber tag `"Moderate Confidence — Low local search volume"`.
