# 🔥 Firebase Realtime Sync & Database Schemas

## ☁️ Overview
The GlowVAI platform utilizes a hybrid Firebase infrastructure:
1. **Firebase Admin SDK (Firestore & Realtime DB)**: Used by Node.js backend for authenticated server operations.
2. **Firebase Realtime Database (RTDB REST Sync)**: Enables instant zero-latency client sync across vendor mobile apps and the standalone web admin console without requiring complex database listeners.

- **Active Firebase Project**: `glowvai-v2`
- **RTDB Endpoint**: `https://glowvai-v2-default-rtdb.firebaseio.com`

---

## ⚡ 1. The Firebase Bootstrap & Live Sync Engine

On backend startup, `server.js` initializes Firebase Admin SDK. If credentials or local fallbacks are present, it runs `bootstrapFirebaseSync()` to seed initial vendor dossiers, product catalogs, and order history into RTDB.

```js
async function syncToFirebaseRTDB(dbPath, payload, method = 'PUT') {
  const url = `${FIREBASE_RTDB_URL}/${dbPath}.json`;
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

Whenever any mutation occurs (e.g. stock adjustment, order status progression, vendor duty toggle), `syncToFirebaseRTDB` broadcasts the exact state patch directly to RTDB paths:
- `/vendors/{vendorId}`
- `/inventory/{productId}`
- `/orders/{orderId}`

---

## 📐 2. Complete Database Schemas

### A. Vendor Document Schema (`/vendors/{vendorId}`)
```json
{
  "vendorId": "VND-001",
  "storeId": "DS-VIJ-01",
  "name": "Mukesh Kumar",
  "shopName": "Sri Lakshmi Beauty & Dark Store",
  "phone": "8977855998",
  "email": "mukesh.vendor@glowvai.com",
  "shopType": "Retailer & Dark Store Hub",
  "city": "Vijayawada",
  "pinCode": "520010",
  "locality": "Benz Circle / MG Road",
  "address": "D.No 40-1-52, Near Sub-Collector Office, MG Road, Vijayawada 520010",
  "latitude": 16.5062,
  "longitude": 80.6480,
  "openTime": "06:00 AM",
  "closeTime": "11:30 PM",
  "isOnline": true,
  "rating": 4.96,
  "totalOrders": 428,
  "kycStatus": "APPROVED",
  "categories": ["Serums", "Sunscreen", "Cleanser", "Groceries"],
  "bankDetails": {
    "bankName": "HDFC Bank",
    "holderName": "Mukesh Kumar",
    "accNumber": "50100482914589",
    "ifsc": "HDFC0001824",
    "upiId": "mukesh.kumar@okhdfcbank"
  },
  "gst": "37AAACG1234F1Z8",
  "pan": "AAACG1234F",
  "joinedAt": 1724000000000
}
```

---

### B. Product Inventory Schema (`/inventory/{productId}`)
```json
{
  "productId": "SKU-NIAC-001",
  "name": "Minimalist 10% Niacinamide Face Serum",
  "category": "Serums",
  "categoryId": "serums",
  "sku": "NIAC-30ML",
  "brand": "Minimalist",
  "unitType": "bottle",
  "packSize": "30 ml",
  "mrp": 649,
  "price": 599,
  "sellingPrice": 599,
  "compareAtPrice": 649,
  "stockOnHand": 24,
  "reservedStock": 0,
  "availableStock": 24,
  "lowStockThreshold": 5,
  "isAvailable": true,
  "bin": "BIN-A-01-02-01",
  "gstPercent": 18,
  "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80"],
  "status": "active",
  "description": "Nourishing 10% Niacinamide serum with Zinc for sebum regulation.",
  "updatedAt": 1728290000000
}
```

---

### C. Order Document Schema (`/orders/{orderId}`)
```json
{
  "orderId": "ORD-9912",
  "displayId": "#GV-9912",
  "storeId": "DS-VIJ-01",
  "vendorId": "VND-001",
  "customer": {
    "name": "Priya Sharma",
    "phone": "+91 98765 43210",
    "address": "Flat 402, Royal Palms, Benz Circle, Vijayawada",
    "locality": "Benz Circle",
    "lat": 16.5080,
    "lng": 80.6490
  },
  "items": [
    {
      "productId": "SKU-NIAC-001",
      "name": "Minimalist 10% Niacinamide Face Serum",
      "qty": 2,
      "price": 599,
      "bin": "BIN-A-01-02-01"
    }
  ],
  "status": "ACCEPTED",
  "paymentMethod": "UPI / ONLINE",
  "pricing": {
    "subtotal": 1198,
    "deliveryFee": 29,
    "tax": 215,
    "discount": 100,
    "grandTotal": 1342,
    "vendorPayout": 1180.96,
    "platformCommission": 161.04
  },
  "createdAt": 1728290500000,
  "acceptedAt": 1728290515000
}
```
