# Web pages 07: profile, KYC, security and notifications

**Covers:** `page-profile`, `page-profile-kyc`, `page-security`, `page-notifications`
**Feature docs:** [Feature 09](../features/09-chat-support-and-notifications.md), [Feature 11](../features/11-team-security-and-compliance.md)
**Mobile equivalents:** [mobile screens 09](../mobile/09-account-team-security.md)

## Dark store profile (`page-profile`)

**Title:** "Dark store profile and business licence". This page is a short placeholder. Its full content is in the KYC page.

## Profile and KYC (`page-profile-kyc`)

- **Tabs:** store, hours, KYC (5 of 7 complete), bank.
- **Registered merchant details:** store name, owner, primary phone (+91), official email, description, street address, city, pincode.
- **Seven-day operating hours:** day rows with opening and closing times, and *Copy Mon to all days*.
- *Save profile changes*, *Log out*.
- A store photo control.

## Security (`page-security`)

**Title:** "Security and account activity".

- Filters: all, trusted, attention, suspicious.
- **Active store sessions** (count) with a close action.
- *Review active sessions*, *Sign out other devices*, *Update mobile number*, *Payout bank settings →*.
- Confirmation dialog before signing out other devices.

## Notifications (`page-notifications`)

**Title:** "Notifications".

- **Filters:** all, orders, inventory, payouts, compliance, system.
- Notification list and detail.
- **Channels and preferences:** WhatsApp, SMS, weekly UTR updates, restock reminders, audio alerts. *Save preferences*.
- **States:** loading skeletons, no notifications, offline mode, push denied, expired deep link ("Target workspace link expired"), and a dismiss action.

## Known gaps

- Profile edits and preferences are not saved to a server.
- The security sessions list is sample data.
- The profile page (`page-profile`) is a stub; use the KYC page.
