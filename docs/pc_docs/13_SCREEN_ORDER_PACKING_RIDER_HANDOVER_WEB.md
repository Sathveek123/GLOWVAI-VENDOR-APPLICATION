# 💻 PC / Web Screen 13: Order Packing & Rider Handover (Web & React Native)

## 📍 File & Web Route Specification
- **Mobile / Desktop Component**: `mobile/app/(vendor)/pack-order.tsx` & `ready-pickup.tsx` (1440×1024 Desktop Guided Workstation with Navigation Rail & 2-Column Container)
- **Standalone Web Component**: `web/index.html` (`#page-pack-order`)
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Guided Workflow Design
Audit-ready, guided packing and rider handover workstation for Order `#GV-9912` designed for dark store operators verifying SKUs, confirming tamper-evident seals, and executing secure OTP/QR pickup handover with assigned delivery riders.

- **Horizontal 5-Stage Guided Tracker**:
  1. `Order accepted` (Completed ✓)
  2. `Items verified` (In progress / Active)
  3. `Packed & sealed` (Pending seal confirmation)
  4. `Rider arrived` (Arrived at Bay-01)
  5. `Handover complete` (Final dispatch)
- **1200px 2-Column Composition**:
  - **Left Column (7/12)**: Barcode scanner camera/hardware trigger, picking verification table with shelf coordinates, and mandatory seal confirmation.
  - **Right Column (5/12)**: Audit verification checklist and Rider Handover card (Rider details, large 4-digit PIN `4 8 9 2`, high-contrast QR code, and handover confirmation).

---

## 🎨 Layout & Key Component Sections

### 1. Guided Stage Tracker Card
- **5 Sequential Stage Pills**: Clearly highlights active stage (`2. Items verified (3/5)`) in Royal Blue (`#EFF6FF` / `#1D4ED8`) and completed stages with green checkmarks (`✓`).
- **Progress Meta Bar**: Displays verified item count (*"3 of 5 items verified (60%)"*), customer name (`Priya S. • Benz Circle`), and SLA countdown badge (`⏱️ Target SLA: 03:45 remaining`).

### 2. Barcode Scanner & Packing Verification Table
- **Hands-Free Barcode Scanner**: Camera barcode trigger button (`📷 Scan Item`) with fallback manual check controls.
- **Inline Error Feedback**:
  - `Variant Mismatch`: *"⚠️ Barcode Mismatch: Scanned barcode (Shade 115) does not match customer request (Shade 120)."*
  - `Quantity Mismatch`: *"⚠️ Quantity Warning: Verified 1 unit, but customer order requires 2 units."*
  - `Duplicate Scan`: *"⚠️ Duplicate Scan: Item was already verified."*
- **Checklist Rows**: SKU barcode, brand name, item title, variant, shelf location (e.g. `📍 Shelf A-01-05`), and large 28px accessible checkbox for store staff.

### 3. Tamper-Evident Seal Confirmation Card
- **Mandatory Checkbox**: *"I confirm this order is packed in tamper-evident sealed packaging."*
- **Seal Serial Input**: Serial number entry field (e.g., `GVA-9912`).
- **Safety Lock Rule**: The `"Mark Ready for Rider →"` button **must remain strictly disabled** until all items are verified AND sealing is confirmed. Displays inline explanation: *"⚠️ Verify remaining 2 items and check seal box to proceed."*

### 4. Rider Handover Card & Dispatch Security
- **Rider Identity**: Rider name (`Ravi Kumar`), vehicle (`TVS iQube • AP 39 BK 8821`), and arrival status (`🟢 Rider Arrived at Store Bay-01`).
- **Security Codes**:
  - High-contrast dark QR code box (`#0F172A`).
  - Large 4-digit pickup OTP boxes (`4 8 9 2`).
  - Readable fallback PIN (*"Readable manual verification PIN: 4892"*).
  - Explicit warning: *"SHOW THIS CODE ONLY TO ASSIGNED RIDER"*.
- **Final Action**: `"Confirm Handover →"` primary button executing dispatch server lock and transitioning to completed dispatch state.

---

## ⚡ Complete Edge States & Handling Matrix

| Edge State Scenario | Detection / Signal | UI Reaction & Operational Behavior |
| :--- | :--- | :--- |
| **Rider Delayed** | Socket event `RIDER_DELAYED` | Amber warning banner: *"⏱️ Rider Attention: Ravi Kumar is delayed by heavy rain. Updated ETA: 6 mins."* |
| **Rider Reassigned** | Socket event `RIDER_REASSIGNED` | Blue notice banner: *"🔄 Rider Reassigned: S. Vikram has taken over delivery."* |
| **QR Scan Failure** | Hardware camera glare | Merchant displays fallback 4-digit PIN `4892` to rider. |
| **Invalid Pickup Code** | OTP mismatch | Rejection alert: *"❌ Invalid Code: Verification code 4892 does not match rider input."* |
| **Network Loss** | Disconnected socket | Amber warning: *"📶 Network Loss: Verification queued offline. Will sync once reconnected."* |
| **Already Dispatched** | Order status `DISPATCHED` | Instant transition to Handover Confirmed summary screen. |

---

## 🔒 Shared Desktop UX Rules Compliance
- **Audit-Ready Security**: Enforces tamper-evident seal verification and OTP validation.
- **Privacy Shield**: Customer phone numbers and full addresses remain strictly hidden.
- **Accessible Touch Targets**: Minimum 28-36px touch controls tailored for store operators working with wet or gloved hands.
