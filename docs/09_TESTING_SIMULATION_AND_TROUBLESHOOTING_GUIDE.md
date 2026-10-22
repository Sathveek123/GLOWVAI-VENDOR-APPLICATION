# 🧪 Testing, Simulation & Troubleshooting Guide

## 🚀 1. Local Setup & Quick Execution

### Step 1: Start Backend Server
```bash
cd "d:\Client Projects\GlowVai\GLOW VAI VENDOR\glowvai-vendor-app\backend"
npm start
```
- Backend starts on `http://localhost:4000`.
- Verify with health check: `curl http://localhost:4000/health`.

---

### Step 2: Launch Mobile Vendor App
```bash
cd "d:\Client Projects\GlowVai\GLOW VAI VENDOR\glowvai-vendor-app\mobile"
npx expo start --web
```
- Opens Metro bundler at `http://localhost:8081`.
- Accessible via web browser or Expo Go mobile app.

---

### Step 3: Open Enterprise Admin Console
- Open `glowvai-vendor-app/docs/index.html` directly in any web browser or via GitHub Pages.

---

## ⚡ 2. Order Simulation & Sound Alert Testing

To test how incoming order offers appear on the vendor app:

### Option A: Using curl / REST Client
```bash
curl -X POST http://localhost:4000/api/test/simulate-order \
  -H "Content-Type: application/json" \
  -d '{"storeId": "DS-VIJ-01", "vendorId": "VND-001"}'
```

### Option B: Using Enterprise Admin Console
1. Open `docs/index.html`.
2. Click **"⚡ Simulate Quick-Commerce Order"**.
3. Watch the modal pop up on the mobile app (`http://localhost:8081`) with audio alert and 45s timer.

---

## ⚔️ 3. High-Concurrency Race Condition Testing

To verify that distributed locking prevents duplicate order claims when 5 vendors accept an order simultaneously:

```bash
curl -X POST http://localhost:4000/api/test/race-condition
```

### Expected Execution Log:
```
[INFO] Worker 1 attempting lock for ORD-RACE-001...
[INFO] 🏆 Order ORD-RACE-001 WON and LOCKED by Vendor VND-001
[WARN] ❌ Worker 2 lock claim FAILED. Winner: VND-001
[WARN] ❌ Worker 3 lock claim FAILED. Winner: VND-001
[WARN] ❌ Worker 4 lock claim FAILED. Winner: VND-001
[WARN] ❌ Worker 5 lock claim FAILED. Winner: VND-001
```

---

## ❓ 4. Troubleshooting FAQ

| Issue / Error | Cause | Resolution |
| :--- | :--- | :--- |
| `Firebase service account not found — running in MOCK mode` | Missing `service-account.json` | Normal in dev mode. Backend automatically uses active in-memory store + Firebase RTDB REST sync. |
| `connectex: No connection could be made because the target machine actively refused it` | Backend server not running | Ensure `npm start` is executed in `glowvai-vendor-app/backend`. |
| `CORS Error in browser console` | Origin mismatch | Update `ALLOWED_ORIGINS` in `backend/.env` or leave as `*`. |
| `Socket disconnected / Reconnecting` | Network switch or port conflict | Verify WebSocket port `4000` is open and not blocked by firewall. |
