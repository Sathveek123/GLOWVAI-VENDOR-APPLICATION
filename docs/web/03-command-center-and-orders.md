# Web pages 03: command centre, orders, order detail and packing

**Covers:** `page-dashboard`, `page-orders`, `page-order-detail`, `page-pack-order`
**Feature docs:** [Feature 03: order queue and picking](../features/03-order-queue-and-picking.md), [Feature 04: packing and rider handover](../features/04-packing-and-rider-handover.md)
**Mobile equivalents:** [mobile screens 04](../mobile/04-home-and-orders.md), [mobile screens 05](../mobile/05-packing-and-handover.md)

## Command centre (`page-dashboard`)

**Title:** "Store command center".

- Live order board with columns: order ID, customer and address, items and quantities, total, status, and picker action.
- Primary action per order: *Accept & pack*.
- Stock and order counts across the store.

## Orders (`page-orders`)

**Title:** "Orders queue and history". Subtitle lists the day's throughput.

- **Tabs:** all orders, new offers, in packing, ready pickup, completed, cancelled.
- **Columns:** order ID and customer, items and preview, SLA and status, net payout, next action.
- **Next actions:** *Review offer*, *Continue packing →*, *View pickup →*.
- **Export CSV:** button present. Not wired to a file yet.
- **Link:** *Open order detail console →*.

## Order detail (`page-order-detail`)

**Title:** "Picking and preparation workstation".

- **Items to pick (count):** checkboxes per item, shelf bin, and a filter.
- **Item unavailable** and *Resolve item issue →*.
- **Support** menu.
- **Financial summary** for the order.

## Packing and handover (`page-pack-order`)

**Title:** "Packing and rider handover workstation".

- Scan item field and a checklist per item.
- Tamper-seal serial and handover PIN.
- *Confirm handover →*.
- **Known issue:** the web page shows the test PIN `4892` as a "readable manual verification PIN". See [Feature 04](../features/04-packing-and-rider-handover.md). Remove before release.

## Known gaps

- Order data is sample data on the web. Live orders come from the mobile app and the backend.
- Scan item is a visual step. No barcode reader is connected.
- The web handover PIN check is not server-side.
