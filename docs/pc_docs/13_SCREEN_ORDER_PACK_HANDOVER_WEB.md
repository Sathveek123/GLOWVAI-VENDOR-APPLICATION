# 💻 PC / Web Screen 13: Order Packing & Rider Handover (Web)

## 📍 File & Web Route Specification
- **File Path**: `web/index.html` (View: `#page-orders`)
- **Web URL**: `/orders/pack` or `index.html#orders`
- **Target Viewports**: 1024px, 1280px, 1440px, 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
Desktop packing verification and rider handover console. Displays packing checklist, bag sealing verification, rider ETA tracking, and a large printable 4-digit handover QR code.

---

## 🎨 PC / Web Desktop Layout Grid
- **2-Column Packing Workspace**:
  - *Left Column*: Packing item checklist with shelf locations (`📍 A-01-05`) + tamper-evident seal checkbox.
  - *Right Column*: Rider pickup status card (Rider name, EV vehicle number, live ETA) + Large high-contrast Handover QR Code & 4-digit code (`CODE: 4892`).

---

## ⚡ Web Events & Printable QR
- Printable dispatch slip button triggers clean thermal label printing.
- Listens for Socket `RIDER_ARRIVED` notification to alert store manager.
