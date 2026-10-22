# Mobile screens 05: packing and handover

**Covers:** `mobile/app/(vendor)/pack-order.tsx`, `mobile/app/(vendor)/ready-pickup.tsx`
**Feature docs:** [Feature 04: packing and rider handover](../features/04-packing-and-rider-handover.md)

| Screen | Production | Development |
|---|---|---|
| Pack order | Coming soon (placeholder) | Full screen |
| Ready for pickup | Live | Live, with an edge-state strip |

## Pack order (`pack-order.tsx`)

**Title:** "Packing and rider handover workstation". The screen is wrapped with `withComingSoon`, so production shows the placeholder.

- **Packing verification table:** a large checkbox per item for staff.
- **Tamper seal serial number** and a *Seal confirmation* step.
- **Shelf and order details:** customer first name and locality.
- **Actions:** *Mark ready for rider →* and *Return to command center →*.
- **States:** variant mismatch, quantity mismatch, tap to verify.

## Ready for pickup (`ready-pickup.tsx`)

**Title:** "Ready for pickup". Pickup bay shown (for example `Bay-01`).

- **Pickup PIN:** a 4-digit code labelled "Show this code only to assigned rider". The code comes from the order record only.
- **Rider details:** name, vehicle, ETA, status ("Arrived" or "Dispatched").
- **Enter PIN:** a numeric box. The app checks the PIN against the order before it sends the handover.
- **Action:** *Confirm handover →*. On success the screen shows "Handover confirmed & dispatched".
- **Failure messages:** invalid code, pickup PIN unavailable (do not hand over), rider delayed, reassigned, QR scan failure, network loss, duplicate.
- **Customer line:** first name and locality only ("Privacy safe").
- **Development strip:** "Test rider handover edge states", gated behind `__DEV__`. Its messages include the test PIN text; they never render in production.

## Known gaps

- PIN check runs on the device. Move it to `PATCH /api/orders/:orderId/handover` on the server.
- The rider, vehicle, and ETA details are sample data until dispatch is connected.
- QR scanning is not wired; the screen takes a typed PIN.
