# 📦 Atomic Inventory & Stock Reservation Engine

## 🎯 Engine Overview
In high-frequency quick commerce, multiple customers may attempt to purchase limited stock of high-demand items (e.g., Niacinamide Serums or Sunscreen Gels) simultaneously.

The **GlowVAI Inventory Engine** (`backend/src/server.js`) utilizes an **Atomic 3-State Stock Model** to eliminate overselling and race conditions.

---

## 📊 1. The 3-State Stock Model

For every SKU in the dark store catalog, stock is divided into three tracking variables:

```
┌─────────────────────────────────────────────────────────────┐
│                    Stock On Hand (Total)                    │
│                                                             │
│   ┌───────────────────────────┬─────────────────────────┐   │
│   │     Available Stock       │     Reserved Stock      │   │
│   │   (Ready for New Orders)  │   (Pending Orders)      │   │
│   └───────────────────────────┴─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

| Field Name | Description | Mathematical Contract |
| :--- | :--- | :--- |
| `stockOnHand` | Total physical inventory present inside the dark store bin | `stockOnHand = availableStock + reservedStock` |
| `reservedStock` | Quantity locked for orders currently being picked/packed | Incremented on order placement |
| `availableStock` | Remaining units available for immediate customer purchase | `availableStock = Math.max(0, stockOnHand - reservedStock)` |

---

## 🔄 2. Atomic Stock State Lifecycle

### Phase 1: Reservation (`reserveInventoryForOrder`)
When an order is created:
1. **Pre-Check**: Validates that `availableStock >= requestedQty` for all items in the order.
2. **Rejection**: If any item lacks sufficient available stock, the order is rejected with `OUT_OF_STOCK`.
3. **Atomic Commit**:
   ```js
   prod.reservedStock += requestedQty;
   prod.availableStock = Math.max(0, prod.stockOnHand - prod.reservedStock);
   prod.isAvailable = prod.availableStock > 0;
   ```
4. **WebSocket Push**: Broadcasts `inventory:stockUpdated` to all vendor mobile apps and admin consoles.

---

### Phase 2: Finalization (`finalizeInventoryForOrder`)
When the order is marked `DISPATCHED` or `DELIVERED`:
1. Physical inventory leaves the store.
2. **Atomic Deduction**:
   ```js
   prod.stockOnHand -= requestedQty;
   prod.reservedStock -= requestedQty;
   prod.availableStock = Math.max(0, prod.stockOnHand - prod.reservedStock);
   ```

---

### Phase 3: Release / Cancellation (`releaseInventoryForOrder`)
If an order is cancelled or times out:
1. Locked inventory is returned to the available pool.
2. **Atomic Release**:
   ```js
   prod.reservedStock = Math.max(0, prod.reservedStock - requestedQty);
   prod.availableStock = Math.max(0, prod.stockOnHand - prod.reservedStock);
   ```

---

## 📍 3. Dark Store Bin Location Tracking System

To optimize dark store picking times (target: sub-60 second pick time), every product document includes exact warehouse bin coordinates:

- **Format**: `BIN-[Aisle]-[Shelf]-[Rack]-[Bin]`
- **Example**: `BIN-A-01-02-01`
  - `A`: Skincare Aisle
  - `01`: Shelf 1
  - `02`: Rack 2
  - `01`: Bin 1

Picker screens display the bin location in prominent green badge design tokens to guide store pickers directly to the exact shelf slot.

---

## ⚠️ 4. Low-Stock Threshold Alerts

Each product defines a `lowStockThreshold` (default: 5 units).
When `availableStock <= lowStockThreshold`, the system automatically:
- Highlights the item in orange/red on vendor mobile catalog screens.
- Displays an alert banner in the Enterprise Admin Portal.
- Triggers low-stock warning push events over WebSockets.
