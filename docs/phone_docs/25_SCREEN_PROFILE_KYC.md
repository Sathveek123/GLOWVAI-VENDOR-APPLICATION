# 📱 Mobile Screen 25: Store Profile & KYC Dossier

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/profile.tsx`
- **Route URL**: `/(vendor)/profile`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Structured merchant identity and compliance hub. Manages store details, 7-day operating schedules, 6-document KYC verification dossier, settlement bank account summary link, and session logout safety.

---

## 🎨 Visual Design & UI System
- **Profile Header Card**: Store logo avatar (`📸 Edit Photo`), Store Name `Sri Lakshmi Beauty Store`, Store ID `DS-VIJ-01`, rating badge `4.96 ⭐ (128 reviews)`, member-since date `Aug 2024`, and live duty status pill `🟢 Open`.
- **4 Accessible Tabs**:
  1. **🏪 Store**: Merchant identity & physical address form (Store Name, Owner Name `Priya Ramanujan`, Phone, Email, Locality `Benz Circle`, City `Vijayawada`, Pincode `520010`) with `Save Profile Changes` CTA.
  2. **⏰ Hours**: 7-day operating schedule editor (Mon – Sun), open/close time pickers, **"Copy Mon to All"** bulk action button, special closure exception list (`Deepavali Festival Store Holiday`), and live preview sentence (`ℹ️ Live Preview: Customers can order today until 11:00 PM.`).
  3. **📜 KYC**: Verification progress bar (`4 of 6 Documents Verified (83%)`), document cards (GSTIN, PAN, FSSAI License `⚠️ Expiring in 28 Days`, Trade License, Geo-Fence Coordinates), **Timed Reveal Action** (10s auto-remasking), and file upload modal (`PDF, PNG, JPG up to 5MB`).
  4. **🏦 Bank**: Payout bank summary (`HDFC Bank ••••••4589`, IFSC `HDFC0001234`) with shortcut link to Screen 24 (`Manage Bank Account & UPI Details (Screen 24) →`).
- **Danger Zone**: Red `Log out of GlowVAI Vendor` button triggering a session logout confirmation modal.

---

## ⚡ Key Features & Data Flow
- **Timed Reveal Security**: Tapping `Reveal` shows unmasked tax/identity numbers (`37AAAAA00001Z5`) and automatically re-masks after 10 seconds.
- **Schedule Bulk Copy**: Applies Monday operating hours to all 7 days with 1 tap.
- **Malware Scanning Simulation**: Simulates file validation and malware scanning on document upload.

---

## ♿ Edge & Lifecycle States
- **Unsaved Changes**: Displays amber warning banner `"⚠️ You have unsaved profile changes. Tap Save Changes to apply."`
- **Session Expired**: Triggers modal `"🔒 Session Expired — Please log in again."` and redirects to `/(auth)/login`.
