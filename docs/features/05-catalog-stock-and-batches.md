# Feature 05: Catalog, stock and batches

**Status:** screens and stock actions are built. Stock changes call the backend inventory endpoints. Batch tracking on mobile is a Coming-soon placeholder in production.
**Screens:** [Mobile: catalog and stock](../mobile/06-catalog-and-stock.md), [Web: catalog, stock and batches](../web/04-catalog-stock-and-transfers.md)

## What it does

Each store keeps a matrix of products: price, MRP, stock, shelf bin, GST percent, and active or inactive. Staff add SKUs, adjust stock, and track expiring batches.

## Product fields

From the `Product` type in `useVendorStore.ts`:

`productId`, `name`, `category`, `sku`, `mrp`, `sellingPrice`, `stock`, `bin` (shelf location), `gstPercent`, `images`, `active`, `description`.

## Stock actions

| Action | Endpoint |
|---|---|
| List inventory | `GET /api/inventory` |
| Add one SKU | `POST /api/inventory` |
| Bulk upload (CSV) | `POST /api/inventory/bulk-upload` |
| Update a SKU | `PATCH /api/inventory/:productId` |
| Adjust stock by a delta | `PATCH /api/inventory/:productId/stock` |
| Deactivate | `DELETE /api/inventory/:productId` |

The mobile client calls these through `inventoryApi` in `mobile/src/services/api.ts`.

## Screens

- **Catalog** (`catalog.tsx`): search by name, brand, SKU, or bin. Totals for SKUs and low stock (under 5). Bulk CSV upload. Undo for the last change. A "Resolve sync" action when the store and server disagree.
- **Add SKU** (`add-sku.tsx`): product basics, shade and size variants (colour swatch and hex), pricing (selling price and MRP), and stock with a bin. Save as draft or save.
- **Expiry and batches** (`expiry.tsx`, Coming soon on mobile): batch lot code, expiry date, received quantity, supplier, and FEFO actions (stage shelf, mark cleared, apply discount).
- **Recommended SKUs** (`recommended-skus.tsx`, Coming soon on mobile): demand-based suggestions with a "why these products" explanation and a stale-insights state.

## Rules

- Prices are shown with the vendor's net share and platform fee (see [Feature 07](07-earnings-payouts-and-tax.md)).
- Reconciling stock with orders is a backend job. The app does not do it yet.

## Known gaps

- Batch and expiry screens and the recommendations engine need backend data. Until then they are placeholders on mobile, and the web shows sample batches.
- The platform's 88/12 split is shown as copy in several places. Confirm the rate with the finance owner before release.
