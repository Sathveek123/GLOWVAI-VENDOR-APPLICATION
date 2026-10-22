# Mobile screens 04: home, orders and order detail

**Covers:** `mobile/app/(vendor)/home.tsx`, `orders.tsx`, `order-detail.tsx`
**Feature docs:** [Feature 03: order queue and picking](../features/03-order-queue-and-picking.md), [Feature 12: realtime](../features/12-realtime-and-offline-behaviour.md)

All three are live in production, and all three read from the order store. Their numbers depend on the backend.

## Home (`home.tsx`)

**Title:** "Vendor console" (top bar), with the store name and store ID.

- **Order counts** derived from the store (new, in packing, ready, completed).
- **Stock attention:** items running low.
- **Store quality score.**
- **Today's updates feed.** Empty state: "No store activity to show yet."
- **Pause store deliveries:** a sheet asks for a reason before pausing incoming 10-minute orders. Confirm is "Pause store deliveries?".
- **Incoming order alert:** a modal with the order details. Opens on the `order:incoming` event.
- **Navigation:** rail to Orders, Catalog, Earnings, Profile and the other vendor screens, each as a route push.
- **States:** "Not connected yet" when the socket is down; "Offline mode".
- **Known issue:** the screen can stall after the socket connects. See [Feature 12](../features/12-realtime-and-offline-behaviour.md#known-issue-home-stall).

## Orders (`orders.tsx`)

**Title:** "Orders". Subtitle: "Real-time 10-minute quick commerce fulfillment".

- **Tabs:** All, New offers, In packing, Ready pickup, Completed, Cancelled.
- **Search:** order ID, customer name, or SKU.
- **Sort:** SLA urgency (default), newest first, highest payout.
- **Each row:** shelf bin, order value, net payout after the 12% platform fee, the time remaining (sample value today), and a next action.
- **Payment summary:** net vendor payout, subtotal, platform commission.
- **States:** fetching orders, "No orders yet", "No {tab} orders", "Clear search filters".

## Order detail (`order-detail.tsx`)

**Title:** "Picking and preparation workstation".

- **Customer:** first name and initial, with the locality (not the full address).
- **Items to pick:** a checkbox per item. Ticking confirms the item is on the shelf bin. A shelf-bin filter (for example `A-01`) narrows the list.
- **Item unavailable:** marks the item missing, then offers *Suggest product substitution*, which opens the substitution flow.
- **Remove item from order:** removes a line and updates the total.
- **Financial summary:** item subtotal, platform commission (12%), GST on commission (18%), vendor net payout.
- **Actions:** *Report order issue / support* and the primary *continue* action.
- **Rule:** the primary action is disabled while the list is empty or a request runs.

## Known gaps

- The SLA countdown on orders is a fixed sample value (04:15).
- Substitution changes the local order view; the customer confirmation depends on the chat backend ([Feature 09](../features/09-chat-support-and-notifications.md)).
- The "Hub Zone 2" delivery radius label is copy, not a geofence check.
