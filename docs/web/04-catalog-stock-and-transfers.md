# Web pages 04: catalogue, stock, expiry, recommendations, procurement and transfers

**Covers:** `page-catalog`, `page-add-sku`, `page-expiry`, `page-recommended-skus`, `page-procurement`, `page-stock-transfers`
**Feature docs:** [Feature 05](../features/05-catalog-stock-and-batches.md), [Feature 06](../features/06-recommendations-and-procurement.md)
**Mobile equivalents:** [mobile screens 06](../mobile/06-catalog-and-stock.md)

## Catalogue and stock matrix (`page-catalog`)

**Title:** "Catalogue and stock matrix".

- **Category tabs:** all, skincare, makeup, hair care, fragrance, bath and body.
- **Buttons:** *CSV bulk* and *+ Add SKU*.
- Stock steppers per product, and shelf bin per row.
- Sample catalogue of eight SKUs, rendered from a script in the page.

## Add SKU (`page-add-sku`)

**Title:** "Add product SKU and variant specs".

1. **Basic product information:** name, brand, category, short description and key ingredients.
2. **Shade and size variants:** swatches and sizes.
3. **Pricing and taxation (88/12 payout):** selling price and fixed MRP.
4. **Inventory and dark-store storage:** SKU code, initial stock, low-stock threshold, shelf bin, product images.
- **Live customer app preview** of the listing.
- Action: *Save product SKU to catalogue →*.

## Expiry and batch tracker (`page-expiry`)

**Title:** "Expiry and batch lot tracker".

- Groups: needs action (count), all batches, cleared.
- Columns: product, lot code, shelf location, expiry date, remaining stock, status, FEFO action.
- FEFO actions: apply 25% off, stage shelf, mark cleared, inspect lot.
- *+ Register new batch*.

## Recommended SKUs (`page-recommended-skus`)

**Title:** "Recommended for your store".

- "Why these products?" explanation and "How recommendations work".
- Filters: all, skincare, makeup, highest demand, highest margin.
- *+ Add to store inventory* on each suggestion.
- Sample data.

## Procurement (`page-procurement`)

**Title:** "Supplier procurement".

- Filter: all, open, partial, overdue.
- *Create purchase order*: supplier, expected delivery date, total units. Then *Dispatch PO*.

## Stock transfers (`page-stock-transfers`)

**Title:** "Inter-store stock transfers".

- Transfer request: origin and destination location, SKU.
- Live transit, FEFO batch expiry, and discrepancy exception states.
- Action: *Create stock transfer request*.

## Known gaps

- All data on these pages is sample data.
- Transfers and purchase orders have no backend.
- "Add to inventory" and the batch actions are front-end only.
