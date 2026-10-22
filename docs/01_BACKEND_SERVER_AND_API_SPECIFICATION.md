# ⚙️ GlowVAI Vendor Backend — 100% Complete Server & API Specification

## 🌐 Overview
The GlowVAI Vendor Backend (`backend/src/server.js`) is an Express HTTP and Socket.IO real-time server. It handles vendor onboarding, real-time push notifications, order lifecycle progression, stock reservation, financial payouts, FCM notifications, and database synchronization.

---

## 🚀 Server Architecture & Environment Setup

- **Server Entrypoint**: `backend/src/server.js`
- **Port**: `4000` (override with `PORT` env var)
- **Firebase Database**: Synchronizes directly with `https://glowvai-v2-default-rtdb.firebaseio.com`
- **Fallback**: Auto-switches to an active in-memory store (`mockStore`) if Firebase credentials are absent.

---

## 📋 Complete 41 REST API Endpoints Reference

### 🏥 System & Health
1. `GET /health` & `GET /api/health`
   - **Response**: `{ ok: true, service: "glowvai-vendor-backend", version: "1.0.0", sockets: 1 }`

---

### 🏪 Vendor Management
2. `GET /api/vendor/:vendorId`
   - **Response**: Returns vendor object (`VND-001`), shop details, rating (`4.96`), address, and bank info.
3. `PATCH /api/vendor/:vendorId/status`
   - **Payload**: `{ "isOnline": true }`
   - **Action**: Updates vendor duty status, syncs Firebase RTDB, and emits `vendor:statusUpdated`.
4. `PATCH /api/vendor/:vendorId/fcm-token`
   - **Payload**: `{ "fcmToken": "fcm_token_string..." }`
   - **Action**: Registers Firebase Cloud Messaging push token for background mobile notifications.
5. `PATCH /api/vendor/:vendorId`
   - **Payload**: `{ "name": "Mukesh", "phone": "8977855998" }`
   - **Action**: Partial update of vendor dossier fields.
6. `POST /api/onboarding/submit`
   - **Payload**: `{ "ownerName": "...", "shopName": "...", "phone": "...", "city": "Vijayawada" }`
   - **Action**: Registers and approves a new dark store vendor partner.

---

### 🛍️ Orders Engine
7. `GET /api/orders` — Query params: `?storeId=DS-VIJ-01&status=PENDING`.
8. `GET /api/orders/all` — Returns all orders sorted descending by `createdAt`.
9. `GET /api/orders/pending` — Returns active orders with `status === 'PENDING'`.
10. `GET /api/orders/:orderId` — Returns a single order document with itemized SKUs and delivery details.
11. `POST /api/orders`
    - **Action**: Core order creation endpoint with atomic inventory pre-check.
    - **Error Response (409)**: Returns `{ ok: false, error: 'OUT_OF_STOCK', productName: '...' }` if stock is unavailable.
12. `POST /api/orders/create` (Customer App Bridge)
    - **Payload**: `{ "orderId": "ORD-9912", "orderAmount": 1342, "customerName": "Priya", "items": [...] }`
    - **Action**: Dispatches live customer app orders straight into dark store vendor pickers with audio/visual alerts.
13. `POST /api/payment/verify` — Verifies online payment transaction status.

---

### 🔄 Order Lifecycle Actions
14. `PATCH /api/orders/:orderId/accept` — Transitions status to `ACCEPTED` and finalizes reserved stock.
15. `PATCH /api/orders/:orderId/prepare` — Transitions status to `PREPARING`.
16. `PATCH /api/orders/:orderId/pack` — Transitions status to `PACKED` with pickup bay selection (`Bay-01`).
17. `PATCH /api/orders/:orderId/ready` — Transitions status to `READY_FOR_PICKUP`.
18. `PATCH /api/orders/:orderId/handover` — Assigns delivery rider (`RIDER-08`) and sets status to `DISPATCHED`.
19. `PATCH /api/orders/:orderId/dispatch` — Sets status to `DISPATCHED`.
20. `PATCH /api/orders/:orderId/deliver`
    - **Payload**: `{ "otp": "4892" }`
    - **Action**: Verifies customer delivery OTP, marks status `DELIVERED`, and credits **88% net earnings** to vendor ledger.
21. `PATCH /api/orders/:orderId/cancel` — Sets status `CANCELLED` and atomically releases reserved stock back to available pool.
22. `PATCH /api/orders/:orderId/reject` — Rejects order offer and releases stock.
23. `PATCH /api/orders/:orderId/timeout` — Triggered when 45s countdown expires without vendor acceptance.

---

### 📦 Inventory Catalog Management
24. `GET /api/inventory` — Query params: `?storeId=DS-VIJ-01`.
25. `POST /api/inventory` — Adds a new SKU with bin coordinates (`BIN-A-01-02-01`), MRP, selling price, and stock levels.
26. `PATCH /api/inventory/:productId` — Updates fields of a specific SKU.
27. `PATCH /api/inventory/:productId/stock`
    - **Payload**: `{ "delta": 5, "reason": "Restock" }` or `{ "exactQuantity": 30 }`
    - **Action**: Adjusts stock on hand, computes available stock, appends `stockHistory` audit log, and emits `inventory:stockUpdated`.
28. `DELETE /api/inventory/:productId` — Soft deletes (pauses) an item catalog entry.
29. `POST /api/inventory/bulk-upload` — Imports SKUs from raw JSON arrays or parsed CSV text.

---

### 💰 Earnings & Payout Ledger
30. `GET /api/earnings/:vendorId` — Retrieves today's, weekly, and total earnings with **88% vendor payout / 12% take-rate**.
31. `GET /api/earnings/:vendorId/history` — Itemized historical transaction logs.

---

### 🔔 System Notifications
32. `GET /api/notifications/:vendorId` — Lists active push alerts.
33. `PATCH /api/notifications/:notificationId/read` — Marks notification as read.
34. `POST /api/notifications/broadcast` — Sends FCM and WebSocket broadcast alerts to all connected dark store operators.

---

### 📊 Analytics & Returns
35. `GET /api/analytics/:storeId` — Returns today's delivered order count, average order value, top 5 selling products, and status breakdown.
36. `GET /api/returns` — Lists customer return requests.
37. `POST /api/returns` — Logs a return request with reason and refund calculation.

---

### 🧪 Simulation & Concurrency Testing
38. `POST /api/test/simulate-order` — Generates a randomized quick-commerce order and triggers vendor push popups.
39. `ALL /api/test/race-condition` — Simulates 2 parallel customer checkout attempts for 1 remaining unit to verify HTTP 409 `OUT_OF_STOCK` isolation.
40. `GET /api/admin/overview` — Superuser stats for total orders, gross volume, platform revenue, and low-stock count.
41. `GET /api/admin/vendor/:vendorId` — Detailed dark store dossier, total sales, net payout, and inventory matrix.
