# Mobile screens 06: catalogue, stock and planning

**Covers:** `catalog.tsx`, `add-sku.tsx`, `expiry.tsx`, `recommended-skus.tsx`, `procurement.tsx`
**Feature docs:** [Feature 05: catalog, stock and batches](../features/05-catalog-stock-and-batches.md), [Feature 06: recommendations and procurement](../features/06-recommendations-and-procurement.md)

| Screen | Route | Production | Development |
|---|---|---|---|
| Catalogue | `/(vendor)/catalog` | Live | Live |
| Add SKU | `/(vendor)/add-sku` | Live | Live, with an edge-state strip |
| Expiry and batches | `/(vendor)/expiry` | Coming soon | Full screen |
| Recommended SKUs | `/(vendor)/recommended-skus` | Coming soon | Full screen |
| Procurement | `/(vendor)/procurement` | Coming soon | Full screen |

## Catalogue (`catalog.tsx`)

**Title:** "Products".

- **Totals:** total SKUs, in stock, out of stock, low stock (under 5).
- **Search:** name, brand, SKU, or shelf location.
- **Rows:** product, bin, selling price, MRP, stock with a stepper. Price shows the vendor's 88% net.
- **Bulk CSV:** placeholder `SKU, Product Name, Category, MRP, SellingPrice, Stock, Bin`. Upload is a backend call (`POST /api/inventory/bulk-upload`).
- **Actions:** *Undo* for the last change, *Resolve sync* and *Reconnect* when the store and server disagree, *Reset all filters*.
- **States:** "No matching catalog products", "Fetching", offline.

## Add SKU (`add-sku.tsx`)

**Title:** "Add product SKU".

- **Basics:** product name (for example "Minimalist 10% Niacinamide Face Serum"), brand, category, short description and key ingredients.
- **Variants:** shade name and hex colour with a swatch, size or pack volume. A "Set primary" choice for the main image.
- **Pricing:** selling price (₹) and MRP. Shown with the 88/12 split.
- **Stock:** SKU code, initial stock, low-stock threshold, shelf bin.
- **Actions:** *Save draft*, *Save shade*, and the primary save. *View in catalogue* after saving.
- **Storage:** `inventoryApi.add` (`POST /api/inventory`) and `inventoryApi.update` (`PATCH`).

## Expiry and batches (`expiry.tsx`)

Coming soon in production. Development shows the full screen:

- Register a batch: product name, lot code, supplier, shelf bin, received quantity, received date, expiry date.
- Lists remaining stock and batch status, with FEFO actions (stage shelf, mark cleared, apply discount, review expiring stock).
- Edge states: sync failure, undo, reset filters.

## Recommended SKUs (`recommended-skus.tsx`)

Coming soon in production. Development shows:

- Suggestion cards with "Suggested start", potential margin, and a *Set stock* action.
- "Why these products?" explanation and "Margin assumptions & stock risk".
- Filters and "Refresh model". States: stale insights, limited data, network error.

## Procurement (`procurement.tsx`)

Coming soon in production. Development shows:

- Purchase orders with supplier, total units, total cost, and status.
- Stock intake form with supplier selection, expected delivery, and quantity.
- *Dispatch* is a front-end action. The "supplier dispatch delayed" state is display only.

## Known gaps

- Bulk CSV and inventory writes depend on the backend inventory endpoints.
- Batch tracking, recommendations and procurement have no backend yet.
