# 💻 PC / Web Screen 17: AI Recommended SKUs & Demand Insights

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/recommended-skus.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-recommended-skus`)
- **Documentation**: `docs/pc_docs/17_SCREEN_RECOMMENDED_SKUS_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, 2-column layout)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary, Violet-Indigo `#4F46E5` / `#EEF2FF` AI Insights Accent, Emerald `#16A34A` Margin Signals, Amber `#D97706` Uncertainty.

---

## 🎯 Purpose & Merchant Intelligence System
Explainable, commercially grounded AI catalog expansion workstation for beauty retailers managing store inventory. Helps merchants identify high-converting hyper-local demand gaps in their locality (`Benz Circle, Vijayawada`) without misleading sales guarantees.

---

## 🎨 Key Features & UI Components

1. **Header & Navigation**:
   - Breadcrumbs: `Catalog / Recommendations`
   - Page title: "Recommended for your store"
   - Locality tag: `📍 Benz Circle, Vijayawada`
   - Data freshness timestamp: `Updated 10 mins ago • Model v2.4`
   - AI Insights badge: `✨ AI Insights`

2. **"Why these products?" Explanatory Banner**:
   - Spans top content container with 3 evidence categories:
     1. **Local Order Trends**: High customer search volume in 5km radius.
     2. **Catalog Gaps**: Missing high-demand beauty SKUs currently unfulfilled by nearby stores.
     3. **Estimated Margin**: 20%–28% net merchant payout margins.
   - Includes `"How recommendations work"` link opening data source methodology modal.

3. **Filter Toolbar**:
   - Category pills: `All`, `Skincare`, `Makeup`, `Hair care`, `Fragrance`, `Highest Demand`, `Highest Margin`.

4. **Recommendation Matrix Cards**:
   - Product Thumbnail, Brand Name, Product Title, Variant Pill.
   - Estimated monthly demand: `About 140 nearby orders/month`.
   - Potential margin: `Estimated 22% Margin`.
   - Confidence tag: `⚡ 94% High Demand Signal`.
   - Suggested starting stock: `Suggested start: 12 units`.
   - Reversible primary CTA: `+ Add to store inventory` -> transitions to `✓ Added to catalog (0 Stock staged)` with `Set Stock →` and `Undo` options.
   - Existing SKU handling: Displays `Already in catalog (Update Stock) →`.

5. **Right Side AI Insight Drawer**:
   - Selected SKU breakdown: Monthly demand trend, price band (`₹499 – ₹549`), comparable local product (`Minimalist 10% Niacinamide`), stock risk analysis, margin assumptions, and commercial disclaimer.

6. **Commercial Transparency Disclaimer**:
   - Prominent disclaimer box: *"GlowVAI provides actionable recommendations to assist inventory decisions but does not guarantee specific sales velocity or net revenue."*

7. **System Edge States**:
   - Loading skeletons, stale insights banner, limited local data notice, network error handling, empty filter states, and toast notifications with undo capability.
