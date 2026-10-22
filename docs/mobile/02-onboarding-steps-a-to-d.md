# Mobile screens 02: onboarding steps A to D

**Covers:** `mobile/app/(onboarding)/step-a.tsx`, `step-b.tsx`, `step-c.tsx`, `step-d.tsx`, and `_layout.tsx`
**Feature docs:** [Feature 02: store onboarding](../features/02-store-onboarding.md)

All four steps are live in production. Each has a progress header ("Step N of 4"), a draft-saved indicator that shows only after a save, and a continue button that stays disabled until its required fields are complete.

## Step A: store details (`step-a.tsx`)

**Title:** "Tell us about your store". **Progress:** "Step 1 of 4".

- **Store identity:** store name, owner or manager name, city, locality, pincode.
- **Business hours:** opening time and closing time. Placeholders show formats such as `08:00 AM`.
- **Store GPS pin:** search box (placeholder "Search street, landmark or building…") and a map. Riders navigate to this pin. A "GPS denied" state appears when location permission is refused.
- **Quick presets** for common hours.
- **States:** "Hours conflict", "GPS denied", "Save error", and "Unsaved" for changes not yet saved.
- Continue: *Continue to documents →*.

## Step B: tax and documents (`step-b.tsx`)

**Title:** "Tax and documents". **Progress:** "Step 2 of 4 • Merchant compliance".

- **Tax identity:** GSTIN (15 characters), business or owner PAN (10 characters), with format hints.
- **Retail licences:** cosmetics retail licence number and expiry date (DD/MM/YYYY), issued by the state drugs control authority. Trade licence is optional.
- **Required documents:** GST certificate, store-front photo with signboard, owner government ID (Aadhaar or PAN).
- **Upload:** tap to browse or drag and drop. Accepts PDF, JPG, PNG up to 5 MB per document. Each card has *Replace*.
- **States:** invalid PAN, duplicate GSTIN, expired licence, malware scan failed (shown as copy; there is no scanner), "Try uploading again".
- Continue: *Continue to bank setup →*.

## Step C: bank account (`step-c.tsx`)

**Title:** "Bank account". **Progress:** "Step 3 of 4 • Payout verification".

- **Account:** beneficiary name (must match the business or owner name on tax records), account number, confirm account number. Numbers are masked by default.
- **IFSC:** 11 characters. The branch appears once it resolves ("IFSC branch resolved").
- **UPI handle (optional):** VPA with *Verify handle*. Popular banks are listed as quick picks.
- **Review before submitting** summarises the details.
- **States:** account numbers typed and matched, duplicate bank account, UPI verification failed, API timeout, offline mode.
- Continue: *Continue to catalog setup →*.

## Step D: categories and starter SKUs (`step-d.tsx`)

**Title:** "Products". **Progress:** "Step 4 of 4 • Catalog seed".

- **Store specialties:** choose the beauty categories. At least one is required.
- **Quick-start products:** choose starter SKUs, with a search box and a "select all visible" action. Shows stock and total initial units.
- **Terms:** a checkbox to accept terms. Submit stays disabled until terms are accepted.
- **Submit:** *Confirm & Submit →*, which opens a confirmation ("Submit store for compliance audit?"). The request calls `onboardingApi.submit` with the data from steps A–C.
- **States:** submitting, duplicate SKU alert, API failure, "Within 24 hours" audit SLA note.

## Known gaps

- Document upload sends nothing to a server yet.
- The malware scan and duplicate GSTIN checks are display states only.
- Starter SKUs come from the sample catalogue in the app.
