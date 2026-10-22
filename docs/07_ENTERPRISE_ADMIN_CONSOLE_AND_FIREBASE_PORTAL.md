# 👑 Enterprise Admin Console & Firebase Portal

## 🖥️ Overview
The **GlowVAI Enterprise Admin Console** (`glowvai-vendor-app/docs/index.html`) is a zero-dependency, standalone single-page web dashboard.

It allows platform managers to supervise all onboarded dark stores, inspect catalog stock levels, trigger instant mock order simulations, and view real-time revenue split ledgers.

---

## 🚀 Instant GitHub Pages Deployment

Because the console is self-contained within `/docs`, it deploys natively to GitHub Pages in 1-click:

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "feat: glowvai enterprise admin portal"
   git push origin main
   ```
2. On GitHub Repository **Settings**:
   - Navigate to **Pages**.
   - Under **Source**, select **Deploy from a branch**.
   - Select Branch: **`main`** and Folder: **`/docs`**.
   - Click **Save**.
3. Live URL: `https://<your-username>.github.io/<your-repo-name>/`

---

## ⚡ Key Dashboard Capabilities

### 1. Multi-Vendor Store Dossiers
- Displays real-time list of dark stores (`VND-001`, `VND-002`, `VND-003`, `VND-004`).
- Shows duty status (`🟢 ON DUTY` / `🔴 PAUSED`), KYC verification state, rating, phone, and total orders completed.

### 2. Multi-Vendor Stock Matrix & Live Steppers
- Filters product catalog by vendor ID or category.
- Displays SKU codes, packaging sizes, MRP, selling price, and stock levels.
- **Live Stock Steppers**: Clicking `[−]` or `[+]` sends a REST/RTDB patch directly to Firebase (`https://glowvai-v2-default-rtdb.firebaseio.com/inventory/{productId}.json`), instantaneously updating vendor mobile screens.

### 3. Quick-Commerce Order Simulation Engine
- Includes a 1-tap **"⚡ Simulate Quick-Commerce Order"** button.
- Generates a random beauty/skincare order (e.g. Niacinamide Serum + CeraVe Cleanser + Matte Sunscreen) and posts it to the backend (`POST /api/test/simulate-order` or directly to Firebase RTDB).
- Triggers incoming order popups and sound alerts on active dark store operator apps.

### 4. Financial Take-Rate Split Ledger
- Automatically computes:
  - **Gross Order Value**
  - **Vendor Net Payout (88%)**
  - **GlowVAI Platform Commission (12%)**

### 5. Database Export & Backup
- **"📥 Export Database JSON"**: Downloads a complete timestamped backup (`glowvai_database_backup.json`) of all vendor records, catalog items, and order streams.
