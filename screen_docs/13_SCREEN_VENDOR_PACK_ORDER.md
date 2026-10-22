# 📱 Screen Documentation: Packing & Pickup Bay Assignment Screens

## 📍 File & Component Location
- **Pack Order Screen**: `mobile/app/(vendor)/pack-order.tsx` (`/(vendor)/pack-order`)
- **Ready for Pickup Screen**: `mobile/app/(vendor)/ready-pickup.tsx` (`/(vendor)/ready-pickup`)

---

## 🎯 Purpose & Behavior

### Pack Order Screen (`pack-order.tsx`)
- Allows picker to select the physical pickup bay (`Bay-01`, `Bay-02`, `Bay-03`) where the packed order bag is placed.
- Triggers `PATCH /api/orders/:orderId/pack` with `{ pickupBay: "Bay-01" }`.

### Ready for Pickup Screen (`ready-pickup.tsx`)
- Displays live delivery rider details once a rider accepts the dispatch request:
  - Rider Name (e.g. *Kalyan V.*), Phone Number, Vehicle Number, ETA.
- Features a **"Handover & Verify OTP"** button (`PATCH /api/orders/:orderId/deliver`).
