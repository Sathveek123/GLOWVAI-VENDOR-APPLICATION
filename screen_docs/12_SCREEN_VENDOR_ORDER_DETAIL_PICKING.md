# 📱 Screen Documentation: Order Detail & Itemized Picking Workspace

## 📍 File & Component Location
- **File Path**: `mobile/app/(vendor)/order-detail.tsx`
- **Route URL**: `/(vendor)/order-detail`

---

## 🎯 Screen Purpose & Behavior
Step-by-step picking screen for dark store pickers. Displays the customer order item checklist with prominent warehouse aisle/bin badges (`BIN-A-01-02-01`), guiding pickers directly to the exact shelf location to ensure sub-60 second picking times.

---

## 🎨 UI Layout & Checklist Components
1. **Header Meta**: Order ID, Customer Phone with Call Button, Delivery Address.
2. **Itemized Bin Checklist**:
   - Checkbox to mark item picked.
   - Product Name, SKU Code, Quantity required.
   - **Green Bin Badge**: High-visibility container displaying exact rack coordinate (e.g. `BIN-A-01-02-01`).
3. **Lifecycle Action Workflow**:
   - Step 1: *"Accept Order"* (`PATCH /api/orders/:id/accept`)
   - Step 2: *"Mark as Packed & Select Pickup Bay"* (`PATCH /api/orders/:id/pack`)
   - Step 3: *"Handover to Rider"* (`PATCH /api/orders/:id/handover`)
