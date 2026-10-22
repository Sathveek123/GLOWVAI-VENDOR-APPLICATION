# 📱 Screen Documentation: Onboarding Step A — Store Basic Info & GPS Location

## 📍 File & Component Location
- **File Path**: `mobile/app/(onboarding)/step-a.tsx`
- **Route URL**: `/(onboarding)/step-a`
- **Access Level**: Onboarding Partner Flow

---

## 🎯 Screen Purpose & Behavior
Collects dark store business name, owner details, shop type (Retailer / Dark Store Hub / Express Center), operating hours, and captures exact GPS latitude and longitude coordinates for geospatial dispatch targeting.

---

## 🎨 Form Fields & Controls
1. **Store Name**: e.g., *"Sri Lakshmi Beauty & Dark Store"*.
2. **Owner Full Name**: e.g., *"Mukesh Kumar"*.
3. **Contact Phone & Email**.
4. **Shop Type Selector**: Radio cards (Dark Store Hub vs Retail Store vs Beauty Salon).
5. **Operating Hours**: Opening Time (`06:00 AM`) and Closing Time (`11:30 PM`).
6. **GPS Location Picker**:
   - Button: *"📍 Detect My Store GPS Location"*.
   - Displays captured Lat/Lng (e.g., `16.5062 N, 80.6480 E`) for Redis GEOSEARCH indexing.
7. **Address Inputs**: Street Address, Locality (e.g. *Benz Circle*), City (*Vijayawada*), Pincode (*520010*).

---

## ⚡ Next Action Trigger
Clicking *"Next: KYC & GST Registration (Step B)"* validates required fields and navigates to `/(onboarding)/step-b`.
