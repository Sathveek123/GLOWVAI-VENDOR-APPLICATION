# 📱 Screen Documentation: Root Splash & Routing Screen

## 📍 File & Component Location
- **File Path**: `mobile/app/index.tsx`
- **Route URL**: `/`
- **Access Level**: Public (Initial Entrypoint)

---

## 🎯 Screen Purpose & Behavior
The Root Splash screen serves as the primary router and authentication state evaluator when the app launches. It displays the GlowVAI branding, checks local session storage for vendor credentials (`vendorId`, `kycStatus`), and automatically redirects the user to the appropriate screen:
1. **Authenticated & Approved Vendors** → Redirects to `/ (vendor)/home`
2. **Onboarding Pending Vendors** → Redirects to `/ (onboarding)/pending`
3. **Unauthenticated / New Users** → Redirects to `/ (auth)/login`

---

## 🎨 UI Components & Layout
- **Container**: Dark Obsidian Gradient background (`#0B0F19` to `#161C2E`).
- **Brand Hero**: Animated GlowVAI logo badge with subtle glowing aura (`rgba(99, 102, 241, 0.35)`).
- **Subtitle**: *"Real-Time Dark Store Operator App"*.
- **Activity Indicator**: High-contrast indigo loading spinner (`#6366F1`).

---

## ⚡ State Management & Hooks
- **`useVendorStore`**: Retrieves `vendorId`, `storeId`, `isOnline`.
- **`AsyncStorage`**: Reads `glowvai_vendor_session` token.
- **`useEffect` Execution Flow**:
  1. Checks storage token.
  2. Ping backend `/api/vendor/:vendorId` to verify active status.
  3. Executes `router.replace(...)` after 1.2 seconds.
