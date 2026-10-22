# Feature 03: Order queue and picking

**Status:** the queue and picking screens are built on the mobile app and the web command centre. Live orders depend on the backend.
**Screens:** [Mobile: home and orders](../mobile/04-home-and-orders.md), [Web: command centre and orders](../web/03-command-center-and-orders.md)

## What it does

Incoming quick-commerce orders arrive at the store. The vendor accepts (or rejects), picks each item from its shelf bin, packs it, and marks it ready for a rider.

## Order lifecycle

Order statuses are defined in `mobile/src/store/useVendorStore.ts`:

```
PENDING → ACCEPTED → PREPARING → PACKED → READY_FOR_PICKUP → DISPATCHED → DELIVERED
   └──────────────────────────────────────────────────────────→ CANCELLED
```

Each transition has a backend endpoint:

| Transition | Endpoint |
|---|---|
| Accept / reject | `PATCH /api/orders/:orderId/accept`, `/reject` |
| Prepare | `PATCH /api/orders/:orderId/prepare` |
| Pack | `PATCH /api/orders/:orderId/pack` |
| Ready for rider | `PATCH /api/orders/:orderId/ready` |
| Handover | `PATCH /api/orders/:orderId/handover` (see [Feature 04](04-packing-and-rider-handover.md)) |
| Dispatch / deliver | `PATCH /api/orders/:orderId/dispatch`, `/deliver` |
| Cancel / timeout | `PATCH /api/orders/:orderId/cancel`, `/timeout` |

## Screens and tabs

- **Home** (`home.tsx`): counts by status, a "Stock attention" list, the store-quality score, the updates feed, and a Pause Store Deliveries control with a reason picker.
- **Orders** (`orders.tsx`): tabs for All, New Offers, In Packing, Ready Pickup, Completed, and Cancelled. Search by order ID, customer, or SKU. Sort and date range.
- **Order detail** (`order-detail.tsx`): customer and locality (not full address), the picking list with a checkbox per item, shelf-bin filter, item unavailable (with a substitution suggestion), and the order financial summary.

## Incoming order alert

A new order opens an incoming-order modal with a countdown. The socket event is `order:incoming`. The sound and vibration are in `mobile/src/services/sound.ts`.

## Picking rules

- The picking list comes from the order record in the store, not from sample data.
- Confirm picking is disabled while the list is empty or a request is in flight.
- An item that cannot be found is marked unavailable. The vendor can suggest a substitute, which the customer must approve through chat ([Feature 09](09-chat-support-and-notifications.md)).

## Known gaps

- The orders list shows a fixed sample SLA timer ("SLA: 04:15 remaining") until the backend sends timing data.
- The web order board has an "Export CSV" button. Nothing is wired to it yet.
- Home can stall after the realtime connection is made. See [Feature 12](12-realtime-and-offline-behaviour.md).
