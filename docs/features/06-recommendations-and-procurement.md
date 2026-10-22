# Feature 06: Recommendations and procurement

**Status:** front-end only. Recommendations and purchase orders use sample data. Mobile versions are Coming-soon placeholders in production.
**Screens:** [Mobile: catalog, stock and recommendations](../mobile/06-catalog-and-stock.md), [Web: stock transfers and procurement](../web/04-catalog-stock-and-transfers.md), [Web: customer insights and pricing](../web/09-insights-growth-and-operations.md)

## What it does

Two planning tools help the store decide what to stock:

1. **Recommended SKUs** suggests products that neighbouring stores are not carrying and that have high demand, with a margin estimate and a stock risk note.
2. **Procurement** lets the store raise purchase orders to a supplier, track their status (open, partial, overdue), and register the received batch.

## Recommendations

- Each suggestion shows demand, potential margin, and a suggested starting stock.
- Filters: All, Skincare, Makeup, Highest demand, Highest margin.
- "Add to store inventory" hands the SKU to the add-SKU flow ([Feature 05](05-catalog-stock-and-batches.md)).
- States: stale insights (model refresh needed), limited data, network error.

## Purchase orders

- Create a PO by choosing a supplier, expected delivery date, and total units.
- Statuses: open, partial, overdue. Supplier delays are shown as a banner.
- The screen title is "Stock Intake & Batch Registration", so receiving stock and registering its batch are on the same screen.

## Known gaps

- No supplier integration exists. Dispatch is a front-end action only.
- Margin figures are assumptions shown in the screen footer ("Margin assumptions and stock risk"). They are not calculated from real cost data yet.
- The recommendation model is not connected. The screen shows a fixed "Model v2.4" label.
