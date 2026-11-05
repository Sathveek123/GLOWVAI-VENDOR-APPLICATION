# GlowVai Vendor API contract (v1, 2026-11-06) — the single source of truth for the vendor connection

Every agent builds against this file. Do not change a route, field or error code without it being in here.

## Constraints (non-negotiable)
- Firebase project **glowvai-38bde**, **free Spark plan**: no Cloud Functions, no SMS, no paid Storage. Firestore free quota is 50k reads/day shared by shop + admin + vendor, so every route must read as few documents as possible (no full-collection scans, `limit()` on every query, per-instance caches where safe).
- All vendor logic runs as **Next.js route handlers in the shop host** (repo GLOWVAI-OFFICIAL, deployed at https://glowvai.in), under `app/api/vendor/**`, using firebase-admin from `lib/shop/server.ts` (`db()`, `json()`, `limitByIp`, `limitByUser`, `tooMany`, `text`, `indianMobile`, `clientIp`). The vendor app never writes Firestore directly; no Firestore rules change is needed.
- **Every route**: IP rate limit first, then auth, then per-user rate limit, then input validation (lengths, types, enums), then the work. `Cache-Control: no-store`. Never echo internal errors; log them server-side and return a friendly message.
- **Privacy (PRD 3.3, 9.1):** the vendor never receives the customer's phone, address, landmark, coordinates, email, userId, payment ids or tracking id. Before acceptance: order reference, items, quantities, item value, placed time. After this vendor accepts: also the customer's **first name** only.
- Vendors never mark delivered, cancel, or set OUT_FOR_DELIVERY.

## Identity
- Vendors sign in with **Firebase Auth email + password** (free; phone OTP needs paid SMS, later). The app uses the Firebase JS SDK (`mobile/src/config/firebase.ts`) and sends `Authorization: Bearer <Firebase ID token>`.
- Server (`lib/vendor/auth.ts`): `verifyIdToken(token, true)` (checkRevoked). Accept only `firebase.sign_in_provider === 'password'`. Anonymous shop customers are refused (403 `NOT_A_VENDOR_ACCOUNT`). `email_verified` must be true for any write except nothing — i.e. GET /me works unverified (returns `emailVerified:false`), all other routes return 403 `EMAIL_NOT_VERIFIED`.
- Vendor id everywhere: `applicationId = "VAPP-" + uid`. This is also the admin panel's vendor row id.

## Data
### `vendorApplications/VAPP-{uid}` (written only by the server)
Shop `VendorApplicationDocument` shape plus extras:
```
applicationId, applicantUid, email (from token), storeName, ownerName, contactNumber ("+91XXXXXXXXXX"),
gstNumber?, businessRegistrationNumber?, streetAddress, city, state, pincode,
coordinates? {latitude, longitude}, servicePincodes: string[] (1-20, includes own pincode), serviceZoneIds: [],
operatingHours {openTime:'HH:mm', closeTime:'HH:mm', isOpenToday:boolean},
categories: string[], panLast4? (the app sends the full PAN ABCDE1234F for format validation; only the last 4 characters are stored),
bank? { holderName, bankName, ifsc, accLast4, upiVpa? }   // full account number is NEVER accepted or stored
status: 'PENDING_APPROVAL', submittedAt (ms, first submit only), updatedAt (ms), resubmittedAt?,
isOnline: boolean (default false), lastSeenAt: ms|null
```
Optional empty fields are omitted (Firestore rejects undefined).

### Approval = admin overlay `admin_vendors/VAPP-{uid}` (written only by the admin panel)
The admin panel stores staff decisions as an overlay doc with admin-shape fields: `applicationStatus` (SUBMITTED|UNDER_REVIEW|DOCUMENTS_REQUESTED|APPROVED|REJECTED), `operationalStatus` (ACTIVE|PAUSED|SUSPENDED|…), `kycStatus`, `documents[]`, `history[] {at, actor, event, reason}`, `online`. Effective vendor state = application doc, then overlay on top:
- `state`: `NO_APPLICATION` | `SUBMITTED` | `UNDER_REVIEW` | `DOCUMENTS_REQUESTED` | `REJECTED` | `APPROVED_ACTIVE` | `APPROVED_PAUSED` | `SUSPENDED`
- `canOperate` = overlay.applicationStatus === 'APPROVED' && overlay.operationalStatus === 'ACTIVE'
- `reason` = the latest history entry's reason when REJECTED or DOCUMENTS_REQUESTED; `requestedDocuments` = names of documents with status MISSING when DOCUMENTS_REQUESTED.

### Inventory `vendors/{uid}/vendorInventory/{productId}` (server writes only; the parent `vendors/{uid}` doc need not exist)
`{ productId, stock (int 0-100000), isAvailable, unitPriceOverride? (>0, <= product MRP), updatedAt ms, lastRestockedAt ms }`. productId must be a `products` doc with `status == 'PUBLISHED'`.

### Orders (`orders/{orderId}`, shop-owned; the vendor server adds these fields only)
- `vendorId: "VAPP-{uid}"` (admin vendor row id), `vendorUid: uid`, `vendorName: storeName`, `vendorStatus: 'PENDING'|'ACCEPTED'|'PACKED'`, `status` → `VENDOR_ACCEPTED` on accept, `PACKED` on packed (the admin panel already maps both), `vendorAcceptedAt`, `vendorPackedAt`, `dispatch.declines[] {vendorUid, reason, at}`, `dispatch.declinedBy: uid[]`, `stockReservation: {vendorUid, items:[{productId, quantity}]}`, `updatedAt`, and an `events[]` entry `{at, actor:'Vendor <storeName>', event}`.
- **Offer pool (dispatch on the free plan, no background workers):** an order is *offered* to a vendor when `status == 'PLACED'`, `vendorId == null`, the vendor `canOperate`, `isOnline`, `lastSeenAt` within 3 minutes, the order's `shippingAddress.pincode` is in the vendor's `servicePincodes`, and the vendor is not in `dispatch.declinedBy`. All eligible vendors see the same offer; the first atomic accept wins (`ORDER_ALREADY_ASSIGNED` for the rest). No countdown is shown: there is no server worker to expire offers, so the app shows "Placed N min ago" instead (PRD 45-second timer is a later phase — say so in the app copy only where relevant, never fake a timer).
- Staff cancellations live in the admin overlay `admin_orders/{orderId}` (`fulfilment == 'CANCELLED'`); accept and packed must read it and refuse with `ORDER_CANCELLED`.

## Routes (all JSON; all responses `{ ok: true, ... }` or `{ ok: false, error: <friendly sentence>, code: <CODE> }`)

| Route | Limits (IP / user) | Behaviour |
|---|---|---|
| `GET /api/vendor/me` | 60/min / 60/min | `{ ok, account:{uid,email,emailVerified}, vendor: VendorMe }`. Reads the application + overlay (2 reads; cache per uid 30 s in memory). |
| `POST /api/vendor/application` | 10/min / 10 per hour | Body = application fields above (no status/ids). Create or resubmit. Allowed when no application, or effective state SUBMITTED, DOCUMENTS_REQUESTED or REJECTED. Refused when UNDER_REVIEW or approved (`APPLICATION_LOCKED`). Resubmission keeps `submittedAt`, sets `status:'PENDING_APPROVAL'`, `resubmittedAt`. Returns `{ ok, vendor: VendorMe }`. |
| `POST /api/vendor/status` | 30/min / 20/min | `{ isOnline: boolean }`. Only when canOperate (`NOT_APPROVED` otherwise). Writes `isOnline`, `lastSeenAt=now`, `updatedAt`. Also used as a heartbeat (`{isOnline:true}` every 60 s while foregrounded and online) — do not re-write if lastSeenAt is < 45 s old and isOnline unchanged (saves writes). |
| `GET /api/vendor/orders?since=<ms>` | 120/min / 60/min | See below. |
| `POST /api/vendor/orders/{orderId}/accept` | 30/min / 20/min | Transaction: order exists, status PLACED, vendorId null, not declined by me, I'm eligible (pincode), not staff-cancelled, every item has inventory with `isAvailable` and `stock >= qty` → decrement stock, write reservation, set vendor fields, status VENDOR_ACCEPTED. Errors: `ORDER_ALREADY_ASSIGNED` (409), `ORDER_CANCELLED` (409), `OUT_OF_STOCK` (409, `missing:[{productId,title,need,have}]`), `NOT_ELIGIBLE` (403), `NOT_FOUND` (404). Success returns the projected order (now with customerFirstName). Idempotent: if already accepted by me, return ok. |
| `POST /api/vendor/orders/{orderId}/decline` | 30/min / 20/min | `{ reason }`, reason one of `OUT_OF_STOCK`, `STORE_BUSY`, `CLOSING_SOON`, `ITEM_DAMAGED`, `OTHER` (+ `note` ≤ 200 required for OTHER). Only while the order is in my offer pool. Adds me to declinedBy; the order stays offered to other vendors. |
| `POST /api/vendor/orders/{orderId}/packed` | 30/min / 20/min | `{ checkedProductIds: string[] }` must cover every item. Only for my order in VENDOR_ACCEPTED and not staff-cancelled. Sets status PACKED, vendorStatus PACKED, vendorPackedAt. (Pickup QR/rider handover is a later phase.) |
| `GET /api/vendor/inventory` | 60/min / 30/min | `{ ok, items: InventoryItem[] }` (one query, limit 500). |
| `PUT /api/vendor/inventory` | 30/min / 20/min | `{ items: [{productId, stock, isAvailable, unitPriceOverride?}] }` 1-100 items; validates products PUBLISHED with one `getAll`; batch write. Returns saved items. `NOT_APPROVED` unless canOperate (an approved but paused vendor may still edit stock: allow when applicationStatus APPROVED). |
| `POST /api/vendor/support` | 10/min / 5 per hour | `{ category, subject, description, orderId? }` → `admin_tickets/TKT-VND-…` in the admin ticket shape (`channel:'APP'`, `customerId: null`, `vendorId: 'VAPP-uid'`, `requestedBy: 'VAPP-uid'`). `GET` same path lists my tickets (limit 30). |

`OPTIONS` on every route: CORS preflight. Allowed origins come from env `VENDOR_WEB_ORIGINS` (comma list) plus `http://localhost:8081`, `http://localhost:19006` in development; native apps send no Origin and are allowed. Never `*` with credentials.

### `GET /api/vendor/orders?since=<ms>`
- Requires canOperate OR applicationStatus APPROVED (paused vendors still see their own orders, but no new offers).
- `since` absent/0 (first load): query A `orders where vendorUid == uid limit 50`; query B (only if canOperate and online) `orders where status == 'PLACED' and vendorId == null limit 30`, filtered in memory by eligibility.
- `since > 0`: one query `orders where updatedAt > since orderBy updatedAt limit 60`; keep orders that are mine or eligible offers; for any other returned order, put its id in `removed` (it may have left my pool).
- Response `{ ok, serverTime, offers: VendorOrder[], orders: VendorOrder[], removed: string[], full: boolean }` (`full=true` on first load: client replaces its lists; else merges). Client polls every 20 s while the Orders/Home screen is focused, the app is foregrounded and the vendor is online; every 60 s when offline; never in background. Next `since = serverTime - 5000` (overlap; client dedupes by orderId).

### `VendorOrder` projection (the only order shape the app receives)
```
{ orderId, reference: orderId, status, vendorStatus, isOffer: boolean,
  items: [{ productId, title, brand, quantity, unitPrice, imageUrl }],
  itemCount, itemsValue,               // sum unitPrice*qty (not the customer's bill)
  placedAt, updatedAt, acceptedAt?, packedAt?,
  customerFirstName?,                  // only when vendorUid == me and accepted
  cancelled: boolean, cancellationReason? // status CANCELLED
}
```

### `VendorMe`
```
{ applicationId, state, canOperate, isOnline, lastSeenAt, reason?, requestedDocuments?: string[],
  application: { storeName, ownerName, contactNumber, email, gstNumber?, businessRegistrationNumber?, streetAddress, city, state, pincode,
                 servicePincodes, operatingHours, categories, panLast4?, bank?: {holderName, bankName, ifscMasked, accLast4, upiVpa?}, submittedAt, updatedAt } | null }
```

## Mobile client (`mobile/src/services/vendorApi.ts`)
Typed wrappers for every route above, built on `fetch` with the Firebase ID token (`auth.currentUser.getIdToken()`), base URL `EXPO_PUBLIC_VENDOR_API_URL` (production: `https://glowvai.in`). Maps `code` → friendly copy; network errors → "Can't reach GlowVai. Check your internet and try again." with Retry. The legacy `api.ts`/`socket.ts` (Express backend on glowvai-v2) are retired: nothing imports them after this work.
