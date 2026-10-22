# Feature 04: Packing and rider handover

**Status:** the screens are built. The PIN check currently runs on the device and must move to the server.
**Screens:** [Mobile: packing and handover](../mobile/05-packing-and-handover.md), [Web: packing and handover](../web/03-command-center-and-orders.md)

## What it does

After picking, the packer confirms each item, seals the bag, and shows a pickup PIN. The rider enters the PIN to take the parcel. Entering the right PIN is the proof of handover.

## Steps

1. **Pack** (`pack-order.tsx`). Tick each item as it is checked, record the tamper-seal serial, confirm seal, then mark ready for rider.
2. **Ready for pickup** (`ready-pickup.tsx`). Shows a 4-digit PIN ("show this code only to assigned rider"), the rider's details, and the pickup bay.
3. **Confirm handover.** The rider enters the PIN. The app checks it, then calls `PATCH /api/orders/:orderId/handover` (through `ordersApi.dispatch`, which sends the PIN as `otp`).

## Rules

- The expected PIN comes only from the order record. There is no fallback constant.
- If the order has no PIN, the screen says the parcel must not be handed over.
- A wrong PIN shows "Ask the rider to check the code again" and does not dispatch.
- The web packing screen used to display the test PIN `4892`. It now shows empty PIN boxes and asks the rider for the code. The web confirm button still does not check a PIN; that check must be built on the server.

## Edge states

The packing and handover screens have an edge-state strip (rider delayed, reassigned, QR failure, network loss, duplicate, invalid code). The strip and its states render only in development builds (`__DEV__`).

## Known gaps

- **PIN verification must move to the server.** Right now the device compares the entered PIN with the PIN it received. Anyone who can read the order payload can read the PIN.
- The error text in the dev-only edge state for an invalid code includes the test PIN `4892`. It is not shown in production, but it should be removed.
- The mobile packing screen is wrapped in the "Coming soon" view in production builds.

## Related

- [Feature 03](03-order-queue-and-picking.md) for the order lifecycle.
- [Known issues in the README](../../README.md#known-limitations).
