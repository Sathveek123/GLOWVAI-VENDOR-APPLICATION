# 📱 Screen Documentation: Onboarding Status Screens (Pending & Approved)

## 📍 File & Component Location
- **Pending Screen**: `mobile/app/(onboarding)/pending.tsx` (`/(onboarding)/pending`)
- **Approved Screen**: `mobile/app/(onboarding)/approved.tsx` (`/(onboarding)/approved`)

---

## 🎯 Purpose & Behavior

### Pending Screen (`pending.tsx`)
- Displays a yellow amber status badge: *"🕒 Application Under Audit"*.
- Informs the vendor that platform managers are reviewing their GSTIN, store address, and bank details.
- Auto-polls backend `/api/vendor/:vendorId` every 10 seconds. Once `kycStatus === 'APPROVED'`, automatically redirects to `approved.tsx`.

### Approved Screen (`approved.tsx`)
- Displays a green emerald success banner: *"🎉 Application Approved! Store Live"*.
- Features a *"🚀 Launch Dark Store Dashboard"* button which redirects to `/(vendor)/home`.
