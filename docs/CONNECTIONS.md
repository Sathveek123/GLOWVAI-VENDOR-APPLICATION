# Vendor app connections: the Firestore data contract

**Status: planned contract, not yet wired.** The vendor app still talks to the legacy Express backend through `mobile/src/services/api.ts` and `socket.ts`. This document is the target the data-layer work moves to. Nothing here is live until the matching security rules and server functions are deployed.

**Project:** the shared GlowVai Firebase project **`glowvai-38bde`** (the same project as the shop and the admin panel). The web config is in `mobile/.env.example`; the client is `mobile/src/config/firebase.ts` (lazy, no hardcoded fallbacks). Cloud Firestore and Storage only; Realtime Database is not used.

**Sources:** the shop's `core/types/vendor.ts`, `core/types/order.ts` and `core/services/vendorService.ts`; the admin panel's `src/data/sourceAdapters.ts` and `src/server/adminStore.ts`; the GlowVai Vendor PRD (v1.0) sections 3, 7, 8 and 9. Field names below are the shop's, so the admin panel and shop read vendor data without changes.

## 1. Who writes what

| Path | Vendor app | Server (functions or admin panel, Admin SDK) |
|---|---|---|
| `vendorApplications/VAPP-{uid}` | create and resubmit own | approve or reject |
| `vendors/{uid}` | read own; update `isOnline`, `lastSeenAt`, `updatedAt` only | create on approval; everything else |
| `vendors/{uid}/vendorInventory/{productId}` | read and write own (stock, availability, price override) | `reserved` stock |
| `vendorOrders/{orderId}` (vendor-safe projection) | read own; accept, reject, packed through server functions | create, assign, expire, cancel |
| `products/{productId}` | read `PUBLISHED` only | all writes |
| `productRequests/{id}` | create own | review |
| Storage `vendorKyc/{uid}/{file}` | upload and read own (PDF or image, under 5 MB) | read for review |

The vendor never writes `status` on an application, `applicationStatus`, `isActive`, earnings, stock reservations, or any order state after `PACKED`. Vendors never mark an order delivered.

## 2. Identity

- Sign-in is by mobile number with an SMS code. Firebase Phone Auth does not work cleanly in Expo on Android with the JS SDK, so the plan is: a server function sends and checks the code through an SMS provider (rate-limited per phone and IP), then returns `admin.auth().createCustomToken(uid)`; the app calls `signInWithCustomToken`. The same phone must always map to the same `uid` (`getUserByPhoneNumber`, or create the user with that phone).
- The token carries `phone_number`, which the rules compare with `contactNumber`.
- After approval the server sets the custom claim `{ role: 'vendor' }`; the app forces `getIdToken(true)` to pick it up.
- **Not built yet:** the SMS provider and the OTP function. Until then sign-in cannot work in a production build.

## 3. `vendorApplications/VAPP-{uid}`

Written by onboarding (steps A to D) with `setDoc`, in the shop's `VendorApplicationDocument` shape:

```ts
{
  applicationId: `VAPP-${uid}`,
  applicantUid: uid,
  storeName: string,             // 2-120 chars
  ownerName: string,             // 2-120 chars
  contactNumber: string,         // "+91XXXXXXXXXX", taken from the signed-in user, not typed
  email: string,
  gstNumber?: string,            // optional (PRD screen 05)
  businessRegistrationNumber?: string,
  drugLicenseNumber?: string,    // not collected; omit
  streetAddress: string,         // address + locality
  city: string,
  state: string,                 // onboarding must collect this (not collected today)
  pincode: string,               // ^[1-9][0-9]{5}$
  coordinates: { latitude: number, longitude: number }, // block submit if missing
  serviceZoneIds: string[],      // [] until the admin assigns a zone
  operatingHours: { openTime: 'HH:mm', closeTime: 'HH:mm', isOpenToday: boolean }, // 24-hour
  status: 'PENDING_APPROVAL',
  submittedAt: number,           // Date.now()
  updatedAt: number,
  // Extras the admin panel already reads, or the PRD needs:
  categories: string[],
  pan: string,
  bank: { holderName, bankName, ifsc, accLast4, upiVpa }, // masked only
  documents: { gstCert?, storePhoto?, ownerId? },          // Storage paths under vendorKyc/{uid}/
}
```

- Firestore rejects `undefined`: strip empty optional fields before writing.
- The full bank account number never goes into this document. It must go to a server function that stores it encrypted.
- Resubmission is allowed while `status` is `PENDING_APPROVAL` or `REJECTED`; it sets `status` back to `PENDING_APPROVAL` and never touches `rejectionReason`, `reviewedByAdminUid`, `approvedByAdminUid`, `approvedAt` or `submittedAt`.
- The admin panel maps `PENDING_APPROVAL` to its SUBMITTED queue and hides the application once `vendors/{applicantUid}` exists, so no admin change is needed for it to appear.
- The pending screen listens with `onSnapshot` and shows `rejectionReason` when present.

## 4. `vendors/{uid}`

Created by the server on approval, in the shop's `VendorDocument` shape: `role: 'vendor'`, `vendorId`, `storeName`, `ownerName`, `contactNumber`, `gstNumber?`, `address { street, city, state, pincode, coordinates }`, `serviceZoneIds`, `operatingHours`, `applicationStatus` (`PENDING_APPROVAL | APPROVED | REJECTED | SUSPENDED`), `rejectionReason?`, `approvedByAdminUid?`, `approvedAt?`, `isActive`, `averageFulfillmentTimeMinutes`.

- The app reads it with `onSnapshot` and routes on it: approved and active vendors reach the store screens; anyone else sees the application status.
- **Online or offline (PRD 2.2):** the vendor may update only `isOnline`, `lastSeenAt` and `updatedAt` (both timestamps as `serverTimestamp()`), and only while `applicationStatus == 'APPROVED'` and `isActive == true`. While the app is in the foreground it writes `lastSeenAt` every 60 seconds; routing treats a vendor whose `lastSeenAt` is older than 3 minutes as offline.
- Profile edits (name, address, hours) change KYC data, so they go through a change request reviewed by the admin, not straight into this document.
- **Not built yet:** the server action that creates this document and sets the claim on approval.

## 5. `vendors/{uid}/vendorInventory/{productId}`

A subcollection (not a top-level collection), keyed by the shop's `products/{productId}`, in the shop's `VendorInventoryItem` shape:

```ts
{ productId: string, stock: number /* int, 0-100000 */, isAvailable: boolean,
  unitPriceOverride?: number /* > 0 */, lastRestockedAt: number }
```

- Written only by an approved vendor, only for products whose `status` is `PUBLISHED`.
- `reserved` (and later `batch` and `expiry`) are server-written; the app shows them but never sets them.
- Customers never read per-vendor stock. Routing reads it on the server.
- Bulk CSV import: parse on the device, match by SKU or barcode against `products`, write with `writeBatch`.

## 6. `products/{productId}` (read-only)

- Query with `where('status', '==', 'PUBLISHED')`. The existing rule only allows reads of published products, so the filter is required.
- The vendor app never writes `products`. A product that is not in the catalogue is requested through `productRequests/{autoId}`: `{ vendorUid, name, brand, barcode?, sku?, shade?, category?, mrp?, status: 'PENDING', createdAt }`. The admin reviews it (PRD: unmatched products enter review).

## 7. Orders: the vendor-safe projection `vendorOrders/{orderId}`

Firestore rules cannot hide fields inside a document, and the shop's `orders` document holds the customer's phone number and address. The PRD (3.3, 9.1) forbids showing those to vendors. So the server writes a projection the vendor app reads instead of `orders`:

```ts
{
  orderId: string,
  orderNumber: string,            // the reference shown to the vendor
  vendorId: string,               // = vendor uid; the only order field the rules key on
  status: OrderStatus,            // shop values, see below
  vendorStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PACKED',
  items: { productId, sku, title, brand?, quantity, unitPrice, imageUrl }[],
  estimatedEarnings?: number,     // server-calculated; never computed on the device
  prepTimeMinutes?: number,
  offerExpiresAt?: number,        // server-owned 45-second offer window
  customerFirstName?: string,     // only after the vendor accepts; never phone, address or GPS
  vendorAcceptedAt?: number,
  vendorPackedAt?: number,
  vendorRejectionReason?: string,
  pickup?: { qrToken: string },   // signed, single-use, only after PACKED
  createdAt: number,
  updatedAt: number,
}
```

Before acceptance the vendor sees only the order reference, items, quantities, estimated earnings and prep time.

**Statuses** (shop `OrderStatus`) and the order tabs:

| Tab | Statuses |
|---|---|
| Incoming | `PLACED`, `VENDOR_PENDING` |
| Preparing | `VENDOR_ACCEPTED` |
| Ready for pickup | `PACKED`, `READY_FOR_PICKUP` |
| Completed | `OUT_FOR_DELIVERY`, `DELIVERED` |
| Cancelled | `CANCELLED`, `VENDOR_REJECTED` |

**Vendor transitions** (all through server functions, never a direct client write):

| Action | From | To | Notes |
|---|---|---|---|
| Accept | `VENDOR_PENDING` (live offer) | `VENDOR_ACCEPTED` | One transaction: offer still live, order unassigned, stock reserved, sibling offers cancelled. Losers get `ORDER_ALREADY_ASSIGNED`. The app shows success only after the server confirms. |
| Reject | `VENDOR_PENDING` | `VENDOR_REJECTED` | Reason is mandatory, chosen from a list. |
| Packed | `VENDOR_ACCEPTED` | `PACKED` | Only after every item on the packing checklist is ticked. Server issues the pickup QR token. |
| Pickup | `PACKED` / `READY_FOR_PICKUP` | `OUT_FOR_DELIVERY` | Confirmed by the rider scanning the QR; the server verifies and burns the token. Not a vendor action. |

The vendor never sets `OUT_FOR_DELIVERY`, `DELIVERED` or `CANCELLED`.

**Query:** `onSnapshot(query(collection(db, 'vendorOrders'), where('vendorId', '==', uid), orderBy('createdAt', 'desc'), limit(100)))`, which needs a composite index on `vendorId` ascending and `createdAt` descending.

## 8. Server functions still to build

These cannot be done safely from the app and block the PRD Phase 1 launch:

1. **OTP sign-in:** send and verify the SMS code, return a custom token.
2. **Approve vendor:** create `vendors/{uid}`, set the application to `APPROVED`, set the `vendor` claim.
3. **Place order and offer:** validate, price, reserve stock, create offers to nearby eligible vendors with `expiresAt = now + 45 s`, write the `vendorOrders` projection.
4. **Accept offer:** the atomic transaction above.
5. **Expire offers:** server-owned expiry, then re-route.
6. **Mark packed and issue pickup token:** signed, single-use, order-bound QR; **confirm pickup** for the rider.
7. **Ledger:** on delivery, write earnings entries using the commission from the vendor's agreement (never a fixed rate in the app).
8. **Notifications:** FCM push for new offers, because a snapshot only fires while the app is open.

## 9. Rules

Firestore and Storage rules for glowvai-38bde are deployed from the shared rules file (`GLOW VAI CNN MODEL/firebase/firestore.rules`), not from this repo. The vendor blocks for the paths above are not there yet; add them before the catch-all deny. Key points: vendors touch only their own documents; `approvedVendor()` costs document reads, so switch it to the custom claim once approval sets it; enforce App Check on Firestore and Storage.
