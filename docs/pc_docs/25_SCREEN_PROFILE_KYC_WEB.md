# 💻 PC / Web Screen 25: Store Profile & KYC Dossier (Web)

## 📍 File & Web Route Specification
- **Mobile/Expo Route**: `mobile/app/(vendor)/profile.tsx`
- **Web App View**: `web/index.html` (View: `#page-profile-kyc`)
- **Web URL**: `/settings/profile` or `index.html#profile-kyc`
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
The GlowVAI Vendor Store Profile & KYC Dossier workspace manages dark store identity, 7-day operating hours, special holiday closures, verified beauty retail licenses, and provides a real-time live customer storefront preview.

### Key Desktop Workflows:
1. **Wide Desktop Profile Header Card**:
   - Store logo/avatar image uploader with camera badge
   - Store name `"Sri Lakshmi Beauty Store"`
   - Store ID `"DS-VIJ-01"`
   - Locality & City (`Benz Circle, Vijayawada`)
   - Dynamic rating & reviews count (`4.96 ⭐ (128 reviews)`)
   - Member-since date (`Partner since Aug 2024`)
   - Live store status indicator (`🟢 Store Open`)
   - Save status badge (`✓ Saved`), `"Edit Profile"`, and account menu
2. **Four Accessible Workspace Tabs**:
   - **🏪 Store Tab**: Structured two-column form for registered owner name, primary phone (+91), email address, store description, street address, locality, city, pincode, unsaved-changes protection, and Save Profile CTA.
   - **⏰ Hours Tab**: 7-day operating schedule table (Mon–Sun) with opening/closing controls, `"Copy Monday to selected days"` action, special closures/holiday exceptions log, and live customer preview sentence (`"🟢 Customers can order today until 11:00 PM."`).
   - **📜 KYC Tab**: Verification progress card (`5 of 7 documents verified (83%)`), document table displaying document kind, masked reference number (`37AAAAA****1Z5`), status pill (`VERIFIED`, `PENDING_REVIEW`, `EXPIRING_SOON`, `REJECTED`, `REPLACEMENT_REQUIRED`, `UPLOAD_PROCESSING`, `UNAVAILABLE`), expiry date, and actions. Expiring-license alert banner, drag-and-drop file upload zone (PDF/PNG/JPG up to 5MB with malware scanner), 256-bit AES encryption privacy disclaimer, and timed reveal with 10-second auto-remasking for sensitive values.
   - **🏦 Bank Tab**: Concise verified payout bank summary (`HDFC Bank ••••••4589`, IFSC `HDFC0001234`, UPI `glow••••@hdfcbank`) with direct link to Screen 24 (`bank-edit.tsx`).
3. **Right Sticky Customer Live Preview Card**:
   - Displays real-time mobile customer storefront preview with store cover photo, rating badge (`★ 4.96 (128 ratings)`), category, and `"🟢 Open Now · Delivers in 15 mins (Benz Circle)"` badge.
4. **Separated Danger Zone Area**:
   - Red-bordered card at bottom with `"Log Out of GlowVAI Vendor"` action.
   - Opens confirmation dialog explaining session invalidation and live order broadcast pause.

---

## 🎨 Color Palette & Typography Tokens
- **Canvas Background**: Warm Off-White `#F8FAFC`
- **Section Cards**: White `#FFFFFF` with subtle shadows and `#E2E8F0` borders
- **Primary CTA**: Royal Blue `#1D4ED8`
- **Verified Status**: Emerald Green `#16A34A` / `#DCFCE7`
- **Expiring / Action Needed**: Amber Gold `#D97706` / `#FEF3C7`
- **Danger Zone / Rejected**: Red `#DC2626` / `#FEF2F2`

---

## 🛡️ Shared Desktop UX Rules (Screens 21–25 Compliance Summary)
1. **Authenticated Shell**: Unified navigation rail, header bar, connection status, notifications, and quick jump dropdown across all 25 screens.
2. **Desktop Spatial Advantage**: Multi-column grids, split panels, side drawers, sticky previews, and print-ready PDF/CSV export routines.
3. **Backend-Authoritative Calculations**: Financial ledgers (88% net / 12% platform fee), GST 18%/5% tax calculations, TCS 1%, and TDS 1% computed from server order logs.
4. **Masking by Default**: Full bank account numbers (`••••••4589`), VPA handles (`glow••••@hdfcbank`), GSTINs (`37AAAAA****1Z5`), and PANs (`ABCDE****F`) strictly masked by default.
5. **Bank Change Security**: Requires SMS OTP, paste-blocked confirmation fields, IFSC lookup, explicit confirmation, and 24-hour verification cooling hold.
6. **Form Draft & Unsaved-Change Protection**: Unsaved banner warnings prevent accidental navigation loss.
7. **Complete Edge States**: Loading skeleton, empty state, offline banner, error alert, permission denied notice, and session expiration modal on every screen.
8. **Production Security Integrity**: Zero test OTPs, raw tokens, or unmasked credentials shipped to production.
