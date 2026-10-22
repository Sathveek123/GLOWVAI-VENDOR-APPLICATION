# 📱 Mobile Screen 04: Step 1 - Store Basic Info & GPS Location

## 📍 File & Route Specification
- **File Path**: `mobile/app/(onboarding)/step-a.tsx`
- **Route URL**: `/(onboarding)/step-a`
- **Access Level**: Authenticated Onboarding Merchant (Step 1 of 4)

---

## 🎯 Purpose & Business Logic
Captures basic store identity and geographical store coordinates. Merchant provides Store Name (`Sri Lakshmi Beauty Store`), Owner Name, Primary Phone, Locality (`Benz Circle`), City (`Vijayawada`), and GPS Map Pin position for geospatial order dispatch radius calculation.

---

## 🎨 Visual Design & UI System
- **Stepper Progress Bar**: 4-step progress header showing `Step 1 of 4 (25%)` in Royal Blue (`#1D4ED8`).
- **Form Card**: Elevated white card (`#FFFFFF`) with 16px radii, structured text inputs.
- **GPS Map Pin Widget**: Interactive map preview card showing latitude/longitude, pin marker, and `"Detect Current GPS Location"` button.

---

## ⚡ Key Features & Data Flow
- **Geolocation Hook**: Invokes browser/device GPS navigator to autofill coordinates.
- **Input Validation**: Ensures Store Name, Locality, and Pincode are non-empty.
- **Draft Autosave**: Preserves step data in `AsyncStorage` if vendor exits flow.

---

## ♿ Edge & Lifecycle States
- **GPS Permission Denied**: Displays manual address fallback fields and warning banner.
- **Incomplete Fields**: Highlights missing inputs with red border `#DC2626`.
