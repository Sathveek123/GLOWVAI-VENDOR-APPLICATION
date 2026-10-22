# 📱 Screen Documentation: Push Notifications & Admin Supervisor Consoles

## 📍 File & Component Location
- **Notifications Screen**: `mobile/app/(vendor)/notifications.tsx` (`/(vendor)/notifications`)
- **Mobile Supervisor Admin Screen**: `mobile/app/admin.tsx` (`/admin`)
- **Web Enterprise Admin Console**: `docs/index.html` (Web Portal)

---

## 🎯 Purpose & Behavior

### Notifications Screen (`notifications.tsx`)
- Displays chronological list of incoming order alerts, stock warning alerts, and system broadcasts.
- Tapping a notification marks it as read (`PATCH /api/notifications/:id/read`).

### Mobile Supervisor Admin Screen (`admin.tsx`)
- High-level mobile monitoring tool for multi-store supervisors.
- Features multi-store overview metrics, vendor duty toggles, and live order push simulator.

### Enterprise Admin Web Console (`docs/index.html`)
- Standalone HTML5/ES6 web console hostable on GitHub Pages.
- Directly syncs with Firebase RTDB (`glowvai-v2`).
- Capabilities: Multi-vendor dossiers, live stock matrix steppers, 1-tap quick commerce order simulator, 88/12 payout split ledger, and 1-click database JSON export backup.
