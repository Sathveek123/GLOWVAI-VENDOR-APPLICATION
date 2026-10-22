# 📱 Mobile Screen 05: Step 2 - Business KYC & GSTIN Upload

## 📍 File & Route Specification
- **File Path**: `mobile/app/(onboarding)/step-b.tsx`
- **Route URL**: `/(onboarding)/step-b`
- **Access Level**: Authenticated Onboarding Merchant (Step 2 of 4)

---

## 🎯 Purpose & Business Logic
Collects statutory business identification and tax document proofs required under Indian trade laws: 15-character GSTIN (`37AAAAA00001Z5`), 10-character PAN (`ABCDE1234F`), and FSSAI Cosmetic/Trade License upload.

---

## 🎨 Visual Design & UI System
- **Stepper Progress Bar**: `Step 2 of 4 (50%)`.
- **Form Card**: Clean white input cards with uppercase auto-formatting for GSTIN and PAN.
- **Document Drop Zones**: File upload zones for PDF/PNG/JPG documents with drag-and-drop / file picker simulation and file-size guidance (`Max 5MB`).

---

## ⚡ Key Features & Data Flow
- **Regex Validation**:
  - GSTIN: `/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/`
  - PAN: `/^[A-Z]{5}\d{4}[A-Z]{1}$/`
- **Verification Badges**: Green `✓ Format Verified` pills when valid tax IDs are typed.

---

## ♿ Edge & Lifecycle States
- **Invalid GSTIN Syntax**: Renders red helper text `"Invalid GSTIN format. Example: 37AAAAA00001Z5"`.
- **File Upload Exceeds 5MB**: Triggers warning modal and rejects file.
