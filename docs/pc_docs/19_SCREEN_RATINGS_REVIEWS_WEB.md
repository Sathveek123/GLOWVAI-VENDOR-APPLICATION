# 💻 PC / Web Screen 19: Ratings & Customer Reviews Workspace

## 📍 File & Web Route Specification
- **Expo React Native Route**: `mobile/app/(vendor)/reviews.tsx`
- **Standalone Web App View**: `web/index.html` (View ID: `#page-reviews`)
- **Documentation**: `docs/pc_docs/19_SCREEN_RATINGS_REVIEWS_WEB.md`
- **Target Desktop Grid**: 1440×1024 Desktop Reference Frame (1200px max-width container, 2-column layout)
- **Primary Color Palette**: Warm Off-White `#F8FAFC`, White `#FFFFFF` Cards, Royal Blue `#1D4ED8` Primary CTA, Emerald `#16A34A` Verified/Positive Indicators, Amber `#D97706` Needs Reply / Attention, Red `#DC2626` Rejection / Violation.

---

## 🎯 Purpose & Merchant Quality Analytics System
A constructive, data-informed merchant feedback workstation for beauty retailers on GlowVAI. Provides store quality metrics, rating trend analytics, category performance benchmarks (Product quality, Packaging, Order accuracy, Delivery readiness), and a professional merchant reply thread with automated policy safety guards against personal customer contact leakage.

---

## 🎨 Key Features & UI Components

1. **Header & Navigation**:
   - Breadcrumbs: `Home / Ratings & reviews`
   - Page Title: "Ratings & reviews" with `✓ 100% Verified Customer Orders` pill.
   - Date range selector: `📅 Last 30 Days ▾` (Supports 7d, 30d, 90d, custom).
   - Desktop Left Navigation Rail with `⭐ Reviews` item highlighted.

2. **Dynamic Wide Summary Card**:
   - Dynamically calculated overall average rating (e.g. `4.88 / 5.0`).
   - Total verified rating count (e.g. `128 verified customer ratings`).
   - Period comparison pill: `▲ +0.12 vs previous 30d`.
   - 4 Category Quality Benchmarks with numeric values, review counts, and progress bars:
     1. *Product Quality*: 4.9 / 5.0 (112 reviews)
     2. *Packaging Integrity*: 4.8 / 5.0 (98 reviews)
     3. *Order Accuracy*: 4.9 / 5.0 (124 reviews)
     4. *Delivery Readiness*: 4.7 / 5.0 (105 reviews)

3. **Rating Movement Trend Section**:
   - Selectable metrics: `Overall`, `Product quality`, `Packaging`, `Order accuracy`.
   - View Switcher: Toggle between interactive **Chart View** (weekly rating movement bars) and **Table View** (columns: Period, Average Rating, Verified Reviews, Movement direction).

4. **Review Filter Toolbar with Clear Counts**:
   - Filter chips: `All (128)`, `Unreplied (14)`, `5 star (98)`, `4 star (22)`, `3 star and below (8)`, `Product quality (112)`, `Packaging (98)`, `Order accuracy (124)`.

5. **Desktop Review Table / Cards Workspace**:
   - Customer First Name & Privacy-Safe Marker (e.g., `Priya S.`), Order ID tag (`#GV-9908`), Product Name, Star Rating, Review Excerpt, Category Tag, and Status (`Needs Reply` / `🟢 Live Public Reply` / `⏳ Pending Moderation` / `❌ Rejected`).
   - Action Button: `💬 Reply to Customer →` or `View Reply`.

6. **Merchant Reply Composer Modal / Drawer**:
   - Full review text & rating breakdown display.
   - Character count guidance: `142 / 500 characters`.
   - Prohibited Content Reminder Banner: *"Do NOT include phone numbers, email addresses, external URLs, UPI handles, or personal customer details in public replies."*
   - Contact detail regex guard that blocks phone numbers, emails, links, or UPI IDs before posting.
   - Actions: `Save Draft` (persists locally) and `Post Reply →` (Royal Blue CTA).

7. **System Edge States**:
   - Loading Skeletons for summary metrics and cards.
   - Network failure banner with retry action.
   - Empty state for no unreplied reviews (`🎉 All customer reviews have been answered!`).
   - Moderation Pending state (`⏳ Pending Moderation`).
   - Rejected Reply state (`❌ Rejected by moderation: Contained contact details`).
   - Permission Denied state (`🔒 Permission Error: Store Operator role does not have reply privileges`).
